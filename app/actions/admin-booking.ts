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

  // Zod regex разрешава whitespace (\s), затова низ от само празни символи
  // минава валидацията — но след .trim() остава празен. Преди фиксa това
  // тихо падаше към "00000", сливайки различни клиенти в един фантомен
  // запис (виж audit 2026-06-15/16). Сега отказваме вместо да гадаем.
  const phone = parsed.data.client_phone.trim();
  const digitCount = (phone.match(/\d/g) ?? []).length;
  if (digitCount < 5) {
    return { error: "Невалиден телефон — въведете поне 5 цифри." };
  }
  const data = { ...parsed.data, client_phone: phone };

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
