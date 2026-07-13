const UX_VERSION = "78.1.0";
const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

function vibrate(pattern = 10) {
  try { if (!reduceMotion && navigator.vibrate) navigator.vibrate(pattern); } catch (_) {}
}

function isInteractive(element) {
  return element instanceof Element && Boolean(element.closest("button, a, [role='button'], input, select, textarea"));
}

function addPressFeedback(event) {
  const target = event.target instanceof Element ? event.target.closest("button, a, [role='button']") : null;
  if (!target || target.matches(":disabled, [aria-disabled='true']")) return;
  target.classList.remove("ninou-press-feedback");
  void target.offsetWidth;
  target.classList.add("ninou-press-feedback");
  window.setTimeout(() => target.classList.remove("ninou-press-feedback"), 360);
}

function classifyHaptic(target) {
  if (!target) return;
  if (target.matches(".primary-action, [data-start-mode], [data-last-record-action='undo']")) return vibrate([12, 28, 12]);
  if (target.matches("[data-open-sheet], [data-sheet-type], .quick-actions button, .fab")) return vibrate(9);
  if (target.matches(".bottom-nav button, [data-target], [data-target-shortcut]")) return vibrate(5);
  if (target.matches("button[type='submit'], .profile-primary-button, #saveRecordButton, #sheetSaveButton")) return vibrate(12);
}

function enhanceScreens() {
  const screens = [...document.querySelectorAll(".screen")];
  screens.forEach((screen) => {
    if (screen.classList.contains("active")) screen.classList.add("ninou-screen-entered");
  });
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      const screen = mutation.target;
      if (!(screen instanceof Element) || !screen.matches(".screen")) continue;
      if (screen.classList.contains("active")) {
        screen.classList.remove("ninou-screen-entered");
        requestAnimationFrame(() => requestAnimationFrame(() => screen.classList.add("ninou-screen-entered")));
        const title = screen.getAttribute("aria-label") || "tela";
        document.documentElement.dataset.ninouScreen = screen.dataset.screen || title.toLowerCase();
      } else {
        screen.classList.remove("ninou-screen-entered");
      }
    }
  });
  screens.forEach((screen) => observer.observe(screen, { attributes: true, attributeFilter: ["class"] }));
}

function enhanceSheetsAndModals() {
  const selectors = ["#recordSheet", "#orbitClusterSheet", ".ninou-modal", ".record-sheet", ".orbit-cluster-sheet"];
  const elements = [...new Set(selectors.flatMap((selector) => [...document.querySelectorAll(selector)]))];
  let openCount = 0;
  const sync = (element) => {
    const visible = !element.hidden && getComputedStyle(element).display !== "none";
    if (visible) {
      element.classList.add("ninou-surface-opening");
      requestAnimationFrame(() => element.classList.add("ninou-surface-open"));
      window.setTimeout(() => element.classList.remove("ninou-surface-opening"), 420);
    } else {
      element.classList.remove("ninou-surface-open", "ninou-surface-opening");
    }
    openCount = elements.filter((item) => !item.hidden && getComputedStyle(item).display !== "none").length;
    document.documentElement.classList.toggle("ninou-overlay-open", openCount > 0);
  };
  const observer = new MutationObserver((mutations) => mutations.forEach((m) => sync(m.target)));
  elements.forEach((element) => {
    observer.observe(element, { attributes: true, attributeFilter: ["hidden", "class", "style"] });
    sync(element);
  });
}

function enhanceOrbitAndRecords() {
  const orbit = document.querySelector("#orbitEvents");
  const correction = document.querySelector("#routineCorrectionCard");
  if (orbit) {
    let previousCount = orbit.children.length;
    new MutationObserver(() => {
      const nextCount = orbit.children.length;
      if (nextCount > previousCount) {
        orbit.classList.remove("ninou-orbit-updated");
        requestAnimationFrame(() => orbit.classList.add("ninou-orbit-updated"));
        window.setTimeout(() => orbit.classList.remove("ninou-orbit-updated"), 720);
        vibrate([8, 22, 8]);
      }
      previousCount = nextCount;
    }).observe(orbit, { childList: true, subtree: false });
  }
  if (correction) {
    new MutationObserver(() => {
      if (!correction.hidden) {
        correction.classList.remove("ninou-confirm-enter");
        requestAnimationFrame(() => correction.classList.add("ninou-confirm-enter"));
        window.setTimeout(() => correction.classList.remove("ninou-confirm-enter"), 900);
      }
    }).observe(correction, { attributes: true, attributeFilter: ["hidden"] });
  }
}

function enhancePendingButtons() {
  document.addEventListener("click", (event) => {
    const button = event.target instanceof Element ? event.target.closest("button") : null;
    if (!button || button.disabled) return;
    const isSave = button.matches("#sheetSaveButton, #saveRecordButton, [data-save-record], .profile-primary-button");
    if (!isSave) return;
    button.classList.add("ninou-action-pending");
    window.setTimeout(() => button.classList.remove("ninou-action-pending"), 850);
  }, true);
}

function enhanceScrollShadows() {
  const shell = document.querySelector("main.phone-shell");
  if (!shell) return;
  let ticking = false;
  const update = () => {
    ticking = false;
    document.documentElement.classList.toggle("ninou-has-scrolled", window.scrollY > 12 || shell.scrollTop > 12);
  };
  const requestUpdate = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
  window.addEventListener("scroll", requestUpdate, { passive: true });
  shell.addEventListener("scroll", requestUpdate, { passive: true });
  update();
}

function init() {
  document.documentElement.dataset.ninouUx = UX_VERSION;
  document.addEventListener("pointerdown", addPressFeedback, { passive: true, capture: true });
  document.addEventListener("click", (event) => {
    const target = event.target instanceof Element ? event.target.closest("button, a, [role='button']") : null;
    classifyHaptic(target);
  }, { passive: true, capture: true });
  document.addEventListener("keydown", (event) => {
    if ((event.key === "Enter" || event.key === " ") && isInteractive(event.target)) addPressFeedback(event);
  }, true);
  enhanceScreens();
  enhanceSheetsAndModals();
  enhanceOrbitAndRecords();
  enhancePendingButtons();
  enhanceScrollShadows();
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
else init();
