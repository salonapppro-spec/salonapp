import { test, expect } from "@playwright/test";

import { TENANT_SITE_SLUGS } from "../../lib/tenant-site-slugs";

const tenantSlug = process.env.E2E_TENANT_SLUG ?? "euphoria";

test.describe("Public smoke", () => {
  test("landing page loads", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/SalonApp/i);
  });

  test("admin login page loads", async ({ page }) => {
    await page.goto("/admin/login");
    await expect(page.getByRole("heading", { name: "Админ панел" })).toBeVisible();
  });

  test("registered tenant site loads", async ({ page }) => {
    test.skip(!TENANT_SITE_SLUGS.includes(tenantSlug), `Unknown tenant slug: ${tenantSlug}`);
    const res = await page.goto(`/${tenantSlug}`);
    expect(res?.status()).toBeLessThan(500);
    await expect(page.locator("body")).toBeVisible();
  });

  test("unknown slug returns 404", async ({ page }) => {
    const res = await page.goto("/this-slug-does-not-exist-xyz");
    expect(res?.status()).toBe(404);
  });
});
