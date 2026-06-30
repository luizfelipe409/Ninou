export function createEmptyTimelineItem(markup) {
  const emptyItem = document.createElement("li");
  emptyItem.className = "event-card empty-event";
  emptyItem.innerHTML = markup;
  return emptyItem;
}

export function getLatestEmptyRecordMarkup({
  title = "Ainda não há registros neste dia",
  description = "Comece com sono, mamada, fralda ou medicamento para o Ninou montar o resumo da rotina.",
} = {}) {
  return `
    <i class="mark"></i>
    <div>
      <strong>${title}</strong>
      <span>${description}</span>
    </div>
  `;
}

export function getSimpleEmptyMarkup(message = "Nenhum item encontrado.") {
  return `<p class="empty-state">${message}</p>`;
}
