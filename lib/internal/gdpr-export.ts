import { createSupabaseServiceRoleClient } from "@/lib/supabase-admin";

/**
 * Platform-level GDPR export helpers — intentionally NOT tenant-scoped.
 * A GDPR data export must cover bookings across ALL salons for the
 * requester's verified email, and gdpr_export_tokens is a platform table
 * with no salon_slug at all. Lives under lib/internal/** so it's exempt
 * from the tenant service-role boundary check (scripts/check-service-role-boundary.mjs).
 */

export type GdprExportTokenRow = {
  id: string;
  email: string;
  phone: string | null;
  expires_at: string;
  used_at: string | null;
};

export async function getGdprExportToken(token: string): Promise<GdprExportTokenRow | null> {
  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("gdpr_export_tokens")
    .select("id, email, phone, expires_at, used_at")
    .eq("token", token)
    .maybeSingle();
  if (error || !data) return null;
  return data as GdprExportTokenRow;
}

export async function markGdprExportTokenUsed(id: string): Promise<void> {
  const supabase = createSupabaseServiceRoleClient();
  await supabase.from("gdpr_export_tokens").update({ used_at: new Date().toISOString() }).eq("id", id);
}

export type GdprExportBookingRow = {
  id: string;
  salon_slug: string;
  booking_date: string;
  booking_time: string;
  service_name: string;
  service_price_eur: number;
  status: string;
  client_name: string;
  client_email: string | null;
  client_phone: string | null;
  notes: string | null;
  created_at: string;
};

/**
 * Query by verified email only. Phone is NOT verified (the token was sent
 * to the email, not the phone), so matching on client_phone too would let
 * an attacker supply a victim's phone number and receive the victim's
 * bookings after verifying only their own email.
 */
export async function listBookingsByEmailAcrossTenants(email: string): Promise<GdprExportBookingRow[]> {
  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("bookings")
    .select(
      "id, salon_slug, booking_date, booking_time, service_name, service_price_eur, status, client_name, client_email, client_phone, notes, created_at"
    )
    .eq("client_email", email)
    .order("booking_date", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as GdprExportBookingRow[];
}
