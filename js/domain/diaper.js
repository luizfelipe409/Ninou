

export function isDiaperEvent(event = {}) {
  return event.type === "fralda";
}

export function countDiaperEvents(events = []) {
  return events.filter(isDiaperEvent).length;
}
