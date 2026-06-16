import assert from "node:assert/strict";
import test from "node:test";

import { requiredEnv, requestJson } from "./helpers";

const baseUrl = requiredEnv("INTEGRATION_BASE_URL");

test("cron reminders returns 401 without CRON_SECRET", async () => {
  const res = await requestJson(`${baseUrl}/api/cron/reminders`);
  assert.equal(res.status, 401, res.bodyText.slice(0, 240));
});

test("cron billing-expiry returns 401 without CRON_SECRET", async () => {
  const res = await requestJson(`${baseUrl}/api/cron/billing-expiry`);
  assert.equal(res.status, 401, res.bodyText.slice(0, 240));
});
