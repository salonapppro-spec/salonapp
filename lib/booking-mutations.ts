import type { Booking, HairDensity, HairLength, Service } from "@/types";
import type { CreateBookingInput } from "@/schemas/booking";
import { getBlockedSlotsForDate, getFinancialSettings } from "@/lib/data";
import { getTenant } from "@/lib/get-tenant";
import { tenantDb } from "@/lib/tenant-db";
import { calculateDuration, timeToMinutes } from "@/lib/scheduling";
import { sendConfirmationEmail } from "@/lib/email";

function isMissingBookingEndTimeColumnError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const e = error as { code?: string; message?: string };
  const msg = (e.message ?? "").toLowerCase();
  return e.code === "42703" || e.code === "PGRST204" || msg.includes("booking_end_time");
}

function insertErrorMessage(error: { code?: string; message?: string; details?: string }): string {
  const code = error.code ?? "";
  const msg = (error.message ?? "").toLowerCase();
  if (code === "23514" || msg.includes("check constraint") || msg.includes("violates check constraint")) {
    return "Данните не отговарят на правилата в базата (проверка). Опитайте друга услуга или час.";
  }
  if (code === "23502" || msg.includes("not null")) {
    return "Липсва задължително поле за резервацията. Свържете се с поддръжка.";
  }
  if (code === "23503" || msg.includes("foreign key")) {
    return "Невалидна услуга или специалист. Презаредете страницата и опитайте отново.";
  }
  return "Неуспешно записване. Опитайте отново.";
}
function addMinutesToTime(time: string, durationMinutes: number): string {
  const [h, m] = time.split(":").map(Number);
  const total = h * 60 + m + durationMinutes;
  const hh = Math.floor(total / 60);
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
  const db = tenantDb(data.salon_slug);
  const bufferMinutes = opts.bufferMinutes;

  const { data: serviceRow, error: serviceErr } = await db.services.getActiveById(data.service_id);

  if (serviceErr) {
    return { ok: false, error: "Грешка при проверка на услугата." };
  }

  const service = serviceRow as Service | null;
  if (!service) {
    return { ok: false, error: "Услугата не е намерена или не е активна." };
  }

  if (service.specialist_id && data.specialist_id && service.specialist_id !== data.specialist_id) {
    return { ok: false, error: "Услугата не принадлежи на избрания специалист." };
  }

  const bookingSpecialistId = data.specialist_id ?? service.specialist_id ?? null;
  let serviceDuration = service.duration_minutes ?? 0;

  if (service.is_complex) {
    if (!data.hair_length || !data.hair_density) {
      return { ok: false, error: "Изберете дължина и гъстота за тази услуга." };
    }

    const calc = calculateDuration(
      service,
      data.hair_length as HairLength,
      data.hair_density as HairDensity
    );
    serviceDuration = calc.totalMinutes;
  }

  if (serviceDuration <= 0) {
    return { ok: false, error: "Услугата няма валидна продължителност." };
  }

  const { data: existing, error: existingErr } = await db.bookings.listConflictRows(data.booking_date, bookingSpecialistId);

  if (existingErr) {
    return { ok: false, error: "Грешка при проверка на часовете." };
  }

  const start = timeToMinutes(data.booking_time);
  const end = start + serviceDuration + bufferMinutes;

  if (end > 24 * 60) {
    return { ok: false, error: "Часът не може да приключи след полунощ. Моля изберете по-ранен час." };
  }

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
    specialistId: bookingSpecialistId ?? undefined,
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
    specialist_id: bookingSpecialistId,
    service_id: service.id,
    service_name: service.name,
    service_price_eur: Number(service.price_eur),
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

  let { data: createdRaw, error } = await db.bookings.create(insertRow);
  let created = createdRaw as Booking | null;

  if (error && isMissingBookingEndTimeColumnError(error)) {
    const legacyInsertRow = { ...insertRow } as Record<string, unknown>;
    delete legacyInsertRow.booking_end_time;
    const retried = await db.bookings.create(legacyInsertRow);
    createdRaw = retried.data;
    error = retried.error;
    created = createdRaw as Booking | null;
  }

  if (error) {
    console.error("[runCreateBooking] bookings.insert failed", {
      salon_slug: data.salon_slug,
      code: error.code,
      message: error.message,
      details: error.details,
    });
    if (error.code === "23P01") {
      return { ok: false, error: "Този час току-що беше зает. Моля изберете друг.", code: "23P01" };
    }
    return { ok: false, error: insertErrorMessage(error) };
  }

  const bookingId = created?.id;
  if (!bookingId || !created) {
    console.error("[runCreateBooking] insert returned no row", { salon_slug: data.salon_slug });
    return { ok: false, error: "Неуспешно записване. Опитайте отново." };
  }

  try {
    const { error: upsertErr } = await db.clients.upsertByPhone({
      phone: data.client_phone,
      name: data.client_name,
      email: data.client_email ?? null,
      specialist_id: bookingSpecialistId,
    });
    if (upsertErr) {
      console.error("[runCreateBooking] clients.upsertByPhone failed (booking already saved)", upsertErr);
    }
  } catch (e) {
    console.error("[runCreateBooking] clients.upsertByPhone threw (booking already saved)", e);
  }

  try {
    const tenant = await getTenant(data.salon_slug);
    if (tenant) {
      await sendConfirmationEmail(created as Booking, tenant);
    }
  } catch (e) {
    console.error("[runCreateBooking] sendConfirmationEmail failed (booking already saved)", e);
  }

  return { ok: true, bookingId };
}

export async function loadCreateBookingContext(salonSlug: string): Promise<{
  salonName: string;
  bufferMinutes: number;
} | null> {
  const { data: tenantRaw } = await tenantDb(salonSlug).tenant.getSalonName();
  const tenant = tenantRaw as { salon_name?: string | null } | null;
  if (!tenant?.salon_name) return null;
  const settings = await getFinancialSettings(salonSlug);
  const bufferMinutes = Number(settings?.buffer_minutes ?? 10);
  return { salonName: tenant.salon_name, bufferMinutes };
}
