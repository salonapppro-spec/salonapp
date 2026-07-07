import assert from "node:assert/strict";
import test from "node:test";

import { signImpersonationSlug, verifyImpersonationSlug } from "../lib/admin-tenant";

// ---------------------------------------------------------------------------
// Auth: super-admin impersonation cookie (security одит 2026-07-06, M4).
// Подписът пази срещу подправена бисквитка; секретът се чете при всяко
// извикване, затова тестовете сменят process.env и я връщат след себе си.
// ---------------------------------------------------------------------------

const ENV_KEY = "IMPERSONATION_HMAC_SECRET";

function withSecret<T>(secret: string | undefined, fn: () => T): T {
  const prev = process.env[ENV_KEY];
  if (secret === undefined) delete process.env[ENV_KEY];
  else process.env[ENV_KEY] = secret;
  try {
    return fn();
  } finally {
    if (prev === undefined) delete process.env[ENV_KEY];
    else process.env[ENV_KEY] = prev;
  }
}

test("impersonation: sign → verify връща оригиналния slug", () => {
  withSecret("unit-test-secret", () => {
    const signed = signImpersonationSlug("salon-bizhu");
    assert.notEqual(signed, "salon-bizhu", "Подписаната стойност трябва да носи MAC");
    assert.equal(verifyImpersonationSlug(signed), "salon-bizhu");
  });
});

test("impersonation: подправен MAC се отхвърля", () => {
  withSecret("unit-test-secret", () => {
    const signed = signImpersonationSlug("salon-bizhu");
    const dot = signed.lastIndexOf(".");
    const mac = signed.slice(dot + 1);
    const flipped = (mac[0] === "0" ? "1" : "0") + mac.slice(1);
    assert.equal(verifyImpersonationSlug(`salon-bizhu.${flipped}`), null);
  });
});

test("impersonation: подмяна на slug-а при запазен MAC се отхвърля", () => {
  withSecret("unit-test-secret", () => {
    const signed = signImpersonationSlug("salon-bizhu");
    const mac = signed.slice(signed.lastIndexOf(".") + 1);
    assert.equal(verifyImpersonationSlug(`drug-salon.${mac}`), null);
  });
});

test("impersonation: стойност без подпис се отхвърля, когато има секрет", () => {
  withSecret("unit-test-secret", () => {
    assert.equal(verifyImpersonationSlug("salon-bizhu"), null);
  });
});

test("impersonation: подпис с друг секрет се отхвърля", () => {
  const signed = withSecret("secret-one", () => signImpersonationSlug("salon-bizhu"));
  withSecret("secret-two", () => {
    assert.equal(verifyImpersonationSlug(signed), null);
  });
});

test("impersonation: невалиден slug се отхвърля дори с валиден подпис-формат", () => {
  withSecret("unit-test-secret", () => {
    const signed = signImpersonationSlug("Invalid_Slug!");
    assert.equal(verifyImpersonationSlug(signed), null);
  });
});

test("impersonation: боклук/празни стойности се отхвърлят", () => {
  withSecret("unit-test-secret", () => {
    assert.equal(verifyImpersonationSlug(""), null);
    assert.equal(verifyImpersonationSlug("....."), null);
    assert.equal(verifyImpersonationSlug("salon-bizhu.not-hex"), null);
  });
});

// Security одит M4 (fail-closed от 2026-07-07): без секрет verify отхвърля
// всичко, а sign хвърля ясна грешка вместо да сложи неподписана бисквитка.
test("impersonation: без секрет verify отхвърля всичко (fail-closed, M4)", () => {
  withSecret(undefined, () => {
    assert.equal(verifyImpersonationSlug("salon-bizhu"), null);
    assert.equal(verifyImpersonationSlug("Invalid_Slug!"), null);
  });
});

test("impersonation: без секрет sign хвърля ясна грешка (fail-closed, M4)", () => {
  withSecret(undefined, () => {
    assert.throws(() => signImpersonationSlug("salon-bizhu"), /IMPERSONATION_HMAC_SECRET/);
  });
});
