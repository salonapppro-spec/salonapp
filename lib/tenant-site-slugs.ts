/** Slugs with a published custom public site (no component imports — safe for unit tests). */
export const TENANT_SITE_SLUGS = [
  "paw-empire",
  "thebeast",
  "euphoria",
  "lindynails",
  "theskin",
  "magnetic-eyes",
  "ats-massage",
  "tania",
] as const;

export type TenantSiteSlug = (typeof TENANT_SITE_SLUGS)[number];

export function hasTenantSite(slug: string): slug is TenantSiteSlug {
  return (TENANT_SITE_SLUGS as readonly string[]).includes(slug);
}
