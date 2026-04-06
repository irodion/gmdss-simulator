import { defineConfig } from "vite-plus";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    env: {
      DATABASE_URL:
        process.env["DATABASE_URL"] ?? "postgres://gmdss:gmdss_dev@localhost:5432/gmdss_dev",
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
