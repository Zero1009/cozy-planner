import { expect, test, type Page } from "@playwright/test";
import { login } from "./helpers";
import { fromISO, fullDateLabel, longDateLabel, shiftISO, toISO } from "@/lib/dates";

/** The e2e database starts empty, so each test seeds and removes its own row. */
async function createEvent(page: Page, body: Record<string, unknown>) {
  const res = await page.request.post("/api/events", { data: body });
  expect(res.ok()).toBe(true);
  return (await res.json()) as { id: number };
}

/** The month-grid cell containing this event's title chip — a real `<button>`,
 *  unlike the agenda rows inside the sheet it opens. A day cell shows only its
 *  first two chips, so tests must clean up their own events even on failure —
 *  a leftover row on today's cell can push the next test's title out of view. */
function monthCell(page: Page, title: string) {
  return page.locator("button").filter({ hasText: title }).first();
}

/**
 * The day-detail dialog itself. Its `aria-label` is the *current* day's long
 * date and changes as the sheet steps between days, so it must be located by
 * its stable class rather than by role+name — a locator frozen on the name
 * from the moment it opened would stop resolving the instant the date (and
 * therefore the label) moves on.
 */
function daySheet(page: Page) {
  return page.locator(".cozy-day-sheet");
}

test.describe("day-detail sheet", () => {
  test.use({
    viewport: { width: 390, height: 664 },
    deviceScaleFactor: 3,
    hasTouch: true,
    isMobile: true,
    // The sheet's open animation has a deliberate overshoot easing
    // (`cubic-bezier(0.22, 1.18, 0.36, 1)`), so a geometry assertion taken
    // mid-animation can catch a transform that hasn't settled to `none` yet.
    // Reduced motion — which the sheet's CSS already has to honor — sidesteps
    // that race entirely instead of padding every assertion with waits.
    contextOptions: { reducedMotion: "reduce" },
  });

  test("tapping a month cell opens a dialog named for that day", async ({ page }) => {
    await login(page);
    const dateISO = toISO(new Date());
    const title = `เดี่ยว ${Date.now()}`;
    const { id } = await createEvent(page, { title, category: "work", date: dateISO, time: "09:00" });

    try {
      await page.goto("/calendar");
      await monthCell(page, title).click();

      const dialog = daySheet(page);
      await expect(dialog).toBeVisible();
      await expect(dialog).toHaveAttribute("aria-label", longDateLabel(fromISO(dateISO), "th"));
    } finally {
      await page.request.delete(`/api/events/${id}`);
    }
  });

  test("the sheet lists that day's event and not a neighbour's", async ({ page }) => {
    await login(page);
    const dateISO = toISO(new Date());
    const neighborISO = shiftISO(dateISO, 1);
    const titleToday = `วันนี้ ${Date.now()}`;
    const titleNeighbor = `เพื่อนบ้าน ${Date.now()}`;
    const today = await createEvent(page, { title: titleToday, category: "work", date: dateISO, time: "09:00" });
    const neighbor = await createEvent(page, {
      title: titleNeighbor,
      category: "work",
      date: neighborISO,
      time: "09:00",
    });

    try {
      await page.goto("/calendar");
      await monthCell(page, titleToday).click();

      const dialog = daySheet(page);
      await expect(dialog).toBeVisible();
      await expect(dialog.getByText(titleToday)).toBeVisible();
      await expect(dialog.getByText(titleNeighbor)).toHaveCount(0);
    } finally {
      await page.request.delete(`/api/events/${today.id}`);
      await page.request.delete(`/api/events/${neighbor.id}`);
    }
  });

  test("the › and ‹ buttons step the heading forward and back one day", async ({ page }) => {
    await login(page);
    const dateISO = toISO(new Date());
    const title = `ปุ่ม ${Date.now()}`;
    const { id } = await createEvent(page, { title, category: "work", date: dateISO, time: "09:00" });

    try {
      await page.goto("/calendar");
      await monthCell(page, title).click();

      const dialog = daySheet(page);
      await expect(dialog).toBeVisible();

      await dialog.getByRole("button", { name: "วันถัดไป" }).click();
      await expect(
        dialog.getByText(fullDateLabel(fromISO(shiftISO(dateISO, 1)), "th"), { exact: true })
      ).toBeVisible();

      await dialog.getByRole("button", { name: "วันก่อนหน้า" }).click();
      await expect(dialog.getByText(fullDateLabel(fromISO(dateISO), "th"), { exact: true })).toBeVisible();
    } finally {
      await page.request.delete(`/api/events/${id}`);
    }
  });

  test("ArrowRight and ArrowLeft step the day the same way the buttons do", async ({ page }) => {
    await login(page);
    const dateISO = toISO(new Date());
    const title = `ลูกศร ${Date.now()}`;
    const { id } = await createEvent(page, { title, category: "work", date: dateISO, time: "09:00" });

    try {
      await page.goto("/calendar");
      await monthCell(page, title).click();

      const dialog = daySheet(page);
      await expect(dialog).toBeVisible();

      await page.keyboard.press("ArrowRight");
      await expect(
        dialog.getByText(fullDateLabel(fromISO(shiftISO(dateISO, 1)), "th"), { exact: true })
      ).toBeVisible();

      await page.keyboard.press("ArrowLeft");
      await expect(dialog.getByText(fullDateLabel(fromISO(dateISO), "th"), { exact: true })).toBeVisible();
    } finally {
      await page.request.delete(`/api/events/${id}`);
    }
  });

  // `page.mouse` produces real pointer events in Chromium (mice are pointer
  // devices too), so this exercises `useDaySwipe` itself rather than a
  // simulated gesture — the same guarantee `AppShell`'s draggable AI button
  // relies on for its own pointer-event tests.
  test("a mouse drag across the sheet body advances the day", async ({ page }) => {
    await login(page);
    const dateISO = toISO(new Date());
    const title = `ลาก ${Date.now()}`;
    const { id } = await createEvent(page, { title, category: "work", date: dateISO, time: "09:00" });

    try {
      await page.goto("/calendar");
      await monthCell(page, title).click();

      const dialog = daySheet(page);
      await expect(dialog).toBeVisible();

      const body = dialog.locator(".cozy-day-sheet-body");
      const box = (await body.boundingBox())!;
      // Start well clear of both screen edges so the back-swipe edge guard
      // never gets a chance to eat the gesture.
      const startX = box.x + box.width * 0.7;
      const y = box.y + box.height / 2;

      await page.mouse.move(startX, y);
      await page.mouse.down();
      await page.mouse.move(startX - 140, y, { steps: 10 });
      await page.mouse.up();

      // Drag left -> next day.
      await expect(
        dialog.getByText(fullDateLabel(fromISO(shiftISO(dateISO, 1)), "th"), { exact: true })
      ).toBeVisible();
    } finally {
      await page.request.delete(`/api/events/${id}`);
    }
  });

  test("advancing past the month end and closing leaves the calendar on the next month", async ({ page }) => {
    await login(page);
    const dateISO = toISO(new Date());
    const title = `เดือน ${Date.now()}`;
    const { id } = await createEvent(page, { title, category: "work", date: dateISO, time: "09:00" });

    try {
      await page.goto("/calendar");
      const heading = page.locator("h1.font-display");
      const initialLabel = await heading.textContent();

      await monthCell(page, title).click();
      const dialog = daySheet(page);
      await expect(dialog).toBeVisible();

      const nextDay = dialog.getByRole("button", { name: "วันถัดไป" });
      // Exactly enough presses to land on the 1st of next month, regardless of
      // which day of the month `dateISO` happens to be when this runs.
      const d = fromISO(dateISO);
      const daysLeftInMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate() - d.getDate();
      for (let i = 0; i < daysLeftInMonth + 1; i++) {
        await nextDay.click();
      }

      await dialog.getByRole("button", { name: "ปิด" }).click();
      await expect(dialog).toBeHidden();
      await expect(heading).not.toHaveText(initialLabel ?? "");
    } finally {
      await page.request.delete(`/api/events/${id}`);
    }
  });

  test("tapping a row opens the editor; saving returns to the day sheet on the same day", async ({ page }) => {
    await login(page);
    const dateISO = toISO(new Date());
    const title = `แถว ${Date.now()}`;
    const { id } = await createEvent(page, { title, category: "work", date: dateISO, time: "09:00" });

    try {
      await page.goto("/calendar");
      await monthCell(page, title).click();

      const dayDialog = daySheet(page);
      await expect(dayDialog).toBeVisible();
      await dayDialog.locator('div[role="button"]').filter({ hasText: title }).first().click();

      const editDialog = page.getByRole("dialog", { name: "แก้ไขนัดหมาย" });
      await expect(editDialog).toBeVisible();
      await editDialog.getByRole("button", { name: "บันทึก" }).click();
      await expect(editDialog).toBeHidden();

      // The day sheet was never unmounted underneath the edit sheet.
      await expect(dayDialog).toBeVisible();
      await expect(dayDialog.getByText(title)).toBeVisible();
    } finally {
      await page.request.delete(`/api/events/${id}`);
    }
  });

  test("every control in the day sheet is a 44px touch target", async ({ page }) => {
    await login(page);
    const dateISO = toISO(new Date());
    const title = `เป้าหมาย ${Date.now()}`;
    const { id } = await createEvent(page, { title, category: "work", date: dateISO, time: "09:00" });

    try {
      await page.goto("/calendar");
      // The sheet's open animation has a deliberate overshoot easing
      // (`cubic-bezier(0.22, 1.18, 0.36, 1)`), so a geometry check taken
      // mid-animation can catch a transform that hasn't settled to `none`
      // yet — and under throttled/software-rendered CI runners a "260ms"
      // animation's wall-clock frames can take far longer than 260ms.
      // `reducedMotion: "reduce"` above asks the browser to skip it; this
      // forces the same CSS rule directly so the assertion doesn't also
      // depend on that emulation being supported by whatever engine runs it.
      await page.addStyleTag({
        content: `.cozy-sheet-pop, .cozy-day-in-next, .cozy-day-in-prev { animation: none !important; }
                   .cozy-day-pane { transition: none !important; }`,
      });
      await monthCell(page, title).click();
      await expect(daySheet(page)).toBeVisible();

      const undersized = await page.evaluate(() => {
        const card = document.querySelector(".cozy-day-sheet");
        if (!card) return ["no sheet"];
        return [...card.querySelectorAll("button, input, textarea, select")]
          .map((el) => {
            const r = el.getBoundingClientRect();
            return {
              label: (el.textContent || el.getAttribute("placeholder") || el.tagName).trim().slice(0, 20),
              w: r.width,
              h: r.height,
            };
          })
          .filter((x) => x.w > 0 && (x.w < 44 || x.h < 44))
          .map((x) => `${x.label} ${Math.round(x.w)}x${Math.round(x.h)}`);
      });

      expect(undersized).toEqual([]);
    } finally {
      await page.request.delete(`/api/events/${id}`);
    }
  });
});
