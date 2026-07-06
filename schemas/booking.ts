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

const PHONE_RE = /^[+0-9()[\]\s\-]{7,20}$/;

/** YYYY-MM-DD + реална календарна дата (2026-02-31 се отхвърля). */
const BookingDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Невалидна дата")
  .refine((s) => {
    const [y, m, d] = s.split("-").map(Number);
    const dt = new Date(Date.UTC(y, m - 1, d));
    return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
  }, "Невалидна дата");

const BookingTimeSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/, "Невалиден час");

const ClientEmailSchema = z.email("Невалиден имейл адрес").max(254, "Твърде дълъг имейл");

const trimString = (v: unknown): unknown => (typeof v === "string" ? v.trim() : v);

export const CreateBookingSchema = z.object({
  salon_slug: z.string().min(1, "Липсва салон"),
  specialist_id: z.string().uuid().optional(),
  service_id: z.string().uuid("Невалидна услуга"),
  booking_date: BookingDateSchema,
  booking_time: BookingTimeSchema,
  client_name: z.string().trim().min(1, "Въведете име").max(120, "Твърде дълго име"),
  client_phone: z.string().regex(PHONE_RE, "Невалиден телефон"),
  // Публичните форми изискват имейл — на него отиват потвърждението,
  // напомнянето и confirm/cancel линковете.
  client_email: z.preprocess(trimString, ClientEmailSchema),
  notes: z.string().max(1000, "Твърде дълга бележка").optional(),
  hair_length: z.preprocess(emptyToUndefined, HairLengthSchema.optional()),
  hair_density: z.preprocess(emptyToUndefined, HairDensitySchema.optional()),
});

export type CreateBookingInput = z.infer<typeof CreateBookingSchema>;

/**
 * Админ (QuickBooking): телефон и имейл са опционални — walk-in клиент може
 * да няма нито едното. Без телефон НЕ се създава/слива клиентски запис
 * (allowEmptyPhone в runCreateBooking) — така не възникват фантомни дубликати.
 * Празен низ = "не е подадено".
 */
export const AdminCreateBookingSchema = CreateBookingSchema.extend({
  client_phone: z.preprocess(
    (v) => emptyToUndefined(trimString(v)),
    z.string().regex(PHONE_RE, "Невалиден телефон").optional()
  ),
  client_email: z.preprocess(
    (v) => emptyToUndefined(trimString(v)),
    ClientEmailSchema.optional()
  ),
});

export type AdminCreateBookingInput = z.infer<typeof AdminCreateBookingSchema>;

/** Общ input за runCreateBooking — публичният вход е строго подмножество (винаги има имейл и телефон). */
export type BookingWriteInput = Omit<CreateBookingInput, "client_phone" | "client_email"> & {
  client_phone?: string;
  client_email?: string;
};

export const UpdateBookingStatusSchema = z.object({
  salon_slug: z.string().min(1, "Липсва салон"),
  booking_id: z.string().uuid("Невалидна резервация"),
  status: z.enum(["pending", "confirmed", "completed", "cancelled", "no_show"], {
    error: () => ({ message: "Невалиден статус" }),
  }),
});
