const NINOU_VERSION = "76.1.4";
const REPAIR_KEY = `ninou:pwa-repair:${NINOU_VERSION}`;

function safeStorageGet(key) {
  try { return window.localStorage.getItem(key); } catch (_) { return null; }
}

function safeStorageSet(key, value) {
  try { window.localStorage.setItem(key, value); } catch (_) {}
}

function safeStorageRemove(key) {
  try { window.localStorage.removeItem(key); } catch (_) {}
}

async function removeOldRuntime() {
  let registrations = [];
  if ("serviceWorker" in navigator) {
    try {
      registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.allSettled(registrations.map((registration) => registration.unregister()));
    } catch (error) {
      console.warn("Não foi possível remover o Service Worker anterior:", error);
    }
  }

  let deletedCaches = 0;
  if ("caches" in window) {
    try {
      const names = await caches.keys();
      const ninouCaches = names.filter((name) => name.toLowerCase().includes("ninou"));
      const results = await Promise.all(ninouCaches.map((name) => caches.delete(name)));
      deletedCaches = results.filter(Boolean).length;
    } catch (error) {
      console.warn("Não foi possível limpar os caches antigos do Ninou:", error);
    }
  }

  return {
    hadController: Boolean(navigator.serviceWorker?.controller),
    registrations: registrations.length,
    deletedCaches,
  };
}

function showBootFailure(error) {
  console.error("Falha real ao iniciar o Ninou:", error);
  document.documentElement.dataset.ninouBootFailed = "true";

  const old = document.querySelector("[data-ninou-boot-error]");
  if (old) old.remove();

  const panel = document.createElement("section");
  panel.dataset.ninouBootError = "true";
  panel.setAttribute("role", "alert");
  panel.style.cssText = [
    "position:fixed",
    "inset:14px 14px auto",
    "z-index:2147483647",
    "padding:16px",
    "border-radius:18px",
    "background:#fffaf7",
    "color:#3c2720",
    "box-shadow:0 18px 48px rgba(48,35,28,.24)",
    "font:14px/1.45 system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",
  ].join(";");

  const message = String(error?.message || error || "Erro desconhecido");
  panel.innerHTML = `
    <strong style="display:block;font-size:16px;margin-bottom:5px">Falha ao iniciar o Ninou</strong>
    <span>O núcleo do aplicativo não foi carregado. Use a reparação abaixo; seus registros locais não serão apagados.</span>
    <button type="button" data-ninou-hard-repair style="display:block;width:100%;margin-top:12px;padding:11px 14px;border:0;border-radius:12px;background:#376f61;color:#fff;font:700 14px system-ui;cursor:pointer">Reparar cache e abrir novamente</button>
    <details style="margin-top:10px"><summary style="cursor:pointer;font-weight:650">Detalhe técnico</summary><code style="display:block;margin-top:6px;white-space:pre-wrap;overflow-wrap:anywhere">${message.replace(/[&<>"']/g, (char) => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[char]))}</code></details>
  `;

  panel.querySelector("[data-ninou-hard-repair]")?.addEventListener("click", async () => {
    const button = panel.querySelector("[data-ninou-hard-repair]");
    if (button) {
      button.disabled = true;
      button.textContent = "Reparando…";
    }
    safeStorageRemove(REPAIR_KEY);
    await removeOldRuntime();
    const url = new URL(window.location.href);
    url.searchParams.set("ninouRecovery", `${NINOU_VERSION}-${Date.now()}`);
    window.location.replace(url.toString());
  });

  document.body.prepend(panel);
}

async function bootNinou() {
  if (window.__NINOU_BOOT_PROMISE__) return window.__NINOU_BOOT_PROMISE__;

  window.__NINOU_BOOT_PROMISE__ = (async () => {
    const alreadyRepaired = safeStorageGet(REPAIR_KEY) === "done";

    if (!alreadyRepaired) {
      const result = await removeOldRuntime();
      safeStorageSet(REPAIR_KEY, "done");

      if (result.hadController || result.registrations > 0 || result.deletedCaches > 0) {
        const url = new URL(window.location.href);
        url.searchParams.set("ninouRepair", NINOU_VERSION);
        window.location.replace(url.toString());
        return;
      }
    }

    await import(`./ninou-core-v76.1.4.mjs?v=${NINOU_VERSION}`);
    window.__NINOU_APP_READY__ = true;
    document.documentElement.dataset.ninouAppReady = "true";
  })();

  try {
    await window.__NINOU_BOOT_PROMISE__;
  } catch (error) {
    window.__NINOU_BOOT_PROMISE__ = null;
    showBootFailure(error);
  }
}

bootNinou();
