"use client";

import { ClockIcon } from "@/components/ui/icons";
import type { Theme } from "@/lib/theme";

interface TimePickerProps {
  theme: Theme;
  value: string;
  onChange: (time: string) => void;
}

/**
 * Native `<input type="time">` dressed to match the surrounding fields.
 *
 * This replaced a custom dropdown of fixed 30-minute slots. That dropdown was
 * absolutely positioned under its trigger, and the trigger sits on the last row
 * of the add-event bottom sheet — so 207px of its 220px height landed below the
 * sheet and none of the 48 slots were reachable without scrolling twice. The
 * platform control has no such problem: iOS raises its own wheel, every minute
 * is selectable rather than only :00 and :30, and it comes with keyboard and
 * screen-reader support for free.
 */
export function TimePicker({ theme, value, onChange }: TimePickerProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 7,
        // 46 not 44: the input stretches to the content box, so the two 1px
        // borders have to come out of the wrapper for the field to hit 44.
        minHeight: 46,
        padding: "0 12px",
        borderRadius: 11,
        border: `1px solid ${theme.borderColor}`,
        background: theme.inputBg,
      }}
    >
      <ClockIcon size={14} style={{ color: theme.textMuted, flexShrink: 0 }} />
      <input
        className="cozy-time-input"
        type="time"
        value={value}
        // A cleared field reports "", which is not a time the event form can
        // submit — keep the last good value until the user picks a new one.
        onChange={(e) => {
          if (e.target.value) onChange(e.target.value);
        }}
        style={{
          flex: 1,
          minWidth: 0,
          alignSelf: "stretch",
          border: "none",
          background: "transparent",
          color: theme.textPrimary,
          fontSize: 14,
          padding: 0,
          outline: "none",
        }}
      />
    </div>
  );
}
