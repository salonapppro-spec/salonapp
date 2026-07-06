import assert from "node:assert/strict";
import test from "node:test";

import { requiredEnv, requestJson } from "./helpers";

// ---------------------------------------------------------------------------
// Плащания: живият Stripe webhook endpoint трябва да отхвърля всичко без
// валиден подпис (security одит 2026-07-06 — потвърдено добро, пазим го).
// Никоя от заявките тук не може да задейства обработка на събитие.
// ---------------------------------------------------------------------------

const baseUrl = requiredEnv("INTEGRATION_BASE_URL");
const webhookUrl = `${baseUrl}/api/webhooks/stripe`;

const FAKE_EVENT = {
  id: "evt_integration_fake",
  object: "event",
  type: "invoice.paid",
  data: { object: { customer: "cus_fake" } },
};

test("stripe webhook (live): POST без подпис → 400", async () => {
  const res = await requestJson(webhookUrl, { method: "POST", body: FAKE_EVENT });
  assert.equal(res.status, 400, res.bodyText.slice(0, 240));
});

test("stripe webhook (live): POST с фалшив подпис → 400", async () => {
  const res = await requestJson(webhookUrl, {
    method: "POST",
    headers: {
      "stripe-signature":
        "t=1234567890,v1=0000000000000000000000000000000000000000000000000000000000000000",
    },
    body: FAKE_EVENT,
  });
  assert.equal(res.status, 400, res.bodyText.slice(0, 240));
});

test("stripe webhook (live): GET не е позволен", async () => {
  const res = await fetch(webhookUrl, { method: "GET" });
  assert.ok(
    res.status === 405 || res.status === 404,
    `Очакван 405/404 за GET на webhook-а, получен ${res.status}`
  );
});
