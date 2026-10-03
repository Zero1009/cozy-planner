"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  CloseButton,
  Field,
  Message,
  cardStyle,
  inputStyle,
  primaryButtonStyle,
} from "@/components/AccountDialogs";
import { postForm, postJSON } from "@/lib/api";
import { dowShort, monthNames, pad } from "@/lib/dates";
import type { RosterEntry, RosterPreview, RosterSection } from "@/lib/roster";
import type { CurrentUser } from "@/lib/session";
import { CATEGORY_COLORS, type Theme } from "@/lib/theme";

interface RosterImportDialogProps {
  theme: Theme;
  user: CurrentUser;
  onClose: () => void;
}

type PreviewResponse =
  | { status: "ok"; preview: RosterPreview }
  | { status: "pick"; candidates: { key: string; name: string }[] };

/** Remembers the name typed last time, so next month is one tap. Per-device only. */
const NAME_KEY = "cozy.rosterName";

function rememberedName(fallback: string): string {
  try {
    return localStorage.getItem(NAME_KEY) || fallback;
  } catch {
    return fallback;
  }
}

export function RosterImportDialog({ theme, user, onClose }: RosterImportDialogProps) {
  const qc = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [query, setQuery] = useState(() => rememberedName(user.displayName));
  const [candidates, setCandidates] = useState<{ key: string; name: string }[] | null>(null);
  const [preview, setPreview] = useState<RosterPreview | null>(null);
  const [enabled, setEnabled] = useState<Record<number, boolean>>({});
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [done, setDone] = useState(false);

  function reset() {
    setCandidates(null);
    setPreview(null);
    setMessage("");
    setDone(false);
  }

  async function read(personKey?: string) {
    if (pending || !file) return;
    reset();
    setPending(true);
    try {
      const form = new FormData();
      form.set("file", file);
      form.set("query", query);
      if (personKey) form.set("person", personKey);
      const data = await postForm<PreviewResponse>("/api/roster/preview", form);
      if (data.status === "pick") {
        setCandidates(data.candidates);
        return;
      }
      setPreview(data.preview);
      setEnabled(Object.fromEntries(data.preview.sections.map((s) => [s.tableIndex, s.suggested])));
      try {
        localStorage.setItem(NAME_KEY, query.trim());
      } catch {
        /* storage unavailable — only a convenience */
      }
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "อ่านตารางเวรไม่สำเร็จ");
    } finally {
      setPending(false);
    }
  }

  const chosen = useMemo(
    () => (preview?.sections ?? []).filter((s) => enabled[s.tableIndex]).flatMap((s) => s.entries),
    [preview, enabled]
  );

  async function importNow() {
    if (pending || chosen.length === 0) return;
    setMessage("");
    setPending(true);
    try {
      const events = chosen.map(({ endTime, ...e }) => (endTime ? { ...e, endTime } : e));
      const result = await postJSON<{ added: number; skipped: number }>("/api/events/import", { events });
      await qc.invalidateQueries({ queryKey: ["events"] });
      setDone(true);
      setMessage(
        result.added > 0
          ? `เพิ่ม ${result.added} รายการลงปฏิทินแล้วครับ` +
              (result.skipped ? ` (ข้าม ${result.skipped} รายการที่มีอยู่แล้ว)` : "")
          : `ทุกรายการมีอยู่ในปฏิทินแล้ว ไม่ได้เพิ่มอะไรครับ`
      );
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "นำเข้าไม่สำเร็จ");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="cozy-dialog-backdrop" role="dialog" aria-modal="true" aria-label="นำเข้าตารางเวร">
      <div className="cozy-dialog-card" style={{ ...cardStyle(theme), maxWidth: 560 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
          <div>
            <p style={{ margin: "0 0 4px", color: theme.textMuted, fontSize: 12, fontWeight: 800 }}>
              จากไฟล์ Excel ของวอร์ด
            </p>
            <h2 className="font-display" style={{ margin: 0, color: theme.textPrimary, fontSize: 24 }}>
              นำเข้าตารางเวร
            </h2>
          </div>
          <CloseButton theme={theme} onClick={onClose} />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 18 }}>
          <Field label="ไฟล์ตารางเวร (.xlsx)" theme={theme}>
            <input
              type="file"
              accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              onChange={(e) => {
                setFile(e.target.files?.[0] ?? null);
                reset();
              }}
              style={{ ...inputStyle(theme), height: "auto", padding: "10px 12px" }}
            />
          </Field>
          <Field label="ชื่อของคุณในตาราง" theme={theme}>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && read()}
              placeholder="เช่น ทิพยรัตน์"
              style={inputStyle(theme)}
            />
          </Field>
          <button
            type="button"
            onClick={() => read()}
            disabled={pending || !file || !query.trim()}
            style={primaryButtonStyle(theme, pending || !file || !query.trim())}
          >
            {pending && !preview ? "กำลังอ่าน..." : "อ่านตารางเวร"}
          </button>
        </div>

        {candidates && (
          <div style={{ marginTop: 16 }}>
            <p style={{ margin: "0 0 8px", color: theme.textSecondary, fontSize: 13, fontWeight: 800 }}>
              พบหลายชื่อที่ตรงกัน — เลือกชื่อของคุณ
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {candidates.map((c) => (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => read(c.key)}
                  style={{
                    minHeight: 44,
                    padding: "8px 12px",
                    textAlign: "left",
                    borderRadius: 12,
                    border: `1px solid ${theme.borderColor}`,
                    background: theme.inputBg,
                    color: theme.textPrimary,
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {preview && (
          <PreviewPanel theme={theme} preview={preview} enabled={enabled} setEnabled={setEnabled} />
        )}

        {message && <Message theme={theme} text={message} />}

        {preview && (
          <button
            type="button"
            onClick={done ? onClose : importNow}
            disabled={pending || (!done && chosen.length === 0)}
            style={{ ...primaryButtonStyle(theme, pending || (!done && chosen.length === 0)), width: "100%", marginTop: 12 }}
          >
            {done ? "เสร็จแล้ว" : pending ? "กำลังนำเข้า..." : `นำเข้า ${chosen.length} รายการ`}
          </button>
        )}
      </div>
    </div>
  );
}

function PreviewPanel({
  theme,
  preview,
  enabled,
  setEnabled,
}: {
  theme: Theme;
  preview: RosterPreview;
  enabled: Record<number, boolean>;
  setEnabled: (fn: (prev: Record<number, boolean>) => Record<number, boolean>) => void;
}) {
  const { year, month } = preview;
  const daysInMonth = new Date(year, month, 0).getDate();

  const byDate = new Map<string, RosterEntry[]>();
  for (const s of preview.sections) {
    if (!enabled[s.tableIndex]) continue;
    for (const e of s.entries) byDate.set(e.date, [...(byDate.get(e.date) ?? []), e]);
  }

  return (
    <div style={{ marginTop: 18, borderTop: `1px solid ${theme.divider}`, paddingTop: 14 }}>
      <h3 style={{ margin: 0, color: theme.textPrimary, fontSize: 16 }}>{preview.name}</h3>
      <p style={{ margin: "2px 0 12px", color: theme.textMuted, fontSize: 13, fontWeight: 700 }}>
        {monthNames("th")[month - 1]} {year + 543}
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {preview.sections.map((s) => (
          <SectionToggle
            key={s.tableIndex}
            theme={theme}
            section={s}
            on={!!enabled[s.tableIndex]}
            toggle={() => setEnabled((prev) => ({ ...prev, [s.tableIndex]: !prev[s.tableIndex] }))}
          />
        ))}
      </div>

      <div
        style={{
          marginTop: 12,
          maxHeight: 260,
          overflow: "auto",
          borderRadius: 12,
          border: `1px solid ${theme.borderColor}`,
          background: theme.inputBg,
        }}
      >
        {Array.from({ length: daysInMonth }, (_, i) => {
          const date = `${year}-${pad(month)}-${pad(i + 1)}`;
          const entries = byDate.get(date) ?? [];
          return (
            <div
              key={date}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "6px 10px",
                borderTop: i === 0 ? "none" : `1px solid ${theme.divider}`,
              }}
            >
              <span style={{ width: 52, flexShrink: 0, color: theme.textMuted, fontSize: 12, fontWeight: 800 }}>
                {i + 1} {dowShort("th")[new Date(year, month - 1, i + 1).getDay()]}
              </span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                {entries.map((e, j) => (
                  <EntryChip key={j} entry={e} />
                ))}
                {entries.length === 0 && <span style={{ color: theme.textMuted, fontSize: 12 }}>—</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SectionToggle({
  theme,
  section,
  on,
  toggle,
}: {
  theme: Theme;
  section: RosterSection;
  on: boolean;
  toggle: () => void;
}) {
  const c = section.counts;
  const parts = [
    c.morning && `ช ${c.morning}`,
    c.afternoon && `บ ${c.afternoon}`,
    c.night && `ด ${c.night}`,
    c.off && `หยุด ${c.off}`,
    c.leave && `ลา ${c.leave}`,
    c.other && `อื่นๆ ${c.other}`,
  ].filter(Boolean);

  return (
    <div style={{ padding: 10, borderRadius: 12, border: `1px solid ${theme.borderColor}`, background: theme.chipBg }}>
      <button
        type="button"
        role="checkbox"
        aria-checked={on}
        onClick={toggle}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          width: "100%",
          padding: 0,
          border: "none",
          background: "transparent",
          color: theme.textPrimary,
          textAlign: "left",
          cursor: "pointer",
        }}
      >
        <span
          aria-hidden="true"
          style={{
            width: 18,
            height: 18,
            flexShrink: 0,
            borderRadius: 5,
            border: `1.5px solid ${on ? theme.accentDark : theme.borderColor}`,
            background: on ? theme.accentBg : theme.inputBg,
            color: "white",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 12,
          }}
        >
          {on ? "✓" : ""}
        </span>
        <span style={{ flex: 1, minWidth: 0 }}>
          <strong style={{ fontSize: 14 }}>{section.label}</strong>
          <span style={{ display: "block", color: theme.textSecondary, fontSize: 12, fontWeight: 700 }}>
            {parts.join(" · ")}
          </span>
        </span>
        {section.totalsMatch && (
          <span
            style={{
              padding: "3px 8px",
              borderRadius: 999,
              background: theme.accentTint,
              color: theme.textPrimary,
              fontSize: 11,
              fontWeight: 800,
              whiteSpace: "nowrap",
            }}
          >
            ตรงกับยอดในไฟล์ ✓
          </span>
        )}
      </button>
      {section.warnings.map((w) => (
        <p key={w} style={{ margin: "8px 0 0 28px", color: CATEGORY_COLORS.personal.dot, fontSize: 12, fontWeight: 700, lineHeight: 1.45 }}>
          ⚠ {w}
        </p>
      ))}
    </div>
  );
}

function EntryChip({ entry }: { entry: RosterEntry }) {
  const colors = CATEGORY_COLORS[entry.category];
  return (
    <span
      title={entry.endTime ? `${entry.time}–${entry.endTime}` : undefined}
      style={{
        padding: "2px 8px",
        borderRadius: 999,
        background: colors.bg,
        color: colors.color,
        fontSize: 12,
        fontWeight: 800,
      }}
    >
      {entry.title}
    </span>
  );
}
