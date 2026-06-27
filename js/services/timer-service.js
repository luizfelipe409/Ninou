import { hour } from "../config/constants.js";
import { formatTime } from "../utils/time.js";
import { getActiveNightWakeEvent, getLiveElapsedMs, isRoutineRunning } from "../domain/sleep.js";

export function getWakeWindowText({ state, now = Date.now(), formatShortDuration, formatTimeLabel = formatTime } = {}) {
  if (!isRoutineRunning(state)) return "";

  const elapsed = getLiveElapsedMs(state, now);
  if (getActiveNightWakeEvent(state)) {
    return `Despertar iniciado às ${formatTimeLabel(state.activeStartedAt)}.`;
  }

  if (state.mode === "sleeping") {
    const wakeWindowMs = Number(state.lastWakeWindowMs);
    if (Number.isFinite(wakeWindowMs) && wakeWindowMs > 0) {
      return `Ficou acordado ${formatShortDuration(wakeWindowMs)} antes de dormir.`;
    }
    return `Dormindo desde ${formatTimeLabel(state.activeStartedAt)}.`;
  }

  return `Acordado desde ${formatTimeLabel(state.activeStartedAt)}.`;
}

export function getActiveTimerDetails({
  state,
  wakeWindowMinutes = 70,
  typeConfig = {},
  now = Date.now(),
  formatTimeLabel = formatTime,
} = {}) {
  if (!isRoutineRunning(state)) return null;

  const nightWakeActive = getActiveNightWakeEvent(state);
  const sleeping = state.mode === "sleeping";
  const elapsed = getLiveElapsedMs(state, now);
  const activeType = sleeping ? state.activeType || "sono" : nightWakeActive ? "despertar-noturno" : "acordou";
  const config = typeConfig[activeType] || null;
  const title = sleeping
    ? (config?.title || "Sono")
    : nightWakeActive
      ? "Despertar noturno"
      : "Tempo acordado";
  const iconKey = sleeping ? state.activeType || "sono" : nightWakeActive ? "despertar-noturno" : "acordou";
  const actionLabel = sleeping ? "Acordou" : nightWakeActive ? "Voltou a dormir" : "Iniciar soneca";
  const kicker = sleeping ? "Timer de sono" : nightWakeActive ? "Timer noturno" : "Timer acordado";
  const meta = sleeping
    ? `${config?.title || "Sono"} iniciado às ${formatTimeLabel(state.activeStartedAt)}`
    : nightWakeActive
      ? `Despertar iniciado às ${formatTimeLabel(state.activeStartedAt)}`
      : `Acordado desde ${formatTimeLabel(state.activeStartedAt)}`;
  const targetMs = sleeping
    ? (state.activeType === "dormir" ? 8 * hour : 2 * hour)
    : Math.max(20 * 60000, wakeWindowMinutes * 60000);

  return {
    title,
    iconKey,
    actionLabel,
    kicker,
    meta,
    elapsed,
    progress: Math.max(3, Math.min(100, Math.round((elapsed / targetMs) * 100))),
  };
}
