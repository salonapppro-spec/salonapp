import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

import { requireAdminTenantSlugForApi } from "@/lib/admin-tenant";
import { CreateServiceSchema } from "@/schemas/service";
import { tenantDb } from "@/lib/tenant-db";

export async function GET() {
  const a = await requireAdminTenantSlugForApi();
  if (!a.ok) return a.response;
  const salonSlug = a.slug;
  const { data, error } = await tenantDb(salonSlug).services.listAll();
  if (error) return NextResponse.json({ error: "DB error" }, { status: 500 });
  return NextResponse.json({ services: data ?? [] });
}

export async function POST(req: Request) {
  const a = await requireAdminTenantSlugForApi();
  if (!a.ok) return a.response;
  const salonSlug = a.slug;
  const body = (await req.json().catch(() => null)) as unknown;
  const parsed = CreateServiceSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  const { data, error } = await tenantDb(salonSlug).services.create(parsed.data as Record<string, unknown>);
  if (error) return NextResponse.json({ error: "DB insert failed" }, { status: 500 });
  revalidateTag(`services-${salonSlug}`);
  return NextResponse.json({ service: data });
}
