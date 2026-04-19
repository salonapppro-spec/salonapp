import Link from "next/link";

export function FinanceReportsSection(props: { year: number; month: number }) {
  const { year, month } = props;
  const qsMonth = `y=${year}&m=${month}`;
  const qsYear = `y=${year}`;

  return (
    <section className="admin-card space-y-3">
      <h2 className="text-lg font-semibold tracking-tight text-brand-900">Отчети</h2>
      <p className="text-sm text-brand-800/85">
        Налично за планове Pro, Premium и Колектив. Отворете отчета и използвайте &quot;Изтегли PDF&quot; (печат към PDF в
        браузъра).
      </p>
      <div className="flex flex-wrap gap-3">
        <Link className="btn-admin-primary inline-flex items-center justify-center no-underline" href={`/admin/finances/print?${qsMonth}`}>
          Месечен отчет
        </Link>
        <Link className="btn-admin-secondary inline-flex items-center justify-center no-underline" href={`/admin/finances/print?${qsYear}`}>
          Годишен отчет
        </Link>
      </div>
    </section>
  );
}
