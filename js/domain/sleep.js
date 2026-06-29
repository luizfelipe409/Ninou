import { day } from "../config/constants.js";
import { isSleepType } from "./record-types.js";
import { getDayStart } from "../utils/time.js";

export function isRoutineRunning(state = {}) {
  return state.mode !== "idle" && Number.isFinite(Number(state.activeStartedAt));
}

export function isSleeping(state = {}) {
  return state.mode === "sleeping" && Number.isFinite(Number(state.activeStartedAt));
}

export function isAwake(state = {}) {
  return state.mode === "awake" && Number.isFinite(Number(state.activeStartedAt));
}

export function getLiveElapsedMs(state = {}, now = Date.now()) {
  if (!isRoutineRunning(state)) return 0;
  return Math.max(0, now - Number(state.activeStartedAt));
}

export function setLastWakeWindowBeforeSleep(state = {}, sleepStartedAt = Date.now()) {
  const awakeStartedAt = isAwake(state) ? Number(state.activeStartedAt) : null;
  if (Number.isFinite(awakeStartedAt) && sleepStartedAt > awakeStartedAt) {
    state.lastWakeWindowStartedAt = awakeStartedAt;
    state.lastWakeWindowMs = sleepStartedAt - awakeStartedAt;
  } else {
    state.lastWakeWindowStartedAt = null;
    state.lastWakeWindowMs = null;
  }
  return state;
}

export function getActiveNightWakeEvent(state = {}) {
  if (!isAwake(state)) return null;

  return [...(state.events || [])]
    .reverse()
    .find((event) => (
      event.type === "despertar-noturno" &&
      Math.abs(Number(event.start) - Number(state.activeStartedAt)) < 60000 &&
      Number(event.end) <= Number(event.start)
    )) || null;
}

export function closeActiveNightWake(state = {}, end = Date.now()) {
  const activeNightWake = getActiveNightWakeEvent(state);
  if (!activeNightWake || end < activeNightWake.start) return null;

  activeNightWake.end = end;
  return activeNightWake;
}

export function finishActiveSleep(state = {}, makeEvent, finishedAt = Date.now()) {
  if (!isSleeping(state)) return state;

  state.events = Array.isArray(state.events) ? state.events : [];
  state.events.push(makeEvent(
    state.activeType || "sono",
    Number(state.activeStartedAt),
    finishedAt,
    state.activeDetail || "Timer",
    state.activeNotes || "",
  ));

  state.mode = "awake";
  state.activeStartedAt = finishedAt;
  state.activeType = "sono";
  state.activeDetail = "";
  state.activeNotes = "";
  return state;
}

export function startSleepTimer(state = {}, startedAt = Date.now()) {
  const nightWakeActive = getActiveNightWakeEvent(state);
  setLastWakeWindowBeforeSleep(state, startedAt);
  closeActiveNightWake(state, startedAt);

  state.mode = "sleeping";
  state.activeStartedAt = startedAt;
  state.activeType = nightWakeActive ? "dormir" : "sono";
  state.activeDetail = nightWakeActive ? "Após despertar noturno" : "Timer";
  state.activeNotes = "";
  return state;
}

export function startRoutineTimer(state = {}, mode = "awake", startedAt = Date.now()) {
  state.mode = mode === "sleeping" ? "sleeping" : "awake";
  state.activeStartedAt = startedAt;
  state.activeType = "sono";
  state.activeDetail = state.mode === "sleeping" ? "Timer" : "";
  state.activeNotes = "";
  if (state.mode === "sleeping") {
    state.lastWakeWindowStartedAt = null;
    state.lastWakeWindowMs = null;
  }
  return state;
}

export function canUseManualTimeForLiveState(start, now = Date.now()) {
  const safeStart = Number(start);
  if (!Number.isFinite(safeStart)) return false;

  const sameDay = getDayStart(safeStart) === getDayStart(now);
  const notFuture = safeStart <= now + 2 * 60000;
  return sameDay && notFuture;
}

export function shouldStartLiveSleepFromManualEvent({ type, start, existingEvent, state, now = Date.now() } = {}) {
  if (existingEvent || !isSleepType(type) || state?.mode === "sleeping") return false;
  if (!canUseManualTimeForLiveState(start, now)) return false;

  if (isAwake(state)) {
    return start >= Number(state.activeStartedAt) - 5 * 60000;
  }

  return state?.mode === "idle";
}

export function shouldStartLiveAwakeFromManualNightWake({ type, start, existingEvent, state, now = Date.now() } = {}) {
  if (existingEvent || type !== "despertar-noturno") return false;
  if (!canUseManualTimeForLiveState(start, now)) return false;

  if (isSleeping(state) || isAwake(state)) {
    return start >= Number(state.activeStartedAt) - 5 * 60000;
  }

  return state?.mode === "idle";
}

export function startLiveAwakeFromManualNightWake(state = {}, makeEvent, start, detail = "", notes = "") {
  state.events = Array.isArray(state.events) ? state.events : [];

  if (isSleeping(state)) {
    const sleepStart = Number(state.activeStartedAt);
    const sleepEnd = Math.max(start, sleepStart);
    if (sleepEnd > sleepStart) {
      state.events.push(makeEvent(
        state.activeType || "sono",
        sleepStart,
        sleepEnd,
        state.activeDetail || "Timer",
        state.activeNotes || "",
      ));
    }
  }

  state.events.push(makeEvent("despertar-noturno", start, start, detail, notes));
  state.mode = "awake";
  state.activeStartedAt = start;
  state.activeType = "sono";
  state.activeDetail = "";
  state.activeNotes = "";
  return state;
}

export function startLiveSleepFromManualEvent(state = {}, type, start, detail = "", notes = "") {
  setLastWakeWindowBeforeSleep(state, start);
  closeActiveNightWake(state, start);

  state.mode = "sleeping";
  state.activeStartedAt = start;
  state.activeType = isSleepType(type) ? type : "sono";
  state.activeDetail = detail || "Timer";
  state.activeNotes = notes || "";
  return state;
}

export function getOverlapDuration(start, end, windowStart, windowEnd) {
  const safeStart = Number(start);
  const safeEnd = Number(end);
  if (!Number.isFinite(safeStart)) return 0;

  const boundedStart = Math.max(safeStart, windowStart);
  const boundedEnd = Math.min(Number.isFinite(safeEnd) ? safeEnd : safeStart, windowEnd);
  return Math.max(0, boundedEnd - boundedStart);
}

export function getRoutineStartForRange(events = [], state = {}, windowStart, windowEnd) {
  const candidates = [];

  events.forEach((event) => {
    const eventEnd = Math.max(Number(event.end) || event.start, event.start);
    if (eventEnd >= windowStart && event.start < windowEnd) {
      candidates.push(Math.max(event.start, windowStart));
    }
  });

  if (isRoutineRunning(state) && Number(state.activeStartedAt) < windowEnd) {
    candidates.push(Math.max(Number(state.activeStartedAt), windowStart));
  }

  if (!candidates.length) return null;
  return Math.min(...candidates);
}

export function getSleepMsForRange(events = [], state = {}, windowStart, windowEnd, isSleepEvent, now = Date.now()) {
  const completedSleepMs = events
    .filter(isSleepEvent)
    .reduce((total, event) => total + getOverlapDuration(event.start, event.end, windowStart, windowEnd), 0);

  if (isSleeping(state)) {
    return completedSleepMs + getOverlapDuration(state.activeStartedAt, now, windowStart, windowEnd);
  }

  return completedSleepMs;
}

export function getAwakeMsForRange(events = [], state = {}, windowStart, windowEnd, isSleepEvent, now = Date.now()) {
  const routineStart = getRoutineStartForRange(events, state, windowStart, windowEnd);
  if (routineStart === null) return 0;

  const sleepMs = getSleepMsForRange(events, state, windowStart, windowEnd, isSleepEvent, now);
  return Math.max(0, windowEnd - routineStart - sleepMs);
}

export function getSleepWindowDayMs() {
  return day;
}
