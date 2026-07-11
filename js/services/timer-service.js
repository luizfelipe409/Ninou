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
  void state;
  void wakeWindowMinutes;
  void typeConfig;
  void now;
  void formatTimeLabel;

  // v75.2: removido da tela Hoje para evitar duplicidade visual.
  // O tempo principal agora fica somente no card central:
  // “Dormindo há”, “Acordado há” ou “Despertar noturno há”.
  // A ação principal logo abaixo continua encerrando/iniciando a rotina.
  return null;
}
