import assert from "node:assert/strict";
import test from "node:test";

import {
  calculateComplexDuration,
  calculateDuration,
  generateSlots,
  minutesToTime,
  timeToMinutes,
} from "../lib/scheduling";
import type { Service } from "../types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeSimpleService(overrides: Partial<Service> = {}): Service {
  return {
    id: "svc-1",
    salon_slug: "test-salon",
    specialist_id: null,
    name: "Haircut",
    price_eur: 30,
    duration_minutes: 60,
    is_complex: false,
    is_active: true,
    created_at: "2024-01-01T00:00:00Z",
    active_start_min: null,
    active_start_max: null,
    waiting_min: null,
    waiting_max: null,
    active_finish_min: null,
    active_finish_max: null,
    ...overrides,
  };
}

function makeComplexService(overrides: Partial<Service> = {}): Service {
  return {
    id: "svc-2",
    salon_slug: "test-salon",
    specialist_id: null,
    name: "Highlights",
    price_eur: 120,
    duration_minutes: null,
    is_complex: true,
    is_active: true,
    created_at: "2024-01-01T00:00:00Z",
    // active_start: 20–40, waiting: 30–60, active_finish: 10–20
    active_start_min: 20,
    active_start_max: 40,
    waiting_min: 30,
    waiting_max: 60,
    active_finish_min: 10,
    active_finish_max: 20,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// timeToMinutes
// ---------------------------------------------------------------------------

test("timeToMinutes: converts HH:MM to minutes", () => {
  assert.equal(timeToMinutes("00:00"), 0);
  assert.equal(timeToMinutes("09:00"), 540);
  assert.equal(timeToMinutes("09:30"), 570);
  assert.equal(timeToMinutes("18:45"), 1125);
  assert.equal(timeToMinutes("23:59"), 1439);
});

test("timeToMinutes: handles midnight edge cases", () => {
  assert.equal(timeToMinutes("12:00"), 720);
  assert.equal(timeToMinutes("00:01"), 1);
});

// ---------------------------------------------------------------------------
// minutesToTime
// ---------------------------------------------------------------------------

test("minutesToTime: converts minutes to HH:MM", () => {
  assert.equal(minutesToTime(0), "00:00");
  assert.equal(minutesToTime(540), "09:00");
  assert.equal(minutesToTime(570), "09:30");
  assert.equal(minutesToTime(1125), "18:45");
  assert.equal(minutesToTime(1439), "23:59");
});

test("minutesToTime: pads single digits", () => {
  assert.equal(minutesToTime(5), "00:05");
  assert.equal(minutesToTime(65), "01:05");
});

test("timeToMinutes and minutesToTime are inverse", () => {
  const times = ["09:00", "09:15", "09:30", "10:00", "18:00", "20:45"];
  for (const t of times) {
    assert.equal(minutesToTime(timeToMinutes(t)), t);
  }
});

// ---------------------------------------------------------------------------
// calculateComplexDuration — 3×3 матрица
// ---------------------------------------------------------------------------

test("calculateComplexDuration: short+thin → minimum values (weight=0)", () => {
  const svc = makeComplexService();
  const result = calculateComplexDuration(svc, "short", "thin");
  // weight=0 → min values: activeStart=20, waiting=30, activeFinish=10
  assert.equal(result.activeStart, 20);
  assert.equal(result.waiting, 30);
  assert.equal(result.activeFinish, 10);
  assert.equal(result.totalMinutes, 60);
});

test("calculateComplexDuration: long+thick → maximum values (weight=1)", () => {
  const svc = makeComplexService();
  const result = calculateComplexDuration(svc, "long", "thick");
  // weight=1 → max values: activeStart=40, waiting=60, activeFinish=20
  assert.equal(result.activeStart, 40);
  assert.equal(result.waiting, 60);
  assert.equal(result.activeFinish, 20);
  assert.equal(result.totalMinutes, 120);
});

test("calculateComplexDuration: medium+medium → middle values (weight=0.5)", () => {
  const svc = makeComplexService();
  const result = calculateComplexDuration(svc, "medium", "medium");
  // weight=0.5 → midpoints: activeStart=30, waiting=45, activeFinish=15
  assert.equal(result.activeStart, 30);
  assert.equal(result.waiting, 45);
  assert.equal(result.activeFinish, 15);
  assert.equal(result.totalMinutes, 90);
});

test("calculateComplexDuration: short+thick → weight=0.5 (row=0, col=2)", () => {
  const svc = makeComplexService();
  const result = calculateComplexDuration(svc, "short", "thick");
  // COMPLEX_WEIGHT[0][2] = 0.5 → same as medium+medium midpoints
  assert.equal(result.activeStart, 30);
  assert.equal(result.waiting, 45);
  assert.equal(result.activeFinish, 15);
  assert.equal(result.totalMinutes, 90);
});

test("calculateComplexDuration: long+thin → weight=0.5 (row=2, col=0)", () => {
  const svc = makeComplexService();
  const result = calculateComplexDuration(svc, "long", "thin");
  // COMPLEX_WEIGHT[2][0] = 0.5 → midpoints
  assert.equal(result.activeStart, 30);
  assert.equal(result.waiting, 45);
  assert.equal(result.activeFinish, 15);
  assert.equal(result.totalMinutes, 90);
});

test("calculateComplexDuration: when min=max, returns that value regardless of weight", () => {
  const svc = makeComplexService({
    active_start_min: 30,
    active_start_max: 30,
    waiting_min: 45,
    waiting_max: 45,
    active_finish_min: 15,
    active_finish_max: 15,
  });
  for (const [len, den] of [
    ["short", "thin"],
    ["medium", "medium"],
    ["long", "thick"],
  ] as const) {
    const r = calculateComplexDuration(svc, len, den);
    assert.equal(r.activeStart, 30);
    assert.equal(r.waiting, 45);
    assert.equal(r.activeFinish, 15);
    assert.equal(r.totalMinutes, 90);
  }
});

// ---------------------------------------------------------------------------
// calculateDuration
// ---------------------------------------------------------------------------

test("calculateDuration: simple service returns duration_minutes directly", () => {
  const svc = makeSimpleService({ duration_minutes: 45 });
  const result = calculateDuration(svc, "medium", "medium");
  assert.equal(result.totalMinutes, 45);
  assert.equal(result.waitingStart, 0);
  assert.equal(result.waitingEnd, 0);
});

test("calculateDuration: complex service returns correct waitingStart and waitingEnd", () => {
  const svc = makeComplexService();
  // short+thin → activeStart=20, waiting=30 → waitingStart=20, waitingEnd=50
  const result = calculateDuration(svc, "short", "thin");
  assert.equal(result.totalMinutes, 60);
  assert.equal(result.waitingStart, 20);
  assert.equal(result.waitingEnd, 50); // activeStart + waiting
});

// ---------------------------------------------------------------------------
// generateSlots
// ---------------------------------------------------------------------------

test("generateSlots: generates slots within working hours", () => {
  const slots = generateSlots({
    workStart: "09:00",
    workEnd: "18:00",
    existingBookings: [],
    blockedSlots: [],
    serviceDuration: 60,
    bufferMinutes: 0,
    slotInterval: 60,
    magneticEnabled: false,
  });

  assert.ok(slots.length > 0, "should generate at least one slot");
  // All slots start >= 09:00 (540 min)
  for (const s of slots) {
    assert.ok(timeToMinutes(s.time) >= 540, `slot ${s.time} before workStart`);
  }
  // No slot should end after 18:00 (1080 min)
  for (const s of slots) {
    assert.ok(timeToMinutes(s.time) + 60 <= 1080, `slot ${s.time} ends after workEnd`);
  }
  // Last slot should be 17:00 (starts at 1020, ends at 1080)
  const last = slots[slots.length - 1]!;
  assert.equal(last.time, "17:00");
});

test("generateSlots: excludes slots overlapping existing bookings", () => {
  const slots = generateSlots({
    workStart: "09:00",
    workEnd: "18:00",
    existingBookings: [
      {
        booking_time: "10:00",
        service_duration: 60,
        booking_end_time: "11:00",
        status: "confirmed",
      },
    ],
    blockedSlots: [],
    serviceDuration: 60,
    bufferMinutes: 0,
    slotInterval: 60,
    magneticEnabled: false,
  });

  const times = slots.map((s) => s.time);
  assert.ok(!times.includes("10:00"), "should not include slot at booked time");
  // 09:00 and 11:00 should be available
  assert.ok(times.includes("09:00"), "09:00 should be available");
  assert.ok(times.includes("11:00"), "11:00 should be available");
});

test("generateSlots: excludes slots overlapping blocked slots", () => {
  const slots = generateSlots({
    workStart: "09:00",
    workEnd: "18:00",
    existingBookings: [],
    blockedSlots: [{ start_time: "12:00", end_time: "14:00" }],
    serviceDuration: 60,
    bufferMinutes: 0,
    slotInterval: 60,
    magneticEnabled: false,
  });

  const times = slots.map((s) => s.time);
  assert.ok(!times.includes("12:00"), "12:00 should be blocked");
  assert.ok(!times.includes("13:00"), "13:00 should be blocked");
  assert.ok(times.includes("11:00"), "11:00 should be free");
  assert.ok(times.includes("14:00"), "14:00 should be free");
});

test("generateSlots: respects minStartMinutes (advance booking cutoff)", () => {
  // Simulate: it is currently 10:30 — slots before 10:30 should not appear
  const slots = generateSlots({
    workStart: "09:00",
    workEnd: "18:00",
    existingBookings: [],
    blockedSlots: [],
    serviceDuration: 60,
    bufferMinutes: 0,
    slotInterval: 60,
    magneticEnabled: false,
    minStartMinutes: 630, // 10:30
  });

  const times = slots.map((s) => s.time);
  assert.ok(!times.includes("09:00"), "09:00 should be hidden (before cutoff)");
  assert.ok(!times.includes("10:00"), "10:00 should be hidden (before cutoff)");
  assert.ok(times.includes("11:00"), "11:00 should be available (after cutoff)");
});

test("generateSlots: cancelled bookings do not block slots", () => {
  const slots = generateSlots({
    workStart: "09:00",
    workEnd: "18:00",
    existingBookings: [
      {
        booking_time: "10:00",
        service_duration: 60,
        status: "cancelled",
      },
    ],
    blockedSlots: [],
    serviceDuration: 60,
    bufferMinutes: 0,
    slotInterval: 60,
    magneticEnabled: false,
  });

  const times = slots.map((s) => s.time);
  assert.ok(times.includes("10:00"), "cancelled booking should not block the slot");
});

test("generateSlots: no_show bookings do not block slots", () => {
  const slots = generateSlots({
    workStart: "09:00",
    workEnd: "18:00",
    existingBookings: [
      {
        booking_time: "10:00",
        service_duration: 60,
        status: "no_show",
      },
    ],
    blockedSlots: [],
    serviceDuration: 60,
    bufferMinutes: 0,
    slotInterval: 60,
    magneticEnabled: false,
  });

  const times = slots.map((s) => s.time);
  assert.ok(times.includes("10:00"), "no_show booking should not block the slot");
});

test("generateSlots: buffer minutes push end of busy period", () => {
  const slotsNoBuffer = generateSlots({
    workStart: "09:00",
    workEnd: "12:00",
    existingBookings: [{ booking_time: "09:00", service_duration: 60, status: "confirmed" }],
    blockedSlots: [],
    serviceDuration: 60,
    bufferMinutes: 0,
    slotInterval: 60,
    magneticEnabled: false,
  });

  const slotsWithBuffer = generateSlots({
    workStart: "09:00",
    workEnd: "12:00",
    existingBookings: [{ booking_time: "09:00", service_duration: 60, status: "confirmed" }],
    blockedSlots: [],
    serviceDuration: 60,
    bufferMinutes: 30,
    slotInterval: 60,
    magneticEnabled: false,
  });

  // Without buffer: 10:00 is free
  assert.ok(
    slotsNoBuffer.map((s) => s.time).includes("10:00"),
    "without buffer, 10:00 should be available"
  );
  // With 30min buffer: 10:00 is blocked (09:00 booking ends at 10:00 + 30min buffer = 10:30)
  assert.ok(
    !slotsWithBuffer.map((s) => s.time).includes("10:00"),
    "with buffer, 10:00 should be blocked"
  );
});

test("generateSlots: magnetic slots appear first in sorted output", () => {
  const slots = generateSlots({
    workStart: "09:00",
    workEnd: "18:00",
    existingBookings: [
      {
        booking_time: "09:00",
        service_duration: 60,
        status: "confirmed",
      },
    ],
    blockedSlots: [],
    serviceDuration: 60,
    bufferMinutes: 0,
    slotInterval: 60,
    magneticEnabled: true,
  });

  const magneticSlots = slots.filter((s) => s.magnetic);
  const nonMagneticSlots = slots.filter((s) => !s.magnetic);

  // Magnetic slot at 10:00 (immediately after booking ends)
  assert.ok(magneticSlots.length > 0, "should have at least one magnetic slot");
  assert.equal(magneticSlots[0]!.time, "10:00", "magnetic slot should be right after existing booking");

  // All magnetic slots come before non-magnetic slots in the list
  if (nonMagneticSlots.length > 0) {
    const lastMagIdx = slots.findLastIndex((s) => s.magnetic);
    const firstNonMagIdx = slots.findIndex((s) => !s.magnetic);
    assert.ok(lastMagIdx < firstNonMagIdx, "all magnetic slots before non-magnetic");
  }
});

test("generateSlots: returns empty array when workEnd <= workStart", () => {
  const slots = generateSlots({
    workStart: "18:00",
    workEnd: "09:00",
    existingBookings: [],
    blockedSlots: [],
    serviceDuration: 60,
    bufferMinutes: 0,
    slotInterval: 30,
    magneticEnabled: false,
  });
  assert.equal(slots.length, 0);
});

test("generateSlots: returns empty array when service longer than working day", () => {
  const slots = generateSlots({
    workStart: "09:00",
    workEnd: "10:00",
    existingBookings: [],
    blockedSlots: [],
    serviceDuration: 120,
    bufferMinutes: 0,
    slotInterval: 30,
    magneticEnabled: false,
  });
  assert.equal(slots.length, 0);
});

test("generateSlots: all slots have available=true", () => {
  const slots = generateSlots({
    workStart: "09:00",
    workEnd: "18:00",
    existingBookings: [],
    blockedSlots: [],
    serviceDuration: 30,
    bufferMinutes: 0,
    slotInterval: 30,
    magneticEnabled: false,
  });
  for (const s of slots) {
    assert.equal(s.available, true);
  }
});
