import assert from "node:assert/strict";
import { test } from "node:test";
import {
  applyFailure,
  evaluateGate,
  LOCK_DURATION_MS,
  MAX_FAILED_ATTEMPTS,
} from "./rate-limit";

const NOW = 1_000_000;

test("evaluateGate: no record is not locked", () => {
  assert.deepEqual(evaluateGate(undefined, NOW), { locked: false, retryAfterMs: 0 });
});

test("evaluateGate: active lock is locked with remaining time", () => {
  const state = evaluateGate({ failedCount: 0, lockedUntilMs: NOW + 5000 }, NOW);
  assert.equal(state.locked, true);
  assert.equal(state.retryAfterMs, 5000);
});

test("evaluateGate: expired lock is not locked", () => {
  assert.equal(evaluateGate({ failedCount: 0, lockedUntilMs: NOW - 1 }, NOW).locked, false);
});

test("applyFailure: counts up and reports remaining until the limit", () => {
  let record = undefined as Parameters<typeof applyFailure>[0];
  for (let attempt = 1; attempt < MAX_FAILED_ATTEMPTS; attempt++) {
    const r = applyFailure(record, NOW);
    assert.equal(r.justLocked, false);
    assert.equal(r.failedCount, attempt);
    assert.equal(r.remaining, MAX_FAILED_ATTEMPTS - attempt);
    assert.equal(r.lockedUntilMs, null);
    record = { failedCount: r.failedCount, lockedUntilMs: r.lockedUntilMs };
  }
});

test("applyFailure: the Nth failure locks and resets the counter", () => {
  const record = { failedCount: MAX_FAILED_ATTEMPTS - 1, lockedUntilMs: null };
  const r = applyFailure(record, NOW);
  assert.equal(r.justLocked, true);
  assert.equal(r.remaining, 0);
  assert.equal(r.failedCount, 0);
  assert.equal(r.lockedUntilMs, NOW + LOCK_DURATION_MS);
});
