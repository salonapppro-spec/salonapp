import type { SalonData } from "@/types/database";

import { WEEKDAY_LABELS_SHORT } from "@/components/templates/salon-shared";

export function SalonWorkingHours(props: {
  data: SalonData;
  headingClassName?: string;
  rowClassName?: string;
  rowBorderClassName?: string;
}) {
  const {
    data,
    headingClassName = "text-xl font-semibold",
    rowClassName = "text-sm",
    rowBorderClassName = "border-black/5",
  } = props;
  return (
    <section className="mt-10">
      <h2 className={headingClassName}>Работно време</h2>
      <ul className={`mt-3 space-y-1 ${rowClassName}`}>
        {data.workingHours.map((wh) => (
          <li key={wh.id} className={`flex justify-between gap-4 border-b py-2 last:border-0 ${rowBorderClassName}`}>
            <span>{WEEKDAY_LABELS_SHORT[wh.day_of_week]}</span>
            <span>{wh.is_day_off ? "Почивен ден" : `${wh.start_time.slice(0, 5)} – ${wh.end_time.slice(0, 5)}`}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
