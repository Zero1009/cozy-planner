// Pure gesture math for the day-detail sheet's swipe-between-days. Kept
// separate from the pointer plumbing (`useDaySwipe`) so the thresholds are
// unit-testable without a DOM.

/** Pixels of travel before a gesture commits to an axis. */
export const SWIPE_AXIS_SLOP = 8;
/** Commit distance as a fraction of the pane's width. */
export const SWIPE_MIN_RATIO = 0.22;
/** Floor for `SWIPE_MIN_RATIO` so a narrow pane doesn't need a tiny drag. */
export const SWIPE_MIN_PX = 56;
/** A flick still needs this much real travel — stops a jittery tap with a
 *  high instantaneous velocity from flipping the day. */
export const SWIPE_FLICK_MIN_PX = 24;
/** px/ms over the rolling velocity sample; below this a fast-but-short drag
 *  falls back to the distance rule instead of committing as a flick. */
export const SWIPE_MIN_VELOCITY = 0.45;
/** Dead zone at both screen edges where iOS's own back/forward swipe lives. */
export const SWIPE_EDGE_GUARD = 24;

export type SwipeOutcome = "prev" | "next" | "none";

/** Which axis a gesture has committed to, or null while still ambiguous. */
export function lockAxis(dx: number, dy: number, slop: number = SWIPE_AXIS_SLOP): "x" | "y" | null {
  if (Math.abs(dx) < slop && Math.abs(dy) < slop) return null;
  return Math.abs(dx) > Math.abs(dy) ? "x" : "y";
}

/**
 * Drag left (dx < 0) advances to the NEXT day; drag right goes back — content
 * follows the finger. Commits on distance (a slow deliberate drag) or on
 * velocity (a flick that never travelled far); a vertical-dominant gesture
 * never commits, as a safety net even though callers should already have
 * abandoned it via `lockAxis`.
 */
export function swipeOutcome(input: {
  dx: number;
  dy: number;
  velocityX: number;
  width: number;
}): SwipeOutcome {
  const { dx, dy, velocityX, width } = input;
  if (Math.abs(dy) > Math.abs(dx)) return "none";

  const distanceThreshold = Math.max(SWIPE_MIN_PX, width * SWIPE_MIN_RATIO);
  const committedByDistance = Math.abs(dx) >= distanceThreshold;
  const committedByFlick =
    Math.abs(velocityX) >= SWIPE_MIN_VELOCITY && Math.abs(dx) >= SWIPE_FLICK_MIN_PX;

  if (!committedByDistance && !committedByFlick) return "none";
  return dx < 0 ? "next" : "prev";
}
