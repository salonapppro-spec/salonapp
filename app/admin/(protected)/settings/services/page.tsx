import { Suspense } from "react";

import { ServicesClient } from "@/app/admin/(protected)/services/services-client";
import { requireAdminTenantSlugForPage } from "@/lib/admin-tenant-page";
import { getAllServicesAdmin } from "@/lib/data";

function ServicesSkeleton() {
  return (
    <div className="mt-6 animate-pulse">
      <div className="mb-4 flex items-center justify-between">
        <div className="h-8 w-40 rounded-xl bg-[#1A1A1A]/10" />
        <div className="h-10 w-28 rounded-xl bg-[#C9A84C]/25" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-16 rounded-2xl border border-[#C9A84C]/15 bg-white/80"
          />
        ))}
      </div>
    </div>
  );
}

async function ServicesContent() {
  const salonSlug = await requireAdminTenantSlugForPage();
  const services = await getAllServicesAdmin(salonSlug);
  return <ServicesClient initialServices={services} />;
}

export default function SettingsServicesPage() {
  return (
    <div className="max-w-5xl">
      <Suspense fallback={<ServicesSkeleton />}>
        <ServicesContent />
      </Suspense>
    </div>
  );
}
