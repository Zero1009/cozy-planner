import { expect, test } from "@playwright/test";
import { login } from "./helpers";


test.describe("add event on a phone", () => {
  test.use({
    viewport: { width: 390, height: 664 },
    deviceScaleFactor: 3,
    hasTouch: true,
    isMobile: true,
  });

  // The old picker was a dropdown of fixed 30-minute slots, absolutely
  // positioned under a trigger that sits on the sheet's last row: 207px of its
  // 220px height fell below the sheet and no slot was reachable without
  // scrolling twice. A quarter-past time could not be expressed at all.
  test("the time field is the platform control and accepts any minute", async ({ page }) => {
    await login(page);
    await page.goto("/calendar");
    await page.getByRole("button", { name: /เพิ่มนัดหมาย/ }).click();

    const time = page.locator('input[type="time"]');
    await expect(time).toBeVisible();

    const box = await time.boundingBox();
    const sheet = await page.locator(".cozy-dialog-card").boundingBox();
    // The control has to sit inside the sheet, which is what the old dropdown
    // failed to do.
    expect(box!.y + box!.height).toBeLessThanOrEqual(sheet!.y + sheet!.height + 1);
    expect(box!.height).toBeGreaterThanOrEqual(44);

    await time.fill("09:15");
    await expect(time).toHaveValue("09:15");
  });

  test("creates an event at a quarter-past time", async ({ page }) => {
    await login(page);
    await page.goto("/calendar");
    await page.getByRole("button", { name: /เพิ่มนัดหมาย/ }).click();

    const title = `ทันตกรรม ${Date.now()}`;
    await page.getByPlaceholder("ชื่อนัดหมายใหม่...").fill(title);
    await page.locator('input[type="time"]').fill("09:15");
    await page.getByRole("button", { name: "เพิ่ม", exact: true }).click();

    let createdId: number | string | null = null;
    await expect
      .poll(async () => {
        const res = await page.request.get("/api/events");
        const events = (await res.json()) as Array<{ id: number | string; title: string; time: string }>;
        const made = events.find((e) => e.title === title);
        createdId = made?.id ?? null;
        return made?.time ?? null;
      })
      .toBe("09:15");

    // Workers share one database and run in file order, so an event left behind
    // here would break agent-event.spec's "no events until confirmed" check.
    if (createdId !== null) await page.request.delete(`/api/events/${createdId}`);
  });

  test("every control in the add-event sheet is a 44px touch target", async ({ page }) => {
    await login(page);
    await page.goto("/calendar");
    await page.getByRole("button", { name: /เพิ่มนัดหมาย/ }).click();
    await expect(page.locator(".cozy-dialog-card")).toBeVisible();

    const undersized = await page.evaluate(() => {
      const card = document.querySelector(".cozy-dialog-card");
      if (!card) return ["no sheet"];
      return [...card.querySelectorAll("button, input, textarea, select")]
        .map((el) => {
          const r = el.getBoundingClientRect();
          return { label: (el.textContent || el.getAttribute("placeholder") || el.tagName).trim().slice(0, 20), w: r.width, h: r.height };
        })
        .filter((x) => x.w > 0 && (x.w < 44 || x.h < 44))
        .map((x) => `${x.label} ${Math.round(x.w)}x${Math.round(x.h)}`);
    });

    expect(undersized).toEqual([]);
  });
});
