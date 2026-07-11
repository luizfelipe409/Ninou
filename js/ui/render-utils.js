export function setHtml(element, value) {
  if (!element) return;
  const nextValue = String(value);
  if (element.innerHTML !== nextValue) {
    element.innerHTML = nextValue;
  }
}

export function clearElement(element) {
  if (!element) return;
  element.replaceChildren();
}

export function appendChildren(element, children = []) {
  if (!element) return;
  children.filter(Boolean).forEach((child) => element.append(child));
}

export function createElement(tagName, { className = "", html = "", text = "", attributes = {} } = {}) {
  const element = document.createElement(tagName);
  if (className) element.className = className;
  if (html) element.innerHTML = html;
  if (text) element.textContent = text;
  Object.entries(attributes).forEach(([name, value]) => {
    if (value !== undefined && value !== null) element.setAttribute(name, String(value));
  });
  return element;
}
