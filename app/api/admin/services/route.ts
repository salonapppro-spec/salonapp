import { NextResponse } from "next/server";

import { requireAdminTenantSlugForApi } from "@/lib/admin-tenant";
import { CreateServiceSchema } from "@/schemas/service";
import { createSupabaseServiceRoleClient } from "@/lib/supabase-admin";

export async function GET() {
  const a = await requireAdminTenantSlugForApi();
  if (!a.ok) return a.response;
  const salonSlug = a.slug;
  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("services")
    .select("*")
    .eq("salon_slug", salonSlug)
    .order("created_at", { ascending: true });
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

  const supabase = createSupabaseServiceRoleClient();
  const row = { ...parsed.data, salon_slug: salonSlug };
  const { data, error } = await supabase.from("services").insert(row).select("*").maybeSingle();
  if (error) return NextResponse.json({ error: "DB insert failed" }, { status: 500 });
  return NextResponse.json({ service: data });
}
