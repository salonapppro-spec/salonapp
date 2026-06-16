/**
 * middleware.ts — Routing pipeline for SalonApp.pro
 *
 * Thin orchestration layer. All extracted logic lives in lib/routing/*.
 *
 * Execution order (each step may short-circuit and return early):
 *  1.  Classify host + derive pathname
 *  2.  Password-recovery token redirect (Supabase emails land on "/")
 *  3.  Route rate limiting          ← fail-fast before any DB / auth work
 *  4.  /temporarily-unavailable bypass
 *  5.  Admin/API redirect from tenant subdomains → salonapp.pro
 *  6.  Build requestHeaders + base response object
 *  7.  Supabase session refresh + getUser()
 *      7c. Set x-salon-slug from JWT; override with impersonation cookie
 *      7d. Auth guards (platform hosts only)
 *  8.  Root domain passthrough (return response with refreshed cookies)
 *  9.  Dev / Vercel preview → path-based tenant routing
 *  10. Subdomain / custom-domain → RPC tenant resolution + rewrite
 */

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { clientIpFromHeaders } from "@/lib/rate-limit";
import { SLUG_RE, SUPER_ADMIN_SALON_COOKIE } from "@/lib/routing/constants";
import { classifyHost, isPlatformHost } from "@/lib/routing/host";
import { resolvePreviewSlug } from "@/lib/routing/preview";
import { resolveTenantFromHost } from "@/lib/routing/tenant-resolution";
import { getImpersonatedSlug } from "@/lib/routing/impersonation";
import { applyRouteRateLimits } from "@/lib/routing/rate-limit-routes";
import {
  applyAuthGuard,
  isAdminPublicAuthPath,
  isSuperAdminRole,
} from "@/lib/routing/auth-guard";

/**
 * Infers the tenant slug for a flat /api/* request that has no slug in its
 * own path — from the `salon_slug` query param (GET) or, failing that, from
 * the Referer header's path (POST bodies can't be read in middleware).
 * Used for both dev/Vercel-preview (Step 9b) and production root domain
 * (Step 8) — in both cases the page itself is served at /{slug}/... but the
 * API route underneath it is flat (/api/bookings, not /api/{slug}/bookings).
 */
function inferApiSlugFromRequest(request: NextRequest): string | null {
  const qpSlug = request.nextUrl.searchParams.get("salon_slug")?.trim() ?? "";
  if (SLUG_RE.test(qpSlug)) return qpSlug;

  const referer = request.headers.get("referer") ?? "";
  if (referer) {
    try {
      return resolvePreviewSlug(new URL(referer).pathname);
    } catch {
      /* invalid referer — ignore */
    }
  }
  return null;
}

export async function middleware(request: NextRequest) {
  // ── Step 1 ───────────────────────────────────────────────────────────────────
  const pathname = request.nextUrl.pathname;
  const hostInfo = classifyHost(request.headers.get("host") ?? "");

  // ── Step 2: Password-recovery token redirect ─────────────────────────────────
  // Supabase sends recovery emails with Site URL = salonapp.pro ("/").
  // Forward recovery tokens to the dedicated reset-password page.
  if (pathname === "/" && isPlatformHost(hostInfo)) {
    const qp = request.nextUrl.searchParams;
    if (qp.get("type") === "recovery" && (qp.has("code") || qp.has("token_hash"))) {
      const dest = new URL("/admin/reset-password", request.url);
      qp.forEach((value, key) => dest.searchParams.set(key, value));
      return NextResponse.redirect(dest, 307);
    }
  }

  // ── Step 3: Rate limiting ─────────────────────────────────────────────────────
  const ip = clientIpFromHeaders(request.headers);
  const rateLimited = await applyRouteRateLimits(pathname, request.method, ip);
  if (rateLimited) return rateLimited;

  // ── Step 4: /temporarily-unavailable bypass ──────────────────────────────────
  if (
    pathname === "/temporarily-unavailable" ||
    pathname.startsWith("/temporarily-unavailable/")
  ) {
    return NextResponse.next();
  }

  // ── Step 5: Admin / API redirect from tenant subdomains ──────────────────────
  // Without this, the subdomain rewrite below turns /admin → /paw-empire/admin.
  if (
    (pathname.startsWith("/admin") ||
      pathname.startsWith("/super-admin") ||
      pathname.startsWith("/api/admin")) &&
    !isPlatformHost(hostInfo)
  ) {
    const dest = new URL(request.url);
    dest.protocol = "https:";
    dest.hostname = "salonapp.pro";
    dest.port = "";
    return NextResponse.redirect(dest, 307);
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // ── Step 6: Build request headers + base response ────────────────────────────
  // `response` is mutated by Supabase setAll() to carry refreshed session cookies.
  // Every auth-related early return must use `response` (not NextResponse.next())
  // to avoid losing refreshed tokens.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", pathname);

  let response = NextResponse.next({ request: { headers: requestHeaders } });

  // Prevent stale auth pages from browser / proxy cache during password recovery
  if (isAdminPublicAuthPath(pathname)) {
    response.headers.set("Cache-Control", "private, no-cache, no-store, must-revalidate");
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");
  }

  // ── Step 7: Supabase session refresh + getUser() ─────────────────────────────
  let user: {
    app_metadata?: Record<string, unknown>;
    user_metadata?: Record<string, unknown>;
  } | null = null;

  if (supabaseUrl && supabaseAnonKey) {
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Write refreshed tokens onto `response` so they reach the browser
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    });

    const { data } = await supabase.auth.getUser();
    user = data.user;

    // ── Step 7c: x-salon-slug from JWT (platform hosts only) ─────────────────
    // Set from authenticated user's JWT, then override with impersonation cookie
    // if the user is a super_admin. Only on platform hosts — subdomain hosts
    // always get x-salon-slug from the RPC result at step 10.
    if (isPlatformHost(hostInfo)) {
      const userSlug =
        typeof user?.app_metadata?.salon_slug === "string"
          ? user.app_metadata.salon_slug.trim()
          : "";
      if (userSlug && SLUG_RE.test(userSlug)) {
        requestHeaders.set("x-salon-slug", userSlug);
      }

      if (user && isSuperAdminRole(user)) {
        const impersonated = getImpersonatedSlug(
          request.cookies.get(SUPER_ADMIN_SALON_COOKIE)?.value
        );
        if (impersonated) {
          requestHeaders.set("x-salon-slug", impersonated);
        }
      }
    }

    // ── Step 7d: Auth guards ──────────────────────────────────────────────────
    if (isPlatformHost(hostInfo)) {
      const guard = applyAuthGuard({
        pathname,
        hostInfo,
        user,
        request,
        response,
      });
      if (guard) return guard;
    }
  }

  // ── Step 8: Root domain passthrough ──────────────────────────────────────────
  // Must return `response` (not NextResponse.next()) to preserve refreshed cookies.
  if (hostInfo.isRootDomain) {
    // Public pages at salonapp.pro/{slug} carry the slug in the path, so Next.js
    // routing resolves them fine without help. But /api/* routes are flat
    // (e.g. /api/bookings) — the slug isn't in that path — and
    // requireTenantFromHeaders() requires x-salon-slug to be set, or every
    // booking API call here 400s with "Missing tenant context". Infer it the
    // same way Step 9b does for dev/preview hosts: from the request's own
    // salon_slug query param, or from the Referer path (POST bodies can't be
    // read in middleware). requireTenantFromHeaders() still cross-checks this
    // against the client-claimed slug in the body/query, so this doesn't
    // weaken the anti-spoofing guarantee — it just makes the header exist.
    if (pathname.startsWith("/api/")) {
      const inferredSlug = inferApiSlugFromRequest(request);
      if (inferredSlug) {
        requestHeaders.set("x-salon-slug", inferredSlug);
        requestHeaders.set("x-pathname", pathname);
        const apiResponse = NextResponse.next({ request: { headers: requestHeaders } });
        // `response` (built in Step 6) may carry refreshed Supabase session
        // cookies from Step 7 — NextResponse.next() here creates a *new*
        // response object, so those cookies must be copied over explicitly.
        for (const cookie of response.cookies.getAll()) {
          apiResponse.cookies.set(cookie);
        }
        return apiResponse;
      }
    }
    return response;
  }

  // ── Step 9: Dev + Vercel preview — path-based tenant routing ─────────────────
  // Uses next() with NEW headers (not requestHeaders) — the slug is already in
  // the URL path; rewriting would double-prefix it to /paw-empire/paw-empire.
  if (hostInfo.isDevHost || hostInfo.isVercelPreview) {
    const previewSlug = resolvePreviewSlug(pathname);
    if (previewSlug) {
      const h = new Headers(request.headers);
      h.set("x-salon-slug", previewSlug);
      h.set("x-pathname", pathname);
      return NextResponse.next({ request: { headers: h } });
    }

    // ── Step 9b: API routes in dev/preview ──────────────────────────────────
    // /api/* paths are reserved so resolvePreviewSlug returns null above.
    // Infer tenant slug the same way Step 8 does for production root domain.
    if (pathname.startsWith("/api/")) {
      const inferredSlug = inferApiSlugFromRequest(request);

      if (inferredSlug) {
        const h = new Headers(request.headers);
        h.set("x-salon-slug", inferredSlug);
        h.set("x-pathname", pathname);
        return NextResponse.next({ request: { headers: h } });
      }
    }

    return response;
  }

  // ── Step 10: Subdomain / custom-domain — resolve tenant ──────────────────────
  if (!supabaseUrl || !supabaseAnonKey) {
    return response;
  }

  const tenant = await resolveTenantFromHost({
    supabaseUrl,
    anonKey: supabaseAnonKey,
    salonSlug: hostInfo.subdomainSlug ?? undefined,
    domain: hostInfo.isLegacyCustomHost ? hostInfo.normalized : undefined,
  });

  if (!tenant) {
    // Unknown domain → marketing page
    return NextResponse.redirect(new URL("https://salonapp.pro"));
  }

  if (tenant.status === "inactive") {
    return NextResponse.rewrite(new URL("/temporarily-unavailable", request.url));
  }

  // API routes from subdomain / custom domain:
  // Do NOT rewrite path — just set x-salon-slug so requireTenantFromHeaders() works.
  if (pathname.startsWith("/api/")) {
    const apiHeaders = new Headers(request.headers);
    apiHeaders.set("x-salon-slug", tenant.salon_slug);
    apiHeaders.set("x-pathname", pathname);
    if (hostInfo.isLegacyCustomHost) {
      apiHeaders.set("x-tenant-domain", hostInfo.normalized);
    }
    return NextResponse.next({ request: { headers: apiHeaders } });
  }

  // Rewrite: paw-empire.salonapp.pro/anything → /paw-empire/anything
  // Next.js routing only sees the path — it has no subdomain awareness —
  // so we remap to /(public)/[salon_slug].
  const rewritePath = `/${tenant.salon_slug}${pathname === "/" ? "" : pathname}`;
  const rewriteUrl = new URL(rewritePath, request.url);

  const tenantHeaders = new Headers(request.headers);
  tenantHeaders.set("x-salon-slug", tenant.salon_slug);
  tenantHeaders.set("x-pathname", pathname);
  if (hostInfo.isLegacyCustomHost) {
    tenantHeaders.set("x-tenant-domain", hostInfo.normalized);
  }

  const rewriteRes = NextResponse.rewrite(rewriteUrl, {
    request: { headers: tenantHeaders },
  });

  // No CDN caching — each subdomain is a different tenant
  rewriteRes.headers.set("Cache-Control", "private, no-cache, no-store, must-revalidate");
  // Tell CDNs / proxies to vary cache per host, not just path
  rewriteRes.headers.set("Vary", "host");
  // Allow tenant previews to be embedded in the super-admin builder iframe
  rewriteRes.headers.delete("X-Frame-Options");

  return rewriteRes;
}

export const config = {
  matcher: [
    "/((?!_next|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|css|js|map)$).*)",
  ],
};
