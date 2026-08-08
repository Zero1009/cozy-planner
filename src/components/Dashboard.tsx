"use client";

import type { CSSProperties } from "react";
import { dashboardStats, agendaForDate, upcomingItems } from "@/lib/agenda";
import {
  holidayName,
  upcomingHolidays,
  HOLIDAY_BORDER,
  HOLIDAY_COLOR,
  HOLIDAY_TINT,
} from "@/lib/holidays";
import { fromISO, longDateLabel } from "@/lib/dates";
import { greeting, t } from "@/lib/i18n";
import type { Theme } from "@/lib/theme";
import type { CalEvent, Lang, Todo } from "@/lib/types";

interface DashboardProps {
  theme: Theme;
  lang: Lang;
  isDesktop: boolean;
  todos: Todo[];
  events: CalEvent[];
  todayISO: string;
  onViewAll: () => void;
}

export function Dashboard({
  theme,
  lang,
  isDesktop,
  todos,
  events,
  todayISO,
  onViewAll,
}: DashboardProps) {
  const stats = dashboardStats(todayISO, todos, events);
  const todayAgenda = agendaForDate(todayISO, lang, events, todos);
  const upcoming = upcomingItems(todayISO, lang, events, todos, 6);
  const todayHoliday = holidayName(todayISO, lang);
  const nextHolidays = upcomingHolidays(todayISO, lang, 3);

  const cardStyle: CSSProperties = {
    background: theme.surface,
    border: `1px solid ${theme.borderColor}`,
    borderRadius: 18,
    padding: 18,
  };

  // The three stat tiles sit side by side on every width; on mobile they shrink
  // instead of stacking, which otherwise cost a full screen before any content.
  const statCardStyle: CSSProperties = { ...cardStyle, padding: isDesktop ? 18 : 12 };
  const statLabelStyle: CSSProperties = {
    margin: 0,
    fontSize: isDesktop ? 13 : 11.5,
    color: theme.textMuted,
    fontWeight: 600,
  };
  const statValueStyle: CSSProperties = {
    margin: isDesktop ? "8px 0 0" : "4px 0 0",
    fontSize: isDesktop ? 32 : 24,
    fontWeight: 600,
    color: theme.textPrimary,
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <h1
          className="font-display"
          style={{ margin: 0, fontSize: 26, fontWeight: 600, color: theme.textPrimary }}
        >
          {greeting(lang)}
        </h1>
        <p style={{ margin: "4px 0 0", fontSize: 15, color: theme.textSecondary }}>
          {longDateLabel(fromISO(todayISO), lang)}
        </p>
        {todayHoliday && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginTop: 12,
              padding: "10px 14px",
              borderRadius: 14,
              background: HOLIDAY_TINT,
              border: `1px solid ${HOLIDAY_BORDER}`,
            }}
          >
            <span aria-hidden style={{ fontSize: 17, lineHeight: 1 }}>
              🎌
            </span>
            <span style={{ fontSize: 13, fontWeight: 800, color: HOLIDAY_COLOR, flexShrink: 0 }}>
              {t(lang, "holiday")}
            </span>
            <span style={{ fontSize: 14, fontWeight: 600, color: theme.textPrimary }}>
              {todayHoliday}
            </span>
          </div>
        )}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
          gap: isDesktop ? 14 : 8,
        }}
      >
        <div style={statCardStyle}>
          <p style={statLabelStyle}>{t(lang, "tasksToday")}</p>
          <p className="font-display" style={statValueStyle}>
            {stats.tasksToday}
          </p>
        </div>

        <div style={statCardStyle}>
          <p style={statLabelStyle}>{t(lang, "completion")}</p>
          <p
            className="font-display"
            style={{ ...statValueStyle, marginBottom: isDesktop ? 8 : 6 }}
          >
            {stats.completionPct}%
          </p>
          <div
            style={{
              height: 8,
              borderRadius: 999,
              background: theme.chipBg,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${stats.completionPct}%`,
                background: theme.accentBg,
                borderRadius: 999,
                transition: "width 0.3s ease",
              }}
            />
          </div>
        </div>

        <div style={statCardStyle}>
          <p style={statLabelStyle}>{t(lang, "upcomingEvents")}</p>
          <p className="font-display" style={statValueStyle}>
            {stats.upcomingEventsCount}
          </p>
        </div>
      </div>

      <div style={cardStyle}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 12,
          }}
        >
          <h2 className="font-display" style={{ margin: 0, fontSize: 17, fontWeight: 600 }}>
            {t(lang, "yourTasksToday")}
          </h2>
          <button
            type="button"
            onClick={onViewAll}
            style={{
              border: "none",
              background: "none",
              color: theme.accentDark,
              fontWeight: 700,
              fontSize: 13.5,
              cursor: "pointer",
            }}
          >
            {t(lang, "viewAll")} →
          </button>
        </div>

        {todayAgenda.length === 0 ? (
          <p style={{ color: theme.textMuted, fontSize: 14, margin: "8px 0" }}>
            {t(lang, "noItemsToday")}
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {todayAgenda.map((item) => (
              <div
                key={item.key}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "9px 12px",
                  borderRadius: 13,
                  background: theme.inputBg,
                }}
              >
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: item.dotColor,
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    fontSize: 12.5,
                    color: theme.textMuted,
                    width: 74,
                    flexShrink: 0,
                  }}
                >
                  {item.time}
                </span>
                <span
                  style={{
                    flex: 1,
                    fontSize: 14,
                    color: theme.textPrimary,
                    textDecoration: item.done ? "line-through" : "none",
                    opacity: item.done ? 0.5 : 1,
                  }}
                >
                  {item.title}
                </span>
                <span
                  style={{
                    fontSize: 11.5,
                    fontWeight: 700,
                    padding: "3px 9px",
                    borderRadius: 999,
                    background: item.tagBg,
                    color: item.tagColor,
                    flexShrink: 0,
                  }}
                >
                  {item.categoryLabel}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={cardStyle}>
        <h2 className="font-display" style={{ margin: "0 0 12px", fontSize: 17, fontWeight: 600 }}>
          {t(lang, "upcoming")}
        </h2>

        {upcoming.length === 0 ? (
          <p style={{ color: theme.textMuted, fontSize: 14, margin: "8px 0" }}>
            {t(lang, "noTasks")}
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {upcoming.map((item) => (
              <div
                key={item.key}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "9px 12px",
                  borderRadius: 13,
                  background: theme.inputBg,
                }}
              >
                <span
                  style={{
                    fontSize: 12.5,
                    color: theme.textMuted,
                    width: 56,
                    flexShrink: 0,
                  }}
                >
                  {item.dateLabel}
                </span>
                <span style={{ flex: 1, fontSize: 14, color: theme.textPrimary }}>
                  {item.title}
                </span>
                <span
                  style={{
                    fontSize: 11.5,
                    fontWeight: 700,
                    padding: "3px 9px",
                    borderRadius: 999,
                    background: item.tagBg,
                    color: item.tagColor,
                    flexShrink: 0,
                  }}
                >
                  {item.categoryLabel}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {nextHolidays.length > 0 && (
        <div style={cardStyle}>
          <h2 className="font-display" style={{ margin: "0 0 12px", fontSize: 17, fontWeight: 600 }}>
            {t(lang, "upcomingHolidays")}
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {nextHolidays.map((h) => (
              <div
                key={h.date}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "9px 12px",
                  borderRadius: 13,
                  background: theme.inputBg,
                }}
              >
                <span aria-hidden style={{ fontSize: 14, lineHeight: 1, flexShrink: 0 }}>
                  🎌
                </span>
                <span
                  style={{
                    fontSize: 12.5,
                    color: HOLIDAY_COLOR,
                    fontWeight: 700,
                    width: 56,
                    flexShrink: 0,
                  }}
                >
                  {h.dateLabel}
                </span>
                <span style={{ flex: 1, fontSize: 14, color: theme.textPrimary }}>{h.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
