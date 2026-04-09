import { z } from "zod";

const Base = z.object({
  salon_slug: z.string().min(1),
  specialist_id: z.string().min(1).optional(),
  name: z.string().min(1),
  price_eur: z.number().nonnegative(),
  is_complex: z.boolean().default(false),
  duration_minutes: z.number().int().positive().optional(),
  active_start_min: z.number().int().nonnegative().optional(),
  active_start_max: z.number().int().nonnegative().optional(),
  waiting_min: z.number().int().nonnegative().optional(),
  waiting_max: z.number().int().nonnegative().optional(),
  active_finish_min: z.number().int().nonnegative().optional(),
  active_finish_max: z.number().int().nonnegative().optional(),
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
          message: "Required for complex services",
        });
      }
    }
  } else {
    if (val.duration_minutes === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["duration_minutes"],
        message: "Required for simple services",
      });
    }
  }
});

