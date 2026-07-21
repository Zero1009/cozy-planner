import { asc } from "drizzle-orm";
import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/db/client";
import { toISO } from "@/lib/dates";
import { catLabel, labelFor, STRINGS } from "@/lib/i18n";
import type { Lang } from "@/lib/types";
import { chatSchema } from "@/lib/validators";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const model = process.env.GROQ_MODEL || "openai/gpt-oss-120b";

// Constructed lazily (only once GROQ_API_KEY is confirmed present) so that
// importing this route module — e.g. during `next build`'s page-data
// collection — never throws just because the key isn't set in this
// environment.
function getClient(): OpenAI {
  return new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: "https://api.groq.com/openai/v1",
  });
}

async function buildSystemPrompt(lang: Lang): Promise<string> {
  const todayISO = toISO(new Date());

  const [allTodos, allEvents] = await Promise.all([
    db.select().from(schema.todos).orderBy(asc(schema.todos.due)),
    db.select().from(schema.events).orderBy(asc(schema.events.date), asc(schema.events.time)),
  ]);

  const pending = allTodos.filter((t) => !t.done);

  const pendingByCategory = new Map<string, number>();
  for (const t of pending) {
    const label = catLabel(lang, t.category as Parameters<typeof catLabel>[1]);
    pendingByCategory.set(label, (pendingByCategory.get(label) ?? 0) + 1);
  }
  const categoryCounts = [...pendingByCategory.entries()]
    .map(([label, count]) => `${label}: ${count}`)
    .join(", ");

  const todayAgenda = [
    ...allEvents
      .filter((e) => e.date === todayISO)
      .map(
        (e) =>
          `${e.time}${e.endTime ? "-" + e.endTime : ""} ${e.title} (${labelFor(
            lang,
            e.category as Parameters<typeof labelFor>[1],
            e.customCategoryLabel
          )})`
      ),
    ...allTodos
      .filter((t) => t.due === todayISO)
      .map(
        (t) =>
          `${t.done ? "[done] " : ""}${t.title} (${labelFor(
            lang,
            t.category as Parameters<typeof labelFor>[1],
            t.customCategoryLabel
          )})`
      ),
  ]
    .slice(0, 10)
    .join("; ");

  const upcoming = [
    ...allEvents
      .filter((e) => e.date > todayISO)
      .map((e) => `${e.date} ${e.time} ${e.title}`),
    ...allTodos
      .filter((t) => !t.done && t.due > todayISO)
      .map((t) => `${t.due} ${t.title}`),
  ]
    .sort()
    .slice(0, 10)
    .join("; ");

  const langName = lang === "th" ? "Thai (ภาษาไทย)" : "English";

  return [
    `You are "Cozy Planner"'s helpful, warm, and concise scheduling assistant.`,
    `Always reply in ${langName}, matching the user's language regardless of what language this prompt is written in.`,
    `Keep replies short and friendly, and help the user understand or manage their tasks and schedule.`,
    `Today's date is ${todayISO}.`,
    `Pending todo counts by category: ${categoryCounts || "none"}.`,
    `Today's agenda: ${todayAgenda || "nothing scheduled"}.`,
    `Next upcoming items: ${upcoming || "none"}.`,
  ].join("\n");
}

export async function POST(req: NextRequest) {
  const body: unknown = await req.json().catch(() => null);
  const parsed = chatSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request" },
      { status: 400 }
    );
  }

  const { lang, messages } = parsed.data;

  if (!process.env.GROQ_API_KEY) {
    return NextResponse.json({ reply: STRINGS[lang].aiError });
  }

  try {
    const systemPrompt = await buildSystemPrompt(lang);
    const completion = await getClient().chat.completions.create({
      model,
      max_tokens: 500,
      temperature: 0.5,
      messages: [{ role: "system", content: systemPrompt }, ...messages],
    });

    const reply = completion.choices[0]?.message?.content?.trim();
    return NextResponse.json({ reply: reply || STRINGS[lang].aiError });
  } catch (err) {
    console.error("AI route error:", err);
    return NextResponse.json({ reply: STRINGS[lang].aiError });
  }
}
