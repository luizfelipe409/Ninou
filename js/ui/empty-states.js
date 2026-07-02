export function createEmptyTimelineItem(markup) {
  const emptyItem = document.createElement("li");
  emptyItem.className = "event-card empty-event";
  emptyItem.innerHTML = markup;
  return emptyItem;
}

export function getLatestEmptyRecordMarkup({
  title = "Nenhum registro",
  description = "O dia ainda está zerado.",
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
