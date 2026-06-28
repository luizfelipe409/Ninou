import { getEventConfig, isSleepEvent } from "../domain/record-types.js";
import { getEventsForDay, sortEventsByStartAsc } from "../domain/records.js";
import { countFeedingEvents, sumBottleAmountMl } from "../domain/feeding.js";
import { countDiaperEvents } from "../domain/diaper.js";
import { countMedicationEvents } from "../domain/medication.js";
import { escapeHtml } from "../utils/text.js";

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

function clampPercent(value) {
  return `${Math.min(100, Math.max(0, Math.round(Number(value) || 0)))}%`;
}

function shortDuration(ms, formatter) {
  if (!Number.isFinite(Number(ms)) || ms <= 0) return "0 min";
  return formatter(ms);
}

function eventTime(event, formatTime) {
  if (isSleepEvent(event) && event.end > event.start) {
    return `${formatTime(event.start)}–${formatTime(event.end)}`;
  }
  return formatTime(event.start);
}

function cleanDetail(event) {
  const detail = String(event.detail || "").trim();
  if (!detail || detail === "Timer" || detail === "Não se aplica") return "";
  if (event.type === "amamentacao") {
    if (/\bE\s+\d{2}:\d{2}/.test(detail) && /\bD\s+\d{2}:\d{2}/.test(detail)) return "Mista";
    return detail.split("•")[0].trim();
  }
  return detail;
}

export function renderSmartInsight({
  container,
  state,
  now = Date.now(),
  todayStart,
  dayMs = DAY,
  wakeWindowMinutes,
  formatShortDuration,
  formatTime,
  getSleepMsForRange,
  countFeeding = countFeedingEvents,
  countDiaper = countDiaperEvents,
}) {
  if (!container) return;
  const events = getEventsForDay(state.events || [], todayStart, dayMs);
  const yesterdayEvents = getEventsForDay(state.events || [], todayStart - dayMs, dayMs);
  const sleepToday = getSleepMsForRange(todayStart, Math.min(todayStart + dayMs, now));
  const feedToday = countFeeding(events);
  const feedYesterday = countFeeding(yesterdayEvents);
  const diapersToday = countDiaper(events);
  const medsToday = countMedicationEvents(events);
  const sleepEvents = events.filter((event) => isSleepEvent(event) && event.end > event.start);
  const nightWakes = events.filter((event) => event.type === "despertar-noturno");

  const recentSleepValues = [];
  for (let idx = 1; idx <= 6; idx += 1) {
    const dStart = todayStart - idx * dayMs;
    const dayEvents = getEventsForDay(state.events || [], dStart, dayMs);
    if (!dayEvents.length) continue;
    recentSleepValues.push(getSleepMsForRange(dStart, dStart + dayMs));
  }
  const recentSleepAvg = recentSleepValues.length
    ? recentSleepValues.reduce((total, value) => total + value, 0) / recentSleepValues.length
    : 0;

  let title = "Ninou está aprendendo a rotina";
  let text = "Registre sono, mamadas e fraldas para eu mostrar observações simples, sem repetir o timer principal.";

  if (events.length < 2) {
    title = "Ainda há poucos registros hoje";
    text = "Com mais alguns registros, o Ninou compara o dia com a média recente do bebê.";
  } else if (sleepEvents.length >= 3) {
    const starts = sleepEvents.map((event) => new Date(event.start).getHours() * 60 + new Date(event.start).getMinutes());
    const minStart = Math.min(...starts);
    const maxStart = Math.max(...starts);
    if (maxStart - minStart <= 35) {
      title = "Sonecas com horário parecido";
      text = `As sonecas de hoje começaram em uma faixa próxima, entre ${formatTime(sleepEvents[0].start)} e ${formatTime(sleepEvents[sleepEvents.length - 1].start)}.`;
    } else {
      title = "Sono acompanhado";
      text = `Hoje já foram registradas ${sleepEvents.length} sonecas/sonos. O total de sono é ${shortDuration(sleepToday, formatShortDuration)}.`;
    }
  } else if (recentSleepAvg && sleepToday) {
    const diff = sleepToday - recentSleepAvg;
    const diffAbs = Math.abs(diff);
    if (diffAbs > 35 * 60000) {
      title = diff < 0 ? "Sono abaixo da média recente" : "Sono acima da média recente";
      text = `Hoje: ${formatShortDuration(sleepToday)}. Média recente: ${formatShortDuration(recentSleepAvg)}.`;
    } else {
      title = "Sono próximo da média";
      text = `O sono de hoje está parecido com os últimos dias: ${formatShortDuration(sleepToday)} até agora.`;
    }
  } else if (feedYesterday && feedToday + 1 < feedYesterday) {
    title = "Alimentação menor que ontem";
    text = `Até agora foram ${feedToday} mamadas/alimentações, contra ${feedYesterday} ontem nesse dia.`;
  } else if (nightWakes.length) {
    title = "Despertar noturno registrado";
    text = `Hoje houve ${nightWakes.length} ${nightWakes.length === 1 ? "despertar" : "despertares"} noturno(s) registrado(s).`;
  } else if (medsToday) {
    title = "Medicamento registrado";
    text = `Há ${medsToday} ${medsToday === 1 ? "medicamento" : "medicamentos"} registrado(s) hoje.`;
  } else if (diapersToday >= 5) {
    title = "Fraldas bem acompanhadas";
    text = `Hoje já foram registradas ${diapersToday} fraldas.`;
  } else {
    title = "Rotina em acompanhamento";
    text = `Hoje há ${events.length} registros, ${feedToday} alimentação(ões) e ${diapersToday} fralda(s).`;
  }

  container.innerHTML = `
    <span>💡 Observação</span>
    <strong>${escapeHtml(title)}</strong>
    <p>${escapeHtml(text)}</p>
  `;
}

export function renderLiveAssistant({ card } = {}) {
  // v75.1: removido visualmente para evitar duplicidade com o card principal e o card Próxima soneca.
  if (card) card.hidden = true;
}

export function renderDailyRhythm({
  container,
  statusElement,
  state,
  todayStart,
  now = Date.now(),
  dayMs = DAY,
  getSleepMsForRange,
  countFeeding = countFeedingEvents,
  countDiaper = countDiaperEvents,
  countMedication = countMedicationEvents,
  formatShortDuration,
}) {
  if (!container) return;
  const todayEnd = Math.min(todayStart + dayMs, now);
  const todayEvents = getEventsForDay(state.events || [], todayStart, dayMs);
  const today = {
    sleep: getSleepMsForRange(todayStart, todayEnd),
    feeds: countFeeding(todayEvents),
    diapers: countDiaper(todayEvents),
    meds: countMedication(todayEvents),
  };

  const history = [];
  for (let idx = 1; idx <= 6; idx += 1) {
    const dStart = todayStart - idx * dayMs;
    const dayEvents = getEventsForDay(state.events || [], dStart, dayMs);
    if (!dayEvents.length) continue;
    history.push({
      sleep: getSleepMsForRange(dStart, dStart + dayMs),
      feeds: countFeeding(dayEvents),
      diapers: countDiaper(dayEvents),
      meds: countMedication(dayEvents),
    });
  }

  const average = (key) => history.length
    ? history.reduce((total, dayValue) => total + Number(dayValue[key] || 0), 0) / history.length
    : 0;
  const avgSleep = average("sleep");
  const avgFeeds = average("feeds");
  const avgDiapers = average("diapers");
  const avgMeds = average("meds");
  const percentAgainst = (value, avg) => avg > 0 ? (value / avg) * 100 : value > 0 ? 100 : 0;
  const countValue = (value, avg) => avg > 0 ? `${value} hoje • média ${Math.round(avg)}` : `${value} hoje`;

  const rows = [
    {
      label: "Sono",
      value: avgSleep > 0
        ? `${formatShortDuration(today.sleep)} hoje • média ${formatShortDuration(avgSleep)}`
        : `${formatShortDuration(today.sleep)} hoje`,
      percent: percentAgainst(today.sleep, avgSleep),
    },
    { label: "Mamadas", value: countValue(today.feeds, avgFeeds), percent: percentAgainst(today.feeds, avgFeeds) },
    { label: "Fraldas", value: countValue(today.diapers, avgDiapers), percent: percentAgainst(today.diapers, avgDiapers) },
    { label: "Medicamentos", value: avgMeds > 0 ? countValue(today.meds, avgMeds) : `${today.meds} hoje`, percent: percentAgainst(today.meds, avgMeds) },
  ];

  container.innerHTML = rows.map((row) => `
    <article>
      <span>${escapeHtml(row.label)}</span>
      <b>${escapeHtml(row.value)}</b>
      <i style="--p:${clampPercent(row.percent)}"></i>
    </article>
  `).join("");
  if (statusElement) {
    statusElement.textContent = history.length ? "Média recente" : todayEvents.length ? "Registrando hoje" : "Aguardando registros";
  }
}

export function renderIntelligentTimeline({ container, state, todayStart, dayMs = DAY, formatShortDuration, formatTime, limit = 10 }) {
  if (!container) return;
  const events = sortEventsByStartAsc(getEventsForDay(state.events || [], todayStart, dayMs)).slice(-limit);
  if (!events.length) {
    container.innerHTML = `<article class="timeline-empty">Ainda não há registros suficientes para montar a linha do tempo.</article>`;
    return;
  }

  container.innerHTML = events.map((event) => {
    const config = getEventConfig(event.type);
    const duration = event.end > event.start && (isSleepEvent(event) || event.type === "despertar-noturno")
      ? formatShortDuration(event.end - event.start)
      : "";
    const detail = cleanDetail(event);
    const subtitle = [duration, detail].filter(Boolean).join(" • ") || "Registro rápido";
    return `
      <article class="intelligent-timeline-item ${isSleepEvent(event) ? "is-duration" : ""}">
        <time>${escapeHtml(eventTime(event, formatTime))}</time>
        <i class="mark ${config.arcType}">${config.icon}</i>
        <div>
          <strong>${escapeHtml(config.title)}</strong>
          <span>${escapeHtml(subtitle)}</span>
        </div>
      </article>
    `;
  }).join("");
}

export function renderWeeklyOverview({
  container,
  state,
  todayStart,
  dayMs = DAY,
  getSleepMsForRange,
  countFeeding = countFeedingEvents,
  countDiaper = countDiaperEvents,
  countMedication = countMedicationEvents,
  formatShortDuration,
}) {
  if (!container) return;
  const start = todayStart - 6 * dayMs;
  const end = todayStart + dayMs;
  const events = (state.events || []).filter((event) => event.start >= start && event.start < end);
  const sleepMs = Array.from({ length: 7 }, (_, idx) => {
    const dStart = todayStart - idx * dayMs;
    return getSleepMsForRange(dStart, dStart + dayMs);
  }).reduce((total, value) => total + value, 0);
  const feeds = countFeeding(events);
  const diapers = countDiaper(events);
  const meds = countMedication(events);
  const maxValue = Math.max(sleepMs / HOUR, feeds, diapers, meds, 1);
  const rows = [
    { label: "Sono", value: formatShortDuration(sleepMs), raw: sleepMs / HOUR },
    { label: "Mamadas", value: String(feeds), raw: feeds },
    { label: "Fraldas", value: String(diapers), raw: diapers },
    { label: "Medicamentos", value: String(meds), raw: meds },
  ];
  container.innerHTML = rows.map((row) => `
    <article>
      <span>${escapeHtml(row.label)}</span>
      <i style="--p:${clampPercent((row.raw / maxValue) * 100)}"></i>
      <b>${escapeHtml(row.value)}</b>
    </article>
  `).join("");
}

export function renderDayStory({
  element,
  state,
  todayStart,
  now = Date.now(),
  dayMs = DAY,
  getSleepMsForRange,
  countFeeding = countFeedingEvents,
  countDiaper = countDiaperEvents,
  countMedication = countMedicationEvents,
  formatShortDuration,
}) {
  if (!element) return;
  const todayEnd = Math.min(todayStart + dayMs, now);
  const events = getEventsForDay(state.events || [], todayStart, dayMs);
  if (events.length < 3) {
    element.textContent = events.length
      ? "Resumo parcial: ainda há poucos registros para contar como foi o dia com segurança."
      : "O resumo do dia aparecerá conforme você registrar a rotina.";
    return;
  }
  const sleepMs = getSleepMsForRange(todayStart, todayEnd);
  const feeds = countFeeding(events);
  const diapers = countDiaper(events);
  const meds = countMedication(events);
  const sleepEvents = events.filter((event) => isSleepEvent(event) && event.end > event.start);
  const longestSleep = sleepEvents.reduce((max, event) => Math.max(max, event.end - event.start), 0);
  const wakeWindows = sleepEvents.map((event) => Number(event.wakeWindowMs) || 0).filter(Boolean);
  const longestWake = wakeWindows.length ? Math.max(...wakeWindows) : 0;

  const recentSleepValues = [];
  for (let idx = 1; idx <= 6; idx += 1) {
    const dStart = todayStart - idx * dayMs;
    const dayEvents = getEventsForDay(state.events || [], dStart, dayMs);
    if (!dayEvents.length) continue;
    recentSleepValues.push(getSleepMsForRange(dStart, dStart + dayMs));
  }
  const recentSleepAvg = recentSleepValues.length
    ? recentSleepValues.reduce((total, value) => total + value, 0) / recentSleepValues.length
    : 0;

  const prefix = new Date(now).getHours() >= 20 ? "Resumo do dia:" : "Resumo parcial:";
  const parts = [
    `${prefix} dormiu ${formatShortDuration(sleepMs)}`,
    `mamou ${feeds} ${feeds === 1 ? "vez" : "vezes"}`,
    `teve ${diapers} ${diapers === 1 ? "fralda" : "fraldas"} registradas`,
  ];
  if (meds) parts.push(`${meds} ${meds === 1 ? "medicamento" : "medicamentos"}`);
  let story = `${parts.join(", ")}.`;

  if (recentSleepAvg && sleepMs) {
    const diff = sleepMs - recentSleepAvg;
    if (Math.abs(diff) > 35 * 60000) {
      story += diff < 0
        ? ` O sono está ${formatShortDuration(Math.abs(diff))} abaixo da média recente.`
        : ` O sono está ${formatShortDuration(Math.abs(diff))} acima da média recente.`;
    } else {
      story += " O sono está próximo da média recente.";
    }
  }
  if (longestSleep) story += ` Maior sono: ${formatShortDuration(longestSleep)}.`;
  if (longestWake) story += ` Maior janela acordado antes de dormir: ${formatShortDuration(longestWake)}.`;
  element.textContent = story;
}

export function renderTrendKpis({
  container,
  state,
  todayStart,
  now = Date.now(),
  dayMs = DAY,
  getSleepMsForRange,
  countFeeding = countFeedingEvents,
  countDiaper = countDiaperEvents,
  countMedication = countMedicationEvents,
  formatShortDuration,
}) {
  if (!container) return;
  const events = getEventsForDay(state.events || [], todayStart, dayMs);
  const sleepMs = getSleepMsForRange(todayStart, Math.min(todayStart + dayMs, now));
  const bottleMl = sumBottleAmountMl(events);
  const values = [
    { label: "Sono hoje", value: formatShortDuration(sleepMs), hint: "Total dormido desde meia-noite." },
    { label: "Alimentações", value: String(countFeeding(events)), hint: bottleMl ? `${bottleMl} ml em mamadeiras.` : "Amamentação e mamadeira." },
    { label: "Fraldas", value: String(countDiaper(events)), hint: "Trocas registradas hoje." },
    { label: "Medicamentos", value: String(countMedication(events)), hint: "Doses registradas hoje." },
  ];
  container.innerHTML = values.map((item) => `
    <article>
      <span>${escapeHtml(item.label)}</span>
      <strong>${escapeHtml(item.value)}</strong>
      <p>${escapeHtml(item.hint)}</p>
    </article>
  `).join("");
}

