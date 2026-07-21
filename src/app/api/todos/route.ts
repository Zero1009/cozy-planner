import { asc } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/db/client";
import { serializeTodo } from "@/lib/serialize";
import { createTodoSchema } from "@/lib/validators";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const rows = await db
    .select()
    .from(schema.todos)
    .orderBy(asc(schema.todos.due), asc(schema.todos.id));
  return NextResponse.json(rows.map(serializeTodo));
}

export async function POST(req: NextRequest) {
  const body: unknown = await req.json().catch(() => null);
  const parsed = createTodoSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request" },
      { status: 400 }
    );
  }

  const [row] = await db.insert(schema.todos).values(parsed.data).returning();
  return NextResponse.json(serializeTodo(row), { status: 201 });
}
