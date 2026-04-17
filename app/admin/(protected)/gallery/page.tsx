import { getGalleryAdmin } from "@/lib/data";
import { requireAdminTenantSlugForPage } from "@/lib/admin-tenant-page";

import { GalleryClient } from "./gallery-client";

export default async function AdminGalleryPage() {
  const salonSlug = await requireAdminTenantSlugForPage();
  const items = await getGalleryAdmin(salonSlug);
  return (
    <div className="admin-page-shell max-w-5xl">
      <h1 className="text-2xl font-semibold tracking-tight text-brand-900 sm:text-3xl">Галерия</h1>
      <p className="mt-2 max-w-2xl text-pretty text-sm leading-relaxed text-brand-800/85 sm:text-base">
        Качвайте снимки от компютъра или телефона — те се съхраняват за сайта на салона. Външен линк е само по изключение.
      </p>
      <GalleryClient initialItems={items} />
    </div>
  );
}
