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

export function groupBookingsByDateRecord(bookings: Booking[]): Record<string, Booking[]> {
  const rec: Record<string, Booking[]> = {};
  for (const b of bookings) {
    (rec[b.booking_date] ??= []).push(b);
  }
  return rec;
}

/** All YYYY-MM-DD strings for the month containing anchorYmd. */
export function getMonthDateStrings(anchorYmd: string): string[] {
  const d = new Date(`${anchorYmd}T12:00:00`);
  const year = d.getFullYear();
  const month = d.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const out: string[] = [];
  for (let day = 1; day <= daysInMonth; day++) {
    const m = String(month + 1).padStart(2, "0");
    out.push(`${year}-${m}-${String(day).padStart(2, "0")}`);
  }
  return out;
}

/** Calendar grid weeks (Mon–Sun rows) for the month containing anchorYmd. */
export function getMonthWeeks(anchorYmd: string): string[][] {
  const d = new Date(`${anchorYmd}T12:00:00`);
  const year = d.getFullYear();
  const month = d.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  const firstDow = firstDay.getDay(); // 0=Sun
  const daysToMonday = firstDow === 0 ? 6 : firstDow - 1;
  const gridStart = new Date(firstDay);
  gridStart.setDate(firstDay.getDate() - daysToMonday);

  const lastDow = lastDay.getDay();
  const daysToSunday = lastDow === 0 ? 0 : 7 - lastDow;
  const gridEnd = new Date(lastDay);
  gridEnd.setDate(lastDay.getDate() + daysToSunday);

  const weeks: string[][] = [];
  const cur = new Date(gridStart);
  while (cur <= gridEnd) {
    const week: string[] = [];
    for (let i = 0; i < 7; i++) {
      const y = cur.getFullYear();
      const mo = String(cur.getMonth() + 1).padStart(2, "0");
      const day = String(cur.getDate()).padStart(2, "0");
      week.push(`${y}-${mo}-${day}`);
      cur.setDate(cur.getDate() + 1);
    }
    weeks.push(week);
  }
  return weeks;
}

/** Returns first day of the month offset by delta months from anchorYmd. */
export function addMonths(anchorYmd: string, delta: number): string {
  const d = new Date(`${anchorYmd}T12:00:00`);
  const newDate = new Date(d.getFullYear(), d.getMonth() + delta, 1);
  const y = newDate.getFullYear();
  const m = String(newDate.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}-01`;
}
