import { expect, test } from "@playwright/test";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { eq } from "drizzle-orm";
import { pushSubscriptions } from "../../src/db/schema";

const e2eDbUrl = "file:.e2e/cozy-e2e.db";

async function login(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.getByLabel("ชื่อผู้ใช้").fill("trk");
  await page.getByRole("textbox", { name: /รหัสผ่าน/ }).fill("AdminPass-2026");
  await page.getByRole("button", { name: "เข้าสู่ระบบ" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}

test("PWA manifest is public and installable", async ({ request }) => {
  const response = await request.get("/manifest.webmanifest");
  expect(response.ok()).toBeTruthy();

  const manifest = (await response.json()) as {
    name: string;
    short_name: string;
    start_url: string;
    scope: string;
    display: string;
    icons: Array<{ src: string; sizes: string; purpose?: string }>;
  };

  expect(manifest).toEqual(
    expect.objectContaining({
      name: "Cozy Planner",
      short_name: "Cozy",
      start_url: "/dashboard",
      scope: "/",
      display: "standalone",
    })
  );
  expect(manifest.icons).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ src: "/icon-192.png", sizes: "192x192" }),
      expect.objectContaining({ src: "/icon-512.png", sizes: "512x512" }),
    ])
  );
});

test("shows an explicit install CTA with browser-specific fallback instructions", async ({ page }) => {
  await page.goto("/login");

  await expect(page.getByRole("button", { name: "ติดตั้งแอป" })).toBeVisible();
  await page.getByRole("button", { name: "ติดตั้งแอป" }).click();
  await expect(page.getByRole("dialog", { name: "ติดตั้ง Cozy Planner" })).toBeVisible();
  await expect(page.getByText("Chrome / Edge / Brave บน Mac", { exact: false })).toBeVisible();
  await expect(page.getByText("File → Add to Dock", { exact: false })).toBeVisible();
});

test("shows the install CTA inside the authenticated settings menu", async ({ page }) => {
  await login(page);

  await expect(page.getByRole("button", { name: "ติดตั้งแอป" })).toHaveCount(0);
  await page.getByRole("button", { name: "Settings" }).click();
  await expect(page.getByRole("button", { name: "ติดตั้งแอป" })).toBeVisible();
  await page.getByRole("button", { name: "ติดตั้งแอป" }).click();
  await expect(page.getByRole("dialog", { name: "ติดตั้ง Cozy Planner" })).toBeVisible();
});

test("shows notification settings and stores/removes this device subscription via the authenticated API", async ({ page }) => {
  await login(page);

  await page.evaluate(async () => {
    if (!("serviceWorker" in navigator)) throw new Error("service worker is not available");
    await navigator.serviceWorker.ready;
  });

  await page.getByRole("button", { name: "Settings" }).click();
  await expect(page.getByRole("button", { name: "เปิดแจ้งเตือน" })).toBeVisible();
  await expect(page.getByRole("status")).toContainText(/แจ้งเตือน|notification/i);

  const fakeSubscription = {
    endpoint: "https://example.push.test/send/e2e-device",
    expirationTime: null,
    keys: { p256dh: "e2e-public-key", auth: "e2e-auth-secret" },
  };

  const subscribe = await page.request.post("/api/push/subscribe", { data: fakeSubscription });
  expect(subscribe.ok()).toBeTruthy();

  await expect
    .poll(async () => {
      const client = createClient({ url: e2eDbUrl });
      const db = drizzle(client);
      const rows = await db.select().from(pushSubscriptions).where(eq(pushSubscriptions.userId, 1));
      client.close();
      return rows.length;
    })
    .toBe(1);

  const unsubscribe = await page.request.delete("/api/push/subscribe", { data: { endpoint: fakeSubscription.endpoint } });
  expect(unsubscribe.ok()).toBeTruthy();

  await expect
    .poll(async () => {
      const client = createClient({ url: e2eDbUrl });
      const db = drizzle(client);
      const rows = await db.select().from(pushSubscriptions).where(eq(pushSubscriptions.userId, 1));
      client.close();
      return rows.length;
    })
    .toBe(0);
});

test("service worker registers and shows the public offline fallback without caching private pages", async ({ page, context }) => {
  await page.goto("/login");

  const scriptUrl = await page.evaluate(async () => {
    if (!("serviceWorker" in navigator)) return null;
    const registration = await navigator.serviceWorker.ready;
    return registration.active?.scriptURL ?? null;
  });
  expect(scriptUrl).toContain("/sw.js");

  await expect.poll(() => context.serviceWorkers().length).toBeGreaterThan(0);

  await context.setOffline(true);
  await page.goto("/dashboard");
  await expect(page.getByRole("heading", { name: /ออฟไลน์|Offline/i })).toBeVisible();
  await expect(page.getByRole("main").getByText("Cozy Planner", { exact: true })).toBeVisible();
  await expect(page.getByText(/สวัสดีตอน|กำหนดการวันนี้/)).toHaveCount(0);
});
