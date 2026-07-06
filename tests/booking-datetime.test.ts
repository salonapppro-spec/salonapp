import assert from "node:assert/strict";
import test from "node:test";

import {
  addCalendarDaysInSofia,
  bookingStartUtc,
  hoursUntilBooking,
  todayDateISOInSofia,
  tomorrowDateISOInSofia,
} from "../lib/booking-datetime";

// ---------------------------------------------------------------------------
// Часови зони и дати за резервации/reminders (одит 2026-07-06).
// Vercel работи в UTC — всяко "днес/утре" тук ТРЯБВА да е софийско, иначе
// reminders cron-ът и min-notice проверките се разместват около полунощ.
// ---------------------------------------------------------------------------

test("bookingStartUtc: лятно време (EEST, UTC+3)", () => {
  const d = bookingStartUtc("2026-07-15", "10:00");
  assert.equal(d.toISOString(), "2026-07-15T07:00:00.000Z");
});

test("bookingStartUtc: зимно време (EET, UTC+2)", () => {
  const d = bookingStartUtc("2026-01-15", "10:00");
  assert.equal(d.toISOString(), "2026-01-15T08:00:00.000Z");
});

test("bookingStartUtc: приема Postgres формат HH:MM:SS", () => {
  const d = bookingStartUtc("2026-07-15", "10:30:00");
  assert.equal(d.toISOString(), "2026-07-15T07:30:00.000Z");
});

test("bookingStartUtc: полунощ и края на деня", () => {
  assert.equal(bookingStartUtc("2026-07-15", "00:00").toISOString(), "2026-07-14T21:00:00.000Z");
  assert.equal(bookingStartUtc("2026-07-15", "23:59").toISOString(), "2026-07-15T20:59:00.000Z");
});

test("addCalendarDaysInSofia: обикновена аритметика и през граница на месец", () => {
  assert.equal(addCalendarDaysInSofia("2026-07-06", 1), "2026-07-07");
  assert.equal(addCalendarDaysInSofia("2026-07-31", 1), "2026-08-01");
  assert.equal(addCalendarDaysInSofia("2026-12-31", 1), "2027-01-01");
  assert.equal(addCalendarDaysInSofia("2026-03-01", -1), "2026-02-28");
});

test("addCalendarDaysInSofia: през смяната на часа (DST) денят пак е +1 календарен", () => {
  // 2026: лятното часово време в ЕС започва на 29 март и свършва на 25 октомври.
  assert.equal(addCalendarDaysInSofia("2026-03-28", 1), "2026-03-29");
  assert.equal(addCalendarDaysInSofia("2026-10-24", 1), "2026-10-25");
  assert.equal(addCalendarDaysInSofia("2026-10-25", 1), "2026-10-26");
});

test("addCalendarDaysInSofia: 30-дневният booking window е точно 30 календарни дни", () => {
  assert.equal(addCalendarDaysInSofia("2026-07-06", 30), "2026-08-05");
});

test("todayDateISOInSofia / tomorrowDateISOInSofia: формат и разлика от 1 ден", () => {
  const today = todayDateISOInSofia();
  const tomorrow = tomorrowDateISOInSofia();
  assert.match(today, /^\d{4}-\d{2}-\d{2}$/);
  assert.match(tomorrow, /^\d{4}-\d{2}-\d{2}$/);
  // "утре" за reminders трябва да е точно днес+1 в софийско време —
  // изразено през същата календарна аритметика, която ползва booking window.
  assert.equal(tomorrow, addCalendarDaysInSofia(today, 1));
});

test("hoursUntilBooking: минала резервация дава отрицателни часове, бъдеща — положителни", () => {
  const past = hoursUntilBooking("2020-01-01", "10:00");
  assert.ok(past < 0, `Очаквано отрицателно, получено ${past}`);

  const future = hoursUntilBooking(addCalendarDaysInSofia(todayDateISOInSofia(), 30), "10:00");
  assert.ok(future > 24, `Резервация след 30 дни трябва да е >24ч напред, получено ${future}`);
});

test("hoursUntilBooking: границата от 24ч за отказ е спрямо точния час, не датата", () => {
  // Резервация утре: дали е <24ч зависи от часа ѝ спрямо сегашния момент.
  const tomorrow = tomorrowDateISOInSofia();
  const early = hoursUntilBooking(tomorrow, "00:01");
  const late = hoursUntilBooking(tomorrow, "23:59");
  assert.ok(late > early, "По-късен час утре трябва да дава повече оставащи часове");
  assert.ok(late - early > 23, "Разликата в рамките на деня трябва да е ~24ч");
});
