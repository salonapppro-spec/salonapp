import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAdminTenantSlugForApi } from "@/lib/admin-tenant";
import { todayDateISOInSofia, nowMinutesInSofia } from "@/lib/booking-datetime";
import {
  getBlockedSlotsForDate,
  getBookingsForDateAdmin,
  getFinancialSettings,
  getAllServicesAdmin,
  getWorkingHoursForDate,
} from "@/lib/data";
import { calculateDuration, generateSlots } from "@/lib/scheduling";
import { DEFAULT_WORKING_HOURS_DAYS } from "@/lib/working-hours-defaults";
import type { HairDensity, HairLength } from "@/types";

const QuerySchema = z.object({
  service_id: z.string().uuid(),
  date: z.string().min(1),
  specialist_id: z.string().uuid().optional(),
  hair_length: z.enum(["short", "medium", "long"]).optional(),
  hair_density: z.enum(["thin", "medium", "thick"]).optional(),
});

export async function GET(req: Request) {
  const a = await requireAdminTenantSlugForApi();
  if (!a.ok) return a.response;
  const salonSlug = a.slug;

  const url = new URL(req.url);
  const parsed = QuerySchema.safeParse({
    service_id: url.searchParams.get("service_id") ?? "",
    date: url.searchParams.get("date") ?? "",
    specialist_id: url.searchParams.get("specialist_id") ?? undefined,
    hair_length: (url.searchParams.get("hair_length") ?? undefined) as HairLength | undefined,
    hair_density: (url.searchParams.get("hair_density") ?? undefined) as HairDensity | undefined,
  });
  if (!parsed.success) return NextResponse.json({ error: "Invalid query" }, { status: 400 });

  const { service_id, date, specialist_id, hair_length, hair_density } = parsed.data;

  const dayOfWeek = new Date(`${date}T00:00:00`).getDay();

  const [services, settings, workingHoursRow, bookings, blockedSlots] = await Promise.all([
    getAllServicesAdmin(salonSlug),
    getFinancialSettings(salonSlug),
    getWorkingHoursForDate({ salonSlug, specialistId: specialist_id, dayOfWeek }),
    getBookingsForDateAdmin({ salonSlug, specialistId: specialist_id, date }),
    getBlockedSlotsForDate({ salonSlug, specialistId: specialist_id, date }),
  ]);

  const service = services.find((s) => s.id === service_id);
  if (!service) return NextResponse.json({ error: "Service not found" }, { status: 404 });

  // Същият буфер като публичния /api/availability и като conflict проверката
  // в runCreateBooking. Преди беше 0 ("покажи всичко истински свободно"), но
  // така се показваха слотове, които записът после отказваше като заети —
  // разминаване UI ↔ сървър (audit 2026-07-06).
  const bufferMinutes = Number(settings?.buffer_minutes ?? 10);
  const magneticEnabled = Boolean(settings?.magnetic_scheduling ?? true);

  const fallback = DEFAULT_WORKING_HOURS_DAYS[dayOfWeek] ?? { start_time: "09:00", end_time: "18:00", is_day_off: false };
  const wh = workingHoursRow ?? { ...fallback, day_of_week: dayOfWeek, specialist_id: specialist_id ?? null, id: `fallback-${salonSlug}-${dayOfWeek}`, salon_slug: salonSlug };
  if (wh.is_day_off) return NextResponse.json({ slots: [] });

  let serviceDuration = service.duration_minutes ?? 0;
  if (service.is_complex) {
    const hl: HairLength = hair_length ?? "medium";
    const hd: HairDensity = hair_density ?? "medium";
    serviceDuration = calculateDuration(service, hl, hd).totalMinutes;
  }

  // For today: admins can book from current minute (no advance window needed)
  const minStartMinutes = date === todayDateISOInSofia() ? nowMinutesInSofia() : undefined;

  const slots = generateSlots({
    workStart: wh.start_time,
    workEnd: wh.end_time,
    existingBookings: bookings,
    blockedSlots,
    serviceDuration,
    bufferMinutes,
    slotInterval: 15,
    magneticEnabled,
    minStartMinutes,
  });

  return NextResponse.json({ slots });
}
