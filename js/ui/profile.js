import { day } from "../config/constants.js";
import { normalizeWeights } from "../domain/weights.js";
import { escapeHtml, pluralize } from "../utils/text.js";
import { formatDiaryDate, parseLocalDate, toDateInputValue } from "../utils/time.js";

export function getBabyNameFromProfile(profile = {}) {
  return String(profile.name || "").trim();
}

export function getBabyReferenceFromProfile(profile = {}) {
  return getBabyNameFromProfile(profile) || "o bebê";
}

export function getDiaryTitleFromProfile(profile = {}) {
  const name = getBabyNameFromProfile(profile);
  const article = profile.article === "da" ? "da" : "do";
  return name ? `Diário ${article} ${name}` : "Diário do bebê";
}

export function getBabyAgeTextFromProfile(profile = {}) {
  const birthDate = parseLocalDate(profile.birthDate || "");
  if (!birthDate) {
    return {
      short: "Nascimento não preenchido",
      profile: "Preencha o nascimento",
    };
  }

  const today = new Date();
  today.setHours(12, 0, 0, 0);
  if (birthDate.getTime() > today.getTime()) {
    return {
      short: "Revise o nascimento",
      profile: "Data futura",
    };
  }

  const daysAlive = Math.floor((today.getTime() - birthDate.getTime()) / day);
  const weeksAlive = Math.floor(daysAlive / 7);
  const daysText = `${daysAlive} ${pluralize(daysAlive, "dia", "dias")} de vida`;
  const weeksText = `${weeksAlive} ${pluralize(weeksAlive, "semana", "semanas")}`;
  return {
    short: `${daysText} • ${weeksText}`,
    profile: `${daysText} • ${weeksText}`,
  };
}

export function renderBabyIdentityPanel(profile = {}, elements = {}) {
  const name = getBabyNameFromProfile(profile);
  const ageText = getBabyAgeTextFromProfile(profile);

  if (elements.diaryTitle) elements.diaryTitle.textContent = getDiaryTitleFromProfile(profile);
  if (elements.babyAgeLine) elements.babyAgeLine.textContent = ageText.short;
  if (elements.profileBabyName) elements.profileBabyName.textContent = name || "Bebê";
  if (elements.profileBabyAge) elements.profileBabyAge.textContent = ageText.profile;
}

export function syncBabyProfileFormPanel(profile = {}, elements = {}, options = {}) {
  if (elements.babyNameInput) elements.babyNameInput.value = profile.name || "";
  if (elements.babyArticleInput) elements.babyArticleInput.value = profile.article === "da" ? "da" : "do";
  if (elements.babyBirthInput) {
    elements.babyBirthInput.value = profile.birthDate || "";
    elements.babyBirthInput.max = toDateInputValue();
  }
  if (elements.themeModeInput) elements.themeModeInput.value = profile.themeMode || "dark";
  options.renderWeightProfile?.();
}

export function renderWeightProfilePanel({ profile = {}, loadWeights, elements = {} } = {}) {
  const weights = normalizeWeights(profile.weights || loadWeights?.() || []);
  if (elements.babyWeightDateInput) elements.babyWeightDateInput.value = toDateInputValue();
  if (!elements.lastWeightValue || !elements.lastWeightHint || !elements.weightHistoryList) return;

  if (!weights.length) {
    elements.lastWeightValue.textContent = "Nenhum peso cadastrado";
    elements.lastWeightHint.textContent = "Cadastre o peso mais recente para acompanhar a evolução.";
    elements.weightHistoryList.innerHTML = "<li>Nenhum peso cadastrado.</li>";
    return;
  }

  const latest = weights[0];
  elements.lastWeightValue.textContent = `${latest.value.toLocaleString("pt-BR", { minimumFractionDigits: 3, maximumFractionDigits: 3 })} kg`;
  elements.lastWeightHint.textContent = `Última pesagem em ${formatDiaryDate(parseLocalDate(latest.date)?.getTime() || Date.now())}.`;
  elements.weightHistoryList.innerHTML = weights.slice(0, 3).map((item) => `
    <li>
      <div>
        <strong>${item.value.toLocaleString("pt-BR", { minimumFractionDigits: 3, maximumFractionDigits: 3 })} kg</strong>
        <span>${escapeHtml(formatDiaryDate(parseLocalDate(item.date)?.getTime() || Date.now()))}</span>
      </div>
      <button type="button" data-weight-edit="${escapeHtml(item.id)}">Editar</button>
      <button type="button" data-weight-delete="${escapeHtml(item.id)}">Excluir</button>
    </li>
  `).join("");
}

export function readWeightFormValue(elements = {}) {
  const raw = String(elements.babyWeightInput?.value || "").trim().replace(",", ".");
  const parsed = Number(raw);
  const value = Number.isFinite(parsed) && parsed > 40 ? parsed / 1000 : parsed;
  const date = elements.babyWeightDateInput?.value || toDateInputValue();
  return {
    value,
    date,
    valid: Number.isFinite(value) && value > 0 && value <= 30 && Boolean(date),
  };
}

export function hydrateWeightForm(item, elements = {}) {
  if (!item) return;
  if (elements.babyWeightDateInput) elements.babyWeightDateInput.value = item.date;
  if (elements.babyWeightInput) {
    elements.babyWeightInput.value = Number(item.value).toLocaleString("pt-BR", { minimumFractionDigits: 3, maximumFractionDigits: 3 });
    elements.babyWeightInput.focus();
  }
}

export function clearWeightForm(elements = {}) {
  if (elements.babyWeightInput) elements.babyWeightInput.value = "";
}

export function applyProfilePhotoToImages(images, dataUrl) {
  images?.forEach((image) => {
    image.src = dataUrl;
  });
}

export function resizeProfileImage(file, options = {}) {
  const size = options.size || 320;
  const quality = options.quality ?? 0.82;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const image = new Image();
      image.onerror = reject;
      image.onload = () => {
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        const scale = Math.max(size / image.width, size / image.height);
        const width = image.width * scale;
        const height = image.height * scale;
        canvas.width = size;
        canvas.height = size;
        context.drawImage(image, (size - width) / 2, (size - height) / 2, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}
