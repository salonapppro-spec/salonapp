import { NextResponse } from "next/server";

import { LeadInquirySchema } from "@/schemas/lead-inquiry";
import { createSupabaseServiceRoleClient } from "@/lib/supabase-admin";

/**
 * Marketing funnel: save pre-sale lead. Requires `platform_leads` migration + SUPABASE_SERVICE_ROLE_KEY in prod.
 */
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

  try {
    const supabase = createSupabaseServiceRoleClient();
    const { error } = await supabase.from("platform_leads").insert({
      plan: data.plan,
      salon_name: data.salon_name,
      contact_name: data.contact_name,
      email: data.email,
      phone: data.phone || null,
      message: data.message || null,
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
          subject: `Нова заявка: ${data.salon_name} (${data.plan})`,
          text: [
            `Салон: ${data.salon_name}`,
            `Контакт: ${data.contact_name}`,
            `Имейл: ${data.email}`,
            `Телефон: ${data.phone ?? "—"}`,
            `План: ${data.plan}`,
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
