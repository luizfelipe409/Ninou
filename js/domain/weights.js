import { storageKeys } from "../config/constants.js";
import { readJson, writeJson } from "../storage/local-storage.js";

function createWeightId(date) {
  return `peso-${date}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function normalizeWeights(weights = []) {
  if (!Array.isArray(weights)) return [];

  return weights
    .map((item) => {
      const rawValue = Number(String(item.value ?? item.weight ?? "").replace(",", "."));
      const value = Number.isFinite(rawValue) && rawValue > 40 ? rawValue / 1000 : rawValue;
      const date = typeof item.date === "string" ? item.date : "";
      const id = typeof item.id === "string" ? item.id : createWeightId(date);
      if (!date || !Number.isFinite(value) || value <= 0 || value > 30) return null;
      return { id, date, value };
    })
    .filter(Boolean)
    .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
}

export function loadLocalWeights() {
  return normalizeWeights(readJson(storageKeys.weights, []));
}

export function persistLocalWeights(weights) {
  writeJson(storageKeys.weights, normalizeWeights(weights));
}

export function upsertWeight(weights = [], { date, value }) {
  const normalized = normalizeWeights(weights);
  const existingIndex = normalized.findIndex((item) => item.date === date);
  const nextItem = {
    id: existingIndex >= 0 ? normalized[existingIndex].id : createWeightId(date),
    date,
    value,
  };

  if (existingIndex >= 0) normalized[existingIndex] = nextItem;
  else normalized.push(nextItem);

  return normalizeWeights(normalized);
}

export function removeWeightById(weights = [], id) {
  return normalizeWeights(weights).filter((weight) => weight.id !== id);
}
