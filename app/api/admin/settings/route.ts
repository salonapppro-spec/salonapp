import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { requireAdminTenantSlugForApi } from "@/lib/admin-tenant";
import { normalizeTenantSettingsPatch } from "@/lib/settings-normalization";
import { UpdateTenantPublicFieldsSchema } from "@/schemas/settings";
import { tenantDb } from "@/lib/tenant-db";

export async function POST(req: Request) {
  const a = await requireAdminTenantSlugForApi();
  if (!a.ok) return a.response;
  const salonSlug = a.slug;

  const body = (await req.json().catch(() => null)) as unknown;
  const parsed = UpdateTenantPublicFieldsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Невалидни данни" },
      { status: 400 },
    );
  }

  const patch = normalizeTenantSettingsPatch(parsed.data as Record<string, unknown>);

  const { error } = await tenantDb(salonSlug).tenant.updatePublicFields(patch);
  if (error) {
    console.error(`[admin/settings] DB update failed for ${salonSlug}:`, error.message);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }

  // Invalidate the public salon page so changes appear immediately
  revalidatePath(`/${salonSlug}`);

  return NextResponse.json({ ok: true });
}

