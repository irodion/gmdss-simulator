import { defineConfig } from "vite-plus";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    env: {
      DATABASE_URL:
        process.env["DATABASE_URL"] ?? "postgres://gmdss:gmdss_dev@localhost:5432/gmdss_dev",
      REDIS_URL: process.env["REDIS_URL"] ?? "redis://localhost:6379",
      BETTER_AUTH_SECRET:
        process.env["BETTER_AUTH_SECRET"] ?? "test-secret-at-least-32-characters-long",
    },
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov", "json-summary"],
      thresholds: {
        lines: 85,
        branches: 85,
        functions: 85,
        statements: 85,
      },
    },
  },
});
