import type { PlanId } from "@/lib/marketing-data";

/** Официални ориентировъчни цени от MASTER; env ги презаписва при нужда. */
const DEFAULT_PLAN_PRICE_EUR: Record<PlanId, number> = {
  starter: 15,
  standard: 19,
  pro: 29,
  premium: 49,
};

/** Публични суми за лендинга — без тайни. `NEXT_PUBLIC_PLAN_PRICE_*` презаписва дефолта. */
export function readPublicPlanPriceMonthly(planId: PlanId): number {
  const key: Record<PlanId, string | undefined> = {
    starter: process.env.NEXT_PUBLIC_PLAN_PRICE_STARTER,
    standard: process.env.NEXT_PUBLIC_PLAN_PRICE_STANDARD,
    pro: process.env.NEXT_PUBLIC_PLAN_PRICE_PRO,
    premium: process.env.NEXT_PUBLIC_PLAN_PRICE_PREMIUM,
  };
  const raw = key[planId]?.trim();
  if (raw) {
    const normalized = raw.replace(",", ".");
    const n = Number(normalized);
    if (Number.isFinite(n) && n >= 0) return n;
  }
  return DEFAULT_PLAN_PRICE_EUR[planId];
}


/** Напр. €, лв., BGN — показва се до числото. */
export function readPublicPlanPriceCurrency(): string {
  return (process.env.NEXT_PUBLIC_PLAN_PRICE_CURRENCY ?? "€").trim() || "€";
}
