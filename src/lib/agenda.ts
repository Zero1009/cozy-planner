import { CATEGORY_COLORS, PRIORITY_COLORS } from "@/lib/theme";
import { fromISO, shortDateLabel } from "@/lib/dates";
import { labelFor } from "@/lib/i18n";
import type { CalEvent, Lang, Todo } from "@/lib/types";

const PRIORITY_ORDER: Record<Todo["priority"], number> = {
  high: 0,
  med: 1,
  low: 2,
};

export interface AgendaItem {
  key: string;
  type: "event" | "todo";
  id: number;
  time: string;
  title: string;
  categoryLabel: string;
  tagBg: string;
  tagColor: string;
  dotColor: string;
  done: boolean;
}

function catColors(category: CalEvent["category"]) {
  return CATEGORY_COLORS[category] ?? CATEGORY_COLORS.other;
}

/**
 * Agenda rows for a single ISO date: events (by start time) followed by
 * todos due that date (by priority). Ported from the mockup's agenda logic.
 */
export function agendaForDate(
  dateISO: string,
  lang: Lang,
  events: CalEvent[],
  todos: Todo[]
): AgendaItem[] {
  const dayEvents = events
    .filter((e) => e.date === dateISO)
    .slice()
    .sort((a, b) => a.time.localeCompare(b.time))
    .map((e) => {
      const colors = catColors(e.category);
      return {
        key: `e-${e.id}`,
        type: "event" as const,
        id: e.id,
        time: e.endTime ? `${e.time}–${e.endTime}` : e.time,
        title: e.title,
        categoryLabel: labelFor(lang, e.category, e.customCategoryLabel),
        tagBg: colors.bg,
        tagColor: colors.color,
        dotColor: colors.dot,
        done: false,
      };
    });

  const dayTodos = todos
    .filter((t) => t.due === dateISO)
    .slice()
    .sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority])
    .map((t) => {
      const colors = catColors(t.category);
      return {
        key: `t-${t.id}`,
        type: "todo" as const,
        id: t.id,
        time: "--:--",
        title: t.title,
        categoryLabel: labelFor(lang, t.category, t.customCategoryLabel),
        tagBg: colors.bg,
        tagColor: colors.color,
        dotColor: PRIORITY_COLORS[t.priority],
        done: t.done,
      };
    });

  return [...dayEvents, ...dayTodos];
}

/** Up to 3 dot colors for a day cell: event dots first, then todo priority dots. */
export function dotsForDate(
  dateISO: string,
  events: CalEvent[],
  todos: Todo[]
): string[] {
  const eventDots = events
    .filter((e) => e.date === dateISO)
    .map((e) => catColors(e.category).dot);
  const todoDots = todos
    .filter((t) => t.due === dateISO)
    .map((t) => PRIORITY_COLORS[t.priority]);
  return [...eventDots, ...todoDots].slice(0, 3);
}

export interface DashboardStats {
  tasksToday: number;
  doneToday: number;
  completionPct: number;
  upcomingEventsCount: number;
}

export function dashboardStats(
  todayISO: string,
  todos: Todo[],
  events: CalEvent[]
): DashboardStats {
  const todaysTodos = todos.filter((t) => t.due === todayISO);
  const tasksToday = todaysTodos.length;
  const doneToday = todaysTodos.filter((t) => t.done).length;
  const completionPct = tasksToday
    ? Math.round((doneToday / tasksToday) * 100)
    : 0;
  const upcomingEventsCount = events.filter((e) => e.date >= todayISO).length;
  return { tasksToday, doneToday, completionPct, upcomingEventsCount };
}

export interface UpcomingRow {
  key: string;
  dateLabel: string;
  date: string;
  title: string;
  categoryLabel: string;
  tagBg: string;
  tagColor: string;
}

/** Merged upcoming events + not-done todos, strictly after today, date asc. */
export function upcomingItems(
  todayISO: string,
  lang: Lang,
  events: CalEvent[],
  todos: Todo[],
  limit = 6
): UpcomingRow[] {
  const rows: (UpcomingRow & { sortKey: string })[] = [
    ...events
      .filter((e) => e.date > todayISO)
      .map((e) => {
        const colors = catColors(e.category);
        return {
          key: `e-${e.id}`,
          date: e.date,
          sortKey: `${e.date}T${e.time}`,
          dateLabel: shortDateLabel(fromISO(e.date), lang),
          title: e.title,
          categoryLabel: labelFor(lang, e.category, e.customCategoryLabel),
          tagBg: colors.bg,
          tagColor: colors.color,
        };
      }),
    ...todos
      .filter((t) => !t.done && t.due > todayISO)
      .map((t) => {
        const colors = catColors(t.category);
        return {
          key: `t-${t.id}`,
          date: t.due,
          sortKey: `${t.due}T99:99`,
          dateLabel: shortDateLabel(fromISO(t.due), lang),
          title: t.title,
          categoryLabel: labelFor(lang, t.category, t.customCategoryLabel),
          tagBg: colors.bg,
          tagColor: colors.color,
        };
      }),
  ];

  return rows
    .sort((a, b) => a.sortKey.localeCompare(b.sortKey))
    .slice(0, limit)
    .map(({ sortKey: _sortKey, ...rest }) => rest);
}
