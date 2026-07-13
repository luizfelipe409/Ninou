import { escapeHtml as defaultEscapeHtml } from "../utils/text.js";

const BAR_CHART_MAX_HEIGHT_PERCENT = 64;
const BAR_CHART_MIN_FILLED_HEIGHT_PERCENT = 10;
const BAR_CHART_EMPTY_HEIGHT_PERCENT = 7;

export function formatNumber(value) {
  return Number(value || 0).toLocaleString("pt-BR", { maximumFractionDigits: 0 });
}

function getSafeBarHeightPercent(value, maxValue, minHeight = BAR_CHART_MIN_FILLED_HEIGHT_PERCENT) {
  const numericValue = Number(value) || 0;
  const numericMax = Math.max(Number(maxValue) || 0, 1);
  if (numericValue <= 0) return BAR_CHART_EMPTY_HEIGHT_PERCENT;
  return Math.max(minHeight, Math.round((numericValue / numericMax) * BAR_CHART_MAX_HEIGHT_PERCENT));
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
    const sleepEvents = events.filter((event) => {
      if (!isSleepEvent(event)) return false;
      const eventStart = Number(event.start);
      const eventEnd = Number(event.end) > eventStart ? Number(event.end) : eventStart;
      return Number.isFinite(eventStart) && eventStart < end && eventEnd > start;
    });
    const sleepMs = sleepEvents.reduce((total, event) => {
      const eventStart = Number(event.start);
      const eventEnd = Number(event.end) > eventStart ? Number(event.end) : eventStart;
      const overlapMs = Math.max(0, Math.min(eventEnd, end) - Math.max(eventStart, start));
      return total + overlapMs;
    }, 0);
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
  const averagePercent = averageValue > 0 ? getSafeBarHeightPercent(averageValue, maxValue, 8) : 0;

  const hasRealData = positiveValues.length > 0;
  container.classList.add("premium-bars");
  container.classList.toggle("is-operational", hasRealData);
  container.classList.toggle("is-empty", !hasRealData);
  container.dataset.values = JSON.stringify(values);
  container.style.setProperty("--avg-y", averagePercent ? `${100 - averagePercent}%` : "100%");
  container.style.setProperty("--avg-opacity", averagePercent ? ".75" : "0");
  container.dataset.hasAverage = averagePercent ? "true" : "false";
  container.dataset.hasData = hasRealData ? "true" : "false";
  container.dataset.hasRealData = hasRealData ? "true" : "false";
  container.dataset.maxValue = String(maxValue);
  const card = container.closest(".data-chart-card");
  if (card) {
    card.dataset.hasData = hasRealData ? "true" : "false";
    card.dataset.hasRealData = hasRealData ? "true" : "false";
    if (!card.querySelector(".data-chart-empty-hint")) {
      const hint = document.createElement("small");
      hint.className = "data-chart-empty-hint";
      hint.textContent = "Sem registros reais neste período.";
      card.append(hint);
    }
  }
  container.innerHTML = "";

  days.forEach((item, index) => {
    const value = values[index];
    const bar = document.createElement("span");
    const height = getSafeBarHeightPercent(value, maxValue);
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
