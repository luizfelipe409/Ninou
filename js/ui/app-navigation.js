export function updateScreenVisibility({ target, navButtons, screens } = {}) {
  if (!target) return;

  navButtons?.forEach((item) => {
    item.classList.toggle("active", item.dataset.target === target);
  });

  screens?.forEach((screen) => {
    screen.classList.toggle("active", screen.dataset.screen === target);
  });
}

export function bindBottomNavigation(buttons, onNavigate) {
  buttons?.forEach((button) => {
    button.addEventListener("click", () => {
      const target = button.dataset.target;
      if (target) onNavigate?.(target);
    });
  });
}

export function bindSyncPillNavigation(syncPill, onNavigate, target = "profile") {
  if (!syncPill) return;
  syncPill.addEventListener("click", () => onNavigate?.(target));
}

export function createHorizontalScrollToggle({
  scroller,
  button,
  forwardLabel = "Mostrar mais",
  backLabel = "Voltar",
  threshold = 6,
  animationDelay = 280,
} = {}) {
  function getMaxScroll() {
    if (!scroller) return 0;
    return Math.max(0, scroller.scrollWidth - scroller.clientWidth);
  }

  function isAtEnd() {
    return scroller ? scroller.scrollLeft >= getMaxScroll() - threshold : false;
  }

  function update() {
    if (!scroller || !button) return;

    const maxScroll = getMaxScroll();
    if (maxScroll <= 4) {
      button.hidden = true;
      return;
    }

    button.hidden = false;
    const atEnd = isAtEnd();
    button.classList.toggle("is-back", atEnd);
    button.setAttribute("aria-label", atEnd ? backLabel : forwardLabel);
    button.title = atEnd ? backLabel : forwardLabel;
  }

  function scroll() {
    if (!scroller) return;

    const maxScroll = getMaxScroll();
    scroller.scrollTo({
      left: isAtEnd() ? 0 : maxScroll,
      behavior: "smooth",
    });
    window.setTimeout(update, animationDelay);
  }

  function bind() {
    if (button) button.addEventListener("click", scroll);
    if (scroller) {
      scroller.addEventListener("scroll", update, { passive: true });
      window.addEventListener("resize", update);
    }
    window.setTimeout(update, 0);
  }

  return { update, scroll, bind };
}
