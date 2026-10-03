import { expect, test } from "@playwright/test";
import { strToU8, zipSync } from "fflate";
import { login } from "./helpers";

/**
 * A minimal roster workbook in the ward's layout, built here so the test needs
 * no binary fixture: a title naming the month, a "ชื่อ-สกุล" header, a row of
 * day numbers, and one person whose leave is a merged cell over two days.
 * December 2580 (2037) keeps it clear of anything other specs create.
 */
function rosterWorkbook(): Buffer {
  const col = (n: number) => (n > 26 ? String.fromCharCode(64 + Math.floor((n - 1) / 26)) : "") + String.fromCharCode(65 + ((n - 1) % 26));
  const str = (ref: string, text: string) => `<c r="${ref}" t="inlineStr"><is><t>${text}</t></is></c>`;
  const num = (ref: string, n: number) => `<c r="${ref}"><v>${n}</v></c>`;

  const days = Array.from({ length: 31 }, (_, i) => num(`${col(5 + i)}4`, i + 1)).join("");
  const sheet =
    "<worksheet><sheetData>" +
    `<row r="1">${str("A1", "เวรปฏิบัติงานนอกเวลาราชการ ประจำเดือน ธันวาคม 2580")}</row>` +
    `<row r="3">${str("C3", "ชื่อ-สกุล")}</row>` +
    `<row r="4">${days}</row>` +
    `<row r="5">${str("C5", "น.ส.ทดสอบ นำเข้าเวร")}${str("E5", "ชบ")}${str("F5", "X")}${str("G5", "vac")}<c r="H5"/></row>` +
    '</sheetData><mergeCells count="1"><mergeCell ref="G5:H5"/></mergeCells></worksheet>';

  return Buffer.from(
    zipSync({
      "xl/workbook.xml": strToU8('<workbook xmlns:r="r"><sheets><sheet name="ธค80" sheetId="1" r:id="rId1"/></sheets></workbook>'),
      "xl/_rels/workbook.xml.rels": strToU8('<Relationships><Relationship Id="rId1" Target="worksheets/sheet1.xml"/></Relationships>'),
      "xl/worksheets/sheet1.xml": strToU8(sheet),
    })
  );
}

test("imports a person's shifts from a roster file, once", async ({ page }) => {
  await login(page);
  await page.getByRole("button", { name: "Settings" }).click();
  await page.getByRole("button", { name: "นำเข้าตารางเวร" }).click();

  const dialog = page.getByRole("dialog", { name: "นำเข้าตารางเวร" });
  await dialog.locator('input[type="file"]').setInputFiles({
    name: "roster.xlsx",
    mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    buffer: rosterWorkbook(),
  });
  await dialog.getByLabel("ชื่อของคุณในตาราง").fill("ทดสอบ");
  await dialog.getByRole("button", { name: "อ่านตารางเวร" }).click();

  await expect(dialog.getByRole("heading", { name: "น.ส.ทดสอบ นำเข้าเวร" })).toBeVisible();
  await expect(dialog.getByText("ธันวาคม 2580")).toBeVisible();
  // ช + บ on the 1st, Off on the 2nd, leave on the 3rd and (merged) 4th.
  await dialog.getByRole("button", { name: "นำเข้า 5 รายการ" }).click();
  await expect(dialog.getByText("เพิ่ม 5 รายการลงปฏิทินแล้วครับ")).toBeVisible();

  const res = await page.request.get("/api/events");
  const events = (await res.json()) as Array<{ date: string; title: string; time: string; endTime: string | null }>;
  const december = events
    .filter((e) => e.date.startsWith("2037-12"))
    .map((e) => `${e.date} ${e.title} ${e.time}-${e.endTime ?? ""}`)
    .sort();
  expect(december).toEqual([
    "2037-12-01 ช 08:00-16:00",
    "2037-12-01 บ 16:00-24:00",
    "2037-12-02 Off 09:00-",
    "2037-12-03 Vac 09:00-",
    "2037-12-04 Vac 09:00-",
  ]);

  // Reading the same file again and importing adds nothing.
  await dialog.getByRole("button", { name: "อ่านตารางเวร" }).click();
  await dialog.getByRole("button", { name: "นำเข้า 5 รายการ" }).click();
  await expect(dialog.getByText("ทุกรายการมีอยู่ในปฏิทินแล้ว ไม่ได้เพิ่มอะไรครับ")).toBeVisible();
});
