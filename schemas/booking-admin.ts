import { z } from "zod";

export const AdminBookingPatchSchema = z.object({
  status: z.enum(["pending", "confirmed", "completed", "cancelled", "no_show"]),
  notes: z.string().max(2000).optional(),
});
