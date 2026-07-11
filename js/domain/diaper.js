export const diaperTypes = Object.freeze(["fralda"]);

export function isDiaperEvent(event = {}) {
  return event.type === "fralda";
}

export function countDiaperEvents(events = []) {
  return events.filter(isDiaperEvent).length;
}

export function groupDiapersByDetail(events = []) {
  return events.filter(isDiaperEvent).reduce((acc, event) => {
    const key = event.detail || "Sem detalhe";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}
