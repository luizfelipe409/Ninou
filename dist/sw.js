const CACHE_NAME = "ninou-v82-1-5-admin-web-portal";
const APP_VERSION = "82.1.5";
const STYLE_MODULES = ["legacy", "premium-v82.0.0", "focused-flow-v82.0.0"];
const APP_SHELL = [
  "/", "/index.html",
  ...STYLE_MODULES.map((name) => `/styles/${name}.css?v=${APP_VERSION}`),
  `/styles/admin-web-v82.1.5.css?v=${APP_VERSION}`,
  `/js/boot-v82.1.5.mjs?v=${APP_VERSION}`,
  `/js/ninou-admin-web-v82.1.5.mjs?v=${APP_VERSION}`,
  `/js/services/admin-service-v82.1.5.js`,
  `/js/ninou-core-v82.1.5.mjs?v=${APP_VERSION}`,
  `/js/ninou-ux-v82.0.0.mjs?v=${APP_VERSION}`,
  `/js/ninou-consistency-v82.0.0.mjs?v=${APP_VERSION}`,
  `/js/ninou-stability-v82.0.0.mjs?v=${APP_VERSION}`,
  `/js/runtime/architecture-v82.0.0.mjs?v=${APP_VERSION}`,
  `/js/runtime/diagnostics-v82.0.0.mjs?v=${APP_VERSION}`,
  `/js/runtime/visual-guard-v82.0.0.mjs?v=${APP_VERSION}`,
  "/js/core/event-bus.js", "/js/core/app-state.js", "/js/core/logger.js",
  "/js/repositories/json-repository.js", "/js/repositories/routine-repository.js", "/js/repositories/profile-repository.js",
  "/js/config/constants.js", "/js/dom/dom.js",
  "/js/domain/record-types.js", "/js/domain/records.js", "/js/domain/sleep.js",
  "/js/domain/feeding.js", "/js/domain/diaper.js", "/js/domain/medication.js",
  "/js/domain/event-editor.js", "/js/domain/baby-profile.js", "/js/domain/weights.js",
  "/js/domain/sounds.js", "/js/services/firebase-service.js", "/js/services/account-service.js",
  "/js/services/export-service.js", "/js/services/timer-service.js", "/js/storage/local-storage.js",
  "/js/ui/event-formatters.js", "/js/ui/home.js", "/js/ui/intelligence.js", "/js/ui/charts.js",
  "/js/ui/record-sheet.js", "/js/ui/action-launcher.js", "/js/ui/navigation.js", "/js/ui/app-navigation.js",
  "/js/ui/empty-states.js", "/js/ui/render-utils.js", "/js/ui/profile.js", "/js/ui/account.js",
  "/js/ui/theme.js", "/js/ui/sounds.js", "/js/utils/text.js", "/js/utils/time.js", "/js/utils/security.js",
  `/manifest.webmanifest?v=${APP_VERSION}`,
  "/icons/icon-192.png", "/icons/icon-512.png", "/icons/apple-touch-icon.png",
  "/icons/actions/acordou.png", "/icons/actions/amamentacao.png", "/icons/actions/despertar-noturno.png",
  "/icons/actions/dormir.png", "/icons/actions/fralda.png", "/icons/actions/mamadeira.png", "/icons/actions/soneca.png",
  "/assets/clock-themes/day-sky.svg", "/assets/clock-themes/night-sky.svg",
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

async function fetchWithTimeout(request, timeoutMs = 4500) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try { return await fetch(request, { signal: controller.signal }); }
  finally { clearTimeout(timer); }
}

self.addEventListener("install", (event) => {
  event.waitUntil(cacheShellSafely());
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((key) => key.startsWith("ninou-") && key !== CACHE_NAME).map((key) => caches.delete(key)));
    await self.clients.claim();
  })());
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
  if (externalFirebase || url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith((async () => {
      try {
        const response = await fetchWithTimeout(new Request(request, { cache: "no-store" }));
        if (canStore(response)) (await caches.open(CACHE_NAME)).put("/index.html", response.clone());
        return response;
      } catch (_) {
        return (await caches.match("/index.html")) || Response.error();
      }
    })());
    return;
  }

  const versionedCode = /\.(?:m?js|css)$/.test(url.pathname) && url.searchParams.has("v");
  if (versionedCode) {
    event.respondWith((async () => {
      const cached = await caches.match(request);
      if (cached) return cached;
      try {
        const response = await fetch(request, { cache: "no-store" });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        if (canStore(response)) (await caches.open(CACHE_NAME)).put(request, response.clone());
        return response;
      } catch (_) {
        return (await caches.match(request, { ignoreSearch: true })) || new Response("Arquivo do aplicativo indisponível.", {
          status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" },
        });
      }
    })());
    return;
  }

  event.respondWith((async () => {
    const cached = await caches.match(request);
    const network = fetch(request).then(async (response) => {
      if (canStore(response)) (await caches.open(CACHE_NAME)).put(request, response.clone());
      return response;
    }).catch(() => null);
    if (cached) { event.waitUntil(network); return cached; }
    return (await network) || Response.error();
  })());
});
