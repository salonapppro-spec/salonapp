/**
 * lib/routing/host.ts
 *
 * Pure hostname classification — no I/O, no side-effects.
 * Call classifyHost() once at the top of middleware and pass hostInfo around.
 */

export type HostInfo = {
  normalized: string;
  isRootDomain: boolean;
  isDevHost: boolean;
  isVercelPreview: boolean;
  isSalonSubdomain: boolean;
  isLegacyCustomHost: boolean;
  /** Slug extracted from subdomain. e.g. "paw-empire" from "paw-empire.salonapp.pro". Null otherwise. */
  subdomainSlug: string | null;
};

/** Strips port and lowercases. "localhost:3000" → "localhost" */
function normalize(host: string): string {
  return host.split(":")[0]?.toLowerCase() ?? "";
}

/**
 * Classifies a raw host header value into all routing-relevant booleans.
 *
 * Examples:
 *   "paw-empire.salonapp.pro" → isSalonSubdomain=true, subdomainSlug="paw-empire"
 *   "salonapp.pro"            → isRootDomain=true
 *   "localhost"               → isDevHost=true
 *   "salonapp-ten.vercel.app" → isVercelPreview=true
 *   "theskin.bg"              → isLegacyCustomHost=true (custom domain lookup)
 */
export function classifyHost(rawHost: string): HostInfo {
  const normalized = normalize(rawHost);

  const isRootDomain =
    normalized === "salonapp.pro" || normalized === "www.salonapp.pro";

  const isDevHost =
    normalized === "localhost" || normalized === "127.0.0.1";

  const isVercelPreview = normalized.endsWith(".vercel.app");

  const isSalonSubdomain =
    normalized.endsWith(".salonapp.pro") && !isRootDomain;

  const subdomainSlug = isSalonSubdomain
    ? normalized.replace(/\.salonapp\.pro$/, "")
    : null;

  // A host that is none of the above — legacy custom domain (e.g. theskin.bg).
  const isLegacyCustomHost =
    !isRootDomain && !isDevHost && !isVercelPreview && !isSalonSubdomain;

  return {
    normalized,
    isRootDomain,
    isDevHost,
    isVercelPreview,
    isSalonSubdomain,
    isLegacyCustomHost,
    subdomainSlug,
  };
}

/**
 * Returns true for hosts where the platform UI (admin, super-admin, marketing) is served.
 * Auth guards run ONLY on platform hosts — never on tenant subdomains.
 */
export function isPlatformHost(h: HostInfo): boolean {
  return h.isRootDomain || h.isVercelPreview || h.isDevHost;
}
