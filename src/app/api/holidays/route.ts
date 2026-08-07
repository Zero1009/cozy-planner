import { NextRequest, NextResponse } from "next/server";
import { parseGoogleHolidayIcs, THAI_HOLIDAY_ICS_URL } from "@/lib/holidays";

const MIN_YEAR = 2020;
const MAX_YEAR = 2035;

export async function GET(req: NextRequest) {
  const rawYear = req.nextUrl.searchParams.get("year") ?? new Date().getFullYear().toString();
  const year = Number(rawYear);
  if (!Number.isInteger(year) || year < MIN_YEAR || year > MAX_YEAR) {
    return NextResponse.json({ error: "Invalid holiday year" }, { status: 400 });
  }

  try {
    const res = await fetch(THAI_HOLIDAY_ICS_URL, {
      next: { revalidate: 60 * 60 * 24 },
      headers: { Accept: "text/calendar,text/plain,*/*" },
    });
    if (!res.ok) throw new Error(`Holiday calendar returned ${res.status}`);
    const ics = await res.text();
    return NextResponse.json(parseGoogleHolidayIcs(ics, year), {
      headers: { "Cache-Control": "s-maxage=86400, stale-while-revalidate=604800" },
    });
  } catch (error) {
    console.error("[holidays] failed to load Thai holiday calendar", error);
    return NextResponse.json([], {
      headers: { "Cache-Control": "s-maxage=300, stale-while-revalidate=3600" },
    });
  }
}
