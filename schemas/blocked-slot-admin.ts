import { z } from "zod";

function toMin(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

export const BlockedSlotCreateSchema = z
  .object({
    blocked_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    start_time: z.string().regex(/^\d{2}:\d{2}$/),
    end_time: z.string().regex(/^\d{2}:\d{2}$/),
    reason: z.string().max(300).optional(),
  })
  .superRefine((data, ctx) => {
    if (toMin(data.end_time) <= toMin(data.start_time)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Краят трябва да е след началото." });
    }
  });
