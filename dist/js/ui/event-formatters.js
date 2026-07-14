import { getEventConfig, isSleepEvent } from "../domain/record-types.js";
import { escapeHtml } from "../utils/text.js";
import { formatShortDuration, formatTime } from "../utils/time.js";

function isPlaceholderDetail(detail = "") {
  const value = String(detail || "").trim();
  return !value || value === "Timer" || value === "Não se aplica";
}

function parseBreastfeedingDetail(detail = "") {
  const text = String(detail || "").trim();
  const left = text.match(/\bE\s+(\d{2}:\d{2})/i)?.[1] || "";
  const right = text.match(/\bD\s+(\d{2}:\d{2})/i)?.[1] || "";
  const total = text.match(/\bTotal\s+(\d{2}:\d{2})/i)?.[1] || "";
  const hasBoth = Boolean(left && right);
  const explicitSide = text.split("•")[0]?.trim() || "";
  const side = hasBoth ? "Mista" : explicitSide || (left ? "Esquerdo" : right ? "Direito" : "Amamentação");
  return { side, left, right, total, hasBoth, hasTimer: Boolean(left || right || total) };
}

function getDisplayStartLabel(event) {
  return event?.displayStartLabel || formatTime(event.eventTime || event.start);
}

function getDisplayRangeLabel(event) {
  if (event?.displayRangeLabel) return event.displayRangeLabel;
  const hasEnd = Number(event.end) > Number(event.start);
  return hasEnd ? `${formatTime(event.start)}–${formatTime(event.end)}` : formatTime(event.start);
}

function formatBreastfeedingMeta(event) {
  const time = getDisplayStartLabel(event);
  const parsed = parseBreastfeedingDetail(event.detail);
  if (!parsed.hasTimer) {
    return {
      primary: [time, parsed.side].filter(Boolean).join(" • "),
      secondary: "",
      compact: [time, parsed.side].filter(Boolean).join(" • "),
    };
  }

  const totalText = parsed.total || "";
  return {
    primary: [time, parsed.side, totalText ? `Total ${totalText}` : ""].filter(Boolean).join(" • "),
    secondary: [parsed.left ? `E ${parsed.left}` : "", parsed.right ? `D ${parsed.right}` : ""].filter(Boolean).join(" • "),
    compact: [time, parsed.side, totalText || parsed.left || parsed.right].filter(Boolean).join(" • "),
  };
}

function formatSleepMeta(event) {
  const hasEnd = Number(event.end) > Number(event.start);
  const duration = hasEnd ? formatShortDuration(event.end - event.start) : "em andamento";
  const timeText = hasEnd ? getDisplayRangeLabel(event) : getDisplayStartLabel(event);
  const detail = isPlaceholderDetail(event.detail) ? "" : String(event.detail || "").trim();
  const wakeWindow = Number(event.wakeWindowMs) > 0
    ? `Acordado ${formatShortDuration(Number(event.wakeWindowMs))} antes`
    : "";
  const sleepKindLabel = String(event.sleepKindLabel || "").trim();
  return {
    primary: [timeText, duration].filter(Boolean).join(" • "),
    secondary: [sleepKindLabel, detail, wakeWindow].filter(Boolean).join(" • "),
    compact: [timeText, duration, sleepKindLabel || detail].filter(Boolean).join(" • "),
  };
}

function formatBottleMeta(event) {
  const detail = String(event.detail || "").trim();
  const ml = detail.match(/(\d+(?:[,.]\d+)?)\s*ml/i)?.[0] || "";
  const type = ml ? detail.replace(ml, "").replace(/[•-]/g, " ").trim() : detail;
  return {
    primary: [ml || detail || "Mamadeira", getDisplayStartLabel(event)].filter(Boolean).join(" • "),
    secondary: ml && type ? type : "",
    compact: [getDisplayStartLabel(event), detail].filter(Boolean).join(" • "),
  };
}

function formatMedicineMeta(event) {
  const detail = isPlaceholderDetail(event.detail) ? "Dose" : String(event.detail || "").trim();
  const notes = String(event.notes || "").trim();
  return {
    primary: [getDisplayStartLabel(event), detail].filter(Boolean).join(" • "),
    secondary: notes ? notes : "",
    compact: [getDisplayStartLabel(event), detail].filter(Boolean).join(" • "),
  };
}

function formatGenericMeta(event) {
  const duration = event.end > event.start ? formatShortDuration(event.end - event.start) : "";
  const showRange = (isSleepEvent(event) || event.type === "despertar-noturno") && event.end > event.start;
  const timeText = showRange
    ? getDisplayRangeLabel(event)
    : getDisplayStartLabel(event);
  const detail = isPlaceholderDetail(event.detail) ? "" : String(event.detail || "").trim();
  return {
    primary: [timeText, detail].filter(Boolean).join(" • "),
    secondary: duration && !isSleepEvent(event) ? duration : "",
    compact: [timeText, duration, detail].filter(Boolean).join(" • "),
  };
}

export function getEventDisplayParts(event) {
  if (!event) return { primary: "", secondary: "", compact: "" };
  if (event.type === "amamentacao") return formatBreastfeedingMeta(event);
  if (isSleepEvent(event)) return formatSleepMeta(event);
  if (event.type === "mamadeira") return formatBottleMeta(event);
  if (event.type === "medicamento") return formatMedicineMeta(event);
  return formatGenericMeta(event);
}

export function formatEventMeta(event) {
  const parts = getEventDisplayParts(event);
  return [parts.primary, parts.secondary].filter(Boolean).join(" • ");
}

export function getEventRenderSignature(event, options = {}) {
  const eventKey = options.active ? `active-${event.type}-${Math.round(event.start)}` : event.id;
  const endKey = options.active ? "live" : Math.round(event.end || event.start);
  return [
    eventKey,
    event.type,
    event.label || "",
    Math.round(Number(event.eventTime) || Number(event.start) || 0),
    Math.round(event.start),
    endKey,
    event.detail,
    event.notes,
    Math.round(Number(event.wakeWindowMs) || 0),
    event.createdByUid || "",
    event.createdByEmail || "",
    event.createdByDeviceId || "",
    event.createdByName || "",
    event.createdByRelationship || "",
    event.createdByRole || "",
    event.createdByLabel || "",
    event.caregiverName || "",
    event.caregiverRole || "",
    event.caregiverRelationship || "",
    event.caregiverLabel || "",
    event.createdAt || "",
    event.updatedAt || "",
    event.updatedByEmail || "",
    event.updatedByDeviceId || "",
    event.updatedByName || "",
    event.updatedByRelationship || "",
    event.updatedByLabel || "",
    event.editReason || "",
    event.sleepKind || "",
    event.sleepKindLabel || "",
    event.babyId || "",
    event.familyId || "",
    event.lastAction || "",
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

function isMissingAuthorValue(value = "") {
  const text = String(value ?? "").trim();
  return !text || text === "undefined" || text === "null";
}

function formatNameRole(name = "", role = "") {
  const cleanName = String(name || "").trim();
  const cleanRole = String(role || "").trim();
  return [cleanName, cleanRole].filter(Boolean).join(" · ");
}

function sanitizeAuthorLabel(value = "", babyName = "") {
  const text = String(value ?? "").trim();
  if (isMissingAuthorValue(text)) return "";
  if (babyName && text.toLowerCase() === babyName.toLowerCase()) return "";
  return text;
}

function getEventAuthorLabel(event = {}) {
  const babyName = String(globalThis.window?.__ninouCurrentBabyName || "").trim().toLowerCase();
  const candidates = [
    formatNameRole(event.caregiverName, event.caregiverRole || event.caregiverRelationship),
    event.caregiverLabel,
    event.createdByLabel,
    formatNameRole(event.createdByName, event.createdByRole || event.createdByRelationship),
    event.createdByName,
    event.createdByRole,
    event.createdByRelationship,
    event.authorName,
    event.responsibleName,
  ];
  for (const candidate of candidates) {
    const label = sanitizeAuthorLabel(candidate, babyName);
    if (label) return label;
  }
  return "Responsável";
}

function getRoutineDetailLine(event, parts = {}) {
  let primary = String(parts.primary || "").trim();
  const secondary = String(parts.secondary || "").trim();
  const startTime = getDisplayStartLabel(event);
  const range = getDisplayRangeLabel(event);

  if (primary === startTime || primary === range) primary = "";
  if (primary.startsWith(`${startTime} • `)) primary = primary.slice(`${startTime} • `.length);
  if (primary.startsWith(`${range} • `)) primary = primary.slice(`${range} • `.length);

  return [primary, secondary].filter(Boolean).join(" • ");
}

export function getEventCardMarkup(event, { empty = false } = {}) {
  if (empty) {
    return `
      <i class="mark polished-empty-icon" aria-hidden="true">☁</i>
      <div class="polished-empty-content">
        <small>Diário</small>
        <strong>Nenhum registro encontrado</strong>
        <span>Troque a data, limpe o filtro ou adicione um cuidado pelo botão +.</span>
        <em>O Ninou mantém a linha do tempo organizada assim que houver registros.</em>
      </div>
    `;
  }

  const config = getEventConfig(event.type);
  const parts = getEventDisplayParts(event);
  const notes = event.notes && event.type !== "medicamento" ? `<p>${escapeHtml(event.notes)}</p>` : "";
  const actorName = getEventAuthorLabel(event);
  const primaryLine = parts.primary || parts.compact || getDisplayStartLabel(event);
  const extraMeta = getRoutineDetailLine(event, parts);
  const registeredLine = `Adicionado por ${actorName}`;
  const editedBy = String(event.updatedByLabel || event.updatedByName || "").trim();
  const editedAt = Number(event.updatedAtClient) || (event.updatedAt ? Date.parse(event.updatedAt) : 0);
  const editReason = String(event.editReason || "").trim();
  const editedLine = editedAt
    ? `Editado${editedBy ? ` por ${editedBy}` : ""} às ${formatTime(editedAt)}${editReason ? ` • ${editReason}` : ""}`
    : "";
  return `
    <i class="mark ${config.arcType}">${config.icon}</i>
    <div class="event-main">
      <div class="event-text">
        <strong>${escapeHtml(config.title)}</strong>
        <span class="event-meta-primary">${escapeHtml(primaryLine)}</span>
        ${extraMeta && !primaryLine.includes(extraMeta) ? `<span class="event-meta-extra">${escapeHtml(extraMeta)}</span>` : ""}
        <span class="event-author-line">${escapeHtml(registeredLine)}</span>
        ${editedLine ? `<span class="event-edit-note">${escapeHtml(editedLine)}</span>` : ""}
        ${notes}
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
  const parts = getEventDisplayParts(event);
  return `
    <article class="mini-event">
      <i class="mark ${config.arcType}">${config.icon}</i>
      <div>
        <strong>${escapeHtml(config.title)}</strong>
        <span>${escapeHtml(parts.compact || parts.primary)}</span>
      </div>
    </article>
  `;
}
