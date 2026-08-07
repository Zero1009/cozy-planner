import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildPushPayload,
  eventReminderInstantMs,
  isSafeNotificationUrl,
  parsePushSubscription,
  selectDueEventReminders,
} from "./push";

describe("push notification helpers", () => {
  it("validates browser push subscriptions without trusting extra fields", () => {
    const parsed = parsePushSubscription({
      endpoint: "https://example.push.service/send/abc",
      expirationTime: null,
      keys: { p256dh: "public-key", auth: "auth-secret" },
      ignored: "not persisted",
    });

    assert.deepEqual(parsed, {
      endpoint: "https://example.push.service/send/abc",
      p256dh: "public-key",
      auth: "auth-secret",
    });
    assert.equal(parsePushSubscription({ endpoint: "not-a-url", keys: { p256dh: "x", auth: "y" } }), null);
    assert.equal(parsePushSubscription({ endpoint: "https://example.com", keys: { p256dh: "", auth: "y" } }), null);
  });

  it("builds compact same-origin notification payloads", () => {
    assert.deepEqual(buildPushPayload({ title: "เตือนความจำ", body: "ประชุมเริ่ม 10:00", url: "/calendar" }), {
      title: "เตือนความจำ",
      body: "ประชุมเริ่ม 10:00",
      url: "/calendar",
    });
    assert.deepEqual(buildPushPayload({ title: "", body: "", url: "https://evil.example" }), {
      title: "Cozy Planner",
      body: "มีการแจ้งเตือนใหม่ครับ",
      url: "/dashboard",
    });
  });

  it("allows only relative in-app notification click URLs", () => {
    assert.equal(isSafeNotificationUrl("/calendar"), true);
    assert.equal(isSafeNotificationUrl("/todos?filter=today"), true);
    assert.equal(isSafeNotificationUrl("https://example.com"), false);
    assert.equal(isSafeNotificationUrl("//example.com"), false);
    assert.equal(isSafeNotificationUrl("javascript:alert(1)"), false);
  });

  it("converts planner wall-clock event times in the app timezone", () => {
    assert.equal(new Date(eventReminderInstantMs("2026-07-24", "10:00", "Asia/Bangkok")).toISOString(), "2026-07-24T03:00:00.000Z");
  });

  it("selects due event reminders once within the lead-time window", () => {
    const now = Date.parse("2026-07-24T02:50:00.000Z");
    const due = selectDueEventReminders({
      nowMs: now,
      leadMinutes: 10,
      timezone: "Asia/Bangkok",
      alreadySentKeys: new Set(["event:2:1784862000000"]),
      events: [
        { id: 1, title: "Standup", date: "2026-07-24", time: "10:00" },
        { id: 2, title: "Already sent", date: "2026-07-24", time: "10:00" },
        { id: 3, title: "Too far", date: "2026-07-24", time: "10:30" },
        { id: 4, title: "Past", date: "2026-07-24", time: "09:45" },
      ],
    });

    assert.deepEqual(due, [
      {
        key: "event:1:1784862000000",
        eventId: 1,
        userId: null,
        fireAtMs: 1784862000000,
        title: "Standup",
      },
    ]);
  });
});
