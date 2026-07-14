import { DemoCalendarView, type ViewType } from "@/app/demo/calendar/calendar-view";
import { todayDateISOInSofia } from "@/lib/booking-datetime";

type CalendarSearchParams = { date?: string; view?: string };

export default async function DemoCalendarPage(props: {
  searchParams?: Promise<CalendarSearchParams>;
}) {
  const sp = await props.searchParams;
  const date = sp?.date && /^\d{4}-\d{2}-\d{2}$/.test(sp.date) ? sp.date : todayDateISOInSofia();
  const view: ViewType = sp?.view === "week" ? "week" : sp?.view === "month" ? "month" : "day";

  return <DemoCalendarView date={date} view={view} />;
}
