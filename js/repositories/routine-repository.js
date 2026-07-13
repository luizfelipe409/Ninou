import { createJsonRepository } from "./json-repository.js";

export function createRoutineRepository({ storage, key = "ninou:routine:v1" } = {}) {
  const base = createJsonRepository({ key, storage, defaultValue: [], validate: Array.isArray, version: 1 });
  return Object.freeze({
    ...base,
    append(record) {
      if (!record || typeof record !== "object") throw new TypeError("Registro inválido");
      return base.update((records) => [...records, record]);
    },
    removeById(id) { return base.update((records) => records.filter((record) => record?.id !== id)); },
    findById(id) { return base.read().find((record) => record?.id === id) || null; },
  });
}
