import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { fromISO, shortDateLabel } from "./dates";

describe("date labels", () => {
  it("formats Thai short month labels with standard abbreviations", () => {
    assert.equal(shortDateLabel(fromISO("2026-01-28"), "th"), "28 ม.ค.");
    assert.equal(shortDateLabel(fromISO("2026-02-28"), "th"), "28 ก.พ.");
    assert.equal(shortDateLabel(fromISO("2026-07-28"), "th"), "28 ก.ค.");
    assert.equal(shortDateLabel(fromISO("2026-12-28"), "th"), "28 ธ.ค.");
  });
});
