import { Suspense } from "react";
import { redirect } from "next/navigation";

import { resolveFinanceScope } from "@/lib/admin-finance-scope";
import {
  financialSettingsForUi,
  getCompletedRevenueBetween,
  getExpensesBetween,
  getExpensesForMonth,
  getFinancialSettings,
  getRecentCompletedBookings,
  getTenantBySalonSlug,
} from "@/lib/data";
import { totalMonthlyOverheadEur } from "@/lib/finance-abc";
import { monthBoundsISO } from "@/lib/finance-dates";
import {
  type CategorySlice,
  type MonthBar,
  type Transaction,
  EXPENSE_CATEGORIES,
} from "@/lib/finance-constants";
import { FinancesDashboard } from "@/components/admin/finances/FinancesDashboard";

// ─── Bulgarian short month labels ─────────────────────────────────────────────
const BG_SHORT = ["яну","фев","мар","апр","май","юни","юли","авг","сеп","окт","ное","дек"];

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function FinancesSkeleton() {
  return (
    <div className="animate-pulse space-y-6 pb-32 pt-2">
      <div className="flex items-center justify-between">
        <div className="h-8 w-36 rounded-2xl bg-slate-200" />
        <div className="h-10 w-40 rounded-2xl bg-slate-200" />
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-32 rounded-3xl bg-slate-100" />
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="h-48 rounded-3xl bg-white ring-1 ring-slate-100" />
        <div className="h-48 rounded-3xl bg-white ring-1 ring-slate-100" />
      </div>
      <div className="h-64 rounded-3xl bg-white ring-1 ring-slate-100" />
    </div>
  );
}

// ─── Data Section (server async) ──────────────────────────────────────────────
async function FinancesDataSection({ year, month }: { year: number; month: number }) {
  const scope = await resolveFinanceScope();
  if (!scope) redirect("/admin/login");

  const { salonSlug, specialistIdFilter } = scope;
  const { from: monthFrom, to: monthTo } = monthBoundsISO(year, month);

  // ── Fetch current month data in parallel ──────────────────────────────────
  const [tenant, settingsRow, monthRevenue, monthExpenseRows, recentBookings] = await Promise.all([
    getTenantBySalonSlug(salonSlug),
    getFinancialSettings(salonSlug),
    getCompletedRevenueBetween(salonSlug, monthFrom, monthTo, specialistIdFilter),
    getExpensesForMonth(salonSlug, year, month),
    getRecentCompletedBookings(salonSlug, monthFrom, monthTo, specialistIdFilter, 8),
  ]);

  const settings        = financialSettingsForUi(salonSlug, settingsRow);
  const overheadMissing = settings.rent_eur === 0 &&
    settings.electricity_eur === 0 &&
    settings.water_eur === 0 &&
    settings.accounting_eur === 0 &&
    settings.desired_salary === 0 &&
    settings.monthly_expenses === 0;

  const overhead = totalMonthlyOverheadEur({
    rent_eur:              settings.rent_eur,
    electricity_eur:       settings.electricity_eur,
    water_eur:             settings.water_eur,
    accounting_eur:        settings.accounting_eur,
    desired_salary:        settings.desired_salary,
    other_monthly_expenses: settings.monthly_expenses,
  });

  const variableExpenses = monthExpenseRows.reduce(
    (s, e) => s + Number((e as { amount: unknown }).amount ?? 0), 0
  );

  // ── Category slices for donut ─────────────────────────────────────────────
  const catMap = new Map<string, number>();
  for (const e of monthExpenseRows) {
    const row  = e as { description: string; amount: number };
    const desc = row.description ?? "🔹 Други";
    const matched = EXPENSE_CATEGORIES.find((c) => desc.startsWith(c.emoji) || desc === c.value);
    const key  = matched ? matched.value : "🔹 Други";
    catMap.set(key, (catMap.get(key) ?? 0) + Number(row.amount));
  }
  const categorySlices: CategorySlice[] = EXPENSE_CATEGORIES.map((c) => ({
    category: c.value,
    emoji:    c.emoji,
    amount:   catMap.get(c.value) ?? 0,
    color:    c.color,
  }));

  // ── Last 6 months for bar chart ───────────────────────────────────────────
  const monthsToFetch = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(year, month - 1 - (5 - i), 1);
    return { y: d.getFullYear(), m: d.getMonth() + 1 };
  });

  const last6Months: MonthBar[] = await Promise.all(
    monthsToFetch.map(async ({ y, m }) => {
      const { from, to } = monthBoundsISO(y, m);
      const [rev, expRows] = await Promise.all([
        getCompletedRevenueBetween(salonSlug, from, to, specialistIdFilter),
        getExpensesBetween(salonSlug, from, to),
      ]);
      const varExp = expRows.reduce((s, e) => s + Number(e.amount), 0);
      return {
        label:    BG_SHORT[m - 1],
        revenue:  rev,
        expenses: varExp + overhead,
      };
    })
  );

  // ── Recent transactions (bookings + expenses, last 5) ─────────────────────
  const incomeItems: Transaction[] = recentBookings.map((b) => ({
    id:     b.id,
    date:   b.booking_date,
    label:  b.service_name,
    amount: Number(b.service_price_eur),
    type:   "in",
    emoji:  "✂️",
  }));

  const expenseItems: Transaction[] = monthExpenseRows.map((e) => {
    const row     = e as { id: string; date: string; description: string; amount: number };
    const matched = EXPENSE_CATEGORIES.find(
      (c) => row.description?.startsWith(c.emoji) || row.description === c.value
    );
    return {
      id:     row.id,
      date:   row.date,
      label:  row.description ?? "Разход",
      amount: Number(row.amount),
      type:   "out",
      emoji:  matched?.emoji ?? "🔹",
    };
  });

  const transactions: Transaction[] = [...incomeItems, ...expenseItems]
    .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id))
    .slice(0, 5);

  return (
    <FinancesDashboard
      salonName        ={tenant?.salon_name ?? salonSlug}
      year             ={year}
      month            ={month}
      revenue          ={monthRevenue}
      overhead         ={overhead}
      variableExpenses ={variableExpenses}
      categorySlices   ={categorySlices}
      last6Months      ={last6Months}
      transactions     ={transactions}
      overheadMissing  ={overheadMissing}
    />
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default async function AdminFinancesPage(
  props: { searchParams?: Promise<Record<string, string | string[] | undefined>> }
) {
  const sp  = (await props.searchParams) ?? {};
  const now = new Date();
  const year  = Math.min(Math.max(Number(sp.y ?? now.getFullYear()), 2020), 2030);
  const month = Math.min(Math.max(Number(sp.m ?? now.getMonth() + 1), 1), 12);

  return (
    <div className="admin-page-shell max-w-3xl">
      <Suspense fallback={<FinancesSkeleton />}>
        <FinancesDataSection year={year} month={month} />
      </Suspense>
    </div>
  );
}
