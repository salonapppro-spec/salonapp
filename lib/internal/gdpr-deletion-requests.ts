import { createSupabaseServiceRoleClient } from "@/lib/supabase-admin";

/**
 * Platform-level GDPR deletion request persistence — intentionally NOT
 * tenant-scoped (gdpr_deletion_requests has no salon_slug; a deletion
 * request can reference data across multiple salons for the same email/
 * phone). Lives under lib/internal/** so it's exempt from the tenant
 * service-role boundary check (scripts/check-service-role-boundary.mjs).
 */

export async function insertGdprDeletionRequest(params: {
  name: string;
  email: string;
  phone?: string | null;
  details?: string | null;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = createSupabaseServiceRoleClient();
  const { error } = await supabase.from("gdpr_deletion_requests").insert({
    name: params.name,
    email: params.email,
    phone: params.phone ?? null,
    details: params.details ?? null,
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
