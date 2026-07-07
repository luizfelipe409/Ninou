export function createEmptyTimelineItem(markup) {
  const emptyItem = document.createElement("li");
  emptyItem.className = "event-card empty-event";
  emptyItem.innerHTML = markup;
  return emptyItem;
}

export function getLatestEmptyRecordMarkup({
  title = "Nenhum cuidado registrado neste dia ainda",
  description = "Comece registrando mamadeira, fralda, sono ou medicamento. O Ninou monta o resumo conforme a rotina aparece.",
} = {}) {
  return `
    <i class="mark"></i>
    <div>
      <strong>${title}</strong>
      <span>${description}</span>
    </div>
  `;
}

export function getSimpleEmptyMarkup(message = "Nada para mostrar ainda.") {
  return `<p class="empty-state">${message}</p>`;
}
