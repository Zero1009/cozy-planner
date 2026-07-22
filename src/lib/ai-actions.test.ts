import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseAiToolActions } from "./ai-actions";

describe("AI event actions", () => {
  it("accepts a well-formed create_event draft and applies defaults", () => {
    const [action] = parseAiToolActions([
      {
        function: {
          name: "create_event",
          arguments: JSON.stringify({ title: "Dentist", date: "2026-07-23" }),
        },
      },
    ]);

    assert.equal(action.type, "create_event");
    assert.equal(action.event.title, "Dentist");
    assert.equal(action.event.date, "2026-07-23");
    assert.equal(action.event.time, "09:00");
    assert.equal(action.event.category, "personal");
  });

  it("rejects invalid dates, times, categories, and empty titles", () => {
    const actions = parseAiToolActions([
      { function: { name: "create_event", arguments: JSON.stringify({ title: "Bad date", date: "2026-7-23" }) } },
      { function: { name: "create_event", arguments: JSON.stringify({ title: "Bad time", date: "2026-07-23", time: "25:00" }) } },
      { function: { name: "create_event", arguments: JSON.stringify({ title: "Bad cat", date: "2026-07-23", category: "meeting" }) } },
      { function: { name: "create_event", arguments: JSON.stringify({ title: "", date: "2026-07-23" }) } },
    ]);

    assert.equal(actions.length, 0);
  });

  it("drops malformed JSON and unrelated tool calls without throwing", () => {
    assert.deepEqual(
      parseAiToolActions([
        { function: { name: "create_event", arguments: "{" } },
        { function: { name: "delete_event", arguments: JSON.stringify({ id: 1 }) } },
      ]),
      []
    );
  });
});
