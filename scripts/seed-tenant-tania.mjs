/**
 * Provisioning на тенант "tania" (Фризьорски салон Таня, гр. Бургас).
 *
 * Прави същото, което прави `createTenantAction` в super-admin, плюс seed на
 * услуги, работно време и контакти — за да може сайтът да тръгне с реални данни.
 *
 * Идемпотентен: повторно пускане обновява (upsert), не дублира.
 * НЕ праща имейли — set-password линкът се печата в конзолата.
 *
 * Употреба (нужен е .env.local със SUPABASE_SERVICE_ROLE_KEY):
 *   node scripts/seed-tenant-tania.mjs           # dry-run — само показва какво ще запише
 *   node scripts/seed-tenant-tania.mjs --apply   # реален запис
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

// .env.local loader (без dotenv dependency) — както в scripts/migrate-images-webp.mjs
for (const line of readFileSync(".env.local", "utf8").replace(/^﻿/, "").split(/\r?\n/)) {
  const m = line.match(/^([A-Z_0-9]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim().replace(/^"|"$/g, "");
}

const URL_BASE = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL_BASE || !KEY) {
  console.error("Липсват NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY в .env.local");
  process.exit(1);
}

const APPLY = process.argv.includes("--apply");
const supabase = createClient(URL_BASE, KEY, { auth: { persistSession: false } });

const SLUG = "tania";
const OWNER_EMAIL = "tanyapapazova1@abv.bg";
const OWNER_PHONE = "+359897902333";
const ADDRESS = 'ул. „Цар Самуил" 64, гр. Бургас';

const TENANT = {
  salon_slug: SLUG,
  salon_name: "Фризьорски салон Таня",
  plan: "standard",
  status: "trial",
  payment_type: "bank",
  template: "bloom", // legacy поле — сайтът е уникален компонент, не шаблон
  owner_email: OWNER_EMAIL,
  owner_phone: OWNER_PHONE,
  phone: OWNER_PHONE,
  email: OWNER_EMAIL,
  address: ADDRESS,
  facebook_url: "https://www.facebook.com/profile.php?id=100054930985052&locale=bg_BG",
  google_maps_embed: `https://maps.google.com/maps?q=${encodeURIComponent(
    "ул. Цар Самуил 64, Бургас"
  )}&z=17&output=embed`,
  description:
    "Фризьорски салон Таня в центъра на Бургас — подстригване, боядисване, кичури, къдрене и официални прически. Запазете час онлайн.",
  hero_title: "Фризьорски салон Таня",
  hero_subtitle: "Бургас · ул. „Цар Самуил“ 64",
};

/**
 * Услугите от ценоразписа на клиента.
 * Името е във формат "Категория — вариант" — публичният сайт групира по него.
 * duration_minutes е задължително за календара; където листът дава диапазон,
 * взимаме ГОРНАТА граница (безопасно за графика), а цената е ДОЛНАТА ("от").
 */
const SERVICES = [
  // Подстригване
  ["Подстригване — дамско, къса коса", 15, 20],
  ["Подстригване — дамско, средна коса", 15, 20],
  ["Подстригване — дамско, дълга коса", 15, 30],
  ["Подстригване — мъжко", 15, 20],
  ["Подстригване — детско", 13, 20],
  ["Подстригване — бретон", 5, 10],

  // Измиване, изсушаване и стилизиране
  ["Измиване", 5, 10], // време не е посочено в ценоразписа — приема се 10 мин
  ["Изсушаване — къса коса", 15, 20],
  ["Изсушаване — средна коса", 20, 30],
  ["Изсушаване — дълга коса", 25, 60],
  ["Изправяне с преса — средна коса", 20, 30],
  ["Изправяне с преса — дълга коса", 25, 50],
  ["Оформяне с маша", 20, 60], // 20–40 € · 20–60 мин

  // Боядисване
  ["Боядисване — къса коса", 16, 40],
  ["Боядисване — средна коса", 20, 50],
  ["Боядисване — дълга коса", 25, 70],

  // Кичури
  ["Кичури с фолио — къса коса", 30, 90],
  ["Кичури с фолио — средна коса", 40, 120],
  ["Кичури с фолио — дълга коса", 60, 180],
  ["Кичури с шапка — къса коса", 30, 90],
  ["Кичури с шапка — средна коса", 40, 120],
  ["Кичури с шапка — дълга коса", 60, 180],

  // Къдрене
  ["Къдрене — къса коса", 30, 90],
  ["Къдрене — средна коса", 40, 120],
  ["Къдрене — дълга коса", 50, 180],

  // Официални прически
  ["Официална прическа", 20, 120], // 20–80 € · 30–120 мин

  // Брада, мустак и вежди
  ["Брада", 10, 20],
  ["Мустак", 3, 5],
  ["Врат", 3, 5],
  ["Вежди — оформяне", 3, 5],
  ["Вежди — с пинсета", 5, 5],
  ["Вежди — боядисване", 5, 20],
];

/** Понеделник–събота 09:30–18:00, неделя почивен. day_of_week: 0=неделя … 6=събота. */
const WORKING_HOURS = [0, 1, 2, 3, 4, 5, 6].map((day_of_week) => ({
  salon_slug: SLUG,
  specialist_id: null,
  day_of_week,
  start_time: "09:30",
  end_time: "18:00",
  is_day_off: day_of_week === 0,
}));

function log(...args) {
  console.log(...args);
}

async function main() {
  log(`\n${APPLY ? "APPLY" : "DRY-RUN"} · тенант "${SLUG}"\n${"─".repeat(52)}`);

  // ── 1. Тенант ────────────────────────────────────────────────
  const { data: existing, error: exErr } = await supabase
    .from("tenants")
    .select("id, salon_slug, salon_name")
    .eq("salon_slug", SLUG)
    .maybeSingle();
  if (exErr) throw exErr;

  if (existing) {
    log(`⚠  Тенант "${SLUG}" вече съществува (${existing.salon_name}).`);
    log("   Скриптът НЕ презаписва съществуващ тенант. Спирам.");
    log("   Ако това е очаквано, изтрий проверката съзнателно или почисти тенанта ръчно.");
    process.exit(2);
  }

  log(`1. tenants ← ${TENANT.salon_name} (plan=${TENANT.plan}, status=${TENANT.status})`);
  if (APPLY) {
    const { error } = await supabase.from("tenants").insert(TENANT);
    if (error) throw error;
  }

  // ── 2. Auth user за собственика ──────────────────────────────
  log(`2. auth user ← ${OWNER_EMAIL} (app_metadata: salon_slug=${SLUG}, role=owner)`);
  let setPasswordLink = null;
  if (APPLY) {
    const password = `${crypto.randomUUID()}Aa1!`;
    const created = await supabase.auth.admin.createUser({
      email: OWNER_EMAIL,
      password,
      email_confirm: true,
      user_metadata: { salon_slug: SLUG, plan: TENANT.plan, role: "owner" },
      app_metadata: { salon_slug: SLUG, role: "owner" },
    });
    if (created.error && !/already been registered/i.test(created.error.message)) throw created.error;

    // Същата логика като lib/owner-recovery-link.ts
    const redirectTo = `${(process.env.NEXT_PUBLIC_APP_URL ?? "https://salonapp.pro").replace(/\/$/, "")}/admin/reset-password`;
    const link = await supabase.auth.admin.generateLink({
      type: "recovery",
      email: OWNER_EMAIL,
      options: { redirectTo },
    });
    if (link.error) throw link.error;
    const props = link.data?.properties ?? {};
    setPasswordLink = props.hashed_token
      ? `${URL_BASE.replace(/\/$/, "")}/auth/v1/verify?token=${encodeURIComponent(props.hashed_token)}` +
        `&type=recovery&redirect_to=${encodeURIComponent(redirectTo)}`
      : (props.action_link ?? null);
  }

  // ── 3. Услуги ────────────────────────────────────────────────
  log(`3. services ← ${SERVICES.length} услуги`);
  if (APPLY) {
    const rows = SERVICES.map(([name, price_eur, duration_minutes]) => ({
      salon_slug: SLUG,
      specialist_id: null,
      name,
      price_eur,
      duration_minutes,
      is_complex: false,
      is_active: true,
    }));
    const { error } = await supabase.from("services").insert(rows);
    if (error) throw error;
  }

  // ── 4. Работно време ─────────────────────────────────────────
  log("4. working_hours ← Пн–Сб 09:30–18:00, неделя почивен");
  if (APPLY) {
    const { error } = await supabase
      .from("working_hours")
      .upsert(WORKING_HOURS, { onConflict: "salon_slug,specialist_id,day_of_week" });
    if (error) throw error;
  }

  // ── Готово ───────────────────────────────────────────────────
  log(`${"─".repeat(52)}`);
  if (!APPLY) {
    log("Нищо не е записано. Пусни отново с --apply.");
    return;
  }
  log("✓ Готово.");
  log(`  Сайт:            https://${SLUG}.salonapp.pro`);
  log(`  Админ панел:     https://salonapp.pro/admin`);
  log(`  Имейл за вход:   ${OWNER_EMAIL}`);
  log(`  Set-password:    ${setPasswordLink ?? "(не беше генериран — виж грешките по-горе)"}`);
}

main().catch((e) => {
  console.error("\n✗ Грешка:", e.message ?? e);
  process.exit(1);
});
