const CACHE_NAME = "upnextbudgeting-v8";
const ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./assets/app-chunks/app.01.js",
  "./assets/app-chunks/app.02.js",
  "./assets/app-chunks/app.03.js",
  "./assets/app-chunks/app.04.js",
  "./assets/app-chunks/app.05.js",
  "./assets/app-chunks/app.06.js",
  "./manifest.webmanifest",
  "./assets/icon.svg"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    Promise.all([
      caches.keys().then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
      ),
      self.clients.claim()
    ])
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request)));
});

self.addEventListener("push", (event) => {
  const fallback = {
    title: "Bills coming up soon",
    body: "Open UpNextBudgeting to review what is due next.",
    badge: "./assets/icon.svg",
    icon: "./assets/icon.svg",
    data: { url: "./" }
  };
  let payload = fallback;
  try {
    payload = event.data ? event.data.json() : fallback;
  } catch (error) {
    payload = fallback;
  }
  const title = payload.title || fallback.title;
  const options = {
    body: payload.body || fallback.body,
    badge: payload.badge || fallback.badge,
    icon: payload.icon || fallback.icon,
    tag: payload.tag || "upnextbudgeting-due-summary",
    renotify: true,
    data: payload.data || fallback.data
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = new URL(event.notification.data?.url || "./", self.location.origin).href;
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      const client = clientList.find((item) => item.url.startsWith(self.location.origin));
      if (client) return client.focus();
      return clients.openWindow(targetUrl);
    })
  );
});
