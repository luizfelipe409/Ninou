export function buildExportEvents(events = [], getEventConfig) {
  return [...events]
    .sort((a, b) => a.start - b.start)
    .map((event) => ({
      id: event.id,
      type: event.type,
      title: getEventConfig(event.type).title,
      start: new Date(event.start).toISOString(),
      end: new Date(event.end).toISOString(),
      durationMinutes: Math.round(Math.max(0, event.end - event.start) / 60000),
      detail: event.detail || "",
      notes: event.notes || "",
    }));
}
