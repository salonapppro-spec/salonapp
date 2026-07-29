/**
 * lib/routing/constants.ts
 *
 * Shared routing constants — copied verbatim from middleware.ts.
 * No logic, no I/O. Safe to import from any module.
 */

/** Valid salon slug: lowercase letters, digits, hyphens. e.g. "paw-empire", "thebeast" */
export const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * HttpOnly cookie written by the super-admin impersonation server action.
 * Must match the value in lib/admin-tenant.ts.
 */
export const SUPER_ADMIN_SALON_COOKIE = "salonapp_super_admin_salon";

/**
 * Platform-reserved path segments — never treated as salon slugs in path routing.
 * Copied verbatim from middleware.ts.
 */
export const RESERVED_PATHS = new Set([
  "admin",
  "api",
  "super-admin",
  "get-started",
  "demo",
  "legal",
  "blog",
  "privacy",
  "unsubscribe",
  "_next",
  "favicon.ico",
  "robots.txt",
  "sitemap.xml",
  "temporarily-unavailable",
  "icon.png",
  "apple-icon.png",
]);
