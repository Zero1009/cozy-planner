import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { holidaysForYear, parseGoogleHolidayIcs } from "./holidays";

const sampleIcs = [
  "BEGIN:VCALENDAR",
  "BEGIN:VEVENT",
  "DTSTART;VALUE=DATE:20260101",
  "DESCRIPTION:วันหยุดนักขัตฤกษ์",
  "SUMMARY:วันขึ้นปีใหม่",
  "END:VEVENT",
  "BEGIN:VEVENT",
  "DTSTART;VALUE=DATE:20260217",
  "DESCRIPTION:วันสำคัญ\\nไม่ใช่วันหยุดราชการ",
  "SUMMARY:วันตรุษจีน",
  "END:VEVENT",
  "BEGIN:VEVENT",
  "DTSTART;VALUE=DATE:20261205",
  "DESCRIPTION:Public holiday",
  "SUMMARY:Father's Day",
  "END:VEVENT",
  "END:VCALENDAR",
].join("\r\n");

describe("holiday helpers", () => {
  it("parses only public holidays from Google Holiday Calendar ICS", () => {
    const holidays = parseGoogleHolidayIcs(sampleIcs, 2026);

    assert.deepEqual(holidays, [
      { date: "2026-01-01", localName: "วันขึ้นปีใหม่" },
      { date: "2026-12-05", localName: "Father's Day" },
    ]);
  });

  it("indexes holidays by ISO date for calendar rendering", () => {
    const byDate = holidaysForYear(parseGoogleHolidayIcs(sampleIcs, 2026));

    assert.equal(byDate.get("2026-01-01")?.[0]?.localName, "วันขึ้นปีใหม่");
    assert.equal(byDate.has("2026-02-17"), false);
  });
});
