import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/db/client";
import { serializeEvent } from "@/lib/serialize";
import { getCurrentUser } from "@/lib/session";
import { updateEventSchema } from "@/lib/validators";

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
  const parsed = updateEventSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request" },
      { status: 400 }
    );
  }

  const [row] = await db
    .update(schema.events)
    .set(parsed.data)
    .where(and(eq(schema.events.id, idNum), eq(schema.events.userId, user.id)))
    .returning();

  if (!row) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  return NextResponse.json(serializeEvent(row));
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
    .delete(schema.events)
    .where(and(eq(schema.events.id, idNum), eq(schema.events.userId, user.id)))
    .returning({ id: schema.events.id });
  if (deleted.length === 0) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
