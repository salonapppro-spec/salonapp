import { z } from "zod";

const DaySchema = z.object({
  start_time: z.string().regex(/^\d{2}:\d{2}$/),
  end_time: z.string().regex(/^\d{2}:\d{2}$/),
  is_day_off: z.boolean(),
});

function toMin(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

export const WorkingHoursPutSchema = z
  .object({
    days: z.array(DaySchema).length(7),
  })
  .superRefine((data, ctx) => {
    data.days.forEach((d, i) => {
      if (d.is_day_off) return;
      if (toMin(d.end_time) <= toMin(d.start_time)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Ден ${i}: краят трябва да е след началото.`,
          path: ["days", i],
        });
      }
    });
  });

export type WorkingHoursPutInput = z.infer<typeof WorkingHoursPutSchema>;
