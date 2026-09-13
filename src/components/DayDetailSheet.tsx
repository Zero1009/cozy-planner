"use client";

import { useEffect, useRef } from "react";
import { AgendaRow } from "@/components/ui/AgendaRow";
import { HolidayBanner } from "@/components/ui/HolidayBanner";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/ui/icons";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";
import { useDaySwipe } from "@/hooks/useDaySwipe";
import { agendaForDate, type AgendaItem } from "@/lib/agenda";
import { fromISO, fullDateLabel, longDateLabel, weekdayLabel } from "@/lib/dates";
import { t } from "@/lib/i18n";
import type { Theme } from "@/lib/theme";
import type { CalEvent, Lang, Todo } from "@/lib/types";

interface DayDetailSheetProps {
  theme: Theme;
  lang: Lang;
  isDesktop: boolean;
  dateISO: string;
  todayISO: string;
  events: CalEvent[];
  todos: Todo[];
  /** Which entry animation the keyed content plays — set by the caller right
   *  before it changes `dateISO`. */
  direction: "next" | "prev";
  onPrevDay: () => void;
  onNextDay: () => void;
  onEdit: (item: AgendaItem) => void;
  onDelete: (item: AgendaItem) => void;
  /** Closes this sheet and opens the existing `AddEventForm` for `dateISO`. */
  onAddEvent: () => void;
  onClose: () => void;
  /** True while `EditItemSheet` is stacked on top — see the Escape guard below. */
  inert?: boolean;
}

/**
 * Mobile bottom sheet for one day's agenda, opened by tapping a month/week
 * cell. Sibling of `EditItemSheet`/`AddEventForm`'s sheet variant, not a
 * variant of `DayAgenda` — it needs modal chrome, a pinned header and its own
 * scroll container with gesture plumbing that a `variant` prop would tangle
 * up with the inline card those two already are.
 */
export function DayDetailSheet({
  theme,
  lang,
  isDesktop,
  dateISO,
  todayISO,
  events,
  todos,
  direction,
  onPrevDay,
  onNextDay,
  onEdit,
  onDelete,
  onAddEvent,
  onClose,
  inert = false,
}: DayDetailSheetProps) {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const { handlers, paneRef } = useDaySwipe({ onPrev: onPrevDay, onNext: onNextDay, enabled: !inert });

  useBodyScrollLock(true);

  useEffect(() => {
    returnFocusRef.current = document.activeElement as HTMLElement | null;
    cardRef.current?.focus();
    return () => {
      // Restore focus to the cell that opened the sheet — but only if it's
      // still attached. Swiping across a month boundary re-renders the grid
      // behind the sheet, so the original cell node can be long gone by the
      // time the sheet closes.
      if (returnFocusRef.current?.isConnected) returnFocusRef.current.focus();
    };
    // Only on mount/unmount: re-running this per swipe would re-capture the
    // "return to" element as whatever currently has focus (the sheet itself).
  }, []);

  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    // While the edit sheet is stacked on top it doesn't autofocus on mobile
    // (`EditItemSheet` uses `autoFocus={isDesktop}`), so focus stays on this
    // card. Without this guard, Escape would close the day sheet instead of
    // reaching `EditItemSheet`'s own `window`-level listener — orphaning the
    // edit sheet with nothing left to dismiss it. Returning here, with no
    // `stopPropagation`, lets the native event bubble on to `window`.
    if (inert) return;

    if (e.key === "Escape") {
      // React attaches synthetic handlers at the root; stopping here keeps
      // the native event from also reaching `EditItemSheet`'s listener when
      // it is *not* stacked on top.
      e.stopPropagation();
      onClose();
      return;
    }
    if ((e.target as HTMLElement).closest("input,textarea,select")) return;
    if (e.key === "ArrowLeft") onPrevDay();
    else if (e.key === "ArrowRight") onNextDay();
  }

  const date = fromISO(dateISO);
  const isToday = dateISO === todayISO;
  const items = agendaForDate(dateISO, lang, events, todos);
  const eventCount = items.filter((i) => i.type === "event").length;
  const todoCount = items.length - eventCount;

  return (
    <div
      className="cozy-dialog-backdrop cozy-day-backdrop"
      // Only a click that lands on the dim area itself closes the sheet. A
      // horizontal swipe can end with the finger past the card's edge, and the
      // click that follows is then retargeted to a common ancestor — without
      // this check, a slightly overshot swipe would dismiss the sheet instead
      // of changing the day.
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="cozy-dialog-card cozy-day-sheet cozy-sheet-pop"
        role="dialog"
        aria-modal="true"
        aria-label={longDateLabel(date, lang)}
        tabIndex={-1}
        ref={cardRef}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
        style={{ background: theme.surface, border: `1px solid ${theme.borderColor}`, borderRadius: 18 }}
      >
        <header
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: 14,
            borderBottom: `1px solid ${theme.borderColor}`,
            flexShrink: 0,
          }}
        >
          <NavButton theme={theme} onClick={onPrevDay} label={t(lang, "prevDay")}>
            <ChevronLeftIcon size={15} />
          </NavButton>

          <div style={{ flex: 1, minWidth: 0, textAlign: "center" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                fontSize: 12.5,
                fontWeight: 700,
                color: theme.textMuted,
              }}
            >
              <span>{weekdayLabel(date, lang)}</span>
              {isToday && (
                <span
                  style={{
                    padding: "2px 7px",
                    borderRadius: 999,
                    background: theme.accentTint,
                    color: theme.accentDark,
                    fontSize: 10.5,
                    fontWeight: 800,
                  }}
                >
                  {t(lang, "today")}
                </span>
              )}
            </div>
            <div
              className="font-display"
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: theme.textPrimary,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {fullDateLabel(date, lang)}
            </div>
          </div>

          <NavButton theme={theme} onClick={onNextDay} label={t(lang, "nextDay")}>
            <ChevronRightIcon size={15} />
          </NavButton>

          <button
            type="button"
            onClick={onClose}
            aria-label={t(lang, "close")}
            style={{
              width: 44,
              height: 44,
              flexShrink: 0,
              borderRadius: 999,
              border: `1px solid ${theme.borderColor}`,
              background: theme.inputBg,
              color: theme.textPrimary,
              fontSize: 18,
              fontWeight: 800,
              cursor: "pointer",
            }}
          >
            ×
          </button>
        </header>

        <div className="cozy-day-sheet-body" {...handlers}>
          <div ref={paneRef} className="cozy-day-pane">
            <div
              key={dateISO}
              className={direction === "next" ? "cozy-day-in-next" : "cozy-day-in-prev"}
              style={{ padding: 14 }}
            >
              <HolidayBanner theme={theme} lang={lang} dateISO={dateISO} />
              {items.length === 0 ? (
                <p style={{ color: theme.textMuted, fontSize: 14, margin: "8px 0" }}>
                  {t(lang, "noItemsOnDay")}
                </p>
              ) : (
                <>
                  <p style={{ margin: "0 0 10px", fontSize: 12.5, fontWeight: 700, color: theme.textMuted }}>
                    {summaryLine(lang, eventCount, todoCount)}
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {items.map((item) => (
                      <AgendaRow key={item.key} theme={theme} item={item} onEdit={onEdit} onDelete={onDelete} />
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <footer
          style={{
            padding: 14,
            borderTop: `1px solid ${theme.borderColor}`,
            flexShrink: 0,
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          <button
            type="button"
            onClick={onAddEvent}
            style={{
              width: "100%",
              minHeight: 46,
              padding: "13px 16px",
              borderRadius: 14,
              border: "none",
              background: theme.accentBg,
              color: "white",
              fontSize: 15,
              fontWeight: 800,
              cursor: "pointer",
            }}
          >
            {t(lang, "addEventCta")}
          </button>
          {!isDesktop && (
            <p style={{ margin: 0, textAlign: "center", fontSize: 11.5, color: theme.textMuted }}>
              {t(lang, "swipeDayHint")}
            </p>
          )}
        </footer>
      </div>
    </div>
  );
}

function NavButton({
  theme,
  onClick,
  label,
  children,
}: {
  theme: Theme;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      style={{
        width: 44,
        height: 44,
        flexShrink: 0,
        borderRadius: 10,
        border: `1px solid ${theme.borderColor}`,
        background: theme.chipBg,
        color: theme.textPrimary,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {children}
    </button>
  );
}

/**
 * "2 นัดหมาย · 1 สิ่งที่ต้องทำ" — built inline rather than through an i18n key
 * (matching `AddEventForm`'s error text) since it's a one-off count summary,
 * not a fixed label.
 */
function summaryLine(lang: Lang, eventCount: number, todoCount: number): string {
  const parts: string[] = [];
  if (lang === "th") {
    if (eventCount > 0) parts.push(`${eventCount} นัดหมาย`);
    if (todoCount > 0) parts.push(`${todoCount} สิ่งที่ต้องทำ`);
  } else {
    if (eventCount > 0) parts.push(`${eventCount} event${eventCount === 1 ? "" : "s"}`);
    if (todoCount > 0) parts.push(`${todoCount} task${todoCount === 1 ? "" : "s"}`);
  }
  return parts.join(" · ");
}
