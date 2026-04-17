import { NextResponse } from "next/server";

import { requireAdminTenantSlugForApi } from "@/lib/admin-tenant";
import { createSupabaseServiceRoleClient } from "@/lib/supabase-admin";

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const a = await requireAdminTenantSlugForApi();
  if (!a.ok) return a.response;
  const salonSlug = a.slug;
  const { id } = await ctx.params;
  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("blocked_slots")
    .delete()
    .eq("id", id)
    .eq("salon_slug", salonSlug)
    .select("id");
  if (error) return NextResponse.json({ error: "Грешка при изтриване" }, { status: 500 });
  if (!data?.length) return NextResponse.json({ error: "Не е намерено" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
