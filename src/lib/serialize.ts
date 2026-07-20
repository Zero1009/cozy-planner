import type { Todo as TodoRow, EventRow } from "@/db/schema";
import type { Todo, CalEvent } from "@/lib/types";

/** DB row -> wire shape: `createdAt` becomes epoch-ms number. */
export function serializeTodo(row: TodoRow): Todo {
  return {
    id: row.id,
    title: row.title,
    category: row.category as Todo["category"],
    customCategoryLabel: row.customCategoryLabel,
    priority: row.priority as Todo["priority"],
    due: row.due,
    done: row.done,
    createdAt: row.createdAt.getTime(),
  };
}

export function serializeEvent(row: EventRow): CalEvent {
  return {
    id: row.id,
    title: row.title,
    category: row.category as CalEvent["category"],
    customCategoryLabel: row.customCategoryLabel,
    date: row.date,
    time: row.time,
    endTime: row.endTime,
    createdAt: row.createdAt.getTime(),
  };
}
