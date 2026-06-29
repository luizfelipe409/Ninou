import { setText } from "../dom/dom.js";
import { getEventsForDay, sortEventsByStartDesc } from "../domain/records.js";

export function getTodayEvents(state, todayStart, dayMs) {
  return (state.events || []).filter((event) => event.start >= todayStart && event.start < todayStart + dayMs);
}

export function buildTodaySummary({
  state,
  todayStart,
  dayMs,
  now,
  getSleepMsForRange,
  getAwakeMsForRange,
  countFeedingEvents,
  countDiaperEvents,
  countMedicationEvents,
}) {
  const todayEnd = Math.min(todayStart + dayMs, now);
  const events = getTodayEvents(state, todayStart, dayMs);
  return {
    events,
    sleepMs: getSleepMsForRange(todayStart, todayEnd),
    awakeMs: getAwakeMsForRange(todayStart, todayEnd),
    feedingCount: countFeedingEvents(events),
    diaperCount: countDiaperEvents(events),
    medicationCount: countMedicationEvents(events),
  };
}

export function getNextNapInfo({ state, wakeWindowMinutes, now, formatTime, formatShortDuration }) {
  if (state.mode === "idle") {
    return {
      title: "Aguardando",
      hint: "Escolha como começar a rotina diária.",
      status: "waiting",
    };
  }

  if (state.mode === "sleeping") {
    return {
      title: "Após acordar",
      hint: "A próxima janela será recalculada quando o sono terminar.",
      status: "sleeping",
    };
  }

  const target = Number(state.activeStartedAt) + wakeWindowMinutes * 60000;
  const diff = target - now;

  if (diff < 0) {
    return {
      title: "Observar sinais",
      hint: `Janela estimada há ${formatShortDuration(Math.abs(diff))}.`,
      status: "overdue",
    };
  }

  return {
    title: formatTime(target),
    hint: `Em ${formatShortDuration(diff)}.`,
    status: "ready",
  };
}

export function renderHomeSummary({
  state,
  summaryValues,
  nextCard,
  nextHint,
  miniRing,
  todayStart,
  dayMs,
  now,
  wakeWindowMinutes,
  getSleepMsForRange,
  getAwakeMsForRange,
  countFeedingEvents,
  countDiaperEvents,
  countMedicationEvents,
  formatShortDuration,
  formatTime,
}) {
  const summary = buildTodaySummary({
    state,
    todayStart,
    dayMs,
    now,
    getSleepMsForRange,
    getAwakeMsForRange,
    countFeedingEvents,
    countDiaperEvents,
    countMedicationEvents,
  });

  if (summaryValues.length >= 4) {
    setText(summaryValues[0], formatShortDuration(summary.sleepMs));
    setText(summaryValues[1], formatShortDuration(summary.awakeMs));
    setText(summaryValues[2], summary.feedingCount);
    setText(summaryValues[3], summary.diaperCount);
    if (summaryValues[4]) setText(summaryValues[4], summary.medicationCount);
  }

  if (miniRing) setText(miniRing, wakeWindowMinutes);

  if (nextCard && nextHint) {
    const nextNap = getNextNapInfo({ state, wakeWindowMinutes, now, formatTime, formatShortDuration });
    const card = nextCard.closest?.(".next-card");
    card?.classList.toggle("is-overdue", nextNap.status === "overdue");
    card?.classList.toggle("is-sleeping", nextNap.status === "sleeping");
    setText(nextCard, nextNap.title);
    setText(nextHint, nextNap.hint);
  }

  return summary;
}

export function renderTodayLastEvents({ container, state, todayStart, dayMs, getMiniEventMarkup, limit = 5 }) {
  if (!container) return;
  const events = sortEventsByStartDesc(getEventsForDay(state.events, todayStart, dayMs)).slice(0, limit);

  if (!events.length) {
    container.innerHTML = `<article class="mini-event empty">Quando houver registros, os momentos importantes aparecerão aqui.</article>`;
    return;
  }

  container.innerHTML = events.map(getMiniEventMarkup).join("");
}
