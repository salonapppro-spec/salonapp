/**
 * lib/routing/impersonation.ts
 *
 * Super-admin impersonation cookie helpers. Pure — no I/O, no network.
 *
 * Impersonation is an OVERRIDE applied after auth, not a tenant resolution source.
 * It only applies on platform hosts (/admin routes). Subdomain tenant hosts
 * always use the RPC-resolved slug, never the impersonation cookie.
 */

import { SLUG_RE } from "./constants";

/**
 * Validates and returns the impersonated salon slug from the cookie value.
 * Returns null if the value is missing or the slug fails the slug regex.
 *
 * Стойността е подписана — "slug.hmac" (одит M4). Edge runtime няма
 * node:crypto, затова тук само парсваме slug частта БЕЗ криптографска
 * проверка: header-ът, който middleware задава от нея, е hint. Реалната
 * граница на доверие е lib/admin-tenant.ts (verifyImpersonationSlug +
 * cross-check в requireAdminTenantSlugForApi), която верифицира HMAC-а.
 * Приема и гола "slug" стойност (legacy бисквитки отпреди M4).
 */
export function getImpersonatedSlug(cookieValue: string | undefined): string | null {
  if (!cookieValue) return null;
  const trimmed = cookieValue.trim();
  if (!trimmed) return null;
  const dot = trimmed.lastIndexOf(".");
  const slug = dot === -1 ? trimmed : trimmed.slice(0, dot);
  return SLUG_RE.test(slug) ? slug : null;
}
