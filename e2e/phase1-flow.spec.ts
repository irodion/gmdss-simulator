import { expect, test } from "@playwright/test";

const testEmail = `e2e-${Date.now()}@test.com`;
const testPassword = "SecureP@ss123";

test.describe.serial("Phase 1: Student registration and learning flow", () => {
  test("student can register a new account", async ({ page }) => {
    // Verify API is running
    const healthCheck = await page.request.get("http://localhost:3001/api/health");
    expect(healthCheck.ok()).toBe(true);

    await page.goto("/register");
    await page.fill('input[name="name"]', "E2E Student");
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.click('button[type="submit"]');

    // Should redirect to /learn after registration
    await page.waitForURL("**/learn", { timeout: 10000 });
    await expect(page).toHaveURL(/\/learn/);
  });

  test("student can see modules list", async ({ page }) => {
    // Login first
    await page.goto("/login");
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL("**/learn", { timeout: 5000 });

    // Module 1 should be visible and unlocked
    await expect(page.locator("text=VHF Radio Fundamentals")).toBeVisible();
    // Module 2 should be visible but locked
    await expect(page.locator("text=MMSI and Digital Selective Calling")).toBeVisible();
  });

  test("student can view Module 1 lessons", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL("**/learn", { timeout: 5000 });

    // Click on Module 1
    await page.click("text=VHF Radio Fundamentals");
    await page.waitForURL("**/learn/module-1");

    // Should see lessons
    await expect(page.locator("text=What is VHF Maritime Radio?")).toBeVisible();
  });

  test("jurisdictions endpoint is publicly accessible", async ({ page }) => {
    const response = await page.request.get("http://localhost:3001/api/content/jurisdictions");
    expect(response.ok()).toBe(true);
    const body = await response.json();
    expect(body.some((j: { id: string }) => j.id === "international")).toBe(true);
  });
});
