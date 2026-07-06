import assert from "node:assert/strict";
import test from "node:test";

import { CreateBookingSchema, UpdateBookingStatusSchema } from "../schemas/booking";

// ---------------------------------------------------------------------------
// Регресионни тестове за входната валидация на резервации (одит 2026-07-06).
// Пазят guard-овете, които спират невалидни данни ПРЕДИ да стигнат до
// runCreateBooking / базата.
// ---------------------------------------------------------------------------

function validInput(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    salon_slug: "test-salon",
    service_id: "6f9619ff-8b86-4d01-b42d-00cf4fc964ff",
    booking_date: "2026-08-15",
    booking_time: "10:00",
    client_name: "Мария Иванова",
    client_phone: "+359888123456",
    ...overrides,
  };
}

test("CreateBookingSchema: валиден вход минава", () => {
  const r = CreateBookingSchema.safeParse(validInput());
  assert.ok(r.success, JSON.stringify(r.success ? null : r.error.issues));
});

test("CreateBookingSchema: липсващ salon_slug се отхвърля", () => {
  const r = CreateBookingSchema.safeParse(validInput({ salon_slug: "" }));
  assert.equal(r.success, false);
});

test("CreateBookingSchema: service_id трябва да е UUID", () => {
  const r = CreateBookingSchema.safeParse(validInput({ service_id: "not-a-uuid" }));
  assert.equal(r.success, false);
});

test("CreateBookingSchema: телефон с букви се отхвърля", () => {
  const r = CreateBookingSchema.safeParse(validInput({ client_phone: "088abc4567" }));
  assert.equal(r.success, false);
});

test("CreateBookingSchema: твърде къс телефон се отхвърля", () => {
  const r = CreateBookingSchema.safeParse(validInput({ client_phone: "08812" }));
  assert.equal(r.success, false);
});

test("CreateBookingSchema: телефон с форматиращи символи минава", () => {
  for (const phone of ["0888 123 456", "0888-123-456", "(0888) 123456", "+359 88 812 3456"]) {
    const r = CreateBookingSchema.safeParse(validInput({ client_phone: phone }));
    assert.ok(r.success, `Очакван валиден телефон: ${phone}`);
  }
});

// Документира защо digit-guard-ът (≥5 цифри) в runCreateBooking и
// createAdminBooking е задължителен: телефон само от разрешени НЕ-цифрови
// символи минава regex-а на схемата. Ако някой "изчисти" guard-а, този тест
// напомня, че схемата сама по себе си НЕ пази срещу това.
test("CreateBookingSchema: телефон без нито една цифра МИНАВА схемата (пази се от digit-guard в мутацията)", () => {
  const r = CreateBookingSchema.safeParse(validInput({ client_phone: "+()[] - ()" }));
  assert.ok(r.success, "Ако това започне да пада, digit-guard-ът в runCreateBooking вече не е единствената защита — обнови коментара.");
});

test("CreateBookingSchema: невалиден имейл се отхвърля, липсващ имейл е ок", () => {
  assert.equal(CreateBookingSchema.safeParse(validInput({ client_email: "not-an-email" })).success, false);
  assert.ok(CreateBookingSchema.safeParse(validInput()).success);
  assert.ok(CreateBookingSchema.safeParse(validInput({ client_email: "x@y.bg" })).success);
});

test("CreateBookingSchema: празни hair полета стават undefined (не стигат до CHECK в Postgres)", () => {
  const r = CreateBookingSchema.safeParse(validInput({ hair_length: "", hair_density: null }));
  assert.ok(r.success);
  if (r.success) {
    assert.equal(r.data.hair_length, undefined);
    assert.equal(r.data.hair_density, undefined);
  }
});

test("CreateBookingSchema: невалидни hair стойности се отхвърлят", () => {
  assert.equal(CreateBookingSchema.safeParse(validInput({ hair_length: "extra-long" })).success, false);
  assert.equal(CreateBookingSchema.safeParse(validInput({ hair_density: "curly" })).success, false);
});

test("CreateBookingSchema: валидни hair стойности минават", () => {
  const r = CreateBookingSchema.safeParse(validInput({ hair_length: "long", hair_density: "thick" }));
  assert.ok(r.success);
});

// Одит 2026-07-06, находка B3: booking_date/booking_time са само .min(1) —
// боклук като "zz:zz" минава схемата, дава NaN в timeToMinutes и пропуска
// всички проверки до DB грешка. Когато схемата се затегне с regex + реална
// валидация на датата, махни { todo } и остави assert-ите.
test("CreateBookingSchema: невалиден формат на дата/час трябва да се отхвърля", { todo: "audit B3: добави regex/date валидация в schemas/booking.ts" }, () => {
  assert.equal(CreateBookingSchema.safeParse(validInput({ booking_time: "zz:zz" })).success, false);
  assert.equal(CreateBookingSchema.safeParse(validInput({ booking_date: "31.12.2026" })).success, false);
  assert.equal(CreateBookingSchema.safeParse(validInput({ booking_date: "2026-02-31" })).success, false);
});

// ---------------------------------------------------------------------------
// UpdateBookingStatusSchema
// ---------------------------------------------------------------------------

test("UpdateBookingStatusSchema: всички валидни статуси минават", () => {
  for (const status of ["pending", "confirmed", "completed", "cancelled", "no_show"]) {
    const r = UpdateBookingStatusSchema.safeParse({
      salon_slug: "test-salon",
      booking_id: "6f9619ff-8b86-4d01-b42d-00cf4fc964ff",
      status,
    });
    assert.ok(r.success, `Очакван валиден статус: ${status}`);
  }
});

test("UpdateBookingStatusSchema: непознат статус се отхвърля", () => {
  const r = UpdateBookingStatusSchema.safeParse({
    salon_slug: "test-salon",
    booking_id: "6f9619ff-8b86-4d01-b42d-00cf4fc964ff",
    status: "archived",
  });
  assert.equal(r.success, false);
});
