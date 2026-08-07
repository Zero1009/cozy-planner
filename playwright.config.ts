import { defineConfig, devices } from "@playwright/test";

const port = 3112;
const baseURL = `http://localhost:${port}`;
const dbUrl = "file:.e2e/cozy-e2e.db";
const authSecret = "test-auth-secret";
const vapidPublicKey = "BBytdUKCQsSTuHZz1tdd1WTsJXfXmruLKvK1yEUGwygHf97ydAx8eJaZcHO0yTxMJdsTWCW4k7H3SjdA5Tjf6AM";
const vapidPrivateKey = "DokVivLEiaigcZEnqy03FK8NxozrVwgGQ9-UlvXZpnY";

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
    command: `npm run e2e:setup && TURSO_DATABASE_URL='${dbUrl}' AUTH_SECRET='${authSecret}' NEXT_PUBLIC_ENABLE_SW=1 NEXT_PUBLIC_VAPID_PUBLIC_KEY='${vapidPublicKey}' VAPID_PRIVATE_KEY='${vapidPrivateKey}' npm run dev -- --port ${port}`,
    url: baseURL,
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      TURSO_DATABASE_URL: dbUrl,
      AUTH_SECRET: authSecret,
      NEXT_PUBLIC_ENABLE_SW: "1",
      NEXT_PUBLIC_VAPID_PUBLIC_KEY: vapidPublicKey,
      VAPID_PRIVATE_KEY: vapidPrivateKey,
      VAPID_SUBJECT: "mailto:e2e@example.com",
    },
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
