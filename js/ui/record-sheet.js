import { escapeHtml } from "../utils/text.js";

export function isTypeWithManualEnd(type) {
  return type === "sono" || type === "dormir" || type === "despertar-noturno";
}

export function fillDetailOptions(select, options = []) {
  if (!select) return;
  select.innerHTML = "";
  options.forEach((optionText) => {
    const option = document.createElement("option");
    option.textContent = optionText;
    select.append(option);
  });
}

export function applyRecordSheetType({
  type,
  currentEditingEventId,
  getEventConfig,
  elements,
  stopBreastTimer,
  syncBottleAmount,
  defaultBottleAmount = 105,
}) {
  const config = getEventConfig(type);
  const safeType = config ? type : "sono";

  if (elements.title) {
    elements.title.textContent = currentEditingEventId ? `Editar ${config.title}` : config.title;
  }
  if (elements.detailLabel) elements.detailLabel.textContent = config.label;
  if (elements.amountField) elements.amountField.hidden = !config.amount;
  if (elements.breastTimerPanel) elements.breastTimerPanel.hidden = safeType !== "amamentacao";

  const canEditEnd = isTypeWithManualEnd(safeType);
  if (elements.endTimeField) elements.endTimeField.hidden = !canEditEnd;
  if (elements.startLabel) elements.startLabel.textContent = canEditEnd ? "Início" : "Horário";
  if (elements.endLabel) elements.endLabel.textContent = safeType === "despertar-noturno" ? "Voltou a dormir" : "Fim";
  if (!canEditEnd && elements.endInput) elements.endInput.value = "";
  if (!canEditEnd && elements.durationPreview) elements.durationPreview.hidden = true;

  if (safeType !== "amamentacao") stopBreastTimer?.();
  if (safeType === "mamadeira" && !elements.amountInput?.value) {
    syncBottleAmount?.(elements.amountRange?.value || defaultBottleAmount);
  }

  fillDetailOptions(elements.detailSelect, config.options);

  elements.typeButtons?.forEach((button) => {
    button.classList.toggle("active", button.dataset.sheetType === safeType);
  });

  return safeType;
}

export function resetRecordSheet({
  elements,
  resetBreastTimer,
  syncBottleAmount,
  defaultBottleAmount = 105,
}) {
  if (elements.saveButton) elements.saveButton.textContent = "Registrar";
  if (elements.amountInput) elements.amountInput.value = "";
  if (elements.endInput) elements.endInput.value = "";
  if (elements.durationPreview) elements.durationPreview.hidden = true;
  if (elements.notesInput) elements.notesInput.value = "";
  resetBreastTimer?.();
  syncBottleAmount?.(defaultBottleAmount);
}

export function hydrateRecordSheetFromEvent({
  event,
  getEventConfig,
  elements,
  syncBottleAmount,
  toDateTimeInputValue,
  defaultBottleAmount = 105,
}) {
  if (!event) return;
  const config = getEventConfig(event.type);

  if (elements.dateInput) elements.dateInput.value = toDateTimeInputValue(event.start);
  if (elements.endInput) elements.endInput.value = event.end > event.start ? toDateTimeInputValue(event.end) : "";
  if (elements.notesInput) elements.notesInput.value = event.notes || "";
  if (elements.amountInput) elements.amountInput.value = "";

  if (config.amount) {
    const amountMatch = String(event.detail || "").match(/[\d,.]+/);
    syncBottleAmount?.(amountMatch ? amountMatch[0].replace(",", ".") : defaultBottleAmount);
    return;
  }

  const detailSelect = elements.detailSelect;
  if (!detailSelect) return;
  const hasMatchingOption = [...detailSelect.options].some((option) => (
    option.value === event.detail || option.textContent === event.detail
  ));
  if (hasMatchingOption) detailSelect.value = event.detail;
}

export function prepareRecordSheetForOpen({
  editingEvent,
  elements,
  toDateTimeInputValue,
  resetBreastTimer,
  syncBottleAmount,
  hydrateRecordSheetFromEvent,
  defaultBottleAmount = 105,
}) {
  if (elements.saveButton) elements.saveButton.textContent = editingEvent ? "Salvar alterações" : "Registrar";
  if (elements.dateInput) elements.dateInput.value = toDateTimeInputValue();
  if (elements.amountInput) elements.amountInput.value = "";
  if (elements.endInput) elements.endInput.value = "";
  if (elements.durationPreview) elements.durationPreview.hidden = true;
  if (elements.notesInput) elements.notesInput.value = "";
  resetBreastTimer?.();
  syncBottleAmount?.(defaultBottleAmount);

  if (editingEvent) hydrateRecordSheetFromEvent?.(editingEvent);

  if (elements.sheet) elements.sheet.hidden = false;
  if (elements.backdrop) elements.backdrop.hidden = false;
  document.body?.classList.add("record-sheet-open");
  requestAnimationFrame(() => elements.sheet?.scrollTo?.({ top: 0, behavior: "instant" }));
}

export function closeRecordSheet({ elements, resetSheetState }) {
  if (elements.sheet) elements.sheet.hidden = true;
  if (elements.orbitClusterSheet?.hidden && elements.backdrop) {
    elements.backdrop.hidden = true;
  }
  if (elements.orbitClusterSheet?.hidden !== false) {
    document.body?.classList.remove("record-sheet-open");
  }
  resetSheetState?.();
}

export function getRecordSheetDetailValue({
  type,
  detailSelect,
  amountInput,
  amountRange,
  normalizeBottleAmount,
  getBreastTimerDetail,
}) {
  if (type === "mamadeira") {
    const value = Number(amountInput?.value || amountRange?.value || 0);
    const ml = normalizeBottleAmount(value);
    return ml ? `${ml} ml` : detailSelect?.value || "";
  }
  if (type === "amamentacao") {
    return getBreastTimerDetail(detailSelect?.value || "");
  }
  return detailSelect?.value || "";
}

export function getRecordSheetDebugSnapshot({ type, editingEventId, detailSelect, amountInput, notesInput }) {
  return {
    type,
    editingEventId: editingEventId || null,
    detail: detailSelect?.value || "",
    amount: amountInput?.value || "",
    hasNotes: Boolean(notesInput?.value?.trim()),
  };
}
