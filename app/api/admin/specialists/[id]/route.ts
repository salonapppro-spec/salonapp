import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAdminTenantSlugForApi } from "@/lib/admin-tenant";
import { tenantDb } from "@/lib/tenant-db";

const PatchSpecialistSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  role: z.string().max(120).nullable().optional(),
  bio: z.string().max(1200).nullable().optional(),
  avatar_url: z.string().url().nullable().optional(),
  is_active: z.boolean().optional(),
});

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const a = await requireAdminTenantSlugForApi();
  if (!a.ok) return a.response;

  const { id } = await ctx.params;
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const body = (await req.json().catch(() => null)) as unknown;
  const parsed = PatchSpecialistSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  const patch: Record<string, unknown> = { ...parsed.data };
  if (typeof patch.name === "string") patch.name = patch.name.trim();

  const { data, error } = await tenantDb(a.slug).specialists.updateById(id, patch);

  if (error) return NextResponse.json({ error: "DB update failed" }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Specialist not found" }, { status: 404 });
  revalidateTag(`specialists-${a.slug}`);
  return NextResponse.json({ ok: true, specialist: data });
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const a = await requireAdminTenantSlugForApi();
  if (!a.ok) return a.response;

  const { id } = await ctx.params;
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const { data: row, error: fetchErr } = await tenantDb(a.slug).specialists.getById(id);
  if (fetchErr) return NextResponse.json({ error: "DB error" }, { status: 500 });
  if (!row) return NextResponse.json({ error: "Specialist not found" }, { status: 404 });
  if ((row as { is_technical_admin: boolean }).is_technical_admin) {
    return NextResponse.json({ error: "Този специалист е системен и не може да бъде изтрит." }, { status: 403 });
  }

  const { error } = await tenantDb(a.slug).specialists.deleteById(id);
  if (error) return NextResponse.json({ error: "DB delete failed" }, { status: 500 });

  revalidatePath(`/${a.slug}`);
  revalidateTag(`specialists-${a.slug}`);

  return NextResponse.json({ ok: true });
}
