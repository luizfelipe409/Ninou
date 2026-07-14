import { storageHealth } from "../storage/local-storage.js";

const VERSION = "81.0.0";
const STARTED_AT = performance.now();
const samples = [];

function addSample(type, detail = {}) {
  samples.push({ type, detail, at: new Date().toISOString() });
  if (samples.length > 30) samples.shift();
}

window.addEventListener("ninou:storage-error", (event) => addSample("storage", event.detail || {}));
window.addEventListener("ninou:connectivity", (event) => addSample("connectivity", event.detail || {}));

export function snapshot() {
  const navigation = performance.getEntriesByType("navigation")[0];
  return Object.freeze({
    version: VERSION,
    uptimeMs: Math.round(performance.now() - STARTED_AT),
    bootMs: Math.round(performance.getEntriesByName("ninou-boot").at(-1)?.duration || 0),
    domInteractiveMs: Math.round(navigation?.domInteractive || 0),
    online: navigator.onLine,
    displayMode: matchMedia("(display-mode: standalone)").matches ? "standalone" : "browser",
    architecture: window.NinouArchitecture ? { version: window.NinouArchitecture.version, state: window.NinouArchitecture.state.snapshot() } : null,
    storage: storageHealth(),
    samples: samples.slice(-10),
  });
}

window.__NINOU_DIAGNOSTICS__ = Object.freeze({ version: VERSION, snapshot, addSample });
document.documentElement.dataset.ninouDiagnostics = VERSION;
