#!/usr/bin/env node
/**
 * Локално качване на снимки за The Skin „Козметика“ (или друг салон).
 *
 * Изисква NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
 * (зареждат се от средата или от `.env.local` с прости KEY=value редове).
 *
 * Използване:
 *   node scripts/upload-product-images.mjs theskin ./staging-upload-products/theskin
 *
 * Автоматично свързване към редовете в БД по ред на файловете (/bg сортировка по име):
 *   node scripts/upload-product-images.mjs theskin ./staging-upload-products/theskin --apply
 *   npm run upload:product-images -- theskin ./staging-upload-products/theskin --apply
 *
 * Без --apply — само качва и печата URL за ръчно копиране в tenants.design_tokens.
 */

import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

const ALLOWED_EXT = /** @type {const} */ ([".jpg", ".jpeg", ".png", ".webp"]);

const MIME = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

function loadEnvLocal() {
  for (const name of [".env.local", ".env"]) {
    try {
      const fp = path.join(process.cwd(), name);
      const raw = readFileSync(fp, "utf8");
      for (let line of raw.split(/\r?\n/)) {
        line = line.trim();
        if (!line || line.startsWith("#")) continue;
        const eq = line.indexOf("=");
        if (eq < 1) continue;
        const key = line.slice(0, eq).trim();
        let val = line.slice(eq + 1).trim();
        if (
          (val.startsWith('"') && val.endsWith('"')) ||
          (val.startsWith("'") && val.endsWith("'"))
        ) {
          val = val.slice(1, -1);
        }
        if (!(key in process.env) || process.env[key] === "") {
          process.env[key] = val;
        }
      }
    } catch {
      /* no file */
    }
  }
}

function extOf(fname) {
  const i = fname.lastIndexOf(".");
  return i >= 0 ? fname.slice(i).toLowerCase() : "";
}

async function main() {
  loadEnvLocal();
  const argv = process.argv.slice(2);
  const applyToDb = argv.includes("--apply");
  const positional = argv.filter((a) => !a.startsWith("--"));
  const slugRaw = positional[0] ?? "";
  const folderRaw = positional[1] ?? "";
  const salonSlug = slugRaw.trim().toLowerCase();
  const folderAbs = folderRaw
    ? path.resolve(folderRaw.trim())
    : path.join(process.cwd(), "staging-upload-products", salonSlug || "salon-slug");

  if (!/^[-a-z0-9]+$/.test(salonSlug)) {
    console.error(
      'Подай салон-слъг: node scripts/upload-product-images.mjs theskin "./staging-upload-products/theskin"',
    );
    process.exit(1);
  }

  let stat;
  try {
    stat = statSync(folderAbs, { throwIfNoEntry: false });
  } catch {
    stat = null;
  }
  if (!stat?.isDirectory()) {
    console.error(`Папката не съществува или не е директория:\n${folderAbs}`);
    process.exit(1);
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const sr = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  if (!url || !sr) {
    console.error(
      "Липсват NEXT_PUBLIC_SUPABASE_URL или SUPABASE_SERVICE_ROLE_KEY (.env.local или env).",
    );
    process.exit(1);
  }

  const bucket = process.env.ADMIN_GALLERY_BUCKET ?? "gallery";
  const files = readdirSync(folderAbs)
    .filter((name) => {
      const e = extOf(name);
      return ALLOWED_EXT.includes(e) && statSync(path.join(folderAbs, name)).isFile();
    })
    .sort((a, b) => a.localeCompare(b, "bg"));

  if (files.length === 0) {
    console.error(
      `В папката няма .jpg/.png/.webp:\n${folderAbs}\n\nСложете снимките и опитайте отново.`,
    );
    process.exit(1);
  }

  const supabase = createClient(url, sr, { auth: { persistSession: false } });

  console.log(`Качване в bucket "${bucket}" под ${salonSlug}/products/ …\n`);

  /** @type {{ file: string; publicUrl: string }[]} */
  const results = [];

  for (const file of files) {
    const ext = extOf(file);
    const contentType = MIME[ext];
    const buf = readFileSync(path.join(folderAbs, file));
    const storagePath = `${salonSlug}/products/${randomUUID()}${ext}`;

    const { error } = await supabase.storage.from(bucket).upload(storagePath, buf, {
      contentType,
      upsert: false,
    });

    if (error) {
      console.error(`Грешка за ${file}:`, error.message);
      process.exit(1);
    }

    const { data: pub } = supabase.storage.from(bucket).getPublicUrl(storagePath);
    results.push({ file, publicUrl: pub.publicUrl });
  }

  if (!applyToDb) {
    console.log("— Готово. Добави в tenants.design_tokens → products[].image_url по подредба:\n");
    results.forEach((r, i) => {
      console.log(`${i + 1}. (${r.file})\n   ${r.publicUrl}\n`);
    });
    console.log("(Повтори с --apply за автоматичен merge в базата по същия ред.)");
    return;
  }

  const { data: row, error: fetchErr } = await supabase
    .from("tenants")
    .select("design_tokens")
    .eq("salon_slug", salonSlug)
    .maybeSingle();

  if (fetchErr) {
    console.error("Неуспешно четене на tenants.design_tokens:", fetchErr.message);
    process.exit(1);
  }
  if (!row) {
    console.error(`Няма ред в tenants за salon_slug=${salonSlug}.`);
    process.exit(1);
  }

  const rawDt = row.design_tokens;
  const dt =
    rawDt !== null && typeof rawDt === "object" && !Array.isArray(rawDt)
      ? /** @type {Record<string, unknown>} */ ({ ...rawDt })
      : {};

  const rawProducts = dt.products;
  if (!Array.isArray(rawProducts) || rawProducts.length === 0) {
    console.error(
      "В design_tokens няма products[] или е празно. Добави поне един продукт (име/описание) в tenants.design_tokens в Supabase.",
    );
    process.exit(1);
  }

  /** @type {Record<string, unknown>[]} */
  const productsNext = rawProducts.map((item) =>
    item !== null && typeof item === "object" && !Array.isArray(item)
      ? /** @type {Record<string, unknown>} */ ({ ...item })
      : {},
  );

  const nApply = Math.min(results.length, productsNext.length);
  if (results.length > productsNext.length) {
    console.warn(
      `Предупреждение: ${results.length} снимки, но само ${productsNext.length} продукта. Ползват се първите ${productsNext.length} URL.`,
    );
  }
  if (results.length < productsNext.length) {
    console.warn(
      `Забележка: ${results.length} снимки за ${productsNext.length} продукта — очакваните продукти без нова снимка запазват старото image_url (ако има).`,
    );
  }

  for (let i = 0; i < nApply; i++) {
    productsNext[i].image_url = results[i].publicUrl;
    delete productsNext[i].image;
  }

  const design_tokens = { ...dt, products: productsNext };

  const { error: upErr } = await supabase.from("tenants").update({ design_tokens }).eq("salon_slug", salonSlug);

  if (upErr) {
    console.error("Неуспешен update на design_tokens:", upErr.message);
    process.exit(1);
  }

  console.log(`— Обновено tenants.design_tokens.products[0…${String(nApply - 1)}].image_url за ${salonSlug}:\n`);
  for (let i = 0; i < nApply; i++) {
    const pname =
      typeof productsNext[i].name === "string" && productsNext[i].name.trim()
        ? `"${productsNext[i].name.trim()}"`
        : `#${String(i + 1)}`;
    console.log(`${i + 1}. ${pname} ← ${results[i].file}\n   ${results[i].publicUrl}\n`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
