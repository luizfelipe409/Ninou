const UX_VERSION = "78.4.0";
const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

function vibrate(pattern = 8) {
  try { if (!reduceMotion && navigator.vibrate) navigator.vibrate(pattern); } catch (_) {}
}

function findControl(target) {
  return target instanceof Element ? target.closest("button, a, [role='button']") : null;
}

function addRipple(control, event) {
  if (!control || reduceMotion || control.matches(":disabled,[aria-disabled='true']")) return;
  const style = getComputedStyle(control);
  if (style.position === "static") control.style.position = "relative";
  if (style.overflow === "visible" && !control.matches(".bottom-nav button,.ghost-link")) control.style.overflow = "hidden";
  const rect = control.getBoundingClientRect();
  const x = Number.isFinite(event.clientX) && event.clientX > 0 ? event.clientX - rect.left : rect.width / 2;
  const y = Number.isFinite(event.clientY) && event.clientY > 0 ? event.clientY - rect.top : rect.height / 2;
  const ripple = document.createElement("span");
  ripple.className = "ninou-ripple";
  ripple.setAttribute("aria-hidden", "true");
  ripple.style.left = `${x}px`;
  ripple.style.top = `${y}px`;
  control.append(ripple);
  window.setTimeout(() => ripple.remove(), 620);
}

function addPressFeedback(event) {
  const control = findControl(event.target);
  if (!control || control.matches(":disabled,[aria-disabled='true']")) return;
  control.classList.remove("ninou-press-feedback");
  void control.offsetWidth;
  control.classList.add("ninou-press-feedback");
  addRipple(control, event);
  window.setTimeout(() => control.classList.remove("ninou-press-feedback"), 340);
}

function classifyHaptic(control) {
  if (!control) return;
  if (control.matches(".primary-action,[data-start-mode],[data-last-record-action='undo']")) return vibrate([12,24,12]);
  if (control.matches("[data-open-sheet],[data-sheet-type],.quick-actions button,.fab")) return vibrate(9);
  if (control.matches(".bottom-nav button,[data-target],[data-target-shortcut]")) return vibrate(5);
  if (control.matches("button[type='submit'],.profile-primary-button,.save-button")) return vibrate(12);
}

function enhanceScreens() {
  const screens = [...document.querySelectorAll(".screen")];
  const animate = (screen) => {
    if (!screen.classList.contains("active")) return screen.classList.remove("ninou-screen-entered");
    screen.classList.remove("ninou-screen-entered");
    requestAnimationFrame(() => requestAnimationFrame(() => screen.classList.add("ninou-screen-entered")));
    document.documentElement.dataset.ninouScreen = screen.dataset.screen || "unknown";
    screen.querySelector("button, input, select, textarea")?.blur?.();
  };
  screens.forEach(animate);
  const observer = new MutationObserver((mutations) => {
    mutations.forEach(({ target }) => { if (target instanceof Element && target.matches(".screen")) animate(target); });
  });
  screens.forEach((screen) => observer.observe(screen, { attributes: true, attributeFilter: ["class"] }));
}

function enhanceSheetsAndModals() {
  const selectors = ["#recordSheet", "#orbitClusterSheet", ".ninou-modal", ".record-sheet", ".orbit-cluster-sheet"];
  const elements = [...new Set(selectors.flatMap((selector) => [...document.querySelectorAll(selector)]))];
  const isVisible = (element) => !element.hidden && getComputedStyle(element).display !== "none";
  const syncRoot = () => document.documentElement.classList.toggle("ninou-overlay-open", elements.some(isVisible));
  const sync = (element) => {
    if (isVisible(element)) {
      element.classList.remove("ninou-surface-opening");
      requestAnimationFrame(() => element.classList.add("ninou-surface-opening"));
      window.setTimeout(() => element.classList.remove("ninou-surface-opening"), 430);
    } else {
      element.classList.remove("ninou-surface-opening", "ninou-surface-open");
    }
    syncRoot();
  };
  const observer = new MutationObserver((mutations) => mutations.forEach((mutation) => sync(mutation.target)));
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
        window.setTimeout(() => orbit.classList.remove("ninou-orbit-updated"), 760);
        vibrate([8,20,8]);
      }
      previousCount = nextCount;
    }).observe(orbit, { childList: true });
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
    const button = findControl(event.target);
    if (!(button instanceof HTMLButtonElement) || button.disabled) return;
    if (!button.matches(".save-button,.profile-primary-button,#supportSubmitButton,#exportPdfButton,#shareWhatsappButton")) return;
    button.classList.add("ninou-action-pending");
    window.setTimeout(() => button.classList.remove("ninou-action-pending"), 900);
  }, true);
}

function enhanceScrollShadows() {
  const shell = document.querySelector("main.phone-shell");
  if (!shell) return;
  let frame = 0;
  const update = () => {
    frame = 0;
    document.documentElement.classList.toggle("ninou-has-scrolled", window.scrollY > 10 || shell.scrollTop > 10);
  };
  const requestUpdate = () => { if (!frame) frame = requestAnimationFrame(update); };
  window.addEventListener("scroll", requestUpdate, { passive: true });
  shell.addEventListener("scroll", requestUpdate, { passive: true });
  update();
}

function initialize() {
  document.documentElement.dataset.ninouUx = UX_VERSION;
  document.addEventListener("pointerdown", addPressFeedback, { passive: true, capture: true });
  document.addEventListener("click", (event) => classifyHaptic(findControl(event.target)), { passive: true, capture: true });
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    const control = findControl(event.target);
    if (!control || control.matches(":disabled,[aria-disabled='true']")) return;
    control.classList.remove("ninou-press-feedback");
    void control.offsetWidth;
    control.classList.add("ninou-press-feedback");
    addRipple(control, { clientX: 0, clientY: 0 });
    window.setTimeout(() => control.classList.remove("ninou-press-feedback"), 340);
  }, true);
  enhanceScreens();
  enhanceSheetsAndModals();
  enhanceOrbitAndRecords();
  enhancePendingButtons();
  enhanceScrollShadows();
  window.dispatchEvent(new CustomEvent("ninou:ux-ready", { detail: { version: UX_VERSION } }));
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initialize, { once: true });
else initialize();
