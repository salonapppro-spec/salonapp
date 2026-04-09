import { z } from "zod";

export const CreateTenantSchema = z.object({
  salon_slug: z
    .string()
    .min(2)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and dashes"),
  salon_name: z.string().min(1),
  plan: z.enum(["standard", "pro", "premium", "collective"]),
  template: z.enum(["bloom", "luxe", "clean", "zen", "bold"]).default("bloom"),
  owner_email: z.string().email().optional(),
  owner_phone: z.string().min(5).optional(),
});

