import type { Booking } from "@/types";

/** Monday–Sunday week containing `anchorYmd` (YYYY-MM-DD), local timezone. */
export function getWeekDateStrings(anchorYmd: string): string[] {
  const d = new Date(`${anchorYmd}T12:00:00`);
  const dow = d.getDay(); // 0 Sun … 6 Sat
  const toMonday = dow === 0 ? -6 : 1 - dow;
  const mon = new Date(d);
  mon.setDate(d.getDate() + toMonday);
  const out: string[] = [];
  for (let i = 0; i < 7; i++) {
    const x = new Date(mon);
    x.setDate(mon.getDate() + i);
    const y = x.getFullYear();
    const mth = String(x.getMonth() + 1).padStart(2, "0");
    const day = String(x.getDate()).padStart(2, "0");
    out.push(`${y}-${mth}-${day}`);
  }
  return out;
}

export function groupBookingsByDate(bookings: Booking[]): Map<string, Booking[]> {
  const m = new Map<string, Booking[]>();
  for (const b of bookings) {
    const key = b.booking_date;
    const arr = m.get(key) ?? [];
    arr.push(b);
    m.set(key, arr);
  }
  return m;
}
