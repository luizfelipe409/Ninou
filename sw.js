const CACHE_NAME = "ninou-v75-76-7-day-notes-fix";
const APP_VERSION = "75.76.7";

const APP_SHELL = [
  "/",
  "/index.html",
  `/styles.css?v=${APP_VERSION}`,
  `/js/boot-v75.76.7.mjs?v=${APP_VERSION}`,
  `/js/ninou-core-v75.76.7.mjs?v=${APP_VERSION}`,
  "/app.js",
  "/js/app.js",
  "/js/app.legacy.js",
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
];

function canStore(response) {
  return Boolean(response && response.ok && response.status === 200 && response.type !== "opaque");
}

async function cacheShellSafely() {
  const cache = await caches.open(CACHE_NAME);
  await Promise.allSettled(APP_SHELL.map(async (url) => {
    const request = new Request(url, { cache: "reload" });
    const response = await fetch(request);
    if (canStore(response)) await cache.put(request, response);
  }));
}

self.addEventListener("install", (event) => {
  event.waitUntil(cacheShellSafely());
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  const externalFirebase = /(^|\.)googleapis\.com$/.test(url.hostname)
    || /(^|\.)firebaseio\.com$/.test(url.hostname)
    || /(^|\.)gstatic\.com$/.test(url.hostname);

  if (externalFirebase) {
    event.respondWith(fetch(request));
    return;
  }

  const sameOrigin = url.origin === self.location.origin;
  const navigation = request.mode === "navigate";
  const codeFile = sameOrigin && /\.(?:m?js|css)$/.test(url.pathname);

  if (navigation) {
    event.respondWith(
      fetch(request)
        .then(async (response) => {
          if (canStore(response)) {
            const cache = await caches.open(CACHE_NAME);
            await cache.put("/index.html", response.clone());
          }
          return response;
        })
        .catch(async () => (await caches.match("/index.html")) || Response.error()),
    );
    return;
  }

  if (codeFile) {
    event.respondWith(
      fetch(request, { cache: "no-store" })
        .then(async (response) => {
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          const type = response.headers.get("content-type") || "";
          if (/\.m?js$/.test(url.pathname) && !/javascript|ecmascript/.test(type)) {
            throw new Error(`MIME inválido para JavaScript: ${type}`);
          }
          if (url.pathname.endsWith(".css") && !/text\/css/.test(type)) {
            throw new Error(`MIME inválido para CSS: ${type}`);
          }
          const cache = await caches.open(CACHE_NAME);
          await cache.put(request, response.clone());
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request, { ignoreSearch: true });
          return cached || new Response("Arquivo do aplicativo indisponível.", {
            status: 503,
            headers: { "Content-Type": "text/plain; charset=utf-8" },
          });
        }),
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request).then(async (response) => {
      if (sameOrigin && canStore(response)) {
        const cache = await caches.open(CACHE_NAME);
        await cache.put(request, response.clone());
      }
      return response;
    })),
  );
});
