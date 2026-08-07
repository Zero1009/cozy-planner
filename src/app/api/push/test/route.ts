import { and, eq, isNull } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db, schema } from "@/db/client";
import { sendPushNotification, hasVapidConfig } from "@/lib/push-server";
import { getCurrentUser } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "กรุณาเข้าสู่ระบบก่อนทดสอบการแจ้งเตือน" }, { status: 401 });
  if (!hasVapidConfig()) {
    return NextResponse.json(
      { error: "ยังไม่ได้ตั้งค่า VAPID keys สำหรับ Web Push บนเซิร์ฟเวอร์" },
      { status: 503 }
    );
  }

  const subscriptions = await db
    .select()
    .from(schema.pushSubscriptions)
    .where(and(eq(schema.pushSubscriptions.userId, user.id), isNull(schema.pushSubscriptions.failedAt)));

  if (subscriptions.length === 0) {
    return NextResponse.json({ error: "ยังไม่มีอุปกรณ์ที่เปิดการแจ้งเตือน" }, { status: 404 });
  }

  const results = await Promise.allSettled(
    subscriptions.map((subscription) =>
      sendPushNotification(subscription, {
        title: "Cozy Planner พร้อมแจ้งเตือนแล้วครับ",
        body: "ถ้าเห็นข้อความนี้ แปลว่าเครื่องนี้รับ notification ได้แล้ว",
        url: "/dashboard",
      }).then(async (result) => {
        if (result.gone) {
          await db.delete(schema.pushSubscriptions).where(eq(schema.pushSubscriptions.id, subscription.id));
        }
        return result;
      })
    )
  );

  const sent = results.filter((result) => result.status === "fulfilled" && result.value.ok).length;
  return NextResponse.json({ ok: sent > 0, sent, total: subscriptions.length });
}
