const clone = (value) => {
  if (typeof structuredClone === "function") return structuredClone(value);
  return JSON.parse(JSON.stringify(value));
};

/** Estado central mínimo e observável. Não substitui ainda o núcleo legado. */
export function createAppState(initialState = {}, eventBus = null) {
  let state = Object.freeze({ ...initialState });
  const subscribers = new Set();

  function getState() { return state; }

  function setState(patch, meta = {}) {
    const partial = typeof patch === "function" ? patch(state) : patch;
    if (!partial || typeof partial !== "object" || Array.isArray(partial)) {
      throw new TypeError("A atualização de estado deve ser um objeto ou função que retorne objeto.");
    }
    const previous = state;
    state = Object.freeze({ ...state, ...partial });
    const change = Object.freeze({ previous, current: state, patch: Object.freeze({ ...partial }), meta: Object.freeze({ ...meta }) });
    for (const subscriber of [...subscribers]) subscriber(change);
    eventBus?.emit?.("state:changed", change);
    return state;
  }

  function subscribe(subscriber, { immediate = false } = {}) {
    if (typeof subscriber !== "function") throw new TypeError("subscriber deve ser uma função");
    subscribers.add(subscriber);
    if (immediate) subscriber(Object.freeze({ previous: state, current: state, patch: {}, meta: { immediate: true } }));
    return () => subscribers.delete(subscriber);
  }

  function snapshot() { return Object.freeze(clone(state)); }

  return Object.freeze({ getState, setState, subscribe, snapshot });
}
