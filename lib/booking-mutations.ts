import type { Booking, HairDensity, HairLength, Service } from "@/types";
import type { CreateBookingInput } from "@/schemas/booking";
import { getBlockedSlotsForDate, getFinancialSettings, getWorkingHoursForDateLive } from "@/lib/data";
import { getTenant } from "@/lib/get-tenant";
import { tenantDb } from "@/lib/tenant-db";
import { normalizePhone } from "@/lib/phone";
import { DEFAULT_WORKING_HOURS_DAYS } from "@/lib/working-hours-defaults";
import { calculateDuration, timeToMinutes } from "@/lib/scheduling";
import { sendConfirmationEmail, sendSalonBookingNotification } from "@/lib/email";
import { todayDateISOInSofia, nowMinutesInSofia } from "@/lib/booking-datetime";
import { rejectIfOutsideScheduleLimits } from "@/lib/booking-schedule-limits";

function isMissingBookingEndTimeColumnError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const e = error as { code?: string; message?: string };
  const msg = (e.message ?? "").toLowerCase();
  return e.code === "42703" || e.code === "PGRST204" || msg.includes("booking_end_time");
}

function isCheckConstraintError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const e = error as { code?: string; message?: string };
  const msg = (e.message ?? "").toLowerCase();
  return e.code === "23514" || msg.includes("check constraint") || msg.includes("violates check constraint");
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
  opts: {
    salonName: string;
    bufferMinutes: number;
    minNoticeMinutes?: number;
    bookingWindowDays?: number | null;
    debugDbErrors?: boolean;
  }
): Promise<CreateBookingResult> {
  const db = tenantDb(data.salon_slug);
  const bufferMinutes = opts.bufferMinutes;

  // Normalize phone once at entry so bookings and clients share the same key.
  // Defense-in-depth: schema validation upstream should already reject this,
  // but a missing/whitespace-only phone must never silently fall back to a
  // placeholder like "00000" — that merges unrelated clients into one
  // phantom record (audit 2026-06-15/16).
  const rawPhone = (data.client_phone ?? "").trim();
  const phoneDigitCount = (rawPhone.match(/\d/g) ?? []).length;
  if (phoneDigitCount < 5) {
    return { ok: false, error: "Невалиден телефон." };
  }
  data = { ...data, client_phone: normalizePhone(rawPhone) || rawPhone };

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

  // Specialist not validated on server (audit 2026-06-15/16) — a crafted
  // request could book a deactivated specialist by id. Also catches the
  // legitimate case where an admin deactivates a specialist who still has
  // services pointing at them via service.specialist_id.
  if (bookingSpecialistId) {
    const { data: specialistRow, error: specialistErr } = await db.specialists.getById(bookingSpecialistId);
    if (specialistErr) {
      return { ok: false, error: "Грешка при проверка на специалиста." };
    }
    const specialist = specialistRow as { is_active?: boolean } | null;
    if (!specialist || !specialist.is_active) {
      return { ok: false, error: "Специалистът не е активен или не съществува." };
    }
  }

  let serviceDuration = service.duration_minutes ?? 0;

  const hairLenAllowed = new Set<string>(["short", "medium", "long"]);
  const hairDenAllowed = new Set<string>(["thin", "medium", "thick"]);
  /** Винаги null за проста услуга — празен низ от клиента нарушава CHECK в Postgres. */
  let hairLength: string | null = null;
  let hairDensity: string | null = null;

  if (service.is_complex) {
    const hl = typeof data.hair_length === "string" ? data.hair_length.trim() : "";
    const hd = typeof data.hair_density === "string" ? data.hair_density.trim() : "";
    if (hairLenAllowed.has(hl) && hairDenAllowed.has(hd)) {
      hairLength = hl;
      hairDensity = hd;
      const calc = calculateDuration(service, hl as HairLength, hd as HairDensity);
      serviceDuration = calc.totalMinutes;
    } else {
      // Hair fields absent/invalid — either the admin has encoded the
      // variation in the service name itself (e.g. "Балеаж дълга коса", a
      // separate service row with its own fixed duration_minutes), or an
      // API caller bypassed the hair-param step entirely (audit
      // 2026-06-15/16). Can't tell which from here, so use the matrix's
      // worst case (long+thick) instead of trusting duration_minutes
      // as-is — never under-allocates the schedule. Harmless for
      // name-encoded services since long+thick is always >= their fixed
      // duration_minutes when the matrix is configured consistently.
      const worstCase = calculateDuration(service, "long", "thick");
      serviceDuration = Math.max(serviceDuration, worstCase.totalMinutes);
    }
  }

  if (serviceDuration <= 0) {
    return { ok: false, error: "Услугата няма валидна продължителност." };
  }

  const { data: existing, error: existingErr } = await db.bookings.listConflictRows(data.booking_date, bookingSpecialistId);

  if (existingErr) {
    return { ok: false, error: "Грешка при проверка на часовете." };
  }

  const start = timeToMinutes(data.booking_time);
  const serviceEnd = start + serviceDuration;
  const end = serviceEnd + bufferMinutes;

  if (serviceEnd > 24 * 60) {
    return { ok: false, error: "Часът не може да приключи след полунощ. Моля изберете по-ранен час." };
  }

  // Reject past bookings
  const todayStr = todayDateISOInSofia();
  if (data.booking_date < todayStr) {
    return { ok: false, error: "Не може да се запази час за минала дата." };
  }
  if (data.booking_date === todayStr && start < nowMinutesInSofia()) {
    return { ok: false, error: "Не може да се запази час за вече минал час." };
  }

  const scheduleReject = rejectIfOutsideScheduleLimits({
    bookingDate: data.booking_date,
    bookingStartMinutes: start,
    todayStr,
    nowMinutes: nowMinutesInSofia(),
    minNoticeMinutes: opts.minNoticeMinutes ?? 30,
    bookingWindowDays: opts.bookingWindowDays,
  });
  if (scheduleReject) return scheduleReject;

  const [yy, mm, dd] = data.booking_date.split("-").map(Number);
  const dayOfWeek = Number.isFinite(yy) && Number.isFinite(mm) && Number.isFinite(dd)
    ? new Date(Date.UTC(yy, mm - 1, dd)).getUTCDay()
    : NaN;
  if (!Number.isFinite(dayOfWeek)) {
    return { ok: false, error: "Невалидна дата за резервация." };
  }

  const dayRow = await getWorkingHoursForDateLive({
    salonSlug: data.salon_slug,
    specialistId: bookingSpecialistId ?? undefined,
    dayOfWeek,
  });
  const fallback = DEFAULT_WORKING_HOURS_DAYS[dayOfWeek] ?? { start_time: "09:00", end_time: "18:00", is_day_off: false };
  const workingDay = dayRow ?? {
    ...fallback,
    day_of_week: dayOfWeek,
    specialist_id: bookingSpecialistId,
    id: `fallback-${data.salon_slug}-${dayOfWeek}`,
    salon_slug: data.salon_slug,
  };
  if (workingDay.is_day_off) {
    return { ok: false, error: "Денят е отбелязан като почивен. Изберете друга дата." };
  }
  const dayStart = timeToMinutes(workingDay.start_time);
  const dayEnd = timeToMinutes(workingDay.end_time);
  if (start < dayStart || serviceEnd > dayEnd) {
    return { ok: false, error: `Часът е извън работното време (${workingDay.start_time}–${workingDay.end_time}).` };
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

  const baseInsertRow = {
    salon_slug: data.salon_slug,
    specialist_id: bookingSpecialistId,
    service_id: service.id,
    service_name: service.name,
    service_price_eur: Number(service.price_eur),
    service_duration: serviceDuration,
    booking_date: data.booking_date,
    booking_time: normalizeTimeForDb(data.booking_time),
    client_name: data.client_name,
    client_phone: data.client_phone,
    client_email: data.client_email ?? null,
    notes: data.notes ?? null,
    status: "pending" as const,
  };

  const insertRow = {
    ...baseInsertRow,
    booking_end_time: normalizeTimeForDb(endTime),
    hair_length: hairLength,
    hair_density: hairDensity,
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

  // Compatibility fallback: some production tenants may have legacy/strict hair checks.
  // If CHECK fails, retry without hair fields (they are optional business metadata).
  if (error && isCheckConstraintError(error)) {
    const compatInsertRow: Record<string, unknown> = { ...baseInsertRow, booking_end_time: normalizeTimeForDb(endTime) };
    const retriedCompat = await db.bookings.create(compatInsertRow);
    createdRaw = retriedCompat.data;
    error = retriedCompat.error;
    created = createdRaw as Booking | null;
  }

  // Legacy compatibility on top of CHECK fallback if booking_end_time is missing in old schemas.
  if (error && isMissingBookingEndTimeColumnError(error)) {
    const legacyCompatInsertRow: Record<string, unknown> = { ...baseInsertRow };
    const retriedLegacyCompat = await db.bookings.create(legacyCompatInsertRow);
    createdRaw = retriedLegacyCompat.data;
    error = retriedLegacyCompat.error;
    created = createdRaw as Booking | null;
  }

  if (error) {
    console.error("[runCreateBooking] bookings.insert failed", {
      salon_slug: data.salon_slug,
      insert_payload: {
        service_id: service.id,
        specialist_id: bookingSpecialistId,
        booking_date: data.booking_date,
        booking_time: normalizeTimeForDb(data.booking_time),
        booking_end_time: normalizeTimeForDb(endTime),
        status: "pending",
        hair_length: hairLength,
        hair_density: hairDensity,
      },
      code: error.code,
      message: error.message,
      details: error.details,
    });
    if (error.code === "23P01") {
      return { ok: false, error: "Този час току-що беше зает. Моля изберете друг.", code: "23P01" };
    }
    if (opts.debugDbErrors) {
      const raw = [error.code, error.message, error.details].filter(Boolean).join(" | ");
      return { ok: false, error: `DB: ${raw || "unknown_error"}` };
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
      await sendSalonBookingNotification(created as Booking, tenant);
    }
  } catch (e) {
    console.error("[runCreateBooking] sendConfirmationEmail failed (booking already saved)", e);
  }

  return { ok: true, bookingId };
}

export async function loadCreateBookingContext(salonSlug: string): Promise<{
  salonName: string;
  bufferMinutes: number;
  minNoticeMinutes: number;
  bookingWindowDays: number | null;
} | null> {
  const { data: tenantRaw } = await tenantDb(salonSlug).tenant.getSalonName();
  const tenant = tenantRaw as { salon_name?: string | null } | null;
  if (!tenant?.salon_name) return null;
  const settings = await getFinancialSettings(salonSlug);
  const bufferMinutes = Number(settings?.buffer_minutes ?? 10);
  const minNoticeMinutes = Number(settings?.booking_min_notice_minutes ?? 30);
  const bookingWindowDays =
    settings?.booking_window_days != null ? Number(settings.booking_window_days) : null;
  return { salonName: tenant.salon_name, bufferMinutes, minNoticeMinutes, bookingWindowDays };
}
