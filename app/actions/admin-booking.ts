"use server";

import { AdminCreateBookingSchema } from "@/schemas/booking";
import { adminActorHasCapability, resolveAdminActor } from "@/lib/admin-rbac";
import { resolveAdminTenantSlug } from "@/lib/admin-tenant";
import { loadCreateBookingContext, runCreateBooking } from "@/lib/booking-mutations";

export type AdminBookingActionResult = { success: true; booking_id: string } | { error: string };

/**
 * Резервация от админ панела — без `x-salon-slug`; salon_slug идва от JWT metadata.
 *
 * Разлики спрямо публичния createBooking:
 *  - телефон и имейл са опционални (walk-in клиент на място / по телефона);
 *  - без минимално предизвестие — иначе салонът не може да запише клиент,
 *    който стои на вратата "сега" (audit 2026-07-06).
 */
export async function createAdminBooking(input: unknown): Promise<AdminBookingActionResult> {
  const slug = await resolveAdminTenantSlug();
  if (!slug) {
    return { error: "Нямате достъп до салона." };
  }

  const actor = await resolveAdminActor(slug);
  if (!actor || !adminActorHasCapability(actor, "schedule_write")) {
    return { error: "Нямате право за тази операция." };
  }

  const body = typeof input === "object" && input !== null ? { ...(input as Record<string, unknown>) } : {};
  body.salon_slug = slug;

  const parsed = AdminCreateBookingSchema.safeParse(body);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Невалидни данни";
    return { error: msg };
  }

  // Zod regex разрешава whitespace (\s), затова низ от само празни символи
  // минава валидацията — но след .trim() остава празен. Преди фиксa това
  // тихо падаше към "00000", сливайки различни клиенти в един фантомен
  // запис (виж audit 2026-06-15/16). Подаден телефон изисква ≥5 цифри;
  // липсващ е позволен (allowEmptyPhone) и тогава клиентски запис не се създава.
  const phone = parsed.data.client_phone?.trim() ?? "";
  if (phone) {
    const digitCount = (phone.match(/\d/g) ?? []).length;
    if (digitCount < 5) {
      return { error: "Невалиден телефон — въведете поне 5 цифри или го оставете празен." };
    }
  }
  const data = { ...parsed.data, client_phone: phone };

  const ctx = await loadCreateBookingContext(slug);
  if (!ctx) {
    return { error: "Салонът не е намерен." };
  }

  const result = await runCreateBooking(data, {
    ...ctx,
    minNoticeMinutes: 0,
    allowEmptyPhone: true,
  });
  if (!result.ok) {
    return { error: result.error };
  }

  return { success: true, booking_id: result.bookingId };
}
