"use client";

import type { CSSProperties } from "react";
import { dashboardStats, agendaForDate, upcomingItems } from "@/lib/agenda";
import { fromISO, longDateLabel } from "@/lib/dates";
import { greeting, t } from "@/lib/i18n";
import type { Theme } from "@/lib/theme";
import type { CalEvent, Lang, Todo } from "@/lib/types";

interface DashboardProps {
  theme: Theme;
  lang: Lang;
  todos: Todo[];
  events: CalEvent[];
  todayISO: string;
  onViewAll: () => void;
}

export function Dashboard({ theme, lang, todos, events, todayISO, onViewAll }: DashboardProps) {
  const stats = dashboardStats(todayISO, todos, events);
  const todayAgenda = agendaForDate(todayISO, lang, events, todos);
  const upcoming = upcomingItems(todayISO, lang, events, todos, 6);

  const cardStyle: CSSProperties = {
    background: theme.surface,
    border: `1px solid ${theme.borderColor}`,
    borderRadius: 18,
    padding: 18,
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
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 14,
        }}
      >
        <div style={cardStyle}>
          <p style={{ margin: 0, fontSize: 13, color: theme.textMuted, fontWeight: 600 }}>
            {t(lang, "tasksToday")}
          </p>
          <p
            className="font-display"
            style={{ margin: "8px 0 0", fontSize: 32, fontWeight: 600, color: theme.textPrimary }}
          >
            {stats.tasksToday}
          </p>
        </div>

        <div style={cardStyle}>
          <p style={{ margin: 0, fontSize: 13, color: theme.textMuted, fontWeight: 600 }}>
            {t(lang, "completion")}
          </p>
          <p
            className="font-display"
            style={{ margin: "8px 0 8px", fontSize: 32, fontWeight: 600, color: theme.textPrimary }}
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

        <div style={cardStyle}>
          <p style={{ margin: 0, fontSize: 13, color: theme.textMuted, fontWeight: 600 }}>
            {t(lang, "upcomingEvents")}
          </p>
          <p
            className="font-display"
            style={{ margin: "8px 0 0", fontSize: 32, fontWeight: 600, color: theme.textPrimary }}
          >
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
    </div>
  );
}
