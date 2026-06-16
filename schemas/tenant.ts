import { z } from "zod";

export const CreateTenantSchema = z.object({
  salon_slug: z
    .string()
    .min(2, "Минимум 2 знака")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Само малки латински букви, цифри и тире"),
  salon_name: z.string().min(1, "Въведете име на салона"),
  plan: z.enum(["starter", "standard", "pro", "premium"], {
    error: () => ({ message: "Изберете план" }),
  }),
  template: z.enum(["bloom", "luxe", "clean", "zen", "bold"], {
    error: () => ({ message: "Изберете шаблон" }),
  }).default("bloom"),
  owner_email: z.string().email("Невалиден имейл").optional(),
  owner_phone: z.string().min(5, "Въведете валиден телефон").optional(),
});

/** Празен низ от формуляр не трябва да стане невалиден email/phone — третира се като "не е зададено". */
function emptyToUndefined(v: unknown): unknown {
  if (v === "") return undefined;
  return v;
}

export const UpdateTenantBasicsSchema = z.object({
  salon_slug: z.string().min(1, "Липсва salon_slug"),
  template: z.enum(["bloom", "luxe", "luxe2", "clean", "bold", "zen", "groom"], {
    error: () => ({ message: "Невалиден шаблон" }),
  }),
  status: z.enum(["trial", "active", "inactive"], {
    error: () => ({ message: "Невалиден статус" }),
  }),
  plan: z.enum(["starter", "standard", "pro", "premium"], {
    error: () => ({ message: "Невалиден план" }),
  }),
  salon_name: z.string().trim().max(200).optional(),
  facebook_pixel_id: z.string().trim().max(50).optional(),
  gtm_id: z.string().trim().max(50).optional(),
  ga4_measurement_id: z.string().trim().max(50).optional(),
  gsc_verification_token: z.string().trim().max(200).optional(),
  owner_email: z.preprocess(emptyToUndefined, z.string().trim().email("Невалиден имейл").optional()),
  owner_phone: z.string().trim().max(30).optional(),
});
