import { z } from "zod";

const Base = z.object({
  /** Optional in admin POST; server overwrites from session. */
  salon_slug: z.string().min(1, "Липсва салон").optional(),
  specialist_id: z.string().min(1).optional(),
  name: z.string().min(1, "Въведете име на услугата"),
  price_eur: z.number({ error: () => ({ message: "Невалидна цена" }) }).nonnegative("Цената не може да е отрицателна"),
  is_complex: z.boolean().default(false),
  duration_minutes: z
    .number({ error: () => ({ message: "Невалидна продължителност" }) })
    .int("Минутите са цяло число")
    .positive("Продължителността трябва да е положителна")
    .optional(),
  active_start_min: z.number({ error: () => ({ message: "Невалидна стойност" }) }).int().nonnegative().optional(),
  active_start_max: z.number({ error: () => ({ message: "Невалидна стойност" }) }).int().nonnegative().optional(),
  waiting_min: z.number({ error: () => ({ message: "Невалидна стойност" }) }).int().nonnegative().optional(),
  waiting_max: z.number({ error: () => ({ message: "Невалидна стойност" }) }).int().nonnegative().optional(),
  active_finish_min: z.number({ error: () => ({ message: "Невалидна стойност" }) }).int().nonnegative().optional(),
  active_finish_max: z.number({ error: () => ({ message: "Невалидна стойност" }) }).int().nonnegative().optional(),
});

export const CreateServiceSchema = Base.superRefine((val, ctx) => {
  if (val.is_complex) {
    const fields: Array<keyof typeof val> = [
      "active_start_min",
      "active_start_max",
      "waiting_min",
      "waiting_max",
      "active_finish_min",
      "active_finish_max",
    ];
    for (const f of fields) {
      if (val[f] === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [f],
          message: "Задължително за сложна услуга",
        });
      }
    }
  } else if (val.duration_minutes === undefined) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["duration_minutes"],
      message: "Задължително за проста услуга",
    });
  }
});
