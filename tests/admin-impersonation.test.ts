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

// Security одит M4: без секрет verify приема всеки валиден slug — това е
// документираното (рисково) поведение. Ако се въведе fail-closed за
// production, обнови теста да очаква null и махни todo-то.
test("impersonation: без секрет валиден slug минава БЕЗ подпис (известен риск M4)", () => {
  withSecret(undefined, () => {
    assert.equal(verifyImpersonationSlug("salon-bizhu"), "salon-bizhu");
    assert.equal(verifyImpersonationSlug("Invalid_Slug!"), null);
  });
});

test("impersonation: production трябва да изисква IMPERSONATION_HMAC_SECRET (fail-closed)", { todo: "security одит M4: направи секрета задължителен в production" }, () => {
  // Когато lib/admin-tenant.ts стане fail-closed, това трябва да върне null:
  withSecret(undefined, () => {
    assert.equal(verifyImpersonationSlug("salon-bizhu"), null);
  });
});
