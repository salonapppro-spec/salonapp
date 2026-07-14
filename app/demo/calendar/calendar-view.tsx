"use client";

import { CalendarDays, Clock } from "lucide-react";

import { CalendarDayShell } from "@/components/admin/CalendarDayShell";
import { CalendarNavClient } from "@/components/admin/CalendarNavClient";
import { MonthCalendar } from "@/components/admin/MonthCalendar";
import { WeekTimeGrid } from "@/components/admin/WeekTimeGrid";
import { addCalendarDaysInSofia, todayDateISOInSofia } from "@/lib/booking-datetime";
import {
  addMonths,
  getMonthDateStrings,
  getWeekDateStrings,
  groupBlockedSlotsByDateRecord,
  groupBookingsByDateRecord,
} from "@/lib/calendar-week";
import { useDemo } from "@/lib/demo/store";

export type ViewType = "day" | "week" | "month";

/**
 * Датата и изгледът идват като props от server page-а. Client страница с
 * `useSearchParams()` тук не работи: Next стриймва Suspense fallback-а и
 * никога не го попълва, защото сегментът се смята за статичен.
 */
export function DemoCalendarView(props: { date: string; view: ViewType }) {
  const { date, view } = props;
  const { state } = useDemo();

  const todayStr = todayDateISOInSofia();
  const prevDate =
    view === "month" ? addMonths(date, -1) : addCalendarDaysInSofia(date, view === "week" ? -7 : -1);
  const nextDate =
    view === "month" ? addMonths(date, 1) : addCalendarDaysInSofia(date, view === "week" ? 7 : 1);

  const { tenant, services, specialists, financialSettings } = state;
  const weekHours = state.workingHours
    .slice()
    .sort((a, b) => a.day_of_week - b.day_of_week)
    .map((w) => ({ start_time: w.start_time, end_time: w.end_time, is_day_off: w.is_day_off }));

  const viewTitle = view === "week" ? "Седмица" : view === "month" ? "Месец" : "Ден";

  const header = (
    <div>
      <span
        className="inline-flex items-center gap-1.5 rounded-lg px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.2em] text-white"
        style={{ background: "linear-gradient(135deg, #C9A84C, #C8826A)" }}
      >
        <CalendarDays size={11} strokeWidth={2.4} />
        {viewTitle}
      </span>
      <h1
        className="mt-2 text-2xl font-black tracking-tight text-[#1A1A1A] sm:text-3xl"
        style={{ fontFamily: "var(--font-playfair, Georgia, serif)" }}
      >
        Календар
      </h1>
    </div>
  );

  if (view === "day") {
    const dayOfWeek = new Date(`${date}T12:00:00`).getDay();
    const wh = state.workingHours.find((w) => w.day_of_week === dayOfWeek) ?? null;
    const dayBookings = state.bookings.filter((b) => b.booking_date === date);
    const blocked = state.blockedSlots.filter((s) => s.blocked_date === date);

    return (
      <div className="admin-page-shell">
        {header}
        <CalendarNavClient date={date} view={view} prevDate={prevDate} nextDate={nextDate} />
        <div
          className="mt-4 flex items-center gap-2 rounded-xl px-4 py-2.5"
          style={{ background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.15)" }}
        >
          <Clock size={15} strokeWidth={1.8} className="shrink-0 text-[#C9A84C]/70" />
          <p className="text-sm text-[#1A1A1A]/55">
            Работно време:{" "}
            <span className="font-semibold text-[#1A1A1A]/75">
              {wh?.is_day_off ? "Почивен ден" : wh ? `${wh.start_time} – ${wh.end_time}` : "Не е зададено"}
            </span>
          </p>
        </div>
        <CalendarDayShell
          salonSlug={tenant.salon_slug}
          date={date}
          bookings={dayBookings}
          blocked={blocked}
          workingHours={wh}
          services={services}
          specialists={specialists}
          plan={tenant.plan}
          minNoticeMinutes={financialSettings.booking_min_notice_minutes}
          bufferMinutes={financialSettings.buffer_minutes}
          bookingWindowDays={financialSettings.booking_window_days}
          magneticScheduling={financialSettings.magnetic_scheduling}
        />
      </div>
    );
  }

  if (view === "week") {
    const weekDates = getWeekDateStrings(date);
    const weekBookings = state.bookings.filter((b) => weekDates.includes(b.booking_date));
    const weekBlocked = state.blockedSlots.filter((s) => weekDates.includes(s.blocked_date));

    return (
      <div className="admin-page-shell">
        {header}
        <CalendarNavClient date={date} view={view} prevDate={prevDate} nextDate={nextDate} />
        <WeekTimeGrid
          salonSlug={tenant.salon_slug}
          date={date}
          weekDates={weekDates}
          bookingsByDate={groupBookingsByDateRecord(weekBookings)}
          blockedByDate={groupBlockedSlotsByDateRecord(weekBlocked)}
          workingHoursByDow={weekHours}
          services={services}
          specialists={specialists}
          plan={tenant.plan}
        />
      </div>
    );
  }

  const monthDates = getMonthDateStrings(date);
  const monthBookings = state.bookings.filter((b) => monthDates.includes(b.booking_date));
  const monthBlocked = state.blockedSlots.filter((s) => monthDates.includes(s.blocked_date));
  const monthLabel = new Date(`${date}T12:00:00`).toLocaleDateString("bg-BG", { month: "long", year: "numeric" });

  return (
    <div className="admin-page-shell">
      {header}
      <CalendarNavClient date={date} view={view} prevDate={prevDate} nextDate={nextDate} monthLabel={monthLabel} />
      <MonthCalendar
        anchorYmd={date}
        bookingsByDate={groupBookingsByDateRecord(monthBookings)}
        blockedByDate={groupBlockedSlotsByDateRecord(monthBlocked)}
        workingHoursByDow={weekHours}
        todayStr={todayStr}
        basePath="/demo"
      />
    </div>
  );
}
