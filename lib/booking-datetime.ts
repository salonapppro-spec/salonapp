import { DateTime } from "luxon";

/** Calendar date for today in Europe/Sofia. */
export function todayDateISOInSofia(): string {
  return DateTime.now().setZone("Europe/Sofia").toISODate()!;
}

/** Calendar date for tomorrow in Europe/Sofia, used for reminders. */
export function tomorrowDateISOInSofia(): string {
  return DateTime.now().setZone("Europe/Sofia").plus({ days: 1 }).toISODate()!;
}

/** Add calendar days to a YYYY-MM-DD in Europe/Sofia (keeps local date arithmetic correct). */
export function addCalendarDaysInSofia(ymd: string, deltaDays: number): string {
  return DateTime.fromISO(ymd, { zone: "Europe/Sofia" })
    .plus({ days: deltaDays })
    .toISODate()!;
}

/** Booking start as a UTC Date; booking date/time are entered in Bulgaria salon time. */
export function bookingStartUtc(bookingDate: string, bookingTime: string): Date {
  const [y, mo, d] = bookingDate.split("-").map(Number);
  const parts = bookingTime.split(":");
  const h = Number(parts[0] ?? 0);
  const m = Number(parts[1] ?? 0);
  const s = Number(parts[2] ?? 0);
  return DateTime.fromObject(
    { year: y, month: mo, day: d, hour: h, minute: m, second: s },
    { zone: "Europe/Sofia" }
  ).toJSDate();
}

/** Current time in Europe/Sofia as minutes since midnight. */
export function nowMinutesInSofia(): number {
  const dt = DateTime.now().setZone("Europe/Sofia");
  return dt.hour * 60 + dt.minute;
}

/** Hours until booking start; can be negative after the booking starts. */
export function hoursUntilBooking(bookingDate: string, bookingTime: string): number {
  const start = bookingStartUtc(bookingDate, bookingTime);
  return (start.getTime() - Date.now()) / 3_600_000;
}
