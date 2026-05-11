import assert from "node:assert/strict";
import test from "node:test";

import { normalizePhone } from "../lib/phone";

// ---------------------------------------------------------------------------
// Bulgarian mobile numbers (08XXXXXXXX → +359...)
// ---------------------------------------------------------------------------

test("normalizePhone: Bulgarian mobile 08XXXXXXXX → +359...", () => {
  assert.equal(normalizePhone("0888123456"), "+359888123456");
  assert.equal(normalizePhone("0878123456"), "+359878123456");
  assert.equal(normalizePhone("0899000000"), "+359899000000");
});

test("normalizePhone: strips spaces from Bulgarian mobile", () => {
  assert.equal(normalizePhone("0888 123 456"), "+359888123456");
  assert.equal(normalizePhone("088 812 34 56"), "+359888123456");
});

test("normalizePhone: strips dashes from Bulgarian mobile", () => {
  assert.equal(normalizePhone("0888-123-456"), "+359888123456");
  assert.equal(normalizePhone("088-812-34-56"), "+359888123456");
});

test("normalizePhone: strips parentheses from Bulgarian mobile", () => {
  assert.equal(normalizePhone("(0888) 123-456"), "+359888123456");
  assert.equal(normalizePhone("(088)8123456"), "+359888123456");
});

test("normalizePhone: strips dots from Bulgarian mobile", () => {
  assert.equal(normalizePhone("0888.123.456"), "+359888123456");
});

// ---------------------------------------------------------------------------
// International E.164 with +359 prefix
// ---------------------------------------------------------------------------

test("normalizePhone: +359 already normalized stays unchanged", () => {
  assert.equal(normalizePhone("+359888123456"), "+359888123456");
});

test("normalizePhone: +359 with spaces stripped", () => {
  assert.equal(normalizePhone("+359 888 123 456"), "+359888123456");
  assert.equal(normalizePhone("+359 88 123 456"), "+35988123456");
});

test("normalizePhone: 00359 prefix normalized to +359", () => {
  assert.equal(normalizePhone("00359888123456"), "+359888123456");
  assert.equal(normalizePhone("00359 888 123 456"), "+359888123456");
});

// ---------------------------------------------------------------------------
// Non-Bulgarian international numbers
// ---------------------------------------------------------------------------

test("normalizePhone: non-BG international numbers kept as-is (stripped)", () => {
  assert.equal(normalizePhone("+1 555 123 4567"), "+15551234567");
  assert.equal(normalizePhone("+44 20 7946 0958"), "+442079460958");
  assert.equal(normalizePhone("+49 30 1234567"), "+493012345671".slice(0, -1)); // +4930 1234567
});

test("normalizePhone: +1 US number stripped of spaces", () => {
  assert.equal(normalizePhone("+1 555 123 4567"), "+15551234567");
});

test("normalizePhone: +44 UK number stripped of spaces", () => {
  assert.equal(normalizePhone("+44 20 7946 0958"), "+442079460958");
});

// ---------------------------------------------------------------------------
// Idempotency — calling normalizePhone twice should give same result
// ---------------------------------------------------------------------------

test("normalizePhone: idempotent — already normalized returns same value", () => {
  const cases = ["+359888123456", "+15551234567", "+442079460958"];
  for (const c of cases) {
    assert.equal(normalizePhone(normalizePhone(c)), normalizePhone(c));
  }
});

test("normalizePhone: Bulgarian number normalized twice is idempotent", () => {
  const raw = "0888 123 456";
  const once = normalizePhone(raw);
  const twice = normalizePhone(once);
  assert.equal(once, twice);
});

// ---------------------------------------------------------------------------
// Edge cases
// ---------------------------------------------------------------------------

test("normalizePhone: empty string returns empty string", () => {
  assert.equal(normalizePhone(""), "");
});

test("normalizePhone: whitespace-only string returns empty string", () => {
  assert.equal(normalizePhone("   "), "");
});

test("normalizePhone: Bulgarian landline (02XXXXXXX) kept as-is", () => {
  // Landlines don't match ^08\d{8}$ — kept stripped, no +359 prefix added
  const result = normalizePhone("02 987 654");
  assert.equal(result, "02987654");
});

test("normalizePhone: Bulgarian landline with area code stripped", () => {
  const result = normalizePhone("032-123-456");
  assert.equal(result, "032123456");
});

test("normalizePhone: mixed formatting stripped correctly", () => {
  assert.equal(normalizePhone("+359(888)123-456"), "+359888123456");
});
