const CACHE_NAME = "otag-paket-v2";
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

// API çağrılarına (Apps Script) hiç dokunma.
// Kabuk dosyaları (HTML/JS/manifest/icon) için NETWORK-ÖNCELİKLİ:
// önce internetten en güncelini almayı dene, başarısız olursa
// (offline ise) cache'e düş. Böylece her güncellemede eski sürümde
// takılı kalma sorunu yaşanmaz.
self.addEventListener("fetch", (event) => {
  const url = event.request.url;
  if (url.includes("script.google.com")) {
    return; // API isteklerine dokunma
  }
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
