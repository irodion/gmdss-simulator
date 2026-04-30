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

test("Procedures tab loads the home tile and grades the order-of-phrases drill", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("tab", { name: "Procedures" }).click();

  await expect(page.getByRole("button", { name: /order of phrases drill/i })).toBeVisible();
  await page.getByRole("button", { name: /order of phrases drill/i }).click();
  await expect(page.getByText(/place each element in the correct order/i)).toBeVisible();

  // Canonical order — duplicate labels (MAYDAY × 4, Vessel name × 4) are
  // interchangeable, so always click the first remaining pool button by label.
  const order = [
    "MAYDAY",
    "MAYDAY",
    "MAYDAY",
    "Vessel name",
    "Vessel name",
    "Vessel name",
    "Callsign / MMSI",
    "MAYDAY",
    "Vessel name",
    "Position",
    "Nature of distress",
    "Request immediate assistance",
    "Persons on board",
    "OVER",
  ];
  for (const label of order) {
    await page.locator(".seq-pool-item").getByText(label, { exact: true }).first().click();
  }

  const submit = page.getByRole("button", { name: /^Submit$/ });
  await expect(submit).toBeEnabled();
  await submit.click();
  await expect(page.getByText(/perfect order/i)).toBeVisible();
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
