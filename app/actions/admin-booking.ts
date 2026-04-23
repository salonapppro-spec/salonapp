"use server";

import { CreateBookingSchema } from "@/schemas/booking";
import { resolveAdminTenantSlug } from "@/lib/admin-tenant";
import { loadCreateBookingContext, runCreateBooking } from "@/lib/booking-mutations";

export type AdminBookingActionResult = { success: true; booking_id: string } | { error: string };

/**
 * Резервация от админ панела — без `x-salon-slug`; salon_slug идва от JWT metadata.
 */
export async function createAdminBooking(input: unknown): Promise<AdminBookingActionResult> {
  const slug = await resolveAdminTenantSlug();
  if (!slug) {
    return { error: "Нямате достъп до салона." };
  }

  const body = typeof input === "object" && input !== null ? { ...(input as Record<string, unknown>) } : {};
  body.salon_slug = slug;

  const parsed = CreateBookingSchema.safeParse(body);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Невалидни данни";
    return { error: msg };
  }

  const phone = parsed.data.client_phone?.trim() || "00000";
  const data = { ...parsed.data, client_phone: phone.length >= 5 ? phone : "00000" };

  const ctx = await loadCreateBookingContext(slug);
  if (!ctx) {
    return { error: "Салонът не е намерен." };
  }

  const result = await runCreateBooking(data, { ...ctx, debugDbErrors: true });
  if (!result.ok) {
    return { error: result.error };
  }

  return { success: true, booking_id: result.bookingId };
}
