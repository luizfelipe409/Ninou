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
      createdAt: event.createdAt || "",
      createdByUid: event.createdByUid || "",
      createdByEmail: event.createdByEmail || "",
      createdByName: event.createdByName || "",
      createdByRelationship: event.createdByRelationship || "",
      authorName: event.authorName || "",
      responsibleName: event.responsibleName || "",
      updatedAt: event.updatedAt || "",
      updatedByUid: event.updatedByUid || "",
      updatedByEmail: event.updatedByEmail || "",
      updatedByName: event.updatedByName || "",
      updatedByRelationship: event.updatedByRelationship || "",
      lastAction: event.lastAction || "",
    }));
}
