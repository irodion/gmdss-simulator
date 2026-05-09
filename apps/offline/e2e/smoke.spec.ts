import { expect, test } from "@playwright/test";

test("config screen renders the five drill modes", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("tab", { name: "Callsigns" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "Numbers" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "Listen" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "Procedures" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "Abbreviations" })).toBeVisible();
  await expect(page.getByRole("button", { name: /^begin/i })).toBeVisible();
});

test("running a callsign session through to the summary works", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "5" }).click();
  await page.getByRole("button", { name: /^begin/i }).click();

  for (let i = 1; i <= 5; i++) {
    await expect(page.getByText(new RegExp(`transmission ${i} of 5`, "i"))).toBeVisible();
    await page.getByLabel(/your answer/i).fill("ALFA BRAVO CHARLIE");
    await page.getByRole("button", { name: "Submit" }).click();
    const next = page.getByRole("button", { name: i === 5 ? /see results/i : /next →/i });
    await next.click();
  }

  await expect(page.getByText(/logbook entry/i)).toBeVisible();
  await expect(page.getByRole("button", { name: /begin a new watch/i })).toBeVisible();
});

test("PWA manifest is reachable", async ({ request }) => {
  const res = await request.get("/manifest.webmanifest");
  expect(res.status()).toBe(200);
  const body = await res.json();
  expect(body.name).toBe("ROC Phonetics");
  expect(body.display).toBe("standalone");
});

test("voice dictation button appears during a callsign drill on supported browsers", async ({
  page,
}) => {
  await page.goto("/");

  const supported = await page.evaluate(
    () => "SpeechRecognition" in window || "webkitSpeechRecognition" in window,
  );
  test.skip(!supported, "Browser does not expose SpeechRecognition");

  await page.getByRole("button", { name: "5" }).click();
  await page.getByRole("button", { name: /^begin/i }).click();

  await expect(page.getByRole("button", { name: /start voice dictation/i })).toBeVisible();
});

test("Procedures tab loads the home tile and starts a scenario drill", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("tab", { name: "Procedures" }).click();

  await expect(page.getByRole("button", { name: /scenario reconstruction drill/i })).toBeVisible();
  await page.getByRole("button", { name: /scenario reconstruction drill/i }).click();

  // The scenario brief is rendered above the entries list.
  await expect(page.getByLabel("Scenario").first()).toBeVisible();

  // The priority openings group offers all three priorities as chips,
  // so the user must pick the correct one for the scenario.
  const priorityPool = page.getByLabel("Priority openings");
  await expect(priorityPool.getByRole("button", { name: "MAYDAY" }).first()).toBeVisible();
  await expect(priorityPool.getByRole("button", { name: "PAN-PAN" }).first()).toBeVisible();
  await expect(priorityPool.getByRole("button", { name: "SECURITE" }).first()).toBeVisible();

  // Submit is always enabled — students can submit a partial answer to be evaluated.
  // The aria-label includes the entry count so we anchor on the visible button text.
  await expect(page.getByRole("button", { name: /^Submit/ })).toBeEnabled();

  // The list starts empty — no pre-rendered slots reveal the answer count.
  await expect(page.locator("li.seq-slot")).toHaveCount(0);
  // A drop/tap affordance is shown instead.
  await expect(page.locator(".seq-droparea").first()).toBeVisible();
});

test("Procedures MAYDAY drill exposes the procedure pool group with enough chips", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("tab", { name: "Procedures" }).click();

  const startTile = page.getByRole("button", { name: /scenario reconstruction drill/i });
  const back = page.getByRole("button", { name: /^← Procedures$/ });
  const scenarioSection = page.getByLabel("Scenario").first();
  const procedurePool = page.getByLabel("Procedure actions");

  await startTile.click();

  // The Procedure pool group only appears for v1/distress MAYDAY scenarios.
  // Cycle through scenarios via Back → start until we hit one (cap at 20 attempts).
  for (let attempt = 0; attempt < 20; attempt++) {
    await scenarioSection.waitFor({ state: "visible" });
    if (await procedurePool.isVisible()) break;
    await back.click();
    await startTile.click();
  }

  await expect(procedurePool).toBeVisible();
  // Procedure pool should contain at least 6 chips for ship-side distress drills.
  const procedureChips = procedurePool.locator(".seq-pool-item-procedure");
  expect(await procedureChips.count()).toBeGreaterThanOrEqual(6);
});

test("Abbreviations tab runs a 5-question session through to the summary", async ({ page }) => {
  await page.goto("/");
  // Clear any prior stats so the empty-state panel renders.
  await page.evaluate(() => window.localStorage.clear());

  await page.getByRole("tab", { name: "Abbreviations" }).click();
  await expect(page.getByText(/no attempts yet/i)).toBeVisible();

  await page.getByRole("button", { name: "5" }).click();
  await page.getByRole("button", { name: /^begin/i }).click();

  for (let i = 1; i <= 5; i++) {
    await expect(page.getByText(new RegExp(`transmission ${i} of 5`, "i"))).toBeVisible();
    // Detect MC vs free-text by looking for the answer input.
    const input = page.getByLabel(/your answer/i);
    if ((await input.count()) > 0) {
      // Free-text variant — submit a deliberate wrong answer; the test only checks flow.
      await input.fill("XYZ");
      await page.getByRole("button", { name: "Submit" }).click();
    } else {
      // MC variant — pick the first choice (may be right or wrong; flow proceeds either way).
      const choices = page.locator(".mc-choice");
      await choices.first().click();
    }
    const next = page.getByRole("button", { name: i === 5 ? /see results/i : /next →/i });
    await next.click();
  }

  await expect(page.getByText(/logbook entry/i)).toBeVisible();
});

test("adaptive toggle and queue preview render on the Callsigns tab", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();

  // Toggle is rendered as a switch; defaults to Adaptive.
  const toggle = page.getByRole("switch", { name: /toggle adaptive practice/i });
  await expect(toggle).toBeVisible();
  await expect(toggle).toHaveAttribute("aria-checked", "true");
  await expect(toggle).toContainText(/adaptive/i);

  // Preview line shows three counts on a fresh install.
  const preview = page.locator(".queue-preview");
  await expect(preview).toBeVisible();
  await expect(preview).toContainText(/weak/i);
  await expect(preview).toContainText(/review/i);
  await expect(preview).toContainText(/new/i);
});

test("flipping to Free Practice hides the queue preview and persists across reload", async ({
  page,
}) => {
  await page.goto("/");
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();

  const toggle = page.getByRole("switch", { name: /toggle adaptive practice/i });
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-checked", "false");
  await expect(toggle).toContainText(/free practice/i);
  await expect(page.locator(".queue-preview")).toHaveCount(0);

  // Preference persists.
  await page.reload();
  const toggleAfterReload = page.getByRole("switch", { name: /toggle adaptive practice/i });
  await expect(toggleAfterReload).toHaveAttribute("aria-checked", "false");
});

test("service worker is registered after first load", async ({ page }) => {
  await page.goto("/");
  // Service worker registration is async; wait for the SW controller to take over.
  await page.waitForFunction(
    async () => {
      if (!("serviceWorker" in navigator)) return false;
      const reg = await navigator.serviceWorker.getRegistration();
      return Boolean(reg);
    },
    null,
    { timeout: 10000 },
  );
});
