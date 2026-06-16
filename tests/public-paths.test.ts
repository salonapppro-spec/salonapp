import assert from "node:assert/strict";
import test from "node:test";

import { isPlatformPathHost, tenantPublicPath } from "../lib/routing/public-paths";

test("isPlatformPathHost: apex and dev hosts use path routing", () => {
  assert.equal(isPlatformPathHost("salonapp.pro"), true);
  assert.equal(isPlatformPathHost("localhost:3000"), true);
  assert.equal(isPlatformPathHost("salonapp-ten.vercel.app"), true);
});

test("isPlatformPathHost: tenant subdomain uses flat paths", () => {
  assert.equal(isPlatformPathHost("thebeast.salonapp.pro"), false);
  assert.equal(isPlatformPathHost("paw-empire.salonapp.pro"), false);
});

test("tenantPublicPath: subdomain home and booking", () => {
  assert.equal(tenantPublicPath("thebeast", undefined, "thebeast.salonapp.pro"), "/");
  assert.equal(tenantPublicPath("thebeast", "booking", "thebeast.salonapp.pro"), "/booking");
});

test("tenantPublicPath: path routing includes slug", () => {
  assert.equal(tenantPublicPath("thebeast", undefined, "salonapp.pro"), "/thebeast");
  assert.equal(tenantPublicPath("thebeast", "booking", "localhost:3000"), "/thebeast/booking");
});
