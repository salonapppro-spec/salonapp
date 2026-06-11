import { NextResponse } from "next/server";
import { randomBytes } from "crypto";

import { recoveryActionLinkForEmail } from "@/lib/owner-recovery-link";
import { CreateTenantSchema } from "@/schemas/tenant";
import { createSupabaseServiceRoleClient } from "@/lib/supabase-admin";
import { requireSuperAdminForApi } from "@/lib/super-admin-auth";

function randomPassword(): string {
  return `${randomBytes(12).toString("base64url")}9!`;
}

function buildWelcomeEmail(salonName: string): string {
  return `<!DOCTYPE html>
<html lang="bg">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background-color:#f5f5f5;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:#3D2B1F;padding:48px 40px;text-align:center;">
              <p style="margin:0 0 8px 0;font-size:13px;letter-spacing:3px;text-transform:uppercase;color:#D4B8A8;">Добре дошли в</p>
              <h1 style="margin:0;font-size:32px;font-weight:700;color:#FFF8F5;letter-spacing:-0.5px;">SalonApp<span style="color:#C8826A;">.pro</span></h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px 40px 32px;">
              <p style="margin:0 0 16px;font-size:16px;color:#2d3748;line-height:1.7;">
                Здравейте, <strong>${salonName}</strong>,
              </p>
              <p style="margin:0 0 28px;font-size:16px;color:#4a5568;line-height:1.7;">
                Благодарим Ви, че се регистрирахте в SalonApp!
              </p>

              <!-- Highlight box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td style="background:#FFF8F5;border-left:4px solid #C8826A;border-radius:0 8px 8px 0;padding:20px 24px;">
                    <p style="margin:0 0 6px;font-size:14px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#B36B52;">Следващата стъпка е наша</p>
                    <p style="margin:0;font-size:15px;color:#4a5568;line-height:1.6;">
                      Ще се свържем с Вас възможно най-скоро. Ако имате предпочитан ден и час за разговор, просто ни пишете на <a href="mailto:salonapppro@gmail.com" style="color:#B36B52;font-weight:600;text-decoration:none;">salonapppro@gmail.com</a> и ще се съобразим с Вас.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Steps -->
              <p style="margin:0 0 20px;font-size:15px;font-weight:700;color:#2d3748;text-transform:uppercase;letter-spacing:0.5px;">Какво ще направим:</p>

              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:12px;">
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

          <!-- Footer -->
          <tr>
            <td style="background:#f8f8f8;border-top:1px solid #e8e8e8;padding:28px 40px;text-align:center;">
              <p style="margin:0 0 6px;font-size:15px;font-weight:600;color:#2d3748;">Очаквайте нашето обаждане!</p>
              <p style="margin:0 0 16px;font-size:14px;color:#718096;">Екипът на SalonApp</p>
              <a href="mailto:salonapppro@gmail.com" style="font-size:13px;color:#B36B52;text-decoration:none;font-weight:600;">salonapppro@gmail.com</a>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function POST(req: Request) {
  const auth = await requireSuperAdminForApi();
  if (!auth.ok) return auth.response;

  const body = (await req.json().catch(() => null)) as unknown;
  const parsed = CreateTenantSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Невалидни данни" }, { status: 400 });
  }

  const supabase = createSupabaseServiceRoleClient();
  const { data: exists } = await supabase.from("tenants").select("id").eq("salon_slug", parsed.data.salon_slug).maybeSingle();
  if (exists) return NextResponse.json({ error: "Slug вече е зает." }, { status: 409 });

  const { error } = await supabase.from("tenants").insert({
    salon_slug: parsed.data.salon_slug,
    salon_name: parsed.data.salon_name,
    plan: parsed.data.plan,
    status: "trial",
    template: parsed.data.template,
    owner_email: parsed.data.owner_email ?? null,
    owner_phone: parsed.data.owner_phone ?? null,
    payment_type: "bank",
  });
  if (error) return NextResponse.json({ error: "Неуспешно създаване на тенант" }, { status: 500 });

  if (parsed.data.owner_email) {
    const { error: authErr } = await supabase.auth.admin.createUser({
      email: parsed.data.owner_email,
      password: randomPassword(),
      email_confirm: true,
      user_metadata: {
        salon_slug: parsed.data.salon_slug,
        plan: parsed.data.plan,
        role: "owner",
      },
      app_metadata: {
        salon_slug: parsed.data.salon_slug,
        role: "owner",
      },
    });
    if (authErr) {
      return NextResponse.json(
        {
          ok: true,
          slug: parsed.data.salon_slug,
          authError: "Тенантът е създаден, но Auth потребителят не беше създаден — провери дублиран имейл в Supabase.",
        },
        { status: 201 },
      );
    }

    const setPasswordLink = await recoveryActionLinkForEmail(parsed.data.owner_email);

    let emailDispatched = false;
    if (process.env.RESEND_API_KEY) {
      const welcomeHtml = buildWelcomeEmail(parsed.data.salon_name);
      const mailRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: process.env.RESEND_FROM ?? "SalonApp <no-reply@salonapp.pro>",
          to: [parsed.data.owner_email],
          subject: "Добре дошли в SalonApp — какво следва",
          html: welcomeHtml,
        }),
      }).catch(() => null);
      emailDispatched = Boolean(mailRes?.ok);
    }

    return NextResponse.json(
      {
        ok: true,
        slug: parsed.data.salon_slug,
        ownerEmail: parsed.data.owner_email,
        /** Еднократен линк за задаване на парола — дай на собственика (или използвай имейла, ако е изпратен). */
        setPasswordLink: setPasswordLink ?? null,
        emailDispatched,
        resendConfigured: Boolean(process.env.RESEND_API_KEY),
      },
      { status: 201 },
    );
  }

  return NextResponse.json(
    {
      ok: true,
      slug: parsed.data.salon_slug,
      ownerEmail: null,
      setPasswordLink: null,
      emailDispatched: false,
      resendConfigured: Boolean(process.env.RESEND_API_KEY),
      hint: "Няма owner email — няма автоматичен Auth потребител. Добави го в Supabase (Authentication) и задай metadata salon_slug.",
    },
    { status: 201 },
  );
}
