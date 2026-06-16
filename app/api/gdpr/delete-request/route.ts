import { NextResponse } from "next/server";
import { z } from "zod";

import { insertGdprDeletionRequest } from "@/lib/internal/gdpr-deletion-requests";

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

  // Persist before emailing — previously email-only, no audit trail
  // (audit 2026-06-15/16). gdpr_deletion_requests already existed in
  // production with no writer.
  const persisted = await insertGdprDeletionRequest({ name, email, phone, details });
  if (!persisted.ok) {
    console.error("[gdpr-delete-request] insert failed:", persisted.error);
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
          `Имейл: ${email}`,
          `Телефон: ${phone ?? "не е посочен"}`,
          `Детайли: ${details ?? "—"}`,
          "",
          `Получена: ${new Date().toISOString()}`,
        ].join("\n"),
      }),
    });
  }

  return NextResponse.json({ ok: true });
}
