import { NextResponse } from "next/server";

import { addCalendarDaysInSofia, todayDateISOInSofia, tomorrowDateISOInSofia } from "@/lib/booking-datetime";
import { sendReminderEmail, sendReviewRequestEmail } from "@/lib/email";
import { getTenant } from "@/lib/get-tenant";
import { assertCronSecret } from "@/lib/cron-auth";
import { REVIEW_REQUEST_PILOT } from "@/lib/review-request-pilot";
import { createSupabaseServiceRoleClient } from "@/lib/supabase-admin";
import type { Booking } from "@/types";

export const dynamic = "force-dynamic";
// Throttle до Resend лимита (2 req/s) удължава изпълнението при много
// напомняния — вдигаме кап-а на функцията, за да не удари default timeout.
export const maxDuration = 300;

export async function GET(req: Request) {
  const unauthorized = assertCronSecret(req);
  if (unauthorized) return unauthorized;

  const tomorrow = tomorrowDateISOInSofia();
  const supabase = createSupabaseServiceRoleClient();

  const { data: bookings, error } = await supabase
    .from("bookings")
    .select("*")
    .eq("booking_date", tomorrow)
    .eq("email_unsubscribed", false)
    .in("status", ["pending", "confirmed"]);

  if (error) {
    return NextResponse.json({ ok: false, error: "query" }, { status: 500 });
  }

  const list = (bookings ?? []) as Booking[];

  let toSend: Booking[] = [];
  if (list.length > 0) {
    const ids = list.map((b) => b.id);
    const { data: existingLogs, error: logsError } = await supabase
      .from("email_logs")
      .select("booking_id")
      .eq("type", "reminder")
      .eq("status", "sent")
      .in("booking_id", ids);

    // Fail closed: при грешка на dedup заявката НЕ пращаме нищо — иначе всички
    // клиенти с вече изпратено напомняне биха получили втори имейл (одит A1).
    if (logsError) {
      return NextResponse.json({ ok: false, error: "dedup_query" }, { status: 500 });
    }

    const already = new Set((existingLogs ?? []).map((r: { booking_id: string }) => r.booking_id));

    toSend = list.filter((b) => !already.has(b.id));
  }

  // Изпращаме на батчове с pacing: Resend позволява 2 req/s (одит A2) —
  // CONCURRENCY 2 + минимум MIN_BATCH_MS между стартовете на батчовете държи
  // изпращането под лимита; retry при 429/5xx е в sendResendHtml. Кеш на вече
  // зареден tenant по salon_slug, защото няколко booking-а са от един салон.
  const CONCURRENCY = 2;
  const MIN_BATCH_MS = 1100;
  const tenantCache = new Map<string, Awaited<ReturnType<typeof getTenant>>>();
  let processed = 0;
  let failed = 0;

  async function sendOne(b: Booking): Promise<void> {
    let tenant = tenantCache.get(b.salon_slug);
    if (tenant === undefined) {
      tenant = await getTenant(b.salon_slug);
      tenantCache.set(b.salon_slug, tenant);
    }
    if (!tenant || (tenant.status !== "active" && tenant.status !== "trial")) return;

    // Claim-преди-send (одит A3): уникалният индекс email_logs_sent_booking_type_uniq
    // гарантира точно един 'sent' ред per (booking, reminder) — паралелен run
    // получава 23505 и пропуска. При провал на изпращането claim-ът се
    // освобождава (status='failed'), за да опита следващият run.
    const { data: claim, error: claimError } = await supabase
      .from("email_logs")
      .insert({ salon_slug: b.salon_slug, booking_id: b.id, type: "reminder", status: "sent" })
      .select("id")
      .single();

    if (claimError || !claim) {
      if (claimError?.code !== "23505") failed += 1;
      return;
    }

    let delivered = false;
    try {
      delivered = await sendReminderEmail(b, tenant);
    } catch {
      delivered = false;
    }

    if (delivered) {
      processed += 1;
      return;
    }

    failed += 1;
    await supabase.from("email_logs").update({ status: "failed" }).eq("id", claim.id);
  }

  for (let i = 0; i < toSend.length; i += CONCURRENCY) {
    const batch = toSend.slice(i, i + CONCURRENCY);
    const startedAt = Date.now();
    await Promise.all(batch.map(sendOne));
    const hasMore = i + CONCURRENCY < toSend.length;
    const elapsed = Date.now() - startedAt;
    if (hasMore && elapsed < MIN_BATCH_MS) {
      await new Promise((resolve) => setTimeout(resolve, MIN_BATCH_MS - elapsed));
    }
  }

  // Фаза 2 (пилот): покана за отзив — вчерашните резервации със статус „Яви се"
  // при тенанти от REVIEW_REQUEST_PILOT. Dedupe само чрез claim-преди-send
  // (уникалният индекс покрива и type='review_request'), без pre-select.
  const yesterday = addCalendarDaysInSofia(todayDateISOInSofia(), -1);
  const pilotSlugs = Object.keys(REVIEW_REQUEST_PILOT);
  let reviewProcessed = 0;
  let reviewFailed = 0;
  let reviewQueryError = false;

  const sendReviewOne = async (b: Booking): Promise<void> => {
    let tenant = tenantCache.get(b.salon_slug);
    if (tenant === undefined) {
      tenant = await getTenant(b.salon_slug);
      tenantCache.set(b.salon_slug, tenant);
    }
    if (!tenant || (tenant.status !== "active" && tenant.status !== "trial")) return;
    const pilot = REVIEW_REQUEST_PILOT[b.salon_slug];
    if (!pilot) return;

    const { data: claim, error: claimError } = await supabase
      .from("email_logs")
      .insert({ salon_slug: b.salon_slug, booking_id: b.id, type: "review_request", status: "sent" })
      .select("id")
      .single();

    if (claimError || !claim) {
      if (claimError?.code !== "23505") reviewFailed += 1;
      return;
    }

    let delivered = false;
    try {
      delivered = await sendReviewRequestEmail(b, tenant, pilot);
    } catch {
      delivered = false;
    }

    if (delivered) {
      reviewProcessed += 1;
      return;
    }

    reviewFailed += 1;
    await supabase.from("email_logs").update({ status: "failed" }).eq("id", claim.id);
  };

  if (pilotSlugs.length > 0) {
    const { data: completedRaw, error: completedErr } = await supabase
      .from("bookings")
      .select("*")
      .eq("booking_date", yesterday)
      .eq("status", "completed")
      .eq("email_unsubscribed", false)
      .in("salon_slug", pilotSlugs);

    if (completedErr) {
      reviewQueryError = true;
    } else {
      const reviewList = ((completedRaw ?? []) as Booking[]).filter((b) => Boolean(b.client_email));
      for (let i = 0; i < reviewList.length; i += CONCURRENCY) {
        const batch = reviewList.slice(i, i + CONCURRENCY);
        const startedAt = Date.now();
        await Promise.all(batch.map(sendReviewOne));
        const hasMore = i + CONCURRENCY < reviewList.length;
        const elapsed = Date.now() - startedAt;
        if (hasMore && elapsed < MIN_BATCH_MS) {
          await new Promise((resolve) => setTimeout(resolve, MIN_BATCH_MS - elapsed));
        }
      }
    }
  }

  return NextResponse.json({
    ok: true,
    processed,
    failed,
    date: tomorrow,
    review_processed: reviewProcessed,
    review_failed: reviewFailed,
    review_date: yesterday,
    ...(reviewQueryError ? { review_error: "query" } : {}),
  });
}
