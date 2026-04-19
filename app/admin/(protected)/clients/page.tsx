import { ClientsAdminClient } from "@/components/admin/ClientsAdminClient";
import { getClientsAdmin } from "@/lib/data";
import { requireAdminTenantSlugForPage } from "@/lib/admin-tenant-page";

export default async function AdminClientsPage(props: { searchParams: Promise<{ q?: string }> }) {
  const salonSlug = await requireAdminTenantSlugForPage();
  const sp = await props.searchParams;
  const q = sp.q ?? "";
  const clients = await getClientsAdmin(salonSlug, q || undefined);

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
          <p className="mt-1 text-sm text-[#1A1A1A]/45">
            {clients.length > 0 ? `${clients.length} клиента` : "Клиентите се добавят автоматично при резервация"}
          </p>
        </div>
      </div>

      {/* Search */}
      <form className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-end" method="get">
        <div className="min-w-0 flex-1">
          <input
            id="clients-q"
            type="search"
            name="q"
            defaultValue={q}
            placeholder="🔍  Търси по име или телефон…"
            className="input-admin !mt-0 w-full"
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

      <ClientsAdminClient initialClients={clients} searchQ={q} />
    </div>
  );
}
