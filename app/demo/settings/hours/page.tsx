"use client";

import { WorkingHoursForm } from "@/components/admin/WorkingHoursForm";
import { useDemo } from "@/lib/demo/store";

export default function DemoSettingsHoursPage() {
  const { state } = useDemo();

  const days = state.workingHours
    .slice()
    .sort((a, b) => a.day_of_week - b.day_of_week)
    .map((w) => ({ start_time: w.start_time, end_time: w.end_time, is_day_off: w.is_day_off }));

  return (
    <div className="max-w-3xl">
      <WorkingHoursForm key={JSON.stringify(days)} initialDays={days} />
    </div>
  );
}
