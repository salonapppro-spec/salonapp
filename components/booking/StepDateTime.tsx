"use client";

import type { TimeSlot } from "@/types";

export function StepDateTime(props: {
  stepLabel: string;
  date: string;
  onDateChange: (d: string) => void;
  slots: TimeSlot[];
  loading: boolean;
  selectedTime: string;
  onSelectTime: (t: string) => void;
  onRefreshSlots: () => void;
}) {
  const { stepLabel, date, onDateChange, slots, loading, selectedTime, onSelectTime, onRefreshSlots } = props;

  return (
    <div className="space-y-4">
      <p className="text-sm font-medium text-neutral-800">{stepLabel}</p>
      <div>
        <label className="text-xs font-medium text-neutral-600">Дата</label>
        <input
          type="date"
          className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
          value={date}
          onChange={(e) => onDateChange(e.target.value)}
        />
      </div>
      <button
        type="button"
        onClick={onRefreshSlots}
        className="text-sm font-semibold text-brand-700 underline-offset-4 hover:underline"
      >
        {loading ? "Зареждане…" : "Покажи свободни часове"}
      </button>
      {slots.length > 0 ? (
        <div>
          <p className="mb-2 text-xs text-neutral-600">
            <span className="mr-3 inline-flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500" /> магнитен слот
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded-sm bg-neutral-300" /> свободен
            </span>
          </p>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {slots.map((slot) => (
              <button
                key={slot.time}
                type="button"
                onClick={() => onSelectTime(slot.time)}
                className={`rounded-lg border px-2 py-2.5 text-center text-xs font-semibold sm:text-sm ${
                  selectedTime === slot.time ? "ring-2 ring-brand-500 ring-offset-1" : ""
                } ${slot.magnetic ? "border-emerald-500 bg-emerald-50 text-emerald-900" : "border-neutral-200 bg-neutral-100 text-neutral-800"}`}
              >
                {slot.time}
              </button>
            ))}
          </div>
        </div>
      ) : !loading ? (
        <p className="text-sm text-neutral-500">Изберете дата и натиснете за зареждане на часове.</p>
      ) : null}
    </div>
  );
}
