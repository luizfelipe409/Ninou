export function bindShortcutNavigation(buttons, showScreen) {
  buttons?.forEach((button) => {
    button.addEventListener("click", () => showScreen(button.dataset.targetShortcut));
  });
}

export function bindButtonNavigation(buttons, showScreen, datasetKey = "target") {
  buttons?.forEach((button) => {
    button.addEventListener("click", () => showScreen(button.dataset[datasetKey]));
  });
}
