import type { Metadata } from "next";
import { GetStartedForm } from "@/components/marketing/GetStartedForm";

export const metadata: Metadata = {
  title: "Безплатна консултация и сайт — SalonApp.pro",
  description: "Заяви безплатен месец и личен сайт за твоя салон. Ние настройваме всичко вместо теб за 24 часа.",
  robots: { index: true, follow: true },
};

export default function GetStartedPage() {
  return <GetStartedForm />;
}
