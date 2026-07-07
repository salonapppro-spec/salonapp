import { AsyncLocalStorage } from "node:async_hooks";
import assert from "node:assert/strict";
import test from "node:test";

// Next-ският unstable_cache очаква ALS полифил на globalThis (в Next runtime
// го слага сървърът; тук — ние, преди dynamic import-а на route-а).
(globalThis as { AsyncLocalStorage?: unknown }).AsyncLocalStorage ??= AsyncLocalStorage;

// ---------------------------------------------------------------------------
// Cron reminders: dedup + claim-преди-send (одит 2026-07-06, A1+A3).
// Supabase-js и Resend ползват global fetch → mock-ваме го и симулираме
// PostgREST отговори. Проверяват се трите критични пътя:
//   – грешка на dedup заявката → 500, НИЩО не се изпраща (fail closed)
//   – claim conflict (23505, паралелен run) → skip без изпращане
//   – провалено изпращане → claim-ът се освобождава (status='failed')
// ---------------------------------------------------------------------------

const CRON_SECRET = "unit-test-cron-secret";

process.env.NEXT_PUBLIC_SUPABASE_URL = "https://unit-test.supabase.co";
process.env.SUPABASE_SERVICE_ROLE_KEY = "unit-test-service-role-key";
process.env.CRON_SECRET = CRON_SECRET;
delete process.env.RESEND_API_KEY;
delete process.env.TWILIO_ACCOUNT_SID;

// getTenant() ползва next/cache unstable_cache — извън Next runtime той изисква
// incremental cache. Минимален no-op stub (нищо не се кешира, викаме си callback-а).
(globalThis as { __incrementalCache?: unknown }).__incrementalCache = {
  isOnDemandRevalidate: false,
  async generateCacheKey(key: string) {
    return key;
  },
  async get() {
    return null;
  },
  async set() {},
};

const BOOKING = {
  id: "6f9619ff-8b86-4d01-b42d-00cf4fc964ff",
  salon_slug: "unit-test-salon",
  client_name: "Тест Клиент",
  client_email: "client@example.com",
  client_phone: "+359888000000",
  service_name: "Тестова услуга",
  service_duration: 30,
  service_price_eur: 10,
  booking_date: "2099-01-01",
  booking_time: "10:00:00",
  status: "confirmed",
  confirmation_token: "tok",
  email_unsubscribed: false,
};

const TENANT = {
  salon_slug: "unit-test-salon",
  salon_name: "Unit Test Salon",
  status: "active",
  plan: "standard",
};

type FetchLogEntry = { method: string; url: string; body: string | null };

interface MockConfig {
  dedupSelect: { status: number; body: unknown };
  claimInsert: { status: number; body: unknown };
  /** Последователни отговори за api.resend.com; последният се повтаря. */
  resendResponses?: { status: number; body: unknown }[];
}

function installFetchMock(config: MockConfig): { log: FetchLogEntry[]; restore: () => void } {
  const original = globalThis.fetch;
  const log: FetchLogEntry[] = [];

  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    const method = (init?.method ?? (input instanceof Request ? input.method : "GET")).toUpperCase();
    const body =
      typeof init?.body === "string" ? init.body : input instanceof Request ? await input.clone().text() : null;
    log.push({ method, url, body });

    const json = (status: number, payload: unknown) =>
      new Response(JSON.stringify(payload), {
        status,
        headers: { "Content-Type": "application/json" },
      });

    if (url.includes("/rest/v1/bookings") && method === "GET") {
      return json(200, [BOOKING]);
    }
    if (url.includes("/rest/v1/tenants") && method === "GET") {
      return json(200, [TENANT]);
    }
    if (url.includes("/rest/v1/email_logs") && method === "GET") {
      return json(config.dedupSelect.status, config.dedupSelect.body);
    }
    if (url.includes("/rest/v1/email_logs") && method === "POST") {
      return json(config.claimInsert.status, config.claimInsert.body);
    }
    if (url.includes("/rest/v1/email_logs") && method === "PATCH") {
      return json(204, []);
    }
    if (url.includes("api.resend.com")) {
      const responses = config.resendResponses ?? [{ status: 200, body: { id: "email-id" } }];
      const idx = log.filter((e) => e.url.includes("api.resend.com")).length - 1;
      const r = responses[Math.min(idx, responses.length - 1)];
      return json(r.status, r.body);
    }
    return json(404, { message: `unmocked: ${method} ${url}` });
  }) as typeof fetch;

  return { log, restore: () => (globalThis.fetch = original) };
}

function cronRequest(): Request {
  return new Request("https://salonapp.pro/api/cron/reminders", {
    headers: { Authorization: `Bearer ${CRON_SECRET}` },
  });
}

async function loadRoute() {
  return import("../app/api/cron/reminders/route");
}

test("reminders: грешка на dedup заявката → 500, нищо не се изпраща (fail closed)", async () => {
  const mock = installFetchMock({
    dedupSelect: { status: 500, body: { message: "db down", code: "XX000" } },
    claimInsert: { status: 201, body: { id: "log-1" } },
  });
  try {
    const { GET } = await loadRoute();
    const res = await GET(cronRequest());
    assert.equal(res.status, 500);
    const payload = (await res.json()) as { ok: boolean; error?: string };
    assert.equal(payload.ok, false);
    assert.equal(payload.error, "dedup_query");
    // Никакви insert-и/имейли след грешката
    assert.ok(!mock.log.some((e) => e.method === "POST" && e.url.includes("email_logs")));
    assert.ok(!mock.log.some((e) => e.url.includes("api.resend.com")));
  } finally {
    mock.restore();
  }
});

test("reminders: claim conflict (23505 — паралелен run) → skip, без имейл и без failed", async () => {
  const mock = installFetchMock({
    dedupSelect: { status: 200, body: [] },
    claimInsert: {
      status: 409,
      body: { code: "23505", message: "duplicate key value violates unique constraint" },
    },
  });
  try {
    const { GET } = await loadRoute();
    const res = await GET(cronRequest());
    assert.equal(res.status, 200);
    const payload = (await res.json()) as { ok: boolean; processed: number; failed: number };
    assert.equal(payload.ok, true);
    assert.equal(payload.processed, 0);
    assert.equal(payload.failed, 0);
    assert.ok(!mock.log.some((e) => e.url.includes("api.resend.com")));
    assert.ok(!mock.log.some((e) => e.method === "PATCH" && e.url.includes("email_logs")));
  } finally {
    mock.restore();
  }
});

test("reminders: провалено изпращане → claim-ът се освобождава (PATCH status='failed')", async () => {
  // RESEND_API_KEY липсва → sendReminderEmail връща false → route-ът трябва
  // да върне claim-а към 'failed', за да опита следващият run.
  const mock = installFetchMock({
    dedupSelect: { status: 200, body: [] },
    claimInsert: { status: 201, body: { id: "log-claim-1" } },
  });
  try {
    const { GET } = await loadRoute();
    const res = await GET(cronRequest());
    assert.equal(res.status, 200);
    const payload = (await res.json()) as { ok: boolean; processed: number; failed: number };
    assert.equal(payload.processed, 0);
    assert.equal(payload.failed, 1);
    const patch = mock.log.find((e) => e.method === "PATCH" && e.url.includes("email_logs"));
    assert.ok(patch, "очаква се PATCH към email_logs за освобождаване на claim-а");
    assert.match(patch!.body ?? "", /failed/);
  } finally {
    mock.restore();
  }
});

test("reminders: Resend 5xx се повтаря (retry) и второто изпращане успява", async () => {
  process.env.RESEND_API_KEY = "unit-test-resend-key";
  const mock = installFetchMock({
    dedupSelect: { status: 200, body: [] },
    claimInsert: { status: 201, body: { id: "log-claim-1" } },
    resendResponses: [
      { status: 500, body: { message: "internal error" } },
      { status: 200, body: { id: "email-id" } },
    ],
  });
  try {
    const { GET } = await loadRoute();
    const res = await GET(cronRequest());
    assert.equal(res.status, 200);
    const payload = (await res.json()) as { ok: boolean; processed: number; failed: number };
    assert.equal(payload.processed, 1);
    assert.equal(payload.failed, 0);
    const resendCalls = mock.log.filter((e) => e.url.includes("api.resend.com"));
    assert.equal(resendCalls.length, 2, "очакват се 2 опита към Resend (retry след 5xx)");
    // Успешна доставка → claim-ът остава 'sent', не се освобождава
    assert.ok(!mock.log.some((e) => e.method === "PATCH" && e.url.includes("email_logs")));
  } finally {
    delete process.env.RESEND_API_KEY;
    mock.restore();
  }
});

test("reminders: без валиден CRON_SECRET → 401", async () => {
  const mock = installFetchMock({
    dedupSelect: { status: 200, body: [] },
    claimInsert: { status: 201, body: { id: "log-1" } },
  });
  try {
    const { GET } = await loadRoute();
    const res = await GET(new Request("https://salonapp.pro/api/cron/reminders"));
    assert.equal(res.status, 401);
    assert.equal(mock.log.length, 0);
  } finally {
    mock.restore();
  }
});
