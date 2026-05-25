import { notFound } from "next/navigation";

import { ContactsForm } from "@/components/admin/ContactsForm";
import { requireAdminTenantSlugForPage } from "@/lib/admin-tenant-page";
import { getTenantBySalonSlug } from "@/lib/data";

export default async function SettingsContactsPage() {
  const salonSlug = await requireAdminTenantSlugForPage();
  const tenant = await getTenantBySalonSlug(salonSlug);
  if (!tenant) notFound();

  return (
    <div className="max-w-3xl">
      <ContactsForm tenant={tenant} />
    </div>
  );
}
