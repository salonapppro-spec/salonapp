import assert from "node:assert/strict";
import test from "node:test";

import { buildAuthHeaders, requiredEnv, requestJson } from "./helpers";

const baseUrl = requiredEnv("INTEGRATION_BASE_URL");
const tenantBSlug = requiredEnv("INTEGRATION_TENANT_B_SLUG");
const tenantBClientId = requiredEnv("INTEGRATION_TENANT_B_CLIENT_ID");
const tenantAAuth = buildAuthHeaders("INTEGRATION_TENANT_A");

test("export leakage: tenant A clients export does not include tenant B client id", async () => {
  const bClientRes = await requestJson(`${baseUrl}/api/admin/clients/${tenantBClientId}`, {
    headers: tenantAAuth,
  });
  assert.ok(
    bClientRes.status === 401 || bClientRes.status === 403 || bClientRes.status === 404,
    `Tenant A must not read tenant B client directly (status=${bClientRes.status})`
  );

  const exportRes = await requestJson(`${baseUrl}/api/admin/clients/export`, {
    headers: tenantAAuth,
  });
  assert.equal(exportRes.status, 200, exportRes.bodyText.slice(0, 240));
  assert.ok(
    !exportRes.bodyText.includes(tenantBClientId),
    "Tenant A CSV export must not contain tenant B client id"
  );
  assert.ok(
    !exportRes.bodyText.includes(tenantBSlug),
    "Tenant A CSV export must not reference tenant B slug"
  );
});
