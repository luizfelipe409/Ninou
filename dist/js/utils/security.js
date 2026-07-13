const HTML_ENTITIES = Object.freeze({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" });

export function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, (character) => HTML_ENTITIES[character]);
}

export function setText(element, value = "") {
  if (element) element.textContent = String(value ?? "");
  return element;
}

export function safeExternalUrl(value, allowedProtocols = ["https:", "mailto:", "tel:"]) {
  try {
    const url = new URL(String(value), window.location.origin);
    return allowedProtocols.includes(url.protocol) ? url.href : "";
  } catch (_) {
    return "";
  }
}

export function sanitizeFilename(value, fallback = "ninou") {
  const normalized = String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const safe = normalized.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 96);
  return safe || fallback;
}
