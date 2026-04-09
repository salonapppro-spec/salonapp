import { z } from "zod";

export const ClientSchema = z.object({
  salon_slug: z.string().min(1),
  specialist_id: z.string().min(1).optional(),
  name: z.string().min(1),
  phone: z.string().min(3).optional(),
  email: z.string().email().optional(),
  notes: z.string().optional(),
});

