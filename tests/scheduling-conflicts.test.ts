import assert from "node:assert/strict";
import test from "node:test";

import { generateSlots, generateParallelSlots, timeToMinutes } from "../lib/scheduling";
import type { Plan } from "../types";

// ---------------------------------------------------------------------------
// Регресионни тестове за конфликтната логика на календара (одит 2026-07-06).
// Допълват tests/scheduling.test.ts с точно случаите, в които availability и
// create-проверката могат да се разминат.
// ---------------------------------------------------------------------------

const NO_BLOCKED: Array<{ start_time: string; end_time: string }> = [];

function slotTimes(slots: Array<{ time: string }>): string[] {
  return slots.map((s) => s.time).sort();
}

// Одит B1: bookingBusyRange предпочита записания booking_end_time пред
// duration + текущия buffer. Availability ползва точно това — ако някой
// "опрости" fallback-а, резервации с ръчно удължен/стар end ще изглеждат
// по-къси, отколкото са в exclusion constraint-а.
test("generateSlots: записаният booking_end_time има превес над duration+buffer", () => {
  // Резервация 10:00, duration 30, buffer 10 → изчислен край 10:40.
  // Но записаният booking_end_time е 12:00 (напр. създадена при по-голям buffer).
  const slots = generateSlots({
    workStart: "09:00",
    workEnd: "14:00",
    existingBookings: [
      { booking_time: "10:00", service_duration: 30, booking_end_time: "12:00", status: "pending" },
    ],
    blockedSlots: NO_BLOCKED,
    serviceDuration: 30,
    bufferMinutes: 10,
    slotInterval: 15,
    magneticEnabled: false,
  });
  const times = slotTimes(slots);
  // Никой слот не бива да започва в [10:00, 12:00) заетостта.
  for (const t of times) {
    const min = timeToMinutes(t);
    const occEnd = min + 30 + 10;
    assert.ok(
      occEnd <= timeToMinutes("10:00") || min >= timeToMinutes("12:00"),
      `Слот ${t} се застъпва със заетостта до записания end 12:00`
    );
  }
  // 12:00 е валидно начало (веднага след записания край).
  assert.ok(times.includes("12:00"), `Очакван слот 12:00, получено: ${times.join(",")}`);
});

test("generateSlots: без booking_end_time fallback-ът е duration + buffer", () => {
  const slots = generateSlots({
    workStart: "09:00",
    workEnd: "12:00",
    existingBookings: [{ booking_time: "10:00", service_duration: 30, status: "confirmed" }],
    blockedSlots: NO_BLOCKED,
    serviceDuration: 30,
    bufferMinutes: 10,
    slotInterval: 5,
    magneticEnabled: false,
  });
  const times = slotTimes(slots);
  // Заетост 10:00–10:40 → първият възможен старт след нея е 10:40.
  assert.ok(times.includes("10:40"), `Очакван слот 10:40, получено: ${times.join(",")}`);
  assert.ok(!times.includes("10:35"), "10:35 попада в buffer-а и не бива да е свободен");
});

test("generateSlots: застъпващи се резервации се сливат в един зает интервал", () => {
  const slots = generateSlots({
    workStart: "09:00",
    workEnd: "13:00",
    existingBookings: [
      { booking_time: "10:00", service_duration: 60, booking_end_time: "11:00", status: "pending" },
      { booking_time: "10:30", service_duration: 60, booking_end_time: "11:30", status: "confirmed" },
    ],
    blockedSlots: NO_BLOCKED,
    serviceDuration: 30,
    bufferMinutes: 0,
    slotInterval: 15,
    magneticEnabled: false,
  });
  const times = slotTimes(slots);
  for (const t of times) {
    const min = timeToMinutes(t);
    assert.ok(
      min + 30 <= timeToMinutes("10:00") || min >= timeToMinutes("11:30"),
      `Слот ${t} пробива слетия интервал 10:00–11:30`
    );
  }
});

test("generateSlots: услуга, запълваща целия ден, получава точно един слот", () => {
  const slots = generateSlots({
    workStart: "09:00",
    workEnd: "18:00",
    existingBookings: [],
    blockedSlots: NO_BLOCKED,
    serviceDuration: 9 * 60,
    bufferMinutes: 0,
    slotInterval: 15,
    magneticEnabled: false,
  });
  assert.deepEqual(slotTimes(slots), ["09:00"]);
});

test("generateSlots: нулева продължителност или обърнато работно време → празно", () => {
  assert.deepEqual(
    generateSlots({
      workStart: "09:00",
      workEnd: "18:00",
      existingBookings: [],
      blockedSlots: NO_BLOCKED,
      serviceDuration: 0,
      bufferMinutes: 10,
      slotInterval: 15,
      magneticEnabled: false,
    }),
    []
  );
  assert.deepEqual(
    generateSlots({
      workStart: "18:00",
      workEnd: "09:00",
      existingBookings: [],
      blockedSlots: NO_BLOCKED,
      serviceDuration: 30,
      bufferMinutes: 10,
      slotInterval: 15,
      magneticEnabled: false,
    }),
    []
  );
});

test("generateSlots: blocked slot + резервация се комбинират", () => {
  const slots = generateSlots({
    workStart: "09:00",
    workEnd: "12:00",
    existingBookings: [{ booking_time: "09:00", service_duration: 60, booking_end_time: "10:00", status: "pending" }],
    blockedSlots: [{ start_time: "10:00", end_time: "11:00" }],
    serviceDuration: 30,
    bufferMinutes: 0,
    slotInterval: 15,
    magneticEnabled: false,
  });
  const times = slotTimes(slots);
  assert.deepEqual(times, ["11:00", "11:15", "11:30"]);
});

// ---------------------------------------------------------------------------
// generateParallelSlots — plan gating (одит F4: преименуването на плановете
// starter/standard/pro/premium НЕ бива да се обръща тихо).
// ---------------------------------------------------------------------------

const PARALLEL_BASE = {
  workEndMin: 18 * 60,
  waitingStartMin: 10 * 60,
  waitingEndMin: 11 * 60,
  nextBookingStartMin: null,
  bufferMinutes: 10,
  services: [{ id: "svc-quick", duration_minutes: 20, is_complex: false }],
};

test("generateParallelSlots: standard/pro/premium имат паралелен прозорец", () => {
  for (const plan of ["standard", "pro", "premium"] as Plan[]) {
    const win = generateParallelSlots({ ...PARALLEL_BASE, plan });
    assert.ok(win, `План ${plan} трябва да има паралелен прозорец`);
  }
});

test("generateParallelSlots: starter (и legacy 'collective') нямат паралелен прозорец", () => {
  assert.equal(generateParallelSlots({ ...PARALLEL_BASE, plan: "starter" as Plan }), null);
  // Legacy стойност от преди преименуването (миграция 026) — не бива да се съживява.
  assert.equal(generateParallelSlots({ ...PARALLEL_BASE, plan: "collective" as unknown as Plan }), null);
});

test("generateParallelSlots: следваща резервация клампва прозореца с buffer", () => {
  const win = generateParallelSlots({
    ...PARALLEL_BASE,
    plan: "pro" as Plan,
    nextBookingStartMin: 10 * 60 + 40, // 10:40
  });
  assert.ok(win);
  assert.equal(win.windowStartMin, 10 * 60);
  assert.equal(win.windowEndMin, 10 * 60 + 30); // 10:40 − 10 buffer
  // 20-мин услуга се събира в 30-мин прозорец
  assert.deepEqual(win.eligibleServiceIds, ["svc-quick"]);
});

test("generateParallelSlots: прозорец с нулева/отрицателна дължина → null", () => {
  const win = generateParallelSlots({
    ...PARALLEL_BASE,
    plan: "pro" as Plan,
    nextBookingStartMin: 10 * 60 + 5, // прозорец 10:00–(10:05−10) < start
  });
  assert.equal(win, null);
});

test("generateParallelSlots: сложни услуги и услуги без duration не са eligible", () => {
  const win = generateParallelSlots({
    ...PARALLEL_BASE,
    plan: "premium" as Plan,
    // Следваща резервация в 11:10 → прозорец 10:00–11:00 (60 мин).
    nextBookingStartMin: 11 * 60 + 10,
    services: [
      { id: "complex", duration_minutes: null, is_complex: true },
      { id: "no-duration", duration_minutes: null, is_complex: false },
      { id: "too-long", duration_minutes: 90, is_complex: false },
      { id: "fits", duration_minutes: 60, is_complex: false },
    ],
  });
  assert.ok(win);
  assert.deepEqual(win.eligibleServiceIds, ["fits"]);
});
