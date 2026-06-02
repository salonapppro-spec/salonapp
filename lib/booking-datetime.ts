import { DateTime } from "luxon";

/** Календарна дата "днес" в Europe/Sofia. */
export function todayDateISOInSofia(): string {
  return DateTime.now().setZone("Europe/Sofia").toISODate()!;
}

/** Календарна дата "утре" в Europe/Sofia (за напомняния). */
export function tomorrowDateISOInSofia(): string {
  return DateTime.now().setZone("Europe/Sofia").plus({ days: 1 }).toISODate()!;
}

/** Начало на резервацията като UTC Date (датата и часът са в салонна зона BG). */
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

/** Часове до началото на часа (може да е отрицателно след началото). */
export function hoursUntilBooking(bookingDate: string, bookingTime: string): number {
  const start = bookingStartUtc(bookingDate, bookingTime);
  return (start.getTime() - Date.now()) / 3_600_000;
}
