import { getAllServicesAdmin } from "@/lib/data";
import { requireAdminTenantSlugForPage } from "@/lib/admin-tenant-page";

import { ServicesClient } from "./services-client";

export default async function AdminServicesPage() {
  const salonSlug = await requireAdminTenantSlugForPage();
  const services = await getAllServicesAdmin(salonSlug);
  return (
    <div className="admin-page-shell max-w-5xl">
      <h1 className="text-2xl font-semibold tracking-tight text-brand-900 sm:text-3xl">Услуги</h1>
      <p className="mt-2 max-w-2xl text-pretty text-sm leading-relaxed text-brand-800/85 sm:text-base">
        Прост режим: име, цена, продължителност. Сложен режим — следваща стъпка.
      </p>
      <ServicesClient initialServices={services} />
    </div>
  );
}
