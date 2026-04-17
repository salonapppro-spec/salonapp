import { NextResponse } from "next/server";
import { randomBytes } from "crypto";

import { recoveryActionLinkForEmail } from "@/lib/owner-recovery-link";
import { CreateTenantSchema } from "@/schemas/tenant";
import { createSupabaseServiceRoleClient } from "@/lib/supabase-admin";
import { requireSuperAdminForApi } from "@/lib/super-admin-auth";

function randomPassword(): string {
  return `${randomBytes(12).toString("base64url")}9!`;
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
      const linkBlock = setPasswordLink
        ? `<p><strong>Важно:</strong> паролата е генерирана автоматично — не я знаеш ти, нито собственикът. Задай я от този еднократен линк:</p><p><a href="${setPasswordLink}">Задай парола и влез в админ панела</a></p>`
        : `<p>Линк за парола не беше генериран (провери Redirect URLs в Supabase). Супер админът може да копира линка от отговора на API или да зададе парола ръчно в Authentication → Users.</p>`;
      const mailRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: process.env.RESEND_FROM ?? "SalonApp <no-reply@salonapp.pro>",
          to: [parsed.data.owner_email],
          subject: "Добре дошли в SalonApp",
          html: `<p>Профилът за <strong>${parsed.data.salon_name}</strong> е създаден.</p><p>Имейл за вход: ${parsed.data.owner_email}</p>${linkBlock}<p>Адрес на админ панела: същият домейн като приложението → /admin/login</p>`,
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
