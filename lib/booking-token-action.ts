import { SLUG_RE } from "@/lib/routing/constants";
import { createSupabaseServiceRoleClient } from "@/lib/supabase-admin";

export function parseBookingTokenSalonSlug(raw: string | null | undefined): string | null {
  const salonSlug = raw?.trim() ?? "";
  if (!salonSlug || !SLUG_RE.test(salonSlug)) return null;
  return salonSlug;
}

export function bookingTokenActionQuery(salonSlug: string): string {
  return `salon=${encodeURIComponent(salonSlug)}`;
}

export async function findBookingByToken(
  token: string,
  salonSlug: string | null,
  select: string
): Promise<Record<string, unknown> | null> {
  const supabase = createSupabaseServiceRoleClient();
  let query = supabase.from("bookings").select(select).eq("confirmation_token", token);
  if (salonSlug) {
    query = query.eq("salon_slug", salonSlug);
  }
  const { data, error } = await query.maybeSingle();
  if (error || !data) return null;
  return data as unknown as Record<string, unknown>;
}
