"use client";

import type { Service } from "@/types";

const BGN_RATE = 1.956;
function eurToBgn(eur: number): string {
  return (eur * BGN_RATE).toFixed(2);
}

export function StepService(props: {
  stepLabel: string;
  services: Service[];
  value: string;
  onChange: (id: string) => void;
}) {
  const { stepLabel, services, value, onChange } = props;
  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-neutral-800">{stepLabel}</p>
      {services.length === 0 ? (
        <p className="text-sm text-neutral-600">Няма налични услуги за избрания специалист.</p>
      ) : (
        <div className="grid gap-2">
          {services.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => onChange(s.id)}
              className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left text-sm transition ${
                value === s.id ? "border-brand-600 bg-brand-50" : "border-neutral-200 bg-white hover:border-brand-300"
              }`}
            >
              <span className="font-medium text-neutral-900">{s.name}</span>
              <span className="shrink-0 font-semibold text-brand-800">
                {Number(s.price_eur).toFixed(0)} € <span className="font-normal text-neutral-500 text-xs">({eurToBgn(Number(s.price_eur))} лв)</span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
