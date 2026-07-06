import assert from "node:assert/strict";
import test from "node:test";

import { requiredEnv, requestJson } from "./helpers";

// ---------------------------------------------------------------------------
// Auth guard-ове по периметъра (одити 2026-07-06). Допълва
// admin-boundary-protection / tenant-api-isolation / cron-auth с:
//   – неавтентикирани заявки към admin API-та
//   – ГРЕШЕН (не липсващ) cron secret
//   – booking token endpoint-и (confirm/cancel/unsubscribe) с невалидни данни
// Никой тест не променя данни — всичко трябва да бъде отхвърлено.
// ---------------------------------------------------------------------------

const baseUrl = requiredEnv("INTEGRATION_BASE_URL");
const tenantASlug = requiredEnv("INTEGRATION_TENANT_A_SLUG");

const FAKE_UUID = "00000000-0000-0000-0000-00000000dead";

// ── Admin API: без сесия ─────────────────────────────────────────────────────

const ADMIN_ENDPOINTS: Array<{ method: "GET" | "POST" | "PATCH" | "DELETE"; path: string; body?: unknown }> = [
  { method: "POST", path: "/api/admin/clients", body: {} },
  { method: "GET", path: `/api/admin/blocked-slots?date=2026-12-01` },
  { method: "POST", path: "/api/admin/blocked-slots", body: { blocked_date: "2026-12-01", start_time: "10:00", end_time: "11:00" } },
  { method: "PATCH", path: `/api/admin/bookings/${FAKE_UUID}`, body: { status: "cancelled" } },
  { method: "DELETE", path: `/api/admin/bookings/${FAKE_UUID}` },
  { method: "GET", path: "/api/admin/services" },
  { method: "GET", path: "/api/admin/working-hours" },
  { method: "POST", path: "/api/admin/settings", body: {} },
];

for (const ep of ADMIN_ENDPOINTS) {
  test(`admin auth: ${ep.method} ${ep.path} без сесия → 401`, async () => {
    const res = await requestJson(`${baseUrl}${ep.path}`, {
      method: ep.method,
      body: ep.body,
    });
    assert.ok(
      res.status === 401 || res.status === 403,
      `Очакван 401/403 без сесия, получен ${res.status}: ${res.bodyText.slice(0, 240)}`
    );
  });
}

test("super-admin auth: POST /api/super-admin/tenants без сесия се отхвърля", async () => {
  const res = await requestJson(`${baseUrl}/api/super-admin/tenants`, { method: "POST", body: {} });
  assert.ok(
    res.status === 401 || res.status === 403,
    `Очакван отказ, получен ${res.status}: ${res.bodyText.slice(0, 240)}`
  );
  assert.ok(!res.bodyText.includes('"salon_slug"'), "Данни за тенанти не бива да изтичат без auth");
});

// ── Cron: грешен secret (cron-auth.test.ts покрива липсващия) ────────────────

for (const path of ["/api/cron/reminders", "/api/cron/billing-expiry"]) {
  test(`cron auth: ${path} с ГРЕШЕН Bearer → 401`, async () => {
    const res = await requestJson(`${baseUrl}${path}`, {
      headers: { Authorization: "Bearer wrong-secret-integration-test" },
    });
    assert.equal(res.status, 401, res.bodyText.slice(0, 240));
  });
}

// ── Booking token действия (confirm / cancel / unsubscribe) ─────────────────

test("confirm token: несъществуващ токен → 404, без промяна", async () => {
  const res = await fetch(`${baseUrl}/api/confirm/${FAKE_UUID}?salon=${tenantASlug}`);
  assert.equal(res.status, 404);
});

test("confirm token: липсващ salon параметър → 400", async () => {
  const res = await fetch(`${baseUrl}/api/confirm/${FAKE_UUID}`);
  assert.equal(res.status, 400);
});

test("cancel token: несъществуващ токен → 404, без промяна", async () => {
  const res = await fetch(`${baseUrl}/api/cancel/${FAKE_UUID}?salon=${tenantASlug}`);
  assert.equal(res.status, 404);
});

test("cancel token: POST с несъществуващ токен → 404 (нищо не се отменя)", async () => {
  const res = await fetch(`${baseUrl}/api/cancel/${FAKE_UUID}?salon=${tenantASlug}`, { method: "POST" });
  assert.equal(res.status, 404);
});

test("unsubscribe: липсващи параметри → 400", async () => {
  const res = await fetch(`${baseUrl}/api/unsubscribe`);
  assert.equal(res.status, 400);
});

test("unsubscribe: фалшив booking/token → 404 (не отписва никого)", async () => {
  const res = await fetch(
    `${baseUrl}/api/unsubscribe?salon=${tenantASlug}&booking=${FAKE_UUID}&token=${FAKE_UUID}`
  );
  assert.equal(res.status, 404);
});

test("confirm token: токен от салон А не работи с параметър salon=Б (tenant scoping)", async () => {
  const tenantBSlug = requiredEnv("INTEGRATION_TENANT_B_SLUG");
  // Токенът е фалшив и в двата случая, но проверката е, че slug-ът участва
  // в заявката: грешен slug никога не бива да върне 200/страница за действие.
  const res = await fetch(`${baseUrl}/api/confirm/${FAKE_UUID}?salon=${tenantBSlug}`);
  assert.equal(res.status, 404);
});
