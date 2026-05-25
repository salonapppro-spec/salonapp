import { WorkingHoursForm } from "@/components/admin/WorkingHoursForm";
import { requireAdminTenantSlugForPage } from "@/lib/admin-tenant-page";
import { getWorkingHoursWeekMerged } from "@/lib/data";

export default async function SettingsHoursPage() {
  const salonSlug = await requireAdminTenantSlugForPage();
  const days = await getWorkingHoursWeekMerged(salonSlug);

  return (
    <div className="max-w-3xl">
      <WorkingHoursForm initialDays={days} />
    </div>
  );
}
