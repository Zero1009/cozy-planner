import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/db/client";
import { parsePushSubscription } from "@/lib/push";
import { getCurrentUser } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_DEVICES_PER_USER = 10;

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "กรุณาเข้าสู่ระบบก่อนเปิดการแจ้งเตือน" }, { status: 401 });

  const parsed = parsePushSubscription(await req.json().catch(() => null));
  if (!parsed) return NextResponse.json({ error: "ข้อมูลอุปกรณ์แจ้งเตือนไม่ถูกต้อง" }, { status: 400 });

  const existingForUser = await db
    .select({ id: schema.pushSubscriptions.id })
    .from(schema.pushSubscriptions)
    .where(eq(schema.pushSubscriptions.userId, user.id));

  if (existingForUser.length >= MAX_DEVICES_PER_USER) {
    const owned = await db
      .select({ id: schema.pushSubscriptions.id })
      .from(schema.pushSubscriptions)
      .where(and(eq(schema.pushSubscriptions.userId, user.id), eq(schema.pushSubscriptions.endpoint, parsed.endpoint)))
      .limit(1);
    if (owned.length === 0) {
      return NextResponse.json({ error: "บัญชีนี้มีอุปกรณ์แจ้งเตือนครบ 10 เครื่องแล้ว กรุณาปิดจากเครื่องที่ไม่ได้ใช้ก่อน" }, { status: 429 });
    }
  }

  const now = new Date();
  const [row] = await db
    .insert(schema.pushSubscriptions)
    .values({
      userId: user.id,
      endpoint: parsed.endpoint,
      p256dh: parsed.p256dh,
      auth: parsed.auth,
      userAgent: req.headers.get("user-agent"),
      lastSeenAt: now,
      failedAt: null,
    })
    .onConflictDoUpdate({
      target: schema.pushSubscriptions.endpoint,
      set: {
        userId: user.id,
        p256dh: parsed.p256dh,
        auth: parsed.auth,
        userAgent: req.headers.get("user-agent"),
        lastSeenAt: now,
        failedAt: null,
      },
    })
    .returning({ id: schema.pushSubscriptions.id });

  return NextResponse.json({ ok: true, id: row.id });
}

export async function DELETE(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "กรุณาเข้าสู่ระบบก่อนจัดการการแจ้งเตือน" }, { status: 401 });

  const body = (await req.json().catch(() => null)) as { endpoint?: unknown } | null;
  if (typeof body?.endpoint !== "string" || !body.endpoint) {
    return NextResponse.json({ error: "ไม่พบอุปกรณ์ที่ต้องการปิดการแจ้งเตือน" }, { status: 400 });
  }

  await db
    .delete(schema.pushSubscriptions)
    .where(and(eq(schema.pushSubscriptions.userId, user.id), eq(schema.pushSubscriptions.endpoint, body.endpoint)));

  return NextResponse.json({ ok: true });
}
