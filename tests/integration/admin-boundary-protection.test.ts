import assert from "node:assert/strict";
import test from "node:test";

import { buildAuthHeaders, requiredEnv, requestJson } from "./helpers";

const baseUrl = requiredEnv("INTEGRATION_BASE_URL");
const tenantAAuth = buildAuthHeaders("INTEGRATION_TENANT_A");

test("admin boundary: tenant admin cannot open /super-admin page", async () => {
  const res = await fetch(`${baseUrl}/super-admin`, {
    method: "GET",
    headers: tenantAAuth,
    redirect: "manual",
  });

  assert.ok(
    res.status === 401 || res.status === 403 || res.status === 302 || res.status === 307,
    `Expected unauthorized or redirect for /super-admin, got ${res.status}`
  );
});

test("admin boundary: tenant admin cannot call super-admin tenants API", async () => {
  const res = await requestJson(`${baseUrl}/api/super-admin/tenants`, { headers: tenantAAuth });
  assert.ok(
    res.status === 401 || res.status === 403,
    `Expected 401/403 for super-admin API, got status=${res.status}, body=${res.bodyText.slice(0, 240)}`
  );
});

