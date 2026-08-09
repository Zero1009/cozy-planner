"use client";

import { useEffect, useRef, useState } from "react";
import { CloseIcon, SendIcon, SparkleIcon } from "@/components/ui/icons";
import { MarkdownMessage } from "@/components/MarkdownMessage";
import { useCreateEvent } from "@/hooks/useEvents";
import { postJSON } from "@/lib/api";
import type { AiAction } from "@/lib/ai-actions";
import { fromISO, longDateLabel, toISO } from "@/lib/dates";
import { labelFor, STRINGS, t } from "@/lib/i18n";
import type { Theme } from "@/lib/theme";
import type { ChatMessage, Lang } from "@/lib/types";

type ActionState = "pending" | "creating" | "created" | "dismissed";

interface ChatReply {
  reply: string;
  actions?: AiAction[];
}

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
  const [error, setError] = useState<string | null>(null);
  const [actionStates, setActionStates] = useState<Record<string, ActionState>>({});
  const [actionErrors, setActionErrors] = useState<Record<string, string>>({});
  const [mobileViewport, setMobileViewport] = useState<{ height?: number; bottom: number }>({ bottom: 0 });
  const createEvent = useCreateEvent();
  const listRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{ role: "assistant", content: STRINGS[lang].aiWelcome }]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages, pending]);

  useEffect(() => {
    if (!open || isDesktop) return;
    const updateViewport = () => {
      const viewport = window.visualViewport;
      if (!viewport) {
        setMobileViewport({ bottom: 0 });
        return;
      }
      const bottom = Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop);
      setMobileViewport({ height: Math.max(360, Math.floor(viewport.height - 12)), bottom });
    };

    updateViewport();
    window.visualViewport?.addEventListener("resize", updateViewport);
    window.visualViewport?.addEventListener("scroll", updateViewport);
    window.addEventListener("orientationchange", updateViewport);
    return () => {
      window.visualViewport?.removeEventListener("resize", updateViewport);
      window.visualViewport?.removeEventListener("scroll", updateViewport);
      window.removeEventListener("orientationchange", updateViewport);
    };
  }, [isDesktop, open]);

  // Touch devices force the composer to 16px (see globals.css) to stop iOS from
  // zooming on focus, which needs a taller row than the 14px desktop text.
  const composerHeight = isDesktop ? 42 : 46;

  function resizeComposer(el = textareaRef.current) {
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }

  function resetComposerHeight() {
    requestAnimationFrame(() => {
      if (textareaRef.current) textareaRef.current.style.height = `${composerHeight}px`;
    });
  }

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || pending) return;

    const next: ChatMessage[] = [...messages, { role: "user", content: trimmed }];
    const apiMessages = next.map(({ role, content }) => ({ role, content }));
    setMessages(next);
    setInput("");
    resetComposerHeight();
    setError(null);
    setPending(true);

    try {
      const res = await postJSON<ChatReply>("/api/ai", {
        lang,
        clientToday: toISO(new Date()),
        messages: apiMessages,
      });
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: res.reply, actions: res.actions?.length ? res.actions : undefined },
      ]);
    } catch {
      setError(STRINGS[lang].aiError);
    } finally {
      setPending(false);
    }
  }

  async function confirmAction(key: string, action: AiAction) {
    if (actionStates[key] === "creating" || actionStates[key] === "created") return;
    setActionStates((prev) => ({ ...prev, [key]: "creating" }));
    setActionErrors((prev) => ({ ...prev, [key]: "" }));

    try {
      await createEvent.mutateAsync(action.event);
      setActionStates((prev) => ({ ...prev, [key]: "created" }));
    } catch {
      setActionStates((prev) => ({ ...prev, [key]: "pending" }));
      setActionErrors((prev) => ({ ...prev, [key]: t(lang, "aiCreateFailed") }));
    }
  }

  function dismissAction(key: string) {
    setActionStates((prev) => ({ ...prev, [key]: "dismissed" }));
    setActionErrors((prev) => ({ ...prev, [key]: "" }));
  }

  if (!open) return null;

  const quickActions: string[] = [
    t(lang, "quickSummary"),
    t(lang, "quickToday"),
    t(lang, "quickAdd"),
    lang === "th" ? "ช่วยจัดลำดับความสำคัญวันนี้" : "Prioritize today",
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
        bottom: mobileViewport.bottom,
        height: mobileViewport.height ? `${mobileViewport.height}px` : "82dvh",
        maxHeight: "calc(100dvh - 12px)",
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
        role="dialog"
        aria-modal="true"
        aria-label={t(lang, "aiTitle")}
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
              width: isDesktop ? 30 : 44,
              height: isDesktop ? 30 : 44,
              flexShrink: 0,
              borderRadius: isDesktop ? 9 : 12,
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
          role="log"
          aria-live="polite"
          aria-busy={pending}
          style={{
            flex: 1,
            minHeight: 0,
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
                minWidth: 0,
                padding: "9px 13px",
                borderRadius: 15,
                background: m.role === "user" ? theme.accentBg : theme.chipBg,
                color: m.role === "user" ? "white" : theme.textPrimary,
                fontSize: 14,
                lineHeight: 1.45,
                whiteSpace: m.role === "user" ? "pre-wrap" : undefined,
                overflowWrap: "anywhere",
              }}
            >
              {m.role === "assistant" ? (
                <>
                  <MarkdownMessage content={m.content} theme={theme} />
                  {m.actions?.map((action, actionIndex) => {
                    const key = `${i}-${actionIndex}`;
                    const state = actionStates[key] ?? "pending";
                    if (state === "dismissed") return null;
                    return (
                      <EventDraftCard
                        key={key}
                        action={action}
                        state={state}
                        error={actionErrors[key]}
                        theme={theme}
                        lang={lang}
                        onConfirm={() => confirmAction(key, action)}
                        onDismiss={() => dismissAction(key)}
                      />
                    );
                  })}
                </>
              ) : (
                m.content
              )}
            </div>
          ))}

          {error && (
            <div
              role="alert"
              style={{
                alignSelf: "flex-start",
                maxWidth: "88%",
                padding: "9px 13px",
                borderRadius: 15,
                border: "1px solid oklch(72% 0.12 28)",
                background: "oklch(96% 0.035 28)",
                color: "oklch(42% 0.12 28)",
                fontSize: 13,
                fontWeight: 700,
                lineHeight: 1.45,
              }}
            >
              {error}
            </div>
          )}

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
                minHeight: isDesktop ? undefined : 44,
                padding: isDesktop ? "6px 11px" : "8px 14px",
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
            alignItems: "flex-end",
            minWidth: 0,
            padding: "10px 14px calc(16px + env(safe-area-inset-bottom))",
            flexShrink: 0,
            borderTop: `1px solid ${theme.divider}`,
          }}
        >
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              resizeComposer(e.target);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                send(input);
              }
            }}
            placeholder={t(lang, "aiPlaceholder")}
            rows={1}
            style={{
              flex: 1,
              minWidth: 0,
              width: "100%",
              padding: "10px 14px",
              borderRadius: 12,
              border: `1px solid ${theme.borderColor}`,
              background: theme.inputBg,
              color: theme.textPrimary,
              fontSize: 14,
              lineHeight: 1.35,
              minHeight: composerHeight,
              height: composerHeight,
              maxHeight: 120,
              boxSizing: "border-box",
              overflowY: "auto",
              resize: "none",
              outline: "none",
            }}
          />
          <button
            type="button"
            onClick={() => send(input)}
            disabled={pending || !input.trim()}
            aria-label={lang === "th" ? "ส่งข้อความ" : "Send message"}
            style={{
              width: composerHeight,
              height: composerHeight,
              flexShrink: 0,
              borderRadius: 12,
              border: "none",
              background: theme.accentBg,
              color: "white",
              cursor: pending || !input.trim() ? "default" : "pointer",
              opacity: pending || !input.trim() ? 0.6 : 1,
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

function EventDraftCard({
  action,
  state,
  error,
  theme,
  lang,
  onConfirm,
  onDismiss,
}: {
  action: AiAction;
  state: ActionState;
  error?: string;
  theme: Theme;
  lang: Lang;
  onConfirm: () => void;
  onDismiss: () => void;
}) {
  const event = action.event;
  const timeLabel = event.endTime ? `${event.time}–${event.endTime}` : event.time;
  const disabled = state === "creating" || state === "created";

  return (
    <div
      style={{
        marginTop: 10,
        padding: 12,
        borderRadius: 14,
        border: `1px solid ${theme.borderColor}`,
        background: theme.surface,
        boxShadow: "0 8px 18px oklch(20% 0.02 90 / 0.08)",
      }}
    >
      <div style={{ color: theme.textMuted, fontSize: 12, fontWeight: 800, marginBottom: 6 }}>
        {t(lang, "aiDraftTitle")}
      </div>
      <div style={{ color: theme.textPrimary, fontSize: 15, fontWeight: 800, overflowWrap: "anywhere" }}>
        {event.title}
      </div>
      <div style={{ color: theme.textSecondary, fontSize: 12.5, fontWeight: 650, marginTop: 5 }}>
        {longDateLabel(fromISO(event.date), lang)} · {timeLabel}
      </div>
      <div
        style={{
          display: "inline-flex",
          marginTop: 8,
          padding: "4px 9px",
          borderRadius: 999,
          background: theme.chipBg,
          color: theme.textSecondary,
          fontSize: 12,
          fontWeight: 750,
        }}
      >
        {labelFor(lang, event.category, event.customCategoryLabel)}
      </div>
      {error && (
        <div role="alert" style={{ color: "oklch(42% 0.12 28)", fontSize: 12.5, fontWeight: 750, marginTop: 8 }}>
          {error}
        </div>
      )}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
        <button
          type="button"
          onClick={onConfirm}
          disabled={disabled}
          style={{
            flex: "1 1 130px",
            minHeight: 44,
            borderRadius: 11,
            border: "none",
            background: state === "created" ? "oklch(58% 0.12 145)" : theme.accentBg,
            color: "white",
            cursor: disabled ? "default" : "pointer",
            opacity: state === "creating" ? 0.78 : 1,
            fontSize: 13,
            fontWeight: 800,
          }}
        >
          {state === "created" ? `✓ ${t(lang, "aiCreated")}` : state === "creating" ? t(lang, "saving") : t(lang, "aiConfirm")}
        </button>
        {state !== "created" && (
          <button
            type="button"
            onClick={onDismiss}
            disabled={state === "creating"}
            style={{
              flex: "0 1 96px",
              minHeight: 44,
              borderRadius: 11,
              border: `1px solid ${theme.borderColor}`,
              background: theme.inputBg,
              color: theme.textSecondary,
              cursor: state === "creating" ? "default" : "pointer",
              fontSize: 13,
              fontWeight: 800,
            }}
          >
            {t(lang, "aiDismiss")}
          </button>
        )}
      </div>
    </div>
  );
}
