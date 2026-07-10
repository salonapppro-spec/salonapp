/**
 * Насрочва post-visit имейла „Оставете отзив" ~1 час след като собственикът
 * маркира резервацията „Явил се" (status → completed). Ползва Resend `scheduled_at`,
 * без да блокира заявката. Дедупът е същият claim-преди-send модел като в
 * cron-а за напомняния (уникален индекс email_logs (booking_id, type) WHERE status='sent').
 *
 * Дневният cron (app/api/cron/reminders/route.ts) остава резерва — ако тук не се
 * насрочи (грешка/тих час без click-time), сутринта го хваща за вчерашните.
 */
import { DateTime } from "luxon";

import { sendReviewRequestEmail } from "@/lib/email";
import { getTenant } from "@/lib/get-tenant";
import { REVIEW_REQUEST_PILOT } from "@/lib/review-request-pilot";
import { createSupabaseServiceRoleClient } from "@/lib/supabase-admin";
import type { Booking } from "@/types";

const DELAY_MINUTES = 60; // ~1 час след „Явил се"
const QUIET_START_HOUR = 21; // не пращаме в/след 21:00 (софийско)
const MORNING_HOUR = 10; // тихите часове се преливат към 10:00

/**
 * Кога да тръгне имейлът: +1 час, но задържан в прозореца 10:00–21:00.
 * След 21:00 → на другата сутрин в 10:00; преди 10:00 → същия ден в 10:00.
 */
function computeSendAt(now: DateTime): DateTime {
  const base = now.plus({ minutes: DELAY_MINUTES });
  if (base.hour >= QUIET_START_HOUR) {
    return base.plus({ days: 1 }).set({ hour: MORNING_HOUR, minute: 0, second: 0, millisecond: 0 });
  }
  if (base.hour < MORNING_HOUR) {
    return base.set({ hour: MORNING_HOUR, minute: 0, second: 0, millisecond: 0 });
  }
  return base;
}

/**
 * Извиква се при PATCH status → "completed". Тихо no-op за салони извън пилота
 * или резервации без имейл. Никога не хвърля — не бива да проваля записа.
 */
export async function scheduleReviewRequestOnCompletion(booking: Booking): Promise<void> {
  try {
    const pilot = REVIEW_REQUEST_PILOT[booking.salon_slug];
    if (!pilot) return;
    if (!booking.client_email?.trim()) return;
    if (booking.email_unsubscribed) return;

    const tenant = await getTenant(booking.salon_slug);
    if (!tenant || (tenant.status !== "active" && tenant.status !== "trial")) return;

    const supabase = createSupabaseServiceRoleClient();

    // Claim-преди-send: уникалният индекс гарантира 1 имейл на резервация дори при
    // повторно натискане „Явил се". 23505 = вече насрочен/пратен → тихо излизаме.
    const { data: claim, error: claimError } = await supabase
      .from("email_logs")
      .insert({
        salon_slug: booking.salon_slug,
        booking_id: booking.id,
        type: "review_request",
        status: "sent",
      })
      .select("id")
      .single();

    if (claimError || !claim) return;

    const sendAt = computeSendAt(DateTime.now().setZone("Europe/Sofia"));

    let scheduled = false;
    try {
      scheduled = await sendReviewRequestEmail(booking, tenant, pilot, sendAt.toISO() ?? undefined);
    } catch {
      scheduled = false;
    }

    if (!scheduled) {
      // Освобождаваме claim-а (status → failed не пада под уникалния индекс),
      // за да може сутрешният cron да опита пак.
      await supabase.from("email_logs").update({ status: "failed" }).eq("id", claim.id);
    }
  } catch (e) {
    console.error("[review-request-schedule] failed", {
      booking_id: booking.id,
      salon_slug: booking.salon_slug,
      error: e instanceof Error ? e.message : e,
    });
  }
}
