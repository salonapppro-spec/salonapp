import test from "node:test";
import assert from "node:assert/strict";

import { groupServices, shortName, eurLabel, bgnLabel, durationLabel } from "@/components/tenants/tania/data";
import type { Service } from "@/types/database";

/**
 * Точните имена на услугите, както са записани в базата за `tania`.
 * Сайтът групира по префикс, затова преименуване в админ панела може мълчаливо
 * да размести ценоразписа — тези тестове хващат това.
 */
const DB_SERVICE_NAMES = [
  "Подстригване — дамско, къса коса",
  "Подстригване — дамско, средна коса",
  "Подстригване — дамско, дълга коса",
  "Подстригване — мъжко",
  "Подстригване — детско",
  "Подстригване — бретон",
  "Измиване",
  "Изсушаване — къса коса",
  "Изсушаване — средна коса",
  "Изсушаване — дълга коса",
  "Изправяне с преса — средна коса",
  "Изправяне с преса — дълга коса",
  "Оформяне с маша",
  "Боядисване — къса коса",
  "Боядисване — средна коса",
  "Боядисване — дълга коса",
  "Кичури с фолио — къса коса",
  "Кичури с фолио — средна коса",
  "Кичури с фолио — дълга коса",
  "Кичури с шапка — къса коса",
  "Кичури с шапка — средна коса",
  "Кичури с шапка — дълга коса",
  "Къдрене — къса коса",
  "Къдрене — средна коса",
  "Къдрене — дълга коса",
  "Официална прическа",
  "Брада",
  "Мустак",
  "Врат",
  "Вежди — оформяне",
  "Вежди — с пинсета",
  "Вежди — боядисване",
];

function svc(name: string, price = 15, duration: number | null = 20, isActive = true): Service {
  return {
    id: `id-${name}`,
    salon_slug: "tania",
    specialist_id: null,
    name,
    price_eur: price,
    duration_minutes: duration,
    is_complex: false,
    active_start_min: null,
    active_start_max: null,
    waiting_min: null,
    waiting_max: null,
    active_finish_min: null,
    active_finish_max: null,
    is_active: isActive,
    created_at: null,
  };
}

const dbServices = DB_SERVICE_NAMES.map((n) => svc(n));

test("tania: всяка услуга от базата попада в група и нищо не се губи", () => {
  const groups = groupServices(dbServices);
  const total = groups.reduce((n, g) => n + g.items.length, 0);
  assert.equal(total, DB_SERVICE_NAMES.length);
});

test("tania: нито една услуга не пада в „Други услуги“", () => {
  const groups = groupServices(dbServices);
  assert.equal(groups.find((g) => g.title === "Други услуги"), undefined);
});

test("tania: показваните имена в една група са уникални", () => {
  for (const g of groupServices(dbServices)) {
    const labels = g.items.map((s) => shortName(s.name, g.title));
    assert.equal(
      new Set(labels).size,
      labels.length,
      `Дублирани имена в група „${g.title}“: ${labels.join(", ")}`
    );
  }
});

test("tania: изсушаване и изправяне с преса не се сливат в едно име", () => {
  const groups = groupServices(dbServices);
  const dry = groups.find((g) => g.title === "Изсушаване");
  const iron = groups.find((g) => g.title === "Изправяне с преса");
  assert.ok(dry && iron);
  assert.deepEqual(dry.items.map((s) => shortName(s.name, dry.title)), ["къса коса", "средна коса", "дълга коса"]);
  assert.deepEqual(iron.items.map((s) => shortName(s.name, iron.title)), ["средна коса", "дълга коса"]);
});

test("tania: непозната услуга отива в „Други услуги“, а не изчезва", () => {
  const groups = groupServices([...dbServices, svc("Ново нещо от админ панела", 12, 15)]);
  const other = groups.find((g) => g.title === "Други услуги");
  assert.ok(other);
  assert.deepEqual(other.items.map((s) => s.name), ["Ново нещо от админ панела"]);
});

test("tania: неактивните услуги не се показват", () => {
  const groups = groupServices([svc("Подстригване — мъжко", 15, 20, false)]);
  assert.deepEqual(groups, []);
});

test("tania: цените се показват в евро и лева, с „от“ за диапазоните", () => {
  assert.equal(eurLabel(svc("Подстригване — мъжко", 15)), "15 €");
  assert.equal(bgnLabel(svc("Подстригване — мъжко", 15)), "29.34 лв");
  assert.equal(eurLabel(svc("Оформяне с маша", 20)), "от 20 €");
  assert.equal(eurLabel(svc("Официална прическа", 20)), "от 20 €");
});

test("tania: цена като низ от Postgres numeric се форматира правилно", () => {
  const asString = { ...svc("Подстригване — мъжко"), price_eur: "15" as unknown as number };
  assert.equal(eurLabel(asString), "15 €");
  assert.equal(bgnLabel(asString), "29.34 лв");
});

test("tania: времетраенето се изписва на български", () => {
  assert.equal(durationLabel(20), "20 мин");
  assert.equal(durationLabel(60), "1 ч");
  assert.equal(durationLabel(70), "1 ч 10 мин");
  assert.equal(durationLabel(null), null);
  assert.equal(durationLabel(0), null);
});
