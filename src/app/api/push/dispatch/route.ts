import { timingSafeEqual } from "node:crypto";
import { and, asc, eq, gte, inArray, isNull, lte } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/db/client";
import {
  DEFAULT_APP_TIMEZONE,
  DEFAULT_EVENT_REMINDER_LEAD_MINUTES,
  eventReminderInstantMs,
  selectDueEventReminders,
} from "@/lib/push";
import { hasVapidConfig, sendPushNotification } from "@/lib/push-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function hasValidCronSecret(req: NextRequest) {
  const expected = process.env.CRON_SECRET;
  const actual = req.headers.get("x-cron-secret");
  if (!expected || !actual) return false;
  const expectedBuffer = Buffer.from(expected);
  const actualBuffer = Buffer.from(actual);
  return expectedBuffer.length === actualBuffer.length && timingSafeEqual(expectedBuffer, actualBuffer);
}

export async function POST(req: NextRequest) {
  if (!hasValidCronSecret(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!hasVapidConfig()) {
    return NextResponse.json({ error: "Web Push is not configured" }, { status: 503 });
  }

  const nowMs = Date.now();
  const leadMinutes = Number(process.env.EVENT_REMINDER_LEAD_MINUTES || DEFAULT_EVENT_REMINDER_LEAD_MINUTES);
  const latestMs = nowMs + leadMinutes * 60_000;

  const rows = await db.select().from(schema.events).orderBy(asc(schema.events.date), asc(schema.events.time));
  const candidateEvents = rows.filter((event) => {
    const instant = eventReminderInstantMs(event.date, event.time, DEFAULT_APP_TIMEZONE);
    return Number.isFinite(instant) && instant >= nowMs && instant <= latestMs;
  });

  const existingDeliveries = await db
    .select()
    .from(schema.notificationDeliveries)
    .where(and(gte(schema.notificationDeliveries.fireAtMs, nowMs), lte(schema.notificationDeliveries.fireAtMs, latestMs)));
  const sentKeys = new Set(existingDeliveries.map((delivery) => `${delivery.kind}:${delivery.sourceId}:${delivery.fireAtMs}`));
  const due = selectDueEventReminders({ events: candidateEvents, nowMs, leadMinutes, alreadySentKeys: sentKeys });

  const dueUserIds = [...new Set(due.map((reminder) => reminder.userId).filter((id): id is number => typeof id === "number"))];
  const subscriptions = dueUserIds.length
    ? await db
        .select()
        .from(schema.pushSubscriptions)
        .where(and(isNull(schema.pushSubscriptions.failedAt), inArray(schema.pushSubscriptions.userId, dueUserIds)))
    : [];
  const subscriptionsByUser = new Map<number, typeof subscriptions>();
  for (const subscription of subscriptions) {
    const existing = subscriptionsByUser.get(subscription.userId) ?? [];
    existing.push(subscription);
    subscriptionsByUser.set(subscription.userId, existing);
  }

  let sent = 0;
  let skipped = 0;
  for (const reminder of due) {
    const inserted = await db
      .insert(schema.notificationDeliveries)
      .values({ kind: "event", sourceId: reminder.eventId, fireAtMs: reminder.fireAtMs })
      .onConflictDoNothing()
      .returning({ id: schema.notificationDeliveries.id });

    if (inserted.length === 0) {
      skipped += 1;
      continue;
    }

    const ownerSubscriptions = reminder.userId ? subscriptionsByUser.get(reminder.userId) ?? [] : [];
    const results = await Promise.allSettled(
      ownerSubscriptions.map((subscription) =>
        sendPushNotification(subscription, {
          title: "ใกล้ถึงนัดแล้วครับ",
          body: `${reminder.title} จะเริ่มในอีก ${leadMinutes} นาที`,
          url: "/calendar",
        }).then(async (result) => {
          if (result.gone) {
            await db.delete(schema.pushSubscriptions).where(eq(schema.pushSubscriptions.id, subscription.id));
          }
          return result;
        })
      )
    );
    sent += results.filter((result) => result.status === "fulfilled" && result.value.ok).length;
  }

  return NextResponse.json({ ok: true, reminders: due.length, sent, skipped, subscribers: subscriptions.length });
}
