import { NextResponse } from "next/server";

import { requireAdminTenantSlugForApi } from "@/lib/admin-tenant";
import { tenantDb } from "@/lib/tenant-db";
import type { Client } from "@/types";

export async function GET(req: Request) {
  const a = await requireAdminTenantSlugForApi();
  if (!a.ok) return a.response;

  const q = new URL(req.url).searchParams.get("q") ?? "";
  if (q.trim().length < 2) return NextResponse.json([]);

  const { data, error } = await tenantDb(a.slug).clients.list(q.trim());
  if (error) return NextResponse.json([], { status: 500 });

  const results = ((data ?? []) as Client[])
    .slice(0, 8)
    .map((c) => ({ id: c.id, name: c.name, phone: c.phone ?? "", email: c.email ?? "" }));

  return NextResponse.json(results);
}
