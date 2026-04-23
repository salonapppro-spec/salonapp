import { NextResponse } from "next/server";

import { logAbuseEvent } from "@/lib/abuse-log";
import { assertCronSecret } from "@/lib/cron-auth";
import { createSupabaseServiceRoleClient } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const unauthorized = assertCronSecret(req);
  if (unauthorized) return unauthorized;

  const supabase = createSupabaseServiceRoleClient();

  // Деактивира салони с изтекъл grace период
  const { data, error } = await supabase
    .from("tenants")
    .update({ status: "inactive" })
    .eq("status", "active")
    .lt("grace_until_date", new Date().toISOString().split("T")[0])
    .select("salon_slug, owner_email, grace_until_date");

  if (error) {
    console.error("[billing-expiry] Грешка при деактивация:", error.message);
    logAbuseEvent({
      kind: "server_error",
      path: "/api/cron/billing-expiry",
      method: "GET",
      status: 500,
      ip: "cron",
      key: "billing_expiry_update_failed",
      detail: error.code ?? "db_error",
    });
    return NextResponse.json({ ok: false, error: "internal_error" }, { status: 500 });
  }

  const count = data?.length ?? 0;
  console.log(`[billing-expiry] Деактивирани ${count} салон(а).`);

  if (count > 0 && process.env.RESEND_API_KEY) {
    for (const tenant of data) {
      if (!tenant.owner_email) continue;
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: process.env.RESEND_FROM ?? "SalonApp <no-reply@salonapp.pro>",
          to: [tenant.owner_email],
          subject: "SalonApp — абонаментът е деактивиран",
          html: `
            <p>Здравейте,</p>
            <p>Абонаментът за вашия салон (<strong>${tenant.salon_slug}</strong>) е деактивиран, защото гратисният период изтече на ${tenant.grace_until_date}.</p>
            <p>За да го активирате отново, моля направете ново плащане от <a href="${process.env.NEXT_PUBLIC_APP_URL ?? "https://salonapp.pro"}/admin/dashboard">админ панела</a>.</p>
          `,
        }),
      }).catch((e) => console.error("[billing-expiry] Resend error:", e));
    }
  }

  return NextResponse.json({ ok: true, deactivated: count });
}
