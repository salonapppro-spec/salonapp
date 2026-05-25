import { notFound } from "next/navigation";

import { GalleryClient } from "@/app/admin/(protected)/gallery/gallery-client";
import { LogoImagesForm } from "@/components/admin/LogoImagesForm";
import { requireAdminTenantSlugForPage } from "@/lib/admin-tenant-page";
import { getGalleryAdmin, getTenantBySalonSlug } from "@/lib/data";

export default async function SettingsLogoImagesPage() {
  const salonSlug = await requireAdminTenantSlugForPage();
  const [tenant, galleryItems] = await Promise.all([
    getTenantBySalonSlug(salonSlug),
    getGalleryAdmin(salonSlug),
  ]);
  if (!tenant) notFound();

  return (
    <div className="max-w-3xl space-y-6">
      <LogoImagesForm tenant={tenant} />

      {/* ── Галерия ── */}
      <div
        className="rounded-2xl bg-white p-5"
        style={{
          border: "1px solid rgba(201,168,76,0.18)",
          boxShadow: "0 1px 2px rgba(0,0,0,0.04), 0 4px 24px rgba(0,0,0,0.05)",
        }}
      >
        <div
          className="mb-4 flex items-center gap-3 border-b pb-4"
          style={{ borderColor: "rgba(201,168,76,0.12)" }}
        >
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-lg"
            style={{
              background:
                "linear-gradient(135deg, rgba(201,168,76,0.15), rgba(200,130,106,0.15))",
            }}
          >
            🖼️
          </div>
          <div>
            <h2 className="text-sm font-black text-[#1A1A1A]">Галерия</h2>
            <p className="mt-0.5 text-xs text-[#1A1A1A]/45">
              Снимки на салона — показват се на публичния сайт.
            </p>
          </div>
        </div>
        <GalleryClient initialItems={galleryItems} />
      </div>
    </div>
  );
}
