import assert from "node:assert/strict";
import test from "node:test";

import { requiredEnv, requestJson } from "./helpers";

const tenantPublicBaseUrl = requiredEnv("INTEGRATION_PUBLIC_TENANT_BASE_URL");
const tenantBSlug = requiredEnv("INTEGRATION_TENANT_B_SLUG");
const testDate = requiredEnv("INTEGRATION_TEST_DATE");

function assertMismatchRejected(status: number, bodyText: string): void {
  assert.ok(
    status === 400 || status === 403,
    `Expected mismatch reject (400/403), got status=${status}, body=${bodyText.slice(0, 240)}`
  );
}

test("host-bound enforcement: services rejects host/slug mismatch", async () => {
  const res = await requestJson(`${tenantPublicBaseUrl}/api/services?salon_slug=${tenantBSlug}`);
  assertMismatchRejected(res.status, res.bodyText);
});

test("host-bound enforcement: availability rejects host/slug mismatch", async () => {
  const res = await requestJson(
    `${tenantPublicBaseUrl}/api/availability?salon_slug=${tenantBSlug}&date=${encodeURIComponent(testDate)}`
  );
  assertMismatchRejected(res.status, res.bodyText);
});

test("host-bound enforcement: bookings rejects host/slug mismatch", async () => {
  const res = await requestJson(`${tenantPublicBaseUrl}/api/bookings`, {
    method: "POST",
    body: {
      salon_slug: tenantBSlug,
      service_id: "00000000-0000-0000-0000-000000000000",
      booking_date: testDate,
      booking_time: "10:00",
      client_name: "Boundary Test",
      client_phone: "+359111111111",
    },
  });
  assertMismatchRejected(res.status, res.bodyText);
});

test("host-bound enforcement: clients lookup rejects host/slug mismatch", async () => {
  const res = await requestJson(
    `${tenantPublicBaseUrl}/api/clients/lookup?salon_slug=${encodeURIComponent(tenantBSlug)}&phone=${encodeURIComponent("+359111111111")}`
  );
  assertMismatchRejected(res.status, res.bodyText);
});

