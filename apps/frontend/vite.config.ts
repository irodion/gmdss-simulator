import react from "@vitejs/plugin-react";
import { defineConfig } from "vite-plus";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg", "icons.svg"],
      manifest: {
        name: "GMDSS Simulator",
        short_name: "GMDSS",
        description: "Maritime radio training application",
        theme_color: "#0d1926",
        background_color: "#0d1926",
        display: "standalone",
        scope: "/",
        start_url: "/",
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,woff2}"],
        runtimeCaching: [
          {
            urlPattern: /^https?:\/\/.*\/api\/content\/.*/i,
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "content-api-cache",
              expiration: { maxEntries: 100, maxAgeSeconds: 86400 },
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
      exclude: [
        "src/styles/**",
        "src/features/simulator/SimulatorPage.tsx",
        "src/features/simulator/drills/DrillPage.tsx",
        "src/features/simulator/audio/**",
        "src/features/simulator/hooks/use-audio.ts",
        "src/features/simulator/hooks/use-ai-session.ts",
        "src/features/simulator/hooks/use-speech-recognition.ts",
        "src/features/simulator/transport/**",
        "src/features/simulator/ui/MicButton.tsx",
        "src/features/simulator/ui/TurnStatusIndicator.tsx",
      ],
      thresholds: {
        lines: 85,
        branches: 85,
        functions: 85,
        statements: 85,
      },
    },
  },
});
