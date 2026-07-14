const CONSISTENCY_VERSION = "82.0.3";

const primaryClasses = [
  "primary-action", "profile-primary-button", "commercial-primary-action",
  "avatar-save-button", "day-note-save-button"
];
const secondaryClasses = [
  "profile-secondary-button", "ghost-link", "avatar-skip-button"
];
const dangerClasses = ["family-danger-button", "danger-soft-button"];

function hasAnyClass(element, names) {
  return names.some((name) => element.classList.contains(name));
}

function classifyControl(element) {
  if (!(element instanceof HTMLElement)) return;
  if (element.matches("button, a, [role='button']")) {
    element.dataset.ninouControl = hasAnyClass(element, dangerClasses)
      ? "danger"
      : hasAnyClass(element, primaryClasses)
        ? "primary"
        : hasAnyClass(element, secondaryClasses)
          ? "secondary"
          : element.classList.contains("fab")
            ? "fab"
            : "neutral";
  }
  if (element.matches("input, select, textarea")) {
    element.dataset.ninouField = element.matches("select") ? "select" : element.matches("textarea") ? "textarea" : "input";
  }
  if (element.matches(".ninou-modal-card, .record-sheet, .orbit-cluster-sheet")) {
    element.dataset.ninouSurface = "overlay";
  }
  if (element.matches(".card, [class*='-card'], article")) {
    element.dataset.ninouSurface ||= "card";
  }
}

function enhanceScope(root = document) {
  if (root instanceof Element) classifyControl(root);
  root.querySelectorAll?.("button, a, [role='button'], input, select, textarea, .ninou-modal-card, .record-sheet, .orbit-cluster-sheet, .card, [class*='-card'], article")
    .forEach(classifyControl);
}

function normalizeAccessibleNames(root = document) {
  root.querySelectorAll?.("button, a, [role='button']").forEach((control) => {
    if (control.getAttribute("aria-label") || control.textContent.trim()) return;
    const title = control.getAttribute("title");
    if (title) control.setAttribute("aria-label", title);
  });
}

function installObserver() {
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      mutation.addedNodes.forEach((node) => {
        if (!(node instanceof Element)) return;
        enhanceScope(node);
        normalizeAccessibleNames(node);
      });
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
}

function initializeConsistencyLayer() {
  document.documentElement.dataset.ninouConsistency = CONSISTENCY_VERSION;
  enhanceScope(document);
  normalizeAccessibleNames(document);
  installObserver();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeConsistencyLayer, { once: true });
} else {
  initializeConsistencyLayer();
}
