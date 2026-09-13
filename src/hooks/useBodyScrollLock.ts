"use client";

import { useEffect } from "react";

// Module-level so nested sheets (the day card plus a stacked edit sheet)
// don't fight over restoring `body.style.overflow` — only the last one out
// puts it back.
let lockCount = 0;
let previousOverflow = "";

/**
 * Locks page scroll while `active`. Plain `overflow: hidden` rather than the
 * `position: fixed; top: -scrollY` trick — that trick jumps the scroll
 * position on release and fights the keyboard on iOS when a field inside the
 * locked content is focused.
 */
export function useBodyScrollLock(active: boolean): void {
  useEffect(() => {
    if (!active) return;
    if (lockCount === 0) {
      previousOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
    }
    lockCount++;
    return () => {
      lockCount--;
      if (lockCount === 0) document.body.style.overflow = previousOverflow;
    };
  }, [active]);
}
