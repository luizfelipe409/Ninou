export function setText(element, value) {
  if (!element) return;
  const nextValue = String(value);
  if (element.textContent !== nextValue) {
    element.textContent = nextValue;
  }
}

export function setHidden(element, hidden) {
  if (!element) return;
  if (element.hidden !== hidden) {
    element.hidden = hidden;
  }
}
