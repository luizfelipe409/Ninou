const NINOU_VERSION = "79.2.0";
const LEGACY_REPAIR_KEY = "ninou:pwa-legacy-cleanup:v79.2.0";
const BOOT_STARTED_AT = performance.now();
const MIN_SPLASH_MS = 1500;
const MAX_BOOT_WAIT_MS = 8500;
const MODULE_TIMEOUT_MS = 12000;
let loadingOverlayTimer = 0;
let loadingOverlayShownAt = 0;

const CRITICAL_IMAGES = [
  "./icons/icon-192.png",
  "./icons/actions/acordou.png",
  "./icons/actions/soneca.png",
  "./icons/actions/amamentacao.png",
  "./icons/actions/mamadeira.png",
  "./icons/actions/fralda.png",
];

function safeStorageGet(key) { try { return window.localStorage.getItem(key); } catch (_) { return null; } }
function safeStorageSet(key, value) { try { window.localStorage.setItem(key, value); } catch (_) {}
}
function safeStorageRemove(key) { try { window.localStorage.removeItem(key); } catch (_) {}
}
function sleep(ms) { return new Promise((resolve) => window.setTimeout(resolve, ms)); }
function clearBootWatchdog() {
  window.clearTimeout(window.__NINOU_BOOT_WATCHDOG__ || 0);
  window.__NINOU_BOOT_WATCHDOG__ = 0;
}
function withTimeout(promise, ms, label) {
  let timer;
  return Promise.race([
    promise,
    new Promise((_, reject) => { timer = window.setTimeout(() => reject(new Error(`${label} excedeu ${ms / 1000}s.`)), ms); }),
  ]).finally(() => window.clearTimeout(timer));
}

function setBootStatus(message) {
  const status = document.querySelector("#ninouBootStatus");
  if (status && message) status.textContent = message;
}
function showSlowConnectionHint() { document.querySelector("#ninouBootSlow")?.classList.add("is-visible"); }

function showLoadingOverlay(message = "Atualizando sua rotina…", options = {}) {
  const splash = document.querySelector("#ninouBootScreen");
  if (!splash) return;
  window.clearTimeout(loadingOverlayTimer);
  loadingOverlayTimer = 0;
  loadingOverlayShownAt = performance.now();
  splash.hidden = false;
  splash.classList.remove("is-leaving");
  document.documentElement.classList.add("ninou-loading-overlay");
  if (!options.resume) document.documentElement.classList.add("ninou-booting");
  setBootStatus(message);
  document.querySelector("#ninouBootSlow")?.classList.remove("is-visible");
  if (options.autoHideMs) {
    loadingOverlayTimer = window.setTimeout(() => hideLoadingOverlay({ reason: "timeout" }), options.autoHideMs);
  }
}

function hideLoadingOverlay(options = {}) {
  const splash = document.querySelector("#ninouBootScreen");
  const initialBootPending = document.documentElement.classList.contains("ninou-booting") && !document.documentElement.dataset.ninouInitialPaint;
  if (initialBootPending && !options.force) return;
  if (!splash || splash.hidden) return;
  window.clearTimeout(loadingOverlayTimer);
  loadingOverlayTimer = 0;
  const minVisible = options.immediate ? 0 : 520;
  const elapsed = performance.now() - loadingOverlayShownAt;
  const finish = () => {
    splash.classList.add("is-leaving");
    document.documentElement.classList.remove("ninou-loading-overlay");
    window.setTimeout(() => { splash.hidden = true; }, 380);
  };
  if (elapsed < minVisible) window.setTimeout(finish, minVisible - elapsed);
  else finish();
}

const loadingApi = Object.freeze({ show: showLoadingOverlay, hide: hideLoadingOverlay, version: NINOU_VERSION });
try { Object.defineProperty(window, "NinouLoading", { value: loadingApi, configurable: false, writable: false }); }
catch (_) { window.NinouLoading = loadingApi; }

window.addEventListener("ninou:resume", () => {
  if (!window.__NINOU_APP_READY__) return;
  showLoadingOverlay("Atualizando perfil e rotina…", { resume: true, autoHideMs: 1800 });
}, { passive: true });
window.addEventListener("ninou:auth-ready", () => hideLoadingOverlay({ reason: "auth-ready" }), { passive: true });

async function waitForStyleSheets() {
  const links = [...document.querySelectorAll('link[rel="stylesheet"][href*="79.2.0"]')];
  const results = await Promise.allSettled(links.map((link) => {
    if (link.sheet) return Promise.resolve(link.getAttribute("href"));
    return withTimeout(new Promise((resolve, reject) => {
      link.addEventListener("load", () => resolve(link.getAttribute("href")), { once: true });
      link.addEventListener("error", () => reject(new Error(`Falha ao carregar ${link.getAttribute("href")}.`)), { once: true });
    }), 6000, "Folha de estilos");
  }));
  const failed = results.filter((result) => result.status === "rejected");
  if (failed.length) {
    document.documentElement.dataset.ninouStyleFallback = String(failed.length);
    console.warn("Algumas folhas de estilo não responderam; o Ninou continuará com a base disponível.", failed.map((item) => item.reason));
  }
  return results;
}

async function preloadCriticalImages() {
  await Promise.allSettled(CRITICAL_IMAGES.map((src) => withTimeout(new Promise((resolve) => {
    const image = new Image();
    image.onload = async () => {
      try { await image.decode?.(); } catch (_) {}
      resolve();
    };
    image.onerror = resolve;
    image.src = src;
    if (image.complete) resolve();
  }), 3500, `Imagem ${src}`)));
}

function hasResolvedAccessState(body) {
  const state = String(body?.dataset?.profileAccessState || "").trim();
  if (!["guest", "account-no-family", "invite-pending", "family-ready", "admin-panel"].includes(state)) return false;
  if (state !== "family-ready") return true;
  return body.classList.contains("family-bootstrap-ready") || body.classList.contains("profile-daily-ready");
}

function appLooksStable() {
  const body = document.body;
  const shell = document.querySelector("main.phone-shell");
  const orbit = document.querySelector(".state-orbit.live-timeline-orbit");
  const center = orbit?.querySelector(".orbit-center-safe");
  const clock = document.querySelector("#stateClock");
  if (!window.__NINOU_APP_READY__ || !body || !shell || !orbit || !center || !clock) return false;
  if (body.classList.contains("sync-bootstrap")) return false;
  if (!hasResolvedAccessState(body)) return false;

  const accessState = String(body.dataset.profileAccessState || "");
  const savedEmail = String(safeStorageGet("ninou.demo.email") || "").trim();
  let expectedName = "";
  try { expectedName = String(JSON.parse(safeStorageGet("ninou.demo.profile") || "{}")?.name || "").trim(); } catch (_) {}
  if (savedEmail && accessState === "guest") return false;

  const syncPill = document.querySelector(".sync-pill");
  if (syncPill?.classList.contains("loading") || syncPill?.classList.contains("syncing")) return false;
  if (!document.documentElement.dataset.ninouUx || !document.documentElement.dataset.ninouConsistency) return false;
  if (!document.documentElement.dataset.ninouVisualGuard) return false;

  const title = String(document.querySelector("#diaryTitle")?.textContent || "").trim();
  const clockText = String(clock.textContent || "").trim();
  if (!title || !clockText || clockText === "--:--") return false;
  if (expectedName && !title.toLocaleLowerCase("pt-BR").includes(expectedName.toLocaleLowerCase("pt-BR"))) return false;

  const orbitRect = orbit.getBoundingClientRect();
  const centerRect = center.getBoundingClientRect();
  const deltaX = Math.abs((centerRect.left + centerRect.width / 2) - (orbitRect.left + orbitRect.width / 2));
  const deltaY = Math.abs((centerRect.top + centerRect.height / 2) - (orbitRect.top + orbitRect.height / 2));
  if (deltaX > 3 || deltaY > 3) return false;

  return getComputedStyle(shell).display !== "none" && getComputedStyle(shell).visibility !== "hidden";
}

async function waitForStableFirstPaint() {
  const started = performance.now();
  setBootStatus("Restaurando perfil, família e rotina…");
  while (performance.now() - started < MAX_BOOT_WAIT_MS) {
    if (appLooksStable()) return "ready";
    if (performance.now() - started > 2600) showSlowConnectionHint();
    await sleep(90);
  }
  return "timeout";
}

function removeRecoveryParameters() {
  try {
    const url = new URL(window.location.href);
    let changed = false;
    ["ninouRecovery", "ninouRepair", "ninouVersion"].forEach((key) => {
      if (url.searchParams.has(key)) { url.searchParams.delete(key); changed = true; }
    });
    if (changed) window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
  } catch (_) {}
}

function updateVisibleVersion() {
  const label = document.querySelector("#diagnosticsVersionLabel");
  if (label) label.textContent = `Ninou v${NINOU_VERSION}`;
  document.documentElement.dataset.ninouVersion = NINOU_VERSION;
}

async function revealApp(reason = "ready") {
  clearBootWatchdog();
  const elapsed = performance.now() - BOOT_STARTED_AT;
  if (elapsed < MIN_SPLASH_MS) await sleep(MIN_SPLASH_MS - elapsed);
  if (reason === "timeout") {
    setBootStatus("Abrindo com os dados disponíveis neste aparelho…");
    await sleep(260);
  }
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  updateVisibleVersion();
  removeRecoveryParameters();
  const splash = document.querySelector("#ninouBootScreen");
  document.documentElement.dataset.ninouInitialPaint = reason;
  document.documentElement.classList.remove("ninou-booting", "ninou-loading-overlay");
  splash?.classList.add("is-leaving");
  window.setTimeout(() => { if (splash) splash.hidden = true; }, 420);
  window.dispatchEvent(new CustomEvent("ninou:boot-revealed", { detail: { version: NINOU_VERSION, reason } }));
}

async function cleanLegacyRuntimeOnce() {
  if (safeStorageGet(LEGACY_REPAIR_KEY) === "done") return false;
  let changed = false;
  if ("caches" in window) {
    try {
      const names = await caches.keys();
      const legacy = names.filter((name) => name.toLowerCase().includes("ninou") && !name.includes("78-4-1"));
      const results = await Promise.all(legacy.map((name) => caches.delete(name)));
      changed = results.some(Boolean);
    } catch (error) { console.warn("Não foi possível limpar caches legados:", error); }
  }
  safeStorageSet(LEGACY_REPAIR_KEY, "done");
  return changed;
}

async function hardRepair() {
  if ("serviceWorker" in navigator) {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.allSettled(registrations.map((registration) => registration.unregister()));
    } catch (_) {}
  }
  if ("caches" in window) {
    try { await Promise.all((await caches.keys()).map((name) => caches.delete(name))); } catch (_) {}
  }
}

function showBootFailure(error) {
  clearBootWatchdog();
  console.error("Falha real ao iniciar o Ninou:", error);
  document.documentElement.dataset.ninouBootFailed = "true";
  setBootStatus("Não foi possível concluir a inicialização.");
  showSlowConnectionHint();
  document.querySelector("[data-ninou-boot-error]")?.remove();

  const panel = document.createElement("section");
  panel.dataset.ninouBootError = "true";
  panel.className = "ninou-boot-error";
  panel.setAttribute("role", "alert");
  const message = String(error?.message || error || "Erro desconhecido");
  const escaped = message.replace(/[&<>"']/g, (char) => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[char]));
  panel.innerHTML = `<strong>Falha ao iniciar o Ninou</strong><span>Seus registros locais não foram apagados.</span><details style="margin-top:9px"><summary style="cursor:pointer;font-weight:750">Detalhe técnico</summary><code style="display:block;margin-top:6px;white-space:pre-wrap;overflow-wrap:anywhere;font-size:11px">${escaped}</code></details><div class="ninou-boot-error-actions"><button type="button" data-ninou-repair>Reparar e recarregar</button><button type="button" data-ninou-open-anyway>Abrir interface disponível</button></div>`;

  panel.querySelector("[data-ninou-repair]")?.addEventListener("click", async () => {
    const button = panel.querySelector("[data-ninou-repair]");
    if (button) { button.disabled = true; button.textContent = "Reparando…"; }
    safeStorageRemove(LEGACY_REPAIR_KEY);
    await hardRepair();
    const url = new URL(window.location.href);
    url.searchParams.set("ninouRecovery", `${NINOU_VERSION}-${Date.now()}`);
    window.location.replace(url.toString());
  }, { once: true });

  panel.querySelector("[data-ninou-open-anyway]")?.addEventListener("click", () => {
    document.documentElement.dataset.ninouInitialPaint = "forced-after-error";
    document.documentElement.classList.remove("ninou-booting", "ninou-loading-overlay");
    const splash = document.querySelector("#ninouBootScreen");
    splash?.classList.add("is-leaving");
    window.setTimeout(() => { if (splash) splash.hidden = true; }, 380);
  }, { once: true });

  const card = document.querySelector("#ninouBootScreen .ninou-boot-card");
  if (card) card.append(panel);
  else document.body.append(panel);
}

async function bootNinou() {
  if (window.__NINOU_BOOT_PROMISE__) return window.__NINOU_BOOT_PROMISE__;
  window.__NINOU_BOOT_PROMISE__ = (async () => {
    performance.mark("ninou-boot-start");
    setBootStatus("Verificando a versão do aplicativo…");

    if (window.__NINOU_EARLY_MIGRATION__) {
      try {
        await withTimeout(window.__NINOU_EARLY_MIGRATION__, 6500, "Migração do runtime");
      } catch (error) {
        console.warn("A limpeza inicial demorou; o app continuará sem bloquear a abertura.", error);
      }
    }
    await cleanLegacyRuntimeOnce();

    setBootStatus("Preparando a interface premium…");
    await Promise.allSettled([
      waitForStyleSheets(),
      preloadCriticalImages(),
      document.fonts?.ready || Promise.resolve(),
    ]);

    let architecture = null;
    setBootStatus("Preparando a arquitetura do aplicativo…");
    try {
      const architectureModule = await withTimeout(import(`./runtime/architecture-v79.2.0.mjs?v=${NINOU_VERSION}`), MODULE_TIMEOUT_MS, "Arquitetura do aplicativo");
      architecture = architectureModule.default;
      architecture?.state?.setState?.({ version: NINOU_VERSION, bootPhase: "loading-core" }, { source: "boot" });
    } catch (error) {
      document.documentElement.dataset.ninouArchitectureFallback = "true";
      console.warn("A camada de arquitetura não carregou; o núcleo continuará em modo compatível.", error);
    }

    setBootStatus("Carregando o diário do bebê…");
    await withTimeout(import(`./ninou-core-v79.2.0.mjs?v=${NINOU_VERSION}`), MODULE_TIMEOUT_MS, "Núcleo do aplicativo");

    const layerResults = await Promise.allSettled([
      withTimeout(import(`./ninou-ux-v79.2.0.mjs?v=${NINOU_VERSION}`), MODULE_TIMEOUT_MS, "Experiência de uso"),
      withTimeout(import(`./ninou-consistency-v79.2.0.mjs?v=${NINOU_VERSION}`), MODULE_TIMEOUT_MS, "Consistência visual"),
      withTimeout(import(`./ninou-stability-v79.2.0.mjs?v=${NINOU_VERSION}`), MODULE_TIMEOUT_MS, "Estabilidade"),
      withTimeout(import(`./runtime/diagnostics-v79.2.0.mjs?v=${NINOU_VERSION}`), MODULE_TIMEOUT_MS, "Diagnóstico"),
      withTimeout(import(`./runtime/visual-guard-v79.2.0.mjs?v=${NINOU_VERSION}`), MODULE_TIMEOUT_MS, "Guarda visual"),
    ]);
    const failedLayers = layerResults.filter((result) => result.status === "rejected");
    if (failedLayers.length) {
      document.documentElement.dataset.ninouLayerFallback = String(failedLayers.length);
      console.warn("Camadas complementares falharam, mas não bloquearão a abertura.", failedLayers.map((item) => item.reason));
    }

    window.__NINOU_APP_READY__ = true;
    document.documentElement.dataset.ninouAppReady = "true";
    architecture?.state?.setState?.({ version: NINOU_VERSION, ready: true, bootPhase: "ready" }, { source: "boot" });
    architecture?.bus?.emit?.("app:ready", { version: NINOU_VERSION });
    architecture?.logger?.info?.("app_ready", { version: NINOU_VERSION });
    window.__NINOU_VISUAL_GUARD__?.apply?.();

    const reason = await waitForStableFirstPaint();
    await revealApp(reason);
    try { performance.mark("ninou-boot-end"); performance.measure("ninou-boot", "ninou-boot-start", "ninou-boot-end"); } catch (_) {}
  })();
  try { await window.__NINOU_BOOT_PROMISE__; }
  catch (error) { window.__NINOU_BOOT_PROMISE__ = null; showBootFailure(error); }
}

bootNinou();
