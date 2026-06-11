import { z } from "zod";

export const FinancialSettingsPatchSchema = z.object({
  monthly_expenses: z.number().nonnegative().optional(),
  desired_salary: z.number().nonnegative().optional(),
  rent_eur: z.number().nonnegative().optional(),
  electricity_eur: z.number().nonnegative().optional(),
  water_eur: z.number().nonnegative().optional(),
  accounting_eur: z.number().nonnegative().optional(),
  monthly_revenue_goal_eur: z.number().nonnegative().optional(),
  working_days_per_week: z.number().int().min(1).max(7).optional(),
  working_hours_per_day: z.number().int().min(1).max(24).optional(),
  vat_enabled: z.boolean().optional(),
  booking_window_days: z.number().int().min(1).max(365).optional(),
  buffer_minutes: z.number().int().min(0).max(120).optional(),
  /** Минимално предизвестие за онлайн резервации днес (мин). */
  booking_min_notice_minutes: z.number().int().min(0).max(240).optional(),
  magnetic_scheduling: z.boolean().optional(),
});
