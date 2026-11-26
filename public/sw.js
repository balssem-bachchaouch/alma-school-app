const CACHE = "alma-v3";
const PRECACHE = [
  "/",
  "/devoirs",
  "/taches",
  "/planning",
  "/pomodoro",
  "/flashcards",
  "/defis",
  "/badges",
  "/stats",
  "/moyenne",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECACHE).catch(() => {})));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  if (e.request.mode === "navigate") return;
  if (e.request.url.includes("/api/")) return;
  e.respondWith(
    caches.match(e.request).then((cached) => {
      const fetchPromise = fetch(e.request).then((res) => {
        if (res && res.status === 200 && res.type === "basic") {
          const clone = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, clone));
        }
        return res;
      }).catch(() => cached);
      return cached ?? fetchPromise;
    })
  );
});

// Push notifications
self.addEventListener("push", (e) => {
  const data = e.data?.json() ?? { title: "ALMA", body: "Tu as des devoirs à faire !" };
  e.waitUntil(
    self.registration.showNotification(data.title ?? "ALMA", {
      body: data.body,
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      tag: "alma-reminder",
      data: { url: data.url ?? "/" },
    })
  );
});

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  e.waitUntil(
    clients.openWindow(e.notification.data?.url ?? "/")
  );
});

// Allow scheduling local reminders via postMessage
self.addEventListener("message", (e) => {
  if (e.data?.type === "SCHEDULE_REMINDER") {
    const { title, body, delay } = e.data;
    setTimeout(() => {
      self.registration.showNotification(title, {
        body,
        icon: "/icon-192.png",
        tag: "alma-reminder",
      });
    }, delay ?? 0);
  }
});
