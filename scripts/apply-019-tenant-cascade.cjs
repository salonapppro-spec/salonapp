/**
 * Прилага supabase/migrations/019_tenant_salon_slug_on_update_cascade.sql
 * върху Postgres, достъпен чрез DATABASE_URL.
 *
 * Настройка (Supabase Dashboard → Project Settings → Database):
 *  - "Connection string" → URI, режим "Transaction" (pooler) или "Direct"
 *  - Паролата е database password, не service_role JWT.
 * Добави в .env.local:
 *   DATABASE_URL="postgresql://postgres.[ref]:[password]@aws-0-....pooler.supabase.com:6543/postgres?sslmode=require"
 *
 * Запуск: node scripts/apply-019-tenant-cascade.cjs
 */
const fs = require("fs");
const path = require("path");
const { Client } = require("pg");

function loadEnvLocal() {
  const p = path.join(__dirname, "..", ".env.local");
  if (!fs.existsSync(p)) return;
  const text = fs.readFileSync(p, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!m) continue;
    const key = m[1];
    let v = m[2].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    if (process.env[key] === undefined) process.env[key] = v;
  }
}

loadEnvLocal();

const url = process.env.DATABASE_URL || process.env.DIRECT_URL;
if (!url) {
  console.error(
    "Липсва DATABASE_URL. Добави connection string (с паролата на базата) в .env.local и опитай пак.\n" +
      "Supabase: Settings → Database → Connection string (URI).",
  );
  process.exit(1);
}

const sqlPath = path.join(
  __dirname,
  "..",
  "supabase",
  "migrations",
  "019_tenant_salon_slug_on_update_cascade.sql",
);
const sql = fs.readFileSync(sqlPath, "utf8");

async function main() {
  const client = new Client({
    connectionString: url,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();
  try {
    await client.query(sql);
    console.log("OK: 019_tenant_salon_slug_on_update_cascade.sql приложена.");
  } finally {
    await client.end();
  }
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
