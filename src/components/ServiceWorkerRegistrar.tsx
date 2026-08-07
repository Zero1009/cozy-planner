"use client";

import { useEffect } from "react";

export async function purgePwaCaches() {
  if (typeof window === "undefined") return;

  await Promise.all([
    "caches" in window ? caches.keys().then((keys) => Promise.all(keys.map((key) => caches.delete(key)))) : Promise.resolve([]),
    "serviceWorker" in navigator
      ? navigator.serviceWorker.getRegistration("/").then((registration) => {
          registration?.active?.postMessage({ type: "PURGE" });
        })
      : Promise.resolve(),
  ]);
}

export async function unsubscribePushNotifications() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
  const registration = await navigator.serviceWorker.getRegistration("/");
  const subscription = await registration?.pushManager.getSubscription();
  if (!subscription) return;
  await fetch("/api/push/subscribe", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ endpoint: subscription.endpoint }),
  }).catch(() => undefined);
  await subscription.unsubscribe().catch(() => undefined);
}

export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    const enabled = process.env.NODE_ENV === "production" || process.env.NEXT_PUBLIC_ENABLE_SW === "1";
    if (!enabled) return;

    navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch((err) => {
      console.warn("Cozy Planner service worker registration failed", err);
    });
  }, []);

  return null;
}
