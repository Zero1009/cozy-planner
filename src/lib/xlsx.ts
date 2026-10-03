import { strFromU8, unzipSync } from "fflate";

/**
 * Minimal .xlsx reader: just enough to turn the first worksheet into a grid of
 * cell values. A full spreadsheet library would be hundreds of KB for what is
 * a zip of four small XML files; this reads shared strings, inline strings,
 * numbers and merged ranges, and ignores styles, formulas and other sheets.
 */

export type CellValue = string | number;

export interface Sheet {
  /** 1-based row/column. A merged range reports its top-left value in every cell. */
  get(row: number, col: number): CellValue | null;
  maxRow: number;
  maxCol: number;
}

export class XlsxError extends Error {}

const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" };

function decodeXml(text: string): string {
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (whole, ref: string) => {
    if (ref[0] === "#") {
      const code = ref[1] === "x" || ref[1] === "X" ? parseInt(ref.slice(2), 16) : parseInt(ref.slice(1), 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : whole;
    }
    return ENTITIES[ref] ?? whole;
  });
}

/** Concatenate every <t> run, skipping phonetic (<rPh>) annotations. */
function textRuns(xml: string): string {
  const withoutPhonetic = xml.replace(/<rPh\b[\s\S]*?<\/rPh>/g, "");
  let out = "";
  for (const m of withoutPhonetic.matchAll(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g)) out += m[1];
  return decodeXml(out);
}

function attr(tag: string, name: string): string | undefined {
  return new RegExp(`\\s${name}="([^"]*)"`).exec(tag)?.[1];
}

/** "AB12" → { row: 12, col: 28 } */
export function parseRef(ref: string): { row: number; col: number } {
  const m = /^([A-Z]+)(\d+)$/.exec(ref);
  if (!m) throw new XlsxError(`Bad cell reference ${ref}`);
  let col = 0;
  for (const ch of m[1]) col = col * 26 + (ch.charCodeAt(0) - 64);
  return { row: Number(m[2]), col };
}

function firstSheetPath(files: Record<string, Uint8Array>): string {
  const workbook = files["xl/workbook.xml"];
  const rels = files["xl/_rels/workbook.xml.rels"];
  if (!workbook || !rels) throw new XlsxError("Not an .xlsx workbook");

  const sheetTag = /<sheet\s[^>]*>/.exec(strFromU8(workbook))?.[0];
  const relId = sheetTag && attr(sheetTag, "r:id");
  if (!relId) throw new XlsxError("Workbook has no sheets");

  for (const m of strFromU8(rels).matchAll(/<Relationship\s[^>]*>/g)) {
    if (attr(m[0], "Id") !== relId) continue;
    const target = attr(m[0], "Target") ?? "";
    // Targets are usually relative to xl/, occasionally absolute ("/xl/...").
    return target.startsWith("/") ? target.slice(1) : `xl/${target}`;
  }
  throw new XlsxError("First sheet is missing from the workbook");
}

export function readFirstSheet(bytes: Uint8Array): Sheet {
  let files: Record<string, Uint8Array>;
  try {
    files = unzipSync(bytes, {
      filter: (f) => (f.name.startsWith("xl/") && f.name.endsWith(".xml")) || f.name.endsWith(".rels"),
    });
  } catch {
    throw new XlsxError("Not an .xlsx file");
  }

  const sheetPath = firstSheetPath(files);
  const sheetXml = files[sheetPath];
  if (!sheetXml) throw new XlsxError("First sheet is missing from the workbook");

  const shared: string[] = [];
  const sst = files["xl/sharedStrings.xml"];
  if (sst) {
    // An empty <si/> still takes an index, so it must not be skipped.
    for (const m of strFromU8(sst).matchAll(/<si\s*\/>|<si>([\s\S]*?)<\/si>/g)) shared.push(textRuns(m[1] ?? ""));
  }

  const xml = strFromU8(sheetXml);
  const cells = new Map<string, CellValue>();
  let maxRow = 0;
  let maxCol = 0;

  // Self-closing <c .../> cells are styled blanks and carry no value, but
  // must still be matched so they don't swallow the next cell's body.
  for (const m of xml.matchAll(/<c(\s[^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
    const [, attrs, body] = m;
    const ref = attr(attrs, "r");
    if (!ref || body === undefined) continue;
    const type = attr(attrs, "t");
    const raw = /<v>([\s\S]*?)<\/v>/.exec(body)?.[1];

    let value: CellValue | undefined;
    if (type === "s") value = raw === undefined ? undefined : shared[Number(raw)];
    else if (type === "inlineStr") value = textRuns(body);
    else if (type === "str" || type === "e") value = raw === undefined ? undefined : decodeXml(raw);
    else if (type === "b") value = raw;
    else if (raw !== undefined) value = Number(raw);

    if (value === undefined || value === "") continue;
    const { row, col } = parseRef(ref);
    cells.set(`${row}:${col}`, value);
    maxRow = Math.max(maxRow, row);
    maxCol = Math.max(maxCol, col);
  }

  // Copy each merged range's top-left value into the rest of the range, so a
  // leave spanning three day columns reads as three days, not one.
  for (const m of xml.matchAll(/<mergeCell\s[^>]*ref="([A-Z]+\d+):([A-Z]+\d+)"/g)) {
    const from = parseRef(m[1]);
    const to = parseRef(m[2]);
    const value = cells.get(`${from.row}:${from.col}`);
    if (value === undefined) continue;
    for (let r = from.row; r <= to.row; r++) {
      for (let c = from.col; c <= to.col; c++) cells.set(`${r}:${c}`, value);
    }
    maxRow = Math.max(maxRow, to.row);
    maxCol = Math.max(maxCol, to.col);
  }

  return {
    get: (row, col) => cells.get(`${row}:${col}`) ?? null,
    maxRow,
    maxCol,
  };
}
