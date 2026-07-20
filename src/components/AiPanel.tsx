"use client";

import { useEffect, useRef, useState } from "react";
import { CloseIcon, SendIcon, SparkleIcon } from "@/components/ui/icons";
import { postJSON } from "@/lib/api";
import { STRINGS, t } from "@/lib/i18n";
import type { Theme } from "@/lib/theme";
import type { ChatMessage, Lang } from "@/lib/types";

interface AiPanelProps {
  theme: Theme;
  lang: Lang;
  isDesktop: boolean;
  open: boolean;
  onClose: () => void;
}

export function AiPanel({ theme, lang, isDesktop, open, onClose }: AiPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{ role: "assistant", content: STRINGS[lang].aiWelcome }]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages, pending]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || pending) return;

    const next: ChatMessage[] = [...messages, { role: "user", content: trimmed }];
    setMessages(next);
    setInput("");
    setPending(true);

    try {
      const res = await postJSON<{ reply: string }>("/api/ai", { lang, messages: next });
      setMessages((prev) => [...prev, { role: "assistant", content: res.reply }]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: STRINGS[lang].aiError }]);
    } finally {
      setPending(false);
    }
  }

  if (!open) return null;

  const quickActions: string[] = [
    t(lang, "quickSummary"),
    t(lang, "quickToday"),
    t(lang, "quickAdd"),
  ];

  const panelStyle = isDesktop
    ? {
        position: "fixed" as const,
        top: 0,
        right: 0,
        bottom: 0,
        width: 380,
        maxWidth: "100vw",
      }
    : {
        position: "fixed" as const,
        left: 0,
        right: 0,
        bottom: 0,
        height: "82vh",
        borderTopLeftRadius: 22,
        borderTopRightRadius: 22,
      };

  return (
    <>
      <div
        onClick={onClose}
        style={{ position: "fixed", inset: 0, background: "oklch(20% 0.02 90 / 0.28)", zIndex: 49 }}
      />
      <div
        style={{
          ...panelStyle,
          zIndex: 50,
          background: theme.surface,
          borderLeft: isDesktop ? `1px solid ${theme.borderColor}` : undefined,
          borderTop: !isDesktop ? `1px solid ${theme.borderColor}` : undefined,
          boxShadow: "-8px 0 28px oklch(20% 0.02 90 / 0.18)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "14px 16px",
            borderBottom: `1px solid ${theme.divider}`,
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <SparkleIcon size={18} style={{ color: theme.accentBg }} />
            <h2 className="font-display" style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>
              {t(lang, "aiTitle")}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="close"
            style={{
              width: 30,
              height: 30,
              borderRadius: 9,
              border: "none",
              background: theme.chipBg,
              color: theme.textPrimary,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <CloseIcon size={13} />
          </button>
        </div>

        <div
          ref={listRef}
          style={{
            flex: 1,
            overflowY: "auto",
            padding: 16,
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          {messages.map((m, i) => (
            <div
              key={i}
              style={{
                alignSelf: m.role === "user" ? "flex-end" : "flex-start",
                maxWidth: "82%",
                padding: "9px 13px",
                borderRadius: 15,
                background: m.role === "user" ? theme.accentBg : theme.chipBg,
                color: m.role === "user" ? "white" : theme.textPrimary,
                fontSize: 14,
                lineHeight: 1.45,
                whiteSpace: "pre-wrap",
              }}
            >
              {m.content}
            </div>
          ))}

          {pending && (
            <div
              style={{
                alignSelf: "flex-start",
                display: "flex",
                gap: 4,
                padding: "11px 14px",
                borderRadius: 15,
                background: theme.chipBg,
              }}
            >
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: theme.textMuted,
                    display: "inline-block",
                    animation: "typingBounce 1.2s infinite",
                    animationDelay: `${i * 0.15}s`,
                  }}
                />
              ))}
            </div>
          )}
        </div>

        <div style={{ padding: "10px 14px 6px", display: "flex", gap: 6, flexWrap: "wrap", flexShrink: 0 }}>
          {quickActions.map((label) => (
            <button
              key={label}
              type="button"
              onClick={() => send(label)}
              disabled={pending}
              style={{
                padding: "6px 11px",
                borderRadius: 999,
                border: `1px solid ${theme.borderColor}`,
                background: theme.inputBg,
                color: theme.textSecondary,
                fontSize: 12,
                fontWeight: 600,
                cursor: pending ? "default" : "pointer",
              }}
            >
              {label}
            </button>
          ))}
        </div>

        <div
          style={{
            display: "flex",
            gap: 8,
            padding: "10px 14px 16px",
            flexShrink: 0,
            borderTop: `1px solid ${theme.divider}`,
          }}
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") send(input);
            }}
            placeholder={t(lang, "aiPlaceholder")}
            style={{
              flex: 1,
              padding: "10px 14px",
              borderRadius: 12,
              border: `1px solid ${theme.borderColor}`,
              background: theme.inputBg,
              color: theme.textPrimary,
              fontSize: 14,
              outline: "none",
            }}
          />
          <button
            type="button"
            onClick={() => send(input)}
            disabled={pending}
            style={{
              width: 42,
              height: 42,
              flexShrink: 0,
              borderRadius: 12,
              border: "none",
              background: theme.accentBg,
              color: "white",
              cursor: pending ? "default" : "pointer",
              opacity: pending ? 0.6 : 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <SendIcon size={16} />
          </button>
        </div>
      </div>
    </>
  );
}
