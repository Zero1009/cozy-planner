import { expect, type Page } from "@playwright/test";

export const USERNAME = "trk";
export const PASSWORD = "AdminPass-2026";

export async function login(page: Page) {
  await page.goto("/login");
  await page.getByLabel("ชื่อผู้ใช้").fill(USERNAME);
  await page.getByRole("textbox", { name: /รหัสผ่าน/ }).fill(PASSWORD);
  await page.getByRole("button", { name: "เข้าสู่ระบบ" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  // The URL flips before the client app is live. The stat tiles only render
  // once hydration has run and the todo/event queries have settled, so waiting
  // on one means the next interaction lands on a page that can handle it.
  await expect(page.getByText("งานวันนี้")).toBeVisible();
}

/**
 * The floating assistant button is driven by pointer events, and it only opens
 * on a pointerup that follows a pointerdown it saw. A tap that arrives while
 * the app is still settling is dropped, which showed up on CI as the composer
 * never appearing. Assert the panel opened instead of assuming the first tap
 * took; opening is idempotent, so a repeat tap is safe.
 */
export async function openAiPanel(page: Page) {
  const composer = page.getByPlaceholder("พิมพ์คำถามหรือขอความช่วยเหลือ...");
  await expect(async () => {
    await page.getByRole("button", { name: "ผู้ช่วย AI" }).click();
    await expect(composer).toBeVisible({ timeout: 2000 });
  }).toPass({ timeout: 15000 });
  return composer;
}
