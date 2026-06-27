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
    };
  }

  const target = state.mode === "awake" ? state.activeStartedAt + wakeWindowMinutes * 60000 : now + wakeWindowMinutes * 60000;
  return {
    title: formatTime(target),
    hint: state.mode === "awake"
      ? `Hora de preparar a soneca em ${formatShortDuration(target - now)}.`
      : "Próxima janela calculada após acordar.",
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
    setText(nextCard, nextNap.title);
    setText(nextHint, nextNap.hint);
  }

  return summary;
}

export function renderTodayLastEvents({ container, state, todayStart, dayMs, getMiniEventMarkup, limit = 5 }) {
  if (!container) return;
  const events = sortEventsByStartDesc(getEventsForDay(state.events, todayStart, dayMs)).slice(0, limit);

  if (!events.length) {
    container.innerHTML = `<article class="mini-event empty">Nenhum registro ainda.</article>`;
    return;
  }

  container.innerHTML = events.map(getMiniEventMarkup).join("");
}
