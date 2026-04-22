import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { logAbuseEvent } from "@/lib/abuse-log";
import { RATE } from "@/lib/rate-limit-policies";
import { applyRateLimit, clientIpFromHeaders } from "@/lib/rate-limit";

// ── Hostname helpers ──────────────────────────────────────────────────────────

function normalizeHostname(host: string): string {
  return host.split(":")[0]?.toLowerCase() ?? "";
}

/** salonapp.pro и www.salonapp.pro — маркетинг + админ панел */
function isRootDomain(hostname: string): boolean {
  return hostname === "salonapp.pro" || hostname === "www.salonapp.pro";
}

/** localhost / 127.0.0.1 — dev среда */
function isDevHost(hostname: string): boolean {
  return hostname === "localhost" || hostname === "127.0.0.1";
}

/** *.vercel.app — Vercel preview URL */
function isVercelDeploymentHost(hostname: string): boolean {
  return hostname.endsWith(".vercel.app");
}

/** *.salonapp.pro субдомейн (не root) */
function isSalonSubdomain(hostname: string): boolean {
  return hostname.endsWith(".salonapp.pro") && !isRootDomain(hostname);
}

function isSuperAdminRole(user: {
  app_metadata?: Record<string, unknown>;
  user_metadata?: Record<string, unknown>;
}): boolean {
  return user.app_metadata?.role === "super_admin";
}

// Пътища, запазени за платформата — не са salon slugs
const RESERVED_PATHS = new Set([
  "admin",
  "api",
  "super-admin",
  "get-started",
  "demo",
  "_next",
  "favicon.ico",
  "robots.txt",
  "sitemap.xml",
  "temporarily-unavailable",
  "icon.png",
  "apple-icon.png",
]);

// ── Tenant resolution (edge-safe fetch) ──────────────────────────────────────

type ResolvedTenant = { salon_slug: string; status: string } | null;

async function resolveTenant(params: {
  supabaseUrl: string;
  anonKey: string;
  salonSlug?: string;
  domain?: string;
}): Promise<ResolvedTenant> {
  const { supabaseUrl, anonKey, salonSlug, domain } = params;
  if ((!salonSlug && !domain) || (salonSlug && domain)) return null;

  const url = `${supabaseUrl.replace(/\/$/, "")}/rest/v1/rpc/resolve_tenant_public`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        p_salon_slug: salonSlug ?? null,
        p_domain: domain ?? null,
      }),
      cache: "no-store",
    });

    if (!res.ok) return null;
    const json = (await res.json()) as unknown;
    if (!Array.isArray(json) || json.length === 0) return null;
    const first = json[0] as { salon_slug?: unknown; status?: unknown };
    if (typeof first.salon_slug !== "string" || !first.salon_slug) return null;
    const status = typeof first.status === "string" ? first.status : "active";
    return { salon_slug: first.salon_slug, status };
  } catch {
    return null;
  }
}

// ── Middleware ────────────────────────────────────────────────────────────────

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const hostHeader = request.headers.get("host") ?? "";
  const hostname = normalizeHostname(hostHeader);

  // ── Rate limiting (Upstash when UPSTASH_* env is set, else in-memory) ────
  const ip = clientIpFromHeaders(request.headers);
  const m = request.method;

  const rl = async (key: string, policy: (typeof RATE)[keyof typeof RATE], label: string) => {
    if (!(await applyRateLimit(key, policy.limit, policy.windowMs)).ok) {
      logAbuseEvent({
        kind: "rate_limited",
        path: pathname,
        method: m,
        status: 429,
        ip,
        key: label,
      });
      if (pathname.startsWith("/api/confirm/") || pathname.startsWith("/api/cancel/")) {
        return new NextResponse(
          "<!DOCTYPE html><html><head><meta charset='utf-8'/><title>Твърде много заявки</title></head><body style='font-family:system-ui;padding:2rem;max-width:24rem'>Моля, опитайте отново след минута.</body></html>",
          { status: 429, headers: { "Content-Type": "text/html; charset=utf-8", "Retry-After": "60" } }
        );
      }
      return NextResponse.json(
        { error: "Too many requests" },
        { status: 429, headers: { "Retry-After": "60" } }
      );
    }
    return null;
  };

  if (pathname === "/api/bookings" && m === "GET") {
    const r = await rl(`bookings-get:${ip}`, RATE.bookingGet, "bookings_get");
    if (r) return r;
  }
  if (pathname === "/api/bookings" && m === "POST") {
    const r = await rl(`booking-post:${ip}`, RATE.bookingPost, "booking_post");
    if (r) return r;
  }
  if (pathname === "/api/leads" && m === "POST") {
    const r = await rl(`leads-post:${ip}`, RATE.leadsPost, "leads_post");
    if (r) return r;
  }
  if (pathname === "/api/consultation" && m === "POST") {
    const r = await rl(`consultation-post:${ip}`, RATE.consultationPost, "consultation_post");
    if (r) return r;
  }
  if (pathname === "/api/availability" && m === "GET") {
    const r = await rl(`availability-get:${ip}`, RATE.availabilityGet, "availability_get");
    if (r) return r;
  }
  if (pathname === "/api/services" && m === "GET") {
    const r = await rl(`services-get:${ip}`, RATE.servicesGet, "services_get");
    if (r) return r;
  }
  if (pathname === "/api/clients/lookup" && m === "GET") {
    const r = await rl(`clients-lookup:${ip}`, RATE.clientsLookupGet, "clients_lookup");
    if (r) return r;
  }
  if (pathname === "/api/gdpr/delete-request" && m === "POST") {
    const r = await rl(`gdpr-delete:${ip}`, RATE.gdprDeletePost, "gdpr_delete");
    if (r) return r;
  }
  if (pathname === "/api/track" && m === "POST") {
    const r = await rl(`track-post:${ip}`, RATE.trackPost, "track_post");
    if (r) return r;
  }
  if (pathname.startsWith("/api/confirm/") && (m === "GET" || m === "POST")) {
    const r = await rl(`token-confirm:${ip}`, RATE.tokenAction, "token_confirm");
    if (r) return r;
  }
  if (pathname.startsWith("/api/cancel/") && (m === "GET" || m === "POST")) {
    const r = await rl(`token-cancel:${ip}`, RATE.tokenAction, "token_cancel");
    if (r) return r;
  }
  if (pathname.startsWith("/api/cron/")) {
    const r = await rl(`cron-route:${ip}`, RATE.cronRoute, "cron_route");
    if (r) return r;
  }
  if (pathname === "/api/webhooks/stripe" && m === "POST") {
    const r = await rl(`stripe-webhook:${ip}`, RATE.stripeWebhookPost, "stripe_webhook");
    if (r) return r;
  }

  // ── Temporarily unavailable bypass ──────────────────────────────────────
  if (
    pathname === "/temporarily-unavailable" ||
    pathname.startsWith("/temporarily-unavailable/")
  ) {
    return NextResponse.next();
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Base request headers forwarded to every page
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", pathname);

  // Base response — may have Supabase cookies refreshed below
  let response = NextResponse.next({ request: { headers: requestHeaders } });

  // ── Supabase auth + session refresh ─────────────────────────────────────
  // Runs for ALL domains — keeps cookies fresh on salonapp.pro too
  let user: { app_metadata?: Record<string, unknown>; user_metadata?: Record<string, unknown> } | null = null;

  if (supabaseUrl && supabaseAnonKey) {
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Write refreshed cookies onto the current response
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    });

    const { data } = await supabase.auth.getUser();
    user = data.user;

    // ── Auth guards ────────────────────────────────────────────────────
    // Only apply on root domain and Vercel URL; subdomains are public sites
    if (isRootDomain(hostname) || isVercelDeploymentHost(hostname) || isDevHost(hostname)) {
      const isLoginPath =
        pathname === "/admin/login" || pathname.startsWith("/admin/login/");

      // Redirect already-logged-in users away from login
      if (isLoginPath && user) {
        const superOnly = request.nextUrl.searchParams.get("super_admin_only") === "1";
        const nextParam = request.nextUrl.searchParams.get("next");
        const safeNext =
          nextParam &&
          nextParam.startsWith("/") &&
          !nextParam.startsWith("//") &&
          !nextParam.startsWith("/admin/login") &&
          (nextParam.startsWith("/admin") || nextParam.startsWith("/super-admin"))
            ? nextParam
            : null;

        if (isSuperAdminRole(user)) {
          const dest = safeNext ?? "/super-admin";
          const r = NextResponse.redirect(new URL(dest, request.url));
          response.cookies.getAll().forEach((c) => r.cookies.set(c.name, c.value));
          return r;
        }
        if (!superOnly) {
          const dest = safeNext ?? "/admin/dashboard";
          const r = NextResponse.redirect(new URL(dest, request.url));
          response.cookies.getAll().forEach((c) => r.cookies.set(c.name, c.value));
          return r;
        }
      }

      // Protect /admin/* (not login)
      if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login")) {
        if (!user) {
          const login = new URL("/admin/login", request.url);
          login.searchParams.set("next", pathname + request.nextUrl.search);
          return NextResponse.redirect(login);
        }
      }

      // Protect /super-admin
      if (pathname.startsWith("/super-admin")) {
        if (!user) {
          const login = new URL("/admin/login", request.url);
          login.searchParams.set("next", pathname + request.nextUrl.search);
          return NextResponse.redirect(login);
        }
        if (!isSuperAdminRole(user)) {
          const login = new URL("/admin/login", request.url);
          login.searchParams.set("super_admin_only", "1");
          return NextResponse.redirect(login);
        }
      }
    }
  }

  // ── Root domain: salonapp.pro / www.salonapp.pro ─────────────────────────
  // Marketing page, admin panel, super admin — serve as-is
  if (isRootDomain(hostname)) {
    return response; // НЕ NextResponse.next() — запазва обновените cookies
  }

  // ── Dev + Vercel preview: path-based tenant routing ──────────────────────
  // localhost/salon-bizhu или salonapp-ten.vercel.app/salon-bizhu
  if (isDevHost(hostname) || isVercelDeploymentHost(hostname)) {
    const first = pathname.split("/").filter(Boolean)[0] ?? "";
    if (first && !RESERVED_PATHS.has(first) && !first.includes(".")) {
      const h = new Headers(request.headers);
      h.set("x-salon-slug", first);
      h.set("x-pathname", pathname);
      return NextResponse.next({ request: { headers: h } });
    }
    return response;
  }

  // ── Subdomain / custom domain: resolve tenant ─────────────────────────────
  if (!supabaseUrl || !supabaseAnonKey) {
    return response;
  }

  let salonSlug: string | undefined;
  let byDomain: string | undefined;

  if (isSalonSubdomain(hostname)) {
    // salon-bizhu.salonapp.pro → slug = "salon-bizhu"
    salonSlug = hostname.replace(/\.salonapp\.pro$/, "");
  } else {
    // Custom domain: bizhu.bg
    byDomain = hostname;
  }

  const tenant = await resolveTenant({
    supabaseUrl,
    anonKey: supabaseAnonKey,
    salonSlug,
    domain: byDomain,
  });

  if (!tenant) {
    // Непознат домейн → marketing page
    return NextResponse.redirect(new URL("https://salonapp.pro"));
  }

  if (tenant.status === "inactive") {
    return NextResponse.rewrite(new URL("/temporarily-unavailable", request.url));
  }

  // Rewrite: salon-bizhu.salonapp.pro/ANYTHING → /salon-bizhu/ANYTHING
  // Необходимо защото Next.js routing не знае за поддомейни —
  // вижда само пътя, затова го remapваме към /(public)/[salon_slug]
  const rewritePath = `/${tenant.salon_slug}${pathname === "/" ? "" : pathname}`;
  const rewriteUrl = new URL(rewritePath, request.url);

  const tenantHeaders = new Headers(request.headers);
  tenantHeaders.set("x-salon-slug", tenant.salon_slug);
  tenantHeaders.set("x-pathname", pathname);
  if (byDomain) tenantHeaders.set("x-tenant-domain", byDomain);

  const rewriteRes = NextResponse.rewrite(rewriteUrl, {
    request: { headers: tenantHeaders },
  });

  // Без CDN кеш — всеки субдомейн = различен тенант
  rewriteRes.headers.set("Cache-Control", "private, no-cache, no-store, must-revalidate");
  rewriteRes.headers.set("Vary", "host");
  return rewriteRes;
}

export const config = {
  matcher: [
    "/((?!_next|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|css|js|map)$).*)",
  ],
};
