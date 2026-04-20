import { z } from "zod";

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
  instagram_url: z.string().url().optional(),
  facebook_url: z.string().url().optional(),
  tiktok_url: z.string().url().optional(),
  google_maps_embed: z.string().max(5000).optional(),
  primary_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
});

