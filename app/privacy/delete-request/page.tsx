import type { Metadata } from "next";

import { DeleteRequestForm } from "@/components/gdpr/DeleteRequestForm";

export const metadata: Metadata = {
  title: "Заявка за изтриване на данни — SalonApp.pro",
  robots: { index: false, follow: false },
};

export default function DeleteRequestPage() {
  return (
    <main className="mx-auto max-w-lg px-6 py-16 text-[#1A1A1A]">
      <h1 className="mb-2 text-2xl font-bold">Заявка за изтриване на лични данни</h1>
      <p className="mb-8 text-sm text-neutral-500">
        Съгласно чл. 17 от ОРЗД имате право да поискате изтриване на личните ви данни. Попълнете
        формата по-долу и ще отговорим в срок до 30 дни.
      </p>
      <DeleteRequestForm />
    </main>
  );
}
