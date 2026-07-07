import { render } from "@react-email/render";
import { DateTime } from "luxon";
import * as React from "react";

import BookingConfirmationEmail from "@/emails/BookingConfirmation";
import BookingReminderEmail from "@/emails/BookingReminder";
import { bookingStartUtc } from "@/lib/booking-datetime";
import { getPublicAppUrl } from "@/lib/site-url";
import { sendSMSReminder } from "@/lib/sms";
import { tenantDb } from "@/lib/tenant-db";
import type { Booking, Tenant } from "@/types";

const FROM_DEFAULT = "SalonApp <no-reply@salonapp.pro>";

const HAIR_LEN_BG: Record<string, string> = {
  short: "къса коса",
  medium: "средна дължина",
  long: "дълга коса",
};
const HAIR_DEN_BG: Record<string, string> = {
  thin: "рядка гъстота",
  medium: "средна гъстота",
  thick: "гъста коса",
};

function resendFrom(): string {
  return process.env.RESEND_FROM ?? FROM_DEFAULT;
}

function contactLines(tenant: Tenant): string[] {
  const lines: string[] = [];
  if (tenant.phone) lines.push(`Телефон: ${tenant.phone}`);
  if (tenant.email) lines.push(`Имейл: ${tenant.email}`);
  if (tenant.address) lines.push(`Адрес: ${tenant.address}`);
  if (lines.length === 0) lines.push(tenant.salon_name);
  return lines;
}

function formatTime(t: string): string {
  return t.slice(0, 5);
}

function buildGoogleCalendarUrl(booking: Booking, tenant: Tenant): string {
  const start = DateTime.fromJSDate(bookingStartUtc(booking.booking_date, booking.booking_time), {
    zone: "Europe/Sofia",
  });
  const end = start.plus({ minutes: booking.service_duration });
  const fmt = (d: DateTime) => d.toFormat("yyyyMMdd'T'HHmmss");
  const text = encodeURIComponent(`${booking.service_name} — ${tenant.salon_name}`);
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${fmt(start)}/${fmt(end)}`;
}

async function logEmail(params: {
  salon_slug: string;
  booking_id: string;
  type: "confirmation" | "reminder";
  status: "sent" | "failed";
}): Promise<void> {
  await tenantDb(params.salon_slug).emailLogs.insert({
    booking_id: params.booking_id,
    type: params.type,
    status: params.status,
  });
}

async function sendResendHtml(
  to: string,
  subject: string,
  html: string,
  extraHeaders?: Record<string, string>
): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return false;
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: resendFrom(),
      to: [to],
      subject,
      html,
      ...(extraHeaders ? { headers: extraHeaders } : {}),
    }),
  }).catch(() => null);
  return Boolean(res && res.ok);
}

async function loadServiceIsComplex(serviceId: string | null, salonSlug: string): Promise<boolean> {
  if (!serviceId) return false;
  const { data } = await tenantDb(salonSlug).services.getComplexFlag(serviceId);
  return Boolean((data as { is_complex?: boolean } | null)?.is_complex);
}

function hairDetailsText(booking: Booking, isComplex: boolean): string | null {
  if (!isComplex) return null;
  const parts: string[] = [];
  if (booking.hair_length) parts.push(HAIR_LEN_BG[booking.hair_length] ?? booking.hair_length);
  if (booking.hair_density) parts.push(HAIR_DEN_BG[booking.hair_density] ?? booking.hair_density);
  return parts.length ? parts.join(", ") : null;
}

export async function sendConfirmationEmail(booking: Booking, tenant: Tenant): Promise<void> {
  const to = booking.client_email?.trim();
  if (!to) return;

  const baseUrl = getPublicAppUrl();
  const isComplex = await loadServiceIsComplex(booking.service_id ?? null, booking.salon_slug);
  const hairDetails = hairDetailsText(booking, isComplex);
  const token = booking.confirmation_token ?? "";
  const salonQuery = `salon=${encodeURIComponent(booking.salon_slug)}`;
  const confirmUrl = `${baseUrl}/api/confirm/${token}?${salonQuery}`;
  const cancelUrl = `${baseUrl}/api/cancel/${token}?${salonQuery}`;
  const unsubscribeUrl = `${baseUrl}/api/unsubscribe?salon=${encodeURIComponent(booking.salon_slug)}&booking=${encodeURIComponent(booking.id)}&token=${encodeURIComponent(token)}`;
  const bookingDateLabel = DateTime.fromISO(booking.booking_date, { zone: "Europe/Sofia" })
    .setLocale("bg")
    .toFormat("d MMMM yyyy");
  const bookingTimeLabel = formatTime(booking.booking_time);
  const subject = `Резервацията ви е потвърдена! ${bookingDateLabel} · ${bookingTimeLabel} — ${tenant.salon_name}`;

  const html = await render(
    <BookingConfirmationEmail
      salonName={tenant.salon_name}
      clientName={booking.client_name}
      serviceName={booking.service_name}
      bookingDate={bookingDateLabel}
      bookingTime={bookingTimeLabel}
      priceEur={Number(booking.service_price_eur).toFixed(2)}
      googleCalendarUrl={buildGoogleCalendarUrl(booking, tenant)}
      confirmUrl={confirmUrl}
      cancelUrl={cancelUrl}
      contactLines={contactLines(tenant)}
      unsubscribeUrl={unsubscribeUrl}
      messageRef={booking.id}
      hairDetails={hairDetails}
    />
  );

  const ok = await sendResendHtml(to, subject, html, {
    "X-Entity-Ref-ID": booking.id,
    "List-Unsubscribe": `<${unsubscribeUrl}>`,
  });
  await logEmail({
    salon_slug: booking.salon_slug,
    booking_id: booking.id,
    type: "confirmation",
    status: ok ? "sent" : "failed",
  });
}

export async function sendSalonBookingNotification(booking: Booking, tenant: Tenant): Promise<void> {
  const to = (tenant.owner_email ?? tenant.email)?.trim();
  if (!to) return;

  const date = DateTime.fromISO(booking.booking_date, { zone: "Europe/Sofia" })
    .setLocale("bg")
    .toFormat("d MMMM yyyy");
  const time = formatTime(booking.booking_time);

  const html = `
<!DOCTYPE html>
<html lang="bg">
<body style="font-family:Arial,sans-serif;color:#222;max-width:520px;margin:0 auto;padding:24px">
  <h2 style="color:#1a1a1a;margin-bottom:4px">📅 Нова резервация</h2>
  <p style="color:#555;margin-top:0">${tenant.salon_name}</p>
  <table style="width:100%;border-collapse:collapse;margin:16px 0">
    <tr><td style="padding:8px 0;color:#666;width:130px">Клиент</td><td style="padding:8px 0;font-weight:600">${booking.client_name}</td></tr>
    <tr><td style="padding:8px 0;color:#666">Телефон</td><td style="padding:8px 0">${booking.client_phone}</td></tr>
    ${booking.client_email ? `<tr><td style="padding:8px 0;color:#666">Имейл</td><td style="padding:8px 0">${booking.client_email}</td></tr>` : ""}
    <tr><td style="padding:8px 0;color:#666">Услуга</td><td style="padding:8px 0">${booking.service_name}</td></tr>
    <tr><td style="padding:8px 0;color:#666">Дата и час</td><td style="padding:8px 0;font-weight:600">${date} в ${time}</td></tr>
    ${booking.notes ? `<tr><td style="padding:8px 0;color:#666">Бележки</td><td style="padding:8px 0">${booking.notes}</td></tr>` : ""}
  </table>
  <p style="font-size:12px;color:#999;margin-top:32px">SalonApp.pro — автоматично известие</p>
</body>
</html>`;

  await sendResendHtml(to, `Нова резервация: ${booking.client_name} — ${date} ${time}`, html);
}

export async function sendSalonBookingTokenNotification(
  booking: Booking,
  tenant: Tenant,
  action: "confirmed" | "cancelled"
): Promise<void> {
  const to = (tenant.owner_email ?? tenant.email)?.trim();
  if (!to) return;

  const date = DateTime.fromISO(booking.booking_date, { zone: "Europe/Sofia" })
    .setLocale("bg")
    .toFormat("d MMMM yyyy");
  const time = formatTime(booking.booking_time);
  const title = action === "confirmed" ? "Клиентът потвърди присъствието си" : "Клиентът отказа резервацията";
  const emoji = action === "confirmed" ? "✅" : "❌";

  const html = `
<!DOCTYPE html>
<html lang="bg">
<body style="font-family:Arial,sans-serif;color:#222;max-width:520px;margin:0 auto;padding:24px">
  <h2 style="color:#1a1a1a;margin-bottom:4px">${emoji} ${title}</h2>
  <p style="color:#555;margin-top:0">${tenant.salon_name}</p>
  <table style="width:100%;border-collapse:collapse;margin:16px 0">
    <tr><td style="padding:8px 0;color:#666;width:130px">Клиент</td><td style="padding:8px 0;font-weight:600">${booking.client_name}</td></tr>
    <tr><td style="padding:8px 0;color:#666">Телефон</td><td style="padding:8px 0">${booking.client_phone}</td></tr>
    <tr><td style="padding:8px 0;color:#666">Услуга</td><td style="padding:8px 0">${booking.service_name}</td></tr>
    <tr><td style="padding:8px 0;color:#666">Дата и час</td><td style="padding:8px 0;font-weight:600">${date} в ${time}</td></tr>
  </table>
  <p style="font-size:12px;color:#999;margin-top:32px">SalonApp.pro — автоматично известие</p>
</body>
</html>`;

  await sendResendHtml(to, `${title}: ${booking.client_name} — ${date} ${time}`, html);
}

/**
 * Изпраща напомняне (имейл и/или SMS) и връща дали е доставено.
 * НЕ пише в email_logs — логът е claim-ът в cron reminders route-а
 * (claim-преди-send, одит A1+A3); успех = имейл ИЛИ SMS.
 */
export async function sendReminderEmail(booking: Booking, tenant: Tenant): Promise<boolean> {
  const baseUrl = getPublicAppUrl();
  const token = booking.confirmation_token ?? "";
  const salonQuery = `salon=${encodeURIComponent(booking.salon_slug)}`;
  const confirmUrl = `${baseUrl}/api/confirm/${token}?${salonQuery}`;
  const cancelUrl = `${baseUrl}/api/cancel/${token}?${salonQuery}`;

  const to = booking.client_email?.trim();
  let emailSent = false;
  if (to) {
    const html = await render(
      <BookingReminderEmail
        salonName={tenant.salon_name}
        clientName={booking.client_name}
        serviceName={booking.service_name}
        bookingDate={booking.booking_date}
        bookingTime={formatTime(booking.booking_time)}
        confirmUrl={confirmUrl}
        cancelUrl={cancelUrl}
        contactLines={contactLines(tenant)}
      />
    );

    const ok = await sendResendHtml(to, `Напомняне: Утре имате час в ${tenant.salon_name}`, html);
    if (ok) emailSent = true;
  }

  const smsSent = await sendSMSReminder(booking, tenant);
  return emailSent || smsSent;
}
