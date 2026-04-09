import { z } from "zod";

const HairLengthSchema = z.enum(["къса", "средна", "дълга"]);
const HairDensitySchema = z.enum(["рядка", "средна", "гъста"]);

export const CreateBookingSchema = z.object({
  salon_slug: z.string().min(1),
  specialist_id: z.string().min(1).optional(),
  service_id: z.string().uuid().optional(),
  service_name: z.string().min(1),
  service_price_eur: z.number().nonnegative(),
  service_duration: z.number().int().positive(),
  booking_date: z.string().min(1), // ISO date, validated at runtime in route
  booking_time: z.string().min(1), // HH:mm
  client_name: z.string().min(1),
  client_phone: z.string().min(3).optional(),
  client_email: z.string().email().optional(),
  notes: z.string().optional(),
  hair_length: HairLengthSchema.optional(),
  hair_density: HairDensitySchema.optional(),
});

export const UpdateBookingStatusSchema = z.object({
  salon_slug: z.string().min(1),
  booking_id: z.string().uuid(),
  status: z.enum(["pending", "confirmed", "completed", "cancelled", "no_show"]),
});

