"use client";

import { CATEGORIES } from "@/db/schema";
import { catLabel, t } from "@/lib/i18n";
import { CATEGORY_COLORS } from "@/lib/theme";
import type { Theme } from "@/lib/theme";
import type { Category, Lang } from "@/lib/types";

const CATEGORY_ORDER: Category[] = [
  "personal",
  "work",
  "shift",
  "health",
  "study",
  "other",
];

interface CategoryChipsProps {
  theme: Theme;
  lang: Lang;
  value: Category;
  onChange: (c: Category) => void;
  customLabel: string;
  onCustomLabelChange: (s: string) => void;
}

export function CategoryChips({
  theme,
  lang,
  value,
  onChange,
  customLabel,
  onCustomLabelChange,
}: CategoryChipsProps) {
  // Keep TS happy about exhaustive membership even though CATEGORIES is the
  // source of truth; CATEGORY_ORDER is just a display order over it.
  const order = CATEGORY_ORDER.filter((c) => (CATEGORIES as readonly string[]).includes(c));

  return (
    <div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {order.map((cat) => {
          const active = cat === value;
          const colors = CATEGORY_COLORS[cat];
          return (
            <button
              key={cat}
              type="button"
              onClick={() => onChange(cat)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 12px",
                borderRadius: 999,
                border: active
                  ? `1.5px solid ${theme.accentBg}`
                  : `1px solid ${theme.borderColor}`,
                background: active ? theme.accentTint : theme.chipBg,
                color: active ? theme.textPrimary : theme.textSecondary,
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: colors.dot,
                  display: "inline-block",
                }}
              />
              {catLabel(lang, cat)}
            </button>
          );
        })}
      </div>
      {value === "other" && (
        <input
          value={customLabel}
          onChange={(e) => onCustomLabelChange(e.target.value)}
          placeholder={t(lang, "customTypePlaceholder")}
          style={{
            marginTop: 8,
            width: "100%",
            padding: "9px 12px",
            borderRadius: 11,
            border: `1px solid ${theme.borderColor}`,
            background: theme.inputBg,
            color: theme.textPrimary,
            fontSize: 14,
            outline: "none",
          }}
        />
      )}
    </div>
  );
}
