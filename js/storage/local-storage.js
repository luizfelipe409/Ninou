export function readString(key, fallback = "") {
  try {
    return localStorage.getItem(key) || fallback;
  } catch {
    return fallback;
  }
}

export function readJson(key, fallback = null) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function writeString(key, value) {
  localStorage.setItem(key, String(value));
}

export function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}
