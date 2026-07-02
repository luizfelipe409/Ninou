import { storageKeys } from "../config/constants.js";
import { readJson, readString, writeJson, writeString } from "../storage/local-storage.js";
import { loadLocalWeights, normalizeWeights, persistLocalWeights } from "./weights.js";

export const defaultWakeWindowMinutes = 70;
export const profileThemeModes = Object.freeze(["auto", "light", "dark"]);

export function normalizeThemeMode(value) {
  return profileThemeModes.includes(value) ? value : "auto";
}

export function getDefaultBabyProfile() {
  return {
    name: "",
    article: "do",
    birthDate: "",
    themeMode: normalizeThemeMode(readString(storageKeys.themeMode, "auto")),
    weights: loadLocalWeights(),
  };
}

export function normalizeBabyProfile(profile = {}) {
  const themeMode = normalizeThemeMode(profile.themeMode || readString(storageKeys.themeMode, "auto"));
  return {
    name: typeof profile.name === "string" ? profile.name : "",
    article: profile.article === "da" ? "da" : "do",
    birthDate: typeof profile.birthDate === "string" ? profile.birthDate : "",
    themeMode,
    weights: normalizeWeights(profile.weights || loadLocalWeights()),
  };
}

export function loadBabyProfile() {
  return normalizeBabyProfile({
    ...getDefaultBabyProfile(),
    ...(readJson(storageKeys.profile, {}) || {}),
  });
}

export function saveBabyProfile(profile, options = {}) {
  const normalized = normalizeBabyProfile(profile);
  writeJson(storageKeys.profile, normalized);
  writeString(storageKeys.themeMode, normalized.themeMode);
  persistLocalWeights(normalized.weights);

  if (options.profileClientUpdatedAt) {
    writeString(storageKeys.profileVersion, options.profileClientUpdatedAt);
  }

  return normalized;
}

export function getCloudProfileVersion(data = {}) {
  const version = Number(data.clientUpdatedAt);
  return Number.isFinite(version) ? version : 0;
}

export function hasProfileContent(profile = {}, photo = "", windowMinutes = defaultWakeWindowMinutes) {
  const normalizedProfile = normalizeBabyProfile(profile);
  return Boolean(
    normalizedProfile.name.trim() ||
      normalizedProfile.birthDate ||
      photo ||
      normalizedProfile.article === "da" ||
      normalizedProfile.themeMode !== "auto" ||
      normalizedProfile.weights.length > 0 ||
      windowMinutes !== defaultWakeWindowMinutes,
  );
}
