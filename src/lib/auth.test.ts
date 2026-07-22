import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  hashPassword,
  isAcceptablePassword,
  signSession,
  verifyPassword,
  verifySession,
} from "./auth";

describe("auth helpers", () => {
  it("hashes and verifies passwords without storing plaintext", async () => {
    const hash = await hashPassword("correct horse battery staple");

    assert.notEqual(hash, "correct horse battery staple");
    assert.match(hash, /^scrypt\$/);
    assert.equal(await verifyPassword("correct horse battery staple", hash), true);
    assert.equal(await verifyPassword("wrong password", hash), false);
  });

  it("signs tamper-resistant session tokens", () => {
    const token = signSession({ userId: 42, username: "trk", isAdmin: true }, "test-secret");

    assert.deepEqual(verifySession(token, "test-secret"), {
      userId: 42,
      username: "trk",
      isAdmin: true,
    });
    assert.equal(verifySession(`${token}x`, "test-secret"), null);
    assert.equal(verifySession(token, "other-secret"), null);
  });

  it("accepts only non-trivial passwords for user-managed profiles", () => {
    assert.equal(isAcceptablePassword("short"), false);
    assert.equal(isAcceptablePassword("12345678"), false);
    assert.equal(isAcceptablePassword("cozy-cat-2026"), true);
  });
});
