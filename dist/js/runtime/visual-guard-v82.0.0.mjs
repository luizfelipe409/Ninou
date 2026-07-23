const VERSION = "82.1.4";

function verifyOrbit() {
  const orbit = document.querySelector(".state-orbit.live-timeline-orbit");
  const center = orbit?.querySelector(".orbit-center-safe");
  if (!orbit || !center || orbit.hidden) return true;
  const orbitRect = orbit.getBoundingClientRect();
  const centerRect = center.getBoundingClientRect();
  if (!orbitRect.width || !centerRect.width) return false;
  const deltaX = Math.abs((centerRect.left + centerRect.width / 2) - (orbitRect.left + orbitRect.width / 2));
  const deltaY = Math.abs((centerRect.top + centerRect.height / 2) - (orbitRect.top + orbitRect.height / 2));
  return deltaX <= 3 && deltaY <= 3;
}

function verifyQuickActions() {
  const grid = document.querySelector("#quickActions.quick-actions, .screen[data-screen='today'] > .quick-actions");
  if (!grid || grid.hidden) return true;
  const buttons = [...grid.querySelectorAll(":scope > button[data-open-sheet]")];
  if (buttons.length !== 4) return false;
  return buttons.every((button) => {
    const buttonRect = button.getBoundingClientRect();
    const icon = button.querySelector(":scope > .action-icon, :scope > .type-icon");
    const iconRect = icon?.getBoundingClientRect();
    if (!buttonRect.width || !iconRect?.width) return false;
    return iconRect.top >= buttonRect.top - 1
      && iconRect.bottom <= buttonRect.bottom + 1
      && iconRect.left >= buttonRect.left - 1
      && iconRect.right <= buttonRect.right + 1;
  });
}

function verifyMemberAvatars() {
  const avatars = [...document.querySelectorAll(".client-family-member-avatar")];
  return avatars.every((avatar) => {
    const rect = avatar.getBoundingClientRect();
    return rect.width <= 56 && rect.height <= 56 && rect.width >= 36 && rect.height >= 36;
  });
}

function verifyRecordSheet() {
  const sheet = document.querySelector("#recordSheet");
  if (!sheet || sheet.hidden) return true;
  const form = sheet.querySelector(".record-form");
  const footer = sheet.querySelector(".record-actions-footer");
  if (!form || !footer) return false;
  const sheetRect = sheet.getBoundingClientRect();
  const footerRect = footer.getBoundingClientRect();
  return footerRect.bottom <= sheetRect.bottom + 1 && footerRect.top >= sheetRect.top;
}

function runVisualCheck() {
  const results = {
    orbit: verifyOrbit(),
    quickActions: verifyQuickActions(),
    memberAvatars: verifyMemberAvatars(),
    recordSheet: verifyRecordSheet(),
  };
  const valid = Object.values(results).every(Boolean);
  document.documentElement.dataset.ninouVisualGeometry = valid ? "valid" : "attention";
  document.documentElement.dataset.ninouVisualGuard = VERSION;
  window.dispatchEvent(new CustomEvent("ninou:visual-check", { detail: { version: VERSION, valid, results } }));
  return { valid, results };
}

let frame = 0;
function queueVisualCheck() {
  if (frame) return;
  frame = requestAnimationFrame(() => {
    frame = 0;
    runVisualCheck();
  });
}

["resize", "orientationchange", "ninou:resume", "ninou:auth-ready", "ninou:boot-revealed"].forEach((eventName) => {
  window.addEventListener(eventName, queueVisualCheck, { passive: true });
});

const observer = new MutationObserver((mutations) => {
  const relevant = mutations.some((mutation) => mutation.type === "childList"
    || mutation.attributeName === "hidden"
    || (mutation.attributeName === "class" && (mutation.target === document.body || mutation.target === document.documentElement)));
  if (relevant) queueVisualCheck();
});
observer.observe(document.documentElement, { subtree: true, childList: true, attributes: true, attributeFilter: ["class", "hidden"] });

queueVisualCheck();
window.__NINOU_VISUAL_GUARD__ = Object.freeze({ version: VERSION, apply: queueVisualCheck, verify: runVisualCheck });
export default window.__NINOU_VISUAL_GUARD__;
