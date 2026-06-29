export const medicationTypes = Object.freeze(["medicamento"]);

export function isMedicationEvent(event = {}) {
  return event.type === "medicamento";
}

export function countMedicationEvents(events = []) {
  return events.filter(isMedicationEvent).length;
}

export function groupMedicationsByDetail(events = []) {
  return events.filter(isMedicationEvent).reduce((acc, event) => {
    const key = event.detail || "Sem detalhe";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}
