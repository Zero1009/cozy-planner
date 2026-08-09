import { expect, test, type Page } from "@playwright/test";

const username = "trk";
const password = "AdminPass-2026";

async function login(page: Page) {
  await page.goto("/login");
  await page.getByLabel("ชื่อผู้ใช้").fill(username);
  await page.getByRole("textbox", { name: /รหัสผ่าน/ }).fill(password);
  await page.getByRole("button", { name: "เข้าสู่ระบบ" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}

/**
 * An agenda/todo row is a `div[role="button"]`. Month-grid day cells are real
 * `<button>` elements that also contain the event title in their chip, so
 * matching on role alone picks the calendar cell and merely selects the day.
 */
function itemRow(page: Page, title: string) {
  return page.locator('div[role="button"]').filter({ hasText: title }).first();
}

/** The e2e database starts empty, so each test seeds and removes its own row. */
async function createEvent(page: Page, body: Record<string, unknown>) {
  const res = await page.request.post("/api/events", { data: body });
  expect(res.ok()).toBe(true);
  return (await res.json()) as { id: number };
}

async function createTodo(page: Page, body: Record<string, unknown>) {
  const res = await page.request.post("/api/todos", { data: body });
  expect(res.ok()).toBe(true);
  return (await res.json()) as { id: number };
}

test.describe("editing your own items", () => {
  test.use({
    viewport: { width: 390, height: 664 },
    deviceScaleFactor: 3,
    hasTouch: true,
    isMobile: true,
  });

  test("tapping an event opens it prefilled and saves title, date and time", async ({ page }) => {
    await login(page);
    const title = `ประชุม ${Date.now()}`;
    const { id } = await createEvent(page, {
      title,
      category: "work",
      date: "2026-08-09",
      time: "09:00",
    });

    await page.goto("/calendar");
    await itemRow(page, title).click();

    const dialog = page.getByRole("dialog", { name: "แก้ไขนัดหมาย" });
    await expect(dialog).toBeVisible();
    // Prefilled from the record, not blank.
    await expect(dialog.locator('input[type="date"]')).toHaveValue("2026-08-09");
    await expect(dialog.locator('input[type="time"]')).toHaveValue("09:00");

    await dialog.locator("input:not([type])").first().fill(`${title} แก้แล้ว`);
    await dialog.locator('input[type="date"]').fill("2026-08-20");
    await dialog.locator('input[type="time"]').fill("14:45");
    await dialog.getByRole("button", { name: "บันทึก" }).click();

    await expect(dialog).toBeHidden();

    await expect
      .poll(async () => {
        const res = await page.request.get("/api/events");
        const events = (await res.json()) as Array<{ id: number; title: string; date: string; time: string }>;
        const row = events.find((e) => e.id === id);
        return row ? `${row.title}|${row.date}|${row.time}` : null;
      })
      .toBe(`${title} แก้แล้ว|2026-08-20|14:45`);

    await page.request.delete(`/api/events/${id}`);
  });

  test("tapping a task opens a due date and no time, and saves", async ({ page }) => {
    await login(page);
    const title = `จ่ายบิล ${Date.now()}`;
    const { id } = await createTodo(page, {
      title,
      category: "personal",
      priority: "med",
      due: "2026-08-09",
    });

    await page.goto("/todos");
    await itemRow(page, title).click();

    const dialog = page.getByRole("dialog", { name: "แก้ไขสิ่งที่ต้องทำ" });
    await expect(dialog).toBeVisible();
    await expect(dialog.locator('input[type="date"]')).toHaveValue("2026-08-09");
    // A task has no start time, so the sheet must not offer one.
    await expect(dialog.locator('input[type="time"]')).toHaveCount(0);

    await dialog.locator("input:not([type])").first().fill(`${title} แก้แล้ว`);
    await dialog.locator('input[type="date"]').fill("2026-08-25");
    await dialog.getByRole("button", { name: "บันทึก" }).click();

    await expect(dialog).toBeHidden();

    await expect
      .poll(async () => {
        const res = await page.request.get("/api/todos");
        const todos = (await res.json()) as Array<{ id: number; title: string; due: string }>;
        const row = todos.find((t) => t.id === id);
        return row ? `${row.title}|${row.due}` : null;
      })
      .toBe(`${title} แก้แล้ว|2026-08-25`);

    await page.request.delete(`/api/todos/${id}`);
  });

  test("the tickbox toggles done instead of opening the editor", async ({ page }) => {
    await login(page);
    const title = `ติ๊ก ${Date.now()}`;
    const { id } = await createTodo(page, {
      title,
      category: "personal",
      priority: "med",
      due: "2026-08-09",
    });

    await page.goto("/todos");
    const row = itemRow(page, title);
    await row.getByRole("button", { name: "toggle done" }).click();

    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect
      .poll(async () => {
        const res = await page.request.get("/api/todos");
        const todos = (await res.json()) as Array<{ id: number; done: boolean }>;
        return todos.find((t) => t.id === id)?.done ?? null;
      })
      .toBe(true);

    await page.request.delete(`/api/todos/${id}`);
  });

  test("Thai short dates use dotted month abbreviations", async ({ page }) => {
    await login(page);
    const { id } = await createTodo(page, {
      title: `วันที่ ${Date.now()}`,
      category: "personal",
      priority: "med",
      due: "2026-01-20",
    });

    await page.goto("/todos");
    // "20 ม.ค." — the old code truncated the full name to "มกร".
    await expect(page.getByText("20 ม.ค.").first()).toBeVisible();
    await expect(page.getByText("มกร", { exact: true })).toHaveCount(0);

    await page.request.delete(`/api/todos/${id}`);
  });
});
