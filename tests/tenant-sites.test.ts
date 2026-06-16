import assert from "node:assert/strict";
import test from "node:test";

import { hasTenantSite, TENANT_SITE_SLUGS } from "../lib/tenant-site-slugs";

test("tenant site slug registry includes euphoria", () => {
  assert.ok(hasTenantSite("euphoria"));
});

test("tenant site slug registry rejects unknown slug", () => {
  assert.equal(hasTenantSite("not-a-real-salon-slug"), false);
});

test("every registered slug passes hasTenantSite", () => {
  for (const slug of TENANT_SITE_SLUGS) {
    assert.ok(hasTenantSite(slug));
  }
});
