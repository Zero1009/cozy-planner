import { defineConfig, devices } from "@playwright/test";

const port = 3112;
const baseURL = `http://localhost:${port}`;
const dbUrl = "file:.e2e/cozy-e2e.db";
const authSecret = "test-auth-secret";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30_000,
  fullyParallel: false,
  workers: 1,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: {
    command: `npm run e2e:setup && TURSO_DATABASE_URL='${dbUrl}' AUTH_SECRET='${authSecret}' NEXT_PUBLIC_ENABLE_SW=1 npm run dev -- --port ${port}`,
    url: baseURL,
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      TURSO_DATABASE_URL: dbUrl,
      AUTH_SECRET: authSecret,
      NEXT_PUBLIC_ENABLE_SW: "1",
    },
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
