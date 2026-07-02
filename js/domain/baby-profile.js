import { storageKeys } from "../config/constants.js";
import { readJson, readString, writeJson, writeString } from "../storage/local-storage.js";
import { loadLocalWeights, normalizeWeights, persistLocalWeights } from "./weights.js";

export const defaultWakeWindowMinutes = 70;
export const profileThemeModes = Object.freeze(["light", "dark", "auto"]);

export const defaultBabyAvatar = Object.freeze({
  face: "3d-soft",
  hair: "topetinho-suave",
  hairColor: "castanho-mel",
  skin: "pele-clara",
  background: "lavanda",
});

export function normalizeBabyAvatar(avatar = {}) {
  const source = avatar && typeof avatar === "object" ? avatar : {};
  const legacyHair = typeof source.icon === "string" && source.icon ? source.icon : "";
  const legacySkin = typeof source.skin === "string" && source.skin ? source.skin : "";
  const legacyBackground = typeof source.color === "string" && source.color ? source.color : "";
  const legacyHairColor = typeof source.hairColor === "string" && source.hairColor ? source.hairColor : "";

  return {
    face: "3d-soft",
    hair: typeof source.hair === "string" && source.hair ? source.hair : (legacyHair || defaultBabyAvatar.hair),
    hairColor: legacyHairColor || defaultBabyAvatar.hairColor,
    skin: legacySkin || defaultBabyAvatar.skin,
    background: legacyBackground || defaultBabyAvatar.background,
  };
}

export function normalizeThemeMode(value) {
  return profileThemeModes.includes(value) ? value : "dark";
}

export function getDefaultBabyProfile() {
  return {
    name: "",
    article: "do",
    birthDate: "",
    themeMode: normalizeThemeMode(readString(storageKeys.themeMode, "dark")),
    avatar: normalizeBabyAvatar(),
    avatarConfigured: false,
    weights: loadLocalWeights(),
  };
}

export function normalizeBabyProfile(profile = {}) {
  const themeMode = normalizeThemeMode(profile.themeMode || readString(storageKeys.themeMode, "dark"));
  const avatar = normalizeBabyAvatar(profile.avatar || profile.babyAvatar || profile.babyAvatarConfig);
  const explicitConfigured = typeof profile.avatarConfigured === "boolean" ? profile.avatarConfigured : null;
  const inferredConfigured = JSON.stringify(avatar) !== JSON.stringify(defaultBabyAvatar);

  return {
    name: typeof profile.name === "string" ? profile.name : "",
    article: profile.article === "da" ? "da" : "do",
    birthDate: typeof profile.birthDate === "string" ? profile.birthDate : "",
    themeMode,
    avatar,
    avatarConfigured: explicitConfigured === null ? inferredConfigured : explicitConfigured,
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
      normalizedProfile.themeMode !== "dark" ||
      normalizedProfile.avatarConfigured ||
      normalizedProfile.weights.length > 0 ||
      windowMinutes !== defaultWakeWindowMinutes,
  );
}
