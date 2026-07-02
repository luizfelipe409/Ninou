import { storageKeys } from "../config/constants.js";
import { normalizeThemeMode } from "../domain/baby-profile.js";

export function resolveThemeMode({ themeModeInput, profile = {}, storageKey = storageKeys.themeMode } = {}) {
  const storedMode = themeModeInput?.value || profile.themeMode || localStorage.getItem(storageKey) || "dark";
  return normalizeThemeMode(storedMode);
}

export function shouldUseDayTheme(mode = "dark", date = new Date()) {
  const safeMode = normalizeThemeMode(mode);
  const hourValue = date.getHours();

  if (safeMode === "auto") {
    return hourValue >= 6 && hourValue < 18;
  }

  return safeMode === "light";
}

export function updateThemeBody({ body = document.body, themeModeInput, profile = {}, storageKey = storageKeys.themeMode } = {}) {
  const mode = resolveThemeMode({ themeModeInput, profile, storageKey });
  const dayTheme = shouldUseDayTheme(mode);
  if (body.classList.contains("day-theme") !== dayTheme) {
    body.classList.toggle("day-theme", dayTheme);
  }
  return { mode, dayTheme };
}

export function readThemeModeInput(themeModeInput) {
  return normalizeThemeMode(themeModeInput?.value || "dark");
}
