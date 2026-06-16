import assert from "node:assert/strict";
import test from "node:test";

import { requireTenantFromHeaders } from "../lib/tenant-request";

function req(url: string, headers: Record<string, string> = {}): Request {
  return new Request(url, { headers: new Headers(headers) });
}

test("requireTenantFromHeaders rejects missing x-salon-slug", () => {
  const result = requireTenantFromHeaders(req("https://salonapp.pro/api/services"), {
    claimedSlug: "paw-empire",
    path: "/api/services",
  });
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.response.status, 400);
});

test("requireTenantFromHeaders rejects slug mismatch", () => {
  const result = requireTenantFromHeaders(
    req("https://salonapp.pro/api/services", { "x-salon-slug": "paw-empire" }),
    { claimedSlug: "magnetic-eyes", path: "/api/services" }
  );
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.response.status, 403);
});

test("requireTenantFromHeaders accepts matching slug", () => {
  const result = requireTenantFromHeaders(
    req("https://salonapp.pro/api/services", { "x-salon-slug": "paw-empire" }),
    { claimedSlug: "paw-empire", path: "/api/services" }
  );
  assert.equal(result.ok, true);
  if (result.ok) assert.equal(result.salonSlug, "paw-empire");
});
