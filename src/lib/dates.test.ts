import assert from "node:assert/strict";
import { test } from "node:test";
import { fromISO, monthNamesShort, shortDateLabel } from "./dates";

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
