import { expect, test } from "@playwright/test";

test("config screen renders the four drill modes", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("tab", { name: "Callsigns" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "Numbers" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "Listen" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "Procedures" })).toBeVisible();
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

  // The scenario brief is rendered above the slots.
  await expect(page.getByLabel("Scenario").first()).toBeVisible();

  // The priority openings group offers all three priorities as chips,
  // so the user must pick the correct one for the scenario.
  const priorityPool = page.getByLabel("Priority openings");
  await expect(priorityPool.getByRole("button", { name: "MAYDAY" }).first()).toBeVisible();
  await expect(priorityPool.getByRole("button", { name: "PAN-PAN" }).first()).toBeVisible();
  await expect(priorityPool.getByRole("button", { name: "SECURITE" }).first()).toBeVisible();

  // Submit is disabled until every slot is filled.
  await expect(page.getByRole("button", { name: /^Submit$/ })).toBeDisabled();
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
