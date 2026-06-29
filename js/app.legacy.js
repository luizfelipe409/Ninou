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
const profilePhotoButtonText = document.querySelector("#profilePhotoButtonText");
const profileImages = document.querySelectorAll("#profilePhoto, .identity img");
const loginEmail = document.querySelector("#loginEmail");
const loginPassword = document.querySelector("#loginPassword");
const loginButton = document.querySelector("#loginButton");
const createAccountButton = document.querySelector("#createAccountButton");
const loginHelper = document.querySelector("#loginHelper");
const familyAccessCard = document.querySelector("#familyAccessCard");
const familyAccessTitle = document.querySelector("#familyAccessTitle");
const familyAccessText = document.querySelector("#familyAccessText");
const familyAccessBadge = document.querySelector("#familyAccessBadge");
const createFamilyButton = document.querySelector("#createFamilyButton");
const inviteCodeInput = document.querySelector("#inviteCodeInput");
const acceptInviteButton = document.querySelector("#acceptInviteButton");
const inviteAcceptBox = document.querySelector(".invite-accept-box");
const adminInvitePanel = document.querySelector("#adminInvitePanel");
const adminInviteEmail = document.querySelector("#adminInviteEmail");
const adminInviteRole = document.querySelector("#adminInviteRole");
const createInviteButton = document.querySelector("#createInviteButton");
const inviteResult = document.querySelector("#inviteResult");
const inviteList = document.querySelector("#inviteList");
const adminPendingInviteList = document.querySelector("#adminPendingInviteList");
const adminMembersList = document.querySelector("#adminMembersList");
const adminKnownUsersList = document.querySelector("#adminKnownUsersList");
const adminUsersCount = document.querySelector("#adminUsersCount");
const adminFamiliesCount = document.querySelector("#adminFamiliesCount");
const adminKnownUsersStat = document.querySelector("#adminKnownUsersStat");
const adminPendingInvitesCount = document.querySelector("#adminPendingInvitesCount");
const adminAcceptedInvitesCount = document.querySelector("#adminAcceptedInvitesCount");
const adminLastMigrationStatus = document.querySelector("#adminLastMigrationStatus");
const adminStatsHint = document.querySelector("#adminStatsHint");
const refreshAdminStatsButton = document.querySelector("#refreshAdminStatsButton");
const adminClientsList = document.querySelector("#adminClientsList");
const adminSelectedFamilyHint = document.querySelector("#adminSelectedFamilyHint");
const adminOpenFamilyButton = document.querySelector("#adminOpenFamilyButton");
const adminCreateClientFamilyButton = document.querySelector("#adminCreateClientFamilyButton");
const adminNewFamilyNameInput = document.querySelector("#adminNewFamilyNameInput");
const adminNewBabyNameInput = document.querySelector("#adminNewBabyNameInput");
const adminNewBabyArticleInput = document.querySelector("#adminNewBabyArticleInput");
const adminNewResponsibleEmailInput = document.querySelector("#adminNewResponsibleEmailInput");
const adminCreateFamilyResult = document.querySelector("#adminCreateFamilyResult");
const adminPreviewBanner = document.querySelector("#adminPreviewBanner");
const adminReturnToPanelButton = document.querySelector("#adminReturnToPanelButton");
const todayOverviewKicker = document.querySelector("#todayOverviewKicker");
const todayOverviewTitle = document.querySelector("#todayOverviewTitle");
const todayOverviewGrid = document.querySelector("#todayOverviewGrid");
const todayOverviewSuggestion = document.querySelector("#todayOverviewSuggestion");
const gentleAlertCard = document.querySelector("#gentleAlertCard");
const daySummaryMoment = document.querySelector("#daySummaryMoment");
const daySummaryText = document.querySelector("#daySummaryText");
const todayGrowthWeight = document.querySelector("#todayGrowthWeight");
const todayGrowthHint = document.querySelector("#todayGrowthHint");
const todayWeightSparkline = document.querySelector("#todayWeightSparkline");
const trendGrowthStatus = document.querySelector("#trendGrowthStatus");
const trendGrowthWeight = document.querySelector("#trendGrowthWeight");
const trendGrowthHint = document.querySelector("#trendGrowthHint");
const trendWeightSparkline = document.querySelector("#trendWeightSparkline");
const auditTrailList = document.querySelector("#auditTrailList");
const familyWelcomeCard = document.querySelector("#familyWelcomeCard");
const familyWelcomeTitle = document.querySelector("#familyWelcomeTitle");
const familyWelcomeText = document.querySelector("#familyWelcomeText");
const familyWelcomeStartButton = document.querySelector("#familyWelcomeStartButton");
const adminMigrationStatus = document.querySelector("#adminMigrationStatus");
const adminMigrationSources = document.querySelector("#adminMigrationSources");
const adminMigrationChecklist = document.querySelector("#adminMigrationChecklist");
const restoreFamilyDataButton = document.querySelector("#restoreFamilyDataButton");
const adminMigrationUidInput = document.querySelector("#adminMigrationUidInput");
const scanLegacyUidButton = document.querySelector("#scanLegacyUidButton");
const adminMigrationEmailInput = document.querySelector("#adminMigrationEmailInput");
const scanLegacyEmailButton = document.querySelector("#scanLegacyEmailButton");
const guestWhatsappButton = document.querySelector("#guestWhatsappButton");
const resetDataButton = document.querySelector("#resetDataButton");
const exportJsonButton = document.querySelector("#exportJsonButton");
const exportCsvButton = document.querySelector("#exportCsvButton");
const exportPdfButton = document.querySelector("#exportPdfButton");
const shareWhatsappButton = document.querySelector("#shareWhatsappButton");
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

const GLOBAL_APP_ADMIN_EMAIL = "luizfelipe.dasilva@gmail.com";
const APP_ADMIN_FAMILY_ID = "ninou-family-luizfelipe";
const ADMIN_WHATSAPP_NUMBER = "5521981904591";
const ADMIN_WHATSAPP_MESSAGE = "Olá! Tenho interesse em acessar o Ninou. Pode me enviar um convite?";
const ADMIN_WHATSAPP_URL = `https://wa.me/${ADMIN_WHATSAPP_NUMBER}?text=${encodeURIComponent(ADMIN_WHATSAPP_MESSAGE)}`;

function isGlobalAdminEmail(email = "") {
  return normalizeEmail(email) === GLOBAL_APP_ADMIN_EMAIL;
}

function isGlobalAppAdmin(user = cloudUser) {
  return Boolean(user && isGlobalAdminEmail(user.email));
}

function loadSelectedAdminFamilyId() {
  try {
    return String(localStorage.getItem("ninou.admin.selectedFamilyId") || APP_ADMIN_FAMILY_ID);
  } catch {
    return APP_ADMIN_FAMILY_ID;
  }
}

function getActiveAdminFamilyId() {
  return selectedAdminFamilyId || APP_ADMIN_FAMILY_ID;
}

function saveSelectedAdminFamilyId(familyId = APP_ADMIN_FAMILY_ID) {
  selectedAdminFamilyId = String(familyId || APP_ADMIN_FAMILY_ID);
  try { localStorage.setItem("ninou.admin.selectedFamilyId", selectedAdminFamilyId); } catch {}
  return selectedAdminFamilyId;
}

function getSelectedFamilyIdForAdminOrAccess() {
  return isGlobalAppAdmin() ? getActiveAdminFamilyId() : (familyAccess?.familyId || APP_ADMIN_FAMILY_ID);
}

function getAdminSelectedFamilyLabel(stats = null) {
  const selectedId = getActiveAdminFamilyId();
  const family = Array.isArray(stats?.families) ? stats.families.find((item) => item.id === selectedId) : null;
  return family?.name || stats?.familyName || babyProfile?.name || "Família selecionada";
}

function getAdminAccountPhotoKey(user = cloudUser) {
  const key = normalizeEmail(user?.email || user?.uid || GLOBAL_APP_ADMIN_EMAIL) || "admin";
  return `ninou.admin.accountPhoto.${key}`;
}

function getAdminAccountLabel(user = cloudUser) {
  const email = normalizeEmail(user?.email || "");
  return user?.displayName || (email ? email : "Administrador");
}

function loadAdminAccountPhoto(user = cloudUser) {
  try {
    return localStorage.getItem(getAdminAccountPhotoKey(user)) || "";
  } catch {
    return "";
  }
}

function setAdminAccountPhoto(dataUrl = "", user = cloudUser) {
  adminAccountPhoto = dataUrl || "";
  try {
    const key = getAdminAccountPhotoKey(user);
    if (adminAccountPhoto) localStorage.setItem(key, adminAccountPhoto);
    else localStorage.removeItem(key);
  } catch {
    // A foto pessoal segue visível na sessão mesmo se o cache local estiver indisponível.
  }
}

function isAdminPanelOnlyContext() {
  return Boolean(isGlobalAppAdmin() && activeScreenName === "profile" && !window.__ninouAdminFamilyDataOpen);
}

function getEffectiveRole(role = familyAccess?.role || "responsavel", email = cloudUser?.email || familyAccess?.email || "") {
  const normalized = normalizeRole(role);
  if (normalized === "admin" && !isGlobalAdminEmail(email)) return "responsavel";
  return normalized;
}

function normalizeInviteRole(value = "responsavel") {
  const role = normalizeRole(value);
  return role === "admin" ? "responsavel" : role;
}

let currentSheetType = "sono";
let currentEditingEventId = null;
let currentDiaryFilter = "all";
let selectedDiaryDay = null;
let autoSelectedLatestFamilyDay = false;
let familyDayIdsCache = [];
let familyDayStatesCache = {};
let familyDayIdsCacheAt = 0;
let wakeWindowMinutes = Number(localStorage.getItem(storageKeys.wakeWindow)) || 70;
let babyProfile = loadBabyProfile();
let currentProfilePhoto = localStorage.getItem(storageKeys.photo) || "";
let adminAccountPhoto = "";
let profileClientUpdatedAt = Number(localStorage.getItem(storageKeys.profileVersion)) || 0;
let firebaseServices = null;
let firebaseServicesPromise = null;
let cloudUser = null;
let familyAccess = loadFamilyAccess();
let pendingInviteCode = getInitialInviteCode();
let recentInvites = [];
let adminStatsRequestId = 0;
let selectedAdminFamilyId = loadSelectedAdminFamilyId();
let activeScreenName = "today";
let lastMigrationResult = null;
let legacyCloudContexts = [];
let legacyCloudScanState = "idle";
let legacyCloudScanError = "";
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

function getCurrentActorEmail() {
  return normalizeEmail(cloudUser?.email || familyAccess?.email || "") || "este aparelho";
}

function getCurrentActorName() {
  const email = getCurrentActorEmail();
  if (!email || email === "este aparelho") return "este aparelho";
  if (isGlobalAdminEmail(email)) return "Admin";
  return email.split("@")[0].replace(/[._-]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function makeAuditEntry(action, event, at = new Date().toISOString()) {
  const config = event?.type ? getEventConfig(event.type) : { title: "Registro" };
  return {
    id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    action,
    title: config.title || "Registro",
    at,
    byEmail: getCurrentActorEmail(),
    byName: getCurrentActorName(),
    eventId: event?.id || "",
  };
}

function pushAuditEntry(action, event) {
  state.auditLog = Array.isArray(state.auditLog) ? state.auditLog : [];
  state.auditLog.push(makeAuditEntry(action, event));
  state.auditLog = state.auditLog.slice(-60);
}

function makeEvent(type, start, end = start, detail = "", notes = "") {
  const nowIso = new Date().toISOString();
  return applyWakeWindowMetadata(createRoutineEvent(type, start, end, detail, notes, {
    createdAt: nowIso,
    createdByEmail: getCurrentActorEmail(),
    createdByName: getCurrentActorName(),
    lastAction: "adicionou",
  }));
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
  persistVisibleContextForCurrentOwner();
}

const visibleContextKeys = [
  storageKeys.profile,
  storageKeys.profileVersion,
  storageKeys.photo,
  storageKeys.dayState,
  storageKeys.wakeWindow,
  storageKeys.weights,
];
const accountCachePrefix = "ninou.accountCache";

function getAccountCacheKey(email, key) {
  return `${accountCachePrefix}.${normalizeEmail(email)}.${String(key).replace("ninou.demo.", "")}`;
}

function getVisibleDataOwnerEmail() {
  return normalizeEmail(localStorage.getItem(storageKeys.dataOwnerEmail) || "");
}

function setVisibleDataOwnerEmail(email = "") {
  const normalized = normalizeEmail(email);
  if (normalized) localStorage.setItem(storageKeys.dataOwnerEmail, normalized);
  else localStorage.removeItem(storageKeys.dataOwnerEmail);
}

function saveCurrentVisibleContextForOwner(email = "") {
  const ownerEmail = normalizeEmail(email);
  if (!ownerEmail) return;

  visibleContextKeys.forEach((key) => {
    try {
      const scopedKey = getAccountCacheKey(ownerEmail, key);
      const value = localStorage.getItem(key);
      if (value === null || typeof value === "undefined") {
        localStorage.removeItem(scopedKey);
      } else {
        localStorage.setItem(scopedKey, value);
      }
    } catch {
      // Ignora limite de armazenamento local. Os dados principais continuam no Firebase.
    }
  });
}

function persistVisibleContextForCurrentOwner() {
  const ownerEmail = getVisibleDataOwnerEmail() || normalizeEmail(cloudUser?.email || familyAccess?.email || "");
  if (!ownerEmail) return;
  setVisibleDataOwnerEmail(ownerEmail);
  saveCurrentVisibleContextForOwner(ownerEmail);
}

function clearGenericVisibleContext() {
  visibleContextKeys.forEach((key) => {
    try { localStorage.removeItem(key); } catch {}
  });
}

function restoreVisibleContextForOwner(email = "") {
  const ownerEmail = normalizeEmail(email);
  clearGenericVisibleContext();

  let restoredAny = false;
  if (ownerEmail) {
    visibleContextKeys.forEach((key) => {
      try {
        const value = localStorage.getItem(getAccountCacheKey(ownerEmail, key));
        if (value !== null && typeof value !== "undefined") {
          localStorage.setItem(key, value);
          restoredAny = true;
        }
      } catch {}
    });
  }

  wakeWindowMinutes = Number(localStorage.getItem(storageKeys.wakeWindow)) || 70;
  babyProfile = loadBabyProfile();
  currentProfilePhoto = localStorage.getItem(storageKeys.photo) || "";
  profileClientUpdatedAt = Number(localStorage.getItem(storageKeys.profileVersion)) || 0;
  state = loadLocalDayState();
  setVisibleDataOwnerEmail(ownerEmail);
  return restoredAny;
}

function refreshVisibleContextUi() {
  updateProfilePhoto(currentProfilePhoto || "./icons/icon-192.png");
  syncBabyProfileForm();
  if (wakeWindowInput) wakeWindowInput.value = String(wakeWindowMinutes);
  if (wakeWindowValue) wakeWindowValue.textContent = String(wakeWindowMinutes);
  renderAuthControls();
  renderAdminClients(null);
  renderAll();
}

function prepareVisibleContextForAccount(user = cloudUser) {
  const email = normalizeEmail(user?.email || "");
  if (!email) return;

  const previousOwner = getVisibleDataOwnerEmail();
  if (previousOwner && previousOwner !== email) {
    saveCurrentVisibleContextForOwner(previousOwner);
  }

  if (previousOwner !== email) {
    restoreVisibleContextForOwner(email);
    saveFamilyAccess(null);
    refreshVisibleContextUi();
  } else {
    setVisibleDataOwnerEmail(email);
  }
}

function resetVisibleContextForGuest() {
  const previousOwner = getVisibleDataOwnerEmail();
  if (previousOwner) saveCurrentVisibleContextForOwner(previousOwner);
  clearGenericVisibleContext();
  setVisibleDataOwnerEmail("");
  resetFamilyDayCache();
  selectedDiaryDay = null;
  autoSelectedLatestFamilyDay = false;
  wakeWindowMinutes = 70;
  babyProfile = normalizeBabyProfile({ themeMode: localStorage.getItem(storageKeys.themeMode) || "auto" });
  currentProfilePhoto = "";
  profileClientUpdatedAt = 0;
  state = createEmptyDayState();
  updateProfilePhoto("./icons/icon-192.png");
}


function prepareAdminPanelContext(user = cloudUser) {
  const previousOwner = getVisibleDataOwnerEmail();
  if (previousOwner) saveCurrentVisibleContextForOwner(previousOwner);
  clearGenericVisibleContext();
  setVisibleDataOwnerEmail("");
  resetFamilyDayCache();
  selectedDiaryDay = null;
  autoSelectedLatestFamilyDay = false;
  window.__ninouAdminFamilyDataOpen = false;
  wakeWindowMinutes = 70;
  babyProfile = normalizeBabyProfile({ themeMode: localStorage.getItem(storageKeys.themeMode) || "auto" });
  currentProfilePhoto = "";
  profileClientUpdatedAt = 0;
  state = createEmptyDayState();
  adminAccountPhoto = loadAdminAccountPhoto(user);
  updateProfilePhoto("./icons/icon-192.png");
  refreshVisibleContextUi();
}

async function loadAdminAccountProfileFromCloud(user = cloudUser) {
  if (!user || !isGlobalAppAdmin(user)) return null;
  try {
    const services = await getFirebaseServices();
    const snapshot = await services.getDoc(services.doc(services.db, "users", user.uid, "account", "profile"));
    const data = snapshot.exists() ? snapshot.data() || {} : {};
    if (data.photo) setAdminAccountPhoto(String(data.photo), user);
    else adminAccountPhoto = loadAdminAccountPhoto(user);
    renderBabyIdentity();
    return data;
  } catch (error) {
    console.warn("Não foi possível carregar o perfil pessoal do admin:", error);
    adminAccountPhoto = loadAdminAccountPhoto(user);
    renderBabyIdentity();
    return null;
  }
}

async function saveAdminAccountProfileToCloud() {
  if (!cloudUser || !isGlobalAppAdmin()) return false;
  try {
    const services = await getFirebaseServices();
    await services.setDoc(services.doc(services.db, "users", cloudUser.uid, "account", "profile"), {
      email: normalizeEmail(cloudUser.email || GLOBAL_APP_ADMIN_EMAIL),
      photo: adminAccountPhoto || "",
      updatedAt: services.serverTimestamp(),
    }, { merge: true });
    return true;
  } catch (error) {
    console.warn("Não foi possível salvar a foto pessoal do admin:", error);
    return false;
  }
}

function hasRoutineDayContent(dayState = state) {
  const events = Array.isArray(dayState?.events) ? dayState.events : [];
  return events.length > 0 || Boolean(dayState?.mode && dayState.mode !== "idle" && Number.isFinite(Number(dayState?.activeStartedAt)));
}

function isLoggedIn() {
  return Boolean(cloudUser);
}

function hasFamilyAccess() {
  return Boolean(cloudUser && familyAccess?.familyId);
}

function canUsePrivateFeatures() {
  if (isGlobalAppAdmin() && !window.__ninouAdminFamilyDataOpen) return false;
  return hasFamilyAccess();
}


function hasPermissionForAction(actionText = "") {
  if (!hasFamilyAccess()) return false;
  const role = getEffectiveRole(familyAccess.role);
  if (role === "admin" || role === "responsavel") return true;

  const text = String(actionText).toLowerCase();
  const sensitive = /(editar|excluir|zerar|perfil|foto|peso|janela|exportar|backup)/.test(text);

  if (role === "cuidador") {
    return !sensitive;
  }

  return false;
}

function requireLogin(actionText = "usar o Ninou") {
  if (canUsePrivateFeatures() && hasPermissionForAction(actionText)) {
    if (/(salvar a rotina|salvar registros|excluir registros|zerar a rotina)/i.test(actionText)) {
      ensureTodaySelectedForRoutineWrite();
    }
    return true;
  }
  if (canUsePrivateFeatures() && !hasPermissionForAction(actionText)) {
    if (loginHelper) loginHelper.textContent = `Seu perfil (${getRoleLabel(familyAccess.role)}) não permite ${actionText}.`;
    return false;
  }
  setSyncStatus(isLoggedIn() ? "loading" : "offline", cloudUser?.email || "");
  showScreen("profile");
  if (loginHelper) {
    loginHelper.textContent = isLoggedIn()
      ? `Sua conta precisa estar vinculada a uma família para ${actionText}. Use um convite do administrador do app.`
      : `Entre com uma conta autorizada para ${actionText}. Novos usuários entram por convite do administrador do app.`;
  }
  return false;
}

function ensureTodaySelectedForRoutineWrite() {
  const todayStart = getDayStart();
  if ((selectedDiaryDay ?? todayStart) === todayStart) return;

  setSelectedDiaryDayById(getCurrentDayId());
  timelineRenderSignature = "";

  if (firebaseServices && cloudUser && hasFamilyAccess()) {
    subscribeToCloudDay(getCurrentDayId(), { resetIfMissing: false });
    return;
  }

  state = loadLocalDayState();
  renderAll();
}

function normalizeEmail(value = "") {
  return String(value || "").trim().toLowerCase();
}

function normalizeInviteCode(value = "") {
  return String(value || "").trim().toUpperCase().replace(/\s+/g, "");
}

function normalizeRole(value = "responsavel") {
  return ["admin", "responsavel", "cuidador", "visualizacao"].includes(value) ? value : "responsavel";
}

function getRoleLabel(role = "responsavel") {
  const labels = {
    admin: "Administrador",
    responsavel: "Acesso completo",
    cuidador: "Cuidador",
    visualizacao: "Somente visualização",
  };
  return labels[normalizeRole(role)] || labels.responsavel;
}

function loadFamilyAccess() {
  try {
    const data = JSON.parse(localStorage.getItem(storageKeys.access) || "null");
    if (!data || typeof data !== "object" || !data.familyId) return null;
    return {
      familyId: String(data.familyId),
      role: normalizeRole(data.role),
      email: normalizeEmail(data.email),
      ownerUid: data.ownerUid ? String(data.ownerUid) : "",
      inviteCode: data.inviteCode ? normalizeInviteCode(data.inviteCode) : "",
      acceptedAt: data.acceptedAt || data.createdAt || "",
    };
  } catch {
    return null;
  }
}

function saveFamilyAccess(access) {
  familyAccess = access?.familyId
    ? {
        familyId: String(access.familyId),
        role: getEffectiveRole(access.role, access.email || cloudUser?.email || ""),
        email: normalizeEmail(access.email || cloudUser?.email || ""),
        ownerUid: access.ownerUid ? String(access.ownerUid) : "",
        inviteCode: access.inviteCode ? normalizeInviteCode(access.inviteCode) : "",
        acceptedAt: access.acceptedAt || access.createdAt || new Date().toISOString(),
      }
    : null;

  if (familyAccess) {
    localStorage.setItem(storageKeys.access, JSON.stringify(familyAccess));
  } else {
    localStorage.removeItem(storageKeys.access);
  }

  renderFamilyAccessPanel();
  return familyAccess;
}

function getInitialInviteCode() {
  try {
    const params = new URLSearchParams(window.location.search);
    const code = normalizeInviteCode(params.get("convite") || params.get("invite") || localStorage.getItem(storageKeys.pendingInvite) || "");
    if (code) localStorage.setItem(storageKeys.pendingInvite, code);
    return code;
  } catch {
    return normalizeInviteCode(localStorage.getItem(storageKeys.pendingInvite) || "");
  }
}

function clearPendingInviteCode() {
  pendingInviteCode = "";
  try { localStorage.removeItem(storageKeys.pendingInvite); } catch {}
  if (inviteCodeInput) inviteCodeInput.value = "";
}

function resetMigrationSearchState() {
  legacyCloudContexts = [];
  legacyCloudScanState = "idle";
  legacyCloudScanError = "";
  lastMigrationResult = null;
}

function createInviteCode() {
  const bytes = new Uint8Array(6);
  if (window.crypto?.getRandomValues) {
    window.crypto.getRandomValues(bytes);
  } else {
    for (let index = 0; index < bytes.length; index += 1) bytes[index] = Math.floor(Math.random() * 256);
  }
  const token = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("").toUpperCase();
  return `NINOU-${token.slice(0, 4)}-${token.slice(4, 8)}-${token.slice(8, 12)}`;
}

function stableInviteToken(input = "") {
  const text = String(input || "").trim().toLowerCase();
  let hashA = 0x811c9dc5;
  let hashB = 0x45d9f3b;

  for (let index = 0; index < text.length; index += 1) {
    const code = text.charCodeAt(index);
    hashA ^= code;
    hashA = Math.imul(hashA, 0x01000193) >>> 0;
    hashB ^= code + index;
    hashB = Math.imul(hashB, 0x27d4eb2d) >>> 0;
  }

  return `${hashA.toString(16).padStart(8, "0")}${hashB.toString(16).padStart(8, "0")}`.toUpperCase();
}

function createInviteCodeForEmail(email = "", familyId = APP_ADMIN_FAMILY_ID) {
  const token = stableInviteToken(`${normalizeEmail(email)}|${familyId}|ninou`);
  return `NINOU-${token.slice(0, 4)}-${token.slice(4, 8)}-${token.slice(8, 12)}`;
}

function slugifyFamilyText(value = "familia") {
  const slug = String(value || "familia")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 30);
  return slug || "familia";
}

function createFamilyIdFromNames(familyName = "", babyName = "") {
  const base = slugifyFamilyText(babyName || familyName || "familia");
  const token = stableInviteToken(`${base}|${familyName}|${babyName}|${cloudUser?.uid || "admin"}|${Date.now()}`)
    .slice(0, 6)
    .toLowerCase();
  return `family-${base}-${token}`;
}

function buildInviteLink(code) {
  const url = new URL(window.location.href);
  url.search = "";
  url.hash = "";
  url.searchParams.set("convite", code);
  return url.toString();
}

async function cleanupDuplicatePendingInvites(services, email, familyId, keepCode) {
  try {
    const snapshot = await services.getDocs(services.collection(services.db, "invites"));
    const updates = [];
    snapshot.forEach((inviteDoc) => {
      const data = inviteDoc.data() || {};
      const sameEmail = normalizeEmail(data.email || "") === normalizeEmail(email);
      const sameFamily = data.familyId === familyId;
      const isDuplicate = inviteDoc.id !== keepCode;
      const isPending = !data.status || data.status === "pending";
      if (sameEmail && sameFamily && isDuplicate && isPending) {
        updates.push(services.setDoc(
          services.doc(services.db, "invites", inviteDoc.id),
          { status: "cancelled", replacedBy: keepCode, cancelledAt: services.serverTimestamp() },
          { merge: true },
        ));
      }
    });
    await Promise.allSettled(updates);
  } catch (error) {
    console.warn("Não foi possível limpar convites duplicados:", error);
  }
}

function getActiveFamilyId() {
  return familyAccess?.familyId || (cloudUser ? cloudUser.uid : "");
}

function getSelectedDayId() {
  return toDateInputValue(selectedDiaryDay ?? getDayStart());
}

function isDateId(value = "") {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(value || ""));
}

function setSelectedDiaryDayById(dayId = getCurrentDayId()) {
  const safeDayId = isDateId(dayId) ? dayId : getCurrentDayId();
  selectedDiaryDay = getDayStart(new Date(`${safeDayId}T12:00:00`).getTime());
  if (diaryDateInput) {
    diaryDateInput.value = safeDayId;
    if (!diaryDateInput.max || diaryDateInput.max < safeDayId) diaryDateInput.max = safeDayId;
    if (!diaryDateInput.min || diaryDateInput.min > safeDayId) diaryDateInput.min = safeDayId;
  }
}

function resetFamilyDayCache() {
  familyDayIdsCache = [];
  familyDayStatesCache = {};
  familyDayIdsCacheAt = 0;
}


function getDayIdFromStart(startValue = getDayStart()) {
  return toDateInputValue(getDayStart(Number(startValue) || Date.now()));
}

function syncSelectedDayIntoFamilyCache() {
  const dayId = getSelectedDayId();
  if (!isDateId(dayId)) return;
  familyDayStatesCache = {
    ...familyDayStatesCache,
    [dayId]: normalizeDayState(state),
  };
  if (hasRoutineDayContent(state) && !familyDayIdsCache.includes(dayId)) {
    familyDayIdsCache = [...familyDayIdsCache, dayId].filter(isDateId).sort();
  }
}

function getFamilyDayState(dayId) {
  if (dayId === getSelectedDayId()) return normalizeDayState(state);
  return normalizeDayState(familyDayStatesCache[dayId] || createEmptyDayState());
}

function getFamilyEventsForWindow(windowStart, windowEnd) {
  syncSelectedDayIntoFamilyCache();
  const events = [];
  const startDay = getDayStart(windowStart);
  const endDay = getDayStart(Math.max(windowStart, windowEnd - 1));
  for (let dayStart = startDay; dayStart <= endDay; dayStart += day) {
    const dayId = toDateInputValue(dayStart);
    const dayState = getFamilyDayState(dayId);
    (dayState.events || []).forEach((event) => {
      if (event.start >= windowStart && event.start < windowEnd) events.push(event);
    });
  }
  return events.sort((a, b) => Number(a.start) - Number(b.start));
}

function buildFamilyReportDays(count = 7, anchorStart = getDayStart()) {
  syncSelectedDayIntoFamilyCache();
  return Array.from({ length: count }, (_, index) => {
    const start = anchorStart - (count - 1 - index) * day;
    const end = start + day;
    const dayId = toDateInputValue(start);
    const dayState = getFamilyDayState(dayId);
    return {
      start,
      end,
      label: getDayLabel(start),
      events: (dayState.events || []).filter((event) => event.start >= start && event.start < end),
    };
  });
}

function buildFamilyStateForRecentWindow(count = 7, anchorStart = getDayStart()) {
  const start = anchorStart - (count - 1) * day;
  const end = anchorStart + day;
  return {
    ...normalizeDayState(state),
    events: getFamilyEventsForWindow(start, end),
  };
}

function isFamilyAdmin() {
  if (isGlobalAppAdmin()) return true;
  return hasFamilyAccess() && getEffectiveRole(familyAccess?.role) === "admin";
}

function buildGlobalAdminAccess(user = cloudUser, familyId = getActiveAdminFamilyId()) {
  if (!user || !isGlobalAppAdmin(user)) return null;
  return {
    familyId: String(familyId || APP_ADMIN_FAMILY_ID),
    role: "admin",
    email: user.email || GLOBAL_APP_ADMIN_EMAIL,
    ownerUid: user.uid,
    accessMode: "support",
    acceptedAt: new Date().toISOString(),
  };
}

function ensureGlobalAdminAccess(user = cloudUser, familyId = getActiveAdminFamilyId()) {
  const selectedFamily = saveSelectedAdminFamilyId(familyId);
  const access = buildGlobalAdminAccess(user, selectedFamily);
  if (!access) return null;
  return saveFamilyAccess(access);
}


function updateGuestWhatsappButton() {
  if (!guestWhatsappButton) return;
  // O botão de WhatsApp é um contato público para visitantes ainda deslogados.
  // Depois que há uma conta conectada, o fluxo correto passa a ser login/convite no Perfil.
  const shouldShow = !isLoggedIn();
  guestWhatsappButton.href = ADMIN_WHATSAPP_URL;
  guestWhatsappButton.hidden = !shouldShow;
  document.body.classList.toggle("guest-whatsapp-visible", shouldShow);
}

function setAdminStatsPlaceholder(message = "Entre como admin para visualizar o painel.") {
  setText(adminUsersCount, "--");
  setText(adminFamiliesCount, "--");
  setText(adminKnownUsersStat, "--");
  setText(adminPendingInvitesCount, "--");
  setText(adminAcceptedInvitesCount, "--");
  setText(adminLastMigrationStatus, "--");
  setText(adminStatsHint, message);
}

function getAccountCacheSuffix(key) {
  return String(key).replace("ninou.demo.", "");
}

function readJsonValue(value, fallback = null) {
  if (value === null || typeof value === "undefined" || value === "") return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function getCachedOwnerEmails() {
  const emails = new Set();
  const prefix = `${accountCachePrefix}.`;
  const suffixes = visibleContextKeys.map((key) => getAccountCacheSuffix(key));

  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index) || "";
    if (!key.startsWith(prefix)) continue;

    suffixes.forEach((suffix) => {
      const tail = `.${suffix}`;
      if (key.endsWith(tail)) {
        const email = normalizeEmail(key.slice(prefix.length, -tail.length));
        if (email) emails.add(email);
      }
    });
  }

  return Array.from(emails);
}

function readCachedContextForOwner(email = "") {
  const ownerEmail = normalizeEmail(email);
  if (!ownerEmail) return null;

  const getCachedValue = (key) => localStorage.getItem(getAccountCacheKey(ownerEmail, key));
  const profileRaw = getCachedValue(storageKeys.profile);
  const profile = normalizeBabyProfile(readJsonValue(profileRaw, {}));
  const photo = getCachedValue(storageKeys.photo) || "";
  const wakeWindow = Number(getCachedValue(storageKeys.wakeWindow)) || 70;
  const profileVersion = Number(getCachedValue(storageKeys.profileVersion)) || 0;
  const dayStateRaw = getCachedValue(storageKeys.dayState);
  const dayState = normalizeDayState(readJsonValue(dayStateRaw, {}));
  const weightsRaw = getCachedValue(storageKeys.weights);
  const weights = normalizeWeights(readJsonValue(weightsRaw, []));
  const eventsCount = Array.isArray(dayState.events) ? dayState.events.length : 0;
  const hasProfile = hasProfileContent(profile, photo, wakeWindow);
  const hasDay = hasRoutineDayContent(dayState);
  const hasWeights = weights.length > 0;

  if (!hasProfile && !hasDay && !hasWeights) return null;

  const score = (hasProfile ? 100 : 0)
    + (photo ? 40 : 0)
    + Math.min(eventsCount, 30)
    + Math.min(weights.length * 5, 25)
    + Math.min(Math.floor(profileVersion / 1000000000000), 10);

  return {
    email: ownerEmail,
    profile,
    profileRaw,
    photo,
    wakeWindow,
    profileVersion,
    dayState,
    dayStateRaw,
    weights,
    weightsRaw,
    eventsCount,
    hasProfile,
    hasDay,
    hasWeights,
    score,
  };
}

function getRestorableContexts() {
  return getCachedOwnerEmails()
    .map(readCachedContextForOwner)
    .filter(Boolean)
    .sort((a, b) => b.score - a.score || String(a.email).localeCompare(String(b.email)));
}

function getBestRestorableContext() {
  const currentEmail = normalizeEmail(cloudUser?.email || "");
  return getRestorableContexts().find((context) => context.email !== currentEmail) || null;
}


function getContextEventsCount(context = {}) {
  if (Number.isFinite(Number(context.eventsCount))) return Number(context.eventsCount);
  if (context.dayStates && typeof context.dayStates === "object") {
    return Object.values(context.dayStates).reduce((total, dayState) => total + (Array.isArray(dayState?.events) ? dayState.events.length : 0), 0);
  }
  return 0;
}

function getContextDaysCount(context = {}) {
  if (context.dayStates && typeof context.dayStates === "object") return Object.keys(context.dayStates).length;
  return context.hasDay ? 1 : 0;
}

function getContextBabyLabel(context) {
  if (!context) return "dados locais";
  const name = getBabyNameFromProfile(context.profile || {});
  const parts = [];
  if (name && name !== "Bebê") parts.push(name);
  const eventsCount = getContextEventsCount(context);
  const daysCount = getContextDaysCount(context);
  if (eventsCount) parts.push(`${eventsCount} registros${daysCount > 1 ? ` em ${daysCount} dias` : ""}`);
  if (context.photo) parts.push("foto salva");
  if (context.weights?.length) parts.push(`${context.weights.length} pesos`);
  if (context.source === "cloud") parts.push("Firebase");
  return parts.length ? parts.join(" • ") : (context.source === "cloud" ? "dados encontrados no Firebase" : "perfil salvo neste aparelho");
}

function toMilliseconds(value) {
  if (value === null || typeof value === "undefined" || value === "") return null;
  if (typeof value === "number" && Number.isFinite(value)) {
    if (value > 100000000000) return value;
    if (value > 1000000000) return value * 1000;
    return value;
  }
  if (value instanceof Date) return value.getTime();
  if (typeof value?.toMillis === "function") return value.toMillis();
  if (typeof value === "object" && Number.isFinite(Number(value.seconds))) {
    return Number(value.seconds) * 1000 + Math.floor(Number(value.nanoseconds || 0) / 1000000);
  }
  if (typeof value === "string") {
    const parsed = Date.parse(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function firstDefined(...values) {
  return values.find((value) => value !== null && typeof value !== "undefined" && value !== "");
}

function findTimestampFromObject(source = {}, keys = []) {
  for (const key of keys) {
    const value = source?.[key];
    const ms = toMilliseconds(value);
    if (Number.isFinite(ms)) return ms;
  }
  return null;
}

function normalizeLegacyType(source = {}) {
  const text = [
    source.type,
    source.kind,
    source.category,
    source.action,
    source.activityType,
    source.eventType,
    source.name,
    source.title,
    source.label,
    source.detail,
  ].filter(Boolean).join(" ").toLowerCase();

  if (/acord|wake|awake/.test(text)) return "acordou";
  if (/despert|noturn|night.?wake/.test(text)) return "despertar-noturno";
  if (/dorm|sono noturno|noite|sleep night|bedtime/.test(text)) return "dormir";
  if (/soneca|sono|sleep|nap/.test(text)) return "sono";
  if (/amament|peito|mama|breast|nursing/.test(text)) return "amamentacao";
  if (/mamadeira|bottle|formula|fórmula|leite/.test(text)) return "mamadeira";
  if (/fralda|diaper|xixi|coc[oô]|mista/.test(text)) return "fralda";
  if (/medic|rem[eé]dio|dose|xarope|gota|vitamina/.test(text)) return "medicamento";
  return normalizeEvent({ type: source.type || "sono", start: Date.now() })?.type || "sono";
}

function normalizeLegacyDetail(source = {}, type = "sono") {
  const amount = firstDefined(source.amountMl, source.ml, source.volumeMl, source.quantityMl, source.amount, source.volume, source.quantity);
  const side = firstDefined(source.side, source.breastSide, source.lado);
  const detail = firstDefined(source.detail, source.details, source.label, source.subtype, source.categoryLabel, source.option, source.reason, source.local, source.place, source.location, source.name, source.title);
  const pieces = [];
  if (typeof detail === "string" && detail.trim()) pieces.push(detail.trim());
  if (typeof side === "string" && side.trim() && !pieces.join(" ").toLowerCase().includes(side.trim().toLowerCase())) pieces.push(side.trim());
  if (amount !== null && typeof amount !== "undefined" && amount !== "" && type === "mamadeira") pieces.push(`${amount} ml`);

  if (type === "amamentacao") {
    const left = Number(firstDefined(source.leftMs, source.leftDurationMs, source.esquerdoMs, source.leftMinutes, source.esquerdoMin, source.left));
    const right = Number(firstDefined(source.rightMs, source.rightDurationMs, source.direitoMs, source.rightMinutes, source.direitoMin, source.right));
    if (left > 0 && right > 0 && !pieces.some((item) => /mista/i.test(item))) pieces.unshift("Mista");
  }

  return pieces.length ? pieces.join(" • ") : "";
}

function normalizeLegacyNotes(source = {}) {
  const notes = firstDefined(source.notes, source.note, source.observacao, source.observações, source.observation, source.description, source.comment, source.comentario);
  if (typeof notes === "string") return notes;
  return "";
}

function getLegacyDurationMs(source = {}) {
  const raw = firstDefined(source.durationMs, source.elapsedMs, source.totalMs, source.duration, source.elapsed, source.totalDuration);
  const value = Number(raw);
  if (!Number.isFinite(value) || value <= 0) return 0;
  if (value > 1000 * 60 * 60 * 24) return value;
  if (value > 1000) return value;
  return value * 60000;
}

function normalizeLegacyActivityDocument(source = {}, id = "") {
  const nestedState = source.state && typeof source.state === "object" ? source.state : source.dayState;
  if (nestedState && Array.isArray(nestedState.events)) {
    return { kind: "day", dayState: normalizeDayState(nestedState), dayId: source.dayId || source.date || id };
  }
  if (Array.isArray(source.events)) {
    return { kind: "day", dayState: normalizeDayState(source), dayId: source.dayId || source.date || id };
  }

  const start = findTimestampFromObject(source, [
    "start",
    "startedAt",
    "startAt",
    "startTime",
    "time",
    "timestamp",
    "createdAt",
    "date",
    "datetime",
    "registeredAt",
    "updatedAt",
  ]);
  if (!Number.isFinite(start)) return null;

  let end = findTimestampFromObject(source, ["end", "endedAt", "finishedAt", "finishAt", "endTime", "completedAt", "stoppedAt"]);
  const durationMs = getLegacyDurationMs(source);
  if (!Number.isFinite(end) && durationMs > 0) end = start + durationMs;
  if (!Number.isFinite(end)) end = start;
  if (end < start) end = start;

  const type = normalizeLegacyType(source);
  const event = normalizeEvent({
    id: typeof id === "string" && id ? `legacy-${id}` : undefined,
    type,
    start,
    end,
    detail: normalizeLegacyDetail(source, type),
    notes: normalizeLegacyNotes(source),
    wakeWindowStartedAt: toMilliseconds(source.wakeWindowStartedAt),
    wakeWindowMs: Number(source.wakeWindowMs || source.wakeWindowMilliseconds || 0),
  });

  return event ? { kind: "event", event } : null;
}

function dayIdFromAny(value) {
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const ms = toMilliseconds(value);
  if (Number.isFinite(ms)) return toDateInputValue(ms);
  if (typeof value === "string") {
    const match = value.match(/\d{4}-\d{2}-\d{2}/);
    if (match) return match[0];
  }
  return null;
}

function addEventToDayMap(dayStates, event) {
  if (!event || !Number.isFinite(Number(event.start))) return;
  const dayId = toDateInputValue(event.start);
  const dayState = dayStates[dayId] || createEmptyDayState();
  const key = `${event.type}|${Math.round(event.start)}|${Math.round(event.end)}|${event.detail || ""}|${event.notes || ""}`;
  const exists = (dayState.events || []).some((item) => `${item.type}|${Math.round(item.start)}|${Math.round(item.end)}|${item.detail || ""}|${item.notes || ""}` === key);
  if (!exists) dayState.events.push(event);
  dayState.events.sort((a, b) => a.start - b.start);
  dayStates[dayId] = normalizeDayState(dayState);
}

function addDayStateToMap(dayStates, dayIdValue, dayStateValue) {
  const normalized = normalizeDayState(dayStateValue);
  const explicitDayId = dayIdFromAny(dayIdValue);
  const inferredDayId = normalized.events?.[0] ? toDateInputValue(normalized.events[0].start) : explicitDayId;
  const dayId = explicitDayId || inferredDayId;
  if (!dayId) return;
  const target = dayStates[dayId] || createEmptyDayState();
  (normalized.events || []).forEach((event) => addEventToDayMap(dayStates, event));
  const merged = dayStates[dayId] || target;
  if (normalized.mode !== "idle" && Number.isFinite(Number(normalized.activeStartedAt))) {
    merged.mode = normalized.mode;
    merged.activeStartedAt = normalized.activeStartedAt;
    merged.activeType = normalized.activeType || merged.activeType;
    merged.activeDetail = normalized.activeDetail || merged.activeDetail;
    merged.activeNotes = normalized.activeNotes || merged.activeNotes;
    dayStates[dayId] = normalizeDayState(merged);
  }
}

function normalizeLegacyProfileData(...sources) {
  const merged = Object.assign({}, ...sources.filter((item) => item && typeof item === "object"));
  const rawProfile = merged.babyProfile && typeof merged.babyProfile === "object" ? merged.babyProfile : merged.profile && typeof merged.profile === "object" ? merged.profile : merged;
  const name = firstDefined(rawProfile.name, rawProfile.babyName, rawProfile.nome, rawProfile.childName, rawProfile.displayName, merged.name, merged.babyName, merged.nome, "");
  const article = firstDefined(rawProfile.article, rawProfile.artigo, merged.article, "do");
  const birthDate = firstDefined(rawProfile.birthDate, rawProfile.birth, rawProfile.birthday, rawProfile.nascimento, rawProfile.diaNascimento, merged.birthDate, "");
  const profile = normalizeBabyProfile({ name, article, birthDate });
  if (!profile.name || profile.name === "Bebê") {
    const email = normalizeEmail(merged.email || "");
    if (email.includes("francisco")) profile.name = "Francisco";
  }
  return profile;
}

function getLegacyPhoto(...sources) {
  for (const source of sources) {
    if (!source || typeof source !== "object") continue;
    const raw = firstDefined(source.photo, source.photoDataUrl, source.profilePhoto, source.profilePhotoUrl, source.babyPhoto, source.avatar, source.image, source.imageUrl, source.picture);
    if (typeof raw === "string" && raw.length > 20) return raw;
  }
  return "";
}

function getLegacyWakeWindow(...sources) {
  for (const source of sources) {
    if (!source || typeof source !== "object") continue;
    const value = Number(firstDefined(source.wakeWindowMinutes, source.wakeWindow, source.awakeWindowMinutes, source.janelaDespertar));
    if (Number.isFinite(value) && value >= 20 && value <= 240) return value;
  }
  return 70;
}

function normalizeLegacyWeightDate(value, fallback = "") {
  if (typeof value === "string" && isDateId(value.slice(0, 10))) return value.slice(0, 10);
  const ms = toMilliseconds(value);
  if (Number.isFinite(ms)) return toDateInputValue(getDayStart(ms));
  if (typeof fallback === "string" && isDateId(fallback.slice(0, 10))) return fallback.slice(0, 10);
  return "";
}

function normalizeLegacyWeightItem(item = {}, fallbackId = "") {
  if (!item || typeof item !== "object") return null;
  const rawValue = firstDefined(
    item.value,
    item.weight,
    item.kg,
    item.peso,
    item.pesoKg,
    item.weightKg,
    item.valueKg,
    item.amount,
    item.grams,
    item.g,
  );
  const rawValueText = String(rawValue ?? "").replace(",", ".");
  const rawValueMatch = rawValueText.match(/\d+(?:\.\d+)?/);
  let value = Number(rawValueMatch ? rawValueMatch[0] : rawValueText);
  if (!Number.isFinite(value) || value <= 0) return null;
  if ((item.grams || item.g) && value > 50) value = value / 1000;

  const date = normalizeLegacyWeightDate(
    firstDefined(item.date, item.day, item.dayId, item.data, item.recordedAt, item.createdAt, item.updatedAt, item.timestamp, item.weighedAt),
    fallbackId,
  );
  if (!date) return null;
  return {
    id: typeof item.id === "string" ? item.id : `peso-${date}-${String(fallbackId || Date.now()).replace(/[^a-z0-9-]+/gi, "-")}`,
    date,
    value,
  };
}

function normalizeLegacyWeightsCandidate(value) {
  if (!value) return [];
  if (Array.isArray(value)) return normalizeWeights(value.map((item, index) => normalizeLegacyWeightItem(item, String(index))).filter(Boolean));
  if (typeof value === "object") {
    return normalizeWeights(Object.entries(value)
      .map(([key, item]) => normalizeLegacyWeightItem(typeof item === "object" ? item : { value: item, date: key }, key))
      .filter(Boolean));
  }
  return [];
}

function getLegacyWeights(...sources) {
  const collected = [];
  for (const source of sources) {
    if (!source || typeof source !== "object") continue;
    const nestedProfile = source.profile && typeof source.profile === "object" ? source.profile : null;
    const nestedBaby = source.babyProfile && typeof source.babyProfile === "object" ? source.babyProfile : null;
    const candidates = [
      source.weights,
      source.weightHistory,
      source.pesos,
      source.babyWeights,
      source.weightEntries,
      source.growth,
      source.growthWeights,
      nestedProfile?.weights,
      nestedProfile?.weightHistory,
      nestedBaby?.weights,
      nestedBaby?.weightHistory,
    ];
    candidates.forEach((candidate) => {
      const normalized = normalizeLegacyWeightsCandidate(candidate);
      if (normalized.length) collected.push(...normalized);
    });
  }
  const byDate = new Map();
  normalizeWeights(collected).forEach((item) => {
    if (!byDate.has(item.date)) byDate.set(item.date, item);
  });
  return normalizeWeights(Array.from(byDate.values()));
}

async function readMaybeDoc(services, ...pathParts) {
  try {
    const ref = services.doc(services.db, ...pathParts);
    const snap = await services.getDoc(ref);
    return snap.exists() ? (snap.data() || {}) : null;
  } catch (error) {
    console.warn("Não foi possível ler documento legado:", pathParts.join("/"), error);
    return null;
  }
}

async function readMaybeCollection(services, ...pathParts) {
  try {
    const snap = await services.getDocs(services.collection(services.db, ...pathParts));
    const docs = [];
    snap.forEach((docSnap) => docs.push({ id: docSnap.id, data: docSnap.data() || {} }));
    return docs;
  } catch (error) {
    console.warn("Não foi possível ler coleção legada:", pathParts.join("/"), error);
    return [];
  }
}

function getLegacyUidFromPath(path = "") {
  const match = String(path || "").match(/^users\/([^/]+)(?:\/|$)/);
  return match ? match[1] : "";
}

function getFamilyIdFromProfilePath(path = "") {
  const match = String(path || "").match(/^families\/([^/]+)\/profile\//);
  return match ? match[1] : "";
}

async function readMaybeCollectionGroup(services, groupName) {
  if (!services.collectionGroup) return [];
  try {
    const snap = await services.getDocs(services.collectionGroup(services.db, groupName));
    const docs = [];
    snap.forEach((docSnap) => docs.push({
      id: docSnap.id,
      path: docSnap.ref?.path || "",
      uid: getLegacyUidFromPath(docSnap.ref?.path || ""),
      data: docSnap.data() || {},
    }));
    return docs;
  } catch (error) {
    console.warn("Não foi possível consultar collectionGroup legado:", groupName, error);
    return [];
  }
}

async function collectLegacyUidsByCollectionGroups(services) {
  const groups = ["activities", "days", "profile", "access", "weights", "pesos"];
  const uids = new Set();
  const counts = {};

  for (const group of groups) {
    const docs = await readMaybeCollectionGroup(services, group);
    counts[group] = docs.length;
    docs.forEach((item) => {
      if (item.uid) uids.add(item.uid);
    });
  }

  return { uids: Array.from(uids), counts };
}

async function addQueryResultsToUidMap(services, uidMap, queryRef, reason = "") {
  try {
    const snap = await services.getDocs(queryRef);
    (snap.docs || []).forEach((docSnap) => {
      const uid = getLegacyUidFromPath(docSnap.ref?.path || "") || docSnap.id;
      if (!uid) return;
      if (!uidMap.has(uid)) uidMap.set(uid, new Set());
      if (reason) uidMap.get(uid).add(reason);
    });
  } catch (error) {
    console.warn(`Não foi possível buscar candidatos por ${reason}:`, error);
  }
}

async function collectLegacyUidsByEmail(services, email = "") {
  const targetEmail = normalizeEmail(email);
  const uidMap = new Map();
  if (!targetEmail || !targetEmail.includes("@")) return uidMap;

  const addUid = (uid, reason = "email") => {
    const clean = String(uid || "").trim();
    if (!clean) return;
    if (!uidMap.has(clean)) uidMap.set(clean, new Set());
    uidMap.get(clean).add(reason);
  };

  // 1) users/{uid} com e-mail no documento raiz.
  for (const field of ["email", "ownerEmail", "userEmail"]) {
    await addQueryResultsToUidMap(
      services,
      uidMap,
      services.query(services.collection(services.db, "users"), services.where(field, "==", targetEmail)),
      `email:${field}`,
    );
  }

  // 2) users/{uid}/access/ninou costuma guardar o e-mail da conta autorizada.
  if (services.collectionGroup) {
    for (const field of ["email", "ownerEmail", "userEmail"]) {
      await addQueryResultsToUidMap(
        services,
        uidMap,
        services.query(services.collectionGroup(services.db, "access"), services.where(field, "==", targetEmail)),
        `email:access.${field}`,
      );
      await addQueryResultsToUidMap(
        services,
        uidMap,
        services.query(services.collectionGroup(services.db, "profile"), services.where(field, "==", targetEmail)),
        `email:profile.${field}`,
      );
    }
  }

  // 3) Se a busca automática já achou essa conta, reaproveita o UID.
  legacyCloudContexts.forEach((context) => {
    if (normalizeEmail(context.email || "") === targetEmail && context.uid) addUid(context.uid, "email:cache");
  });

  return uidMap;
}

async function buildLegacyCloudContextFromUser(services, userDoc) {
  const uid = userDoc.id;
  const rootData = userDoc.data() || {};
  const accessData = await readMaybeDoc(services, "users", uid, "access", "ninou");
  const profileMain = await readMaybeDoc(services, "users", uid, "profile", "main");
  const profileDocs = await readMaybeCollection(services, "users", uid, "profile");
  const profileData = profileMain || profileDocs.find((item) => item.id !== "main")?.data || null;
  const dayDocs = await readMaybeCollection(services, "users", uid, "days");
  const activityDocs = await readMaybeCollection(services, "users", uid, "activities");
  const weightDocs = await readMaybeCollection(services, "users", uid, "weights");
  const pesoDocs = await readMaybeCollection(services, "users", uid, "pesos");

  const email = normalizeEmail(accessData?.email || rootData.email || profileData?.email || rootData.ownerEmail || uid);
  const dayStates = {};

  dayDocs.forEach(({ id, data }) => {
    const source = data.state && typeof data.state === "object" ? data.state : data;
    addDayStateToMap(dayStates, id, source);
  });

  activityDocs.forEach(({ id, data }) => {
    const converted = normalizeLegacyActivityDocument(data, id);
    if (!converted) return;
    if (converted.kind === "day") addDayStateToMap(dayStates, converted.dayId || id, converted.dayState);
    if (converted.kind === "event") addEventToDayMap(dayStates, converted.event);
  });

  const profile = normalizeLegacyProfileData(rootData, profileData, accessData, { email });
  const photo = getLegacyPhoto(profileData, rootData);
  const wakeWindow = getLegacyWakeWindow(profileData, rootData);
  const weights = getLegacyWeights(
    profileData,
    rootData,
    { weights: weightDocs.map(({ id, data }) => ({ id, ...data })) },
    { pesos: pesoDocs.map(({ id, data }) => ({ id, ...data })) },
  );
  const eventsCount = Object.values(dayStates).reduce((total, item) => total + (Array.isArray(item.events) ? item.events.length : 0), 0);
  const hasProfile = hasProfileContent(profile, photo, wakeWindow);
  const hasDay = eventsCount > 0 || Object.values(dayStates).some(hasRoutineDayContent);
  const hasWeights = weights.length > 0;

  if (!hasProfile && !hasDay && !hasWeights) return null;

  const score = (hasProfile ? 100 : 0)
    + (photo ? 50 : 0)
    + Math.min(eventsCount, 80)
    + Math.min(Object.keys(dayStates).length * 8, 40)
    + Math.min(weights.length * 5, 25);

  return {
    source: "cloud",
    uid,
    email,
    profile,
    photo,
    wakeWindow,
    weights,
    dayStates,
    eventsCount,
    hasProfile,
    hasDay,
    hasWeights,
    score,
  };
}

async function scanLegacyCloudSources(options = {}) {
  if (!isFamilyAdmin()) return [];
  if (legacyCloudScanState === "loading") return legacyCloudContexts;

  legacyCloudScanState = "loading";
  legacyCloudScanError = "";
  renderFamilyMigrationPanel({ skipScan: true });

  try {
    const services = await getFirebaseServices();
    const uidMap = new Map();
    const addUid = (uid, reason = "") => {
      const clean = String(uid || "").trim();
      if (!clean) return;
      if (!uidMap.has(clean)) uidMap.set(clean, new Set());
      if (reason) uidMap.get(clean).add(reason);
    };

    // 1) Tenta listar users/{uid}. Isso só encontra documentos raiz existentes.
    try {
      const usersSnapshot = await services.getDocs(services.collection(services.db, "users"));
      (usersSnapshot.docs || []).forEach((docSnap) => addUid(docSnap.id, "users"));
    } catch (error) {
      console.warn("Não foi possível listar users. Tentando collectionGroup.", error);
    }

    // 2) Tenta collectionGroup. Isso ajuda quando users/{uid} é um documento fantasma
    // com subcoleções, situação comum no Firestore Console.
    const groupScan = await collectLegacyUidsByCollectionGroups(services);
    groupScan.uids.forEach((uid) => addUid(uid, "collectionGroup"));

    // 3) Inclui UID manual, quando o admin cola o UID antigo visível no Console.
    const manualUid = normalizeMigrationUid(adminMigrationUidInput?.value || "");
    if (manualUid) addUid(manualUid, "manual");

    const contexts = [];
    for (const uid of uidMap.keys()) {
      const context = await buildLegacyCloudContextFromUser(services, { id: uid, data: () => ({}) });
      if (context) {
        context.discovery = Array.from(uidMap.get(uid) || []);
        contexts.push(context);
      }
    }

    legacyCloudContexts = contexts.sort(compareMigrationContexts);
    legacyCloudScanState = "done";
    renderFamilyMigrationPanel({ skipScan: true });
    return legacyCloudContexts;
  } catch (error) {
    console.error("Erro ao buscar dados antigos no Firebase:", error);
    legacyCloudScanState = "error";
    legacyCloudScanError = getFirebaseErrorMessage(error);
    renderFamilyMigrationPanel({ skipScan: true });
    return [];
  }
}

function normalizeMigrationUid(value = "") {
  return String(value || "")
    .trim()
    .replace(/^users\//, "")
    .split("/")[0]
    .trim();
}

function normalizeMigrationEmail(value = "") {
  return normalizeEmail(value || "");
}

async function scanLegacySourceByManualEmail() {
  if (!isFamilyAdmin()) return null;
  const email = normalizeMigrationEmail(adminMigrationEmailInput?.value || "");
  if (!email || !email.includes("@")) {
    if (adminMigrationStatus) adminMigrationStatus.textContent = "Digite o e-mail antigo que aparece no Firebase, por exemplo francisco@gmail.com.";
    return null;
  }

  lastMigrationResult = null;

  if (scanLegacyEmailButton) {
    scanLegacyEmailButton.disabled = true;
    scanLegacyEmailButton.textContent = "Buscando...";
  }
  if (adminMigrationStatus) adminMigrationStatus.textContent = `Buscando dados ligados a ${email}...`;

  try {
    const services = await getFirebaseServices();
    const uidMap = await collectLegacyUidsByEmail(services, email);

    if (!uidMap.size) {
      const localMatch = getRestorableContexts().find((context) => normalizeEmail(context.email || "") === email);
      if (localMatch) {
        legacyCloudScanState = "done";
        renderFamilyMigrationPanel({ skipScan: true });
        return localMatch;
      }
      if (adminMigrationStatus) adminMigrationStatus.textContent = `Não encontrei UID com o e-mail ${email}. Tente colar o UID antigo que aparece em users/{uid}.`;
      return null;
    }

    const contexts = [];
    for (const [uid, reasons] of uidMap.entries()) {
      const context = await buildLegacyCloudContextFromUser(services, { id: uid, data: () => ({}) });
      if (context) {
        context.email = normalizeEmail(context.email || email) || email;
        context.manualEmail = email;
        context.discovery = Array.from(new Set([...(context.discovery || []), ...Array.from(reasons), "email"]));
        contexts.push(context);
      }
    }

    if (!contexts.length) {
      if (adminMigrationStatus) adminMigrationStatus.textContent = `Achei o e-mail ${email}, mas não encontrei perfil, peso ou rotina recuperável nesse UID.`;
      return null;
    }

    // Busca manual deve mostrar apenas a origem solicitada, sem misturar outros clientes encontrados antes.
    legacyCloudContexts = contexts.sort(compareMigrationContexts);
    legacyCloudScanState = "done";
    renderFamilyMigrationPanel({ skipScan: true });
    return contexts[0] || null;
  } catch (error) {
    console.error("Erro ao buscar e-mail legado:", error);
    if (adminMigrationStatus) adminMigrationStatus.textContent = getFirebaseErrorMessage(error);
    return null;
  } finally {
    if (scanLegacyEmailButton) {
      scanLegacyEmailButton.disabled = false;
      scanLegacyEmailButton.textContent = "Buscar por e-mail";
    }
  }
}

async function scanLegacySourceByManualUid() {
  if (!isFamilyAdmin()) return null;
  const uid = normalizeMigrationUid(adminMigrationUidInput?.value || "");
  if (!uid) {
    if (adminMigrationStatus) adminMigrationStatus.textContent = "Cole o UID antigo do Firebase para buscar manualmente.";
    return null;
  }

  lastMigrationResult = null;

  if (scanLegacyUidButton) {
    scanLegacyUidButton.disabled = true;
    scanLegacyUidButton.textContent = "Buscando...";
  }
  if (adminMigrationStatus) adminMigrationStatus.textContent = `Buscando dados no UID ${uid}...`;

  try {
    const services = await getFirebaseServices();
    const context = await buildLegacyCloudContextFromUser(services, { id: uid, data: () => ({}) });
    if (!context) {
      if (adminMigrationStatus) adminMigrationStatus.textContent = `Nenhum dado recuperável encontrado em users/${uid}. Abra users/${uid}/activities no Firebase e confira se há documentos.`;
      return null;
    }
    context.discovery = Array.from(new Set([...(context.discovery || []), "manual"]));
    // Busca manual por UID também deve isolar a origem escolhida.
    legacyCloudContexts = [context].sort(compareMigrationContexts);
    legacyCloudScanState = "done";
    renderFamilyMigrationPanel({ skipScan: true });
    return context;
  } catch (error) {
    console.error("Erro ao buscar UID manual:", error);
    if (adminMigrationStatus) adminMigrationStatus.textContent = getFirebaseErrorMessage(error);
    return null;
  } finally {
    if (scanLegacyUidButton) {
      scanLegacyUidButton.disabled = false;
      scanLegacyUidButton.textContent = "Buscar por UID";
    }
  }
}

function getMigrationContextPriority(context = {}) {
  const email = normalizeEmail(context.email || "");
  const name = normalizeEmail(context.profile?.name || "");
  const discoveries = Array.isArray(context.discovery) ? context.discovery : [];
  const isManual = discoveries.includes("manual");
  const isEmailSearch = discoveries.includes("email") || Boolean(context.manualEmail);
  const isExactEmailSearch = context.manualEmail && normalizeEmail(context.manualEmail) === email;

  // A v75.18 prioriza busca manual por e-mail/UID e fontes associadas ao Francisco.
  // Isso evita que dados de teste com foto/perfil tenham score maior e sejam migrados por engano.
  return (isExactEmailSearch ? 130000 : 0)
    + (isEmailSearch ? 120000 : 0)
    + (isManual ? 100000 : 0)
    + (email.includes("francisco") ? 20000 : 0)
    + (name.includes("francisco") ? 10000 : 0)
    + (Number(context.score) || 0);
}

function compareMigrationContexts(a = {}, b = {}) {
  return getMigrationContextPriority(b) - getMigrationContextPriority(a)
    || (Number(b.score) || 0) - (Number(a.score) || 0)
    || String(a.email || a.uid || "").localeCompare(String(b.email || b.uid || ""));
}

function getCombinedRestorableContexts() {
  const localContexts = getRestorableContexts()
    .map((context) => ({ ...context, source: "local", dayStates: { [getCurrentDayId()]: context.dayState }, eventsCount: context.eventsCount || 0 }));
  const byKey = new Map();
  [...legacyCloudContexts, ...localContexts].forEach((context) => {
    const key = `${context.source}:${context.uid || context.email}`;
    if (!byKey.has(key)) byKey.set(key, context);
  });
  return Array.from(byKey.values()).sort(compareMigrationContexts);
}

function getBestRestorableSource() {
  return getCombinedRestorableContexts()[0] || null;
}

function getChecklistItemMarkup(title, detail, ok = false) {
  return `<li class="${ok ? "is-ok" : ""}"><strong>${escapeHtml(title)}</strong><small>${escapeHtml(detail)}</small></li>`;
}

function renderMigrationChecklist(result = null, context = null) {
  if (!adminMigrationChecklist) return;

  if (result) {
    adminMigrationChecklist.innerHTML = `
      <span>Checklist pós-migração</span>
      <ul>
        ${getChecklistItemMarkup("Perfil familiar", `Atualizado em families/${result.familyId}/profile/main`, true)}
        ${getChecklistItemMarkup("Dias migrados", `${result.days} dia(s) copiados`, result.days > 0)}
        ${getChecklistItemMarkup("Registros migrados", `${result.events} registro(s) copiados`, result.events > 0)}
        ${getChecklistItemMarkup("Pesos migrados", `${result.weights || 0} peso(s) encontrado(s)`, (result.weights || 0) > 0)}
        ${getChecklistItemMarkup("Conta de origem", result.linkedSourceAccount ? "Vinculada como Responsável" : "Origem preservada; vínculo não confirmado", Boolean(result.linkedSourceAccount))}
        ${getChecklistItemMarkup("Destino", `families/${result.familyId}`, true)}
      </ul>`;
    return;
  }

  if (context) {
    const weightsCount = normalizeWeights(context.weights || context.profile?.weights || []).length;
    adminMigrationChecklist.innerHTML = `
      <span>Prévia da migração</span>
      <ul>
        ${getChecklistItemMarkup("Origem", context.email || context.uid || "Conta encontrada", true)}
        ${getChecklistItemMarkup("Registros", `${getContextEventsCount(context)} registro(s) em ${getContextDaysCount(context)} dia(s)`, getContextEventsCount(context) > 0)}
        ${getChecklistItemMarkup("Foto do bebê", context.photo ? "Foto encontrada" : "Nenhuma foto encontrada nesta origem", Boolean(context.photo))}
        ${getChecklistItemMarkup("Pesos", `${weightsCount} peso(s) encontrado(s)`, weightsCount > 0)}
        ${getChecklistItemMarkup("Destino planejado", `families/${familyAccess?.familyId || APP_ADMIN_FAMILY_ID}`, true)}
      </ul>`;
    return;
  }

  adminMigrationChecklist.innerHTML = `
    <span>Checklist</span>
    <ul>
      ${getChecklistItemMarkup("Aguardando busca", "Informe e-mail ou UID para iniciar o diagnóstico", false)}
      ${getChecklistItemMarkup("Sem varredura automática", "O painel não carrega clientes sem você pedir", true)}
    </ul>`;
}

function renderFamilyMigrationPanel(options = {}) {
  if (!adminMigrationStatus || !adminMigrationSources || !restoreFamilyDataButton) return;

  if (lastMigrationResult && !options.forceList) {
    const result = lastMigrationResult;
    adminMigrationStatus.textContent = `Migração concluída: ${result.events} registros em ${result.days} dia(s) foram copiados para a família selecionada. ${result.linkedSourceAccount ? `A conta ${result.sourceEmail || result.sourceUid} também foi vinculada como responsável.` : "Os dados antigos continuam preservados."}`;
    adminMigrationSources.innerHTML = `
      <li class="admin-migration-source is-best">
        <div>
          <strong>Destino atualizado</strong>
          <span>families/${escapeHtml(result.familyId)}/profile/main e families/${escapeHtml(result.familyId)}/days</span>
        </div>
        <small>Concluído</small>
      </li>`;
    restoreFamilyDataButton.hidden = true;
    renderMigrationChecklist(result);
    return;
  }

  if (!isFamilyAdmin()) {
    adminMigrationStatus.textContent = "Entre como admin para revisar e migrar dados antigos.";
    adminMigrationSources.innerHTML = "<li>Nenhuma conta em análise.</li>";
    restoreFamilyDataButton.hidden = true;
    renderMigrationChecklist(null);
    return;
  }

  const contexts = getCombinedRestorableContexts();
  const best = contexts[0] || null;

  if (legacyCloudScanState === "idle" && !best) {
    adminMigrationStatus.textContent = "Nenhuma busca iniciada. Para migrar dados antigos, informe o e-mail antigo ou o UID do Firebase. O painel admin não varre todos os clientes automaticamente.";
    adminMigrationSources.innerHTML = "<li>Use Buscar por e-mail ou Buscar por UID para carregar somente a origem desejada.</li>";
    restoreFamilyDataButton.hidden = true;
    renderMigrationChecklist(null);
    return;
  }

  if (legacyCloudScanState === "loading") {
    adminMigrationStatus.textContent = "Buscando dados antigos no Firebase e neste aparelho...";
    adminMigrationSources.innerHTML = contexts.length
      ? contexts.slice(0, 4).map((context, index) => `
        <li class="admin-migration-source${index === 0 ? " is-best" : ""}">
          <div><strong>${escapeHtml(context.email || context.uid || "Conta encontrada")}</strong><span>${escapeHtml(getContextBabyLabel(context))}</span></div>
          ${index === 0 ? "<small>Melhor opção até agora</small>" : ""}
        </li>`).join("")
      : "<li>Procurando em users, profile, days e activities...</li>";
    restoreFamilyDataButton.hidden = true;
    renderMigrationChecklist(best);
    return;
  }

  if (legacyCloudScanState === "error" && !best) {
    adminMigrationStatus.textContent = legacyCloudScanError || "Não foi possível buscar dados antigos no Firebase. Revise as regras do Firestore.";
    adminMigrationSources.innerHTML = "<li>Falha ao acessar dados legados. Publique as regras de migração e tente novamente.</li>";
    restoreFamilyDataButton.hidden = true;
    renderMigrationChecklist(null);
    return;
  }

  if (!best) {
    adminMigrationStatus.textContent = "Nenhum dado antigo encontrado automaticamente. Se você vê activities no Firebase, cole o UID antigo acima e toque em Buscar por UID.";
    adminMigrationSources.innerHTML = "<li>Nenhuma origem automática encontrada. Use a busca por UID se o documento users/{uid} só possuir subcoleções.</li>";
    restoreFamilyDataButton.hidden = true;
    renderMigrationChecklist(null);
    return;
  }

  adminMigrationStatus.textContent = `Busca carregada: ${getContextEventsCount(best)} registros em ${getContextDaysCount(best)} dia(s) de ${best.email || best.uid}. Confira a origem abaixo antes de migrar.`;
  adminMigrationSources.innerHTML = contexts.slice(0, 5).map((context, index) => `
    <li class="admin-migration-source${index === 0 ? " is-best" : ""}">
      <div>
        <strong>${escapeHtml(context.email || context.uid || "Conta encontrada")}</strong>
        <span>${escapeHtml(getContextBabyLabel(context))}</span>
      </div>
      ${context.discovery?.includes("email") ? "<small>Busca por e-mail</small>" : context.discovery?.includes("manual") ? "<small>UID manual</small>" : (index === 0 ? "<small>Melhor opção</small>" : `<small>${context.source === "cloud" ? "Firebase" : "Aparelho"}</small>`) }
    </li>
  `).join("");
  renderMigrationChecklist(null, best);
  restoreFamilyDataButton.hidden = false;
  restoreFamilyDataButton.disabled = false;
  restoreFamilyDataButton.textContent = best.source === "cloud" ? "Migrar dados do Firebase" : "Importar dados encontrados";
}

function applyMigrationContextToCurrentView(context) {
  if (!context) return false;

  const migratedWeights = normalizeWeights(context.weights || context.profile?.weights || []);
  const migratedProfile = normalizeBabyProfile({ ...(context.profile || createDefaultBabyProfile()), weights: migratedWeights });
  localStorage.setItem(storageKeys.profile, JSON.stringify(migratedProfile));
  if (context.photo) localStorage.setItem(storageKeys.photo, context.photo);
  else localStorage.removeItem(storageKeys.photo);
  localStorage.setItem(storageKeys.wakeWindow, String(context.wakeWindow || 70));
  localStorage.setItem(storageKeys.profileVersion, String(Date.now()));
  localStorage.setItem(storageKeys.weights, JSON.stringify(migratedWeights));

  const todayId = getCurrentDayId();
  const dayIds = Object.keys(context.dayStates || {}).filter(isDateId).sort();
  const latestDayId = dayIds.at(-1);
  const visibleDayId = (context.dayStates || {})[todayId] ? todayId : latestDayId;
  const currentDayState = (context.dayStates || {})[visibleDayId] || createEmptyDayState();
  localStorage.setItem(storageKeys.dayState, JSON.stringify(currentDayState));
  familyDayStatesCache = {
    ...familyDayStatesCache,
    ...Object.fromEntries(Object.entries(context.dayStates || {}).filter(([dayId]) => isDateId(dayId)).map(([dayId, dayState]) => [dayId, normalizeDayState(dayState)])),
  };
  if (visibleDayId) {
    setSelectedDiaryDayById(visibleDayId);
    familyDayIdsCache = Array.from(new Set([...familyDayIdsCache, ...dayIds])).filter(isDateId).sort();
    familyDayIdsCacheAt = Date.now();
    updateDiaryDateRangeFromFamilyDays();
  }

  wakeWindowMinutes = Number(localStorage.getItem(storageKeys.wakeWindow)) || 70;
  babyProfile = loadBabyProfile();
  currentProfilePhoto = localStorage.getItem(storageKeys.photo) || "";
  profileClientUpdatedAt = Number(localStorage.getItem(storageKeys.profileVersion)) || Date.now();
  state = loadLocalDayState();
  setVisibleDataOwnerEmail(normalizeEmail(cloudUser?.email || familyAccess?.email || GLOBAL_APP_ADMIN_EMAIL));
  persistVisibleContextForCurrentOwner();
  refreshVisibleContextUi();
  return true;
}

async function familyCloudHasContent() {
  if (!firebaseServices || !familyAccess?.familyId) return { profile: false, day: false };

  const profileRef = getCloudProfileRef();
  const dayRef = getCloudDayRef();
  let profile = false;
  let dayContent = false;

  try {
    if (profileRef) {
      const profileSnap = await firebaseServices.getDoc(profileRef);
      profile = profileSnap.exists() && hasCloudProfileContent(profileSnap.data() || {});
    }
  } catch (error) {
    console.warn("Não foi possível verificar perfil familiar:", error);
  }

  try {
    if (dayRef) {
      const daySnap = await firebaseServices.getDoc(dayRef);
      const dayData = daySnap.exists() ? (daySnap.data() || {}) : {};
      const daySource = dayData.state && typeof dayData.state === "object" ? dayData.state : dayData;
      dayContent = daySnap.exists() && hasRoutineDayContent(normalizeDayState(daySource));
    }
  } catch (error) {
    console.warn("Não foi possível verificar rotina familiar:", error);
  }

  return { profile, day: dayContent };
}

async function linkMigrationSourceAccountToFamily(context, familyId, sourceLabel) {
  const sourceUid = String(context?.uid || "").trim();
  const sourceEmail = normalizeEmail(context?.manualEmail || context?.email || "");
  if (!sourceUid) return false;

  const services = await getFirebaseServices();
  const role = "responsavel";
  const payload = {
    familyId,
    role,
    email: sourceEmail,
    ownerUid: cloudUser?.uid || familyId,
    migratedFrom: sourceLabel,
    migratedBy: cloudUser?.uid || "",
    migratedByEmail: cloudUser?.email || "",
    updatedAt: services.serverTimestamp(),
  };

  await services.setDoc(services.doc(services.db, "users", sourceUid, "access", "ninou"), payload, { merge: true });
  await services.setDoc(services.doc(services.db, "families", familyId, "members", sourceUid), {
    ...payload,
    uid: sourceUid,
    status: "active",
    joinedAt: services.serverTimestamp(),
  }, { merge: true });
  return true;
}

async function uploadMigrationContextToFamily(context) {
  const services = await getFirebaseServices();
  const familyId = getSelectedFamilyIdForAdminOrAccess();
  const sourceLabel = context.source === "cloud" ? `users/${context.uid || context.email}` : `cache/${context.email}`;
  const migrationId = `${Date.now()}-${String(context.uid || context.email || "origem").replace(/[^a-z0-9]+/gi, "-").slice(0, 32)}`;
  const normalizedWeights = normalizeWeights(context.weights || context.profile?.weights || []);
  const normalizedProfile = normalizeBabyProfile({
    ...(context.profile || createDefaultBabyProfile()),
    weights: normalizedWeights,
  });

  await services.setDoc(services.doc(services.db, "families", familyId), {
    ownerUid: cloudUser.uid,
    ownerEmail: cloudUser.email || "",
    title: normalizedProfile.name || "Família selecionada",
    customerLabel: "Cliente / família cadastrada",
    latestMigratedDayId: Object.keys(context.dayStates || {}).filter(isDateId).sort().at(-1) || "",
    migratedDayIds: Object.keys(context.dayStates || {}).filter(isDateId).sort(),
    updatedAt: services.serverTimestamp(),
  }, { merge: true });

  const linkedSourceAccount = await linkMigrationSourceAccountToFamily(context, familyId, sourceLabel);

  if (context.profile || context.photo || normalizedWeights.length) {
    await services.setDoc(services.doc(services.db, "families", familyId, "profile", "main"), {
      ...normalizedProfile,
      weights: normalizedWeights,
      wakeWindowMinutes: Number(context.wakeWindow) || 70,
      clientUpdatedAt: Date.now(),
      ...(context.photo ? { photo: context.photo } : {}),
      migratedFrom: sourceLabel,
      migratedAt: services.serverTimestamp(),
      updatedAt: services.serverTimestamp(),
    }, { merge: true });
  }

  const dayEntries = Object.entries(context.dayStates || {}).filter(([, dayState]) => hasRoutineDayContent(dayState));
  for (const [dayId, dayState] of dayEntries) {
    await services.setDoc(services.doc(services.db, "families", familyId, "days", dayId), {
      ...normalizeDayState(dayState),
      migratedFrom: sourceLabel,
      migratedAt: services.serverTimestamp(),
      updatedAt: services.serverTimestamp(),
    }, { merge: true });
  }

  const eventsMigrated = getContextEventsCount(context);
  await services.setDoc(services.doc(services.db, "families", familyId, "migrations", migrationId), {
    source: context.source || "unknown",
    sourceUid: context.uid || "",
    sourceEmail: context.email || "",
    manualEmail: context.manualEmail || "",
    daysMigrated: dayEntries.length,
    eventsMigrated,
    weightsMigrated: normalizedWeights.length,
    profileMigrated: Boolean(context.profile || context.photo || normalizedWeights.length),
    linkedSourceAccount,
    createdBy: cloudUser.uid,
    createdByEmail: cloudUser.email || "",
    createdAt: services.serverTimestamp(),
  }, { merge: true });

  return {
    familyId,
    days: dayEntries.length,
    events: eventsMigrated,
    weights: normalizedWeights.length,
    source: sourceLabel,
    linkedSourceAccount,
    sourceEmail: normalizeEmail(context.manualEmail || context.email || ""),
    sourceUid: context.uid || "",
  };
}

async function uploadCurrentContextToFamily() {
  await saveProfileToCloud({ includePhoto: Boolean(currentProfilePhoto) });
  await saveDayToCloud();
}

async function restoreFamilyDataFromBestSource(options = {}) {
  if (!isFamilyAdmin()) return false;
  if (legacyCloudScanState === "idle" && !legacyCloudContexts.length) {
    if (!options.silent && adminMigrationStatus) adminMigrationStatus.textContent = "Antes de migrar, busque uma origem específica por e-mail ou UID.";
    renderFamilyMigrationPanel({ skipScan: true });
    return false;
  }
  const context = getBestRestorableSource();
  if (!context) {
    if (!options.silent && adminMigrationStatus) adminMigrationStatus.textContent = "Nenhum dado antigo encontrado no Firebase ou neste aparelho para migrar.";
    renderFamilyMigrationPanel({ skipScan: true });
    return false;
  }

  if (!options.silent) {
    const destinationFamilyId = getSelectedFamilyIdForAdminOrAccess();
    const ok = window.confirm(`Copiar ${getContextEventsCount(context)} registros em ${getContextDaysCount(context)} dia(s) de ${context.email || context.uid} para a família selecionada?

Destino: families/${destinationFamilyId}

Os dados antigos não serão apagados.`);
    if (!ok) return false;
  }

  if (restoreFamilyDataButton) {
    restoreFamilyDataButton.disabled = true;
    restoreFamilyDataButton.textContent = "Migrando...";
  }
  if (adminMigrationStatus) adminMigrationStatus.textContent = `Migrando dados de ${context.email || context.uid}...`;

  try {
    const migrationResult = await uploadMigrationContextToFamily(context);
    resetFamilyDayCache();
    if (!isGlobalAppAdmin()) {
      await loadFamilyDayIds({ force: true });
      applyMigrationContextToCurrentView(context);
    } else {
      window.__ninouAdminFamilyDataOpen = false;
      resetVisibleContextForGuest();
      saveFamilyAccess(buildGlobalAdminAccess(cloudUser, getActiveAdminFamilyId()));
      await loadAdminAccountProfileFromCloud(cloudUser);
      showScreen("profile");
    }
    setSyncStatus("online", cloudUser?.email || "");
    if (loginHelper) loginHelper.textContent = "Dados migrados para a família principal sem abrir a rotina no painel admin.";
    lastMigrationResult = migrationResult;
    legacyCloudScanState = "done";
    renderFamilyMigrationPanel({ skipScan: true });
    return true;
  } catch (error) {
    console.error("Erro ao migrar dados para a família:", error);
    if (adminMigrationStatus) adminMigrationStatus.textContent = getFirebaseErrorMessage(error);
    setSyncStatus("offline", cloudUser?.email || "");
    return false;
  } finally {
    if (restoreFamilyDataButton) {
      restoreFamilyDataButton.disabled = false;
      restoreFamilyDataButton.textContent = "Migrar dados encontrados";
    }
  }
}

async function autoSeedFamilyFromLocalCache() {
  if (!isFamilyAdmin()) return false;
  const cloudContent = await familyCloudHasContent();
  if (cloudContent.profile || cloudContent.day) {
    renderFamilyMigrationPanel();
    return false;
  }
  await scanLegacyCloudSources({ silent: true });
  return restoreFamilyDataFromBestSource({ silent: true });
}

function getFamilyDisplayName(stats = null) {
  const raw = stats?.familyName || stats?.profileName || babyProfile?.name || "Francisco";
  return escapeHtml(raw || "Família");
}

function getPendingInviteText(count = 0) {
  const total = Number(count || 0);
  return total > 0 ? `${total} convite(s) pendente(s)` : "Sem convites pendentes";
}

function getKnownUserSourceLabel(user = {}) {
  const labels = {
    users: "Cadastro",
    account: "Perfil pessoal",
    access: "Acesso",
    profile: "Perfil antigo",
    member: "Membro",
    invite: "Convite",
  };
  const sources = Array.isArray(user.sources) ? user.sources : [];
  const unique = Array.from(new Set(sources.map((source) => labels[source] || source).filter(Boolean)));
  return unique.slice(0, 3).join(" • ") || "Firestore";
}

function getKnownUserStatusLabel(user = {}) {
  if (user.isAppAdmin) return "Admin do app";
  if (user.isMember) return "Membro da família selecionada";
  if (user.hasFamilyAccess) return "Tem acesso familiar";
  if (user.hasPendingInvite) return "Convite pendente";
  return "Sem vínculo com a família selecionada";
}

function scrollAdminSection(sectionId = "") {
  const target = document.getElementById(sectionId);
  if (!target) return;
  target.scrollIntoView({ behavior: "smooth", block: "start" });
}

function fillAdminInviteEmail(email = "") {
  if (!adminInviteEmail) return;
  adminInviteEmail.value = normalizeEmail(email);
  scrollAdminSection("adminInviteSection");
  setTimeout(() => adminInviteEmail?.focus?.(), 320);
}

function fillAdminMigrationEmail(email = "") {
  if (!adminMigrationEmailInput) return;
  adminMigrationEmailInput.value = normalizeEmail(email);
  scrollAdminSection("adminMigrationSection");
  setTimeout(() => adminMigrationEmailInput?.focus?.(), 320);
}

async function authorizeKnownUserAsCaregiver(uid = "", email = "") {
  const cleanUid = String(uid || "").trim();
  const cleanEmail = normalizeEmail(email || "");
  if (!isGlobalAppAdmin() || !cleanUid) return false;

  const services = await getFirebaseServices();
  const familyId = getSelectedFamilyIdForAdminOrAccess();
  const nowIso = new Date().toISOString();
  const payload = {
    familyId,
    role: "cuidador",
    email: cleanEmail,
    status: "active",
    inviteCode: "admin-manual",
    acceptedAt: nowIso,
    updatedAt: services.serverTimestamp(),
  };

  await services.setDoc(services.doc(services.db, "users", cleanUid, "access", "ninou"), payload, { merge: true });
  await services.setDoc(services.doc(services.db, "families", familyId, "members", cleanUid), {
    ...payload,
    joinedAt: services.serverTimestamp(),
    addedBy: cloudUser?.uid || "admin",
  }, { merge: true });

  if (cleanEmail) {
    await services.setDoc(services.doc(services.db, "users", cleanUid, "account", "profile"), {
      email: cleanEmail,
      updatedAt: services.serverTimestamp(),
    }, { merge: true });
  }

  if (loginHelper) loginHelper.textContent = `${cleanEmail || cleanUid} foi autorizado como cuidador desta família.`;
  await refreshAdminStats({ silent: true });
  return true;
}

function renderKnownUsersList(stats = null) {
  if (!adminKnownUsersList) return;

  if (!isGlobalAppAdmin()) {
    adminKnownUsersList.innerHTML = "<li>Entre como admin para localizar usuários cadastrados.</li>";
    return;
  }

  const users = Array.isArray(stats?.knownUsers) ? stats.knownUsers : [];
  if (!users.length) {
    adminKnownUsersList.innerHTML = "<li>Nenhum usuário adicional encontrado no Firestore. Usuários sem documento em users/{uid} só aparecem após criarem perfil, acesso ou convite.</li>";
    return;
  }

  adminKnownUsersList.innerHTML = users.slice(0, 24).map((user) => {
    const email = escapeHtml(user.email || "E-mail não identificado");
    const uid = escapeHtml(user.uid || "");
    const source = escapeHtml(getKnownUserSourceLabel(user));
    const status = escapeHtml(getKnownUserStatusLabel(user));
    const canLink = Boolean(user.uid && !user.isMember && !user.isAppAdmin);
    const safeEmailAttr = escapeHtml(user.email || "");
    const safeUidAttr = escapeHtml(user.uid || "");
    const primaryLine = user.uid ? `UID: ${uid}` : "Sem UID disponível no painel";
    const linkButton = canLink
      ? `<button type="button" data-link-known-user="${safeUidAttr}" data-link-known-email="${safeEmailAttr}">Autorizar como cuidador</button>`
      : "";
    const inviteButton = user.email && !user.isMember && !user.isAppAdmin
      ? `<button type="button" data-fill-invite-email="${safeEmailAttr}">Convidar</button>`
      : "";
    const migrateButton = user.email && !user.isAppAdmin
      ? `<button type="button" data-fill-migration-email="${safeEmailAttr}">Migrar dados</button>`
      : "";
    const createFamilyButtonMarkup = user.email && !user.hasFamilyAccess && !user.isAppAdmin
      ? `<button type="button" data-fill-new-family-responsible="${safeEmailAttr}">Criar família</button>`
      : "";
    const actions = [createFamilyButtonMarkup, inviteButton, linkButton, migrateButton].filter(Boolean).join("");

    return `
      <li class="admin-access-item admin-known-user-item ${user.isMember ? "is-member" : ""}">
        <div>
          <strong>${email}</strong>
          <span>${status} • ${source}</span>
          <small>${escapeHtml(primaryLine)}</small>
        </div>
        ${actions ? `<div class="admin-access-actions">${actions}</div>` : `<small>Já aparece em membros desta família.</small>`}
      </li>
    `;
  }).join("");
}

function renderAdminClients(stats = null) {
  const appAdmin = isGlobalAppAdmin();
  const previewOpen = Boolean(window.__ninouAdminFamilyDataOpen);
  const selectedId = getActiveAdminFamilyId();
  const families = Array.isArray(stats?.families) && stats.families.length
    ? stats.families
    : [{
        id: selectedId,
        name: stats?.familyName || "Francisco",
        subtitle: "Cliente / família cadastrada",
        membersCount: stats?.membersCount ?? 0,
        pendingInvitesCount: stats?.pendingInvitesCount ?? 0,
      }];

  if (adminClientsList) {
    if (!appAdmin) {
      adminClientsList.innerHTML = "<li>Entre como admin para visualizar famílias/clientes.</li>";
    } else {
      adminClientsList.innerHTML = families.map((family) => {
        const isSelected = family.id === selectedId;
        const membersLabel = Number.isFinite(Number(family.membersCount))
          ? pluralize(Number(family.membersCount), "membro", "membros")
          : "membros sob consulta";
        const pendingLabel = Number.isFinite(Number(family.pendingInvitesCount))
          ? getPendingInviteText(Number(family.pendingInvitesCount))
          : "convites sob consulta";
        return `
          <li class="admin-access-item admin-client-item ${isSelected ? "is-selected-family" : ""}">
            <div>
              <strong>${escapeHtml(family.name || "Família sem nome")}</strong>
              <span>${escapeHtml(family.subtitle || "Cliente / família cadastrada")} • ${escapeHtml(membersLabel)} • ${escapeHtml(pendingLabel)}</span>
              <span class="admin-client-id">ID: ${escapeHtml(family.id)}</span>
            </div>
            <div class="admin-access-actions">
              <small>${isSelected ? (previewOpen ? "Aberta no modo admin" : "Selecionada") : "Fechada"}</small>
              ${isSelected ? "" : `<button type="button" data-select-admin-family="${escapeHtml(family.id)}">Selecionar</button>`}
              <button type="button" data-open-admin-family="${escapeHtml(family.id)}">${isSelected && previewOpen ? "Rotina aberta" : "Abrir rotina"}</button>
            </div>
          </li>`;
      }).join("");
    }
  }

  if (adminSelectedFamilyHint) {
    const selectedLabel = getAdminSelectedFamilyLabel(stats);
    adminSelectedFamilyHint.textContent = previewOpen
      ? `Você está visualizando a rotina de ${selectedLabel} como administrador. Use Voltar ao painel para sair da visualização familiar.`
      : `Família selecionada: ${selectedLabel}. A rotina só abre quando você tocar em Abrir rotina.`;
  }

  if (adminOpenFamilyButton) {
    adminOpenFamilyButton.hidden = !appAdmin;
    adminOpenFamilyButton.disabled = !appAdmin || previewOpen;
    adminOpenFamilyButton.textContent = previewOpen ? "Rotina aberta" : "Abrir rotina da família selecionada";
  }

  if (adminReturnToPanelButton) {
    adminReturnToPanelButton.hidden = !appAdmin || !previewOpen;
  }

  if (adminPreviewBanner) {
    adminPreviewBanner.hidden = !appAdmin || !previewOpen;
  }
}

function renderAdminSupportAccess(stats = null) {
  const list = document.querySelector("#adminSupportAccessList");
  if (!list) return;
  if (!isGlobalAppAdmin()) {
    list.innerHTML = "<li>Entre como admin para visualizar o acesso administrativo.</li>";
    return;
  }
  const selectedLabel = getAdminSelectedFamilyLabel(stats);
  list.innerHTML = `
    <li class="admin-access-item admin-support-item">
      <div>
        <strong>${escapeHtml(cloudUser?.email || GLOBAL_APP_ADMIN_EMAIL)}</strong>
        <span>Admin do app — acesso de suporte</span>
        <small>Você pode abrir ${escapeHtml(selectedLabel)} para suporte, sem virar membro da família.</small>
      </div>
    </li>`;
}

function renderAdminAccessLists(stats = null) {
  renderAdminSupportAccess(stats);
  if (adminPendingInviteList) {
    const pending = Array.isArray(stats?.pendingInvites) ? stats.pendingInvites : [];
    if (!pending.length) {
      adminPendingInviteList.innerHTML = "<li>Nenhum convite pendente.</li>";
    } else {
      adminPendingInviteList.innerHTML = pending.slice(0, 8).map((invite) => {
        const code = escapeHtml(invite.code || "");
        const link = escapeHtml(buildInviteLink(invite.code || ""));
        return `
          <li class="admin-access-item">
            <div>
              <strong>${escapeHtml(invite.email || "Convite sem e-mail")}</strong>
              <span>${escapeHtml(getRoleLabel(invite.role))} • ${code}</span>
            </div>
            <div class="admin-access-actions">
              <button type="button" data-copy-invite="${code}">Copiar código</button>
              <button type="button" data-copy-invite="${link}">Copiar link</button>
              <button type="button" data-cancel-invite="${code}">Cancelar</button>
            </div>
          </li>
        `;
      }).join("");
    }
  }

  if (adminMembersList) {
    const members = Array.isArray(stats?.members) ? stats.members.filter((member) => !member.isAdmin) : [];
    if (!members.length) {
      adminMembersList.innerHTML = "<li>Nenhum membro autorizado ainda.</li>";
    } else {
      adminMembersList.innerHTML = members.slice(0, 12).map((member) => `
        <li class="admin-access-item admin-member-item">
          <div>
            <strong>${escapeHtml(member.email || "Usuário sem e-mail")}</strong>
            <span>${escapeHtml(getRoleLabel(member.role))}</span>
          </div>
          <small>${member.joinedAt ? "Membro ativo" : "Autorizado"}</small>
        </li>
      `).join("");
    }
  }

  renderKnownUsersList(stats);
}

function renderAdminStats(stats = null) {
  if (!adminPendingInvitesCount && !adminFamiliesCount && !adminKnownUsersStat) return;

  if (!stats) {
    setAdminStatsPlaceholder();
    renderAdminClients(null);
    renderAdminAccessLists(null);
    return;
  }

  setText(adminUsersCount, String(stats.membersCount ?? 0));
  setText(adminFamiliesCount, String(stats.familiesCount ?? 0));
  setText(adminKnownUsersStat, String(stats.knownUsersCount ?? 0));
  setText(adminPendingInvitesCount, String(stats.pendingInvitesCount ?? 0));
  setText(adminAcceptedInvitesCount, String(stats.acceptedInvitesCount ?? 0));
  setText(adminLastMigrationStatus, lastMigrationResult ? "Concluída" : "Sem migração");
  setText(
    adminStatsHint,
    `${pluralize(stats.familiesCount ?? 0, "família cadastrada", "famílias cadastradas")}. ${pluralize(stats.membersCount ?? 0, "membro", "membros")} na família selecionada e ${pluralize(stats.knownUsersCount ?? 0, "usuário encontrado", "usuários encontrados")} no Firestore.`,
  );
  renderAdminClients(stats);
  renderAdminAccessLists(stats);
  renderFamilyMigrationPanel();
}

async function refreshAdminStats(options = {}) {
  if (!isFamilyAdmin()) {
    renderAdminStats(null);
    return null;
  }

  if (isGlobalAppAdmin()) ensureGlobalAdminAccess(cloudUser, getActiveAdminFamilyId());

  const requestId = ++adminStatsRequestId;
  if (!options.silent) setAdminStatsPlaceholder("Atualizando painel...");
  if (refreshAdminStatsButton) refreshAdminStatsButton.disabled = true;

  try {
    const services = await getFirebaseServices();
    const familyId = getSelectedFamilyIdForAdminOrAccess();
    const [membersSnapshot, globalInvitesSnapshot, familiesSnapshot, familySnap, familyProfileSnap, usersSnapshot, accessSnapshot, accountSnapshot, profileSnapshot] = await Promise.all([
      services.getDocs(services.collection(services.db, "families", familyId, "members")),
      services.getDocs(services.collection(services.db, "invites")),
      services.getDocs(services.query(services.collection(services.db, "families"), services.limit(50))),
      services.getDoc(services.doc(services.db, "families", familyId)),
      services.getDoc(services.doc(services.db, "families", familyId, "profile", "main")),
      services.getDocs(services.query(services.collection(services.db, "users"), services.limit(80))),
      services.collectionGroup ? services.getDocs(services.query(services.collectionGroup(services.db, "access"), services.limit(120))) : Promise.resolve({ docs: [], forEach() {} }),
      services.collectionGroup ? services.getDocs(services.query(services.collectionGroup(services.db, "account"), services.limit(120))) : Promise.resolve({ docs: [], forEach() {} }),
      services.collectionGroup ? services.getDocs(services.query(services.collectionGroup(services.db, "profile"), services.limit(120))) : Promise.resolve({ docs: [], forEach() {} }),
    ]);

    const members = [];
    const memberUidSet = new Set();
    const memberEmailSet = new Set();
    membersSnapshot.forEach((memberDoc) => {
      const data = memberDoc.data() || {};
      if ((data.status || "active") === "removed") return;
      const email = normalizeEmail(data.email || "");
      const role = getEffectiveRole(data.role || "visualizacao", email);
      const isAdminMember = isGlobalAdminEmail(email) || role === "admin";
      if (!isAdminMember) {
        memberUidSet.add(memberDoc.id);
        if (email) memberEmailSet.add(email);
      }
      members.push({
        uid: memberDoc.id,
        email,
        role,
        isAdmin: isAdminMember,
        joinedAt: data.joinedAt || data.acceptedAt || data.updatedAt || null,
      });
    });
    members.sort((a, b) => Number(Boolean(b.isAdmin)) - Number(Boolean(a.isAdmin)) || String(a.email).localeCompare(String(b.email)));

    const pendingMap = new Map();
    const acceptedEmails = new Set();
    const invitedEmails = new Set();
    globalInvitesSnapshot.forEach((inviteDoc) => {
      const data = inviteDoc.data() || {};
      if (data.familyId !== familyId) return;
      const emailKey = normalizeEmail(data.email || inviteDoc.id);
      const status = data.status || "pending";
      if (emailKey) invitedEmails.add(emailKey);
      const invite = {
        code: data.code || inviteDoc.id,
        email: emailKey,
        role: normalizeInviteRole(data.role || "responsavel"),
        status,
      };
      if (status === "accepted" || status === "active") {
        acceptedEmails.add(emailKey);
        pendingMap.delete(emailKey);
      } else if (status === "pending" && !pendingMap.has(emailKey)) {
        pendingMap.set(emailKey, invite);
      }
    });

    acceptedEmails.forEach((email) => pendingMap.delete(email));
    const pendingInvites = Array.from(pendingMap.values()).filter((invite) => invite.email);

    const knownUserMap = new Map();
    const addKnownUser = (uid = "", data = {}, source = "users", path = "") => {
      const cleanUid = String(uid || "").trim();
      const email = normalizeEmail(data.email || data.ownerEmail || data.userEmail || data.accountEmail || "");
      if (!cleanUid && !email) return;
      const key = cleanUid || `email:${email}`;
      const existing = knownUserMap.get(key) || {
        uid: cleanUid,
        email,
        role: "",
        familyId: "",
        sources: [],
        paths: [],
        hasFamilyAccess: false,
        hasPendingInvite: false,
        isMember: false,
      };
      if (!existing.uid && cleanUid) existing.uid = cleanUid;
      if (!existing.email && email) existing.email = email;
      if (data.role && !existing.role) existing.role = normalizeRole(data.role);
      if (data.familyId && !existing.familyId) existing.familyId = data.familyId;
      if (data.familyId === familyId) existing.hasFamilyAccess = true;
      if (!existing.sources.includes(source)) existing.sources.push(source);
      if (path && !existing.paths.includes(path)) existing.paths.push(path);
      knownUserMap.set(key, existing);
    };

    usersSnapshot.forEach((userDoc) => addKnownUser(userDoc.id, userDoc.data() || {}, "users", userDoc.ref?.path || ""));
    accessSnapshot.forEach((docSnap) => {
      const path = docSnap.ref?.path || "";
      const uid = getLegacyUidFromPath(path);
      if (!uid) return;
      addKnownUser(uid, docSnap.data() || {}, "access", path);
    });
    accountSnapshot.forEach((docSnap) => {
      const path = docSnap.ref?.path || "";
      const uid = getLegacyUidFromPath(path);
      if (!uid) return;
      addKnownUser(uid, docSnap.data() || {}, "account", path);
    });
    const familyProfileById = new Map();
    profileSnapshot.forEach((docSnap) => {
      const path = docSnap.ref?.path || "";
      const uid = getLegacyUidFromPath(path);
      const profileFamilyId = getFamilyIdFromProfilePath(path);
      if (profileFamilyId) familyProfileById.set(profileFamilyId, docSnap.data() || {});
      if (!uid) return;
      addKnownUser(uid, docSnap.data() || {}, "profile", path);
    });
    members.filter((member) => !member.isAdmin).forEach((member) => addKnownUser(member.uid, { email: member.email, role: member.role, familyId }, "member", `families/${familyId}/members/${member.uid}`));
    invitedEmails.forEach((email) => addKnownUser("", { email, familyId }, "invite", `invites/${email}`));

    const knownUsers = Array.from(knownUserMap.values()).map((user) => {
      const email = normalizeEmail(user.email || "");
      const isMember = (user.uid && memberUidSet.has(user.uid)) || (email && memberEmailSet.has(email));
      return {
        ...user,
        email,
        isAppAdmin: isGlobalAdminEmail(email),
        isMember,
        hasFamilyAccess: Boolean(user.hasFamilyAccess || isMember),
        hasPendingInvite: Boolean(email && pendingMap.has(email)),
      };
    }).sort((a, b) => Number(Boolean(b.isMember)) - Number(Boolean(a.isMember))
      || String(a.email || a.uid).localeCompare(String(b.email || b.uid)));

    const familyData = familySnap.exists?.() ? (familySnap.data() || {}) : {};
    const familyProfileData = familyProfileSnap.exists?.() ? (familyProfileSnap.data() || {}) : {};
    const familyName = familyProfileData.name || familyData.name || familyData.title || "Francisco";
    const familySummaries = [];
    familiesSnapshot.forEach((familyDoc) => {
      const data = familyDoc.data() || {};
      const profile = familyDoc.id === familyId ? familyProfileData : (familyProfileById.get(familyDoc.id) || {});
      familySummaries.push({
        id: familyDoc.id,
        name: profile.name || data.name || data.title || (familyDoc.id === APP_ADMIN_FAMILY_ID ? "Francisco" : `Família ${familyDoc.id.slice(0, 8)}`),
        subtitle: data.customerLabel || data.subtitle || "Cliente / família cadastrada",
        membersCount: familyDoc.id === familyId ? members.filter((member) => !member.isAdmin).length : (Number.isFinite(Number(data.membersCount)) ? Number(data.membersCount) : null),
        pendingInvitesCount: familyDoc.id === familyId ? pendingInvites.length : (Number.isFinite(Number(data.pendingInvitesCount)) ? Number(data.pendingInvitesCount) : null),
      });
    });
    if (!familySummaries.some((family) => family.id === familyId)) {
      familySummaries.unshift({ id: familyId, name: familyName, subtitle: "Cliente / família cadastrada", membersCount: members.filter((member) => !member.isAdmin).length, pendingInvitesCount: pendingInvites.length });
    }
    familySummaries.sort((a, b) => Number(b.id === familyId) - Number(a.id === familyId) || String(a.name).localeCompare(String(b.name)));

    const visibleMembers = members.filter((member) => !member.isAdmin);
    const stats = {
      familyName,
      familyData,
      families: familySummaries,
      members,
      pendingInvites,
      knownUsers,
      familiesCount: familySummaries.length,
      membersCount: visibleMembers.length,
      pendingInvitesCount: pendingInvites.length,
      acceptedInvitesCount: acceptedEmails.size,
      knownUsersCount: knownUsers.length,
    };
    if (requestId === adminStatsRequestId) renderAdminStats(stats);
    return stats;
  } catch (error) {
    console.error("Erro ao carregar painel admin:", error);
    if (requestId === adminStatsRequestId) {
      setAdminStatsPlaceholder("Não foi possível carregar o painel. Revise as regras do Firestore.");
      renderKnownUsersList(null);
    }
    return null;
  } finally {
    if (refreshAdminStatsButton) refreshAdminStatsButton.disabled = false;
  }
}

function renderInviteList() {
  if (!inviteList) return;
  if (!recentInvites.length) {
    inviteList.innerHTML = "<li>Nenhum convite gerado neste aparelho.</li>";
    return;
  }

  inviteList.innerHTML = recentInvites.slice(0, 5).map((invite) => `
    <li>
      <strong>${escapeHtml(invite.email || "Convite sem e-mail")}</strong>
      <span>${escapeHtml(getRoleLabel(invite.role))} • ${escapeHtml(invite.code)}</span>
    </li>
  `).join("");
}

function renderFamilyAccessPanel() {
  const connected = isLoggedIn();
  const authorized = hasFamilyAccess();
  const appAdmin = isGlobalAppAdmin();
  const admin = isFamilyAdmin();
  const email = cloudUser?.email || familyAccess?.email || "";
  const effectiveRole = authorized ? getEffectiveRole(familyAccess.role, email) : "";

  if (familyAccessTitle) {
    familyAccessTitle.textContent = authorized
      ? (appAdmin ? "Painel admin" : "Família conectada")
      : connected
        ? "Conta aguardando convite"
        : "Convites e permissões";
  }

  if (familyAccessText) {
    familyAccessText.textContent = authorized
      ? (appAdmin
        ? `Você está conectado como admin. Os dados da família não são abertos automaticamente; o painel mostra apenas convites, membros e migração.`
        : `${email} está conectado como ${getRoleLabel(effectiveRole)}. Os registros são sincronizados no ambiente da família.`)
      : connected
        ? "Esta conta ainda não possui convite. Peça um convite ao administrador do app ou entre com o e-mail convidado."
        : "Visitantes podem conhecer o app. Para registrar dados, entre com usuário e senha ou solicite acesso pelo WhatsApp.";
  }

  if (familyAccessBadge) {
    familyAccessBadge.textContent = authorized ? (appAdmin ? "Admin" : getRoleLabel(effectiveRole)) : connected ? "Sem convite" : "Visitante";
    familyAccessBadge.dataset.role = authorized ? effectiveRole : "offline";
  }

  if (createFamilyButton) {
    // Botão aparece somente quando o admin ainda precisa ativar a família pela primeira vez.
    createFamilyButton.hidden = !connected || !appAdmin || authorized;
    createFamilyButton.textContent = "Ativar família principal";
  }

  if (inviteAcceptBox) {
    // Evita mostrar código antigo na tela de visitante/desconectado.
    inviteAcceptBox.hidden = !connected || appAdmin || authorized;
  }

  if (adminInvitePanel) {
    adminInvitePanel.hidden = !admin;
  }

  if (admin) {
    refreshAdminStats({ silent: true });
  } else {
    renderAdminStats(null);
  }
  renderFamilyMigrationPanel();
  renderAdminClients();

  if (acceptInviteButton) {
    acceptInviteButton.disabled = !connected || appAdmin;
    acceptInviteButton.textContent = appAdmin ? "Admin não precisa de convite" : "Aceitar convite";
  }

  if (inviteCodeInput) {
    inviteCodeInput.disabled = !connected || appAdmin;
    if (!connected || appAdmin || authorized) {
      inviteCodeInput.value = "";
    } else if (pendingInviteCode && !inviteCodeInput.value) {
      inviteCodeInput.value = pendingInviteCode;
    }
  }

  if (familyWelcomeCard) {
    const showWelcome = connected && authorized && !appAdmin;
    familyWelcomeCard.hidden = !showWelcome;
    if (showWelcome) {
      const roleLabel = getRoleLabel(effectiveRole);
      const baby = getBabyDisplayName();
      if (familyWelcomeTitle) familyWelcomeTitle.textContent = `Você acompanha a rotina de ${baby}.`;
      if (familyWelcomeText) familyWelcomeText.textContent = `Seu acesso: ${roleLabel}. ${effectiveRole === "visualizacao" ? "Você pode acompanhar os registros." : "Você pode participar da rotina conforme sua permissão."}`;
    }
  }

  renderInviteList();
}

async function readAccountAccessFromCloud(user = cloudUser) {
  if (!user) return null;
  const services = await getFirebaseServices();
  const accessRef = services.doc(services.db, "users", user.uid, "access", "ninou");
  const snapshot = await services.getDoc(accessRef);
  if (!snapshot.exists()) return null;
  const data = snapshot.data() || {};
  return saveFamilyAccess({
    familyId: data.familyId,
    role: data.role,
    email: data.email || user.email || "",
    ownerUid: data.ownerUid || "",
    inviteCode: data.inviteCode || "",
    acceptedAt: data.acceptedAt || data.createdAt || "",
  });
}

async function saveAccountAccessToCloud(access, user = cloudUser) {
  if (!user || !access?.familyId) return null;
  const payload = {
    familyId: access.familyId,
    role: getEffectiveRole(access.role, access.email || user.email || ""),
    email: normalizeEmail(access.email || user.email || ""),
    ownerUid: access.ownerUid || access.familyId,
  };

  if (access.inviteCode) {
    payload.inviteCode = normalizeInviteCode(access.inviteCode);
  }

  if (isGlobalAppAdmin(user)) {
    return saveFamilyAccess({ ...payload, updatedAt: new Date().toISOString(), acceptedAt: new Date().toISOString() });
  }

  const services = await getFirebaseServices();
  payload.updatedAt = services.serverTimestamp();
  await services.setDoc(services.doc(services.db, "users", user.uid, "access", "ninou"), payload, { merge: true });
  await services.setDoc(services.doc(services.db, "families", access.familyId, "members", user.uid), {
    ...payload,
    uid: user.uid,
    status: "active",
    joinedAt: services.serverTimestamp(),
  }, { merge: true });

  return saveFamilyAccess({ ...payload, acceptedAt: new Date().toISOString() });
}

async function activatePersonalFamily() {
  if (!cloudUser) {
    if (loginHelper) loginHelper.textContent = "Entre antes de ativar sua família.";
    return null;
  }

  if (!isGlobalAppAdmin()) {
    if (loginHelper) loginHelper.textContent = "Apenas o e-mail administrador do app pode ativar a família principal.";
    return null;
  }

  const access = buildGlobalAdminAccess(cloudUser, getActiveAdminFamilyId());
  saveFamilyAccess(access);
  renderAuthControls();

  try {
    const services = await getFirebaseServices();
    const familyPayload = {
      supportAdminUid: cloudUser.uid,
      supportAdminEmail: cloudUser.email || "",
      customerLabel: "Cliente / família cadastrada",
      createdAt: services.serverTimestamp(),
      updatedAt: services.serverTimestamp(),
    };
    if (access.familyId === APP_ADMIN_FAMILY_ID) familyPayload.title = "Francisco";
    await services.setDoc(services.doc(services.db, "families", access.familyId), familyPayload, { merge: true });
    // O admin tem acesso global por regra, não precisa virar membro da família.
    // Isso evita que clientes pareçam "família do admin".
    // Admin não abre nem grava dados da família automaticamente.
    // Isso evita vazar dados de um bebê/cliente no painel administrativo.
    setSyncStatus("online", cloudUser.email || "");
    if (loginHelper) loginHelper.textContent = "Admin do app conectado. Você já pode gerar convites no Perfil.";
    refreshAdminStats({ silent: true });
  } catch (error) {
    console.error("Erro ao ativar família principal no Firebase:", error);
    setSyncStatus("offline", cloudUser.email || "");
    if (loginHelper) {
      loginHelper.textContent = "Admin liberado neste aparelho. Para gerar convites e sincronizar, revise as regras do Firestore.";
    }
    setAdminStatsPlaceholder("Admin liberado. A contagem depende das regras do Firestore.");
  }

  renderAuthControls();
  return familyAccess;
}

async function cancelFamilyInvite(codeValue = "") {
  const code = normalizeInviteCode(codeValue);
  if (!code || !isFamilyAdmin()) return false;
  try {
    const services = await getFirebaseServices();
    await services.setDoc(services.doc(services.db, "invites", code), {
      status: "cancelled",
      cancelledBy: cloudUser.uid,
      cancelledAt: services.serverTimestamp(),
      updatedAt: services.serverTimestamp(),
    }, { merge: true });
    try {
      await services.setDoc(services.doc(services.db, "families", getSelectedFamilyIdForAdminOrAccess(), "invites", code), {
        status: "cancelled",
        cancelledBy: cloudUser.uid,
        cancelledAt: services.serverTimestamp(),
        updatedAt: services.serverTimestamp(),
      }, { merge: true });
    } catch (mirrorError) {
      console.warn("Convite cancelado na coleção principal, mas não no espelho:", mirrorError);
    }
    await refreshAdminStats();
    if (inviteResult) {
      inviteResult.hidden = false;
      inviteResult.textContent = "Convite cancelado.";
    }
    return true;
  } catch (error) {
    console.error("Erro ao cancelar convite:", error);
    if (inviteResult) {
      inviteResult.hidden = false;
      inviteResult.textContent = getFirebaseErrorMessage(error);
    }
    return false;
  }
}

async function createAdminClientFamily() {
  if (!cloudUser || !isGlobalAppAdmin()) {
    if (loginHelper) loginHelper.textContent = "Apenas o admin do app pode criar famílias/clientes.";
    return null;
  }

  const familyNameRaw = String(adminNewFamilyNameInput?.value || "").trim();
  const babyNameRaw = String(adminNewBabyNameInput?.value || "").trim();
  const responsibleEmail = normalizeEmail(adminNewResponsibleEmailInput?.value || "");
  const babyArticle = (adminNewBabyArticleInput?.value === "a") ? "a" : "o";

  if (!familyNameRaw && !babyNameRaw) {
    if (adminCreateFamilyResult) {
      adminCreateFamilyResult.hidden = false;
      adminCreateFamilyResult.textContent = "Informe pelo menos o nome da família ou o nome do bebê.";
    }
    adminNewFamilyNameInput?.focus();
    return null;
  }

  if (responsibleEmail && !responsibleEmail.includes("@")) {
    if (adminCreateFamilyResult) {
      adminCreateFamilyResult.hidden = false;
      adminCreateFamilyResult.textContent = "Confira o e-mail do responsável ou deixe o campo em branco.";
    }
    adminNewResponsibleEmailInput?.focus();
    return null;
  }

  const babyName = babyNameRaw || familyNameRaw.replace(/^família\s+/i, "").replace(/^familia\s+/i, "") || "Bebê";
  const familyName = familyNameRaw || `Família ${babyName}`;
  const familyId = createFamilyIdFromNames(familyName, babyName);
  const services = await getFirebaseServices();

  if (adminCreateClientFamilyButton) {
    adminCreateClientFamilyButton.disabled = true;
    adminCreateClientFamilyButton.textContent = "Criando...";
  }
  if (adminCreateFamilyResult) {
    adminCreateFamilyResult.hidden = false;
    adminCreateFamilyResult.textContent = "Criando família/cliente...";
  }

  try {
    const familyPayload = {
      title: familyName,
      name: familyName,
      babyName,
      babyArticle,
      customerLabel: "Cliente / família cadastrada",
      status: "active",
      supportAdminUid: cloudUser.uid,
      supportAdminEmail: cloudUser.email || "",
      membersCount: 0,
      pendingInvitesCount: responsibleEmail ? 1 : 0,
      createdByAdmin: cloudUser.uid,
      createdByAdminEmail: cloudUser.email || "",
      createdAt: services.serverTimestamp(),
      updatedAt: services.serverTimestamp(),
    };

    await services.setDoc(services.doc(services.db, "families", familyId), familyPayload, { merge: true });
    await services.setDoc(services.doc(services.db, "families", familyId, "profile", "main"), {
      name: babyName,
      familyName,
      article: babyArticle,
      weights: [],
      createdByAdmin: cloudUser.uid,
      clientUpdatedAt: new Date().toISOString(),
      updatedAt: services.serverTimestamp(),
    }, { merge: true });

    let inviteMarkup = "";
    if (responsibleEmail) {
      const role = "responsavel";
      const code = createInviteCodeForEmail(responsibleEmail, familyId);
      const link = buildInviteLink(code);
      const payload = {
        code,
        familyId,
        email: responsibleEmail,
        role,
        status: "pending",
        createdBy: cloudUser.uid,
        createdByEmail: cloudUser.email || "",
        createdAt: services.serverTimestamp(),
        updatedAt: services.serverTimestamp(),
      };
      await services.setDoc(services.doc(services.db, "invites", code), payload, { merge: true });
      await services.setDoc(services.doc(services.db, "families", familyId, "invites", code), payload, { merge: true });
      recentInvites.unshift({ code, email: responsibleEmail, role, link });
      renderInviteList();
      inviteMarkup = `
        <span>Convite de responsável criado para ${escapeHtml(responsibleEmail)}</span>
        <span>Código: ${escapeHtml(code)}</span>
        <button type="button" data-copy-invite="${escapeHtml(link)}">Copiar link do convite</button>`;
    }

    saveSelectedAdminFamilyId(familyId);
    ensureGlobalAdminAccess(cloudUser, familyId);
    window.__ninouAdminFamilyDataOpen = false;

    if (adminCreateFamilyResult) {
      adminCreateFamilyResult.innerHTML = `
        <strong>Família criada</strong>
        <span>${escapeHtml(familyName)} foi selecionada no painel.</span>
        <span>ID: ${escapeHtml(familyId)}</span>
        ${inviteMarkup || "<span>Agora você pode criar um convite para o responsável.</span>"}`;
    }

    if (adminNewFamilyNameInput) adminNewFamilyNameInput.value = "";
    if (adminNewBabyNameInput) adminNewBabyNameInput.value = "";
    if (adminNewResponsibleEmailInput) adminNewResponsibleEmailInput.value = "";
    if (loginHelper) loginHelper.textContent = "Família criada e selecionada no painel admin.";
    await refreshAdminStats({ silent: true });
    return familyId;
  } catch (error) {
    console.error("Erro ao criar família/cliente:", error);
    if (adminCreateFamilyResult) adminCreateFamilyResult.textContent = getFirebaseErrorMessage(error);
    return null;
  } finally {
    if (adminCreateClientFamilyButton) {
      adminCreateClientFamilyButton.disabled = false;
      adminCreateClientFamilyButton.textContent = "Criar família/cliente";
    }
  }
}

async function createFamilyInvite() {
  if (!cloudUser || !isFamilyAdmin()) {
    if (loginHelper) loginHelper.textContent = "Apenas o admin do app pode gerar convites.";
    return;
  }

  const email = normalizeEmail(adminInviteEmail?.value || "");
  const role = normalizeInviteRole(adminInviteRole?.value || "responsavel");

  if (!email || !email.includes("@")) {
    if (inviteResult) {
      inviteResult.hidden = false;
      inviteResult.textContent = "Digite o e-mail do convidado.";
    }
    adminInviteEmail?.focus();
    return;
  }

  const services = await getFirebaseServices();
  const familyId = getSelectedFamilyIdForAdminOrAccess();
  const familyLabel = getAdminSelectedFamilyLabel();
  const code = createInviteCodeForEmail(email, familyId);
  const inviteRef = services.doc(services.db, "invites", code);
  const link = buildInviteLink(code);

  createInviteButton.disabled = true;
  if (inviteResult) {
    inviteResult.hidden = false;
    inviteResult.textContent = "Gerando convite...";
  }

  try {
    const existingSnapshot = await services.getDoc(inviteRef);
    if (existingSnapshot.exists()) {
      const existing = existingSnapshot.data() || {};
      const existingStatus = existing.status || "pending";
      if (existingStatus === "accepted" || existingStatus === "active") {
        if (inviteResult) {
          inviteResult.innerHTML = `
            <strong>Convite já aceito</strong>
            <span>${escapeHtml(email)} já está autorizado na família selecionada.</span>
            <button type="button" data-copy-invite="${escapeHtml(link)}">Copiar link novamente</button>
          `;
        }
        recentInvites.unshift({ code, email, role: existing.role || role, link });
        renderInviteList();
        refreshAdminStats({ silent: true });
        return;
      }
    }

    const payload = {
      code,
      familyId,
      email,
      role,
      status: "pending",
      createdBy: cloudUser.uid,
      createdByEmail: cloudUser.email || "",
      updatedAt: services.serverTimestamp(),
    };

    if (!existingSnapshot.exists()) {
      payload.createdAt = services.serverTimestamp();
    }

    await services.setDoc(inviteRef, payload, { merge: true });
    await cleanupDuplicatePendingInvites(services, email, familyId, code);

    try {
      await services.setDoc(services.doc(services.db, "families", familyId, "invites", code), payload, { merge: true });
    } catch (mirrorError) {
      console.warn("Convite criado na coleção principal, mas não foi espelhado na família:", mirrorError);
    }

    recentInvites.unshift({ code, email, role, link });
    renderInviteList();
    refreshAdminStats({ silent: true });
    if (inviteResult) {
      inviteResult.innerHTML = `
        <strong>Convite pronto</strong>
        <span>Família: ${escapeHtml(familyLabel)}</span>
        <span>Código: ${escapeHtml(code)}</span>
        <span>Envie para: ${escapeHtml(email)}</span>
        <button type="button" data-copy-invite="${escapeHtml(link)}">Copiar link</button>
      `;
    }
    if (adminInviteEmail) adminInviteEmail.value = "";
  } catch (error) {
    console.error("Erro ao criar convite:", error);
    if (inviteResult) {
      inviteResult.textContent = error?.code === "permission-denied"
        ? "Sem permissão para criar convite. Publique as regras Firestore da v75.12 e confirme que está logado com luizfelipe.dasilva@gmail.com."
        : getFirebaseErrorMessage(error);
    }
  } finally {
    createInviteButton.disabled = false;
  }
}

async function acceptFamilyInvite(codeValue = inviteCodeInput?.value || pendingInviteCode || "", options = {}) {
  const code = normalizeInviteCode(codeValue);
  const previousLabel = acceptInviteButton?.textContent || "Aceitar convite";

  const setAccepting = (isAccepting) => {
    if (!acceptInviteButton) return;
    acceptInviteButton.disabled = isAccepting;
    acceptInviteButton.textContent = isAccepting ? "Aceitando convite..." : previousLabel;
  };

  if (!code) {
    if (!options.silent && loginHelper) loginHelper.textContent = "Digite o código de convite.";
    inviteCodeInput?.focus();
    return false;
  }

  if (!cloudUser) {
    pendingInviteCode = code;
    localStorage.setItem(storageKeys.pendingInvite, code);
    if (!options.silent && loginHelper) loginHelper.textContent = "Entre ou crie sua conta para aceitar o convite.";
    showScreen("profile");
    return false;
  }

  if (isGlobalAppAdmin()) {
    if (!options.silent && loginHelper) loginHelper.textContent = "A conta admin do app não precisa aceitar convite.";
    return false;
  }

  setAccepting(true);

  try {
    const services = await getFirebaseServices();
    const inviteRef = services.doc(services.db, "invites", code);
    const snapshot = await services.getDoc(inviteRef);

    if (!snapshot.exists()) {
      if (!options.silent && loginHelper) loginHelper.textContent = "Convite não encontrado ou expirado.";
      return false;
    }

    const invite = snapshot.data() || {};
    const inviteEmail = normalizeEmail(invite.email || "");
    const userEmail = normalizeEmail(cloudUser.email || "");

    if (invite.status && invite.status !== "pending" && invite.status !== "active") {
      if (!options.silent && loginHelper) loginHelper.textContent = "Este convite já foi usado ou cancelado.";
      return false;
    }

    if (inviteEmail && inviteEmail !== userEmail) {
      if (!options.silent && loginHelper) loginHelper.textContent = `Este convite foi criado para ${inviteEmail}. Entre com esse e-mail.`;
      return false;
    }

    const access = {
      familyId: String(invite.familyId || ""),
      role: normalizeInviteRole(invite.role),
      email: userEmail,
      ownerUid: invite.createdBy || invite.ownerUid || "",
      inviteCode: code,
      acceptedAt: new Date().toISOString(),
    };

    if (!access.familyId) {
      if (!options.silent && loginHelper) loginHelper.textContent = "Convite inválido: família não encontrada.";
      return false;
    }

    await saveAccountAccessToCloud(access);
    await services.setDoc(inviteRef, {
      status: "accepted",
      acceptedBy: cloudUser.uid,
      acceptedByEmail: userEmail,
      acceptedAt: services.serverTimestamp(),
      updatedAt: services.serverTimestamp(),
    }, { merge: true });

    try {
      await services.setDoc(services.doc(services.db, "families", access.familyId, "invites", code), {
        ...invite,
        ...access,
        code,
        status: "accepted",
        acceptedBy: cloudUser.uid,
        acceptedByEmail: userEmail,
        acceptedAt: services.serverTimestamp(),
        updatedAt: services.serverTimestamp(),
      }, { merge: true });
    } catch (mirrorError) {
      console.warn("Convite aceito, mas o espelho da família não foi atualizado:", mirrorError);
    }

    pendingInviteCode = "";
    localStorage.removeItem(storageKeys.pendingInvite);
    if (inviteCodeInput) inviteCodeInput.value = "";
    if (!options.silent && loginHelper) loginHelper.textContent = "Convite aceito. Rotina familiar conectada.";
    renderAuthControls();
    const cloudContentAfterInvite = await familyCloudHasContent();
    if (!cloudContentAfterInvite.profile && hasProfileContent()) await saveProfileToCloud({ includePhoto: Boolean(currentProfilePhoto) });
    if (!cloudContentAfterInvite.day && hasRoutineDayContent()) await saveDayToCloud();
    await connectCurrentAccount();
    setSyncStatus("online", cloudUser.email || "");
    showScreen("today");
    renderAll();
    return true;
  } catch (error) {
    console.error("Erro ao aceitar convite:", error);
    if (!options.silent && loginHelper) {
      loginHelper.textContent = error?.code === "permission-denied"
        ? "Sem permissão para aceitar convite. Publique as regras Firestore da v75.12 e confirme se o convite é para este e-mail."
        : getFirebaseErrorMessage(error);
    }
    return false;
  } finally {
    setAccepting(false);
    renderAuthControls();
  }
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
  pushAuditEntry("adicionou", wakeEvent);
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
  persistVisibleContextForCurrentOwner();
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
  const weights = normalizeWeights(data.weights || profileSource.weights || []);
  return hasProfileContent(profileSource, photoValue, cloudWakeWindow) || weights.length > 0;
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

  if (isGlobalAppAdmin() && activeScreenName === "profile" && !window.__ninouAdminFamilyDataOpen) {
    if (diaryTitle) diaryTitle.textContent = "Painel admin";
    if (babyAgeLine) babyAgeLine.textContent = "Convites, membros, migração e gestão de acessos";
    if (profileBabyName) profileBabyName.textContent = getAdminAccountLabel();
    if (profileBabyAge) profileBabyAge.textContent = "Perfil pessoal do administrador";
    if (profilePhoto) profilePhoto.src = adminAccountPhoto || "./icons/icon-192.png";
    if (profilePhotoButtonText) profilePhotoButtonText.textContent = "Trocar minha foto";
  } else if (profilePhotoButtonText) {
    profilePhotoButtonText.textContent = "Trocar foto";
  }
  updateBodyModeClasses();
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
  const familyId = getActiveFamilyId();
  if (!familyId) return null;
  return firebaseServices.doc(firebaseServices.db, "families", familyId, "profile", "main");
}

function getCloudDayRef(dayId = getSelectedDayId()) {
  if (!firebaseServices || !cloudUser) return null;
  const familyId = getActiveFamilyId();
  if (!familyId) return null;
  return firebaseServices.doc(firebaseServices.db, "families", familyId, "days", dayId);
}

async function loadFamilyDayIds(options = {}) {
  if (!firebaseServices || !cloudUser || !hasFamilyAccess()) return [];
  const now = Date.now();
  if (!options.force && familyDayIdsCache.length && now - familyDayIdsCacheAt < 30000) return familyDayIdsCache;

  try {
    const familyId = getActiveFamilyId();
    const snap = await firebaseServices.getDocs(firebaseServices.collection(firebaseServices.db, "families", familyId, "days"));
    const ids = [];
    const states = {};
    snap.forEach((docSnap) => {
      const id = docSnap.id;
      if (!isDateId(id)) return;
      const data = docSnap.data() || {};
      const normalized = normalizeDayState(data.state && typeof data.state === "object" ? data.state : data);
      states[id] = normalized;
      if (hasRoutineDayContent(normalized)) ids.push(id);
    });
    ids.sort();
    familyDayIdsCache = ids;
    familyDayStatesCache = states;
    familyDayIdsCacheAt = now;
    updateDiaryDateRangeFromFamilyDays(ids);
    return ids;
  } catch (error) {
    console.warn("Não foi possível listar dias da família:", error);
    return familyDayIdsCache || [];
  }
}

function updateDiaryDateRangeFromFamilyDays(dayIds = familyDayIdsCache) {
  if (!diaryDateInput) return;
  const todayId = getCurrentDayId();
  const fallbackMin = toDateInputValue(getDayStart() - 30 * day);
  const validIds = (dayIds || []).filter(isDateId).sort();
  diaryDateInput.min = validIds[0] && validIds[0] < fallbackMin ? validIds[0] : fallbackMin;
  diaryDateInput.max = todayId;
}

async function maybeOpenLatestFamilyDayAfterEmptyToday(dayId = getSelectedDayId()) {
  if (autoSelectedLatestFamilyDay || dayId !== getCurrentDayId()) return false;
  const ids = await loadFamilyDayIds({ force: true });
  const latest = ids.at(-1);
  if (!latest || latest === getCurrentDayId()) return false;

  autoSelectedLatestFamilyDay = true;
  setSelectedDiaryDayById(latest);
  timelineRenderSignature = "";
  await subscribeToCloudDay(latest, { allowAutoLatest: false });
  return true;
}

function unsubscribeCloudListeners() {
  if (profileUnsubscribe) profileUnsubscribe();
  if (dayUnsubscribe) dayUnsubscribe();
  profileUnsubscribe = null;
  dayUnsubscribe = null;
}


function updateBodyModeClasses() {
  const appAdmin = Boolean(isGlobalAppAdmin());
  const previewOpen = Boolean(window.__ninouAdminFamilyDataOpen);
  document.body.classList.toggle("global-admin-mode", appAdmin && !previewOpen);
  document.body.classList.toggle("admin-panel-only", appAdmin && !previewOpen);
  document.body.classList.toggle("admin-family-preview", appAdmin && previewOpen);
  renderAdminClients();
}

function renderAuthControls() {
  const connected = isLoggedIn();
  const authorized = hasFamilyAccess();
  const appAdmin = isGlobalAppAdmin();
  const routineAuthorized = authorized && (!appAdmin || Boolean(window.__ninouAdminFamilyDataOpen));
  loginButton.textContent = connected ? "Conectado" : "Entrar";
  loginButton.disabled = connected;
  createAccountButton.textContent = connected ? "Sair" : "Criar conta";
  createAccountButton.classList.toggle("logout-button", connected);
  loginEmail.disabled = connected;
  loginPassword.disabled = connected;
  document.body.classList.toggle("access-locked", false);
  updateBodyModeClasses();
  openSheetButtons.forEach((button) => {
    const shouldHide = !routineAuthorized;
    button.hidden = shouldHide;
    button.setAttribute("aria-hidden", shouldHide ? "true" : "false");
  });
  updateGuestWhatsappButton();
  renderFamilyAccessPanel();
}

function clearLocalAccountData() {
  // Privacidade no aparelho: ao sair da conta, os dados da família logada são guardados
  // em cache separado por e-mail e a visualização volta para o modo visitante sem dados.
  localStorage.removeItem(storageKeys.email);
  resetVisibleContextForGuest();
  saveFamilyAccess(null);
  clearPendingInviteCode();
  window.__ninouAdminFamilyDataOpen = false;
  resetMigrationSearchState();
  cloudUser = null;
  pendingProfilePhotoSave = false;
  if (loginPassword) loginPassword.value = "";
  renderAuthControls();
  renderAll();
}

async function openAdminFamilyPreview(familyId = getActiveAdminFamilyId()) {
  if (!isGlobalAppAdmin()) return false;
  ensureGlobalAdminAccess(cloudUser, familyId);
  window.__ninouAdminFamilyDataOpen = true;
  updateBodyModeClasses();
  setSyncStatus("loading", cloudUser?.email || "");
  try {
    await connectCurrentAccount();
    setSyncStatus("online", cloudUser?.email || "");
    if (loginHelper) loginHelper.textContent = `Visualizando ${getAdminSelectedFamilyLabel()} como administrador.`;
    showScreen("today");
    renderAdminClients();
    return true;
  } catch (error) {
    console.error("Erro ao abrir visualização familiar:", error);
    window.__ninouAdminFamilyDataOpen = false;
    updateBodyModeClasses();
    if (loginHelper) loginHelper.textContent = getFirebaseErrorMessage(error);
    renderAdminClients();
    return false;
  }
}

async function returnToAdminPanel() {
  if (!isGlobalAppAdmin()) return;
  unsubscribeCloudListeners();
  window.__ninouAdminFamilyDataOpen = false;
  prepareAdminPanelContext(cloudUser);
  ensureGlobalAdminAccess(cloudUser, getActiveAdminFamilyId());
  await loadAdminAccountProfileFromCloud(cloudUser);
  setSyncStatus("online", cloudUser?.email || "");
  if (loginHelper) loginHelper.textContent = "Admin conectado. Painel administrativo ativo.";
  renderAuthControls();
  renderAll();
  showScreen("profile");
}

async function connectCurrentAccount() {
  resetFamilyDayCache();
  autoSelectedLatestFamilyDay = false;
  await subscribeToCloudProfile();
  await loadFamilyDayIds({ force: true });
  await subscribeToCloudDay(getSelectedDayId());
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
  const profileSource = data.babyProfile && typeof data.babyProfile === "object" ? data.babyProfile : data;
  const cloudWeights = normalizeWeights(data.weights || profileSource.weights || []);
  const localWeights = normalizeWeights(babyProfile.weights || loadLocalWeights());
  const shouldAcceptCloudWeights = cloudWeights.length > 0 && localWeights.length === 0;
  const shouldAcceptCloudPhoto = Boolean((data.photo || data.photoDataUrl) && !currentProfilePhoto);

  if (!cloudHasContent && localHasContent) {
    saveProfileToCloud({ includePhoto: Boolean(currentProfilePhoto) });
    return;
  }

  if (localHasContent && profileClientUpdatedAt && cloudProfileVersion < profileClientUpdatedAt && !shouldAcceptCloudWeights && !shouldAcceptCloudPhoto) {
    return;
  }

  applyingCloudState = true;
  try {
    profileClientUpdatedAt = Math.max(cloudProfileVersion, profileClientUpdatedAt);

    babyProfile = normalizeBabyProfile({ ...profileSource, weights: cloudWeights.length ? cloudWeights : profileSource.weights });
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

    persistVisibleContextForCurrentOwner();
    syncBabyProfileForm();
    wakeWindowInput.value = String(wakeWindowMinutes);
    wakeWindowValue.textContent = String(wakeWindowMinutes);
    renderAll();
  } finally {
    applyingCloudState = false;
  }
}

function applyCloudDay(data = {}, dayId = getSelectedDayId()) {
  applyingCloudState = true;
  const daySource = data.state && typeof data.state === "object" ? data.state : data;
  state = normalizeDayState(daySource);
  if (isDateId(dayId)) {
    familyDayStatesCache = { ...familyDayStatesCache, [dayId]: normalizeDayState(state) };
    if (hasRoutineDayContent(state) && !familyDayIdsCache.includes(dayId)) {
      familyDayIdsCache = [...familyDayIdsCache, dayId].filter(isDateId).sort();
      updateDiaryDateRangeFromFamilyDays();
    }
  }
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
      setSyncStatus("offline", cloudUser.email);
      loginHelper.textContent = "Dados preservados neste aparelho. A sincronização será retomada após ajustar conexão ou regras do Firestore.";
    }
  }
}

function scheduleDayCloudSave(dayId = getSelectedDayId()) {
  if (applyingCloudState || !cloudUser || !firebaseServices) return;

  const safeDayId = isDateId(dayId) ? dayId : getCurrentDayId();
  window.clearTimeout(dayCloudSaveTimer);
  dayCloudSaveTimer = window.setTimeout(() => saveDayToCloud(safeDayId), 500);
}

async function saveDayToCloud(dayId = getSelectedDayId()) {
  const safeDayId = isDateId(dayId) ? dayId : getCurrentDayId();
  const dayRef = getCloudDayRef(safeDayId);
  if (!dayRef || applyingCloudState) return;
  if (!hasRoutineDayContent()) return;

  try {
    await firebaseServices.setDoc(
      dayRef,
      {
        ...normalizeDayState(state),
        updatedAt: firebaseServices.serverTimestamp(),
      },
      { merge: true },
    );
    familyDayStatesCache = { ...familyDayStatesCache, [safeDayId]: normalizeDayState(state) };
    if (!familyDayIdsCache.includes(safeDayId)) familyDayIdsCache = [...familyDayIdsCache, safeDayId].filter(isDateId).sort();
    updateDiaryDateRangeFromFamilyDays();
    setSyncStatus("online", cloudUser.email);
  } catch (error) {
    console.error("Erro ao salvar rotina:", error);
    setSyncStatus("offline", cloudUser.email);
    loginHelper.textContent = "Dados preservados neste aparelho. A sincronização será retomada após ajustar conexão ou regras do Firestore.";
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
    setSyncStatus("offline", cloudUser?.email || "");
  });
}

async function subscribeToCloudDay(dayId = getSelectedDayId(), options = {}) {
  const safeDayId = isDateId(dayId) ? dayId : getCurrentDayId();
  const dayRef = getCloudDayRef(safeDayId);
  if (!dayRef) return;

  if (dayUnsubscribe) dayUnsubscribe();

  dayUnsubscribe = firebaseServices.onSnapshot(dayRef, async (snapshot) => {
    if (!snapshot.exists()) {
      if (safeDayId === getCurrentDayId() && hasRoutineDayContent()) {
        saveDayToCloud(safeDayId);
      } else if (options.allowAutoLatest !== false && safeDayId === getCurrentDayId()) {
        const switched = await maybeOpenLatestFamilyDayAfterEmptyToday(safeDayId);
        if (!switched) {
          state = createEmptyDayState();
          saveLocalDayState();
          renderAll();
        }
      } else {
        state = createEmptyDayState();
        saveLocalDayState();
        renderAll();
      }
      return;
    }

    applyCloudDay(snapshot.data(), safeDayId);
  }, (error) => {
    console.error("Erro ao ler rotina:", error);
    setSyncStatus("offline", cloudUser?.email || "");
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
      loginHelper.textContent = "Entre com sua conta. Novos usuários acessam por convite do administrador do app.";
      return;
    }

    prepareVisibleContextForAccount(user);
    localStorage.setItem(storageKeys.email, user.email || "");
    loginEmail.value = user.email || "";

    setSyncStatus("loading", user.email || "");
    renderAuthControls();
    loginHelper.textContent = "Verificando acesso familiar...";

    try {
      if (isGlobalAppAdmin(user)) {
        prepareAdminPanelContext(user);
        resetMigrationSearchState();
        clearPendingInviteCode();
        ensureGlobalAdminAccess(user);
        renderAuthControls();
        loginHelper.textContent = "Admin conectado. Preparando painel...";
        await activatePersonalFamily();
        await loadAdminAccountProfileFromCloud(user);
        loginHelper.textContent = "Admin conectado. Painel administrativo ativo.";
        renderAuthControls();
        showScreen("profile");
        return;
      }

      let restoredAccess = null;
      try {
        restoredAccess = await readAccountAccessFromCloud(user);
      } catch (error) {
        console.error("Erro ao ler acesso familiar:", error);
        restoredAccess = null;
      }
      if (!restoredAccess) saveFamilyAccess(null);

      if (pendingInviteCode) {
        await acceptFamilyInvite(pendingInviteCode, { silent: true });
      }

      if (!hasFamilyAccess()) {
        loginHelper.textContent = "Conta conectada. Aceite um convite do administrador do app.";
        setSyncStatus("offline", user.email || "");
        renderAuthControls();
        showScreen("profile");
        return;
      }

      await connectCurrentAccount();
      setSyncStatus("online", user.email || "");
      loginHelper.textContent = `Conta conectada como ${getRoleLabel(getEffectiveRole(familyAccess.role, user.email || ""))}.`;
      renderAuthControls();
    } catch (error) {
      console.error("Erro ao conectar família:", error);
      setSyncStatus("offline", user.email || "");
      loginHelper.textContent = "Conta conectada, mas a sincronização ainda precisa das regras corretas do Firestore.";
      renderAuthControls();
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
  const events = getFamilyEventsForWindow(windowStart, windowEnd);
  const rangeState = getDayIdFromStart(windowStart) === getSelectedDayId() ? state : { ...createEmptyDayState(), events };
  return calculateSleepMsForRange(events, rangeState, windowStart, windowEnd, isSleepEvent);
}

function getRoutineStartForRange(windowStart, windowEnd) {
  const events = getFamilyEventsForWindow(windowStart, windowEnd);
  return calculateRoutineStartForRange(events, { ...createEmptyDayState(), events }, windowStart, windowEnd);
}

function getAwakeMsForRange(windowStart, windowEnd) {
  const events = getFamilyEventsForWindow(windowStart, windowEnd);
  const rangeState = getDayIdFromStart(windowStart) === getSelectedDayId() ? state : { ...createEmptyDayState(), events };
  return calculateAwakeMsForRange(events, rangeState, windowStart, windowEnd, isSleepEvent);
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
  return buildFamilyReportDays(7).map((item) => {
    const sleepEvents = item.events.filter((event) => isSleepEvent(event));
    const sleepMs = sleepEvents.reduce((total, event) => total + Math.max(0, Math.min(event.end, item.end) - Math.max(event.start, item.start)), 0);
    return { ...item, events: sleepEvents, sleepMs };
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
  return buildFamilyReportDays(count);
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
    state: buildFamilyStateForRecentWindow(7),
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
    state: buildFamilyStateForRecentWindow(5),
    todayStart: getDayStart(),
    dayMs: day,
    getDayLabel,
  });
}

function renderIntelligentHomeSections() {
  const todayStart = getDayStart();
  const now = Date.now();
  const recentFamilyState = buildFamilyStateForRecentWindow(7, todayStart);
  renderSmartInsight({
    container: smartInsightCard,
    state: recentFamilyState,
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
    state: recentFamilyState,
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
    state: recentFamilyState,
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

function getBabyDisplayName() {
  return getBabyName() || "bebê";
}

function getLatestEventByTypes(events = [], types = []) {
  const typeSet = new Set(types);
  return [...events].filter((event) => typeSet.has(event.type)).sort((a, b) => Number(b.start) - Number(a.start))[0] || null;
}

function getLatestSleepEvent(events = []) {
  return [...events].filter((event) => isSleepEvent(event) && Number(event.end) > Number(event.start)).sort((a, b) => Number(b.start) - Number(a.start))[0] || null;
}

function getBottleAmountText(event) {
  const detail = String(event?.detail || "").trim();
  const ml = detail.match(/(\d+(?:[,.]\d+)?)\s*ml/i)?.[0] || "";
  return ml ? ` • ${ml}` : "";
}

function renderTodayOverview() {
  if (!todayOverviewGrid) return;
  const todayStart = getDayStart();
  const now = Date.now();
  const events = getFamilyEventsForWindow(todayStart, todayStart + day);
  const baby = getBabyDisplayName();
  const lastBottle = getLatestEventByTypes(events, ["mamadeira"]);
  const lastDiaper = getLatestEventByTypes(events, ["fralda"]);
  const lastSleep = getLatestSleepEvent(events);
  const awakeText = state.mode === "sleeping"
    ? "Dormindo agora"
    : Number.isFinite(Number(state.activeStartedAt))
      ? formatShortDuration(Math.max(0, now - Number(state.activeStartedAt)))
      : formatShortDuration(getAwakeMsForRange(todayStart, Math.min(todayStart + day, now)));
  const napText = lastSleep
    ? `${formatTime(lastSleep.start)}–${formatTime(lastSleep.end)}`
    : "Sem registro";
  const bottleText = lastBottle ? `${formatTime(lastBottle.start)}${getBottleAmountText(lastBottle)}` : "Sem registro";
  const diaperText = lastDiaper ? `${formatTime(lastDiaper.start)}${lastDiaper.detail && lastDiaper.detail !== "Não se aplica" ? ` • ${lastDiaper.detail}` : ""}` : "Sem registro";

  if (todayOverviewTitle) todayOverviewTitle.textContent = `Hoje com ${baby}`;
  if (todayOverviewKicker) todayOverviewKicker.textContent = getDayLabel(todayStart) || "Hoje";
  todayOverviewGrid.innerHTML = [
    ["Última mamadeira", bottleText],
    ["Última fralda", diaperText],
    ["Última soneca", napText],
    ["Tempo acordado", awakeText],
  ].map(([label, value]) => `<article><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></article>`).join("");

  if (todayOverviewSuggestion) {
    let suggestion = "Registre a primeira ação para o Ninou montar um acompanhamento gentil.";
    if (state.mode === "sleeping") suggestion = `${baby} está dormindo agora. O resumo será atualizado quando acordar.`;
    else if (Number.isFinite(Number(state.activeStartedAt))) {
      const awakeMs = now - Number(state.activeStartedAt);
      const targetMs = wakeWindowMinutes * 60000;
      if (awakeMs >= targetMs * 0.85) suggestion = `${baby} está acordado há ${formatShortDuration(awakeMs)}. Talvez seja hora de observar sinais de sono.`;
      else suggestion = `Rotina em andamento. Próxima janela de sono estimada em ${formatShortDuration(Math.max(0, targetMs - awakeMs))}.`;
    } else if (events.length) suggestion = `Hoje já há ${events.length} ${events.length === 1 ? "registro" : "registros"}. O Ninou segue acompanhando o dia.`;
    todayOverviewSuggestion.textContent = suggestion;
  }
}

function renderGentleAlert() {
  if (!gentleAlertCard) return;
  const todayStart = getDayStart();
  const now = Date.now();
  const events = getFamilyEventsForWindow(todayStart, todayStart + day);
  const baby = getBabyDisplayName();
  const lastFeed = getLatestEventByTypes(events, ["mamadeira", "amamentacao"]);
  const lastDiaper = getLatestEventByTypes(events, ["fralda"]);
  let title = "Rotina tranquila";
  let text = "O Ninou mostrará lembretes leves conforme os registros aparecerem.";
  let show = false;

  if (state.mode === "awake" && Number.isFinite(Number(state.activeStartedAt))) {
    const awakeMs = now - Number(state.activeStartedAt);
    if (awakeMs >= wakeWindowMinutes * 60000) {
      title = `${baby} está acordado há ${formatShortDuration(awakeMs)}`;
      text = "Talvez seja um bom momento para observar bocejos, irritação ou sinais de sono.";
      show = true;
    }
  }

  if (!show && lastFeed && now - Number(lastFeed.start) >= 3 * hour) {
    title = `Já faz ${formatShortDuration(now - Number(lastFeed.start))} desde a última alimentação`;
    text = "Apenas um lembrete gentil para conferir se está tudo bem com a rotina.";
    show = true;
  }

  if (!show && lastDiaper && now - Number(lastDiaper.start) >= 4 * hour) {
    title = `Última fralda às ${formatTime(lastDiaper.start)}`;
    text = "Quando fizer sentido para vocês, vale conferir a próxima troca.";
    show = true;
  }

  gentleAlertCard.hidden = !show;
  if (show) {
    gentleAlertCard.innerHTML = `<span>🌿 Lembrete gentil</span><strong>${escapeHtml(title)}</strong><p>${escapeHtml(text)}</p>`;
  }
}

function renderDaySummaryCard() {
  if (!daySummaryText) return;
  const todayStart = getDayStart();
  const now = Date.now();
  const events = getFamilyEventsForWindow(todayStart, todayStart + day);
  const sleepMs = getSleepMsForRange(todayStart, Math.min(todayStart + day, now));
  const feeds = countFeedingEvents(events);
  const diapers = countDiaperEvents(events);
  const naps = events.filter((event) => isSleepEvent(event) && Number(event.end) > Number(event.start)).length;
  const meds = countMedicationEvents(events);
  const latest = [...events].sort((a, b) => Number(b.start) - Number(a.start))[0] || null;
  if (daySummaryMoment) daySummaryMoment.textContent = new Date(now).getHours() >= 20 ? "Fechamento do dia" : "Em andamento";
  if (!events.length) {
    daySummaryText.textContent = `Nenhum registro ainda. Quando ${getBabyDisplayName()} mamar, dormir ou trocar fralda, use os botões rápidos para começar o diário.`;
    return;
  }
  const latestTitle = latest ? getEventConfig(latest.type).title.toLowerCase() : "registro";
  const parts = [
    `${feeds} ${feeds === 1 ? "alimentação" : "alimentações"}`,
    `${diapers} ${diapers === 1 ? "fralda" : "fraldas"}`,
    `${naps} ${naps === 1 ? "sono" : "sonos"}`,
  ];
  if (meds) parts.push(`${meds} ${meds === 1 ? "medicamento" : "medicamentos"}`);
  daySummaryText.textContent = `Hoje: ${parts.join(", ")}. Total de sono: ${formatShortDuration(sleepMs)}. Último registro: ${latestTitle} às ${latest ? formatTime(latest.start) : "--"}.`;
}

function getSortedWeightsAsc() {
  return normalizeWeights(babyProfile.weights || loadLocalWeights()).sort((a, b) => a.date.localeCompare(b.date));
}

function formatKg(value) {
  return `${Number(value).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 3 })} kg`;
}

function renderSparkline(container, weights = []) {
  if (!container) return;
  if (weights.length < 2) {
    container.innerHTML = `<span>Gráfico aparece com 2 pesos</span>`;
    return;
  }
  const values = weights.map((item) => Number(item.value));
  const min = Math.min(...values);
  const max = Math.max(...values);
  const spread = Math.max(0.001, max - min);
  container.innerHTML = weights.slice(-8).map((item) => {
    const height = Math.max(10, Math.round(((Number(item.value) - min) / spread) * 70 + 18));
    return `<i style="--h:${height}%" title="${escapeHtml(item.date)} • ${escapeHtml(formatKg(item.value))}"><b></b></i>`;
  }).join("");
}

function renderGrowthPanels() {
  const weights = getSortedWeightsAsc();
  const latest = weights[weights.length - 1];
  const previous = weights[weights.length - 2];
  const targetWeightEls = [todayGrowthWeight, trendGrowthWeight].filter(Boolean);
  const targetHintEls = [todayGrowthHint, trendGrowthHint].filter(Boolean);

  if (!latest) {
    targetWeightEls.forEach((el) => { el.textContent = "Sem peso cadastrado"; });
    targetHintEls.forEach((el) => { el.textContent = "Cadastre pesos no perfil para acompanhar a evolução."; });
    if (trendGrowthStatus) trendGrowthStatus.textContent = "Acompanhe no perfil";
    renderSparkline(todayWeightSparkline, []);
    renderSparkline(trendWeightSparkline, []);
    return;
  }

  const delta = previous ? Number(latest.value) - Number(previous.value) : 0;
  const deltaText = previous ? `${delta >= 0 ? "+" : ""}${Math.round(delta * 1000)} g desde ${previous.date.split("-").reverse().join("/")}` : "Primeiro peso registrado";
  const latestDate = latest.date.split("-").reverse().join("/");
  targetWeightEls.forEach((el) => { el.textContent = formatKg(latest.value); });
  targetHintEls.forEach((el) => { el.textContent = `Último registro: ${latestDate}. ${deltaText}.`; });
  if (trendGrowthStatus) trendGrowthStatus.textContent = `${weights.length} ${weights.length === 1 ? "peso" : "pesos"}`;
  renderSparkline(todayWeightSparkline, weights);
  renderSparkline(trendWeightSparkline, weights);
}

function renderAuditTrail() {
  if (!auditTrailList) return;
  const items = (Array.isArray(state.auditLog) ? state.auditLog : []).slice(-8).reverse();
  if (!items.length) {
    auditTrailList.innerHTML = "<li>Nenhuma alteração registrada nesta data.</li>";
    return;
  }
  auditTrailList.innerHTML = items.map((item) => {
    const actor = item.byName || item.byEmail || "este aparelho";
    const when = item.at ? formatTime(new Date(item.at).getTime()) : "--:--";
    return `<li><strong>${escapeHtml(item.title || "Registro")}</strong><span>${escapeHtml(item.action || "alterou")} por ${escapeHtml(actor)} • ${escapeHtml(when)}</span></li>`;
  }).join("");
}

function renderProductExperienceSections() {
  renderTodayOverview();
  renderGentleAlert();
  renderDaySummaryCard();
  renderGrowthPanels();
  renderAuditTrail();
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
  renderGrowthPanels();
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
  renderProductExperienceSections();
  renderFamilyAccessPanel();
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
  renderProductExperienceSections();
}

function finishSleep() {
  if (!requireLogin("salvar a rotina")) return;
  const finishedAt = Date.now();
  const activeType = state.activeType || "sono";
  const beforeIds = new Set((state.events || []).map((event) => event.id));
  state = finishActiveSleep(state, makeEvent, finishedAt);
  (state.events || []).filter((event) => !beforeIds.has(event.id)).forEach((event) => pushAuditEntry("adicionou", event));
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
  // Visitantes podem navegar pelas telas para conhecer o Ninou.
  // O bloqueio acontece apenas nas ações que gravam/alteram dados via requireLogin().
  activeScreenName = target || activeScreenName;
  updateScreenVisibility({ target, navButtons, screens });
  renderBabyIdentity();
  updateBodyModeClasses();
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

async function setDiaryDate(value) {
  setSelectedDiaryDayById(value || getCurrentDayId());
  timelineRenderSignature = "";
  if (firebaseServices && cloudUser && hasFamilyAccess()) {
    await subscribeToCloudDay(getSelectedDayId(), { allowAutoLatest: false });
  } else {
    renderTimeline();
  }
}

function initDiaryDatePicker() {
  const today = getDayStart();
  const minDay = today - 30 * day;
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
    persistVisibleContextForCurrentOwner();
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
    ? (isGlobalAppAdmin() && !window.__ninouAdminFamilyDataOpen
      ? "Painel administrativo ativo. A rotina de uma família só deve ser aberta quando selecionada."
      : `${email} está sincronizando a rotina familiar em tempo real.`)
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
      updatedAt: new Date().toISOString(),
      updatedByEmail: getCurrentActorEmail(),
      updatedByName: getCurrentActorName(),
      lastAction: "editou",
    });
    pushAuditEntry("editou", existingEvent);
  } else if ((payload.type === "sono" || payload.type === "dormir" || payload.type === "despertar-noturno") && payload.hasManualEnd) {
    const newEvent = makeEvent(payload.type, payload.start, payload.end, payload.detail, payload.notes);
    state.events.push(newEvent);
    pushAuditEntry("adicionou", newEvent);
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
    const newEvent = makeEvent(payload.type, payload.start, payload.hasManualEnd ? payload.end : payload.start, payload.detail, payload.notes);
    state.events.push(newEvent);
    pushAuditEntry("adicionou", newEvent);
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

  pushAuditEntry("excluiu", event);
  state.events = removeEventById(state.events, eventId);
  saveDayState();
  renderAll();
}

function getExportEvents() {
  return buildExportEvents(state.events, getEventConfig);
}

function getExportPayload() {
  const todayStart = selectedDiaryDay ?? getDayStart();
  const selectedState = getFamilyDayState(toDateInputValue(todayStart));
  return {
    app: "Ninou",
    exportedAt: new Date().toISOString(),
    exportedBy: cloudUser?.email || "",
    day: toDateInputValue(todayStart),
    profile: normalizeBabyProfile(babyProfile),
    wakeWindowMinutes,
    state: normalizeDayState(selectedState),
    events: buildExportEvents(selectedState.events || [], getEventConfig),
  };
}

function buildRoutineSummaryText(payload = getExportPayload()) {
  const events = (payload.events || []);
  const sleepMinutes = events.reduce((total, event) => total + (String(event.type).includes("sono") || event.type === "dormir" ? Number(event.durationMinutes || 0) : 0), 0);
  const feeds = events.filter((event) => event.type === "mamadeira" || event.type === "amamentacao").length;
  const diapers = events.filter((event) => event.type === "fralda").length;
  const meds = events.filter((event) => event.type === "medicamento").length;
  const latest = [...events].sort((a, b) => String(b.start).localeCompare(String(a.start)))[0];
  const baby = getBabyDisplayName();
  return [
    `Resumo Ninou — ${baby}`,
    `Data: ${payload.day.split("-").reverse().join("/")}`,
    `Sono: ${formatShortDuration(sleepMinutes * 60000)}`,
    `Alimentações: ${feeds}`,
    `Fraldas: ${diapers}`,
    meds ? `Medicamentos: ${meds}` : "",
    latest ? `Último registro: ${latest.title} às ${formatTime(new Date(latest.start).getTime())}` : "Sem registros no dia.",
  ].filter(Boolean).join("\n");
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
    const header = ["id", "tipo", "titulo", "inicio", "fim", "duracao_min", "detalhe", "observacoes", "criado_por", "editado_por"];
    const rows = payload.events.map((event) => [
      event.id,
      event.type,
      event.title,
      event.start,
      event.end,
      event.durationMinutes,
      event.detail,
      event.notes,
      event.createdByEmail || "",
      event.updatedByEmail || "",
    ]);
    const csv = [header, ...rows].map((row) => row.map(escapeCsv).join(",")).join("\n");
    downloadFile(`${filenameBase}.csv`, csv, "text/csv;charset=utf-8");
    return;
  }

  if (format === "pdf") {
    const rows = payload.events.map((event) => `<tr><td>${escapeHtml(formatTime(new Date(event.start).getTime()))}</td><td>${escapeHtml(event.title)}</td><td>${escapeHtml(event.detail || "")}</td><td>${escapeHtml(String(event.durationMinutes || ""))}</td></tr>`).join("") || `<tr><td colspan="4">Sem registros nesta data.</td></tr>`;
    const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Ninou ${escapeHtml(payload.day)}</title><style>body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;padding:28px;color:#241f35}h1{margin:0 0 6px}p{line-height:1.45}table{width:100%;border-collapse:collapse;margin-top:18px}td,th{border-bottom:1px solid #ddd;padding:10px;text-align:left}small{color:#665}</style></head><body><h1>Resumo Ninou — ${escapeHtml(getBabyDisplayName())}</h1><p>${escapeHtml(buildRoutineSummaryText(payload)).replaceAll("\n", "<br>")}</p><table><thead><tr><th>Hora</th><th>Registro</th><th>Detalhe</th><th>Min</th></tr></thead><tbody>${rows}</tbody></table><small>Use imprimir/salvar como PDF no navegador.</small><script>window.onload=()=>setTimeout(()=>window.print(),250)</script></body></html>`;
    const win = window.open("", "_blank", "noopener,noreferrer");
    if (win) { win.document.write(html); win.document.close(); }
    else downloadFile(`${filenameBase}.html`, html, "text/html;charset=utf-8");
    return;
  }

  if (format === "whatsapp") {
    const text = encodeURIComponent(buildRoutineSummaryText(payload));
    window.open(`https://wa.me/?text=${text}`, "_blank", "noopener,noreferrer");
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
if (exportPdfButton) exportPdfButton.addEventListener("click", () => exportRoutine("pdf"));
if (shareWhatsappButton) shareWhatsappButton.addEventListener("click", () => exportRoutine("whatsapp"));
if (familyWelcomeStartButton) familyWelcomeStartButton.addEventListener("click", () => showScreen("today"));

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

    if (isGlobalAppAdmin() && !window.__ninouAdminFamilyDataOpen) {
      try { localStorage.setItem(storageKeys.themeMode, nextMode); } catch {}
      updateTheme();
      return;
    }

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
  const file = profilePhotoInput.files?.[0];
  if (!file) return;

  if (isGlobalAppAdmin() && activeScreenName === "profile" && !window.__ninouAdminFamilyDataOpen) {
    const dataUrl = await resizeImage(file);
    setAdminAccountPhoto(dataUrl);
    if (profilePhoto) profilePhoto.src = dataUrl;
    await saveAdminAccountProfileToCloud();
    if (loginHelper) loginHelper.textContent = "Foto pessoal do admin atualizada.";
    profilePhotoInput.value = "";
    return;
  }

  if (!requireLogin("salvar a foto")) {
    profilePhotoInput.value = "";
    return;
  }

  const dataUrl = await resizeImage(file);
  currentProfilePhoto = dataUrl;
  markProfileLocallyChanged();
  updateProfilePhoto(dataUrl);
  try {
    localStorage.setItem(storageKeys.photo, dataUrl);
  } catch {
    // A foto continua visível mesmo se o navegador não permitir salvar localmente.
  }
  persistVisibleContextForCurrentOwner();
  scheduleProfileCloudSave({ includePhoto: true });
  profilePhotoInput.value = "";
});

loginButton.addEventListener("click", signInAccount);
createAccountButton.addEventListener("click", createAccount);
if (createFamilyButton) {
  createFamilyButton.addEventListener("click", () => {
    activatePersonalFamily().catch((error) => {
      console.error("Erro ao ativar família:", error);
      if (loginHelper) loginHelper.textContent = getFirebaseErrorMessage(error);
    });
  });
}
if (acceptInviteButton) {
  acceptInviteButton.addEventListener("click", () => {
    acceptFamilyInvite().catch((error) => {
      console.error("Erro ao aceitar convite:", error);
      if (loginHelper) loginHelper.textContent = getFirebaseErrorMessage(error);
    });
  });
}
if (createInviteButton) {
  createInviteButton.addEventListener("click", () => {
    createFamilyInvite().catch((error) => {
      console.error("Erro ao gerar convite:", error);
      if (inviteResult) {
        inviteResult.hidden = false;
        inviteResult.textContent = getFirebaseErrorMessage(error);
      }
    });
  });
}
if (refreshAdminStatsButton) {
  refreshAdminStatsButton.addEventListener("click", () => refreshAdminStats());
}
if (adminCreateClientFamilyButton) {
  adminCreateClientFamilyButton.addEventListener("click", () => {
    createAdminClientFamily().catch((error) => {
      console.error("Erro ao criar família/cliente:", error);
      if (adminCreateFamilyResult) {
        adminCreateFamilyResult.hidden = false;
        adminCreateFamilyResult.textContent = getFirebaseErrorMessage(error);
      }
    });
  });
}
if (adminOpenFamilyButton) {
  adminOpenFamilyButton.addEventListener("click", () => {
    openAdminFamilyPreview().catch((error) => {
      console.error("Erro ao abrir família como admin:", error);
      if (loginHelper) loginHelper.textContent = getFirebaseErrorMessage(error);
    });
  });
}
if (adminReturnToPanelButton) {
  adminReturnToPanelButton.addEventListener("click", () => {
    returnToAdminPanel().catch((error) => {
      console.error("Erro ao voltar ao painel admin:", error);
      if (loginHelper) loginHelper.textContent = getFirebaseErrorMessage(error);
    });
  });
}
if (restoreFamilyDataButton) {
  restoreFamilyDataButton.addEventListener("click", () => {
    restoreFamilyDataFromBestSource().catch((error) => {
      console.error("Erro ao importar dados familiares:", error);
      if (adminMigrationStatus) adminMigrationStatus.textContent = getFirebaseErrorMessage(error);
    });
  });
}
if (scanLegacyUidButton) {
  scanLegacyUidButton.addEventListener("click", () => {
    scanLegacySourceByManualUid().catch((error) => {
      console.error("Erro ao buscar UID legado:", error);
      if (adminMigrationStatus) adminMigrationStatus.textContent = getFirebaseErrorMessage(error);
    });
  });
}
if (scanLegacyEmailButton) {
  scanLegacyEmailButton.addEventListener("click", () => {
    scanLegacySourceByManualEmail().catch((error) => {
      console.error("Erro ao buscar e-mail legado:", error);
      if (adminMigrationStatus) adminMigrationStatus.textContent = getFirebaseErrorMessage(error);
    });
  });
}
if (adminInvitePanel) {
  adminInvitePanel.addEventListener("click", async (event) => {
    const copyButton = event.target.closest("[data-copy-invite]");
    if (copyButton) {
      const text = copyButton.dataset.copyInvite || "";
      try {
        await navigator.clipboard.writeText(text);
        copyButton.textContent = text.startsWith("http") ? "Link copiado" : "Código copiado";
      } catch {
        copyButton.textContent = "Copie manualmente";
      }
      return;
    }

    const selectFamilyButton = event.target.closest("[data-select-admin-family]");
    if (selectFamilyButton) {
      const familyId = selectFamilyButton.dataset.selectAdminFamily || APP_ADMIN_FAMILY_ID;
      window.__ninouAdminFamilyDataOpen = false;
      ensureGlobalAdminAccess(cloudUser, familyId);
      if (loginHelper) loginHelper.textContent = "Família selecionada no painel. A rotina ainda não foi aberta.";
      await refreshAdminStats();
      return;
    }

    const openFamilyButton = event.target.closest("[data-open-admin-family]");
    if (openFamilyButton) {
      const familyId = openFamilyButton.dataset.openAdminFamily || APP_ADMIN_FAMILY_ID;
      openFamilyButton.disabled = true;
      openFamilyButton.textContent = "Abrindo...";
      await openAdminFamilyPreview(familyId);
      return;
    }

    const scrollButton = event.target.closest("[data-admin-scroll]");
    if (scrollButton) {
      const target = scrollButton.dataset.adminScroll || "";
      const map = { "create-family": "adminCreateFamilySection", members: "adminMembersSection", invite: "adminInviteSection", migration: "adminMigrationSection" };
      scrollAdminSection(map[target] || target);
      return;
    }

    const newFamilyResponsibleButton = event.target.closest("[data-fill-new-family-responsible]");
    if (newFamilyResponsibleButton) {
      if (adminNewResponsibleEmailInput) adminNewResponsibleEmailInput.value = newFamilyResponsibleButton.dataset.fillNewFamilyResponsible || "";
      scrollAdminSection("adminCreateFamilySection");
      adminNewFamilyNameInput?.focus();
      return;
    }

    const inviteEmailButton = event.target.closest("[data-fill-invite-email]");
    if (inviteEmailButton) {
      fillAdminInviteEmail(inviteEmailButton.dataset.fillInviteEmail || "");
      return;
    }

    const migrationEmailButton = event.target.closest("[data-fill-migration-email]");
    if (migrationEmailButton) {
      fillAdminMigrationEmail(migrationEmailButton.dataset.fillMigrationEmail || "");
      return;
    }

    const linkKnownUserButton = event.target.closest("[data-link-known-user]");
    if (linkKnownUserButton) {
      linkKnownUserButton.disabled = true;
      linkKnownUserButton.textContent = "Autorizando...";
      await authorizeKnownUserAsCaregiver(
        linkKnownUserButton.dataset.linkKnownUser || "",
        linkKnownUserButton.dataset.linkKnownEmail || "",
      );
      return;
    }

    const cancelButton = event.target.closest("[data-cancel-invite]");
    if (cancelButton) {
      const code = cancelButton.dataset.cancelInvite || "";
      cancelButton.disabled = true;
      cancelButton.textContent = "Cancelando...";
      await cancelFamilyInvite(code);
    }
  });
}
if (inviteResult) {
  inviteResult.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-copy-invite]");
    if (!button) return;
    const text = button.dataset.copyInvite || "";
    try {
      await navigator.clipboard.writeText(text);
      button.textContent = "Link copiado";
    } catch {
      button.textContent = "Copie manualmente";
    }
  });
}

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
renderAuthControls();
renderAll();
updateDiaryChipsMoreButton();
initSleepSounds();
setInterval(renderLiveTick, 1000);

initFirebaseAuthState().catch((error) => {
  console.error("Firebase não iniciou:", error);
  setSyncStatus("offline");
  loginHelper.textContent = "O app abriu em modo local. Verifique Firebase quando quiser sincronizar.";
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
