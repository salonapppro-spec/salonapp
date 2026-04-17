import type { Booking, HairDensity, HairLength, Service } from "@/types";
import type { CreateBookingInput } from "@/schemas/booking";
import { createSupabaseServiceRoleClient } from "@/lib/supabase-admin";
import { getBlockedSlotsForDate, getFinancialSettings } from "@/lib/data";
import { getTenant } from "@/lib/get-tenant";
import { calculateDuration, timeToMinutes } from "@/lib/scheduling";
import { sendConfirmationEmail } from "@/lib/email";
function addMinutesToTime(time: string, durationMinutes: number): string {
  const [h, m] = time.split(":").map(Number);
  const total = h * 60 + m + durationMinutes;
  const hh = Math.floor(total / 60) % 24;
  const mm = total % 60;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

/** Postgres `time` — нормализира до HH:MM:SS */
export function normalizeTimeForDb(time: string): string {
  const parts = time.split(":");
  const h = parts[0] ?? "0";
  const m = parts[1] ?? "00";
  const s = parts[2] ?? "00";
  return `${h.padStart(2, "0")}:${m.padStart(2, "0")}:${s.padStart(2, "0")}`;
}

export type CreateBookingResult =
  | { ok: true; bookingId: string }
  | { ok: false; error: string; code?: string };

export async function runCreateBooking(
  data: CreateBookingInput,
  opts: { salonName: string; bufferMinutes: number }
): Promise<CreateBookingResult> {
  const supabase = createSupabaseServiceRoleClient();
  const bufferMinutes = opts.bufferMinutes;

  let serviceDuration = data.service_duration;

  if (data.service_id && data.hair_length && data.hair_density) {
    const { data: serviceRow } = await supabase
      .from("services")
      .select("*")
      .eq("salon_slug", data.salon_slug)
      .eq("id", data.service_id)
      .limit(1)
      .maybeSingle();

    const service = serviceRow as Service | null;
    if (service?.is_complex) {
      const calc = calculateDuration(
        service,
        data.hair_length as HairLength,
        data.hair_density as HairDensity
      );
      serviceDuration = calc.totalMinutes;
    }
  }

  const { data: existing, error: existingErr } = await supabase
    .from("bookings")
    .select("booking_time,service_duration,status,booking_end_time")
    .eq("salon_slug", data.salon_slug)
    .eq("booking_date", data.booking_date)
    .eq("specialist_id", data.specialist_id ?? null);

  if (existingErr) {
    return { ok: false, error: "Грешка при проверка на часовете." };
  }

  const start = timeToMinutes(data.booking_time);
  const end = start + serviceDuration + bufferMinutes;

  for (const b of (existing ?? []) as Array<{
    booking_time: string;
    service_duration: number;
    status: string;
    booking_end_time: string | null;
  }>) {
    if (b.status === "cancelled" || b.status === "no_show") continue;
    const bs = timeToMinutes(b.booking_time);
    const be = b.booking_end_time
      ? timeToMinutes(b.booking_end_time)
      : bs + Number(b.service_duration) + bufferMinutes;
    if (start < be && bs < end) {
      return { ok: false, error: "Този час току-що беше зает. Моля изберете друг." };
    }
  }

  const blockedSlots = await getBlockedSlotsForDate({
    salonSlug: data.salon_slug,
    specialistId: data.specialist_id,
    date: data.booking_date,
  });
  for (const bl of blockedSlots) {
    const bs = timeToMinutes(bl.start_time);
    const be = timeToMinutes(bl.end_time);
    if (start < be && bs < end) {
      return { ok: false, error: "Този интервал е блокиран. Моля изберете друг час." };
    }
  }

  const endTime = addMinutesToTime(data.booking_time, serviceDuration + bufferMinutes);

  const insertRow = {
    salon_slug: data.salon_slug,
    specialist_id: data.specialist_id ?? null,
    service_id: data.service_id ?? null,
    service_name: data.service_name,
    service_price_eur: data.service_price_eur,
    service_duration: serviceDuration,
    booking_date: data.booking_date,
    booking_time: normalizeTimeForDb(data.booking_time),
    booking_end_time: normalizeTimeForDb(endTime),
    client_name: data.client_name,
    client_phone: data.client_phone,
    client_email: data.client_email ?? null,
    notes: data.notes ?? null,
    hair_length: data.hair_length ?? null,
    hair_density: data.hair_density ?? null,
    status: "pending" as const,
  };

  const { data: created, error } = await supabase.from("bookings").insert(insertRow).select("*").maybeSingle();

  if (error) {
    if (error.code === "23P01") {
      return { ok: false, error: "Този час току-що беше зает. Моля изберете друг.", code: "23P01" };
    }
    return { ok: false, error: "Неуспешно записване. Опитайте отново." };
  }

  const bookingId = created?.id;
  if (!bookingId || !created) {
    return { ok: false, error: "Неуспешно записване. Опитайте отново." };
  }

  await supabase.from("clients").upsert(
    {
      salon_slug: data.salon_slug,
      phone: data.client_phone,
      name: data.client_name,
      email: data.client_email ?? null,
      specialist_id: data.specialist_id ?? null,
    },
    { onConflict: "salon_slug,phone" }
  );

  const tenant = await getTenant(data.salon_slug);
  if (tenant) {
    await sendConfirmationEmail(created as Booking, tenant);
  }

  return { ok: true, bookingId };
}

export async function loadCreateBookingContext(salonSlug: string): Promise<{
  salonName: string;
  bufferMinutes: number;
} | null> {
  const supabase = createSupabaseServiceRoleClient();
  const { data: tenant } = await supabase.from("tenants").select("salon_name").eq("salon_slug", salonSlug).maybeSingle();
  if (!tenant?.salon_name) return null;
  const settings = await getFinancialSettings(salonSlug);
  const bufferMinutes = Number(settings?.buffer_minutes ?? 10);
  return { salonName: tenant.salon_name, bufferMinutes };
}
