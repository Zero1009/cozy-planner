import { expect, test, type Page } from "@playwright/test";

const username = "trk";
const password = "AdminPass-2026";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

async function login(page: Page) {
  await page.goto("/login");
  await page.getByLabel("ชื่อผู้ใช้").fill(username);
  await page.getByRole("textbox", { name: /รหัสผ่าน/ }).fill(password);
  await page.getByRole("button", { name: "เข้าสู่ระบบ" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}

test("todo delete requires explicit confirmation", async ({ page }) => {
  await login(page);
  const title = `Delete confirm todo ${Date.now()}`;
  const created = await page.request.post("/api/todos", {
    data: { title, category: "personal", priority: "med", due: todayISO() },
  });
  expect(created.ok()).toBeTruthy();

  await page.goto("/todos");
  await expect(page.getByText(title)).toBeVisible();
  await page.getByRole("button", { name: `ลบงาน: ${title}` }).click();

  await expect(page.getByRole("dialog", { name: "ลบงานนี้ไหม?" })).toBeVisible();
  await expect.poll(async () => {
    const rows = (await page.request.get("/api/todos").then((res) => res.json())) as Array<{ title: string }>;
    return rows.some((todo) => todo.title === title);
  }).toBe(true);

  await page.getByRole("button", { name: "ยกเลิก" }).click();
  await expect(page.getByRole("dialog", { name: "ลบงานนี้ไหม?" })).toHaveCount(0);
  await expect(page.getByText(title)).toBeVisible();

  await page.getByRole("button", { name: `ลบงาน: ${title}` }).click();
  await page.getByRole("button", { name: "ลบงาน", exact: true }).click();
  await expect.poll(async () => {
    const rows = (await page.request.get("/api/todos").then((res) => res.json())) as Array<{ title: string }>;
    return rows.some((todo) => todo.title === title);
  }).toBe(false);
});

test("calendar event delete requires explicit confirmation", async ({ page }) => {
  await login(page);
  const title = `Delete confirm event ${Date.now()}`;
  const created = await page.request.post("/api/events", {
    data: { title, category: "work", date: todayISO(), time: "14:00" },
  });
  expect(created.ok()).toBeTruthy();

  await page.goto("/calendar");
  await expect(page.getByText(title)).toBeVisible();
  await page.getByRole("button", { name: `ลบนัดหมาย: ${title}` }).click();

  await expect(page.getByRole("dialog", { name: "ลบนัดหมายนี้ไหม?" })).toBeVisible();
  await expect.poll(async () => {
    const rows = (await page.request.get("/api/events").then((res) => res.json())) as Array<{ title: string }>;
    return rows.some((event) => event.title === title);
  }).toBe(true);

  await page.getByRole("button", { name: "ลบนัดหมาย", exact: true }).click();
  await expect.poll(async () => {
    const rows = (await page.request.get("/api/events").then((res) => res.json())) as Array<{ title: string }>;
    return rows.some((event) => event.title === title);
  }).toBe(false);
});
