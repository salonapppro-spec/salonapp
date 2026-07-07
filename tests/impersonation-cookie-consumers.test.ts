import assert from "node:assert/strict";
import test from "node:test";

import { signImpersonationSlug, verifyImpersonationSlug } from "../lib/admin-tenant";
import { getImpersonatedSlug } from "../lib/routing/impersonation";

// ---------------------------------------------------------------------------
// Регресия 2026-07-07: след M4 бисквитката е подписана ("slug.hmac"), а три
// консуматора очакваха гол slug — банерът в /admin показваше суровата
// стойност, middleware header hint-ът тихо изчезваше, а rename route-ът
// записваше неподписана бисквитка. Тези тестове пазят договора:
// всеки консуматор трябва да работи и с подписан, и с legacy гол формат.
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

test("getImpersonatedSlug: извлича slug-а от ПОДПИСАНА стойност (M4 формат)", () => {
  const signed = withSecret("unit-test-secret", () => signImpersonationSlug("linabambina"));
  assert.match(signed, /^linabambina\.[0-9a-f]{64}$/, "очакван формат slug.hmac");
  assert.equal(getImpersonatedSlug(signed), "linabambina");
});

test("getImpersonatedSlug: приема legacy гол slug (бисквитки отпреди M4)", () => {
  assert.equal(getImpersonatedSlug("salon-bizhu"), "salon-bizhu");
});

test("getImpersonatedSlug: отхвърля невалиден slug независимо от формата", () => {
  assert.equal(getImpersonatedSlug("Invalid_Slug!"), null);
  assert.equal(getImpersonatedSlug("Invalid_Slug!.deadbeef"), null);
  assert.equal(getImpersonatedSlug(""), null);
  assert.equal(getImpersonatedSlug(undefined), null);
  assert.equal(getImpersonatedSlug("."), null);
  assert.equal(getImpersonatedSlug(".deadbeef"), null);
});

test("getImpersonatedSlug и verifyImpersonationSlug дават един и същ slug за валидна подписана стойност", () => {
  withSecret("unit-test-secret", () => {
    const signed = signImpersonationSlug("salon-bizhu");
    // Middleware hint (без crypto) и сървърният verify (с crypto) не бива
    // да се разминават за легитимна бисквитка — иначе header cross-check-ът
    // в requireAdminTenantSlugForApi връща фалшив 403.
    assert.equal(getImpersonatedSlug(signed), verifyImpersonationSlug(signed));
  });
});

test("банер контракт: суровата подписана стойност НЕ е валиден slug за показване", () => {
  // Пази срещу връщане на четенето на raw cookie в UI: суровата стойност
  // никога не минава като slug — консуматорите са длъжни да парсват/верифицират.
  const signed = withSecret("unit-test-secret", () => signImpersonationSlug("linabambina"));
  const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  assert.equal(SLUG_RE.test(signed), false);
});
