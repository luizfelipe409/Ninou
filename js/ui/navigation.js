export function bindShortcutNavigation(buttons, showScreen) {
  buttons?.forEach((button) => {
    button.addEventListener("click", () => showScreen(button.dataset.targetShortcut));
  });
}
