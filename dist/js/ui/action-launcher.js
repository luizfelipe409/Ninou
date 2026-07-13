const get = (selector) => document.querySelector(selector);

export function initActionLauncher() {
  const launcher = get("#actionLauncher");
  const openButton = get("#openActionLauncherButton");
  const closeButton = get("#closeActionLauncherButton");
  if (!launcher || !openButton || launcher.dataset.bound === "true") return;
  launcher.dataset.bound = "true";

  const close = () => {
    launcher.hidden = true;
    document.body?.classList.remove("action-launcher-open");
    document.documentElement?.classList.remove("action-launcher-open");
    openButton.setAttribute("aria-expanded", "false");
  };
  const open = () => {
    launcher.hidden = false;
    document.body?.classList.add("action-launcher-open");
    document.documentElement?.classList.add("action-launcher-open");
    openButton.setAttribute("aria-expanded", "true");
    requestAnimationFrame(() => launcher.querySelector("[data-launch-record]")?.focus({ preventScroll: true }));
  };

  openButton.addEventListener("click", open);
  closeButton?.addEventListener("click", close);
  launcher.addEventListener("click", (event) => {
    if (event.target.closest("[data-close-action-launcher]")) return close();
    const action = event.target.closest("[data-launch-record]");
    if (!action) return;
    const type = action.dataset.launchRecord;
    close();
    requestAnimationFrame(() => {
      if (typeof window.NinouOpenRecordSheet === "function") window.NinouOpenRecordSheet(type);
      else document.querySelector(`.quick-actions [data-open-sheet="${type}"]`)?.click();
    });
  });
  window.addEventListener("keydown", (event) => { if (event.key === "Escape" && !launcher.hidden) close(); });
  window.addEventListener("ninou:screen-change", close, { passive: true });
}
