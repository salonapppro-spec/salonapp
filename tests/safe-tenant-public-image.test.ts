import assert from "node:assert/strict";
import test from "node:test";

import { safeTenantPublicImageUrl } from "../lib/safe-public-urls";

test("allows Supabase Storage https URL", () => {
  const u =
    "https://xxxxx.supabase.co/storage/v1/object/public/gallery/theskin/settings/n.webp";
  assert.equal(safeTenantPublicImageUrl(u), u);
});

test("allows salonapp.pro host", () => {
  assert.equal(
    safeTenantPublicImageUrl("https://theskin.salonapp.pro/cdn/x.webp"),
    "https://theskin.salonapp.pro/cdn/x.webp",
  );
});

test("rejects http and unknown hosts", () => {
  assert.equal(safeTenantPublicImageUrl("http://evil.com/x.jpg"), null);
  assert.equal(safeTenantPublicImageUrl("https://evil.com/x.jpg"), null);
});
