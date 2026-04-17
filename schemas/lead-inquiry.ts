import { z } from "zod";

export const LeadInquirySchema = z.object({
  plan: z.enum(["standard", "pro", "premium", "collective"]),
  salon_name: z.string().trim().min(1, "Въведете име на салона").max(200),
  contact_name: z.string().trim().min(1, "Въведете име").max(120),
  email: z.string().trim().email("Невалиден имейл"),
  phone: z.string().trim().max(40).optional(),
  message: z.string().trim().max(2000).optional(),
  source: z.enum(["get-started", "pricing", "other"]).default("get-started"),
});

export type LeadInquiryInput = z.infer<typeof LeadInquirySchema>;
