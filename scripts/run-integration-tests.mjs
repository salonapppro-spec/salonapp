import { readdir } from "node:fs/promises";
import { spawn } from "node:child_process";
import path from "node:path";

const REQUIRED_ENV_FOR_INTEGRATION = [
  "INTEGRATION_BASE_URL",
  "INTEGRATION_PUBLIC_TENANT_BASE_URL",
  "INTEGRATION_SUPABASE_URL",
  "INTEGRATION_SUPABASE_ANON_KEY",
];

const OPTIONAL_ENV_FOR_FULL_SUITE = [
  "INTEGRATION_TEST_DATE",
  "INTEGRATION_TENANT_A_BEARER",
  "INTEGRATION_TENANT_A_COOKIE",
  "INTEGRATION_TENANT_A_SLUG",
  "INTEGRATION_TENANT_B_SLUG",
  "INTEGRATION_TENANT_B_CLIENT_ID",
  "INTEGRATION_TENANT_B_BOOKING_ID",
  "INTEGRATION_TENANT_A_SUPABASE_JWT",
  "INTEGRATION_STORAGE_BUCKET",
];

function isIntegrationRequired() {
  return process.env.INTEGRATION_REQUIRED === "1" || process.env.CI === "true" || process.env.GITHUB_ACTIONS === "true";
}

function hasIntegrationConfig() {
  return REQUIRED_ENV_FOR_INTEGRATION.every((key) => {
    const v = process.env[key];
    return typeof v === "string" && v.trim().length > 0;
  });
}

function missingRequiredEnvKeys() {
  return REQUIRED_ENV_FOR_INTEGRATION.filter((key) => {
    const v = process.env[key];
    return !(typeof v === "string" && v.trim().length > 0);
  });
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

  if (!hasIntegrationConfig()) {
    const missing = missingRequiredEnvKeys();
    if (isIntegrationRequired()) {
      console.error(
        [
          "Integration tests are required in CI but env vars are missing.",
          `Missing: ${missing.join(", ")}`,
          "Configure GitHub Actions secrets (see .github/workflows/ci.yml).",
          `Optional for full suite: ${OPTIONAL_ENV_FOR_FULL_SUITE.join(", ")}`,
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
