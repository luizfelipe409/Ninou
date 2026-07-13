import { createJsonRepository } from "./json-repository.js";

export function createProfileRepository({ storage, key = "ninou:profile:v1" } = {}) {
  return createJsonRepository({
    key, storage, defaultValue: {}, version: 1,
    validate: (value) => Boolean(value && typeof value === "object" && !Array.isArray(value)),
  });
}
