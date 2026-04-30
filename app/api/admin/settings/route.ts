import { revalidatePath, revalidateTag } from "next/cache";
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
  const rawBody = body && typeof body === "object" && !Array.isArray(body) ? (body as Record<string, unknown>) : {};
  const parsed = UpdateTenantPublicFieldsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Невалидни данни" },
      { status: 400 },
    );
  }

  const data = parsed.data;
  const { maps_pin_lat: pinLat, maps_pin_lng: pinLng, ...rest } = data;
  const patch = normalizeTenantSettingsPatch(rest as Record<string, unknown>) as Record<string, unknown>;

  const hasPinUpdate = "maps_pin_lat" in rawBody || "maps_pin_lng" in rawBody;
  if (hasPinUpdate) {
    const { data: row, error: fetchErr } = await tenantDb(salonSlug).tenant.getDesignTokens();
    if (fetchErr) {
      console.error(`[admin/settings] design_tokens fetch failed for ${salonSlug}:`, fetchErr.message);
      return NextResponse.json({ error: "internal_error" }, { status: 500 });
    }
    const rowTyped = row as { design_tokens?: unknown } | null;
    const current = (rowTyped?.design_tokens ?? null) as Record<string, unknown> | null;
    const next: Record<string, unknown> = { ...(current && typeof current === "object" && !Array.isArray(current) ? current : {}) };
    if (pinLat !== undefined && pinLng !== undefined) {
      next.maps_pin = { lat: pinLat, lng: pinLng };
    } else {
      delete next.maps_pin;
    }
    patch.design_tokens = next;
  }

  const { error } = await tenantDb(salonSlug).tenant.updatePublicFields(patch);
  if (error) {
    console.error(`[admin/settings] DB update failed for ${salonSlug}:`, error.message);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }

  // Invalidate the public salon page so changes appear immediately
  revalidatePath(`/${salonSlug}`);
  revalidateTag(`tenant-${salonSlug}`);

  return NextResponse.json({ ok: true });
}

