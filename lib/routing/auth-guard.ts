/**
 * lib/routing/auth-guard.ts
 *
 * Auth guards for /admin and /super-admin routes.
 * Only runs on platform hosts (salonapp.pro, Vercel preview, localhost).
 * NEVER runs on tenant subdomains like thebeast.salonapp.pro.
 *
 * CRITICAL: redirectWithCookies() copies Supabase session cookies from the
 * refreshed `response` onto every redirect response. Without this, a session
 * that was refreshed during getUser() is lost and the browser loops on login.
 */

import { type NextRequest, NextResponse } from "next/server";

import { SLUG_RE } from "./constants";
import type { HostInfo } from "./host";

type AuthUser = {
  app_metadata?: Record<string, unknown>;
  user_metadata?: Record<string, unknown>;
} | null;

export function isSuperAdminRole(
  user: NonNullable<AuthUser>
): boolean {
  return user.app_metadata?.role === "super_admin";
}

function salonSlugFromAppMetadata(user: NonNullable<AuthUser>): string | null {
  const raw = user.app_metadata?.salon_slug;
  if (typeof raw !== "string") return null;
  const slug = raw.trim();
  return slug && SLUG_RE.test(slug) ? slug : null;
}

/** Salon admin panel: owner, collective specialist, or super_admin only. */
export function hasSalonAdminAccess(user: NonNullable<AuthUser>): boolean {
  if (isSuperAdminRole(user)) return true;
  if (user.app_metadata?.role === "owner" && salonSlugFromAppMetadata(user)) return true;

  const specialistId = user.app_metadata?.specialist_id;
  if (
    typeof specialistId === "string" &&
    specialistId.trim().length > 0 &&
    salonSlugFromAppMetadata(user)
  ) {
    return true;
  }

  return false;
}

/**
 * Returns true for /admin paths that are publicly accessible (password-recovery flow).
 * Defined ONCE here — removes the duplicate that existed in the original middleware.ts.
 */
export function isAdminPublicAuthPath(pathname: string): boolean {
  return (
    pathname === "/admin/login" ||
    pathname.startsWith("/admin/login/") ||
    pathname === "/admin/forgot-password" ||
    pathname.startsWith("/admin/forgot-password/") ||
    pathname === "/admin/reset-password" ||
    pathname.startsWith("/admin/reset-password/")
  );
}

/**
 * Creates a redirect response and forwards any refreshed Supabase session
 * cookies from the current response pipeline onto the redirect.
 */
function redirectWithCookies(
  destination: string | URL,
  request: NextRequest,
  refreshedResponse: NextResponse
): NextResponse {
  const dest =
    destination instanceof URL ? destination : new URL(destination, request.url);
  const redirect = NextResponse.redirect(dest);
  refreshedResponse.cookies.getAll().forEach((c) => redirect.cookies.set(c.name, c.value));
  return redirect;
}

/**
 * Runs all auth guards. Returns a redirect NextResponse if a guard fires,
 * or null if the request should proceed normally.
 *
 * Guards (in order — same as original middleware):
 *  1. Already-logged-in user visits /admin/login → redirect to dashboard
 *  2. Unauthenticated user visits /admin/* → redirect to login
 *  3. Unauthenticated or non-super_admin visits /super-admin → redirect to login
 */
export function applyAuthGuard(params: {
  pathname: string;
  hostInfo: HostInfo;
  user: AuthUser;
  request: NextRequest;
  response: NextResponse;
}): NextResponse | null {
  const { pathname, user, request, response } = params;

  // ── Guard 1: Already-logged-in user on /admin/login ──────────────────────
  if ((pathname === "/admin/login" || pathname.startsWith("/admin/login/")) && user) {
    const sp = request.nextUrl.searchParams;
    const superOnly = sp.get("super_admin_only") === "1";
    const tenantRequired = sp.get("tenant_required") === "1";

    const nextParam = sp.get("next");
    const safeNext =
      nextParam &&
      nextParam.startsWith("/") &&
      !nextParam.startsWith("//") &&
      !nextParam.startsWith("/admin/login") &&
      (nextParam.startsWith("/admin") || nextParam.startsWith("/super-admin"))
        ? nextParam
        : null;

    if (isSuperAdminRole(user)) {
      return redirectWithCookies(safeNext ?? "/super-admin", request, response);
    }
    if (!superOnly && !tenantRequired) {
      return redirectWithCookies(safeNext ?? "/admin/dashboard", request, response);
    }
  }

  // ── Guard 2: Protect /admin/* ────────────────────────────────────────────
  if (pathname.startsWith("/admin") && !isAdminPublicAuthPath(pathname)) {
    if (!user) {
      const login = new URL("/admin/login", request.url);
      login.searchParams.set("next", pathname + request.nextUrl.search);
      return redirectWithCookies(login, request, response);
    }
    if (!hasSalonAdminAccess(user)) {
      const login = new URL("/admin/login", request.url);
      login.searchParams.set("tenant_required", "1");
      return redirectWithCookies(login, request, response);
    }
  }

  // ── Guard 3: Protect /super-admin ───────────────────────────────────────
  if (pathname.startsWith("/super-admin")) {
    if (!user) {
      const login = new URL("/admin/login", request.url);
      login.searchParams.set("next", pathname + request.nextUrl.search);
      return redirectWithCookies(login, request, response);
    }
    if (!isSuperAdminRole(user)) {
      const login = new URL("/admin/login", request.url);
      login.searchParams.set("super_admin_only", "1");
      return redirectWithCookies(login, request, response);
    }
  }

  return null;
}
