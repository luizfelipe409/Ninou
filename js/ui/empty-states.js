export function createEmptyTimelineItem(markup) {
  const emptyItem = document.createElement("li");
  emptyItem.className = "event-card empty-event polished-empty-card";
  emptyItem.innerHTML = markup;
  return emptyItem;
}

export function getPolishedEmptyMarkup({
  icon = "♡",
  eyebrow = "Tudo pronto",
  title = "Nada registrado ainda",
  description = "Quando a rotina começar, o Ninou organiza os cuidados do bebê em ordem e monta o resumo automaticamente.",
  action = "Use os botões principais para começar.",
} = {}) {
  return `
    <i class="mark polished-empty-icon" aria-hidden="true">${icon}</i>
    <div class="polished-empty-content">
      <small>${eyebrow}</small>
      <strong>${title}</strong>
      <span>${description}</span>
      ${action ? `<em>${action}</em>` : ""}
    </div>
  `;
}

export function getLatestEmptyRecordMarkup({
  title = "Nenhum cuidado registrado hoje ainda",
  description = "Comece informando se o bebê acordou, já estava acordado ou está dormindo. Depois disso, registre mamadeira, fralda, sono e observações conforme a rotina acontecer.",
  action = "O resumo aparece aqui assim que o primeiro registro for salvo.",
} = {}) {
  return getPolishedEmptyMarkup({
    icon: "✦",
    eyebrow: "Último cuidado",
    title,
    description,
    action,
  });
}

export function getDiaryEmptyRecordMarkup({
  isToday = true,
  hasFilter = false,
  babyName = "bebê",
} = {}) {
  const title = hasFilter
    ? "Nenhum registro neste filtro"
    : isToday
      ? "Nenhum registro hoje ainda"
      : "Nenhum registro nesta data";
  const description = hasFilter
    ? "Troque o filtro para Todos ou inclua um novo registro nessa data."
    : isToday
      ? `Informe como ${babyName} começou o dia para montar a linha do tempo.`
      : "Escolha outra data ou adicione manualmente um cuidado que ficou para trás.";
  return getPolishedEmptyMarkup({
    icon: "☁",
    eyebrow: isToday ? "Diário de hoje" : "Diário selecionado",
    title,
    description,
    action: isToday ? "O botão + também permite incluir registros específicos." : "Registros antigos podem ser ajustados com cuidado.",
  });
}

export function getSimpleEmptyMarkup(message = "Nada para mostrar ainda.") {
  return `<p class="empty-state polished-inline-empty">${message}</p>`;
}
