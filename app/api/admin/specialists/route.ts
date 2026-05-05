import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAdminTenantSlugForApi } from "@/lib/admin-tenant";
import { tenantDb } from "@/lib/tenant-db";

const CreateSpecialistSchema = z.object({
  name: z.string().min(1).max(120),
});

export async function GET() {
  const a = await requireAdminTenantSlugForApi();
  if (!a.ok) return a.response;

  const { data, error } = await tenantDb(a.slug).specialists.listAll();
  if (error) return NextResponse.json({ error: "DB read failed" }, { status: 500 });
  return NextResponse.json({ specialists: data ?? [] });
}

export async function POST(req: Request) {
  const a = await requireAdminTenantSlugForApi();
  if (!a.ok) return a.response;

  const body = (await req.json().catch(() => null)) as unknown;
  const parsed = CreateSpecialistSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  const { data, error } = await tenantDb(a.slug).specialists.create({
    name: parsed.data.name.trim(),
    is_active: true,
  });

  if (error) return NextResponse.json({ error: "DB create failed" }, { status: 500 });
  revalidateTag(`specialists-${a.slug}`);
  return NextResponse.json({ ok: true, specialist: data });
}
