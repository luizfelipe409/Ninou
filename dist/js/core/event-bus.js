/** Pequeno barramento de eventos, sem dependência do DOM. */
export function createEventBus() {
  const listeners = new Map();

  function on(type, listener) {
    if (typeof listener !== "function") throw new TypeError("listener deve ser uma função");
    const bucket = listeners.get(type) || new Set();
    bucket.add(listener);
    listeners.set(type, bucket);
    return () => off(type, listener);
  }

  function once(type, listener) {
    const unsubscribe = on(type, (payload) => {
      unsubscribe();
      listener(payload);
    });
    return unsubscribe;
  }

  function off(type, listener) {
    const bucket = listeners.get(type);
    if (!bucket) return false;
    const removed = bucket.delete(listener);
    if (!bucket.size) listeners.delete(type);
    return removed;
  }

  function emit(type, payload) {
    const bucket = listeners.get(type);
    if (!bucket) return 0;
    for (const listener of [...bucket]) {
      try { listener(payload); }
      catch (error) { queueMicrotask(() => { throw error; }); }
    }
    return bucket.size;
  }

  function clear(type) {
    if (typeof type === "string") return listeners.delete(type);
    listeners.clear();
    return true;
  }

  return Object.freeze({ on, once, off, emit, clear });
}
