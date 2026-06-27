import { escapeHtml as defaultEscapeHtml } from "../utils/text.js";

export function formatNumber(value) {
  return Number(value || 0).toLocaleString("pt-BR", { maximumFractionDigits: 0 });
}

export function getReportDays(events = [], { count = 7, todayStart, dayMs, getDayLabel }) {
  return Array.from({ length: count }, (_, index) => {
    const start = todayStart - (count - 1 - index) * dayMs;
    const end = start + dayMs;
    const dayEvents = events.filter((event) => event.start >= start && event.start < end);
    return { start, end, label: getDayLabel(start), events: dayEvents };
  });
}

export function getSleepReportDays(events = [], { count = 7, todayStart, dayMs, getDayLabel, isSleepEvent }) {
  return Array.from({ length: count }, (_, index) => {
    const start = todayStart - (count - 1 - index) * dayMs;
    const end = start + dayMs;
    const sleepEvents = events.filter((event) => isSleepEvent(event) && event.start >= start && event.start < end);
    const sleepMs = sleepEvents.reduce((total, event) => total + Math.max(0, event.end - event.start), 0);
    return {
      start,
      end,
      label: getDayLabel(start),
      events: sleepEvents,
      sleepMs,
    };
  });
}

export function renderBarChart(container, days, getValue, options = {}) {
  if (!container) return;
  const escapeHtml = options.escapeHtml || defaultEscapeHtml;
  const formatValue = options.formatValue || formatNumber;
  const values = days.map((item) => Number(getValue(item)) || 0);
  const maxValue = Math.max(...values, 1);
  container.innerHTML = "";

  days.forEach((item, index) => {
    const value = values[index];
    const bar = document.createElement("span");
    const height = value > 0 ? Math.max(8, Math.round((value / maxValue) * 100)) : 6;
    bar.style.setProperty("--h", `${height}%`);
    bar.classList.toggle("is-empty", value <= 0);
    bar.innerHTML = `<b>${escapeHtml(formatValue(value))}</b><i>${escapeHtml(item.label)}</i>`;
    container.append(bar);
  });
}

export function renderTodayMiniChart({
  container,
  state,
  todayStart,
  dayMs,
  getDayLabel,
  trackedTypes = ["sono", "dormir", "despertar-noturno", "amamentacao", "mamadeira", "fralda", "medicamento"],
}) {
  const days = getReportDays(state.events, { count: 5, todayStart, dayMs, getDayLabel });
  renderBarChart(
    container,
    days,
    (item) => item.events.filter((event) => trackedTypes.includes(event.type)).length,
  );
}

export function getMinutesWindowLabel(startMinutes, durationMinutes = 45) {
  const windowStart = Math.max(0, Math.round(startMinutes / 5) * 5);
  const windowEnd = Math.min(1439, windowStart + durationMinutes);
  const formatMinutes = (minutes) => `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
  return `${formatMinutes(windowStart)}-${formatMinutes(windowEnd)}`;
}
