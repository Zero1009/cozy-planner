import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/db/client";
import { serializeTodo } from "@/lib/serialize";
import { getCurrentUser } from "@/lib/session";
import { updateTodoSchema } from "@/lib/validators";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Ctx {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const idNum = Number(id);
  if (!Number.isInteger(idNum)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const body: unknown = await req.json().catch(() => null);
  const parsed = updateTodoSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request" },
      { status: 400 }
    );
  }

  const [row] = await db
    .update(schema.todos)
    .set(parsed.data)
    .where(and(eq(schema.todos.id, idNum), eq(schema.todos.userId, user.id)))
    .returning();

  if (!row) {
    return NextResponse.json({ error: "Todo not found" }, { status: 404 });
  }

  return NextResponse.json(serializeTodo(row));
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const idNum = Number(id);
  if (!Number.isInteger(idNum)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const deleted = await db
    .delete(schema.todos)
    .where(and(eq(schema.todos.id, idNum), eq(schema.todos.userId, user.id)))
    .returning({ id: schema.todos.id });
  if (deleted.length === 0) {
    return NextResponse.json({ error: "Todo not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
