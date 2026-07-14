"use client";

import {
  FinancesDashboard,
  type CategorySlice,
  type MonthBar,
  type Transaction,
} from "@/components/admin/finances/FinancesDashboard";
import { totalMonthlyOverheadEur } from "@/lib/finance-abc";
import { EXPENSE_CATEGORIES } from "@/lib/finance-constants";
import { monthBoundsISO } from "@/lib/finance-dates";
import { useDemo } from "@/lib/demo/store";

const BG_SHORT = ["яну", "фев", "мар", "апр", "май", "юни", "юли", "авг", "сеп", "окт", "ное", "дек"];

function categoryOf(description: string) {
  return EXPENSE_CATEGORIES.find((c) => description.startsWith(c.emoji) || description === c.value);
}

/** Годината и месецът идват от server page-а — виж бележката в calendar-view.tsx. */
export function DemoFinancesView(props: { year: number; month: number }) {
  const { year, month } = props;
  const { state } = useDemo();

  const { from: monthFrom, to: monthTo } = monthBoundsISO(year, month);

  const s = state.financialSettings;
  const overhead = totalMonthlyOverheadEur({
    rent_eur: s.rent_eur,
    electricity_eur: s.electricity_eur,
    water_eur: s.water_eur,
    accounting_eur: s.accounting_eur,
    desired_salary: s.desired_salary,
    other_monthly_expenses: s.monthly_expenses,
  });

  const revenueBetween = (fromDate: string, toDate: string) =>
    state.bookings
      .filter(
        (b) => b.status === "completed" && b.booking_date >= fromDate && b.booking_date <= toDate,
      )
      .reduce((sum, b) => sum + Number(b.service_price_eur), 0);

  const expensesBetween = (fromDate: string, toDate: string) =>
    state.expenses.filter((e) => e.date >= fromDate && e.date <= toDate);

  const monthExpenses = expensesBetween(monthFrom, monthTo);
  const variableExpenses = monthExpenses.reduce((sum, e) => sum + Number(e.amount), 0);

  const catMap = new Map<string, number>();
  for (const e of monthExpenses) {
    const key = categoryOf(e.description)?.value ?? "🔹 Други";
    catMap.set(key, (catMap.get(key) ?? 0) + Number(e.amount));
  }
  const categorySlices: CategorySlice[] = EXPENSE_CATEGORIES.map((c) => ({
    category: c.value,
    emoji: c.emoji,
    amount: catMap.get(c.value) ?? 0,
    color: c.color,
  }));

  const last6Months: MonthBar[] = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(year, month - 1 - (5 - i), 1);
    const y = d.getFullYear();
    const m = d.getMonth() + 1;
    const { from, to } = monthBoundsISO(y, m);
    const varExp = expensesBetween(from, to).reduce((sum, e) => sum + Number(e.amount), 0);
    return { label: BG_SHORT[m - 1], revenue: revenueBetween(from, to), expenses: varExp + overhead };
  });

  const incomeItems: Transaction[] = state.bookings
    .filter((b) => b.status === "completed" && b.booking_date >= monthFrom && b.booking_date <= monthTo)
    .slice(0, 8)
    .map((b) => ({
      id: b.id,
      date: b.booking_date,
      label: b.service_name,
      amount: Number(b.service_price_eur),
      type: "in" as const,
      emoji: "✂️",
    }));

  const expenseItems: Transaction[] = monthExpenses.map((e) => ({
    id: e.id,
    date: e.date,
    label: e.description || "Разход",
    amount: Number(e.amount),
    type: "out" as const,
    emoji: categoryOf(e.description)?.emoji ?? "🔹",
  }));

  const transactions: Transaction[] = [...incomeItems, ...expenseItems]
    .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id))
    .slice(0, 5);

  return (
    <FinancesDashboard
      salonName={state.tenant.salon_name}
      year={year}
      month={month}
      revenue={revenueBetween(monthFrom, monthTo)}
      overhead={overhead}
      variableExpenses={variableExpenses}
      categorySlices={categorySlices}
      last6Months={last6Months}
      transactions={transactions}
      overheadMissing={false}
    />
  );
}
