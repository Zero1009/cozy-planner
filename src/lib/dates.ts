import type { Lang } from "./types";

export const pad = (n: number) => String(n).padStart(2, "0");

/** Local-time ISO calendar day, e.g. "2026-07-20". Avoids UTC off-by-one. */
export function toISO(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function fromISO(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export const addDays = (d: Date, n: number) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);

export const addMonths = (d: Date, n: number) =>
  new Date(d.getFullYear(), d.getMonth() + n, 1);

export const sameISO = (a: Date, b: Date) => toISO(a) === toISO(b);

/** Whole-day difference b - a (ignores time-of-day). */
export function diffDays(a: Date, b: Date): number {
  const da = new Date(a.getFullYear(), a.getMonth(), a.getDate());
  const db = new Date(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.round((db.getTime() - da.getTime()) / 86_400_000);
}

const MONTHS: Record<Lang, string[]> = {
  th: [
    "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
    "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
  ],
  en: [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ],
};

const DOW_SHORT: Record<Lang, string[]> = {
  th: ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"],
  en: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
};

const DOW_LONG: Record<Lang, string[]> = {
  th: ["อาทิตย์", "จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์", "เสาร์"],
  en: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
};

export const monthNames = (lang: Lang) => MONTHS[lang];
export const dowShort = (lang: Lang) => DOW_SHORT[lang];

/** Thai uses Buddhist-era years (+543); English uses the Gregorian year. */
export const displayYear = (year: number, lang: Lang) =>
  lang === "th" ? year + 543 : year;

export function longDateLabel(d: Date, lang: Lang): string {
  const dow = DOW_LONG[lang][d.getDay()];
  return lang === "th"
    ? `วัน${dow}ที่ ${d.getDate()} ${MONTHS.th[d.getMonth()]} ${d.getFullYear() + 543}`
    : `${dow}, ${MONTHS.en[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

export function shortDateLabel(d: Date, lang: Lang): string {
  return `${d.getDate()} ${MONTHS[lang][d.getMonth()].slice(0, 3)}`;
}
