import { dowShort, monthNames, pad } from "@/lib/dates";
import type { Category } from "@/lib/types";
import type { Sheet } from "@/lib/xlsx";

/**
 * Reads a ward's monthly duty roster (ตารางเวร) — the hospital-order layout
 * where each table has a "ชื่อ-สกุล" header, a row of day numbers beneath it,
 * one row per nurse, and one cell per day holding codes like ช / ชบ / X.
 *
 * A file usually holds several tables for the same month: the main roster,
 * a table of extra paid shifts (เสริม), and sometimes stale copies. Tables are
 * found by their headers rather than fixed row numbers, so next month's file
 * can be laid out differently.
 */

/** Shift start/end times. Edit these if the ward's hours differ. */
export const SHIFT_HOURS = {
  morning: { time: "08:00", endTime: "16:00" },   // ช — เช้า
  afternoon: { time: "16:00", endTime: "24:00" }, // บ — บ่าย
  night: { time: "00:00", endTime: "08:00" },     // ด — ดึก
} as const;

/** Non-shift rows get a neutral mid-morning slot and no end time. */
export const PLAIN_TIME = "09:00";

type ShiftKind = keyof typeof SHIFT_HOURS;

const SHIFT_LETTERS: Record<string, ShiftKind> = { ช: "morning", บ: "afternoon", ด: "night" };
/** Same-day shifts listed in the order they happen. */
const SHIFT_ORDER: ShiftKind[] = ["night", "morning", "afternoon"];
const SHIFT_LETTER: Record<ShiftKind, string> = { morning: "ช", afternoon: "บ", night: "ด" };

const NAME_PREFIX = /^(นางสาว|น\.ส\.|นส\.|นาง|นาย|ด\.ช\.|ด\.ญ\.)/;

export function normalizeName(name: string): string {
  return name.normalize("NFC").trim().replace(NAME_PREFIX, "").replace(/\s+/g, "");
}

/** Collapse runs of spaces left over from the spreadsheet's manual alignment. */
function tidy(value: unknown): string {
  return value == null ? "" : String(value).replace(/\s+/g, " ").trim();
}

const THAI_DIGITS = "๐๑๒๓๔๕๖๗๘๙";
function arabicDigits(text: string): string {
  return text.replace(/[๐-๙]/g, (d) => String(THAI_DIGITS.indexOf(d)));
}

/** Finds "<Thai month> <Buddhist year>" in free text, e.g. "ประจำเดือน ตุลาคม 2569". */
function findMonth(text: string): { year: number; month: number } | null {
  const months = monthNames("th");
  const m = /(มกราคม|กุมภาพันธ์|มีนาคม|เมษายน|พฤษภาคม|มิถุนายน|กรกฎาคม|สิงหาคม|กันยายน|ตุลาคม|พฤศจิกายน|ธันวาคม)(?:\s*พ\.ศ\.)?\s*(\d{4})?/.exec(
    arabicDigits(text)
  );
  if (!m) return null;
  const month = months.indexOf(m[1]) + 1;
  const year = m[2] ? Number(m[2]) - 543 : NaN;
  return { year, month };
}

export interface RosterTable {
  /** Position among the distinct tables in the file, 0-based. */
  index: number;
  headerRow: number;
  year: number;
  month: number;
  nameCol: number;
  /** day of month → column */
  dayCols: Map<number, number>;
  /** Column of the per-person ช / บ / ด totals, when the table has them. */
  totalCols: Partial<Record<ShiftKind, number>>;
  people: { name: string; key: string; row: number }[];
  /** Problems with the table itself, worded for the person importing. */
  warnings: string[];
  /** Its footer names a different month: likely a leftover from an older roster. */
  stale: boolean;
}

export class RosterError extends Error {}

function daysIn(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function bodySignature(sheet: Sheet, table: Omit<RosterTable, "index" | "warnings" | "stale">): string {
  return table.people
    .map((p) => [p.key, ...[...table.dayCols.values()].map((c) => tidy(sheet.get(p.row, c)))].join("|"))
    .join("\n");
}

/**
 * Every roster table in the sheet, in file order. A table whose body repeats an
 * earlier one exactly (files often carry a second signed copy) is dropped.
 */
export function findTables(sheet: Sheet): RosterTable[] {
  const tables: RosterTable[] = [];
  const seen = new Set<string>();
  let searchFrom = 1;

  for (let r = 1; r <= sheet.maxRow; r++) {
    let nameCol = 0;
    for (let c = 1; c <= sheet.maxCol; c++) {
      if (tidy(sheet.get(r, c)) === "ชื่อ-สกุล") {
        nameCol = c;
        break;
      }
    }
    if (!nameCol) continue;
    const headerRow = r;

    // Day numbers sit on the header row or the row just under it.
    let dayRow = 0;
    const dayCols = new Map<number, number>();
    for (const candidate of [r + 1, r]) {
      for (let c = nameCol + 1; c <= sheet.maxCol; c++) {
        const v = sheet.get(candidate, c);
        if (typeof v === "number" && Number.isInteger(v) && v >= 1 && v <= 31 && !dayCols.has(v)) {
          dayCols.set(v, c);
        }
      }
      if (dayCols.size >= 28) {
        dayRow = candidate;
        break;
      }
      dayCols.clear();
    }
    if (!dayRow) continue;

    // The month is named in the title lines between the previous table and this header.
    let found: { year: number; month: number } | null = null;
    for (let tr = headerRow - 1; tr >= searchFrom && !found; tr--) {
      for (let c = 1; c <= sheet.maxCol && !found; c++) {
        const v = sheet.get(tr, c);
        if (typeof v === "string" && v.includes("เดือน")) found = findMonth(v);
      }
    }

    const lastDayCol = Math.max(...dayCols.values());
    const totalCols: RosterTable["totalCols"] = {};
    for (let c = lastDayCol + 1; c <= sheet.maxCol; c++) {
      const kind = SHIFT_LETTERS[tidy(sheet.get(headerRow, c))];
      if (kind && totalCols[kind] === undefined) totalCols[kind] = c;
    }

    const people: RosterTable["people"] = [];
    let row = dayRow + 1;
    for (; row <= sheet.maxRow; row++) {
      const cell = sheet.get(row, nameCol);
      const name = tidy(cell);
      if (!name || typeof cell === "number") break;
      people.push({ name, key: normalizeName(name), row });
    }
    searchFrom = row;
    r = row - 1;

    const warnings: string[] = [];
    let stale = false;
    if (!found || !Number.isFinite(found.year)) {
      throw new RosterError("ไม่พบเดือน/ปีของตารางเวร (เช่น \"ประจำเดือน ตุลาคม 2569\") ในไฟล์");
    }
    const { year, month } = found;

    // The footer ("ทั้งนี้ ตั้งแต่วันที่ 1-31 สิงหาคม ...") names the period the
    // order covers. A stale table copied from another month keeps its old footer.
    for (let fr = row; fr <= Math.min(row + 4, sheet.maxRow); fr++) {
      for (let c = 1; c <= sheet.maxCol; c++) {
        const v = sheet.get(fr, c);
        if (typeof v !== "string" || !v.includes("ตั้งแต่วันที่")) continue;
        const period = findMonth(v);
        if (period && period.month !== month) {
          stale = true;
          warnings.push(
            `ท้ายตารางระบุช่วง "${monthNames("th")[period.month - 1]}" ไม่ตรงกับหัวตาราง อาจเป็นตารางเก่าที่ค้างอยู่ในไฟล์`
          );
        }
      }
    }

    const expectedDays = daysIn(year, month);
    // Templates often keep 31 columns in shorter months; only missing days matter.
    if (dayCols.size < expectedDays) {
      warnings.push(`ตารางมี ${dayCols.size} วัน แต่${monthNames("th")[month - 1]}มี ${expectedDays} วัน`);
    }
    // Weekday labels sit on the header row when the day numbers are below it.
    const day1Label = dayRow === headerRow + 1 ? tidy(sheet.get(headerRow, dayCols.get(1) ?? 0)) : "";
    const day1Actual = dowShort("th")[new Date(year, month - 1, 1).getDay()];
    if (day1Label && day1Label !== day1Actual) {
      warnings.push(`หัวตารางระบุวันที่ 1 เป็นวัน "${day1Label}" แต่ปฏิทินจริงคือวัน "${day1Actual}"`);
    }

    const table = { headerRow, year, month, nameCol, dayCols, totalCols, people };
    const signature = bodySignature(sheet, table);
    if (seen.has(signature)) continue;
    seen.add(signature);
    tables.push({ ...table, index: tables.length, warnings, stale });
  }

  return tables;
}

/** Distinct people across all tables whose name contains `query`. */
export function matchPeople(tables: RosterTable[], query: string): { name: string; key: string }[] {
  const q = normalizeName(query);
  const byKey = new Map<string, string>();
  for (const t of tables) {
    for (const p of t.people) {
      if (!byKey.has(p.key) && (!q || p.key.includes(q))) byKey.set(p.key, p.name);
    }
  }
  return [...byKey].map(([key, name]) => ({ key, name }));
}

export interface RosterEntry {
  date: string;
  title: string;
  category: Category;
  time: string;
  endTime: string | null;
}

export interface RosterCounts {
  morning: number;
  afternoon: number;
  night: number;
  off: number;
  /** Leave days (vac). */
  leave: number;
  other: number;
}

export interface RosterSection {
  tableIndex: number;
  kind: "main" | "extra";
  label: string;
  /** Whether the import should include this section unless the user says otherwise. */
  suggested: boolean;
  entries: RosterEntry[];
  counts: RosterCounts;
  /** Shift counts compared with the table's own ช / บ / ด totals, when present. */
  totalsMatch: boolean | null;
  warnings: string[];
}

export interface RosterPreview {
  name: string;
  year: number;
  month: number;
  sections: RosterSection[];
}

interface Decoded {
  entries: Omit<RosterEntry, "date">[];
  counts: Partial<RosterCounts>;
  unknown?: string;
}

/** One day's cell → the events it stands for. */
export function decodeCell(raw: string, kind: RosterSection["kind"]): Decoded {
  const code = raw.trim();
  const lower = code.toLowerCase();
  if (!code) return { entries: [], counts: {} };

  const plain = (title: string, category: Category) => ({
    title,
    category,
    time: PLAIN_TIME,
    endTime: null,
  });

  if (lower === "x") return { entries: [plain("Off", "personal")], counts: { off: 1 } };
  if (lower === "vac") return { entries: [plain("Vac", "personal")], counts: { leave: 1 } };
  if (code === "ชช") return { entries: [plain("หยุดชดเชย", "personal")], counts: { off: 1 } };

  if (/^[ชบด]+$/.test(code)) {
    const kinds = new Set([...code].map((ch) => SHIFT_LETTERS[ch]));
    const counts: Partial<RosterCounts> = {};
    const entries = SHIFT_ORDER.filter((k) => kinds.has(k)).map((k) => {
      counts[k] = 1;
      const letter = SHIFT_LETTER[k];
      return { title: kind === "extra" ? `เสริม ${letter}` : letter, category: "shift" as const, ...SHIFT_HOURS[k] };
    });
    return { entries, counts };
  }

  // Legend codes (O, ป, ร, C, ward numbers…) and anything else: keep the text
  // as written so nothing silently disappears, and let the preview flag it.
  return { entries: [plain(code, "other")], counts: { other: 1 }, unknown: code };
}

function numberIn(value: unknown): number | null {
  const n = typeof value === "number" ? value : Number(arabicDigits(tidy(value)));
  return Number.isFinite(n) && tidy(value) !== "" ? n : null;
}

export function buildPreview(sheet: Sheet, tables: RosterTable[], personKey: string): RosterPreview {
  let name = "";
  const sections: RosterSection[] = [];
  const first = tables[0];
  if (!first) throw new RosterError("ไม่พบตารางเวรในไฟล์ (หาหัวตาราง \"ชื่อ-สกุล\" ไม่เจอ)");

  for (const table of tables) {
    const person = table.people.find((p) => p.key === personKey);
    if (!person) continue;
    name ||= person.name;

    const kind = table.index === 0 ? "main" : "extra";
    const counts: RosterCounts = { morning: 0, afternoon: 0, night: 0, off: 0, leave: 0, other: 0 };
    const entries: RosterEntry[] = [];
    const warnings = [...table.warnings];

    for (const [day, col] of [...table.dayCols].sort((a, b) => a[0] - b[0])) {
      if (day > daysIn(table.year, table.month)) continue;
      const decoded = decodeCell(tidy(sheet.get(person.row, col)), kind);
      const date = `${table.year}-${pad(table.month)}-${pad(day)}`;
      for (const e of decoded.entries) entries.push({ date, ...e });
      for (const [k, n] of Object.entries(decoded.counts)) counts[k as keyof RosterCounts] += n;
      if (decoded.unknown) {
        warnings.push(`วันที่ ${day}: ไม่รู้จักรหัส "${decoded.unknown}" — จะนำเข้าเป็นข้อความตามไฟล์`);
      }
    }
    if (entries.length === 0) continue;

    let totalsMatch: boolean | null = null;
    const totals = (["morning", "afternoon", "night"] as const).map((k) =>
      table.totalCols[k] === undefined ? null : numberIn(sheet.get(person.row, table.totalCols[k]))
    );
    if (totals.every((n) => n !== null)) {
      // The ward credits each leave day as a ช in its totals.
      const [ch, b, d] = totals;
      totalsMatch = ch === counts.morning + counts.leave && b === counts.afternoon && d === counts.night;
      if (!totalsMatch) {
        const leave = counts.leave ? ` (+ลา ${counts.leave})` : "";
        warnings.push(
          `ยอดท้ายแถวในไฟล์คือ ช ${ch} · บ ${b} · ด ${d} แต่อ่านจากรายวันได้ ช ${counts.morning}${leave} · บ ${counts.afternoon} · ด ${counts.night} — ` +
            "ตัวเลขรายวันคือสิ่งที่จะนำเข้า ลองเทียบกับไฟล์อีกครั้ง"
        );
      }
    }

    sections.push({
      tableIndex: table.index,
      kind,
      label: kind === "main" ? "เวรหลัก" : table.index === 1 ? "เวรเสริม" : `เวรเสริม (ตารางที่ ${table.index + 1})`,
      suggested: !table.stale,
      entries,
      counts,
      totalsMatch,
      warnings,
    });
  }

  if (!name) throw new RosterError("ไม่พบชื่อนี้ในตารางเวร");
  return { name, year: first.year, month: first.month, sections };
}
