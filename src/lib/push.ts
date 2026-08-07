import { z } from "zod";

export const DEFAULT_APP_TIMEZONE = process.env.APP_TIMEZONE || "Asia/Bangkok";
export const DEFAULT_EVENT_REMINDER_LEAD_MINUTES = 10;

const pushSubscriptionSchema = z.object({
  endpoint: z.string().url().max(2048),
  keys: z.object({
    p256dh: z.string().min(1).max(4096),
    auth: z.string().min(1).max(1024),
  }),
});

export interface StoredPushSubscriptionInput {
  endpoint: string;
  p256dh: string;
  auth: string;
}

export interface PushPayloadInput {
  title?: string | null;
  body?: string | null;
  url?: string | null;
}

export interface PushPayload {
  title: string;
  body: string;
  url: string;
}

export interface ReminderEventInput {
  id: number;
  userId?: number | null;
  title: string;
  date: string;
  time: string;
}

export interface DueEventReminder {
  key: string;
  eventId: number;
  userId: number | null;
  fireAtMs: number;
  title: string;
}

export function parsePushSubscription(input: unknown): StoredPushSubscriptionInput | null {
  const parsed = pushSubscriptionSchema.safeParse(input);
  if (!parsed.success) return null;
  return {
    endpoint: parsed.data.endpoint,
    p256dh: parsed.data.keys.p256dh,
    auth: parsed.data.keys.auth,
  };
}

export function isSafeNotificationUrl(url: string | null | undefined): url is string {
  if (!url || !url.startsWith("/") || url.startsWith("//")) return false;
  try {
    const parsed = new URL(url, "https://cozy-planner.local");
    return parsed.origin === "https://cozy-planner.local";
  } catch {
    return false;
  }
}

function cleanText(value: string | null | undefined, fallback: string, maxLength: number) {
  const trimmed = value?.replace(/\s+/g, " ").trim() ?? "";
  if (!trimmed) return fallback;
  return trimmed.length > maxLength ? `${trimmed.slice(0, maxLength - 1)}…` : trimmed;
}

export function buildPushPayload(input: PushPayloadInput): PushPayload {
  return {
    title: cleanText(input.title, "Cozy Planner", 80),
    body: cleanText(input.body, "มีการแจ้งเตือนใหม่ครับ", 160),
    url: isSafeNotificationUrl(input.url) ? input.url : "/dashboard",
  };
}

export function eventReminderInstantMs(date: string, time: string, timezone = DEFAULT_APP_TIMEZONE): number {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  const timeMatch = /^(\d{2}):(\d{2})$/.exec(time);
  if (!match || !timeMatch) return Number.NaN;

  const [, year, month, day] = match;
  const [, hour, minute] = timeMatch;
  const utcGuess = Date.UTC(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute));
  const offsetMinutes = timezoneOffsetMinutes(utcGuess, timezone);
  return utcGuess - offsetMinutes * 60_000;
}

function timezoneOffsetMinutes(instantMs: number, timezone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(new Date(instantMs));

  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const asUtc = Date.UTC(
    Number(values.year),
    Number(values.month) - 1,
    Number(values.day),
    Number(values.hour),
    Number(values.minute),
    Number(values.second)
  );
  return Math.round((asUtc - instantMs) / 60_000);
}

export function eventReminderKey(eventId: number, fireAtMs: number) {
  return `event:${eventId}:${fireAtMs}`;
}

export function selectDueEventReminders({
  events,
  nowMs,
  leadMinutes = DEFAULT_EVENT_REMINDER_LEAD_MINUTES,
  timezone = DEFAULT_APP_TIMEZONE,
  alreadySentKeys = new Set<string>(),
}: {
  events: ReminderEventInput[];
  nowMs: number;
  leadMinutes?: number;
  timezone?: string;
  alreadySentKeys?: Set<string>;
}): DueEventReminder[] {
  const latestMs = nowMs + leadMinutes * 60_000;
  return events.flatMap((event) => {
    const fireAtMs = eventReminderInstantMs(event.date, event.time, timezone);
    const key = eventReminderKey(event.id, fireAtMs);
    if (!Number.isFinite(fireAtMs) || fireAtMs < nowMs || fireAtMs > latestMs || alreadySentKeys.has(key)) {
      return [];
    }
    return [{ key, eventId: event.id, userId: event.userId ?? null, fireAtMs, title: event.title }];
  });
}
