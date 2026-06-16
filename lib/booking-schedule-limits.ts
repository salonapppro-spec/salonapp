import { addCalendarDaysInSofia } from "@/lib/booking-datetime";

export type ScheduleLimitReject = { ok: false; error: string };

/** Min notice applies only for today's date (same as GET /api/availability). */
export function checkMinNoticeBooking(params: {
  bookingDate: string;
  bookingStartMinutes: number;
  todayStr: string;
  nowMinutes: number;
  minNoticeMinutes: number;
}): ScheduleLimitReject | null {
  const { bookingDate, bookingStartMinutes, todayStr, nowMinutes, minNoticeMinutes } = params;
  if (bookingDate !== todayStr) return null;
  if (bookingStartMinutes < nowMinutes + minNoticeMinutes) {
    return {
      ok: false,
      error: `Резервацията изисква поне ${minNoticeMinutes} минути предизвестие.`,
    };
  }
  return null;
}

export function checkBookingWindowLimit(params: {
  bookingDate: string;
  todayStr: string;
  bookingWindowDays: number | null | undefined;
}): ScheduleLimitReject | null {
  const { bookingDate, todayStr, bookingWindowDays } = params;
  if (typeof bookingWindowDays !== "number" || bookingWindowDays <= 0) return null;
  const maxDateStr = addCalendarDaysInSofia(todayStr, bookingWindowDays);
  if (bookingDate > maxDateStr) {
    return {
      ok: false,
      error: `Резервации се приемат най-много ${bookingWindowDays} дни напред.`,
    };
  }
  return null;
}

export function rejectIfOutsideScheduleLimits(params: {
  bookingDate: string;
  bookingStartMinutes: number;
  todayStr: string;
  nowMinutes: number;
  minNoticeMinutes: number;
  bookingWindowDays: number | null | undefined;
}): ScheduleLimitReject | null {
  return (
    checkMinNoticeBooking(params) ??
    checkBookingWindowLimit({
      bookingDate: params.bookingDate,
      todayStr: params.todayStr,
      bookingWindowDays: params.bookingWindowDays,
    })
  );
}
