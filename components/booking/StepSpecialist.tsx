"use client";

import type { Specialist } from "@/types";

export function StepSpecialist(props: {
  specialists: Specialist[];
  value: string;
  onChange: (id: string) => void;
}) {
  const { specialists, value, onChange } = props;
  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-neutral-800">Стъпка 1 от 6 — изберете специалист</p>
      <div className="grid gap-2">
        {specialists.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => onChange(s.id)}
            className={`rounded-xl border px-4 py-3 text-left text-sm font-medium transition ${
              value === s.id ? "border-brand-600 bg-brand-50 text-brand-900" : "border-neutral-200 bg-white hover:border-brand-300"
            }`}
          >
            <span className="block">{s.name}</span>
            {s.role ? <span className="mt-0.5 block text-xs font-normal text-neutral-600">{s.role}</span> : null}
          </button>
        ))}
      </div>
    </div>
  );
}
