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

async function sendResendHtml(to: string, subject: string, html: string): Promise<boolean> {
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
  const unsubscribeUrl = `${baseUrl}/unsubscribe?booking=${encodeURIComponent(booking.id)}&token=${encodeURIComponent(token)}`;

  const html = await render(
    <BookingConfirmationEmail
      salonName={tenant.salon_name}
      clientName={booking.client_name}
      serviceName={booking.service_name}
      bookingDate={booking.booking_date}
      bookingTime={formatTime(booking.booking_time)}
      priceEur={Number(booking.service_price_eur).toFixed(2)}
      googleCalendarUrl={buildGoogleCalendarUrl(booking, tenant)}
      contactLines={contactLines(tenant)}
      unsubscribeUrl={unsubscribeUrl}
      hairDetails={hairDetails}
    />
  );

  const ok = await sendResendHtml(to, `Резервацията ви е потвърдена! — ${tenant.salon_name}`, html);
  await logEmail({
    salon_slug: booking.salon_slug,
    booking_id: booking.id,
    type: "confirmation",
    status: ok ? "sent" : "failed",
  });
}

export async function sendReminderEmail(booking: Booking, tenant: Tenant): Promise<void> {
  const baseUrl = getPublicAppUrl();
  const token = booking.confirmation_token ?? "";
  const confirmUrl = `${baseUrl}/api/confirm/${token}`;
  const cancelUrl = `${baseUrl}/api/cancel/${token}`;

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
  if (!emailSent && !smsSent) {
    await logEmail({
      salon_slug: booking.salon_slug,
      booking_id: booking.id,
      type: "reminder",
      status: "failed",
    });
    return;
  }

  /** Успешно напомняне (имейл или само SMS) — спира cron. При неуспешен имейл няма запис → повторен опит. */
  await logEmail({
    salon_slug: booking.salon_slug,
    booking_id: booking.id,
    type: "reminder",
    status: "sent",
  });
}
