"use client";

import type { Theme } from "@/lib/theme";

interface ConfirmDeleteDialogProps {
  theme: Theme;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  pending?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function ConfirmDeleteDialog({
  theme,
  title,
  description,
  confirmLabel = "ลบรายการ",
  cancelLabel = "ยกเลิก",
  pending = false,
  onCancel,
  onConfirm,
}: ConfirmDeleteDialogProps) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="cozy-dialog-backdrop"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 90,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 18,
        background: "rgba(51, 36, 24, 0.28)",
        backdropFilter: "blur(8px)",
      }}
      onClick={pending ? undefined : onCancel}
    >
      <div
        className="cozy-dialog-card"
        onClick={(event) => event.stopPropagation()}
        style={{
          width: "min(420px, calc(100vw - 28px))",
          borderRadius: 20,
          border: `1px solid ${theme.borderColor}`,
          background: theme.surface,
          color: theme.textPrimary,
          boxShadow: "0 18px 44px oklch(20% 0.02 90 / 0.22)",
          padding: 20,
        }}
      >
        <p style={{ margin: "0 0 6px", color: theme.textMuted, fontSize: 12, fontWeight: 900 }}>
          ยืนยันการลบ
        </p>
        <h2 className="font-display" style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>
          {title}
        </h2>
        <p style={{ margin: "10px 0 0", color: theme.textSecondary, fontSize: 14, lineHeight: 1.55 }}>
          {description}
        </p>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20 }}>
          <button
            type="button"
            onClick={onCancel}
            disabled={pending}
            style={{
              padding: "9px 14px",
              borderRadius: 12,
              border: `1px solid ${theme.borderColor}`,
              background: theme.inputBg,
              color: theme.textPrimary,
              fontSize: 14,
              fontWeight: 800,
              cursor: pending ? "default" : "pointer",
              opacity: pending ? 0.6 : 1,
            }}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={pending}
            style={{
              padding: "9px 14px",
              borderRadius: 12,
              border: "none",
              background: "oklch(56% 0.16 28)",
              color: "white",
              fontSize: 14,
              fontWeight: 900,
              cursor: pending ? "default" : "pointer",
              opacity: pending ? 0.7 : 1,
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            {pending && <span className="cozy-inline-spinner" aria-hidden />}
            {pending ? "กำลังลบ..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
