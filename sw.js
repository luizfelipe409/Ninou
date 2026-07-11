const CACHE_NAME = "ninou-v75-76-2-pwa-compat";
const APP_VERSION = "75.76.2";

const APP_SHELL = [
  "/",
  "/index.html",
  `/styles.css?v=${APP_VERSION}`,
  `/app.js?v=${APP_VERSION}`,
  `/js/app.js?v=${APP_VERSION}`,
  `/js/app.legacy.js?v=${APP_VERSION}`,
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
  "/js/ui/account.js",
  "/js/ui/theme.js",
  "/js/ui/sounds.js",
  "/js/utils/text.js",
  "/js/utils/time.js",
  `/manifest.webmanifest?v=${APP_VERSION}`,
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
  "/icons/baby-avatars/avatar-01.webp",
  "/icons/baby-avatars/avatar-02.webp",
  "/icons/baby-avatars/avatar-03.webp",
  "/icons/baby-avatars/avatar-04.webp",
  "/icons/baby-avatars/avatar-05.webp",
  "/icons/baby-avatars/avatar-06.webp",
  "/icons/baby-avatars/avatar-07.webp",
  "/icons/baby-avatars/avatar-08.webp",
  "/icons/baby-avatars/avatar-09.webp",
  "/icons/baby-avatars/avatar-10.webp",
  "/icons/baby-avatars/avatar-11.webp",
  "/icons/baby-avatars/avatar-12.webp",
];

function isCacheable(response) {
  return Boolean(response && response.ok && response.status === 200 && response.type !== "opaque");
}

async function cacheShellIndividually() {
  const cache = await caches.open(CACHE_NAME);
  await Promise.allSettled(APP_SHELL.map(async (url) => {
    const request = new Request(url, { cache: "reload" });
    const response = await fetch(request);
    if (isCacheable(response)) await cache.put(request, response);
  }));
}

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
  if (event.data?.type === "CLEAR_OLD_CACHES") {
    event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))));
  }
});

self.addEventListener("install", (event) => {
  event.waitUntil(cacheShellIndividually());
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  const isFirebaseOrGoogleApi = /(^|\.)googleapis\.com$/.test(url.hostname)
    || /(^|\.)firebaseio\.com$/.test(url.hostname)
    || /(^|\.)gstatic\.com$/.test(url.hostname);

  if (isFirebaseOrGoogleApi) {
    event.respondWith(fetch(request));
    return;
  }

  const isNavigation = request.mode === "navigate";
  const isCodeFile = url.origin === self.location.origin && /\.(?:js|css)$/.test(url.pathname);
  const isAudioFile = url.origin === self.location.origin && url.pathname.startsWith("/audio/") && url.pathname.endsWith(".mp3");

  if (isNavigation) {
    event.respondWith(
      fetch(request)
        .then(async (response) => {
          if (isCacheable(response)) {
            const cache = await caches.open(CACHE_NAME);
            await cache.put("/index.html", response.clone());
          }
          return response;
        })
        .catch(async () => (await caches.match("/index.html")) || Response.error()),
    );
    return;
  }

  if (isCodeFile) {
    event.respondWith(
      fetch(request, { cache: "no-store" })
        .then(async (response) => {
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          const contentType = response.headers.get("content-type") || "";
          if (url.pathname.endsWith(".js") && !/javascript|ecmascript/.test(contentType)) {
            throw new Error(`MIME inválido para JavaScript: ${contentType}`);
          }
          if (url.pathname.endsWith(".css") && !/text\/css/.test(contentType)) {
            throw new Error(`MIME inválido para CSS: ${contentType}`);
          }
          const cache = await caches.open(CACHE_NAME);
          await cache.put(request, response.clone());
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request, { ignoreSearch: true });
          if (cached) return cached;
          return new Response("Arquivo do aplicativo indisponível. Atualize a página.", {
            status: 503,
            headers: { "Content-Type": "text/plain; charset=utf-8" },
          });
        }),
    );
    return;
  }

  if (isAudioFile) {
    if (request.headers.has("range")) {
      event.respondWith(fetch(request));
      return;
    }
    event.respondWith(
      caches.match(request).then((cached) => cached || fetch(request).then(async (response) => {
        if (isCacheable(response)) {
          const cache = await caches.open(CACHE_NAME);
          await cache.put(request, response.clone());
        }
        return response;
      })),
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request).then(async (response) => {
      if (isCacheable(response) && url.origin === self.location.origin) {
        const cache = await caches.open(CACHE_NAME);
        await cache.put(request, response.clone());
      }
      return response;
    })),
  );
});
