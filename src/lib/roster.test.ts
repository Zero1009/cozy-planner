import assert from "node:assert/strict";
import { test } from "node:test";
import { buildPreview, decodeCell, findTables, matchPeople, normalizeName } from "./roster";
import type { CellValue, Sheet } from "./xlsx";

/**
 * A synthetic roster in the hospital-order layout: title line, header row with
 * weekday labels, a row of day numbers, then one row per person. Names are
 * made up; the codes for "สมใจ" are a real month's pattern.
 */
const OCT_DOW = ["พฤ", "ศ", "ส", "อา", "จ", "อ", "พ"];
const NAME_COL = 3;
const DAY1_COL = 5;

function sheetFrom(cells: Map<string, CellValue>): Sheet {
  let maxRow = 0;
  let maxCol = 0;
  for (const key of cells.keys()) {
    const [r, c] = key.split(":").map(Number);
    maxRow = Math.max(maxRow, r);
    maxCol = Math.max(maxCol, c);
  }
  return { get: (r, c) => cells.get(`${r}:${c}`) ?? null, maxRow, maxCol };
}

interface TableSpec {
  title?: string;
  footer?: string;
  totals?: boolean;
  people: { name: string; days: Record<number, string>; totals?: [number, number, number] }[];
}

function addTable(cells: Map<string, CellValue>, top: number, spec: TableSpec): number {
  const set = (r: number, c: number, v: CellValue) => cells.set(`${r}:${c}`, v);
  set(top, 1, spec.title ?? "  เวรปฏิบัติงานนอกเวลาราชการ     ประจำเดือน  ตุลาคม  2569   ");
  const header = top + 2;
  set(header, NAME_COL, "ชื่อ-สกุล");
  for (let d = 1; d <= 31; d++) {
    set(header, DAY1_COL + d - 1, OCT_DOW[(d - 1) % 7]);
    set(header + 1, DAY1_COL + d - 1, d);
  }
  const totalsCol = DAY1_COL + 31 + 1;
  if (spec.totals) ["ช", "บ", "ด"].forEach((l, i) => set(header, totalsCol + i, l));

  let row = header + 2;
  for (const p of spec.people) {
    set(row, NAME_COL, p.name);
    for (const [d, code] of Object.entries(p.days)) set(row, DAY1_COL + Number(d) - 1, code);
    p.totals?.forEach((n, i) => set(row, totalsCol + i, n));
    row++;
  }
  set(row + 1, 2, spec.footer ?? "ทั้งนี้ ตั้งแต่วันที่ 1-31 ตุลาคม พ.ศ.2569");
  return row + 4;
}

const SOMJAI_MAIN = "ชบ บ ด ชบ X ดบ บ ชบ ช X ชบ ช ด ดบ ด ช X ดบ ชบ ช x ด ด X ช ดบ ช ด ชบ X ด".split(" ");
const SOMJAI_EXTRA: Record<number, string> = { 2: "ด", 9: "บ", 13: "บ", 15: "บ", 17: "ช", 21: "ด", 22: "ช", 24: "ช" };
const days = (codes: string[]) => Object.fromEntries(codes.map((c, i) => [i + 1, c]));

function octoberFile() {
  const cells = new Map<string, CellValue>();
  const main: TableSpec = {
    totals: true,
    people: [
      { name: "น.ส.สมใจ  ใจดี   ", days: days(SOMJAI_MAIN), totals: [12, 12, 11] },
      { name: "นางสาวมาลี พลเยี่ยม", days: { 1: "ช", 2: "vac", 3: "vac", 4: "ช" }, totals: [4, 0, 0] },
      { name: "นายสมชาย พลเยี่ยม", days: { 1: "ดบ", 2: "O" } },
    ],
  };
  let next = addTable(cells, 1, main);
  next = addTable(cells, next, { people: [{ name: "น.ส.สมใจ  ใจดี   ", days: SOMJAI_EXTRA }, { name: "นางสาวมาลี พลเยี่ยม", days: {} }] });
  next = addTable(cells, next, main); // the signed second copy
  addTable(cells, next, {
    footer: "ทั้งนี้ ตั้งแต่วันที่ 1-31 สิงหาคม พ.ศ.2569",
    people: [{ name: "น.ส.สมใจ  ใจดี   ", days: {} }, { name: "นางสาวมาลี พลเยี่ยม", days: { 5: "ช" } }],
  });
  return sheetFrom(cells);
}

test("finds each distinct table, its month, and drops the exact duplicate", () => {
  const tables = findTables(octoberFile());
  assert.equal(tables.length, 3);
  for (const t of tables) {
    assert.equal(t.year, 2026);
    assert.equal(t.month, 10);
    assert.equal(t.dayCols.size, 31);
  }
  assert.deepEqual(tables[0].warnings, []);
  assert.deepEqual(tables[1].warnings, []);
  assert.match(tables[2].warnings[0], /สิงหาคม/);
});

test("a person's month: main shifts, extra shifts, days off — and totals agree", () => {
  const sheet = octoberFile();
  const tables = findTables(sheet);
  const [person] = matchPeople(tables, "สมใจ");
  const preview = buildPreview(sheet, tables, person.key);

  assert.equal(preview.name, "น.ส.สมใจ ใจดี");
  // The empty stale table contributes nothing for this person.
  assert.deepEqual(preview.sections.map((s) => s.kind), ["main", "extra"]);

  const [main, extra] = preview.sections;
  assert.deepEqual(main.counts, { morning: 12, afternoon: 12, night: 11, off: 6, leave: 0, other: 0 });
  assert.equal(main.totalsMatch, true);
  assert.equal(main.entries.length, 41);
  assert.equal(extra.entries.length, 8);
  assert.equal(extra.totalsMatch, null);
  assert.ok(main.suggested && extra.suggested);

  assert.deepEqual(
    main.entries.filter((e) => e.date === "2026-10-06").map((e) => [e.title, e.time, e.endTime]),
    [
      ["ด", "00:00", "08:00"],
      ["บ", "16:00", "24:00"],
    ]
  );
  assert.deepEqual(extra.entries[0], {
    date: "2026-10-02",
    title: "เสริม ด",
    category: "shift",
    time: "00:00",
    endTime: "08:00",
  });
  assert.deepEqual(
    main.entries.filter((e) => e.title === "Off").map((e) => e.date.slice(8)),
    ["05", "10", "17", "21", "24", "30"]
  );
});

test("leave days count toward ช in the file's totals", () => {
  const sheet = octoberFile();
  const tables = findTables(sheet);
  const [malee] = matchPeople(tables, "มาลี");
  const [main, stale] = buildPreview(sheet, tables, malee.key).sections;
  assert.equal(main.counts.leave, 2);
  assert.equal(main.totalsMatch, true);
  // A table whose footer names another month is shown but not suggested.
  assert.equal(stale.suggested, false);
});

test("an unknown code is kept as written and flagged", () => {
  const sheet = octoberFile();
  const tables = findTables(sheet);
  const [somchai] = matchPeople(tables, "สมชาย");
  const [main] = buildPreview(sheet, tables, somchai.key).sections;
  assert.deepEqual(
    main.entries.filter((e) => e.date === "2026-10-02").map((e) => [e.title, e.category]),
    [["O", "other"]]
  );
  assert.equal(main.counts.other, 1);
  assert.match(main.warnings.join("\n"), /วันที่ 2: ไม่รู้จักรหัส "O"/);
  // No totals in the file for this row: nothing to compare against.
  assert.equal(main.totalsMatch, null);
});

test("names match without title prefix or spacing, and a shared surname is ambiguous", () => {
  const tables = findTables(octoberFile());
  assert.equal(normalizeName("น.ส.สมใจ  ใจดี "), "สมใจใจดี");
  assert.equal(normalizeName("นางสาวมาลี พลเยี่ยม"), "มาลีพลเยี่ยม");
  assert.deepEqual(matchPeople(tables, "สมใจ ใจดี").map((p) => p.key), ["สมใจใจดี"]);
  assert.equal(matchPeople(tables, "พลเยี่ยม").length, 2);
  assert.equal(matchPeople(tables, "ไม่มีชื่อนี้").length, 0);
});

test("cell codes", () => {
  const titles = (raw: string, kind: "main" | "extra" = "main") => decodeCell(raw, kind).entries.map((e) => e.title);
  assert.deepEqual(titles("ชบ"), ["ช", "บ"]);
  assert.deepEqual(titles("บด"), ["ด", "บ"]);
  assert.deepEqual(titles(" X "), ["Off"]);
  assert.deepEqual(titles("VAC"), ["Vac"]);
  assert.deepEqual(titles("ชช"), ["หยุดชดเชย"]);
  assert.deepEqual(titles("ช", "extra"), ["เสริม ช"]);
  assert.deepEqual(titles(""), []);
});

test("a 30-day month on a 31-column template stays suggested and drops the 31st", () => {
  const cells = new Map<string, CellValue>();
  addTable(cells, 1, {
    title: "ประจำเดือน พฤศจิกายน 2569",
    footer: "ทั้งนี้ ตั้งแต่วันที่ 1-30 พฤศจิกายน พ.ศ.2569",
    people: [{ name: "สมใจ ใจดี", days: { 1: "ช", 30: "บ", 31: "ด" } }],
  });
  const sheet = sheetFrom(cells);
  const tables = findTables(sheet);
  const [main] = buildPreview(sheet, tables, "สมใจใจดี").sections;
  assert.equal(main.suggested, true);
  // The template's weekday labels are October's; that is worth a note, not an opt-out.
  assert.match(main.warnings.join("\n"), /วันที่ 1 เป็นวัน "พฤ"/);
  assert.deepEqual(main.entries.map((e) => e.date), ["2026-11-01", "2026-11-30"]);
});

test("a roster without a month in its title is rejected", () => {
  const cells = new Map<string, CellValue>();
  addTable(cells, 1, { title: "ตารางเวร", people: [{ name: "สมใจ", days: { 1: "ช" } }] });
  assert.throws(() => findTables(sheetFrom(cells)), /ไม่พบเดือน/);
});
