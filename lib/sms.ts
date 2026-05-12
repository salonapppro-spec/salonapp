import twilio from "twilio";

import type { Booking, Tenant } from "@/types";
import { tenantDb } from "@/lib/tenant-db";
import type { Specialist } from "@/types/database";

function normalizeBgPhone(phone: string): string | null {
  const p = phone.replace(/[\s-]/g, "");
  if (!p) return null;
  if (p.startsWith("+")) return p;
  if (p.startsWith("0")) return `+359${p.slice(1)}`;
  if (/^\d{9}$/.test(p)) return `+359${p}`;
  return null;
}

function shouldSendSmsForPlan(tenant: Tenant, specialist: Specialist | null): boolean {
  if (tenant.plan === "pro") return true;
  if (tenant.plan === "premium" && specialist?.sms_reminders_enabled) return true;
  return false;
}

/** SMS напомняне (Twilio). Премиум: изпраща при конфигурация. Колектив: само при sms_reminders_enabled. */
export async function sendSMSReminder(booking: Booking, tenant: Tenant): Promise<boolean> {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM_NUMBER ?? process.env.TWILIO_PHONE_NUMBER;
  if (!sid || !token || !from) return false;

  const to = normalizeBgPhone(booking.client_phone ?? "");
  if (!to) return false;

  let specialist: Specialist | null = null;
  if (booking.specialist_id) {
    const { data } = await tenantDb(booking.salon_slug).specialists.getById(booking.specialist_id);
    specialist = data as Specialist | null;
  }

  if (!shouldSendSmsForPlan(tenant, specialist)) return false;

  const time = booking.booking_time.slice(0, 5);
  const body = `Напомняне: ${tenant.salon_name} — ${booking.service_name} на ${booking.booking_date} в ${time}. Очакваме ви!`;

  try {
    const client = twilio(sid, token);
    await client.messages.create({ from, to, body });
    return true;
  } catch {
    /* best-effort */
    return false;
  }
}
