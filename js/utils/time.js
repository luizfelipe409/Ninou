
export const APP_TIME_ZONE = "America/Sao_Paulo";

const pad2 = (value) => String(value).padStart(2, "0");

function getSafeDate(timestamp = Date.now()) {
  const date = new Date(Number(timestamp));
  return Number.isFinite(date.getTime()) ? date : new Date();
}

export function getZonedParts(timestamp = Date.now(), timeZone = APP_TIME_ZONE) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(getSafeDate(timestamp));

  const map = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return {
    year: Number(map.year),
    month: Number(map.month),
    date: Number(map.day),
    hour: Number(map.hour),
    minute: Number(map.minute),
    second: Number(map.second),
  };
}

function getTimeZoneOffsetMs(timestamp, timeZone = APP_TIME_ZONE) {
  const parts = getZonedParts(timestamp, timeZone);
  const utcFromZonedParts = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.date,
    parts.hour,
    parts.minute,
    parts.second,
    0,
  );
  return utcFromZonedParts - timestamp;
}

export function zonedDateTimeToTimestamp({
  year,
  month,
  date,
  hour: hourValue = 0,
  minute = 0,
  second = 0,
  millisecond = 0,
} = {}, timeZone = APP_TIME_ZONE) {
  const utcGuess = Date.UTC(
    Number(year),
    Number(month) - 1,
    Number(date),
    Number(hourValue),
    Number(minute),
    Number(second),
    Number(millisecond),
  );

  if (!Number.isFinite(utcGuess)) return NaN;

  const firstOffset = getTimeZoneOffsetMs(utcGuess, timeZone);
  let timestamp = utcGuess - firstOffset;
  const secondOffset = getTimeZoneOffsetMs(timestamp, timeZone);

  if (secondOffset !== firstOffset) {
    timestamp = utcGuess - secondOffset;
  }

  return timestamp;
}

export function formatDuration(ms) {
  const safeMs = Math.max(0, ms);
  const totalSeconds = Math.floor(safeMs / 1000);
  const hoursValue = Math.floor(totalSeconds / 3600);
  const minutesValue = Math.floor((totalSeconds % 3600) / 60);
  const secondsValue = totalSeconds % 60;
  return `${pad2(hoursValue)}:${pad2(minutesValue)}:${pad2(secondsValue)}`;
}

export function formatShortDuration(ms) {
  const safeMs = Math.max(0, ms);
  const minutes = Math.round(safeMs / 60000);
  if (minutes < 60) return `${minutes} min`;
  const hoursValue = Math.floor(minutes / 60);
  const minutesValue = minutes % 60;
  return minutesValue ? `${hoursValue}h ${pad2(minutesValue)}` : `${hoursValue}h`;
}

export function formatTime(timestamp) {
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone: APP_TIME_ZONE,
  }).format(getSafeDate(timestamp));
}

export function toDateTimeInputValue(timestamp = Date.now()) {
  const parts = getZonedParts(timestamp, APP_TIME_ZONE);
  return `${parts.year}-${pad2(parts.month)}-${pad2(parts.date)}T${pad2(parts.hour)}:${pad2(parts.minute)}`;
}

export function toDateInputValue(timestamp = Date.now()) {
  const parts = getZonedParts(timestamp, APP_TIME_ZONE);
  return `${parts.year}-${pad2(parts.month)}-${pad2(parts.date)}`;
}

export function parseDateTimeInputValue(value, fallback = null) {
  const match = String(value || "")
    .trim()
    .match(/^(\d{4})-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2})(?::(\d{2}))?$/);

  if (!match) return fallback;

  const [, year, month, dateValue, hourValue, minute, second = "0"] = match;
  const timestamp = zonedDateTimeToTimestamp({
    year: Number(year),
    month: Number(month),
    date: Number(dateValue),
    hour: Number(hourValue),
    minute: Number(minute),
    second: Number(second),
  }, APP_TIME_ZONE);

  if (!Number.isFinite(timestamp)) return fallback;

  const check = getZonedParts(timestamp, APP_TIME_ZONE);
  const isSameWallTime =
    check.year === Number(year) &&
    check.month === Number(month) &&
    check.date === Number(dateValue) &&
    check.hour === Number(hourValue) &&
    check.minute === Number(minute);

  return isSameWallTime ? timestamp : fallback;
}

export function parseLocalDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, dateValue] = value.split("-").map(Number);
  const timestamp = zonedDateTimeToTimestamp({
    year,
    month,
    date: dateValue,
    hour: 12,
    minute: 0,
    second: 0,
  }, APP_TIME_ZONE);
  return Number.isFinite(timestamp) ? new Date(timestamp) : null;
}

export function getDayStart(timestamp = Date.now()) {
  const parts = getZonedParts(timestamp, APP_TIME_ZONE);
  return zonedDateTimeToTimestamp({
    year: parts.year,
    month: parts.month,
    date: parts.date,
    hour: 0,
    minute: 0,
    second: 0,
  }, APP_TIME_ZONE);
}

export function getDayLabel(timestamp) {
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "short",
    timeZone: APP_TIME_ZONE,
  })
    .format(getSafeDate(timestamp))
    .replace(".", "");
}

export function formatDiaryDate(timestamp) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    timeZone: APP_TIME_ZONE,
  }).format(getSafeDate(timestamp));
}
