import { NextResponse } from "next/server";
import { z } from "zod";

import { createSupabaseServiceRoleClient } from "@/lib/supabase-admin";

const Schema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  phone: z.string().max(30).optional(),
  details: z.string().max(1000).optional(),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid data" }, { status: 400 });

  const { name, email, phone, details } = parsed.data;
  const normalizedEmail = email.toLowerCase().trim();

  const supabase = createSupabaseServiceRoleClient();

  // De-duplicate: one pending request per email per 24 hours
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data: existing } = await supabase
    .from("gdpr_deletion_requests")
    .select("id")
    .eq("email", normalizedEmail)
    .eq("status", "pending")
    .gte("created_at", since)
    .maybeSingle();

  if (existing) {
    // Return 200 silently — don't reveal whether email is registered
    return NextResponse.json({ ok: true });
  }

  const { error: dbError } = await supabase.from("gdpr_deletion_requests").insert({
    name,
    email: normalizedEmail,
    phone: phone ?? null,
    details: details ?? null,
  });

  if (dbError) {
    console.error("GDPR deletion request DB error:", dbError.message);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }

  const resendKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM ?? "SalonApp <no-reply@salonapp.pro>";

  if (resendKey) {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: ["salonapppro@gmail.com"],
        subject: `GDPR заявка за изтриване — ${name}`,
        text: [
          `Три имена: ${name}`,
          `Имейл: ${normalizedEmail}`,
          `Телефон: ${phone ?? "не е посочен"}`,
          `Детайли: ${details ?? "—"}`,
          "",
          `Получена: ${new Date().toISOString()}`,
        ].join("\n"),
      }),
    }).catch(() => undefined);
  }

  return NextResponse.json({ ok: true });
}
