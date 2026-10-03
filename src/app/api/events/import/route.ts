import { and, eq, gte, lte } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/db/client";
import { getCurrentUser } from "@/lib/session";
import { importEventsSchema } from "@/lib/validators";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Adds many events at once for the signed-in user (the roster importer's
 * confirm step). An event already present on the same date with the same
 * title is skipped, so importing the same month twice adds only what is new.
 */
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body: unknown = await req.json().catch(() => null);
  const parsed = importEventsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request" },
      { status: 400 }
    );
  }

  const incoming = parsed.data.events;
  const dates = incoming.map((e) => e.date).sort();
  const existing = await db
    .select({ date: schema.events.date, title: schema.events.title })
    .from(schema.events)
    .where(
      and(
        eq(schema.events.userId, user.id),
        gte(schema.events.date, dates[0]),
        lte(schema.events.date, dates[dates.length - 1])
      )
    );

  const seen = new Set(existing.map((e) => `${e.date}\n${e.title}`));
  const fresh = incoming.filter((e) => {
    const key = `${e.date}\n${e.title}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  if (fresh.length > 0) {
    await db.insert(schema.events).values(fresh.map((e) => ({ ...e, userId: user.id })));
  }

  return NextResponse.json(
    { added: fresh.length, skipped: incoming.length - fresh.length },
    { status: fresh.length > 0 ? 201 : 200 }
  );
}
