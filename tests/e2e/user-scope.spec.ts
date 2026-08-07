import { expect, test, type Browser, type Page } from "@playwright/test";

const adminUsername = "trk";
const adminPassword = "AdminPass-2026";
const otherUsername = "scope-user";
const otherPassword = "ScopePass-2026";

async function login(page: Page, username: string, password: string) {
  await page.goto("/login");
  await page.getByLabel("ชื่อผู้ใช้").fill(username);
  await page.getByRole("textbox", { name: /รหัสผ่าน/ }).fill(password);
  await page.getByRole("button", { name: "เข้าสู่ระบบ" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}

async function newLoggedInPage(browser: Browser, username: string, password: string) {
  const context = await browser.newContext();
  const page = await context.newPage();
  await login(page, username, password);
  return { context, page };
}

test("planner events and todos are visible and mutable only by their owner", async ({ browser }) => {
  const admin = await newLoggedInPage(browser, adminUsername, adminPassword);

  const createUser = await admin.page.request.post("/api/admin/users", {
    data: {
      username: otherUsername,
      displayName: "Scope User",
      password: otherPassword,
      isAdmin: false,
    },
  });
  expect(createUser.ok()).toBeTruthy();

  const createdEvent = await admin.page.request.post("/api/events", {
    data: {
      title: "Admin private appointment",
      category: "work",
      date: "2026-08-01",
      time: "10:00",
    },
  });
  expect(createdEvent.ok()).toBeTruthy();
  const event = (await createdEvent.json()) as { id: number; title: string };

  const createdTodo = await admin.page.request.post("/api/todos", {
    data: {
      title: "Admin private todo",
      category: "personal",
      priority: "med",
      due: "2026-08-01",
    },
  });
  expect(createdTodo.ok()).toBeTruthy();
  const todo = (await createdTodo.json()) as { id: number; title: string };

  const other = await newLoggedInPage(browser, otherUsername, otherPassword);

  await expect.poll(async () => await other.page.request.get("/api/events").then((res) => res.json())).toEqual([]);
  await expect.poll(async () => await other.page.request.get("/api/todos").then((res) => res.json())).toEqual([]);

  const patchOtherEvent = await other.page.request.patch(`/api/events/${event.id}`, {
    data: { title: "Hijacked appointment" },
  });
  expect(patchOtherEvent.status()).toBe(404);

  const deleteOtherTodo = await other.page.request.delete(`/api/todos/${todo.id}`);
  expect(deleteOtherTodo.status()).toBe(404);

  await expect
    .poll(async () => {
      const events = (await admin.page.request.get("/api/events").then((res) => res.json())) as Array<{ title: string }>;
      const todos = (await admin.page.request.get("/api/todos").then((res) => res.json())) as Array<{ title: string }>;
      return {
        hasCreatedEvent: events.some((row) => row.title === "Admin private appointment"),
        hasCreatedTodo: todos.some((row) => row.title === "Admin private todo"),
      };
    })
    .toEqual({ hasCreatedEvent: true, hasCreatedTodo: true });

  await other.context.close();
  await admin.context.close();
});
