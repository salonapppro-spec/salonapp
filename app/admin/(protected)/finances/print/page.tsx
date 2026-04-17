import Link from "next/link";
import { redirect } from "next/navigation";

import { FinancePrintActions } from "@/components/admin/finances/FinancePrintActions";
import { resolveFinanceScope } from "@/lib/admin-finance-scope";
import { getCompletedRevenueBetween, getExpensesBetween, getTenantBySalonSlug } from "@/lib/data";
import { monthBoundsISO, yearBoundsISO } from "@/lib/finance-dates";

function pickParam(v: string | string[] | undefined): string | undefined {
  if (Array.isArray(v)) return v[0];
  return v;
}

export default async function FinancePrintPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const scope = await resolveFinanceScope();
  if (!scope) redirect("/admin/login");

  const y = Number(pickParam(searchParams.y)) || new Date().getFullYear();
  const mRaw = pickParam(searchParams.m);
  const m = mRaw != null && mRaw !== "" ? Number(mRaw) : null;
  const isMonthly = m != null && Number.isFinite(m) && m! >= 1 && m! <= 12;

  const { from, to } = isMonthly ? monthBoundsISO(y, m!) : yearBoundsISO(y);

  const { salonSlug, specialistIdFilter, canSeeReports } = scope;

  if (!canSeeReports) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10">
        <h1 className="text-xl font-semibold text-brand-900">Няма достъп</h1>
        <p className="mt-2 text-sm text-brand-800">Отчетите са налични за Pro, Premium и Колектив.</p>
        <Link href="/admin/finances" className="mt-4 inline-block text-sm font-medium text-brand-700 underline print:hidden">
          Към финанси
        </Link>
      </div>
    );
  }

  const [revenue, expenseRows, tenant] = await Promise.all([
    getCompletedRevenueBetween(salonSlug, from, to, specialistIdFilter),
    getExpensesBetween(salonSlug, from, to),
    getTenantBySalonSlug(salonSlug),
  ]);

  const expenseTotal = expenseRows.reduce((s, e) => s + Number(e.amount), 0);
  const net = revenue - expenseTotal;

  const periodLabel = isMonthly
    ? `${String(m).padStart(2, "0")}.${y}`
    : `година ${y}`;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 print:max-w-none print:py-4">
      <div className="print:hidden mb-6 flex flex-wrap items-center gap-3">
        <FinancePrintActions />
        <Link href="/admin/finances" className="text-sm font-medium text-brand-800 underline">
          Назад към финанси
        </Link>
      </div>

      <header className="border-b border-brand-200 pb-4">
        <p className="text-xs uppercase tracking-wide text-brand-600">Финансов отчет (ориентировъчен)</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-brand-900">
          {isMonthly ? "Месечен отчет" : "Годишен отчет"} — {tenant?.salon_name ?? salonSlug}
        </h1>
        <p className="mt-2 text-sm text-brand-800">
          Период: {from} — {to} ({periodLabel})
        </p>
        {specialistIdFilter ? (
          <p className="mt-2 text-sm font-medium text-amber-900">Обхват: само вашите резервации (колективен специалист).</p>
        ) : null}
      </header>

      <section className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-brand-200/80 bg-white px-4 py-3">
          <div className="text-xs font-medium uppercase tracking-wide text-brand-700/85">Оборот (completed)</div>
          <div className="mt-1 text-xl font-semibold tabular-nums text-brand-900">{revenue.toFixed(2)} €</div>
        </div>
        <div className="rounded-xl border border-brand-200/80 bg-white px-4 py-3">
          <div className="text-xs font-medium uppercase tracking-wide text-brand-700/85">Разходни фактури</div>
          <div className="mt-1 text-xl font-semibold tabular-nums text-brand-900">{expenseTotal.toFixed(2)} €</div>
        </div>
        <div className="rounded-xl border border-brand-200/80 bg-white px-4 py-3">
          <div className="text-xs font-medium uppercase tracking-wide text-brand-700/85">Резултат (ориентировъчен)</div>
          <div className="mt-1 text-xl font-semibold tabular-nums text-brand-900">{net.toFixed(2)} €</div>
        </div>
      </section>

      {expenseRows.length > 0 ? (
        <section className="mt-8">
          <h2 className="text-sm font-semibold text-brand-900">Детайл — разходи</h2>
          <table className="mt-3 w-full border-collapse text-sm print:text-xs">
            <thead>
              <tr className="border-b border-brand-200 text-left text-brand-700">
                <th className="py-1 pr-2">Дата</th>
                <th className="py-1 pr-2">Описание</th>
                <th className="py-1 text-right">Сума</th>
              </tr>
            </thead>
            <tbody>
              {expenseRows.map((e) => (
                <tr key={e.id} className="border-b border-brand-100">
                  <td className="py-1.5 pr-2 tabular-nums">{e.date}</td>
                  <td className="py-1.5 pr-2">{e.description}</td>
                  <td className="py-1.5 text-right tabular-nums">{Number(e.amount).toFixed(2)} €</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ) : null}

      <p className="mt-10 text-xs leading-relaxed text-brand-700">
        Задължителна бележка за СУПТО: документът е само за вътрешна информация и не замества счетоводен одит, НСС или
        изисквания на НАП. Оборотът е от резервации със статус „completed“.
      </p>
    </div>
  );
}
