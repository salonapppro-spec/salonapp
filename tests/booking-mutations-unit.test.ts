import assert from "node:assert/strict";
import test from "node:test";

import { normalizeTimeForDb } from "../lib/booking-mutations";

// ---------------------------------------------------------------------------
// runCreateBooking е DB-обвързан (покрит от integration тестовете); тук
// пазим чистите му помощници + това, че модулът изобщо се импортира без
// env/мрежови side effects — счупен top-level import би съборил И публичния
// booking API, И admin quick booking, И server action-а едновременно.
// ---------------------------------------------------------------------------

test("normalizeTimeForDb: HH:MM → HH:MM:SS", () => {
  assert.equal(normalizeTimeForDb("10:00"), "10:00:00");
  assert.equal(normalizeTimeForDb("9:5"), "09:05:00");
});

test("normalizeTimeForDb: HH:MM:SS остава непроменено", () => {
  assert.equal(normalizeTimeForDb("10:00:00"), "10:00:00");
  assert.equal(normalizeTimeForDb("23:59:59"), "23:59:59");
});

test("normalizeTimeForDb: липсващи части се допълват с нули", () => {
  assert.equal(normalizeTimeForDb("7"), "07:00:00");
});
