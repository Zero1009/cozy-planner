"use client";

import { useEffect, useState } from "react";
import { CategoryChips } from "@/components/ui/CategoryChips";
import { DatePicker } from "@/components/ui/DatePicker";
import { TimePicker } from "@/components/ui/TimePicker";
import { useUpdateEvent } from "@/hooks/useEvents";
import { useUpdateTodo } from "@/hooks/useTodos";
import { t } from "@/lib/i18n";
import type { Theme } from "@/lib/theme";
import type { CalEvent, Category, Lang, Todo } from "@/lib/types";

/** What the sheet is editing. Events carry a time; todos carry a due date. */
export type EditTarget =
  | { type: "event"; event: CalEvent }
  | { type: "todo"; todo: Todo };

interface EditItemSheetProps {
  theme: Theme;
  lang: Lang;
  isDesktop: boolean;
  target: EditTarget;
  onClose: () => void;
}

export function EditItemSheet({ theme, lang, isDesktop, target, onClose }: EditItemSheetProps) {
  const isEvent = target.type === "event";
  const record = isEvent ? target.event : target.todo;

  const [title, setTitle] = useState(record.title);
  const [category, setCategory] = useState<Category>(record.category);
  const [customLabel, setCustomLabel] = useState(record.customCategoryLabel ?? "");
  const [date, setDate] = useState(isEvent ? target.event.date : target.todo.due);
  const [time, setTime] = useState(isEvent ? target.event.time : "09:00");

  const updateEvent = useUpdateEvent();
  const updateTodo = useUpdateTodo();
  const pending = updateEvent.isPending || updateTodo.isPending;
  const failed = updateEvent.isError || updateTodo.isError;

  const trimmedTitle = title.trim();
  const canSave = trimmedTitle.length > 0 && date.length > 0 && !pending;

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  function save() {
    if (!canSave) return;
    // `null` clears the stored label; the schema accepts it only for that.
    const customCategoryLabel = category === "other" ? customLabel.trim() || null : null;

    if (target.type === "event") {
      updateEvent.mutate(
        { id: target.event.id, patch: { title: trimmedTitle, category, customCategoryLabel, date, time } },
        { onSuccess: onClose }
      );
    } else {
      updateTodo.mutate(
        { id: target.todo.id, patch: { title: trimmedTitle, category, customCategoryLabel, due: date } },
        { onSuccess: onClose }
      );
    }
  }

  return (
    <div className="cozy-dialog-backdrop" onClick={onClose}>
      <div
        className="cozy-dialog-card"
        role="dialog"
        aria-modal="true"
        aria-label={t(lang, isEvent ? "editEvent" : "editTodo")}
        onClick={(event) => event.stopPropagation()}
        style={{
          background: theme.surface,
          border: `1px solid ${theme.borderColor}`,
          borderRadius: 18,
          padding: isDesktop ? 18 : 12,
          maxWidth: 460,
          width: "min(460px, calc(100vw - 20px))",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <h2 className="font-display" style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>
            {t(lang, isEvent ? "editEvent" : "editTodo")}
          </h2>
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
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Field theme={theme} label={t(lang, "categoryLabel")}>
            <CategoryChips
              theme={theme}
              lang={lang}
              isDesktop={isDesktop}
              value={category}
              onChange={setCategory}
              customLabel={customLabel}
              onCustomLabelChange={setCustomLabel}
            />
          </Field>

          <Field theme={theme} label={t(lang, "titleLabel")}>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") save();
              }}
              autoFocus={isDesktop}
              style={fieldStyle(theme, isDesktop)}
            />
          </Field>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <div style={{ flex: "1 1 150px", minWidth: 0 }}>
              <Field theme={theme} label={t(lang, isEvent ? "dateLabel" : "dueLabel")}>
                <DatePicker theme={theme} value={date} onChange={setDate} />
              </Field>
            </div>
            {isEvent && (
              <div style={{ flex: "1 1 130px", minWidth: 0 }}>
                <Field theme={theme} label={t(lang, "timeLabel")}>
                  <TimePicker theme={theme} value={time} onChange={setTime} />
                </Field>
              </div>
            )}
          </div>

          {failed && (
            <p role="alert" style={{ margin: 0, color: "oklch(56% 0.16 28)", fontSize: 12.5, fontWeight: 700 }}>
              {t(lang, "saveFailed")}
            </p>
          )}

          <button
            type="button"
            onClick={save}
            disabled={!canSave}
            style={{
              minHeight: 46,
              borderRadius: 12,
              border: "none",
              background: theme.accentBg,
              color: "white",
              fontSize: 14,
              fontWeight: 800,
              cursor: canSave ? "pointer" : "default",
              opacity: canSave ? 1 : 0.58,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            {pending && <span className="cozy-inline-spinner" aria-hidden />}
            {pending ? t(lang, "saving") : t(lang, "saveChanges")}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({
  theme,
  label,
  children,
}: {
  theme: Theme;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <span style={{ fontSize: 12, fontWeight: 800, color: theme.textMuted }}>{label}</span>
      {children}
    </label>
  );
}

function fieldStyle(theme: Theme, isDesktop: boolean): React.CSSProperties {
  return {
    width: "100%",
    minHeight: isDesktop ? 40 : 46,
    padding: "10px 12px",
    borderRadius: 12,
    border: `1px solid ${theme.borderColor}`,
    background: theme.inputBg,
    color: theme.textPrimary,
    fontSize: 14,
    outline: "none",
  };
}
