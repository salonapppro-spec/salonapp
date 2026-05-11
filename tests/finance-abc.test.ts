import assert from "node:assert/strict";
import test from "node:test";

import {
  averageServiceDurationMinutes,
  averageWorkingDaysPerMonth,
  buildAbcRows,
  costPerMinuteEur,
  netPriceEur,
  productiveMinutesPerMonth,
  totalMonthlyOverheadEur,
} from "../lib/finance-abc";
import type { Service } from "../types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const WEEKS_PER_MONTH = 52 / 12;

function makeService(overrides: Partial<Service> = {}): Service {
  return {
    id: "svc-1",
    salon_slug: "test",
    specialist_id: null,
    name: "Test Service",
    price_eur: 60,
    duration_minutes: 60,
    is_complex: false,
    is_active: true,
    created_at: "2024-01-01T00:00:00Z",
    active_start_min: null,
    active_start_max: null,
    waiting_min: null,
    waiting_max: null,
    active_finish_min: null,
    active_finish_max: null,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// averageWorkingDaysPerMonth
// ---------------------------------------------------------------------------

test("averageWorkingDaysPerMonth: 5 working days/week", () => {
  const result = averageWorkingDaysPerMonth(5);
  assert.ok(Math.abs(result - 5 * WEEKS_PER_MONTH) < 0.001);
});

test("averageWorkingDaysPerMonth: 6 working days/week", () => {
  const result = averageWorkingDaysPerMonth(6);
  assert.ok(Math.abs(result - 6 * WEEKS_PER_MONTH) < 0.001);
});

test("averageWorkingDaysPerMonth: 7 working days/week (always open)", () => {
  const result = averageWorkingDaysPerMonth(7);
  assert.ok(Math.abs(result - 7 * WEEKS_PER_MONTH) < 0.001);
});

test("averageWorkingDaysPerMonth: 0 working days gives 0", () => {
  assert.equal(averageWorkingDaysPerMonth(0), 0);
});

// ---------------------------------------------------------------------------
// productiveMinutesPerMonth
// ---------------------------------------------------------------------------

test("productiveMinutesPerMonth: 5 days/week, 8 hours/day", () => {
  const expected = Math.round(5 * WEEKS_PER_MONTH * 8 * 60);
  assert.equal(productiveMinutesPerMonth(5, 8), expected);
});

test("productiveMinutesPerMonth: 6 days/week, 10 hours/day", () => {
  const expected = Math.round(6 * WEEKS_PER_MONTH * 10 * 60);
  assert.equal(productiveMinutesPerMonth(6, 10), expected);
});

test("productiveMinutesPerMonth: returns integer (Math.round applied)", () => {
  const result = productiveMinutesPerMonth(5, 8);
  assert.equal(result, Math.round(result));
});

// ---------------------------------------------------------------------------
// totalMonthlyOverheadEur
// ---------------------------------------------------------------------------

test("totalMonthlyOverheadEur: sums all expense categories", () => {
  const result = totalMonthlyOverheadEur({
    rent_eur: 500,
    electricity_eur: 50,
    water_eur: 30,
    accounting_eur: 100,
    desired_salary: 2000,
    other_monthly_expenses: 200,
  });
  assert.equal(result, 2880);
});

test("totalMonthlyOverheadEur: all zeros gives 0", () => {
  assert.equal(
    totalMonthlyOverheadEur({
      rent_eur: 0,
      electricity_eur: 0,
      water_eur: 0,
      accounting_eur: 0,
      desired_salary: 0,
      other_monthly_expenses: 0,
    }),
    0
  );
});

test("totalMonthlyOverheadEur: handles decimal values", () => {
  const result = totalMonthlyOverheadEur({
    rent_eur: 500.5,
    electricity_eur: 49.5,
    water_eur: 0,
    accounting_eur: 0,
    desired_salary: 0,
    other_monthly_expenses: 0,
  });
  assert.equal(result, 550);
});

test("totalMonthlyOverheadEur: coerces string numbers (Number() cast)", () => {
  // In practice the DB may return strings for numeric columns
  const result = totalMonthlyOverheadEur({
    rent_eur: "300" as unknown as number,
    electricity_eur: "50" as unknown as number,
    water_eur: "0" as unknown as number,
    accounting_eur: "0" as unknown as number,
    desired_salary: "0" as unknown as number,
    other_monthly_expenses: "0" as unknown as number,
  });
  assert.equal(result, 350);
});

// ---------------------------------------------------------------------------
// costPerMinuteEur
// ---------------------------------------------------------------------------

test("costPerMinuteEur: 2880 overhead / 10400 minutes ≈ 0.277", () => {
  const result = costPerMinuteEur(2880, 10400);
  assert.ok(Math.abs(result - 2880 / 10400) < 0.0001);
});

test("costPerMinuteEur: zero productive minutes returns 0 (no division by zero)", () => {
  assert.equal(costPerMinuteEur(2880, 0), 0);
});

test("costPerMinuteEur: negative productive minutes returns 0", () => {
  assert.equal(costPerMinuteEur(2880, -1), 0);
});

test("costPerMinuteEur: zero overhead gives 0 cost per minute", () => {
  assert.equal(costPerMinuteEur(0, 10000), 0);
});

// ---------------------------------------------------------------------------
// netPriceEur
// ---------------------------------------------------------------------------

test("netPriceEur: with VAT enabled, 120 gross → 100 net (÷1.2)", () => {
  const result = netPriceEur(120, true);
  assert.ok(Math.abs(result - 100) < 0.001);
});

test("netPriceEur: with VAT disabled, price unchanged", () => {
  assert.equal(netPriceEur(120, false), 120);
  assert.equal(netPriceEur(0, false), 0);
  assert.equal(netPriceEur(50, false), 50);
});

test("netPriceEur: VAT calculation for common salon prices", () => {
  // 60 EUR gross → 50 EUR net
  assert.ok(Math.abs(netPriceEur(60, true) - 50) < 0.001);
  // 30 EUR gross → 25 EUR net
  assert.ok(Math.abs(netPriceEur(30, true) - 25) < 0.001);
});

test("netPriceEur: zero price stays zero with VAT", () => {
  assert.equal(netPriceEur(0, true), 0);
});

// ---------------------------------------------------------------------------
// averageServiceDurationMinutes
// ---------------------------------------------------------------------------

test("averageServiceDurationMinutes: simple service returns duration_minutes", () => {
  assert.equal(averageServiceDurationMinutes(makeService({ duration_minutes: 45 })), 45);
  assert.equal(averageServiceDurationMinutes(makeService({ duration_minutes: 90 })), 90);
});

test("averageServiceDurationMinutes: simple service with null returns 1 (floor at 1)", () => {
  assert.equal(averageServiceDurationMinutes(makeService({ duration_minutes: null })), 1);
});

test("averageServiceDurationMinutes: simple service with 0 returns 1 (floor at 1)", () => {
  assert.equal(averageServiceDurationMinutes(makeService({ duration_minutes: 0 })), 1);
});

test("averageServiceDurationMinutes: complex service averages min+max for each phase", () => {
  const svc = makeService({
    is_complex: true,
    duration_minutes: null,
    // active_start: 20-40 → avg 30
    active_start_min: 20,
    active_start_max: 40,
    // waiting: 30-60 → avg 45
    waiting_min: 30,
    waiting_max: 60,
    // active_finish: 10-20 → avg 15
    active_finish_min: 10,
    active_finish_max: 20,
  });
  // 30 + 45 + 15 = 90
  assert.equal(averageServiceDurationMinutes(svc), 90);
});

test("averageServiceDurationMinutes: complex service with equal min/max equals that value", () => {
  const svc = makeService({
    is_complex: true,
    duration_minutes: null,
    active_start_min: 30,
    active_start_max: 30,
    waiting_min: 60,
    waiting_max: 60,
    active_finish_min: 15,
    active_finish_max: 15,
  });
  assert.equal(averageServiceDurationMinutes(svc), 105);
});

// ---------------------------------------------------------------------------
// buildAbcRows
// ---------------------------------------------------------------------------

test("buildAbcRows: inactive services are excluded", () => {
  const services = [
    makeService({ id: "a", name: "Active", is_active: true, price_eur: 60 }),
    makeService({ id: "b", name: "Inactive", is_active: false, price_eur: 60 }),
  ];
  const rows = buildAbcRows(services, 0, false);
  assert.equal(rows.length, 1);
  assert.equal(rows[0]!.serviceId, "a");
});

test("buildAbcRows: profitEur = netPrice - cost", () => {
  const services = [makeService({ price_eur: 60, duration_minutes: 60 })];
  // cpm = 0.5 EUR/min, no VAT
  const rows = buildAbcRows(services, 0.5, false);
  assert.equal(rows.length, 1);
  const row = rows[0]!;
  assert.equal(row.priceGrossEur, 60);
  assert.equal(row.priceNetEur, 60); // VAT disabled
  assert.equal(row.costEur, 30); // 60min * 0.5 EUR/min
  assert.equal(row.profitEur, 30); // 60 - 30
});

test("buildAbcRows: marginBand low when margin < 20%", () => {
  // 80 EUR price, 70 EUR cost → margin ~12.5%
  const services = [makeService({ price_eur: 80, duration_minutes: 140 })];
  const rows = buildAbcRows(services, 0.5, false); // cost = 70
  assert.equal(rows[0]!.marginBand, "low");
});

test("buildAbcRows: marginBand mid when 20% ≤ margin < 40%", () => {
  // 60 EUR price, 40 EUR cost → margin ~33.3%
  const services = [makeService({ price_eur: 60, duration_minutes: 80 })];
  const rows = buildAbcRows(services, 0.5, false); // cost = 40
  assert.equal(rows[0]!.marginBand, "mid");
});

test("buildAbcRows: marginBand high when margin ≥ 40%", () => {
  // 60 EUR price, 0 EUR cost → margin 100%
  const services = [makeService({ price_eur: 60, duration_minutes: 60 })];
  const rows = buildAbcRows(services, 0, false);
  assert.equal(rows[0]!.marginBand, "high");
});

test("buildAbcRows: applies VAT correctly to net price and profit", () => {
  const services = [makeService({ price_eur: 120, duration_minutes: 60 })];
  // cpm = 0, VAT enabled: netPrice = 120 / 1.2 = 100
  const rows = buildAbcRows(services, 0, true);
  const row = rows[0]!;
  assert.equal(row.priceGrossEur, 120);
  assert.ok(Math.abs(row.priceNetEur - 100) < 0.001);
  assert.ok(Math.abs(row.profitEur - 100) < 0.001); // cost=0
  assert.ok(Math.abs(row.marginPercent - 100) < 0.001);
  assert.equal(row.marginBand, "high");
});

test("buildAbcRows: empty services list returns empty array", () => {
  assert.deepEqual(buildAbcRows([], 0.5, false), []);
});

test("buildAbcRows: zero price service has 0 marginPercent", () => {
  const services = [makeService({ price_eur: 0, duration_minutes: 60 })];
  const rows = buildAbcRows(services, 0.5, false);
  assert.equal(rows[0]!.marginPercent, 0);
});
