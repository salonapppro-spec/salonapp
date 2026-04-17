import {
  getAllServicesAdmin,
  getBookingsForDateAdmin,
  getSpecialistsPublic,
  getTenantBySalonSlug,
  getTodayRevenueEur,
  getWorkingHoursForDate,
} from "@/lib/data";
import { requireAdminTenantSlugForPage } from "@/lib/admin-tenant-page";

import { ScheduleBoard } from "@/components/admin/ScheduleBoard";

function todayLocalISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default async function AdminDashboardPage() {
  const salonSlug = await requireAdminTenantSlugForPage();
  const today = todayLocalISO();
  const dayOfWeek = new Date(`${today}T12:00:00`).getDay();

  const [tenant, bookings, revenue, workingHours, services, specialists] = await Promise.all([
    getTenantBySalonSlug(salonSlug),
    getBookingsForDateAdmin({ salonSlug, date: today }),
    getTodayRevenueEur(salonSlug, today),
    getWorkingHoursForDate({ salonSlug, dayOfWeek }),
    getAllServicesAdmin(salonSlug),
    getSpecialistsPublic(salonSlug),
  ]);

  const countToday = bookings.filter((b) => b.status !== "cancelled").length;
  const next = bookings
    .filter((b) => ["pending", "confirmed"].includes(b.status))
    .sort((a, b) => a.booking_time.localeCompare(b.booking_time))[0];

  return (
    <div className="admin-page-shell max-w-5xl">
      <h1 className="text-2xl font-semibold tracking-tight text-brand-900 sm:text-3xl">Днес</h1>
      <p className="mt-2 text-sm text-brand-800/85 sm:text-base">
        {tenant?.salon_name ?? salonSlug} · {today}
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <div className="admin-card py-5">
          <div className="text-xs font-medium uppercase tracking-wide text-brand-700/80">Оборот днес (completed)</div>
          <div className="mt-1 text-2xl font-semibold tabular-nums text-brand-900">{revenue.toFixed(2)} €</div>
        </div>
        <div className="admin-card py-5">
          <div className="text-xs font-medium uppercase tracking-wide text-brand-700/80">Резервации днес</div>
          <div className="mt-1 text-2xl font-semibold tabular-nums text-brand-900">{countToday}</div>
        </div>
        <div className="admin-card py-5">
          <div className="text-xs font-medium uppercase tracking-wide text-brand-700/80">Следващ клиент</div>
          <div className="mt-1 text-sm font-medium leading-snug text-brand-900">
            {next ? (
              <>
                {next.booking_time} — {next.client_name} ({next.service_name})
              </>
            ) : (
              <span className="font-normal text-brand-700/70">Няма</span>
            )}
          </div>
        </div>
      </div>

      <h2 className="mt-8 text-lg font-semibold text-brand-900">График по часове</h2>
      <ScheduleBoard
        salonSlug={salonSlug}
        date={today}
        bookings={bookings}
        workingHours={workingHours}
        services={services}
        specialists={specialists}
        plan={tenant?.plan ?? "standard"}
        showFab
      />
    </div>
  );
}
