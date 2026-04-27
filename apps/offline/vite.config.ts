import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite-plus";
import { VitePWA } from "vite-plugin-pwa";

const __dirname = dirname(fileURLToPath(import.meta.url));
const FRONTEND_CONTENT = resolve(__dirname, "../frontend/public/content/en");
const OFFLINE_CONTENT = resolve(__dirname, "public/content/en");

/**
 * Mirrors apps/frontend's `public/content/en/{rubrics,scenarios}` into this
 * app's `public/` so the rubric+scenario JSON ships with the static bundle and
 * gets registered by the service-worker precache. The mirrored tree is
 * gitignored — the frontend tree remains the single source of truth.
 */
function copyFrontendContent(): Plugin {
  return {
    name: "offline-copy-frontend-content",
    enforce: "pre",
    buildStart() {
      if (!existsSync(FRONTEND_CONTENT)) {
        throw new Error(`Frontend content not found at ${FRONTEND_CONTENT}`);
      }
      rmSync(OFFLINE_CONTENT, { recursive: true, force: true });
      mkdirSync(OFFLINE_CONTENT, { recursive: true });
      for (const sub of ["rubrics", "scenarios"]) {
        cpSync(resolve(FRONTEND_CONTENT, sub), resolve(OFFLINE_CONTENT, sub), {
          recursive: true,
        });
      }
    },
  };
}

export default defineConfig({
  plugins: [
    copyFrontendContent(),
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg"],
      manifest: {
        name: "ROC Phonetics",
        short_name: "ROC",
        description: "Offline NATO phonetic alphabet & maritime number trainer",
        theme_color: "#f4ede0",
        background_color: "#f4ede0",
        display: "standalone",
        scope: "/",
        start_url: "/",
        icons: [
          {
            src: "favicon.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "any",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,woff2,json}"],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\//,
            handler: "StaleWhileRevalidate",
            options: { cacheName: "google-fonts-stylesheets" },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\//,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-webfonts",
              expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
  test: {
    environment: "happy-dom",
    include: ["src/**/*.test.{ts,tsx}"],
    setupFiles: ["src/test-setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov", "json-summary"],
      exclude: ["src/styles/**", "src/main.tsx"],
      thresholds: {
        lines: 85,
        branches: 85,
        functions: 85,
        statements: 85,
      },
    },
  },
});
