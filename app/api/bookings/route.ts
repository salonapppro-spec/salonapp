import { NextResponse } from "next/server";
import { z } from "zod";

import { logAbuseEvent } from "@/lib/abuse-log";
import { clientIpFromHeaders } from "@/lib/rate-limit";
import type { HairDensity, HairLength } from "@/types";
import { CreateBookingSchema } from "@/schemas/booking";
import { DEFAULT_WORKING_HOURS_DAYS } from "@/lib/working-hours-defaults";
import {
  getBlockedSlotsForDate,
  getBookingsForDate,
  getFinancialSettings,
  getServices,
  getWorkingHoursForDate,
} from "@/lib/data";
import { assertTenantActiveForPublicApi } from "@/lib/public-tenant-guard";
import { calculateDuration, generateSlots } from "@/lib/scheduling";
import { requireTenantFromHeaders } from "@/lib/tenant-request";
import { loadCreateBookingContext, runCreateBooking } from "@/lib/booking-mutations";

const GetSchema = z.object({
  salon_slug: z.string().min(1),
  date: z.string().min(1),
  service_id: z.string().uuid(),
  specialist_id: z.string().uuid().optional(),
  hair_length: z.enum(["short", "medium", "long"]).optional(),
  hair_density: z.enum(["thin", "medium", "thick"]).optional(),
});

export async function GET(req: Request) {
  const url = new URL(req.url);
  const parsed = GetSchema.safeParse({
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
  const tenant = requireTenantFromHeaders(req, { claimedSlug: salon_slug, path: "/api/bookings", method: "GET" });
  if (!tenant.ok) return tenant.response;
  const trustedSalonSlug = tenant.salonSlug;

  const gate = await assertTenantActiveForPublicApi(trustedSalonSlug);
  if (!gate.ok) return gate.response;

  const services = await getServices(trustedSalonSlug);
  const service = services.find((s) => s.id === service_id);
  if (!service) return NextResponse.json({ error: "Service not found" }, { status: 404 });

  const settings = await getFinancialSettings(trustedSalonSlug);
  const bufferMinutes = Number(settings?.buffer_minutes ?? 10);
  const magneticEnabled = Boolean(settings?.magnetic_scheduling ?? true);

  const dayOfWeek = new Date(`${date}T00:00:00`).getDay();
  const workingHoursRow = await getWorkingHoursForDate({ salonSlug: trustedSalonSlug, specialistId: specialist_id, dayOfWeek });
  const fallback = DEFAULT_WORKING_HOURS_DAYS[dayOfWeek] ?? { start_time: "09:00", end_time: "18:00", is_day_off: false };
  const workingHours = workingHoursRow ?? { ...fallback, day_of_week: dayOfWeek, specialist_id: specialist_id ?? null, id: `fallback-${trustedSalonSlug}-${dayOfWeek}`, salon_slug: trustedSalonSlug };
  if (workingHours.is_day_off) return NextResponse.json({ slots: [] });

  const [bookings, blockedSlots] = await Promise.all([
    getBookingsForDate({ salonSlug: trustedSalonSlug, specialistId: specialist_id, date }),
    getBlockedSlotsForDate({ salonSlug: trustedSalonSlug, specialistId: specialist_id, date }),
  ]);

  // За complex услуги без избрани hair params — използваме medium/medium за приблизителни часове
  let serviceDuration = service.duration_minutes ?? 0;
  if (service.is_complex) {
    const hl: HairLength = hair_length ?? "medium";
    const hd: HairDensity = hair_density ?? "medium";
    serviceDuration = calculateDuration(service, hl, hd).totalMinutes;
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

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as unknown;
  const parsed = CreateBookingSchema.safeParse(body);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Невалидни данни";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const data = parsed.data;
  const tenant = requireTenantFromHeaders(req, { claimedSlug: data.salon_slug, path: "/api/bookings", method: "POST" });
  if (!tenant.ok) return tenant.response;
  const trustedSalonSlug = tenant.salonSlug;
  const trustedData = { ...data, salon_slug: trustedSalonSlug };

  const gate = await assertTenantActiveForPublicApi(trustedSalonSlug);
  if (!gate.ok) return gate.response;

  const ctx = await loadCreateBookingContext(trustedSalonSlug);
  if (!ctx) {
    return NextResponse.json({ error: "Салонът не е намерен." }, { status: 404 });
  }

  const result = await runCreateBooking(trustedData, ctx);
  if (!result.ok) {
    const conflict =
      result.code === "23P01" ||
      result.error.includes("зает") ||
      result.error.includes("блокиран");
    const status = conflict ? 409 : 500;
    if (status === 500) {
      logAbuseEvent({
        kind: "server_error",
        path: "/api/bookings",
        method: "POST",
        status: 500,
        ip: clientIpFromHeaders(req.headers),
        detail: result.code ?? "create_booking_failed",
      });
    }
    return NextResponse.json({ error: result.error }, { status });
  }

  return NextResponse.json({ success: true, booking_id: result.bookingId });
}
