"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { AdminChrome } from "@/components/admin/AdminChrome";
import { tomorrowDateISOInSofia } from "@/lib/booking-datetime";
import { DemoProvider, DemoReady, useDemoOptional } from "@/lib/demo/store";

/**
 * Демо панелът — истинският админ, но с данни от локалния стор.
 *
 * Нищо от тук не стига до Supabase, Resend или Stripe: `DemoProvider` пач-ва
 * `fetch` и обслужва `/api/admin/*` в браузъра (виж `lib/demo/`). Затова тази
 * секция няма auth guard — няма какво да се защитава.
 */
function DemoBanner() {
  const demo = useDemoOptional();
  const pathname = usePathname() ?? "";

  return (
    <div className="sticky top-0 z-[100] flex flex-wrap items-center justify-between gap-2 bg-[#1A1A1A] px-3 py-2 text-sm text-white">
      <span className="min-w-0 flex-1">
        <strong className="font-black" style={{ color: "#C9A84C" }}>
          ДЕМО
        </strong>
        <span className="ml-2 text-white/70">
          Пробвай всичко — нищо не се записва и нищо не се изпраща.
        </span>
      </span>
      <span className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={() => demo?.reset()}
          disabled={!demo?.state}
          className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-semibold transition hover:bg-white/20 disabled:opacity-50"
        >
          Нулирай демото
        </button>
        <Link
          href="/get-started"
          className="rounded-lg px-3 py-1.5 text-xs font-black text-[#1A1A1A] transition hover:opacity-90"
          style={{ background: "linear-gradient(135deg, #C9A84C, #C8826A)" }}
          data-demo-path={pathname}
        >
          Искам такъв панел
        </Link>
      </span>
    </div>
  );
}

export default function DemoLayout(props: { children: React.ReactNode }) {
  const tomorrow = tomorrowDateISOInSofia();

  return (
    <DemoProvider>
      <div
        className="min-h-[100dvh] text-[#1A1A1A]"
        style={{ background: "linear-gradient(160deg, #F8EBDD 0%, #F3EBE0 50%, #EAD5C4 100%)" }}
      >
        <DemoBanner />
        <AdminChrome
          basePath="/demo"
          exitLink={{ href: "/", label: "Изход от демото" }}
          mobileScheduleQuickLinks={{
            tomorrow: `/demo/calendar?date=${tomorrow}&view=day`,
            week: `/demo/calendar?view=week`,
            calendar: `/demo/calendar`,
          }}
        />
        <div className="overflow-x-hidden md:pl-56">
          <div className="mx-auto max-w-6xl px-3 pb-[calc(8.5rem+env(safe-area-inset-bottom))] pt-2 md:px-6 md:pb-8 md:pt-6">
            <DemoReady>{props.children}</DemoReady>
          </div>
        </div>
      </div>
    </DemoProvider>
  );
}
