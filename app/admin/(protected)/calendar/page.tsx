import Link from "next/link";

import { BookingStatusSelect } from "@/components/admin/BookingStatusSelect";
import { CalendarDayShell } from "@/components/admin/CalendarDayShell";
import { groupBookingsByDate, getWeekDateStrings } from "@/lib/calendar-week";
import {
  getAllServicesAdmin,
  getBlockedSlotsForDate,
  getBookingsForDatesAdmin,
  getSpecialistsPublic,
  getTenantBySalonSlug,
  getWorkingHoursForDate,
} from "@/lib/data";
import { requireAdminTenantSlugForPage } from "@/lib/admin-tenant-page";

function todayLocalISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const dayFmt = new Intl.DateTimeFormat("bg-BG", { weekday: "short", day: "numeric", month: "short" });

export default async function AdminCalendarPage(props: { searchParams: Promise<{ date?: string; view?: string }> }) {
  const salonSlug = await requireAdminTenantSlugForPage();
  const sp = await props.searchParams;
  const date = sp.date && /^\d{4}-\d{2}-\d{2}$/.test(sp.date) ? sp.date : todayLocalISO();
  const view = sp.view === "week" ? "week" : "day";
  const dayOfWeek = new Date(`${date}T12:00:00`).getDay();

  const weekDates = view === "week" ? getWeekDateStrings(date) : [];

  const [tenant, services, specialists, wh] = await Promise.all([
    getTenantBySalonSlug(salonSlug),
    getAllServicesAdmin(salonSlug),
    getSpecialistsPublic(salonSlug),
    getWorkingHoursForDate({ salonSlug, dayOfWeek }),
  ]);

  let weekBookings: Awaited<ReturnType<typeof getBookingsForDatesAdmin>> = [];
  let dayBookings: Awaited<ReturnType<typeof getBookingsForDatesAdmin>> = [];
  let blocked: Awaited<ReturnType<typeof getBlockedSlotsForDate>> = [];

  if (view === "week") {
    weekBookings = await getBookingsForDatesAdmin({ salonSlug, dates: weekDates });
  } else {
    [dayBookings, blocked] = await Promise.all([
      getBookingsForDatesAdmin({ salonSlug, dates: [date] }),
      getBlockedSlotsForDate({ salonSlug, date }),
    ]);
  }

  const byDate = view === "week" ? groupBookingsByDate(weekBookings) : null;
  const todayStr = todayLocalISO();

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
            {view === "week" ? "Седмица" : "Ден"}
          </h1>
          <p className="mt-1 text-sm text-[#1A1A1A]/45">
            {view === "week" ? "Пон–нед около избраната дата." : "Резервации и блокировки за деня."}
          </p>
        </div>
        <div
          className="flex shrink-0 items-center gap-1 rounded-2xl p-1"
          style={{ border: "1px solid rgba(201,168,76,0.2)", background: "rgba(255,255,255,0.8)" }}
        >
          <Link
            href={`/admin/calendar?date=${date}&view=day`}
            className="rounded-xl px-4 py-2 text-sm font-semibold transition"
            style={
              view === "day"
                ? { background: "linear-gradient(135deg, #C9A84C, #C8826A)", color: "white" }
                : { color: "rgba(26,26,26,0.55)" }
            }
          >
            Ден
          </Link>
          <Link
            href={`/admin/calendar?date=${date}&view=week`}
            className="rounded-xl px-4 py-2 text-sm font-semibold transition"
            style={
              view === "week"
                ? { background: "linear-gradient(135deg, #C9A84C, #C8826A)", color: "white" }
                : { color: "rgba(26,26,26,0.55)" }
            }
          >
            Седмица
          </Link>
        </div>
      </div>

      <form className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end" method="get">
        <input type="hidden" name="view" value={view} />
        <div className="w-full sm:w-auto">
          <label htmlFor="cal-date" className="text-[10px] font-black uppercase tracking-[0.15em] text-[#1A1A1A]/45">
            {view === "week" ? "Дата в седмицата" : "Дата"}
          </label>
          <input
            id="cal-date"
            type="date"
            name="date"
            defaultValue={date}
            className="input-admin !mt-1 max-w-full sm:min-w-[12rem]"
          />
        </div>
        <button
          type="submit"
          className="w-full rounded-xl px-6 py-3 text-sm font-black text-white shadow-sm transition hover:opacity-90 sm:w-auto"
          style={{ background: "linear-gradient(135deg, #C9A84C, #C8826A)", minHeight: "44px" }}
        >
          Покажи →
        </button>
      </form>

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

      {view === "week" ? (
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {weekDates.map((d) => {
            const list = byDate?.get(d) ?? [];
            const label = dayFmt.format(new Date(`${d}T12:00:00`));
            const isToday = d === todayStr;
            return (
              <div
                key={d}
                className="relative flex flex-col overflow-hidden rounded-2xl bg-white p-4"
                style={{
                  border: isToday ? "1px solid rgba(201,168,76,0.5)" : "1px solid rgba(201,168,76,0.15)",
                  boxShadow: isToday
                    ? "0 0 0 3px rgba(201,168,76,0.12), 0 4px 24px rgba(0,0,0,0.06)"
                    : "0 1px 2px rgba(0,0,0,0.04), 0 4px 24px rgba(0,0,0,0.05)",
                }}
              >
                {isToday && (
                  <div
                    className="absolute left-0 right-0 top-0 h-[3px] rounded-t-2xl"
                    style={{ background: "linear-gradient(90deg, #C9A84C, #C8826A)" }}
                  />
                )}
                <div className="flex items-center justify-between gap-2">
                  <h2
                    className="text-sm font-black capitalize"
                    style={{ color: isToday ? "#C9A84C" : "#1A1A1A" }}
                  >
                    {label}
                  </h2>
                  <Link
                    href={`/admin/calendar?date=${d}&view=day`}
                    className="text-[11px] font-bold transition"
                    style={{ color: "#C8826A" }}
                  >
                    Ден →
                  </Link>
                </div>
                <ul className="mt-3 flex-1 space-y-1.5 text-sm">
                  {list.length === 0 ? (
                    <li className="py-2 text-center text-xs text-[#1A1A1A]/30">Няма часове</li>
                  ) : (
                    list.map((b) => (
                      <li
                        key={b.id}
                        className="flex flex-col gap-1.5 rounded-xl p-2"
                        style={{ background: "rgba(201,168,76,0.06)", border: "1px solid rgba(201,168,76,0.1)" }}
                      >
                        <div className="flex gap-2">
                          <span className="font-black tabular-nums" style={{ color: "#C9A84C" }}>{b.booking_time.slice(0,5)}</span>
                          <span className="truncate text-[#1A1A1A]/70">
                            {b.client_name} — {b.service_name}
                          </span>
                        </div>
                        <BookingStatusSelect bookingId={b.id} status={b.status} compact />
                      </li>
                    ))
                  )}
                </ul>
              </div>
            );
          })}
        </div>
      ) : (
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
      )}
    </div>
  );
}
