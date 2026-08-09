"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { usePrefs } from "@/app/providers";
import { AiPanel } from "@/components/AiPanel";
import { AdminUsersDialog, ProfileDialog } from "@/components/AccountDialogs";
import { CozyLoading } from "@/components/CozyLoading";
import { PwaInstallPrompt } from "@/components/PwaInstallPrompt";
import { purgePwaCaches } from "@/components/ServiceWorkerRegistrar";
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
  MenuIcon,
  SparkleIcon,
  TodoIcon,
} from "@/components/ui/icons";
import { toISO } from "@/lib/dates";
import { t } from "@/lib/i18n";
import { postJSON } from "@/lib/api";
import { buildTheme, type Theme } from "@/lib/theme";
import type { CalView, Lang, ThemeColor, TodoFilter, View } from "@/lib/types";
import type { CurrentUser } from "@/lib/session";

type IconComponent = (props: { size?: number }) => React.JSX.Element;

interface FloatingPoint {
  x: number;
  y: number;
}

/**
 * How far the pointer may travel and still count as a tap on the floating AI
 * button rather than the start of a drag. A finger rarely holds within 3px, so
 * the old threshold turned ordinary taps into no-op drags.
 */
const TAP_SLOP = 9;

const NAV_ITEMS: {
  view: View;
  href: string;
  Icon: IconComponent;
  labelKey: "dashboard" | "calendar" | "todo";
}[] = [
  { view: "dashboard", href: "/dashboard", Icon: DashboardIcon, labelKey: "dashboard" },
  { view: "calendar", href: "/calendar", Icon: CalendarIcon, labelKey: "calendar" },
  { view: "todo", href: "/todos", Icon: TodoIcon, labelKey: "todo" },
];

const THEME_SWATCHES: { key: ThemeColor; color: string }[] = [
  { key: "amber", color: "oklch(72% 0.14 78)" },
  { key: "sky", color: "oklch(64% 0.1 155)" },
  { key: "berry", color: "oklch(68% 0.15 28)" },
];

interface AppShellProps {
  currentUser: CurrentUser;
}

export function AppShell({ currentUser }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const prefs = usePrefs();
  const { lang, themeColor, darkMode, toggleLang, setThemeColor, toggleDarkMode } = prefs;
  const isDesktop = useIsDesktop();
  const theme = buildTheme(themeColor, darkMode);
  const [user, setUser] = useState(currentUser);

  const todayISO = toISO(new Date());

  const view = pathnameToView(pathname);
  const [calView, setCalView] = useState<CalView>("month");
  const [selectedDate, setSelectedDate] = useState(todayISO);
  const [calRefDate, setCalRefDate] = useState(todayISO);
  const [todoFilter, setTodoFilter] = useState<TodoFilter>("all");
  const [aiOpen, setAiOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(currentUser.mustUpdateProfile);
  const [adminOpen, setAdminOpen] = useState(false);
  const [aiButtonPoint, setAiButtonPoint] = useState<FloatingPoint | null>(null);
  const aiDragRef = useRef<{
    startX: number;
    startY: number;
    point: FloatingPoint;
    moved: boolean;
  } | null>(null);

  const todosQuery = useTodos();
  const eventsQuery = useEvents();
  const todos = todosQuery.data ?? [];
  const events = eventsQuery.data ?? [];
  const loadingPlannerData = todosQuery.isLoading || eventsQuery.isLoading;

  useEffect(() => {
    const saved = window.localStorage.getItem("cozy-ai-button-point");
    if (!saved) return;
    try {
      const point = JSON.parse(saved) as FloatingPoint;
      setAiButtonPoint(clampAiButtonPoint(point));
    } catch {
      window.localStorage.removeItem("cozy-ai-button-point");
    }
  }, []);

  useEffect(() => {
    function onResize() {
      setAiButtonPoint((point) => {
        if (!point) return point;
        const next = clampAiButtonPoint(point);
        window.localStorage.setItem("cozy-ai-button-point", JSON.stringify(next));
        return next;
      });
    }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  function viewAllToday() {
    setCalView("day");
    setSelectedDate(todayISO);
    setCalRefDate(todayISO);
    router.push("/calendar");
  }

  function goToday() {
    setSelectedDate(todayISO);
    setCalRefDate(todayISO);
  }

  function handleAiPointerDown(event: React.PointerEvent<HTMLButtonElement>) {
    // Read the live rect rather than recomputing the default offsets: those are
    // safe-area-aware CSS calc() values that JS can't reproduce reliably.
    const rect = event.currentTarget.getBoundingClientRect();
    const point = aiButtonPoint ?? clampAiButtonPoint({ x: rect.left, y: rect.top });
    aiDragRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      point,
      moved: false,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handleAiPointerMove(event: React.PointerEvent<HTMLButtonElement>) {
    const drag = aiDragRef.current;
    if (!drag) return;
    const dx = event.clientX - drag.startX;
    const dy = event.clientY - drag.startY;
    if (Math.abs(dx) > TAP_SLOP || Math.abs(dy) > TAP_SLOP) drag.moved = true;
    if (!drag.moved) return;
    const next = clampAiButtonPoint({ x: drag.point.x + dx, y: drag.point.y + dy });
    setAiButtonPoint(next);
  }

  function handleAiPointerUp(event: React.PointerEvent<HTMLButtonElement>) {
    const drag = aiDragRef.current;
    aiDragRef.current = null;
    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      // Pointer capture may already be released by the browser.
    }
    if (drag?.moved) {
      setAiButtonPoint((point) => {
        const next = clampAiButtonPoint(point ?? drag.point);
        window.localStorage.setItem("cozy-ai-button-point", JSON.stringify(next));
        return next;
      });
      return;
    }
    setAiOpen(true);
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
        currentUser={user}
        isDesktop={isDesktop}
        onOpenProfile={() => {
          setSettingsOpen(false);
          setProfileOpen(true);
        }}
        onOpenAdmin={() => {
          setSettingsOpen(false);
          setAdminOpen(true);
        }}
      />

      <div style={{ flex: 1, display: "flex", minHeight: 0 }}>
        {isDesktop && <Sidebar theme={theme} lang={lang} view={view} />}

        <main
          style={{
            flex: 1,
            minWidth: 0,
            padding: isDesktop
              ? "24px 28px 40px"
              : "16px calc(14px + env(safe-area-inset-right)) calc(96px + env(safe-area-inset-bottom)) calc(14px + env(safe-area-inset-left))",
            maxWidth: 1180,
            width: "100%",
            marginLeft: isDesktop ? undefined : undefined,
            marginInline: isDesktop ? "auto" : undefined,
          }}
        >
          {loadingPlannerData && (
            <div
              style={{
                minHeight: isDesktop ? 360 : 180,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: isDesktop ? 0 : "0 12px",
              }}
            >
              <CozyLoading message="กำลังโหลดตารางและรายการของคุณ..." compact={!isDesktop} />
            </div>
          )}
          {!loadingPlannerData && view === "dashboard" && (
            <Dashboard
              theme={theme}
              lang={lang}
              isDesktop={isDesktop}
              todos={todos}
              events={events}
              todayISO={todayISO}
              onViewAll={viewAllToday}
            />
          )}
          {!loadingPlannerData && view === "calendar" && (
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
          {!loadingPlannerData && view === "todo" && (
            <TodoView
              theme={theme}
              lang={lang}
              isDesktop={isDesktop}
              todos={todos}
              todayISO={todayISO}
              filter={todoFilter}
              setFilter={setTodoFilter}
            />
          )}
        </main>
      </div>

      {!isDesktop && <BottomNav theme={theme} lang={lang} view={view} />}

      <button
        type="button"
        onPointerDown={handleAiPointerDown}
        onPointerMove={handleAiPointerMove}
        onPointerUp={handleAiPointerUp}
        aria-label={t(lang, "aiTitle")}
        title="ลากเพื่อย้ายตำแหน่ง หรือแตะเพื่อเปิดผู้ช่วย AI"
        style={{
          position: "fixed",
          left: aiButtonPoint ? aiButtonPoint.x : undefined,
          top: aiButtonPoint ? aiButtonPoint.y : undefined,
          right: aiButtonPoint
            ? undefined
            : isDesktop
            ? 28
            : "calc(16px + env(safe-area-inset-right))",
          bottom: aiButtonPoint
            ? undefined
            : isDesktop
            ? 28
            : "calc(82px + env(safe-area-inset-bottom))",
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
          cursor: "grab",
          touchAction: "none",
          userSelect: "none",
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

      {profileOpen && (
        <ProfileDialog
          theme={theme}
          user={user}
          forced={user.mustUpdateProfile}
          onClose={() => setProfileOpen(false)}
          onSaved={(updated) => {
            setUser(updated);
            setProfileOpen(false);
          }}
        />
      )}

      {adminOpen && user.isAdmin && (
        <AdminUsersDialog theme={theme} onClose={() => setAdminOpen(false)} />
      )}
    </div>
  );
}

function clampAiButtonPoint(point: FloatingPoint): FloatingPoint {
  const margin = 12;
  const size = 56;
  const maxX = Math.max(margin, window.innerWidth - size - margin);
  const maxY = Math.max(margin, window.innerHeight - size - margin);
  return {
    x: Math.min(Math.max(point.x, margin), maxX),
    y: Math.min(Math.max(point.y, margin), maxY),
  };
}

function pathnameToView(pathname: string): View {
  if (pathname.startsWith("/calendar")) return "calendar";
  if (pathname.startsWith("/todos")) return "todo";
  return "dashboard";
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
  currentUser: CurrentUser;
  isDesktop: boolean;
  onOpenProfile: () => void;
  onOpenAdmin: () => void;
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
  currentUser,
  isDesktop,
  onOpenProfile,
  onOpenAdmin,
}: TopBarProps) {
  async function logout() {
    await postJSON("/api/auth/logout", {});
    await purgePwaCaches();
    window.location.href = "/login";
  }

  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 10,
        // `viewport-fit: cover` lets the header slide under the status bar in
        // standalone PWA mode, so pad by the inset rather than a fixed value.
        padding: isDesktop
          ? "14px 20px"
          : "calc(10px + env(safe-area-inset-top)) calc(12px + env(safe-area-inset-right)) 10px calc(12px + env(safe-area-inset-left))",
        borderBottom: `1px solid ${theme.divider}`,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
        <Image
          src="/cozy-planner-icon.png"
          alt=""
          width={36}
          height={36}
          style={{
            width: isDesktop ? 36 : 32,
            height: isDesktop ? 36 : 32,
            borderRadius: isDesktop ? 11 : 10,
            objectFit: "cover",
            boxShadow: "0 6px 14px oklch(45% 0.08 55 / 0.16)",
          }}
        />
        <span
          className="font-display"
          style={{
            fontSize: isDesktop ? 19 : 17,
            fontWeight: 600,
            color: theme.textPrimary,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {t(lang, "appName")}
        </span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: isDesktop ? 8 : 6, position: "relative", flexShrink: 0 }}>
        {isDesktop && (
          <button
            type="button"
            onClick={onOpenProfile}
            style={{
              padding: "8px 12px",
              borderRadius: 11,
              border: `1px solid ${theme.borderColor}`,
              background: theme.chipBg,
              color: theme.textPrimary,
              fontSize: 13,
              fontWeight: 800,
              cursor: "pointer",
            }}
          >
            โปรไฟล์
          </button>
        )}

        {isDesktop && currentUser.isAdmin && (
          <button
            type="button"
            onClick={onOpenAdmin}
            style={{
              padding: "8px 12px",
              borderRadius: 11,
              border: `1px solid ${theme.borderColor}`,
              background: theme.chipBg,
              color: theme.textPrimary,
              fontSize: 13,
              fontWeight: 800,
              cursor: "pointer",
            }}
          >
            จัดการผู้ใช้
          </button>
        )}

        {isDesktop && (
          <button
            type="button"
            onClick={logout}
            style={{
              padding: "8px 12px",
              borderRadius: 11,
              border: `1px solid ${theme.borderColor}`,
              background: theme.inputBg,
              color: theme.textPrimary,
              fontSize: 13,
              fontWeight: 900,
              cursor: "pointer",
            }}
          >
            ออกจากระบบ
          </button>
        )}

        <button
          type="button"
          onClick={toggleLang}
          style={{
            minHeight: isDesktop ? undefined : 44,
            padding: isDesktop ? "8px 14px" : "12px 13px",
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
          aria-label={isDesktop ? "Settings" : "เมนู"}
          style={{
            width: isDesktop ? 36 : 44,
            height: isDesktop ? 36 : 44,
            flexShrink: 0,
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
          {isDesktop ? <GearIcon size={17} /> : <MenuIcon size={18} />}
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
                width: isDesktop ? 200 : "min(260px, calc(100vw - 24px))",
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
                  minHeight: isDesktop ? undefined : 44,
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

              <div style={{ display: "flex", gap: isDesktop ? 8 : 0, justifyContent: "center" }}>
                {THEME_SWATCHES.map((sw) => (
                  <button
                    key={sw.key}
                    type="button"
                    onClick={() => setThemeColor(sw.key)}
                    aria-label={sw.key}
                    style={{
                      width: 44,
                      height: 44,
                      padding: 0,
                      border: "none",
                      background: "transparent",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                    }}
                  >
                    <span
                      style={{
                        width: 26,
                        height: 26,
                        borderRadius: "50%",
                        background: sw.color,
                        border:
                          themeColor === sw.key
                            ? `2.5px solid ${theme.textPrimary}`
                            : "2.5px solid transparent",
                      }}
                    />
                  </button>
                ))}
              </div>

              <div
                style={{
                  borderTop: `1px solid ${theme.divider}`,
                  paddingTop: 10,
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                }}
              >
                <span style={{ fontSize: 12, color: theme.textMuted, fontWeight: 700 }}>
                  {currentUser.displayName}
                </span>
                {currentUser.mustUpdateProfile && (
                  <span style={{ fontSize: 11, color: theme.textMuted, fontWeight: 700 }}>
                    รออัปเดตโปรไฟล์
                  </span>
                )}
                <button
                  type="button"
                  onClick={onOpenProfile}
                  style={{
                    minHeight: isDesktop ? undefined : 44,
                    padding: "8px 10px",
                    borderRadius: 10,
                    border: `1px solid ${theme.borderColor}`,
                    background: theme.inputBg,
                    color: theme.textPrimary,
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  โปรไฟล์ของฉัน
                </button>
                <PwaInstallPrompt
                  variant="inline"
                  buttonStyle={{
                    minHeight: isDesktop ? undefined : 44,
                    padding: "8px 10px",
                    borderRadius: 10,
                    border: `1px solid ${theme.borderColor}`,
                    background: theme.inputBg,
                    color: theme.textPrimary,
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                />
                {currentUser.isAdmin && (
                  <button
                    type="button"
                    onClick={onOpenAdmin}
                    style={{
                      minHeight: isDesktop ? undefined : 44,
                      padding: "8px 10px",
                      borderRadius: 10,
                      border: `1px solid ${theme.borderColor}`,
                      background: theme.inputBg,
                      color: theme.textPrimary,
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    จัดการผู้ใช้
                  </button>
                )}
                <button
                  type="button"
                  onClick={logout}
                  style={{
                    minHeight: isDesktop ? undefined : 44,
                    padding: "8px 10px",
                    borderRadius: 10,
                    border: `1px solid ${theme.borderColor}`,
                    background: theme.inputBg,
                    color: theme.textPrimary,
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  ออกจากระบบ
                </button>
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
}

function Sidebar({ theme, lang, view }: NavProps) {
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
          <Link
            key={item.view}
            href={item.href}
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
              textDecoration: "none",
            }}
          >
            <item.Icon size={18} />
            {t(lang, item.labelKey)}
          </Link>
        );
      })}
    </nav>
  );
}

function BottomNav({ theme, lang, view }: NavProps) {
  return (
    <nav
      style={{
        position: "fixed",
        left: 0,
        right: 0,
        bottom: 0,
        display: "flex",
        justifyContent: "space-around",
        padding:
          "8px calc(6px + env(safe-area-inset-right)) calc(8px + env(safe-area-inset-bottom)) calc(6px + env(safe-area-inset-left))",
        background: theme.surface,
        borderTop: `1px solid ${theme.divider}`,
        zIndex: 20,
      }}
    >
      {NAV_ITEMS.map((item) => {
        const active = item.view === view;
        return (
          <Link
            key={item.view}
            href={item.href}
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
              textDecoration: "none",
            }}
          >
            <item.Icon size={19} />
            {t(lang, item.labelKey)}
          </Link>
        );
      })}
    </nav>
  );
}
