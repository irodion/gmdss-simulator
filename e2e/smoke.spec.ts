import { expect, test } from "@playwright/test";

test("app renders and shows header", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("text=GMDSS Simulator")).toBeVisible();
});

test("unauthenticated user is redirected to login", async ({ page }) => {
  await page.goto("/learn");
  // Should redirect to login since not authenticated
  await expect(page).toHaveURL(/\/login/);
});
