/** Repositório JSON genérico sobre um adapter de storage. */
export function createJsonRepository({ key, storage, defaultValue, validate = () => true, version = 1 }) {
  if (!key || !storage) throw new TypeError("key e storage são obrigatórios");

  function envelope(data) { return { schemaVersion: version, updatedAt: new Date().toISOString(), data }; }

  function read() {
    const raw = storage.readJson(key, null);
    if (raw == null) return cloneDefault();
    const data = raw && typeof raw === "object" && "data" in raw ? raw.data : raw;
    return validate(data) ? data : cloneDefault();
  }

  function write(data) {
    if (!validate(data)) throw new TypeError(`Dados inválidos para ${key}`);
    return storage.writeJson(key, envelope(data));
  }

  function update(updater) {
    if (typeof updater !== "function") throw new TypeError("updater deve ser função");
    const next = updater(read());
    return write(next) ? next : null;
  }

  function clear() { return storage.removeKeys([key]); }
  function cloneDefault() {
    if (typeof structuredClone === "function") return structuredClone(defaultValue);
    return JSON.parse(JSON.stringify(defaultValue));
  }

  return Object.freeze({ key, read, write, update, clear });
}
