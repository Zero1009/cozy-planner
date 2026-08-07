import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildPlannerPromptContext, formatAgentDateLabel } from "./planner-context";

describe("planner prompt context", () => {
  it("formats planner dates with deterministic weekdays instead of leaving them for the model", () => {
    assert.equal(formatAgentDateLabel("2026-08-17", "th"), "วันจันทร์ที่ 17 สิงหาคม 2026");
    assert.equal(formatAgentDateLabel("2026-08-17", "en"), "Monday, August 17, 2026");
  });

  it("builds structured planner facts with precomputed display dates for events and todos", () => {
    const context = buildPlannerPromptContext({
      lang: "th",
      todayISO: "2026-08-16",
      todos: [
        {
          id: 7,
          userId: 1,
          title: "ซื้อยา",
          category: "health",
          customCategoryLabel: null,
          priority: "med",
          due: "2026-08-17",
          done: false,
          createdAt: new Date("2026-08-15T00:00:00Z"),
        },
      ],
      events: [
        {
          id: 11,
          userId: 1,
          title: "นัดหมอเบาหวาน",
          category: "health",
          customCategoryLabel: null,
          date: "2026-08-17",
          time: "08:00",
          endTime: null,
          createdAt: new Date("2026-08-15T00:00:00Z"),
        },
      ],
    });

    assert.match(context, /"displayDate":"วันจันทร์ที่ 17 สิงหาคม 2026"/);
    assert.match(context, /"weekday":"วันจันทร์"/);
    assert.match(context, /Never calculate weekdays yourself/);
    assert.match(context, /Use `displayDate` exactly/);
  });
});
