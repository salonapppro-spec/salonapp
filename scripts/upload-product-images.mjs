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
 * След успех — копирай отпечатаните https URL в `tenants.design_tokens.products[].image_url`.
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
  const [, , slugRaw, folderRaw] = process.argv;
  const salonSlug = (slugRaw ?? "").trim().toLowerCase();
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

  console.log("— Готово. Добави в tenants.design_tokens → products[].image_url по подредба:\n");
  results.forEach((r, i) => {
    console.log(`${i + 1}. (${r.file})\n   ${r.publicUrl}\n`);
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
