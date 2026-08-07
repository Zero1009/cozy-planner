const CACHE_NAME = "cozy-planner-static-v2";
const STATIC_ASSETS = [
  "/offline",
  "/favicon.png",
  "/cozy-planner-icon.png",
  "/icon-192.png",
  "/icon-512.png",
  "/icon-192-maskable.png",
  "/icon-512-maskable.png",
  "/cozy-loading-cat.gif",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type !== "PURGE") return;
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.map((key) => caches.delete(key)))));
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return;

  if (request.mode === "navigate") {
    event.respondWith(fetch(request).catch(() => caches.match("/offline")));
    return;
  }

  const isStaticAsset =
    url.pathname.startsWith("/_next/static/") ||
    STATIC_ASSETS.includes(url.pathname) ||
    url.pathname === "/manifest.webmanifest";

  if (!isStaticAsset) return;

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (!response.ok || response.redirected) return response;
        const cacheControl = response.headers.get("cache-control") ?? "";
        const vary = response.headers.get("vary") ?? "";
        if (/private|no-store/i.test(cacheControl) || /cookie/i.test(vary) || response.headers.has("set-cookie")) {
          return response;
        }
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        return response;
      });
    })
  );
});

self.addEventListener("push", (event) => {
  event.waitUntil(
    (async () => {
      let payload = {};
      try {
        payload = event.data ? event.data.json() : {};
      } catch {
        payload = {};
      }

      const title = cleanNotificationText(payload.title, "Cozy Planner", 80);
      const body = cleanNotificationText(payload.body, "มีการแจ้งเตือนใหม่ครับ", 160);
      const url = safeNotificationUrl(payload.url);

      await self.registration.showNotification(title, {
        body,
        icon: "/icon-192.png",
        badge: "/favicon.png",
        tag: url,
        data: { url },
      });
    })()
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = safeNotificationUrl(event.notification.data?.url);
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windows) => {
      const existing = windows.find((client) => new URL(client.url).origin === self.location.origin);
      if (existing) {
        existing.navigate(url);
        return existing.focus();
      }
      return clients.openWindow(url);
    })
  );
});

function cleanNotificationText(value, fallback, maxLength) {
  if (typeof value !== "string") return fallback;
  const trimmed = value.replace(/\s+/g, " ").trim();
  if (!trimmed) return fallback;
  return trimmed.length > maxLength ? `${trimmed.slice(0, maxLength - 1)}…` : trimmed;
}

function safeNotificationUrl(value) {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//")) return "/dashboard";
  try {
    const parsed = new URL(value, self.location.origin);
    return parsed.origin === self.location.origin ? `${parsed.pathname}${parsed.search}${parsed.hash}` : "/dashboard";
  } catch {
    return "/dashboard";
  }
}
