const CACHE_NAME = "upnextbudgeting-shell-v34";
const SHELL_ASSETS = [
  "./",
  "./index.html",
  "./styles.css?v=4",
  "./boot.js?v=4",
  "./app.js?v=4",
  "./core.js",
  "./alerts.js",
  "./manifest.webmanifest",
  "./assets/icon.svg",
  "./assets/apple-touch-icon.png",
  "./assets/icon-192.png",
  "./assets/icon-512.png",
  "./assets/icon-maskable-512.png",
  "./assets/fonts/Geist.woff2",
  "./assets/fonts/GeistMono.woff2"
];
// Past this, a slow connection falls back to the cached copy rather than
// leaving the app on a blank screen.
const NETWORK_TIMEOUT_MS = 3500;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      // "reload" skips the HTTP cache, so a deploy can't precache a stale file
      // next to fresh ones.
      cache.addAll(SHELL_ASSETS.map((url) => new Request(url, { cache: "reload" })))
    )
  );
});

// The active page asks the waiting worker to take over after the user clicks
// the "reload to update" toast — keeps users in control of when the swap
// happens rather than forcing it mid-session.
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") self.skipWaiting();
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

// Network first for the page and its code. app.js imports core.js without a
// version, so serving either one stale while the other is fresh could pair
// mismatched modules; going to the network for both keeps them in step, and
// the cache covers offline and slow loads.
async function networkFirst(request, fallbackUrl) {
  const cache = await caches.open(CACHE_NAME);
  const network = fetch(request).then((response) => {
    if (response.ok) cache.put(request, response.clone());
    return response;
  });
  network.catch(() => {});
  const timeout = new Promise((resolve) => setTimeout(resolve, NETWORK_TIMEOUT_MS));
  try {
    const first = await Promise.race([network, timeout]);
    if (first) return first;
  } catch {
    /* offline: fall through to the cache */
  }
  const cached = (await cache.match(request)) || (fallbackUrl && (await cache.match(fallbackUrl)));
  if (cached) return cached;
  try {
    return await network;
  } catch {
    return new Response("", { status: 504, statusText: "Offline" });
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
    event.respondWith(networkFirst(event.request, "./index.html"));
    return;
  }

  if (/\.(?:js|css|webmanifest|gs)$/.test(url.pathname)) {
    event.respondWith(networkFirst(event.request));
    return;
  }

  event.respondWith(cacheFirst(event.request));
});
