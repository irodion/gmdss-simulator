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

test("Procedures tab loads the home tiles and grades a structural sequence", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("tab", { name: "Procedures" }).click();

  await expect(page.getByRole("button", { name: /structural drill/i })).toBeVisible();
  await expect(
    page.getByRole("button", { name: /situational drill: mayday — fire/i }),
  ).toBeVisible();

  await page.getByRole("button", { name: /structural drill/i }).click();
  await expect(page.getByText(/place each element in the correct order/i)).toBeVisible();
  await expect(page.getByRole("heading", { name: /MAYDAY Call/i })).toBeVisible();
  await expect(page.getByRole("heading", { name: /MAYDAY Message/i })).toBeVisible();

  // Place each part's pool items in canonical order. Pool labels match the
  // distress rubric's `sequenceParts` labels exactly.
  const callPart = ["MAYDAY MAYDAY MAYDAY", "Vessel name × 3", "Callsign / MMSI"];
  const messagePart = [
    "MAYDAY",
    "Vessel name",
    "Position",
    "Nature of distress",
    "Request immediate assistance",
    "N persons on board",
    "OVER",
  ];
  for (const label of [...callPart, ...messagePart]) {
    await page.getByRole("button", { name: label, exact: true }).click();
  }

  const submit = page.getByRole("button", { name: /^Submit$/ });
  await expect(submit).toBeEnabled();
  await submit.click();
  await expect(page.getByText(/perfect order/i)).toBeVisible();
});

test("Procedures situational drill grades a transcript and shows the breakdown", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("tab", { name: "Procedures" }).click();
  await page.getByRole("button", { name: /situational drill: mayday — fire/i }).click();

  await page
    .getByLabel(/your transmission/i)
    .fill(
      "MAYDAY MAYDAY MAYDAY THIS IS BLUE DUCK BLUE DUCK BLUE DUCK CALLSIGN 5BCD2 POSITION 50 NORTH FIRE REQUEST IMMEDIATE ASSISTANCE 8 PERSONS ON BOARD OVER",
    );
  await page.getByRole("button", { name: "Submit" }).click();
  await expect(page.getByText(/required fields/i)).toBeVisible();
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
