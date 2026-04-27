import { Suspense } from "react";

import { ClientsAdminClient } from "@/components/admin/ClientsAdminClient";
import { getClientsAdmin } from "@/lib/data";
import { requireAdminTenantSlugForPage } from "@/lib/admin-tenant-page";

function ClientsListSkeleton() {
  return (
    <div className="mt-5 animate-pulse">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="h-4 w-24 rounded-full bg-[#1A1A1A]/10" />
        <div className="flex items-center gap-2">
          <div className="h-8 w-20 rounded-xl bg-[#1A1A1A]/10" />
          <div className="h-8 w-32 rounded-xl bg-[#C9A84C]/25" />
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_1.3fr]">
        <div
          className="overflow-hidden rounded-2xl bg-white"
          style={{ border: "1px solid rgba(201,168,76,0.15)", boxShadow: "0 1px 2px rgba(0,0,0,0.04), 0 4px 24px rgba(0,0,0,0.06)" }}
        >
          <div className="space-y-2 p-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 rounded-xl px-2 py-2.5">
                <div className="h-8 w-8 rounded-full bg-[#C9A84C]/20" />
                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="h-3.5 w-3/5 rounded-full bg-[#1A1A1A]/10" />
                  <div className="h-3 w-4/5 rounded-full bg-[#1A1A1A]/8" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div
          className="rounded-2xl bg-white p-5"
          style={{ border: "1px solid rgba(201,168,76,0.15)", boxShadow: "0 1px 2px rgba(0,0,0,0.04), 0 4px 24px rgba(0,0,0,0.06)", minHeight: "320px" }}
        >
          <div className="space-y-3">
            <div className="h-5 w-40 rounded-lg bg-[#1A1A1A]/10" />
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-16 rounded-xl bg-[#1A1A1A]/8" />
              ))}
            </div>
            <div className="h-11 rounded-xl bg-[#1A1A1A]/8" />
            <div className="h-24 rounded-xl bg-[#1A1A1A]/8" />
            <div className="h-11 rounded-xl bg-[#C9A84C]/25" />
          </div>
        </div>
      </div>
    </div>
  );
}

async function ClientsListSection(props: { q: string }) {
  const salonSlug = await requireAdminTenantSlugForPage();
  const clients = await getClientsAdmin(salonSlug, props.q || undefined);
  return <ClientsAdminClient initialClients={clients} searchQ={props.q} />;
}

export default function AdminClientsPage(props: { searchParams?: { q?: string } }) {
  const q = props.searchParams?.q ?? "";

  return (
    <div className="admin-page-shell max-w-6xl">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <span
            className="inline-block rounded-lg px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.2em] text-white"
            style={{ background: "linear-gradient(135deg, #C9A84C, #C8826A)" }}
          >
            👤 Клиенти
          </span>
          <h1
            className="mt-2 text-2xl font-black tracking-tight text-[#1A1A1A] sm:text-3xl"
            style={{ fontFamily: "var(--font-playfair, Georgia, serif)" }}
          >
            База клиенти
          </h1>
          <p className="mt-1 text-sm text-[#1A1A1A]/45">Клиентите се добавят автоматично при резервация или ръчно от бутона в списъка.</p>
        </div>
      </div>

      {/* Search */}
      <form className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-end" method="get">
        <div className="min-w-0 flex-1">
          <input
            id="clients-q"
            type="search"
            name="q"
            defaultValue={q}
            placeholder="🔍  Търси по име или телефон…"
            className="input-admin !mt-0 h-16 w-full"
          />
        </div>
        <button
          type="submit"
          className="w-full rounded-xl px-6 py-3 text-sm font-black text-white transition hover:opacity-90 sm:w-auto"
          style={{ background: "linear-gradient(135deg, #C9A84C, #C8826A)", minHeight: "44px" }}
        >
          Търси
        </button>
      </form>

      <Suspense fallback={<ClientsListSkeleton />}>
        <ClientsListSection q={q} />
      </Suspense>
    </div>
  );
}
