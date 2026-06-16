/**
 * Public tenant URL paths — subdomain/custom-domain vs path routing.
 *
 * Subdomain (thebeast.salonapp.pro): browser path is `/`, `/booking` — middleware rewrites to /{slug}/...
 * Path routing (salonapp.pro/thebeast, localhost): browser path is `/{slug}`, `/{slug}/booking`
 */

export type TenantPublicSegment = "booking";

/** Hosts where the tenant slug appears in the URL path (not in the subdomain). */
export function isPlatformPathHost(rawHost: string): boolean {
  const normalized = rawHost.split(":")[0]?.toLowerCase() ?? "";
  return (
    normalized === "localhost" ||
    normalized === "127.0.0.1" ||
    normalized.endsWith(".vercel.app") ||
    normalized === "salonapp.pro" ||
    normalized === "www.salonapp.pro"
  );
}

function resolveHost(rawHost?: string): string {
  if (rawHost) return rawHost;
  if (typeof window !== "undefined") return window.location.hostname;
  return "salonapp.pro";
}

/** Home or subpath on a tenant public site. */
export function tenantPublicPath(
  slug: string,
  segment?: TenantPublicSegment,
  rawHost?: string
): string {
  const pathPrefix = isPlatformPathHost(resolveHost(rawHost)) ? `/${slug}` : "";
  if (!segment) return pathPrefix || "/";
  return `${pathPrefix}/${segment}`;
}
