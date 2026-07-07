import assert from "node:assert/strict";
import test from "node:test";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

import { CreateTenantSchema } from "../schemas/tenant";
import { PLAN_IDS } from "../lib/marketing-data";

// ---------------------------------------------------------------------------
// Плащания/тарифи: консистентност на plan стойностите (одит 2026-07-06, C1).
// Плановете бяха преименувани (026/032): starter/standard/pro/premium.
// Този файл пази код ↔ схеми ↔ миграции да не се разминават отново.
// ---------------------------------------------------------------------------

const CODE_PLANS = ["starter", "standard", "pro", "premium"] as const;

function migrationsDir(): string {
  return path.join(process.cwd(), "supabase", "migrations");
}

function readAllMigrations(): string {
  const dir = migrationsDir();
  return readdirSync(dir)
    .filter((f) => f.endsWith(".sql"))
    .sort()
    .map((f) => readFileSync(path.join(dir, f), "utf8"))
    .join("\n");
}

test("plan: PLAN_IDS в кода съвпада с очаквания набор след преименуването", () => {
  assert.deepEqual([...PLAN_IDS].sort(), [...CODE_PLANS].sort());
});

test("plan: CreateTenantSchema приема всички текущи планове", () => {
  for (const plan of CODE_PLANS) {
    const r = CreateTenantSchema.safeParse({
      salon_slug: "test-salon",
      salon_name: "Test Salon",
      plan,
      template: "bloom",
    });
    assert.ok(r.success, `План ${plan} трябва да е валиден: ${JSON.stringify(r.success ? null : r.error.issues)}`);
  }
});

test("plan: CreateTenantSchema отхвърля legacy 'collective'", () => {
  const r = CreateTenantSchema.safeParse({
    salon_slug: "test-salon",
    salon_name: "Test Salon",
    plan: "collective",
    template: "bloom",
  });
  assert.equal(r.success, false);
});

test("plan: platform_leads CHECK в миграциите позволява 'starter'", () => {
  const sql = readAllMigrations();
  // Миграция 032 поправи platform_leads_plan_check — не бива да изчезва.
  assert.match(
    sql,
    /platform_leads_plan_check[\s\S]{0,200}starter/,
    "platform_leads_plan_check трябва да включва 'starter' (миграция 032)"
  );
});

// Одит C1: tenants_plan_check се поправя от миграция 038 (преди това беше
// само директно в production) — тестът пази последната дефиниция в repo-то.
test("plan: tenants CHECK в миграциите позволява 'starter'", () => {
  const dir = migrationsDir();
  const files = readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();

  // Търсим ПОСЛЕДНАТА дефиниция на plan check за tenants в реда на миграциите.
  let lastTenantsPlanCheck: string | null = null;
  for (const f of files) {
    const sql = readFileSync(path.join(dir, f), "utf8");
    // 001: inline "plan text ... check (plan in (...))" в CREATE TABLE tenants
    // или по-късно: ALTER TABLE tenants ... tenants_plan_check CHECK (...)
    const alterMatch = sql.match(/ALTER TABLE\s+(?:public\.)?tenants[\s\S]{0,400}?plan[\s\S]{0,400}?CHECK\s*\(([^;]+)\)/i);
    if (alterMatch) lastTenantsPlanCheck = alterMatch[1];
    const createMatch = sql.match(/create table (?:public\.)?tenants[\s\S]*?check \(plan in \(([^)]+)\)\)/i);
    if (createMatch && !lastTenantsPlanCheck) lastTenantsPlanCheck = createMatch[1];
  }

  assert.ok(lastTenantsPlanCheck, "Не е намерен plan CHECK за tenants в миграциите");
  for (const plan of CODE_PLANS) {
    assert.ok(
      lastTenantsPlanCheck!.includes(`'${plan}'`),
      `tenants plan CHECK не включва '${plan}' — insert от createTenantAction ще гърми на чиста среда`
    );
  }
});

test("plan: миграция 026 (rename) съществува и покрива и tenants, и platform_leads", () => {
  const sql = readAllMigrations();
  assert.match(sql, /UPDATE tenants[\s\S]{0,300}WHEN 'collective' THEN 'premium'/);
  assert.match(sql, /UPDATE platform_leads[\s\S]{0,300}WHEN 'collective' THEN 'premium'/);
});
