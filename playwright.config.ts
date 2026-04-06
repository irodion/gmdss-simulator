import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env["CI"],
  retries: process.env["CI"] ? 2 : 0,
  workers: process.env["CI"] ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: "http://localhost:4173",
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: [
    {
      command:
        "DATABASE_URL=postgres://gmdss:gmdss_dev@localhost:5432/gmdss_dev REDIS_URL=redis://localhost:6379 BETTER_AUTH_SECRET=e2e-test-secret-at-least-32-characters APP_URL=http://localhost:4173 node apps/api/src/index.ts",
      url: "http://localhost:3001/api/health",
      reuseExistingServer: !process.env["CI"],
      timeout: 30000,
    },
    {
      command: "VITE_API_URL=http://localhost:3001 vp run frontend#dev -- --port 4173",
      url: "http://localhost:4173",
      reuseExistingServer: !process.env["CI"],
    },
  ],
});
