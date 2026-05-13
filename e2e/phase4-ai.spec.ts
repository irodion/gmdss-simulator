import { expect, test } from "@playwright/test";

const testEmail = `ai-e2e-${Date.now()}@test.com`;
const testPassword = "SecureP@ss123";

async function registerAndLogin(page: import("@playwright/test").Page) {
  await page.goto("/register");
  await page.fill('input[name="name"]', "AI E2E Student");
  await page.fill('input[name="email"]', testEmail);
  await page.fill('input[name="password"]', testPassword);
  await page.click('button[type="submit"]');
  await page.waitForURL("**/learn", { timeout: 10000 });
}

async function login(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.fill('input[name="email"]', testEmail);
  await page.fill('input[name="password"]', testPassword);
  await page.click('button[type="submit"]');
  await page.waitForURL("**/learn", { timeout: 10000 });
}

test.describe.serial("Phase 4: AI Integration", () => {
  test("register test user", async ({ page }) => {
    const health = await page.request.get("http://localhost:3001/api/health");
    expect(health.ok()).toBe(true);
    await registerAndLogin(page);
  });

  test("simulator shows all tier scenarios", async ({ page }) => {
    await login(page);
    await page.goto("/sim");

    // Tier 1 scenarios
    await expect(page.locator(".sim-scenario-card__title", { hasText: "Radio Check" })).toBeVisible(
      { timeout: 5000 },
    );

    // Tier 2 scenario
    await expect(
      page.locator(".sim-scenario-card__title", { hasText: "MAYDAY — Fire on Board" }),
    ).toBeVisible();

    // Tier 3 scenario
    await expect(
      page.locator(".sim-scenario-card__title", { hasText: "Deteriorating Situation" }),
    ).toBeVisible();

    // Tier 4 scenario
    await expect(
      page.locator(".sim-scenario-card__title", { hasText: "Exam: Random Distress" }),
    ).toBeVisible();
  });

  test("Tier 2 MAYDAY scenario with scripted responses", async ({ page }) => {
    await login(page);
    await page.goto("/sim");

    // Select MAYDAY Fire scenario
    await page.click("text=MAYDAY — Fire on Board");

    // Briefing
    await expect(page.locator("text=Scenario Briefing")).toBeVisible({ timeout: 5000 });
    await expect(page.locator("text=fire in the engine room")).toBeVisible();

    // Start
    await page.click("text=Start Scenario");

    // Transmit a MAYDAY
    const input = page.locator('input[aria-label="Radio transmission text"]');
    await expect(input).toBeVisible();
    await input.fill(
      "MAYDAY MAYDAY MAYDAY THIS IS BLUE DUCK BLUE DUCK BLUE DUCK CALLSIGN 5BCD2 MAYDAY THIS IS BLUE DUCK POSITION FIVE ZERO DEGREES ZERO SIX MINUTES NORTH ZERO ZERO ONE DEGREES ONE TWO MINUTES WEST FIRE IN ENGINE ROOM REQUEST IMMEDIATE ASSISTANCE EIGHT PERSONS ON BOARD OVER",
    );
    await page.click("text=Transmit");

    // Station should respond (scripted fallback since AI mode not enabled)
    await expect(page.locator("text=RECEIVED MAYDAY")).toBeVisible({ timeout: 5000 });

    // End scenario
    await page.click("text=End Scenario");

    // Debrief should show score
    await expect(page.locator("text=After-Action Review")).toBeVisible({ timeout: 5000 });
  });

  test("Tier 4 exam scenario has no hints", async ({ page }) => {
    await login(page);
    await page.goto("/sim");

    // Select exam scenario
    await page.click("text=Exam: Random Distress");
    await expect(page.locator("text=Scenario Briefing")).toBeVisible({ timeout: 5000 });

    // Exam scenarios should not show hints
    await expect(page.locator("text=Hint")).not.toBeVisible();
  });

  test("simulator attempt routes respond", async ({ page }) => {
    await login(page);

    // List attempts (should be empty or have our test data)
    const resp = await page.request.get("http://localhost:3001/api/simulator/attempts");
    expect(resp.ok()).toBe(true);
    const body = await resp.json();
    expect(Array.isArray(body)).toBe(true);
  });
});
