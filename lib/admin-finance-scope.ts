import { createSupabaseServerClient } from "@/lib/supabase-server";
import { createSupabaseServiceRoleClient } from "@/lib/supabase-admin";
import { getTenantBySalonSlug } from "@/lib/data";
import { resolveAdminTenantSlug } from "@/lib/admin-tenant";

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
      const db = createSupabaseServiceRoleClient();
      const { data: spec } = await db
        .from("specialists")
        .select("id,is_technical_admin")
        .eq("id", sid)
        .eq("salon_slug", salonSlug)
        .maybeSingle();

      const row = spec as { id: string; is_technical_admin: boolean } | null;
      if (row && !row.is_technical_admin) {
        specialistIdFilter = row.id;
      }
    }
  }

  return { salonSlug, specialistIdFilter, canSeeReports };
}
