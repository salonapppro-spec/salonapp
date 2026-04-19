"use client";

export function FinancePrintActions() {
  return (
    <button type="button" className="btn-admin-primary print:hidden" onClick={() => window.print()}>
      Изтегли PDF
    </button>
  );
}
