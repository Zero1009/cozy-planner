import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db, schema } from "@/db/client";
import { setSessionCookie } from "@/lib/session";
import { verifyPassword } from "@/lib/auth";

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
  let user: typeof schema.users.$inferSelect | undefined;
  try {
    [user] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.username, username))
      .limit(1);
  } catch (err) {
    console.error("Login setup error:", err);
    return NextResponse.json({ error: SETUP_ERROR }, { status: 503 });
  }

  if (!user || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
    return NextResponse.json({ error: "Username หรือรหัสผ่านไม่ถูกต้อง" }, { status: 401 });
  }

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
