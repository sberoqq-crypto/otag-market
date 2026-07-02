const CACHE_NAME = "otag-paket-v1";
const CORE_ASSETS = [
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// API çağrılarını (fetch to Apps Script) her zaman network'ten al,
// sadece kabuk dosyalarını (HTML/CSS/JS/icon) cache'den sun.
self.addEventListener("fetch", (event) => {
  const url = event.request.url;
  if (url.includes("script.google.com")) {
    return; // API isteklerine dokunma
  }
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
