"use client";

import { useEffect, useMemo, useState } from "react";

type Status = "checking" | "unsupported" | "unconfigured" | "disabled" | "enabled" | "denied" | "error";

interface PushNotificationSettingsProps {
  buttonStyle?: React.CSSProperties;
  noteStyle?: React.CSSProperties;
}

function isStandalone() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
}

function isIosLike() {
  if (typeof navigator === "undefined") return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

function urlBase64ToUint8Array(value: string) {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  return Uint8Array.from([...raw].map((char) => char.charCodeAt(0)));
}

async function getActiveRegistration() {
  if (!("serviceWorker" in navigator)) return null;
  const registration = await navigator.serviceWorker.ready;
  return registration;
}

async function fetchVapidPublicKey() {
  const response = await fetch("/api/push/vapid");
  const data = (await response.json()) as { publicKey?: string | null; configured?: boolean };
  return data.configured && data.publicKey ? data.publicKey : null;
}

export function PushNotificationSettings({ buttonStyle, noteStyle }: PushNotificationSettingsProps) {
  const [status, setStatus] = useState<Status>("checking");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const needsIosInstall = useMemo(() => isIosLike() && !isStandalone(), []);

  useEffect(() => {
    let cancelled = false;
    async function check() {
      if (!("Notification" in window) || !("PushManager" in window) || !("serviceWorker" in navigator)) {
        if (!cancelled) setStatus("unsupported");
        return;
      }
      if (Notification.permission === "denied") {
        if (!cancelled) setStatus("denied");
        return;
      }
      const publicKey = await fetchVapidPublicKey().catch(() => null);
      if (!publicKey) {
        if (!cancelled) setStatus("unconfigured");
        return;
      }
      const registration = await getActiveRegistration().catch(() => null);
      const subscription = await registration?.pushManager.getSubscription();
      if (!cancelled) setStatus(subscription ? "enabled" : "disabled");
    }
    check();
    return () => {
      cancelled = true;
    };
  }, []);

  async function enable() {
    setBusy(true);
    setMessage("");
    try {
      if (needsIosInstall) {
        setStatus("unsupported");
        setMessage("บน iPhone/iPad กรุณา Add to Home Screen แล้วเปิดจากไอคอนแอปก่อนเปิดแจ้งเตือนครับ");
        return;
      }
      const permission = await Notification.requestPermission();
      if (permission === "denied") {
        setStatus("denied");
        setMessage("Browser บล็อกการแจ้งเตือนอยู่ กรุณาเปิดอนุญาตใน settings ของเว็บนี้ครับ");
        return;
      }
      if (permission !== "granted") {
        setStatus("disabled");
        setMessage("ยังไม่ได้อนุญาตการแจ้งเตือนครับ");
        return;
      }

      const publicKey = await fetchVapidPublicKey();
      if (!publicKey) {
        setStatus("unconfigured");
        setMessage("เซิร์ฟเวอร์ยังไม่ได้ตั้งค่า VAPID keys ครับ");
        return;
      }

      const registration = await getActiveRegistration();
      if (!registration) throw new Error("service worker ยังไม่พร้อม");
      const subscription =
        (await registration.pushManager.getSubscription()) ||
        (await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        }));

      const response = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subscription.toJSON()),
      });
      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error || "เปิดการแจ้งเตือนไม่สำเร็จ");
      }
      setStatus("enabled");
      setMessage("เปิดการแจ้งเตือนบนเครื่องนี้แล้วครับ");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "เปิดการแจ้งเตือนไม่สำเร็จครับ");
    } finally {
      setBusy(false);
    }
  }

  async function disable() {
    setBusy(true);
    setMessage("");
    try {
      const registration = await getActiveRegistration();
      const subscription = await registration?.pushManager.getSubscription();
      if (subscription) {
        await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        });
        await subscription.unsubscribe();
      }
      setStatus("disabled");
      setMessage("ปิดการแจ้งเตือนบนเครื่องนี้แล้วครับ");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "ปิดการแจ้งเตือนไม่สำเร็จครับ");
    } finally {
      setBusy(false);
    }
  }

  async function sendTest() {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/push/test", { method: "POST" });
      const data = (await response.json().catch(() => null)) as { error?: string; sent?: number } | null;
      if (!response.ok) throw new Error(data?.error || "ส่งแจ้งเตือนทดสอบไม่สำเร็จ");
      setMessage(data?.sent ? "ส่งแจ้งเตือนทดสอบแล้วครับ" : "ยังไม่มีอุปกรณ์ที่พร้อมรับแจ้งเตือนครับ");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "ส่งแจ้งเตือนทดสอบไม่สำเร็จครับ");
    } finally {
      setBusy(false);
    }
  }

  const label = status === "enabled" ? "ปิดแจ้งเตือน" : busy ? "กำลังตั้งค่า…" : "เปิดแจ้งเตือน";
  const disabled = busy || status === "checking" || status === "unsupported" || status === "unconfigured" || status === "denied";
  const note = message || statusNote(status, needsIosInstall);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <button
        type="button"
        onClick={status === "enabled" ? disable : enable}
        disabled={disabled}
        style={{ ...buttonStyle, opacity: disabled ? 0.68 : 1, cursor: disabled ? "not-allowed" : buttonStyle?.cursor ?? "pointer" }}
      >
        {label}
      </button>
      {status === "enabled" && (
        <button type="button" onClick={sendTest} disabled={busy} style={buttonStyle}>
          ทดสอบแจ้งเตือน
        </button>
      )}
      <span role="status" style={noteStyle ?? { fontSize: 11, lineHeight: 1.45, opacity: 0.78 }}>
        {note}
      </span>
    </div>
  );
}

function statusNote(status: Status, needsIosInstall: boolean) {
  if (needsIosInstall) return "iPhone/iPad ต้อง Add to Home Screen และเปิดจากไอคอนแอปก่อนครับ";
  if (status === "checking") return "กำลังตรวจสถานะการแจ้งเตือน…";
  if (status === "unsupported") return "Browser นี้ยังไม่รองรับ Web Push ครับ";
  if (status === "unconfigured") return "รอตั้งค่า VAPID keys บนเซิร์ฟเวอร์ก่อนใช้งานครับ";
  if (status === "denied") return "Browser บล็อก notification อยู่ ต้องเปิดใน settings ของเว็บนี้ครับ";
  if (status === "enabled") return "เครื่องนี้พร้อมรับแจ้งเตือนแล้วครับ";
  return "เปิดเพื่อให้มือถือ/เครื่องนี้รับแจ้งเตือนจาก Cozy Planner";
}
