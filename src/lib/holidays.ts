export interface Holiday {
  date: string;
  localName: string;
}

export const THAI_HOLIDAY_ICS_URL =
  "https://calendar.google.com/calendar/ical/th.th%23holiday%40group.v.calendar.google.com/public/basic.ics";

function unfoldIcsLines(ics: string): string[] {
  const rawLines = ics.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
  const lines: string[] = [];
  for (const line of rawLines) {
    if ((line.startsWith(" ") || line.startsWith("\t")) && lines.length > 0) {
      lines[lines.length - 1] += line.slice(1);
    } else {
      lines.push(line);
    }
  }
  return lines;
}

function unescapeIcsText(value: string): string {
  return value
    .replace(/\\n/g, "\n")
    .replace(/\\,/g, ",")
    .replace(/\\;/g, ";")
    .replace(/\\\\/g, "\\")
    .trim();
}

function isoFromIcsDate(value: string): string | null {
  const compact = value.trim();
  if (!/^\d{8}$/.test(compact)) return null;
  return `${compact.slice(0, 4)}-${compact.slice(4, 6)}-${compact.slice(6, 8)}`;
}

function lineValue(line: string): string {
  const idx = line.indexOf(":");
  return idx === -1 ? "" : line.slice(idx + 1);
}

function isPublicHoliday(description: string): boolean {
  const normalized = description.toLocaleLowerCase("th-TH");
  return normalized.includes("วันหยุดนักขัตฤกษ์") || normalized.includes("public holiday");
}

export function parseGoogleHolidayIcs(ics: string, year: number): Holiday[] {
  const holidays: Holiday[] = [];
  let current: Record<string, string> | null = null;

  for (const line of unfoldIcsLines(ics)) {
    if (line === "BEGIN:VEVENT") {
      current = {};
      continue;
    }
    if (line === "END:VEVENT") {
      if (current?.date && current.summary && isPublicHoliday(current.description ?? "")) {
        const iso = isoFromIcsDate(current.date);
        if (iso?.startsWith(`${year}-`)) {
          holidays.push({ date: iso, localName: unescapeIcsText(current.summary) });
        }
      }
      current = null;
      continue;
    }
    if (!current) continue;
    if (line.startsWith("DTSTART")) current.date = lineValue(line);
    else if (line.startsWith("SUMMARY")) current.summary = lineValue(line);
    else if (line.startsWith("DESCRIPTION")) current.description = lineValue(line);
  }

  return holidays.sort((a, b) => a.date.localeCompare(b.date) || a.localName.localeCompare(b.localName));
}

export function holidaysForYear(holidays: Holiday[]): Map<string, Holiday[]> {
  const byDate = new Map<string, Holiday[]>();
  for (const holiday of holidays) {
    const rows = byDate.get(holiday.date) ?? [];
    rows.push(holiday);
    byDate.set(holiday.date, rows);
  }
  return byDate;
}
