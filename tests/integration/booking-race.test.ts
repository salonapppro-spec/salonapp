import assert from "node:assert/strict";
import test from "node:test";

import { optionalEnv, requiredEnv, requestJson } from "./helpers";

// ---------------------------------------------------------------------------
// Race condition при паралелни резервации на един и същ час (одит 2026-07-06).
// Двете заявки минават app-level проверката едновременно; exclusion
// constraint-ът `bookings_no_overlap` трябва да пусне ТОЧНО една.
//
// Тестът ПИШЕ в базата (създава и после трие резервации + тестовия клиент),
// затова е opt-in:
//   INTEGRATION_ALLOW_BOOKING_WRITES=1
//   INTEGRATION_SUPABASE_URL + INTEGRATION_SUPABASE_SERVICE_ROLE_KEY (за cleanup)
// Пускай го срещу тестов тенант — създаването праща реален имейл до
// owner_email на салона (salon booking notification).
// ---------------------------------------------------------------------------

const writesAllowed = optionalEnv("INTEGRATION_ALLOW_BOOKING_WRITES") === "1";
const supabaseUrl = optionalEnv("INTEGRATION_SUPABASE_URL");
const serviceRoleKey =
  optionalEnv("INTEGRATION_SUPABASE_SERVICE_ROLE_KEY") ?? optionalEnv("SUPABASE_SERVICE_ROLE_KEY");

const enabled = writesAllowed && Boolean(supabaseUrl) && Boolean(serviceRoleKey);

const TEST_PHONE = "+359999000111";
const TEST_NAME = "INTEGRATION RACE TEST (safe to delete)";

async function serviceRoleFetch(pathAndQuery: string, init?: RequestInit): Promise<Response> {
  return fetch(`${supabaseUrl}/rest/v1/${pathAndQuery}`, {
    ...init,
    headers: {
      apikey: serviceRoleKey!,
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
}

async function cleanupTestRows(tenantSlug: string): Promise<void> {
  await serviceRoleFetch(
    `bookings?salon_slug=eq.${encodeURIComponent(tenantSlug)}&client_phone=eq.${encodeURIComponent(TEST_PHONE)}`,
    { method: "DELETE" }
  );
  await serviceRoleFetch(
    `clients?salon_slug=eq.${encodeURIComponent(tenantSlug)}&phone=eq.${encodeURIComponent(TEST_PHONE)}`,
    { method: "DELETE" }
  );
}

test(
  "bookings: два паралелни POST-а за един слот → точно една успешна резервация",
  { skip: enabled ? false : "Изисква INTEGRATION_ALLOW_BOOKING_WRITES=1 + Supabase service role env" },
  async () => {
    const publicTenantBaseUrl = requiredEnv("INTEGRATION_PUBLIC_TENANT_BASE_URL");
    const tenantASlug = requiredEnv("INTEGRATION_TENANT_A_SLUG");
    const testDate = requiredEnv("INTEGRATION_TEST_DATE");

    // Изчисти остатъци от предишен неуспешен run, за да не пречат на слота.
    await cleanupTestRows(tenantASlug);

    // 1. Реална проста услуга.
    const servicesRes = await requestJson(`${publicTenantBaseUrl}/api/services?salon_slug=${tenantASlug}`);
    assert.equal(servicesRes.status, 200, servicesRes.bodyText.slice(0, 240));
    const services =
      (servicesRes.json as { services?: Array<{ id: string; is_complex?: boolean }> } | null)?.services ?? [];
    const service = services.find((s) => !s.is_complex);
    assert.ok(service, "Тенант A няма проста активна услуга — race тестът не може да се изпълни");

    // 2. Реално свободен слот за тестовата дата (взимаме последния — най-малка
    //    вероятност реален клиент да го грабне по същото време).
    const availRes = await requestJson(
      `${publicTenantBaseUrl}/api/availability?salon_slug=${tenantASlug}&date=${testDate}&service_id=${service!.id}`
    );
    assert.equal(availRes.status, 200, availRes.bodyText.slice(0, 240));
    const slots = (availRes.json as { slots?: Array<{ time: string }> } | null)?.slots ?? [];
    assert.ok(slots.length > 0, `Няма свободни слотове на ${testDate} — смени INTEGRATION_TEST_DATE`);
    const slotTime = [...slots].map((s) => s.time).sort().at(-1)!;

    // 3. Два конкурентни POST-а за същия слот.
    const makeBooking = () =>
      requestJson(`${publicTenantBaseUrl}/api/bookings`, {
        method: "POST",
        body: {
          salon_slug: tenantASlug,
          service_id: service!.id,
          booking_date: testDate,
          booking_time: slotTime,
          client_name: TEST_NAME,
          client_phone: TEST_PHONE,
          // Задължителен в публичната схема; @no-email.salonapp.pro е
          // недоставим — потвърждението bounce-ва безвредно.
          client_email: "integration-test@no-email.salonapp.pro",
          notes: "integration booking-race test",
        },
      });

    try {
      const [r1, r2] = await Promise.all([makeBooking(), makeBooking()]);
      const results = [r1, r2];
      const successes = results.filter((r) => r.status === 200 && r.bodyText.includes('"success":true'));
      const conflicts = results.filter((r) => r.status === 409);

      assert.equal(
        successes.length,
        1,
        `Очаквана точно 1 успешна резервация, получени ${successes.length}. ` +
          `Отговори: [${r1.status}] ${r1.bodyText.slice(0, 120)} | [${r2.status}] ${r2.bodyText.slice(0, 120)}`
      );
      assert.equal(
        conflicts.length,
        1,
        `Очакван точно 1 конфликт (409) от exclusion constraint-а, получени ${conflicts.length}`
      );
    } finally {
      // 4. Cleanup — независимо от изхода.
      await cleanupTestRows(tenantASlug);
    }
  }
);

test(
  "bookings: повторен POST за същия слот СЛЕД успешна резервация → 409",
  { skip: enabled ? false : "Изисква INTEGRATION_ALLOW_BOOKING_WRITES=1 + Supabase service role env" },
  async () => {
    const publicTenantBaseUrl = requiredEnv("INTEGRATION_PUBLIC_TENANT_BASE_URL");
    const tenantASlug = requiredEnv("INTEGRATION_TENANT_A_SLUG");
    const testDate = requiredEnv("INTEGRATION_TEST_DATE");

    await cleanupTestRows(tenantASlug);

    const servicesRes = await requestJson(`${publicTenantBaseUrl}/api/services?salon_slug=${tenantASlug}`);
    const services =
      (servicesRes.json as { services?: Array<{ id: string; is_complex?: boolean }> } | null)?.services ?? [];
    const service = services.find((s) => !s.is_complex);
    assert.ok(service, "Тенант A няма проста активна услуга");

    const availRes = await requestJson(
      `${publicTenantBaseUrl}/api/availability?salon_slug=${tenantASlug}&date=${testDate}&service_id=${service!.id}`
    );
    const slots = (availRes.json as { slots?: Array<{ time: string }> } | null)?.slots ?? [];
    assert.ok(slots.length > 0, `Няма свободни слотове на ${testDate}`);
    const slotTime = [...slots].map((s) => s.time).sort().at(-1)!;

    const body = {
      salon_slug: tenantASlug,
      service_id: service!.id,
      booking_date: testDate,
      booking_time: slotTime,
      client_name: TEST_NAME,
      client_phone: TEST_PHONE,
      client_email: "integration-test@no-email.salonapp.pro",
      notes: "integration double-booking test",
    };

    try {
      const first = await requestJson(`${publicTenantBaseUrl}/api/bookings`, { method: "POST", body });
      assert.equal(first.status, 200, `Първата резервация трябва да мине: ${first.bodyText.slice(0, 240)}`);

      const second = await requestJson(`${publicTenantBaseUrl}/api/bookings`, { method: "POST", body });
      assert.equal(second.status, 409, `Втората резервация трябва да е 409: ${second.bodyText.slice(0, 240)}`);

      // И слотът вече не се предлага в availability.
      const availAfter = await requestJson(
        `${publicTenantBaseUrl}/api/availability?salon_slug=${tenantASlug}&date=${testDate}&service_id=${service!.id}`
      );
      const slotsAfter = (availAfter.json as { slots?: Array<{ time: string }> } | null)?.slots ?? [];
      assert.ok(
        !slotsAfter.some((s) => s.time === slotTime),
        `Слот ${slotTime} не бива да се предлага след успешна резервация`
      );
    } finally {
      await cleanupTestRows(tenantASlug);
    }
  }
);
