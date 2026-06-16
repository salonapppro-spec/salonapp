import { revalidatePath } from "next/cache";

import { sendSalonBookingTokenNotification } from "@/lib/email";
import { getTenant } from "@/lib/get-tenant";
import { tenantDb } from "@/lib/tenant-db";
import type { Booking } from "@/types";

async function notifySalonTokenUpdate(
  salonSlug: string,
  bookingId: string,
  action: "confirmed" | "cancelled"
): Promise<void> {
  const { data } = await tenantDb(salonSlug).bookings.getById(bookingId);
  if (!data) return;

  const tenant = await getTenant(salonSlug);
  if (!tenant) return;

  await sendSalonBookingTokenNotification(data as Booking, tenant, action);
}

export async function afterBookingTokenConfirm(salonSlug: string, bookingId: string): Promise<void> {
  revalidatePath(`/${salonSlug}`);
  try {
    await notifySalonTokenUpdate(salonSlug, bookingId, "confirmed");
  } catch (e) {
    console.error("[afterBookingTokenConfirm]", e);
  }
}

export async function afterBookingTokenCancel(salonSlug: string, bookingId: string): Promise<void> {
  revalidatePath(`/${salonSlug}`);
  try {
    await notifySalonTokenUpdate(salonSlug, bookingId, "cancelled");
  } catch (e) {
    console.error("[afterBookingTokenCancel]", e);
  }
}
