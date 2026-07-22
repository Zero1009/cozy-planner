import { and, asc, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/db/client";
import { serializeEvent } from "@/lib/serialize";
import { getCurrentUser } from "@/lib/session";
import { createEventSchema } from "@/lib/validators";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await db
    .select()
    .from(schema.events)
    .where(eq(schema.events.userId, user.id))
    .orderBy(asc(schema.events.date), asc(schema.events.time));
  return NextResponse.json(rows.map(serializeEvent));
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body: unknown = await req.json().catch(() => null);
  const parsed = createEventSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request" },
      { status: 400 }
    );
  }

  const [row] = await db
    .insert(schema.events)
    .values({ ...parsed.data, userId: user.id })
    .returning();
  return NextResponse.json(serializeEvent(row), { status: 201 });
}
