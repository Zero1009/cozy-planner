"use client";

import { useState } from "react";
import { usePrefs } from "@/app/providers";
import { AiPanel } from "@/components/AiPanel";
import { Dashboard } from "@/components/Dashboard";
import { CalendarView } from "@/components/CalendarView";
import { TodoView } from "@/components/TodoView";
import { useEvents } from "@/hooks/useEvents";
import { useIsDesktop } from "@/hooks/useIsDesktop";
import { useTodos } from "@/hooks/useTodos";
import {
  CalendarIcon,
  DashboardIcon,
  GearIcon,
  SparkleIcon,
  TodoIcon,
} from "@/components/ui/icons";
import { toISO } from "@/lib/dates";
import { t } from "@/lib/i18n";
import { buildTheme, type Theme } from "@/lib/theme";
import type { CalView, Lang, ThemeColor, TodoFilter, View } from "@/lib/types";

type IconComponent = (props: { size?: number }) => React.JSX.Element;

const NAV_ITEMS: {
  view: View;
  Icon: IconComponent;
  labelKey: "dashboard" | "calendar" | "todo";
}[] = [
  { view: "dashboard", Icon: DashboardIcon, labelKey: "dashboard" },
  { view: "calendar", Icon: CalendarIcon, labelKey: "calendar" },
  { view: "todo", Icon: TodoIcon, labelKey: "todo" },
];

const THEME_SWATCHES: { key: ThemeColor; color: string }[] = [
  { key: "amber", color: "oklch(70% 0.14 95)" },
  { key: "sky", color: "oklch(70% 0.14 230)" },
  { key: "berry", color: "oklch(70% 0.14 340)" },
];

export function AppShell() {
  const prefs = usePrefs();
  const { lang, themeColor, darkMode, toggleLang, setThemeColor, toggleDarkMode } = prefs;
  const isDesktop = useIsDesktop();
  const theme = buildTheme(themeColor, darkMode);

  const todayISO = toISO(new Date());

  const [view, setView] = useState<View>("dashboard");
  const [calView, setCalView] = useState<CalView>("month");
  const [selectedDate, setSelectedDate] = useState(todayISO);
  const [calRefDate, setCalRefDate] = useState(todayISO);
  const [todoFilter, setTodoFilter] = useState<TodoFilter>("all");
  const [aiOpen, setAiOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const todosQuery = useTodos();
  const eventsQuery = useEvents();
  const todos = todosQuery.data ?? [];
  const events = eventsQuery.data ?? [];

  function viewAllToday() {
    setView("calendar");
    setCalView("day");
    setSelectedDate(todayISO);
    setCalRefDate(todayISO);
  }

  function goToday() {
    setSelectedDate(todayISO);
    setCalRefDate(todayISO);
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        background: theme.rootBg,
        color: theme.textPrimary,
        fontFamily: "var(--font-quicksand), sans-serif",
      }}
    >
      <TopBar
        theme={theme}
        lang={lang}
        darkMode={darkMode}
        themeColor={themeColor}
        toggleLang={toggleLang}
        toggleDarkMode={toggleDarkMode}
        setThemeColor={setThemeColor}
        settingsOpen={settingsOpen}
        setSettingsOpen={setSettingsOpen}
      />

      <div style={{ flex: 1, display: "flex", minHeight: 0 }}>
        {isDesktop && <Sidebar theme={theme} lang={lang} view={view} setView={setView} />}

        <main
          style={{
            flex: 1,
            minWidth: 0,
            padding: isDesktop ? "24px 28px 40px" : "16px 14px 96px",
            maxWidth: 1180,
            width: "100%",
            marginLeft: isDesktop ? undefined : undefined,
            marginInline: isDesktop ? "auto" : undefined,
          }}
        >
          {view === "dashboard" && (
            <Dashboard
              theme={theme}
              lang={lang}
              todos={todos}
              events={events}
              todayISO={todayISO}
              onViewAll={viewAllToday}
            />
          )}
          {view === "calendar" && (
            <CalendarView
              theme={theme}
              lang={lang}
              isDesktop={isDesktop}
              todos={todos}
              events={events}
              todayISO={todayISO}
              calView={calView}
              setCalView={setCalView}
              selectedDate={selectedDate}
              setSelectedDate={setSelectedDate}
              calRefDate={calRefDate}
              setCalRefDate={setCalRefDate}
              onToday={goToday}
            />
          )}
          {view === "todo" && (
            <TodoView
              theme={theme}
              lang={lang}
              todos={todos}
              todayISO={todayISO}
              filter={todoFilter}
              setFilter={setTodoFilter}
            />
          )}
        </main>
      </div>

      {!isDesktop && <BottomNav theme={theme} lang={lang} view={view} setView={setView} />}

      <button
        type="button"
        onClick={() => setAiOpen(true)}
        aria-label={t(lang, "aiTitle")}
        style={{
          position: "fixed",
          right: isDesktop ? 28 : 16,
          bottom: isDesktop ? 28 : 82,
          width: 56,
          height: 56,
          borderRadius: "50%",
          border: "none",
          background: theme.accentBg,
          color: "white",
          fontSize: 24,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 10px 24px oklch(20% 0.02 90 / 0.25)",
          cursor: "pointer",
          zIndex: 30,
        }}
      >
        <SparkleIcon size={24} />
      </button>

      <AiPanel
        theme={theme}
        lang={lang}
        isDesktop={isDesktop}
        open={aiOpen}
        onClose={() => setAiOpen(false)}
      />
    </div>
  );
}

interface TopBarProps {
  theme: Theme;
  lang: Lang;
  darkMode: boolean;
  themeColor: ThemeColor;
  toggleLang: () => void;
  toggleDarkMode: () => void;
  setThemeColor: (c: ThemeColor) => void;
  settingsOpen: boolean;
  setSettingsOpen: (v: boolean | ((prev: boolean) => boolean)) => void;
}

function TopBar({
  theme,
  lang,
  darkMode,
  themeColor,
  toggleLang,
  toggleDarkMode,
  setThemeColor,
  settingsOpen,
  setSettingsOpen,
}: TopBarProps) {
  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "14px 20px",
        borderBottom: `1px solid ${theme.divider}`,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 11,
            background: theme.accentBg,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span
            style={{
              width: 13,
              height: 13,
              borderRadius: 4,
              background: theme.surface,
              display: "block",
            }}
          />
        </div>
        <span
          className="font-display"
          style={{ fontSize: 19, fontWeight: 600, color: theme.textPrimary }}
        >
          {t(lang, "appName")}
        </span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8, position: "relative" }}>
        <button
          type="button"
          onClick={toggleLang}
          style={{
            padding: "8px 14px",
            borderRadius: 11,
            border: `1px solid ${theme.borderColor}`,
            background: theme.chipBg,
            color: theme.textPrimary,
            fontSize: 13,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          {lang === "th" ? "EN" : "ไทย"}
        </button>

        <button
          type="button"
          onClick={() => setSettingsOpen((v) => !v)}
          aria-label="Settings"
          style={{
            width: 36,
            height: 36,
            borderRadius: 11,
            border: `1px solid ${theme.borderColor}`,
            background: theme.chipBg,
            color: theme.textPrimary,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <GearIcon size={17} />
        </button>

        {settingsOpen && (
          <>
            <div
              onClick={() => setSettingsOpen(false)}
              style={{ position: "fixed", inset: 0, zIndex: 40 }}
            />
            <div
              style={{
                position: "absolute",
                top: "calc(100% + 8px)",
                right: 0,
                zIndex: 41,
                width: 200,
                padding: 14,
                borderRadius: 14,
                border: `1px solid ${theme.borderColor}`,
                background: theme.surface,
                boxShadow: "0 12px 28px oklch(20% 0.02 90 / 0.2)",
                display: "flex",
                flexDirection: "column",
                gap: 12,
              }}
            >
              <button
                type="button"
                onClick={toggleDarkMode}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "8px 10px",
                  borderRadius: 10,
                  border: `1px solid ${theme.borderColor}`,
                  background: theme.chipBg,
                  color: theme.textPrimary,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                <span>{darkMode ? "🌙 Dark" : "☀️ Light"}</span>
              </button>

              <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                {THEME_SWATCHES.map((sw) => (
                  <button
                    key={sw.key}
                    type="button"
                    onClick={() => setThemeColor(sw.key)}
                    aria-label={sw.key}
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: "50%",
                      background: sw.color,
                      border:
                        themeColor === sw.key
                          ? `2.5px solid ${theme.textPrimary}`
                          : "2.5px solid transparent",
                      cursor: "pointer",
                    }}
                  />
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </header>
  );
}

interface NavProps {
  theme: Theme;
  lang: Lang;
  view: View;
  setView: (v: View) => void;
}

function Sidebar({ theme, lang, view, setView }: NavProps) {
  return (
    <nav
      style={{
        width: 220,
        flexShrink: 0,
        padding: "20px 14px",
        borderRight: `1px solid ${theme.divider}`,
        display: "flex",
        flexDirection: "column",
        gap: 6,
      }}
    >
      {NAV_ITEMS.map((item) => {
        const active = item.view === view;
        return (
          <button
            key={item.view}
            type="button"
            onClick={() => setView(item.view)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "11px 14px",
              borderRadius: 13,
              border: "none",
              background: active ? theme.accentTint : "transparent",
              color: active ? theme.textPrimary : theme.textSecondary,
              fontSize: 14.5,
              fontWeight: active ? 700 : 500,
              cursor: "pointer",
              textAlign: "left",
            }}
          >
            <item.Icon size={18} />
            {t(lang, item.labelKey)}
          </button>
        );
      })}
    </nav>
  );
}

function BottomNav({ theme, lang, view, setView }: NavProps) {
  return (
    <nav
      style={{
        position: "fixed",
        left: 0,
        right: 0,
        bottom: 0,
        display: "flex",
        justifyContent: "space-around",
        padding: "8px 6px calc(8px + env(safe-area-inset-bottom))",
        background: theme.surface,
        borderTop: `1px solid ${theme.divider}`,
        zIndex: 20,
      }}
    >
      {NAV_ITEMS.map((item) => {
        const active = item.view === view;
        return (
          <button
            key={item.view}
            type="button"
            onClick={() => setView(item.view)}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 2,
              padding: "6px 14px",
              borderRadius: 12,
              border: "none",
              background: active ? theme.accentTint : "transparent",
              color: active ? theme.textPrimary : theme.textSecondary,
              fontSize: 11,
              fontWeight: active ? 700 : 500,
              cursor: "pointer",
            }}
          >
            <item.Icon size={19} />
            {t(lang, item.labelKey)}
          </button>
        );
      })}
    </nav>
  );
}
