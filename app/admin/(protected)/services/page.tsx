import { Suspense } from "react";

import { getAllServicesAdmin } from "@/lib/data";
import { requireAdminTenantSlugForPage } from "@/lib/admin-tenant-page";

import { ServicesClient } from "./services-client";

function ServicesSkeleton() {
  return (
    <div className="mt-6 animate-pulse">
      <div className="mb-4 flex items-center justify-between">
        <div className="h-8 w-40 rounded-xl bg-[#1A1A1A]/10" />
        <div className="h-10 w-28 rounded-xl bg-[#C9A84C]/25" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-16 rounded-2xl border border-[#C9A84C]/15 bg-white/80" />
        ))}
      </div>
    </div>
  );
}

async function ServicesDataSection() {
  const salonSlug = await requireAdminTenantSlugForPage();
  const services = await getAllServicesAdmin(salonSlug);
  return <ServicesClient initialServices={services} />;
}

export default function AdminServicesPage() {
  return (
    <div className="admin-page-shell max-w-5xl">
      <h1 className="text-2xl font-semibold tracking-tight text-brand-900 sm:text-3xl">Услуги</h1>
      <p className="mt-2 max-w-2xl text-pretty text-sm leading-relaxed text-brand-800/85 sm:text-base">
        Прост режим: име, цена, продължителност. Сложен режим — следваща стъпка.
      </p>
      <Suspense fallback={<ServicesSkeleton />}>
        <ServicesDataSection />
      </Suspense>
    </div>
  );
}
