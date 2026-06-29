export const actionIcons = Object.freeze({
  acordou: "./icons/actions/acordou.png",
  sono: "./icons/actions/soneca.png",
  dormir: "./icons/actions/dormir.png",
  "despertar-noturno": "./icons/actions/despertar-noturno.png",
  amamentacao: "./icons/actions/amamentacao.png",
  mamadeira: "./icons/actions/mamadeira.png",
  fralda: "./icons/actions/fralda.png",
});

export function medicineIconMarkup() {
  return `<svg class="icon-art medicine-svg" viewBox="0 0 64 64" role="img" aria-hidden="true" focusable="false"><circle cx="32" cy="32" r="30" fill="rgba(124,229,194,.15)"/><path d="M23.2 38.8 38.8 23.2a9 9 0 0 1 12.7 12.7L35.9 51.5a9 9 0 0 1-12.7-12.7Z" fill="#f7f3ff" stroke="#7ce5c2" stroke-width="4"/><path d="m31.1 30.9 9 9" stroke="#7ce5c2" stroke-width="4" stroke-linecap="round"/><circle cx="20" cy="18" r="4" fill="#ffd37a"/><circle cx="17" cy="46" r="3" fill="#ff9a76"/></svg>`;
}

export function iconMarkup(iconKey) {
  if (iconKey === "medicamento") return medicineIconMarkup();
  const src = actionIcons[iconKey] || actionIcons.sono;
  return `<img class="icon-art" src="${src}" alt="" aria-hidden="true" loading="eager" decoding="sync" draggable="false" />`;
}

export function preloadActionIcons() {
  Object.values(actionIcons).forEach((src) => {
    const image = new Image();
    image.decoding = "sync";
    image.src = src;
  });
}

export const typeConfig = Object.freeze({
  acordou: {
    title: "Acordou",
    label: "Como acordou",
    options: ["Acordou bem", "Acordou calmo(a)", "Acordou chorando", "Outro"],
    amount: false,
    arcType: "acordou",
    icon: iconMarkup("acordou"),
  },
  sono: {
    title: "Soneca",
    label: "Local da soneca",
    options: ["No berço", "No colo", "Carrinho", "Bebê conforto", "Cama compartilhada", "Outro"],
    amount: false,
    arcType: "sleep",
    icon: iconMarkup("sono"),
  },
  dormir: {
    title: "Sono noturno",
    label: "Local para dormir",
    options: ["Berço", "Mini berço", "Moisés", "Cama compartilhada", "Outro"],
    amount: false,
    arcType: "dormir",
    icon: iconMarkup("dormir"),
  },
  "despertar-noturno": {
    title: "Despertar noturno",
    label: "Motivo do despertar (opcional)",
    options: ["Mamou", "Mamadeira", "Fralda", "Cólica", "Gases", "Refluxo", "Sem motivo aparente", "Outro"],
    amount: false,
    arcType: "despertar-noturno",
    icon: iconMarkup("despertar-noturno"),
  },
  amamentacao: {
    title: "Amamentação",
    label: "Lado",
    options: ["Esquerdo", "Direito", "Mista"],
    amount: false,
    arcType: "amamentacao",
    icon: iconMarkup("amamentacao"),
  },
  mamadeira: {
    title: "Mamadeira",
    label: "Tipo de leite",
    options: ["Leite materno", "Fórmula", "Misto"],
    amount: true,
    arcType: "mamadeira",
    icon: iconMarkup("mamadeira"),
  },
  fralda: {
    title: "Fralda",
    label: "Tipo de fralda",
    options: ["Xixi", "Cocô", "Mista"],
    amount: false,
    arcType: "fralda",
    icon: iconMarkup("fralda"),
  },
  medicamento: {
    title: "Medicamento",
    label: "Tipo de registro",
    options: ["Dose", "Gotas", "Xarope", "Vitamina", "Outro"],
    amount: false,
    arcType: "medicamento",
    icon: iconMarkup("medicamento"),
  },
});
export function getEventConfig(type) {
  return typeConfig[type] || typeConfig.sono;
}

export function isSleepType(type) {
  return type === "sono" || type === "dormir";
}

export function isSleepEvent(event) {
  return isSleepType(event.type);
}
