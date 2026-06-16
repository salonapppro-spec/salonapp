import assert from "node:assert/strict";
import test from "node:test";

import { requiredEnv, requestJson } from "./helpers";

const baseUrl = requiredEnv("INTEGRATION_BASE_URL");
const tenantASlug = requiredEnv("INTEGRATION_TENANT_A_SLUG");
const testDate = requiredEnv("INTEGRATION_TEST_DATE");

test("root domain: POST /api/bookings resolves tenant from query + referer (not Missing tenant context)", async () => {
  const referer = `${baseUrl}/${tenantASlug}/`;
  const res = await requestJson(`${baseUrl}/api/bookings?salon_slug=${encodeURIComponent(tenantASlug)}`, {
    method: "POST",
    headers: { Referer: referer },
    body: {
      salon_slug: tenantASlug,
      service_id: "00000000-0000-0000-0000-000000000001",
      booking_date: testDate,
      booking_time: "10:00",
      client_name: "Integration Root Domain",
      client_phone: "+359888123456",
    },
  });

  assert.ok(
    !res.bodyText.includes("Missing tenant context"),
    `Expected tenant context on root domain POST, got: ${res.bodyText.slice(0, 240)}`
  );
  assert.ok(
    res.status === 400 || res.status === 404 || res.status === 422,
    `Expected validation/service error after tenant bind, got status=${res.status}`
  );
});

test("root domain: GET /api/services with referer returns tenant-scoped data", async () => {
  const referer = `${baseUrl}/${tenantASlug}/`;
  const res = await requestJson(
    `${baseUrl}/api/services?salon_slug=${encodeURIComponent(tenantASlug)}`,
    { headers: { Referer: referer } }
  );
  assert.equal(res.status, 200, res.bodyText.slice(0, 240));
  assert.ok(Array.isArray(res.json), "Expected services array");
});
