import { z } from "zod";
import { CATEGORIES, PRIORITIES } from "@/db/schema";

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Expected an ISO date (YYYY-MM-DD)");
const hhmm = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Expected 24h time (HH:MM)");
/** An end time may also be "24:00" — an afternoon shift ends at midnight of its own day. */
const endHhmm = z
  .string()
  .regex(/^(([01]\d|2[0-3]):[0-5]\d|24:00)$/, "Expected 24h time (HH:MM)");

export const categorySchema = z.enum(CATEGORIES);
export const prioritySchema = z.enum(PRIORITIES);

/** Trim, then reject empty. Custom label is optional and only kept for `other`. */
const title = z.string().trim().min(1, "Title is required").max(200);
const customCategoryLabel = z.string().trim().max(60).optional();

export const createTodoSchema = z.object({
  title,
  category: categorySchema.default("other"),
  customCategoryLabel,
  priority: prioritySchema.default("med"),
  due: isoDate,
});

export const updateTodoSchema = z
  .object({
    title,
    category: categorySchema,
    customCategoryLabel: customCategoryLabel.or(z.null()),
    priority: prioritySchema,
    due: isoDate,
    done: z.boolean(),
  })
  .partial()
  .refine((v) => Object.keys(v).length > 0, "No fields to update");

export const createEventSchema = z.object({
  title,
  category: categorySchema.default("personal"),
  customCategoryLabel,
  date: isoDate,
  time: hhmm.default("09:00"),
  endTime: endHhmm.optional(),
});

export const updateEventSchema = z
  .object({
    title,
    category: categorySchema,
    customCategoryLabel: customCategoryLabel.or(z.null()),
    date: isoDate,
    time: hhmm,
    endTime: endHhmm.or(z.null()),
  })
  .partial()
  .refine((v) => Object.keys(v).length > 0, "No fields to update");

/** Bulk insert from a parsed roster; the importer previews these first. */
export const importEventsSchema = z.object({
  events: z.array(createEventSchema).min(1, "Nothing to import").max(400),
});

/** AI chat request: a short rolling transcript plus the active language. */
export const chatSchema = z.object({
  lang: z.enum(["th", "en"]).default("th"),
  clientToday: isoDate.optional(),
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1).max(4000),
      })
    )
    .min(1)
    .max(20),
});

export type CreateTodoInput = z.infer<typeof createTodoSchema>;
export type UpdateTodoInput = z.infer<typeof updateTodoSchema>;
export type CreateEventInput = z.infer<typeof createEventSchema>;
export type UpdateEventInput = z.infer<typeof updateEventSchema>;
export type ImportEventsInput = z.infer<typeof importEventsSchema>;
export type ChatInput = z.infer<typeof chatSchema>;
