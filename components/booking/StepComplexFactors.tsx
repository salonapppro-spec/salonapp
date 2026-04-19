"use client";

import type { HairDensity, HairLength } from "@/types";

const LENGTHS: { v: HairLength; label: string }[] = [
  { v: "short", label: "Къса" },
  { v: "medium", label: "Средна" },
  { v: "long", label: "Дълга" },
];

const DENSITIES: { v: HairDensity; label: string }[] = [
  { v: "thin", label: "Рядка" },
  { v: "medium", label: "Средна" },
  { v: "thick", label: "Гъста" },
];

export function StepComplexFactors(props: {
  stepLabel: string;
  hairLength: HairLength | "";
  hairDensity: HairDensity | "";
  onHairLength: (v: HairLength) => void;
  onHairDensity: (v: HairDensity) => void;
}) {
  const { stepLabel, hairLength, hairDensity, onHairLength, onHairDensity } = props;
  return (
    <div className="space-y-5">
      <p className="text-sm font-medium text-neutral-800">{stepLabel}</p>
      <div>
        <p className="text-xs font-medium text-neutral-600">Дължина</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {LENGTHS.map(({ v, label }) => (
            <button
              key={v}
              type="button"
              onClick={() => onHairLength(v)}
              className={`rounded-lg border px-3 py-2 text-sm ${
                hairLength === v ? "border-brand-600 bg-brand-50 font-medium" : "border-neutral-200 bg-white"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className="text-xs font-medium text-neutral-600">Гъстота</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {DENSITIES.map(({ v, label }) => (
            <button
              key={v}
              type="button"
              onClick={() => onHairDensity(v)}
              className={`rounded-lg border px-3 py-2 text-sm ${
                hairDensity === v ? "border-brand-600 bg-brand-50 font-medium" : "border-neutral-200 bg-white"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
