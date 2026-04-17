import type { GalleryItem, Service, Tenant, WorkingHours, BlockedSlot, Booking } from "@/types";
import { createSupabaseServiceRoleClient } from "@/lib/supabase-server";

export async function getTenantBySalonSlug(salonSlug: string): Promise<Tenant | null> {
  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("tenants")
    .select("*")
    .eq("salon_slug", salonSlug)
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return (data as Tenant | null) ?? null;
}

export async function getServices(salonSlug: string): Promise<Service[]> {
  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("services")
    .select("*")
    .eq("salon_slug", salonSlug)
    .eq("is_active", true)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data as Service[]) ?? [];
}

export async function getGallery(salonSlug: string): Promise<GalleryItem[]> {
  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("gallery")
    .select("*")
    .eq("salon_slug", salonSlug)
    .eq("is_visible", true)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return (data as GalleryItem[]) ?? [];
}

export async function getFinancialSettings(salonSlug: string) {
  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("financial_settings")
    .select("*")
    .eq("salon_slug", salonSlug)
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data ?? null;
}

export async function getWorkingHoursForDate(params: {
  salonSlug: string;
  specialistId?: string;
  dayOfWeek: number; // 0-6
}): Promise<WorkingHours | null> {
  const { salonSlug, specialistId, dayOfWeek } = params;
  const supabase = createSupabaseServiceRoleClient();
  let q = supabase
    .from("working_hours")
    .select("*")
    .eq("salon_slug", salonSlug)
    .eq("day_of_week", dayOfWeek)
    .limit(1);
  if (specialistId) q = q.eq("specialist_id", specialistId);
  const { data, error } = await q.maybeSingle();
  if (error) throw error;
  return (data as WorkingHours | null) ?? null;
}

export async function getBookingsForDate(params: {
  salonSlug: string;
  specialistId?: string;
  date: string; // YYYY-MM-DD
}): Promise<Booking[]> {
  const { salonSlug, specialistId, date } = params;
  const supabase = createSupabaseServiceRoleClient();
  let q = supabase
    .from("bookings")
    .select("*")
    .eq("salon_slug", salonSlug)
    .eq("booking_date", date)
    .not("status", "in", "(cancelled,no_show)");
  if (specialistId) q = q.eq("specialist_id", specialistId);
  const { data, error } = await q.order("booking_time", { ascending: true });
  if (error) throw error;
  return (data as Booking[]) ?? [];
}

export async function getBlockedSlotsForDate(params: {
  salonSlug: string;
  specialistId?: string;
  date: string; // YYYY-MM-DD
}): Promise<BlockedSlot[]> {
  const { salonSlug, specialistId, date } = params;
  const supabase = createSupabaseServiceRoleClient();
  let q = supabase
    .from("blocked_slots")
    .select("*")
    .eq("salon_slug", salonSlug)
    .eq("blocked_date", date);
  if (specialistId) q = q.eq("specialist_id", specialistId);
  const { data, error } = await q.order("start_time", { ascending: true });
  if (error) throw error;
  return (data as BlockedSlot[]) ?? [];
}

