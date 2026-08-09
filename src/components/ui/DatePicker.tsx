"use client";

import { CalendarIcon } from "@/components/ui/icons";
import type { Theme } from "@/lib/theme";

interface DatePickerProps {
  theme: Theme;
  value: string;
  onChange: (date: string) => void;
}

/**
 * Native `<input type="date">` wearing the same chrome as {@link TimePicker},
 * so a date and a time sitting side by side read as one pair rather than two
 * different controls.
 */
export function DatePicker({ theme, value, onChange }: DatePickerProps) {
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
      <CalendarIcon size={14} style={{ color: theme.textMuted, flexShrink: 0 }} />
      <input
        className="cozy-native-field"
        type="date"
        value={value}
        // A cleared field reports "", which is not a date the form can submit —
        // keep the last good value until the user picks a new one.
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
