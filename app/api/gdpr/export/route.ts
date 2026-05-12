import { NextResponse } from "next/server";
import { z } from "zod";

import { createSupabaseServiceRoleClient } from "@/lib/supabase-admin";
import { normalizePhone } from "@/lib/phone";

const Schema = z.object({
  email: z.string().email().optional(),
  phone: z.string().min(6).max(30).optional(),
}).refine((d) => d.email || d.phone, { message: "Необходим е имейл или телефон" });

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Необходим е валиден имейл или телефон" }, { status: 400 });
  }

  const { email, phone } = parsed.data;
  const normalizedPhone = phone ? normalizePhone(phone) : null;

  const supabase = createSupabaseServiceRoleClient();

  // Look up bookings by email or phone
  let query = supabase
    .from("bookings")
    .select("id, salon_slug, booking_date, booking_time, service_name, service_price_eur, status, client_name, client_email, client_phone, notes, created_at");

  if (email && normalizedPhone) {
    query = query.or(`client_email.eq.${email},client_phone.eq.${normalizedPhone}`);
  } else if (email) {
    query = query.eq("client_email", email);
  } else if (normalizedPhone) {
    query = query.eq("client_phone", normalizedPhone);
  }

  const { data: bookings, error } = await query.order("booking_date", { ascending: false });

  if (error) {
    return NextResponse.json({ error: "Грешка при извличане на данни" }, { status: 500 });
  }

  const recipientEmail = email ?? bookings?.[0]?.client_email ?? null;

  if (!recipientEmail) {
    return NextResponse.json({ ok: true, message: "Ако имаме данни за вас, ще получите имейл." });
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
        to: [recipientEmail],
        subject: "SalonApp — вашите лични данни (GDPR износ)",
        text: `Здравейте,\n\nПо ваша заявка, ето всички данни, които съхраняваме за вас в SalonApp:\n\n${text}\n\nЗа изтриване на данните: https://salonapp.pro/gdpr\n\nЕкипът на SalonApp`,
      }),
    }).catch((e) => console.error("[gdpr-export] Resend error:", e));
  }

  return NextResponse.json({ ok: true, message: "Ако имаме данни за вас, ще получите имейл." });
}
