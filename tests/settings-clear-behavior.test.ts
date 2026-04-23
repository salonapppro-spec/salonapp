import assert from "node:assert/strict";
import test from "node:test";

import { normalizeTenantSettingsPatch } from "../lib/settings-normalization";
import { UpdateTenantPublicFieldsSchema } from "../schemas/settings";

test("schema accepts null for social/maps clear operations", () => {
  const parsed = UpdateTenantPublicFieldsSchema.safeParse({
    instagram_url: null,
    facebook_url: null,
    tiktok_url: null,
    google_maps_embed: null,
  });
  assert.equal(parsed.success, true);
});

test("schema converts empty social/maps strings to undefined", () => {
  const parsed = UpdateTenantPublicFieldsSchema.parse({
    instagram_url: "   ",
    facebook_url: "",
    tiktok_url: " ",
    google_maps_embed: "\n\t",
  });
  assert.equal(parsed.instagram_url, undefined);
  assert.equal(parsed.facebook_url, undefined);
  assert.equal(parsed.tiktok_url, undefined);
  assert.equal(parsed.google_maps_embed, undefined);
});

test("normalization converts empty optional URLs to null", () => {
  const patch = normalizeTenantSettingsPatch({
    salon_slug: "demo",
    logo_url: "",
    hero_image_url: "   ",
    about_image_url: "",
    instagram_url: "",
    facebook_url: " ",
    tiktok_url: "",
    google_maps_embed: "\t",
  });

  assert.equal("salon_slug" in patch, false);
  assert.equal(patch.logo_url, null);
  assert.equal(patch.hero_image_url, null);
  assert.equal(patch.about_image_url, null);
  assert.equal(patch.instagram_url, null);
  assert.equal(patch.facebook_url, null);
  assert.equal(patch.tiktok_url, null);
  assert.equal(patch.google_maps_embed, null);
});

test("normalization preserves non-empty URLs", () => {
  const maps = "https://www.google.com/maps/embed?pb=abc";
  const patch = normalizeTenantSettingsPatch({
    instagram_url: "https://instagram.com/salon",
    facebook_url: "https://facebook.com/salon",
    tiktok_url: "https://www.tiktok.com/@salon",
    google_maps_embed: maps,
  });

  assert.equal(patch.instagram_url, "https://instagram.com/salon");
  assert.equal(patch.facebook_url, "https://facebook.com/salon");
  assert.equal(patch.tiktok_url, "https://www.tiktok.com/@salon");
  assert.equal(patch.google_maps_embed, maps);
});
