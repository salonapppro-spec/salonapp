import { Suspense } from "react";
import Link from "next/link";

import { CalendarDayShell } from "@/components/admin/CalendarDayShell";
import { WeekTimeGrid } from "@/components/admin/WeekTimeGrid";
import { MonthCalendar } from "@/components/admin/MonthCalendar";
import {
  getWeekDateStrings,
  getMonthDateStrings,
  groupBookingsByDateRecord,
  addMonths,
} from "@/lib/calendar-week";
import {
  getAllServicesAdmin,
  getBlockedSlotsForDate,
  getBookingsForDatesAdmin,
  getSpecialistsPublic,
  getTenantBySalonSlug,
  getWorkingHoursForDate,
  getWorkingHoursWeekMerged,
} from "@/lib/data";
import { requireAdminTenantSlugForPage } from "@/lib/admin-tenant-page";
import { addCalendarDaysInSofia } from "@/lib/booking-datetime";

type ViewType = "day" | "week" | "month";

function todayLocalISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function CalendarSkeleton() {
  return (
    <div className="mt-5 animate-pulse">
      <div className="h-11 w-full rounded-xl bg-[#1A1A1A]/8 sm:w-80" />
      <div className="mt-4 h-10 w-full rounded-xl bg-[#1A1A1A]/8 sm:w-72" />
      <div className="mt-6 h-[480px] rounded-2xl border border-[#C9A84C]/15 bg-white/80" />
    </div>
  );
}

async function CalendarDataSection(props: { date: string; view: ViewType }) {
  const salonSlug = await requireAdminTenantSlugForPage();
  const { date, view } = props;
  const todayStr = todayLocalISO();

  // navigation deltas
  const prevDate =
    view === "month"
      ? addMonths(date, -1)
      : addCalendarDaysInSofia(date, view === "week" ? -7 : -1);
  const nextDate =
    view === "month"
      ? addMonths(date, 1)
      : addCalendarDaysInSofia(date, view === "week" ? 7 : 1);

  // shared data
  const [tenant, services, specialists] = await Promise.all([
    getTenantBySalonSlug(salonSlug),
    getAllServicesAdmin(salonSlug),
    getSpecialistsPublic(salonSlug),
  ]);

  // view-specific data
  if (view === "day") {
    const dayOfWeek = new Date(`${date}T12:00:00`).getDay();
    const [dayBookings, blocked, wh] = await Promise.all([
      getBookingsForDatesAdmin({ salonSlug, dates: [date] }),
      getBlockedSlotsForDate({ salonSlug, date }),
      getWorkingHoursForDate({ salonSlug, dayOfWeek }),
    ]);

    return (
      <>
        <CalendarNav date={date} view={view} prevDate={prevDate} nextDate={nextDate} />
        <div
          className="mt-4 flex items-center gap-2 rounded-xl px-4 py-2.5"
          style={{ background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.15)" }}
        >
          <span className="text-sm">🕐</span>
          <p className="text-sm text-[#1A1A1A]/55">
            Работно време:{" "}
            <span className="font-semibold text-[#1A1A1A]/75">
              {wh?.is_day_off ? "Почивен ден" : wh ? `${wh.start_time} – ${wh.end_time}` : "Не е зададено"}
            </span>
          </p>
        </div>
        <CalendarDayShell
          salonSlug={salonSlug}
          date={date}
          bookings={dayBookings}
          blocked={blocked}
          workingHours={wh}
          services={services}
          specialists={specialists}
          plan={tenant?.plan ?? "standard"}
        />
      </>
    );
  }

  if (view === "week") {
    const weekDates = getWeekDateStrings(date);
    const [weekBookings, weekWH] = await Promise.all([
      getBookingsForDatesAdmin({ salonSlug, dates: weekDates }),
      getWorkingHoursWeekMerged(salonSlug),
    ]);
    const byDate = groupBookingsByDateRecord(weekBookings);

    return (
      <>
        <CalendarNav date={date} view={view} prevDate={prevDate} nextDate={nextDate} />
        <WeekTimeGrid
          salonSlug={salonSlug}
          date={date}
          weekDates={weekDates}
          bookingsByDate={byDate}
          workingHoursByDow={weekWH}
          services={services}
          specialists={specialists}
          plan={tenant?.plan ?? "standard"}
        />
      </>
    );
  }

  // month view
  const monthDates = getMonthDateStrings(date);
  const [monthBookings, monthWH] = await Promise.all([
    getBookingsForDatesAdmin({ salonSlug, dates: monthDates }),
    getWorkingHoursWeekMerged(salonSlug),
  ]);
  const byDate = groupBookingsByDateRecord(monthBookings);

  // month label for heading
  const monthLabel = new Date(`${date}T12:00:00`).toLocaleDateString("bg-BG", { month: "long", year: "numeric" });

  return (
    <>
      <CalendarNav date={date} view={view} prevDate={prevDate} nextDate={nextDate} monthLabel={monthLabel} />
      <MonthCalendar
        anchorYmd={date}
        bookingsByDate={byDate}
        workingHoursByDow={monthWH}
        todayStr={todayStr}
      />
    </>
  );
}

function CalendarNav(props: {
  date: string;
  view: ViewType;
  prevDate: string;
  nextDate: string;
  monthLabel?: string;
}) {
  const { date, view, prevDate, nextDate, monthLabel } = props;

  const navLabel =
    view === "month"
      ? "Месец"
      : view === "week"
      ? "Дата в седмицата"
      : "Дата";

  return (
    <form className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end" method="get">
      <input type="hidden" name="view" value={view} />
      <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-end sm:gap-3">
        <div className="flex w-full items-stretch gap-2 sm:w-auto sm:items-end">
          <Link
            href={`/admin/calendar?date=${prevDate}&view=${view}`}
            className="inline-flex min-h-[48px] min-w-[48px] shrink-0 items-center justify-center rounded-xl border text-lg font-black transition hover:bg-black/[0.03]"
            style={{ borderColor: "rgba(201,168,76,0.35)", color: "#C8826A" }}
            aria-label="Назад"
          >
            ←
          </Link>
          <div className="min-w-0 flex-1">
            <label htmlFor="cal-date" className="text-[10px] font-black uppercase tracking-[0.15em] text-[#1A1A1A]/45">
              {navLabel}
            </label>
            {view === "month" ? (
              <div className="input-admin !mt-1 flex w-full items-center sm:min-w-[12rem]" style={{ cursor: "default" }}>
                <span className="capitalize">{monthLabel}</span>
                <input type="hidden" name="date" value={date} />
              </div>
            ) : (
              <input
                id="cal-date"
                type="date"
                name="date"
                defaultValue={date}
                className="input-admin !mt-1 w-full max-w-full sm:min-w-[12rem]"
              />
            )}
          </div>
          <Link
            href={`/admin/calendar?date=${nextDate}&view=${view}`}
            className="inline-flex min-h-[48px] min-w-[48px] shrink-0 items-center justify-center rounded-xl border text-lg font-black transition hover:bg-black/[0.03]"
            style={{ borderColor: "rgba(201,168,76,0.35)", color: "#C8826A" }}
            aria-label="Напред"
          >
            →
          </Link>
        </div>
        {view !== "month" && (
          <button
            type="submit"
            className="w-full rounded-xl px-6 py-3 text-sm font-black text-white shadow-sm transition hover:opacity-90 sm:w-auto"
            style={{ background: "linear-gradient(135deg, #C9A84C, #C8826A)", minHeight: "44px" }}
          >
            Покажи →
          </button>
        )}
      </div>
    </form>
  );
}

type CalendarSearchParams = { date?: string; view?: string };

export default async function AdminCalendarPage(props: { searchParams?: Promise<CalendarSearchParams> }) {
  const sp = await props.searchParams;
  const date = sp?.date && /^\d{4}-\d{2}-\d{2}$/.test(sp.date) ? sp.date : todayLocalISO();
  const view: ViewType = sp?.view === "week" ? "week" : sp?.view === "month" ? "month" : "day";

  const viewTitle = view === "week" ? "Седмица" : view === "month" ? "Месец" : "Ден";
  const viewSubtitle =
    view === "week"
      ? "Пон–нед около избраната дата."
      : view === "month"
      ? "Месечен преглед — кликни ден за детайли."
      : "Резервации и блокировки за деня.";

  return (
    <div className="admin-page-shell max-w-5xl">
      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
        <div>
          <span
            className="inline-block rounded-lg px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.2em] text-white"
            style={{ background: "linear-gradient(135deg, #C9A84C, #C8826A)" }}
          >
            📅 Календар
          </span>
          <h1
            className="mt-2 text-2xl font-black tracking-tight text-[#1A1A1A] sm:text-3xl"
            style={{ fontFamily: "var(--font-playfair, Georgia, serif)" }}
          >
            {viewTitle}
          </h1>
          <p className="mt-1 text-sm text-[#1A1A1A]/45">{viewSubtitle}</p>
        </div>

        {/* view toggle */}
        <div
          className="flex shrink-0 items-center gap-1 rounded-2xl p-1"
          style={{ border: "1px solid rgba(201,168,76,0.2)", background: "rgba(255,255,255,0.8)" }}
        >
          {(["day", "week", "month"] as ViewType[]).map((v) => (
            <Link
              key={v}
              href={`/admin/calendar?date=${date}&view=${v}`}
              className="rounded-xl px-4 py-2 text-sm font-semibold transition"
              style={
                view === v
                  ? { background: "linear-gradient(135deg, #C9A84C, #C8826A)", color: "white" }
                  : { color: "rgba(26,26,26,0.55)" }
              }
            >
              {v === "day" ? "Ден" : v === "week" ? "Седмица" : "Месец"}
            </Link>
          ))}
        </div>
      </div>

      <Suspense fallback={<CalendarSkeleton />}>
        <CalendarDataSection date={date} view={view} />
      </Suspense>
    </div>
  );
}
