import assert from "node:assert/strict";
import { test } from "node:test";
import {
  getHoliday,
  holidayName,
  holidaysBetween,
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

test("holidaysBetween returns all holidays within an inclusive date range", () => {
  // August 2026: only Mother's Day (12th) — this is the "this month" query
  // the AI assistant relies on to answer "what holidays are this month?".
  const august = holidaysBetween("2026-08-01", "2026-08-31", "th");
  assert.deepEqual(
    august.map((h) => h.date),
    ["2026-08-12"]
  );
  assert.equal(august[0].name, "วันแม่แห่งชาติ");

  // A month with no holidays returns an empty array, not undefined.
  assert.deepEqual(holidaysBetween("2026-09-01", "2026-09-30", "en"), []);

  // Range spanning a lunar cluster (July 2026: King's Birthday, Asalha Bucha,
  // Khao Phansa fall on consecutive days).
  const july = holidaysBetween("2026-07-01", "2026-07-31", "en");
  assert.deepEqual(
    july.map((h) => h.date),
    ["2026-07-28", "2026-07-29", "2026-07-30"]
  );
});
