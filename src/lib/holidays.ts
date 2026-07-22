import { fromISO, shortDateLabel } from "@/lib/dates";
import type { Lang } from "@/lib/types";

export interface Holiday {
  th: string;
  en: string;
}

/** Distinct warm-red used to mark holidays in the calendar (works light/dark). */
export const HOLIDAY_COLOR = "oklch(62% 0.17 25)";
/** Soft tint + border for holiday banners (semi-transparent, theme-agnostic). */
export const HOLIDAY_TINT = "oklch(62% 0.17 25 / 0.13)";
export const HOLIDAY_BORDER = "oklch(62% 0.17 25 / 0.4)";

/**
 * Thai public holidays 2025–2027, keyed by local ISO date (YYYY-MM-DD).
 *
 * Lunar-calendar days (Makha / Visakha / Asalha Bucha, Khao Phansa) shift every
 * year and are confirmed by the government annually — the dates here follow the
 * official announcements. In-lieu ("substitution") days are included for 2025
 * and 2026 (published); 2027 lists the primary holidays plus the announced
 * Makha substitution. Verified against public holiday sources, July 2026.
 */
export const THAI_HOLIDAYS: Record<string, Holiday> = {
  // ── 2025 (BE 2568) ──────────────────────────────────────────────
  "2025-01-01": { th: "วันขึ้นปีใหม่", en: "New Year's Day" },
  "2025-02-12": { th: "วันมาฆบูชา", en: "Makha Bucha Day" },
  "2025-04-06": { th: "วันจักรี", en: "Chakri Memorial Day" },
  "2025-04-07": { th: "ชดเชยวันจักรี", en: "Chakri Day (in lieu)" },
  "2025-04-13": { th: "วันสงกรานต์", en: "Songkran Festival" },
  "2025-04-14": { th: "วันสงกรานต์", en: "Songkran Festival" },
  "2025-04-15": { th: "วันสงกรานต์", en: "Songkran Festival" },
  "2025-05-01": { th: "วันแรงงานแห่งชาติ", en: "National Labour Day" },
  "2025-05-05": { th: "ชดเชยวันฉัตรมงคล", en: "Coronation Day (in lieu)" },
  "2025-05-11": { th: "วันวิสาขบูชา", en: "Visakha Bucha Day" },
  "2025-05-12": { th: "ชดเชยวันวิสาขบูชา", en: "Visakha Bucha Day (in lieu)" },
  "2025-06-02": { th: "วันหยุดพิเศษ", en: "Special holiday" },
  "2025-06-03": { th: "วันเฉลิมพระชนมพรรษาสมเด็จพระบรมราชินี", en: "H.M. Queen Suthida's Birthday" },
  "2025-07-10": { th: "วันอาสาฬหบูชา", en: "Asalha Bucha Day" },
  "2025-07-11": { th: "วันเข้าพรรษา", en: "Buddhist Lent Day" },
  "2025-07-28": { th: "วันเฉลิมพระชนมพรรษา ร.10", en: "H.M. the King's Birthday" },
  "2025-08-11": { th: "วันหยุดพิเศษ", en: "Special holiday" },
  "2025-08-12": { th: "วันแม่แห่งชาติ", en: "H.M. Queen Sirikit's Birthday (Mother's Day)" },
  "2025-10-13": { th: "วันคล้ายวันสวรรคต ร.9", en: "H.M. King Bhumibol Memorial Day" },
  "2025-10-23": { th: "วันปิยมหาราช", en: "Chulalongkorn Day" },
  "2025-12-05": { th: "วันพ่อแห่งชาติ", en: "H.M. King Bhumibol's Birthday (Father's Day)" },
  "2025-12-10": { th: "วันรัฐธรรมนูญ", en: "Constitution Day" },
  "2025-12-31": { th: "วันสิ้นปี", en: "New Year's Eve" },

  // ── 2026 (BE 2569) ──────────────────────────────────────────────
  "2026-01-01": { th: "วันขึ้นปีใหม่", en: "New Year's Day" },
  "2026-03-03": { th: "วันมาฆบูชา", en: "Makha Bucha Day" },
  "2026-04-06": { th: "วันจักรี", en: "Chakri Memorial Day" },
  "2026-04-13": { th: "วันสงกรานต์", en: "Songkran Festival" },
  "2026-04-14": { th: "วันสงกรานต์", en: "Songkran Festival" },
  "2026-04-15": { th: "วันสงกรานต์", en: "Songkran Festival" },
  "2026-05-01": { th: "วันแรงงานแห่งชาติ", en: "National Labour Day" },
  "2026-05-04": { th: "วันฉัตรมงคล", en: "Coronation Day" },
  "2026-05-31": { th: "วันวิสาขบูชา", en: "Visakha Bucha Day" },
  "2026-06-01": { th: "ชดเชยวันวิสาขบูชา", en: "Visakha Bucha Day (in lieu)" },
  "2026-06-03": { th: "วันเฉลิมพระชนมพรรษาสมเด็จพระบรมราชินี", en: "H.M. Queen Suthida's Birthday" },
  "2026-07-28": { th: "วันเฉลิมพระชนมพรรษา ร.10", en: "H.M. the King's Birthday" },
  "2026-07-29": { th: "วันอาสาฬหบูชา", en: "Asalha Bucha Day" },
  "2026-07-30": { th: "วันเข้าพรรษา", en: "Buddhist Lent Day" },
  "2026-08-12": { th: "วันแม่แห่งชาติ", en: "H.M. Queen Sirikit's Birthday (Mother's Day)" },
  "2026-10-13": { th: "วันคล้ายวันสวรรคต ร.9", en: "H.M. King Bhumibol Memorial Day" },
  "2026-10-23": { th: "วันปิยมหาราช", en: "Chulalongkorn Day" },
  "2026-12-05": { th: "วันพ่อแห่งชาติ", en: "H.M. King Bhumibol's Birthday (Father's Day)" },
  "2026-12-07": { th: "ชดเชยวันพ่อแห่งชาติ", en: "Father's Day (in lieu)" },
  "2026-12-10": { th: "วันรัฐธรรมนูญ", en: "Constitution Day" },
  "2026-12-31": { th: "วันสิ้นปี", en: "New Year's Eve" },

  // ── 2027 (BE 2570) ──────────────────────────────────────────────
  "2027-01-01": { th: "วันขึ้นปีใหม่", en: "New Year's Day" },
  "2027-02-21": { th: "วันมาฆบูชา", en: "Makha Bucha Day" },
  "2027-02-22": { th: "ชดเชยวันมาฆบูชา", en: "Makha Bucha Day (in lieu)" },
  "2027-04-06": { th: "วันจักรี", en: "Chakri Memorial Day" },
  "2027-04-13": { th: "วันสงกรานต์", en: "Songkran Festival" },
  "2027-04-14": { th: "วันสงกรานต์", en: "Songkran Festival" },
  "2027-04-15": { th: "วันสงกรานต์", en: "Songkran Festival" },
  "2027-05-01": { th: "วันแรงงานแห่งชาติ", en: "National Labour Day" },
  "2027-05-04": { th: "วันฉัตรมงคล", en: "Coronation Day" },
  "2027-05-15": { th: "วันวิสาขบูชา", en: "Visakha Bucha Day" },
  "2027-06-03": { th: "วันเฉลิมพระชนมพรรษาสมเด็จพระบรมราชินี", en: "H.M. Queen Suthida's Birthday" },
  "2027-07-24": { th: "วันอาสาฬหบูชา", en: "Asalha Bucha Day" },
  "2027-07-25": { th: "วันเข้าพรรษา", en: "Buddhist Lent Day" },
  "2027-07-28": { th: "วันเฉลิมพระชนมพรรษา ร.10", en: "H.M. the King's Birthday" },
  "2027-08-12": { th: "วันแม่แห่งชาติ", en: "H.M. Queen Sirikit's Birthday (Mother's Day)" },
  "2027-10-13": { th: "วันคล้ายวันสวรรคต ร.9", en: "H.M. King Bhumibol Memorial Day" },
  "2027-10-23": { th: "วันปิยมหาราช", en: "Chulalongkorn Day" },
  "2027-12-05": { th: "วันพ่อแห่งชาติ", en: "H.M. King Bhumibol's Birthday (Father's Day)" },
  "2027-12-10": { th: "วันรัฐธรรมนูญ", en: "Constitution Day" },
  "2027-12-31": { th: "วันสิ้นปี", en: "New Year's Eve" },
};

export function getHoliday(dateISO: string): Holiday | undefined {
  return THAI_HOLIDAYS[dateISO];
}

export function isHoliday(dateISO: string): boolean {
  return dateISO in THAI_HOLIDAYS;
}

/** Localized holiday name for a date, or undefined if it isn't a holiday. */
export function holidayName(dateISO: string, lang: Lang): string | undefined {
  const h = THAI_HOLIDAYS[dateISO];
  return h ? h[lang] : undefined;
}

export interface UpcomingHoliday {
  date: string;
  dateLabel: string;
  name: string;
}

/** Holidays on or after `fromISO`, soonest first. */
export function upcomingHolidays(
  fromISO_: string,
  lang: Lang,
  limit = 3
): UpcomingHoliday[] {
  return Object.keys(THAI_HOLIDAYS)
    .filter((iso) => iso >= fromISO_)
    .sort()
    .slice(0, limit)
    .map((iso) => ({
      date: iso,
      dateLabel: shortDateLabel(fromISO(iso), lang),
      name: THAI_HOLIDAYS[iso][lang],
    }));
}
