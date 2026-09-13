import assert from "node:assert/strict";
import { test } from "node:test";
import {
  fromISO,
  fullDateLabel,
  longDateLabel,
  monthNamesShort,
  shiftISO,
  shortDateLabel,
  weekdayLabel,
} from "./dates";

test("Thai month abbreviations are the standard dotted forms", () => {
  assert.deepEqual(monthNamesShort("th"), [
    "ม.ค.",
    "ก.พ.",
    "มี.ค.",
    "เม.ย.",
    "พ.ค.",
    "มิ.ย.",
    "ก.ค.",
    "ส.ค.",
    "ก.ย.",
    "ต.ค.",
    "พ.ย.",
    "ธ.ค.",
  ]);
});

test("Thai short dates use the abbreviation, not a truncated month name", () => {
  // Truncating the full names used to give "มกร", "กุมภ", "พฤษ" — not words.
  assert.equal(shortDateLabel(fromISO("2026-01-09"), "th"), "9 ม.ค.");
  assert.equal(shortDateLabel(fromISO("2026-02-28"), "th"), "28 ก.พ.");
  assert.equal(shortDateLabel(fromISO("2026-05-01"), "th"), "1 พ.ค.");
  assert.equal(shortDateLabel(fromISO("2026-12-31"), "th"), "31 ธ.ค.");
});

test("every Thai abbreviation ends in a period and stays short", () => {
  for (const m of monthNamesShort("th")) {
    assert.ok(m.endsWith("."), `${m} should end in a period`);
    assert.ok(m.length <= 5, `${m} should be an abbreviation`);
  }
});

test("English short dates are unchanged", () => {
  assert.equal(shortDateLabel(fromISO("2026-01-09"), "en"), "9 Jan");
  assert.equal(shortDateLabel(fromISO("2026-09-30"), "en"), "30 Sep");
});

test("shiftISO crosses a month boundary", () => {
  assert.equal(shiftISO("2026-08-31", 1), "2026-09-01");
  assert.equal(shiftISO("2026-09-01", -1), "2026-08-31");
});

test("shiftISO crosses a year boundary", () => {
  assert.equal(shiftISO("2026-12-31", 1), "2027-01-01");
  assert.equal(shiftISO("2027-01-01", -1), "2026-12-31");
});

test("shiftISO lands on a leap day", () => {
  // 2028 is a leap year (divisible by 4, not a century).
  assert.equal(shiftISO("2028-02-28", 1), "2028-02-29");
  assert.equal(shiftISO("2028-03-01", -1), "2028-02-29");
});

test("shiftISO handles multi-day negative shifts", () => {
  assert.equal(shiftISO("2026-08-09", -10), "2026-07-30");
});

test("weekdayLabel gives the long day-of-week name in both languages", () => {
  // 2026-08-09 is a Sunday.
  assert.equal(weekdayLabel(fromISO("2026-08-09"), "th"), "อาทิตย์");
  assert.equal(weekdayLabel(fromISO("2026-08-09"), "en"), "Sunday");
});

test("fullDateLabel spells out the month with the localized year", () => {
  assert.equal(fullDateLabel(fromISO("2026-08-09"), "th"), "9 สิงหาคม 2569");
  assert.equal(fullDateLabel(fromISO("2026-08-09"), "en"), "9 August 2026");
});

test("longDateLabel combines weekday, full date and localized year", () => {
  assert.equal(longDateLabel(fromISO("2026-08-09"), "th"), "วันอาทิตย์ที่ 9 สิงหาคม 2569");
  assert.equal(longDateLabel(fromISO("2026-08-09"), "en"), "Sunday, August 9, 2026");
});
