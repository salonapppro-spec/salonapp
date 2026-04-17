import { NextResponse } from "next/server";
import { z } from "zod";

import type { HairDensity, HairLength } from "@/types";
import { CreateBookingSchema } from "@/schemas/booking";
import { createSupabaseServiceRoleClient } from "@/lib/supabase-server";
import {
  getBlockedSlotsForDate,
  getBookingsForDate,
  getFinancialSettings,
  getServices,
  getWorkingHoursForDate,
} from "@/lib/data";
import { getAvailableSlots, calculateDuration } from "@/lib/scheduling";
import type { Service } from "@/types";

const GetSchema = z.object({
  salon_slug: z.string().min(1),
  date: z.string().min(1), // YYYY-MM-DD
  service_id: z.string().uuid(),
  specialist_id: z.string().min(1).optional(),
  hair_length: z.enum(["къса", "средна", "дълга"]).optional(),
  hair_density: z.enum(["рядка", "средна", "гъста"]).optional(),
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
  const services = await getServices(salon_slug);
  const service = services.find((s) => s.id === service_id);
  if (!service) return NextResponse.json({ error: "Service not found" }, { status: 404 });

  const settings = await getFinancialSettings(salon_slug);
  const bufferMinutes = Number(settings?.buffer_minutes ?? 10);
  const magneticEnabled = Boolean(settings?.magnetic_scheduling ?? true);

  const dayOfWeek = new Date(`${date}T00:00:00`).getDay();
  const workingHours = await getWorkingHoursForDate({ salonSlug: salon_slug, specialistId: specialist_id, dayOfWeek });
  if (!workingHours) return NextResponse.json({ slots: [] });

  const [bookings, blockedSlots] = await Promise.all([
    getBookingsForDate({ salonSlug: salon_slug, specialistId: specialist_id, date }),
    getBlockedSlotsForDate({ salonSlug: salon_slug, specialistId: specialist_id, date }),
  ]);

  const slots = getAvailableSlots({
    date,
    service,
    bookings,
    blockedSlots,
    workingHours,
    bufferMinutes,
    magneticEnabled,
    hairLength: hair_length,
    hairDensity: hair_density,
  });

  return NextResponse.json({ slots });
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as unknown;
  const parsed = CreateBookingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const data = parsed.data;
  const supabase = createSupabaseServiceRoleClient();

  // For complex services, service_duration should be computed consistently.
  if (data.hair_length && data.hair_density) {
    const { data: serviceRow } = await supabase
      .from("services")
      .select("*")
      .eq("salon_slug", data.salon_slug)
      .eq("id", data.service_id ?? "")
      .limit(1)
      .maybeSingle();

    const service = (serviceRow as Service | null) ?? null;
    if (service?.is_complex) {
      const calc = calculateDuration(
        service,
        data.hair_length as HairLength,
        data.hair_density as HairDensity
      );
      data.service_duration = calc.totalMinutes;
    }
  }

  // Overlap check (best-effort; DB-level exclusion constraint can be added later).
  const { data: existing, error: existingErr } = await supabase
    .from("bookings")
    .select("booking_time,service_duration,status")
    .eq("salon_slug", data.salon_slug)
    .eq("booking_date", data.booking_date)
    .eq("specialist_id", data.specialist_id ?? null);

  if (existingErr) return NextResponse.json({ error: "DB error" }, { status: 500 });

  const toMin = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  };
  const start = toMin(data.booking_time);
  const end = start + data.service_duration;

  for (const b of (existing ?? []) as Array<{ booking_time: string; service_duration: number; status: string }>) {
    if (b.status === "cancelled" || b.status === "no_show") continue;
    const bs = toMin(b.booking_time);
    const be = bs + Number(b.service_duration);
    if (start < be && bs < end) {
      return NextResponse.json({ error: "Този час току-що беше зает. Моля изберете друг." }, { status: 409 });
    }
  }

  const { data: created, error } = await supabase.from("bookings").insert(data).select("*").maybeSingle();
  if (error) return NextResponse.json({ error: "DB insert failed" }, { status: 500 });

  return NextResponse.json({ booking: created });
}

