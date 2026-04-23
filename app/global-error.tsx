"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError(props: { error: Error & { digest?: string }; reset: () => void }) {
  const { error, reset } = props;

  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="bg">
      <body className="min-h-screen bg-[#FAF7F2] text-[#1A1A1A]">
        <main className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center px-6 text-center">
          <h1 className="text-2xl font-bold">Нещо се обърка</h1>
          <p className="mt-3 text-sm text-[#1A1A1A]/70">
            Възникна неочаквана грешка. Екипът е уведомен и работим по проблема.
          </p>
          <button
            type="button"
            className="mt-6 rounded-lg bg-[#1A1A1A] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
            onClick={() => reset()}
          >
            Опитай отново
          </button>
        </main>
      </body>
    </html>
  );
}
