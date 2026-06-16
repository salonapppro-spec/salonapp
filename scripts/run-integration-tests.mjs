import { readdir } from "node:fs/promises";
import { spawn } from "node:child_process";
import path from "node:path";

import { hydrateIntegrationEnvFromDatabase } from "./integration-env-hydrate.mjs";

const REQUIRED_ENV_FOR_INTEGRATION = [
  "INTEGRATION_BASE_URL",
  "INTEGRATION_PUBLIC_TENANT_BASE_URL",
  "INTEGRATION_SUPABASE_URL",
  "INTEGRATION_SUPABASE_ANON_KEY",
  "INTEGRATION_TENANT_A_SLUG",
  "INTEGRATION_TENANT_B_SLUG",
  "INTEGRATION_TENANT_B_CLIENT_ID",
  "INTEGRATION_TENANT_B_BOOKING_ID",
  "INTEGRATION_TEST_DATE",
  "INTEGRATION_STORAGE_BUCKET",
];

const AUTH_ENV_ONE_OF = ["INTEGRATION_TENANT_A_BEARER", "INTEGRATION_TENANT_A_COOKIE"];

function isIntegrationRequired() {
  return process.env.INTEGRATION_REQUIRED === "1" || process.env.CI === "true" || process.env.GITHUB_ACTIONS === "true";
}

function hasValue(key) {
  const v = process.env[key];
  return typeof v === "string" && v.trim().length > 0;
}

function missingRequiredEnvKeys() {
  const missing = REQUIRED_ENV_FOR_INTEGRATION.filter((key) => !hasValue(key));
  const hasAuth = AUTH_ENV_ONE_OF.some((key) => hasValue(key));
  if (!hasAuth) missing.push("INTEGRATION_TENANT_A_BEARER|INTEGRATION_TENANT_A_COOKIE");
  if (!hasValue("INTEGRATION_TENANT_A_SUPABASE_JWT")) missing.push("INTEGRATION_TENANT_A_SUPABASE_JWT");
  return missing;
}

async function listIntegrationTests() {
  const integrationDir = path.join(process.cwd(), "tests", "integration");
  const files = await readdir(integrationDir, { withFileTypes: true });
  return files
    .filter((entry) => entry.isFile() && entry.name.endsWith(".test.ts"))
    .map((entry) => path.posix.join("tests/integration", entry.name));
}

async function main() {
  const testFiles = await listIntegrationTests();
  if (testFiles.length === 0) {
    console.log("No integration tests found. Skipping.");
    return;
  }

  const canHydrate =
    hasValue("INTEGRATION_SUPABASE_URL") &&
    hasValue("INTEGRATION_SUPABASE_ANON_KEY") &&
    (hasValue("INTEGRATION_SUPABASE_SERVICE_ROLE_KEY") || hasValue("SUPABASE_SERVICE_ROLE_KEY"));

  if (canHydrate) {
    try {
      await hydrateIntegrationEnvFromDatabase();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (isIntegrationRequired()) {
        console.error(`Integration env hydrate failed: ${message}`);
        process.exit(1);
      }
      console.warn(`Integration env hydrate skipped: ${message}`);
    }
  }

  const missing = missingRequiredEnvKeys();
  if (missing.length > 0) {
    if (isIntegrationRequired()) {
      console.error(
        [
          "Integration tests are required in CI but env is incomplete.",
          `Missing: ${missing.join(", ")}`,
          "Minimum GitHub secrets: INTEGRATION_SUPABASE_URL, INTEGRATION_SUPABASE_ANON_KEY, INTEGRATION_SUPABASE_SERVICE_ROLE_KEY",
        ].join("\n")
      );
      process.exit(1);
    }
    console.log("Integration env vars are not configured. Skipping integration tests.");
    return;
  }

  const child = spawn("npx", ["tsx", "--test", ...testFiles], {
    stdio: "inherit",
    shell: process.platform === "win32",
    env: process.env,
  });

  await new Promise((resolve, reject) => {
    child.on("exit", (code) => {
      if (code === 0) resolve(undefined);
      else reject(new Error(`Integration tests failed with exit code ${code ?? 1}.`));
    });
    child.on("error", reject);
  });
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
