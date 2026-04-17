import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { clientIpFromHeaders, rateLimitOrThrow } from "@/lib/rate-limit-ip";

function normalizeHostname(host: string): string {
  return host.split(":")[0]?.toLowerCase() ?? "";
}

function isRootDomain(hostname: string): boolean {
  return hostname === "salonapp.pro" || hostname === "www.salonapp.pro";
}

function isDevHost(hostname: string): boolean {
  return hostname === "localhost" || hostname === "127.0.0.1";
}

/** Production/preview URL на Vercel (*.vercel.app) — не е салонски домейн; иначе middleware редиректва към salonapp.pro */
function isVercelDeploymentHost(hostname: string): boolean {
  return hostname.endsWith(".vercel.app");
}

function isSuperAdminRole(user: { app_metadata?: Record<string, unknown>; user_metadata?: Record<string, unknown> }): boolean {
  return user.app_metadata?.role === "super_admin";
}

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
}

export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname === "/api/bookings" && request.method === "POST") {
    const ip = clientIpFromHeaders(request.headers);
    const rl = rateLimitOrThrow(`booking-post:${ip}`, 40, 60_000);
    if (!rl.ok) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }
  }

  if (request.nextUrl.pathname === "/api/leads" && request.method === "POST") {
    const ip = clientIpFromHeaders(request.headers);
    const rl = rateLimitOrThrow(`leads-post:${ip}`, 15, 60_000);
    if (!rl.ok) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }
  }

  const pathname = request.nextUrl.pathname;

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", pathname);

  if (pathname === "/temporarily-unavailable" || pathname.startsWith("/temporarily-unavailable/")) {
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  const hostHeader = request.headers.get("host") ?? "";
  const hostname = normalizeHostname(hostHeader);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  let response = NextResponse.next({ request: { headers: requestHeaders } });

  if (supabaseUrl && supabaseAnonKey) {
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    });

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const isLoginPath = pathname === "/admin/login" || pathname.startsWith("/admin/login/");
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
        const redirectRes = NextResponse.redirect(new URL(dest, request.url));
        response.cookies.getAll().forEach((c) => redirectRes.cookies.set(c.name, c.value));
        return redirectRes;
      }
      if (!superOnly) {
        const dest = safeNext ?? "/admin/dashboard";
        const redirectRes = NextResponse.redirect(new URL(dest, request.url));
        response.cookies.getAll().forEach((c) => redirectRes.cookies.set(c.name, c.value));
        return redirectRes;
      }
    }

    if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login")) {
      if (!user) {
        const login = new URL("/admin/login", request.url);
        login.searchParams.set("next", pathname + request.nextUrl.search);
        return NextResponse.redirect(login);
      }
    }

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

  if (isDevHost(hostname)) {
    const first = pathname.split("/").filter(Boolean)[0] ?? "";
    const reserved = new Set([
      "admin",
      "api",
      "super-admin",
      "get-started",
      "_next",
      "favicon.ico",
      "robots.txt",
      "sitemap.xml",
      "temporarily-unavailable",
      "icon.png",
      "apple-icon.png",
    ]);
    if (first && !reserved.has(first) && !first.includes(".")) {
      const h = new Headers(request.headers);
      h.set("x-salon-slug", first);
      h.set("x-pathname", pathname);
      response = NextResponse.next({ request: { headers: h } });
    }
    return response;
  }

  if (isRootDomain(hostname) || isVercelDeploymentHost(hostname)) {
    // Don't pass modified request headers — keeps static pages as static (no lambda required)
    return NextResponse.next();
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    return response;
  }

  let salonSlug: string | undefined;
  let byDomain: string | undefined;

  if (hostname.endsWith(".salonapp.pro")) {
    salonSlug = hostname.replace(/\.salonapp\.pro$/, "");
  } else {
    byDomain = hostname;
  }

  const tenant = await resolveTenant({
    supabaseUrl,
    anonKey: supabaseAnonKey,
    salonSlug,
    domain: byDomain,
  });

  if (!tenant) {
    return NextResponse.redirect(new URL("https://salonapp.pro"));
  }

  if (tenant.status === "inactive") {
    return NextResponse.rewrite(new URL("/temporarily-unavailable", request.url));
  }

  const headers = new Headers(request.headers);
  headers.set("x-salon-slug", tenant.salon_slug);
  headers.set("x-pathname", pathname);
  if (byDomain) headers.set("x-tenant-domain", byDomain);

  return NextResponse.next({ request: { headers } });
}

export const config = {
  matcher: [
    "/((?!_next|favicon.ico|robots.txt|sitemap.xml|demo|get-started|unsubscribe|temporarily-unavailable|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|css|js|map)$).*)",
  ],
};
