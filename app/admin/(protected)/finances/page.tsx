import { redirect } from "next/navigation";

import { FinancialSettingsForm } from "@/components/admin/FinancialSettingsForm";
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

export default async function AdminFinancesPage() {
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
    <div className="admin-page-shell max-w-5xl">
      <h1 className="text-2xl font-semibold tracking-tight text-brand-900 sm:text-3xl">Финанси</h1>
      <p className="mt-2 text-sm text-brand-800/85 sm:text-base">
        Прогнозна стойност от завършени резервации, ABC анализ и разходи.
      </p>

      {specialistIdFilter ? (
        <p className="mt-3 rounded-xl border border-amber-200/90 bg-amber-50/90 px-4 py-3 text-sm text-amber-950">
          Колективен режим: виждате прогнозната стойност и услугите за вашия профил. Техническият администратор вижда салона
          изцяло.
        </p>
      ) : null}

      <div className="mt-8 space-y-10">
        <FinanceSummarySection
          dayRev={dayRev}
          weekRev={weekRev}
          monthRev={monthRev}
          revenueGoal={settings.monthly_revenue_goal_eur}
          year={y}
          month={m}
          daily={daily}
        />

        <FinanceAbcSection initialSettings={settings} services={abcServices} />

        <FinanceExpensesSection defaultFrom={monthFrom} defaultTo={today} />

        {canSeeReports ? <FinanceReportsSection year={y} month={m} /> : null}

        <FinancialSettingsForm settings={settings} variant="booking" />
      </div>
    </div>
  );
}
