import { NextResponse } from "next/server";

import { requireAdminTenantSlugForApi } from "@/lib/admin-tenant";
import { getFinancialSettings } from "@/lib/data";
import { tenantDb } from "@/lib/tenant-db";
import { FinancialSettingsPatchSchema } from "@/schemas/financial-admin";

const DEFAULT_ROW = {
  monthly_expenses: 0,
  desired_salary: 0,
  rent_eur: 0,
  electricity_eur: 0,
  water_eur: 0,
  accounting_eur: 0,
  monthly_revenue_goal_eur: 0,
  working_days_per_week: 5,
  working_hours_per_day: 8,
  vat_enabled: false,
  booking_window_days: 30,
  buffer_minutes: 10,
  magnetic_scheduling: true,
} as const;

type PatchKeys = keyof typeof DEFAULT_ROW;

function mergeFinancialRow(
  current: Record<string, unknown> | null,
  patch: Partial<Record<PatchKeys, unknown>>
): Record<string, unknown> {
  const out: Record<string, unknown> = { ...DEFAULT_ROW };
  if (current) {
    for (const k of Object.keys(DEFAULT_ROW) as PatchKeys[]) {
      const v = current[k];
      if (v === undefined || v === null) continue;
      if (typeof DEFAULT_ROW[k] === "number") {
        const n = Number(v);
        if (!Number.isNaN(n)) out[k] = n;
      } else if (typeof DEFAULT_ROW[k] === "boolean") {
        out[k] = Boolean(v);
      } else {
        out[k] = v;
      }
    }
  }
  for (const k of Object.keys(patch) as PatchKeys[]) {
    const v = patch[k];
    if (v === undefined) continue;
    out[k] = v;
  }
  return out;
}

export async function PATCH(req: Request) {
  const a = await requireAdminTenantSlugForApi();
  if (!a.ok) return a.response;
  const salonSlug = a.slug;
  const body = (await req.json().catch(() => null)) as unknown;
  const parsed = FinancialSettingsPatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Невалидни данни", details: parsed.error.flatten() }, { status: 400 });
  }

  const current = await getFinancialSettings(salonSlug);
  const merged = mergeFinancialRow(current as Record<string, unknown> | null, parsed.data as Partial<Record<PatchKeys, unknown>>);
  if (current?.id) merged.id = current.id;

  const { data, error } = await tenantDb(salonSlug).financialSettings.upsert(merged);

  if (error) {
    const hint =
      error.message?.includes("rent_eur") || error.code === "PGRST204"
        ? " Липсват колони в БД — приложете миграцията supabase/migrations/003_financial_settings_fixed_costs.sql"
        : "";
    return NextResponse.json({ error: `Грешка при запис.${hint}`.trim() }, { status: 500 });
  }
  return NextResponse.json({ settings: data });
}
