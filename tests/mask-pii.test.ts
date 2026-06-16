import assert from "node:assert/strict";
import test from "node:test";

import { maskEmailForPublicHint } from "../lib/mask-pii";

test("maskEmailForPublicHint masks local and domain parts", () => {
  assert.equal(maskEmailForPublicHint("john.doe@example.com"), "j***@e***.com");
});

test("maskEmailForPublicHint returns null for empty input", () => {
  assert.equal(maskEmailForPublicHint(null), null);
  assert.equal(maskEmailForPublicHint(""), null);
  assert.equal(maskEmailForPublicHint("   "), null);
});

test("maskEmailForPublicHint handles short local part", () => {
  assert.equal(maskEmailForPublicHint("a@gmail.com"), "*@g***.com");
});

test("maskEmailForPublicHint never returns the original email", () => {
  const original = "secret.client@salonapp.pro";
  const masked = maskEmailForPublicHint(original);
  assert.notEqual(masked, original);
  assert.ok(masked && !masked.includes("secret") && !masked.includes("client"));
});
