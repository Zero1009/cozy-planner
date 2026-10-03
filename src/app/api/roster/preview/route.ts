import { NextRequest, NextResponse } from "next/server";
import { buildPreview, findTables, matchPeople, RosterError } from "@/lib/roster";
import { getCurrentUser } from "@/lib/session";
import { readFirstSheet, XlsxError } from "@/lib/xlsx";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** A month's roster is a few dozen KB; anything near this is not one. */
const MAX_BYTES = 2 * 1024 * 1024;

/**
 * Reads an uploaded roster (.xlsx) and returns one person's shifts for the
 * importer to preview. Writes nothing and keeps nothing: the file is parsed in
 * memory, and the confirmed entries come back through POST /api/events/import.
 *
 * Form fields: `file`, `query` (part of the person's name), and optionally
 * `person` — a key from an earlier `pick` response when the name was ambiguous.
 */
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  const query = String(form?.get("query") ?? "").trim();
  const person = String(form?.get("person") ?? "").trim();

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "กรุณาเลือกไฟล์ตารางเวร (.xlsx)" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "ไฟล์ใหญ่เกินไปสำหรับตารางเวร 1 เดือน (เกิน 2 MB)" }, { status: 413 });
  }
  if (!query && !person) {
    return NextResponse.json({ error: "กรุณาพิมพ์ชื่อของคุณตามที่อยู่ในตารางเวร" }, { status: 400 });
  }

  try {
    const sheet = readFirstSheet(new Uint8Array(await file.arrayBuffer()));
    const tables = findTables(sheet);

    let key = person;
    if (!key) {
      const matches = matchPeople(tables, query);
      if (matches.length === 0) {
        return NextResponse.json({ error: `ไม่พบชื่อ "${query}" ในตารางเวรนี้` }, { status: 422 });
      }
      // Only an ambiguous match reveals other names in the file, and only those that matched.
      if (matches.length > 1) {
        return NextResponse.json({ status: "pick", candidates: matches });
      }
      key = matches[0].key;
    }

    return NextResponse.json({ status: "ok", preview: buildPreview(sheet, tables, key) });
  } catch (err) {
    if (err instanceof XlsxError) {
      return NextResponse.json({ error: "อ่านไฟล์ไม่ได้ — ต้องเป็นไฟล์ Excel (.xlsx)" }, { status: 422 });
    }
    if (err instanceof RosterError) {
      return NextResponse.json({ error: err.message }, { status: 422 });
    }
    throw err;
  }
}
