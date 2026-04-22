"use client";

import * as Sentry from "@sentry/nextjs";
import NextError from "next/error";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="bg">
      <body>
        <NextError statusCode={0} />
        <button onClick={reset} style={{ position: "fixed", bottom: 16, right: 16, padding: "8px 16px" }}>
          Опитай отново
        </button>
      </body>
    </html>
  );
}
