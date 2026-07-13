const VERSION = "78.4.1";

function important(element, property, value) {
  if (element) element.style.setProperty(property, value, "important");
}

function stabilizeOrbit() {
  const orbit = document.querySelector(".state-orbit.live-timeline-orbit");
  const center = orbit?.querySelector(".orbit-center-safe");
  const clock = orbit?.querySelector("#stateClock");
  if (!orbit || !center || !clock) return;

  important(orbit, "position", "relative");
  important(orbit, "display", "block");
  important(orbit, "overflow", "hidden");

  important(center, "position", "absolute");
  important(center, "inset", "50% auto auto 50%");
  important(center, "left", "50%");
  important(center, "top", "50%");
  important(center, "margin", "0");
  important(center, "padding", "8px");
  important(center, "display", "flex");
  important(center, "flex-direction", "column");
  important(center, "align-items", "center");
  important(center, "justify-content", "center");
  important(center, "text-align", "center");
  important(center, "transform", "translate(-50%, -50%)");

  ["#stateLabel", "#stateClock", "#stateHint"].forEach((selector) => {
    const element = orbit.querySelector(selector);
    important(element, "position", "static");
    important(element, "inset", "auto");
    important(element, "width", "100%");
    important(element, "max-width", "100%");
    important(element, "margin", "0");
    important(element, "padding", "0");
    important(element, "display", "block");
    important(element, "text-align", "center");
    important(element, "transform", "none");
  });

  important(clock, "font-variant-numeric", "tabular-nums");
  important(clock, "white-space", "nowrap");
}

function stabilizeQuickActions() {
  const grid = document.querySelector("#quickActions.quick-actions");
  if (!grid) return;

  important(grid, "display", "grid");
  important(grid, "grid-template-columns", "repeat(2, minmax(0, 1fr))");
  important(grid, "grid-auto-flow", "row");
  important(grid, "overflow", "visible");

  [...grid.querySelectorAll(":scope > button[data-open-sheet]")].forEach((button) => {
    important(button, "position", "relative");
    important(button, "inset", "auto");
    important(button, "display", "flex");
    important(button, "flex-direction", "column");
    important(button, "align-items", "center");
    important(button, "justify-content", "center");
    important(button, "gap", "10px");
    important(button, "overflow", "hidden");
    important(button, "transform", "none");

    const icon = button.querySelector(":scope > .action-icon, :scope > .type-icon");
    important(icon, "position", "relative");
    important(icon, "inset", "auto");
    important(icon, "top", "auto");
    important(icon, "right", "auto");
    important(icon, "bottom", "auto");
    important(icon, "left", "auto");
    important(icon, "flex", "0 0 56px");
    important(icon, "width", "56px");
    important(icon, "height", "56px");
    important(icon, "min-width", "56px");
    important(icon, "min-height", "56px");
    important(icon, "max-width", "56px");
    important(icon, "max-height", "56px");
    important(icon, "margin", "0");
    important(icon, "display", "grid");
    important(icon, "place-items", "center");
    important(icon, "transform", "none");

    const label = button.querySelector(":scope > span:last-child");
    important(label, "position", "static");
    important(label, "inset", "auto");
    important(label, "width", "100%");
    important(label, "margin", "0");
    important(label, "display", "flex");
    important(label, "align-items", "center");
    important(label, "justify-content", "center");
    important(label, "text-align", "center");
    important(label, "transform", "none");
  });
}

function verifyGeometry() {
  const orbit = document.querySelector(".state-orbit.live-timeline-orbit");
  const center = orbit?.querySelector(".orbit-center-safe");
  const buttons = [...document.querySelectorAll("#quickActions.quick-actions > button[data-open-sheet]")];
  if (!orbit || !center || buttons.length !== 4) return false;

  const orbitRect = orbit.getBoundingClientRect();
  const centerRect = center.getBoundingClientRect();
  const centerDeltaX = Math.abs((centerRect.left + centerRect.width / 2) - (orbitRect.left + orbitRect.width / 2));
  const centerDeltaY = Math.abs((centerRect.top + centerRect.height / 2) - (orbitRect.top + orbitRect.height / 2));
  const iconsInside = buttons.every((button) => {
    const b = button.getBoundingClientRect();
    const icon = button.querySelector(":scope > .action-icon, :scope > .type-icon")?.getBoundingClientRect();
    return icon && icon.top >= b.top - 0.5 && icon.bottom <= b.bottom + 0.5 && icon.left >= b.left - 0.5 && icon.right <= b.right + 0.5;
  });

  const valid = centerDeltaX <= 2 && centerDeltaY <= 2 && iconsInside;
  document.documentElement.dataset.ninouVisualGeometry = valid ? "valid" : "repairing";
  return valid;
}

function applyVisualGuard() {
  stabilizeOrbit();
  stabilizeQuickActions();
  requestAnimationFrame(() => {
    if (!verifyGeometry()) {
      stabilizeOrbit();
      stabilizeQuickActions();
      requestAnimationFrame(verifyGeometry);
    }
  });
}

let resizeTimer = 0;
let guardFrame = 0;
function queueVisualGuard() {
  if (guardFrame) return;
  guardFrame = requestAnimationFrame(() => {
    guardFrame = 0;
    applyVisualGuard();
  });
}

window.addEventListener("resize", () => {
  window.clearTimeout(resizeTimer);
  resizeTimer = window.setTimeout(queueVisualGuard, 80);
}, { passive: true });
window.addEventListener("orientationchange", queueVisualGuard, { passive: true });
window.addEventListener("ninou:resume", queueVisualGuard, { passive: true });
window.addEventListener("ninou:auth-ready", queueVisualGuard, { passive: true });
window.addEventListener("ninou:boot-revealed", queueVisualGuard, { passive: true });

const observer = new MutationObserver((mutations) => {
  const relevant = mutations.some((mutation) => {
    if (mutation.type === "childList") return mutation.addedNodes.length > 0 || mutation.removedNodes.length > 0;
    if (mutation.type !== "attributes") return false;
    if (mutation.target === document.documentElement && mutation.attributeName === "class") return true;
    if (mutation.target === document.body && mutation.attributeName === "class") return true;
    if (mutation.attributeName === "hidden") return true;
    return mutation.target instanceof Element && mutation.target.matches(".screen");
  });
  if (relevant) queueVisualGuard();
});
observer.observe(document.documentElement, {
  subtree: true,
  childList: true,
  attributes: true,
  attributeFilter: ["class", "hidden"],
});

applyVisualGuard();
document.documentElement.dataset.ninouVisualGuard = VERSION;
window.__NINOU_VISUAL_GUARD__ = Object.freeze({ version: VERSION, apply: applyVisualGuard, verify: verifyGeometry });
