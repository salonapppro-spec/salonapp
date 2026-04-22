/**
 * Minimal structured logs for abuse/health signals (Sentry / log drains can match `t: "salonapp_abuse"` in Етап 6).
 */
export function logAbuseEvent(event: {
  kind: "rate_limited" | "client_error" | "server_error";
  path: string;
  method: string;
  status?: number;
  ip: string;
  key?: string;
  detail?: string;
}): void {
  if (process.env.NODE_ENV === "test") return;
  console.log(
    JSON.stringify({
      t: "salonapp_abuse",
      at: new Date().toISOString(),
      service: "salonapp",
      ...event,
    })
  );
}
