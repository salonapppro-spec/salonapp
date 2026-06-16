import { test, expect } from "@playwright/test";

const tenantSlug = process.env.E2E_TENANT_SLUG ?? "euphoria";

test.describe("Booking UI smoke", () => {
  test("tenant page exposes booking or construction state", async ({ page }) => {
    const res = await page.goto(`/${tenantSlug}`);
    expect(res?.status()).toBeLessThan(500);

    const body = page.locator("body");
    await expect(body).toBeVisible();

    const bookingHints = page.getByText(/запази|резерв|час|booking/i);
    const underConstruction = page.getByText(/изграждане|недостъпно/i);

    const hasBooking = (await bookingHints.count()) > 0;
    const hasPlaceholder = (await underConstruction.count()) > 0;

    expect(hasBooking || hasPlaceholder).toBeTruthy();
  });

  test("availability API rejects missing service_id", async ({ request }) => {
    const res = await request.get(`/api/availability?date=2099-01-15`);
    expect([400, 401, 403, 422]).toContain(res.status());
  });
});

test.describe("Inactive tenant", () => {
  test("inactive slug shows blocked message when configured", async ({ page }) => {
    const inactiveSlug = process.env.E2E_INACTIVE_TENANT_SLUG;
    test.skip(!inactiveSlug, "Set E2E_INACTIVE_TENANT_SLUG for inactive-tenant E2E");

    await page.goto(`/${inactiveSlug}`);
    await expect(page.getByText(/недостъпно|не е активен/i)).toBeVisible();
  });
});
