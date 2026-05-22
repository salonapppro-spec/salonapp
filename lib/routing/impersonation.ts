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
 * Returns null if the value is missing or fails the slug regex.
 */
export function getImpersonatedSlug(cookieValue: string | undefined): string | null {
  if (!cookieValue) return null;
  const trimmed = cookieValue.trim();
  return SLUG_RE.test(trimmed) ? trimmed : null;
}
