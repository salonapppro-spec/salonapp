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
      <h1 className="text-2xl font-semibold tracking-tight text-brand-900 sm:text-3xl">Клиенти</h1>
      <p className="mt-2 text-sm text-brand-800/85 sm:text-base">Търсене по име или телефон.</p>

      <form className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end" method="get">
        <div className="min-w-0 flex-1">
          <label htmlFor="clients-q" className="sr-only">
            Търсене
          </label>
          <input
            id="clients-q"
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Име или телефон"
            className="input-admin !mt-0 w-full"
          />
        </div>
        <button type="submit" className="btn-admin-primary w-full shrink-0 sm:w-auto sm:px-8">
          Търси
        </button>
      </form>

      <ClientsAdminClient initialClients={clients} searchQ={q} />
    </div>
  );
}
