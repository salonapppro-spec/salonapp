import { z } from "zod";

export const CreateTenantSchema = z.object({
  salon_slug: z
    .string()
    .min(2, "Минимум 2 знака")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Само малки латински букви, цифри и тире"),
  salon_name: z.string().min(1, "Въведете име на салона"),
  plan: z.enum(["standard", "pro", "premium", "collective"], {
    error: () => ({ message: "Изберете план" }),
  }),
  template: z.enum(["bloom", "luxe", "clean", "zen", "bold"], {
    error: () => ({ message: "Изберете шаблон" }),
  }).default("bloom"),
  owner_email: z.string().email("Невалиден имейл").optional(),
  owner_phone: z.string().min(5, "Въведете валиден телефон").optional(),
});
