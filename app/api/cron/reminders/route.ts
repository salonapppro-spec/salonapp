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
    .in("status", ["pending", "confirmed"]);

  if (error) {
    return NextResponse.json({ ok: false, error: "query" }, { status: 500 });
  }

  const list = (bookings ?? []) as Booking[];
  if (list.length === 0) {
    return NextResponse.json({ ok: true, processed: 0, date: tomorrow });
  }

  const ids = list.map((b) => b.id);
  const { data: existingLogs } = await supabase
    .from("email_logs")
    .select("booking_id")
    .eq("type", "reminder")
    .eq("status", "sent")
    .in("booking_id", ids);

  const already = new Set((existingLogs ?? []).map((r: { booking_id: string }) => r.booking_id));

  let processed = 0;
  let failed = 0;
  for (const b of list) {
    if (already.has(b.id)) continue;

    const tenant = await getTenant(b.salon_slug);
    if (!tenant || (tenant.status !== "active" && tenant.status !== "trial")) continue;

    try {
      await sendReminderEmail(b, tenant);
      processed += 1;
    } catch {
      failed += 1;
    }
  }

  return NextResponse.json({ ok: true, processed, failed, date: tomorrow });
}
