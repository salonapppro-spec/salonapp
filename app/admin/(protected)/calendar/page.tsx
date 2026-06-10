import { Suspense } from "react";
import Link from "next/link";
import { CalendarDays, Clock } from "lucide-react";
import { CalendarNavClient } from "@/components/admin/CalendarNavClient";

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
        <CalendarNavClient date={date} view={view} prevDate={prevDate} nextDate={nextDate} />
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
      <CalendarNavClient date={date} view={view} prevDate={prevDate} nextDate={nextDate} monthLabel={monthLabel} />
      <MonthCalendar
        anchorYmd={date}
        bookingsByDate={byDate}
        workingHoursByDow={monthWH}
        todayStr={todayStr}
      />
    </>
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
            className="inline-flex items-center gap-1.5 rounded-lg px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.2em] text-white"
            style={{ background: "linear-gradient(135deg, #C9A84C, #C8826A)" }}
          >
            <CalendarDays size={11} strokeWidth={2.5} />
            Календар
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
