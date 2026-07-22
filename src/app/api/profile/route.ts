import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db, schema } from "@/db/client";
import { hashPassword, isAcceptablePassword } from "@/lib/auth";
import { getCurrentUser, setSessionCookie } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const profileSchema = z.object({
  displayName: z.string().trim().min(2, "กรุณากรอกชื่อที่แสดงอย่างน้อย 2 ตัวอักษร"),
  password: z.string().optional(),
});

export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "กรุณาเข้าสู่ระบบก่อนใช้งาน" }, { status: 401 });

  const body: unknown = await req.json().catch(() => null);
  const parsed = profileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "ข้อมูลโปรไฟล์ไม่ถูกต้อง" },
      { status: 400 }
    );
  }

  const values: Partial<typeof schema.users.$inferInsert> = {
    displayName: parsed.data.displayName,
    mustUpdateProfile: false,
  };

  const password = parsed.data.password?.trim();
  if (password) {
    if (!isAcceptablePassword(password)) {
      return NextResponse.json(
        { error: "รหัสผ่านใหม่ควรมีอย่างน้อย 8 ตัวอักษร และมีทั้งตัวอักษรกับตัวเลขหรือสัญลักษณ์" },
        { status: 400 }
      );
    }
    values.passwordHash = await hashPassword(password);
  }

  const [updated] = await db
    .update(schema.users)
    .set(values)
    .where(eq(schema.users.id, user.id))
    .returning({
      id: schema.users.id,
      username: schema.users.username,
      displayName: schema.users.displayName,
      isAdmin: schema.users.isAdmin,
      mustUpdateProfile: schema.users.mustUpdateProfile,
    });

  if (!updated) return NextResponse.json({ error: "ไม่พบผู้ใช้" }, { status: 404 });
  await setSessionCookie(updated);
  return NextResponse.json({ user: updated });
}
