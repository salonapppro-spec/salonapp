"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { Plus, MoonStar } from "lucide-react";

import { minutesToTime, timeToMinutes } from "@/lib/scheduling";
import type { Booking, BookingStatus, Plan, Service, Specialist, WorkingHours } from "@/types";

import { BookingDetailModal } from "@/components/admin/BookingDetailModal";
import { QuickBooking } from "@/components/admin/QuickBooking";

function statusStyle(status: BookingStatus): React.CSSProperties {
  switch (status) {
    case "pending":
      return { borderColor: "#f59e0b", background: "rgba(251,191,36,0.12)", color: "#78350f" };
    case "confirmed":
      return { borderColor: "#60a5fa", background: "rgba(96,165,250,0.12)", color: "#1e3a5f" };
    case "completed":
      return { borderColor: "#34d399", background: "rgba(52,211,153,0.12)", color: "#064e3b" };
    case "no_show":
      return { borderColor: "#f87171", background: "rgba(248,113,113,0.12)", color: "#7f1d1d" };
    case "cancelled":
    default:
      return { borderColor: "#d1d5db", background: "rgba(209,213,219,0.2)", color: "#6b7280" };
  }
}

function statusLabel(status: BookingStatus): string {
  switch (status) {
    case "pending": return "Изчаква";
    case "confirmed": return "Потвърден";
    case "completed": return "Яви се";
    case "no_show": return "Не се яви";
    case "cancelled": return "Отказан";
  }
}

const DEFAULT_START = 8 * 60;
const DEFAULT_END = 21 * 60;

export function ScheduleBoard(props: {
  salonSlug: string;
  date: string;
  bookings: Booking[];
  workingHours: WorkingHours | null;
  services: Service[];
  specialists: Specialist[];
  plan: Plan;
  showFab: boolean;
  children?: React.ReactNode;
}) {
  const { salonSlug, date, bookings, workingHours, services, specialists, plan, showFab, children } = props;
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [detailBooking, setDetailBooking] = useState<Booking | null>(null);
  const [quickOpen, setQuickOpen] = useState(false);
  const [quickTime, setQuickTime] = useState("09:00");

  const getNowMinSofia = () => {
    const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Europe/Sofia" }));
    return now.getHours() * 60 + now.getMinutes();
  };
  const [nowMin, setNowMin] = useState(getNowMinSofia);
  useEffect(() => {
    const id = setInterval(() => setNowMin(getNowMinSofia()), 60_000);
    return () => clearInterval(id);
  }, []);

  const { dayStart, dayEnd, totalMin } = useMemo(() => {
    if (!workingHours || workingHours.is_day_off) {
      return { dayStart: DEFAULT_START, dayEnd: DEFAULT_END, totalMin: DEFAULT_END - DEFAULT_START };
    }
    const ds = timeToMinutes(workingHours.start_time);
    const de = timeToMinutes(workingHours.end_time);
    if (de <= ds) {
      return { dayStart: DEFAULT_START, dayEnd: DEFAULT_END, totalMin: DEFAULT_END - DEFAULT_START };
    }
    return { dayStart: ds, dayEnd: de, totalMin: de - ds };
  }, [workingHours]);

  const hours = useMemo(() => {
    const out: number[] = [];
    for (let m = dayStart; m < dayEnd; m += 60) out.push(m);
    return out;
  }, [dayStart, dayEnd]);

  const refresh = useCallback(() => {
    router.refresh();
  }, [router]);

  function openQuickAtMinutes(mins: number) {
    const isToday = date === new Date(new Date().toLocaleString("en-US", { timeZone: "Europe/Sofia" })).toISOString().slice(0, 10);
    const minAllowed = isToday ? Math.ceil((nowMin + 1) / 15) * 15 : dayStart;
    const snapped = Math.max(minAllowed, Math.min(dayEnd - 15, Math.round(mins / 15) * 15));
    setQuickTime(minutesToTime(snapped));
    setQuickOpen(true);
  }

  function onGridClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target !== e.currentTarget && (e.target as HTMLElement).closest("[data-booking-block]")) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const ratio = Math.max(0, Math.min(1, y / rect.height));
    const mins = dayStart + ratio * totalMin;
    openQuickAtMinutes(mins);
  }

  if (workingHours?.is_day_off) {
    return (
      <div
        className="mt-6 rounded-2xl p-8 text-center"
        style={{ border: "1px solid rgba(201,168,76,0.2)", background: "rgba(201,168,76,0.05)" }}
      >
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#C9A84C]/10">
          <MoonStar size={22} strokeWidth={1.6} color="#C9A84C" />
        </div>
        <p className="font-semibold text-[#1A1A1A]/70">Почивен ден по графика.</p>
        {showFab ? (
          <button
            type="button"
            className="mt-5 inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-black text-white shadow-md transition hover:opacity-90"
            style={{ background: "linear-gradient(135deg, #C9A84C, #C8826A)" }}
            onClick={() => {
              setQuickTime("10:00");
              setQuickOpen(true);
            }}
          >
            <Plus size={16} strokeWidth={2.5} /> Бърз час
          </button>
        ) : null}
        {quickOpen ? (
          <QuickBooking
            salonSlug={salonSlug}
            date={date}
            time={quickTime}
            services={services}
            specialists={specialists}
            plan={plan}
            workingHours={workingHours}
            onClose={() => setQuickOpen(false)}
            onSaved={() => {
              setQuickOpen(false);
              startTransition(() => {
                refresh();
              });
            }}
          />
        ) : null}
      </div>
    );
  }

  const activeBookings = bookings.filter((b) => b.status !== "cancelled");
  const hasBookings = activeBookings.length > 0;

  return (
    <>
      <div
        className="relative mt-4 overflow-hidden rounded-2xl bg-white"
        style={{ boxShadow: "0 2px 4px rgba(0,0,0,0.04), 0 8px 32px rgba(0,0,0,0.07)", border: "1px solid rgba(201,168,76,0.2)" }}
      >
        {/* Top accent line */}
        <div className="absolute left-0 right-0 top-0 h-[3px]" style={{ background: "linear-gradient(90deg, #C9A84C, #C8826A)" }} />

        {/* Column header */}
        <div className="flex border-b pt-[3px]" style={{ borderColor: "rgba(201,168,76,0.12)", background: "rgba(201,168,76,0.04)" }}>
          <div className="w-16 shrink-0 border-r py-2 text-center text-[9px] font-black uppercase tracking-widest" style={{ borderColor: "rgba(201,168,76,0.12)", color: "rgba(201,168,76,0.5)" }}>
            Час
          </div>
          <div className="flex flex-1 items-center justify-between px-3 py-2">
            <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: "rgba(201,168,76,0.5)" }}>График</span>
            {!hasBookings && (
              <span className="text-[10px] font-semibold" style={{ color: "rgba(26,26,26,0.3)" }}>
                Кликни върху час → Бърз час
              </span>
            )}
          </div>
        </div>

        <div className="flex">
          {/* Hour labels */}
          <div className="w-16 shrink-0 border-r" style={{ borderColor: "rgba(201,168,76,0.1)", background: "rgba(250,247,242,0.6)" }}>
            {hours.map((m, i) => (
              <div
                key={m}
                className="relative"
                style={{
                  height: "60px",
                  borderBottom: i < hours.length - 1 ? "1px solid rgba(201,168,76,0.12)" : "none",
                }}
              >
                {/* :00 — bold */}
                <span className="absolute left-0 right-0 top-1 text-center text-[10px] font-black tabular-nums" style={{ color: "#C9A84C" }}>
                  {minutesToTime(m)}
                </span>
                {/* :30 — small */}
                <span className="absolute left-0 right-0 text-center text-[9px] tabular-nums" style={{ top: "50%", transform: "translateY(-50%)", color: "rgba(201,168,76,0.45)" }}>
                  {minutesToTime(m + 30)}
                </span>
              </div>
            ))}
          </div>

          {/* Grid */}
          <div
            className="relative flex-1 cursor-pointer select-none"
            style={{ height: `${hours.length * 60}px` }}
            onClick={onGridClick}
          >
            {hours.map((m, i) => (
              <div
                key={m}
                className="relative"
                style={{
                  height: "60px",
                  borderBottom: i < hours.length - 1 ? "1px solid rgba(201,168,76,0.12)" : "none",
                  background: i % 2 === 0 ? "transparent" : "rgba(201,168,76,0.02)",
                }}
              >
                {/* :15 mark */}
                <div style={{ position: "absolute", top: "25%", left: 0, right: 0, borderTop: "1px dotted rgba(201,168,76,0.06)" }} />
                {/* :30 mark — slightly more visible */}
                <div style={{ position: "absolute", top: "50%", left: 0, right: 0, borderTop: "1px dashed rgba(201,168,76,0.12)" }} />
                {/* :45 mark */}
                <div style={{ position: "absolute", top: "75%", left: 0, right: 0, borderTop: "1px dotted rgba(201,168,76,0.06)" }} />
              </div>
            ))}

            {/* Current time indicator — shown only for today */}
            {date === new Date(new Date().toLocaleString("en-US", { timeZone: "Europe/Sofia" })).toISOString().slice(0, 10) &&
              nowMin >= dayStart && nowMin <= dayEnd && (
              <div
                className="pointer-events-none absolute left-0 right-0 z-20"
                style={{ top: `${((nowMin - dayStart) / totalMin) * 100}%`, transform: "translateY(-50%)" }}
              >
                {/* Glow layer */}
                <div className="absolute inset-x-0 top-1/2 h-[6px] -translate-y-1/2 rounded-full opacity-20" style={{ background: "linear-gradient(90deg, #C8826A, #C9A84C, transparent)" }} />
                {/* Main line */}
                <div className="relative flex items-center gap-0">
                  {/* Pulse dot */}
                  <div className="relative shrink-0" style={{ marginLeft: "2px" }}>
                    <div className="absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 animate-ping rounded-full opacity-30" style={{ background: "#C8826A" }} />
                    <div className="h-3 w-3 rounded-full border-2 border-white" style={{ background: "linear-gradient(135deg, #C9A84C, #C8826A)", boxShadow: "0 0 0 2px rgba(200,130,106,0.4), 0 2px 8px rgba(200,130,106,0.5)" }} />
                  </div>
                  {/* Time label */}
                  <span className="ml-2 shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-black tabular-nums text-white" style={{ background: "linear-gradient(135deg, #C9A84C, #C8826A)", boxShadow: "0 1px 6px rgba(200,130,106,0.4)" }}>
                    {`${String(Math.floor(nowMin / 60)).padStart(2, "0")}:${String(nowMin % 60).padStart(2, "0")}`}
                  </span>
                  {/* Gradient line */}
                  <div className="ml-1 h-[1.5px] flex-1 rounded-full" style={{ background: "linear-gradient(90deg, #C8826A 0%, #C9A84C 40%, rgba(201,168,76,0.15) 100%)" }} />
                </div>
              </div>
            )}

            {/* Booking blocks */}
            {bookings.map((b) => {
              const start = timeToMinutes(b.booking_time);
              const dur = Number(b.service_duration) || 30;
              if (start + dur <= dayStart || start >= dayEnd) return null;
              const top = ((Math.max(start, dayStart) - dayStart) / totalMin) * 100;
              const endMin = Math.min(start + dur, dayEnd);
              const visStart = Math.max(start, dayStart);
              const height = ((endMin - visStart) / totalMin) * 100;
              if (height <= 0) return null;
              const bStyle = statusStyle(b.status);
              return (
                <button
                  key={b.id}
                  type="button"
                  data-booking-block
                  className="absolute left-2 right-2 overflow-hidden rounded-xl border-l-[3px] px-2.5 py-1.5 text-left shadow-sm transition-all hover:shadow-md hover:brightness-95"
                  style={{
                    top: `${top}%`,
                    height: `${height}%`,
                    minHeight: "36px",
                    ...bStyle,
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setDetailBooking(b);
                  }}
                >
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-xs font-black leading-tight tabular-nums">{b.booking_time.slice(0, 5)}</span>
                    <span className="text-[9px] uppercase tracking-wide opacity-55">{statusLabel(b.status)}</span>
                  </div>
                  <div className="truncate text-xs font-bold leading-tight">{b.client_name}</div>
                  <div className="truncate text-[10px] opacity-65">{b.service_name}</div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {children}

      {/* Floating "Бърз час" button — with text on desktop, icon on mobile */}
      {showFab ? (
        <button
          type="button"
          className="fixed z-[60] flex items-center gap-2 rounded-full font-black text-white shadow-xl transition hover:opacity-90 active:scale-95"
          style={{
            // Keep FAB clearly above the mobile bottom nav hit area.
            bottom: "max(6.75rem, calc(env(safe-area-inset-bottom) + 5.5rem))",
            right: "1rem",
            background: "linear-gradient(135deg, #C9A84C, #C8826A)",
            padding: "0 20px 0 16px",
            height: "52px",
          }}
          title="Бърз час"
          aria-label="Бърз час"
          onClick={() => openQuickAtMinutes(dayStart + 120)}
        >
          <Plus size={16} strokeWidth={2.5} />
          <span className="hidden text-sm sm:inline">Бърз час</span>
        </button>
      ) : null}

      {detailBooking ? (
        <BookingDetailModal booking={detailBooking} onClose={() => setDetailBooking(null)} onAfterChange={refresh} />
      ) : null}

      {quickOpen ? (
        <QuickBooking
          salonSlug={salonSlug}
          date={date}
          time={quickTime}
          services={services}
          specialists={specialists}
          plan={plan}
          workingHours={workingHours}
          onClose={() => setQuickOpen(false)}
          onSaved={() => {
            setQuickOpen(false);
            startTransition(() => {
              refresh();
            });
          }}
        />
      ) : null}
    </>
  );
}
