import type { Service } from "@/types";

const WEEKS_PER_MONTH = 52 / 12;
const VAT_RATE_BG = 0.2;

/** Средно работни дни в месеца по седмичен график. */
export function averageWorkingDaysPerMonth(workingDaysPerWeek: number): number {
  return workingDaysPerWeek * WEEKS_PER_MONTH;
}

/** Продуктивни минути на месец (MASTER: разходите се разпределят по време). */
export function productiveMinutesPerMonth(workingDaysPerWeek: number, workingHoursPerDay: number): number {
  const days = averageWorkingDaysPerMonth(workingDaysPerWeek);
  return Math.round(days * workingHoursPerDay * 60);
}

export function totalMonthlyOverheadEur(params: {
  rent_eur: number;
  electricity_eur: number;
  water_eur: number;
  accounting_eur: number;
  desired_salary: number;
  /** Други месечни разходи (прочие). */
  other_monthly_expenses: number;
}): number {
  return (
    Number(params.rent_eur) +
    Number(params.electricity_eur) +
    Number(params.water_eur) +
    Number(params.accounting_eur) +
    Number(params.desired_salary) +
    Number(params.other_monthly_expenses)
  );
}

export function costPerMinuteEur(totalMonthlyOverhead: number, productiveMinutes: number): number {
  if (productiveMinutes <= 0) return 0;
  return totalMonthlyOverhead / productiveMinutes;
}

/** Средна продължителност на услуга в минути (проста или средно на сложна). */
export function averageServiceDurationMinutes(service: Service): number {
  if (!service.is_complex) {
    return Math.max(1, service.duration_minutes ?? 1);
  }
  const mid = (a: number | null | undefined, b: number | null | undefined) =>
    ((Number(a) || 0) + (Number(b) || 0)) / 2;
  const aS = mid(service.active_start_min, service.active_start_max);
  const w = mid(service.waiting_min, service.waiting_max);
  const aF = mid(service.active_finish_min, service.active_finish_max);
  const total = aS + w + aF;
  return Math.max(1, Math.round(total));
}

/** Нетна цена при ДДС 20% (БГ). */
export function netPriceEur(grossEur: number, vatEnabled: boolean): number {
  if (!vatEnabled) return grossEur;
  return grossEur / (1 + VAT_RATE_BG);
}

export type AbcRow = {
  serviceId: string;
  name: string;
  durationMin: number;
  priceGrossEur: number;
  priceNetEur: number;
  costEur: number;
  profitEur: number;
  marginPercent: number;
  marginBand: "low" | "mid" | "high";
};

function marginBand(pct: number): "low" | "mid" | "high" {
  if (pct < 20) return "low";
  if (pct < 40) return "mid";
  return "high";
}

export function buildAbcRows(services: Service[], cpm: number, vatEnabled: boolean): AbcRow[] {
  const active = services.filter((s) => s.is_active);
  return active.map((s) => {
    const durationMin = averageServiceDurationMinutes(s);
    const priceGross = Number(s.price_eur);
    const priceNet = netPriceEur(priceGross, vatEnabled);
    const cost = durationMin * cpm;
    const profit = priceNet - cost;
    const marginPercent = priceNet > 0 ? (profit / priceNet) * 100 : 0;
    return {
      serviceId: s.id,
      name: s.name,
      durationMin,
      priceGrossEur: priceGross,
      priceNetEur: priceNet,
      costEur: cost,
      profitEur: profit,
      marginPercent,
      marginBand: marginBand(marginPercent),
    };
  });
}
