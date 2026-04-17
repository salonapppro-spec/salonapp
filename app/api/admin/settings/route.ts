import { NextResponse } from "next/server";

import { requireAdminTenantSlugForApi } from "@/lib/admin-tenant";
import { UpdateTenantPublicFieldsSchema } from "@/schemas/settings";
import { createSupabaseServiceRoleClient } from "@/lib/supabase-admin";

export async function POST(req: Request) {
  const a = await requireAdminTenantSlugForApi();
  if (!a.ok) return a.response;
  const salonSlug = a.slug;

  const body = (await req.json().catch(() => null)) as unknown;
  const parsed = UpdateTenantPublicFieldsSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  const supabase = createSupabaseServiceRoleClient();

  const patch: Record<string, unknown> = { ...parsed.data };
  delete patch.salon_slug;

  if (Object.prototype.hasOwnProperty.call(patch, "logo_url")) {
    const v = patch.logo_url;
    patch.logo_url = typeof v === "string" && v.trim() === "" ? null : v;
  }

  const { error } = await supabase.from("tenants").update(patch).eq("salon_slug", salonSlug);
  if (error) return NextResponse.json({ error: "DB update failed" }, { status: 500 });

  return NextResponse.json({ ok: true });
}

