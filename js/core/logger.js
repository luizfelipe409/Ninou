const LEVELS = Object.freeze({ debug: 10, info: 20, warn: 30, error: 40 });

export function createLogger({ namespace = "ninou", minLevel = "info", capacity = 80, sink = console } = {}) {
  const entries = [];
  const threshold = LEVELS[minLevel] ?? LEVELS.info;

  function write(level, event, detail = {}) {
    if ((LEVELS[level] ?? 0) < threshold) return null;
    const entry = Object.freeze({ level, event: String(event), detail: sanitize(detail), at: new Date().toISOString(), namespace });
    entries.push(entry);
    if (entries.length > capacity) entries.splice(0, entries.length - capacity);
    const method = level === "debug" ? "debug" : level;
    sink?.[method]?.(`[${namespace}] ${event}`, entry.detail);
    return entry;
  }

  const api = {
    debug: (event, detail) => write("debug", event, detail),
    info: (event, detail) => write("info", event, detail),
    warn: (event, detail) => write("warn", event, detail),
    error: (event, detail) => write("error", event, detail),
    recent: (limit = 20) => entries.slice(-Math.max(0, limit)),
    clear: () => { entries.length = 0; },
  };
  return Object.freeze(api);
}

function sanitize(value, depth = 0) {
  if (depth > 3) return "[profundidade limitada]";
  if (value == null || ["string", "number", "boolean"].includes(typeof value)) return value;
  if (value instanceof Error) return { name: value.name, message: value.message };
  if (Array.isArray(value)) return value.slice(0, 30).map((item) => sanitize(item, depth + 1));
  if (typeof value === "object") {
    const output = {};
    for (const [key, item] of Object.entries(value).slice(0, 30)) {
      if (/token|password|senha|secret|authorization/i.test(key)) output[key] = "[redacted]";
      else output[key] = sanitize(item, depth + 1);
    }
    return output;
  }
  return String(value);
}
