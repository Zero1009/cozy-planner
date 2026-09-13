"use client";

import { useRef, type DOMAttributes, type RefObject } from "react";
import { SWIPE_AXIS_SLOP, SWIPE_EDGE_GUARD, lockAxis, swipeOutcome } from "@/lib/swipe";

interface UseDaySwipeOptions {
  onPrev: () => void;
  onNext: () => void;
  enabled: boolean;
}

interface DaySwipeBinding {
  /** Spread onto the scroll container. */
  handlers: Pick<
    DOMAttributes<HTMLDivElement>,
    "onPointerDown" | "onPointerMove" | "onPointerUp" | "onPointerCancel" | "onClickCapture"
  >;
  /** Attach to the inner element that should follow the finger. */
  paneRef: RefObject<HTMLDivElement | null>;
}

interface VelocitySample {
  x: number;
  t: number;
}

interface DragState {
  pointerId: number;
  startX: number;
  startY: number;
  axis: "x" | "y" | null;
  samples: VelocitySample[];
}

// How far back the rolling velocity sample looks: long enough to smooth out
// per-frame jitter, short enough that a pause-then-flick doesn't average in
// stale, motionless samples.
const VELOCITY_WINDOW_MS = 60;

/**
 * Pointer-driven horizontal swipe between days, mirroring the draggable AI
 * button's pattern (`AppShell.tsx`): one Pointer Events path covers touch,
 * mouse and pen, so `page.mouse` in Playwright exercises the real code. Every
 * drag offset is written straight to `paneRef.current.style.transform` —
 * never to React state — because a state update per `pointermove` would
 * re-render the whole calendar behind the sheet at 60-120Hz.
 */
export function useDaySwipe({ onPrev, onNext, enabled }: UseDaySwipeOptions): DaySwipeBinding {
  const paneRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<DragState | null>(null);
  // Whether the gesture that just ended moved past axis-lock — read by the
  // `click` that immediately follows `pointerup` on the same target.
  const suppressClickRef = useRef(false);

  function resetPane() {
    const pane = paneRef.current;
    if (!pane) return;
    pane.classList.remove("is-dragging");
    pane.style.transform = "";
  }

  function releaseCapture(target: EventTarget, pointerId: number) {
    try {
      (target as HTMLElement).releasePointerCapture(pointerId);
    } catch {
      // Already released — iOS can take the gesture away mid-drag (its own
      // back-swipe, or a native scroll snapping in) before we get here.
    }
  }

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (!enabled || !e.isPrimary || dragRef.current) return;
    if ((e.target as HTMLElement).closest("input,textarea,select")) return;
    // Both screen edges belong to iOS's history-navigation swipe, which
    // `touch-action` cannot suppress — starting a drag there would fight the
    // OS gesture instead of ever winning it. Those pixels stay tappable and
    // scrollable, just not swipe-startable.
    if (e.clientX < SWIPE_EDGE_GUARD || e.clientX > window.innerWidth - SWIPE_EDGE_GUARD) return;

    dragRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      axis: null,
      samples: [{ x: e.clientX, t: e.timeStamp }],
    };
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag || e.pointerId !== drag.pointerId) return;
    if (!e.isPrimary) {
      // A second touch joined mid-gesture — abandon rather than guess intent.
      dragRef.current = null;
      resetPane();
      return;
    }

    const dx = e.clientX - drag.startX;
    const dy = e.clientY - drag.startY;

    if (drag.axis === null) {
      const axis = lockAxis(dx, dy, SWIPE_AXIS_SLOP);
      if (axis === null) return;
      if (axis === "y") {
        // Native scroll owns this gesture from here on — no capture, no
        // transform, and no more bookkeeping for this pointer.
        dragRef.current = null;
        return;
      }
      drag.axis = "x";
      // Capture only now that the axis has locked horizontal: capturing on
      // pointerdown would stop the browser from ever getting a chance to
      // start its own vertical scroll for a gesture that turns out vertical.
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      paneRef.current?.classList.add("is-dragging");
    }

    drag.samples.push({ x: e.clientX, t: e.timeStamp });
    const cutoff = e.timeStamp - VELOCITY_WINDOW_MS;
    while (drag.samples.length > 1 && drag.samples[0].t < cutoff) drag.samples.shift();

    if (paneRef.current) paneRef.current.style.transform = `translate3d(${dx}px,0,0)`;
  }

  function onPointerUp(e: React.PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag || e.pointerId !== drag.pointerId) return;
    dragRef.current = null;
    if (drag.axis !== "x") return;

    const dx = e.clientX - drag.startX;
    const dy = e.clientY - drag.startY;
    const first = drag.samples[0];
    const last = drag.samples[drag.samples.length - 1];
    const dt = last.t - first.t;
    const velocityX = dt > 0 ? (last.x - first.x) / dt : 0;
    const width = paneRef.current?.clientWidth || window.innerWidth;

    releaseCapture(e.target, e.pointerId);
    resetPane();
    // The axis already locked to "x", so this was a real drag, not a tap —
    // the click that Chromium/iOS fire right after must not reopen the row
    // underneath the finger as an edit.
    suppressClickRef.current = true;

    const outcome = swipeOutcome({ dx, dy, velocityX, width });
    if (outcome === "next") onNext();
    else if (outcome === "prev") onPrev();
  }

  function onPointerCancel(e: React.PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag || e.pointerId !== drag.pointerId) return;
    dragRef.current = null;
    // iOS fires `pointercancel` whenever it takes the gesture away (the
    // system back-swipe, a native scroll snapping in, and more). Treat it as
    // outcome "none" rather than guessing from a partial drag.
    releaseCapture(e.target, e.pointerId);
    resetPane();
  }

  function onClickCapture(e: React.MouseEvent<HTMLDivElement>) {
    // Agenda rows are `div[role="button"]` with `onClick`; a drag ending
    // over one must not also open its editor. Intercepting in the capture
    // phase stops the event before it ever reaches the row.
    if (!suppressClickRef.current) return;
    suppressClickRef.current = false;
    e.stopPropagation();
    e.preventDefault();
  }

  return {
    handlers: { onPointerDown, onPointerMove, onPointerUp, onPointerCancel, onClickCapture },
    paneRef,
  };
}
