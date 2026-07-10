import { NextResponse } from "next/server";

import { requireAdminCapabilityForApi } from "@/lib/admin-rbac";
import { getBlockedSlotsForDate, getFinancialSettings } from "@/lib/data";
import { normalizeTimeForDb } from "@/lib/booking-mutations";
import { minutesToTime, timeToMinutes } from "@/lib/scheduling";
import { todayDateISOInSofia } from "@/lib/booking-datetime";
import { tenantDb } from "@/lib/tenant-db";
import { AdminBookingPatchSchema } from "@/schemas/booking-admin";
import type { Booking } from "@/types";

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const a = await requireAdminCapabilityForApi("schedule_write");
  if (!a.ok) return a.response;
  const salonSlug = a.slug;
  const { id } = await ctx.params;
  const body = (await req.json().catch(() => null)) as unknown;
  const parsed = AdminBookingPatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Невалидни данни", details: parsed.error.flatten() }, { status: 400 });
  }

  const { status, notes, booking_date, booking_time } = parsed.data;

  const updates: Record<string, unknown> = {};
  if (status !== undefined) updates.status = status;
  if (notes !== undefined) updates.notes = notes;
  if (status === "confirmed") {
    updates.confirmed_at = new Date().toISOString();
  }

  // Преместване на час (admin действие — без min-notice ограничения).
  if (booking_date !== undefined && booking_time !== undefined) {
    const { data: existingRaw } = await tenantDb(salonSlug).bookings.getById(id);
    const existing = existingRaw as Booking | null;
    if (!existing) return NextResponse.json({ error: "Не е намерена резервация" }, { status: 404 });

    if (booking_date < todayDateISOInSofia()) {
      return NextResponse.json({ error: "Не може да се премести час на минала дата." }, { status: 400 });
    }

    const startMin = timeToMinutes(booking_time);
    const duration = Number(existing.service_duration) || 0;
    if (startMin + duration > 24 * 60) {
      return NextResponse.json({ error: "Часът не може да приключи след полунощ." }, { status: 400 });
    }

    const settings = await getFinancialSettings(salonSlug);
    const bufferMinutes = Number(settings?.buffer_minutes ?? 10);
    const occupiedEnd = startMin + duration + bufferMinutes;

    const blockedSlots = await getBlockedSlotsForDate({
      salonSlug,
      specialistId: existing.specialist_id ?? undefined,
      date: booking_date,
    });
    for (const bl of blockedSlots) {
      const bs = timeToMinutes(bl.start_time);
      const be = timeToMinutes(bl.end_time);
      if (startMin < be && bs < occupiedEnd) {
        return NextResponse.json(
          { error: "Новият час попада в блокиран интервал. Изберете друг час или махнете блокировката." },
          { status: 409 }
        );
      }
    }

    updates.booking_date = booking_date;
    updates.booking_time = normalizeTimeForDb(booking_time);
    // Postgres time не приема 24:00+ — clamp както при създаване.
    updates.booking_end_time = normalizeTimeForDb(
      minutesToTime(Math.min(occupiedEnd, 24 * 60 - 1))
    );
  }

  const { data, error } = await tenantDb(salonSlug).bookings.updateById(id, updates);

  if (error) {
    // bookings_no_overlap: преместване/възстановяване върху вече зает слот —
    // не е server bug, а конфликт с друга активна резервация.
    if ((error as { code?: string }).code === "23P01") {
      return NextResponse.json(
        { error: "Този час е зает от друга резервация. Изберете друг час." },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: "Грешка при запис" }, { status: 500 });
  }
  if (!data) return NextResponse.json({ error: "Не е намерена резервация" }, { status: 404 });

  return NextResponse.json({ booking: data });
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const a = await requireAdminCapabilityForApi("schedule_write");
  if (!a.ok) return a.response;
  const salonSlug = a.slug;
  const { id } = await ctx.params;
  const { error } = await tenantDb(salonSlug).bookings.deleteById(id);
  if (error) return NextResponse.json({ error: "Грешка при изтриване" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
