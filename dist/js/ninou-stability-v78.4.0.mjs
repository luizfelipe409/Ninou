import { readJson, writeJson } from "./storage/local-storage.js";
const STABILITY_VERSION = "78.4.0";
const ERROR_KEY = "ninou:runtime-errors";
const MAX_ERRORS = 15;

function readErrors() {
  const value = readJson(ERROR_KEY, []);
  return Array.isArray(value) ? value : [];
}

function saveError(entry) {
  const errors = readErrors();
  errors.push(entry);
  writeJson(ERROR_KEY, errors.slice(-MAX_ERRORS));
}

function normalizeError(kind, value) {
  const error = value instanceof Error ? value : null;
  return {
    kind,
    message: String(error?.message || value?.reason?.message || value?.message || value || "Erro desconhecido").slice(0, 500),
    stack: String(error?.stack || value?.reason?.stack || "").slice(0, 1600),
    version: STABILITY_VERSION,
    path: location.pathname,
    online: navigator.onLine,
    at: new Date().toISOString(),
  };
}

function updateConnectivity() {
  document.documentElement.classList.toggle("ninou-is-offline", !navigator.onLine);
  document.documentElement.dataset.ninouConnectivity = navigator.onLine ? "online" : "offline";
  window.dispatchEvent(new CustomEvent("ninou:connectivity", { detail: { online: navigator.onLine } }));
}

function markReady() {
  try {
    performance.mark("ninou-app-stable");
    performance.measure("ninou-boot-total", "navigationStart", "ninou-app-stable");
  } catch (_) {}
  document.documentElement.dataset.ninouStability = STABILITY_VERSION;
}

window.addEventListener("error", (event) => {
  saveError(normalizeError("error", event.error || event.message));
});

window.addEventListener("unhandledrejection", (event) => {
  saveError(normalizeError("unhandledrejection", event.reason));
});

window.addEventListener("online", updateConnectivity, { passive: true });
window.addEventListener("offline", updateConnectivity, { passive: true });
let hiddenAt = 0;
let lastResumeAt = 0;
function dispatchResume(source) {
  const now = Date.now();
  if (now - lastResumeAt < 700) return;
  lastResumeAt = now;
  window.dispatchEvent(new CustomEvent("ninou:resume", { detail: { source, at: now } }));
}

window.addEventListener("pageshow", (event) => {
  updateConnectivity();
  if (event.persisted) dispatchResume("pageshow");
}, { passive: true });

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden") {
    hiddenAt = Date.now();
    return;
  }
  updateConnectivity();
  if (hiddenAt && Date.now() - hiddenAt > 450) dispatchResume("visibility");
  hiddenAt = 0;
}, { passive: true });

updateConnectivity();
markReady();
window.__NINOU_STABILITY__ = Object.freeze({ version: STABILITY_VERSION, readErrors });
