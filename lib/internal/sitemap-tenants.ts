import { createSupabaseServiceRoleClient } from "@/lib/supabase-admin";

/**
 * Platform-level sitemap helper — intentionally NOT tenant-scoped. The
 * sitemap must list every active/trial tenant's public site, so it needs
 * a cross-tenant query by design. Lives under lib/internal/** so it's
 * exempt from the tenant service-role boundary check
 * (scripts/check-service-role-boundary.mjs).
 */

export type SitemapTenantRow = {
  salon_slug: string;
  created_at: string | null;
};

export async function listActiveTenantsForSitemap(): Promise<SitemapTenantRow[]> {
  const supabase = createSupabaseServiceRoleClient();
  // trial тенантите също са живи публични сайтове → индексират се
  const { data, error } = await supabase
    .from("tenants")
    .select("salon_slug, created_at")
    .in("status", ["active", "trial"])
    .order("created_at", { ascending: true });

  if (error || !data) return [];
  return data as SitemapTenantRow[];
}
