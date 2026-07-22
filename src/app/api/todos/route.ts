import { and, asc, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/db/client";
import { serializeTodo } from "@/lib/serialize";
import { getCurrentUser } from "@/lib/session";
import { createTodoSchema } from "@/lib/validators";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await db
    .select()
    .from(schema.todos)
    .where(eq(schema.todos.userId, user.id))
    .orderBy(asc(schema.todos.due), asc(schema.todos.id));
  return NextResponse.json(rows.map(serializeTodo));
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body: unknown = await req.json().catch(() => null);
  const parsed = createTodoSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request" },
      { status: 400 }
    );
  }

  const [row] = await db
    .insert(schema.todos)
    .values({ ...parsed.data, userId: user.id })
    .returning();
  return NextResponse.json(serializeTodo(row), { status: 201 });
}
