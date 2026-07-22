import { eq } from "drizzle-orm";
import { db } from "./client";
import { events, todos, users } from "./schema";
import { addDays, toISO } from "../lib/dates";
import { hashPassword } from "../lib/auth";

/**
 * Seeds a demo user plus sample todos/events (owned by that user) relative to
 * *today* so the app looks alive on first run. Clears both data tables first,
 * so only run against a fresh/dev database. `npm run db:seed`.
 */
async function main() {
  const today = new Date();
  const d = (n: number) => toISO(addDays(today, n));

  // Ensure an owner exists. Reuse the first user if the DB already has one
  // (e.g. an admin created via `npm run user:create`), otherwise make a demo.
  let [owner] = await db.select().from(users).limit(1);
  if (!owner) {
    [owner] = await db
      .insert(users)
      .values({
        username: "demo",
        displayName: "Demo",
        passwordHash: await hashPassword("demo-password-1"),
        isAdmin: true,
        mustUpdateProfile: false,
      })
      .returning();
    console.log(`✓ created demo user (username: demo / password: demo-password-1)`);
  } else {
    console.log(`✓ assigning sample data to existing user: ${owner.username}`);
  }
  const userId = owner.id;

  // Only reset this owner's rows so other users' data is left untouched.
  await db.delete(todos).where(eq(todos.userId, userId));
  await db.delete(events).where(eq(events.userId, userId));

  await db.insert(todos).values(
    [
      { title: "จ่ายบิลค่าน้ำค่าไฟ", category: "personal", priority: "high", due: d(0), done: false },
      { title: "ซื้อของใช้ในบ้าน", category: "personal", priority: "med", due: d(0), done: false },
      { title: "ออกกำลังกาย 30 นาที", category: "health", priority: "med", due: d(0), done: true },
      { title: "อ่านหนังสือ 20 หน้า", category: "study", priority: "low", due: d(1), done: false },
      { title: "โทรหาคุณแม่", category: "personal", priority: "high", due: d(1), done: false },
      { title: "ทำความสะอาดห้อง", category: "other", priority: "low", due: d(2), done: false },
      { title: "เตรียมเอกสารสำคัญ", category: "work", priority: "high", due: d(-1), done: false },
      { title: "รดน้ำต้นไม้", category: "personal", priority: "low", due: d(3), done: false },
      { title: "จองคิวตัดผม", category: "other", priority: "med", due: d(5), done: false },
      { title: "สรุปงบประมาณเดือนนี้", category: "work", priority: "med", due: d(7), done: false },
    ].map((t) => ({ ...t, userId }))
  );

  await db.insert(events).values(
    [
      { title: "ประชุมทีมรายสัปดาห์", category: "work", date: d(0), time: "09:00" },
      { title: "ทานข้าวเย็นกับครอบครัว", category: "personal", date: d(0), time: "19:00" },
      { title: "นัดหมอฟัน", category: "health", date: d(1), time: "14:30" },
      { title: "เรียนโยคะ", category: "health", date: d(3), time: "18:00" },
      { title: "พบเพื่อนที่คาเฟ่", category: "personal", date: d(4), time: "15:00" },
      { title: "เวรเช้า", category: "shift", date: d(2), time: "08:00", endTime: "16:00" },
      { title: "เวรบ่าย", category: "shift", date: d(5), time: "16:00", endTime: "00:00" },
    ].map((e) => ({ ...e, userId }))
  );

  console.log("✓ seeded todos and events");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
