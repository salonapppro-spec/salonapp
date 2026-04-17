import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAdminTenantSlugForApi } from "@/lib/admin-tenant";
import { createSupabaseServiceRoleClient } from "@/lib/supabase-admin";

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

  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("specialists")
    .update(patch)
    .eq("id", id)
    .eq("salon_slug", a.slug)
    .select("*")
    .maybeSingle();

  if (error) return NextResponse.json({ error: "DB update failed" }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Specialist not found" }, { status: 404 });
  return NextResponse.json({ ok: true, specialist: data });
}
