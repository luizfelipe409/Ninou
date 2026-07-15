const get = (selector) => document.querySelector(selector);

export function initActionLauncher() {
  const launcher = get("#actionLauncher");
  const openButton = get("#openActionLauncherButton");
  const closeButton = get("#closeActionLauncherButton");
  if (!launcher || !openButton || launcher.dataset.bound === "true") return;
  launcher.dataset.bound = "true";

  let openedFromKeyboard = false;
  const lockViewport = () => {
    if (!document.body || document.body.classList.contains("action-launcher-open")) return;
    const recordScrollY = Number(document.body.dataset.recordSheetScrollY);
    const currentScrollY = document.body.classList.contains("record-sheet-open") && Number.isFinite(recordScrollY)
      ? recordScrollY
      : window.scrollY || document.documentElement.scrollTop || 0;
    document.body.dataset.actionLauncherScrollY = String(currentScrollY);
    document.body.style.setProperty("--action-launcher-scroll-y", `-${currentScrollY}px`);
    document.body.classList.add("action-launcher-open");
    document.documentElement?.classList.add("action-launcher-open");
  };
  const unlockViewport = () => {
    const lockedScrollY = Number(document.body?.dataset?.actionLauncherScrollY || 0);
    document.body?.classList.remove("action-launcher-open");
    document.documentElement?.classList.remove("action-launcher-open");
    if (document.body) {
      document.body.style.removeProperty("--action-launcher-scroll-y");
      delete document.body.dataset.actionLauncherScrollY;
    }
    if (!document.body?.classList.contains("record-sheet-open") && Number.isFinite(lockedScrollY)) {
      requestAnimationFrame(() => window.scrollTo({ top: lockedScrollY, left: 0, behavior: "instant" }));
    }
  };
  const close = () => {
    launcher.hidden = true;
    unlockViewport();
    openButton.setAttribute("aria-expanded", "false");
    if (openedFromKeyboard) requestAnimationFrame(() => openButton.focus({ preventScroll: true }));
    openedFromKeyboard = false;
  };
  const open = (event) => {
    openedFromKeyboard = Boolean(event?.detail === 0);
    launcher.hidden = false;
    lockViewport();
    openButton.setAttribute("aria-expanded", "true");
    // No iPhone/PWA, focar automaticamente o primeiro card pode deslocar o
    // painel, esconder o botão fechar e causar saltos de texto. Mantemos o
    // foco automático apenas para abertura por teclado.
    if (openedFromKeyboard) requestAnimationFrame(() => closeButton?.focus({ preventScroll: true }));
  };

  openButton.addEventListener("click", open);
  closeButton?.addEventListener("click", close);
  launcher.addEventListener("click", (event) => {
    if (event.target.closest("[data-close-action-launcher]")) return close();
    const action = event.target.closest("[data-launch-record]");
    if (!action) return;
    const type = action.dataset.launchRecord;
    const opened = typeof window.NinouOpenRecordSheet === "function"
      ? window.NinouOpenRecordSheet(type)
      : document.querySelector(`.quick-actions [data-open-sheet="${type}"]`)?.click();
    if (opened !== false) close();
  });
  window.addEventListener("keydown", (event) => { if (event.key === "Escape" && !launcher.hidden) close(); });
  window.addEventListener("ninou:screen-change", close, { passive: true });

  try {
    Object.defineProperty(window, "NinouOpenActionLauncher", { value: () => { open(); return true; }, configurable: true });
  } catch (_) {
    window.NinouOpenActionLauncher = () => { open(); return true; };
  }
}
