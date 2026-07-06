import assert from "node:assert/strict";
import test from "node:test";

import Stripe from "stripe";

import { POST } from "../app/api/webhooks/stripe/route";

// ---------------------------------------------------------------------------
// Плащания: guard-овете на Stripe webhook-а (одити 2026-07-06).
// Тестват се пътищата ПРЕДИ каквато и да е работа с базата:
//   – липсващ webhook secret → 500 (fail-closed, не обработва слепешком)
//   – липсващ/невалиден подпис → 400 (никаква обработка)
//   – валиден подпис → минава проверката (и спира чак на DB слоя)
// ---------------------------------------------------------------------------

const WEBHOOK_URL = "https://salonapp.pro/api/webhooks/stripe";
const TEST_SECRET = "whsec_unit_test_secret";

const ENV_KEYS = [
  "STRIPE_WEBHOOK_SECRET",
  "STRIPE_SECRET_KEY",
  "NEXT_PUBLIC_SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
] as const;

type EnvSnapshot = Partial<Record<(typeof ENV_KEYS)[number], string | undefined>>;

function snapshotEnv(): EnvSnapshot {
  const snap: EnvSnapshot = {};
  for (const k of ENV_KEYS) snap[k] = process.env[k];
  return snap;
}

function restoreEnv(snap: EnvSnapshot): void {
  for (const k of ENV_KEYS) {
    const v = snap[k];
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
}

function webhookRequest(body: string, signature?: string): Request {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (signature) headers["stripe-signature"] = signature;
  return new Request(WEBHOOK_URL, { method: "POST", headers, body });
}

const FAKE_EVENT_BODY = JSON.stringify({
  id: "evt_unit_test_000000000001",
  object: "event",
  type: "invoice.paid",
  data: { object: { customer: "cus_unit_test" } },
});

test("stripe webhook: липсващ STRIPE_WEBHOOK_SECRET → 500, нищо не се обработва", async () => {
  const snap = snapshotEnv();
  try {
    delete process.env.STRIPE_WEBHOOK_SECRET;
    const res = await POST(webhookRequest(FAKE_EVENT_BODY, "t=1,v1=deadbeef"));
    assert.equal(res.status, 500);
  } finally {
    restoreEnv(snap);
  }
});

test("stripe webhook: липсващ stripe-signature header → 400", async () => {
  const snap = snapshotEnv();
  try {
    process.env.STRIPE_WEBHOOK_SECRET = TEST_SECRET;
    process.env.STRIPE_SECRET_KEY = "sk_test_unit_dummy";
    const res = await POST(webhookRequest(FAKE_EVENT_BODY));
    assert.equal(res.status, 400);
    const json = (await res.json()) as { error?: string };
    assert.match(json.error ?? "", /signature/i);
  } finally {
    restoreEnv(snap);
  }
});

test("stripe webhook: невалиден подпис → 400 (събитието се отхвърля)", async () => {
  const snap = snapshotEnv();
  try {
    process.env.STRIPE_WEBHOOK_SECRET = TEST_SECRET;
    process.env.STRIPE_SECRET_KEY = "sk_test_unit_dummy";
    const res = await POST(
      webhookRequest(FAKE_EVENT_BODY, "t=12345,v1=0000000000000000000000000000000000000000000000000000000000000000")
    );
    assert.equal(res.status, 400);
  } finally {
    restoreEnv(snap);
  }
});

test("stripe webhook: подпис с ДРУГ secret → 400", async () => {
  const snap = snapshotEnv();
  try {
    process.env.STRIPE_WEBHOOK_SECRET = TEST_SECRET;
    process.env.STRIPE_SECRET_KEY = "sk_test_unit_dummy";
    const stripe = new Stripe("sk_test_unit_dummy", { apiVersion: "2026-03-25.dahlia" });
    const wrongSig = stripe.webhooks.generateTestHeaderString({
      payload: FAKE_EVENT_BODY,
      secret: "whsec_some_other_secret",
    });
    const res = await POST(webhookRequest(FAKE_EVENT_BODY, wrongSig));
    assert.equal(res.status, 400);
  } finally {
    restoreEnv(snap);
  }
});

test("stripe webhook: валиден подпис минава проверката и спира чак на DB слоя", async () => {
  const snap = snapshotEnv();
  try {
    process.env.STRIPE_WEBHOOK_SECRET = TEST_SECRET;
    process.env.STRIPE_SECRET_KEY = "sk_test_unit_dummy";
    // Изключваме Supabase env → claimEvent хвърля синхронно, БЕЗ мрежови заявки.
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;

    const stripe = new Stripe("sk_test_unit_dummy", { apiVersion: "2026-03-25.dahlia" });
    const validSig = stripe.webhooks.generateTestHeaderString({
      payload: FAKE_EVENT_BODY,
      secret: TEST_SECRET,
    });
    const res = await POST(webhookRequest(FAKE_EVENT_BODY, validSig));
    // НЕ 400: подписът е приет. 500 "Database error" е очакваният отказ на
    // idempotency слоя при липсваща база — Stripe ще retry-не.
    assert.equal(res.status, 500);
    const json = (await res.json()) as { error?: string };
    assert.match(json.error ?? "", /database/i);
  } finally {
    restoreEnv(snap);
  }
});

test("stripe webhook: подправено тяло след подписване → 400", async () => {
  const snap = snapshotEnv();
  try {
    process.env.STRIPE_WEBHOOK_SECRET = TEST_SECRET;
    process.env.STRIPE_SECRET_KEY = "sk_test_unit_dummy";
    const stripe = new Stripe("sk_test_unit_dummy", { apiVersion: "2026-03-25.dahlia" });
    const sig = stripe.webhooks.generateTestHeaderString({
      payload: FAKE_EVENT_BODY,
      secret: TEST_SECRET,
    });
    const tampered = FAKE_EVENT_BODY.replace("invoice.paid", "checkout.session.completed");
    const res = await POST(webhookRequest(tampered, sig));
    assert.equal(res.status, 400);
  } finally {
    restoreEnv(snap);
  }
});
