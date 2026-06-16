import { readdir } from "node:fs/promises";
import { spawn } from "node:child_process";
import path from "node:path";

async function listUnitTests() {
  const testsDir = path.join(process.cwd(), "tests");
  const files = await readdir(testsDir, { withFileTypes: true });
  return files
    .filter((entry) => entry.isFile() && entry.name.endsWith(".test.ts"))
    .map((entry) => path.posix.join("tests", entry.name));
}

async function main() {
  const testFiles = await listUnitTests();
  if (testFiles.length === 0) {
    console.error("No unit tests found in tests/*.test.ts");
    process.exit(1);
  }

  const child = spawn("npx", ["tsx", "--test", ...testFiles], {
    stdio: "inherit",
    shell: process.platform === "win32",
    env: process.env,
  });

  await new Promise((resolve, reject) => {
    child.on("exit", (code) => {
      if (code === 0) resolve(undefined);
      else reject(new Error(`Unit tests failed with exit code ${code ?? 1}.`));
    });
    child.on("error", reject);
  });
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
