import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAdminTenantSlugForApi } from "@/lib/admin-tenant";
import { getBookingsForClientPhoneAdmin, getClientByIdAdmin } from "@/lib/data";
import { createSupabaseServiceRoleClient } from "@/lib/supabase-admin";

const PatchSchema = z.object({
  name: z.string().min(1).optional(),
  phone: z.string().min(5).optional(),
  email: z.union([z.string().email(), z.literal(""), z.null()]).optional(),
  notes: z.string().max(5000).nullable().optional(),
});

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const a = await requireAdminTenantSlugForApi();
  if (!a.ok) return a.response;
  const salonSlug = a.slug;
  const { id } = await ctx.params;

  const client = await getClientByIdAdmin(salonSlug, id);
  if (!client) return NextResponse.json({ error: "Не е намерен" }, { status: 404 });
  const phoneKey = (client.phone ?? "").trim();
  if (!phoneKey) return NextResponse.json({ error: "Клиентът няма телефон" }, { status: 404 });

  const bookings = await getBookingsForClientPhoneAdmin(salonSlug, phoneKey);
  const completed = bookings.filter((b) => b.status === "completed");
  const totalRevenue = completed.reduce((s, b) => s + Number(b.service_price_eur), 0);
  const byService = new Map<string, number>();
  for (const b of bookings) {
    byService.set(b.service_name, (byService.get(b.service_name) ?? 0) + 1);
  }
  const topServices = Array.from(byService.entries())
    .sort((x, y) => y[1] - x[1])
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }));

  return NextResponse.json({
    client,
    bookings,
    stats: {
      totalRevenue,
      bookingCount: bookings.length,
      completedCount: completed.length,
      noShowCount: bookings.filter((b) => b.status === "no_show").length,
      topServices,
    },
  });
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const a = await requireAdminTenantSlugForApi();
  if (!a.ok) return a.response;
  const salonSlug = a.slug;
  const { id } = await ctx.params;
  const body = (await req.json().catch(() => null)) as unknown;
  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Невалидни данни" }, { status: 400 });

  const patch = { ...parsed.data };
  if (patch.email === "") patch.email = null;

  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("clients")
    .update(patch)
    .eq("id", id)
    .eq("salon_slug", salonSlug)
    .select("*")
    .maybeSingle();
  if (error) return NextResponse.json({ error: "Грешка при запис" }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Не е намерен" }, { status: 404 });
  return NextResponse.json({ client: data });
}

/** GDPR: анонимизира резервации по телефон, изтрива клиента. */
export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const a = await requireAdminTenantSlugForApi();
  if (!a.ok) return a.response;
  const salonSlug = a.slug;
  const { id } = await ctx.params;

  const client = await getClientByIdAdmin(salonSlug, id);
  if (!client) return NextResponse.json({ error: "Не е намерен" }, { status: 404 });
  const phoneKey = (client.phone ?? "").trim();
  if (!phoneKey) return NextResponse.json({ error: "Липсва телефон" }, { status: 400 });

  const supabase = createSupabaseServiceRoleClient();
  const { error: uErr } = await supabase
    .from("bookings")
    .update({
      client_name: "Анонимизиран",
      client_email: null,
      client_phone: `anon-${id.slice(0, 8)}`,
    })
    .eq("salon_slug", salonSlug)
    .eq("client_phone", phoneKey);

  if (uErr) return NextResponse.json({ error: "Грешка при анонимизация" }, { status: 500 });

  const { error: dErr } = await supabase.from("clients").delete().eq("id", id).eq("salon_slug", salonSlug);
  if (dErr) return NextResponse.json({ error: "Грешка при изтриване" }, { status: 500 });

  return NextResponse.json({ ok: true });
}
