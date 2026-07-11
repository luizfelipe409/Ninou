import { parseDateTimeInputValue } from "../utils/time.js";

export function buildManualEventPayload({
  type,
  editingEventId,
  dateInput,
  endInput,
  notesInput,
  getDetailValue,
  now = Date.now(),
}) {
  const start = dateInput?.value ? parseDateTimeInputValue(dateInput.value, now) : now;
  const rawEnd = endInput?.value ? parseDateTimeInputValue(endInput.value, null) : null;
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
