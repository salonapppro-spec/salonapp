import { NextResponse } from "next/server";

import { tomorrowDateISOInSofia } from "@/lib/booking-datetime";
import { sendReminderEmail } from "@/lib/email";
import { getTenant } from "@/lib/get-tenant";
import { assertCronSecret } from "@/lib/cron-auth";
import { createSupabaseServiceRoleClient } from "@/lib/supabase-admin";
import type { Booking } from "@/types";

export const dynamic = "force-dynamic";

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
  if (list.length === 0) {
    return NextResponse.json({ ok: true, processed: 0, date: tomorrow });
  }

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

  const toSend = list.filter((b) => !already.has(b.id));

  // Изпращаме на батчове, не последователно — при растеж на платформата
  // (повече салони/bookings) последователен await per booking рискува да
  // удари Vercel function timeout. Кеш на вече зареден tenant по salon_slug,
  // защото няколко booking-а могат да са от един и същ салон.
  const CONCURRENCY = 10;
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
    await Promise.all(batch.map(sendOne));
  }

  return NextResponse.json({ ok: true, processed, failed, date: tomorrow });
}
