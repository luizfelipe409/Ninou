const navButtons = document.querySelectorAll(".bottom-nav button");
const screens = document.querySelectorAll(".screen");
const wakeAction = document.querySelector("#wakeAction");
const wakeActionLabel = document.querySelector("#wakeActionLabel");
const wakeActionIcon = wakeAction.querySelector(".action-icon");
const startChoice = document.querySelector("#startChoice");
const startModeButtons = document.querySelectorAll("[data-start-mode]");
const stateLabel = document.querySelector("#stateLabel");
const stateClock = document.querySelector("#stateClock");
const stateHint = document.querySelector("#stateHint");
const orbitEvents = document.querySelector("#orbitEvents");
const sheet = document.querySelector("#recordSheet");
const sheetBackdrop = document.querySelector("#sheetBackdrop");
const orbitClusterSheet = document.querySelector("#orbitClusterSheet");
const orbitClusterTitle = document.querySelector("#orbitClusterTitle");
const orbitClusterList = document.querySelector("#orbitClusterList");
const closeOrbitClusterButton = document.querySelector("#closeOrbitCluster");
const closeSheetButton = document.querySelector("#closeSheet");
const openSheetButtons = document.querySelectorAll("[data-open-sheet]");
const sheetTypeButtons = document.querySelectorAll("[data-sheet-type]");
const sheetTitle = document.querySelector("#sheetTitle");
const sheetDetailLabel = document.querySelector("#sheetDetailLabel");
const sheetDetail = document.querySelector("#sheetDetail");
const sheetAmountField = document.querySelector("#sheetAmountField");
const sheetDateInput = document.querySelector('.record-form input[type="datetime-local"]');
const sheetAmountInput = document.querySelector("#sheetAmountInput");
const bottleAmountRange = document.querySelector("#bottleAmountRange");
const bottleAmountDisplay = document.querySelector("#bottleAmountDisplay");
const breastTimerPanel = document.querySelector("#breastTimerPanel");
const breastTimerTotal = document.querySelector("#breastTimerTotal");
const leftBreastTimer = document.querySelector("#leftBreastTimer");
const rightBreastTimer = document.querySelector("#rightBreastTimer");
const resetBreastTimerButton = document.querySelector("#resetBreastTimerButton");
const breastSideButtons = document.querySelectorAll("[data-breast-side]");
const sheetNotesInput = document.querySelector(".record-form textarea");
const shortcutButtons = document.querySelectorAll("[data-target-shortcut]");
const diaryFilterButtons = document.querySelectorAll("[data-diary-filter]");
const timeline = document.querySelector(".timeline");
const diaryDateInput = document.querySelector("#diaryDateInput");
const diaryDateTitle = document.querySelector("#diaryDateTitle");
const diaryDateHint = document.querySelector("#diaryDateHint");
const saveButton = document.querySelector(".save-button");
const diaryTitle = document.querySelector("#diaryTitle");
const babyAgeLine = document.querySelector("#babyAgeLine");
const profileBabyName = document.querySelector("#profileBabyName");
const profileBabyAge = document.querySelector("#profileBabyAge");
const babyNameInput = document.querySelector("#babyNameInput");
const babyArticleInput = document.querySelector("#babyArticleInput");
const babyBirthInput = document.querySelector("#babyBirthInput");
const profilePhotoInput = document.querySelector("#profilePhotoInput");
const profileImages = document.querySelectorAll("#profilePhoto, .identity img");
const loginEmail = document.querySelector("#loginEmail");
const loginPassword = document.querySelector("#loginPassword");
const loginButton = document.querySelector("#loginButton");
const createAccountButton = document.querySelector("#createAccountButton");
const loginHelper = document.querySelector("#loginHelper");
const resetDataButton = document.querySelector("#resetDataButton");
const exportJsonButton = document.querySelector("#exportJsonButton");
const exportCsvButton = document.querySelector("#exportCsvButton");
const syncPill = document.querySelector(".sync-pill");
const syncStatusTitle = document.querySelector("#syncStatusTitle");
const syncStatusText = document.querySelector("#syncStatusText");
const wakeWindowInput = document.querySelector("#wakeWindowInput");
const wakeWindowValue = document.querySelector("#wakeWindowValue");
const sleepAverage = document.querySelector("#sleepAverage");
const sleepAverageHint = document.querySelector("#sleepAverageHint");
const napAverage = document.querySelector("#napAverage");
const napAverageHint = document.querySelector("#napAverageHint");
const sleepBars = document.querySelector("#sleepBars");
const bestWindow = document.querySelector("#bestWindow");
const bestWindowHint = document.querySelector("#bestWindowHint");
const routineStatus = document.querySelector("#routineStatus");
const routineHint = document.querySelector("#routineHint");
const breastfeedingBars = document.querySelector("#breastfeedingBars");
const bottleBars = document.querySelector("#bottleBars");
const diaperBars = document.querySelector("#diaperBars");
const medicationBars = document.querySelector("#medicationBars");
const dailyDrawer = document.querySelector("#dailyDrawer");
const dailyDrawerHandle = document.querySelector("#dailyDrawerHandle");
const drawerQuickStatus = document.querySelector("#drawerQuickStatus");
const drawerSummaryGrid = document.querySelector("#drawerSummaryGrid");
const drawerLastEvents = document.querySelector("#drawerLastEvents");
const drawerMiniChart = document.querySelector("#drawerMiniChart");
const babyWeightDateInput = document.querySelector("#babyWeightDateInput");
const babyWeightInput = document.querySelector("#babyWeightInput");
const saveBabyWeightButton = document.querySelector("#saveBabyWeightButton");
const lastWeightValue = document.querySelector("#lastWeightValue");
const lastWeightHint = document.querySelector("#lastWeightHint");
const weightHistoryList = document.querySelector("#weightHistoryList");

const storageKeys = {
  photo: "ninou.demo.profilePhoto",
  email: "ninou.demo.email",
  wakeWindow: "ninou.demo.wakeWindow",
  profile: "ninou.demo.profile",
  profileVersion: "ninou.demo.profileVersion",
  dayState: "ninou.demo.dayState",
};

const firebaseConfig = {
  apiKey: "AIzaSyAlGGx3z6kDWk4vsgBjSH2BDkDQwPoZlAM",
  authDomain: "ninou-3c936.firebaseapp.com",
  projectId: "ninou-3c936",
  storageBucket: "ninou-3c936.firebasestorage.app",
  messagingSenderId: "18333404018",
  appId: "1:18333404018:web:6faefb89f2e79e737c6beb",
  measurementId: "G-WPEYS3SH60",
};

const firebaseSdkVersion = "10.12.4";

const actionIcons = {
  acordou: "./icons/actions/acordou.png",
  sono: "./icons/actions/soneca.png",
  dormir: "./icons/actions/dormir.png",
  "despertar-noturno": "./icons/actions/despertar-noturno.png",
  amamentacao: "./icons/actions/amamentacao.png",
  mamadeira: "./icons/actions/mamadeira.png",
  fralda: "./icons/actions/fralda.png",
};

const medicineSvgIcon = `<svg class="icon-art medicine-svg" viewBox="0 0 64 64" role="img" aria-hidden="true" focusable="false"><circle cx="32" cy="32" r="30" fill="rgba(124,229,194,.15)"/><path d="M23.2 38.8 38.8 23.2a9 9 0 0 1 12.7 12.7L35.9 51.5a9 9 0 0 1-12.7-12.7Z" fill="#f7f3ff" stroke="#7ce5c2" stroke-width="4"/><path d="m31.1 30.9 9 9" stroke="#7ce5c2" stroke-width="4" stroke-linecap="round"/><circle cx="20" cy="18" r="4" fill="#ffd37a"/><circle cx="17" cy="46" r="3" fill="#ff9a76"/></svg>`;

function iconMarkup(iconKey) {
  if (iconKey === "medicamento") return medicineSvgIcon;
  const src = actionIcons[iconKey] || actionIcons.sono;
  return `<img class="icon-art" src="${src}" alt="" aria-hidden="true" loading="eager" decoding="sync" draggable="false" />`;
}

function preloadActionIcons() {
  Object.values(actionIcons).forEach((src) => {
    const image = new Image();
    image.decoding = "sync";
    image.src = src;
  });
}

const typeConfig = {
  sono: {
    title: "Soneca",
    label: "Detalhes da soneca",
    options: ["No berço", "Amamentação", "Colo", "Carrinho de bebê", "Mamadeira", "Cama"],
    amount: false,
    arcType: "sleep",
    icon: iconMarkup("sono"),
    notesPlaceholder: "Ex.: dormiu no berço, precisou de colo, acordou tranquilo",
  },
  dormir: {
    title: "Noite",
    label: "Detalhes do sono",
    options: ["Não se aplica"],
    amount: false,
    arcType: "dormir",
    icon: iconMarkup("dormir"),
    notesPlaceholder: "Ex.: rotina da noite, banho, luz baixa, ruído branco",
  },
  "despertar-noturno": {
    title: "Despertar noturno",
    label: "Humor ao acordar",
    options: ["Mau humor", "Neutro(a)", "Bom humor"],
    amount: false,
    arcType: "despertar-noturno",
    icon: iconMarkup("despertar-noturno"),
    notesPlaceholder: "Ex.: chorou pouco, mamou e voltou a dormir",
  },
  amamentacao: {
    title: "Amamentação",
    label: "Lado",
    options: ["Esquerdo", "Direito", "Ambos"],
    amount: false,
    arcType: "amamentacao",
    icon: iconMarkup("amamentacao"),
    notesPlaceholder: "Ex.: pega boa, alternou os lados, mamou com calma",
  },
  mamadeira: {
    title: "Mamadeira",
    label: "Tipo de leite",
    options: ["Leite materno", "Fórmula", "Misto"],
    amount: true,
    arcType: "mamadeira",
    icon: iconMarkup("mamadeira"),
    notesPlaceholder: "Ex.: aceitou bem, pausas para arrotar, restou pouco leite",
  },
  fralda: {
    title: "Fralda",
    label: "Tipo de fralda",
    options: ["Xixi", "Cocô", "Mista"],
    amount: false,
    arcType: "fralda",
    icon: iconMarkup("fralda"),
    notesPlaceholder: "Ex.: quantidade, cor, textura ou possível assadura",
  },
  medicamento: {
    title: "Medicamento",
    label: "Tipo de medicamento",
    options: ["Gotas", "Xarope", "Comprimido", "Pomada", "Spray", "Vitamina", "Outro"],
    amount: false,
    arcType: "medicamento",
    icon: iconMarkup("medicamento"),
    notesPlaceholder: "Ex.: Vitamina D 2 gotas, Tylenol 2,5 ml, horário da próxima dose",
  },
};

const hour = 60 * 60 * 1000;
const day = 24 * hour;

let currentSheetType = "sono";
let currentEditingEventId = null;
let currentDiaryFilter = "all";
let selectedDiaryDay = null;
let wakeWindowMinutes = Number(localStorage.getItem(storageKeys.wakeWindow)) || 70;
let babyProfile = loadBabyProfile();
let currentProfilePhoto = localStorage.getItem(storageKeys.photo) || "";
let profileClientUpdatedAt = Number(localStorage.getItem(storageKeys.profileVersion)) || 0;
let firebaseServices = null;
let firebaseServicesPromise = null;
let cloudUser = null;
let profileUnsubscribe = null;
let dayUnsubscribe = null;
let profileCloudSaveTimer = null;
let dayCloudSaveTimer = null;
let applyingCloudState = false;
let pendingProfilePhotoSave = false;
let orbitRenderSignature = "";
let timelineRenderSignature = "";
let liveTickMinute = -1;
let currentEditingWeightId = null;
let breastTimer = createEmptyBreastTimer();
let breastTimerInterval = null;
let drawerDragStartY = null;
let state = loadLocalDayState();

function createEmptyDayState() {
  return {
    mode: "idle",
    activeStartedAt: null,
    activeType: "sono",
    activeDetail: "",
    activeNotes: "",
    routineStartedAt: null,
    events: [],
  };
}

function makeEvent(type, start, end = start, detail = "", notes = "") {
  return {
    id: `${type}-${Math.round(start)}-${Math.random().toString(36).slice(2, 8)}`,
    type,
    start,
    end,
    detail,
    notes,
  };
}

function normalizeEvent(event = {}) {
  const type = typeof event.type === "string" && typeConfig[event.type] ? event.type : "sono";
  const start = Number(event.start);
  const end = Number(event.end);

  if (!Number.isFinite(start)) return null;

  return {
    id: typeof event.id === "string" ? event.id : `${type}-${Math.round(start)}-${Math.random().toString(36).slice(2, 8)}`,
    type,
    start,
    end: Number.isFinite(end) ? end : start,
    detail: typeof event.detail === "string" ? event.detail : "",
    notes: typeof event.notes === "string" ? event.notes : "",
  };
}

function normalizeDayState(dayState = {}) {
  const validModes = ["idle", "awake", "sleeping"];
  const mode = validModes.includes(dayState.mode) ? dayState.mode : "idle";
  const activeStartedAt = Number(dayState.activeStartedAt);
  const activeType = isSleepType(dayState.activeType) ? dayState.activeType : "sono";

  const routineStartedAt = Number(dayState.routineStartedAt);
  return {
    mode,
    activeStartedAt: mode === "idle" || !Number.isFinite(activeStartedAt) ? null : activeStartedAt,
    activeType: mode === "sleeping" ? activeType : "sono",
    activeDetail: mode === "sleeping" && typeof dayState.activeDetail === "string" ? dayState.activeDetail : "",
    activeNotes: mode === "sleeping" && typeof dayState.activeNotes === "string" ? dayState.activeNotes : "",
    routineStartedAt: Number.isFinite(routineStartedAt) ? routineStartedAt : null,
    events: Array.isArray(dayState.events) ? dayState.events.map(normalizeEvent).filter(Boolean) : [],
  };
}

function loadLocalDayState() {
  try {
    return normalizeDayState(JSON.parse(localStorage.getItem(storageKeys.dayState) || "{}"));
  } catch {
    return createEmptyDayState();
  }
}

function saveLocalDayState() {
  localStorage.setItem(storageKeys.dayState, JSON.stringify(normalizeDayState(state)));
}

function isLoggedIn() {
  return Boolean(cloudUser);
}

function requireLogin(actionText = "salvar dados") {
  if (isLoggedIn()) return true;
  closeSheet();
  showScreen("profile");
  setSyncStatus("offline");
  loginHelper.textContent = `Entre com e-mail e senha para ${actionText}.`;
  return false;
}

function setText(element, value) {
  const nextValue = String(value);
  if (element.textContent !== nextValue) {
    element.textContent = nextValue;
  }
}

function setHidden(element, hidden) {
  if (element.hidden !== hidden) {
    element.hidden = hidden;
  }
}

function saveDayState() {
  if (!isLoggedIn() && !applyingCloudState) return;
  saveLocalDayState();
  scheduleDayCloudSave();
}

function formatDuration(ms) {
  const safeMs = Math.max(0, ms);
  const totalSeconds = Math.floor(safeMs / 1000);
  const hoursValue = Math.floor(totalSeconds / 3600);
  const minutesValue = Math.floor((totalSeconds % 3600) / 60);
  const secondsValue = totalSeconds % 60;
  const pad = (value) => String(value).padStart(2, "0");
  return `${pad(hoursValue)}:${pad(minutesValue)}:${pad(secondsValue)}`;
}

function formatShortDuration(ms) {
  const safeMs = Math.max(0, ms);
  const minutes = Math.round(safeMs / 60000);
  if (minutes < 60) return `${minutes} min`;
  const hoursValue = Math.floor(minutes / 60);
  const minutesValue = minutes % 60;
  return minutesValue ? `${hoursValue}h ${String(minutesValue).padStart(2, "0")}` : `${hoursValue}h`;
}

function formatTime(timestamp) {
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(timestamp));
}

function formatEventMeta(event) {
  const duration = event.end > event.start ? formatShortDuration(event.end - event.start) : "";
  const showRange = (isSleepEvent(event) || event.type === "despertar-noturno") && event.end > event.start;
  const timeText = showRange
    ? `${formatTime(event.start)}-${formatTime(event.end)}`
    : formatTime(event.start);
  return [timeText, duration, event.detail].filter(Boolean).join(" • ");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function toDateTimeInputValue(timestamp = Date.now()) {
  const date = new Date(timestamp);
  const timezoneOffset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - timezoneOffset).toISOString().slice(0, 16);
}

function createEmptyBreastTimer() {
  return {
    leftMs: 0,
    rightMs: 0,
    activeSide: null,
    startedAt: null,
  };
}

function getBreastTimerSnapshot() {
  const snapshot = { ...breastTimer };
  if (snapshot.activeSide && Number.isFinite(snapshot.startedAt)) {
    const elapsed = Math.max(0, Date.now() - snapshot.startedAt);
    if (snapshot.activeSide === "left") snapshot.leftMs += elapsed;
    if (snapshot.activeSide === "right") snapshot.rightMs += elapsed;
  }
  snapshot.startedAt = snapshot.activeSide ? Date.now() : null;
  return snapshot;
}

function commitBreastTimer() {
  breastTimer = getBreastTimerSnapshot();
}

function formatTimerMinute(ms) {
  const totalSeconds = Math.floor(Math.max(0, ms) / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function formatTimerDetail(ms) {
  const totalSeconds = Math.floor(Math.max(0, ms) / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function renderBreastTimer() {
  if (!breastTimerPanel) return;
  const snapshot = getBreastTimerSnapshot();
  const total = snapshot.leftMs + snapshot.rightMs;
  if (leftBreastTimer) leftBreastTimer.textContent = formatTimerMinute(snapshot.leftMs);
  if (rightBreastTimer) rightBreastTimer.textContent = formatTimerMinute(snapshot.rightMs);
  if (breastTimerTotal) breastTimerTotal.textContent = formatTimerMinute(total);
  breastSideButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.breastSide === snapshot.activeSide);
  });
}

function toggleBreastTimer(side) {
  commitBreastTimer();
  breastTimer.activeSide = breastTimer.activeSide === side ? null : side;
  breastTimer.startedAt = breastTimer.activeSide ? Date.now() : null;
  renderBreastTimer();
}

function resetBreastTimer() {
  breastTimer = createEmptyBreastTimer();
  renderBreastTimer();
}

function getBreastTimerTotalMs() {
  const snapshot = getBreastTimerSnapshot();
  return snapshot.leftMs + snapshot.rightMs;
}

function getBreastTimerDetail() {
  const snapshot = getBreastTimerSnapshot();
  const parts = [];
  if (snapshot.leftMs > 0) parts.push(`E ${formatTimerDetail(snapshot.leftMs)}`);
  if (snapshot.rightMs > 0) parts.push(`D ${formatTimerDetail(snapshot.rightMs)}`);
  return parts.join(" • ");
}

function updateBottleAmount(value) {
  const amount = Math.min(350, Math.max(0, Number(value) || 0));
  if (sheetAmountInput) sheetAmountInput.value = String(amount);
  if (bottleAmountRange) bottleAmountRange.value = String(amount);
  if (bottleAmountDisplay) bottleAmountDisplay.textContent = `${amount} ml`;
}

function getAmountMlFromDetail(detail = "") {
  const match = String(detail).match(/[\d,.]+/);
  if (!match) return 0;
  const value = Number(match[0].replace(",", "."));
  return Number.isFinite(value) ? value : 0;
}

function toDateInputValue(timestamp = Date.now()) {
  const date = new Date(timestamp);
  const timezoneOffset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - timezoneOffset).toISOString().slice(0, 10);
}

function getDefaultBabyProfile() {
  return {
    name: "",
    article: "do",
    birthDate: "",
    weights: [],
  };
}

function normalizeBabyWeight(item = {}) {
  const weight = Number(String(item.weight ?? item.value ?? "").replace(",", "."));
  const date = typeof item.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(item.date) ? item.date : toDateInputValue();
  const createdAt = Number(item.createdAt);
  const id = typeof item.id === "string" ? item.id : `weight-${date}-${Math.random().toString(36).slice(2, 8)}`;

  if (!Number.isFinite(weight) || weight <= 0) return null;

  return {
    id,
    date,
    weight: Math.round(weight * 1000) / 1000,
    createdAt: Number.isFinite(createdAt) ? createdAt : Date.now(),
  };
}

function normalizeBabyProfile(profile = {}) {
  const weights = Array.isArray(profile.weights)
    ? profile.weights.map(normalizeBabyWeight).filter(Boolean)
    : [];

  return {
    name: typeof profile.name === "string" ? profile.name : "",
    article: profile.article === "da" ? "da" : "do",
    birthDate: typeof profile.birthDate === "string" ? profile.birthDate : "",
    weights: weights
      .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt)
      .slice(0, 24),
  };
}

function loadBabyProfile() {
  try {
    return normalizeBabyProfile({
      ...getDefaultBabyProfile(),
      ...JSON.parse(localStorage.getItem(storageKeys.profile) || "{}"),
    });
  } catch {
    return getDefaultBabyProfile();
  }
}

function saveBabyProfile() {
  if (!isLoggedIn() && !applyingCloudState) return;
  localStorage.setItem(storageKeys.profile, JSON.stringify(normalizeBabyProfile(babyProfile)));
  if (profileClientUpdatedAt) {
    localStorage.setItem(storageKeys.profileVersion, String(profileClientUpdatedAt));
  }
}

function markProfileLocallyChanged() {
  profileClientUpdatedAt = Math.max(Date.now(), profileClientUpdatedAt + 1);
  localStorage.setItem(storageKeys.profileVersion, String(profileClientUpdatedAt));
}

function ensureProfileVersion() {
  if (!profileClientUpdatedAt) {
    markProfileLocallyChanged();
  }
  return profileClientUpdatedAt;
}

function getCloudProfileVersion(data = {}) {
  const version = Number(data.clientUpdatedAt);
  return Number.isFinite(version) ? version : 0;
}

function hasProfileContent(profile = babyProfile, photo = currentProfilePhoto, windowMinutes = wakeWindowMinutes) {
  const normalizedProfile = normalizeBabyProfile(profile);
  return Boolean(
    normalizedProfile.name.trim() ||
      normalizedProfile.birthDate ||
      photo ||
      normalizedProfile.article === "da" ||
      normalizedProfile.weights.length > 0 ||
      windowMinutes !== 70,
  );
}

function hasCloudProfileContent(data = {}) {
  const profileSource = data.babyProfile && typeof data.babyProfile === "object" ? data.babyProfile : data;
  const photoValue = data.photo || data.photoDataUrl || "";
  const cloudWakeWindow = Number.isFinite(Number(data.wakeWindowMinutes)) ? Number(data.wakeWindowMinutes) : 70;
  return hasProfileContent(profileSource, photoValue, cloudWakeWindow);
}

function getBabyName() {
  return babyProfile.name.trim();
}

function getBabyReference() {
  return getBabyName() || "o bebê";
}

function getDiaryTitle() {
  const name = getBabyName();
  return name ? `Diário ${babyProfile.article} ${name}` : "Diário do bebê";
}

function parseLocalDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, date] = value.split("-").map(Number);
  return new Date(year, month - 1, date, 12, 0, 0, 0);
}

function pluralize(value, singular, plural) {
  return value === 1 ? singular : plural;
}

function getBabyAgeText() {
  const birthDate = parseLocalDate(babyProfile.birthDate);
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

function renderBabyIdentity() {
  const name = getBabyName();
  const ageText = getBabyAgeText();
  diaryTitle.textContent = getDiaryTitle();
  babyAgeLine.textContent = ageText.short;
  profileBabyName.textContent = name || "Bebê";
  profileBabyAge.textContent = ageText.profile;
}

function syncBabyProfileForm() {
  babyNameInput.value = babyProfile.name;
  babyArticleInput.value = babyProfile.article;
  babyBirthInput.value = babyProfile.birthDate;
  babyBirthInput.max = toDateInputValue();
  if (babyWeightDateInput) babyWeightDateInput.max = toDateInputValue();
}

function updateBabyProfile(patch) {
  if (!requireLogin("salvar o perfil")) {
    syncBabyProfileForm();
    return;
  }

  babyProfile = normalizeBabyProfile({
    ...babyProfile,
    ...patch,
  });
  markProfileLocallyChanged();
  saveBabyProfile();
  renderBabyIdentity();
  renderWeightHistory();
  renderCurrentState();
  scheduleProfileCloudSave();
}

function formatWeight(weight) {
  return `${Number(weight).toLocaleString("pt-BR", { minimumFractionDigits: 3, maximumFractionDigits: 3 })} kg`;
}

function formatWeightDate(dateValue) {
  const parsed = parseLocalDate(dateValue);
  if (!parsed) return "Data não informada";
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric" }).format(parsed);
}

function resetWeightForm() {
  currentEditingWeightId = null;
  if (babyWeightDateInput) babyWeightDateInput.value = toDateInputValue();
  if (babyWeightInput) babyWeightInput.value = "";
  if (saveBabyWeightButton) saveBabyWeightButton.textContent = "Salvar peso";
}

function renderWeightHistory() {
  if (!lastWeightValue || !weightHistoryList) return;
  const weights = [...(babyProfile.weights || [])].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt);
  const latest = weights[0];

  if (!latest) {
    lastWeightValue.textContent = "Nenhum peso cadastrado";
    lastWeightHint.textContent = "Cadastre o peso mais recente para acompanhar a evolução.";
    weightHistoryList.innerHTML = "<li>Nenhum peso cadastrado.</li>";
    return;
  }

  lastWeightValue.textContent = formatWeight(latest.weight);
  lastWeightHint.textContent = `Registrado em ${formatWeightDate(latest.date)}.`;
  weightHistoryList.innerHTML = weights.slice(0, 3).map((item) => `
    <li>
      <div>
        <strong>${escapeHtml(formatWeight(item.weight))}</strong>
        <span>${escapeHtml(formatWeightDate(item.date))}</span>
      </div>
      <div class="weight-actions">
        <button type="button" data-weight-edit="${escapeHtml(item.id)}" aria-label="Editar peso">✎</button>
        <button type="button" data-weight-delete="${escapeHtml(item.id)}" aria-label="Excluir peso">×</button>
      </div>
    </li>
  `).join("");
}

function saveBabyWeight() {
  if (!requireLogin("salvar o peso")) return;
  const weight = Number(String(babyWeightInput.value || "").replace(",", "."));
  const date = babyWeightDateInput.value || toDateInputValue();

  if (!Number.isFinite(weight) || weight <= 0) {
    babyWeightInput.focus();
    return;
  }

  const nextItem = normalizeBabyWeight({
    id: currentEditingWeightId || `weight-${date}-${Math.random().toString(36).slice(2, 8)}`,
    date,
    weight,
    createdAt: currentEditingWeightId
      ? babyProfile.weights.find((item) => item.id === currentEditingWeightId)?.createdAt || Date.now()
      : Date.now(),
  });

  if (!nextItem) return;

  const remaining = (babyProfile.weights || []).filter((item) => item.id !== nextItem.id);
  babyProfile = normalizeBabyProfile({
    ...babyProfile,
    weights: [nextItem, ...remaining],
  });
  markProfileLocallyChanged();
  saveBabyProfile();
  resetWeightForm();
  renderWeightHistory();
  scheduleProfileCloudSave();
}

function editBabyWeight(weightId) {
  const item = (babyProfile.weights || []).find((weight) => weight.id === weightId);
  if (!item) return;
  currentEditingWeightId = item.id;
  babyWeightDateInput.value = item.date;
  babyWeightInput.value = String(item.weight).replace(".", ",");
  saveBabyWeightButton.textContent = "Salvar alteração";
  babyWeightInput.focus();
}

function deleteBabyWeight(weightId) {
  if (!requireLogin("excluir o peso")) return;
  const item = (babyProfile.weights || []).find((weight) => weight.id === weightId);
  if (!item) return;
  if (!window.confirm(`Excluir peso ${formatWeight(item.weight)} de ${formatWeightDate(item.date)}?`)) return;
  babyProfile = normalizeBabyProfile({
    ...babyProfile,
    weights: babyProfile.weights.filter((weight) => weight.id !== weightId),
  });
  markProfileLocallyChanged();
  saveBabyProfile();
  resetWeightForm();
  renderWeightHistory();
  scheduleProfileCloudSave();
}

async function getFirebaseServices() {
  if (firebaseServices) return firebaseServices;

  if (!firebaseServicesPromise) {
    firebaseServicesPromise = Promise.all([
      import(`https://www.gstatic.com/firebasejs/${firebaseSdkVersion}/firebase-app.js`),
      import(`https://www.gstatic.com/firebasejs/${firebaseSdkVersion}/firebase-auth.js`),
      import(`https://www.gstatic.com/firebasejs/${firebaseSdkVersion}/firebase-firestore.js`),
    ])
      .then(([appModule, authModule, firestoreModule]) => {
        const app = appModule.initializeApp(firebaseConfig);

        firebaseServices = {
          auth: authModule.getAuth(app),
          createUserWithEmailAndPassword: authModule.createUserWithEmailAndPassword,
          signInWithEmailAndPassword: authModule.signInWithEmailAndPassword,
          signOut: authModule.signOut,
          onAuthStateChanged: authModule.onAuthStateChanged,
          db: firestoreModule.getFirestore(app),
          doc: firestoreModule.doc,
          setDoc: firestoreModule.setDoc,
          onSnapshot: firestoreModule.onSnapshot,
          serverTimestamp: firestoreModule.serverTimestamp,
        };

        return firebaseServices;
      })
      .catch((error) => {
        firebaseServicesPromise = null;
        console.error("Erro ao carregar Firebase:", error);
        throw error;
      });
  }

  return firebaseServicesPromise;
}

function getCurrentDayId() {
  return toDateInputValue(getDayStart());
}

function getCloudProfileRef() {
  if (!firebaseServices || !cloudUser) return null;
  return firebaseServices.doc(firebaseServices.db, "users", cloudUser.uid, "profile", "main");
}

function getCloudDayRef(dayId = getCurrentDayId()) {
  if (!firebaseServices || !cloudUser) return null;
  return firebaseServices.doc(firebaseServices.db, "users", cloudUser.uid, "days", dayId);
}

function unsubscribeCloudListeners() {
  if (profileUnsubscribe) profileUnsubscribe();
  if (dayUnsubscribe) dayUnsubscribe();
  profileUnsubscribe = null;
  dayUnsubscribe = null;
}

function renderAuthControls() {
  const connected = isLoggedIn();
  loginButton.textContent = connected ? "Conectado" : "Entrar";
  loginButton.disabled = connected;
  createAccountButton.textContent = connected ? "Sair" : "Criar conta nova";
  createAccountButton.classList.toggle("logout-button", connected);
  loginEmail.disabled = connected;
  loginPassword.disabled = connected;
}

function clearLocalAccountData() {
  [
    storageKeys.photo,
    storageKeys.email,
    storageKeys.wakeWindow,
    storageKeys.profile,
    storageKeys.profileVersion,
    storageKeys.dayState,
  ].forEach((key) => {
    localStorage.removeItem(key);
  });

  state = createEmptyDayState();
  babyProfile = getDefaultBabyProfile();
  currentProfilePhoto = "";
  profileClientUpdatedAt = 0;
  pendingProfilePhotoSave = false;
  wakeWindowMinutes = 70;
  updateProfilePhoto("./icons/icon-192.png");
  syncBabyProfileForm();
  updateWakeWindow(wakeWindowMinutes, { skipLogin: true, skipPersist: true });
  renderAll();
}

async function connectCurrentAccount() {
  await subscribeToCloudProfile();
  await subscribeToCloudDay();
}

function getProfilePayload(options = {}) {
  const payload = {
    ...normalizeBabyProfile(babyProfile),
    wakeWindowMinutes,
    clientUpdatedAt: ensureProfileVersion(),
    updatedAt: firebaseServices.serverTimestamp(),
  };

  if (options.includePhoto) {
    payload.photo = currentProfilePhoto || "";
  }

  return payload;
}

function applyCloudProfile(data = {}) {
  const cloudProfileVersion = getCloudProfileVersion(data);
  const cloudHasContent = hasCloudProfileContent(data);
  const localHasContent = hasProfileContent();

  if (!cloudHasContent && localHasContent) {
    saveProfileToCloud({ includePhoto: Boolean(currentProfilePhoto) });
    return;
  }

  if (localHasContent && profileClientUpdatedAt && cloudProfileVersion < profileClientUpdatedAt) {
    return;
  }

  applyingCloudState = true;
  try {
    profileClientUpdatedAt = cloudProfileVersion;

    const profileSource = data.babyProfile && typeof data.babyProfile === "object" ? data.babyProfile : data;
    babyProfile = normalizeBabyProfile(profileSource);
    if (Object.prototype.hasOwnProperty.call(data, "photo") || Object.prototype.hasOwnProperty.call(data, "photoDataUrl")) {
      const photoValue = data.photo || data.photoDataUrl;
      currentProfilePhoto = typeof photoValue === "string" ? photoValue : "";
    }

    if (Number.isFinite(Number(data.wakeWindowMinutes))) {
      wakeWindowMinutes = Math.min(240, Math.max(20, Number(data.wakeWindowMinutes)));
      localStorage.setItem(storageKeys.wakeWindow, String(wakeWindowMinutes));
    }

    saveBabyProfile();

    if (currentProfilePhoto) {
      try {
        localStorage.setItem(storageKeys.photo, currentProfilePhoto);
      } catch {
        // A foto continua visível mesmo se o navegador não permitir salvar localmente.
      }
      updateProfilePhoto(currentProfilePhoto);
    } else {
      localStorage.removeItem(storageKeys.photo);
      updateProfilePhoto("./icons/icon-192.png");
    }

    syncBabyProfileForm();
    wakeWindowInput.value = String(wakeWindowMinutes);
    wakeWindowValue.textContent = String(wakeWindowMinutes);
    renderAll();
  } finally {
    applyingCloudState = false;
  }
}

function applyCloudDay(data = {}) {
  applyingCloudState = true;
  const daySource = data.state && typeof data.state === "object" ? data.state : data;
  state = normalizeDayState(daySource);
  saveLocalDayState();
  renderAll();
  applyingCloudState = false;
}

function scheduleProfileCloudSave(options = {}) {
  if (applyingCloudState || !cloudUser || !firebaseServices) return;
  if (options.includePhoto) pendingProfilePhotoSave = true;

  window.clearTimeout(profileCloudSaveTimer);
  profileCloudSaveTimer = window.setTimeout(saveProfileToCloud, options.includePhoto ? 120 : 600);
}

async function saveProfileToCloud(options = {}) {
  const profileRef = getCloudProfileRef();
  if (!profileRef) return;

  const includePhoto = Boolean(options.includePhoto || pendingProfilePhotoSave);
  const payload = getProfilePayload({ includePhoto });
  const savedProfileVersion = payload.clientUpdatedAt;

  try {
    await firebaseServices.setDoc(profileRef, payload, { merge: true });
    if (includePhoto) pendingProfilePhotoSave = false;
    if (savedProfileVersion === profileClientUpdatedAt) {
      setSyncStatus("online", cloudUser.email);
    }
  } catch (error) {
    console.error("Erro ao salvar perfil:", error);
    if (savedProfileVersion === profileClientUpdatedAt) {
      setSyncStatus("error", cloudUser.email);
      loginHelper.textContent = getFirebaseErrorMessage(error);
    }
  }
}

function scheduleDayCloudSave() {
  if (applyingCloudState || !cloudUser || !firebaseServices) return;

  window.clearTimeout(dayCloudSaveTimer);
  dayCloudSaveTimer = window.setTimeout(saveDayToCloud, 500);
}

async function saveDayToCloud() {
  const dayRef = getCloudDayRef();
  if (!dayRef || applyingCloudState) return;

  try {
    await firebaseServices.setDoc(
      dayRef,
      {
        ...normalizeDayState(state),
        updatedAt: firebaseServices.serverTimestamp(),
      },
      { merge: true },
    );
    setSyncStatus("online", cloudUser.email);
  } catch (error) {
    console.error("Erro ao salvar rotina:", error);
    setSyncStatus("error", cloudUser.email);
    loginHelper.textContent = getFirebaseErrorMessage(error);
  }
}

async function subscribeToCloudProfile() {
  const profileRef = getCloudProfileRef();
  if (!profileRef) return;

  if (profileUnsubscribe) profileUnsubscribe();

  profileUnsubscribe = firebaseServices.onSnapshot(profileRef, (snapshot) => {
    if (!snapshot.exists()) {
      if (hasProfileContent()) {
        saveProfileToCloud({ includePhoto: Boolean(currentProfilePhoto) });
      }
      return;
    }

    applyCloudProfile(snapshot.data());
  }, (error) => {
    console.error("Erro ao ler perfil:", error);
    setSyncStatus("error", cloudUser?.email || "");
  });
}

async function subscribeToCloudDay() {
  const dayRef = getCloudDayRef();
  if (!dayRef) return;

  if (dayUnsubscribe) dayUnsubscribe();

  dayUnsubscribe = firebaseServices.onSnapshot(dayRef, (snapshot) => {
    if (!snapshot.exists()) {
      saveDayToCloud();
      return;
    }

    applyCloudDay(snapshot.data());
  }, (error) => {
    console.error("Erro ao ler rotina:", error);
    setSyncStatus("error", cloudUser?.email || "");
  });
}

async function initFirebaseAuthState() {
  const services = await getFirebaseServices();

  services.onAuthStateChanged(services.auth, async (user) => {
    cloudUser = user;

    if (!user) {
      unsubscribeCloudListeners();
      clearLocalAccountData();
      setSyncStatus("offline");
      loginEmail.value = "";
      loginPassword.value = "";
      renderAuthControls();
      loginHelper.textContent = "Entre com e-mail e senha para sincronizar entre aparelhos.";
      return;
    }

    localStorage.setItem(storageKeys.email, user.email || "");
    loginEmail.value = user.email || "";

    setSyncStatus("loading", user.email || "");
    renderAuthControls();
    loginHelper.textContent = "Conectando à conta...";

    try {
      await connectCurrentAccount();
      setSyncStatus("online", user.email || "");
      loginHelper.textContent = "Conta conectada e sincronizando.";
    } catch (error) {
      console.error("Erro ao conectar família:", error);
      setSyncStatus("error", user.email || "");
      loginHelper.textContent = getFirebaseErrorMessage(error);
    }
  });
}

function getFirebaseErrorMessage(error) {
  const code = error?.code || "";

  const messages = {
    "auth/email-already-in-use": "Este e-mail já tem uma conta. Toque em Entrar.",
    "auth/invalid-email": "Digite um e-mail válido.",
    "auth/user-not-found": "Conta não encontrada. Crie uma conta nova.",
    "auth/wrong-password": "Senha incorreta.",
    "auth/invalid-credential": "E-mail ou senha incorretos.",
    "auth/weak-password": "A senha precisa ter pelo menos 6 caracteres.",
    "auth/operation-not-allowed": "Ative Email/Password no Firebase Authentication.",
    "auth/network-request-failed": "Falha de conexão. Verifique a internet.",
    "permission-denied": "Sem permissão no banco. Libere users/{uid}/profile/main e users/{uid}/days nas regras do Firestore.",
    "resource-exhausted": "Não foi possível salvar. A foto ou os dados ficaram grandes demais para o Firestore.",
    "invalid-argument": "Não foi possível salvar. Revise a foto ou os dados do perfil.",
    "unavailable": "Firebase indisponível no momento. Tente novamente em alguns segundos.",
  };

  return messages[code] || "Não foi possível concluir a operação. Tente novamente.";
}

async function signInAccount() {
  const credentials = getLoginCredentials("entrar");
  if (!credentials) return;

  try {
    const services = await getFirebaseServices();

    loginHelper.textContent = "Entrando...";
    loginButton.disabled = true;
    createAccountButton.disabled = true;

    await services.signInWithEmailAndPassword(services.auth, credentials.email, credentials.password);
    localStorage.setItem(storageKeys.email, credentials.email);
  } catch (error) {
    console.error("Erro ao entrar:", error);
    loginHelper.textContent = getFirebaseErrorMessage(error);
  } finally {
    renderAuthControls();
    createAccountButton.disabled = false;
  }
}

async function createAccount() {
  if (isLoggedIn()) {
    await signOutAccount();
    return;
  }

  const credentials = getLoginCredentials("criar a conta");
  if (!credentials) return;

  if (credentials.password.length < 6) {
    loginHelper.textContent = "A senha precisa ter pelo menos 6 caracteres.";
    return;
  }

  try {
    const services = await getFirebaseServices();

    loginHelper.textContent = "Criando conta...";
    loginButton.disabled = true;
    createAccountButton.disabled = true;

    await services.createUserWithEmailAndPassword(services.auth, credentials.email, credentials.password);
    localStorage.setItem(storageKeys.email, credentials.email);
  } catch (error) {
    console.error("Erro ao criar conta:", error);
    loginHelper.textContent = getFirebaseErrorMessage(error);
  } finally {
    renderAuthControls();
    createAccountButton.disabled = false;
  }
}

async function signOutAccount() {
  try {
    const services = await getFirebaseServices();
    loginHelper.textContent = "Saindo...";
    createAccountButton.disabled = true;
    await services.signOut(services.auth);
    cloudUser = null;
    unsubscribeCloudListeners();
    clearLocalAccountData();
    setSyncStatus("offline");
    loginEmail.value = "";
    loginPassword.value = "";
    loginEmail.disabled = false;
    loginPassword.disabled = false;
    renderAuthControls();
    loginHelper.textContent = "Conta desconectada neste aparelho.";
  } catch (error) {
    console.error("Erro ao sair:", error);
    loginHelper.textContent = "Não foi possível sair. Tente novamente.";
  } finally {
    createAccountButton.disabled = false;
  }
}

function getEventConfig(type) {
  return typeConfig[type] || typeConfig.sono;
}

function isSleepType(type) {
  return type === "sono" || type === "dormir";
}

function isSleepEvent(event) {
  return isSleepType(event.type);
}

function getDayStart(timestamp = Date.now()) {
  const date = new Date(timestamp);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

function getDayLabel(timestamp) {
  return new Intl.DateTimeFormat("pt-BR", { weekday: "short" })
    .format(new Date(timestamp))
    .replace(".", "");
}

function formatDiaryDate(timestamp) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
  }).format(new Date(timestamp));
}

function matchesDiaryFilter(event) {
  if (currentDiaryFilter === "all") return true;
  if (currentDiaryFilter === "sleep") return isSleepEvent(event) || event.type === "despertar-noturno";
  if (currentDiaryFilter === "feeding") return event.type === "mamadeira" || event.type === "amamentacao";
  if (currentDiaryFilter === "diaper") return event.type === "fralda";
  if (currentDiaryFilter === "medicine") return event.type === "medicamento";
  return true;
}

function getWakeWindowText() {
  const elapsed = Date.now() - state.activeStartedAt;
  if (getActiveNightWakeEvent()) {
    return `Despertar iniciado às ${formatTime(state.activeStartedAt)}.`;
  }

  return state.mode === "sleeping"
    ? `Ficou acordado ${formatShortDuration(elapsed)} antes de dormir.`
    : `Acordado desde ${formatTime(state.activeStartedAt)}.`;
}

function setWakeActionIcon() {
  const nightWakeActive = state.mode !== "sleeping" && getActiveNightWakeEvent();
  const iconKey = state.mode === "sleeping" ? "acordou" : nightWakeActive ? "dormir" : "sono";
  if (wakeActionIcon.dataset.iconKey === iconKey) return;

  wakeActionIcon.dataset.iconKey = iconKey;
  wakeActionIcon.innerHTML = iconMarkup(iconKey);
}

function renderCurrentState() {
  if (state.mode === "idle") {
    setHidden(wakeAction, true);
    setHidden(startChoice, false);
    setText(stateLabel, "Rotina zerada");
    setText(stateClock, "00:00:00");
    setText(stateHint, `Escolha se ${getBabyReference()} acordou ou iniciou uma soneca.`);
    return;
  }

  setHidden(wakeAction, false);
  setHidden(startChoice, true);
  const elapsed = Date.now() - state.activeStartedAt;
  const sleeping = state.mode === "sleeping";
  const nightWakeActive = getActiveNightWakeEvent();
  setText(wakeActionLabel, sleeping ? "Acordou" : nightWakeActive ? "Voltou a dormir" : "Iniciar soneca");
  setText(stateLabel, sleeping ? "Dormindo há" : nightWakeActive ? "Despertar noturno há" : "Acordado há");
  setText(stateClock, formatDuration(elapsed));
  setText(stateHint, getWakeWindowText());
  setWakeActionIcon();
}

function eventPosition(timestamp) {
  const date = new Date(timestamp);
  const minutes = date.getHours() * 60 + date.getMinutes();
  const progress = minutes / 1440;
  const startAngle = 142;
  const arcSize = 256;
  const angle = ((startAngle + progress * arcSize) * Math.PI) / 180;
  const radius = 132;
  return {
    x: Math.round(Math.cos(angle) * radius),
    y: Math.round(Math.sin(angle) * radius),
  };
}

function getOrbitEventEnd(event) {
  if (event.isActive) return Date.now();
  return event.end;
}

function getOrbitEventRange(event) {
  const end = getOrbitEventEnd(event);
  return end > event.start ? `${formatTime(event.start)} - ${formatTime(end)}` : formatTime(event.start);
}

function getOrbitEventSubline(event) {
  if (event.isActive) return "Em andamento";
  const duration = event.end > event.start ? formatShortDuration(event.end - event.start) : "";
  return [duration, event.detail].filter(Boolean).join(" • ") || "Registro rápido";
}

function getDistance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function getOrbitGroups(items) {
  const groups = [];
  const overlapDistance = 30;

  items.forEach((item) => {
    const group = groups.find((candidate) => candidate.items.some((member) => getDistance(member.position, item.position) <= overlapDistance));
    if (group) {
      group.items.push(item);
      group.position = {
        x: Math.round(group.items.reduce((total, member) => total + member.position.x, 0) / group.items.length),
        y: Math.round(group.items.reduce((total, member) => total + member.position.y, 0) / group.items.length),
      };
      return;
    }

    groups.push({ items: [item], position: item.position });
  });

  return groups;
}

function createOrbitEvent(event, active = false, position = eventPosition(event.start)) {
  const config = getEventConfig(event.type);
  const item = document.createElement("div");
  item.className = `orbit-event ${config.arcType}${active ? " active" : ""}`;
  item.style.setProperty("--x", `${position.x}px`);
  item.style.setProperty("--y", `${position.y}px`);

  const icon = document.createElement("i");
  icon.innerHTML = config.icon;
  const label = document.createElement("b");
  label.textContent = formatTime(event.start);

  item.append(icon, label);
  item.title = `${config.title} às ${formatTime(event.start)}`;
  return item;
}

function createOrbitCluster(group) {
  const eventList = group.items.map((item) => item.event).sort((a, b) => a.start - b.start);
  const config = getEventConfig(eventList[0].type);
  const button = document.createElement("button");
  button.type = "button";
  button.className = `orbit-event orbit-cluster ${config.arcType}`;
  button.style.setProperty("--x", `${group.position.x}px`);
  button.style.setProperty("--y", `${group.position.y}px`);
  button.title = `${eventList.length} registros próximos`;
  button.setAttribute("aria-label", `${eventList.length} registros próximos no arco`);
  button.innerHTML = `
    <i><span>...</span></i>
    <b>${eventList.length}</b>
  `;
  button.addEventListener("click", () => openOrbitCluster(eventList));
  return button;
}

function getEventRenderSignature(event, options = {}) {
  const eventKey = options.active ? `active-${event.type}-${Math.round(event.start)}` : event.id;
  const endKey = options.active ? "live" : Math.round(event.end || event.start);
  return [
    eventKey,
    event.type,
    Math.round(event.start),
    endKey,
    event.detail,
    event.notes,
  ].join("|");
}

function getOrbitItemSignature(item) {
  return [
    getEventRenderSignature(item.event, { active: item.active }),
    item.active ? "active" : "done",
    item.position.x,
    item.position.y,
  ].join("|");
}

function getOrbitRenderSignature(items) {
  return items.map(getOrbitItemSignature).join("||");
}

function getTimelineRenderSignature(selectedStart, selectedEnd, visibleEvents, latest) {
  return [
    selectedStart,
    selectedEnd,
    currentDiaryFilter,
    visibleEvents.map((event) => getEventRenderSignature(event)).join("||"),
    latest ? getEventRenderSignature(latest) : "empty-latest",
  ].join("::");
}

function renderOrbit() {
  const now = Date.now();
  const dayAgo = now - 24 * hour;
  const items = state.events
    .filter((event) => event.start >= dayAgo)
    .slice(-14)
    .map((event) => ({
      event,
      active: false,
      position: eventPosition(event.start),
    }));

  if (state.mode === "sleeping") {
    const activeStartedAt = Number(state.activeStartedAt) || now;
    const activeEvent = {
      id: `active-${state.activeType || "sono"}-${Math.round(activeStartedAt)}`,
      type: state.activeType || "sono",
      start: activeStartedAt,
      end: now,
      detail: state.activeDetail || "Timer",
      notes: state.activeNotes || "",
      isActive: true,
    };
    items.push({
      event: activeEvent,
      active: true,
      position: eventPosition(activeEvent.start),
    });
  }

  const nextSignature = getOrbitRenderSignature(items);
  if (nextSignature === orbitRenderSignature) return;

  orbitRenderSignature = nextSignature;
  orbitEvents.replaceChildren();

  getOrbitGroups(items).forEach((group) => {
    if (group.items.length > 1) {
      orbitEvents.append(createOrbitCluster(group));
      return;
    }

    const [item] = group.items;
    orbitEvents.append(createOrbitEvent(item.event, item.active, item.position));
  });
}

function renderTimeline() {
  const lastCard = document.querySelector(".last-card .event-card");
  if (!timeline || !lastCard) return;

  const selectedStart = selectedDiaryDay ?? getDayStart();
  const selectedEnd = selectedStart + day;
  const orderedEvents = [...state.events].sort((a, b) => b.start - a.start);
  const dayEvents = orderedEvents.filter((event) => event.start >= selectedStart && event.start < selectedEnd);
  const visibleEvents = dayEvents.filter(matchesDiaryFilter);
  const latest = orderedEvents[0];
  const nextSignature = getTimelineRenderSignature(selectedStart, selectedEnd, visibleEvents, latest);
  if (nextSignature === timelineRenderSignature) return;

  timelineRenderSignature = nextSignature;
  timeline.innerHTML = "";
  diaryDateTitle.textContent = formatDiaryDate(selectedStart);
  diaryDateHint.textContent = selectedStart === getDayStart() ? "Hoje" : "Data selecionada";

  if (!visibleEvents.length) {
    const emptyItem = document.createElement("li");
    emptyItem.className = "event-card empty-event";
    emptyItem.innerHTML = `
      <i class="mark"></i>
      <div>
        <strong>Nenhum registro</strong>
        <span>Escolha outro filtro, outra data ou crie um novo registro.</span>
      </div>
    `;
    timeline.append(emptyItem);
  }

  visibleEvents.slice(0, 8).forEach((event) => {
    const config = getEventConfig(event.type);
    const item = document.createElement("li");
    item.className = "event-card";
    item.innerHTML = `
      <i class="mark ${config.arcType}">${config.icon}</i>
      <div>
        <strong>${escapeHtml(config.title)}</strong>
        <span>${escapeHtml(formatEventMeta(event))}</span>
        ${event.notes ? `<p>${escapeHtml(event.notes)}</p>` : ""}
        <div class="event-actions">
          <button class="event-action-button edit" type="button" data-event-edit="${escapeHtml(event.id)}" aria-label="Editar ${escapeHtml(config.title)}">
            <span>✎</span>
            Editar
          </button>
          <button class="event-action-button delete" type="button" data-event-delete="${escapeHtml(event.id)}" aria-label="Excluir ${escapeHtml(config.title)}">
            <span>×</span>
            Excluir
          </button>
        </div>
      </div>
    `;
    timeline.append(item);
  });

  if (!latest) {
    lastCard.innerHTML = `
      <i class="mark"></i>
      <div>
        <strong>Nenhum registro</strong>
        <span>O dia ainda está zerado.</span>
      </div>
    `;
    return;
  }
  const latestConfig = getEventConfig(latest.type);
  lastCard.innerHTML = `
    <i class="mark ${latestConfig.arcType}">${latestConfig.icon}</i>
    <div>
      <strong>${escapeHtml(latestConfig.title)}</strong>
      <span>${escapeHtml(formatEventMeta(latest))}</span>
      ${latest.notes ? `<p>${escapeHtml(latest.notes)}</p>` : ""}
    </div>
  `;
}

function openOrbitCluster(events) {
  const orderedEvents = [...events].sort((a, b) => a.start - b.start);
  orbitClusterTitle.textContent = `${orderedEvents.length} registros próximos`;
  orbitClusterList.innerHTML = orderedEvents.map((event) => {
    const config = getEventConfig(event.type);
    const notes = event.notes ? `<p>${escapeHtml(event.notes)}</p>` : "";

    return `
      <article class="cluster-card">
        <i class="cluster-icon ${config.arcType}">${config.icon}</i>
        <div>
          <strong>${escapeHtml(config.title)}</strong>
          <span>${escapeHtml(getOrbitEventSubline(event))}</span>
          ${notes}
        </div>
        <time>${escapeHtml(getOrbitEventRange(event))}</time>
      </article>
    `;
  }).join("");

  closeSheet();
  orbitClusterSheet.hidden = false;
  sheetBackdrop.hidden = false;
}

function closeOrbitCluster() {
  orbitClusterSheet.hidden = true;
  orbitClusterList.innerHTML = "";
  if (sheet.hidden) {
    sheetBackdrop.hidden = true;
  }
}

function getRoutineStartForToday(todayStart = getDayStart()) {
  const todayEvents = state.events.filter((event) => event.start >= todayStart);
  const candidates = [];
  if (Number.isFinite(state.routineStartedAt) && state.routineStartedAt >= todayStart) candidates.push(state.routineStartedAt);
  if (Number.isFinite(state.activeStartedAt) && state.activeStartedAt >= todayStart) candidates.push(state.activeStartedAt);
  todayEvents.forEach((event) => candidates.push(event.start));
  if (!candidates.length) return null;
  return Math.max(todayStart, Math.min(...candidates));
}

function getTodayMetrics() {
  const now = Date.now();
  const todayStart = getDayStart();
  const todaysEvents = state.events.filter((event) => event.start >= todayStart);
  const sleepMs = todaysEvents
    .filter(isSleepEvent)
    .reduce((total, event) => total + Math.max(0, event.end - event.start), 0);
  const activeSleepMs = state.mode === "sleeping" && Number.isFinite(state.activeStartedAt)
    ? Math.max(0, now - state.activeStartedAt)
    : 0;
  const routineStart = getRoutineStartForToday(todayStart);
  const awakeBase = routineStart ? Math.max(0, now - routineStart - sleepMs - activeSleepMs) : 0;
  const feedingCount = todaysEvents.filter((event) => event.type === "mamadeira" || event.type === "amamentacao").length;
  const diaperCount = todaysEvents.filter((event) => event.type === "fralda").length;
  const medicationCount = todaysEvents.filter((event) => event.type === "medicamento").length;
  const bottleMl = todaysEvents
    .filter((event) => event.type === "mamadeira")
    .reduce((total, event) => total + getAmountMlFromDetail(event.detail), 0);

  return {
    sleepMs: sleepMs + activeSleepMs,
    awakeMs: state.mode === "idle" ? 0 : awakeBase,
    feedingCount,
    diaperCount,
    medicationCount,
    bottleMl,
    todaysEvents,
  };
}

function renderDailyDrawer(metrics = getTodayMetrics()) {
  if (!dailyDrawer) return;
  const summaryValues = drawerSummaryGrid?.querySelectorAll("strong") || [];
  if (summaryValues.length >= 4) {
    setText(summaryValues[0], formatShortDuration(metrics.sleepMs));
    setText(summaryValues[1], formatShortDuration(metrics.awakeMs));
    setText(summaryValues[2], metrics.feedingCount);
    setText(summaryValues[3], metrics.diaperCount);
    if (summaryValues[4]) setText(summaryValues[4], metrics.medicationCount || 0);
  }

  if (drawerQuickStatus) {
    const pieces = [];
    if (metrics.sleepMs > 0) pieces.push(formatShortDuration(metrics.sleepMs));
    if (metrics.feedingCount > 0) pieces.push(`${metrics.feedingCount} mamada${metrics.feedingCount === 1 ? "" : "s"}`);
    if (metrics.diaperCount > 0) pieces.push(`${metrics.diaperCount} fralda${metrics.diaperCount === 1 ? "" : "s"}`);
    if ((metrics.medicationCount || 0) > 0) pieces.push(`${metrics.medicationCount} medicação${metrics.medicationCount === 1 ? "" : "ões"}`);
    setText(drawerQuickStatus, pieces.length ? pieces.join(" • ") : "Hoje zerado");
  }

  if (drawerLastEvents) {
    const latestEvents = [...metrics.todaysEvents].sort((a, b) => b.start - a.start).slice(0, 3);
    drawerLastEvents.innerHTML = latestEvents.length
      ? latestEvents.map((event) => {
          const config = getEventConfig(event.type);
          return `
            <article class="mini-event">
              <i class="mark ${config.arcType}">${config.icon}</i>
              <div>
                <strong>${escapeHtml(config.title)}</strong>
                <span>${escapeHtml(formatEventMeta(event))}</span>
              </div>
            </article>
          `;
        }).join("")
      : `<article class="mini-event empty">Nenhum registro ainda.</article>`;
  }

  if (drawerMiniChart) {
    const days = getReportDays(5);
    const maxValue = Math.max(...days.map((item) => item.events.length), 1);
    drawerMiniChart.innerHTML = days.map((item) => {
      const count = item.events.length;
      const height = Math.max(8, Math.round((count / maxValue) * 100));
      return `<span style="--h:${height}%"><b>${count}</b><i>${item.label}</i></span>`;
    }).join("");
  }
}

function renderSummary() {
  const metrics = getTodayMetrics();
  const summaryValues = document.querySelectorAll(".summary-grid strong");
  const nextCard = document.querySelector(".next-card strong");
  const nextHint = document.querySelector(".next-card p");
  const miniRing = document.querySelector(".mini-ring");

  if (summaryValues.length >= 4) {
    setText(summaryValues[0], formatShortDuration(metrics.sleepMs));
    setText(summaryValues[1], formatShortDuration(metrics.awakeMs));
    setText(summaryValues[2], metrics.feedingCount);
    setText(summaryValues[3], metrics.diaperCount);
    if (summaryValues[4]) setText(summaryValues[4], metrics.medicationCount || 0);
  }

  if (miniRing) {
    setText(miniRing, wakeWindowMinutes);
  }

  renderDailyDrawer(metrics);

  if (nextCard && nextHint) {
    if (state.mode === "idle") {
      setText(nextCard, "Aguardando");
      setText(nextHint, "Escolha como começar a rotina diária.");
      return;
    }

    const target = state.mode === "awake" ? state.activeStartedAt + wakeWindowMinutes * 60000 : Date.now() + wakeWindowMinutes * 60000;
    setText(nextCard, formatTime(target));
    setText(nextHint, state.mode === "awake"
      ? `Hora de preparar a soneca em ${formatShortDuration(target - Date.now())}.`
      : "Próxima janela calculada após acordar.");
  }
}

function getReportDays(length = 5) {
  const todayStart = getDayStart();
  return Array.from({ length }, (_, index) => {
    const start = todayStart - (length - 1 - index) * day;
    const end = start + day;
    const events = state.events.filter((event) => event.start >= start && event.start < end);
    const sleepEvents = events.filter(isSleepEvent);
    const sleepMs = sleepEvents.reduce((total, event) => total + Math.max(0, event.end - event.start), 0);
    const breastfeedingEvents = events.filter((event) => event.type === "amamentacao");
    const bottleEvents = events.filter((event) => event.type === "mamadeira");
    const diaperEvents = events.filter((event) => event.type === "fralda");
    const medicationEvents = events.filter((event) => event.type === "medicamento");
    const breastfeedingMs = breastfeedingEvents.reduce((total, event) => total + Math.max(0, event.end - event.start), 0);
    const bottleMl = bottleEvents.reduce((total, event) => total + getAmountMlFromDetail(event.detail), 0);

    return {
      start,
      label: getDayLabel(start),
      events,
      sleepEvents,
      sleepMs,
      breastfeedingEvents,
      breastfeedingMs,
      bottleEvents,
      bottleMl,
      diaperEvents,
      medicationEvents,
    };
  });
}

function renderBars(container, days, getValue, formatValue, options = {}) {
  if (!container) return;
  const minForNonZero = options.minForNonZero ?? 7;
  const maxValue = Math.max(...days.map(getValue), options.minMax ?? 1);
  container.innerHTML = "";
  days.forEach((item) => {
    const value = getValue(item);
    const height = value > 0 ? Math.max(minForNonZero, Math.round((value / maxValue) * 100)) : 0;
    const bar = document.createElement("span");
    bar.style.setProperty("--h", `${height}%`);
    bar.classList.toggle("is-empty", value <= 0);
    bar.innerHTML = `<b>${formatValue(value, item)}</b><i>${item.label}</i>`;
    container.append(bar);
  });
}

function renderSleepReport() {
  if (!sleepBars) return;
  const days = getReportDays(5);
  const totalSleep = days.reduce((total, item) => total + item.sleepMs, 0);
  const totalNaps = days.reduce((total, item) => total + item.sleepEvents.length, 0);
  const daysWithDataCount = days.filter((item) => item.sleepEvents.length > 0).length;
  const daysWithData = daysWithDataCount || 1;
  const sleepEvents = days.flatMap((item) => item.sleepEvents);
  const routineEvents = sleepEvents.filter((event) => {
    const duration = event.end - event.start;
    return duration >= 10 * 60000;
  });

  sleepAverage.textContent = formatShortDuration(totalSleep / daysWithData);
  sleepAverageHint.textContent = daysWithDataCount
    ? `Com base em ${daysWithDataCount} ${daysWithDataCount === 1 ? "dia" : "dias"} com registro.`
    : "Nenhum sono registrado no período.";
  napAverage.textContent = totalNaps ? (totalNaps / daysWithData).toFixed(1).replace(".", ",") : "0";
  napAverageHint.textContent = totalNaps
    ? `${totalNaps} registros de sono nos últimos 5 dias.`
    : "Nenhuma soneca registrada nos últimos 5 dias.";

  renderBars(sleepBars, days, (item) => item.sleepMs, (value) => value ? formatShortDuration(value) : "0", { minMax: 60 * 60000 });
  renderBars(
    breastfeedingBars,
    days,
    (item) => item.breastfeedingMs || item.breastfeedingEvents.length,
    (value, item) => item.breastfeedingMs ? formatShortDuration(item.breastfeedingMs) : String(value),
  );
  renderBars(bottleBars, days, (item) => item.bottleMl || item.bottleEvents.length, (value) => value ? `${Math.round(value)} ml` : "0");
  renderBars(diaperBars, days, (item) => item.diaperEvents.length, (value) => String(value));
  renderBars(medicationBars, days, (item) => item.medicationEvents.length, (value) => String(value));

  if (!routineEvents.length) {
    bestWindow.textContent = "Sem dados";
    bestWindowHint.textContent = "Registre sonecas para calcular a melhor janela.";
    routineStatus.textContent = "Aprendendo";
    routineHint.textContent = "O relatório será atualizado automaticamente com os últimos 5 dias.";
    return;
  }

  const startMinutes = routineEvents.map((event) => {
    const date = new Date(event.start);
    return date.getHours() * 60 + date.getMinutes();
  });
  const averageStart = startMinutes.reduce((total, value) => total + value, 0) / startMinutes.length;
  const averageDeviation = startMinutes.reduce((total, value) => total + Math.abs(value - averageStart), 0) / startMinutes.length;
  const commonWindowStart = Math.max(0, Math.round((averageStart - 15) / 5) * 5);
  const commonWindowEnd = Math.min(1439, commonWindowStart + 45);
  const formatMinutes = (minutes) => `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;

  bestWindow.textContent = `${formatMinutes(commonWindowStart)}-${formatMinutes(commonWindowEnd)}`;
  bestWindowHint.textContent = "Janela estimada pelos horários em que as sonecas começaram.";

  if (averageDeviation <= 35) {
    routineStatus.textContent = "Estável";
    routineHint.textContent = "As sonecas estão começando em horários bem parecidos.";
  } else if (averageDeviation <= 75) {
    routineStatus.textContent = "Em ajuste";
    routineHint.textContent = "Há alguma variação, mas já existe um padrão se formando.";
  } else {
    routineStatus.textContent = "Irregular";
    routineHint.textContent = "Os horários ainda variam bastante; mais registros ajudam a orientar.";
  }
}

function updateTheme() {
  const hourValue = new Date().getHours();
  const dayTheme = hourValue >= 6 && hourValue < 18;
  if (document.body.classList.contains("day-theme") !== dayTheme) {
    document.body.classList.toggle("day-theme", dayTheme);
  }
}

function renderAll() {
  updateTheme();
  renderBabyIdentity();
  renderWeightHistory();
  renderCurrentState();
  renderOrbit();
  renderTimeline();
  renderSummary();
  renderSleepReport();
}

function renderLiveTick() {
  updateTheme();

  if (state.mode === "idle" || !Number.isFinite(state.activeStartedAt)) return;

  setText(stateClock, formatDuration(Date.now() - state.activeStartedAt));

  const currentMinute = Math.floor(Date.now() / 60000);
  if (currentMinute === liveTickMinute) return;

  liveTickMinute = currentMinute;
  setText(stateHint, getWakeWindowText());
  renderSummary();
}

function finishSleep() {
  if (!requireLogin("salvar a rotina")) return;
  const finishedAt = Date.now();
  if (!Number.isFinite(state.routineStartedAt)) state.routineStartedAt = state.activeStartedAt;
  state.events.push(makeEvent(state.activeType || "sono", state.activeStartedAt, finishedAt, state.activeDetail || "Timer", state.activeNotes || ""));
  state.mode = "awake";
  state.activeStartedAt = finishedAt;
  state.activeType = "sono";
  state.activeDetail = "";
  state.activeNotes = "";
  saveDayState();
}

function startSleep() {
  if (!requireLogin("salvar a rotina")) return;
  const startedAt = Date.now();
  if (!Number.isFinite(state.routineStartedAt)) state.routineStartedAt = state.activeStartedAt || startedAt;
  const nightWakeActive = getActiveNightWakeEvent();
  closeActiveNightWake(startedAt);
  state.mode = "sleeping";
  state.activeStartedAt = startedAt;
  state.activeType = nightWakeActive ? "dormir" : "sono";
  state.activeDetail = nightWakeActive ? "Após despertar noturno" : "Timer";
  state.activeNotes = "";
  saveDayState();
}

function startRoutine(mode) {
  if (!requireLogin("salvar a rotina")) return;
  state.mode = mode === "sleeping" ? "sleeping" : "awake";
  state.activeStartedAt = Date.now();
  state.routineStartedAt = state.activeStartedAt;
  state.activeType = "sono";
  state.activeDetail = state.mode === "sleeping" ? "Timer" : "";
  state.activeNotes = "";
  saveDayState();
  renderAll();
}

function showScreen(target) {
  navButtons.forEach((item) => item.classList.toggle("active", item.dataset.target === target));
  screens.forEach((screen) => {
    screen.classList.toggle("active", screen.dataset.screen === target);
  });
  if (dailyDrawer) {
    dailyDrawer.classList.toggle("is-hidden", target !== "today");
    if (target !== "today") collapseDailyDrawer();
  }
}

function expandDailyDrawer() {
  if (!dailyDrawer || !dailyDrawerHandle) return;
  dailyDrawer.classList.add("expanded");
  dailyDrawerHandle.setAttribute("aria-expanded", "true");
}

function collapseDailyDrawer() {
  if (!dailyDrawer || !dailyDrawerHandle) return;
  dailyDrawer.classList.remove("expanded");
  dailyDrawerHandle.setAttribute("aria-expanded", "false");
}

function toggleDailyDrawer() {
  if (!dailyDrawer) return;
  if (dailyDrawer.classList.contains("expanded")) {
    collapseDailyDrawer();
  } else {
    expandDailyDrawer();
  }
}


function setDiaryFilter(filter) {
  currentDiaryFilter = filter;
  diaryFilterButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.diaryFilter === filter);
  });
  renderTimeline();
}

function setDiaryDate(value) {
  selectedDiaryDay = value ? getDayStart(new Date(`${value}T12:00:00`).getTime()) : getDayStart();
  renderTimeline();
}

function initDiaryDatePicker() {
  const today = getDayStart();
  const minDay = today - 4 * day;
  selectedDiaryDay = today;
  diaryDateInput.min = toDateInputValue(minDay);
  diaryDateInput.max = toDateInputValue(today);
  diaryDateInput.value = toDateInputValue(today);
}

function resetDayData() {
  if (!requireLogin("zerar a rotina")) return;
  state = createEmptyDayState();
  currentDiaryFilter = "all";
  selectedDiaryDay = getDayStart();
  diaryDateInput.value = toDateInputValue(selectedDiaryDay);
  diaryFilterButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.diaryFilter === "all");
  });
  closeSheet();
  showScreen("today");
  saveDayState();
  renderAll();
}

function updateWakeWindow(value, options = {}) {
  if (!options.skipLogin && !requireLogin("salvar a janela de despertar")) {
    wakeWindowInput.value = String(wakeWindowMinutes);
    return;
  }

  const nextValue = Math.min(240, Math.max(20, Number(value) || 70));
  wakeWindowMinutes = nextValue;
  wakeWindowInput.value = String(nextValue);
  wakeWindowValue.textContent = String(nextValue);
  if (!options.skipPersist) {
    markProfileLocallyChanged();
    localStorage.setItem(storageKeys.wakeWindow, String(nextValue));
  }
  renderSummary();
  if (!options.skipPersist) {
    scheduleProfileCloudSave();
  }
}

function setSyncStatus(status = "offline", email = "") {
  if (status.includes?.("@") && !email) {
    email = status;
    status = "online";
  }

  const online = status === "online";
  const loading = status === "loading";
  const error = status === "error";

  syncPill.textContent = online ? "Online" : loading ? "Conectando" : error ? "Erro" : "Off-line";
  syncPill.classList.toggle("online", online);
  syncPill.classList.toggle("offline", !online);
  syncStatusTitle.textContent = online ? "Sincronização ativa" : loading ? "Conectando" : error ? "Erro na sincronização" : "Sincronização off-line";
  syncStatusText.textContent = online
    ? `${email} está sincronizando a rotina familiar em tempo real.`
    : loading
      ? "Conectando ao Firebase..."
      : error
        ? "Não foi possível sincronizar. Verifique conexão, login ou regras do Firestore."
        : "Entre com e-mail e senha para ativar a sincronização entre aparelhos.";
}

function getLoginCredentials(actionText) {
  const email = loginEmail.value.trim();
  const password = loginPassword.value.trim();
  if (!email) {
    loginEmail.focus();
    loginHelper.textContent = `Digite o e-mail para ${actionText}.`;
    return null;
  }
  if (!password) {
    loginPassword.focus();
    loginHelper.textContent = `Digite a senha para ${actionText}.`;
    return null;
  }
  return { email, password };
}

function getEventById(eventId) {
  return state.events.find((event) => event.id === eventId);
}

function setSheetType(type) {
  currentSheetType = type;
  const config = getEventConfig(type);
  sheetTitle.textContent = currentEditingEventId ? `Editar ${config.title}` : config.title;
  sheetDetailLabel.textContent = config.label;
  sheetAmountField.hidden = !config.amount;
  if (breastTimerPanel) breastTimerPanel.hidden = type !== "amamentacao";
  if (sheetNotesInput) sheetNotesInput.placeholder = config.notesPlaceholder || "Observações sobre este registro";
  sheetDetail.innerHTML = "";
  config.options.forEach((optionText) => {
    const option = document.createElement("option");
    option.textContent = optionText;
    sheetDetail.append(option);
  });
  sheetTypeButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.sheetType === type);
  });
  if (config.amount && !currentEditingEventId && !sheetAmountInput.value) {
    updateBottleAmount(105);
  }
  if (type === "amamentacao") {
    renderBreastTimer();
  }
}

function resetSheetState() {
  currentEditingEventId = null;
  saveButton.textContent = "Registrar";
  updateBottleAmount(105);
  sheetNotesInput.value = "";
  resetBreastTimer();
}

function hydrateSheetFromEvent(event) {
  const config = getEventConfig(event.type);
  sheetDateInput.value = toDateTimeInputValue(event.start);
  sheetNotesInput.value = event.notes || "";
  updateBottleAmount(105);
  resetBreastTimer();

  if (config.amount) {
    updateBottleAmount(getAmountMlFromDetail(event.detail) || 105);
    return;
  }

  if ([...sheetDetail.options].some((option) => option.value === event.detail || option.textContent === event.detail)) {
    sheetDetail.value = event.detail;
  }
}

function openSheet(type = "sono", eventId = null) {
  const editingEvent = eventId ? getEventById(eventId) : null;
  if (!requireLogin(editingEvent ? "editar registros" : "criar registros")) return;

  closeOrbitCluster();
  currentEditingEventId = editingEvent?.id || null;
  setSheetType(editingEvent?.type || type);
  saveButton.textContent = editingEvent ? "Salvar alterações" : "Registrar";
  sheetDateInput.value = toDateTimeInputValue();
  updateBottleAmount(105);
  sheetNotesInput.value = "";
  resetBreastTimer();

  if (editingEvent) {
    hydrateSheetFromEvent(editingEvent);
  }

  sheet.hidden = false;
  sheetBackdrop.hidden = false;
}

function closeSheet() {
  sheet.hidden = true;
  if (orbitClusterSheet.hidden) {
    sheetBackdrop.hidden = true;
  }
  resetSheetState();
}

function shouldStartLiveSleepFromManualEvent(type, start, existingEvent) {
  if (existingEvent || !isSleepType(type) || state.mode === "sleeping") return false;

  const now = Date.now();
  const sameDay = getDayStart(start) === getDayStart(now);
  const notFuture = start <= now + 2 * 60000;
  if (!sameDay || !notFuture) return false;

  if (state.mode === "awake" && Number.isFinite(state.activeStartedAt)) {
    return start >= state.activeStartedAt - 5 * 60000;
  }

  return state.mode === "idle";
}

function canUseManualTimeForLiveState(start) {
  const now = Date.now();
  const sameDay = getDayStart(start) === getDayStart(now);
  const notFuture = start <= now + 2 * 60000;
  return sameDay && notFuture;
}

function shouldStartLiveAwakeFromManualNightWake(type, start, existingEvent) {
  if (existingEvent || type !== "despertar-noturno") return false;
  if (!canUseManualTimeForLiveState(start)) return false;

  if (state.mode === "sleeping" && Number.isFinite(state.activeStartedAt)) {
    return start >= state.activeStartedAt - 5 * 60000;
  }

  if (state.mode === "awake" && Number.isFinite(state.activeStartedAt)) {
    return start >= state.activeStartedAt - 5 * 60000;
  }

  return state.mode === "idle";
}

function getActiveNightWakeEvent() {
  if (state.mode !== "awake" || !Number.isFinite(state.activeStartedAt)) return null;

  return [...state.events]
    .reverse()
    .find((event) => (
      event.type === "despertar-noturno" &&
      Math.abs(event.start - state.activeStartedAt) < 60000 &&
      event.end <= event.start
    )) || null;
}

function closeActiveNightWake(end = Date.now()) {
  const activeNightWake = getActiveNightWakeEvent();
  if (!activeNightWake || end < activeNightWake.start) return;

  activeNightWake.end = end;
}

function startLiveAwakeFromManualNightWake(start, detail, notes) {
  if (state.mode === "sleeping" && Number.isFinite(state.activeStartedAt)) {
    const sleepStart = state.activeStartedAt;
    const sleepEnd = Math.max(start, sleepStart);
    if (sleepEnd > sleepStart) {
      state.events.push(makeEvent(state.activeType || "sono", sleepStart, sleepEnd, state.activeDetail || "Timer", state.activeNotes || ""));
    }
  }

  state.events.push(makeEvent("despertar-noturno", start, start, detail, notes));
  state.mode = "awake";
  state.activeStartedAt = start;
  if (!Number.isFinite(state.routineStartedAt)) state.routineStartedAt = start;
  state.activeType = "sono";
  state.activeDetail = "";
  state.activeNotes = "";
}

function startLiveSleepFromManualEvent(type, start, detail, notes) {
  closeActiveNightWake(start);
  state.mode = "sleeping";
  state.activeStartedAt = start;
  if (!Number.isFinite(state.routineStartedAt)) state.routineStartedAt = start;
  state.activeType = isSleepType(type) ? type : "sono";
  state.activeDetail = detail || "Timer";
  state.activeNotes = notes || "";
}

function saveManualEvent() {
  if (!requireLogin("salvar registros")) return;
  const start = sheetDateInput.value ? new Date(sheetDateInput.value).getTime() : Date.now();
  const notes = sheetNotesInput.value.trim();
  commitBreastTimer();
  const breastTotalMs = currentSheetType === "amamentacao" ? getBreastTimerTotalMs() : 0;
  const breastDetail = currentSheetType === "amamentacao" ? getBreastTimerDetail() : "";
  const detail = typeConfig[currentSheetType].amount && sheetAmountInput.value
    ? `${sheetAmountInput.value} ml`
    : breastDetail || sheetDetail.value;
  const existingEvent = currentEditingEventId ? getEventById(currentEditingEventId) : null;
  const startsLiveSleep = shouldStartLiveSleepFromManualEvent(currentSheetType, start, existingEvent);
  const startsLiveAwake = shouldStartLiveAwakeFromManualNightWake(currentSheetType, start, existingEvent);

  if (existingEvent) {
    const duration = breastTotalMs || Math.max(0, existingEvent.end - existingEvent.start);
    Object.assign(existingEvent, {
      type: currentSheetType,
      start,
      end: duration ? start + duration : start,
      detail,
      notes,
    });
  } else if (startsLiveAwake) {
    startLiveAwakeFromManualNightWake(start, detail, notes);
  } else if (startsLiveSleep) {
    startLiveSleepFromManualEvent(currentSheetType, start, detail, notes);
  } else {
    state.events.push(makeEvent(currentSheetType, start, breastTotalMs ? start + breastTotalMs : start, detail, notes));
  }

  updateBottleAmount(105);
  sheetNotesInput.value = "";
  resetBreastTimer();
  closeSheet();
  saveDayState();
  renderAll();
}

function editEvent(eventId) {
  const event = getEventById(eventId);
  if (!event) return;
  openSheet(event.type, event.id);
}

function deleteEvent(eventId) {
  if (!requireLogin("excluir registros")) return;
  const event = getEventById(eventId);
  if (!event) return;
  if (!window.confirm(`Excluir ${getEventConfig(event.type).title.toLowerCase()} das ${formatTime(event.start)}?`)) return;

  state.events = state.events.filter((item) => item.id !== eventId);
  saveDayState();
  renderAll();
}

function getExportEvents() {
  return [...state.events]
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
    }));
}

function getExportPayload() {
  return {
    app: "Ninou",
    exportedAt: new Date().toISOString(),
    exportedBy: cloudUser?.email || "",
    day: getCurrentDayId(),
    profile: normalizeBabyProfile(babyProfile),
    wakeWindowMinutes,
    state: normalizeDayState(state),
    events: getExportEvents(),
  };
}

function downloadFile(filename, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function escapeCsv(value) {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function exportRoutine(format) {
  if (!requireLogin("exportar a rotina")) return;
  const payload = getExportPayload();
  const filenameBase = `ninou-${payload.day}`;

  if (format === "csv") {
    const header = ["id", "tipo", "titulo", "inicio", "fim", "duracao_min", "detalhe", "observacoes"];
    const rows = payload.events.map((event) => [
      event.id,
      event.type,
      event.title,
      event.start,
      event.end,
      event.durationMinutes,
      event.detail,
      event.notes,
    ]);
    const csv = [header, ...rows].map((row) => row.map(escapeCsv).join(",")).join("\n");
    downloadFile(`${filenameBase}.csv`, csv, "text/csv;charset=utf-8");
    return;
  }

  downloadFile(`${filenameBase}.json`, JSON.stringify(payload, null, 2), "application/json;charset=utf-8");
}

function updateProfilePhoto(dataUrl) {
  profileImages.forEach((image) => {
    image.src = dataUrl;
  });
}

function resizeImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const image = new Image();
      image.onerror = reject;
      image.onload = () => {
        const size = 320;
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        const scale = Math.max(size / image.width, size / image.height);
        const width = image.width * scale;
        const height = image.height * scale;
        canvas.width = size;
        canvas.height = size;
        context.drawImage(image, (size - width) / 2, (size - height) / 2, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      };
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

if (dailyDrawerHandle) {
  dailyDrawerHandle.addEventListener("click", toggleDailyDrawer);
  dailyDrawerHandle.addEventListener("pointerdown", (event) => {
    drawerDragStartY = event.clientY;
  });
  dailyDrawerHandle.addEventListener("pointerup", (event) => {
    if (drawerDragStartY === null) return;
    const delta = event.clientY - drawerDragStartY;
    drawerDragStartY = null;
    if (delta < -24) expandDailyDrawer();
    if (delta > 24) collapseDailyDrawer();
  });
}

navButtons.forEach((button) => {
  button.addEventListener("click", () => showScreen(button.dataset.target));
});

syncPill.addEventListener("click", () => showScreen("profile"));

shortcutButtons.forEach((button) => {
  button.addEventListener("click", () => showScreen(button.dataset.targetShortcut));
});

diaryFilterButtons.forEach((button) => {
  button.addEventListener("click", () => setDiaryFilter(button.dataset.diaryFilter));
});

diaryDateInput.addEventListener("change", () => setDiaryDate(diaryDateInput.value));

timeline.addEventListener("click", (event) => {
  const editButton = event.target.closest("[data-event-edit]");
  const deleteButton = event.target.closest("[data-event-delete]");

  if (editButton) {
    editEvent(editButton.dataset.eventEdit);
  }

  if (deleteButton) {
    deleteEvent(deleteButton.dataset.eventDelete);
  }
});

startModeButtons.forEach((button) => {
  button.addEventListener("click", () => startRoutine(button.dataset.startMode));
});

wakeAction.addEventListener("click", () => {
  if (state.mode === "idle") return;
  if (state.mode === "sleeping") {
    finishSleep();
  } else {
    startSleep();
  }
  renderAll();
});

openSheetButtons.forEach((button) => {
  button.addEventListener("click", () => openSheet(button.dataset.openSheet));
});

sheetTypeButtons.forEach((button) => {
  button.addEventListener("click", () => setSheetType(button.dataset.sheetType));
});

if (bottleAmountRange) {
  bottleAmountRange.addEventListener("input", () => updateBottleAmount(bottleAmountRange.value));
}

if (sheetAmountInput) {
  sheetAmountInput.addEventListener("input", () => updateBottleAmount(sheetAmountInput.value));
}

breastSideButtons.forEach((button) => {
  button.addEventListener("click", () => toggleBreastTimer(button.dataset.breastSide));
});

if (resetBreastTimerButton) {
  resetBreastTimerButton.addEventListener("click", resetBreastTimer);
}

breastTimerInterval = window.setInterval(() => {
  if (!sheet.hidden && currentSheetType === "amamentacao") renderBreastTimer();
}, 1000);

closeSheetButton.addEventListener("click", closeSheet);
closeOrbitClusterButton.addEventListener("click", closeOrbitCluster);
sheetBackdrop.addEventListener("click", () => {
  closeSheet();
  closeOrbitCluster();
});
saveButton.addEventListener("click", saveManualEvent);
resetDataButton.addEventListener("click", resetDayData);
exportJsonButton.addEventListener("click", () => exportRoutine("json"));
exportCsvButton.addEventListener("click", () => exportRoutine("csv"));

wakeWindowInput.addEventListener("input", () => {
  if (!isLoggedIn()) return;
  const nextValue = Number(wakeWindowInput.value);
  if (nextValue >= 20 && nextValue <= 240) {
    wakeWindowMinutes = nextValue;
    wakeWindowValue.textContent = String(nextValue);
    renderSummary();
  }
});
wakeWindowInput.addEventListener("change", () => updateWakeWindow(wakeWindowInput.value));

babyNameInput.addEventListener("input", () => {
  updateBabyProfile({ name: babyNameInput.value.trim() });
});

babyArticleInput.addEventListener("change", () => {
  updateBabyProfile({ article: babyArticleInput.value === "da" ? "da" : "do" });
});

babyBirthInput.addEventListener("change", () => {
  updateBabyProfile({ birthDate: babyBirthInput.value });
});

if (saveBabyWeightButton) {
  saveBabyWeightButton.addEventListener("click", saveBabyWeight);
}

if (weightHistoryList) {
  weightHistoryList.addEventListener("click", (event) => {
    const editButton = event.target.closest("[data-weight-edit]");
    const deleteButton = event.target.closest("[data-weight-delete]");
    if (editButton) editBabyWeight(editButton.dataset.weightEdit);
    if (deleteButton) deleteBabyWeight(deleteButton.dataset.weightDelete);
  });
}

profilePhotoInput.addEventListener("change", async () => {
  if (!requireLogin("salvar a foto")) {
    profilePhotoInput.value = "";
    return;
  }

  const file = profilePhotoInput.files?.[0];
  if (!file) return;
  const dataUrl = await resizeImage(file);
  currentProfilePhoto = dataUrl;
  markProfileLocallyChanged();
  updateProfilePhoto(dataUrl);
  try {
    localStorage.setItem(storageKeys.photo, dataUrl);
  } catch {
    // A foto continua visível mesmo se o navegador não permitir salvar localmente.
  }
  scheduleProfileCloudSave({ includePhoto: true });
});

loginButton.addEventListener("click", signInAccount);
createAccountButton.addEventListener("click", createAccount);

if (currentProfilePhoto) updateProfilePhoto(currentProfilePhoto);

const savedEmail = localStorage.getItem(storageKeys.email);
if (savedEmail) {
  loginEmail.value = savedEmail;
  setSyncStatus("loading", savedEmail);
} else {
  setSyncStatus("offline");
}

initDiaryDatePicker();
syncBabyProfileForm();
resetWeightForm();
renderWeightHistory();
updateWakeWindow(wakeWindowMinutes, { skipLogin: true, skipPersist: true });
preloadActionIcons();
renderAll();
setInterval(renderLiveTick, 1000);

initFirebaseAuthState().catch((error) => {
  console.error("Firebase não iniciou:", error);
  setSyncStatus("error");
  loginHelper.textContent = "Não foi possível iniciar a sincronização.";
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").then((registration) => {
      registration.update().catch(() => {});
    }).catch((error) => {
      console.warn("Service worker não registrado:", error);
    });
  });
}