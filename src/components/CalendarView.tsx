"use client";

import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { CategoryChips } from "@/components/ui/CategoryChips";
import { DeleteButton } from "@/components/ui/DeleteButton";
import { TimePicker } from "@/components/ui/TimePicker";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/ui/icons";
import { useCreateEvent, useDeleteEvent } from "@/hooks/useEvents";
import { useDeleteTodo } from "@/hooks/useTodos";
import { agendaForDate, dotsForDate, type AgendaItem } from "@/lib/agenda";
import {
  addDays,
  addMonths,
  displayYear,
  dowShort,
  fromISO,
  monthNames,
  shortDateLabel,
  toISO,
} from "@/lib/dates";
import { t } from "@/lib/i18n";
import type { Theme } from "@/lib/theme";
import type { CalEvent, CalView, Category, Lang, Todo } from "@/lib/types";

interface CalendarViewProps {
  theme: Theme;
  lang: Lang;
  isDesktop: boolean;
  todos: Todo[];
  events: CalEvent[];
  todayISO: string;
  calView: CalView;
  setCalView: (v: CalView) => void;
  selectedDate: string;
  setSelectedDate: (d: string) => void;
  calRefDate: string;
  setCalRefDate: (d: string) => void;
  onToday: () => void;
}

interface MonthCell {
  iso: string;
  dayNum: number;
  inMonth: boolean;
}

function buildMonthCells(calRefDate: string): MonthCell[] {
  const ref = fromISO(calRefDate);
  const year = ref.getFullYear();
  const month = ref.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const startWeekday = firstOfMonth.getDay();
  const gridStart = addDays(firstOfMonth, -startWeekday);
  return Array.from({ length: 42 }, (_, i) => {
    const d = addDays(gridStart, i);
    return { iso: toISO(d), dayNum: d.getDate(), inMonth: d.getMonth() === month };
  });
}

function buildWeekDates(selectedDate: string): string[] {
  const sel = fromISO(selectedDate);
  const start = addDays(sel, -sel.getDay());
  return Array.from({ length: 7 }, (_, i) => toISO(addDays(start, i)));
}

export function CalendarView({
  theme,
  lang,
  isDesktop,
  todos,
  events,
  todayISO,
  calView,
  setCalView,
  selectedDate,
  setSelectedDate,
  calRefDate,
  setCalRefDate,
  onToday,
}: CalendarViewProps) {
  const deleteEvent = useDeleteEvent();
  const deleteTodo = useDeleteTodo();
  const [addSheetOpen, setAddSheetOpen] = useState(false);

  function deleteItem(item: AgendaItem) {
    if (item.type === "event") deleteEvent.mutate(item.id);
    else deleteTodo.mutate(item.id);
  }

  function goPrev() {
    if (calView === "month") setCalRefDate(toISO(addMonths(fromISO(calRefDate), -1)));
    else if (calView === "week") setSelectedDate(toISO(addDays(fromISO(selectedDate), -7)));
    else setSelectedDate(toISO(addDays(fromISO(selectedDate), -1)));
  }

  function goNext() {
    if (calView === "month") setCalRefDate(toISO(addMonths(fromISO(calRefDate), 1)));
    else if (calView === "week") setSelectedDate(toISO(addDays(fromISO(selectedDate), 7)));
    else setSelectedDate(toISO(addDays(fromISO(selectedDate), 1)));
  }

  function selectCell(iso: string, inMonth: boolean) {
    setSelectedDate(iso);
    if (!inMonth) {
      const d = fromISO(iso);
      setCalRefDate(toISO(new Date(d.getFullYear(), d.getMonth(), 1)));
    }
  }

  let periodLabel: string;
  if (calView === "month") {
    const ref = fromISO(calRefDate);
    periodLabel = `${monthNames(lang)[ref.getMonth()]} ${displayYear(ref.getFullYear(), lang)}`;
  } else if (calView === "week") {
    const weekDates = buildWeekDates(selectedDate);
    periodLabel = `${shortDateLabel(fromISO(weekDates[0]), lang)} – ${shortDateLabel(
      fromISO(weekDates[6]),
      lang
    )}`;
  } else {
    periodLabel = shortDateLabel(fromISO(selectedDate), lang);
  }

  const cardStyle = {
    background: theme.surface,
    border: `1px solid ${theme.borderColor}`,
    borderRadius: 18,
    padding: isDesktop ? 18 : 12,
  };

  const showSidePanel = calView === "month" || calView === "week";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: isDesktop ? 10 : 6, minWidth: 0, width: isDesktop ? undefined : "100%" }}>
          <IconButton theme={theme} onClick={goPrev} label="prev">
            <ChevronLeftIcon size={13} />
          </IconButton>
          <h1
            className="font-display"
            style={{
              margin: 0,
              fontSize: isDesktop ? 19 : 17,
              fontWeight: 600,
              minWidth: 0,
              flex: 1,
              textAlign: "center",
              whiteSpace: "nowrap",
            }}
          >
            {periodLabel}
          </h1>
          <IconButton theme={theme} onClick={goNext} label="next">
            <ChevronRightIcon size={13} />
          </IconButton>
          <button
            type="button"
            onClick={onToday}
            style={{
              padding: isDesktop ? "7px 14px" : "7px 10px",
              borderRadius: 11,
              border: `1px solid ${theme.borderColor}`,
              background: theme.chipBg,
              color: theme.textPrimary,
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            {t(lang, "today")}
          </button>
        </div>

        <div
          style={{
            display: "flex",
            borderRadius: 12,
            border: `1px solid ${theme.borderColor}`,
            overflow: "hidden",
          }}
        >
          {(["month", "week", "day"] as CalView[]).map((v) => {
            const active = v === calView;
            return (
              <button
                key={v}
                type="button"
                onClick={() => setCalView(v)}
                style={{
                  padding: "8px 14px",
                  border: "none",
                  background: active ? theme.accentBg : "transparent",
                  color: active ? "white" : theme.textSecondary,
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {t(lang, v)}
              </button>
            );
          })}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: isDesktop ? "row" : "column",
          gap: 18,
          alignItems: "flex-start",
        }}
      >
        <div style={{ flex: 1, minWidth: 0, width: "100%" }}>
          {calView === "month" && (
            <MonthGrid
              theme={theme}
              lang={lang}
              calRefDate={calRefDate}
              selectedDate={selectedDate}
              todayISO={todayISO}
              events={events}
              todos={todos}
              onSelect={selectCell}
              cardStyle={cardStyle}
              isDesktop={isDesktop}
            />
          )}
          {calView === "week" && (
            <WeekGrid
              theme={theme}
              lang={lang}
              selectedDate={selectedDate}
              todayISO={todayISO}
              events={events}
              todos={todos}
              onSelect={(iso) => setSelectedDate(iso)}
              cardStyle={cardStyle}
            />
          )}
          {calView === "day" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <DayAgenda
                theme={theme}
                lang={lang}
                selectedDate={selectedDate}
                events={events}
                todos={todos}
                cardStyle={cardStyle}
                onDelete={deleteItem}
              />
              {isDesktop && (
                <AddEventForm
                  theme={theme}
                  lang={lang}
                  selectedDate={selectedDate}
                  cardStyle={cardStyle}
                  variant="panel"
                />
              )}
            </div>
          )}
        </div>

        {showSidePanel && (
          <div style={{ width: isDesktop ? 280 : "100%", flexShrink: 0, display: "flex", flexDirection: "column", gap: 14 }}>
            <SidePanelAgenda
              theme={theme}
              lang={lang}
              selectedDate={selectedDate}
              events={events}
              todos={todos}
              cardStyle={cardStyle}
              onDelete={deleteItem}
            />
            {isDesktop && (
              <AddEventForm
                theme={theme}
                lang={lang}
                selectedDate={selectedDate}
                cardStyle={cardStyle}
                variant="panel"
              />
            )}
          </div>
        )}
      </div>

      {!isDesktop && (
        <button
          type="button"
          onClick={() => setAddSheetOpen(true)}
          style={{
            position: "sticky",
            bottom: "calc(78px + env(safe-area-inset-bottom))",
            zIndex: 11,
            width: "100%",
            padding: "13px 16px",
            borderRadius: 16,
            border: "none",
            background: theme.accentBg,
            color: "white",
            boxShadow: "0 10px 24px oklch(20% 0.02 90 / 0.22)",
            fontSize: 15,
            fontWeight: 800,
            cursor: "pointer",
          }}
        >
          {t(lang, "addEventCta")}
        </button>
      )}

      {!isDesktop && addSheetOpen && (
        <AddEventForm
          theme={theme}
          lang={lang}
          selectedDate={selectedDate}
          cardStyle={cardStyle}
          variant="sheet"
          onClose={() => setAddSheetOpen(false)}
          onDone={() => setAddSheetOpen(false)}
        />
      )}
    </div>
  );
}

function IconButton({
  theme,
  onClick,
  label,
  children,
}: {
  theme: Theme;
  onClick: () => void;
  label: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      style={{
        width: 32,
        height: 32,
        borderRadius: 10,
        border: `1px solid ${theme.borderColor}`,
        background: theme.chipBg,
        color: theme.textPrimary,
        fontSize: 18,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        lineHeight: 1,
      }}
    >
      {children}
    </button>
  );
}

interface CardStyleProp {
  cardStyle: CSSProperties;
}

function MonthGrid({
  theme,
  lang,
  calRefDate,
  selectedDate,
  todayISO,
  events,
  todos,
  onSelect,
  cardStyle,
  isDesktop,
}: {
  theme: Theme;
  lang: Lang;
  calRefDate: string;
  selectedDate: string;
  todayISO: string;
  events: CalEvent[];
  todos: Todo[];
  onSelect: (iso: string, inMonth: boolean) => void;
  isDesktop: boolean;
} & CardStyleProp) {
  const cells = buildMonthCells(calRefDate);
  const dow = dowShort(lang);

  return (
    <div style={cardStyle}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
          gap: isDesktop ? 4 : 2,
          marginBottom: isDesktop ? 6 : 4,
        }}
      >
        {dow.map((d) => (
          <div
            key={d}
            style={{
              textAlign: "center",
              fontSize: isDesktop ? 12 : 11,
              fontWeight: 700,
              color: theme.textMuted,
              padding: "4px 0",
            }}
          >
            {d}
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))", gap: isDesktop ? 4 : 2 }}>
        {cells.map((cell) => {
          const isToday = cell.iso === todayISO;
          const isSelected = cell.iso === selectedDate;
          const dots = dotsForDate(cell.iso, events, todos);
          return (
            <button
              key={cell.iso}
              type="button"
              onClick={() => onSelect(cell.iso, cell.inMonth)}
              style={{
                aspectRatio: "1",
                minWidth: 0,
                minHeight: isDesktop ? 40 : 34,
                borderRadius: isDesktop ? 11 : 9,
                border: isSelected
                  ? "none"
                  : isToday
                  ? `1.5px solid ${theme.accentBg}`
                  : "1px solid transparent",
                background: isSelected ? theme.accentBg : "transparent",
                color: isSelected ? "white" : cell.inMonth ? theme.textPrimary : theme.textMuted,
                opacity: cell.inMonth ? 1 : 0.45,
                fontSize: isDesktop ? 13 : 12,
                fontWeight: isToday || isSelected ? 700 : 500,
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: isDesktop ? 3 : 2,
                padding: 0,
              }}
            >
              <span>{cell.dayNum}</span>
              <span style={{ display: "flex", gap: 2 }}>
                {dots.map((c, i) => (
                  <span
                    key={i}
                    style={{
                      width: 4,
                      height: 4,
                      borderRadius: "50%",
                      background: isSelected ? "white" : c,
                      display: "inline-block",
                    }}
                  />
                ))}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function WeekGrid({
  theme,
  lang,
  selectedDate,
  todayISO,
  events,
  todos,
  onSelect,
  cardStyle,
}: {
  theme: Theme;
  lang: Lang;
  selectedDate: string;
  todayISO: string;
  events: CalEvent[];
  todos: Todo[];
  onSelect: (iso: string) => void;
} & CardStyleProp) {
  const weekDates = buildWeekDates(selectedDate);
  const dow = dowShort(lang);

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
        gap: 10,
      }}
    >
      {weekDates.map((iso, i) => {
        const isToday = iso === todayISO;
        const isSelected = iso === selectedDate;
        const items = agendaForDate(iso, lang, events, todos).slice(0, 3);
        const d = fromISO(iso);
        return (
          <button
            key={iso}
            type="button"
            onClick={() => onSelect(iso)}
            style={{
              ...cardStyle,
              textAlign: "left",
              cursor: "pointer",
              padding: 12,
              display: "flex",
              flexDirection: "column",
              gap: 8,
              border: isSelected
                ? `1.5px solid ${theme.accentBg}`
                : isToday
                ? `1.5px solid ${theme.accentBg}`
                : `1px solid ${theme.borderColor}`,
              background: isSelected ? theme.accentTint : theme.surface,
            }}
          >
            <div>
              <div style={{ fontSize: 11.5, color: theme.textMuted, fontWeight: 700 }}>{dow[i]}</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: theme.textPrimary }}>{d.getDate()}</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {items.map((item) => (
                <span
                  key={item.key}
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    padding: "3px 7px",
                    borderRadius: 8,
                    background: item.tagBg,
                    color: item.tagColor,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {item.title}
                </span>
              ))}
            </div>
          </button>
        );
      })}
    </div>
  );
}

function DayAgenda({
  theme,
  lang,
  selectedDate,
  events,
  todos,
  cardStyle,
  onDelete,
}: {
  theme: Theme;
  lang: Lang;
  selectedDate: string;
  events: CalEvent[];
  todos: Todo[];
  onDelete: (item: AgendaItem) => void;
} & CardStyleProp) {
  const items = agendaForDate(selectedDate, lang, events, todos);
  return (
    <div style={cardStyle}>
      <h2 className="font-display" style={{ margin: "0 0 12px", fontSize: 16, fontWeight: 600 }}>
        {shortDateLabel(fromISO(selectedDate), lang)}
      </h2>
      {items.length === 0 ? (
        <p style={{ color: theme.textMuted, fontSize: 14, margin: "8px 0" }}>
          {t(lang, "noItemsToday")}
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {items.map((item) => (
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
                style={{ width: 8, height: 8, borderRadius: "50%", background: item.dotColor, flexShrink: 0 }}
              />
              <span style={{ fontSize: 12.5, color: theme.textMuted, width: 90, flexShrink: 0 }}>
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
              <DeleteButton theme={theme} ariaLabel="delete item" onClick={() => onDelete(item)} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SidePanelAgenda({
  theme,
  lang,
  selectedDate,
  events,
  todos,
  cardStyle,
  onDelete,
}: {
  theme: Theme;
  lang: Lang;
  selectedDate: string;
  events: CalEvent[];
  todos: Todo[];
  onDelete: (item: AgendaItem) => void;
} & CardStyleProp) {
  const items = agendaForDate(selectedDate, lang, events, todos);
  return (
    <div style={cardStyle}>
      <h2 className="font-display" style={{ margin: "0 0 10px", fontSize: 15, fontWeight: 600 }}>
        {shortDateLabel(fromISO(selectedDate), lang)}
      </h2>
      {items.length === 0 ? (
        <p style={{ color: theme.textMuted, fontSize: 13.5, margin: "6px 0" }}>
          {t(lang, "noItemsToday")}
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {items.map((item) => (
            <div
              key={item.key}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "7px 10px",
                borderRadius: 11,
                background: theme.inputBg,
              }}
            >
              <span
                style={{ width: 7, height: 7, borderRadius: "50%", background: item.dotColor, flexShrink: 0 }}
              />
              <span style={{ fontSize: 11.5, color: theme.textMuted, width: 60, flexShrink: 0 }}>
                {item.time}
              </span>
              <span
                style={{
                  flex: 1,
                  fontSize: 13,
                  color: theme.textPrimary,
                  textDecoration: item.done ? "line-through" : "none",
                  opacity: item.done ? 0.5 : 1,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {item.title}
              </span>
              <DeleteButton theme={theme} ariaLabel="delete item" size={13} onClick={() => onDelete(item)} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AddEventForm({
  theme,
  lang,
  selectedDate,
  cardStyle,
  variant,
  onClose,
  onDone,
}: {
  theme: Theme;
  lang: Lang;
  selectedDate: string;
  variant: "panel" | "sheet";
  onClose?: () => void;
  onDone?: () => void;
} & CardStyleProp) {
  const [category, setCategory] = useState<Category>("personal");
  const [customLabel, setCustomLabel] = useState("");
  const [title, setTitle] = useState("");
  const [time, setTime] = useState("09:00");
  const [justAdded, setJustAdded] = useState(false);

  const createEvent = useCreateEvent();
  const trimmedTitle = title.trim();
  const canSubmit = trimmedTitle.length > 0 && !createEvent.isPending;

  useEffect(() => {
    if (!justAdded) return;
    const timer = window.setTimeout(() => setJustAdded(false), 2000);
    return () => window.clearTimeout(timer);
  }, [justAdded]);

  useEffect(() => {
    if (variant !== "sheet" || !onClose) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose?.();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, variant]);

  function submit() {
    if (!canSubmit) return;
    createEvent.mutate(
      {
        title: trimmedTitle,
        category,
        customCategoryLabel: category === "other" ? customLabel.trim() || undefined : undefined,
        date: selectedDate,
        time,
      },
      {
        onSuccess: () => {
          setTitle("");
          setCustomLabel("");
          setJustAdded(true);
          onDone?.();
        },
      }
    );
  }

  const feedback = createEvent.isError ? (
    <p style={{ margin: 0, color: "oklch(56% 0.16 28)", fontSize: 12.5, fontWeight: 700 }}>
      {createEvent.error instanceof Error
        ? createEvent.error.message
        : lang === "th"
          ? "เพิ่มนัดหมายไม่สำเร็จ กรุณาลองใหม่อีกครั้ง"
          : "Could not add the event. Please try again."}
    </p>
  ) : justAdded ? (
    <p style={{ margin: 0, color: theme.accentDark, fontSize: 12.5, fontWeight: 800 }}>
      {t(lang, "eventAdded")}
    </p>
  ) : null;

  const form = (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div>
        <h2 className="font-display" style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>
          {t(lang, "addEvent")}
        </h2>
        <p style={{ margin: "4px 0 0", color: theme.textMuted, fontSize: 13, fontWeight: 700 }}>
          {shortDateLabel(fromISO(selectedDate), lang)}
        </p>
      </div>
      <CategoryChips
        theme={theme}
        lang={lang}
        value={category}
        onChange={setCategory}
        customLabel={customLabel}
        onCustomLabelChange={setCustomLabel}
      />
      <input
        value={title}
        onChange={(e) => {
          setTitle(e.target.value);
          setJustAdded(false);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") submit();
        }}
        placeholder={t(lang, "eventTitlePlaceholder")}
        autoFocus={variant === "sheet"}
        style={{
          padding: "10px 12px",
          borderRadius: 12,
          border: `1px solid ${theme.borderColor}`,
          background: theme.inputBg,
          color: theme.textPrimary,
          fontSize: 14,
          outline: "none",
        }}
      />
      <div style={{ display: "flex", gap: 8, alignItems: "stretch" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <TimePicker theme={theme} value={time} onChange={setTime} />
        </div>
        <button
          type="button"
          onClick={submit}
          disabled={!canSubmit}
          style={{
            minWidth: 96,
            padding: "0 14px",
            borderRadius: 12,
            border: "none",
            background: theme.accentBg,
            color: "white",
            fontSize: 13.5,
            fontWeight: 800,
            cursor: canSubmit ? "pointer" : "default",
            opacity: canSubmit ? 1 : 0.58,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
        >
          {createEvent.isPending && <span className="cozy-inline-spinner" aria-hidden />}
          {createEvent.isPending ? t(lang, "saving") : t(lang, "addTask")}
        </button>
      </div>
      {feedback}
    </div>
  );

  if (variant === "sheet") {
    return (
      <div className="cozy-dialog-backdrop" onClick={onClose}>
        <div
          className="cozy-dialog-card"
          role="dialog"
          aria-modal="true"
          aria-label={t(lang, "addEvent")}
          onClick={(event) => event.stopPropagation()}
          style={{ ...cardStyle, maxWidth: 460, width: "min(460px, calc(100vw - 20px))" }}
        >
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 6 }}>
            <button
              type="button"
              onClick={onClose}
              aria-label={t(lang, "close")}
              style={{
                width: 32,
                height: 32,
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
          </div>
          {form}
        </div>
      </div>
    );
  }

  return (
    <div style={cardStyle}>
      {form}
    </div>
  );
}
