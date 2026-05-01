const CACHE_NAME = "upnextbudgeting-shell-v29";
const SHELL_ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./app.js?v=reset-1",
  "./manifest.webmanifest",
  "./assets/icon.svg",
  "./assets/apple-touch-icon.png",
  "./assets/icon-192.png",
  "./assets/icon-512.png",
  "./assets/icon-maskable-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_ASSETS))
  );
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

async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    return (await cache.match(request)) || cache.match("./index.html");
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(CACHE_NAME);
    cache.put(request, response.clone());
  }
  return response;
}

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin || event.request.method !== "GET") return;

  if (event.request.mode === "navigate") {
    event.respondWith(networkFirst(event.request));
    return;
  }

  event.respondWith(cacheFirst(event.request));
});

self.addEventListener("push", (event) => {
  let payload = {
    title: "Bills coming up soon",
    body: "Open UpNextBudgeting to review what is due next.",
    icon: "./assets/icon-192.png",
    badge: "./assets/icon-192.png",
    tag: "upnextbudgeting-due-summary",
    data: { url: "./?tab=home" }
  };
  try {
    if (event.data) payload = { ...payload, ...event.data.json() };
  } catch {
    // Keep the default notification copy if the push payload is not JSON.
  }
  event.waitUntil(self.registration.showNotification(payload.title, {
    body: payload.body,
    icon: payload.icon || "./assets/icon-192.png",
    badge: payload.badge || "./assets/icon-192.png",
    tag: payload.tag || "upnextbudgeting-due-summary",
    renotify: true,
    data: { url: "./?tab=home", ...(payload.data || {}) }
  }));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = new URL(event.notification.data?.url || "./?tab=home", self.registration.scope).href;
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      const client = clientList.find((item) => item.url.startsWith(self.registration.scope));
      if (client) {
        client.navigate(targetUrl);
        return client.focus();
      }
      return clients.openWindow(targetUrl);
    })
  );
});
