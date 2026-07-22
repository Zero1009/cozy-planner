"use client";

import { useEffect, useState } from "react";

const BREAKPOINT = 1024;

/**
 * True when viewport width >= 1024px. Defaults mobile-first so small screens
 * never get a desktop top bar/sidebar flash before hydration.
 */
export function useIsDesktop(): boolean {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(`(min-width: ${BREAKPOINT}px)`);
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return isDesktop;
}
