import { z } from "zod";

const HairLengthSchema = z.enum(["short", "medium", "long"], {
  error: () => ({ message: "Изберете дължина на косата" }),
});
const HairDensitySchema = z.enum(["thin", "medium", "thick"], {
  error: () => ({ message: "Изберете гъстота на косата" }),
});

/** Празен низ от формуляр не трябва да стига до DB — CHECK приема само enum или NULL. */
function emptyToUndefined(v: unknown): unknown {
  if (v === "" || v === null) return undefined;
  return v;
}

export const CreateBookingSchema = z.object({
  salon_slug: z.string().min(1, "Липсва салон"),
  specialist_id: z.string().uuid().optional(),
  service_id: z.string().uuid("Невалидна услуга"),
  booking_date: z.string().min(1, "Изберете дата"),
  booking_time: z.string().min(1, "Изберете час"),
  client_name: z.string().min(1, "Въведете име"),
  client_phone: z.string().regex(/^[+0-9()[\]\s\-]{7,20}$/, "Невалиден телефон"),
  client_email: z.string().email("Невалиден имейл").optional(),
  notes: z.string().optional(),
  hair_length: z.preprocess(emptyToUndefined, HairLengthSchema.optional()),
  hair_density: z.preprocess(emptyToUndefined, HairDensitySchema.optional()),
});

export type CreateBookingInput = z.infer<typeof CreateBookingSchema>;

export const UpdateBookingStatusSchema = z.object({
  salon_slug: z.string().min(1, "Липсва салон"),
  booking_id: z.string().uuid("Невалидна резервация"),
  status: z.enum(["pending", "confirmed", "completed", "cancelled", "no_show"], {
    error: () => ({ message: "Невалиден статус" }),
  }),
});
