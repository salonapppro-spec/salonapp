import * as Sentry from "@sentry/nextjs";

function sentryDsn(): string | undefined {
  return process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN;
}

function commonOptions() {
  return {
    dsn: sentryDsn(),
    environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "development",
    tracesSampleRate: 0.1,
  };
}

export async function register() {
  const runtime = process.env.NEXT_RUNTIME;
  if (runtime === "nodejs") {
    Sentry.init(commonOptions());
    return;
  }
  if (runtime === "edge") {
    Sentry.init(commonOptions());
  }
}

export const onRequestError = Sentry.captureRequestError;
