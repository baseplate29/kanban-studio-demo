import { defineConfig } from "@playwright/test";

process.loadEnvFile(".env");
const testDatabaseUrl = process.env.DATABASE_URL!.replace(
  "/kanban",
  "/kanban_test",
);

// E2E gets its own server and database so runs never touch dev data.
export default defineConfig({
  testDir: "tests/e2e",
  globalSetup: "./tests/e2e/global-setup.ts",
  fullyParallel: false,
  workers: 1,
  use: {
    baseURL: "http://localhost:3100",
  },
  webServer: {
    command: "npx next dev -p 3100",
    url: "http://localhost:3100",
    reuseExistingServer: false,
    timeout: 60_000,
    env: { DATABASE_URL: testDatabaseUrl, NEXT_DIST_DIR: ".next-e2e" },
  },
});
