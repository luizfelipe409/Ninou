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

function toMilliseconds(value) {
  if (value === null || typeof value === "undefined" || value === "") return null;
  if (typeof value === "number" && Number.isFinite(value)) {
    if (value > 100000000000) return value;
    if (value > 1000000000) return value * 1000;
    return value;
  }
  if (value instanceof Date) return value.getTime();
  if (typeof value?.toMillis === "function") return value.toMillis();
  if (typeof value === "object" && Number.isFinite(Number(value.seconds))) {
    return Number(value.seconds) * 1000 + Math.floor(Number(value.nanoseconds || 0) / 1000000);
  }
  if (typeof value === "string") {
    const parsed = Date.parse(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function normalizeTimestampText(value) {
  if (typeof value === "string") return value;
  const timestamp = toMilliseconds(value);
  return Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : "";
}

function firstTimestamp(...values) {
  for (const value of values) {
    const timestamp = toMilliseconds(value);
    if (Number.isFinite(timestamp)) return timestamp;
  }
  return null;
}

export function getEventOrderTime(event = {}) {
  const timestamp = firstTimestamp(event.eventTime, event.start, event.createdAtClient, event.createdAt);
  return Number.isFinite(timestamp) ? timestamp : 0;
}

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
    deletedEventIds: [],
    auditLog: [],
    dayNotes: "",
  };
}

export function createEventId(type, start) {
  return `${type}-${Math.round(start)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function makeEvent(type, start, end = start, detail = "", notes = "", meta = {}) {
  return {
    id: createEventId(type, start),
    type,
    start,
    end,
    detail,
    notes,
    ...meta,
  };
}

export function normalizeRecordType(rawType = "sono") {
  const stringType = typeof rawType === "string" ? rawType : "sono";
  const mappedType = TYPE_ALIASES[stringType] || stringType;
  return typeConfig[mappedType] ? mappedType : "sono";
}

export function normalizeEvent(event = {}) {
  const type = normalizeRecordType(event.type);
  const start = firstTimestamp(event.start, event.eventTime, event.createdAtClient, event.createdAt);
  const end = firstTimestamp(event.end);

  if (!Number.isFinite(start)) return null;

  const wakeWindowStartedAt = Number(event.wakeWindowStartedAt);
  const wakeWindowMs = Number(event.wakeWindowMs);
  const eventTime = firstTimestamp(event.eventTime, start);
  const label = typeof event.label === "string" && event.label.trim()
    ? event.label.trim()
    : typeConfig[type]?.title || type;
  const caregiverRole = typeof event.caregiverRole === "string" && event.caregiverRole.trim()
    ? event.caregiverRole.trim()
    : typeof event.caregiverRelationship === "string"
      ? event.caregiverRelationship.trim()
      : "";

  return {
    id: typeof event.id === "string" ? event.id : createEventId(type, start),
    type,
    label,
    eventTime,
    start,
    end: Number.isFinite(end) ? end : start,
    detail: typeof event.detail === "string" ? event.detail : "",
    notes: typeof event.notes === "string" ? event.notes : "",
    createdAt: normalizeTimestampText(event.createdAt),
    createdByUid: typeof event.createdByUid === "string" ? event.createdByUid : "",
    createdByEmail: typeof event.createdByEmail === "string" ? event.createdByEmail : "",
    createdByDeviceId: typeof event.createdByDeviceId === "string" ? event.createdByDeviceId : "",
    createdByName: typeof event.createdByName === "string" ? event.createdByName : "",
    createdByRelationship: typeof event.createdByRelationship === "string" ? event.createdByRelationship : "",
    caregiverName: typeof event.caregiverName === "string" ? event.caregiverName : "",
    caregiverRole,
    caregiverRelationship: typeof event.caregiverRelationship === "string" ? event.caregiverRelationship : "",
    caregiverLabel: typeof event.caregiverLabel === "string" ? event.caregiverLabel : "",
    createdAtClient: Number.isFinite(Number(event.createdAtClient)) ? Number(event.createdAtClient) : null,
    authorName: typeof event.authorName === "string" ? event.authorName : "",
    responsibleName: typeof event.responsibleName === "string" ? event.responsibleName : "",
    updatedAt: normalizeTimestampText(event.updatedAt),
    updatedByUid: typeof event.updatedByUid === "string" ? event.updatedByUid : "",
    updatedByEmail: typeof event.updatedByEmail === "string" ? event.updatedByEmail : "",
    updatedByDeviceId: typeof event.updatedByDeviceId === "string" ? event.updatedByDeviceId : "",
    updatedByName: typeof event.updatedByName === "string" ? event.updatedByName : "",
    updatedByRelationship: typeof event.updatedByRelationship === "string" ? event.updatedByRelationship : "",
    updatedAtClient: Number.isFinite(Number(event.updatedAtClient)) ? Number(event.updatedAtClient) : null,
    babyId: typeof event.babyId === "string" ? event.babyId : "",
    familyId: typeof event.familyId === "string" ? event.familyId : "",
    lastAction: typeof event.lastAction === "string" ? event.lastAction : "",
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
    deletedEventIds: Array.isArray(dayState.deletedEventIds)
      ? [...new Set(dayState.deletedEventIds.filter((item) => typeof item === "string" && item.trim()).map((item) => item.trim()))].slice(-240)
      : [],
    auditLog: Array.isArray(dayState.auditLog)
      ? dayState.auditLog.slice(-60).map((item = {}) => ({
          id: typeof item.id === "string" ? item.id : `audit-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          action: typeof item.action === "string" ? item.action : "alterou",
          title: typeof item.title === "string" ? item.title : "Registro",
          at: typeof item.at === "string" ? item.at : "",
          byUid: typeof item.byUid === "string" ? item.byUid : "",
          byEmail: typeof item.byEmail === "string" ? item.byEmail : "",
          byName: typeof item.byName === "string" ? item.byName : "",
          byRelationship: typeof item.byRelationship === "string" ? item.byRelationship : "",
          eventId: typeof item.eventId === "string" ? item.eventId : "",
        }))
      : [],
    dayId: typeof dayState.dayId === "string" ? dayState.dayId : "",
    date: typeof dayState.date === "string" ? dayState.date : "",
    clientUpdatedAt: Number.isFinite(Number(dayState.clientUpdatedAt)) ? Number(dayState.clientUpdatedAt) : 0,
    dayNotes: typeof dayState.dayNotes === "string" ? dayState.dayNotes : "",
    dayNotesDayId: typeof dayState.dayNotesDayId === "string" ? dayState.dayNotesDayId : "",
    dayNotesUpdatedAt: Number.isFinite(Number(dayState.dayNotesUpdatedAt)) ? Number(dayState.dayNotesUpdatedAt) : 0,
  };
}

export function sortEventsByStartDesc(events = []) {
  return [...events].sort((a, b) => getEventOrderTime(b) - getEventOrderTime(a));
}

export function sortEventsByStartAsc(events = []) {
  return [...events].sort((a, b) => getEventOrderTime(a) - getEventOrderTime(b));
}

export function getEventsForDay(events = [], selectedStart, dayMs = day) {
  const selectedEnd = selectedStart + dayMs;
  return events.filter((event) => {
    const eventTime = getEventOrderTime(event);
    return eventTime >= selectedStart && eventTime < selectedEnd;
  });
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
  const nextType = updates.type ?? event.type;
  const explicitEnd = Number(updates.end);
  const currentDuration = Math.max(0, Number(event.end) - Number(event.start));
  const end = Number.isFinite(explicitEnd)
    ? Math.max(start, explicitEnd)
    : currentDuration
      ? start + currentDuration
      : start;

  Object.assign(event, {
    type: nextType,
    label: updates.label ?? typeConfig[nextType]?.title ?? event.label ?? nextType,
    eventTime: Number.isFinite(Number(updates.eventTime)) ? Number(updates.eventTime) : start,
    start,
    end,
    detail: updates.detail ?? event.detail ?? "",
    notes: updates.notes ?? event.notes ?? "",
    updatedAt: updates.updatedAt ?? event.updatedAt ?? "",
    updatedByUid: updates.updatedByUid ?? event.updatedByUid ?? "",
    updatedByEmail: updates.updatedByEmail ?? event.updatedByEmail ?? "",
    updatedByDeviceId: updates.updatedByDeviceId ?? event.updatedByDeviceId ?? "",
    updatedByName: updates.updatedByName ?? event.updatedByName ?? "",
    updatedByRelationship: updates.updatedByRelationship ?? event.updatedByRelationship ?? "",
    updatedAtClient: updates.updatedAtClient ?? event.updatedAtClient ?? null,
    caregiverName: updates.caregiverName ?? event.caregiverName ?? "",
    caregiverRole: updates.caregiverRole ?? updates.caregiverRelationship ?? event.caregiverRole ?? event.caregiverRelationship ?? "",
    caregiverRelationship: updates.caregiverRelationship ?? event.caregiverRelationship ?? "",
    caregiverLabel: updates.caregiverLabel ?? event.caregiverLabel ?? "",
    babyId: updates.babyId ?? event.babyId ?? "",
    familyId: updates.familyId ?? event.familyId ?? "",
    lastAction: updates.lastAction ?? event.lastAction ?? "",
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
