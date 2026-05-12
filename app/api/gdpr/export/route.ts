import { NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";

import { createSupabaseServiceRoleClient } from "@/lib/supabase-admin";
import { normalizePhone } from "@/lib/phone";

const Schema = z.object({
  email: z.string().email(),
  phone: z.string().min(6).max(30).optional(),
});

const ORACLE_RESPONSE = NextResponse.json({
  ok: true,
  message: "Ако имаме данни за вас, ще получите имейл с линк за потвърждение.",
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Необходим е валиден имейл адрес" }, { status: 400 });
  }

  const { email, phone } = parsed.data;
  const normalizedPhone = phone ? normalizePhone(phone) : null;

  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour

  const supabase = createSupabaseServiceRoleClient();
  const { error: insertError } = await supabase.from("gdpr_export_tokens").insert({
    token,
    email,
    phone: normalizedPhone,
    expires_at: expiresAt,
  });

  if (insertError) {
    console.error("[gdpr-export] Token insert error:", insertError);
    return ORACLE_RESPONSE;
  }

  const resendKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM ?? "SalonApp <no-reply@salonapp.pro>";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://salonapp.pro";
  const confirmUrl = `${appUrl}/api/gdpr/export/confirm?token=${token}`;

  if (resendKey) {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [email],
        subject: "SalonApp — потвърдете заявката за лични данни",
        text: [
          "Здравейте,",
          "",
          "Получихме заявка за износ на личните ви данни от SalonApp.",
          "За да потвърдите самоличността си и да получите данните, кликнете на линка по-долу:",
          "",
          confirmUrl,
          "",
          "Линкът е валиден 1 час. Ако не сте правили тази заявка, просто го игнорирайте.",
          "",
          "Екипът на SalonApp",
        ].join("\n"),
      }),
    }).catch((e) => console.error("[gdpr-export] Resend error:", e));
  }

  return ORACLE_RESPONSE;
}
