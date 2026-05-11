"use client";

import Link from "next/link";
import { useCallback, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { minutesToTime, timeToMinutes } from "@/lib/scheduling";
import type { Booking, BookingStatus, Plan, Service, Specialist, WorkingHours } from "@/types";
import { BookingDetailModal } from "@/components/admin/BookingDetailModal";
import { QuickBooking } from "@/components/admin/QuickBooking";

const PX_PER_HOUR = 68;
const DEFAULT_GRID_START = 8 * 60;
const DEFAULT_GRID_END = 21 * 60;
const DOW_LABELS = ["Нд", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];

type SimpleWH = { start_time: string; end_time: string; is_day_off: boolean };

function statusStyle(s: BookingStatus): React.CSSProperties {
  switch (s) {
    case "pending":   return { borderColor: "#f59e0b", background: "rgba(251,191,36,0.14)", color: "#78350f" };
    case "confirmed": return { borderColor: "#60a5fa", background: "rgba(96,165,250,0.14)", color: "#1e3a5f" };
    case "completed": return { borderColor: "#34d399", background: "rgba(52,211,153,0.14)", color: "#064e3b" };
    case "no_show":   return { borderColor: "#f87171", background: "rgba(248,113,113,0.14)", color: "#7f1d1d" };
    default:          return { borderColor: "#d1d5db", background: "rgba(209,213,219,0.2)",  color: "#6b7280" };
  }
}

function statusLabel(s: BookingStatus): string {
  switch (s) {
    case "pending":   return "Изчаква";
    case "confirmed": return "Потвърден";
    case "completed": return "Завършен";
    case "no_show":   return "Не се яви";
    default:          return "Отказан";
  }
}

// weekDates[i] index → day_of_week (Mon=1 … Sat=6, Sun=0)
function dowOf(i: number): number { return i === 6 ? 0 : i + 1; }

export function WeekTimeGrid(props: {
  salonSlug: string;
  date: string;
  weekDates: string[];
  bookingsByDate: Record<string, Booking[]>;
  workingHoursByDow: SimpleWH[];
  services: Service[];
  specialists: Specialist[];
  plan: Plan;
}) {
  const { salonSlug, date, weekDates, bookingsByDate, workingHoursByDow, services, specialists, plan } = props;
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [detailBooking, setDetailBooking] = useState<Booking | null>(null);
  const [quickOpen, setQuickOpen] = useState(false);
  const [quickTime, setQuickTime] = useState("09:00");
  const [quickDate, setQuickDate] = useState(date);

  const todayStr = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }, []);

  const colWH: SimpleWH[] = weekDates.map((_, i) => workingHoursByDow[dowOf(i)] ?? { start_time: "09:00", end_time: "18:00", is_day_off: false });

  const { gridStart, gridEnd } = useMemo(() => {
    let gs = DEFAULT_GRID_END;
    let ge = DEFAULT_GRID_START;
    for (const wh of colWH) {
      if (!wh.is_day_off) {
        gs = Math.min(gs, timeToMinutes(wh.start_time));
        ge = Math.max(ge, timeToMinutes(wh.end_time));
      }
    }
    if (ge <= gs) return { gridStart: DEFAULT_GRID_START, gridEnd: DEFAULT_GRID_END };
    return { gridStart: gs, gridEnd: ge };
  }, [colWH]);

  const totalMin = gridEnd - gridStart;
  const gridHeightPx = (totalMin / 60) * PX_PER_HOUR;

  const hours = useMemo(() => {
    const out: number[] = [];
    for (let m = gridStart; m < gridEnd; m += 60) out.push(m);
    return out;
  }, [gridStart, gridEnd]);

  const refresh = useCallback(() => router.refresh(), [router]);

  function openQuick(d: string, mins: number, wh: SimpleWH) {
    if (wh.is_day_off) return;
    const ds = timeToMinutes(wh.start_time);
    const de = timeToMinutes(wh.end_time);
    const snapped = Math.max(ds, Math.min(de - 15, Math.round(mins / 15) * 15));
    setQuickDate(d);
    setQuickTime(minutesToTime(snapped));
    setQuickOpen(true);
  }

  function onColClick(e: React.MouseEvent<HTMLDivElement>, d: string, wh: SimpleWH) {
    if ((e.target as HTMLElement).closest("[data-booking-block]")) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const mins = gridStart + ((e.clientY - rect.top) / gridHeightPx) * totalMin;
    openQuick(d, mins, wh);
  }

  const quickWH = colWH[weekDates.indexOf(quickDate)];

  return (
    <>
      <div
        className="mt-4 overflow-hidden rounded-2xl bg-white"
        style={{ boxShadow: "0 2px 4px rgba(0,0,0,0.04), 0 8px 32px rgba(0,0,0,0.07)", border: "1px solid rgba(201,168,76,0.2)" }}
      >
        {/* top accent */}
        <div className="h-[3px]" style={{ background: "linear-gradient(90deg, #C9A84C, #C8826A)" }} />

        {/* sticky day headers */}
        <div
          className="sticky top-0 z-20 flex border-b bg-white"
          style={{ borderColor: "rgba(201,168,76,0.12)" }}
        >
          <div className="w-14 shrink-0 border-r" style={{ borderColor: "rgba(201,168,76,0.12)" }} />
          {weekDates.map((d, i) => {
            const isToday = d === todayStr;
            const dt = new Date(`${d}T12:00:00`);
            const wh = colWH[i];
            return (
              <div
                key={d}
                className="flex flex-1 flex-col items-center justify-center border-r py-2 px-1 last:border-r-0"
                style={{ borderColor: "rgba(201,168,76,0.12)", background: isToday ? "rgba(201,168,76,0.07)" : "transparent" }}
              >
                <span className="text-[9px] font-black uppercase tracking-wider" style={{ color: isToday ? "#C9A84C" : "rgba(26,26,26,0.4)" }}>
                  {DOW_LABELS[dowOf(i)]}
                </span>
                <span
                  className={`mt-0.5 flex h-6 w-6 items-center justify-center rounded-full text-xs font-black ${isToday ? "text-white" : ""}`}
                  style={{ background: isToday ? "linear-gradient(135deg,#C9A84C,#C8826A)" : "transparent", color: isToday ? undefined : "#1A1A1A" }}
                >
                  {dt.getDate()}
                </span>
                {wh.is_day_off ? (
                  <span className="mt-0.5 text-[8px]" style={{ color: "rgba(26,26,26,0.25)" }}>почивен</span>
                ) : (
                  <Link
                    href={`/admin/calendar?date=${d}&view=day`}
                    className="mt-0.5 text-[8px] font-bold hover:underline"
                    style={{ color: "#C8826A" }}
                  >
                    Ден →
                  </Link>
                )}
              </div>
            );
          })}
        </div>

        {/* scrollable body */}
        <div className="flex overflow-x-auto">
          <div className="flex" style={{ minWidth: "560px", width: "100%" }}>
            {/* hour labels */}
            <div
              className="relative w-14 shrink-0 border-r"
              style={{ borderColor: "rgba(201,168,76,0.1)", background: "rgba(250,247,242,0.7)", height: `${gridHeightPx}px` }}
            >
              {hours.map((m) => (
                <div
                  key={m}
                  className="absolute w-full"
                  style={{ top: `${((m - gridStart) / totalMin) * gridHeightPx}px` }}
                >
                  <span className="block text-center text-[10px] font-black tabular-nums leading-none" style={{ color: "#C9A84C", transform: "translateY(-6px)" }}>
                    {minutesToTime(m)}
                  </span>
                </div>
              ))}
            </div>

            {/* day columns */}
            <div className="flex flex-1">
              {weekDates.map((d, colIdx) => {
                const wh = colWH[colIdx];
                const isToday = d === todayStr;
                const active = (bookingsByDate[d] ?? []).filter((b) => b.status !== "cancelled");
                const colDayStart = wh.is_day_off ? gridStart : timeToMinutes(wh.start_time);
                const colDayEnd   = wh.is_day_off ? gridEnd   : timeToMinutes(wh.end_time);

                return (
                  <div
                    key={d}
                    className="relative flex-1 border-r last:border-r-0 select-none"
                    style={{
                      borderColor: "rgba(201,168,76,0.1)",
                      background: isToday ? "rgba(201,168,76,0.025)" : "transparent",
                      height: `${gridHeightPx}px`,
                      cursor: wh.is_day_off ? "default" : "pointer",
                    }}
                    onClick={wh.is_day_off ? undefined : (e) => onColClick(e, d, wh)}
                  >
                    {/* hour grid lines */}
                    {hours.map((m, hi) => (
                      <div
                        key={m}
                        className="absolute w-full"
                        style={{
                          top: `${((m - gridStart) / totalMin) * gridHeightPx}px`,
                          height: `${PX_PER_HOUR}px`,
                          borderBottom: hi < hours.length - 1 ? "1px solid rgba(201,168,76,0.09)" : "none",
                        }}
                      >
                        <div style={{ position: "absolute", top: "50%", left: 0, right: 0, borderTop: "1px dashed rgba(201,168,76,0.07)" }} />
                      </div>
                    ))}

                    {/* before-work shade */}
                    {!wh.is_day_off && colDayStart > gridStart && (
                      <div
                        className="pointer-events-none absolute w-full"
                        style={{
                          top: 0,
                          height: `${((colDayStart - gridStart) / totalMin) * gridHeightPx}px`,
                          background: "repeating-linear-gradient(135deg,rgba(0,0,0,0.018) 0px,rgba(0,0,0,0.018) 3px,transparent 3px,transparent 9px)",
                          borderBottom: "1px dashed rgba(201,168,76,0.22)",
                        }}
                      />
                    )}

                    {/* after-work shade */}
                    {!wh.is_day_off && colDayEnd < gridEnd && (
                      <div
                        className="pointer-events-none absolute bottom-0 w-full"
                        style={{
                          top: `${((colDayEnd - gridStart) / totalMin) * gridHeightPx}px`,
                          background: "repeating-linear-gradient(135deg,rgba(0,0,0,0.018) 0px,rgba(0,0,0,0.018) 3px,transparent 3px,transparent 9px)",
                          borderTop: "1px dashed rgba(201,168,76,0.22)",
                        }}
                      />
                    )}

                    {/* day-off overlay */}
                    {wh.is_day_off && (
                      <div
                        className="pointer-events-none absolute inset-0 flex items-center justify-center"
                        style={{ background: "rgba(0,0,0,0.025)" }}
                      >
                        <span
                          className="whitespace-nowrap text-[9px] font-bold"
                          style={{ color: "rgba(26,26,26,0.18)", writingMode: "vertical-rl", transform: "rotate(180deg)" }}
                        >
                          Почивен ден
                        </span>
                      </div>
                    )}

                    {/* booking blocks */}
                    {active.map((b) => {
                      const startMin = timeToMinutes(b.booking_time);
                      const dur = Number(b.service_duration) || 30;
                      if (startMin + dur <= gridStart || startMin >= gridEnd) return null;
                      const clampStart = Math.max(startMin, gridStart);
                      const clampEnd   = Math.min(startMin + dur, gridEnd);
                      const topPx    = ((clampStart - gridStart) / totalMin) * gridHeightPx;
                      const heightPx = Math.max(20, ((clampEnd - clampStart) / totalMin) * gridHeightPx - 2);
                      const short    = heightPx < 38;
                      return (
                        <button
                          key={b.id}
                          type="button"
                          data-booking-block
                          className="absolute left-0.5 right-0.5 z-10 overflow-hidden rounded-lg border-l-[3px] text-left transition-all hover:brightness-95 hover:shadow-md"
                          style={{ top: `${topPx}px`, height: `${heightPx}px`, padding: short ? "1px 4px" : "3px 5px", ...statusStyle(b.status) }}
                          onClick={(e) => { e.stopPropagation(); setDetailBooking(b); }}
                        >
                          <div className="flex items-baseline gap-1 leading-tight">
                            <span className="text-[9px] font-black tabular-nums">{b.booking_time.slice(0, 5)}</span>
                            {!short && <span className="text-[8px] uppercase tracking-wide opacity-50">{statusLabel(b.status)}</span>}
                          </div>
                          {!short && <div className="truncate text-[10px] font-bold leading-tight">{b.client_name}</div>}
                          {!short && <div className="truncate text-[9px] leading-tight opacity-60">{b.service_name}</div>}
                          {short && <div className="truncate text-[9px] font-bold leading-tight">{b.client_name}</div>}
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {detailBooking && (
        <BookingDetailModal booking={detailBooking} onClose={() => setDetailBooking(null)} onAfterChange={refresh} />
      )}

      {quickOpen && quickWH && (
        <QuickBooking
          salonSlug={salonSlug}
          date={quickDate}
          time={quickTime}
          services={services}
          specialists={specialists}
          plan={plan}
          workingHours={quickWH as unknown as WorkingHours}
          onClose={() => setQuickOpen(false)}
          onSaved={() => { setQuickOpen(false); startTransition(() => refresh()); }}
        />
      )}
    </>
  );
}
