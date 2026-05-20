import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";

import { FinanceAbcSection } from "@/components/admin/finances/FinanceAbcSection";
import { FinanceExpensesSection } from "@/components/admin/finances/FinanceExpensesSection";
import { FinanceReportsSection } from "@/components/admin/finances/FinanceReportsSection";
import { FinanceSummarySection } from "@/components/admin/finances/FinanceSummarySection";
import { resolveFinanceScope } from "@/lib/admin-finance-scope";
import {
  financialSettingsForUi,
  getAllServicesAdmin,
  getCompletedBookingAmountsInRange,
  getCompletedRevenueBetween,
  getFinancialSettings,
} from "@/lib/data";
import { currentWeekRangeISO, monthBoundsISO } from "@/lib/finance-dates";

function todayLocalISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${mo}-${day}`;
}

function FinancesSkeleton() {
  return (
    <div className="mt-8 animate-pulse space-y-6">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="h-24 rounded-2xl border border-[#C9A84C]/20 bg-white/80" />
        <div className="h-24 rounded-2xl border border-[#C9A84C]/20 bg-white/80" />
        <div className="h-24 rounded-2xl border border-[#C9A84C]/20 bg-white/80" />
      </div>
      <div className="space-y-3">
        <div className="h-5 w-44 rounded-lg bg-[#1A1A1A]/10" />
        <div className="h-48 rounded-2xl border border-[#C9A84C]/15 bg-white/80" />
      </div>
      <div className="space-y-3">
        <div className="h-5 w-36 rounded-lg bg-[#1A1A1A]/10" />
        <div className="h-64 rounded-2xl border border-[#C9A84C]/15 bg-white/80" />
      </div>
    </div>
  );
}

async function FinancesDataSection() {
  const scope = await resolveFinanceScope();
  if (!scope) redirect("/admin/login");

  const { salonSlug, specialistIdFilter, canSeeReports } = scope;

  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth() + 1;
  const today = todayLocalISO();
  const { from: weekFrom, to: weekTo } = currentWeekRangeISO();
  const { from: monthFrom, to: monthTo, daysInMonth } = monthBoundsISO(y, m);

  const [settingsRow, dayRev, weekRev, monthRev, bookingAmounts, allServices] = await Promise.all([
    getFinancialSettings(salonSlug),
    getCompletedRevenueBetween(salonSlug, today, today, specialistIdFilter),
    getCompletedRevenueBetween(salonSlug, weekFrom, weekTo, specialistIdFilter),
    getCompletedRevenueBetween(salonSlug, monthFrom, monthTo, specialistIdFilter),
    getCompletedBookingAmountsInRange(salonSlug, monthFrom, monthTo, specialistIdFilter),
    getAllServicesAdmin(salonSlug),
  ]);

  const settings = financialSettingsForUi(salonSlug, settingsRow);

  const byDay = new Map<string, number>();
  for (const r of bookingAmounts) {
    const k = r.booking_date;
    byDay.set(k, (byDay.get(k) ?? 0) + Number(r.service_price_eur));
  }
  const daily: { key: string; amount: number; label: string }[] = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const key = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    daily.push({ key, amount: byDay.get(key) ?? 0, label: String(d) });
  }

  const abcServices = allServices.filter((s) => {
    if (!s.is_active) return false;
    if (!specialistIdFilter) return true;
    return s.specialist_id === specialistIdFilter || s.specialist_id == null;
  });

  return (
    <>
      {specialistIdFilter ? (
        <p className="mt-3 rounded-xl border border-amber-200/90 bg-amber-50/90 px-4 py-3 text-sm text-amber-950">
          Колективен режим: виждате оборота и услугите за вашия профил. Техническият администратор вижда салона
          изцяло.
        </p>
      ) : null}

      <div className="mt-8 space-y-10">
        <FinanceAbcSection initialSettings={settings} services={abcServices} />

        <FinanceSummarySection
          dayRev={dayRev}
          weekRev={weekRev}
          monthRev={monthRev}
          revenueGoal={settings.monthly_revenue_goal_eur}
          year={y}
          month={m}
          daily={daily}
        />

        <FinanceExpensesSection defaultFrom={monthFrom} defaultTo={today} />

        {canSeeReports ? <FinanceReportsSection year={y} month={m} /> : null}

        <section className="admin-card space-y-3">
          <h2 className="text-lg font-semibold tracking-tight text-brand-900">Резервации и график</h2>
          <p className="text-sm text-brand-800/85">
            Буфер между часове, прозорец за онлайн запис и магнитно планиране се управляват от страницата Настройки, за
            да не се дублират с финансовите полета тук.
          </p>
          <Link
            href="/admin/settings"
            className="inline-flex w-fit items-center justify-center rounded-xl border border-brand-300/80 bg-white px-4 py-2 text-sm font-semibold text-brand-900 shadow-sm transition hover:bg-brand-50"
          >
            Отвори настройки →
          </Link>
        </section>
      </div>
    </>
  );
}

export default function AdminFinancesPage() {
  return (
    <div className="admin-page-shell max-w-5xl">
      <h1 className="text-2xl font-semibold tracking-tight text-brand-900 sm:text-3xl">Финанси</h1>
      <p className="mt-2 text-sm text-brand-800/85 sm:text-base">
        Първо задайте разходи и цел, после вижте оборота и ABC. Разходни фактури и отчети са по-долу.
      </p>

      <Suspense fallback={<FinancesSkeleton />}>
        <FinancesDataSection />
      </Suspense>
    </div>
  );
}
