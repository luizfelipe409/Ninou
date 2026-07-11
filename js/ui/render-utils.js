export function setHtml(element, value) {
  if (!element) return;
  const nextValue = String(value);
  if (element.innerHTML !== nextValue) {
    element.innerHTML = nextValue;
  }
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
