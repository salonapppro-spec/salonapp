import assert from "node:assert/strict";
import test from "node:test";

import {
  checkBookingWindowLimit,
  checkMinNoticeBooking,
  rejectIfOutsideScheduleLimits,
} from "../lib/booking-schedule-limits";

const TODAY = "2026-06-16";

test("checkMinNoticeBooking allows future dates regardless of time", () => {
  assert.equal(
    checkMinNoticeBooking({
      bookingDate: "2026-06-17",
      bookingStartMinutes: 9 * 60,
      todayStr: TODAY,
      nowMinutes: 14 * 60,
      minNoticeMinutes: 30,
    }),
    null,
  );
});

test("checkMinNoticeBooking rejects today when slot is inside notice window", () => {
  const reject = checkMinNoticeBooking({
    bookingDate: TODAY,
    bookingStartMinutes: 14 * 60 + 15,
    todayStr: TODAY,
    nowMinutes: 14 * 60,
    minNoticeMinutes: 30,
  });
  assert.ok(reject);
  assert.equal(reject!.error, "Резервацията изисква поне 30 минути предизвестие.");
});

test("checkMinNoticeBooking allows today when slot is exactly at notice boundary", () => {
  assert.equal(
    checkMinNoticeBooking({
      bookingDate: TODAY,
      bookingStartMinutes: 14 * 60 + 30,
      todayStr: TODAY,
      nowMinutes: 14 * 60,
      minNoticeMinutes: 30,
    }),
    null,
  );
});

test("checkMinNoticeBooking allows today when slot is after notice window", () => {
  assert.equal(
    checkMinNoticeBooking({
      bookingDate: TODAY,
      bookingStartMinutes: 15 * 60,
      todayStr: TODAY,
      nowMinutes: 14 * 60,
      minNoticeMinutes: 30,
    }),
    null,
  );
});

test("checkBookingWindowLimit skips when window is null or non-positive", () => {
  assert.equal(
    checkBookingWindowLimit({
      bookingDate: "2099-01-01",
      todayStr: TODAY,
      bookingWindowDays: null,
    }),
    null,
  );
  assert.equal(
    checkBookingWindowLimit({
      bookingDate: "2099-01-01",
      todayStr: TODAY,
      bookingWindowDays: 0,
    }),
    null,
  );
});

test("checkBookingWindowLimit allows date on last day of window", () => {
  assert.equal(
    checkBookingWindowLimit({
      bookingDate: "2026-07-16",
      todayStr: TODAY,
      bookingWindowDays: 30,
    }),
    null,
  );
});

test("checkBookingWindowLimit rejects date beyond window", () => {
  const reject = checkBookingWindowLimit({
    bookingDate: "2026-07-17",
    todayStr: TODAY,
    bookingWindowDays: 30,
  });
  assert.ok(reject);
  assert.equal(reject!.error, "Резервации се приемат най-много 30 дни напред.");
});

test("rejectIfOutsideScheduleLimits returns min notice before booking window", () => {
  const reject = rejectIfOutsideScheduleLimits({
    bookingDate: TODAY,
    bookingStartMinutes: 10 * 60,
    todayStr: TODAY,
    nowMinutes: 12 * 60,
    minNoticeMinutes: 60,
    bookingWindowDays: 7,
  });
  assert.ok(reject);
  assert.match(reject!.error, /предизвестие/);
});

test("rejectIfOutsideScheduleLimits enforces booking window when min notice passes", () => {
  const reject = rejectIfOutsideScheduleLimits({
    bookingDate: "2026-08-01",
    bookingStartMinutes: 10 * 60,
    todayStr: TODAY,
    nowMinutes: 12 * 60,
    minNoticeMinutes: 30,
    bookingWindowDays: 30,
  });
  assert.ok(reject);
  assert.match(reject!.error, /най-много 30 дни/);
});
