import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SWIPE_FLICK_MIN_PX,
  SWIPE_MIN_PX,
  SWIPE_MIN_RATIO,
  SWIPE_MIN_VELOCITY,
  lockAxis,
  swipeOutcome,
} from "./swipe";

test("lockAxis stays null within slop on both axes", () => {
  assert.equal(lockAxis(3, 2), null);
  assert.equal(lockAxis(0, 0), null);
});

test("lockAxis picks the dominant axis once past slop", () => {
  assert.equal(lockAxis(20, 3), "x");
  assert.equal(lockAxis(3, 20), "y");
});

test("lockAxis breaks a tie at the slop boundary towards the larger delta", () => {
  // Exactly at slop no longer counts as "within slop", so it resolves by
  // comparing magnitudes rather than staying null.
  assert.equal(lockAxis(8, 0), "x");
  assert.equal(lockAxis(0, 8), "y");
});

test("swipeOutcome ignores a vertical-dominant drag", () => {
  assert.equal(swipeOutcome({ dx: 10, dy: 80, velocityX: 2, width: 390 }), "none");
});

test("swipeOutcome commits exactly at the distance threshold", () => {
  const width = 390;
  const threshold = Math.max(SWIPE_MIN_PX, width * SWIPE_MIN_RATIO);
  assert.equal(
    swipeOutcome({ dx: -threshold, dy: 0, velocityX: 0, width }),
    "next"
  );
});

test("swipeOutcome does not commit just under the distance threshold", () => {
  const width = 390;
  const threshold = Math.max(SWIPE_MIN_PX, width * SWIPE_MIN_RATIO);
  assert.equal(
    swipeOutcome({ dx: -(threshold - 1), dy: 0, velocityX: 0, width }),
    "none"
  );
});

test("swipeOutcome commits a fast short flick that never reached the distance threshold", () => {
  assert.equal(
    swipeOutcome({ dx: -30, dy: 0, velocityX: -(SWIPE_MIN_VELOCITY + 0.1), width: 390 }),
    "next"
  );
});

test("swipeOutcome ignores a fast but very short jitter", () => {
  assert.equal(
    swipeOutcome({ dx: -(SWIPE_FLICK_MIN_PX - 1), dy: 0, velocityX: -5, width: 390 }),
    "none"
  );
});

test("swipeOutcome maps sign to direction both ways", () => {
  assert.equal(swipeOutcome({ dx: -100, dy: 0, velocityX: 0, width: 200 }), "next");
  assert.equal(swipeOutcome({ dx: 100, dy: 0, velocityX: 0, width: 200 }), "prev");
});

test("swipeOutcome: SWIPE_MIN_PX floor beats the ratio on a narrow pane", () => {
  const width = 100; // ratio threshold would be 22px, well under the 56px floor
  assert.equal(swipeOutcome({ dx: -50, dy: 0, velocityX: 0, width }), "none");
  assert.equal(swipeOutcome({ dx: -SWIPE_MIN_PX, dy: 0, velocityX: 0, width }), "next");
});
