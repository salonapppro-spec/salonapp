import { NextResponse } from "next/server";

import { LeadInquirySchema } from "@/schemas/lead-inquiry";
import { createSupabaseServiceRoleClient } from "@/lib/supabase-admin";

export async function POST(req: Request) {
  const raw = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!raw || typeof raw !== "object") {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const hp = typeof raw.company_website === "string" && raw.company_website.trim().length > 0;
  if (hp) {
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  delete raw.company_website;
  const parsed = LeadInquirySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "Невалидни данни", details: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;
  const normalizedPhone = (data.phone ?? "").replace(/\D+/g, "");
  const fallbackLeadEmail = `${normalizedPhone ? `phone-${normalizedPhone}` : `lead-${Date.now()}`}@no-email.salonapp.pro`;
  const leadEmail = data.email ?? fallbackLeadEmail;

  // Build message combining business_type and any extra notes
  const fullMessage = [
    data.business_type ? `Тип бизнес: ${data.business_type}` : null,
    data.message || null,
  ].filter(Boolean).join("\n") || null;

  try {
    const supabase = createSupabaseServiceRoleClient();
    const { error } = await supabase.from("platform_leads").insert({
      plan: data.plan ?? "standard",
      salon_name: data.salon_name,
      contact_name: data.contact_name,
      email: leadEmail,
      phone: data.phone ?? null,
      message: fullMessage,
      source: data.source,
    });

    if (error) {
      console.error("[leads]", error.message);
      return NextResponse.json({ error: "В момента не можем да приемем заявката. Опитайте по-късно или пишете на имейл." }, { status: 503 });
    }

    await supabase.from("page_events").insert({
      event_type: "form_filled",
      source: data.source,
    });

    const resendKey = process.env.RESEND_API_KEY;
    if (resendKey) {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: process.env.RESEND_FROM ?? "SalonApp <no-reply@salonapp.pro>",
          to: ["salonapppro@gmail.com"],
          subject: `Нова заявка: ${data.salon_name}`,
          text: [
            `Салон: ${data.salon_name}`,
            `Контакт: ${data.contact_name}`,
            `Телефон: ${data.phone ?? "—"}`,
            `Имейл: ${data.email ?? "—"}`,
            `Тип бизнес: ${data.business_type ?? "—"}`,
            `Съобщение: ${data.message ?? "—"}`,
            `Источник: ${data.source}`,
          ].join("\n"),
        }),
      }).catch((e) => console.error("[leads] notify email failed", e));
    }
  } catch (e) {
    console.error("[leads]", e);
    return NextResponse.json({ error: "Конфигурацията на сървъра не е пълна." }, { status: 503 });
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
