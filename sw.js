const CACHE_NAME = "ninou-v75-75-24-interface-limpa";

function canCacheRequest(request, response) {
  if (!request || request.method !== "GET") return false;
  try {
    const url = new URL(request.url);
    if (url.protocol !== "http:" && url.protocol !== "https:") return false;
  } catch (_) {
    return false;
  }
  return Boolean(response && response.ok && response.status === 200 && response.type !== "opaque");
}

function safePut(cache, request, response) {
  if (!canCacheRequest(request, response)) return Promise.resolve();
  return cache.put(request, response).catch(() => undefined);
}
const APP_SHELL = [
  "/",
  "/index.html",
  "/styles.css?v=75.75.24",
  "/css/app.legacy.css?v=75.75.24",
  "/js/app.legacy.js?v=75.75.24",
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
  "/icons/baby-avatars/avatar-01.png",
  "/icons/baby-avatars/avatar-02.png",
  "/icons/baby-avatars/avatar-03.png",
  "/icons/baby-avatars/avatar-04.png",
  "/icons/baby-avatars/avatar-05.png",
  "/icons/baby-avatars/avatar-06.png",
  "/icons/baby-avatars/avatar-07.png",
  "/icons/baby-avatars/avatar-08.png",
  "/icons/baby-avatars/avatar-09.png",
  "/icons/baby-avatars/avatar-10.png",
  "/icons/baby-avatars/avatar-11.png",
  "/icons/baby-avatars/avatar-12.png",
];

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

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
  const isAppFile =
    request.mode === "navigate" ||
    url.pathname.endsWith(".html") ||
    url.pathname.endsWith(".css") ||
    url.pathname.endsWith(".js");
  const isAudioFile = url.pathname.startsWith("/audio/") && url.pathname.endsWith(".mp3");
  const isFirebaseOrGoogleApi = /(^|\.)googleapis\.com$/.test(url.hostname) || /(^|\.)firebaseio\.com$/.test(url.hostname) || /(^|\.)gstatic\.com$/.test(url.hostname);

  if (isFirebaseOrGoogleApi) {
    event.respondWith(fetch(request));
    return;
  }

  if (isAppFile) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => safePut(cache, request, copy));
          return response;
        })
        .catch(() => caches.match(request).then((cached) => cached || caches.match("/index.html"))),
    );
    return;
  }

  // Áudios: não entram no cache inicial. O arquivo só é buscado quando o usuário abre/toca Sons.
  // Requisições com Range são comuns em áudio; nesses casos, deixamos o navegador buscar direto.
  if (isAudioFile) {
    if (request.headers.has("range")) {
      event.respondWith(fetch(request));
      return;
    }

    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response && response.ok && response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => safePut(cache, request, copy));
          }
          return response;
        });
      }),
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => safePut(cache, request, copy));
          return response;
        })
        .catch(() => caches.match("/index.html"));
    }),
  );
});
