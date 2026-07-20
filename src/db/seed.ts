import { db } from "./client";
import { events, todos } from "./schema";
import { addDays, toISO } from "../lib/dates";

/**
 * Seeds a handful of sample todos and events relative to *today* so the app
 * looks alive on first run. Idempotent-ish: it clears both tables first, so
 * only run against a fresh/dev database. `npm run db:seed`.
 */
async function main() {
  const today = new Date();
  const d = (n: number) => toISO(addDays(today, n));

  await db.delete(todos);
  await db.delete(events);

  await db.insert(todos).values([
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
  ]);

  await db.insert(events).values([
    { title: "ประชุมทีมรายสัปดาห์", category: "work", date: d(0), time: "09:00" },
    { title: "ทานข้าวเย็นกับครอบครัว", category: "personal", date: d(0), time: "19:00" },
    { title: "นัดหมอฟัน", category: "health", date: d(1), time: "14:30" },
    { title: "เรียนโยคะ", category: "health", date: d(3), time: "18:00" },
    { title: "พบเพื่อนที่คาเฟ่", category: "personal", date: d(4), time: "15:00" },
    { title: "เวรเช้า", category: "shift", date: d(2), time: "08:00", endTime: "16:00" },
    { title: "เวรบ่าย", category: "shift", date: d(5), time: "16:00", endTime: "00:00" },
  ]);

  console.log("✓ seeded todos and events");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
