const CORRUPT_PREFIX = "ninou:quarantine:";
const STORAGE_ERROR_EVENT = "ninou:storage-error";

function emitStorageError(operation, key, error) {
  try {
    window.dispatchEvent(new CustomEvent(STORAGE_ERROR_EVENT, {
      detail: { operation, key, message: String(error?.message || error || "Falha de armazenamento") },
    }));
  } catch (_) {}
}

function getStorage() {
  try {
    const storage = window.localStorage;
    const probe = "__ninou_storage_probe__";
    storage.setItem(probe, "1");
    storage.removeItem(probe);
    return storage;
  } catch (error) {
    emitStorageError("probe", "", error);
    return null;
  }
}

function quarantine(key, raw) {
  const storage = getStorage();
  if (!storage || !raw) return;
  try {
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    storage.setItem(`${CORRUPT_PREFIX}${key}:${stamp}`, String(raw).slice(0, 200000));
    storage.removeItem(key);
  } catch (_) {}
}

export function readString(key, fallback = "") {
  const storage = getStorage();
  if (!storage) return fallback;
  try {
    const value = storage.getItem(key);
    return value == null ? fallback : value;
  } catch (error) {
    emitStorageError("read", key, error);
    return fallback;
  }
}

export function readNumber(key, fallback = 0) {
  const value = Number(readString(key, ""));
  return Number.isFinite(value) ? value : fallback;
}

export function readJson(key, fallback = null) {
  const raw = readString(key, "");
  if (!raw) return fallback;
  try {
    return JSON.parse(raw);
  } catch (error) {
    quarantine(key, raw);
    emitStorageError("parse", key, error);
    return fallback;
  }
}

export function writeString(key, value) {
  const storage = getStorage();
  if (!storage) return false;
  try {
    storage.setItem(key, String(value));
    return true;
  } catch (error) {
    emitStorageError("write", key, error);
    return false;
  }
}

export function writeJson(key, value) {
  let serialized;
  try { serialized = JSON.stringify(value); }
  catch (error) { emitStorageError("serialize", key, error); return false; }
  return writeString(key, serialized);
}

export function removeKeys(keys = []) {
  const storage = getStorage();
  if (!storage) return false;
  let ok = true;
  for (const key of keys) {
    try { storage.removeItem(key); }
    catch (error) { ok = false; emitStorageError("remove", key, error); }
  }
  return ok;
}

export function tryWriteString(key, value) {
  return writeString(key, value);
}

export function storageHealth() {
  const storage = getStorage();
  if (!storage) return { available: false, entries: 0, approximateBytes: 0 };
  let approximateBytes = 0;
  try {
    for (let index = 0; index < storage.length; index += 1) {
      const key = storage.key(index) || "";
      approximateBytes += key.length + (storage.getItem(key)?.length || 0);
    }
    return { available: true, entries: storage.length, approximateBytes: approximateBytes * 2 };
  } catch (error) {
    emitStorageError("health", "", error);
    return { available: true, entries: 0, approximateBytes: 0 };
  }
}
