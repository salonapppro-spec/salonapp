"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function CalendarNavClient(props: {
  date: string;
  view: "day" | "week" | "month";
  prevDate: string;
  nextDate: string;
  monthLabel?: string;
}) {
  const { date, view, prevDate, nextDate, monthLabel } = props;
  const router = useRouter();

  function go(d: string) {
    router.push(`/admin/calendar?date=${d}&view=${view}`);
  }

  return (
    <div className="mt-5 flex flex-wrap items-end gap-2">
      {/* Prev */}
      <button
        type="button"
        aria-label="Назад"
        onClick={() => go(prevDate)}
        className="inline-flex h-[48px] w-[48px] shrink-0 items-center justify-center rounded-xl border transition hover:bg-[rgba(201,168,76,0.08)] active:scale-95"
        style={{ borderColor: "rgba(201,168,76,0.35)", color: "#C8826A" }}
      >
        <ChevronLeft size={20} strokeWidth={2} />
      </button>

      {/* Date input / month label */}
      <div className="min-w-0 flex-1 sm:flex-none">
        <p className="text-[10px] font-black uppercase tracking-[0.15em] text-[#1A1A1A]/45">
          {view === "month" ? "Месец" : view === "week" ? "Дата в седмицата" : "Дата"}
        </p>
        {view === "month" ? (
          <div
            className="input-admin !mt-1 flex items-center sm:min-w-[12rem]"
            style={{ cursor: "default" }}
          >
            <span className="capitalize">{monthLabel}</span>
          </div>
        ) : (
          <input
            type="date"
            className="input-admin !mt-1 w-full sm:min-w-[12rem]"
            value={date}
            onChange={(e) => { if (e.target.value) go(e.target.value); }}
          />
        )}
      </div>

      {/* Next */}
      <button
        type="button"
        aria-label="Напред"
        onClick={() => go(nextDate)}
        className="inline-flex h-[48px] w-[48px] shrink-0 items-center justify-center rounded-xl border transition hover:bg-[rgba(201,168,76,0.08)] active:scale-95"
        style={{ borderColor: "rgba(201,168,76,0.35)", color: "#C8826A" }}
      >
        <ChevronRight size={20} strokeWidth={2} />
      </button>
    </div>
  );
}
