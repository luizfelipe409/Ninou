const CACHE_NAME = "ninou-v75-38-relatorio_peso_autoria";
const APP_SHELL = [
  "/",
  "/index.html",
  "/styles.css?v=75.38",
  "/css/app.legacy.css?v=75.38",
  "/app.js?v=75.38",
  "/js/app.legacy.js?v=75.38",
  "/js/config/constants.js",
  "/js/dom/dom.js",
  "/js/domain/record-types.js",
  "/js/domain/records.js",
  "/js/domain/sleep.js",
  "/js/domain/feeding.js",
  "/js/domain/diaper.js",
  "/js/domain/medication.js",
  "/js/domain/event-editor.js",
  "/js/domain/baby-profile.js",
  "/js/domain/weights.js",
  "/js/domain/sounds.js",
  "/js/services/firebase-service.js",
  "/js/services/account-service.js",
  "/js/services/export-service.js",
  "/js/services/timer-service.js",
  "/js/storage/local-storage.js",
  "/js/ui/event-formatters.js",
  "/js/ui/home.js",
  "/js/ui/intelligence.js",
  "/js/ui/charts.js",
  "/js/ui/record-sheet.js",
  "/js/ui/navigation.js",
  "/js/ui/app-navigation.js",
  "/js/ui/empty-states.js",
  "/js/ui/render-utils.js",
  "/js/ui/profile.js",
  "/js/ui/theme.js",
  "/js/ui/account.js",
  "/js/ui/sounds.js",
  "/js/utils/text.js",
  "/js/utils/time.js",
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
  "/icons/actions/soneca.png",
  "/audio/som-utero.mp3",
  "/audio/som-relaxar.mp3",
  "/audio/ritmo-suave-bebe.mp3",
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
  if (event.request.method !== "GET") return;

  const request = event.request;
  const url = new URL(request.url);
  const isAppFile = request.mode === "navigate" || url.pathname.endsWith(".html") || url.pathname.endsWith(".css") || url.pathname.endsWith(".js");

  if (isAppFile) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() => caches.match(request).then((cached) => cached || caches.match("/index.html"))),
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        return response;
      }).catch(() => caches.match("/index.html"));
    }),
  );
});
