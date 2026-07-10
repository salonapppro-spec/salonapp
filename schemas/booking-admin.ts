import { z } from "zod";

export const AdminBookingPatchSchema = z
  .object({
    status: z.enum(["pending", "confirmed", "completed", "cancelled", "no_show"]).optional(),
    notes: z.string().max(2000).optional(),
    /** Преместване на час: двете полета се подават заедно. */
    booking_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    booking_time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/).optional(),
  })
  .refine(
    (v) =>
      v.status !== undefined ||
      (v.booking_date !== undefined && v.booking_time !== undefined),
    { message: "Подайте status или booking_date + booking_time." }
  );
