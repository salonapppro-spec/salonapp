import { createHmac, timingSafeEqual } from "crypto";
import { cookies, headers } from "next/headers";
import { NextResponse } from "next/server";

import { getTenant } from "@/lib/get-tenant";
import { recoverOwnerTenantSlug } from "@/lib/internal/owner-tenant-recovery";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { SLUG_RE } from "@/lib/routing/constants";

/**
 * HttpOnly контекст: супер админ без salon_slug в JWT може да „влезе" в салонски админ
 * след server action (виж `enterSalonAdminContextAction`).
 */
export const SUPER_ADMIN_SALON_COOKIE = "salonapp_super_admin_salon";

function hmacSecret(): string | null {
  return process.env.IMPERSONATION_HMAC_SECRET ?? null;
}

export function signImpersonationSlug(slug: string): string {
  const secret = hmacSecret();
  if (!secret) {
    // Fail closed (одит M4): без секрет бисквитката би била неподписана и
    // verify би я отхвърлил — хвърляме ясна грешка вместо тих счупен контекст.
    throw new Error("IMPERSONATION_HMAC_SECRET липсва — impersonation не работи без него (виж .env.example)");
  }
  const mac = createHmac('sha256', secret).update(slug).digest('hex');
  return slug + '.' + mac;
}

export function verifyImpersonationSlug(value: string): string | null {
  const secret = hmacSecret();
  // Fail closed (одит M4): без секрет НЕ приемаме нищо — неподписан slug в
  // бисквитката би позволил impersonation без криптографска проверка.
  if (!secret) return null;
  const dot = value.lastIndexOf('.');
  if (dot === -1) return null;
  const slug = value.slice(0, dot);
  const mac = value.slice(dot + 1);
  if (!SLUG_RE.test(slug)) return null;
  const expected = createHmac('sha256', secret).update(slug).digest('hex');
  if (mac.length !== expected.length) return null;
  const a = Buffer.from(mac, 'hex');
  const b = Buffer.from(expected, 'hex');
  if (a.length !== b.length) return null;
  return timingSafeEqual(a, b) ? slug : null;
}

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
  if (!raw) return null;
  return verifyImpersonationSlug(raw);
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
  if (fromJwt) {
    // Fail closed: JWT slug must resolve to a real tenant.
    // Prevents silent empty admin state when metadata is stale after slug rename.
    const tenant = await getTenant(fromJwt);
    if (tenant) return fromJwt;
    if (isProductionRuntime() && data.user.app_metadata?.role !== "owner") return null;
  }

  if (data.user.app_metadata?.role === "super_admin") {
    const cookieStore = await cookies();
    const raw = cookieStore.get(SUPER_ADMIN_SALON_COOKIE)?.value?.trim();
    if (raw) {
      const slug = verifyImpersonationSlug(raw);
      if (slug) {
        // enterSalonAdminContextAction verifies the tenant exists when the
        // cookie is first set, but the cookie can outlive that tenant (renamed
        // or deleted salon, cookie maxAge) — re-check here so a stale cookie
        // resolves to "no tenant" instead of a ghost slug (audit 2026-06-15/16).
        const tenant = await getTenant(slug);
        if (tenant) return slug;
      }
    }
  }

  // Owner-only self-heal path: if JWT slug is stale/missing, restore from tenants.owner_email.
  if (data.user.app_metadata?.role === "owner") {
    const repairedSlug = await recoverOwnerTenantSlug({
      userId: data.user.id,
      email: data.user.email,
      appMetadata: (data.user.app_metadata ?? null) as Record<string, unknown> | null,
      userMetadata: (data.user.user_metadata ?? null) as Record<string, unknown> | null,
    });
    if (repairedSlug) return repairedSlug;
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

