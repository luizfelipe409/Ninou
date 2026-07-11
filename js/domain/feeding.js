
export const feedingTypes = Object.freeze(["amamentacao", "mamadeira"]);

export function isBreastfeedingEvent(event = {}) {
  return event.type === "amamentacao";
}

export function isBottleEvent(event = {}) {
  return event.type === "mamadeira";
}

export function isFeedingEvent(event = {}) {
  return feedingTypes.includes(event.type);
}

export function countBreastfeedingEvents(events = []) {
  return events.filter(isBreastfeedingEvent).length;
}

export function countFeedingEvents(events = []) {
  return events.filter(isFeedingEvent).length;
}

export function parseAmountMl(detail = "") {
  const match = String(detail).replace(",", ".").match(/(\d+(?:\.\d+)?)/);
  return match ? Number(match[1]) : 0;
}

export function sumBottleAmountMl(events = []) {
  return events.filter(isBottleEvent).reduce((total, event) => total + parseAmountMl(event.detail), 0);
}

export function normalizeBottleAmount(value, { min = 0, max = 350, step = 5 } = {}) {
  const numericValue = Number(value) || 0;
  const rounded = Math.round(numericValue / step) * step;
  return Math.min(max, Math.max(min, rounded));
}

export function createBreastTimerState(overrides = {}) {
  return {
    leftMs: Number(overrides.leftMs) || 0,
    rightMs: Number(overrides.rightMs) || 0,
    activeSide: ["left", "right"].includes(overrides.activeSide) ? overrides.activeSide : null,
    lastStartedAt: Number(overrides.lastStartedAt) || 0,
    intervalId: overrides.intervalId ?? null,
  };
}

export function formatBreastTimer(ms) {
  const safeMs = Math.max(0, Math.floor(ms || 0));
  const totalSeconds = Math.floor(safeMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function getBreastTimerSnapshot(timerState = {}, now = Date.now()) {
  const state = createBreastTimerState(timerState);
  const leftExtra = state.activeSide === "left" ? now - state.lastStartedAt : 0;
  const rightExtra = state.activeSide === "right" ? now - state.lastStartedAt : 0;

  return {
    leftMs: state.leftMs + Math.max(0, leftExtra),
    rightMs: state.rightMs + Math.max(0, rightExtra),
  };
}

export function stopBreastTimerState(timerState = {}, now = Date.now(), clearTimer = globalThis.clearInterval) {
  const state = createBreastTimerState(timerState);
  if (!state.activeSide) return state;

  const elapsed = Math.max(0, now - state.lastStartedAt);
  if (state.activeSide === "left") state.leftMs += elapsed;
  if (state.activeSide === "right") state.rightMs += elapsed;

  if (state.intervalId && typeof clearTimer === "function") clearTimer(state.intervalId);

  state.activeSide = null;
  state.lastStartedAt = 0;
  state.intervalId = null;
  return state;
}

export function resetBreastTimerState(timerState = {}, clearTimer = globalThis.clearInterval) {
  const state = createBreastTimerState(timerState);
  if (state.intervalId && typeof clearTimer === "function") clearTimer(state.intervalId);
  return createBreastTimerState();
}

export function startBreastTimerSide(timerState = {}, side = "left", intervalId = null, now = Date.now()) {
  const state = createBreastTimerState(timerState);
  return {
    ...state,
    activeSide: side === "right" ? "right" : "left",
    lastStartedAt: now,
    intervalId,
  };
}

export function getBreastTimerDetail(snapshot = {}, fallbackDetail = "") {
  const leftMs = Number(snapshot.leftMs) || 0;
  const rightMs = Number(snapshot.rightMs) || 0;
  const totalMs = leftMs + rightMs;
  if (totalMs <= 0) return fallbackDetail;

  if (leftMs > 0 && rightMs > 0) {
    return `Mista • E ${formatBreastTimer(leftMs)} • D ${formatBreastTimer(rightMs)} • Total ${formatBreastTimer(totalMs)}`;
  }

  if (leftMs > 0) return `Esquerdo • E ${formatBreastTimer(leftMs)}`;
  return `Direito • D ${formatBreastTimer(rightMs)}`;
}
