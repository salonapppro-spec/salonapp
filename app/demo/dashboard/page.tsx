"use client";

import Link from "next/link";
import { TrendingUp, CalendarCheck, Clock } from "lucide-react";

import { ScheduleBoard } from "@/components/admin/ScheduleBoard";
import { todayDateISOInSofia, tomorrowDateISOInSofia } from "@/lib/booking-datetime";
import { useDemo } from "@/lib/demo/store";

function formatBGDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  const months = ["", "Януари", "Февруари", "Март", "Април", "Май", "Юни", "Юли", "Август", "Септември", "Октомври", "Ноември", "Декември"];
  return `${Number(d)} ${months[Number(m)]} ${y}`;
}

export default function DemoDashboardPage() {
  const { state } = useDemo();

  const today = todayDateISOInSofia();
  const tomorrow = tomorrowDateISOInSofia();
  const dayOfWeek = new Date(`${today}T12:00:00`).getDay();

  const bookings = state.bookings.filter((b) => b.booking_date === today);
  const workingHours = state.workingHours.find((w) => w.day_of_week === dayOfWeek) ?? null;
  const blockedSlots = state.blockedSlots.filter((s) => s.blocked_date === today);

  const countToday = bookings.filter((b) => b.status !== "cancelled").length;
  const revenue = bookings
    .filter((b) => b.status === "completed")
    .reduce((sum, b) => sum + Number(b.service_price_eur), 0);

  const next = bookings
    .filter((b) => ["pending", "confirmed"].includes(b.status))
    .sort((a, b) => a.booking_time.localeCompare(b.booking_time))[0];

  return (
    <div className="admin-page-shell max-w-5xl">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <span
            className="inline-block rounded-lg px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.2em] text-white"
            style={{ background: "linear-gradient(135deg, #C9A84C, #C8826A)" }}
          >
            ✦ Днес
          </span>
          <h1
            className="mt-2 text-2xl font-black tracking-tight text-[#1A1A1A] sm:text-3xl"
            style={{ fontFamily: "var(--font-playfair, Georgia, serif)" }}
          >
            Дневен преглед
          </h1>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-[#C9A84C]/15 bg-white/75 px-4 py-3">
        <p className="text-sm font-semibold text-[#1A1A1A]/70">{state.tenant.salon_name}</p>
        <p className="text-xs text-[#1A1A1A]/45">{formatBGDate(today)}</p>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <div
          className="relative overflow-hidden rounded-2xl bg-white p-5"
          style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.04), 0 4px 24px rgba(0,0,0,0.06)", border: "1px solid rgba(201,168,76,0.2)" }}
        >
          <div className="absolute left-0 right-0 top-0 h-[3px] rounded-t-2xl" style={{ background: "linear-gradient(90deg, #C9A84C, #C8826A)" }} />
          <div className="flex items-start justify-between">
            <div className="text-[10px] font-black uppercase tracking-[0.15em] text-[#1A1A1A]/40">Оборот днес</div>
            <TrendingUp size={18} strokeWidth={1.8} className="text-[#C9A84C]/60" />
          </div>
          <div className="mt-2 text-3xl font-black tabular-nums" style={{ color: revenue > 0 ? "#C9A84C" : "rgba(26,26,26,0.25)" }}>
            {revenue.toFixed(2)}
            <span className="ml-1 text-lg font-bold opacity-60">€</span>
          </div>
          <p className="mt-1 text-[11px] text-[#1A1A1A]/35">Расте, щом маркираш „Яви се“</p>
        </div>

        <div
          className="relative overflow-hidden rounded-2xl bg-white p-5"
          style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.04), 0 4px 24px rgba(0,0,0,0.06)", border: "1px solid rgba(200,130,106,0.2)" }}
        >
          <div className="absolute left-0 right-0 top-0 h-[3px] rounded-t-2xl" style={{ background: "linear-gradient(90deg, #C8826A, #C9A84C)" }} />
          <div className="flex items-start justify-between">
            <div className="text-[10px] font-black uppercase tracking-[0.15em] text-[#1A1A1A]/40">Резервации днес</div>
            <CalendarCheck size={18} strokeWidth={1.8} className="text-[#C8826A]/60" />
          </div>
          <div className="mt-2 text-3xl font-black tabular-nums" style={{ color: countToday > 0 ? "#C8826A" : "rgba(26,26,26,0.25)" }}>
            {countToday}
            <span className="ml-1.5 text-sm font-semibold opacity-50">{countToday === 1 ? "час" : "часа"}</span>
          </div>
          <p className="mt-1 text-[11px] text-[#1A1A1A]/35">Клиентите резервират и онлайн</p>
        </div>

        <div
          className="relative overflow-hidden rounded-2xl bg-white p-5"
          style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.04), 0 4px 24px rgba(0,0,0,0.06)", border: "1px solid rgba(201,168,76,0.15)" }}
        >
          <div className="absolute left-0 right-0 top-0 h-[3px] rounded-t-2xl" style={{ background: "linear-gradient(90deg, #C9A84C, #C8826A)" }} />
          <div className="flex items-start justify-between">
            <div className="text-[10px] font-black uppercase tracking-[0.15em] text-[#1A1A1A]/40">Следващ клиент</div>
            <Clock size={18} strokeWidth={1.8} className="text-[#C9A84C]/60" />
          </div>
          {next ? (
            <div className="mt-2">
              <div className="text-xl font-black text-[#1A1A1A]">{next.booking_time.slice(0, 5)}</div>
              <div className="mt-0.5 truncate text-sm font-semibold text-[#1A1A1A]/80">{next.client_name}</div>
              <div className="truncate text-xs text-[#1A1A1A]/45">{next.service_name}</div>
            </div>
          ) : (
            <div className="mt-2">
              <div className="text-3xl font-black" style={{ color: "rgba(26,26,26,0.18)" }}>—</div>
              <p className="mt-1 text-[11px] text-[#1A1A1A]/35">Няма предстоящи часове днес</p>
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
        <div className="min-w-0">
          <h2 className="text-lg font-black text-[#1A1A1A]" style={{ fontFamily: "var(--font-playfair, Georgia, serif)" }}>
            График
          </h2>
          <p className="mt-1 text-xs text-[#1A1A1A]/45 sm:max-w-md">
            Натисни свободен час, за да запишеш клиент. Натисни зает час, за да го преместиш, откажеш или маркираш.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
          <span className="text-xs text-[#1A1A1A]/35">{today}</span>
          <Link
            href={`/demo/calendar?date=${encodeURIComponent(tomorrow)}&view=day`}
            className="inline-flex min-h-[40px] items-center justify-center rounded-xl px-3.5 py-2 text-xs font-bold text-white shadow-sm transition hover:opacity-90"
            style={{ background: "linear-gradient(135deg, #C9A84C, #C8826A)" }}
          >
            Утре
          </Link>
          <Link
            href="/demo/calendar?view=week"
            className="inline-flex min-h-[40px] items-center justify-center rounded-xl border border-[#C9A84C]/35 bg-white px-3.5 py-2 text-xs font-bold text-[#1A1A1A]/70 shadow-sm transition hover:border-[#C9A84C]/55"
          >
            Седмица
          </Link>
        </div>
      </div>

      <ScheduleBoard
        salonSlug={state.tenant.salon_slug}
        date={today}
        bookings={bookings}
        blockedSlots={blockedSlots}
        workingHours={workingHours}
        services={state.services}
        specialists={state.specialists}
        plan={state.tenant.plan}
        showFab
      />
    </div>
  );
}
