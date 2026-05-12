import type { PlanId } from "@/lib/marketing-data";

/** Optional Stripe Payment Links — set in env when live. Otherwise funnel uses /get-started. */
export function stripePaymentLinkForPlan(id: PlanId): string | undefined {
  const map: Record<PlanId, string | undefined> = {
    starter: process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK_STARTER,
    standard: process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK_STANDARD,
    pro: process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK_PRO,
    premium: process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK_PREMIUM,
  };
  const v = map[id]?.trim();
  return v || undefined;
}
