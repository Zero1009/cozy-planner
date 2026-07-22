import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

/**
 * Categories and priorities are stored as plain text (not FK/enum tables) on
 * purpose: the set is small, stable, and shared with the UI theme map. Zod
 * validators at the API boundary guarantee only known values are written,
 * except for `customCategoryLabel` which lets a user name an "other" bucket.
 */
export const CATEGORIES = [
  "personal",
  "work",
  "shift",
  "health",
  "study",
  "other",
] as const;
export const PRIORITIES = ["high", "med", "low"] as const;

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  username: text("username").notNull().unique(),
  displayName: text("display_name").notNull(),
  passwordHash: text("password_hash").notNull(),
  isAdmin: integer("is_admin", { mode: "boolean" }).notNull().default(false),
  mustUpdateProfile: integer("must_update_profile", { mode: "boolean" })
    .notNull()
    .default(true),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
});

export const todos = sqliteTable("todos", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  // Owner. `default(1)` only backfills any pre-existing shared rows to the
  // first user during migration; the app always sets this explicitly on insert.
  userId: integer("user_id")
    .notNull()
    .default(1)
    .references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  category: text("category").notNull().default("other"),
  customCategoryLabel: text("custom_category_label"),
  priority: text("priority").notNull().default("med"),
  /** Due date as ISO calendar day, e.g. "2026-07-20" (no time component). */
  due: text("due").notNull(),
  done: integer("done", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
});

export const events = sqliteTable("events", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id")
    .notNull()
    .default(1)
    .references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  category: text("category").notNull().default("personal"),
  customCategoryLabel: text("custom_category_label"),
  /** ISO calendar day, e.g. "2026-07-20". */
  date: text("date").notNull(),
  /** 24h "HH:MM". */
  time: text("time").notNull().default("09:00"),
  /** Optional 24h "HH:MM" end (used by shift-style events). */
  endTime: text("end_time"),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
});

export type Todo = typeof todos.$inferSelect;
export type NewTodo = typeof todos.$inferInsert;
export type EventRow = typeof events.$inferSelect;
export type NewEvent = typeof events.$inferInsert;
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
