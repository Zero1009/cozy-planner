import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db, schema } from "@/db/client";
import { setSessionCookie } from "@/lib/session";
import { dummyVerify, verifyPassword } from "@/lib/auth";
import {
  checkLoginGate,
  clearLoginGate,
  LOCK_DURATION_MS,
  MAX_FAILED_ATTEMPTS,
  registerFailedLogin,
} from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SETUP_ERROR =
  "ระบบเข้าสู่ระบบยังไม่พร้อม กรุณาให้ TRK ตรวจฐานข้อมูล production ก่อนใช้งาน";

const loginSchema = z.object({
  username: z.string().trim().min(1, "กรุณากรอก username"),
  password: z.string().min(1, "กรุณากรอกรหัสผ่าน"),
});

export async function POST(req: NextRequest) {
  const body: unknown = await req.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "ข้อมูลเข้าสู่ระบบไม่ถูกต้อง" },
      { status: 400 }
    );
  }

  const username = parsed.data.username.toLowerCase();
  const password = parsed.data.password;

  let user: typeof schema.users.$inferSelect | undefined;
  let gate;
  try {
    gate = await checkLoginGate(username);
    [user] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.username, username))
      .limit(1);
  } catch (err) {
    console.error("Login setup error:", err);
    return NextResponse.json({ error: SETUP_ERROR }, { status: 503 });
  }

  if (gate.locked) {
    const minutes = Math.max(1, Math.ceil(gate.retryAfterMs / 60000));
    return NextResponse.json(
      { error: `พยายามเข้าสู่ระบบผิดหลายครั้งเกินไป กรุณารอประมาณ ${minutes} นาทีแล้วลองใหม่` },
      { status: 429 }
    );
  }

  // Constant-time: run an equivalent scrypt comparison even when the user does
  // not exist, so response timing does not reveal which usernames are valid.
  const passwordOk = user
    ? await verifyPassword(password, user.passwordHash)
    : await dummyVerify(password);

  if (!user || !passwordOk) {
    const result = await registerFailedLogin(username);
    if (result.justLocked) {
      const minutes = Math.max(1, Math.ceil(LOCK_DURATION_MS / 60000));
      return NextResponse.json(
        {
          error: `เข้าสู่ระบบผิดเกิน ${MAX_FAILED_ATTEMPTS} ครั้ง ระบบล็อกชั่วคราว ${minutes} นาที`,
        },
        { status: 429 }
      );
    }
    return NextResponse.json(
      { error: `Username หรือรหัสผ่านไม่ถูกต้อง (เหลือโอกาสอีก ${result.remaining} ครั้ง)` },
      { status: 401 }
    );
  }

  await clearLoginGate(username);

  await setSessionCookie({
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    isAdmin: user.isAdmin,
    mustUpdateProfile: user.mustUpdateProfile,
  });

  return NextResponse.json({
    user: {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      isAdmin: user.isAdmin,
      mustUpdateProfile: user.mustUpdateProfile,
    },
  });
}
