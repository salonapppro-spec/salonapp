/**
 * set-app-metadata.ts
 *
 * Обновява app_metadata.salon_slug за всички съществуващи собственици.
 * ТРЯБВА да се изпълни ПРЕДИ migration 015_rls_app_metadata.sql влезе в production.
 *
 * Изпълнение:
 *   npx tsx scripts/set-app-metadata.ts
 *
 * Изисква в .env.local:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  console.error("Липсват NEXT_PUBLIC_SUPABASE_URL и/или SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const supabase = createClient(url, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function main() {
  const { data: tenants, error } = await supabase
    .from("tenants")
    .select("salon_slug, owner_email")
    .not("owner_email", "is", null);

  if (error) {
    console.error("Грешка при четене на tenants:", error.message);
    process.exit(1);
  }

  console.log(`Намерени ${tenants.length} тенанта с owner_email.\n`);

  let ok = 0;
  let skipped = 0;
  let failed = 0;

  const { data: allUsers, error: listErr } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  if (listErr) {
    console.error("listUsers грешка:", listErr.message);
    process.exit(1);
  }
  const usersByEmail = new Map(allUsers.users.map((u) => [u.email?.toLowerCase(), u]));

  for (const tenant of tenants) {
    const user = usersByEmail.get(tenant.owner_email.toLowerCase());

    if (!user) {
      console.warn(`⚠️  ${tenant.salon_slug}: потребител не намерен за ${tenant.owner_email}`);
      skipped++;
      continue;
    }

    const currentAppMeta = (user.app_metadata ?? {}) as Record<string, unknown>;
    if (currentAppMeta.salon_slug === tenant.salon_slug) {
      console.log(`✓  ${tenant.salon_slug}: app_metadata вече е актуален`);
      ok++;
      continue;
    }

    const { error: updateErr } = await supabase.auth.admin.updateUserById(user.id, {
      app_metadata: {
        ...currentAppMeta,
        salon_slug: tenant.salon_slug,
      },
    });

    if (updateErr) {
      console.error(`✗  ${tenant.salon_slug}: грешка при update — ${updateErr.message}`);
      failed++;
    } else {
      console.log(`✅ ${tenant.salon_slug}: app_metadata.salon_slug обновен`);
      ok++;
    }
  }

  console.log(`\nРезултат: ${ok} успешни, ${skipped} пропуснати, ${failed} грешки.`);
  if (failed > 0) process.exit(1);
}

main();
