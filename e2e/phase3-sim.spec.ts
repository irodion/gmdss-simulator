import { expect, test } from "@playwright/test";

const testEmail = `sim-e2e-${Date.now()}@test.com`;
const testPassword = "SecureP@ss123";

async function login(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.fill('input[name="email"]', testEmail);
  await page.fill('input[name="password"]', testPassword);
  await page.click('button[type="submit"]');
  await page.waitForURL("**/dashboard", { timeout: 10000 });
}

test.describe.serial("Phase 3: Radio Simulator", () => {
  test("register test user", async ({ page }) => {
    const health = await page.request.get("http://localhost:3001/api/health");
    expect(health.ok()).toBe(true);

    await page.goto("/register");
    await page.fill('input[name="name"]', "Sim E2E Student");
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL("**/learn", { timeout: 10000 });
  });

  test("scenario selection loads Tier 1 scenarios", async ({ page }) => {
    await login(page);
    await page.goto("/sim");
    await expect(page.locator("text=Radio Check")).toBeVisible({ timeout: 5000 });
    await expect(page.locator("text=Channel Change")).toBeVisible();
    await expect(page.locator("text=Port Entry Call")).toBeVisible();
    await expect(page.locator("text=Position Report")).toBeVisible();
    await expect(page.locator("text=Navigational Warning")).toBeVisible();
  });

  test("full scenario flow: select, transmit, score", async ({ page }) => {
    await login(page);
    await page.goto("/sim");

    // Select Radio Check scenario
    await page.click("text=Radio Check");

    // Briefing should show
    await expect(page.locator("text=Scenario Briefing")).toBeVisible({ timeout: 5000 });
    await expect(page.locator("text=BLUE DUCK")).toBeVisible();

    // Start scenario
    await page.click("text=Start Scenario");

    // Type a radio transmission
    const input = page.locator('input[aria-label="Radio transmission text"]');
    await expect(input).toBeVisible();
    await input.fill(
      "RCC HAIFA RCC HAIFA RCC HAIFA THIS IS BLUE DUCK BLUE DUCK BLUE DUCK RADIO CHECK ON CHANNEL ONE SIX OVER",
    );
    await page.click("text=Transmit");

    // Station response should appear in transcript
    await expect(page.locator("text=READING YOU LOUD AND CLEAR")).toBeVisible({ timeout: 5000 });

    // End scenario
    await page.click("text=End Scenario");

    // Debrief should show score
    await expect(page.locator("text=After-Action Review")).toBeVisible({ timeout: 5000 });
    await expect(page.locator("text=Retry Scenario")).toBeVisible();
  });

  test("drill page loads with all drill type tabs", async ({ page }) => {
    await login(page);
    await page.goto("/drill");
    await expect(page.locator("text=Phonetic Alphabet")).toBeVisible({ timeout: 5000 });
    await expect(page.locator("text=Number Pronunciation")).toBeVisible();
    await expect(page.locator("text=Script Reading")).toBeVisible();
  });

  test("phonetic drill: submit and score", async ({ page }) => {
    await login(page);
    await page.goto("/drill");
    await expect(page.locator("text=Spell:")).toBeVisible({ timeout: 5000 });

    const input = page.locator('input[aria-label="Drill answer"]');
    await input.fill("PAPA HOTEL QUEBEC ROMEO");
    await page.click("text=Check");

    // Should show a percentage score
    await expect(page.locator("text=%")).toBeVisible({ timeout: 3000 });
  });

  test("accessible mode toggle works", async ({ page }) => {
    await login(page);
    await page.goto("/sim");
    await page.click("text=Radio Check");
    await expect(page.locator("text=Scenario Briefing")).toBeVisible({ timeout: 5000 });

    // Toggle accessible mode
    await page.click("text=Accessible");
    await expect(page.locator("select#a11y-channel")).toBeVisible();
    await expect(page.locator("input#a11y-volume")).toBeVisible();

    // Toggle back to standard
    await page.click("text=Standard");
    await expect(page.locator("select#a11y-channel")).not.toBeVisible();
  });
});
