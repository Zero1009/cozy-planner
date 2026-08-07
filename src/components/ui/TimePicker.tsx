"use client";

import { useState } from "react";
import { TIME_SLOTS } from "@/lib/timeSlots";
import { ClockIcon } from "@/components/ui/icons";
import type { Theme } from "@/lib/theme";

interface TimePickerProps {
  theme: Theme;
  value: string;
  onChange: (time: string) => void;
}

/** Button that opens a dropdown grid of fixed 30-minute time slots. */
export function TimePicker({ theme, value, onChange }: TimePickerProps) {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          width: "100%",
          padding: "9px 12px",
          borderRadius: 11,
          border: `1px solid ${theme.borderColor}`,
          background: theme.inputBg,
          color: theme.textPrimary,
          fontSize: 14,
          textAlign: "left",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 7,
        }}
      >
        <ClockIcon size={14} style={{ color: theme.textMuted, flexShrink: 0 }} />
        {value}
      </button>
      {open && (
        <>
          <div
            onClick={() => setOpen(false)}
            style={{ position: "fixed", inset: 0, zIndex: 10 }}
          />
          <div
            style={{
              position: "absolute",
              top: "calc(100% + 6px)",
              left: 0,
              right: 0,
              zIndex: 11,
              maxHeight: 220,
              overflowY: "auto",
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 4,
              padding: 8,
              borderRadius: 12,
              border: `1px solid ${theme.borderColor}`,
              background: theme.surface,
              boxShadow: "0 12px 28px oklch(20% 0.02 90 / 0.18)",
            }}
          >
            {TIME_SLOTS.map((slot) => {
              const active = slot === value;
              return (
                <button
                  key={slot}
                  type="button"
                  onClick={() => {
                    onChange(slot);
                    setOpen(false);
                  }}
                  style={{
                    // Safari doesn't stretch <button> grid items to fill
                    // their column (Chromium does), leaving uneven columns.
                    width: "100%",
                    WebkitAppearance: "none",
                    appearance: "none",
                    padding: "6px 4px",
                    borderRadius: 8,
                    border: "none",
                    background: active ? theme.accentBg : "transparent",
                    color: active ? "white" : theme.textSecondary,
                    fontSize: 12.5,
                    fontWeight: active ? 700 : 500,
                    cursor: "pointer",
                  }}
                >
                  {slot}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
