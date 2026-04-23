import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getTenantBySalonSlug } from "@/lib/data";
import { resolveAdminTenantSlug } from "@/lib/admin-tenant";
import { tenantDb } from "@/lib/tenant-db";

export type FinanceScope = {
  salonSlug: string;
  specialistIdFilter: string | null;
  canSeeReports: boolean;
};

/**
 * Колектив: специалист (не технически админ) вижда само своите резервации/оборот.
 * Техн. админ или акаунт без specialist_id → целият салон.
 */
export async function resolveFinanceScope(): Promise<FinanceScope | null> {
  const salonSlug = await resolveAdminTenantSlug();
  if (!salonSlug) return null;

  const tenant = await getTenantBySalonSlug(salonSlug);
  if (!tenant) return null;

  const canSeeReports = tenant.plan === "pro" || tenant.plan === "premium" || tenant.plan === "collective";

  let specialistIdFilter: string | null = null;

  if (tenant.plan === "collective") {
    const supabase = await createSupabaseServerClient();
    if (!supabase) return { salonSlug, specialistIdFilter: null, canSeeReports };
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { salonSlug, specialistIdFilter: null, canSeeReports };

    const sid =
      typeof user.user_metadata?.specialist_id === "string"
        ? user.user_metadata.specialist_id
        : typeof user.app_metadata?.specialist_id === "string"
          ? user.app_metadata.specialist_id
          : null;

    if (sid) {
      const { data: spec } = await tenantDb(salonSlug).specialists.getById(sid);

      const row = spec as { id: string; is_technical_admin: boolean } | null;
      if (row && !row.is_technical_admin) {
        specialistIdFilter = row.id;
      }
    }
  }

  return { salonSlug, specialistIdFilter, canSeeReports };
}
