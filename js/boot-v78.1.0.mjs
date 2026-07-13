const NINOU_VERSION = "78.1.0";
const LEGACY_REPAIR_KEY = "ninou:pwa-legacy-cleanup:v78.1";
const BOOT_STARTED_AT = performance.now();
const MIN_SPLASH_MS = 650;
const MAX_BOOT_WAIT_MS = 8000;
const MODULE_TIMEOUT_MS = 12000;

function safeStorageGet(key) { try { return window.localStorage.getItem(key); } catch (_) { return null; } }
function safeStorageSet(key, value) { try { window.localStorage.setItem(key, value); } catch (_) {} }
function safeStorageRemove(key) { try { window.localStorage.removeItem(key); } catch (_) {} }
function sleep(ms) { return new Promise((resolve) => window.setTimeout(resolve, ms)); }
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

function appLooksStable() {
  const body = document.body;
  const syncPill = document.querySelector(".sync-pill");
  if (!body || !document.querySelector("main.phone-shell")) return false;
  if (body.classList.contains("sync-bootstrap")) return false;
  if (syncPill?.classList.contains("loading") || syncPill?.classList.contains("syncing")) return false;
  if (body.classList.contains("family-bootstrap-ready") || body.classList.contains("family-ready") || body.classList.contains("profile-daily-ready")) return true;
  const text = String(syncPill?.textContent || "").trim().toLowerCase();
  return Boolean(text && !text.includes("carregando") && !text.includes("conectando"));
}

async function waitForStableFirstPaint() {
  const started = performance.now();
  setBootStatus("Restaurando perfil e rotina…");
  while (performance.now() - started < MAX_BOOT_WAIT_MS) {
    if (appLooksStable()) return "ready";
    if (performance.now() - started > 2800) showSlowConnectionHint();
    await sleep(100);
  }
  return "timeout";
}

async function revealApp(reason = "ready") {
  const elapsed = performance.now() - BOOT_STARTED_AT;
  if (elapsed < MIN_SPLASH_MS) await sleep(MIN_SPLASH_MS - elapsed);
  if (reason === "timeout") setBootStatus("Abrindo com os dados disponíveis neste aparelho…");
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  const splash = document.querySelector("#ninouBootScreen");
  document.documentElement.classList.remove("ninou-booting");
  document.documentElement.dataset.ninouInitialPaint = reason;
  splash?.classList.add("is-leaving");
  window.setTimeout(() => { if (splash) splash.hidden = true; }, 380);
}

async function cleanLegacyRuntimeOnce() {
  if (safeStorageGet(LEGACY_REPAIR_KEY) === "done") return false;
  let changed = false;
  if ("caches" in window) {
    try {
      const names = await caches.keys();
      const legacy = names.filter((name) => name.toLowerCase().includes("ninou") && !name.includes("78-1-0"));
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
  console.error("Falha real ao iniciar o Ninou:", error);
  document.documentElement.dataset.ninouBootFailed = "true";
  setBootStatus("Não foi possível concluir a inicialização.");
  showSlowConnectionHint();
  document.querySelector("[data-ninou-boot-error]")?.remove();
  const panel = document.createElement("section");
  panel.dataset.ninouBootError = "true";
  panel.setAttribute("role", "alert");
  panel.style.cssText = "position:fixed;inset:auto 18px max(24px,env(safe-area-inset-bottom));z-index:2147483647;padding:16px;border-radius:18px;background:#fffaf7;color:#3c2720;box-shadow:0 18px 48px rgba(48,35,28,.24);font:14px/1.45 system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif";
  const message = String(error?.message || error || "Erro desconhecido");
  const escaped = message.replace(/[&<>"']/g, (char) => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[char]));
  panel.innerHTML = `<strong style="display:block;font-size:16px;margin-bottom:5px">Falha ao iniciar o Ninou</strong><span>Seus registros locais não serão apagados.</span><button type="button" data-ninou-hard-repair style="display:block;width:100%;margin-top:12px;padding:11px 14px;border:0;border-radius:12px;background:#376f61;color:#fff;font:700 14px system-ui;cursor:pointer">Reparar cache e abrir novamente</button><details style="margin-top:10px"><summary style="cursor:pointer;font-weight:650">Detalhe técnico</summary><code style="display:block;margin-top:6px;white-space:pre-wrap;overflow-wrap:anywhere">${escaped}</code></details>`;
  panel.querySelector("[data-ninou-hard-repair]")?.addEventListener("click", async () => {
    const button = panel.querySelector("[data-ninou-hard-repair]");
    if (button) { button.disabled = true; button.textContent = "Reparando…"; }
    safeStorageRemove(LEGACY_REPAIR_KEY);
    await hardRepair();
    const url = new URL(window.location.href);
    url.searchParams.set("ninouRecovery", `${NINOU_VERSION}-${Date.now()}`);
    window.location.replace(url.toString());
  }, { once: true });
  document.body.append(panel);
}

async function bootNinou() {
  if (window.__NINOU_BOOT_PROMISE__) return window.__NINOU_BOOT_PROMISE__;
  window.__NINOU_BOOT_PROMISE__ = (async () => {
    performance.mark("ninou-boot-start");
    setBootStatus("Verificando a versão do aplicativo…");
    await cleanLegacyRuntimeOnce();
    setBootStatus("Preparando a arquitetura do aplicativo…");
    const architectureModule = await withTimeout(import(`./runtime/architecture-v78.1.0.mjs?v=${NINOU_VERSION}`), MODULE_TIMEOUT_MS, "Arquitetura do aplicativo");
    const architecture = architectureModule.default;
    architecture.state.setState({ bootPhase: "loading-core" }, { source: "boot" });
    setBootStatus("Carregando o diário do bebê…");
    await withTimeout(import(`./ninou-core-v78.1.0.mjs?v=${NINOU_VERSION}`), MODULE_TIMEOUT_MS, "Núcleo do aplicativo");
    await withTimeout(Promise.all([
      import(`./ninou-ux-v78.1.0.mjs?v=${NINOU_VERSION}`),
      import(`./ninou-consistency-v78.1.0.mjs?v=${NINOU_VERSION}`),
      import(`./ninou-stability-v78.1.0.mjs?v=${NINOU_VERSION}`),
      import(`./runtime/diagnostics-v78.1.0.mjs?v=${NINOU_VERSION}`),
    ]), MODULE_TIMEOUT_MS, "Camadas de interface");
    window.__NINOU_APP_READY__ = true;
    document.documentElement.dataset.ninouAppReady = "true";
    architecture.state.setState({ ready: true, bootPhase: "ready" }, { source: "boot" });
    architecture.bus.emit("app:ready", { version: NINOU_VERSION });
    architecture.logger.info("app_ready", { version: NINOU_VERSION });
    const reason = await waitForStableFirstPaint();
    await revealApp(reason);
    try { performance.mark("ninou-boot-end"); performance.measure("ninou-boot", "ninou-boot-start", "ninou-boot-end"); } catch (_) {}
  })();
  try { await window.__NINOU_BOOT_PROMISE__; }
  catch (error) { window.__NINOU_BOOT_PROMISE__ = null; showBootFailure(error); }
}

bootNinou();
