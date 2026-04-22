import { NextResponse } from "next/server";

import { createSupabaseServiceRoleClient } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  const vercelCron = req.headers.get("x-vercel-cron");
  const isProd = process.env.NODE_ENV === "production" || process.env.VERCEL_ENV === "production";
  const cronHeaderOk = !isProd || vercelCron === "1";
  if (!secret || auth !== `Bearer ${secret}` || !cronHeaderOk) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

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
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
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
