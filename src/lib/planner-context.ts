import type { EventRow, Todo } from "@/db/schema";
import { catLabel, labelFor } from "@/lib/i18n";
import type { Lang } from "@/lib/types";

const TH_MONTHS = [
  "มกราคม",
  "กุมภาพันธ์",
  "มีนาคม",
  "เมษายน",
  "พฤษภาคม",
  "มิถุนายน",
  "กรกฎาคม",
  "สิงหาคม",
  "กันยายน",
  "ตุลาคม",
  "พฤศจิกายน",
  "ธันวาคม",
];
const EN_MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const TH_WEEKDAYS = ["วันอาทิตย์", "วันจันทร์", "วันอังคาร", "วันพุธ", "วันพฤหัสบดี", "วันศุกร์", "วันเสาร์"];
const EN_WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export interface PlannerPromptContextInput {
  lang: Lang;
  todayISO: string;
  todos: Todo[];
  events: EventRow[];
}

interface PlannerEventFact {
  id: number;
  type: "event";
  title: string;
  category: string;
  categoryLabel: string;
  date: string;
  weekday: string;
  displayDate: string;
  time: string;
  endTime: string | null;
}

interface PlannerTodoFact {
  id: number;
  type: "todo";
  title: string;
  category: string;
  categoryLabel: string;
  due: string;
  weekday: string;
  displayDate: string;
  priority: string;
  done: boolean;
}

function parseISODateParts(iso: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) throw new Error(`Invalid ISO calendar date: ${iso}`);
  const [, year, month, day] = match;
  return { year: Number(year), month: Number(month), day: Number(day) };
}

function weekdayIndex(iso: string) {
  const { year, month, day } = parseISODateParts(iso);
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

export function formatAgentWeekday(iso: string, lang: Lang): string {
  const index = weekdayIndex(iso);
  return lang === "th" ? TH_WEEKDAYS[index] : EN_WEEKDAYS[index];
}

export function formatAgentDateLabel(iso: string, lang: Lang): string {
  const { year, month, day } = parseISODateParts(iso);
  const weekday = formatAgentWeekday(iso, lang);
  return lang === "th"
    ? `${weekday}ที่ ${day} ${TH_MONTHS[month - 1]} ${year}`
    : `${weekday}, ${EN_MONTHS[month - 1]} ${day}, ${year}`;
}

export function buildPlannerFacts({ lang, todos, events }: PlannerPromptContextInput) {
  const eventFacts: PlannerEventFact[] = events.map((event) => ({
    id: event.id,
    type: "event",
    title: event.title,
    category: event.category,
    categoryLabel: labelFor(
      lang,
      event.category as Parameters<typeof labelFor>[1],
      event.customCategoryLabel
    ),
    date: event.date,
    weekday: formatAgentWeekday(event.date, lang),
    displayDate: formatAgentDateLabel(event.date, lang),
    time: event.time,
    endTime: event.endTime,
  }));

  const todoFacts: PlannerTodoFact[] = todos.map((todo) => ({
    id: todo.id,
    type: "todo",
    title: todo.title,
    category: todo.category,
    categoryLabel: labelFor(
      lang,
      todo.category as Parameters<typeof labelFor>[1],
      todo.customCategoryLabel
    ),
    due: todo.due,
    weekday: formatAgentWeekday(todo.due, lang),
    displayDate: formatAgentDateLabel(todo.due, lang),
    priority: todo.priority,
    done: todo.done,
  }));

  return { events: eventFacts, todos: todoFacts };
}

export function buildPlannerPromptContext(input: PlannerPromptContextInput): string {
  const facts = buildPlannerFacts(input);
  const pending = facts.todos.filter((todo) => !todo.done);
  const pendingByCategory = new Map<string, number>();
  for (const todo of pending) {
    const label = catLabel(input.lang, todo.category as Parameters<typeof catLabel>[1]);
    pendingByCategory.set(label, (pendingByCategory.get(label) ?? 0) + 1);
  }

  const categoryCounts = [...pendingByCategory.entries()]
    .map(([label, count]) => `${label}: ${count}`)
    .join(", ");
  const todayAgenda = [
    ...facts.events
      .filter((event) => event.date === input.todayISO)
      .map((event) => `${event.displayDate} ${event.time}${event.endTime ? `-${event.endTime}` : ""} ${event.title} (${event.categoryLabel})`),
    ...facts.todos
      .filter((todo) => todo.due === input.todayISO)
      .map((todo) => `${todo.done ? "[done] " : ""}${todo.displayDate} ${todo.title} (${todo.categoryLabel})`),
  ]
    .slice(0, 10)
    .join("; ");
  const upcoming = [
    ...facts.events
      .filter((event) => event.date > input.todayISO)
      .map((event) => `${event.displayDate} ${event.time} ${event.title}`),
    ...facts.todos
      .filter((todo) => !todo.done && todo.due > input.todayISO)
      .map((todo) => `${todo.displayDate} ${todo.title}`),
  ]
    .sort()
    .slice(0, 10)
    .join("; ");

  return [
    `Never calculate weekdays yourself. Use \`displayDate\` exactly and copy \`weekday\` from the structured planner facts below.`,
    `If the user asks whether a date/day is correct, verify against \`displayDate\` before answering.`,
    `Pending todo counts by category: ${categoryCounts || "none"}.`,
    `Today's agenda: ${todayAgenda || "nothing scheduled"}.`,
    `Next upcoming items: ${upcoming || "none"}.`,
    `Structured planner facts JSON: ${JSON.stringify(facts)}.`,
  ].join("\n");
}
