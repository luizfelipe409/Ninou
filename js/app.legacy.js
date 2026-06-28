import { storageKeys, hour, day } from "./config/constants.js";
import { countBreastfeedingEvents, countFeedingEvents, createBreastTimerState, formatBreastTimer as formatBreastTimerValue, getBreastTimerDetail as buildBreastTimerDetail, getBreastTimerSnapshot as buildBreastTimerSnapshot, normalizeBottleAmount, parseAmountMl, resetBreastTimerState, startBreastTimerSide, stopBreastTimerState, sumBottleAmountMl } from "./domain/feeding.js";
import { countDiaperEvents } from "./domain/diaper.js";
import { countMedicationEvents } from "./domain/medication.js";
import { canUseManualTimeForLiveState as canUseManualLiveTime, closeActiveNightWake as closeActiveNightWakeInState, finishActiveSleep, getActiveNightWakeEvent as findActiveNightWakeEvent, getAwakeMsForRange as calculateAwakeMsForRange, getLiveElapsedMs, getOverlapDuration as calculateOverlapDuration, getRoutineStartForRange as calculateRoutineStartForRange, getSleepMsForRange as calculateSleepMsForRange, startLiveAwakeFromManualNightWake as startLiveAwakeFromManualNightWakeInState, startLiveSleepFromManualEvent as startLiveSleepFromManualEventInState, startRoutineTimer, startSleepTimer, shouldStartLiveAwakeFromManualNightWake as shouldStartLiveAwakeDecision, shouldStartLiveSleepFromManualEvent as shouldStartLiveSleepDecision } from "./domain/sleep.js";
import { getActiveTimerDetails as buildActiveTimerDetails, getWakeWindowText as buildWakeWindowText } from "./services/timer-service.js";
import { setText, setHidden } from "./dom/dom.js";
import { getEventConfig, iconMarkup, isSleepEvent, preloadActionIcons, typeConfig } from "./domain/record-types.js";
import { escapeHtml, pluralize } from "./utils/text.js";
import { formatDiaryDate, formatDuration, formatShortDuration, formatTime, getDayLabel, getDayStart, parseLocalDate, toDateInputValue, toDateTimeInputValue } from "./utils/time.js";
import { getFirebaseServices as loadFirebaseServices, getFirebaseErrorMessage as resolveFirebaseErrorMessage } from "./services/firebase-service.js";
import { getDefaultBabyProfile as createDefaultBabyProfile, getCloudProfileVersion as readCloudProfileVersion, hasProfileContent as profileHasContent, loadBabyProfile as loadStoredBabyProfile, normalizeBabyProfile as normalizeStoredBabyProfile, saveBabyProfile as persistBabyProfile } from "./domain/baby-profile.js";
import { loadLocalWeights as loadStoredWeights, normalizeWeights as normalizeStoredWeights, persistLocalWeights as persistStoredWeights, removeWeightById, upsertWeight } from "./domain/weights.js";
import { buildExportEvents } from "./services/export-service.js";
import { createEmptyDayState as createEmptyRoutineDayState, findEventById, getEventsForDay, getLatestEvent, makeEvent as createRoutineEvent, matchesDiaryFilter as recordMatchesDiaryFilter, normalizeDayState as normalizeRoutineDayState, normalizeEvent as normalizeRoutineEvent, removeEventById, sortEventsByStartDesc, updateEventKeepingDuration } from "./domain/records.js";
import { formatEventMeta as formatRoutineEventMeta, getEventCardMarkup, getEventRenderSignature as buildEventRenderSignature, getMiniEventMarkup, getTimelineRenderSignature as buildTimelineSignature } from "./ui/event-formatters.js";
import { renderHomeSummary as renderHomeSummaryPanel, renderTodayLastEvents as renderTodayLastEventsPanel } from "./ui/home.js";
import { renderDailyRhythm, renderDayStory, renderIntelligentTimeline, renderLiveAssistant, renderSmartInsight, renderTrendKpis, renderWeeklyOverview } from "./ui/intelligence.js";
import { formatNumber as formatChartNumber, getReportDays as buildReportDays, getSleepReportDays as buildSleepReportDays, renderBarChart as renderSharedBarChart, renderTodayMiniChart as renderTodayMiniChartPanel } from "./ui/charts.js";
import { applyRecordSheetType as renderRecordSheetType, closeRecordSheet as closeRecordSheetPanel, getRecordSheetDetailValue as resolveRecordSheetDetailValue, hydrateRecordSheetFromEvent as hydrateRecordSheetFromEventPanel, prepareRecordSheetForOpen, resetRecordSheet, isTypeWithManualEnd } from "./ui/record-sheet.js";
import { buildDeleteConfirmationText, buildManualEventPayload, clearRecordFormAfterSave } from "./domain/event-editor.js";
import { bindShortcutNavigation } from "./ui/navigation.js";
import { bindBottomNavigation, bindSyncPillNavigation, createHorizontalScrollToggle, updateScreenVisibility } from "./ui/app-navigation.js";
import { createEmptyTimelineItem, getLatestEmptyRecordMarkup } from "./ui/empty-states.js";
import { setHtml } from "./ui/render-utils.js";
import { applyProfilePhotoToImages, clearWeightForm, getBabyAgeTextFromProfile, getBabyNameFromProfile, getBabyReferenceFromProfile, getDiaryTitleFromProfile, hydrateWeightForm, readWeightFormValue, renderBabyIdentityPanel, renderWeightProfilePanel, resizeProfileImage, syncBabyProfileFormPanel } from "./ui/profile.js";
import { readThemeModeInput, updateThemeBody } from "./ui/theme.js";
import { initSleepSounds as initSleepSoundsPanel } from "./ui/sounds.js";

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
const activeTimerCard = document.querySelector("#activeTimerCard");
const activeTimerIcon = document.querySelector("#activeTimerIcon");
const activeTimerKicker = document.querySelector("#activeTimerKicker");
const activeTimerTitle = document.querySelector("#activeTimerTitle");
const activeTimerElapsed = document.querySelector("#activeTimerElapsed");
const activeTimerProgress = document.querySelector("#activeTimerProgress");
const activeTimerMeta = document.querySelector("#activeTimerMeta");
const activeTimerAction = document.querySelector("#activeTimerAction");
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
const sheetStartLabel = document.querySelector("#sheetStartLabel");
const sheetDateInput = document.querySelector("#sheetStartTimeInput") || document.querySelector('.record-form input[type="datetime-local"]');
const sheetEndTimeField = document.querySelector("#sheetEndTimeField");
const sheetEndLabel = document.querySelector("#sheetEndLabel");
const sheetEndTimeInput = document.querySelector("#sheetEndTimeInput");
const sleepDurationPreview = document.querySelector("#sleepDurationPreview");
const sheetAmountInput = sheetAmountField.querySelector("input");
const sheetNotesInput = document.querySelector(".record-form textarea");
const shortcutButtons = document.querySelectorAll("[data-target-shortcut]");
const diaryFilterButtons = document.querySelectorAll("[data-diary-filter]");
const diaryChips = document.querySelector('.screen[data-screen="diary"] .chips');
const diaryChipsMoreButton = document.querySelector("#diaryChipsMoreButton");
const diaryFilterScroller = createHorizontalScrollToggle({
  scroller: diaryChips,
  button: diaryChipsMoreButton,
  forwardLabel: "Mostrar mais filtros",
  backLabel: "Voltar filtros",
});
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
const todayLastEvents = document.querySelector("#todayLastEvents");
const todayMiniChart = document.querySelector("#todayMiniChart");
const smartInsightCard = document.querySelector("#smartInsightCard");
const liveAssistantCard = document.querySelector("#liveAssistantCard");
const routineProgressStatus = document.querySelector("#routineProgressStatus");
const dailyRhythm = document.querySelector("#dailyRhythm");
const intelligentTimeline = document.querySelector("#intelligentTimeline");
const weeklyOverview = document.querySelector("#weeklyOverview");
const dayStoryText = document.querySelector("#dayStoryText");
const trendKpis = document.querySelector("#trendKpis");
const bottleAmountRange = document.querySelector("#bottleAmountRange");
const bottleAmountDisplay = document.querySelector("#bottleAmountDisplay");
const breastTimerPanel = document.querySelector("#breastTimerPanel");
const breastTimerTotal = document.querySelector("#breastTimerTotal");
const leftBreastTimer = document.querySelector("#leftBreastTimer");
const rightBreastTimer = document.querySelector("#rightBreastTimer");
const resetBreastTimerButton = document.querySelector("#resetBreastTimerButton");
const breastSideButtons = document.querySelectorAll("[data-breast-side]");
const themeModeInput = document.querySelector("#themeModeInput");
const babyWeightDateInput = document.querySelector("#babyWeightDateInput");
const babyWeightInput = document.querySelector("#babyWeightInput");
const saveBabyWeightButton = document.querySelector("#saveBabyWeightButton");
const lastWeightValue = document.querySelector("#lastWeightValue");
const lastWeightHint = document.querySelector("#lastWeightHint");
const weightHistoryList = document.querySelector("#weightHistoryList");

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
let breastTimerState = createBreastTimerState();
let state = loadLocalDayState();

function createEmptyDayState() {
  return createEmptyRoutineDayState();
}

function getWakeWindowForSleepStart(sleepStart, excludeEventId = null) {
  const start = Number(sleepStart);
  if (!Number.isFinite(start)) return null;

  const candidates = [];
  (state.events || []).forEach((event) => {
    if (!event || event.id === excludeEventId) return;
    if (event.type === "acordou") {
      const wakeAt = Number(event.start);
      if (Number.isFinite(wakeAt) && wakeAt < start) candidates.push(wakeAt);
      return;
    }
    if (event.type === "despertar-noturno") {
      const wakeAt = Number(event.start);
      if (Number.isFinite(wakeAt) && wakeAt < start) candidates.push(wakeAt);
      return;
    }
    if (isSleepEvent(event) && Number(event.end) > Number(event.start) && Number(event.end) < start) {
      candidates.push(Number(event.end));
    }
  });

  if (state.mode === "awake" && Number.isFinite(Number(state.activeStartedAt)) && Number(state.activeStartedAt) < start) {
    candidates.push(Number(state.activeStartedAt));
  }

  if (!candidates.length) return null;
  const wakeWindowStartedAt = Math.max(...candidates);
  const wakeWindowMs = start - wakeWindowStartedAt;
  if (!Number.isFinite(wakeWindowMs) || wakeWindowMs <= 0 || wakeWindowMs > 18 * hour) return null;
  return { wakeWindowStartedAt, wakeWindowMs };
}

function applyWakeWindowMetadata(event, excludeEventId = null) {
  if (!event || !isSleepEvent(event)) return event;

  const fromActiveState = Number(state.lastWakeWindowMs) > 0 && Math.abs(Number(event.start) - Number(state.activeStartedAt)) < 60000
    ? {
        wakeWindowStartedAt: Number(state.lastWakeWindowStartedAt),
        wakeWindowMs: Number(state.lastWakeWindowMs),
      }
    : null;
  const computed = fromActiveState && Number.isFinite(fromActiveState.wakeWindowStartedAt)
    ? fromActiveState
    : getWakeWindowForSleepStart(event.start, excludeEventId);

  if (computed && computed.wakeWindowMs > 0) {
    event.wakeWindowStartedAt = computed.wakeWindowStartedAt;
    event.wakeWindowMs = computed.wakeWindowMs;
  } else {
    delete event.wakeWindowStartedAt;
    delete event.wakeWindowMs;
  }
  return event;
}

function makeEvent(type, start, end = start, detail = "", notes = "") {
  return applyWakeWindowMetadata(createRoutineEvent(type, start, end, detail, notes));
}

function normalizeEvent(event = {}) {
  return normalizeRoutineEvent(event);
}

function normalizeDayState(dayState = {}) {
  return normalizeRoutineDayState(dayState);
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
  setSyncStatus("offline");
  if (loginHelper) {
    loginHelper.textContent = `Dados salvos neste aparelho. Entre com e-mail e senha para sincronizar ${actionText} entre celulares.`;
  }
  return true;
}

function saveDayState() {
  saveLocalDayState();
  scheduleDayCloudSave();
}

function formatEventMeta(event) {
  return formatRoutineEventMeta(event);
}

function addAwakeEvent(start = Date.now(), detail = "Acordou", notes = "") {
  state.events = Array.isArray(state.events) ? state.events : [];
  const alreadyExists = state.events.some((event) => (
    event.type === "acordou" && Math.abs(Number(event.start) - Number(start)) < 60000
  ));
  if (alreadyExists) return null;
  const wakeEvent = makeEvent("acordou", start, start, detail || "Acordou", notes || "");
  state.events.push(wakeEvent);
  return wakeEvent;
}


function normalizeWeights(weights = []) {
  return normalizeStoredWeights(weights);
}


function loadLocalWeights() {
  return loadStoredWeights();
}


function persistLocalWeights(weights) {
  persistStoredWeights(weights);
}


function getDefaultBabyProfile() {
  return createDefaultBabyProfile();
}


function normalizeBabyProfile(profile = {}) {
  return normalizeStoredBabyProfile(profile);
}


function loadBabyProfile() {
  return loadStoredBabyProfile();
}


function saveBabyProfile() {
  babyProfile = persistBabyProfile(babyProfile, { profileClientUpdatedAt });
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
  return readCloudProfileVersion(data);
}


function hasProfileContent(profile = babyProfile, photo = currentProfilePhoto, windowMinutes = wakeWindowMinutes) {
  return profileHasContent(profile, photo, windowMinutes);
}


function hasCloudProfileContent(data = {}) {
  const profileSource = data.babyProfile && typeof data.babyProfile === "object" ? data.babyProfile : data;
  const photoValue = data.photo || data.photoDataUrl || "";
  const cloudWakeWindow = Number.isFinite(Number(data.wakeWindowMinutes)) ? Number(data.wakeWindowMinutes) : 70;
  return hasProfileContent(profileSource, photoValue, cloudWakeWindow);
}

function getBabyName() {
  return getBabyNameFromProfile(babyProfile);
}

function getBabyReference() {
  return getBabyReferenceFromProfile(babyProfile);
}

function getDiaryTitle() {
  return getDiaryTitleFromProfile(babyProfile);
}

function getBabyAgeText() {
  return getBabyAgeTextFromProfile(babyProfile);
}

function renderBabyIdentity() {
  renderBabyIdentityPanel(babyProfile, {
    diaryTitle,
    babyAgeLine,
    profileBabyName,
    profileBabyAge,
  });
}

function syncBabyProfileForm() {
  syncBabyProfileFormPanel(babyProfile, {
    babyNameInput,
    babyArticleInput,
    babyBirthInput,
    themeModeInput,
  }, {
    renderWeightProfile,
  });
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
  renderCurrentState();
  scheduleProfileCloudSave();
}

async function getFirebaseServices() {
  firebaseServices = await loadFirebaseServices();
  return firebaseServices;
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
  // Local-first: desconectar ou abrir o app sem login não pode apagar rotina, perfil, foto ou pesos.
  // A limpeza completa do dia continua disponível apenas no botão "Zerar dia".
  localStorage.removeItem(storageKeys.email);
  cloudUser = null;
  pendingProfilePhotoSave = false;
  if (loginPassword) loginPassword.value = "";
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
  return resolveFirebaseErrorMessage(error);
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

function matchesDiaryFilter(event) {
  return recordMatchesDiaryFilter(event, currentDiaryFilter);
}

function getWakeWindowText() {
  return buildWakeWindowText({ state, formatShortDuration, formatTimeLabel: formatTime });
}

function setWakeActionIcon() {
  const nightWakeActive = state.mode !== "sleeping" && getActiveNightWakeEvent();
  const iconKey = state.mode === "sleeping" ? "acordou" : nightWakeActive ? "dormir" : "sono";
  if (wakeActionIcon.dataset.iconKey === iconKey) return;

  wakeActionIcon.dataset.iconKey = iconKey;
  wakeActionIcon.innerHTML = iconMarkup(iconKey);
}

function getActiveTimerDetails() {
  return buildActiveTimerDetails({ state, wakeWindowMinutes, typeConfig, formatTimeLabel: formatTime });
}

function renderActiveTimerCard() {
  if (!activeTimerCard) return;

  const details = getActiveTimerDetails();
  if (!details) {
    setHidden(activeTimerCard, true);
    return;
  }

  setHidden(activeTimerCard, false);
  if (activeTimerIcon && activeTimerIcon.dataset.iconKey !== details.iconKey) {
    activeTimerIcon.dataset.iconKey = details.iconKey;
    activeTimerIcon.innerHTML = iconMarkup(details.iconKey);
  }
  setText(activeTimerKicker, details.kicker);
  setText(activeTimerTitle, details.title);
  setText(activeTimerElapsed, formatDuration(details.elapsed));
  setText(activeTimerMeta, details.meta);
  setText(activeTimerAction, details.actionLabel);
  if (activeTimerProgress) activeTimerProgress.style.width = `${details.progress}%`;
}

function runActiveTimerAction() {
  if (state.mode === "idle") return;
  if (state.mode === "sleeping") {
    finishSleep();
  } else {
    startSleep();
  }
  renderAll();
}

function renderCurrentState() {
  if (state.mode === "idle") {
    setHidden(wakeAction, true);
    setHidden(startChoice, false);
    setText(stateLabel, "Rotina zerada");
    setText(stateClock, "00:00:00");
    setText(stateHint, `Escolha se ${getBabyReference()} acordou ou iniciou uma soneca.`);
    renderActiveTimerCard();
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
  renderActiveTimerCard();
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
  return buildEventRenderSignature(event, options);
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
  return buildTimelineSignature(selectedStart, selectedEnd, currentDiaryFilter, visibleEvents, latest);
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
  if (!timeline) return;

  const selectedStart = selectedDiaryDay ?? getDayStart();
  const selectedEnd = selectedStart + day;
  const orderedEvents = sortEventsByStartDesc(state.events);
  const dayEvents = getEventsForDay(orderedEvents, selectedStart, day);
  const visibleEvents = dayEvents.filter(matchesDiaryFilter);
  const latest = getLatestEvent(state.events);
  const nextSignature = getTimelineRenderSignature(selectedStart, selectedEnd, visibleEvents, latest);
  if (nextSignature === timelineRenderSignature) return;

  timelineRenderSignature = nextSignature;
  timeline.innerHTML = "";
  diaryDateTitle.textContent = formatDiaryDate(selectedStart);
  diaryDateHint.textContent = selectedStart === getDayStart() ? "Hoje" : "Data selecionada";

  if (!visibleEvents.length) {
    timeline.append(createEmptyTimelineItem(getEventCardMarkup(null, { empty: true })));
  }

  visibleEvents.slice(0, 8).forEach((event) => {
    const item = document.createElement("li");
    item.className = "event-card";
    item.innerHTML = getEventCardMarkup(event);
    timeline.append(item);
  });

  if (!latest) {
    setHtml(lastCard, getLatestEmptyRecordMarkup());
    return;
  }
  if (lastCard) {
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

function getOverlapDuration(start, end, windowStart, windowEnd) {
  return calculateOverlapDuration(start, end, windowStart, windowEnd);
}

function getSleepMsForRange(windowStart, windowEnd) {
  return calculateSleepMsForRange(state.events, state, windowStart, windowEnd, isSleepEvent);
}

function getRoutineStartForRange(windowStart, windowEnd) {
  return calculateRoutineStartForRange(state.events, state, windowStart, windowEnd);
}

function getAwakeMsForRange(windowStart, windowEnd) {
  return calculateAwakeMsForRange(state.events, state, windowStart, windowEnd, isSleepEvent);
}

function renderSummary() {
  const todayStart = getDayStart();
  const now = Date.now();
  const summaryValues = document.querySelectorAll(".summary-grid strong");
  const nextCard = document.querySelector(".next-card strong");
  const nextHint = document.querySelector(".next-card p");
  const miniRing = document.querySelector(".mini-ring");

  renderHomeSummaryPanel({
    state,
    summaryValues,
    nextCard,
    nextHint,
    miniRing,
    todayStart,
    dayMs: day,
    now,
    wakeWindowMinutes,
    getSleepMsForRange,
    getAwakeMsForRange,
    countFeedingEvents,
    countDiaperEvents,
    countMedicationEvents,
    formatShortDuration,
    formatTime,
  });
}

function getSleepReportDays() {
  return buildSleepReportDays(state.events, {
    count: 7,
    todayStart: getDayStart(),
    dayMs: day,
    getDayLabel,
    isSleepEvent,
  });
}

function renderSleepReport() {
  if (!sleepBars) return;
  const days = getSleepReportDays();
  const totalSleep = days.reduce((total, item) => total + item.sleepMs, 0);
  const totalNaps = days.reduce((total, item) => total + item.events.length, 0);
  const daysWithDataCount = days.filter((item) => item.events.length > 0).length;
  const daysWithData = daysWithDataCount || 1;
  const maxSleep = Math.max(...days.map((item) => item.sleepMs), 60 * 60000);
  const sleepEvents = days.flatMap((item) => item.events);
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
    ? `${totalNaps} registros de sono nos últimos 7 dias.`
    : "Nenhuma soneca registrada nos últimos 7 dias.";

  sleepBars.innerHTML = "";
  days.forEach((item) => {
    const bar = document.createElement("span");
    const height = Math.max(6, Math.round((item.sleepMs / maxSleep) * 100));
    bar.style.setProperty("--h", `${height}%`);
    bar.innerHTML = `<b>${item.sleepMs ? formatShortDuration(item.sleepMs) : "0"}</b><i>${item.label}</i>`;
    sleepBars.append(bar);
  });

  if (!routineEvents.length) {
    bestWindow.textContent = "Sem dados";
    bestWindowHint.textContent = "Registre sonecas para calcular a melhor janela.";
    routineStatus.textContent = "Aprendendo";
    routineHint.textContent = "O relatório será atualizado automaticamente.";
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

function getReportDays(count = 7) {
  return buildReportDays(state.events, {
    count,
    todayStart: getDayStart(),
    dayMs: day,
    getDayLabel,
  });
}


function formatNumber(value) {
  return formatChartNumber(value);
}

function renderBarChart(container, days, getValue, formatValue = formatNumber) {
  renderSharedBarChart(container, days, getValue, { formatValue, escapeHtml });
}

function renderSupplementalReports() {
  const reportDays = getReportDays(7);
  renderTrendKpis({
    container: trendKpis,
    state,
    todayStart: getDayStart(),
    now: Date.now(),
    dayMs: day,
    getSleepMsForRange,
    countFeeding: countFeedingEvents,
    countDiaper: countDiaperEvents,
    countMedication: countMedicationEvents,
    formatShortDuration,
  });

  renderBarChart(
    breastfeedingBars,
    reportDays,
    (item) => countBreastfeedingEvents(item.events),
  );

  renderBarChart(
    bottleBars,
    reportDays,
    (item) => sumBottleAmountMl(item.events),
    (value) => value ? `${formatNumber(value)} ml` : "0",
  );

  renderBarChart(
    diaperBars,
    reportDays,
    (item) => countDiaperEvents(item.events),
  );

  renderBarChart(
    medicationBars,
    reportDays,
    (item) => countMedicationEvents(item.events),
  );
}

function renderTodayLastEvents() {
  renderTodayLastEventsPanel({
    container: todayLastEvents,
    state,
    todayStart: getDayStart(),
    dayMs: day,
    getMiniEventMarkup,
    limit: 5,
  });
}

function renderTodayMiniChart() {
  renderTodayMiniChartPanel({
    container: todayMiniChart,
    state,
    todayStart: getDayStart(),
    dayMs: day,
    getDayLabel,
  });
}

function renderIntelligentHomeSections() {
  const todayStart = getDayStart();
  const now = Date.now();
  renderSmartInsight({
    container: smartInsightCard,
    state,
    now,
    todayStart,
    dayMs: day,
    wakeWindowMinutes,
    formatShortDuration,
    formatTime,
    getSleepMsForRange,
    countFeeding: countFeedingEvents,
    countDiaper: countDiaperEvents,
  });
  renderLiveAssistant({
    card: liveAssistantCard,
    state,
    now,
    todayStart,
    dayMs: day,
    wakeWindowMinutes,
    formatShortDuration,
    formatTime,
    getSleepMsForRange,
  });
  renderDailyRhythm({
    container: dailyRhythm,
    statusElement: routineProgressStatus,
    state,
    todayStart,
    now,
    dayMs: day,
    getSleepMsForRange,
    countFeeding: countFeedingEvents,
    countDiaper: countDiaperEvents,
    countMedication: countMedicationEvents,
    formatShortDuration,
  });
  renderIntelligentTimeline({
    container: intelligentTimeline,
    state,
    todayStart,
    dayMs: day,
    formatShortDuration,
    formatTime,
  });
  renderWeeklyOverview({
    container: weeklyOverview,
    state,
    todayStart,
    dayMs: day,
    getSleepMsForRange,
    countFeeding: countFeedingEvents,
    countDiaper: countDiaperEvents,
    countMedication: countMedicationEvents,
    formatShortDuration,
  });
  renderDayStory({
    element: dayStoryText,
    state,
    todayStart,
    now,
    dayMs: day,
    getSleepMsForRange,
    countFeeding: countFeedingEvents,
    countDiaper: countDiaperEvents,
    countMedication: countMedicationEvents,
    formatShortDuration,
  });
}

function renderTodayHomeSections() {
  renderTodayLastEvents();
  renderTodayMiniChart();
  renderIntelligentHomeSections();
}

function formatBreastTimer(ms) {
  return formatBreastTimerValue(ms);
}

function getBreastTimerSnapshot() {
  return buildBreastTimerSnapshot(breastTimerState);
}

function renderBreastTimer() {
  const snapshot = getBreastTimerSnapshot();
  if (leftBreastTimer) leftBreastTimer.textContent = formatBreastTimer(snapshot.leftMs);
  if (rightBreastTimer) rightBreastTimer.textContent = formatBreastTimer(snapshot.rightMs);
  if (breastTimerTotal) breastTimerTotal.textContent = formatBreastTimer(snapshot.leftMs + snapshot.rightMs);
  breastSideButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.breastSide === breastTimerState.activeSide);
  });
}

function stopBreastTimer() {
  if (!breastTimerState.activeSide) return;
  breastTimerState = stopBreastTimerState(breastTimerState, Date.now(), (intervalId) => window.clearInterval(intervalId));
  renderBreastTimer();
}

function resetBreastTimer() {
  breastTimerState = resetBreastTimerState(breastTimerState, (intervalId) => window.clearInterval(intervalId));
  renderBreastTimer();
}

function toggleBreastTimer(side) {
  if (!breastTimerPanel || breastTimerPanel.hidden) return;
  if (breastTimerState.activeSide === side) {
    stopBreastTimer();
    return;
  }
  stopBreastTimer();
  const intervalId = window.setInterval(renderBreastTimer, 500);
  breastTimerState = startBreastTimerSide(breastTimerState, side, intervalId);
  renderBreastTimer();
}

function getBreastTimerDetail(fallbackDetail) {
  stopBreastTimer();
  return buildBreastTimerDetail(getBreastTimerSnapshot(), fallbackDetail);
}

function syncBottleAmount(value) {
  const nextValue = normalizeBottleAmount(value);
  if (sheetAmountInput) sheetAmountInput.value = String(nextValue);
  if (bottleAmountRange) bottleAmountRange.value = String(nextValue);
  if (bottleAmountDisplay) bottleAmountDisplay.textContent = `${nextValue} ml`;
}

function getSheetDetailValue() {
  return resolveRecordSheetDetailValue({
    type: currentSheetType,
    detailSelect: sheetDetail,
    amountInput: sheetAmountInput,
    amountRange: bottleAmountRange,
    normalizeBottleAmount,
    getBreastTimerDetail,
  });
}

function getSheetDateTime(input) {
  const value = input?.value;
  if (!value) return null;
  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) ? timestamp : null;
}

function updateSleepDurationPreview() {
  if (!sleepDurationPreview || !isTypeWithManualEnd(currentSheetType)) return;

  const start = getSheetDateTime(sheetDateInput);
  const end = getSheetDateTime(sheetEndTimeInput);
  const lines = [];

  if (end !== null && start !== null) {
    if (end < start) {
      lines.push("O fim não pode ser antes do início.");
    } else if (end > start) {
      lines.push(`<strong>Duração: ${escapeHtml(formatShortDuration(end - start))}</strong>`);
    }
  }

  if ((currentSheetType === "sono" || currentSheetType === "dormir") && start !== null) {
    const wakeWindow = getWakeWindowForSleepStart(start, currentEditingEventId);
    if (wakeWindow?.wakeWindowMs > 0) {
      lines.push(`Ficou acordado ${escapeHtml(formatShortDuration(wakeWindow.wakeWindowMs))} antes de dormir.`);
    } else {
      lines.push("Sem despertar anterior válido para calcular a janela acordado.");
    }
  }

  if (!sheetEndTimeInput?.value && (currentSheetType === "sono" || currentSheetType === "dormir")) {
    lines.push("Deixe o fim vazio para iniciar um timer de sono.");
  }

  sleepDurationPreview.innerHTML = lines.join("<br>");
  sleepDurationPreview.hidden = !lines.length;
}

function renderWeightProfile() {
  renderWeightProfilePanel({
    profile: babyProfile,
    loadWeights: loadLocalWeights,
    elements: {
      babyWeightDateInput,
      lastWeightValue,
      lastWeightHint,
      weightHistoryList,
    },
  });
}

function saveBabyWeight() {
  const weightForm = readWeightFormValue({ babyWeightInput, babyWeightDateInput });
  if (!weightForm.valid) {
    if (babyWeightInput) babyWeightInput.focus();
    return;
  }
  const weights = upsertWeight(babyProfile.weights || loadLocalWeights(), {
    date: weightForm.date,
    value: weightForm.value,
  });
  babyProfile = normalizeBabyProfile({ ...babyProfile, weights });
  saveBabyProfile();
  markProfileLocallyChanged();
  scheduleProfileCloudSave();
  clearWeightForm({ babyWeightInput });
  renderWeightProfile();
}

function editBabyWeight(id) {
  const item = normalizeWeights(babyProfile.weights || loadLocalWeights()).find((weight) => weight.id === id);
  if (!item) return;
  hydrateWeightForm(item, { babyWeightDateInput, babyWeightInput });
}

function deleteBabyWeight(id) {
  const weights = removeWeightById(babyProfile.weights || loadLocalWeights(), id);
  babyProfile = normalizeBabyProfile({ ...babyProfile, weights });
  saveBabyProfile();
  markProfileLocallyChanged();
  scheduleProfileCloudSave();
  renderWeightProfile();
}

function updateAmbientState() {
  const hourNow = new Date().getHours();
  const period = hourNow >= 5 && hourNow < 12 ? "morning" : hourNow >= 12 && hourNow < 18 ? "day" : "night";
  document.body.dataset.dayPeriod = period;
  document.body.dataset.routineMode = state?.mode || "idle";
}

function updateTheme() {
  updateThemeBody({
    body: document.body,
    themeModeInput,
    profile: babyProfile,
    storageKey: storageKeys.themeMode,
  });
  updateAmbientState();
}

function renderAll() {
  updateTheme();
  renderBabyIdentity();
  renderCurrentState();
  renderOrbit();
  renderTimeline();
  renderSummary();
  renderSleepReport();
  renderSupplementalReports();
  renderTodayHomeSections();
}

function renderLiveTick() {
  updateTheme();

  if (state.mode === "idle" || !Number.isFinite(state.activeStartedAt)) return;

  setText(stateClock, formatDuration(Date.now() - state.activeStartedAt));
  renderActiveTimerCard();

  const currentMinute = Math.floor(Date.now() / 60000);
  if (currentMinute === liveTickMinute) return;

  liveTickMinute = currentMinute;
  setText(stateHint, getWakeWindowText());
  renderSummary();
  renderIntelligentHomeSections();
}

function finishSleep() {
  if (!requireLogin("salvar a rotina")) return;
  const finishedAt = Date.now();
  const activeType = state.activeType || "sono";
  state = finishActiveSleep(state, makeEvent, finishedAt);
  addAwakeEvent(finishedAt, activeType === "dormir" ? "Após sono noturno" : "Após soneca");
  saveDayState();
}

function startSleep() {
  if (!requireLogin("salvar a rotina")) return;
  state = startSleepTimer(state, Date.now());
  saveDayState();
}

function startRoutine(mode) {
  if (!requireLogin("salvar a rotina")) return;
  const startedAt = Date.now();
  state = startRoutineTimer(state, mode, startedAt);
  if (mode === "awake") addAwakeEvent(startedAt, "Início da rotina");
  saveDayState();
  renderAll();
}

function updateDiaryChipsMoreButton() {
  diaryFilterScroller.update();
}

function scrollDiaryFilters() {
  diaryFilterScroller.scroll();
}

function showScreen(target) {
  updateScreenVisibility({ target, navButtons, screens });
}

function setDiaryFilter(filter) {
  currentDiaryFilter = filter;
  diaryFilterButtons.forEach((button) => {
    const active = button.dataset.diaryFilter === filter;
    button.classList.toggle("active", active);
    if (active) {
      button.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
    }
  });
  window.setTimeout(updateDiaryChipsMoreButton, 220);
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
        : "Os dados ficam salvos neste aparelho. Entre para sincronizar entre celulares.";
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
  return findEventById(state.events, eventId);
}

function setSheetType(type) {
  currentSheetType = renderRecordSheetType({
    type,
    currentEditingEventId,
    getEventConfig,
    elements: {
      title: sheetTitle,
      detailLabel: sheetDetailLabel,
      amountField: sheetAmountField,
      breastTimerPanel,
      amountInput: sheetAmountInput,
      amountRange: bottleAmountRange,
      detailSelect: sheetDetail,
      endTimeField: sheetEndTimeField,
      endInput: sheetEndTimeInput,
      startLabel: sheetStartLabel,
      endLabel: sheetEndLabel,
      durationPreview: sleepDurationPreview,
      typeButtons: sheetTypeButtons,
    },
    stopBreastTimer,
    syncBottleAmount,
    defaultBottleAmount: 105,
  });
  updateSleepDurationPreview();
}

function resetSheetState() {
  currentEditingEventId = null;
  resetRecordSheet({
    elements: {
      saveButton,
      amountInput: sheetAmountInput,
      endInput: sheetEndTimeInput,
      durationPreview: sleepDurationPreview,
      notesInput: sheetNotesInput,
    },
    resetBreastTimer,
    syncBottleAmount,
    defaultBottleAmount: 105,
  });
}

function hydrateSheetFromEvent(event) {
  hydrateRecordSheetFromEventPanel({
    event,
    getEventConfig,
    elements: {
      dateInput: sheetDateInput,
      endInput: sheetEndTimeInput,
      notesInput: sheetNotesInput,
      amountInput: sheetAmountInput,
      detailSelect: sheetDetail,
    },
    syncBottleAmount,
    toDateTimeInputValue,
    defaultBottleAmount: 105,
  });
}

function openSheet(type = "sono", eventId = null) {
  const editingEvent = eventId ? getEventById(eventId) : null;
  if (!requireLogin(editingEvent ? "editar registros" : "criar registros")) return;

  closeOrbitCluster();
  currentEditingEventId = editingEvent?.id || null;
  setSheetType(editingEvent?.type || type);

  prepareRecordSheetForOpen({
    editingEvent,
    elements: {
      saveButton,
      dateInput: sheetDateInput,
      endInput: sheetEndTimeInput,
      durationPreview: sleepDurationPreview,
      amountInput: sheetAmountInput,
      notesInput: sheetNotesInput,
      sheet,
      backdrop: sheetBackdrop,
    },
    toDateTimeInputValue,
    resetBreastTimer,
    syncBottleAmount,
    hydrateRecordSheetFromEvent: hydrateSheetFromEvent,
    defaultBottleAmount: 105,
  });
  updateSleepDurationPreview();
}

function closeSheet() {
  closeRecordSheetPanel({
    elements: {
      sheet,
      backdrop: sheetBackdrop,
      orbitClusterSheet,
    },
    resetSheetState,
  });
}

function shouldStartLiveSleepFromManualEvent(type, start, existingEvent) {
  return shouldStartLiveSleepDecision({ type, start, existingEvent, state });
}

function canUseManualTimeForLiveState(start) {
  return canUseManualLiveTime(start);
}

function shouldStartLiveAwakeFromManualNightWake(type, start, existingEvent) {
  return shouldStartLiveAwakeDecision({ type, start, existingEvent, state });
}

function getActiveNightWakeEvent() {
  return findActiveNightWakeEvent(state);
}

function closeActiveNightWake(end = Date.now()) {
  return closeActiveNightWakeInState(state, end);
}

function startLiveAwakeFromManualNightWake(start, detail, notes) {
  state = startLiveAwakeFromManualNightWakeInState(state, makeEvent, start, detail, notes);
}

function startLiveSleepFromManualEvent(type, start, detail, notes) {
  state = startLiveSleepFromManualEventInState(state, type, start, detail, notes);
}

function saveManualEvent() {
  if (!requireLogin("salvar registros")) return;
  const payload = buildManualEventPayload({
    type: currentSheetType,
    editingEventId: currentEditingEventId,
    dateInput: sheetDateInput,
    endInput: sheetEndTimeInput,
    notesInput: sheetNotesInput,
    getDetailValue: getSheetDetailValue,
  });

  if (payload.isInvalidRange) {
    window.alert("O horário de fim não pode ser antes do início.");
    return;
  }

  const existingEvent = payload.editingEventId ? getEventById(payload.editingEventId) : null;
  const startsLiveSleep = shouldStartLiveSleepFromManualEvent(payload.type, payload.start, existingEvent);
  const startsLiveAwake = shouldStartLiveAwakeFromManualNightWake(payload.type, payload.start, existingEvent);

  if (existingEvent) {
    const wakeWindow = payload.type === "sono" || payload.type === "dormir"
      ? getWakeWindowForSleepStart(payload.start, existingEvent.id)
      : null;
    updateEventKeepingDuration(existingEvent, {
      type: payload.type,
      start: payload.start,
      end: payload.hasManualEnd ? payload.end : undefined,
      detail: payload.detail,
      notes: payload.notes,
      wakeWindowStartedAt: wakeWindow?.wakeWindowStartedAt,
      wakeWindowMs: wakeWindow?.wakeWindowMs,
    });
  } else if ((payload.type === "sono" || payload.type === "dormir" || payload.type === "despertar-noturno") && payload.hasManualEnd) {
    state.events.push(makeEvent(payload.type, payload.start, payload.end, payload.detail, payload.notes));
  } else if (payload.type === "acordou") {
    if (state.mode === "sleeping" && canUseManualTimeForLiveState(payload.start)) {
      state = finishActiveSleep(state, makeEvent, payload.start);
    } else if (canUseManualTimeForLiveState(payload.start)) {
      state = startRoutineTimer(state, "awake", payload.start);
    }
    addAwakeEvent(payload.start, payload.detail || "Acordou", payload.notes);
  } else if (startsLiveAwake) {
    startLiveAwakeFromManualNightWake(payload.start, payload.detail, payload.notes);
  } else if (startsLiveSleep) {
    startLiveSleepFromManualEvent(payload.type, payload.start, payload.detail, payload.notes);
  } else {
    state.events.push(makeEvent(payload.type, payload.start, payload.hasManualEnd ? payload.end : payload.start, payload.detail, payload.notes));
  }

  clearRecordFormAfterSave({
    elements: {
      amountInput: sheetAmountInput,
      endInput: sheetEndTimeInput,
      durationPreview: sleepDurationPreview,
      notesInput: sheetNotesInput,
    },
    resetBreastTimer,
    syncBottleAmount,
    defaultBottleAmount: 105,
  });
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
  if (!window.confirm(buildDeleteConfirmationText(event, { getEventConfig, formatTime }))) return;

  state.events = removeEventById(state.events, eventId);
  saveDayState();
  renderAll();
}

function getExportEvents() {
  return buildExportEvents(state.events, getEventConfig);
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
  applyProfilePhotoToImages(profileImages, dataUrl);
}

function resizeImage(file) {
  return resizeProfileImage(file, { size: 320, quality: 0.82 });
}

bindBottomNavigation(navButtons, showScreen);
bindSyncPillNavigation(syncPill, showScreen);

bindShortcutNavigation(shortcutButtons, showScreen);

diaryFilterButtons.forEach((button) => {
  button.addEventListener("click", () => setDiaryFilter(button.dataset.diaryFilter));
});

diaryFilterScroller.bind();

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

wakeAction.addEventListener("click", runActiveTimerAction);
if (activeTimerAction) activeTimerAction.addEventListener("click", runActiveTimerAction);

openSheetButtons.forEach((button) => {
  button.addEventListener("click", () => openSheet(button.dataset.openSheet));
});

sheetTypeButtons.forEach((button) => {
  button.addEventListener("click", () => setSheetType(button.dataset.sheetType));
});

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

if (themeModeInput) {
  themeModeInput.addEventListener("change", () => {
    const nextMode = readThemeModeInput(themeModeInput);
    babyProfile = normalizeBabyProfile({ ...babyProfile, themeMode: nextMode });
    markProfileLocallyChanged();
    saveBabyProfile();
    scheduleProfileCloudSave();
    updateTheme();
  });
}

if (bottleAmountRange) bottleAmountRange.addEventListener("input", () => syncBottleAmount(bottleAmountRange.value));
if (sheetAmountInput) sheetAmountInput.addEventListener("input", () => syncBottleAmount(sheetAmountInput.value));
breastSideButtons.forEach((button) => {
  button.addEventListener("click", () => toggleBreastTimer(button.dataset.breastSide));
});
if (resetBreastTimerButton) resetBreastTimerButton.addEventListener("click", resetBreastTimer);
if (saveBabyWeightButton) saveBabyWeightButton.addEventListener("click", saveBabyWeight);
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

function initSleepSounds() {
  initSleepSoundsPanel();
}


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
updateWakeWindow(wakeWindowMinutes, { skipLogin: true, skipPersist: true });
preloadActionIcons();
renderAll();
updateDiaryChipsMoreButton();
initSleepSounds();
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


sheetDateInput?.addEventListener("input", updateSleepDurationPreview);
sheetEndTimeInput?.addEventListener("input", updateSleepDurationPreview);
sheetDetail?.addEventListener("change", updateSleepDurationPreview);
