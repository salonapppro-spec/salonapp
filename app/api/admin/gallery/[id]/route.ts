import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAdminCapabilityForApi } from "@/lib/admin-rbac";
import { tenantDb } from "@/lib/tenant-db";

const PatchSchema = z.object({
  order_index: z.number().int().nonnegative().optional(),
  is_visible: z.boolean().optional(),
  url: z.string().url().optional(),
});

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const a = await requireAdminCapabilityForApi("gallery_write");
  if (!a.ok) return a.response;
  const salonSlug = a.slug;
  const { id } = await ctx.params;
  const body = (await req.json().catch(() => null)) as unknown;
  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  const { data, error } = await tenantDb(salonSlug).gallery.updateById(id, parsed.data as Record<string, unknown>);
  if (error) return NextResponse.json({ error: "DB update failed" }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });

  revalidatePath(`/${salonSlug}`);
  revalidateTag(`gallery-${salonSlug}`);
  return NextResponse.json({ item: data });
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const a = await requireAdminCapabilityForApi("gallery_write");
  if (!a.ok) return a.response;
  const salonSlug = a.slug;
  const { id } = await ctx.params;
  const { error } = await tenantDb(salonSlug).gallery.deleteById(id);
  if (error) return NextResponse.json({ error: error.message || "DB delete failed" }, { status: 500 });

  revalidatePath(`/${salonSlug}`);
  revalidateTag(`gallery-${salonSlug}`);
  return NextResponse.json({ ok: true });
}
