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

test("calendar shows Thai public holidays in the selected day's agenda", async ({ page }) => {
  await page.route("**/api/holidays?**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([{ date: "2026-07-28", localName: "วันหยุดทดสอบ" }]),
    });
  });

  await login(page);
  await page.goto("/calendar");
  await page.getByRole("button", { name: /^28$/ }).nth(1).click();

  await expect(page.getByText("วันหยุดทดสอบ")).toBeVisible();
  await expect(page.getByText("วันหยุด", { exact: true })).toBeVisible();
});

test("calendar highlights the selected day with a cat paw", async ({ page }) => {
  await login(page);
  await page.goto("/calendar");

  await expect(page.getByLabel("selected day cat paw")).toBeVisible();
});
