import type { CATEGORIES, PRIORITIES } from "@/db/schema";

export type Category = (typeof CATEGORIES)[number];
export type Priority = (typeof PRIORITIES)[number];
export type Lang = "th" | "en";
export type ThemeColor = "amber" | "sky" | "berry";
export type View = "dashboard" | "calendar" | "todo";
export type CalView = "month" | "week" | "day";
export type TodoFilter = "all" | "today" | "upcoming" | "done";

/** Wire shape returned by the API (dates are ISO strings, `done` a real bool). */
export interface Todo {
  id: number;
  title: string;
  category: Category;
  customCategoryLabel: string | null;
  priority: Priority;
  due: string;
  done: boolean;
  createdAt: number;
}

export interface CalEvent {
  id: number;
  title: string;
  category: Category;
  customCategoryLabel: string | null;
  date: string;
  time: string;
  endTime: string | null;
  createdAt: number;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

/** UI preferences persisted client-side (localStorage), not in the DB. */
export interface Prefs {
  lang: Lang;
  themeColor: ThemeColor;
  darkMode: boolean;
}
