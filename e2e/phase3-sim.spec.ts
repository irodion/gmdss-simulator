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
    await expect(page.locator(".sim-scenario-card__title", { hasText: "Radio Check" })).toBeVisible(
      { timeout: 5000 },
    );
    await expect(
      page.locator(".sim-scenario-card__title", { hasText: "Channel Change" }),
    ).toBeVisible();
    await expect(
      page.locator(".sim-scenario-card__title", { hasText: "Port Entry Call" }),
    ).toBeVisible();
    await expect(
      page.locator(".sim-scenario-card__title", { hasText: "Position Report" }),
    ).toBeVisible();
    await expect(
      page.locator(".sim-scenario-card__title", { hasText: "Navigational Warning" }),
    ).toBeVisible();
  });

  test("full scenario flow: select, transmit, closing reply, auto-complete", async ({ page }) => {
    await login(page);
    await page.goto("/sim");

    // Select Radio Check scenario
    await page.locator(".sim-scenario-card__title", { hasText: "Radio Check" }).click();

    // Briefing should show
    await expect(page.locator("text=Scenario Briefing")).toBeVisible({ timeout: 5000 });
    await expect(page.locator("text=BLUE DUCK")).toBeVisible();

    // Start scenario
    await page.click("text=Start Scenario");

    // Type the opening radio check transmission
    const input = page.locator('input[aria-label="Radio transmission text"]');
    await expect(input).toBeVisible();
    await input.fill(
      "RCC HAIFA RCC HAIFA RCC HAIFA THIS IS BLUE DUCK BLUE DUCK BLUE DUCK RADIO CHECK ON CHANNEL ZERO SIX OVER",
    );
    await page.click("text=Transmit");

    // Station's first response should appear (readability report)
    await expect(page.locator("text=READING YOU FIVE BY FIVE")).toBeVisible({ timeout: 5000 });

    // Type the closing reply
    await input.fill("RCC HAIFA THIS IS 5BCD2 5BCD2 ROGER NOTHING ELSE FOR YOU OUT");
    await page.click("text=Transmit");

    // Station's final response should appear
    await expect(page.locator("text=ROGER, OUT")).toBeVisible({ timeout: 5000 });

    // Auto-complete: debrief should appear without clicking "End Scenario"
    await expect(page.locator("text=After-Action Review")).toBeVisible({ timeout: 8000 });
    await expect(page.locator("text=Retry Scenario")).toBeVisible();

    // Closing section should be visible in debrief
    await expect(page.locator("text=Closing")).toBeVisible();
  });

  test("channel change flow: call, acknowledge, switch channel, re-hail, auto-complete", async ({
    page,
  }) => {
    await login(page);
    await page.goto("/sim");

    await page.locator(".sim-scenario-card__title", { hasText: "Channel Change" }).click();

    await expect(page.locator("text=Scenario Briefing")).toBeVisible({ timeout: 5000 });
    await expect(page.locator("text=BLUE DUCK")).toBeVisible();

    await page.click("text=Start Scenario");

    const input = page.locator('input[aria-label="Radio transmission text"]');
    await expect(input).toBeVisible();

    // Step 1: initial call on Ch.16
    await input.fill("RCC HAIFA RCC HAIFA RCC HAIFA THIS IS BLUE DUCK BLUE DUCK BLUE DUCK OVER");
    await page.click("text=Transmit");

    // Station instructs channel change
    await expect(page.locator("text=ADVISE YOU SWITCH TO CHANNEL SEVEN TWO")).toBeVisible({
      timeout: 5000,
    });

    // Step 2: acknowledge on Ch.16 (no station reply — student must switch)
    await input.fill("RCC HAIFA THIS IS BLUE DUCK RECEIVED SWITCHING TO CHANNEL SEVEN TWO OUT");
    await page.click("text=Transmit");

    // Step 3: switch to Ch.72 via accessible mode (reliable channel selection)
    await page.click("text=Accessible");
    await page.locator("select#a11y-channel").selectOption("72");
    await page.click("text=Standard");

    // Step 4: re-hail on Ch.72
    await input.fill("RCC HAIFA THIS IS BLUE DUCK ON CHANNEL SEVEN TWO OVER");
    await page.click("text=Transmit");

    await expect(page.locator("text=ON CHANNEL SEVEN TWO, GO AHEAD")).toBeVisible({
      timeout: 5000,
    });

    // Step 5: routine message
    await input.fill("RCC HAIFA THIS IS BLUE DUCK REQUEST INFORMATION ON WEATHER CONDITIONS OVER");
    await page.click("text=Transmit");

    await expect(page.locator("text=ROGER, OUT")).toBeVisible({ timeout: 5000 });

    // Auto-complete: debrief should appear (1500ms auto-complete delay after final station turn)
    await expect(page.locator("text=After-Action Review")).toBeVisible({ timeout: 15000 });
    await expect(page.locator("text=Retry Scenario")).toBeVisible();
  });

  test("drill page loads with all drill type tabs", async ({ page }) => {
    await login(page);
    await page.goto("/drill");
    await expect(page.getByRole("button", { name: "Phonetic Alphabet" })).toBeVisible({
      timeout: 5000,
    });
    await expect(page.getByRole("button", { name: "Number Pronunciation" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Script Reading" })).toBeVisible();
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
    await page.locator(".sim-scenario-card__title", { hasText: "Radio Check" }).click();
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
