import { getWorkingHoursWeekMerged } from "@/lib/data";
import { requireAdminTenantSlugForPage } from "@/lib/admin-tenant-page";

import { WorkingHoursForm } from "@/components/admin/WorkingHoursForm";

export default async function WorkingHoursPage() {
  const salonSlug = await requireAdminTenantSlugForPage();
  const days = await getWorkingHoursWeekMerged(salonSlug);

  return (
    <div className="admin-page-shell max-w-3xl">
      <h1 className="text-2xl font-semibold tracking-tight text-brand-900 sm:text-3xl">Работно време</h1>
      <p className="mt-2 max-w-2xl text-pretty text-sm leading-relaxed text-brand-800/85 sm:text-base">
        График за салона (без отделни специалисти в тази версия). Използва се за свободни часове при резервации.
      </p>
      <div className="mt-8">
        <WorkingHoursForm initialDays={days} />
      </div>
    </div>
  );
}
