import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Временно недостъпно — SalonApp.pro",
  robots: { index: false, follow: false },
};

export default function TemporarilyUnavailablePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-brand-50 px-4 text-center text-brand-900">
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Временно недостъпно</h1>
      <p className="mt-4 max-w-md text-pretty text-sm leading-relaxed text-brand-800/90 sm:text-base">
        Този салон не е активен в момента. Моля, опитайте по-късно или се свържете директно с него.
      </p>
      <Link
        href="https://salonapp.pro"
        className="mt-8 inline-flex min-h-[44px] items-center justify-center rounded-2xl bg-brand-600 px-6 text-sm font-semibold text-white transition hover:bg-brand-700"
      >
        Към SalonApp.pro
      </Link>
    </div>
  );
}
