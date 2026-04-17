import { NextResponse } from "next/server";

import { requireAdminTenantSlugForApi } from "@/lib/admin-tenant";
import { createSupabaseServiceRoleClient } from "@/lib/supabase-admin";
import { BlockedSlotCreateSchema } from "@/schemas/blocked-slot-admin";

export async function GET(req: Request) {
  const a = await requireAdminTenantSlugForApi();
  if (!a.ok) return a.response;
  const salonSlug = a.slug;
  const url = new URL(req.url);
  const date = url.searchParams.get("date") ?? "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "Подай date=YYYY-MM-DD" }, { status: 400 });
  }
  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("blocked_slots")
    .select("*")
    .eq("salon_slug", salonSlug)
    .eq("blocked_date", date)
    .is("specialist_id", null)
    .order("start_time", { ascending: true });
  if (error) return NextResponse.json({ error: "Грешка при четене" }, { status: 500 });
  return NextResponse.json({ slots: data ?? [] });
}

export async function POST(req: Request) {
  const a = await requireAdminTenantSlugForApi();
  if (!a.ok) return a.response;
  const salonSlug = a.slug;
  const body = (await req.json().catch(() => null)) as unknown;
  const parsed = BlockedSlotCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Невалидни данни", details: parsed.error.flatten() }, { status: 400 });
  }

  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("blocked_slots")
    .insert({
      salon_slug: salonSlug,
      specialist_id: null,
      blocked_date: parsed.data.blocked_date,
      start_time: parsed.data.start_time,
      end_time: parsed.data.end_time,
      reason: parsed.data.reason ?? null,
    })
    .select("*")
    .maybeSingle();

  if (error) return NextResponse.json({ error: "Грешка при запис" }, { status: 500 });
  return NextResponse.json({ slot: data });
}
