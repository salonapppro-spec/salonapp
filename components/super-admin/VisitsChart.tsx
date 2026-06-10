"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

export type DailyEvent = {
  date: string;
  visitors: number;
  cta_click: number;
  form_filled: number;
};

export function VisitsChart({ data }: { data: DailyEvent[] }) {
  if (data.length === 0) {
    return <p className="text-sm text-neutral-400">Няма данни за последните 30 дни.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
        <XAxis
          dataKey="date"
          tick={{ fill: "#a3a3a3", fontSize: 10 }}
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fill: "#a3a3a3", fontSize: 10 }}
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
        />
        <Tooltip
          contentStyle={{ background: "#0a0a0a", border: "1px solid #262626", borderRadius: 8, fontSize: 12 }}
          labelStyle={{ color: "#e5e5e5" }}
          cursor={{ fill: "rgba(255,255,255,0.04)" }}
        />
        <Legend
          wrapperStyle={{ fontSize: 11, color: "#a3a3a3" }}
          formatter={(value) => value === "visitors" ? "Посетители" : value === "cta_click" ? "CTA клик" : "Форма"}
        />
        <Bar dataKey="visitors" fill="#38bdf8" radius={[3, 3, 0, 0]} maxBarSize={24} />
        <Bar dataKey="cta_click" fill="#f59e0b" radius={[3, 3, 0, 0]} maxBarSize={24} />
        <Bar dataKey="form_filled" fill="#34d399" radius={[3, 3, 0, 0]} maxBarSize={24} />
      </BarChart>
    </ResponsiveContainer>
  );
}
