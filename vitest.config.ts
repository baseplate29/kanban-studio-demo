import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@": path.resolve(__dirname) },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    globalSetup: ["./tests/integration/global-setup.ts"],
    include: ["**/*.test.{ts,tsx}"],
    exclude: ["node_modules", "tests/e2e/**"],
  },
});
