import { expect, test } from "@playwright/test";

const username = "trk";
const password = "AdminPass-2026";
const eventTitle = "Playwright Agent Draft Event";

async function login(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.getByLabel("ชื่อผู้ใช้").fill(username);
  await page.getByRole("textbox", { name: /รหัสผ่าน/ }).fill(password);
  await page.getByRole("button", { name: "เข้าสู่ระบบ" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}

test("Cozy Agent drafts an event and creates it only after user confirmation", async ({ page }) => {
  await page.route("**/api/ai", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        reply: "**ร่างนัดหมายให้แล้วครับ**\n\nตรวจรายละเอียดก่อนเพิ่มลงปฏิทินครับ",
        actions: [
          {
            type: "create_event",
            event: {
              title: eventTitle,
              category: "personal",
              date: "2026-07-24",
              time: "10:00",
              endTime: "11:00",
            },
          },
        ],
      }),
    });
  });

  await login(page);
  await page.getByRole("button", { name: "ผู้ช่วย AI" }).click();
  await page.getByPlaceholder("พิมพ์คำถามหรือขอความช่วยเหลือ...").fill("เพิ่มนัดทดสอบวันที่ 24 กรกฎาคม 2026 เวลา 10 ถึง 11 โมง");
  await page.getByRole("button", { name: "ส่งข้อความ" }).click();

  await expect(page.getByText(eventTitle)).toBeVisible();
  await expect(page.getByRole("button", { name: "เพิ่มลงปฏิทิน" })).toBeVisible();

  await expect.poll(async () => (await page.request.get("/api/events")).json()).toEqual([]);

  await page.getByRole("button", { name: "เพิ่มลงปฏิทิน" }).click();
  await expect(page.getByText("เพิ่มลงปฏิทินแล้ว")).toBeVisible();

  await expect
    .poll(async () => {
      const res = await page.request.get("/api/events");
      const events = (await res.json()) as Array<{ title: string; date: string; time: string; endTime: string | null }>;
      return events.find((event) => event.title === eventTitle) ?? null;
    })
    .toEqual(expect.objectContaining({ title: eventTitle, date: "2026-07-24", time: "10:00", endTime: "11:00" }));
});

test("mobile Cozy Agent composer keeps the send button inside the viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 720 });
  await login(page);
  await page.getByRole("button", { name: "ผู้ช่วย AI" }).click();

  const composer = page.getByPlaceholder("พิมพ์คำถามหรือขอความช่วยเหลือ...");
  await composer.fill("x".repeat(900));

  const metrics = await page.evaluate(() => {
    const send = document.querySelector<HTMLButtonElement>('button[aria-label="ส่งข้อความ"]');
    const panel = document.querySelector<HTMLElement>('[role="dialog"]');
    if (!send || !panel) return null;
    const sendRect = send.getBoundingClientRect();
    const panelRect = panel.getBoundingClientRect();
    return {
      overflow: Math.max(0, document.documentElement.scrollWidth - window.innerWidth),
      sendRight: Math.round(sendRect.right),
      sendBottom: Math.round(sendRect.bottom),
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      panelBottom: Math.round(panelRect.bottom),
      sendDisabled: send.disabled,
    };
  });

  expect(metrics).toEqual(
    expect.objectContaining({
      overflow: 0,
      sendDisabled: false,
    })
  );
  expect(metrics!.sendRight).toBeLessThanOrEqual(metrics!.viewportWidth);
  expect(metrics!.sendBottom).toBeLessThanOrEqual(metrics!.viewportHeight);
});
