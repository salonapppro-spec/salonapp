import { z } from "zod";

export const ClientSchema = z.object({
  salon_slug: z.string().min(1, "Липсва салон"),
  specialist_id: z.string().min(1).optional(),
  name: z.string().min(1, "Въведете име"),
  phone: z.string().min(3, "Въведете телефон").optional(),
  email: z.string().email("Невалиден имейл").optional(),
  notes: z.string().optional(),
});
