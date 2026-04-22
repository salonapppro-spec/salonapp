import { z } from "zod";

import {
  isSafeFacebookUrl,
  isSafeGoogleMapsEmbedUrl,
  isSafeInstagramUrl,
  isSafeTiktokUrl,
} from "@/lib/safe-public-urls";

function trimEmptyToUndefined(v: unknown): unknown {
  if (v === undefined || v === null) return undefined;
  if (typeof v !== "string") return v;
  const t = v.trim();
  return t === "" ? undefined : t;
}

const optionalInstagram = z.preprocess(
  trimEmptyToUndefined,
  z.union([
    z.undefined(),
    z.string().max(512).refine(isSafeInstagramUrl, {
      message: "Instagram: само https връзка към instagram.com",
    }),
  ]),
);

const optionalFacebook = z.preprocess(
  trimEmptyToUndefined,
  z.union([
    z.undefined(),
    z.string().max(512).refine(isSafeFacebookUrl, {
      message: "Facebook: само https връзка към facebook.com или fb.com",
    }),
  ]),
);

const optionalTiktok = z.preprocess(
  trimEmptyToUndefined,
  z.union([
    z.undefined(),
    z.string().max(512).refine(isSafeTiktokUrl, {
      message: "TikTok: само https връзка към tiktok.com",
    }),
  ]),
);

const optionalGoogleMapsEmbed = z.preprocess(
  trimEmptyToUndefined,
  z.union([
    z.undefined(),
    z.string().max(2000).refine(isSafeGoogleMapsEmbedUrl, {
      message: "Google Maps: само https://www.google.com/maps/embed?... (embed от Google)",
    }),
  ]),
);

export const UpdateTenantPublicFieldsSchema = z.object({
  /** Optional; admin API ignores client value and uses session tenant. */
  salon_slug: z.string().min(1).optional(),
  salon_name: z.string().min(1).max(120).optional(),
  /** Празно низче → маха логото в БД. */
  logo_url: z.union([z.string().url(), z.literal("")]).optional(),
  hero_title: z.string().max(120).optional(),
  hero_subtitle: z.string().max(200).optional(),
  hero_image_url: z.string().url().optional(),
  description: z.string().max(800).optional(),
  about_text1: z.string().max(1200).optional(),
  about_text2: z.string().max(1200).optional(),
  about_image_url: z.string().url().optional(),
  address: z.string().max(200).optional(),
  phone: z.string().max(50).optional(),
  email: z.string().email().optional(),
  instagram_url: optionalInstagram,
  facebook_url: optionalFacebook,
  tiktok_url: optionalTiktok,
  google_maps_embed: optionalGoogleMapsEmbed,
  primary_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  background_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
});
