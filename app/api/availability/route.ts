import { NextResponse } from "next/server";
import { z } from "zod";

import {
  getBlockedSlotsForDate,
  getBookingsForDate,
  getFinancialSettings,
  getServices,
  getWorkingHoursForDate,
} from "@/lib/data";
import { assertTenantActiveForPublicApi } from "@/lib/public-tenant-guard";
import { calculateDuration, generateSlots } from "@/lib/scheduling";
import type { HairDensity, HairLength } from "@/types";

const QuerySchema = z.object({
  salon_slug: z.string().min(1),
  date: z.string().min(1),
  service_id: z.string().uuid(),
  specialist_id: z.string().uuid().optional(),
  hair_length: z.enum(["short", "medium", "long"]).optional(),
  hair_density: z.enum(["thin", "medium", "thick"]).optional(),
});

export async function GET(req: Request) {
  const url = new URL(req.url);
  const parsed = QuerySchema.safeParse({
    salon_slug: url.searchParams.get("salon_slug") ?? "",
    date: url.searchParams.get("date") ?? "",
    service_id: url.searchParams.get("service_id") ?? "",
    specialist_id: url.searchParams.get("specialist_id") ?? undefined,
    hair_length: (url.searchParams.get("hair_length") ?? undefined) as HairLength | undefined,
    hair_density: (url.searchParams.get("hair_density") ?? undefined) as HairDensity | undefined,
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid query" }, { status: 400 });
  }

  const { salon_slug, date, service_id, specialist_id, hair_length, hair_density } = parsed.data;
  const gate = await assertTenantActiveForPublicApi(salon_slug);
  if (!gate.ok) return gate.response;

  const services = await getServices(salon_slug);
  const service = services.find((s) => s.id === service_id);
  if (!service) return NextResponse.json({ error: "Service not found" }, { status: 404 });

  const settings = await getFinancialSettings(salon_slug);
  const bufferMinutes = Number(settings?.buffer_minutes ?? 10);
  const magneticEnabled = Boolean(settings?.magnetic_scheduling ?? true);

  const dayOfWeek = new Date(`${date}T00:00:00`).getDay();
  const workingHours = await getWorkingHoursForDate({ salonSlug: salon_slug, specialistId: specialist_id, dayOfWeek });
  if (!workingHours || workingHours.is_day_off) return NextResponse.json({ slots: [] });

  const [bookings, blockedSlots] = await Promise.all([
    getBookingsForDate({ salonSlug: salon_slug, specialistId: specialist_id, date }),
    getBlockedSlotsForDate({ salonSlug: salon_slug, specialistId: specialist_id, date }),
  ]);

  let serviceDuration = service.duration_minutes ?? 0;
  if (service.is_complex) {
    if (!hair_length || !hair_density) return NextResponse.json({ slots: [] });
    serviceDuration = calculateDuration(service, hair_length, hair_density).totalMinutes;
  }

  const slots = generateSlots({
    workStart: workingHours.start_time,
    workEnd: workingHours.end_time,
    existingBookings: bookings,
    blockedSlots,
    serviceDuration,
    bufferMinutes,
    slotInterval: 15,
    magneticEnabled,
  });

  return NextResponse.json({ slots });
}
