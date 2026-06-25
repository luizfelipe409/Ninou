const CACHE_NAME = "ninou-v41";
const APP_SHELL = [
  "/",
  "/index.html",
  "/styles.css?v=41",
  "/app.js?v=41",
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/apple-touch-icon.png",
  "/icons/actions/acordou.png",
  "/icons/actions/amamentacao.png",
  "/icons/actions/despertar-noturno.png",
  "/icons/actions/dormir.png",
  "/icons/actions/fralda.png",
  "/icons/actions/mamadeira.png",
  "/icons/actions/soneca.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))),
    ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) =>
      cached || fetch(event.request).catch(() => caches.match("/index.html")),
    ),
  );
});
