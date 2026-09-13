import { holidayName, HOLIDAY_BORDER, HOLIDAY_COLOR, HOLIDAY_TINT } from "@/lib/holidays";
import { t } from "@/lib/i18n";
import type { Theme } from "@/lib/theme";
import type { Lang } from "@/lib/types";

/**
 * Shows a warm-tinted banner naming the Thai public holiday on `dateISO`.
 * Shared by `DayAgenda`, `SidePanelAgenda` and `DayDetailSheet` — pulled out
 * here (rather than left private to `CalendarView`) so the sheet can use it
 * without the two modules importing each other.
 */
export function HolidayBanner({
  theme,
  lang,
  dateISO,
  compact,
}: {
  theme: Theme;
  lang: Lang;
  dateISO: string;
  compact?: boolean;
}) {
  const name = holidayName(dateISO, lang);
  if (!name) return null;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: compact ? "7px 10px" : "9px 12px",
        borderRadius: compact ? 11 : 13,
        background: HOLIDAY_TINT,
        border: `1px solid ${HOLIDAY_BORDER}`,
        marginBottom: compact ? 8 : 10,
      }}
    >
      <span aria-hidden style={{ fontSize: compact ? 13 : 15, lineHeight: 1 }}>
        🎌
      </span>
      <span style={{ fontSize: compact ? 12 : 13, fontWeight: 800, color: HOLIDAY_COLOR, flexShrink: 0 }}>
        {t(lang, "holiday")}
      </span>
      <span
        style={{
          fontSize: compact ? 12.5 : 13.5,
          color: theme.textPrimary,
          fontWeight: 600,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {name}
      </span>
    </div>
  );
}
