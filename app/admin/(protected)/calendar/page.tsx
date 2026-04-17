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
          <h1 className="text-2xl font-semibold tracking-tight text-brand-900 sm:text-3xl">Календар</h1>
          <p className="mt-1 text-sm text-brand-800/85 sm:text-base">
            {view === "week" ? "Седмица (пон–нед) около избраната дата." : "Резервации и блокировки за деня."}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2 rounded-2xl border border-brand-200/80 bg-white p-1 shadow-card">
          <Link
            href={`/admin/calendar?date=${date}&view=day`}
            className={
              view === "day"
                ? "rounded-xl bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-900 ring-1 ring-brand-200/80"
                : "rounded-xl px-4 py-2 text-sm font-medium text-brand-800/85 transition hover:bg-brand-50"
            }
          >
            Ден
          </Link>
          <Link
            href={`/admin/calendar?date=${date}&view=week`}
            className={
              view === "week"
                ? "rounded-xl bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-900 ring-1 ring-brand-200/80"
                : "rounded-xl px-4 py-2 text-sm font-medium text-brand-800/85 transition hover:bg-brand-50"
            }
          >
            Седмица
          </Link>
        </div>
      </div>

      <form className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end" method="get">
        <input type="hidden" name="view" value={view} />
        <div className="w-full sm:w-auto">
          <label htmlFor="cal-date" className="text-xs font-medium text-brand-800/85">
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
        <button type="submit" className="btn-admin-primary w-full sm:w-auto sm:min-w-[8rem] sm:px-8">
          Покажи
        </button>
      </form>

      <p className="mt-4 text-sm text-brand-800/85">
        Работно време (избран ден):{" "}
        {wh?.is_day_off ? "почивен ден" : wh ? `${wh.start_time} – ${wh.end_time}` : "не е зададено"}
      </p>

      {view === "week" ? (
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {weekDates.map((d) => {
            const list = byDate?.get(d) ?? [];
            const label = dayFmt.format(new Date(`${d}T12:00:00`));
            const isToday = d === todayStr;
            return (
              <div
                key={d}
                className={["admin-card flex flex-col !p-4", isToday ? "ring-2 ring-brand-200/90" : ""].join(" ")}
              >
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-sm font-semibold capitalize text-brand-900">{label}</h2>
                  <Link href={`/admin/calendar?date=${d}&view=day`} className="text-xs font-semibold text-brand-700 underline">
                    Ден →
                  </Link>
                </div>
                <ul className="mt-2 flex-1 divide-y divide-brand-100 text-sm">
                  {list.length === 0 ? (
                    <li className="py-2 text-brand-700/70">—</li>
                  ) : (
                    list.map((b) => (
                      <li key={b.id} className="flex flex-col gap-2 border-b border-brand-100 py-2 last:border-0">
                        <div>
                          <span className="font-medium">{b.booking_time}</span>
                          <span className="text-brand-800">
                            {" "}
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
