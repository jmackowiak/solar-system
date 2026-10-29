import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { seoPlugin } from "./scripts/seo-plugin.ts";
export default defineConfig({
  plugins: [react(), seoPlugin()],
  server: { host: "0.0.0.0" },
  test: {
    environment: "jsdom",
    include: ["src/**/*.test.{ts,tsx}"],
    setupFiles: ["./src/test-setup.ts"],
  },
  build: { chunkSizeWarningLimit: 1200 },
});
