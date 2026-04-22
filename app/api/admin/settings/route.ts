import { revalidatePath } from "next/cache";
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

  // Normalize logo_url: empty string → null
  if (Object.prototype.hasOwnProperty.call(patch, "logo_url")) {
    const v = patch.logo_url;
    patch.logo_url = typeof v === "string" && v.trim() === "" ? null : v;
  }
  // Normalize other optional URL fields the same way
  for (const key of ["hero_image_url", "about_image_url"] as const) {
    if (Object.prototype.hasOwnProperty.call(patch, key)) {
      const v = patch[key];
      patch[key] = typeof v === "string" && v.trim() === "" ? null : v;
    }
  }

  const { error } = await supabase.from("tenants").update(patch).eq("salon_slug", salonSlug);
  if (error) {
    console.error(`[admin/settings] DB update failed for ${salonSlug}:`, error.message);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }

  // Invalidate the public salon page so changes appear immediately
  revalidatePath(`/${salonSlug}`);

  return NextResponse.json({ ok: true });
}

