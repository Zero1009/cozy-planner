import { desc, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db, schema } from "@/db/client";
import { hashPassword, isAcceptablePassword } from "@/lib/auth";
import { getCurrentUser } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const createUserSchema = z.object({
  username: z
    .string()
    .trim()
    .min(2, "กรุณากรอก username อย่างน้อย 2 ตัวอักษร")
    .regex(/^[a-zA-Z0-9._-]+$/, "username ใช้ได้เฉพาะตัวอักษร ตัวเลข จุด ขีดกลาง และ underscore"),
  displayName: z.string().trim().optional(),
  password: z.string().min(1, "กรุณากรอกรหัสผ่านเริ่มต้น"),
  isAdmin: z.boolean().optional().default(false),
});

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) return { error: NextResponse.json({ error: "กรุณาเข้าสู่ระบบก่อนใช้งาน" }, { status: 401 }) };
  if (!user.isAdmin) return { error: NextResponse.json({ error: "บัญชีนี้ไม่มีสิทธิ์จัดการผู้ใช้" }, { status: 403 }) };
  return { user };
}

export async function GET() {
  const guard = await requireAdmin();
  if (guard.error) return guard.error;

  const users = await db
    .select({
      id: schema.users.id,
      username: schema.users.username,
      displayName: schema.users.displayName,
      isAdmin: schema.users.isAdmin,
      mustUpdateProfile: schema.users.mustUpdateProfile,
      createdAt: schema.users.createdAt,
    })
    .from(schema.users)
    .orderBy(desc(schema.users.createdAt));

  return NextResponse.json({ users });
}

export async function POST(req: NextRequest) {
  const guard = await requireAdmin();
  if (guard.error) return guard.error;

  const body: unknown = await req.json().catch(() => null);
  const parsed = createUserSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "ข้อมูลผู้ใช้ไม่ถูกต้อง" },
      { status: 400 }
    );
  }

  const username = parsed.data.username.toLowerCase();
  const password = parsed.data.password.trim();
  if (!isAcceptablePassword(password)) {
    return NextResponse.json(
      { error: "รหัสผ่านเริ่มต้นควรมีอย่างน้อย 8 ตัวอักษร และมีทั้งตัวอักษรกับตัวเลขหรือสัญลักษณ์" },
      { status: 400 }
    );
  }

  const [existing] = await db
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(eq(schema.users.username, username))
    .limit(1);
  if (existing) {
    return NextResponse.json({ error: "username นี้มีอยู่แล้ว" }, { status: 409 });
  }

  const [created] = await db
    .insert(schema.users)
    .values({
      username,
      displayName: parsed.data.displayName?.trim() || username,
      passwordHash: await hashPassword(password),
      isAdmin: parsed.data.isAdmin,
      mustUpdateProfile: true,
    })
    .returning({
      id: schema.users.id,
      username: schema.users.username,
      displayName: schema.users.displayName,
      isAdmin: schema.users.isAdmin,
      mustUpdateProfile: schema.users.mustUpdateProfile,
      createdAt: schema.users.createdAt,
    });

  return NextResponse.json({ user: created }, { status: 201 });
}
