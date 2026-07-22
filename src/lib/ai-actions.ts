import { z } from "zod";
import { createEventSchema } from "@/lib/validators";

export const aiCreateEventActionSchema = z.object({
  type: z.literal("create_event"),
  event: createEventSchema,
});

export const aiActionSchema = aiCreateEventActionSchema;
export type AiAction = z.infer<typeof aiActionSchema>;

interface ToolCallLike {
  function?: {
    name?: string;
    arguments?: string;
  };
}

export function parseAiToolActions(toolCalls: ToolCallLike[] | undefined): AiAction[] {
  if (!toolCalls?.length) return [];

  const actions: AiAction[] = [];
  for (const call of toolCalls) {
    if (call.function?.name !== "create_event") continue;
    const rawArgs = call.function.arguments;
    if (!rawArgs) continue;

    try {
      const args = JSON.parse(rawArgs) as unknown;
      const parsed = aiCreateEventActionSchema.safeParse({ type: "create_event", event: args });
      if (parsed.success) actions.push(parsed.data);
    } catch {
      // Model-produced tool arguments are untrusted; malformed JSON should drop
      // the action rather than failing the whole chat request.
    }
  }

  return actions.slice(0, 3);
}
