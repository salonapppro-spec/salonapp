"use server";

import { headers } from "next/headers";

import { CreateBookingSchema } from "@/schemas/booking";
import { assertTenantActiveForPublicApi } from "@/lib/public-tenant-guard";
import { loadCreateBookingContext, runCreateBooking } from "@/lib/booking-mutations";
import { clientIpFromHeaders, rateLimitOrThrow } from "@/lib/rate-limit-ip";

export type CreateBookingActionResult =
  | { success: true; booking_id: string }
  | { error: string };

export async function createBooking(input: unknown): Promise<CreateBookingActionResult> {
  const h = await headers();
  const ip = clientIpFromHeaders(h);
  const rl = rateLimitOrThrow(`booking-action:${ip}`, 10, 60_000);
  if (!rl.ok) return { error: "Твърде много заявки. Опитайте след малко." };

  const parsed = CreateBookingSchema.safeParse(input);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Невалидни данни";
    return { error: msg };
  }

  const data = parsed.data;
  const headerSlug = h.get("x-salon-slug");
  if (!headerSlug || headerSlug !== data.salon_slug) {
    return { error: "Невалиден салон." };
  }

  const gate = await assertTenantActiveForPublicApi(data.salon_slug);
  if (!gate.ok) {
    return { error: "Салонът не приема резервации." };
  }

  const ctx = await loadCreateBookingContext(data.salon_slug);
  if (!ctx) {
    return { error: "Салонът не е намерен." };
  }

  const result = await runCreateBooking(data, ctx);
  if (!result.ok) {
    return { error: result.error };
  }

  return { success: true, booking_id: result.bookingId };
}
