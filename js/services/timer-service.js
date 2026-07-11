import { formatTime } from "../utils/time.js";
import { getActiveNightWakeEvent, isRoutineRunning } from "../domain/sleep.js";

export function getWakeWindowText({ state, formatShortDuration, formatTimeLabel = formatTime } = {}) {
  if (!isRoutineRunning(state)) return "";

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
