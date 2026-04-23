import Link from "next/link";

import {
  getAllServicesAdmin,
  getBookingsForDateAdmin,
  getSpecialistsPublic,
  getTenantBySalonSlug,
  getTodayRevenueEur,
  getWorkingHoursForDate,
} from "@/lib/data";
import { requireAdminTenantSlugForPage } from "@/lib/admin-tenant-page";
import { todayDateISOInSofia, tomorrowDateISOInSofia } from "@/lib/booking-datetime";

import { ScheduleBoard } from "@/components/admin/ScheduleBoard";

function formatBGDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  const months = ["", "Януари", "Февруари", "Март", "Април", "Май", "Юни", "Юли", "Август", "Септември", "Октомври", "Ноември", "Декември"];
  return `${Number(d)} ${months[Number(m)]} ${y}`;
}

export default async function AdminDashboardPage() {
  const salonSlug = await requireAdminTenantSlugForPage();
  const today = todayDateISOInSofia();
  const tomorrow = tomorrowDateISOInSofia();
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

  const isEmpty = revenue === 0 && countToday === 0;

  return (
    <div className="admin-page-shell max-w-5xl">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span
              className="inline-block rounded-lg px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.2em] text-white"
              style={{ background: "linear-gradient(135deg, #C9A84C, #C8826A)" }}
            >
              ✦ Днес
            </span>
          </div>
          <h1
            className="mt-2 text-2xl font-black tracking-tight text-[#1A1A1A] sm:text-3xl"
            style={{ fontFamily: "var(--font-playfair, Georgia, serif)" }}
          >
            {tenant?.salon_name ?? salonSlug}
          </h1>
          <p className="mt-1 text-sm text-[#1A1A1A]/45">{formatBGDate(today)}</p>
        </div>
      </div>

      {/* Empty state hero — shown only when 0 bookings and 0 revenue */}
      {isEmpty && (
        <div
          className="mt-6 overflow-hidden rounded-2xl p-6 sm:p-8"
          style={{
            background: "linear-gradient(135deg, rgba(201,168,76,0.10) 0%, rgba(200,130,106,0.10) 100%)",
            border: "1px solid rgba(201,168,76,0.25)",
          }}
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
            <div
              className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-3xl shadow-sm"
              style={{ background: "linear-gradient(135deg, #C9A84C, #C8826A)" }}
            >
              🌸
            </div>
            <div>
              <p className="text-lg font-black text-[#1A1A1A] sm:text-xl">
                Денят тепърва започва!
              </p>
              <p className="mt-1 text-sm leading-relaxed text-[#1A1A1A]/55">
                Всяко успешно студио е започвало точно от тук. Добави записване с бутона&nbsp;
                <span className="font-bold" style={{ color: "#C9A84C" }}>+ Бърз час</span>
                &nbsp;или изчакай резервации от клиентите ти онлайн. 💪
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Stat cards */}
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {/* Revenue */}
        <div
          className="relative overflow-hidden rounded-2xl bg-white p-5"
          style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.04), 0 4px 24px rgba(0,0,0,0.06)", border: "1px solid rgba(201,168,76,0.2)" }}
        >
          <div
            className="absolute left-0 right-0 top-0 h-[3px] rounded-t-2xl"
            style={{ background: "linear-gradient(90deg, #C9A84C, #C8826A)" }}
          />
          <div className="flex items-start justify-between">
            <div className="text-[10px] font-black uppercase tracking-[0.15em] text-[#1A1A1A]/40">
              Оборот днес
            </div>
            <span className="text-xl">💶</span>
          </div>
          <div
            className="mt-2 text-3xl font-black tabular-nums"
            style={{ color: revenue > 0 ? "#C9A84C" : "rgba(26,26,26,0.25)" }}
          >
            {revenue.toFixed(2)}<span className="ml-1 text-lg font-bold opacity-60">€</span>
          </div>
          {revenue === 0 && (
            <p className="mt-1 text-[11px] text-[#1A1A1A]/35">Завърши час → оборотът ще расте 📈</p>
          )}
        </div>

        {/* Bookings count */}
        <div
          className="relative overflow-hidden rounded-2xl bg-white p-5"
          style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.04), 0 4px 24px rgba(0,0,0,0.06)", border: "1px solid rgba(200,130,106,0.2)" }}
        >
          <div
            className="absolute left-0 right-0 top-0 h-[3px] rounded-t-2xl"
            style={{ background: "linear-gradient(90deg, #C8826A, #C9A84C)" }}
          />
          <div className="flex items-start justify-between">
            <div className="text-[10px] font-black uppercase tracking-[0.15em] text-[#1A1A1A]/40">
              Резервации днес
            </div>
            <span className="text-xl">📋</span>
          </div>
          <div
            className="mt-2 text-3xl font-black tabular-nums"
            style={{ color: countToday > 0 ? "#C8826A" : "rgba(26,26,26,0.25)" }}
          >
            {countToday}
            <span className="ml-1.5 text-sm font-semibold opacity-50">{countToday === 1 ? "час" : "часа"}</span>
          </div>
          {countToday === 0 && (
            <p className="mt-1 text-[11px] text-[#1A1A1A]/35">Клиентите могат да резервират онлайн ✨</p>
          )}
        </div>

        {/* Next client */}
        <div
          className="relative overflow-hidden rounded-2xl bg-white p-5"
          style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.04), 0 4px 24px rgba(0,0,0,0.06)", border: "1px solid rgba(201,168,76,0.15)" }}
        >
          <div
            className="absolute left-0 right-0 top-0 h-[3px] rounded-t-2xl"
            style={{ background: "linear-gradient(90deg, #C9A84C, #C8826A)" }}
          />
          <div className="flex items-start justify-between">
            <div className="text-[10px] font-black uppercase tracking-[0.15em] text-[#1A1A1A]/40">
              Следващ клиент
            </div>
            <span className="text-xl">🕐</span>
          </div>
          {next ? (
            <div className="mt-2">
              <div className="text-xl font-black" style={{ color: "#1A1A1A" }}>{next.booking_time.slice(0, 5)}</div>
              <div className="mt-0.5 text-sm font-semibold text-[#1A1A1A]/80 truncate">{next.client_name}</div>
              <div className="text-xs text-[#1A1A1A]/45 truncate">{next.service_name}</div>
            </div>
          ) : (
            <div className="mt-2">
              <div className="text-3xl font-black" style={{ color: "rgba(26,26,26,0.18)" }}>—</div>
              <p className="mt-1 text-[11px] text-[#1A1A1A]/35">Свободен ден или нови резервации 🌟</p>
            </div>
          )}
        </div>
      </div>

      {/* Schedule — „Днес“ is always today; other days: Календар or shortcuts below */}
      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
        <div className="min-w-0">
          <h2
            className="text-lg font-black text-[#1A1A1A]"
            style={{ fontFamily: "var(--font-playfair, Georgia, serif)" }}
          >
            График
          </h2>
          <p className="mt-1 text-xs text-[#1A1A1A]/45 sm:max-w-md">
            Тук е само днешният ден. За утре и други дни ползвай бутоните вдясно или таба{" "}
            <span className="font-semibold text-[#1A1A1A]/55">Календар</span> долу.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
          <span className="text-xs text-[#1A1A1A]/35">{today}</span>
          <Link
            href={`/admin/calendar?date=${encodeURIComponent(tomorrow)}&view=day`}
            className="inline-flex min-h-[40px] items-center justify-center rounded-xl px-3.5 py-2 text-xs font-bold text-white shadow-sm transition hover:opacity-90"
            style={{ background: "linear-gradient(135deg, #C9A84C, #C8826A)" }}
          >
            Утре
          </Link>
          <Link
            href="/admin/calendar?view=week"
            className="inline-flex min-h-[40px] items-center justify-center rounded-xl border border-[#C9A84C]/35 bg-white px-3.5 py-2 text-xs font-bold text-[#1A1A1A]/70 shadow-sm transition hover:border-[#C9A84C]/55"
          >
            Седмица
          </Link>
          <Link
            href="/admin/calendar"
            className="inline-flex min-h-[40px] items-center justify-center rounded-xl border border-[#C9A84C]/25 bg-white/80 px-3.5 py-2 text-xs font-semibold text-[#1A1A1A]/60 transition hover:bg-white"
          >
            Календар
          </Link>
        </div>
      </div>

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
