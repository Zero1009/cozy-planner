"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

const storageKey = "cozy-pwa-install-dismissed";

function isStandalone() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
}

interface PwaInstallPromptProps {
  variant?: "floating" | "inline";
  buttonStyle?: React.CSSProperties;
  onClick?: () => void;
}

export function PwaInstallPrompt({ variant = "floating", buttonStyle, onClick }: PwaInstallPromptProps) {
  const pathname = usePathname();
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (variant === "floating" && pathname !== "/" && pathname !== "/login" && pathname !== "/offline") {
      setVisible(false);
      return;
    }
    if (isStandalone()) return;
    if (variant === "floating" && localStorage.getItem(storageKey) === "1") return;
    setVisible(true);

    function onBeforeInstallPrompt(event: Event) {
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
      setVisible(true);
    }

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
  }, [pathname, variant]);

  if (!visible) return null;

  async function install() {
    onClick?.();
    if (!installEvent) {
      setDialogOpen(true);
      return;
    }

    await installEvent.prompt();
    const choice = await installEvent.userChoice;
    setInstallEvent(null);
    if (choice.outcome === "accepted") {
      setMessage("ติดตั้ง Cozy Planner แล้วครับ");
      setVisible(false);
    } else {
      setDialogOpen(true);
    }
  }

  function dismiss() {
    localStorage.setItem(storageKey, "1");
    setVisible(false);
  }

  return (
    <>
      <div style={variant === "floating" ? floatingContainerStyle : inlineContainerStyle}>
        <button
          type="button"
          onClick={install}
          style={buttonStyle ?? installButtonStyle}
        >
          ติดตั้งแอป
        </button>
        {variant === "floating" && (
          <button type="button" aria-label="ซ่อนปุ่มติดตั้ง" onClick={dismiss} style={dismissButtonStyle}>
            ×
          </button>
        )}
      </div>

      {message && <span role="status" style={{ position: "fixed", left: -9999 }}>{message}</span>}

      {dialogOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="ติดตั้ง Cozy Planner"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            display: "grid",
            placeItems: "center",
            padding: 18,
            background: "rgba(51, 36, 24, 0.28)",
            backdropFilter: "blur(8px)",
          }}
        >
          <section
            style={{
              width: "min(100%, 420px)",
              borderRadius: 24,
              border: "1px solid rgba(122, 93, 62, 0.18)",
              background: "#fffaf2",
              boxShadow: "0 22px 60px rgba(93, 65, 35, 0.22)",
              color: "#4a3a2a",
              padding: 22,
              fontFamily: "var(--font-quicksand), sans-serif",
            }}
          >
            <h2 className="font-display" style={{ margin: 0, fontSize: 24, color: "#5f3f2b" }}>
              ติดตั้ง Cozy Planner
            </h2>
            <p style={{ margin: "10px 0 0", color: "#6d5140", lineHeight: 1.6, fontSize: 14 }}>
              ถ้า browser ไม่เปิดหน้าต่างติดตั้งอัตโนมัติ ให้ใช้วิธีนี้ครับ
            </p>
            <ul style={{ margin: "14px 0", paddingLeft: 20, color: "#5d4635", lineHeight: 1.7, fontSize: 14 }}>
              <li>Chrome / Edge / Brave บน Mac: เปิดเมนู ⋮ หรือไอคอน install แล้วเลือก <strong>Install Cozy Planner</strong></li>
              <li>Safari บน Mac: เปิดเมนู <strong>File → Add to Dock</strong></li>
              <li>iPhone / iPad: กด Share แล้วเลือก <strong>Add to Home Screen</strong></li>
            </ul>
            <button
              type="button"
              onClick={() => setDialogOpen(false)}
              style={{
                width: "100%",
                border: "none",
                borderRadius: 14,
                background: "#78977e",
                color: "white",
                cursor: "pointer",
                fontSize: 15,
                fontWeight: 900,
                padding: "11px 14px",
              }}
            >
              เข้าใจแล้ว
            </button>
          </section>
        </div>
      )}
    </>
  );
}

const floatingContainerStyle: React.CSSProperties = {
  position: "fixed",
  right: 16,
  bottom: 16,
  zIndex: 95,
  display: "flex",
  alignItems: "center",
  gap: 8,
  padding: "8px 9px 8px 12px",
  borderRadius: 999,
  border: "1px solid rgba(122, 93, 62, 0.2)",
  background: "rgba(255, 250, 242, 0.94)",
  boxShadow: "0 12px 30px rgba(93, 65, 35, 0.18)",
  backdropFilter: "blur(12px)",
  fontFamily: "var(--font-quicksand), sans-serif",
};

const inlineContainerStyle: React.CSSProperties = {
  display: "contents",
};

const installButtonStyle: React.CSSProperties = {
  border: "none",
  borderRadius: 999,
  background: "#78977e",
  color: "white",
  cursor: "pointer",
  fontSize: 13,
  fontWeight: 900,
  padding: "8px 12px",
};

const dismissButtonStyle: React.CSSProperties = {
  width: 28,
  height: 28,
  border: "none",
  borderRadius: 999,
  background: "transparent",
  color: "#7a6a58",
  cursor: "pointer",
  fontSize: 18,
  lineHeight: 1,
};
