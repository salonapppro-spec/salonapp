import type { Metadata } from "next";

import { GetStartedForm } from "@/components/marketing/GetStartedForm";
import { parsePlanId } from "@/lib/marketing-data";

export const metadata: Metadata = {
  title: "Заявка — SalonApp.pro",
  description: "Избор на план и контакт за стартиране на SalonApp.pro за вашия салон.",
  robots: { index: true, follow: true },
};

export default async function GetStartedPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string }>;
}) {
  const sp = await searchParams;
  const initialPlan = parsePlanId(sp.plan);

  return <GetStartedForm initialPlan={initialPlan} />;
}
