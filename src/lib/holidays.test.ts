import assert from "node:assert/strict";
import { test } from "node:test";
import {
  getHoliday,
  holidayName,
  isHoliday,
  THAI_HOLIDAYS,
  upcomingHolidays,
} from "./holidays";

test("known lunar holiday dates are present with th/en names", () => {
  // Confirmed government dates for the lunar Buddhist holidays.
  assert.equal(holidayName("2026-03-03", "en"), "Makha Bucha Day");
  assert.equal(holidayName("2026-05-31", "th"), "วันวิสาขบูชา");
  assert.equal(holidayName("2026-07-29", "en"), "Asalha Bucha Day");
  assert.equal(getHoliday("2025-04-13")?.th, "วันสงกรานต์");
});

test("non-holidays return undefined / false", () => {
  assert.equal(isHoliday("2026-03-04"), false);
  assert.equal(getHoliday("2026-03-04"), undefined);
  assert.equal(holidayName("2026-03-04", "th"), undefined);
});

test("every entry has both th and en names", () => {
  for (const [iso, h] of Object.entries(THAI_HOLIDAYS)) {
    assert.match(iso, /^\d{4}-\d{2}-\d{2}$/);
    assert.ok(h.th.length > 0, `missing th for ${iso}`);
    assert.ok(h.en.length > 0, `missing en for ${iso}`);
  }
});

test("upcomingHolidays returns soonest-first, on/after the given date", () => {
  const next = upcomingHolidays("2026-07-01", "en", 3);
  assert.deepEqual(
    next.map((h) => h.date),
    ["2026-07-28", "2026-07-29", "2026-07-30"]
  );
  // inclusive of the same day
  assert.equal(upcomingHolidays("2026-12-31", "en", 1)[0].date, "2026-12-31");
});
