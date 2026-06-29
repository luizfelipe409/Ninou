import { day } from "../config/constants.js";

export function formatDuration(ms) {
  const safeMs = Math.max(0, ms);
  const totalSeconds = Math.floor(safeMs / 1000);
  const hoursValue = Math.floor(totalSeconds / 3600);
  const minutesValue = Math.floor((totalSeconds % 3600) / 60);
  const secondsValue = totalSeconds % 60;
  const pad = (value) => String(value).padStart(2, "0");
  return `${pad(hoursValue)}:${pad(minutesValue)}:${pad(secondsValue)}`;
}

export function formatShortDuration(ms) {
  const safeMs = Math.max(0, ms);
  const minutes = Math.round(safeMs / 60000);
  if (minutes < 60) return `${minutes} min`;
  const hoursValue = Math.floor(minutes / 60);
  const minutesValue = minutes % 60;
  return minutesValue ? `${hoursValue}h ${String(minutesValue).padStart(2, "0")}` : `${hoursValue}h`;
}

export function formatTime(timestamp) {
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(timestamp));
}

export function toDateTimeInputValue(timestamp = Date.now()) {
  const date = new Date(timestamp);
  const timezoneOffset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - timezoneOffset).toISOString().slice(0, 16);
}

export function toDateInputValue(timestamp = Date.now()) {
  const date = new Date(timestamp);
  const timezoneOffset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - timezoneOffset).toISOString().slice(0, 10);
}

export function parseLocalDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, date] = value.split("-").map(Number);
  return new Date(year, month - 1, date, 12, 0, 0, 0);
}

export function getDayStart(timestamp = Date.now()) {
  const date = new Date(timestamp);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

export function getDayLabel(timestamp) {
  return new Intl.DateTimeFormat("pt-BR", { weekday: "short" })
    .format(new Date(timestamp))
    .replace(".", "");
}

export function formatDiaryDate(timestamp) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
  }).format(new Date(timestamp));
}

export function getDaysAlive(birthDate) {
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  return Math.floor((today.getTime() - birthDate.getTime()) / day);
}
