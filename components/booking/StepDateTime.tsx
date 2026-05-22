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
          className="mt-1 w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900"
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
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {slots.map((slot) => (
              <button
                key={slot.time}
                type="button"
                onClick={() => onSelectTime(slot.time)}
                className={`rounded-lg border px-2 py-2.5 text-center text-xs font-semibold sm:text-sm transition-colors ${
                  selectedTime === slot.time
                    ? "border-brand-500 bg-brand-500 text-white ring-2 ring-brand-500 ring-offset-1"
                    : "border-neutral-200 bg-white text-neutral-800 hover:border-brand-400 hover:bg-brand-50"
                }`}
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
