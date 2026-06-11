/**
 * Еднократна миграция: всички съществуващи tenant изображения →
 * WebP (≤1920px, quality 82) + Cache-Control: 1 година.
 *
 * Качва под НОВ UUID path (старите файлове остават — URL-ите в базата
 * се обновяват към новите). Безопасно за повторно пускане: вече
 * мигрираните (.webp с дълъг cache) се прескачат.
 *
 * Употреба:
 *   node scripts/migrate-images-webp.mjs           # dry-run (само показва)
 *   node scripts/migrate-images-webp.mjs --apply   # реална миграция
 */
import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";

// .env.local loader (без dotenv dependency)
for (const line of readFileSync(".env.local", "utf8").replace(/^﻿/, "").split(/\r?\n/)) {
  const m = line.match(/^([A-Z_0-9]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
}

const URL_BASE = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL_BASE || !KEY) {
  console.error("Липсват NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY в .env.local");
  process.exit(1);
}
const APPLY = process.argv.includes("--apply");
const supabase = createClient(URL_BASE, KEY);
const BUCKET = "gallery";
const STORAGE_PREFIX = `${URL_BASE}/storage/v1/object/public/${BUCKET}/`;

const stats = { processed: 0, skipped: 0, failed: 0, savedKB: 0 };

/** Проверява дали URL-ът вече е мигриран (webp + дълъг cache). */
async function needsMigration(url) {
  try {
    const res = await fetch(url, { method: "HEAD" });
    if (!res.ok) return { needs: false, reason: `HTTP ${res.status}` };
    const cache = res.headers.get("cache-control") ?? "";
    const type = res.headers.get("content-type") ?? "";
    const size = Number(res.headers.get("content-length") ?? 0);
    const goodCache = /max-age=\d{5,}/.test(cache);
    const isWebp = type.includes("webp");
    if (goodCache && isWebp && size <= 250 * 1024) return { needs: false, reason: "вече ок" };
    return { needs: true, size };
  } catch (e) {
    return { needs: false, reason: `fetch error: ${e.message}` };
  }
}

/** Сваля, прекодира и качва. Връща новия публичен URL или null. */
async function migrateOne(url, salonSlug, label) {
  if (!url || !url.startsWith(STORAGE_PREFIX)) {
    if (url) console.log(`  ⏭ ${label}: външен URL, пропускам`);
    return null;
  }
  const check = await needsMigration(url);
  if (!check.needs) {
    console.log(`  ⏭ ${label}: ${check.reason}`);
    stats.skipped++;
    return null;
  }

  const res = await fetch(url);
  if (!res.ok) {
    console.log(`  ✗ ${label}: download failed (${res.status})`);
    stats.failed++;
    return null;
  }
  const input = Buffer.from(await res.arrayBuffer());

  let output;
  try {
    output = await sharp(input, { failOn: "error", limitInputPixels: 8192 * 8192 })
      .rotate()
      .resize({ width: 1920, height: 1920, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 82, effort: 5, smartSubsample: true })
      .toBuffer();
  } catch (e) {
    console.log(`  ✗ ${label}: transcode failed — ${e.message}`);
    stats.failed++;
    return null;
  }

  const oldKB = Math.round(input.length / 1024);
  const newKB = Math.round(output.length / 1024);
  const newPath = `${salonSlug}/settings/${randomUUID()}.webp`;

  if (!APPLY) {
    console.log(`  → ${label}: ${oldKB} KB → ${newKB} KB (dry-run)`);
    stats.processed++;
    stats.savedKB += oldKB - newKB;
    return null;
  }

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(newPath, output, { contentType: "image/webp", cacheControl: "31536000" });
  if (error) {
    console.log(`  ✗ ${label}: upload failed — ${error.message}`);
    stats.failed++;
    return null;
  }
  console.log(`  ✓ ${label}: ${oldKB} KB → ${newKB} KB`);
  stats.processed++;
  stats.savedKB += oldKB - newKB;
  return `${STORAGE_PREFIX}${newPath}`;
}

async function main() {
  console.log(APPLY ? "=== РЕАЛНА МИГРАЦИЯ ===" : "=== DRY-RUN (без промени; пусни с --apply) ===");

  const { data: tenants, error: tErr } = await supabase
    .from("tenants")
    .select("salon_slug, hero_image_url, logo_url, about_image_url, status")
    .in("status", ["active", "trial"]);
  if (tErr) throw tErr;

  for (const t of tenants) {
    console.log(`\n[${t.salon_slug}]`);
    const updates = {};
    for (const col of ["hero_image_url", "logo_url", "about_image_url"]) {
      const newUrl = await migrateOne(t[col], t.salon_slug, col);
      if (newUrl) updates[col] = newUrl;
    }
    if (APPLY && Object.keys(updates).length > 0) {
      const { error } = await supabase.from("tenants").update(updates).eq("salon_slug", t.salon_slug);
      if (error) console.log(`  ✗ DB update failed: ${error.message}`);
      else console.log(`  ✓ tenants ред обновен (${Object.keys(updates).join(", ")})`);
    }

    // Галерия
    const { data: gallery } = await supabase
      .from("gallery")
      .select("id, url")
      .eq("salon_slug", t.salon_slug);
    for (const g of gallery ?? []) {
      const newUrl = await migrateOne(g.url, t.salon_slug, `gallery #${g.id}`);
      if (APPLY && newUrl) {
        const { error } = await supabase.from("gallery").update({ url: newUrl }).eq("id", g.id);
        if (error) console.log(`  ✗ gallery DB update failed: ${error.message}`);
      }
    }

    // Специалисти
    const { data: specialists } = await supabase
      .from("specialists")
      .select("id, avatar_url")
      .eq("salon_slug", t.salon_slug);
    for (const sp of specialists ?? []) {
      const newUrl = await migrateOne(sp.avatar_url, t.salon_slug, `specialist #${sp.id}`);
      if (APPLY && newUrl) {
        const { error } = await supabase.from("specialists").update({ avatar_url: newUrl }).eq("id", sp.id);
        if (error) console.log(`  ✗ specialists DB update failed: ${error.message}`);
      }
    }
  }

  console.log(`\n=== РЕЗУЛТАТ ===`);
  console.log(`Обработени: ${stats.processed} | Пропуснати: ${stats.skipped} | Грешки: ${stats.failed}`);
  console.log(`Спестено: ${(stats.savedKB / 1024).toFixed(1)} MB`);
  if (!APPLY) console.log("Dry-run — нищо не е променено. Пусни с --apply за реална миграция.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
