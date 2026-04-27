import { createSupabaseServiceRoleClient } from "@/lib/supabase-admin";

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

type RecoverArgs = {
  userId: string;
  email: string | null | undefined;
  appMetadata?: Record<string, unknown> | null;
  userMetadata?: Record<string, unknown> | null;
};

/**
 * Best-effort owner recovery when auth metadata slug is stale/missing.
 * Uses tenants.owner_email as source of truth and rewrites auth metadata.
 */
export async function recoverOwnerTenantSlug(args: RecoverArgs): Promise<string | null> {
  const email = typeof args.email === "string" ? args.email.trim().toLowerCase() : "";
  if (!email) return null;

  const admin = createSupabaseServiceRoleClient();
  const { data: tenant, error } = await admin
    .from("tenants")
    .select("salon_slug")
    .eq("owner_email", email)
    .limit(1)
    .maybeSingle();

  if (error || !tenant?.salon_slug || !SLUG_RE.test(tenant.salon_slug)) return null;

  const nextSlug = tenant.salon_slug;
  const appMeta = (args.appMetadata ?? {}) as Record<string, unknown>;
  const userMeta = (args.userMetadata ?? {}) as Record<string, unknown>;

  const { error: updateErr } = await admin.auth.admin.updateUserById(args.userId, {
    app_metadata: { ...appMeta, role: "owner", salon_slug: nextSlug },
    user_metadata: { ...userMeta, salon_slug: nextSlug },
  });
  if (updateErr) return null;

  return nextSlug;
}
