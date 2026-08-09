import { expect, test } from "@playwright/test";
import { login, openAiPanel } from "./helpers";

const eventTitle = "Playwright Agent Draft Event";

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
  const composer = await openAiPanel(page);
  await composer.fill("เพิ่มนัดทดสอบวันที่ 24 กรกฎาคม 2026 เวลา 10 ถึง 11 โมง");
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
  const composer = await openAiPanel(page);
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

// iOS Safari zooms the page whenever it focuses a field under 16px, and the
// resulting zoom is what pushes the send button out of view. Chromium never
// zooms, so the size itself is the thing worth asserting — and it only holds
// under a touch emulation, since the rule is scoped to `pointer: coarse`.
test.describe("touch device", () => {
  // Spelled out rather than spread from `devices` because those descriptors
  // carry `defaultBrowserType`, which Playwright rejects inside a describe.
  // `hasTouch` is what makes Chromium report `pointer: coarse`.
  test.use({
    viewport: { width: 390, height: 664 },
    deviceScaleFactor: 3,
    hasTouch: true,
    isMobile: true,
  });

  test("form fields are at least 16px so iOS does not zoom on focus", async ({ page }) => {
    await login(page);
    await openAiPanel(page);

    const undersized = await page.evaluate(() =>
      [...document.querySelectorAll("input, textarea, select")]
        .filter((el) => el.getBoundingClientRect().width > 0)
        .map((el) => ({
          tag: el.tagName,
          type: el.getAttribute("type") ?? "",
          size: parseFloat(getComputedStyle(el).fontSize),
        }))
        .filter((f) => f.size < 16)
    );

    expect(undersized).toEqual([]);
  });

  test("composer and send button stay aligned and reachable", async ({ page }) => {
    await login(page);
    const composer = await openAiPanel(page);
    await composer.fill("นัดหมอพรุ่งนี้");

    const metrics = await page.evaluate(() => {
      const send = document.querySelector<HTMLButtonElement>('button[aria-label="ส่งข้อความ"]');
      const field = document.querySelector<HTMLTextAreaElement>("textarea");
      if (!send || !field) return null;
      const s = send.getBoundingClientRect();
      const f = field.getBoundingClientRect();
      return {
        sendRight: Math.round(s.right),
        sendBottom: Math.round(s.bottom),
        sendW: Math.round(s.width),
        sendH: Math.round(s.height),
        fieldClipped: field.scrollHeight > Math.ceil(f.height) + 1,
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
      };
    });

    expect(metrics!.sendRight).toBeLessThanOrEqual(metrics!.viewportWidth);
    expect(metrics!.sendBottom).toBeLessThanOrEqual(metrics!.viewportHeight);
    // The 16px floor must not overflow the single-line composer.
    expect(metrics!.fieldClipped).toBe(false);
    // Send stays a comfortable touch target.
    expect(metrics!.sendW).toBeGreaterThanOrEqual(44);
    expect(metrics!.sendH).toBeGreaterThanOrEqual(44);
  });
});
