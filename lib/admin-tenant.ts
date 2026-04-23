import { cookies, headers } from "next/headers";
import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase-server";

/** Slug format: lowercase latin, digits, hyphens (matches public URLs). */
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * HttpOnly контекст: супер админ без salon_slug в JWT може да „влезе“ в салонски админ
 * след server action (виж `enterSalonAdminContextAction`).
 */
export const SUPER_ADMIN_SALON_COOKIE = "salonapp_super_admin_salon";

function isProductionRuntime(): boolean {
  return process.env.NODE_ENV === "production" || process.env.VERCEL_ENV === "production";
}

function slugFromUser(user: { user_metadata?: Record<string, unknown>; app_metadata?: Record<string, unknown> }): string | null {
  const am = user.app_metadata?.salon_slug;
  const raw = typeof am === "string" ? am : null;
  if (!raw || !SLUG_RE.test(raw)) return null;
  return raw;
}

/** Публичен slug от JWT (собственик). */
export function salonSlugFromAuthUser(user: { user_metadata?: Record<string, unknown>; app_metadata?: Record<string, unknown> }): string | null {
  return slugFromUser(user);
}

/** Стойност на контекст бисквитката за супер админ (само за UI; RLS не я ползва). */
export async function readSuperAdminSalonCookieSlug(): Promise<string | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(SUPER_ADMIN_SALON_COOKIE)?.value?.trim();
  if (raw && SLUG_RE.test(raw)) return raw;
  return null;
}

/**
 * Resolves the salon tenant for admin Server Components and API routes.
 * - Production: only from Supabase JWT (`getUser()`), never from headers or NEXT_PUBLIC_*.
 * - Development: JWT first; else optional server-only `DEV_SALON_SLUG` (never exposed to the client).
 */
export async function resolveAdminTenantSlug(): Promise<string | null> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;

  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    if (isProductionRuntime()) return null;
    return devFallbackSlug();
  }

  const fromJwt = slugFromUser(data.user);
  if (fromJwt) return fromJwt;

  if (data.user.app_metadata?.role === "super_admin") {
    const cookieStore = await cookies();
    const raw = cookieStore.get(SUPER_ADMIN_SALON_COOKIE)?.value?.trim();
    if (raw && SLUG_RE.test(raw)) return raw;
  }

  // Logged in but not provisioned — never guess from env in production
  if (isProductionRuntime()) return null;
  return devFallbackSlug();
}

function devFallbackSlug(): string | null {
  if (isProductionRuntime()) return null;
  const raw = process.env.DEV_SALON_SLUG?.trim() || process.env.NEXT_PUBLIC_DEV_SALON_SLUG?.trim();
  if (!raw || !SLUG_RE.test(raw)) return null;
  return raw;
}

export type AdminTenantApiResult = { ok: true; slug: string } | { ok: false; response: NextResponse };

/** Route Handlers: 401 if session/JWT cannot resolve tenant (no trust in headers/body). */
export async function requireAdminTenantSlugForApi(): Promise<AdminTenantApiResult> {
  const slug = await resolveAdminTenantSlug();
  if (!slug) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized", code: "ADMIN_TENANT_REQUIRED" }, { status: 401 }),
    };
  }

  const h = await headers();
  const headerSlug = h.get("x-salon-slug")?.trim();
  // Compatibility guard:
  // tenant identity comes from the authenticated user/session (JWT/cookie context).
  // Enforce x-salon-slug only when it is explicitly present, so missing forwarded headers
  // do not break legitimate admin actions after middleware/auth refactors.
  if (headerSlug && !SLUG_RE.test(headerSlug)) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Invalid tenant context", code: "ADMIN_TENANT_CONTEXT_INVALID" }, { status: 400 }),
    };
  }
  if (headerSlug && headerSlug !== slug) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Tenant mismatch", code: "ADMIN_TENANT_CONTEXT_MISMATCH" }, { status: 403 }),
    };
  }
  return { ok: true, slug };
}

