import { NextResponse } from "next/server";

import { requireAdminTenantSlugForApi } from "@/lib/admin-tenant";
import { tenantDb } from "@/lib/tenant-db";
import { AdminBookingPatchSchema } from "@/schemas/booking-admin";

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const a = await requireAdminTenantSlugForApi();
  if (!a.ok) return a.response;
  const salonSlug = a.slug;
  const { id } = await ctx.params;
  const body = (await req.json().catch(() => null)) as unknown;
  const parsed = AdminBookingPatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Невалидни данни", details: parsed.error.flatten() }, { status: 400 });
  }

  const { status, notes } = parsed.data;

  const updates: Record<string, unknown> = { status };
  if (notes !== undefined) updates.notes = notes;
  if (status === "confirmed") {
    updates.confirmed_at = new Date().toISOString();
  }

  const { data, error } = await tenantDb(salonSlug).bookings.updateById(id, updates);

  if (error) return NextResponse.json({ error: "Грешка при запис" }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Не е намерена резервация" }, { status: 404 });

  return NextResponse.json({ booking: data });
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const a = await requireAdminTenantSlugForApi();
  if (!a.ok) return a.response;
  const salonSlug = a.slug;
  const { id } = await ctx.params;
  const current = await tenantDb(salonSlug).bookings.getById(id);
  const { error } = await tenantDb(salonSlug).bookings.deleteById(id);
  if (error) return NextResponse.json({ error: "Грешка при изтриване" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
