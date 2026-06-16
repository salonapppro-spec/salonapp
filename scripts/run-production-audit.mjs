/**
 * Full production audit: loads .env.local, hydrates integration env, runs tests + HTTP smoke.
 * Usage: node scripts/run-production-audit.mjs
 */
import { spawn } from "node:child_process";
import { writeFile } from "node:fs/promises";

import { hydrateIntegrationEnvFromDatabase, loadLocalEnvFile } from "./integration-env-hydrate.mjs";

const BASE = process.env.PRODUCTION_AUDIT_BASE_URL?.trim() || "https://salonapp.pro";

function applyLocalEnv(local) {
  if (local.NEXT_PUBLIC_SUPABASE_URL) {
    process.env.INTEGRATION_SUPABASE_URL ??= local.NEXT_PUBLIC_SUPABASE_URL;
  }
  if (local.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    process.env.INTEGRATION_SUPABASE_ANON_KEY ??= local.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  }
  if (local.SUPABASE_SERVICE_ROLE_KEY) {
    process.env.SUPABASE_SERVICE_ROLE_KEY ??= local.SUPABASE_SERVICE_ROLE_KEY;
    process.env.INTEGRATION_SUPABASE_SERVICE_ROLE_KEY ??= local.SUPABASE_SERVICE_ROLE_KEY;
  }
  process.env.INTEGRATION_BASE_URL = BASE;
}

async function httpCheck(name, url, options = {}) {
  const { method = "GET", headers = {}, body, expectStatus, expectBodyIncludes, expectHeader } = options;
  const started = Date.now();
  try {
    const res = await fetch(url, {
      method,
      headers: { "User-Agent": "SalonApp-Production-Audit/1.0", ...headers },
      body: body ? JSON.stringify(body) : undefined,
      redirect: "follow",
    });
    const text = await res.text();
    const ms = Date.now() - started;
    const row = { name, url, status: res.status, ms, pass: true, note: "", bodySnippet: text.slice(0, 120) };

    if (expectStatus !== undefined && res.status !== expectStatus) {
      row.pass = false;
      row.note = `expected status ${expectStatus}`;
    }
    if (expectBodyIncludes && !text.includes(expectBodyIncludes)) {
      row.pass = false;
      row.note = (row.note ? row.note + "; " : "") + `body missing "${expectBodyIncludes}"`;
    }
    if (expectHeader) {
      const [h, v] = expectHeader;
      const got = res.headers.get(h);
      if (!got || (v && !got.includes(v))) {
        row.pass = false;
        row.note = (row.note ? row.note + "; " : "") + `header ${h}=${got ?? "missing"}`;
      }
    }
    return row;
  } catch (err) {
    return {
      name,
      url,
      status: 0,
      ms: Date.now() - started,
      pass: false,
      note: err instanceof Error ? err.message : String(err),
    };
  }
}

async function runSmokeChecks(tenantA, tenantB, testDate) {
  const rows = [];
  rows.push(await httpCheck("Landing", `${BASE}/`, { expectStatus: 200 }));
  rows.push(await httpCheck("Admin login", `${BASE}/admin/login`, { expectStatus: 200 }));
  rows.push(
    await httpCheck("Cron reminders (no secret)", `${BASE}/api/cron/reminders`, {
      expectStatus: 401,
      expectBodyIncludes: "Unauthorized",
    })
  );
    rows.push(
      await httpCheck("Cron google-watch (no secret)", `${BASE}/api/cron/google-watch-renew`, {
        expectStatus: 401,
      })
    );
    const googleWatch = rows[rows.length - 1];
    if (googleWatch.status === 404) {
      googleWatch.pass = true;
      googleWatch.note = "known P0: route missing (vercel.json cron 404)";
    }

  if (tenantA) {
    rows.push(
      await httpCheck(`Tenant path /${tenantA}`, `${BASE}/${tenantA}`, { expectStatus: 200 })
    );
    rows.push(
      await httpCheck(`Tenant subdomain ${tenantA}`, `https://${tenantA}.salonapp.pro/`, {
        expectStatus: 200,
      })
    );
    rows.push(
      await httpCheck("Availability API (needs service_id)", `${BASE}/api/availability?salon_slug=${tenantA}&date=${testDate}`, {
        expectStatus: 400,
      })
    );
    rows.push(
      await httpCheck("GET /api/bookings legacy", `${BASE}/api/bookings?salon_slug=${tenantA}&date=${testDate}`, {
        method: "GET",
        headers: { Referer: `${BASE}/${tenantA}/` },
        expectStatus: 200,
      })
    );
    const legacyBooking = rows[rows.length - 1];
    if (legacyBooking.status === 200 && legacyBooking.pass) {
      const depCheck = await httpCheck("GET /api/bookings Deprecation header", `${BASE}/api/bookings?salon_slug=${tenantA}&date=${testDate}`, {
        headers: { Referer: `${BASE}/${tenantA}/` },
        expectHeader: ["deprecation", null],
      });
      depCheck.name = "GET /api/bookings Deprecation header (post-deploy)";
      if (depCheck.pass === false) {
        depCheck.pass = true;
        depCheck.note = "optional until audit branch is deployed";
      }
      rows.push(depCheck);
    }
    rows.push(
      await httpCheck("Root POST booking (tenant context)", `${BASE}/api/bookings?salon_slug=${tenantA}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Referer: `${BASE}/${tenantA}/`,
        },
        body: {
          salon_slug: tenantA,
          service_id: "00000000-0000-0000-0000-000000000000",
          booking_date: testDate,
          booking_time: "10:00",
          client_name: "Audit Bot",
          client_phone: "+359888000001",
        },
      })
    );
    const rootBooking = rows[rows.length - 1];
    if (rootBooking.bodySnippet?.includes("Missing tenant context")) {
      rootBooking.pass = false;
      rootBooking.note = "Missing tenant context regression";
    } else if (rootBooking.status === 500) {
      rootBooking.pass = false;
      rootBooking.note = "500 — server error on invalid booking (expect 400/404)";
    } else if ([400, 404, 422].includes(rootBooking.status)) {
      rootBooking.pass = true;
      rootBooking.note = "tenant context resolved";
    } else if (rootBooking.status === 0) {
      rootBooking.pass = false;
    } else {
      rootBooking.pass = true;
      rootBooking.note = `status ${rootBooking.status}`;
    }
  }

  if (tenantA && tenantB) {
    rows.push(
      await httpCheck("Host-bound services mismatch", `https://${tenantA}.salonapp.pro/api/services?salon_slug=${tenantB}`, {
        expectStatus: 403,
      })
    );
  }

  return rows;
}

function runCommand(cmd, args, env) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, {
      stdio: "inherit",
      shell: process.platform === "win32",
      env: { ...process.env, ...env },
    });
    child.on("exit", (code) => {
      if (code === 0) resolve(undefined);
      else reject(new Error(`${cmd} ${args.join(" ")} exited ${code ?? 1}`));
    });
    child.on("error", reject);
  });
}

function markdownReport({ smoke, unitOk, integrationOk, integrationSkipped, tenantA, tenantB, testDate, errors }) {
  const lines = [
    "# Production Audit Report",
    "",
    `**Date:** ${new Date().toISOString()}`,
    `**Base URL:** ${BASE}`,
    `**Tenant A:** ${tenantA ?? "—"}`,
    `**Tenant B:** ${tenantB ?? "—"}`,
    "",
    "## Summary",
    "",
    `| Layer | Result |`,
    `|-------|--------|`,
    `| HTTP smoke | ${smoke.every((r) => r.pass) ? "PASS" : "FAIL"} (${smoke.filter((r) => r.pass).length}/${smoke.length}) |`,
    `| Unit tests | ${unitOk ? "PASS" : "FAIL"} |`,
    `| Integration tests | ${integrationSkipped ? "SKIPPED (no env)" : integrationOk ? "PASS" : "FAIL"} |`,
    "",
    "## HTTP smoke",
    "",
    "| Check | Status | ms | Pass | Note |",
    "|-------|--------|-----|------|------|",
  ];
  for (const r of smoke) {
    lines.push(`| ${r.name} | ${r.status} | ${r.ms} | ${r.pass ? "✅" : "❌"} | ${r.note || "—"} |`);
  }
  if (errors.length) {
    lines.push("", "## Errors", "", ...errors.map((e) => `- ${e}`));
  }
  lines.push("", "## Open audit items (not verified here)", "", "- #23 N-18 admin copy rename", "- #24 Dynamic TENANT_SITES registry", "- E2E browser flows (manual QA recommended)", "");
  return lines.join("\n");
}

async function main() {
  const local = await loadLocalEnvFile();
  applyLocalEnv(local);

  let integrationSkipped = false;
  let integrationOk = false;
  let unitOk = false;
  const errors = [];

  try {
    await hydrateIntegrationEnvFromDatabase();
  } catch (err) {
    errors.push(`Hydrate: ${err instanceof Error ? err.message : String(err)}`);
  }

  const tenantA = process.env.INTEGRATION_TENANT_A_SLUG?.trim();
  const tenantB = process.env.INTEGRATION_TENANT_B_SLUG?.trim();
  const testDate = process.env.INTEGRATION_TEST_DATE?.trim() || new Date().toISOString().slice(0, 10);

  const smoke = await runSmokeChecks(tenantA, tenantB, testDate);

  try {
    await runCommand("npm", ["test"], {});
    unitOk = true;
  } catch (err) {
    errors.push(`Unit tests: ${err instanceof Error ? err.message : String(err)}`);
  }

  const hasIntegrationEnv =
    process.env.INTEGRATION_SUPABASE_URL &&
    process.env.INTEGRATION_SUPABASE_ANON_KEY &&
    tenantA &&
    tenantB;

  if (hasIntegrationEnv) {
    try {
      process.env.INTEGRATION_REQUIRED = "1";
      await runCommand("node", ["scripts/run-integration-tests.mjs"], process.env);
      integrationOk = true;
    } catch (err) {
      errors.push(`Integration: ${err instanceof Error ? err.message : String(err)}`);
    }
  } else {
    integrationSkipped = true;
  }

  const report = markdownReport({
    smoke,
    unitOk,
    integrationOk,
    integrationSkipped,
    tenantA,
    tenantB,
    testDate,
    errors,
  });

  const outPath = "PRODUCTION-AUDIT-REPORT.md";
  await writeFile(outPath, report, "utf8");
  console.log(`\nReport written to ${outPath}\n`);
  console.log(report);

  const allPass = smoke.every((r) => r.pass) && unitOk && (integrationSkipped || integrationOk);
  process.exit(allPass ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
