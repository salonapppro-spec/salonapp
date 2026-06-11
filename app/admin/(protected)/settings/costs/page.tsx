import { FixedCostsSettingsForm } from "@/components/admin/FixedCostsSettingsForm";
import { requireAdminTenantSlugForPage } from "@/lib/admin-tenant-page";
import { getFinancialSettings } from "@/lib/data";
import type { FinancialSettings } from "@/types";

export default async function SettingsCostsPage() {
  const salonSlug = await requireAdminTenantSlugForPage();
  const financial = await getFinancialSettings(salonSlug);

  return (
    <div className="max-w-3xl space-y-6">
      <FixedCostsSettingsForm settings={financial as FinancialSettings | null} />
    </div>
  );
}
