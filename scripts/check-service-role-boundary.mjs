import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const ALLOWED_EXACT = new Set([
  "lib/tenant-db.ts",
  "lib/supabase-admin.ts",
  "lib/get-tenant.ts",
  "lib/owner-recovery-link.ts",
  "app/api/cron/billing-expiry/route.ts",
  "app/api/cron/reminders/route.ts",
  "app/api/webhooks/stripe/route.ts",
  "app/api/super-admin/slug/route.ts",
  "app/api/super-admin/tenants/route.ts",
  "app/super-admin/actions.ts",
  "app/super-admin/page.tsx",
  "app/super-admin/leads/page.tsx",
  "app/super-admin/[salon_slug]/page.tsx",
  "app/super-admin/[salon_slug]/builder/page.tsx",
  "app/api/leads/route.ts",
  "app/api/consultation/route.ts",
  "app/api/track/route.ts",
  "app/api/confirm/[token]/route.ts",
  "app/api/cancel/[token]/route.ts",
  "scripts/set-app-metadata.ts",
]);
const ALLOWED_PREFIXES = ["lib/internal/"];
const CODE_EXTENSIONS = new Set([".ts", ".tsx", ".mts", ".cts"]);
const SKIP_DIRS = new Set([".git", ".next", "node_modules", ".vercel", ".turbo", ".claude", ".agents"]);

function toPosix(relativePath) {
  return relativePath.split(path.sep).join("/");
}

function isCodeFile(relativePath) {
  return CODE_EXTENSIONS.has(path.extname(relativePath));
}

function isAllowedPath(relativePath) {
  if (ALLOWED_EXACT.has(relativePath)) return true;
  return ALLOWED_PREFIXES.some((prefix) => relativePath.startsWith(prefix));
}

async function walk(dirRelative = "") {
  const abs = path.join(ROOT, dirRelative);
  const entries = await readdir(abs, { withFileTypes: true });
  const out = [];

  for (const entry of entries) {
    const rel = path.join(dirRelative, entry.name);
    const relPosix = toPosix(rel);

    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      out.push(...(await walk(rel)));
      continue;
    }

    if (!entry.isFile()) continue;
    if (!isCodeFile(relPosix)) continue;
    out.push(relPosix);
  }

  return out;
}

function findViolations(content, filePath) {
  const violations = [];
  const importPattern =
    /import\s*\{\s*createSupabaseServiceRoleClient\s*\}\s*from\s*["'][^"']*supabase-admin[^"']*["']/m;
  const supabaseFromPattern = /\bsupabase\s*\.\s*from\s*\(/m;
  const clientFromPattern = /\b(?:db|client)\s*\.\s*from\s*\(/m;
  const hasImport = importPattern.test(content);
  const hasSupabaseFrom = supabaseFromPattern.test(content) || clientFromPattern.test(content);

  if (!isAllowedPath(filePath)) {
    if (hasImport) {
      violations.push(
        `${filePath}: forbidden import of createSupabaseServiceRoleClient (use tenant layer: tenantDb(slug) or move under lib/internal/*)`
      );
    }
    if (hasSupabaseFrom) {
      violations.push(
        `${filePath}: forbidden direct .from() query outside tenant/platform DB layers (use tenantDb(slug))`
      );
    }
  }

  return violations;
}

async function main() {
  const files = await walk();
  const violations = [];

  for (const filePath of files) {
    const abs = path.join(ROOT, filePath);
    const content = await readFile(abs, "utf8");
    violations.push(...findViolations(content, filePath));
  }

  if (violations.length > 0) {
    console.error("Service-role boundary check failed.\n");
    for (const line of violations) console.error(`- ${line}`);
    console.error(
      "\nAllowed DB paths: tenantDb + explicit platform allowlist + lib/internal/**.\n" +
        "Rules: no raw service-role imports and no direct .from() outside approved layers."
    );
    process.exit(1);
  }

  console.log("Service-role boundary check passed.");
}

main().catch((error) => {
  console.error("Service-role boundary check crashed:", error);
  process.exit(1);
});

