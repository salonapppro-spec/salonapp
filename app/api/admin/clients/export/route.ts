import { NextResponse } from "next/server";

import { requireAdminTenantSlugForApi } from "@/lib/admin-tenant";
import { getClientsAdmin } from "@/lib/data";

export async function GET() {
  const a = await requireAdminTenantSlugForApi();
  if (!a.ok) return a.response;
  const salonSlug = a.slug;

  const clients = await getClientsAdmin(salonSlug);
  const header = "name,phone,email,notes,created_at";
  const lines = clients.map((c) =>
    [
      csvEscape(c.name),
      csvEscape(c.phone ?? ""),
      csvEscape(c.email ?? ""),
      csvEscape(c.notes ?? ""),
      csvEscape(c.created_at ?? ""),
    ].join(",")
  );
  const csv = [header, ...lines].join("\n");

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="clients-${salonSlug}.csv"`,
    },
  });
}

function csvEscape(s: string): string {
  let t = String(s).replace(/"/g, '""');
  if (/^[=+\-@\t\r]/.test(t)) t = `'${t}`; // prevent formula injection in Excel/Sheets
  if (/[",\n]/.test(t)) return `"${t}"`;
  return t;
}
