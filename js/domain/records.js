import { day } from "../config/constants.js";
import { isSleepEvent, isSleepType, typeConfig } from "./record-types.js";

const TYPE_ALIASES = Object.freeze({
  medicine: "medicamento",
  medication: "medicamento",
  remedio: "medicamento",
  diaper: "fralda",
  feed: "amamentacao",
  breastfeeding: "amamentacao",
  bottle: "mamadeira",
  sleep: "sono",
  nap: "sono",
  night: "dormir",
  wake: "acordou",
  awake: "acordou",
  acordou: "acordou",
});

export function createEmptyDayState() {
  return {
    mode: "idle",
    activeStartedAt: null,
    activeType: "sono",
    activeDetail: "",
    activeNotes: "",
    lastWakeWindowStartedAt: null,
    lastWakeWindowMs: null,
    events: [],
  };
}

export function createEventId(type, start) {
  return `${type}-${Math.round(start)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function makeEvent(type, start, end = start, detail = "", notes = "") {
  return {
    id: createEventId(type, start),
    type,
    start,
    end,
    detail,
    notes,
  };
}

export function normalizeRecordType(rawType = "sono") {
  const stringType = typeof rawType === "string" ? rawType : "sono";
  const mappedType = TYPE_ALIASES[stringType] || stringType;
  return typeConfig[mappedType] ? mappedType : "sono";
}

export function normalizeEvent(event = {}) {
  const type = normalizeRecordType(event.type);
  const start = Number(event.start);
  const end = Number(event.end);

  if (!Number.isFinite(start)) return null;

  const wakeWindowStartedAt = Number(event.wakeWindowStartedAt);
  const wakeWindowMs = Number(event.wakeWindowMs);

  return {
    id: typeof event.id === "string" ? event.id : createEventId(type, start),
    type,
    start,
    end: Number.isFinite(end) ? end : start,
    detail: typeof event.detail === "string" ? event.detail : "",
    notes: typeof event.notes === "string" ? event.notes : "",
    ...(Number.isFinite(wakeWindowStartedAt) && Number.isFinite(wakeWindowMs) && wakeWindowMs > 0
      ? { wakeWindowStartedAt, wakeWindowMs }
      : {}),
  };
}

export function normalizeDayState(dayState = {}) {
  const emptyState = createEmptyDayState();
  const validModes = ["idle", "awake", "sleeping"];
  const mode = validModes.includes(dayState.mode) ? dayState.mode : emptyState.mode;
  const activeStartedAt = Number(dayState.activeStartedAt);
  const activeType = isSleepType(dayState.activeType) ? dayState.activeType : emptyState.activeType;

  const lastWakeWindowStartedAt = Number(dayState.lastWakeWindowStartedAt);
  const lastWakeWindowMs = Number(dayState.lastWakeWindowMs);

  return {
    mode,
    activeStartedAt: mode === "idle" || !Number.isFinite(activeStartedAt) ? null : activeStartedAt,
    activeType: mode === "sleeping" ? activeType : emptyState.activeType,
    activeDetail: mode === "sleeping" && typeof dayState.activeDetail === "string" ? dayState.activeDetail : emptyState.activeDetail,
    activeNotes: mode === "sleeping" && typeof dayState.activeNotes === "string" ? dayState.activeNotes : emptyState.activeNotes,
    lastWakeWindowStartedAt: Number.isFinite(lastWakeWindowStartedAt) ? lastWakeWindowStartedAt : null,
    lastWakeWindowMs: Number.isFinite(lastWakeWindowMs) && lastWakeWindowMs > 0 ? lastWakeWindowMs : null,
    events: Array.isArray(dayState.events) ? dayState.events.map(normalizeEvent).filter(Boolean) : [],
  };
}

export function sortEventsByStartDesc(events = []) {
  return [...events].sort((a, b) => b.start - a.start);
}

export function sortEventsByStartAsc(events = []) {
  return [...events].sort((a, b) => a.start - b.start);
}

export function getEventsForDay(events = [], selectedStart, dayMs = day) {
  const selectedEnd = selectedStart + dayMs;
  return events.filter((event) => event.start >= selectedStart && event.start < selectedEnd);
}

export function getLatestEvent(events = []) {
  return sortEventsByStartDesc(events)[0] || null;
}

export function findEventById(events = [], eventId) {
  return events.find((event) => event.id === eventId) || null;
}

export function matchesDiaryFilter(event, filter = "all") {
  if (filter === "all") return true;
  if (filter === "sleep") return isSleepEvent(event) || event.type === "despertar-noturno" || event.type === "acordou";
  if (filter === "feeding") return event.type === "mamadeira" || event.type === "amamentacao";
  if (filter === "diaper") return event.type === "fralda";
  if (filter === "medicine") return event.type === "medicamento";
  return true;
}

export function updateEventKeepingDuration(event, updates = {}) {
  if (!event) return null;
  const nextStart = Number(updates.start);
  const start = Number.isFinite(nextStart) ? nextStart : event.start;
  const explicitEnd = Number(updates.end);
  const currentDuration = Math.max(0, Number(event.end) - Number(event.start));
  const end = Number.isFinite(explicitEnd)
    ? Math.max(start, explicitEnd)
    : currentDuration
      ? start + currentDuration
      : start;

  Object.assign(event, {
    type: updates.type ?? event.type,
    start,
    end,
    detail: updates.detail ?? event.detail ?? "",
    notes: updates.notes ?? event.notes ?? "",
  });

  if (Number.isFinite(Number(updates.wakeWindowStartedAt)) && Number.isFinite(Number(updates.wakeWindowMs)) && Number(updates.wakeWindowMs) > 0) {
    event.wakeWindowStartedAt = Number(updates.wakeWindowStartedAt);
    event.wakeWindowMs = Number(updates.wakeWindowMs);
  } else {
    delete event.wakeWindowStartedAt;
    delete event.wakeWindowMs;
  }

  return event;
}

export function removeEventById(events = [], eventId) {
  return events.filter((item) => item.id !== eventId);
}
