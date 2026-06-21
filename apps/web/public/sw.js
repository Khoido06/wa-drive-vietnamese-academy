const CACHE = "wa-drive-v4";
const API_CACHE = "wa-drive-api-v1";
const OFFLINE_ASSETS = [
  "/",
  "/learn",
  "/exam",
  "/tutor",
  "/progress",
  "/manifest.json",
  "/icon.svg",
  "/offline/exam-wa-set-01.json",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(OFFLINE_ASSETS).catch(() => {})),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE && k !== API_CACHE).map((k) => caches.delete(k))),
    ),
  );
  self.clients.claim();
});

function isApiRequest(url) {
  return (
    url.pathname.startsWith("/learning/") ||
    url.pathname === "/learning/exam-sets" ||
    url.pathname === "/users"
  );
}

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);

  // Next.js hashed assets — always network (never serve stale JS/CSS)
  if (url.pathname.startsWith("/_next/")) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Offline exam bundle — cache first
  if (url.pathname.startsWith("/offline/")) {
    event.respondWith(
      caches.match(event.request).then(
        (cached) => cached ?? fetch(event.request).then((res) => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(CACHE).then((c) => c.put(event.request, clone));
          }
          return res;
        }),
      ),
    );
    return;
  }

  // Learning API — network first, fallback cache
  if (isApiRequest(url) || url.pathname.startsWith("/rag")) {
    event.respondWith(
      fetch(event.request)
        .then((res) => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(API_CACHE).then((c) => c.put(event.request, clone));
          }
          return res;
        })
        .catch(() => caches.match(event.request).then((c) => c ?? Response.error())),
    );
    return;
  }

  // App shell pages — network first, cache fallback for offline
  if (OFFLINE_ASSETS.includes(url.pathname)) {
    event.respondWith(
      fetch(event.request)
        .then((res) => {
          if (res.ok && url.origin === self.location.origin) {
            const clone = res.clone();
            caches.open(CACHE).then((cache) => cache.put(event.request, clone));
          }
          return res;
        })
        .catch(() => caches.match(event.request).then((c) => c ?? Response.error())),
    );
    return;
  }

  // Everything else — network only
  event.respondWith(fetch(event.request));
});

// Web Push — SM-2 review reminder
self.addEventListener("push", (event) => {
  let data = { title: "WA Drive", body: "Hôm nay bạn chưa ôn bài — mở app học 15 phút nhé!" };
  try {
    if (event.data) data = { ...data, ...event.data.json() };
  } catch {
    /* use defaults */
  }
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/icon.svg",
      badge: "/icon.svg",
      tag: "wa-review-reminder",
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      if (clients.length > 0) return clients[0].focus();
      return self.clients.openWindow("/learn");
    }),
  );
});
