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
  // One retry on CI only. This does not fix a flake — it downgrades it from a
  // red build to a "flaky" line in the report while the trace from the failed
  // attempt is still uploaded, so a real regression stays visible.
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI
    ? [["github"], ["html", { open: "never" }]]
    : "list",
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
