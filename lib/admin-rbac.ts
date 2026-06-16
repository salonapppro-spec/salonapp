import { NextResponse } from "next/server";

import { resolveAdminTenantSlug } from "@/lib/admin-tenant";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { tenantDb } from "@/lib/tenant-db";

export type AdminCapability =
  | "settings_write"
  | "finances_write"
  | "clients_export"
  | "specialists_manage"
  | "services_write"
  | "gallery_write"
  | "clients_write"
  | "schedule_write";

export type AdminRole = "owner" | "technical_admin" | "specialist_staff";

export type AdminActor = {
  salonSlug: string;
  role: AdminRole;
  specialistId: string | null;
};

const OWNER_CAPS: AdminCapability[] = [
  "settings_write",
  "finances_write",
  "clients_export",
  "specialists_manage",
  "services_write",
  "gallery_write",
  "clients_write",
  "schedule_write",
];

const SPECIALIST_CAPS: AdminCapability[] = ["clients_write", "schedule_write"];

function specialistIdFromAppMetadata(appMetadata: Record<string, unknown> | undefined): string | null {
  const sid = appMetadata?.specialist_id;
  return typeof sid === "string" && sid.trim().length > 0 ? sid.trim() : null;
}

export async function resolveAdminActor(salonSlug: string): Promise<AdminActor | null> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;

  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;

  const roleMeta = data.user.app_metadata?.role;
  if (roleMeta === "super_admin") {
    return { salonSlug, role: "owner", specialistId: null };
  }

  if (roleMeta === "owner") {
    return { salonSlug, role: "owner", specialistId: null };
  }

  const specialistId = specialistIdFromAppMetadata(
    (data.user.app_metadata ?? undefined) as Record<string, unknown> | undefined
  );
  if (!specialistId) return null;

  const { data: spec } = await tenantDb(salonSlug).specialists.getById(specialistId);
  const row = spec as { id: string; is_technical_admin: boolean } | null;
  if (!row) return null;

  if (row.is_technical_admin) {
    return { salonSlug, role: "technical_admin", specialistId: row.id };
  }

  return { salonSlug, role: "specialist_staff", specialistId: row.id };
}

export function adminActorHasCapability(actor: AdminActor, capability: AdminCapability): boolean {
  if (actor.role === "owner" || actor.role === "technical_admin") {
    return OWNER_CAPS.includes(capability);
  }
  return SPECIALIST_CAPS.includes(capability);
}

export type AdminCapabilityApiResult =
  | { ok: true; slug: string; actor: AdminActor }
  | { ok: false; response: NextResponse };

/** API routes: tenant + backend capability (403 when role is too low). */
export async function requireAdminCapabilityForApi(
  capability: AdminCapability
): Promise<AdminCapabilityApiResult> {
  const slug = await resolveAdminTenantSlug();
  if (!slug) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized", code: "ADMIN_TENANT_REQUIRED" }, { status: 401 }),
    };
  }

  const actor = await resolveAdminActor(slug);
  if (!actor) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized", code: "ADMIN_ACTOR_REQUIRED" }, { status: 401 }),
    };
  }

  if (!adminActorHasCapability(actor, capability)) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Forbidden", code: "ADMIN_CAPABILITY_DENIED" }, { status: 403 }),
    };
  }

  return { ok: true, slug, actor };
}
