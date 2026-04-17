import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAdminTenantSlugForApi } from "@/lib/admin-tenant";
import { createSupabaseServiceRoleClient } from "@/lib/supabase-admin";

const CreateSpecialistSchema = z.object({
  name: z.string().min(1).max(120),
});

export async function GET() {
  const a = await requireAdminTenantSlugForApi();
  if (!a.ok) return a.response;

  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase.from("specialists").select("*").eq("salon_slug", a.slug).order("created_at", { ascending: true });
  if (error) return NextResponse.json({ error: "DB read failed" }, { status: 500 });
  return NextResponse.json({ specialists: data ?? [] });
}

export async function POST(req: Request) {
  const a = await requireAdminTenantSlugForApi();
  if (!a.ok) return a.response;

  const body = (await req.json().catch(() => null)) as unknown;
  const parsed = CreateSpecialistSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("specialists")
    .insert({
      salon_slug: a.slug,
      name: parsed.data.name.trim(),
      is_active: true,
    })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: "DB create failed" }, { status: 500 });
  return NextResponse.json({ ok: true, specialist: data });
}
