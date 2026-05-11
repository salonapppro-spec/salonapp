import Link from "next/link";

import { getMonthWeeks } from "@/lib/calendar-week";
import type { Booking, BookingStatus } from "@/types";

const DOW_HEADERS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Нд"];

const STATUS_DOT: Record<BookingStatus, string> = {
  pending:   "#f59e0b",
  confirmed: "#60a5fa",
  completed: "#34d399",
  no_show:   "#f87171",
  cancelled: "#d1d5db",
};

type SimpleWH = { start_time: string; end_time: string; is_day_off: boolean };

// weekDates grid index → day_of_week (Mon=1 … Sat=6, Sun=0)
function dowOf(i: number): number { return i === 6 ? 0 : i + 1; }

export function MonthCalendar(props: {
  anchorYmd: string;
  bookingsByDate: Record<string, Booking[]>;
  workingHoursByDow: SimpleWH[];
  todayStr: string;
}) {
  const { anchorYmd, bookingsByDate, workingHoursByDow, todayStr } = props;
  const weeks = getMonthWeeks(anchorYmd);
  const anchorDate = new Date(`${anchorYmd}T12:00:00`);
  const anchorMonth = anchorDate.getMonth();
  const anchorYear  = anchorDate.getFullYear();

  return (
    <div
      className="mt-4 overflow-hidden rounded-2xl bg-white"
      style={{ boxShadow: "0 2px 4px rgba(0,0,0,0.04), 0 8px 32px rgba(0,0,0,0.07)", border: "1px solid rgba(201,168,76,0.2)" }}
    >
      {/* top accent */}
      <div className="h-[3px]" style={{ background: "linear-gradient(90deg, #C9A84C, #C8826A)" }} />

      {/* DOW headers */}
      <div className="grid grid-cols-7 border-b" style={{ borderColor: "rgba(201,168,76,0.12)", background: "rgba(201,168,76,0.04)" }}>
        {DOW_HEADERS.map((d) => (
          <div key={d} className="py-2.5 text-center text-[10px] font-black uppercase tracking-widest" style={{ color: "rgba(201,168,76,0.65)" }}>
            {d}
          </div>
        ))}
      </div>

      {/* weeks */}
      {weeks.map((week, wi) => (
        <div key={wi} className="grid grid-cols-7 border-b last:border-b-0" style={{ borderColor: "rgba(201,168,76,0.08)" }}>
          {week.map((d, di) => {
            const dt = new Date(`${d}T12:00:00`);
            const isThisMonth = dt.getMonth() === anchorMonth && dt.getFullYear() === anchorYear;
            const isToday = d === todayStr;
            const wh = workingHoursByDow[dowOf(di)];
            const dayBookings = bookingsByDate[d] ?? [];
            const active = dayBookings.filter((b) => b.status !== "cancelled");

            return (
              <Link
                key={d}
                href={`/admin/calendar?date=${d}&view=day`}
                className="group relative flex min-h-[72px] flex-col border-r p-1.5 last:border-r-0 transition-colors hover:bg-[#C9A84C]/[0.05] sm:min-h-[88px] sm:p-2"
                style={{
                  borderColor: "rgba(201,168,76,0.08)",
                  background: isToday
                    ? "rgba(201,168,76,0.07)"
                    : wh?.is_day_off && isThisMonth
                    ? "rgba(0,0,0,0.015)"
                    : "transparent",
                  opacity: isThisMonth ? 1 : 0.35,
                }}
              >
                {/* date number */}
                <span
                  className={`inline-flex h-5 w-5 items-center justify-center self-start rounded-full text-[11px] font-black sm:h-6 sm:w-6 sm:text-xs`}
                  style={{
                    background: isToday ? "linear-gradient(135deg,#C9A84C,#C8826A)" : "transparent",
                    color: isToday ? "white" : isThisMonth ? "#1A1A1A" : "rgba(26,26,26,0.4)",
                  }}
                >
                  {dt.getDate()}
                </span>

                {/* "Почивен" label */}
                {wh?.is_day_off && isThisMonth && (
                  <span className="mt-0.5 text-[8px] font-medium" style={{ color: "rgba(26,26,26,0.25)" }}>
                    почивен
                  </span>
                )}

                {/* booking count + dots */}
                {active.length > 0 && (
                  <div className="mt-auto">
                    <div className="flex flex-wrap gap-0.5">
                      {active.slice(0, 5).map((b, bi) => (
                        <span
                          key={bi}
                          className="block h-1.5 w-1.5 rounded-full"
                          style={{ background: STATUS_DOT[b.status] ?? "#d1d5db" }}
                        />
                      ))}
                      {active.length > 5 && (
                        <span className="text-[8px] font-bold leading-none" style={{ color: "rgba(26,26,26,0.35)" }}>
                          +{active.length - 5}
                        </span>
                      )}
                    </div>
                    <span className="mt-0.5 block text-[9px] font-semibold" style={{ color: "rgba(26,26,26,0.4)" }}>
                      {active.length} {active.length === 1 ? "час" : "часа"}
                    </span>
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      ))}
    </div>
  );
}
