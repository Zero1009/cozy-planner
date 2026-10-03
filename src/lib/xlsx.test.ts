import assert from "node:assert/strict";
import { test } from "node:test";
import { strToU8, zipSync } from "fflate";
import { parseRef, readFirstSheet } from "./xlsx";

function workbook(sheetXml: string, sharedStrings?: string) {
  const files: Record<string, Uint8Array> = {
    "xl/workbook.xml": strToU8(
      '<workbook xmlns:r="r"><sheets><sheet name="ตค69" sheetId="3" r:id="rId1"/><sheet name="Sheet1" sheetId="4" r:id="rId2"/></sheets></workbook>'
    ),
    "xl/_rels/workbook.xml.rels": strToU8(
      '<Relationships><Relationship Id="rId2" Target="worksheets/sheet2.xml"/><Relationship Id="rId1" Target="worksheets/sheet1.xml"/></Relationships>'
    ),
    "xl/worksheets/sheet1.xml": strToU8(sheetXml),
    "xl/worksheets/sheet2.xml": strToU8('<worksheet><sheetData><row r="1"><c r="A1"><v>99</v></c></row></sheetData></worksheet>'),
  };
  if (sharedStrings) files["xl/sharedStrings.xml"] = strToU8(sharedStrings);
  return zipSync(files);
}

test("cell references", () => {
  assert.deepEqual(parseRef("A1"), { row: 1, col: 1 });
  assert.deepEqual(parseRef("AI21"), { row: 21, col: 35 });
});

test("reads the first sheet's strings, numbers and merged ranges", () => {
  const sst =
    "<sst>" +
    '<si><t xml:space="preserve">  ชื่อ-สกุล </t></si>' +
    "<si/>" +
    "<si><r><t>vac</t></r><rPh><t>ignored</t></rPh></si>" +
    "<si><t>A &amp; B</t></si>" +
    "</sst>";
  const sheet =
    "<worksheet><sheetData>" +
    '<row r="9"><c r="A9" s="1"/><c r="C9" t="s"><v>0</v></c><c r="E9" s="4" t="s"><v>3</v></c></row>' +
    '<row r="10"><c r="E10"><v>1</v></c><c r="F10" s="2"/><c r="G10"><v>3</v></c></row>' +
    '<row r="14"><c r="R14" t="s"><v>2</v></c><c r="S14" s="4"/><c r="T14" t="inlineStr"><is><t>บ</t></is></c></row>' +
    '</sheetData><mergeCells count="1"><mergeCell ref="R14:S14"/></mergeCells></worksheet>';

  const s = readFirstSheet(workbook(sheet, sst));
  assert.equal(s.get(9, 1), null);
  assert.equal(s.get(9, 3), "  ชื่อ-สกุล ");
  assert.equal(s.get(9, 5), "A & B");
  assert.equal(s.get(10, 5), 1);
  // A self-closing blank must not swallow the following cell.
  assert.equal(s.get(10, 6), null);
  assert.equal(s.get(10, 7), 3);
  // The merged leave covers both days.
  assert.equal(s.get(14, 18), "vac");
  assert.equal(s.get(14, 19), "vac");
  assert.equal(s.get(14, 20), "บ");
  assert.equal(s.maxRow, 14);
  assert.equal(s.maxCol, 20);
});

test("rejects something that is not a workbook", () => {
  assert.throws(() => readFirstSheet(strToU8("hello")), /Not an \.xlsx/);
  assert.throws(() => readFirstSheet(zipSync({ "a.txt": strToU8("x") })), /Not an \.xlsx/);
});
