"use client";

import { useEffect, useState } from "react";

const BREAKPOINT = 900;

/**
 * True when viewport width >= 900px. Defaults to `true` for SSR/first paint
 * (desktop-first) and corrects itself after mount via a resize listener, so
 * it's fine for this to flip once the client settles.
 */
export function useIsDesktop(): boolean {
  const [isDesktop, setIsDesktop] = useState(true);

  useEffect(() => {
    const mq = window.matchMedia(`(min-width: ${BREAKPOINT}px)`);
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return isDesktop;
}
