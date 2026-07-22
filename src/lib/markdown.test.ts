import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { markdownSanitizeSchema, safeMarkdownUrl } from "./markdown";

describe("markdown safety", () => {
  it("allows only safe link protocols", () => {
    assert.equal(safeMarkdownUrl("https://example.com/path"), "https://example.com/path");
    assert.equal(safeMarkdownUrl("http://example.com"), "http://example.com");
    assert.equal(safeMarkdownUrl("mailto:test@example.com"), "mailto:test@example.com");
    assert.equal(safeMarkdownUrl("/calendar"), "/calendar");
    assert.equal(safeMarkdownUrl("#today"), "#today");
    assert.equal(safeMarkdownUrl("javascript:alert(1)"), "");
    assert.equal(safeMarkdownUrl(" data:text/html,hello"), "");
    assert.equal(safeMarkdownUrl("vbscript:msgbox(1)"), "");
  });

  it("does not allow auto-loading or executable markdown HTML surfaces", () => {
    const tags = new Set(markdownSanitizeSchema.tagNames ?? []);
    for (const blocked of ["img", "picture", "source", "iframe", "video", "audio", "input", "script", "style"]) {
      assert.equal(tags.has(blocked), false, `${blocked} should be blocked`);
    }
  });
});
