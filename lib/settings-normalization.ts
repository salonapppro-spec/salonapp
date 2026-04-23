const URL_OPTIONAL_KEYS = [
  "logo_url",
  "hero_image_url",
  "about_image_url",
  "instagram_url",
  "facebook_url",
  "tiktok_url",
  "google_maps_embed",
] as const;

export function normalizeTenantSettingsPatch(input: Record<string, unknown>): Record<string, unknown> {
  const patch: Record<string, unknown> = { ...input };
  delete patch.salon_slug;

  for (const key of URL_OPTIONAL_KEYS) {
    if (!Object.prototype.hasOwnProperty.call(patch, key)) continue;
    const v = patch[key];
    patch[key] = typeof v === "string" && v.trim() === "" ? null : v;
  }

  return patch;
}
