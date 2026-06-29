import { storageKeys } from "../config/constants.js";
import { readJson, readString, writeJson, writeString } from "../storage/local-storage.js";
import { loadLocalWeights, normalizeWeights, persistLocalWeights } from "./weights.js";

export const defaultWakeWindowMinutes = 70;
export const profileThemeModes = Object.freeze(["auto", "light", "dark"]);

export const defaultBabyAvatar = Object.freeze({
  icon: "baby",
  color: "lilac",
  background: "moon",
  accessory: "none",
});

export function normalizeBabyAvatar(avatar = {}) {
  const source = avatar && typeof avatar === "object" ? avatar : {};
  return {
    icon: typeof source.icon === "string" && source.icon ? source.icon : defaultBabyAvatar.icon,
    color: typeof source.color === "string" && source.color ? source.color : defaultBabyAvatar.color,
    background: typeof source.background === "string" && source.background ? source.background : defaultBabyAvatar.background,
    accessory: typeof source.accessory === "string" && source.accessory ? source.accessory : defaultBabyAvatar.accessory,
  };
}

export function normalizeThemeMode(value) {
  return profileThemeModes.includes(value) ? value : "auto";
}

export function getDefaultBabyProfile() {
  return {
    name: "",
    article: "do",
    birthDate: "",
    themeMode: normalizeThemeMode(readString(storageKeys.themeMode, "auto")),
    avatar: normalizeBabyAvatar(),
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
    avatar: normalizeBabyAvatar(profile.avatar || profile.babyAvatar || profile.babyAvatarConfig),
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

export function hasProfileContent(profile = {}, _photo = "", windowMinutes = defaultWakeWindowMinutes) {
  const normalizedProfile = normalizeBabyProfile(profile);
  return Boolean(
    normalizedProfile.name.trim() ||
      normalizedProfile.birthDate ||
      normalizedProfile.article === "da" ||
      normalizedProfile.themeMode !== "auto" ||
      JSON.stringify(normalizedProfile.avatar) !== JSON.stringify(defaultBabyAvatar) ||
      normalizedProfile.weights.length > 0 ||
      windowMinutes !== defaultWakeWindowMinutes,
  );
}
