import test from "node:test";

import { assertDeniedOrEmpty, buildAuthHeaders, requiredEnv, requestJson } from "./helpers";

const baseUrl = requiredEnv("INTEGRATION_BASE_URL");
const tenantBSalonSlug = requiredEnv("INTEGRATION_TENANT_B_SLUG");
const tenantBClientId = requiredEnv("INTEGRATION_TENANT_B_CLIENT_ID");
const tenantBBookingId = requiredEnv("INTEGRATION_TENANT_B_BOOKING_ID");

const tenantAAuth = buildAuthHeaders("INTEGRATION_TENANT_A");

test("tenant API isolation: tenant A cannot read tenant B client", async () => {
  const url = `${baseUrl}/api/admin/clients/${tenantBClientId}`;
  const res = await requestJson(url, { headers: tenantAAuth });
  assertDeniedOrEmpty(res.status, res.bodyText);
});

test("tenant API isolation: tenant A cannot update tenant B booking", async () => {
  const url = `${baseUrl}/api/admin/bookings/${tenantBBookingId}`;
  const res = await requestJson(url, {
    method: "PATCH",
    headers: tenantAAuth,
    body: { status: "cancelled", salon_slug: tenantBSalonSlug },
  });
  assertDeniedOrEmpty(res.status, res.bodyText);
});

test("tenant API isolation: tenant A cannot delete tenant B client", async () => {
  const url = `${baseUrl}/api/admin/clients/${tenantBClientId}`;
  const res = await requestJson(url, { method: "DELETE", headers: tenantAAuth });
  assertDeniedOrEmpty(res.status, res.bodyText);
});

