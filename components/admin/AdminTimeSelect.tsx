"use client";

import { minutesToTime, timeToMinutes } from "@/lib/scheduling";

const DEFAULT_FROM = "06:00";
const DEFAULT_TO = "22:00";
const STEP_MINUTES = 15;

export function buildTimeOptions(from = DEFAULT_FROM, to = DEFAULT_TO, step = STEP_MINUTES): string[] {
  const slots: string[] = [];
  let t = timeToMinutes(from);
  const end = timeToMinutes(to);
  while (t <= end) {
    slots.push(minutesToTime(t));
    t += step;
  }
  return slots;
}

export function AdminTimeSelect(props: {
  id?: string;
  label: string;
  value: string;
  options: string[];
  placeholder?: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  return (
    <div className={props.className}>
      <label htmlFor={props.id} className="text-xs font-semibold text-brand-800">
        {props.label}
      </label>
      <select
        id={props.id}
        className="input-admin !mt-1.5 w-full appearance-none bg-white py-3 text-base font-medium"
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
      >
        {props.placeholder ? <option value="">{props.placeholder}</option> : null}
        {props.options.map((time) => (
          <option key={time} value={time}>
            {time}
          </option>
        ))}
      </select>
    </div>
  );
}
