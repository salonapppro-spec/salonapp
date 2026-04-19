import { getGalleryAdmin } from "@/lib/data";
import { requireAdminTenantSlugForPage } from "@/lib/admin-tenant-page";

import { GalleryClient } from "./gallery-client";

const GOLD = "#C9A84C";
const ROSE = "#C8826A";

export default async function AdminGalleryPage() {
  const salonSlug = await requireAdminTenantSlugForPage();
  const items = await getGalleryAdmin(salonSlug);
  return (
    <div className="admin-page-shell max-w-5xl">
      {/* Header */}
      <div>
        <span
          className="inline-block rounded-lg px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.2em] text-white"
          style={{ background: `linear-gradient(135deg, ${GOLD}, ${ROSE})` }}
        >
          🖼️ Галерия
        </span>
        <h1
          className="mt-2 text-2xl font-black tracking-tight text-[#1A1A1A] sm:text-3xl"
          style={{ fontFamily: "var(--font-playfair, Georgia, serif)" }}
        >
          Снимки на салона
        </h1>
        <p className="mt-1 text-sm text-[#1A1A1A]/45">
          Качвай снимки от компютъра или телефона — показват се на сайта на салона.
        </p>
      </div>
      <GalleryClient initialItems={items} />
    </div>
  );
}
