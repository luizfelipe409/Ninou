

export function isMedicationEvent(event = {}) {
  return event.type === "medicamento";
}

export function countMedicationEvents(events = []) {
  return events.filter(isMedicationEvent).length;
}
