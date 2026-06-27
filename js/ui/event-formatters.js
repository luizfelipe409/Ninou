import { getEventConfig, isSleepEvent } from "../domain/record-types.js";
import { escapeHtml } from "../utils/text.js";
import { formatShortDuration, formatTime } from "../utils/time.js";

export function formatEventMeta(event) {
  const duration = event.end > event.start ? formatShortDuration(event.end - event.start) : "";
  const showRange = (isSleepEvent(event) || event.type === "despertar-noturno") && event.end > event.start;
  const timeText = showRange
    ? `${formatTime(event.start)}-${formatTime(event.end)}`
    : formatTime(event.start);
  const wakeWindow = isSleepEvent(event) && Number(event.wakeWindowMs) > 0
    ? `Acordado ${formatShortDuration(Number(event.wakeWindowMs))} antes`
    : "";
  return [timeText, duration, event.detail, wakeWindow].filter(Boolean).join(" • ");
}

export function getEventRenderSignature(event, options = {}) {
  const eventKey = options.active ? `active-${event.type}-${Math.round(event.start)}` : event.id;
  const endKey = options.active ? "live" : Math.round(event.end || event.start);
  return [
    eventKey,
    event.type,
    Math.round(event.start),
    endKey,
    event.detail,
    event.notes,
    Math.round(Number(event.wakeWindowMs) || 0),
  ].join("|");
}

export function getTimelineRenderSignature(selectedStart, selectedEnd, currentDiaryFilter, visibleEvents, latest) {
  return [
    selectedStart,
    selectedEnd,
    currentDiaryFilter,
    visibleEvents.map((event) => getEventRenderSignature(event)).join("||"),
    latest ? getEventRenderSignature(latest) : "empty-latest",
  ].join("::");
}

export function getEventCardMarkup(event, { empty = false } = {}) {
  if (empty) {
    return `
      <i class="mark"></i>
      <div>
        <strong>Nenhum registro</strong>
        <span>Escolha outro filtro, outra data ou crie um novo registro.</span>
      </div>
    `;
  }

  const config = getEventConfig(event.type);
  return `
    <i class="mark ${config.arcType}">${config.icon}</i>
    <div class="event-main">
      <div class="event-text">
        <strong>${escapeHtml(config.title)}</strong>
        <span>${escapeHtml(formatEventMeta(event))}</span>
        ${event.notes ? `<p>${escapeHtml(event.notes)}</p>` : ""}
      </div>
      <div class="event-actions">
        <button class="event-action-button edit" type="button" data-event-edit="${escapeHtml(event.id)}" aria-label="Editar ${escapeHtml(config.title)}">
          <span>✎</span>
          Editar
        </button>
        <button class="event-action-button delete" type="button" data-event-delete="${escapeHtml(event.id)}" aria-label="Excluir ${escapeHtml(config.title)}">
          <span>×</span>
          Excluir
        </button>
      </div>
    </div>
  `;
}

export function getMiniEventMarkup(event) {
  const config = getEventConfig(event.type);
  return `
    <article class="mini-event">
      <i class="mark ${config.arcType}">${config.icon}</i>
      <div>
        <strong>${escapeHtml(config.title)}</strong>
        <span>${escapeHtml(formatEventMeta(event))}</span>
      </div>
    </article>
  `;
}
