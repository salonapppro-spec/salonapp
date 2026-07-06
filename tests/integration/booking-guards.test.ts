import assert from "node:assert/strict";
import test from "node:test";

import { requiredEnv, requestJson } from "./helpers";

// ---------------------------------------------------------------------------
// Публичен booking API — guard-ове, които никога не бива да регресират
// (одити 2026-07-06). Никой от тези тестове НЕ създава реални резервации:
// всеки вход е проектиран да бъде отхвърлен на различен слой.
// Забележка: бизнес-отказите от runCreateBooking в момента се връщат като
// 500 (не 4xx), затова асертите проверяват "отказано + вярното съобщение",
// а не конкретния статус код.
// ---------------------------------------------------------------------------

const baseUrl = requiredEnv("INTEGRATION_BASE_URL");
const publicTenantBaseUrl = requiredEnv("INTEGRATION_PUBLIC_TENANT_BASE_URL");
const tenantASlug = requiredEnv("INTEGRATION_TENANT_A_SLUG");
const tenantBSlug = requiredEnv("INTEGRATION_TENANT_B_SLUG");
const testDate = requiredEnv("INTEGRATION_TEST_DATE");

// Валиден по формат UUID (v4), който не съществува в базата. Zod 4 проверява
// version/variant битовете — all-zero UUID пада още на схемата и тестът би
// спрял на грешния слой.
const FAKE_SERVICE_ID = "00000000-0000-4000-8000-000000000001";

function bookingBody(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    salon_slug: tenantASlug,
    service_id: FAKE_SERVICE_ID,
    booking_date: testDate,
    booking_time: "10:00",
    client_name: "Integration Guard Test",
    client_phone: "+359888123456",
    ...overrides,
  };
}

function assertRejected(res: { status: number; bodyText: string }, context: string): void {
  assert.ok(res.status >= 400, `${context}: очакван отказ, получен status=${res.status} body=${res.bodyText.slice(0, 240)}`);
  assert.ok(!res.bodyText.includes('"success":true'), `${context}: резервацията НЕ бива да се създава`);
}

test("bookings: заявка без tenant контекст → 400 Missing tenant context", async () => {
  // Без referer, без salon_slug в query → middleware не може да изведе slug.
  const res = await requestJson(`${baseUrl}/api/bookings`, {
    method: "POST",
    body: bookingBody(),
  });
  assert.equal(res.status, 400, res.bodyText.slice(0, 240));
  assert.ok(res.bodyText.includes("Missing tenant context"), res.bodyText.slice(0, 240));
});

test("bookings: claimed slug ≠ header slug → 403 Tenant mismatch (anti-spoofing)", async () => {
  // Заявка от subdomain-а на салон А, но тялото претендира за салон Б.
  const res = await requestJson(`${publicTenantBaseUrl}/api/bookings`, {
    method: "POST",
    body: bookingBody({ salon_slug: tenantBSlug }),
  });
  assert.equal(res.status, 403, res.bodyText.slice(0, 240));
  assert.ok(res.bodyText.includes("Tenant mismatch"), res.bodyText.slice(0, 240));
});

test("bookings: телефон без 5 цифри се отхвърля (защита срещу фантомния клиент '00000')", async () => {
  const res = await requestJson(`${publicTenantBaseUrl}/api/bookings`, {
    method: "POST",
    body: bookingBody({ client_phone: "+()[] - ()" }),
  });
  assertRejected(res, "phone digit guard");
  assert.ok(res.bodyText.includes("Невалиден телефон"), res.bodyText.slice(0, 240));
});

test("bookings: невалиден JSON → 400, не 500", async () => {
  const res = await fetch(`${publicTenantBaseUrl}/api/bookings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{not json",
  });
  const text = await res.text();
  assert.equal(res.status, 400, text.slice(0, 240));
});

test("bookings: минала дата се отхвърля", async () => {
  const res = await requestJson(`${publicTenantBaseUrl}/api/bookings`, {
    method: "POST",
    body: bookingBody({ booking_date: "2020-01-01" }),
  });
  assertRejected(res, "past date guard");
});

test("bookings: несъществуваща услуга се отхвърля", async () => {
  const res = await requestJson(`${publicTenantBaseUrl}/api/bookings`, {
    method: "POST",
    body: bookingBody({ service_id: FAKE_SERVICE_ID }),
  });
  assertRejected(res, "unknown service guard");
});

test("bookings: непознат salon_slug → 404/403, без утечка на данни", async () => {
  const ghost = "ghost-salon-integration-test";
  const res = await requestJson(`${baseUrl}/api/bookings?salon_slug=${ghost}`, {
    method: "POST",
    headers: { Referer: `${baseUrl}/${ghost}/` },
    body: bookingBody({ salon_slug: ghost }),
  });
  assert.ok(
    res.status === 403 || res.status === 404,
    `Очакван 403/404 за несъществуващ салон, получен ${res.status}: ${res.bodyText.slice(0, 240)}`
  );
});

// ---------------------------------------------------------------------------
// Availability (календар) — консистентност на публичния изглед.
// ---------------------------------------------------------------------------

test("availability: невалидни query параметри → 400", async () => {
  const res = await requestJson(
    `${publicTenantBaseUrl}/api/availability?salon_slug=${tenantASlug}&date=${testDate}&service_id=not-a-uuid`
  );
  assert.equal(res.status, 400, res.bodyText.slice(0, 240));
});

test("availability: несъществуваща услуга → 404", async () => {
  const res = await requestJson(
    `${publicTenantBaseUrl}/api/availability?salon_slug=${tenantASlug}&date=${testDate}&service_id=${FAKE_SERVICE_ID}`
  );
  assert.equal(res.status, 404, res.bodyText.slice(0, 240));
});

test("availability: реална услуга връща валидни, ненастъпващи се слотове", async () => {
  // Взимаме реална услуга през публичния services API (read-only).
  const servicesRes = await requestJson(`${publicTenantBaseUrl}/api/services?salon_slug=${tenantASlug}`);
  assert.equal(servicesRes.status, 200, servicesRes.bodyText.slice(0, 240));
  const services = (servicesRes.json as { services?: Array<{ id: string; is_complex?: boolean }> } | null)?.services ?? [];
  const simple = services.find((s) => !s.is_complex);
  if (!simple) {
    // Салонът няма проста активна услуга — няма как да проверим слотовете.
    return;
  }

  const res = await requestJson(
    `${publicTenantBaseUrl}/api/availability?salon_slug=${tenantASlug}&date=${testDate}&service_id=${simple.id}`
  );
  assert.equal(res.status, 200, res.bodyText.slice(0, 240));
  const slots = (res.json as { slots?: Array<{ time: string; endTime: string }> } | null)?.slots;
  assert.ok(Array.isArray(slots), "Очакван { slots: [] } payload");

  const seen = new Set<string>();
  for (const s of slots!) {
    assert.match(s.time, /^\d{2}:\d{2}$/, `Невалиден формат на слот: ${s.time}`);
    assert.ok(!seen.has(s.time), `Дублиран слот ${s.time}`);
    seen.add(s.time);
  }
});

test("availability: сложна услуга без hair параметри връща празни слотове (не грешка)", async () => {
  const servicesRes = await requestJson(`${publicTenantBaseUrl}/api/services?salon_slug=${tenantASlug}`);
  const services = (servicesRes.json as { services?: Array<{ id: string; is_complex?: boolean }> } | null)?.services ?? [];
  const complex = services.find((s) => s.is_complex);
  if (!complex) return; // няма сложна услуга при този тенант

  const res = await requestJson(
    `${publicTenantBaseUrl}/api/availability?salon_slug=${tenantASlug}&date=${testDate}&service_id=${complex.id}`
  );
  assert.equal(res.status, 200, res.bodyText.slice(0, 240));
  const slots = (res.json as { slots?: unknown[] } | null)?.slots;
  assert.deepEqual(slots, []);
});
