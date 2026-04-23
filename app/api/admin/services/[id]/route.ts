import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAdminTenantSlugForApi } from "@/lib/admin-tenant";
import { tenantDb } from "@/lib/tenant-db";

const PatchSchema = z.object({
  name: z.string().min(1).optional(),
  price_eur: z.number().nonnegative().optional(),
  duration_minutes: z.number().int().positive().nullable().optional(),
  is_active: z.boolean().optional(),
  is_complex: z.boolean().optional(),
  active_start_min: z.number().int().nonnegative().nullable().optional(),
  active_start_max: z.number().int().nonnegative().nullable().optional(),
  waiting_min: z.number().int().nonnegative().nullable().optional(),
  waiting_max: z.number().int().nonnegative().nullable().optional(),
  active_finish_min: z.number().int().nonnegative().nullable().optional(),
  active_finish_max: z.number().int().nonnegative().nullable().optional(),
});

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const a = await requireAdminTenantSlugForApi();
  if (!a.ok) return a.response;
  const salonSlug = a.slug;
  const { id } = await ctx.params;
  const body = (await req.json().catch(() => null)) as unknown;
  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  const { data, error } = await tenantDb(salonSlug).services.updateById(id, parsed.data as Record<string, unknown>);
  if (error) return NextResponse.json({ error: "DB update failed" }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ service: data });
}

/** Премахване на услуга — само ако вече е неактивна (защита от случайно триене). */
export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const a = await requireAdminTenantSlugForApi();
  if (!a.ok) return a.response;
  const salonSlug = a.slug;
  const { id } = await ctx.params;

  const { data: row, error: loadErr } = await tenantDb(salonSlug).services.getById(id);
  if (loadErr) return NextResponse.json({ error: "DB error" }, { status: 500 });
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if ((row as { is_active: boolean }).is_active) {
    return NextResponse.json(
      { error: "Първо я деактивирай. След това можеш да я изтриеш от списъка с неактивни." },
      { status: 400 }
    );
  }

  const { error } = await tenantDb(salonSlug).services.deleteById(id);
  if (error) return NextResponse.json({ error: "Неуспешно изтриване" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
