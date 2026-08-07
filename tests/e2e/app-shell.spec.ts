import { expect, test } from "@playwright/test";

const username = "trk";
const password = "AdminPass-2026";

async function login(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.getByLabel("ชื่อผู้ใช้").fill(username);
  await page.getByRole("textbox", { name: /รหัสผ่าน/ }).fill(password);
  await page.getByRole("button", { name: "เข้าสู่ระบบ" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}

test("top navigation stays visible while scrolling", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await login(page);
  await page.goto("/calendar");

  const initialTop = await page.locator("header").evaluate((header) => header.getBoundingClientRect().top);
  await page.evaluate(() => {
    const spacer = document.createElement("div");
    spacer.setAttribute("data-testid", "sticky-scroll-spacer");
    spacer.style.height = "1600px";
    document.querySelector("main")?.appendChild(spacer);
  });
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0);

  const scrolledTop = await page.locator("header").evaluate((header) => header.getBoundingClientRect().top);
  expect(initialTop).toBe(0);
  expect(Math.abs(scrolledTop)).toBeLessThanOrEqual(1);
});
