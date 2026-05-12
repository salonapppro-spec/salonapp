import { NextResponse } from "next/server";

import { createSupabaseServiceRoleClient } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token")?.trim();

  if (!token) {
    return NextResponse.json({ error: "Невалиден линк" }, { status: 400 });
  }

  const supabase = createSupabaseServiceRoleClient();

  const { data: tokenRow, error: tokenError } = await supabase
    .from("gdpr_export_tokens")
    .select("id, email, phone, expires_at, used_at")
    .eq("token", token)
    .maybeSingle();

  if (tokenError || !tokenRow) {
    return NextResponse.json({ error: "Невалиден или изтекъл линк" }, { status: 400 });
  }

  if (tokenRow.used_at) {
    return NextResponse.json({ error: "Линкът вече е използван" }, { status: 400 });
  }

  if (new Date(tokenRow.expires_at) < new Date()) {
    return NextResponse.json({ error: "Линкът е изтекъл. Моля, направете нова заявка." }, { status: 400 });
  }

  // Mark token as used (single-use)
  await supabase
    .from("gdpr_export_tokens")
    .update({ used_at: new Date().toISOString() })
    .eq("id", tokenRow.id);

  const { email, phone } = tokenRow;

  let query = supabase
    .from("bookings")
    .select(
      "id, salon_slug, booking_date, booking_time, service_name, service_price_eur, status, client_name, client_email, client_phone, notes, created_at"
    );

  if (email && phone) {
    query = query.or(`client_email.eq.${email},client_phone.eq.${phone}`);
  } else {
    query = query.eq("client_email", email);
  }

  const { data: bookings, error: dbError } = await query.order("booking_date", { ascending: false });

  if (dbError) {
    return NextResponse.json({ error: "Грешка при извличане на данни" }, { status: 500 });
  }

  const resendKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM ?? "SalonApp <no-reply@salonapp.pro>";

  if (resendKey) {
    const rows = (bookings ?? []).map((b) =>
      [
        `Дата: ${b.booking_date} ${b.booking_time?.slice(0, 5)}`,
        `Салон: ${b.salon_slug}`,
        `Услуга: ${b.service_name} (${b.service_price_eur} €)`,
        `Статус: ${b.status}`,
        `Бележки: ${b.notes ?? "—"}`,
        `Записано на: ${b.created_at?.slice(0, 10)}`,
      ].join(" | ")
    );

    const text = bookings?.length
      ? `Намерихме ${bookings.length} резервации:\n\n${rows.join("\n")}`
      : "Нямаме записани данни за вашия имейл или телефон.";

    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [email],
        subject: "SalonApp — вашите лични данни (GDPR износ)",
        text: [
          "Здравейте,",
          "",
          "По ваша заявка, ето всички данни, които съхраняваме за вас в SalonApp:",
          "",
          text,
          "",
          "За изтриване на данните: https://salonapp.pro/gdpr",
          "",
          "Екипът на SalonApp",
        ].join("\n"),
      }),
    }).catch((e) => console.error("[gdpr-export-confirm] Resend error:", e));
  }

  return NextResponse.json({
    ok: true,
    message: "Данните ви бяха изпратени на имейл адреса, с който направихте заявката.",
  });
}
