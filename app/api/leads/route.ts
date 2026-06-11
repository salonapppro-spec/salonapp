import { NextResponse } from "next/server";

import { LeadInquirySchema } from "@/schemas/lead-inquiry";
import { sendLeadNotification } from "@/lib/lead-notify";
import { createSupabaseServiceRoleClient } from "@/lib/supabase-admin";

function buildLeadWelcomeEmail(name: string): string {
  return `<!DOCTYPE html>
<html lang="bg">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
<body style="margin:0;padding:0;background-color:#f5f5f5;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">

        <tr>
          <td style="background:#3D2B1F;padding:48px 40px;text-align:center;">
            <p style="margin:0 0 8px 0;font-size:13px;letter-spacing:3px;text-transform:uppercase;color:#D4B8A8;">Добре дошли в</p>
            <h1 style="margin:0;font-size:32px;font-weight:700;color:#FFF8F5;letter-spacing:-0.5px;">SalonApp<span style="color:#C8826A;">.pro</span></h1>
          </td>
        </tr>

        <tr>
          <td style="padding:40px 40px 32px;">
            <p style="margin:0 0 16px;font-size:16px;color:#2d3748;line-height:1.7;">
              Здравейте, <strong>${name}</strong>,
            </p>
            <p style="margin:0 0 28px;font-size:16px;color:#4a5568;line-height:1.7;">
              Благодарим Ви, че се регистрирахте в SalonApp!
            </p>

            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
              <tr>
                <td style="background:#FFF8F5;border-left:4px solid #C8826A;border-radius:0 8px 8px 0;padding:20px 24px;">
                  <p style="margin:0 0 6px;font-size:14px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#8F5644;">Следващата стъпка е наша</p>
                  <p style="margin:0;font-size:15px;color:#4a5568;line-height:1.6;">
                    Ще се свържем с Вас възможно най-скоро. Ако имате предпочитан ден и час за разговор, просто ни пишете на <a href="mailto:salonapppro@gmail.com" style="color:#B36B52;font-weight:600;text-decoration:none;">salonapppro@gmail.com</a> и ще се съобразим с Вас.
                  </p>
                </td>
              </tr>
            </table>

            <p style="margin:0 0 20px;font-size:13px;font-weight:700;color:#2d3748;text-transform:uppercase;letter-spacing:0.5px;">Какво ще направим:</p>

            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td width="40" valign="top" style="padding-top:2px;">
                  <div style="width:28px;height:28px;border-radius:50%;background:#3D2B1F;color:#C8826A;font-size:13px;font-weight:700;text-align:center;line-height:28px;">1</div>
                </td>
                <td style="font-size:15px;color:#4a5568;line-height:1.6;padding-bottom:16px;">
                  Ще се обадим, за да разберем как си представяте Вашия сайт — какви услуги предлагате, какви снимки имате, какъв стил предпочитате.
                </td>
              </tr>
              <tr>
                <td width="40" valign="top" style="padding-top:2px;">
                  <div style="width:28px;height:28px;border-radius:50%;background:#3D2B1F;color:#C8826A;font-size:13px;font-weight:700;text-align:center;line-height:28px;">2</div>
                </td>
                <td style="font-size:15px;color:#4a5568;line-height:1.6;padding-bottom:16px;">
                  Всичко, което ни предоставите, ние ще наредим и настроим вместо Вас. <strong style="color:#2d3748;">Вие не трябва да се занимавате с настройки.</strong>
                </td>
              </tr>
              <tr>
                <td width="40" valign="top" style="padding-top:2px;">
                  <div style="width:28px;height:28px;border-radius:50%;background:#3D2B1F;color:#C8826A;font-size:13px;font-weight:700;text-align:center;line-height:28px;">3</div>
                </td>
                <td style="font-size:15px;color:#4a5568;line-height:1.6;padding-bottom:16px;">
                  След като профилът Ви е готов, ще получите видео с обяснение как се работи с админ панела — лесно и бързо.
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <tr>
          <td style="background:#f8f8f8;border-top:1px solid #e8e8e8;padding:28px 40px;text-align:center;">
            <p style="margin:0 0 6px;font-size:15px;font-weight:600;color:#2d3748;">Очаквайте нашето обаждане!</p>
            <p style="margin:0 0 16px;font-size:14px;color:#718096;">Екипът на SalonApp</p>
            <a href="mailto:salonapppro@gmail.com" style="font-size:13px;color:#B36B52;text-decoration:none;font-weight:600;">salonapppro@gmail.com</a>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

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
      plan: data.plan ?? "starter",
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

    if (data.email && process.env.RESEND_API_KEY) {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: process.env.RESEND_FROM ?? "SalonApp <no-reply@salonapp.pro>",
          to: [data.email],
          subject: "Добре дошли в SalonApp — какво следва",
          html: buildLeadWelcomeEmail(data.contact_name ?? data.salon_name),
        }),
      }).catch(() => undefined);
    }

    await sendLeadNotification({
      subject: `Нова заявка: ${data.salon_name}`,
      lines: [
        `Салон: ${data.salon_name}`,
        `Контакт: ${data.contact_name}`,
        `Телефон: ${data.phone ?? "—"}`,
        `Имейл: ${data.email ?? "—"}`,
        `Тип бизнес: ${data.business_type ?? "—"}`,
        `Съобщение: ${data.message ?? "—"}`,
        `Източник: ${data.source}`,
      ],
    });
  } catch (e) {
    console.error("[leads]", e);
    return NextResponse.json({ error: "Конфигурацията на сървъра не е пълна." }, { status: 503 });
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
