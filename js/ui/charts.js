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
  const positiveValues = values.filter((value) => value > 0);
  const averageValue = positiveValues.length ? positiveValues.reduce((total, value) => total + value, 0) / positiveValues.length : 0;
  const averagePercent = averageValue > 0 ? Math.max(8, Math.min(92, Math.round((averageValue / maxValue) * 100))) : 0;

  container.classList.add("premium-bars");
  container.style.setProperty("--avg-y", averagePercent ? `${100 - averagePercent}%` : "100%");
  container.style.setProperty("--avg-opacity", averagePercent ? ".75" : "0");
  container.dataset.hasAverage = averagePercent ? "true" : "false";
  container.dataset.hasData = positiveValues.length ? "true" : "false";
  container.dataset.maxValue = String(maxValue);
  container.innerHTML = "";

  days.forEach((item, index) => {
    const value = values[index];
    const bar = document.createElement("span");
    const height = value > 0 ? Math.max(10, Math.round((value / maxValue) * 100)) : 7;
    const formatted = formatValue(value);
    bar.style.setProperty("--h", `${height}%`);
    bar.style.setProperty("--delay", `${index * 36}ms`);
    bar.dataset.value = formatted;
    bar.dataset.rawValue = String(value);
    bar.dataset.day = item.label;
    bar.style.setProperty("--value", String(value));
    bar.setAttribute("aria-label", `${item.label}: ${formatted}`);
    bar.title = `${item.label}: ${formatted}`;
    bar.classList.toggle("is-empty", value <= 0);
    bar.classList.toggle("has-value", value > 0);
    bar.innerHTML = `<b>${escapeHtml(formatted)}</b><i>${escapeHtml(item.label)}</i>`;
    container.append(bar);
  });
}

export function renderTodayMiniChart({
  container,
  state,
  todayStart,
  dayMs,
  getDayLabel,
  trackedTypes = ["acordou", "sono", "dormir", "despertar-noturno", "amamentacao", "mamadeira", "fralda", "medicamento"],
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
