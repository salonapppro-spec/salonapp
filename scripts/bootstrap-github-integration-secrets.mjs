/**
 * Sets minimum GitHub Actions secrets for CI integration tests from .env.local
 * Usage: node scripts/bootstrap-github-integration-secrets.mjs
 */
import { readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import path from "node:path";

import { hydrateIntegrationEnvFromDatabase, parseEnvFile } from "./integration-env-hydrate.mjs";

const REPO = "salonapppro-spec/salonapp";

function ghSecretSet(name, value) {
  if (!value?.trim()) throw new Error(`Missing value for secret ${name}`);
  const result = spawnSync("gh", ["secret", "set", name, "--repo", REPO, "--body", value.trim()], {
    encoding: "utf8",
    shell: process.platform === "win32",
  });
  if (result.status !== 0) {
    throw new Error(`gh secret set ${name} failed: ${result.stderr || result.stdout}`);
  }
  console.log(`✓ ${name}`);
}

async function main() {
  const envPath = path.join(process.cwd(), ".env.local");
  const raw = await readFile(envPath, "utf8");
  const local = parseEnvFile(raw);

  if (!local.NEXT_PUBLIC_SUPABASE_URL || !local.NEXT_PUBLIC_SUPABASE_ANON_KEY || !local.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(".env.local needs NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY");
  }

  process.env.INTEGRATION_SUPABASE_URL = local.NEXT_PUBLIC_SUPABASE_URL;
  process.env.INTEGRATION_SUPABASE_ANON_KEY = local.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  process.env.INTEGRATION_SUPABASE_SERVICE_ROLE_KEY = local.SUPABASE_SERVICE_ROLE_KEY;
  process.env.SUPABASE_SERVICE_ROLE_KEY = local.SUPABASE_SERVICE_ROLE_KEY;

  await hydrateIntegrationEnvFromDatabase();

  const secrets = {
    INTEGRATION_SUPABASE_URL: process.env.INTEGRATION_SUPABASE_URL,
    INTEGRATION_SUPABASE_ANON_KEY: process.env.INTEGRATION_SUPABASE_ANON_KEY,
    INTEGRATION_SUPABASE_SERVICE_ROLE_KEY: process.env.INTEGRATION_SUPABASE_SERVICE_ROLE_KEY,
    INTEGRATION_BASE_URL: process.env.INTEGRATION_BASE_URL,
    INTEGRATION_PUBLIC_TENANT_BASE_URL: process.env.INTEGRATION_PUBLIC_TENANT_BASE_URL,
    INTEGRATION_TENANT_A_SLUG: process.env.INTEGRATION_TENANT_A_SLUG,
    INTEGRATION_TENANT_B_SLUG: process.env.INTEGRATION_TENANT_B_SLUG,
    INTEGRATION_TENANT_B_CLIENT_ID: process.env.INTEGRATION_TENANT_B_CLIENT_ID,
    INTEGRATION_TENANT_B_BOOKING_ID: process.env.INTEGRATION_TENANT_B_BOOKING_ID,
    INTEGRATION_TEST_DATE: process.env.INTEGRATION_TEST_DATE,
    INTEGRATION_STORAGE_BUCKET: process.env.INTEGRATION_STORAGE_BUCKET,
    INTEGRATION_CI_USER_PASSWORD: process.env.INTEGRATION_CI_USER_PASSWORD || "SalonApp-CI-Integration-2026!",
  };

  console.log(`Setting GitHub secrets on ${REPO}…`);
  for (const [name, value] of Object.entries(secrets)) {
    ghSecretSet(name, value);
  }
  console.log("\nDone. CI will hydrate bearer/JWT on each run.");
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
