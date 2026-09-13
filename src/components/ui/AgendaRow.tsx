import { DeleteButton } from "@/components/ui/DeleteButton";
import type { AgendaItem } from "@/lib/agenda";
import type { Theme } from "@/lib/theme";

interface AgendaRowProps {
  theme: Theme;
  item: AgendaItem;
  /** "regular" matches `DayAgenda`'s metrics, "compact" matches `SidePanelAgenda`'s. */
  size?: "compact" | "regular";
  /** `SidePanelAgenda` hides the category tag to save width; everyone else shows it. */
  showCategory?: boolean;
  onEdit: (item: AgendaItem) => void;
  onDelete: (item: AgendaItem) => void;
}

/**
 * One agenda row: dot, time, title, optional category tag, delete button.
 * Shared by `DayAgenda`, `SidePanelAgenda` and `DayDetailSheet`, which were
 * three copies of the same markup before this extraction.
 *
 * `div role="button"` + `tabIndex={0}` + Enter/Space is preserved exactly —
 * `tests/e2e/edit-items.spec.ts` locates rows by `div[role="button"]`.
 */
export function AgendaRow({
  theme,
  item,
  size = "regular",
  showCategory = true,
  onEdit,
  onDelete,
}: AgendaRowProps) {
  const compact = size === "compact";
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onEdit(item)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onEdit(item);
        }
      }}
      style={{
        display: "flex",
        alignItems: "center",
        gap: compact ? 8 : 10,
        padding: compact ? "7px 10px" : "9px 12px",
        borderRadius: compact ? 11 : 13,
        background: theme.inputBg,
        cursor: "pointer",
      }}
    >
      <span
        style={{
          width: compact ? 7 : 8,
          height: compact ? 7 : 8,
          borderRadius: "50%",
          background: item.dotColor,
          flexShrink: 0,
        }}
      />
      <span
        style={{
          fontSize: compact ? 11.5 : 12.5,
          color: theme.textMuted,
          width: compact ? 60 : 90,
          flexShrink: 0,
        }}
      >
        {item.time}
      </span>
      <span
        style={{
          flex: 1,
          fontSize: compact ? 13 : 14,
          color: theme.textPrimary,
          textDecoration: item.done ? "line-through" : "none",
          opacity: item.done ? 0.5 : 1,
          ...(compact
            ? { overflow: "hidden" as const, textOverflow: "ellipsis" as const, whiteSpace: "nowrap" as const }
            : null),
        }}
      >
        {item.title}
      </span>
      {showCategory && (
        <span
          style={{
            fontSize: 11.5,
            fontWeight: 700,
            padding: "3px 9px",
            borderRadius: 999,
            background: item.tagBg,
            color: item.tagColor,
            flexShrink: 0,
          }}
        >
          {item.categoryLabel}
        </span>
      )}
      <DeleteButton theme={theme} ariaLabel="delete item" size={compact ? 13 : 15} onClick={() => onDelete(item)} />
    </div>
  );
}
