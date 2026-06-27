export function buildManualEventPayload({
  type,
  editingEventId,
  dateInput,
  endInput,
  notesInput,
  getDetailValue,
  now = Date.now(),
}) {
  const start = dateInput?.value ? new Date(dateInput.value).getTime() : now;
  const rawEnd = endInput?.value ? new Date(endInput.value).getTime() : null;
  const hasManualEnd = Number.isFinite(rawEnd);

  return {
    type,
    editingEventId: editingEventId || null,
    start,
    end: hasManualEnd ? rawEnd : start,
    hasManualEnd,
    isInvalidRange: hasManualEnd && rawEnd < start,
    notes: notesInput?.value?.trim() || "",
    detail: getDetailValue(),
  };
}

export function clearRecordFormAfterSave({
  elements,
  resetBreastTimer,
  syncBottleAmount,
  defaultBottleAmount = 105,
}) {
  if (elements.amountInput) elements.amountInput.value = "";
  if (elements.endInput) elements.endInput.value = "";
  if (elements.durationPreview) elements.durationPreview.hidden = true;
  if (elements.notesInput) elements.notesInput.value = "";
  resetBreastTimer?.();
  syncBottleAmount?.(defaultBottleAmount);
}

export function buildDeleteConfirmationText(event, { getEventConfig, formatTime }) {
  const title = getEventConfig(event.type).title.toLowerCase();
  return `Excluir ${title} das ${formatTime(event.start)}?`;
}

export function shouldRenderEditActions(event) {
  return Boolean(event?.id);
}
