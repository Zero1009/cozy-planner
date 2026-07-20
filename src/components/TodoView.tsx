"use client";

import { useState } from "react";
import { CategoryChips } from "@/components/ui/CategoryChips";
import { CheckIcon } from "@/components/ui/icons";
import { useCreateTodo, useUpdateTodo } from "@/hooks/useTodos";
import { diffDays, fromISO, shortDateLabel } from "@/lib/dates";
import { labelFor, t } from "@/lib/i18n";
import { CATEGORY_COLORS, PRIORITY_COLORS } from "@/lib/theme";
import type { Theme } from "@/lib/theme";
import type { Category, Lang, Todo, TodoFilter } from "@/lib/types";

interface TodoViewProps {
  theme: Theme;
  lang: Lang;
  todos: Todo[];
  todayISO: string;
  filter: TodoFilter;
  setFilter: (f: TodoFilter) => void;
}

const PRIORITY_ORDER: Record<Todo["priority"], number> = { high: 0, med: 1, low: 2 };

const FILTERS: { key: TodoFilter; labelKey: "all" | "today" | "upcoming" | "completed" }[] = [
  { key: "all", labelKey: "all" },
  { key: "today", labelKey: "today" },
  { key: "upcoming", labelKey: "upcoming" },
  { key: "done", labelKey: "completed" },
];

function dueLabel(lang: Lang, todayISO: string, due: string, done: boolean): string {
  const d = diffDays(fromISO(todayISO), fromISO(due));
  const base =
    d === 0 ? t(lang, "dueToday") : d === 1 ? t(lang, "dueTomorrow") : shortDateLabel(fromISO(due), lang);
  if (d < 0 && !done) return `${t(lang, "overdue")} · ${base}`;
  return base;
}

function filterTodos(todos: Todo[], filter: TodoFilter, todayISO: string): Todo[] {
  switch (filter) {
    case "today":
      return todos.filter((td) => td.due === todayISO);
    case "upcoming":
      return todos.filter((td) => !td.done && td.due > todayISO);
    case "done":
      return todos.filter((td) => td.done);
    default:
      return todos;
  }
}

function sortTodos(todos: Todo[]): Todo[] {
  return todos.slice().sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1;
    if (a.due !== b.due) return a.due < b.due ? -1 : 1;
    return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
  });
}

export function TodoView({ theme, lang, todos, todayISO, filter, setFilter }: TodoViewProps) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<Category>("personal");
  const [customLabel, setCustomLabel] = useState("");

  const createTodo = useCreateTodo();
  const updateTodo = useUpdateTodo();

  function addTodo() {
    const trimmed = title.trim();
    if (!trimmed) return;
    createTodo.mutate({
      title: trimmed,
      category,
      customCategoryLabel: category === "other" ? customLabel.trim() || undefined : undefined,
      priority: "med",
      due: todayISO,
    });
    setTitle("");
    setCustomLabel("");
  }

  function toggleDone(todo: Todo) {
    updateTodo.mutate({ id: todo.id, patch: { done: !todo.done } });
  }

  const visible = sortTodos(filterTodos(todos, filter, todayISO));

  const cardStyle = {
    background: theme.surface,
    border: `1px solid ${theme.borderColor}`,
    borderRadius: 18,
    padding: 18,
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <h1 className="font-display" style={{ margin: 0, fontSize: 24, fontWeight: 600 }}>
        {t(lang, "todo")}
      </h1>

      <div style={cardStyle}>
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") addTodo();
            }}
            placeholder={t(lang, "taskPlaceholder")}
            style={{
              flex: 1,
              padding: "10px 14px",
              borderRadius: 12,
              border: `1px solid ${theme.borderColor}`,
              background: theme.inputBg,
              color: theme.textPrimary,
              fontSize: 14.5,
              outline: "none",
            }}
          />
          <button
            type="button"
            onClick={addTodo}
            style={{
              padding: "10px 18px",
              borderRadius: 12,
              border: "none",
              background: theme.accentBg,
              color: "white",
              fontWeight: 700,
              fontSize: 14.5,
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            {t(lang, "addTask")}
          </button>
        </div>

        <CategoryChips
          theme={theme}
          lang={lang}
          value={category}
          onChange={setCategory}
          customLabel={customLabel}
          onCustomLabelChange={setCustomLabel}
        />
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {FILTERS.map((f) => {
          const active = f.key === filter;
          return (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              style={{
                padding: "7px 14px",
                borderRadius: 999,
                border: active ? `1.5px solid ${theme.accentBg}` : `1px solid ${theme.borderColor}`,
                background: active ? theme.accentTint : theme.chipBg,
                color: active ? theme.textPrimary : theme.textSecondary,
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {t(lang, f.labelKey)}
            </button>
          );
        })}
      </div>

      <div style={cardStyle}>
        {visible.length === 0 ? (
          <p style={{ color: theme.textMuted, fontSize: 14, margin: "8px 0" }}>
            {t(lang, "noTasks")}
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {visible.map((todo) => {
              const colors = CATEGORY_COLORS[todo.category] ?? CATEGORY_COLORS.other;
              const label = labelFor(lang, todo.category, todo.customCategoryLabel);
              return (
                <div
                  key={todo.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "10px 12px",
                    borderRadius: 13,
                    background: theme.inputBg,
                  }}
                >
                  <button
                    type="button"
                    onClick={() => toggleDone(todo)}
                    aria-label="toggle done"
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 7,
                      border: `1.5px solid ${todo.done ? theme.accentBg : theme.borderColor}`,
                      background: todo.done ? theme.accentBg : "transparent",
                      color: "white",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      flexShrink: 0,
                    }}
                  >
                    {todo.done && <CheckIcon size={12} />}
                  </button>

                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: PRIORITY_COLORS[todo.priority],
                      flexShrink: 0,
                    }}
                  />

                  <span
                    style={{
                      flex: 1,
                      fontSize: 14.5,
                      color: theme.textPrimary,
                      textDecoration: todo.done ? "line-through" : "none",
                      opacity: todo.done ? 0.5 : 1,
                    }}
                  >
                    {todo.title}
                  </span>

                  <span style={{ fontSize: 12, color: theme.textMuted, flexShrink: 0 }}>
                    {dueLabel(lang, todayISO, todo.due, todo.done)}
                  </span>

                  <span
                    style={{
                      fontSize: 11.5,
                      fontWeight: 700,
                      padding: "3px 9px",
                      borderRadius: 999,
                      background: colors.bg,
                      color: colors.color,
                      flexShrink: 0,
                    }}
                  >
                    {label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
