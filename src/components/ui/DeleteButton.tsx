"use client";

import { useState } from "react";
import { TrashIcon } from "@/components/ui/icons";
import type { Theme } from "@/lib/theme";

const DANGER = "oklch(58% 0.16 25)";

interface DeleteButtonProps {
  theme: Theme;
  onClick: () => void;
  ariaLabel?: string;
  size?: number;
}

/** Subtle trash button that turns red on hover. Stops row click propagation. */
export function DeleteButton({ theme, onClick, ariaLabel = "delete", size = 15 }: DeleteButtonProps) {
  const [hover, setHover] = useState(false);
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        // 44px touch box pulled back to a 26px layout footprint, so the target
        // meets the minimum without loosening the row rhythm.
        width: 44,
        height: 44,
        margin: -9,
        flexShrink: 0,
        borderRadius: 8,
        border: "none",
        background: hover ? `${DANGER}1f` : "transparent",
        color: hover ? DANGER : theme.textMuted,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "background 0.15s ease, color 0.15s ease",
      }}
    >
      <TrashIcon size={size} />
    </button>
  );
}
