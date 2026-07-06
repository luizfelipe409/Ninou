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
import { createEmptyDayState as createEmptyRoutineDayState, findEventById, getEventOrderTime, getEventsForDay, getLatestEvent, makeEvent as createRoutineEvent, matchesDiaryFilter as recordMatchesDiaryFilter, normalizeDayState as normalizeRoutineDayState, normalizeEvent as normalizeRoutineEvent, removeEventById, sortEventsByStartAsc, sortEventsByStartDesc, updateEventKeepingDuration } from "./domain/records.js";
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
const recordForm = document.querySelector("#recordSheet .record-form");
const recordScrollHint = document.querySelector("#recordScrollHint");
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
const profilePhoto = document.querySelector("#profilePhoto");
const profilePhotoInput = document.querySelector("#profilePhotoInput");
const profileImages = document.querySelectorAll("#profilePhoto, .identity img");
const babyAvatarPreview = document.querySelector("#babyAvatarPreview");
const avatarModalHint = document.querySelector("#avatarModalHint");
const babyAvatarCard = document.querySelector("#babyAvatarTestCard");
const babyAvatarModalBackdrop = babyAvatarCard?.querySelector(".ninou-modal-backdrop");
const babyAvatarDetails = babyAvatarCard?.querySelector(".avatar-premium-details");
const editBabyAvatarButton = document.querySelector("#editBabyAvatarButton");
const avatarIconOptions = document.querySelector("#avatarIconOptions");
const avatarTabs = document.querySelectorAll("[data-avatar-jump]");
const saveBabyAvatarButton = document.querySelector("#saveBabyAvatarButton");
const skipBabyAvatarButton = document.querySelector("#skipBabyAvatarButton");
const babyAvatarStatus = document.querySelector("#babyAvatarStatus");
const loginEmail = document.querySelector("#loginEmail");
const loginPassword = document.querySelector("#loginPassword");
const loginButton = document.querySelector("#loginButton");
const createAccountButton = document.querySelector("#createAccountButton");
const clearDeviceDataButton = document.querySelector("#clearDeviceDataButton");
const clearDeviceDataStatus = document.querySelector("#clearDeviceDataStatus");
const loginHelper = document.querySelector("#loginHelper");
const loginCard = document.querySelector(".login-card");
const profileFamilyStack = document.querySelector(".profile-family-stack");
const caregiverIdentityCard = document.querySelector("#caregiverIdentityCard");
const caregiverNameInput = document.querySelector("#caregiverNameInput");
const caregiverRelationInput = document.querySelector("#caregiverRelationInput");
const saveCaregiverIdentityButton = document.querySelector("#saveCaregiverIdentityButton");
const deviceCaregiverName = document.querySelector("#deviceCaregiverName");
const deviceCaregiverAvatar = document.querySelector("#deviceCaregiverAvatar");
const deviceCaregiverRelationChip = document.querySelector("#deviceCaregiverRelationChip");
const deviceCaregiverHint = document.querySelector("#deviceCaregiverHint");
const familyProfileBabyMeta = document.querySelector("#familyProfileBabyMeta");
const familyNameLabel = document.querySelector("#familyNameLabel");
const familyAccountLabel = document.querySelector("#familyAccountLabel");
const familyAccessTypeLabel = document.querySelector("#familyAccessTypeLabel");
const familyInviteDescription = document.querySelector("#familyInviteDescription");
const familyCreateInviteButton = document.querySelector("#familyCreateInviteButton");
const familyJoinInviteButton = document.querySelector("#familyJoinInviteButton");
const familyActiveInviteBox = document.querySelector("#familyActiveInviteBox");
const familyActiveInviteCode = document.querySelector("#familyActiveInviteCode");
const familyActiveInviteHint = document.querySelector("#familyActiveInviteHint");
const familyInviteShareActions = document.querySelector("#familyInviteShareActions");
const familyCopyInviteButton = document.querySelector("#familyCopyInviteButton");
const familyShareInviteWhatsAppButton = document.querySelector("#familyShareInviteWhatsAppButton");
const joinFamilyModal = document.querySelector("#joinFamilyModal");
const joinInviteCodeInput = document.querySelector("#joinInviteCodeInput");
const joinInviteFeedback = document.querySelector("#joinInviteFeedback");
const confirmJoinInviteButton = document.querySelector("#confirmJoinInviteButton");
const supportSuggestionButton = document.querySelector("#supportSuggestionButton");
const supportBugButton = document.querySelector("#supportBugButton");
const caregiverIdentityStatus = document.querySelector("#caregiverIdentityStatus");
const familyAccessCard = document.querySelector("#familyAccessCard");
const familyAccessKicker = document.querySelector("#familyAccessCard > span");
const familyAccessTitle = document.querySelector("#familyAccessTitle");
const familyAccessText = document.querySelector("#familyAccessText");
const familyAccessBadge = document.querySelector("#familyAccessBadge");
const createFamilyButton = document.querySelector("#createFamilyButton");
const inviteCodeInput = document.querySelector("#inviteCodeInput");
const acceptInviteButton = document.querySelector("#acceptInviteButton");
const inviteAcceptBox = document.querySelector(".invite-accept-box");
const guestWelcomeCard = document.querySelector("#guestWelcomeCard");
const guestWelcomeLoginButton = document.querySelector("#guestWelcomeLoginButton");
const guestWelcomeInviteButton = document.querySelector("#guestWelcomeInviteButton");
const guestWelcomeCreateFamilyButton = document.querySelector("#guestWelcomeCreateFamilyButton");
const postAccessCard = document.querySelector("#postAccessCard");
const postAccessKicker = document.querySelector("#postAccessKicker");
const postAccessTitle = document.querySelector("#postAccessTitle");
const postAccessText = document.querySelector("#postAccessText");
const postAccessAccountStatus = document.querySelector("#postAccessAccountStatus");
const postAccessInviteStatus = document.querySelector("#postAccessInviteStatus");
const postAccessFamilyStatus = document.querySelector("#postAccessFamilyStatus");
const dataRealityCard = document.querySelector("#dataRealityCard");
const dataRealityKicker = document.querySelector("#dataRealityKicker");
const dataRealityTitle = document.querySelector("#dataRealityTitle");
const dataRealityText = document.querySelector("#dataRealityText");
const firstUseChecklistCard = document.querySelector("#firstUseChecklistCard");
const premiumTrustCard = document.querySelector("#premiumTrustCard");
const profileReadyCard = document.querySelector("#profileReadyCard");
const profileReadyKicker = document.querySelector("#profileReadyKicker");
const profileReadyTitle = document.querySelector("#profileReadyTitle");
const profileReadyText = document.querySelector("#profileReadyText");
const profileReadyFamily = document.querySelector("#profileReadyFamily");
const profileReadyRole = document.querySelector("#profileReadyRole");
const profileReadyDevice = document.querySelector("#profileReadyDevice");
const guestOnboardingModal = document.querySelector("#guestOnboardingModal");
const guestModalCloseButton = document.querySelector("#guestModalCloseButton");
const guestModalLoginButton = document.querySelector("#guestModalLoginButton");
const guestModalInviteButton = document.querySelector("#guestModalInviteButton");
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
const notificationCenterCard = document.querySelector("#notificationCenterCard");
const notificationCenterList = document.querySelector("#notificationCenterList");
const daySummaryMoment = document.querySelector("#daySummaryMoment");
const daySummaryText = document.querySelector("#daySummaryText");
const todayGrowthWeight = document.querySelector("#todayGrowthWeight");
const todayGrowthHint = document.querySelector("#todayGrowthHint");
const todayWeightSparkline = document.querySelector("#todayWeightSparkline");
const trendGrowthStatus = document.querySelector("#trendGrowthStatus");
const trendGrowthWeight = document.querySelector("#trendGrowthWeight");
const trendGrowthHint = document.querySelector("#trendGrowthHint");
const trendWeightSparkline = document.querySelector("#trendWeightSparkline");
const growthHistoryMini = document.querySelector("#growthHistoryMini");
const auditCard = document.querySelector(".audit-card");
const auditTrailList = document.querySelector("#auditTrailList");
const dayNotesTextarea = document.querySelector("#dayNotesTextarea");
const saveDayNotesButton = document.querySelector("#saveDayNotesButton");
const dayNotesStatus = document.querySelector("#dayNotesStatus");
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
const whatsappNumberInput = document.querySelector("#whatsappNumberInput");
const whatsappMessageInput = document.querySelector("#whatsappMessageInput");
const exportRangeSelect = document.querySelector("#exportRangeSelect");
const exportStartDateInput = document.querySelector("#exportStartDateInput");
const exportEndDateInput = document.querySelector("#exportEndDateInput");
const prepareConsultButton = document.querySelector("#prepareConsultButton");
const syncPill = document.querySelector(".sync-pill");
const syncStatusTitle = document.querySelector("#syncStatusTitle");
const syncStatusText = document.querySelector("#syncStatusText");
const syncFamilyLabel = document.querySelector("#syncFamilyLabel");
const syncLastSavedLabel = document.querySelector("#syncLastSavedLabel");
const adminDiagnosticsCard = document.querySelector("#adminDiagnosticsCard");
const diagnosticsVersionLabel = document.querySelector("#diagnosticsVersionLabel");
const diagnosticsSummary = document.querySelector("#diagnosticsSummary");
const diagnosticsUserLabel = document.querySelector("#diagnosticsUserLabel");
const diagnosticsFamilyLabel = document.querySelector("#diagnosticsFamilyLabel");
const diagnosticsPwaLabel = document.querySelector("#diagnosticsPwaLabel");
const diagnosticsCacheLabel = document.querySelector("#diagnosticsCacheLabel");
const diagnosticsAppCheckLabel = document.querySelector("#diagnosticsAppCheckLabel");
const appUpdateNotice = document.querySelector("#appUpdateNotice");
const appUpdateButton = document.querySelector("#appUpdateButton");
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
const summaryRangeButtons = document.querySelectorAll("[data-summary-range]");
const summaryRangeLabel = document.querySelector("#summaryRangeLabel");
const summaryRangeHint = document.querySelector("#summaryRangeHint");
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

const NINOU_RUNTIME_VERSION = "75.74.4";
const INVITE_TTL_MS = 7 * day;
const INVITE_MAX_USES = 1;
const MAX_DAY_NOTES_LENGTH = 1200;
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
  return family?.name || stats?.familyName || "Família selecionada";
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

function setAdminAccountPhoto(_dataUrl = "", user = cloudUser) {
  adminAccountPhoto = getCaregiverAvatarDataUrl(getAdminAccountLabel(), user?.email || GLOBAL_APP_ADMIN_EMAIL, "admin");
  try { localStorage.removeItem(getAdminAccountPhotoKey(user)); } catch {}
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

function limitText(value = "", maxLength = MAX_DAY_NOTES_LENGTH) {
  const text = String(value || "").trim();
  return text.length > maxLength ? text.slice(0, maxLength).trim() : text;
}

function normalizeSafeDayNotes(value = "") {
  return limitText(value, MAX_DAY_NOTES_LENGTH);
}

function toMillisFromInviteDate(value) {
  if (!value) return 0;
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = Date.parse(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  if (typeof value.toMillis === "function") return Number(value.toMillis()) || 0;
  if (Number.isFinite(Number(value.seconds))) return Number(value.seconds) * 1000;
  return 0;
}

function getInviteExpiryMillis(invite = {}) {
  return toMillisFromInviteDate(invite.expiresAtClient || invite.expiresAt || invite.expireAt);
}

function isInviteExpired(invite = {}, now = Date.now()) {
  const expiresAt = getInviteExpiryMillis(invite);
  return Boolean(expiresAt && expiresAt <= now);
}

function isInviteUsable(invite = {}, now = Date.now()) {
  const status = String(invite.status || "").toLowerCase();
  const useCount = Number(invite.useCount || 0);
  const maxUses = Number(invite.maxUses || INVITE_MAX_USES);
  return ["active", "pending"].includes(status)
    && !isInviteExpired(invite, now)
    && (!Number.isFinite(maxUses) || maxUses <= 0 || useCount < maxUses);
}

function getInviteExpiryPayload(services, now = Date.now()) {
  const expiresAtClient = now + INVITE_TTL_MS;
  return {
    expiresAtClient,
    expiresAt: services?.Timestamp?.fromMillis ? services.Timestamp.fromMillis(expiresAtClient) : new Date(expiresAtClient),
  };
}

function getMinimalGlobalInvitePayload(invite = {}) {
  const payload = {
    code: normalizeInviteCode(invite.code || ""),
    familyId: String(invite.familyId || ""),
    role: normalizeInviteRole(invite.role || "cuidador"),
    status: String(invite.status || "active"),
    maxUses: Number(invite.maxUses || INVITE_MAX_USES),
    useCount: Number(invite.useCount || 0),
  };
  if (invite.email) payload.email = normalizeEmail(invite.email);
  if (invite.createdByUid || invite.createdBy) payload.createdByUid = String(invite.createdByUid || invite.createdBy || "");
  if (invite.createdByEmail) payload.createdByEmail = normalizeEmail(invite.createdByEmail);
  if (invite.expiresAt) payload.expiresAt = invite.expiresAt;
  if (invite.expiresAtClient) payload.expiresAtClient = Number(invite.expiresAtClient) || 0;
  if (invite.createdAt) payload.createdAt = invite.createdAt;
  if (invite.updatedAt) payload.updatedAt = invite.updatedAt;
  return payload;
}

// v75.56.2.1.1: ao abrir sem sessão conhecida, não reaproveita dados familiares da última conta.
try {
  if (!localStorage.getItem(storageKeys.email)) {
    [
      storageKeys.profile,
      storageKeys.profileVersion,
      storageKeys.dayState,
      storageKeys.wakeWindow,
      storageKeys.weights,
      storageKeys.photo,
      storageKeys.access,
      storageKeys.dataOwnerEmail,
    ].forEach((key) => localStorage.removeItem(key));
  }
} catch {}

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
let currentProfilePhoto = "";
let adminAccountPhoto = "";
let profileClientUpdatedAt = Number(localStorage.getItem(storageKeys.profileVersion)) || 0;
let firebaseServices = null;
let firebaseServicesPromise = null;
let cloudUser = null;
let authAccessLoading = false;
let authFlowRunId = 0;
let familyBootstrapReady = false;
let familyAccess = loadFamilyAccess();
let pendingInviteCode = getInitialInviteCode();
let accessFlowNotice = "";
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
const lastCloudSyncStorageKey = "ninou.sync.lastCloudSaveAt";
let profileCloudSaveTimer = null;
let dayCloudSaveTimer = null;
let applyingCloudState = false;
let pendingProfilePhotoSave = false;
let orbitRenderSignature = "";
let timelineRenderSignature = "";
let liveTickMinute = -1;
let breastTimerState = createBreastTimerState();
let state = loadLocalDayState(getCurrentDayId());
let loadedStateDayId = getCurrentDayId();
const SUMMARY_RANGE_KEY = "ninou.summaryRangeMode";
const summaryRangeOptions = Object.freeze({
  day: { days: 1, label: "Diário", hint: "Resumo do dia selecionado, focado no que aconteceu hoje." },
  "3d": { days: 3, label: "Últimos 3 dias", hint: "Resumo curto dos últimos 3 dias para perceber mudanças recentes." },
  "7d": { days: 7, label: "Últimos 7 dias", hint: "Resumo acumulado dos últimos 7 dias, com sono, mamadas, fraldas e medicamentos." },
});
let summaryRangeMode = normalizeSummaryRangeMode(localStorage.getItem(SUMMARY_RANGE_KEY) || "7d");
let intelligentTimelineLimit = 7;

let pendingBabyAvatar = { ...(babyProfile.avatar || {}) };
let avatarEditorForceOpen = false;
let avatarModalScrollRestoreY = 0;
let avatarModalScrollLocked = false;

const babyAvatarHairOptions = Object.freeze([
  { id: "avatar-01", label: "Bebê clássico", src: "./icons/baby-avatars/avatar-01.png" },
  { id: "avatar-02", label: "Castanho", src: "./icons/baby-avatars/avatar-02.png" },
  { id: "avatar-03", label: "Laço", src: "./icons/baby-avatars/avatar-03.png" },
  { id: "avatar-04", label: "Cacheado", src: "./icons/baby-avatars/avatar-04.png" },
  { id: "avatar-05", label: "Ondulado", src: "./icons/baby-avatars/avatar-05.png" },
  { id: "avatar-06", label: "Loirinha", src: "./icons/baby-avatars/avatar-06.png" },
  { id: "avatar-07", label: "Cacheadinho", src: "./icons/baby-avatars/avatar-07.png" },
  { id: "avatar-08", label: "Ruivinho", src: "./icons/baby-avatars/avatar-08.png" },
  { id: "avatar-09", label: "Touca", src: "./icons/baby-avatars/avatar-09.png" },
  { id: "avatar-10", label: "Tiara", src: "./icons/baby-avatars/avatar-10.png" },
  { id: "avatar-11", label: "Raspadinho", src: "./icons/baby-avatars/avatar-11.png" },
  { id: "avatar-12", label: "Cabelo preto", src: "./icons/baby-avatars/avatar-12.png" },
]);

const legacyAvatarHairMap = Object.freeze({
  "bebe-curlinho": "avatar-01",
  "menina-laco": "avatar-03",
  "menino-franja": "avatar-02",
  "menina-faixa": "avatar-10",
  "menino-cacheado": "avatar-04",
  "menina-bob": "avatar-10",
  "menino-topete": "avatar-05",
  "topetinho": "avatar-05",
  "quase-sem-cabelo": "avatar-01",
  "onduladinho-curto": "avatar-05",
  "duas-chuquinhas": "avatar-06",
  "franjinha-delicada": "avatar-03",
  "cachinhos-curtos": "avatar-07",
  "ondinha-lateral": "avatar-05",
  "cacheado-curto": "avatar-07",
  "bob-bebe": "avatar-10",
  "faixinha-baby": "avatar-10",
  "laco-delicado": "avatar-03",
});

function getAvatarHairOption(avatar = {}) {
  return babyAvatarHairOptions.find((item) => item.id === avatar.hair) || babyAvatarHairOptions[0];
}

function getAvatarOption(options, id, fallbackIndex = 0) {
  return options.find((item) => item.id === id) || options[fallbackIndex];
}

function normalizeAvatarDraft(avatar = {}) {
  const presetId = legacyAvatarHairMap[avatar.hair] || legacyAvatarHairMap[avatar.icon] || avatar.hair || avatar.icon || "avatar-01";
  return {
    hair: getAvatarOption(babyAvatarHairOptions, presetId, 0).id,
    hairColor: "castanho-mel",
    skin: "marfim",
    background: "lavanda",
  };
}

function escapeSvgText(value = "") {
  return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function getBabyAvatarDataUrl(avatar = babyProfile.avatar) {
  const normalized = normalizeAvatarDraft(avatar);
  const preset = getAvatarHairOption(normalized);
  return preset.src || babyAvatarHairOptions[0].src;
}

function setEditAvatarButtonLabel(editorOpen = false) {
  if (!editBabyAvatarButton) return;
  const label = editorOpen ? "Fechar" : (babyProfile.avatarConfigured ? "Editar" : "Escolher");
  editBabyAvatarButton.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg><span>${label}</span>`;
  editBabyAvatarButton.setAttribute("aria-label", `${label} avatar do diário`);
}

function renderAvatarEditorVisibility() {
  const canEditAvatar = canUsePrivateFeatures();
  const editorOpen = canEditAvatar && avatarEditorForceOpen;

  // v75.74.1: a seleção de avatares virou modal, aberto apenas pelo botão Editar.
  if (babyAvatarCard) {
    babyAvatarCard.hidden = !editorOpen;
    babyAvatarCard.setAttribute("aria-hidden", editorOpen ? "false" : "true");
  }
  syncAvatarModalScrollLock(editorOpen);
  if (babyAvatarDetails) babyAvatarDetails.open = editorOpen;

  if (editBabyAvatarButton) {
    const avatarEditLine = editBabyAvatarButton.closest?.(".avatar-edit-line");
    if (avatarEditLine) avatarEditLine.hidden = !canEditAvatar;
    editBabyAvatarButton.hidden = !canEditAvatar;
    editBabyAvatarButton.disabled = !canEditAvatar;
    setEditAvatarButtonLabel(editorOpen);
  }
}

function setAuthAccessLoading(value, message = "Validando acesso familiar...") {
  authAccessLoading = Boolean(value);
  document.body.classList.toggle("auth-validating", authAccessLoading);
  document.body.classList.toggle("sync-bootstrap", authAccessLoading && Boolean(cloudUser));
  if (authAccessLoading && loginHelper) loginHelper.textContent = message;
  renderAuthControls();
}

function applyGuestInteractionLock() {
  const locked = !isLoggedIn();
  document.body.classList.toggle("guest-locked", locked);
  document.body.classList.toggle("auth-validating", authAccessLoading);
  document.body.classList.toggle("sync-bootstrap", authAccessLoading && Boolean(cloudUser));
  const disabledElements = [
    babyNameInput, babyArticleInput, babyBirthInput,
    babyWeightInput, babyWeightDateInput, saveBabyWeightButton,
    caregiverNameInput, caregiverRelationInput, saveCaregiverIdentityButton,
    saveBabyAvatarButton, skipBabyAvatarButton,
    inviteCodeInput, acceptInviteButton,
  ];
  disabledElements.forEach((element) => {
    if (!element) return;
    element.disabled = locked;
    element.setAttribute("aria-disabled", locked ? "true" : "false");
  });
  if (locked) {
    avatarEditorForceOpen = false;
    if (babyAvatarCard) babyAvatarCard.hidden = true;
    if (editBabyAvatarButton) {
      editBabyAvatarButton.hidden = true;
      const avatarEditLine = editBabyAvatarButton.closest?.(".avatar-edit-line");
      if (avatarEditLine) avatarEditLine.hidden = true;
    }
  }
  if (guestWelcomeCard) guestWelcomeCard.hidden = !locked;
  renderGuestPremiumContent();
  updateAccountJourneyGuide();
}


const guestThemeOptions = Object.freeze([
  { mode: "light", label: "Claro", icon: "☀" },
  { mode: "dark", label: "Escuro", icon: "🌙" },
]);

function normalizeGuestThemeMode(mode = "dark") {
  return guestThemeOptions.some((option) => option.mode === mode) ? mode : "dark";
}

function getActiveGuestThemeMode() {
  return normalizeGuestThemeMode(themeModeInput?.value || babyProfile?.themeMode || localStorage.getItem(storageKeys.themeMode) || "dark");
}

function renderGuestThemeButtons() {
  const mode = getActiveGuestThemeMode();
  document.querySelectorAll("[data-theme-choice]").forEach((button) => {
    const active = normalizeGuestThemeMode(button.dataset.themeChoice || "auto") === mode;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", active ? "true" : "false");
  });
}

function setGuestThemeChoice(mode = "dark") {
  const safeMode = normalizeGuestThemeMode(mode);
  if (themeModeInput) themeModeInput.value = safeMode;
  babyProfile = normalizeBabyProfile({ ...babyProfile, themeMode: safeMode });

  try {
    localStorage.setItem(storageKeys.themeMode, safeMode);
  } catch {}

  updateTheme();
  renderGuestThemeButtons();
}

function getGuestThemeSwitchMarkup() {
  const buttons = guestThemeOptions.map((option) => `
    <button type="button" data-theme-choice="${option.mode}">
      <span>${option.icon}</span>
      <strong>${option.label}</strong>
    </button>
  `).join("");

  return `
    <div class="guest-theme-switch" aria-label="Escolha o tema inicial">
      <span>Tema inicial</span>
      <div>${buttons}</div>
    </div>
  `;
}

const guestPremiumContent = {
  today: {
    kicker: "Conheça o Ninou",
    title: "A rotina do bebê em tempo real",
    text: "Uma prévia limpa de como a família acompanha sono, mamadas, fraldas e medicamentos em poucos toques.",
    accent: "Hoje • prévia",
    liveTitle: "Bebê acordado",
    liveValue: "44 min",
    liveHint: "desde 12:35, após a última soneca",
    cta: "Entre para começar a rotina real da família.",
    metrics: [
      { label: "Sono hoje", value: "3h05", note: "1 soneca concluída" },
      { label: "Mamadas", value: "4", note: "420 ml + peito" },
      { label: "Fraldas", value: "3", note: "2 xixi · 1 mista" },
      { label: "Próxima dica", value: "14:10", note: "janela de sono" },
    ],
    barsTitle: "Ritmo do dia",
    barsSubtitle: "sono, alimentação e cuidados",
    bars: [
      { label: "06h", value: "Sono", height: 72 },
      { label: "08h", value: "Acordou", height: 32 },
      { label: "10h", value: "Soneca", height: 88 },
      { label: "12h", value: "Mamou", height: 52 },
      { label: "14h", value: "Dica", height: 64 },
    ],
    lineTitle: "Tempo acordado",
    lineSubtitle: "prévia ao longo do dia",
    line: [
      { label: "07h", value: 0 },
      { label: "08h", value: 38 },
      { label: "09h", value: 92 },
      { label: "10h", value: 15 },
      { label: "12h", value: 0 },
      { label: "13h", value: 44 },
    ],
    distribution: [
      { label: "Sono", value: 46 },
      { label: "Mamada", value: 28 },
      { label: "Fralda", value: 16 },
      { label: "Outros", value: 10 },
    ],
    timeline: [
      { time: "07:41", title: "Acordou", detail: "começo do dia" },
      { time: "09:30", title: "Soneca", detail: "3h05 de sono" },
      { time: "12:42", title: "Mamadeira", detail: "120 ml" },
    ],
    features: [
      "Tempo acordado recalculado automaticamente",
      "Últimos cuidados sempre visíveis",
      "Sugestões leves sem poluir a rotina",
    ],
  },
  diary: {
    kicker: "Histórico por data",
    title: "Diário completo e organizado",
    text: "O usuário entende como cada registro entra no histórico, com horários, detalhes, observações e separação correta por dia.",
    accent: "Data da prévia",
    liveTitle: "Dia completo",
    liveValue: "11 registros",
    liveHint: "madrugada, manhã, tarde e noite separados",
    cta: "Entre para consultar, editar e compartilhar o histórico real.",
    metrics: [
      { label: "Sono", value: "3h05", note: "concluído" },
      { label: "Mamadas", value: "5", note: "peito e mamadeira" },
      { label: "Fraldas", value: "4", note: "com detalhes" },
      { label: "Observações", value: "2", note: "anotações da família" },
    ],
    barsTitle: "Registros por período",
    barsSubtitle: "distribuição da prévia",
    bars: [
      { label: "Madr.", value: "2", height: 36 },
      { label: "Manhã", value: "6", height: 88 },
      { label: "Tarde", value: "3", height: 58 },
      { label: "Noite", value: "1", height: 28 },
    ],
    lineTitle: "Volume de registros",
    lineSubtitle: "prévia dos últimos dias",
    line: [
      { label: "24", value: 8 },
      { label: "25", value: 10 },
      { label: "26", value: 9 },
      { label: "27", value: 12 },
      { label: "28", value: 11 },
      { label: "29", value: 13 },
      { label: "30", value: 11 },
    ],
    distribution: [
      { label: "Sono", value: 30 },
      { label: "Mamada", value: 34 },
      { label: "Fralda", value: 24 },
      { label: "Medic.", value: 12 },
    ],
    timeline: [
      { time: "03:18", title: "Amamentação", detail: "lado esquerdo" },
      { time: "07:41", title: "Acordou", detail: "registrado pela mãe" },
      { time: "12:35", title: "Fim da soneca", detail: "tempo acordado correto" },
    ],
    features: [
      "Cada dia recomeça à meia-noite",
      "Edição de registros com segurança",
      "Histórico pronto para relatório",
    ],
  },
  trends: {
    kicker: "Dados inteligentes",
    title: "Gráficos que explicam a rotina",
    text: "A demo mostra como sono, mamadas, fraldas e crescimento ficam claros depois dos primeiros dias de uso.",
    accent: "Últimos 7 dias",
    liveTitle: "Sono médio",
    liveValue: "14h20",
    liveHint: "tendência da prévia semanal",
    cta: "Entre para visualizar os gráficos reais do bebê.",
    metrics: [
      { label: "Mamadas", value: "8/dia", note: "média da prévia" },
      { label: "Fraldas", value: "6/dia", note: "média da prévia" },
      { label: "Peso", value: "+420 g", note: "evolução da prévia" },
      { label: "Regularidade", value: "82%", note: "padrão semanal" },
    ],
    barsTitle: "Sono nos últimos dias",
    barsSubtitle: "prévia de evolução",
    bars: [
      { label: "Seg", value: "13h", height: 62 },
      { label: "Ter", value: "14h", height: 72 },
      { label: "Qua", value: "13h40", height: 68 },
      { label: "Qui", value: "15h", height: 88 },
      { label: "Sex", value: "14h20", height: 78 },
      { label: "Sáb", value: "14h50", height: 84 },
      { label: "Dom", value: "15h10", height: 90 },
    ],
    lineTitle: "Peso do bebê",
    lineSubtitle: "linha de crescimento",
    line: [
      { label: "1ª", value: 3.18 },
      { label: "2ª", value: 3.32 },
      { label: "3ª", value: 3.48 },
      { label: "4ª", value: 3.61 },
      { label: "5ª", value: 3.82 },
    ],
    distribution: [
      { label: "Sono", value: 44 },
      { label: "Acordado", value: 36 },
      { label: "Mamadas", value: 12 },
      { label: "Cuidados", value: 8 },
    ],
    timeline: [
      { time: "Peso", title: "3,82 kg", detail: "evolução semanal" },
      { time: "Sono", title: "mais regular", detail: "padrão noturno" },
      { time: "Fraldas", title: "dentro da média", detail: "acompanhamento diário" },
    ],
    features: [
      "Sono por dia e por período",
      "Mamadas, fraldas e medicamentos",
      "Evolução de peso sem complexidade",
    ],
  },
  sounds: {
    kicker: "Ritual de descanso",
    title: "Sons com contexto de rotina",
    text: "A tela de sons também vira uma experiência guiada, mostrando como o áudio pode apoiar a hora de dormir.",
    accent: "Pré-sono • prévia",
    liveTitle: "Som favorito",
    liveValue: "Útero",
    liveHint: "sessão de 28 min em volume baixo",
    cta: "Entre para usar os sons junto com a rotina real da família.",
    metrics: [
      { label: "Sessão", value: "28 min", note: "até relaxar" },
      { label: "Volume", value: "Baixo", note: "ambiente calmo" },
      { label: "Rotina", value: "Noite", note: "pré-sono" },
      { label: "Uso", value: "4x", note: "última semana" },
    ],
    barsTitle: "Uso dos sons",
    barsSubtitle: "últimos descansos",
    bars: [
      { label: "Útero", value: "42min", height: 88 },
      { label: "Relaxar", value: "25min", height: 58 },
      { label: "Ritmo", value: "18min", height: 42 },
    ],
    lineTitle: "Tempo para relaxar",
    lineSubtitle: "tendência de relaxamento",
    line: [
      { label: "Seg", value: 34 },
      { label: "Ter", value: 31 },
      { label: "Qua", value: 29 },
      { label: "Qui", value: 28 },
      { label: "Sex", value: 24 },
    ],
    distribution: [
      { label: "Útero", value: 52 },
      { label: "Relaxar", value: 30 },
      { label: "Ritmo", value: 18 },
    ],
    timeline: [
      { time: "20:10", title: "Som do útero", detail: "preparar o berço" },
      { time: "20:32", title: "Relaxar", detail: "volume baixo" },
      { time: "20:45", title: "Dormiu", detail: "rotina concluída" },
    ],
    features: [
      "Sons simples para uso noturno",
      "Timer com repetição controlada",
      "Rotina de descanso mais previsível",
    ],
  },
};

function getGuestMetricMarkup(metric) {
  return `
    <article class="guest-store-metric">
      <span>${escapeHtml(metric.label)}</span>
      <strong>${escapeHtml(metric.value)}</strong>
      <small>${escapeHtml(metric.note)}</small>
    </article>
  `;
}

function getGuestBarMarkup(bar) {
  const height = Math.max(18, Math.min(96, Number(bar.height) || 40));
  return `
    <span class="guest-store-bar" style="--h:${height}%">
      <i aria-hidden="true"></i>
      <b>${escapeHtml(bar.label)}</b>
      <em>${escapeHtml(bar.value)}</em>
    </span>
  `;
}

function getGuestLineChartMarkup(points = []) {
  const safePoints = Array.isArray(points) ? points : [];
  const values = safePoints.map((point) => Number(point.value)).filter(Number.isFinite);
  const min = values.length ? Math.min(...values) : 0;
  const max = values.length ? Math.max(...values) : 1;
  const range = Math.max(0.001, max - min);
  const count = Math.max(1, safePoints.length - 1);

  const coords = safePoints.map((point, index) => {
    const x = 10 + (index / count) * 180;
    const value = Number(point.value);
    const normalized = Number.isFinite(value) ? (value - min) / range : 0.5;
    const y = 82 - normalized * 58;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");

  const dots = safePoints.map((point, index) => {
    const x = 10 + (index / count) * 180;
    const value = Number(point.value);
    const normalized = Number.isFinite(value) ? (value - min) / range : 0.5;
    const y = 82 - normalized * 58;
    return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3.8"></circle>`;
  }).join("");

  const labels = safePoints.map((point) => `<span>${escapeHtml(point.label)}</span>`).join("");

  return `
    <div class="guest-store-line">
      <svg viewBox="0 0 200 96" role="img" aria-hidden="true" focusable="false">
        <path d="M10 82H190M10 52H190M10 22H190"></path>
        <polyline points="${coords}"></polyline>
        ${dots}
      </svg>
      <div class="guest-store-line-labels">${labels}</div>
    </div>
  `;
}

function getGuestDistributionMarkup(items = []) {
  return items.map((item, index) => {
    const value = Math.max(0, Math.min(100, Number(item.value) || 0));
    return `
      <article class="guest-store-ring" style="--value:${value};--ring-index:${index}">
        <i aria-hidden="true"></i>
        <div>
          <strong>${escapeHtml(String(value))}%</strong>
          <span>${escapeHtml(item.label)}</span>
        </div>
      </article>
    `;
  }).join("");
}

function getGuestTimelineMarkup(row) {
  return `
    <article class="guest-store-row">
      <time>${escapeHtml(row.time)}</time>
      <div>
        <strong>${escapeHtml(row.title)}</strong>
        <span>${escapeHtml(row.detail)}</span>
      </div>
    </article>
  `;
}

function getGuestFeatureMarkup(feature) {
  return `<li><span aria-hidden="true">✓</span>${escapeHtml(feature)}</li>`;
}

function getGuestPremiumCardMarkup(screenKey) {
  const item = guestPremiumContent[screenKey] || guestPremiumContent.today;
  const metrics = item.metrics.map(getGuestMetricMarkup).join("");
  const bars = item.bars.map(getGuestBarMarkup).join("");
  const timeline = item.timeline.map(getGuestTimelineMarkup).join("");
  const features = item.features.map(getGuestFeatureMarkup).join("");

  return `
    <div class="guest-store-layout">
      <section class="guest-store-hero" aria-label="Apresentação do Ninou">
        <span>${escapeHtml(item.kicker)}</span>
        <strong>${escapeHtml(item.title)}</strong>
        <p>${escapeHtml(item.text)}</p>
        ${getGuestThemeSwitchMarkup()}
        <ul class="guest-store-features">${features}</ul>
      </section>

      <section class="guest-store-preview" aria-label="Prévia do app">
        <div class="guest-preview-phone">
          <div class="guest-preview-topline">
            <span>${escapeHtml(item.accent)}</span>
            <b>Prévia do app</b>
          </div>
          <div class="guest-live-card">
            <span>${escapeHtml(item.liveTitle)}</span>
            <strong>${escapeHtml(item.liveValue)}</strong>
            <p>${escapeHtml(item.liveHint)}</p>
          </div>
          <div class="guest-store-metrics">${metrics}</div>
          <div class="guest-store-chart">
            <div>
              <span>${escapeHtml(item.barsTitle)}</span>
              <strong>${escapeHtml(item.barsSubtitle)}</strong>
            </div>
            <div class="guest-store-bars">${bars}</div>
          </div>
        </div>

        <div class="guest-store-analytics">
          <article class="guest-store-analytic-card">
            <div>
              <span>${escapeHtml(item.lineTitle)}</span>
              <strong>${escapeHtml(item.lineSubtitle)}</strong>
            </div>
            ${getGuestLineChartMarkup(item.line)}
          </article>

          <article class="guest-store-analytic-card">
            <div>
              <span>Composição</span>
              <strong>leitura rápida</strong>
            </div>
            <div class="guest-store-rings">${getGuestDistributionMarkup(item.distribution)}</div>
          </article>

          <article class="guest-store-analytic-card guest-store-timeline-card">
            <div>
              <span>Linha do tempo</span>
              <strong>prévia organizada</strong>
            </div>
            <div class="guest-store-timeline">${timeline}</div>
          </article>
        </div>
      </section>
    </div>

    <div class="guest-premium-proof" aria-label="Confirmações da prévia">
      <span>Prévia do app</span>
      <span>Fluxo por convite</span>
      <span>Claro ou escuro</span>
    </div>

    <p class="guest-store-cta">${escapeHtml(item.cta)}</p>

    <div class="guest-premium-actions">
      <button type="button" data-guest-action="login">Entrar agora</button>
      <button type="button" data-guest-action="invite">Tenho convite</button>
    </div>
  `;
}

function removeGuestPremiumCards() {
  document.querySelectorAll(".guest-premium-card").forEach((card) => card.remove());
}

function renderGuestPremiumContent() {
  removeGuestPremiumCards();
  if (isLoggedIn()) return;
  const activeScreen = document.querySelector('.screen.active:not([data-screen="profile"])');
  if (!activeScreen) return;
  const key = activeScreen.dataset.screen || "today";
  const card = document.createElement("section");
  card.className = "guest-premium-card";
  card.setAttribute("aria-label", "Prévia premium do Ninou");
  card.innerHTML = getGuestPremiumCardMarkup(key);
  renderGuestThemeButtons();
  card.addEventListener("click", (event) => {
    const guestAction = event.target.closest("[data-guest-action]");
    if (!guestAction) return;
    event.preventDefault();
    event.stopPropagation();
    focusProfileAccess(guestAction.dataset.guestAction === "invite" ? "invite" : "login");
  });
  activeScreen.prepend(card);
}



function setPostStatusState(key, state = "pending") {
  const item = postAccessCard?.querySelector(`[data-post-status="${key}"]`);
  if (!item) return;
  item.dataset.state = state;
  item.classList.toggle("done", state === "done");
  item.classList.toggle("current", state === "current");
  item.classList.toggle("pending", state === "pending");
  const indicator = item.querySelector("i");
  if (indicator) indicator.textContent = state === "done" ? "✓" : state === "current" ? "•" : "–";
}

function setFirstUseStepState(step, state = "pending") {
  const item = firstUseChecklistCard?.querySelector(`[data-first-use-step="${step}"]`);
  if (!item) return;
  item.dataset.state = state;
  item.classList.toggle("done", state === "done");
  item.classList.toggle("current", state === "current");
  item.classList.toggle("pending", state === "pending");
}

function updateDataRealityCard() {
  if (!dataRealityCard) return;
  const connected = isLoggedIn();
  const authorized = hasFamilyAccess();
  const appAdmin = isGlobalAppAdmin();

  if (authorized || (appAdmin && !window.__ninouAdminFamilyDataOpen)) {
    dataRealityCard.hidden = true;
    return;
  }

  dataRealityCard.hidden = false;

  if (!connected) {
    dataRealityCard.dataset.mode = "demo";
    if (dataRealityKicker) dataRealityKicker.textContent = "Demonstração";
    if (dataRealityTitle) dataRealityTitle.textContent = "Você está vendo uma prévia do Ninou.";
    if (dataRealityText) dataRealityText.textContent = "As telas de Hoje, Diário, Dados e Sons usam prévia visual até uma conta familiar ser conectada.";
    return;
  }

  dataRealityCard.dataset.mode = "pending";
  if (dataRealityKicker) dataRealityKicker.textContent = "Conta conectada";
  if (dataRealityTitle) dataRealityTitle.textContent = "Falta conectar uma família.";
  if (dataRealityText) dataRealityText.textContent = "Use o código de convite recebido do administrador para liberar os dados reais da rotina.";
}

function getFirstUseChecklistState() {
  const identity = loadCurrentCaregiverIdentity();
  const renderedCaregiver = String(deviceCaregiverName?.textContent || "").trim();
  const hasRenderedCaregiver = Boolean(renderedCaregiver && renderedCaregiver !== "Não configurado");
  const hasName = Boolean(
    String(identity.name || "").trim()
      || String(caregiverNameInput?.value || "").trim()
      || hasRenderedCaregiver,
  );
  const hasRelation = Boolean(
    String(identity.relation || "").trim()
      || String(identity.relationshipLabel || "").trim()
      || String(caregiverRelationInput?.value || "").trim(),
  );
  const themeValue = String(
    themeModeInput?.value
      || babyProfile?.themeMode
      || localStorage.getItem(storageKeys.themeMode)
      || "dark",
  ).trim();
  const hasTheme = Boolean(themeValue);
  const hasRoutine = Array.isArray(state?.events) && state.events.length > 0;

  return { hasName, hasRelation, hasTheme, hasRoutine };
}

function isFirstUseChecklistComplete() {
  if (!hasFamilyAccess()) return false;
  const { hasName, hasRelation, hasTheme } = getFirstUseChecklistState();
  return hasName && hasRelation && hasTheme;
}

function isProfileReadyForDailyUse() {
  return Boolean(hasFamilyAccess() && !isGlobalAppAdmin() && isFirstUseChecklistComplete());
}

function updateProfileReadyExperience() {
  const connected = isLoggedIn();
  const authorized = hasFamilyAccess();
  const appAdmin = isGlobalAppAdmin();
  const ready = isProfileReadyForDailyUse();
  const familyAdmin = isFamilyAdmin();
  const baby = getBabyDisplayName();
  const identity = loadCurrentCaregiverIdentity();
  const role = authorized ? getEffectiveRole(familyAccess?.role || "responsavel", cloudUser?.email || familyAccess?.email || "") : "";

  document.body.classList.toggle("profile-daily-ready", ready);

  if (premiumTrustCard) premiumTrustCard.hidden = connected;
  if (profileReadyCard) {
    profileReadyCard.hidden = true;
    if (ready) {
      if (profileReadyKicker) profileReadyKicker.textContent = "Conta pronta";
      if (profileReadyTitle) profileReadyTitle.textContent = `Perfil de ${baby} configurado.`;
      if (profileReadyText) profileReadyText.textContent = "O fluxo inicial foi concluído. Esta tela agora mostra somente itens úteis para o uso diário e ajustes pontuais.";
      if (profileReadyFamily) profileReadyFamily.textContent = `Família de ${baby}`;
      if (profileReadyRole) profileReadyRole.textContent = getRoleLabel(role);
      if (profileReadyDevice) profileReadyDevice.textContent = identity.name ? `${identity.name}${identity.relationshipLabel ? ` • ${identity.relationshipLabel}` : ""}` : "Identificado";
    }
  }

  const journeyCard = document.querySelector("#accountJourneyCard");
  if (journeyCard && authorized) journeyCard.hidden = true;
  if (postAccessCard && authorized) postAccessCard.hidden = true;
  if (dataRealityCard && authorized) dataRealityCard.hidden = true;
  if (familyWelcomeCard && ready) familyWelcomeCard.hidden = true;
  if (familyAccessCard) {
    familyAccessCard.hidden = Boolean(ready && !familyAdmin && !appAdmin);
  }

  normalizeLoggedProfileCards();
}

function normalizeLoggedProfileCards() {
  const connected = isLoggedIn();
  const authorized = hasFamilyAccess();
  const appAdmin = isGlobalAppAdmin();
  const ready = Boolean(authorized && !authAccessLoading && (!appAdmin || Boolean(window.__ninouAdminFamilyDataOpen)));

  document.body.classList.toggle("family-ready", ready);

  if (ready) {
    if (guestWelcomeCard) guestWelcomeCard.hidden = true;
    if (premiumTrustCard) premiumTrustCard.hidden = true;
    const journeyCard = document.querySelector("#accountJourneyCard");
    if (journeyCard) journeyCard.hidden = true;
    if (postAccessCard) postAccessCard.hidden = true;
    if (dataRealityCard) dataRealityCard.hidden = true;
  }

  if (loginCard) {
    loginCard.dataset.state = connected ? (authorized ? "family-ready" : "connected") : "guest";
    const kicker = loginCard.querySelector("span");
    const title = loginCard.querySelector("strong");
    if (connected && authorized) {
      if (kicker) kicker.textContent = "Conta e sincronização";
      if (title) title.textContent = cloudUser?.email || "Sessão ativa";
    } else {
      if (kicker) kicker.textContent = "Acesso familiar";
      if (title) title.textContent = "Entrar no Ninou";
    }
  }
}

function updateFirstUseChecklist() {
  if (!firstUseChecklistCard) return;

  const connected = isLoggedIn();
  const authorized = hasFamilyAccess();
  const appAdmin = isGlobalAppAdmin();
  const complete = isFirstUseChecklistComplete();
  firstUseChecklistCard.hidden = appAdmin || !connected || !authorized || complete;
  if (firstUseChecklistCard.hidden) return;

  const { hasName, hasRelation, hasTheme, hasRoutine } = getFirstUseChecklistState();

  setFirstUseStepState("identity", hasName ? "done" : "current");
  setFirstUseStepState("relation", hasRelation ? "done" : hasName ? "current" : "pending");
  setFirstUseStepState("theme", hasTheme ? "done" : "current");
  setFirstUseStepState("routine", hasRoutine ? "done" : "current");
}

function updatePostAccessExperience() {
  updateDataRealityCard();
  updateFirstUseChecklist();

  if (!postAccessCard) return;

  const connected = isLoggedIn();
  const authorized = hasFamilyAccess();
  const appAdmin = isGlobalAppAdmin();
  const pendingCode = normalizeInviteCode(pendingInviteCode || inviteCodeInput?.value || "");
  const baby = getBabyDisplayName();
  const role = authorized ? getEffectiveRole(familyAccess?.role || "responsavel", cloudUser?.email || familyAccess?.email || "") : "";
  const roleLabel = authorized ? getRoleLabel(role) : "";

  postAccessCard.hidden = appAdmin || !connected || authorized;
  if (postAccessCard.hidden) return;

  postAccessCard.dataset.state = authorized ? "accepted" : pendingCode ? "pending-invite" : "connected";

  if (authorized) {
    if (postAccessKicker) postAccessKicker.textContent = accessFlowNotice === "invite-accepted" ? "Convite aceito" : "Família conectada";
    if (postAccessTitle) postAccessTitle.textContent = `Você entrou na família de ${baby}.`;
    if (postAccessText) postAccessText.textContent = `Seu acesso: ${roleLabel}. Agora você pode começar a acompanhar a rotina real conforme sua permissão.`;
    if (postAccessAccountStatus) postAccessAccountStatus.textContent = "Conta conectada";
    if (postAccessInviteStatus) postAccessInviteStatus.textContent = familyAccess?.inviteCode ? `Convite ${familyAccess.inviteCode}` : "Acesso validado";
    if (postAccessFamilyStatus) postAccessFamilyStatus.textContent = `Família de ${baby}`;
    setPostStatusState("account", "done");
    setPostStatusState("invite", "done");
    setPostStatusState("family", "done");
  } else {
    if (postAccessKicker) postAccessKicker.textContent = accessFlowNotice === "created" ? "Conta criada" : "Conta conectada";
    if (postAccessTitle) postAccessTitle.textContent = pendingCode ? "Convite detectado. Falta confirmar." : "Agora vamos conectar você à família.";
    if (postAccessText) postAccessText.textContent = pendingCode
      ? "Cole ou confirme o código recebido para liberar a família vinculada ao seu e-mail."
      : "Se você recebeu convite, use o código enviado pelo administrador. Se não recebeu, peça um convite para acessar a rotina real.";
    if (postAccessAccountStatus) postAccessAccountStatus.textContent = cloudUser?.email || "Conta conectada";
    if (postAccessInviteStatus) postAccessInviteStatus.textContent = pendingCode ? `Código ${pendingCode}` : "Aguardando convite";
    if (postAccessFamilyStatus) postAccessFamilyStatus.textContent = "Ainda não liberada";
    setPostStatusState("account", "done");
    setPostStatusState("invite", pendingCode ? "current" : "pending");
    setPostStatusState("family", "pending");
  }

  postAccessCard.querySelectorAll("[data-post-access-action]").forEach((button) => {
    const action = button.dataset.postAccessAction || "";
    if (action === "invite") {
      button.hidden = authorized;
      button.textContent = pendingCode ? "Confirmar convite" : "Conectar convite";
    }
    if (action === "profile") {
      button.hidden = !authorized;
    }
    if (action === "start") {
      button.hidden = !authorized;
    }
  });
}

function buildProfessionalInviteMessage({ familyLabel = "família", baby = getBabyDisplayName(), code = "", link = "", roleLabel = "Acesso familiar" } = {}) {
  return [
    `Você foi convidado para acompanhar a rotina de ${baby} no Ninou.`,
    "",
    `Família: ${familyLabel}`,
    `Permissão: ${roleLabel}`,
    code ? `Código do convite: ${code}` : "",
    link ? `Link de acesso: ${link}` : "",
    "",
    "Crie sua conta com o mesmo e-mail que recebeu este convite. Assim o Ninou conecta você à família certa com segurança."
  ].filter(Boolean).join("\n");
}

function getWhatsAppShareUrl(message = "") {
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}

function renderInviteResultWithMessage({ title = "Convite pronto", familyLabel = "", email = "", role = "responsavel", code = "", link = "" } = {}) {
  if (!inviteResult) return;
  const roleLabel = getRoleLabel(role);
  const message = buildProfessionalInviteMessage({ familyLabel, code, link, roleLabel });
  const whatsappUrl = getWhatsAppShareUrl(message);
  inviteResult.innerHTML = `
    <strong>${escapeHtml(title)}</strong>
    ${familyLabel ? `<span>Família: ${escapeHtml(familyLabel)}</span>` : ""}
    ${code ? `<span>Código: ${escapeHtml(code)}</span>` : ""}
    ${email ? `<span>Envie para: ${escapeHtml(email)}</span>` : ""}
    <div class="invite-result-actions">
      ${link ? `<button type="button" data-copy-invite="${escapeHtml(link)}">Copiar link</button>` : ""}
      <button type="button" data-copy-invite="${escapeHtml(message)}">Copiar mensagem</button>
      <a href="${escapeHtml(whatsappUrl)}" target="_blank" rel="noopener">Enviar pelo WhatsApp</a>
    </div>
  `;
  const preview = document.querySelector("#adminInviteMessagePreview");
  if (preview) {
    preview.innerHTML = `
      <span>Mensagem pronta para WhatsApp</span>
      <p>${escapeHtml(message).replace(/\n/g, "<br>")}</p>
      <small>Copie a mensagem ou envie pelo WhatsApp. O convidado precisa usar o mesmo e-mail informado.</small>
    `;
  }
}


function setJourneyStepState(card, step, state) {
  const item = card?.querySelector(`[data-journey-step="${step}"]`);
  if (!item) return;
  item.dataset.state = state;
  item.classList.toggle("done", state === "done");
  item.classList.toggle("current", state === "current");
  item.classList.toggle("pending", state === "pending");
}

function updateAccountJourneyGuide() {
  const card = document.querySelector("#accountJourneyCard");
  if (!card) return;

  const appAdmin = isGlobalAppAdmin();
  const connected = isLoggedIn();
  const authorized = hasFamilyAccess();
  const pendingCode = normalizeInviteCode(pendingInviteCode || inviteCodeInput?.value || "");
  const hint = card.querySelector("#accountJourneyHint");

  card.hidden = appAdmin || authorized;
  if (appAdmin || authorized) return;

  card.dataset.state = authorized ? "ready" : connected ? "connected" : "guest";

  setJourneyStepState(card, "invite", authorized || pendingCode ? "done" : "current");
  setJourneyStepState(card, "account", connected ? "done" : pendingCode ? "current" : "pending");
  setJourneyStepState(card, "family", authorized ? "done" : connected ? "current" : "pending");
  setJourneyStepState(card, "record", authorized ? "current" : "pending");

  if (hint) {
    hint.textContent = authorized
      ? "Acesso familiar liberado. Agora este aparelho pode registrar e acompanhar a rotina conforme sua permissão."
      : connected
        ? (pendingCode
          ? "Convite detectado. Cole ou confirme o código para conectar esta conta à família certa."
          : "Conta criada. Agora use o código de convite enviado pelo administrador para liberar a família.")
        : (pendingCode
          ? "Convite salvo neste aparelho. Crie sua conta ou entre usando o mesmo e-mail convidado pelo admin."
          : "O admin gera o convite; depois você entra ou cria conta com o mesmo e-mail para liberar a rotina familiar.");
  }

  card.querySelectorAll("[data-journey-action]").forEach((button) => {
    const action = button.dataset.journeyAction || "login";
    if (action === "invite") {
      button.textContent = connected ? "Inserir convite" : "Tenho convite";
      button.hidden = authorized;
    }
    if (action === "create") button.hidden = connected;
    if (action === "login") {
      button.hidden = false;
      button.textContent = connected ? (authorized ? "Ver rotina" : "Conta conectada") : "Entrar agora";
      button.disabled = connected && !authorized;
    }
  });
}

function closeGuestLoginModal() {
  if (guestOnboardingModal) guestOnboardingModal.hidden = true;
}

function openGuestLoginModal() {
  if (isLoggedIn()) {
    showScreen("profile");
    return;
  }
  if (guestOnboardingModal) guestOnboardingModal.hidden = false;
}

function focusProfileAccess(mode = "login") {
  closeGuestLoginModal();
  showScreen("profile");

  const wantsInvite = mode === "invite";
  const wantsCreate = mode === "create";
  if (loginHelper) {
    loginHelper.textContent = wantsInvite
      ? "Entre ou crie sua conta com o mesmo e-mail do convite. Depois cole o código recebido pelo administrador."
      : wantsCreate
        ? "Informe seu e-mail, crie uma senha e toque em Criar conta. Se você recebeu convite, use o mesmo e-mail indicado pelo admin."
        : "Entre para salvar a rotina com segurança e acompanhar o bebê em família.";
  }

  window.setTimeout(() => {
    const loginCard = loginHelper?.closest(".login-card");
    const journeyCard = document.querySelector("#accountJourneyCard");
    const target = wantsInvite && isLoggedIn() ? inviteAcceptBox : (journeyCard || loginCard);
    target?.scrollIntoView({ behavior: "smooth", block: "center" });
    if (wantsInvite && isLoggedIn()) {
      inviteCodeInput?.focus();
    } else {
      loginEmail?.focus();
    }
  }, 220);
}

function syncAvatarModalScrollLock(locked) {
  const shouldLock = Boolean(locked);
  if (shouldLock === avatarModalScrollLocked) {
    return;
  }

  avatarModalScrollLocked = shouldLock;
  document.documentElement?.classList.toggle("avatar-modal-open", shouldLock);
  document.body?.classList.toggle("avatar-modal-open", shouldLock);

  if (shouldLock) {
    avatarModalScrollRestoreY = window.scrollY || window.pageYOffset || 0;
    document.documentElement?.style.setProperty("--avatar-modal-scroll-y", `${-avatarModalScrollRestoreY}px`);
    document.body?.style.setProperty("--avatar-modal-scroll-y", `${-avatarModalScrollRestoreY}px`);
    return;
  }

  const restoreY = Math.max(0, Number(avatarModalScrollRestoreY) || 0);
  document.documentElement?.style.removeProperty("--avatar-modal-scroll-y");
  document.body?.style.removeProperty("--avatar-modal-scroll-y");
  window.requestAnimationFrame(() => {
    window.scrollTo(0, restoreY);
  });
}

function openAvatarEditor() {
  avatarEditorForceOpen = true;
  if (babyAvatarStatus) babyAvatarStatus.textContent = "Escolha um avatar e toque em Salvar para aplicar.";
  renderAvatarEditorVisibility();
  renderAvatarCustomizer();
  babyAvatarCard?.querySelector(".ninou-modal-card")?.focus?.();
}

function closeAvatarEditor(statusText = "") {
  avatarEditorForceOpen = false;
  renderAvatarEditorVisibility();
  if (statusText && babyAvatarStatus) babyAvatarStatus.textContent = statusText;
}
function getCaregiverAvatarDataUrl(label = "Responsável", seed = "", variant = "member") {
  const base = `${label || "Responsável"}-${seed || "ninou"}-${variant}`;
  let hash = 0;
  for (let index = 0; index < base.length; index += 1) hash = ((hash << 5) - hash + base.charCodeAt(index)) | 0;
  const palettes = [
    ["#d9c8ff", "#3b2a73"],
    ["#ffcad4", "#743244"],
    ["#bdebd8", "#17644e"],
    ["#ffd97a", "#6f4b02"],
    ["#aee4f2", "#225d78"],
    ["#ffc096", "#7b3b20"],
  ];
  const [bg, fg] = palettes[Math.abs(hash) % palettes.length];
  const cleaned = String(label || seed || "R").trim();
  const initial = escapeSvgText((cleaned.match(/[A-Za-zÀ-ÿ0-9]/)?.[0] || "R").toUpperCase());
  const icon = variant === "admin" ? "★" : variant === "family" ? "♡" : variant === "known" ? "•" : "✓";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160"><defs><radialGradient id="g" cx="32%" cy="24%" r="85%"><stop offset="0" stop-color="#fffdf8" stop-opacity=".9"/><stop offset="1" stop-color="${bg}"/></radialGradient><filter id="s" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="8" stdDeviation="7" flood-color="#2d2250" flood-opacity=".14"/></filter></defs><circle cx="80" cy="80" r="74" fill="url(#g)" filter="url(#s)"/><circle cx="80" cy="80" r="68" fill="none" stroke="rgba(255,255,255,.82)" stroke-width="5"/><text x="80" y="90" text-anchor="middle" dominant-baseline="middle" font-family="Arial, sans-serif" font-size="64" font-weight="800" fill="${fg}">${initial}</text><circle cx="118" cy="42" r="19" fill="#fff8ef" opacity=".92"/><text x="118" y="48" text-anchor="middle" dominant-baseline="middle" font-family="Arial, sans-serif" font-size="24" font-weight="800" fill="${fg}">${escapeSvgText(icon)}</text></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function renderAvatarOptionButton(container, options, type, avatar = pendingBabyAvatar) {
  if (!container) return;
  const selected = avatar[type];
  const swatchTypes = new Set(["skin", "background", "hairColor"]);

  container.innerHTML = options
    .map((item) => {
      const style = item.value ? ` style="--swatch:${item.value};--swatch-text:${item.text || item.value || "#33224d"}"` : "";
      const preview = type === "hair" ? `<span class="avatar-face-wrap" aria-hidden="true"><img class="avatar-face-thumb avatar-preset-thumb" src="${item.src || getBabyAvatarDataUrl({ ...avatar, hair: item.id })}" alt="" /></span>` : "";
      const content = swatchTypes.has(type)
        ? `<span class="avatar-swatch" aria-hidden="true"></span><small>${escapeHtml(item.label)}</small>`
        : `${preview}<small>${escapeHtml(item.label)}</small>`;

      return `<button type="button" class="avatar-choice ${selected === item.id ? "selected" : ""}" data-avatar-type="${escapeHtml(type)}" data-avatar-value="${escapeHtml(item.id)}" aria-pressed="${selected === item.id ? "true" : "false"}"${style}>${content}</button>`;
    })
    .join("");
}


function applyAvatarPreview(avatar = pendingBabyAvatar) {
  const src = getBabyAvatarDataUrl(avatar);
  if (babyAvatarPreview) babyAvatarPreview.src = src;
  if (!isGlobalAppAdmin() || window.__ninouAdminFamilyDataOpen) {
    updateProfilePhoto(src);
  }
}

function renderAvatarCustomizer() {
  pendingBabyAvatar = normalizeAvatarDraft(pendingBabyAvatar?.hair ? pendingBabyAvatar : babyProfile.avatar || {});
  renderAvatarOptionButton(avatarIconOptions, babyAvatarHairOptions, "hair", pendingBabyAvatar);
  avatarIconOptions?.closest(".avatar-picker-section")?.removeAttribute("hidden");
  applyAvatarPreview(pendingBabyAvatar);
  renderAvatarEditorVisibility();
}


function updatePendingAvatar(type, value) {
  pendingBabyAvatar = normalizeAvatarDraft({ ...pendingBabyAvatar, [type]: value });
  renderAvatarCustomizer();
  if (babyAvatarStatus) babyAvatarStatus.textContent = "Prévia atualizada. Toque em Salvar para aplicar.";
}

function saveBabyAvatarFromDraft() {
  if (!requireLogin("salvar o avatar")) return;
  babyProfile = normalizeBabyProfile({
    ...babyProfile,
    avatar: normalizeAvatarDraft(pendingBabyAvatar),
    avatarConfigured: true,
  });
  currentProfilePhoto = "";
  localStorage.removeItem(storageKeys.photo);
  markProfileLocallyChanged();
  saveBabyProfile();
  renderAvatarCustomizer();
  renderBabyIdentity();
  scheduleProfileCloudSave();
  closeAvatarEditor("Avatar salvo com sucesso.");
  if (loginHelper) loginHelper.textContent = "Avatar salvo com sucesso.";
}



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

function getCurrentActorUid() {
  return String(cloudUser?.uid || "").trim();
}

function getFallbackActorNameFromEmail(email = getCurrentActorEmail()) {
  if (!email || email === "este aparelho") return "este aparelho";
  if (isGlobalAdminEmail(email)) return "Admin";
  return email.split("@")[0].replace(/[._-]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getCurrentActorProfile() {
  const email = getCurrentActorEmail();
  const localIdentity = loadCurrentCaregiverIdentity();
  const storedName = String(localIdentity.name || "").trim();
  const storedRelationshipLabel = String(localIdentity.relationshipLabel || getCaregiverRelationLabel(localIdentity.relation) || "").trim();
  const isPrimaryAdmin = isGlobalAdminEmail(email);
  const displayName = storedName || (isPrimaryAdmin ? "Luiz Felipe" : "");
  const relationshipLabel = storedRelationshipLabel || (isPrimaryAdmin ? "Pai" : "");
  const label = [displayName, relationshipLabel].filter(Boolean).join(" · ") || getFallbackActorNameFromEmail(email);
  const role = getEffectiveRole(familyAccess?.role || "responsavel", email);
  return {
    uid: getCurrentActorUid(),
    email,
    deviceId: getOrCreateCaregiverDeviceId(),
    displayName,
    relationshipLabel,
    familyId: familyAccess?.familyId || "",
    accessLevel: getRoleLabel(role),
    label,
  };
}

function getCurrentActorName() {
  return getCurrentActorProfile().label;
}

function getCurrentActorRelationship() {
  return getCurrentActorProfile().relationshipLabel;
}

function getActiveBabyId() {
  return String(
    babyProfile?.babyId ||
    babyProfile?.id ||
    familyAccess?.babyId ||
    familyAccess?.familyId ||
    getActiveFamilyId() ||
    "",
  ).trim();
}

function formatCaregiverNameRole(name = "", role = "") {
  const cleanName = String(name || "").trim();
  const cleanRole = String(role || "").trim();
  return [cleanName, cleanRole].filter(Boolean).join(" · ");
}

function getStandardEventFields(type, eventTime = Date.now(), actor = getCurrentActorProfile()) {
  const safeType = normalizeEvent({ type, start: eventTime })?.type || type;
  const label = getEventConfig(safeType).title || safeType;
  const familyId = actor.familyId || getActiveFamilyId() || "";
  return {
    type: safeType,
    label,
    eventTime: Number(eventTime),
    caregiverName: actor.displayName || actor.label,
    caregiverRole: actor.relationshipLabel,
    caregiverRelationship: actor.relationshipLabel,
    caregiverLabel: formatCaregiverNameRole(actor.displayName || actor.label, actor.relationshipLabel) || actor.label,
    createdByName: actor.displayName || actor.label,
    createdByRole: actor.relationshipLabel,
    createdByLabel: formatCaregiverNameRole(actor.displayName || actor.label, actor.relationshipLabel) || actor.label,
    babyId: getActiveBabyId() || familyId,
    familyId,
  };
}

const caregiverIdentityStoragePrefix = "ninou.caregiverIdentity";
const caregiverDeviceIdKey = "ninou.deviceId";

/*
  v75.56.2.1.1 — identificação por aparelho

  A família usa a mesma conta (francisco@gmail.com) em mais de um celular.
  Por isso, a identificação do cuidador não pode ser salva na conta global.
  Ela fica salva somente neste aparelho:
  - celular do Felipe: Felipe / Pai
  - celular da Maria: Maria / Mãe
*/
function getOrCreateCaregiverDeviceId() {
  try {
    const current = String(localStorage.getItem(caregiverDeviceIdKey) || "").trim();
    if (current) return current;
    const randomPart = (window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`);
    const deviceId = `device-${String(randomPart).replace(/[^a-zA-Z0-9-]/g, "").slice(0, 48)}`;
    localStorage.setItem(caregiverDeviceIdKey, deviceId);
    return deviceId;
  } catch {
    return "device-local";
  }
}

function getCurrentIdentityEmail() {
  return normalizeEmail(cloudUser?.email || familyAccess?.email || "");
}

function getCaregiverIdentityKey() {
  return `${caregiverIdentityStoragePrefix}.${getOrCreateCaregiverDeviceId()}`;
}

function getLegacyCaregiverIdentityKey(email = getCurrentIdentityEmail()) {
  return `${caregiverIdentityStoragePrefix}.${normalizeEmail(email || "local")}`;
}

function clearCaregiverIdentityForEmail(_email = getCurrentIdentityEmail()) {
  // v75.56.2.1.1: não limpamos a identificação local do aparelho ao trocar/logout de conta.
  // Ela pertence ao celular, não ao e-mail compartilhado da família.
}

function getCaregiverRelationLabel(value = "") {
  const labels = {
    pai: "Pai",
    mae: "Mãe",
    avo: "Avó",
    avo_masculino: "Avô",
    cuidador: "Cuidador(a)",
    baba: "Babá",
    responsavel: "Responsável",
    outro: "Familiar",
  };
  return labels[String(value || "").trim()] || "";
}

function loadCurrentCaregiverIdentity() {
  try {
    let data = JSON.parse(localStorage.getItem(getCaregiverIdentityKey()) || "{}");

    // Migração suave: se este aparelho tinha identidade antiga por e-mail, copia uma vez
    // para a nova chave por dispositivo, sem depender da conta compartilhada.
    if (!data.displayName && !data.name && !data.relationship && !data.relation) {
      const legacyData = JSON.parse(localStorage.getItem(getLegacyCaregiverIdentityKey()) || "{}");
      if (legacyData.displayName || legacyData.name || legacyData.relationship || legacyData.relation) {
        data = legacyData;
        localStorage.setItem(getCaregiverIdentityKey(), JSON.stringify({ ...legacyData, deviceId: getOrCreateCaregiverDeviceId() }));
      }
    }

    const name = String(data.displayName || data.name || "").trim();
    const relation = String(data.relationship || data.relation || "").trim();
    const relationLabel = String(data.relationshipLabel || getCaregiverRelationLabel(relation) || "").trim();
    return {
      name,
      relation,
      relationshipLabel: relationLabel,
      label: name || relationLabel,
      deviceId: String(data.deviceId || getOrCreateCaregiverDeviceId()).trim(),
    };
  } catch {
    return { name: "", relation: "", relationshipLabel: "", label: "", deviceId: getOrCreateCaregiverDeviceId() };
  }
}

function saveCurrentCaregiverIdentity(name = "", relation = "", extras = {}) {
  const email = getCurrentIdentityEmail();
  const cleanName = String(name || "").trim();
  const cleanRelation = String(relation || "").trim();
  const relationshipLabel = String(extras.relationshipLabel || getCaregiverRelationLabel(cleanRelation) || "").trim();
  const role = getEffectiveRole(familyAccess?.role || "responsavel", email);
  const payload = {
    uid: String(extras.uid || getCurrentActorUid() || "").trim(),
    email,
    deviceId: getOrCreateCaregiverDeviceId(),
    displayName: cleanName,
    name: cleanName,
    relationship: cleanRelation,
    relation: cleanRelation,
    relationshipLabel,
    familyId: extras.familyId || familyAccess?.familyId || "",
    accessLevel: extras.accessLevel || getRoleLabel(role),
    savedLocally: true,
    updatedAt: extras.updatedAt || new Date().toISOString(),
  };
  try {
    localStorage.setItem(getCaregiverIdentityKey(), JSON.stringify(payload));
  } catch {}
  return true;
}

function getCaregiverEmoji(relation = "") {
  const value = String(relation || "").trim();
  if (value === "pai") return "👨‍🍼";
  if (value === "mae") return "👩‍🍼";
  if (value === "avo" || value === "avo_masculino") return value === "avo" ? "👵" : "👴";
  if (value === "baba" || value === "cuidador") return "🧑‍🍼";
  return "👤";
}

function getProfileFamilyBabyName() {
  const cleanName = String(getBabyName() || "").trim();
  return cleanName;
}

function getProfileFamilyDisplayName() {
  const babyName = getProfileFamilyBabyName();
  if (!babyName) return "Família Ninou";
  const article = babyProfile?.article === "da" ? "da" : "do";
  return `Família ${article} ${babyName}`;
}

function setProfileFamilyStackVisible(visible) {
  if (!profileFamilyStack) return;
  profileFamilyStack.hidden = !visible;
  profileFamilyStack.setAttribute("aria-hidden", visible ? "false" : "true");
}

function resetProfileFamilyCardsForGuest() {
  setProfileFamilyStackVisible(false);
  if (familyProfileBabyMeta) familyProfileBabyMeta.textContent = "Entre para carregar o perfil familiar.";
  if (deviceCaregiverName) deviceCaregiverName.textContent = "Não configurado";
  if (deviceCaregiverAvatar) deviceCaregiverAvatar.textContent = "👤";
  if (deviceCaregiverRelationChip) deviceCaregiverRelationChip.textContent = "Vínculo não definido";
  if (deviceCaregiverHint) deviceCaregiverHint.textContent = "Entre em uma conta familiar para configurar o cuidador deste aparelho.";
  if (familyNameLabel) familyNameLabel.textContent = "Família não conectada";
  if (familyAccountLabel) familyAccountLabel.textContent = cloudUser?.email || "Conta não conectada";
  if (familyAccessTypeLabel) familyAccessTypeLabel.textContent = cloudUser ? "Aguardando convite" : "Visitante";
  if (familyInviteDescription) familyInviteDescription.textContent = "Entre com uma conta familiar para gerar ou aceitar convites de cuidador.";
  if (familyActiveInviteBox) familyActiveInviteBox.hidden = true;
  if (familyInviteShareActions) familyInviteShareActions.hidden = true;
  if (familyActiveInviteCode) familyActiveInviteCode.textContent = "—";
  if (familyActiveInviteHint) familyActiveInviteHint.textContent = "Nenhum convite ativo";
}

function isSleepBoundaryEvent(event = {}) {
  if (isSleepEvent(event)) return true;
  const text = [event.type, event.label, event.detail].filter(Boolean).join(" ").toLowerCase();
  if (/acord|wake|despert/.test(text)) return false;
  return /sono|soneca|dormiu|dormir|hora de dormir|bedtime|sleep|nap/.test(text);
}

function formatAwakeDuration(ms = 0) {
  const minutes = Math.max(0, Math.round(Number(ms) / 60000));
  if (minutes < 60) return `${minutes} min`;
  const hoursValue = Math.floor(minutes / 60);
  const minutesValue = minutes % 60;
  return minutesValue ? `${hoursValue}h ${minutesValue}min` : `${hoursValue}h`;
}

function getProfileActorLabel(event = {}) {
  const baby = String(getBabyDisplayName() || "").trim().toLowerCase();
  const caregiverName = String(event.caregiverName || "").trim();
  const directCaregiver = formatCaregiverNameRole(event.caregiverName, event.caregiverRole || event.caregiverRelationship);
  const actor = caregiverName && baby && caregiverName.toLowerCase() === baby
    ? getActorDisplayNameFromEvent(event)
    : directCaregiver || getActorDisplayNameFromEvent(event);
  return String(actor || "Responsável").replace(/\s*·\s*/g, "/");
}

function getTodayAwakeCalculation(now = Date.now(), sourceEvents = null) {
  const todayStart = getDayStart(now);
  const todayEnd = todayStart + day;
  const upperLimit = Math.min(todayEnd, now + 2 * 60000);
  const events = (Array.isArray(sourceEvents) ? sourceEvents : getFamilyEventsForWindow(todayStart, todayEnd))
    .map(normalizeEvent)
    .filter(Boolean)
    .filter((event) => eventOverlapsWindow(event, todayStart, todayEnd))
    .filter((event) => getEventOrderTime(event) >= todayStart && getEventOrderTime(event) <= upperLimit);

  const wakeEvent = sortEventsByStartDesc(events)
    .find((event) => event.type === "acordou" && getEventOrderTime(event) >= todayStart && getEventOrderTime(event) <= upperLimit);

  if (!wakeEvent) {
    return {
      hasWake: false,
      isOpen: false,
      wakeEvent: null,
      wakeAt: null,
      endEvent: null,
      endAt: null,
      durationMs: null,
      sinceLabel: "Ainda não registrado",
      durationLabel: "—",
      lastActionLabel: "Ainda não registrado",
    };
  }

  const wakeAt = getEventOrderTime(wakeEvent);
  const nextSleepEvent = sortEventsByStartAsc(events)
    .find((event) => isSleepBoundaryEvent(event) && getEventOrderTime(event) > wakeAt && getEventOrderTime(event) <= upperLimit);

  const currentDayState = getFamilyDayState(getCurrentDayId());
  const activeSleepStart = currentDayState?.mode === "sleeping" ? Number(currentDayState.activeStartedAt) : null;
  const activeSleepBoundary = Number.isFinite(activeSleepStart) && activeSleepStart > wakeAt && activeSleepStart <= upperLimit
    ? activeSleepStart
    : null;
  const nextSleepAt = nextSleepEvent ? getEventOrderTime(nextSleepEvent) : null;
  const endAt = Number.isFinite(activeSleepBoundary) && (!Number.isFinite(nextSleepAt) || activeSleepBoundary < nextSleepAt)
    ? activeSleepBoundary
    : Number.isFinite(nextSleepAt)
      ? nextSleepAt
      : now;
  const durationMs = Math.max(0, endAt - wakeAt);

  return {
    hasWake: true,
    isOpen: !Number.isFinite(nextSleepAt) && !Number.isFinite(activeSleepBoundary),
    wakeEvent,
    wakeAt,
    endEvent: nextSleepEvent || null,
    endAt,
    durationMs,
    sinceLabel: formatTime(wakeAt),
    durationLabel: formatAwakeDuration(durationMs),
    lastActionLabel: `${getEventConfig(wakeEvent.type).title} — registrado por ${getProfileActorLabel(wakeEvent)}`,
  };
}

function renderProfileFamilyCards() {
  const familyReady = canUsePrivateFeatures();
  if (!familyReady) {
    resetProfileFamilyCardsForGuest();
    return;
  }

  setProfileFamilyStackVisible(true);
  const identity = loadCurrentCaregiverIdentity();
  const caregiverLabel = identity.label || "Não configurado";
  const babyName = getProfileFamilyBabyName();
  const familyLabel = getProfileFamilyDisplayName();

  if (familyProfileBabyMeta) familyProfileBabyMeta.textContent = `Ajustes usados no diário ${babyName ? `de ${babyName}` : "do bebê"}.`;
  if (deviceCaregiverName) deviceCaregiverName.textContent = caregiverLabel;
  if (deviceCaregiverAvatar) deviceCaregiverAvatar.textContent = getCaregiverEmoji(identity.relation);
  if (deviceCaregiverRelationChip) {
    deviceCaregiverRelationChip.textContent = identity.relationshipLabel || "Vínculo não definido";
  }
  if (deviceCaregiverHint) {
    deviceCaregiverHint.textContent = identity.label
      ? `Registros feitos neste aparelho serão assinados como ${identity.label}.`
      : "Escolha quem está usando este aparelho para os registros ficarem corretos.";
  }
  if (familyNameLabel) familyNameLabel.textContent = familyLabel;
  if (familyAccountLabel) familyAccountLabel.textContent = cloudUser?.email || familyAccess?.email || "Conta não conectada";
  if (familyAccessTypeLabel) familyAccessTypeLabel.textContent = getRoleLabel(familyAccess?.role || "responsavel");
  if (familyInviteDescription) familyInviteDescription.textContent = `Compartilhe um código para outro cuidador acompanhar a rotina ${babyName ? `de ${babyName}` : "do bebê"}.`;
  renderFamilyActiveInvite();
}

function openCaregiverEditor() {
  showScreen("profile");
  renderCaregiverIdentityPanel();
  if (caregiverIdentityCard) {
    caregiverIdentityCard.hidden = false;
    caregiverIdentityCard.dataset.userOpened = "true";
    caregiverIdentityCard.open = true;
  }
  setTimeout(() => {
    caregiverIdentityCard?.scrollIntoView({ behavior: "smooth", block: "center" });
    caregiverNameInput?.focus();
  }, 50);
}

function closeCaregiverEditor() {
  if (caregiverIdentityCard) {
    caregiverIdentityCard.open = false;
    delete caregiverIdentityCard.dataset.userOpened;
  }
}

function renderCaregiverIdentityPanel() {
  const logged = Boolean(cloudUser);
  const familyReady = canUsePrivateFeatures();
  setProfileFamilyStackVisible(familyReady);
  if (!familyReady) {
    resetProfileFamilyCardsForGuest();
  }
  if (!caregiverIdentityCard) return;
  caregiverIdentityCard.hidden = !familyReady;
  if (!familyReady) return;
  const identity = loadCurrentCaregiverIdentity();
  const isPrimaryAdmin = isGlobalAppAdmin();
  caregiverIdentityCard.classList.toggle("caregiver-configured", Boolean(identity.label));
  if (identity.label && !caregiverIdentityCard.dataset.userOpened) {
    caregiverIdentityCard.open = false;
  }
  if (document.activeElement !== caregiverNameInput) caregiverNameInput.value = identity.name || (isPrimaryAdmin ? "Luiz Felipe" : "");
  if (document.activeElement !== caregiverRelationInput) caregiverRelationInput.value = identity.relation || (isPrimaryAdmin ? "pai" : "");
  if (saveCaregiverIdentityButton) {
    saveCaregiverIdentityButton.textContent = identity.label ? "Salvar alterações" : "Salvar cuidador";
  }
  if (caregiverIdentityStatus) {
    caregiverIdentityStatus.textContent = identity.label
      ? `Os próximos registros deste aparelho serão assinados como ${identity.label}.`
      : (isPrimaryAdmin
        ? "Sugestão inicial: Luiz Felipe / Pai. Admin é permissão do sistema; Pai é apenas como os registros aparecem no diário."
        : "Defina o nome e o vínculo que aparecerão nos registros deste aparelho.");
  }
  renderProfileFamilyCards();
}

async function saveCaregiverIdentityFromForm() {
  const name = caregiverNameInput?.value || "";
  const relation = caregiverRelationInput?.value || "";

  // v75.56.2.1.1: salva somente neste aparelho.
  // Não grava em users/{uid}/account/profile para não trocar o nome do cuidador
  // em todos os celulares que usam a conta compartilhada francisco@gmail.com.
  saveCurrentCaregiverIdentity(name, relation);
  const identity = loadCurrentCaregiverIdentity();

  if (saveCaregiverIdentityButton) {
    saveCaregiverIdentityButton.textContent = identity.label ? "Salvar alterações" : "Salvar identificação";
  }

  if (caregiverIdentityStatus) caregiverIdentityStatus.textContent = identity.label
    ? `Os próximos registros deste aparelho serão assinados como ${identity.label}.`
    : "Identificação limpa neste aparelho. Usaremos o e-mail quando necessário.";

  renderCaregiverIdentityPanel();
  closeCaregiverEditor();
}

function getActorDisplayNameFromEvent(event = {}) {
  const baby = String(getBabyDisplayName() || "").trim().toLowerCase();
  const candidates = [
    formatCaregiverNameRole(event.caregiverName, event.caregiverRole || event.caregiverRelationship),
    event.caregiverLabel,
    event.createdByLabel,
    formatCaregiverNameRole(event.createdByName, event.createdByRole || event.createdByRelationship),
    event.createdByName,
    event.createdByRole,
    event.createdByRelationship,
    event.authorName,
    event.responsibleName,
    formatCaregiverNameRole(event.updatedByName, event.updatedByRelationship),
    event.updatedByName,
    event.updatedByRelationship,
  ];
  for (const candidate of candidates) {
    const text = String(candidate ?? "").trim();
    if (!text || text === "undefined" || text === "null") continue;
    if (baby && text.toLowerCase() === baby) continue;
    return text;
  }
  const fallback = String(event.createdByEmail || event.updatedByEmail || "").trim();
  if (!fallback || fallback === "undefined" || fallback === "null") return "Responsável";
  if (baby && fallback.toLowerCase() === baby) return "Responsável";
  return fallback;
}

function makeAuditEntry(action, event, at = new Date().toISOString()) {
  const config = event?.type ? getEventConfig(event.type) : { title: "Registro" };
  const actor = getCurrentActorProfile();
  return {
    id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    action,
    title: config.title || "Registro",
    at,
    byUid: actor.uid,
    byEmail: actor.email,
    byDeviceId: actor.deviceId,
    byName: actor.displayName || actor.label,
    byRelationship: actor.relationshipLabel,
    eventId: event?.id || "",
  };
}

function pushAuditEntry(action, event) {
  if (action === "adicionou") return;
  state.auditLog = Array.isArray(state.auditLog) ? state.auditLog : [];
  state.auditLog.push(makeAuditEntry(action, event));
  state.auditLog = state.auditLog.slice(-60);
}

function makeEvent(type, start, end = start, detail = "", notes = "") {
  const nowIso = new Date().toISOString();
  const actor = getCurrentActorProfile();
  const standardFields = getStandardEventFields(type, start, actor);
  return applyWakeWindowMetadata(createRoutineEvent(type, start, end, detail, notes, {
    ...standardFields,
    createdAt: nowIso,
    updatedAt: nowIso,
    createdByUid: actor.uid,
    createdByEmail: actor.email,
    createdByDeviceId: actor.deviceId,
    createdByName: actor.displayName || actor.label,
    createdByRelationship: actor.relationshipLabel,
    createdByRole: actor.relationshipLabel,
    createdByLabel: formatCaregiverNameRole(actor.displayName || actor.label, actor.relationshipLabel) || actor.label,
    createdAtClient: Date.now(),
    lastAction: "adicionou",
  }));
}

function normalizeEvent(event = {}) {
  return normalizeRoutineEvent(event);
}

function normalizeDayState(dayState = {}) {
  return normalizeRoutineDayState(dayState);
}

function sanitizeLocalStorageSegment(value = "") {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9@._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "guest";
}

function getActiveFamilyCacheScope() {
  const familyId = familyAccess?.familyId || "";
  if (familyId) return `family.${familyId}`;

  const ownerEmail = getVisibleDataOwnerEmail?.() || normalizeEmail(cloudUser?.email || localStorage.getItem(storageKeys.email) || "");
  if (ownerEmail) return `account.${ownerEmail}`;

  return "guest.local";
}

function getLocalDayStateStorageKey(dayId = getCurrentDayId(), familyId = "") {
  const safeDayId = isDateId(dayId) ? dayId : getCurrentDayId();
  const scope = sanitizeLocalStorageSegment(familyId ? `family.${familyId}` : getActiveFamilyCacheScope());
  return `${storageKeys.dayState}.${scope}.${safeDayId}`;
}

function getLegacyLocalDayStateStorageKey(dayId = getCurrentDayId()) {
  const safeDayId = isDateId(dayId) ? dayId : getCurrentDayId();
  return `${storageKeys.dayState}.${safeDayId}`;
}

function getExplicitDayIdFromState(dayState = {}) {
  const candidates = [dayState?.dayId, dayState?.date, dayState?.id];
  return candidates.find((value) => isDateId(value)) || "";
}

function dayStateBelongsToDay(dayState = {}, dayId = getCurrentDayId()) {
  const safeDayId = isDateId(dayId) ? dayId : getCurrentDayId();
  const explicitDayId = getExplicitDayIdFromState(dayState);

  // v75.58.3: se o estado já tem marcador de dia, ele não pode ser reaproveitado em outro dia.
  // Isso evita que Observações do dia 1 apareçam no dia 2/3 por cache legado.
  if (explicitDayId) return explicitDayId === safeDayId;

  const events = Array.isArray(dayState?.events) ? dayState.events : [];
  if (!events.length) return false;

  return events.every((event = {}) => {
    const start = Number(event.start);
    return Number.isFinite(start) && toDateInputValue(start) === safeDayId;
  });
}

function loadLocalDayState(dayId = getCurrentDayId()) {
  const safeDayId = isDateId(dayId) ? dayId : getCurrentDayId();

  try {
    const scopedValue = localStorage.getItem(getLocalDayStateStorageKey(safeDayId));
    if (scopedValue !== null && typeof scopedValue !== "undefined") {
      return sanitizeDayStateForDay(JSON.parse(scopedValue || "{}"), safeDayId);
    }
  } catch {
    // Se o cache por família+dia estiver inválido, cai para os fluxos seguros abaixo.
  }

  try {
    const legacyDailyValue = localStorage.getItem(getLegacyLocalDayStateStorageKey(safeDayId));
    if (legacyDailyValue !== null && typeof legacyDailyValue !== "undefined") {
      const legacyDailyState = JSON.parse(legacyDailyValue || "{}");
      if (dayStateBelongsToDay(legacyDailyState, safeDayId) || !dayStateHasVisibleContent(legacyDailyState)) {
        const sanitized = sanitizeDayStateForDay(legacyDailyState, safeDayId);
        localStorage.setItem(getLocalDayStateStorageKey(safeDayId), JSON.stringify(sanitized));
        return sanitized;
      }
    }
  } catch {
    // Cache diário antigo inválido. Ignora para não repetir observações.
  }

  // v75.58.3: o cache genérico ninou.demo.dayState não é mais usado para abrir dias,
  // porque ele era a origem de observações e registros herdados entre datas.
  return sanitizeDayStateForDay(createEmptyDayState(), safeDayId);
}

function saveLocalDayState(dayId = getSelectedDayId()) {
  const safeDayId = isDateId(dayId) ? dayId : getCurrentDayId();
  const sanitized = sanitizeDayStateForDay(state, safeDayId, { preserveLive: true });
  const now = Date.now();
  const payload = {
    ...sanitized,
    dayId: safeDayId,
    date: safeDayId,
    dayNotesDayId: sanitized.dayNotes ? safeDayId : "",
    dayNotesUpdatedAt: sanitized.dayNotes ? (sanitized.dayNotesUpdatedAt || now) : 0,
    clientUpdatedAt: now,
  };

  localStorage.setItem(getLocalDayStateStorageKey(safeDayId), JSON.stringify(payload));
  localStorage.setItem(getLegacyLocalDayStateStorageKey(safeDayId), JSON.stringify(payload));

  // Compatibilidade apenas como espelho do dia atualmente carregado.
  // O app não usa mais este cache genérico para abrir outros dias.
  localStorage.setItem(storageKeys.dayState, JSON.stringify(payload));
  persistVisibleContextForCurrentOwner();
}

const visibleContextKeys = [
  storageKeys.profile,
  storageKeys.profileVersion,
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
  currentProfilePhoto = "";
  localStorage.removeItem(storageKeys.photo);
  profileClientUpdatedAt = Number(localStorage.getItem(storageKeys.profileVersion)) || 0;
  state = loadLocalDayState(getSelectedDayId());
  setVisibleDataOwnerEmail(ownerEmail);
  return restoredAny;
}

function refreshVisibleContextUi() {
  updateProfilePhoto(getBabyAvatarDataUrl(babyProfile.avatar || pendingBabyAvatar));
  syncBabyProfileForm();
  if (wakeWindowInput) wakeWindowInput.value = String(wakeWindowMinutes);
  if (wakeWindowValue) wakeWindowValue.textContent = String(wakeWindowMinutes);
  renderAuthControls();
  renderAdminClients(null);
  renderAll();
}

function prepareVisibleContextForAccount(user = cloudUser) {
  familyBootstrapReady = false;
  document.body.classList.remove("family-ready");
  const email = normalizeEmail(user?.email || "");
  if (!email) return;

  const previousOwner = getVisibleDataOwnerEmail();
  if (previousOwner && previousOwner !== email) {
    saveCurrentVisibleContextForOwner(previousOwner);
  }

  /*
    v75.59.2 — Login sem dados fantasma:
    antes o app restaurava o cache local da última sessão assim que o Auth confirmava o usuário.
    Isso deixava a tela mostrar rotina/perfil antigos enquanto o Firestore ainda carregava, causando
    "informações inconsistentes". Agora a visualização fica limpa até a família/perfil/dia reais chegarem.
  */
  clearGenericVisibleContext();
  setVisibleDataOwnerEmail(email);
  saveFamilyAccess(null);
  resetFamilyDayCache();
  selectedDiaryDay = getDayStart();
  autoSelectedLatestFamilyDay = false;
  wakeWindowMinutes = 70;
  babyProfile = normalizeBabyProfile({ themeMode: localStorage.getItem(storageKeys.themeMode) || "dark" });
  currentProfilePhoto = "";
  profileClientUpdatedAt = 0;
  state = createEmptyDayState();
  loadedStateDayId = getCurrentDayId();
  updateProfilePhoto(getBabyAvatarDataUrl(babyProfile.avatar || pendingBabyAvatar));
  refreshVisibleContextUi();
}

function resetVisibleContextForGuest() {
  familyBootstrapReady = false;
  document.body.classList.remove("family-ready", "sync-bootstrap");
  const previousOwner = getVisibleDataOwnerEmail();
  if (previousOwner) saveCurrentVisibleContextForOwner(previousOwner);
  clearGenericVisibleContext();
  setVisibleDataOwnerEmail("");
  resetFamilyDayCache();
  selectedDiaryDay = null;
  autoSelectedLatestFamilyDay = false;
  wakeWindowMinutes = 70;
  babyProfile = normalizeBabyProfile({ themeMode: localStorage.getItem(storageKeys.themeMode) || "dark" });
  currentProfilePhoto = "";
  profileClientUpdatedAt = 0;
  state = createEmptyDayState();
  updateProfilePhoto(getBabyAvatarDataUrl(babyProfile.avatar || pendingBabyAvatar));
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
  babyProfile = normalizeBabyProfile({ themeMode: localStorage.getItem(storageKeys.themeMode) || "dark" });
  currentProfilePhoto = "";
  profileClientUpdatedAt = 0;
  state = createEmptyDayState();
  setAdminAccountPhoto("", user);
  updateProfilePhoto(getBabyAvatarDataUrl(babyProfile.avatar || pendingBabyAvatar));
  refreshVisibleContextUi();
}

async function loadAdminAccountProfileFromCloud(user = cloudUser) {
  if (!user || !isGlobalAppAdmin(user)) return null;
  try {
    const services = await getFirebaseServices();
    const snapshot = await services.getDoc(services.doc(services.db, "users", user.uid, "account", "profile"));
    const data = snapshot.exists() ? snapshot.data() || {} : {};
    setAdminAccountPhoto("", user);
    if (data.displayName || data.relationship || data.relation || data.relationshipLabel) {
      saveCurrentCaregiverIdentity(String(data.displayName || ""), String(data.relationship || data.relation || ""), {
        uid: user.uid,
        familyId: data.familyId || familyAccess?.familyId || "",
        accessLevel: data.accessLevel || "",
        relationshipLabel: data.relationshipLabel || "",
      });
    }
    renderBabyIdentity();
    return data;
  } catch (error) {
    console.warn("Não foi possível carregar o perfil pessoal do admin:", error);
    setAdminAccountPhoto("", user);
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
      avatarType: "initials",
      photo: "",
      updatedAt: services.serverTimestamp(),
    }, { merge: true });
    return true;
  } catch (error) {
    console.warn("Não foi possível salvar o avatar pessoal do admin:", error);
    return false;
  }
}


async function loadCurrentAccountIdentityFromCloud(user = cloudUser) {
  /*
    v75.56.2.1.1: Felipe e Maria usam a mesma conta da família (francisco@gmail.com),
    mas cada aparelho deve registrar com o próprio nome.
    Por isso, não carregamos displayName/relationship da nuvem para este campo,
    para evitar que Maria/Mãe sobrescreva Felipe/Pai no outro celular.
  */
  renderCaregiverIdentityPanel();
  return {
    source: "device",
    deviceId: getOrCreateCaregiverDeviceId(),
    email: normalizeEmail(user?.email || ""),
  };
}

const familyInviteStorageKey = "ninou.family.activeInvite.v75.57";
let familyActiveInvite = loadFamilyActiveInvite();

function loadFamilyActiveInvite() {
  try {
    return JSON.parse(localStorage.getItem(familyInviteStorageKey) || "null");
  } catch {
    return null;
  }
}

function saveFamilyActiveInvite(invite) {
  familyActiveInvite = invite;
  try {
    if (invite) localStorage.setItem(familyInviteStorageKey, JSON.stringify(invite));
    else localStorage.removeItem(familyInviteStorageKey);
  } catch {}
  renderFamilyActiveInvite();
}

function generateFamilyInviteCode() {
  return createInviteCode();
}

function getFamilyInviteMessage(code) {
  const babyName = getProfileFamilyBabyName();
  const target = babyName ? `do ${babyName}` : "do bebê";
  return `Você foi convidado(a) para acompanhar a rotina ${target} no Ninou.\nCódigo de convite: ${code}\nAcesse o Ninou, toque em Perfil > Entrar com código e informe este código.`;
}

function renderFamilyActiveInvite() {
  const invite = familyActiveInvite;
  const active = Boolean(invite?.code && (!invite.expiresAtClient || Number(invite.expiresAtClient) > Date.now()));
  if (familyActiveInviteBox) familyActiveInviteBox.hidden = !active;
  if (familyInviteShareActions) familyInviteShareActions.hidden = !active;
  if (familyActiveInviteCode) familyActiveInviteCode.textContent = active ? invite.code : "—";
  if (familyActiveInviteHint) familyActiveInviteHint.textContent = active ? "Expira em 7 dias" : "Nenhum convite ativo";
}

async function createFamilyCaregiverInvite() {
  if (!canUsePrivateFeatures()) {
    if (loginHelper) loginHelper.textContent = "Entre em uma família para gerar convite de cuidador.";
    resetProfileFamilyCardsForGuest();
    return;
  }
  const code = generateFamilyInviteCode();
  const now = Date.now();
  const expiry = getInviteExpiryPayload(null, now);
  const actor = getCurrentActorProfile();
  const invite = {
    code,
    familyId: familyAccess?.familyId || APP_ADMIN_FAMILY_ID,
    familyName: getProfileFamilyDisplayName(),
    status: "active",
    role: "cuidador",
    maxUses: INVITE_MAX_USES,
    useCount: 0,
    createdByUid: cloudUser?.uid || null,
    createdByName: actor.label || actor.email || "Cuidador",
    createdAtClient: now,
    expiresAtClient: expiry.expiresAtClient,
  };
  saveFamilyActiveInvite(invite);

  try {
    const services = await getFirebaseServices();
    if (services?.db && cloudUser) {
      const cloudExpiry = getInviteExpiryPayload(services, now);
      const familyInvitePayload = {
        ...invite,
        ...cloudExpiry,
        createdAt: services.serverTimestamp(),
        updatedAt: services.serverTimestamp(),
      };
      const globalInvitePayload = {
        ...getMinimalGlobalInvitePayload({ ...invite, ...cloudExpiry }),
        createdAt: services.serverTimestamp(),
        updatedAt: services.serverTimestamp(),
      };
      await services.setDoc(services.doc(services.db, "families", invite.familyId, "invitations", code), familyInvitePayload, { merge: true });
      await services.setDoc(services.doc(services.db, "invites", code), globalInvitePayload, { merge: true });
    }
  } catch (error) {
    console.warn("Convite salvo apenas localmente:", error);
  }
}

async function copyFamilyInviteCode() {
  if (!familyActiveInvite?.code) return;
  try {
    await navigator.clipboard.writeText(familyActiveInvite.code);
  } catch {
    window.prompt("Copie o código do convite:", familyActiveInvite.code);
  }
}

function shareFamilyInviteOnWhatsApp() {
  if (!familyActiveInvite?.code) return;
  const url = `https://wa.me/?text=${encodeURIComponent(getFamilyInviteMessage(familyActiveInvite.code))}`;
  window.open(url, "_blank", "noopener,noreferrer");
}

function openJoinFamilyModal() {
  if (joinInviteCodeInput) joinInviteCodeInput.value = "";
  if (joinInviteFeedback) joinInviteFeedback.textContent = "";
  if (joinFamilyModal) {
    joinFamilyModal.hidden = false;
    joinFamilyModal.setAttribute("aria-hidden", "false");
  }
  setTimeout(() => joinInviteCodeInput?.focus(), 50);
}

function closeJoinFamilyModal() {
  if (joinFamilyModal) {
    joinFamilyModal.hidden = true;
    joinFamilyModal.setAttribute("aria-hidden", "true");
  }
}

async function confirmJoinFamilyInvite() {
  const code = normalizeInviteCode(joinInviteCodeInput?.value || "");
  if (!code) {
    if (joinInviteFeedback) joinInviteFeedback.textContent = "Digite o código do convite.";
    return;
  }

  try {
    const services = await getFirebaseServices();
    if (!services?.db || !cloudUser) throw new Error("Firebase indisponível");

    let invite = null;
    let familyId = "";

    try {
      const globalInviteSnap = await services.getDoc(services.doc(services.db, "invites", code));
      if (globalInviteSnap.exists()) {
        invite = globalInviteSnap.data() || {};
        familyId = String(invite.familyId || "");
      }
    } catch (error) {
      console.warn("Convite global não disponível. Tentando família conhecida.", error);
    }

    if (!familyId) familyId = familyAccess?.familyId || APP_ADMIN_FAMILY_ID;

    const inviteRef = services.doc(services.db, "families", familyId, "invitations", code);
    const inviteSnap = await services.getDoc(inviteRef);
    if (inviteSnap.exists()) invite = { ...(invite || {}), ...(inviteSnap.data() || {}) };
    if (!inviteSnap.exists() && !invite) throw new Error("Convite não encontrado");
    if (invite.familyId && invite.familyId !== familyId) familyId = invite.familyId;
    if (!isInviteUsable({ ...invite, familyId })) throw new Error(isInviteExpired(invite) ? "Convite expirado" : "Convite inativo ou já utilizado");

    const inviteEmail = normalizeEmail(invite.email || "");
    const userEmail = normalizeEmail(cloudUser.email || "");
    if (inviteEmail && inviteEmail !== userEmail) throw new Error(`Este convite foi criado para ${inviteEmail}.`);

    const role = normalizeInviteRole(invite.role || "cuidador");
    const accessPayload = {
      familyId,
      role,
      email: userEmail,
      ownerUid: invite.ownerUid || invite.createdByUid || invite.createdBy || "",
      inviteCode: code,
      joinedByInvite: code,
    };

    await services.setDoc(services.doc(services.db, "users", cloudUser.uid, "families", familyId), {
      ...accessPayload,
      status: "active",
      joinedAt: services.serverTimestamp(),
      updatedAt: services.serverTimestamp(),
    }, { merge: true });

    await services.setDoc(services.doc(services.db, "users", cloudUser.uid, "access", "ninou"), {
      ...accessPayload,
      joinedAt: services.serverTimestamp(),
      updatedAt: services.serverTimestamp(),
    }, { merge: true });

    await services.setDoc(services.doc(services.db, "families", familyId, "members", cloudUser.uid), {
      uid: cloudUser.uid,
      ...accessPayload,
      status: "active",
      joinedAt: services.serverTimestamp(),
      updatedAt: services.serverTimestamp(),
    }, { merge: true });

    const acceptedPayload = {
      status: "accepted",
      useCount: Number(invite.useCount || 0) + 1,
      acceptedByUid: cloudUser.uid,
      acceptedByEmail: userEmail,
      acceptedAt: services.serverTimestamp(),
      lastAcceptedByUid: cloudUser.uid,
      lastAcceptedByEmail: userEmail,
      lastAcceptedAt: services.serverTimestamp(),
      updatedAt: services.serverTimestamp(),
    };

    await services.setDoc(inviteRef, acceptedPayload, { merge: true });
    try {
      await services.setDoc(services.doc(services.db, "invites", code), acceptedPayload, { merge: true });
    } catch (globalUpdateError) {
      console.warn("Convite aceito, mas o espelho global não foi atualizado:", globalUpdateError);
    }

    saveFamilyAccess({ ...accessPayload, acceptedAt: new Date().toISOString() });
    clearPendingInviteCode();
    await connectCurrentAccount();
    setSyncStatus("online", cloudUser.email || "");

    if (joinInviteFeedback) joinInviteFeedback.textContent = "Convite aceito. Agora configure o cuidador deste aparelho.";
    setTimeout(() => {
      closeJoinFamilyModal();
      openCaregiverEditor();
    }, 700);
  } catch (error) {
    console.warn(error);
    if (joinInviteFeedback) joinInviteFeedback.textContent = error?.message || "Não foi possível validar o convite agora. Verifique o código, a conexão ou as regras do Firebase.";
  }
}

function openSupportWhatsApp(kind = "suggestion") {
  const text = kind === "bug"
    ? "Olá! Gostaria de reportar um problema no app Ninou."
    : "Olá! Gostaria de enviar uma sugestão para o app Ninou.";
  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
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
  if (!isLoggedIn()) {
    openGuestLoginModal();
    if (loginHelper) loginHelper.textContent = `Entre para ${actionText}. Seus registros ficam salvos com segurança na família.`;
    return false;
  }
  showScreen("profile");
  if (loginHelper) {
    loginHelper.textContent = `Sua conta precisa estar vinculada a uma família para ${actionText}. Use um convite do administrador do app.`;
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

  state = loadLocalDayState(getCurrentDayId());
  renderAll();
}


function ensureTodaySelectedForView() {
  const todayId = getCurrentDayId();
  if (getSelectedDayId() === todayId) return false;

  syncSelectedDayIntoFamilyCache();
  setSelectedDiaryDayById(todayId);
  state = getFamilyDayState(todayId);
  loadedStateDayId = todayId;
  saveLocalDayState();
  timelineRenderSignature = "";
  orbitRenderSignature = "";

  if (firebaseServices && cloudUser && hasFamilyAccess()) {
    void subscribeToCloudDay(todayId, { allowAutoLatest: false });
  }

  return true;
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
  try { updateAccountJourneyGuide(); } catch {}
}

function resetMigrationSearchState() {
  legacyCloudContexts = [];
  legacyCloudScanState = "idle";
  legacyCloudScanError = "";
  lastMigrationResult = null;
}

function createInviteCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = new Uint8Array(12);
  if (window.crypto?.getRandomValues) {
    window.crypto.getRandomValues(bytes);
  } else {
    for (let index = 0; index < bytes.length; index += 1) bytes[index] = Math.floor(Math.random() * 256);
  }
  const token = Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join("");
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

function createInviteCodeForEmail(_email = "", _familyId = APP_ADMIN_FAMILY_ID) {
  // v75.59: convite não é mais determinístico por e-mail/família. Código aleatório evita previsibilidade.
  return createInviteCode();
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
  const parsedDay = parseLocalDate(safeDayId);
  selectedDiaryDay = getDayStart(parsedDay ? parsedDay.getTime() : Date.now());
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

function dayStateHasVisibleContent(dayState = {}) {
  return hasRoutineDayContent(dayState) || Boolean(String(dayState?.dayNotes || "").trim());
}

function stripLiveStateFromHistoricalDay(dayState = {}, dayId = getSelectedDayId()) {
  const safeDayId = isDateId(dayId) ? dayId : getCurrentDayId();
  const normalized = normalizeDayState(dayState || createEmptyDayState());
  if (safeDayId === getCurrentDayId()) return normalized;
  return normalizeDayState({
    ...normalized,
    mode: "idle",
    activeStartedAt: null,
    activeType: "sono",
    activeDetail: "",
    activeNotes: "",
  });
}

function normalizeDayNoteText(value = "") {
  return String(value || "").replace(/\s+/g, " ").trim().toLowerCase();
}

function isRepeatedDayNoteFromEarlierDay(note = "", dayId = getSelectedDayId()) {
  const safeDayId = isDateId(dayId) ? dayId : getCurrentDayId();
  const noteKey = normalizeDayNoteText(note);
  if (!noteKey) return false;

  return Object.entries(familyDayStatesCache || {}).some(([otherDayId, otherState]) => {
    if (!isDateId(otherDayId) || otherDayId >= safeDayId) return false;
    const otherNote = typeof otherState?.dayNotes === "string" ? otherState.dayNotes.trim() : "";
    return normalizeDayNoteText(otherNote) === noteKey;
  });
}

function getValidDayNotesForDay(sourceState = {}, dayId = getSelectedDayId()) {
  const safeDayId = isDateId(dayId) ? dayId : getCurrentDayId();
  const note = typeof sourceState?.dayNotes === "string" ? sourceState.dayNotes.trim() : "";
  if (!note) return "";

  const noteDayId = isDateId(sourceState?.dayNotesDayId) ? sourceState.dayNotesDayId : "";
  if (noteDayId && noteDayId !== safeDayId) return "";

  const explicitDayId = getExplicitDayIdFromState(sourceState);
  if (explicitDayId && explicitDayId !== safeDayId) return "";

  // v75.58.3: evita que uma observação herdada por cache/sincronização apareça em dias seguintes.
  // Se o mesmo texto já existe em um dia anterior da mesma família, mantemos no primeiro dia.
  if (isRepeatedDayNoteFromEarlierDay(note, safeDayId)) return "";

  return note;
}

function sanitizeDayStateForDay(dayState = {}, dayId = getSelectedDayId(), options = {}) {
  const safeDayId = isDateId(dayId) ? dayId : getCurrentDayId();
  const source = dayState && typeof dayState === "object" ? dayState : {};
  const explicitDayId = getExplicitDayIdFromState(source);

  if (explicitDayId && explicitDayId !== safeDayId) {
    return normalizeDayState({
      ...createEmptyDayState(),
      dayId: safeDayId,
      date: safeDayId,
      clientUpdatedAt: Date.now(),
    });
  }

  const dayStart = getDayStartFromId(safeDayId);
  const dayEnd = dayStart + day;
  const normalized = normalizeDayState(source);
  const deletedIds = getDeletedEventIdsFromState(normalized);
  const dayEvents = (Array.isArray(normalized.events) ? normalized.events : [])
    .map(normalizeEvent)
    .filter(Boolean)
    .filter((event) => !deletedIds.has(event.id))
    .filter((event) => eventOverlapsWindow(event, dayStart, dayEnd));

  const validNote = getValidDayNotesForDay(source, safeDayId);
  const next = normalizeDayState({
    ...normalized,
    dayId: safeDayId,
    date: safeDayId,
    events: dayEvents,
    dayNotes: validNote,
    dayNotesDayId: validNote ? safeDayId : "",
    dayNotesUpdatedAt: validNote ? (Number(source.dayNotesUpdatedAt) || Number(source.clientUpdatedAt) || 0) : 0,
  });

  return options.preserveLive === true
    ? next
    : stripLiveStateFromHistoricalDay(next, safeDayId);
}

function sanitizeDayStateMapByDay(dayStates = {}) {
  const result = {};
  const firstLegacyNoteDayByText = new Map();
  Object.keys(dayStates || {}).filter(isDateId).sort().forEach((dayId) => {
    const rawState = dayStates[dayId] || {};
    let normalized = sanitizeDayStateForDay(rawState, dayId);
    const noteKey = normalizeDayNoteText(normalized.dayNotes);

    // v75.58.3: se a mesma observação apareceu em vários dias por herança de cache/nuvem,
    // preserva somente o primeiro dia e limpa os seguintes.
    if (noteKey) {
      if (firstLegacyNoteDayByText.has(noteKey)) {
        normalized = normalizeDayState({
          ...normalized,
          dayNotes: "",
          dayNotesDayId: "",
          dayNotesUpdatedAt: 0,
        });
      } else {
        firstLegacyNoteDayByText.set(noteKey, dayId);
        normalized = normalizeDayState({
          ...normalized,
          dayNotesDayId: dayId,
          dayNotesUpdatedAt: normalized.dayNotesUpdatedAt || normalized.clientUpdatedAt || 0,
        });
      }
    }

    result[dayId] = normalized;
  });
  return result;
}

function rebuildRoutineModeAfterMutation(dayState = state, dayId = getSelectedDayId(), options = {}) {
  const safeDayId = isDateId(dayId) ? dayId : getCurrentDayId();
  let nextState = sanitizeDayStateForDay(dayState, safeDayId, { preserveLive: true });

  if (safeDayId !== getCurrentDayId()) {
    return stripLiveStateFromHistoricalDay(nextState, safeDayId);
  }

  const preserveSleeping = options.preserveSleeping !== false;
  if (preserveSleeping && nextState.mode === "sleeping" && Number.isFinite(Number(nextState.activeStartedAt))) {
    return nextState;
  }

  const boundary = getLatestAwakeBoundaryFromEvents(nextState, safeDayId, Date.now());
  if (!Number.isFinite(Number(boundary))) {
    return normalizeDayState({
      ...nextState,
      mode: "idle",
      activeStartedAt: null,
      activeType: "sono",
      activeDetail: "",
      activeNotes: "",
    });
  }

  return normalizeDayState({
    ...nextState,
    mode: "awake",
    activeStartedAt: Number(boundary),
    activeType: "sono",
    activeDetail: "",
    activeNotes: "",
  });
}

function getEventWindowStart(event = {}) {
  const start = Number(event.start);
  return Number.isFinite(start) ? start : null;
}

function getEventWindowEnd(event = {}) {
  const start = getEventWindowStart(event);
  if (!Number.isFinite(start)) return null;
  const end = Number(event.end);
  return Number.isFinite(end) && end > start ? end : start;
}

function eventOverlapsWindow(event = {}, windowStart = getDayStart(), windowEnd = windowStart + day) {
  const start = getEventWindowStart(event);
  const end = getEventWindowEnd(event);
  if (!Number.isFinite(start) || !Number.isFinite(end)) return false;
  return start < windowEnd && end >= windowStart;
}

function getEventDisplayDedupeKey(event = {}) {
  const eventTime = getEventOrderTime(event) || Number(event.start) || 0;
  const startMinute = Math.round(eventTime / 60000);
  const endMinute = Math.round((Number(event.end) || Number(event.start) || 0) / 60000);
  const type = String(event.type || "").trim();
  const detail = String(event.detail || "").trim().toLowerCase();
  const notes = String(event.notes || "").trim().toLowerCase();
  return [type, startMinute, endMinute, detail, notes].join("|");
}

function chooseRicherEventForDisplay(current = {}, candidate = {}) {
  const currentScore = [current.label, current.eventTime, current.caregiverName, current.caregiverRole, current.createdByName, current.createdByRelationship, current.updatedAt, current.notes, current.detail].filter(Boolean).length;
  const candidateScore = [candidate.label, candidate.eventTime, candidate.caregiverName, candidate.caregiverRole, candidate.createdByName, candidate.createdByRelationship, candidate.updatedAt, candidate.notes, candidate.detail].filter(Boolean).length;
  return candidateScore >= currentScore ? candidate : current;
}

function dedupeEventsByDisplayKey(events = []) {
  const byKey = new Map();
  for (const event of Array.isArray(events) ? events : []) {
    const normalized = normalizeEvent(event);
    if (!normalized) continue;
    const key = getEventDisplayDedupeKey(normalized);
    const current = byKey.get(key);
    byKey.set(key, current ? chooseRicherEventForDisplay(current, normalized) : normalized);
  }
  return [...byKey.values()].sort((a, b) => Number(a.start) - Number(b.start));
}

function syncSelectedDayIntoFamilyCache() {
  const dayId = getSelectedDayId();
  if (!isDateId(dayId)) return;

  const cachedState = sanitizeDayStateForDay(familyDayStatesCache[dayId] || loadLocalDayState(dayId), dayId);
  const selectedState = loadedStateDayId === dayId ? sanitizeDayStateForDay(state, dayId, { preserveLive: true }) : cachedState;
  const selectedHasPersistentContent = dayStateHasPersistentContent(selectedState);
  const cachedHasPersistentContent = dayStateHasPersistentContent(cachedState);
  const selectedDeletedIds = getDeletedEventIdsFromState(selectedState);
  const cachedDeletedIds = getDeletedEventIdsFromState(cachedState);
  const selectedHasDeletionMarker = selectedDeletedIds.size > cachedDeletedIds.size;

  familyDayStatesCache = {
    ...familyDayStatesCache,
    [dayId]: selectedHasPersistentContent || selectedHasDeletionMarker || !cachedHasPersistentContent ? selectedState : cachedState,
  };

  if ((dayStateHasVisibleContent(selectedState) || selectedHasDeletionMarker) && !familyDayIdsCache.includes(dayId)) {
    familyDayIdsCache = [...familyDayIdsCache, dayId].filter(isDateId).sort();
  }
}

function getFamilyDayState(dayId) {
  const safeDayId = isDateId(dayId) ? dayId : getCurrentDayId();
  const cachedState = sanitizeDayStateForDay(familyDayStatesCache[safeDayId] || loadLocalDayState(safeDayId), safeDayId);
  if (safeDayId === getSelectedDayId() && loadedStateDayId === safeDayId) {
    const selectedState = sanitizeDayStateForDay(state, safeDayId, { preserveLive: true });
    const selectedDeletedIds = getDeletedEventIdsFromState(selectedState);
    const cachedDeletedIds = getDeletedEventIdsFromState(cachedState);
    const selectedHasDeletionMarker = selectedDeletedIds.size > cachedDeletedIds.size;
    return dayStateHasPersistentContent(selectedState) || selectedHasDeletionMarker || !dayStateHasPersistentContent(cachedState)
      ? selectedState
      : cachedState;
  }
  return cachedState;
}

function getFamilyEventsForWindow(windowStart, windowEnd) {
  syncSelectedDayIntoFamilyCache();
  const events = [];
  const startDay = getDayStart(windowStart) - day;
  const endDay = getDayStart(Math.max(windowStart, windowEnd - 1));
  for (let dayStart = startDay; dayStart <= endDay; dayStart += day) {
    const dayId = toDateInputValue(dayStart);
    const dayState = getFamilyDayState(dayId);
    getVisibleEventsFromState(dayState).forEach((event) => {
      if (eventOverlapsWindow(event, windowStart, windowEnd)) events.push(event);
    });
  }
  return dedupeEventsByDisplayKey(events);
}

function buildFamilyReportDays(count = 7, anchorStart = getDayStart()) {
  syncSelectedDayIntoFamilyCache();
  return Array.from({ length: count }, (_, index) => {
    const start = anchorStart - (count - 1 - index) * day;
    const end = start + day;
    return {
      start,
      end,
      label: getDayLabel(start),
      events: getFamilyEventsForWindow(start, end),
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
  // v75.74.1: o atalho flutuante estava poluindo a tela e aparecendo em contextos indevidos.
  // O acesso fica concentrado no Perfil para um acabamento mais limpo.
  guestWhatsappButton.href = ADMIN_WHATSAPP_URL;
  guestWhatsappButton.hidden = true;
  document.body.classList.remove("guest-whatsapp-visible");
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
  const photo = "";
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
    "eventTime",
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
    label: typeof source.label === "string" ? source.label : getEventConfig(type).title,
    eventTime: findTimestampFromObject(source, ["eventTime"]) || start,
    start,
    end,
    detail: normalizeLegacyDetail(source, type),
    notes: normalizeLegacyNotes(source),
    createdAt: source.createdAt || "",
    updatedAt: source.updatedAt || "",
    caregiverName: source.caregiverName || "",
    caregiverRole: source.caregiverRole || source.caregiverRelationship || "",
    caregiverRelationship: source.caregiverRelationship || "",
    babyId: source.babyId || "",
    familyId: source.familyId || "",
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
  // Não deduzimos o nome do bebê pelo e-mail. O nome exibido deve vir do perfil familiar confirmado.
  return profile;
}

function getLegacyPhoto(..._sources) {
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
  const photo = "";
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
    if (adminMigrationStatus) adminMigrationStatus.textContent = "Digite o e-mail antigo confirmado pela família.";
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

  // A busca manual por e-mail/UID sempre tem prioridade. Não damos preferência por nomes específicos,
  // para evitar expor ou puxar uma criança padrão no painel de produção.
  return (isExactEmailSearch ? 130000 : 0)
    + (isEmailSearch ? 120000 : 0)
    + (isManual ? 100000 : 0)
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
        ${getChecklistItemMarkup("Avatar do bebê", "Fotos antigas serão ignoradas; use somente avatar", true)}
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
    adminMigrationStatus.textContent = `Dados antigos revisados: ${result.events} registros em ${result.days} dia(s) foram copiados para a família selecionada. ${result.linkedSourceAccount ? `A conta ${result.sourceEmail || result.sourceUid} também foi vinculada como responsável.` : "Os dados antigos continuam preservados."}`;
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
    adminMigrationStatus.textContent = "Entre como admin para revisar dados antigos.";
    adminMigrationSources.innerHTML = "<li>Nenhuma conta em análise.</li>";
    restoreFamilyDataButton.hidden = true;
    renderMigrationChecklist(null);
    return;
  }

  const contexts = getCombinedRestorableContexts();
  const best = contexts[0] || null;

  if (legacyCloudScanState === "idle" && !best) {
    adminMigrationStatus.textContent = "Nenhuma busca iniciada. Para recuperar dados antigos, informe um e-mail ou UID confirmado. O painel não mostra origens automaticamente.";
    adminMigrationSources.innerHTML = "<li>Busque apenas uma origem confirmada por e-mail ou UID.</li>";
    restoreFamilyDataButton.hidden = true;
    renderMigrationChecklist(null);
    return;
  }

  if (legacyCloudScanState === "loading") {
    adminMigrationStatus.textContent = "Buscando a origem confirmada...";
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
  localStorage.removeItem(storageKeys.photo);
  localStorage.setItem(storageKeys.wakeWindow, String(context.wakeWindow || 70));
  localStorage.setItem(storageKeys.profileVersion, String(Date.now()));
  localStorage.setItem(storageKeys.weights, JSON.stringify(migratedWeights));

  const todayId = getCurrentDayId();
  const dayIds = Object.keys(context.dayStates || {}).filter(isDateId).sort();
  const latestDayId = dayIds.at(-1);
  const visibleDayId = (context.dayStates || {})[todayId] ? todayId : latestDayId;
  const currentDayState = (context.dayStates || {})[visibleDayId] || createEmptyDayState();
  const currentDayPayload = { ...normalizeDayState(currentDayState), dayId: visibleDayId || todayId, clientUpdatedAt: Date.now() };
  localStorage.setItem(storageKeys.dayState, JSON.stringify(currentDayPayload));
  if (visibleDayId) localStorage.setItem(getLocalDayStateStorageKey(visibleDayId), JSON.stringify(currentDayPayload));
  Object.entries(context.dayStates || {}).forEach(([dayId, dayState]) => {
    if (!isDateId(dayId)) return;
    localStorage.setItem(getLocalDayStateStorageKey(dayId), JSON.stringify({
      ...normalizeDayState(dayState),
      dayId,
      clientUpdatedAt: Date.now(),
    }));
  });
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
  currentProfilePhoto = "";
  localStorage.removeItem(storageKeys.photo);
  profileClientUpdatedAt = Number(localStorage.getItem(storageKeys.profileVersion)) || Date.now();
  state = loadLocalDayState(visibleDayId || getSelectedDayId());
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
    customerLabel: "Família cadastrada",
    latestMigratedDayId: Object.keys(context.dayStates || {}).filter(isDateId).sort().at(-1) || "",
    migratedDayIds: Object.keys(context.dayStates || {}).filter(isDateId).sort(),
    updatedAt: services.serverTimestamp(),
  }, { merge: true });

  const linkedSourceAccount = await linkMigrationSourceAccountToFamily(context, familyId, sourceLabel);

  if (context.profile || normalizedWeights.length) {
    await services.setDoc(services.doc(services.db, "families", familyId, "profile", "main"), {
      ...normalizedProfile,
      weights: normalizedWeights,
      wakeWindowMinutes: Number(context.wakeWindow) || 70,
      clientUpdatedAt: Date.now(),
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
    profileMigrated: Boolean(context.profile || normalizedWeights.length),
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
  await saveProfileToCloud();
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
  const raw = stats?.familyName || stats?.profileName || babyProfile?.name || "Família";
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

function getKnownUserQualityScore(user = {}) {
  const sources = Array.isArray(user.sources) ? user.sources : [];
  return (user.isMember ? 1000 : 0)
    + (user.hasFamilyAccess ? 500 : 0)
    + (user.hasPendingInvite ? 220 : 0)
    + (sources.includes("users") ? 120 : 0)
    + (sources.includes("member") ? 100 : 0)
    + (user.uid ? 40 : 0)
    + (user.email ? 20 : 0)
    - (sources.includes("profile") && !sources.includes("users") ? 10 : 0);
}

function getCleanKnownUsersForAdmin(users = []) {
  const byEmail = new Map();

  (Array.isArray(users) ? users : []).forEach((user) => {
    const email = normalizeEmail(user?.email || "");
    if (!email || !email.includes("@")) return;

    const current = byEmail.get(email);
    const candidate = { ...user, email };
    if (!current || getKnownUserQualityScore(candidate) > getKnownUserQualityScore(current)) {
      byEmail.set(email, candidate);
    }
  });

  return Array.from(byEmail.values()).sort((a, b) =>
    Number(Boolean(b.isMember)) - Number(Boolean(a.isMember))
    || Number(Boolean(b.hasFamilyAccess)) - Number(Boolean(a.hasFamilyAccess))
    || String(a.email).localeCompare(String(b.email))
  );
}

function scrollAdminSection(sectionId = "") {
  const target = document.getElementById(sectionId);
  if (!target) return;
  if (target.tagName === "DETAILS") target.open = true;
  const parentDetails = target.closest?.("details");
  if (parentDetails) parentDetails.open = true;
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
    adminKnownUsersList.innerHTML = "<li>Entre como admin para revisar contas autorizadas.</li>";
    return;
  }

  const allUsers = Array.isArray(stats?.knownUsers) ? stats.knownUsers : [];
  const users = getCleanKnownUsersForAdmin(allUsers);
  const hiddenCount = Math.max(0, allUsers.length - users.length);

  if (!users.length) {
    adminKnownUsersList.innerHTML = hiddenCount
      ? `<li>${pluralize(hiddenCount, "item técnico oculto", "itens técnicos ocultos")} por estar sem e-mail válido ou duplicado. Nenhuma conta precisa de ação agora.</li>`
      : "<li>Nenhuma conta com e-mail válido para revisão no momento.</li>";
    return;
  }

  const rows = users.slice(0, 18).map((user) => {
    const email = escapeHtml(user.email || "E-mail não identificado");
    const uid = escapeHtml(user.uid || "");
    const source = escapeHtml(getKnownUserSourceLabel(user));
    const status = escapeHtml(getKnownUserStatusLabel(user));
    const canLink = Boolean(user.uid && !user.isMember && !user.isAppAdmin);
    const safeEmailAttr = escapeHtml(user.email || "");
    const safeUidAttr = escapeHtml(user.uid || "");
    const primaryLine = user.uid ? `Identificador interno disponível` : "Sem identificador interno disponível";
    const linkButton = canLink
      ? `<button type="button" data-link-known-user="${safeUidAttr}" data-link-known-email="${safeEmailAttr}">Autorizar como cuidador</button>`
      : "";
    const inviteButton = user.email && !user.isMember && !user.isAppAdmin
      ? `<button type="button" data-fill-invite-email="${safeEmailAttr}">Convidar</button>`
      : "";
    const migrateButton = user.email && !user.isAppAdmin
      ? `<button type="button" data-fill-migration-email="${safeEmailAttr}">Revisar dados antigos</button>`
      : "";
    const createFamilyButtonMarkup = user.email && !user.hasFamilyAccess && !user.isAppAdmin
      ? `<button type="button" data-fill-new-family-responsible="${safeEmailAttr}">Criar família</button>`
      : "";
    const actions = [createFamilyButtonMarkup, inviteButton, linkButton, migrateButton].filter(Boolean).join("");

    return `
      <li class="admin-access-item admin-known-user-item ${user.isMember ? "is-member" : ""}">
        <img class="admin-avatar" src="${getCaregiverAvatarDataUrl(user.email || user.uid || "Conta", user.uid || user.email || "known", "known")}" alt="" />
        <div>
          <strong>${email}</strong>
          <span>${status} • ${source}</span>
          <small>${escapeHtml(primaryLine)}</small>
        </div>
        ${actions ? `<div class="admin-access-actions">${actions}</div>` : `<small>Sem ação necessária.</small>`}
      </li>
    `;
  }).join("");

  const note = hiddenCount
    ? `<li class="admin-clean-note">${pluralize(hiddenCount, "item incompleto/duplicado foi oculto", "itens incompletos/duplicados foram ocultos")} para preservar uma visão limpa antes da divulgação.</li>`
    : "";

  adminKnownUsersList.innerHTML = rows + note;
}

function renderAdminClients(stats = null) {
  const appAdmin = isGlobalAppAdmin();
  const previewOpen = Boolean(window.__ninouAdminFamilyDataOpen);
  const selectedId = getActiveAdminFamilyId();
  const families = Array.isArray(stats?.families) && stats.families.length
    ? stats.families
    : [{
        id: selectedId,
        name: stats?.familyName || "Família selecionada",
        subtitle: "Família cadastrada",
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
            <img class="admin-avatar family-avatar" src="${getCaregiverAvatarDataUrl(family.name || "Família", family.id || "family", "family")}" alt="" />
            <div>
              <strong>${escapeHtml(family.name || "Família sem nome")}</strong>
              <span>${escapeHtml(family.subtitle || "Família cadastrada")} • ${escapeHtml(membersLabel)} • ${escapeHtml(pendingLabel)}</span>
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
      <img class="admin-avatar support-avatar" src="${getCaregiverAvatarDataUrl("Admin", cloudUser?.email || GLOBAL_APP_ADMIN_EMAIL, "admin")}" alt="" />
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
            <img class="admin-avatar invite-avatar" src="${getCaregiverAvatarDataUrl(invite.email || code || "Convite", invite.email || code || "invite", "invite")}" alt="" />
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
          <img class="admin-avatar member-avatar" src="${getCaregiverAvatarDataUrl(member.email || "Membro", member.uid || member.email || "member", "member")}" alt="" />
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
    `${pluralize(stats.familiesCount ?? 0, "família cadastrada", "famílias cadastradas")}. ${pluralize(stats.membersCount ?? 0, "membro", "membros")} na família selecionada e ${pluralize(stats.knownUsersCount ?? 0, "conta válida para revisão", "contas válidas para revisão")}.`,
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
    const familyName = familyProfileData.name || familyData.name || familyData.title || "Família selecionada";
    const familySummaries = [];
    familiesSnapshot.forEach((familyDoc) => {
      const data = familyDoc.data() || {};
      const profile = familyDoc.id === familyId ? familyProfileData : (familyProfileById.get(familyDoc.id) || {});
      familySummaries.push({
        id: familyDoc.id,
        name: profile.name || data.name || data.title || (familyDoc.id === APP_ADMIN_FAMILY_ID ? "Família principal" : `Família ${familyDoc.id.slice(0, 8)}`),
        subtitle: data.customerLabel || data.subtitle || "Família cadastrada",
        membersCount: familyDoc.id === familyId ? members.filter((member) => !member.isAdmin).length : (Number.isFinite(Number(data.membersCount)) ? Number(data.membersCount) : null),
        pendingInvitesCount: familyDoc.id === familyId ? pendingInvites.length : (Number.isFinite(Number(data.pendingInvitesCount)) ? Number(data.pendingInvitesCount) : null),
      });
    });
    if (!familySummaries.some((family) => family.id === familyId)) {
      familySummaries.unshift({ id: familyId, name: familyName, subtitle: "Família cadastrada", membersCount: members.filter((member) => !member.isAdmin).length, pendingInvitesCount: pendingInvites.length });
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
      knownUsersCount: getCleanKnownUsersForAdmin(knownUsers).length,
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
  const roleLabel = authorized ? getRoleLabel(effectiveRole) : "";
  const baby = getBabyDisplayName();

  if (familyAccessKicker) {
    familyAccessKicker.textContent = authorized
      ? (appAdmin ? "Painel admin" : "Família conectada")
      : "Acesso familiar";
  }

  if (familyAccessTitle) {
    familyAccessTitle.textContent = authorized
      ? (appAdmin ? "Painel admin" : "Família conectada")
      : connected
        ? "Conta sem acesso familiar"
        : "Convites e permissões";
  }

  if (familyAccessText) {
    familyAccessText.textContent = authorized
      ? (appAdmin
        ? `${email} está conectado com acesso completo. Os registros são sincronizados no ambiente da família.`
        : `Você acompanha a rotina de ${baby}. Seu acesso: ${roleLabel}. ${effectiveRole === "visualizacao" ? "Você pode acompanhar os registros." : "Você pode participar da rotina conforme sua permissão."}`)
      : connected
        ? "Esta conta está conectada, mas ainda não encontramos acesso familiar. Aguarde a sincronização ou use um convite recebido."
        : "Visitantes podem conhecer o app. Para registrar dados, entre com usuário e senha ou solicite acesso pelo WhatsApp.";
  }

  if (familyAccessBadge) {
    familyAccessBadge.textContent = authorized ? (appAdmin ? "Admin" : getRoleLabel(effectiveRole)) : connected ? "Sem acesso" : "Visitante";
    familyAccessBadge.dataset.role = authorized ? effectiveRole : "offline";
  }

  if (createFamilyButton) {
    // v75.58.1: admin ativa a família principal; usuários novos podem criar a própria família.
    createFamilyButton.hidden = !connected || authorized;
    createFamilyButton.textContent = appAdmin ? "Ativar família principal" : "Criar minha família";
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
      if (familyWelcomeTitle) familyWelcomeTitle.textContent = `Você acompanha a rotina de ${baby}.`;
      if (familyWelcomeText) familyWelcomeText.textContent = `Seu acesso: ${roleLabel}. ${effectiveRole === "visualizacao" ? "Você pode acompanhar os registros." : "Você pode participar da rotina conforme sua permissão."}`;
    }
  }

  renderInviteList();
  renderSyncDetails();
  renderAdminDiagnostics();
}

async function readAccountAccessFromCloud(user = cloudUser) {
  if (!user) return null;
  const services = await getFirebaseServices();

  try {
    const familyAccessSnapshot = await services.getDocs(services.collection(services.db, "users", user.uid, "families"));
    let selectedAccess = null;
    familyAccessSnapshot.forEach((docSnap) => {
      if (selectedAccess) return;
      const data = docSnap.data() || {};
      const familyId = data.familyId || docSnap.id;
      if (!familyId || data.status === "inactive" || data.status === "revoked") return;
      selectedAccess = {
        familyId,
        role: data.role || "responsavel",
        email: data.email || user.email || "",
        ownerUid: data.ownerUid || data.owner || "",
        inviteCode: data.inviteCode || data.joinedByInvite || "",
        acceptedAt: data.acceptedAt || data.joinedAt || data.createdAt || "",
      };
    });
    if (selectedAccess) return saveFamilyAccess(selectedAccess);
  } catch (error) {
    console.warn("Não foi possível ler famílias do usuário:", error);
  }

  const accessRef = services.doc(services.db, "users", user.uid, "access", "ninou");
  const snapshot = await services.getDoc(accessRef);
  if (snapshot.exists()) {
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

  // v75.56.2.1.1: contas já incluídas em members/{uid} também entram sem precisar redigitar convite.
  const candidateFamilies = [APP_ADMIN_FAMILY_ID, familyAccess?.familyId, getVisibleDataOwnerEmail()].filter(Boolean);
  for (const familyId of [...new Set(candidateFamilies)]) {
    try {
      if (!String(familyId).startsWith("ninou-family-")) continue;
      const memberRef = services.doc(services.db, "families", familyId, "members", user.uid);
      const memberSnapshot = await services.getDoc(memberRef);
      if (!memberSnapshot.exists()) continue;
      const data = memberSnapshot.data() || {};
      return saveFamilyAccess({
        familyId,
        role: data.role || "responsavel",
        email: data.email || user.email || "",
        ownerUid: data.ownerUid || data.familyId || familyId,
        inviteCode: data.inviteCode || "",
        acceptedAt: data.acceptedAt || data.joinedAt || data.createdAt || "",
      });
    } catch (error) {
      console.warn("Não foi possível verificar membro da família:", familyId, error);
    }
  }
  return null;
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
  await services.setDoc(services.doc(services.db, "users", user.uid, "families", access.familyId), {
    ...payload,
    familyId: access.familyId,
    status: "active",
    linkedAt: services.serverTimestamp(),
  }, { merge: true });
  await services.setDoc(services.doc(services.db, "users", user.uid, "access", "ninou"), payload, { merge: true });
  await services.setDoc(services.doc(services.db, "families", access.familyId, "members", user.uid), {
    ...payload,
    uid: user.uid,
    status: "active",
    joinedAt: services.serverTimestamp(),
  }, { merge: true });

  try {
    const identity = loadCurrentCaregiverIdentity();
    const profileRef = services.doc(services.db, "users", user.uid, "account", "profile");
    const profileSnapshot = await services.getDoc(profileRef);
    const accountPayload = {
      uid: user.uid,
      email: payload.email,
      displayName: identity.name || "",
      relationship: identity.relation || "",
      relation: identity.relation || "",
      relationshipLabel: identity.relationshipLabel || "",
      familyId: payload.familyId,
      accessLevel: getRoleLabel(payload.role),
      updatedAt: services.serverTimestamp(),
    };
    if (!profileSnapshot.exists() || !profileSnapshot.data()?.createdAt) {
      accountPayload.createdAt = services.serverTimestamp();
    }
    await services.setDoc(profileRef, accountPayload, { merge: true });
    await services.setDoc(services.doc(services.db, "users", user.uid), accountPayload, { merge: true });
  } catch (error) {
    console.warn("Acesso salvo, mas o perfil mínimo da conta não foi atualizado:", error);
  }

  return saveFamilyAccess({ ...payload, acceptedAt: new Date().toISOString() });
}

async function activatePersonalFamily() {
  if (!cloudUser) {
    if (loginHelper) loginHelper.textContent = "Entre antes de ativar sua família.";
    return null;
  }

  const services = await getFirebaseServices();

  if (isGlobalAppAdmin()) {
    const access = buildGlobalAdminAccess(cloudUser, getActiveAdminFamilyId());
    saveFamilyAccess(access);
    renderAuthControls();

    try {
      const familyPayload = {
        supportAdminUid: cloudUser.uid,
        supportAdminEmail: cloudUser.email || "",
        customerLabel: "Família cadastrada",
        createdAt: services.serverTimestamp(),
        updatedAt: services.serverTimestamp(),
      };
      if (access.familyId === APP_ADMIN_FAMILY_ID) familyPayload.title = familyPayload.title || "Família principal";
      await services.setDoc(services.doc(services.db, "families", access.familyId), familyPayload, { merge: true });
      setSyncStatus("online", cloudUser.email || "");
      if (loginHelper) loginHelper.textContent = "Admin do app conectado. Você já pode gerar convites no Perfil.";
      refreshAdminStats({ silent: true });
    } catch (error) {
      console.error("Erro ao ativar família principal no Firebase:", error);
      setSyncStatus("online", cloudUser.email || "");
      if (loginHelper) loginHelper.textContent = "Admin conectado. Se convites, famílias ou contagens não aparecerem, revise as regras do Firestore.";
      setAdminStatsPlaceholder("Admin conectado. A contagem depende das regras do Firestore.");
    }

    renderAuthControls();
    return familyAccess;
  }

  try {
    const email = normalizeEmail(cloudUser.email || "");
    const emailName = email.split("@")[0] || "familia";
    const babyName = String(babyNameInput?.value || babyProfile?.name || "").trim();
    const familyName = babyName ? `Família do ${babyName}` : `Família de ${emailName}`;
    const familyId = createFamilyIdFromNames(familyName, babyName || emailName);
    const nowIso = new Date().toISOString();
    const access = {
      familyId,
      role: "responsavel",
      email,
      ownerUid: cloudUser.uid,
      acceptedAt: nowIso,
    };

    if (loginHelper) loginHelper.textContent = "Criando sua família no Ninou...";

    await services.setDoc(services.doc(services.db, "families", familyId), {
      familyId,
      title: familyName,
      ownerUid: cloudUser.uid,
      ownerEmail: email,
      status: "active",
      appVersion: NINOU_RUNTIME_VERSION,
      createdAt: services.serverTimestamp(),
      updatedAt: services.serverTimestamp(),
    }, { merge: true });

    const profilePayload = {
      ...getProfilePayload(),
      familyId,
      ownerUid: cloudUser.uid,
      updatedAt: services.serverTimestamp(),
    };
    await services.setDoc(services.doc(services.db, "families", familyId, "profile", "main"), profilePayload, { merge: true });

    await services.setDoc(services.doc(services.db, "families", familyId, "members", cloudUser.uid), {
      uid: cloudUser.uid,
      familyId,
      role: "responsavel",
      email,
      ownerUid: cloudUser.uid,
      status: "active",
      joinedAt: services.serverTimestamp(),
      createdAt: services.serverTimestamp(),
    }, { merge: true });

    await services.setDoc(services.doc(services.db, "users", cloudUser.uid, "families", familyId), {
      familyId,
      role: "responsavel",
      email,
      ownerUid: cloudUser.uid,
      status: "active",
      linkedAt: services.serverTimestamp(),
      updatedAt: services.serverTimestamp(),
    }, { merge: true });

    await services.setDoc(services.doc(services.db, "users", cloudUser.uid, "access", "ninou"), {
      familyId,
      role: "responsavel",
      email,
      ownerUid: cloudUser.uid,
      updatedAt: services.serverTimestamp(),
    }, { merge: true });

    saveFamilyAccess(access);
    setVisibleDataOwnerEmail(email);
    await connectCurrentAccount();
    setSyncStatus("online", email);
    markCloudSynced();
    if (loginHelper) loginHelper.textContent = "Família criada. Agora você já pode registrar a rotina e convidar cuidadores.";
    renderAuthControls();
    showScreen("profile");
    return familyAccess;
  } catch (error) {
    console.error("Erro ao criar família do usuário:", error);
    setSyncStatus("error", cloudUser.email || "");
    if (loginHelper) loginHelper.textContent = getFirebaseErrorMessage(error);
    renderAuthControls();
    return null;
  }
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
      customerLabel: "Família cadastrada",
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
      const now = Date.now();
      const expiry = getInviteExpiryPayload(services, now);
      const payload = {
        code,
        familyId,
        email: responsibleEmail,
        role,
        status: "pending",
        maxUses: INVITE_MAX_USES,
        useCount: 0,
        expiresAt: expiry.expiresAt,
        expiresAtClient: expiry.expiresAtClient,
        createdBy: cloudUser.uid,
        createdByUid: cloudUser.uid,
        createdByEmail: cloudUser.email || "",
        createdAt: services.serverTimestamp(),
        updatedAt: services.serverTimestamp(),
      };
      await services.setDoc(services.doc(services.db, "invites", code), getMinimalGlobalInvitePayload(payload), { merge: true });
      await services.setDoc(services.doc(services.db, "families", familyId, "invites", code), payload, { merge: true });
      await services.setDoc(services.doc(services.db, "families", familyId, "invitations", code), {
        ...payload,
        status: "active",
      }, { merge: true });
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
          renderInviteResultWithMessage({
            title: "Convite já aceito",
            familyLabel,
            email,
            role: existing.role || role,
            code,
            link,
          });
        }
        recentInvites.unshift({ code, email, role: existing.role || role, link });
        renderInviteList();
        refreshAdminStats({ silent: true });
        return;
      }
    }

    const now = Date.now();
    const expiry = getInviteExpiryPayload(services, now);
    const payload = {
      code,
      familyId,
      email,
      role,
      status: "pending",
      maxUses: INVITE_MAX_USES,
      useCount: 0,
      expiresAt: expiry.expiresAt,
      expiresAtClient: expiry.expiresAtClient,
      createdBy: cloudUser.uid,
      createdByUid: cloudUser.uid,
      createdByEmail: cloudUser.email || "",
      updatedAt: services.serverTimestamp(),
    };

    if (!existingSnapshot.exists()) {
      payload.createdAt = services.serverTimestamp();
    }

    await services.setDoc(inviteRef, getMinimalGlobalInvitePayload(payload), { merge: true });
    await cleanupDuplicatePendingInvites(services, email, familyId, code);

    try {
      await services.setDoc(services.doc(services.db, "families", familyId, "invites", code), payload, { merge: true });
      await services.setDoc(services.doc(services.db, "families", familyId, "invitations", code), {
        ...payload,
        status: "active",
      }, { merge: true });
    } catch (mirrorError) {
      console.warn("Convite criado na coleção principal, mas não foi espelhado na família:", mirrorError);
    }

    recentInvites.unshift({ code, email, role, link });
    renderInviteList();
    refreshAdminStats({ silent: true });
    if (inviteResult) {
      renderInviteResultWithMessage({
        title: "Convite pronto",
        familyLabel,
        email,
        role,
        code,
        link,
      });
    }
    if (adminInviteEmail) adminInviteEmail.value = "";
  } catch (error) {
    console.error("Erro ao criar convite:", error);
    if (inviteResult) {
      inviteResult.textContent = error?.code === "permission-denied"
        ? "Sem permissão para criar convite. Publique as regras Firestore da v75.59 e confirme que está logado com luizfelipe.dasilva@gmail.com."
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

    if (!isInviteUsable(invite)) {
      if (!options.silent && loginHelper) loginHelper.textContent = isInviteExpired(invite)
        ? "Este convite expirou. Peça um novo código."
        : "Este convite já foi usado ou cancelado.";
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
      useCount: Number(invite.useCount || 0) + 1,
      acceptedByUid: cloudUser.uid,
      acceptedBy: cloudUser.uid,
      acceptedByEmail: userEmail,
      acceptedAt: services.serverTimestamp(),
      updatedAt: services.serverTimestamp(),
    }, { merge: true });

    try {
      const acceptedInvitePayload = {
        status: "accepted",
        useCount: Number(invite.useCount || 0) + 1,
        acceptedByUid: cloudUser.uid,
        acceptedBy: cloudUser.uid,
        acceptedByEmail: userEmail,
        acceptedAt: services.serverTimestamp(),
        updatedAt: services.serverTimestamp(),
      };
      await services.setDoc(services.doc(services.db, "families", access.familyId, "invites", code), acceptedInvitePayload, { merge: true });
      await services.setDoc(services.doc(services.db, "families", access.familyId, "invitations", code), acceptedInvitePayload, { merge: true });
    } catch (mirrorError) {
      console.warn("Convite aceito, mas o espelho da família não foi atualizado:", mirrorError);
    }

    accessFlowNotice = "invite-accepted";
    pendingInviteCode = "";
    localStorage.removeItem(storageKeys.pendingInvite);
    if (inviteCodeInput) inviteCodeInput.value = "";
    if (!options.silent && loginHelper) loginHelper.textContent = "Convite aceito. Rotina familiar conectada.";
    renderAuthControls();
    const cloudContentAfterInvite = await familyCloudHasContent();
    if (!cloudContentAfterInvite.profile && hasProfileContent()) await saveProfileToCloud();
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
        ? "Sem permissão para aceitar convite. Publique as regras Firestore da v75.59 e confirme se o convite é para este e-mail."
        : getFirebaseErrorMessage(error);
    }
    return false;
  } finally {
    setAccepting(false);
    renderAuthControls();
  }
}

function saveDayState() {
  loadedStateDayId = getSelectedDayId();
  const deletedIds = getDeletedEventIdsFromState(state);
  state.events = dedupeEventsByDisplayKey((state.events || []).filter((event) => !deletedIds.has(event?.id)));
  state = sanitizeDayStateForDay(state, loadedStateDayId, { preserveLive: true });
  saveLocalDayState(loadedStateDayId);
  syncSelectedDayIntoFamilyCache();
  scheduleDayCloudSave(loadedStateDayId);
}

function formatEventMeta(event) {
  return formatRoutineEventMeta(event);
}

function getActiveAwakeWindowStart() {
  if (state.mode !== "awake") return null;
  const startedAt = Number(state.activeStartedAt);
  return Number.isFinite(startedAt) ? startedAt : null;
}

function getDedupAwakeWindowStart(start = Date.now()) {
  const activeStart = getActiveAwakeWindowStart();
  if (!Number.isFinite(activeStart)) return null;

  const safeStart = Number(start);
  const sleepEnds = (state.events || [])
    .filter((event) => isSleepEvent(event) && Number(event.end) > Number(event.start) && Number(event.end) <= Math.max(safeStart, activeStart) + 2 * 60000)
    .map((event) => Number(event.end))
    .filter(Number.isFinite);
  const lastSleepEnd = sleepEnds.length ? Math.max(...sleepEnds) : null;
  const candidates = [activeStart, lastSleepEnd].filter(Number.isFinite);
  return candidates.length ? Math.max(...candidates) : activeStart;
}

function getAwakeEventInActiveWindow(start = Date.now(), excludeEventId = null) {
  const windowBase = getDedupAwakeWindowStart(start);
  if (!Number.isFinite(windowBase)) return null;

  const safeStart = Number(start);
  const windowStart = windowBase - 5 * 60000;
  const windowEnd = Math.max(Date.now() + 2 * 60000, safeStart + 2 * 60000);
  const candidateEvents = getFamilyEventsForWindow(windowStart, windowEnd);

  return candidateEvents.find((event) => (
    event?.id !== excludeEventId &&
    event.type === "acordou" &&
    Number(event.start) >= windowStart &&
    Number(event.start) <= windowEnd
  )) || null;
}

function addAwakeEvent(start = Date.now(), detail = "Acordou", notes = "", options = {}) {
  state.events = Array.isArray(state.events) ? state.events : [];

  if (options.checkActiveWindow !== false) {
    const existingInActiveWindow = getAwakeEventInActiveWindow(start, options.excludeEventId || null);
    if (existingInActiveWindow) return existingInActiveWindow;
  }

  const alreadyExists = state.events.some((event) => (
    event?.id !== options.excludeEventId &&
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


function hasProfileContent(profile = babyProfile, _photo = "", windowMinutes = wakeWindowMinutes) {
  return profileHasContent(profile, "", windowMinutes);
}


function hasCloudProfileContent(data = {}) {
  const profileSource = data.babyProfile && typeof data.babyProfile === "object" ? data.babyProfile : data;
  const photoValue = "";
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
  window.__ninouCurrentBabyName = getBabyDisplayName();
  renderBabyIdentityPanel(babyProfile, {
    diaryTitle,
    babyAgeLine,
    profileBabyName,
    profileBabyAge,
  });

  if (avatarModalHint) {
    const babyName = (getBabyName() || "").trim();
    const hasShortName = babyName && babyName.length <= 16;
    avatarModalHint.textContent = hasShortName
      ? `Escolha o avatar de ${babyName}.`
      : "Escolha o avatar do diário.";
  }

  if (isGlobalAppAdmin() && activeScreenName === "profile" && !window.__ninouAdminFamilyDataOpen) {
    if (diaryTitle) diaryTitle.textContent = "Painel admin";
    if (babyAgeLine) babyAgeLine.textContent = "Convites, membros, migração e gestão de acessos";
    if (profileBabyName) profileBabyName.textContent = getAdminAccountLabel();
    if (profileBabyAge) profileBabyAge.textContent = "Perfil pessoal do administrador";
    if (profilePhoto) profilePhoto.src = adminAccountPhoto || getCaregiverAvatarDataUrl(getAdminAccountLabel(), cloudUser?.email || GLOBAL_APP_ADMIN_EMAIL, "admin");
  } else {
    applyAvatarPreview(babyProfile.avatar || pendingBabyAvatar);
    if (profilePhoto) profilePhoto.src = getBabyAvatarDataUrl(babyProfile.avatar || pendingBabyAvatar);
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
      const normalized = sanitizeDayStateForDay(data.state && typeof data.state === "object" ? data.state : data, id);
      states[id] = normalized;
      if (hasRoutineDayContent(normalized) || String(normalized.dayNotes || "").trim()) ids.push(id);
    });
    const sanitizedStates = sanitizeDayStateMapByDay(states);
    const sanitizedIds = Object.entries(sanitizedStates)
      .filter(([id, item]) => isDateId(id) && (hasRoutineDayContent(item) || String(item.dayNotes || "").trim() || getDeletedEventIdsFromState(item).size))
      .map(([id]) => id)
      .sort();
    familyDayIdsCache = sanitizedIds;
    familyDayStatesCache = sanitizedStates;
    familyDayIdsCacheAt = now;
    updateDiaryDateRangeFromFamilyDays(familyDayIdsCache);
    return familyDayIdsCache;
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
  const routineAuthorized = authorized && !authAccessLoading && (!appAdmin || Boolean(window.__ninouAdminFamilyDataOpen));
  document.body.classList.toggle("family-bootstrap-ready", Boolean(familyBootstrapReady && authorized));
  loginButton.textContent = connected ? "Conectado" : "Entrar";
  loginButton.disabled = connected || authAccessLoading;
  createAccountButton.textContent = connected ? "Sair" : "Criar conta";
  createAccountButton.classList.toggle("logout-button", connected);
  createAccountButton.disabled = authAccessLoading && !connected;
  loginEmail.disabled = connected;
  loginPassword.disabled = connected;
  document.body.classList.toggle("access-locked", !routineAuthorized);
  applyGuestInteractionLock();
  updateBodyModeClasses();
  openSheetButtons.forEach((button) => {
    const shouldHide = !routineAuthorized;
    button.hidden = shouldHide;
    button.setAttribute("aria-hidden", shouldHide ? "true" : "false");
  });
  updateGuestWhatsappButton();
  renderFamilyAccessPanel();
  updateAccountJourneyGuide();
  updatePostAccessExperience();
  updateProfileReadyExperience();
  normalizeLoggedProfileCards();
  renderCaregiverIdentityPanel();
  renderAvatarCustomizer();
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

async function clearNinouCachesFromDevice() {
  try {
    const keys = [];
    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index);
      if (key && key.startsWith("ninou.")) keys.push(key);
    }
    keys.forEach((key) => localStorage.removeItem(key));
  } catch (error) {
    console.warn("Não foi possível limpar todo o localStorage do Ninou:", error);
  }

  try {
    if (window.caches?.keys) {
      const cacheKeys = await caches.keys();
      await Promise.all(cacheKeys.filter((key) => key.includes("ninou")).map((key) => caches.delete(key)));
    }
  } catch (error) {
    console.warn("Não foi possível limpar o cache do PWA:", error);
  }

  try {
    if (window.indexedDB?.databases) {
      const databases = await indexedDB.databases();
      await Promise.all(
        databases
          .map((database) => database?.name)
          .filter((name) => name && (name.toLowerCase().includes("ninou") || name.toLowerCase().includes("firebase") || name.toLowerCase().includes("firestore")))
          .map((name) => new Promise((resolve) => {
            const request = indexedDB.deleteDatabase(name);
            request.onsuccess = request.onerror = request.onblocked = () => resolve();
          })),
      );
    }
  } catch (error) {
    console.warn("Não foi possível limpar todos os bancos locais do Firebase/Ninou:", error);
  }
}

async function signOutAndClearDeviceData() {
  const confirmed = window.confirm("Sair e limpar os dados do Ninou salvos neste aparelho? Os dados sincronizados na nuvem da família não serão apagados.");
  if (!confirmed) return;

  if (clearDeviceDataButton) clearDeviceDataButton.disabled = true;
  if (clearDeviceDataStatus) clearDeviceDataStatus.textContent = "Limpando dados locais...";

  try {
    const services = await getFirebaseServices().catch(() => null);
    if (services?.auth && cloudUser) {
      try { await services.signOut(services.auth); } catch (error) { console.warn("Não foi possível desconectar antes da limpeza local:", error); }
    }
    unsubscribeCloudListeners();
    cloudUser = null;
    await clearNinouCachesFromDevice();
    resetVisibleContextForGuest();
    saveFamilyAccess(null);
    clearPendingInviteCode();
    window.__ninouAdminFamilyDataOpen = false;
    resetMigrationSearchState();
    pendingProfilePhotoSave = false;
    if (loginEmail) loginEmail.value = "";
    if (loginPassword) loginPassword.value = "";
    setSyncStatus("offline");
    renderAuthControls();
    renderAll();
    if (loginHelper) loginHelper.textContent = "Dados locais limpos neste aparelho.";
    if (clearDeviceDataStatus) clearDeviceDataStatus.textContent = "Dados locais limpos. Entre novamente para sincronizar.";
  } catch (error) {
    console.error("Erro ao limpar dados locais:", error);
    if (clearDeviceDataStatus) clearDeviceDataStatus.textContent = "Não foi possível limpar tudo agora. Tente novamente.";
  } finally {
    if (clearDeviceDataButton) clearDeviceDataButton.disabled = false;
  }
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
  /*
    v75.74.1 — login rápido, mas consistente:
    1) lê apenas perfil + dia atual/selecionado uma vez;
    2) só depois libera a tela familiar;
    3) assina snapshots em tempo real;
    4) histórico carrega em segundo plano.
    Isso evita aparecer rotina antiga/prévia enquanto a família correta ainda está sendo validada.
  */
  resetFamilyDayCache();
  autoSelectedLatestFamilyDay = false;

  const selectedDayId = getSelectedDayId();
  const profileRef = getCloudProfileRef();
  const dayRef = getCloudDayRef(selectedDayId);

  const [profileSnapshot, daySnapshot] = await Promise.all([
    profileRef ? firebaseServices.getDoc(profileRef).catch((error) => {
      console.warn("Perfil será carregado pelo snapshot:", error);
      return null;
    }) : Promise.resolve(null),
    dayRef ? firebaseServices.getDoc(dayRef).catch((error) => {
      console.warn("Dia atual será carregado pelo snapshot:", error);
      return null;
    }) : Promise.resolve(null),
  ]);

  if (profileSnapshot?.exists?.()) {
    applyCloudProfile(profileSnapshot.data() || {});
  }

  if (daySnapshot?.exists?.()) {
    applyCloudDay(daySnapshot.data() || {}, selectedDayId);
  } else {
    state = createEmptyDayState();
    loadedStateDayId = selectedDayId;
    familyDayStatesCache = sanitizeDayStateMapByDay({ ...familyDayStatesCache, [selectedDayId]: state });
    timelineRenderSignature = "";
    orbitRenderSignature = "";
    renderAll();
  }

  await subscribeToCloudProfile();
  await subscribeToCloudDay(selectedDayId, { allowAutoLatest: false });

  familyBootstrapReady = true;
  document.body.classList.remove("sync-bootstrap");
  normalizeLoggedProfileCards();
  renderAuthControls();

  void loadFamilyDayIds({ force: true })
    .then(() => {
      updateDiaryDateRangeFromFamilyDays();
      renderSyncDetails();
      renderAdminDiagnostics();
    })
    .catch((error) => {
      console.warn("A lista histórica de dias será carregada depois:", error);
    });
}

function getProfilePayload(options = {}) {
  const payload = {
    ...normalizeBabyProfile(babyProfile),
    wakeWindowMinutes,
    clientUpdatedAt: ensureProfileVersion(),
    updatedAt: firebaseServices.serverTimestamp(),
  };

  payload.photo = "";
  payload.photoDataUrl = "";
  payload.babyPhoto = "";
  payload.profilePhoto = "";

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
  const shouldAcceptCloudPhoto = false;

  if (!cloudHasContent && localHasContent) {
    saveProfileToCloud();
    return;
  }

  if (localHasContent && profileClientUpdatedAt && cloudProfileVersion < profileClientUpdatedAt && !shouldAcceptCloudWeights) {
    return;
  }

  applyingCloudState = true;
  try {
    profileClientUpdatedAt = Math.max(cloudProfileVersion, profileClientUpdatedAt);

    babyProfile = normalizeBabyProfile({ ...profileSource, weights: cloudWeights.length ? cloudWeights : profileSource.weights });
    pendingBabyAvatar = normalizeAvatarDraft(babyProfile.avatar || pendingBabyAvatar);
    currentProfilePhoto = "";

    if (Number.isFinite(Number(data.wakeWindowMinutes))) {
      wakeWindowMinutes = Math.min(240, Math.max(20, Number(data.wakeWindowMinutes)));
      localStorage.setItem(storageKeys.wakeWindow, String(wakeWindowMinutes));
    }

    saveBabyProfile();

    localStorage.removeItem(storageKeys.photo);
    applyAvatarPreview(babyProfile.avatar || pendingBabyAvatar);
    if (profilePhoto) profilePhoto.src = getBabyAvatarDataUrl(babyProfile.avatar || pendingBabyAvatar);

    persistVisibleContextForCurrentOwner();
    syncBabyProfileForm();
    if (wakeWindowInput) wakeWindowInput.value = String(wakeWindowMinutes);
    if (wakeWindowValue) wakeWindowValue.textContent = String(wakeWindowMinutes);
    renderAll();
  } finally {
    applyingCloudState = false;
  }
}

function applyCloudDay(data = {}, dayId = getSelectedDayId()) {
  applyingCloudState = true;
  try {
    const daySource = data.state && typeof data.state === "object" ? data.state : data;
    const safeDayId = isDateId(dayId) ? dayId : getSelectedDayId();
    const cachedState = sanitizeDayStateForDay(familyDayStatesCache[safeDayId] || loadLocalDayState(safeDayId), safeDayId);
    const currentSelectedState = loadedStateDayId === safeDayId ? sanitizeDayStateForDay(state, safeDayId, { preserveLive: true }) : cachedState;
    const localState = dayStateHasVisibleContent(currentSelectedState) || getDeletedEventIdsFromState(currentSelectedState).size
      ? currentSelectedState
      : cachedState;
    let mergedState = mergeRoutineDayStatesForCloud(localState, daySource, safeDayId);
    mergedState = rebuildRoutineModeAfterMutation(mergedState, safeDayId, { preserveSleeping: true });

    if (isDateId(safeDayId)) {
      familyDayStatesCache = sanitizeDayStateMapByDay({ ...familyDayStatesCache, [safeDayId]: mergedState });
      const cachedForDay = familyDayStatesCache[safeDayId] || mergedState;
      if (dayStateHasVisibleContent(cachedForDay) && !familyDayIdsCache.includes(safeDayId)) {
        familyDayIdsCache = [...familyDayIdsCache, safeDayId].filter(isDateId).sort();
      }
      updateDiaryDateRangeFromFamilyDays();
    }

    if (safeDayId === getSelectedDayId()) {
      state = familyDayStatesCache[safeDayId] || mergedState;
      loadedStateDayId = safeDayId;
      saveLocalDayState(safeDayId);
      timelineRenderSignature = "";
      orbitRenderSignature = "";
      renderAll();
    } else {
      renderSupplementalReports();
      renderTodayHomeSections();
    }
  } finally {
    applyingCloudState = false;
  }
}

function scheduleProfileCloudSave(options = {}) {
  if (applyingCloudState || !cloudUser || !firebaseServices) return;
  pendingProfilePhotoSave = false;

  window.clearTimeout(profileCloudSaveTimer);
  profileCloudSaveTimer = window.setTimeout(saveProfileToCloud, 600);
}

async function saveProfileToCloud(options = {}) {
  const profileRef = getCloudProfileRef();
  if (!profileRef) return;

  const includePhoto = false;
  const payload = getProfilePayload();
  const savedProfileVersion = payload.clientUpdatedAt;

  try {
    await firebaseServices.setDoc(profileRef, payload, { merge: true });
    if (includePhoto) pendingProfilePhotoSave = false;
    if (savedProfileVersion === profileClientUpdatedAt) {
      setSyncStatus("online", cloudUser.email);
      markCloudSynced();
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

function getDeletedEventIdsFromState(dayState = {}) {
  return new Set(
    (Array.isArray(dayState.deletedEventIds) ? dayState.deletedEventIds : [])
      .filter((item) => typeof item === "string" && item.trim())
      .map((item) => item.trim()),
  );
}


function getVisibleEventsFromState(dayState = {}) {
  const normalizedState = normalizeDayState(dayState || {});
  const deletedEventIds = getDeletedEventIdsFromState(normalizedState);
  return (Array.isArray(normalizedState.events) ? normalizedState.events : [])
    .map(normalizeEvent)
    .filter((event) => event?.id && !deletedEventIds.has(event.id));
}

function dayStateHasPersistentContent(dayState = {}) {
  const normalizedState = normalizeDayState(dayState || {});
  return dayStateHasVisibleContent(normalizedState)
    || getDeletedEventIdsFromState(normalizedState).size > 0
    || (Array.isArray(normalizedState.auditLog) && normalizedState.auditLog.length > 0);
}

function mergeRoutineDayStatesForCloud(localState = state, cloudData = {}, dayId = getSelectedDayId()) {
  const safeDayId = isDateId(dayId) ? dayId : getSelectedDayId();
  const cloudSource = cloudData.state && typeof cloudData.state === "object" ? cloudData.state : cloudData;
  const cloudState = sanitizeDayStateForDay(cloudSource || {}, safeDayId);
  const currentState = sanitizeDayStateForDay(localState || {}, safeDayId, { preserveLive: true });
  const deletedEventIds = new Set([
    ...getDeletedEventIdsFromState(cloudState),
    ...getDeletedEventIdsFromState(currentState),
  ]);
  const eventsById = new Map();

  for (const event of Array.isArray(cloudState.events) ? cloudState.events : []) {
    const normalized = normalizeEvent(event);
    if (normalized?.id && !deletedEventIds.has(normalized.id)) eventsById.set(normalized.id, normalized);
  }

  for (const event of Array.isArray(currentState.events) ? currentState.events : []) {
    const normalized = normalizeEvent(event);
    if (normalized?.id && !deletedEventIds.has(normalized.id)) eventsById.set(normalized.id, normalized);
  }

  const currentNotes = getValidDayNotesForDay(currentState, safeDayId);
  const cloudNotes = getValidDayNotesForDay(cloudState, safeDayId);
  const chosenNotes = currentNotes || cloudNotes || "";

  return sanitizeDayStateForDay({
    ...cloudState,
    ...currentState,
    dayId: safeDayId,
    date: safeDayId,
    deletedEventIds: [...deletedEventIds].slice(-240),
    events: sortEventsByStartDesc(dedupeEventsByDisplayKey([...eventsById.values()])),
    notes: currentState.notes || cloudState.notes || "",
    dayNotes: chosenNotes,
    dayNotesDayId: chosenNotes ? safeDayId : "",
    dayNotesUpdatedAt: chosenNotes ? Math.max(Number(currentState.dayNotesUpdatedAt) || 0, Number(cloudState.dayNotesUpdatedAt) || 0) : 0,
  }, safeDayId, { preserveLive: true });
}

async function saveDayToCloud(dayId = getSelectedDayId()) {
  const safeDayId = isDateId(dayId) ? dayId : getCurrentDayId();
  const dayRef = getCloudDayRef(safeDayId);
  if (!dayRef || applyingCloudState) return;

  const selectedDayId = getSelectedDayId();
  const sourceState = safeDayId === selectedDayId && loadedStateDayId === safeDayId
    ? sanitizeDayStateForDay(state, safeDayId, { preserveLive: true })
    : sanitizeDayStateForDay(familyDayStatesCache[safeDayId] || loadLocalDayState(safeDayId), safeDayId);

  const hasDeletedEvents = getDeletedEventIdsFromState(sourceState).size > 0;
  if (!dayStateHasVisibleContent(sourceState) && !hasDeletedEvents) return;

  try {
    let dayPayload = sourceState;
    let shouldSetCreatedAt = false;

    try {
      const currentSnapshot = await firebaseServices.getDoc(dayRef);
      if (currentSnapshot.exists()) {
        const currentData = currentSnapshot.data() || {};
        shouldSetCreatedAt = !currentData.createdAt;
        dayPayload = mergeRoutineDayStatesForCloud(dayPayload, currentData, safeDayId);
      } else {
        shouldSetCreatedAt = true;
      }
    } catch (mergeError) {
      console.warn("Não foi possível mesclar rotina antes de salvar. Salvando estado local atual:", mergeError);
    }

    dayPayload = rebuildRoutineModeAfterMutation(dayPayload, safeDayId, { preserveSleeping: true });
    const cloudTimestamps = {
      updatedAt: firebaseServices.serverTimestamp(),
    };
    if (shouldSetCreatedAt) cloudTimestamps.createdAt = firebaseServices.serverTimestamp();

    await firebaseServices.setDoc(
      dayRef,
      {
        ...dayPayload,
        ...cloudTimestamps,
      },
      { merge: true },
    );

    familyDayStatesCache = sanitizeDayStateMapByDay({ ...familyDayStatesCache, [safeDayId]: normalizeDayState(dayPayload) });
    if (dayStateHasVisibleContent(dayPayload) && !familyDayIdsCache.includes(safeDayId)) {
      familyDayIdsCache = [...familyDayIdsCache, safeDayId].filter(isDateId).sort();
    }
    updateDiaryDateRangeFromFamilyDays();

    if (safeDayId === selectedDayId) {
      state = familyDayStatesCache[safeDayId] || dayPayload;
      saveLocalDayState(safeDayId);
      renderAll();
    }

    setSyncStatus("online", cloudUser.email);
    markCloudSynced();
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
        saveProfileToCloud();
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
      const cachedState = sanitizeDayStateForDay(familyDayStatesCache[safeDayId] || loadLocalDayState(safeDayId), safeDayId);
      if (dayStateHasVisibleContent(cachedState)) {
        if (safeDayId === getSelectedDayId()) {
          state = cachedState;
          loadedStateDayId = safeDayId;
          saveLocalDayState();
          renderAll();
        }
        return;
      }

      if (safeDayId === getCurrentDayId() && loadedStateDayId === safeDayId && hasRoutineDayContent()) {
        saveDayToCloud(safeDayId);
      } else if (options.allowAutoLatest !== false && safeDayId === getCurrentDayId()) {
        const switched = await maybeOpenLatestFamilyDayAfterEmptyToday(safeDayId);
        if (!switched && safeDayId === getSelectedDayId()) {
          state = createEmptyDayState();
          loadedStateDayId = safeDayId;
          saveLocalDayState();
          renderAll();
        }
      } else if (safeDayId === getSelectedDayId()) {
        state = createEmptyDayState();
        loadedStateDayId = safeDayId;
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
    const authRunId = ++authFlowRunId;
    cloudUser = user;

    if (!user) {
      accessFlowNotice = "";
      unsubscribeCloudListeners();
      clearLocalAccountData();
      setAuthAccessLoading(false);
      setSyncStatus("offline");
      loginEmail.value = "";
      loginPassword.value = "";
      renderAuthControls();
      loginHelper.textContent = "Entre com sua conta. Novas pessoas acessam por convite da família.";
      return;
    }

    prepareVisibleContextForAccount(user);
    localStorage.setItem(storageKeys.email, user.email || "");
    loginEmail.value = user.email || "";

    setSyncStatus("loading", user.email || "");
    setAuthAccessLoading(true, "Validando conta e família...");
    showScreen("profile");

    const isCurrentAuthRun = () => authRunId === authFlowRunId && cloudUser?.uid === user.uid;

    try {
      if (isGlobalAppAdmin(user)) {
        prepareAdminPanelContext(user);
        resetMigrationSearchState();
        clearPendingInviteCode();
        ensureGlobalAdminAccess(user);
        renderAuthControls();
        loginHelper.textContent = "Admin conectado. Preparando painel...";
        await activatePersonalFamily();
        if (!isCurrentAuthRun()) return;
        await loadAdminAccountProfileFromCloud(user);
        if (!isCurrentAuthRun()) return;
        setAuthAccessLoading(false);
        setSyncStatus("online", user.email || "");
        loginHelper.textContent = "Admin conectado. Painel administrativo ativo.";
        renderAuthControls();
        showScreen("profile");
        return;
      }

      let restoredAccess = null;
      try {
        restoredAccess = await readAccountAccessFromCloud(user);
        if (!isCurrentAuthRun()) return;
      } catch (error) {
        console.error("Erro ao ler acesso familiar:", error);
        restoredAccess = null;
      }
      if (!restoredAccess) saveFamilyAccess(null);
      await loadCurrentAccountIdentityFromCloud(user);
      if (!isCurrentAuthRun()) return;

      if (pendingInviteCode) {
        await acceptFamilyInvite(pendingInviteCode, { silent: true });
        if (!isCurrentAuthRun()) return;
      }

      if (!hasFamilyAccess()) {
        setAuthAccessLoading(false);
        loginHelper.textContent = "Conta conectada, mas sem acesso familiar encontrado. Use um convite recebido ou peça ao administrador para verificar o membro da família.";
        setSyncStatus("offline", user.email || "");
        renderAuthControls();
        showScreen("profile");
        return;
      }

      await connectCurrentAccount();
      if (!isCurrentAuthRun()) return;
      setAuthAccessLoading(false);
      setSyncStatus("online", user.email || "");
      loginHelper.textContent = `Conta conectada como ${getRoleLabel(getEffectiveRole(familyAccess.role, user.email || ""))}.`;
      renderAuthControls();
      renderAll();
    } catch (error) {
      console.error("Erro ao conectar família:", error);
      familyBootstrapReady = false;
      document.body.classList.remove("family-ready", "sync-bootstrap");
      setAuthAccessLoading(false);
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
    setAuthAccessLoading(true, "Entrando com segurança...");
    const services = await getFirebaseServices();

    loginHelper.textContent = "Entrando...";
    loginButton.disabled = true;
    createAccountButton.disabled = true;

    await services.signInWithEmailAndPassword(services.auth, credentials.email, credentials.password);
    accessFlowNotice = "signed-in";
    localStorage.setItem(storageKeys.email, credentials.email);
  } catch (error) {
    setAuthAccessLoading(false);
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
    accessFlowNotice = "created";
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
  authFlowRunId += 1;
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
  reconcileCurrentAwakeStateFromEvents();
  if (!canUsePrivateFeatures()) {
    setHidden(wakeAction, true);
    setHidden(startChoice, true);
    setText(stateLabel, "Acesso necessário");
    setText(stateClock, "--:--");
    setText(stateHint, "Entre com login e senha ou solicite acesso para registrar a rotina.");
    renderActiveTimerCard();
    return;
  }

  if (getSelectedDayId() !== getCurrentDayId()) {
    setHidden(wakeAction, true);
    setHidden(startChoice, true);
    setText(stateLabel, "Data selecionada");
    setText(stateClock, "--:--");
    setText(stateHint, "Você está revisando um dia anterior. Use o botão + para incluir ou editar registros nessa data.");
    renderActiveTimerCard();
    return;
  }

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
  const elapsed = Date.now() - Number(state.activeStartedAt || Date.now());
  if (!Number.isFinite(elapsed) || elapsed < 0 || elapsed > 48 * hour) {
    state = createEmptyDayState();
    saveLocalDayState();
    renderCurrentState();
    return;
  }
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
  const [hourValue, minuteValue] = String(formatTime(timestamp)).split(":").map(Number);
  const minutes = (Number.isFinite(hourValue) ? hourValue : 0) * 60 + (Number.isFinite(minuteValue) ? minuteValue : 0);
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
  const orbitStart = getDayStart(now);
  const orbitEnd = Math.min(now, orbitStart + day);
  const dayEvents = getFamilyEventsForWindow(orbitStart, orbitEnd)
    .filter((event) => eventOverlapsWindow(event, orbitStart, orbitEnd))
    .sort((a, b) => Number(a.start) - Number(b.start));

  const items = dayEvents
    .slice(-48)
    .map((event) => ({
      event,
      active: false,
      position: eventPosition(Math.max(Number(event.start) || orbitStart, orbitStart)),
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
      position: eventPosition(Math.max(activeEvent.start, orbitStart)),
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


function getShortDatePrefixForSelectedDay(eventDayId, selectedDayId) {
  if (!isDateId(eventDayId) || !isDateId(selectedDayId) || eventDayId === selectedDayId) return "";
  const eventStart = getDayStartFromId(eventDayId);
  const selectedStart = getDayStartFromId(selectedDayId);
  const diffDays = Math.round((eventStart - selectedStart) / day);
  if (diffDays === -1) return "Ontem";
  if (diffDays === 1) return "Amanhã";
  const [, month, dateValue] = eventDayId.split("-");
  return `${dateValue}/${month}`;
}

function getTimeLabelForSelectedDay(timestamp, selectedDayId) {
  const dayId = toDateInputValue(timestamp);
  const prefix = getShortDatePrefixForSelectedDay(dayId, selectedDayId);
  return [prefix, formatTime(timestamp)].filter(Boolean).join(" ");
}

function decorateEventForSelectedDay(event = {}, selectedStart = selectedDiaryDay ?? getDayStart()) {
  const selectedDayId = toDateInputValue(selectedStart);
  const displayTime = getEventOrderTime(event) || Number(event.start);
  const startLabel = getTimeLabelForSelectedDay(displayTime, selectedDayId);
  const hasEnd = Number(event.end) > Number(event.start);
  const endLabel = hasEnd ? getTimeLabelForSelectedDay(Number(event.end), selectedDayId) : startLabel;
  return {
    ...event,
    displayStartLabel: startLabel,
    displayRangeLabel: hasEnd ? `${startLabel}–${endLabel}` : startLabel,
  };
}

function renderTimeline() {
  const lastCard = document.querySelector(".last-card .event-card");
  if (!timeline) return;

  const selectedStart = selectedDiaryDay ?? getDayStart();
  const selectedEnd = selectedStart + day;
  const orderedEvents = sortEventsByStartDesc(getFamilyEventsForWindow(selectedStart, selectedEnd));
  const dayEvents = orderedEvents.filter((event) => eventOverlapsWindow(event, selectedStart, selectedEnd));
  const visibleEvents = dayEvents.filter(matchesDiaryFilter);
  const latest = getLatestEvent(dayEvents);
  const nextSignature = getTimelineRenderSignature(selectedStart, selectedEnd, visibleEvents, latest);
  if (nextSignature === timelineRenderSignature) return;

  timelineRenderSignature = nextSignature;
  timeline.innerHTML = "";
  diaryDateTitle.textContent = selectedStart === getDayStart() ? "Diário de hoje" : formatDiaryDate(selectedStart);
  diaryDateHint.textContent = selectedStart === getDayStart() ? "Hoje" : "Data selecionada";

  if (!visibleEvents.length) {
    timeline.append(createEmptyTimelineItem(getEventCardMarkup(null, { empty: true })));
  }

  visibleEvents.forEach((event) => {
    const item = document.createElement("li");
    item.className = "event-card";
    item.innerHTML = getEventCardMarkup(decorateEventForSelectedDay(event, selectedStart));
    timeline.append(item);
  });

  if (!latest) {
    setHtml(lastCard, getLatestEmptyRecordMarkup());
    return;
  }
  if (lastCard) {
    const latestForDay = decorateEventForSelectedDay(latest, selectedStart);
    const latestConfig = getEventConfig(latestForDay.type);
    lastCard.innerHTML = `
      <i class="mark ${latestConfig.arcType}">${latestConfig.icon}</i>
      <div>
        <strong>${escapeHtml(latestConfig.title)}</strong>
        <span>${escapeHtml(formatEventMeta(latestForDay))}</span>
        ${latestForDay.notes ? `<p>${escapeHtml(latestForDay.notes)}</p>` : ""}
      </div>
    `;
  }
}

function openOrbitCluster(events) {
  const selectedStart = selectedDiaryDay ?? getDayStart();
  const orderedEvents = [...events].sort((a, b) => a.start - b.start);
  orbitClusterTitle.textContent = `${orderedEvents.length} registros próximos`;
  orbitClusterList.innerHTML = orderedEvents.map((rawEvent) => {
    const event = decorateEventForSelectedDay(rawEvent, selectedStart);
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

  if (summaryValues[1]) {
    const awakeInfo = getTodayAwakeCalculation(now);
    setText(summaryValues[1], awakeInfo.hasWake ? awakeInfo.durationLabel : "—");
  }
}

function getSleepReportDays() {
  return buildFamilyReportDays(7).map((item) => {
    const sleepEvents = item.events.filter((event) => isSleepEvent(event) && eventOverlapsWindow(event, item.start, item.end));
    const sleepMs = getSleepMsForRange(item.start, item.end);
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
    routineStatus.textContent = "Horários variados";
    routineHint.textContent = "As sonecas começaram em horários bem diferentes nos últimos registros.";
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



function normalizeSummaryRangeMode(value) {
  return Object.prototype.hasOwnProperty.call(summaryRangeOptions, value) ? value : "7d";
}

function getSummaryRangeOption() {
  return summaryRangeOptions[normalizeSummaryRangeMode(summaryRangeMode)] || summaryRangeOptions["7d"];
}

function renderSummaryRangeControls() {
  const option = getSummaryRangeOption();
  summaryRangeButtons.forEach((button) => {
    const isActive = button.dataset.summaryRange === summaryRangeMode;
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-pressed", isActive ? "true" : "false");
  });
  if (summaryRangeLabel) summaryRangeLabel.textContent = option.label;
  if (summaryRangeHint) summaryRangeHint.textContent = option.hint;
}

function setSummaryRangeMode(mode) {
  const nextMode = normalizeSummaryRangeMode(mode);
  if (summaryRangeMode === nextMode) return;
  summaryRangeMode = nextMode;
  try { localStorage.setItem(SUMMARY_RANGE_KEY, nextMode); } catch {}
  renderIntelligentHomeSections();
}

function expandIntelligentTimeline() {
  intelligentTimelineLimit += 7;
  renderIntelligentHomeSections();
}

function resetIntelligentTimelineLimit() {
  intelligentTimelineLimit = 7;
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
  const todayTimelineStart = todayStart;
  const todayTimelineEnd = Math.min(now, todayStart + day);
  const todayTimelineState = {
    ...recentFamilyState,
    events: getFamilyEventsForWindow(todayTimelineStart, todayTimelineEnd),
  };

  renderIntelligentTimeline({
    container: intelligentTimeline,
    state: todayTimelineState,
    todayStart: todayTimelineStart,
    dayMs: day,
    formatShortDuration,
    formatTime,
    limit: intelligentTimelineLimit,
    batchSize: 7,
  });
  const summaryRange = getSummaryRangeOption();
  renderSummaryRangeControls();
  renderWeeklyOverview({
    container: weeklyOverview,
    state: recentFamilyState,
    todayStart,
    dayMs: day,
    periodDays: summaryRange.days,
    periodLabel: summaryRange.label,
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
  return sortEventsByStartDesc(events.filter((event) => typeSet.has(event.type)))[0] || null;
}

function getLatestSleepEvent(events = []) {
  return sortEventsByStartDesc(events.filter((event) => isSleepEvent(event) && Number(event.end) > Number(event.start)))[0] || null;
}

function getDayStartFromId(dayId = getSelectedDayId()) {
  if (!isDateId(dayId)) return getDayStart();
  const parsedDate = parseLocalDate(dayId);
  return getDayStart(parsedDate ? parsedDate.getTime() : Date.now());
}

function getLatestAwakeBoundaryFromEvents(dayState = state, dayId = getSelectedDayId(), now = Date.now()) {
  const dayStart = getDayStartFromId(dayId);
  const dayEnd = dayStart + day;
  const upperLimit = Math.min(dayEnd, now + 2 * 60000);
  const events = Array.isArray(dayState?.events) ? dayState.events : [];
  const candidates = [];

  events.forEach((event) => {
    const start = Number(event?.start);
    const end = Number(event?.end);

    if ((event?.type === "acordou" || event?.type === "despertar-noturno")
      && Number.isFinite(start)
      && start >= dayStart
      && start <= upperLimit) {
      candidates.push(start);
    }

    if (isSleepEvent(event)
      && Number.isFinite(start)
      && Number.isFinite(end)
      && end > start
      && end >= dayStart
      && end <= upperLimit) {
      candidates.push(end);
    }
  });

  if (!candidates.length) return null;
  return Math.max(...candidates);
}

function reconcileAwakeStateForDay(dayState = state, dayId = getSelectedDayId(), now = Date.now()) {
  const nextState = normalizeDayState(dayState || createEmptyDayState());
  if (nextState.mode === "sleeping") return nextState;

  const boundary = getLatestAwakeBoundaryFromEvents(nextState, dayId, now);
  if (!Number.isFinite(Number(boundary))) return nextState;

  const currentStart = Number(nextState.activeStartedAt);
  const shouldUpdate = nextState.mode !== "awake"
    || !Number.isFinite(currentStart)
    || Number(boundary) > currentStart + 60000;

  if (!shouldUpdate) return nextState;

  return normalizeDayState({
    ...nextState,
    mode: "awake",
    activeStartedAt: Number(boundary),
    activeType: "sono",
    activeDetail: "",
    activeNotes: "",
  });
}

function reconcileCurrentAwakeStateFromEvents(options = {}) {
  const selectedDayId = getSelectedDayId();
  if (selectedDayId !== getCurrentDayId()) {
    const historical = stripLiveStateFromHistoricalDay(state, selectedDayId);
    const changedHistorical = JSON.stringify(historical) !== JSON.stringify(normalizeDayState(state));
    if (changedHistorical) state = historical;
    return changedHistorical;
  }

  if (state?.mode === "sleeping" && options.force !== true) return false;

  const before = JSON.stringify(normalizeDayState(state));
  const nextState = rebuildRoutineModeAfterMutation(state, selectedDayId, { preserveSleeping: options.force !== true });
  const changed = before !== JSON.stringify(normalizeDayState(nextState));

  if (changed) {
    state = nextState;
    if (options.persist !== false) {
      syncSelectedDayIntoFamilyCache();
      saveLocalDayState(selectedDayId);
    }
    timelineRenderSignature = "";
    orbitRenderSignature = "";
  }

  return changed;
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
  const awakeInfo = getTodayAwakeCalculation(now, events);
  const awakeText = awakeInfo.hasWake ? awakeInfo.durationLabel : "—";
  const napText = lastSleep
    ? `${formatTime(lastSleep.start)}–${formatTime(lastSleep.end)}`
    : "Sem registro";
  const bottleText = lastBottle ? `${formatTime(lastBottle.start)}${getBottleAmountText(lastBottle)}` : "Sem registro";
  const diaperText = lastDiaper ? `${formatTime(lastDiaper.start)}${lastDiaper.detail && lastDiaper.detail !== "Não se aplica" ? ` • ${lastDiaper.detail}` : ""}` : "Sem registro";

  if (todayOverviewTitle) todayOverviewTitle.textContent = `Hoje com ${baby}`;
  if (todayOverviewKicker) todayOverviewKicker.textContent = "Assistente de rotina";
  todayOverviewGrid.innerHTML = [
    ["Última mamadeira", bottleText],
    ["Última fralda", diaperText],
    ["Última soneca", napText],
    ["Tempo acordado", awakeText],
  ].map(([label, value]) => `<article><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></article>`).join("");

  if (todayOverviewSuggestion) {
    let suggestion = "Registre a primeira ação para o Ninou acompanhar o dia com você.";
    if (state.mode === "sleeping") suggestion = `${baby} está dormindo agora. O resumo será atualizado quando acordar.`;
    else if (awakeInfo.hasWake && awakeInfo.isOpen) {
      const awakeMs = Math.max(0, Number(awakeInfo.durationMs) || 0);
      const targetMs = wakeWindowMinutes * 60000;
      if (awakeMs >= targetMs * 0.85) suggestion = `${baby} está acordado há ${formatShortDuration(awakeMs)}. Talvez seja hora de observar sinais de sono.`;
      else suggestion = `Rotina em andamento. Próxima janela de sono estimada em ${formatShortDuration(Math.max(0, targetMs - awakeMs))}.`;
    } else if (events.length) suggestion = `Hoje já há ${events.length} ${events.length === 1 ? "registro" : "registros"}. O Ninou está organizando a rotina do dia para você.`;
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

  const awakeInfo = getTodayAwakeCalculation(now, events);
  if (state.mode === "awake" && awakeInfo.hasWake && awakeInfo.isOpen) {
    const awakeMs = Number(awakeInfo.durationMs) || 0;
    if (awakeMs >= wakeWindowMinutes * 60000 * 0.9) {
      title = `${baby} está acordado há ${formatShortDuration(awakeMs)}`;
      text = "Talvez seja um bom momento para observar sinais de sono com calma, sem pressa.";
      show = true;
    }
  }

  if (!show && lastFeed && now - Number(lastFeed.start) >= 3 * hour) {
    title = `Última alimentação há ${formatShortDuration(now - Number(lastFeed.start))}`;
    text = "Um lembrete suave para conferir se a próxima mamada já faz sentido na rotina de vocês.";
    show = true;
  }

  if (!show && lastDiaper && now - Number(lastDiaper.start) >= 4 * hour) {
    title = `Última fralda às ${formatTime(lastDiaper.start)}`;
    text = "Quando fizer sentido para vocês, vale dar uma olhada na próxima troca.";
    show = true;
  }

  gentleAlertCard.hidden = !show;
  if (show) {
    gentleAlertCard.innerHTML = `<span>🌿 Lembrete gentil</span><strong>${escapeHtml(title)}</strong><p>${escapeHtml(text)}</p>`;
  }
}

function getBottleMlTotal(events = []) {
  return events.reduce((total, event) => {
    if (event.type !== "mamadeira") return total;
    const detail = String(event.detail || "");
    const match = detail.match(/(\d+(?:[,.]\d+)?)\s*ml/i);
    if (!match) return total;
    const value = Number(match[1].replace(",", "."));
    return Number.isFinite(value) ? total + value : total;
  }, 0);
}


function getNotificationItems() {
  const todayStart = getDayStart();
  const events = getFamilyEventsForWindow(todayStart, todayStart + day);
  const latestBottle = [...events].reverse().find((event) => event.type === "mamadeira" || event.type === "amamentacao");
  const latestDiaper = [...events].reverse().find((event) => event.type === "fralda");
  const latestAny = [...events].reverse()[0] || null;
  const items = [];
  const now = Date.now();
  if (!events.length) {
    items.push({ icon: "✨", title: "Dia pronto para começar", text: "Quando houver o primeiro registro, o Ninou monta lembretes suaves para acompanhar a rotina." });
    return items;
  }
  if (latestBottle) {
    const elapsed = now - Number(latestBottle.start);
    if (elapsed > 2.5 * hour) items.push({ icon: "🍼", title: "Alimentação", text: `Já faz ${formatShortDuration(elapsed)} desde a última alimentação registrada.` });
  }
  if (latestDiaper) {
    const elapsed = now - Number(latestDiaper.start);
    if (elapsed > 3 * hour) items.push({ icon: "🧷", title: "Fralda", text: `Última fralda registrada há ${formatShortDuration(elapsed)}.` });
  }
  const awakeInfo = getTodayAwakeCalculation(now, events);
  if (state.mode === "awake" && awakeInfo.hasWake && awakeInfo.isOpen) {
    const awake = Math.max(0, Number(awakeInfo.durationMs) || 0);
    if (awake > wakeWindowMinutes * 60000) items.push({ icon: "🌙", title: "Sono", text: `${getBabyDisplayName()} está acordado há ${formatShortDuration(awake)}. Observe sinais de sono com calma.` });
  }
  if (latestAny?.createdByName || latestAny?.createdByEmail) {
    items.push({ icon: "👥", title: "Última atualização", text: `${getActorDisplayNameFromEvent(latestAny)} registrou ${getEventConfig(latestAny.type).title.toLowerCase()} às ${formatTime(latestAny.start)}.` });
  }
  if (!items.length) items.push({ icon: "🌿", title: "Tudo tranquilo", text: "Os registros de hoje estão organizados. O Ninou avisará quando houver algo útil para lembrar." });
  return items.slice(0, 4);
}

function renderNotificationCenter() {
  if (!notificationCenterList) return;
  const items = getNotificationItems();
  notificationCenterList.innerHTML = items.map((item) => `
    <li>
      <i>${escapeHtml(item.icon)}</i>
      <div><strong>${escapeHtml(item.title)}</strong><span>${escapeHtml(item.text)}</span></div>
    </li>
  `).join("");
  if (notificationCenterCard) notificationCenterCard.hidden = false;
}

function renderDaySummaryCard() {
  if (!daySummaryText) return;
  const todayStart = getDayStart();
  const now = Date.now();
  const events = getFamilyEventsForWindow(todayStart, todayStart + day);
  const sleepMs = getSleepMsForRange(todayStart, Math.min(todayStart + day, now));
  const feeds = countFeedingEvents(events);
  const bottleMl = Math.round(getBottleMlTotal(events));
  const diapers = countDiaperEvents(events);
  const naps = events.filter((event) => isSleepEvent(event) && Number(event.end) > Number(event.start)).length;
  const meds = countMedicationEvents(events);
  const latest = [...events].sort((a, b) => Number(b.start) - Number(a.start))[0] || null;
  const baby = getBabyDisplayName();
  if (daySummaryMoment) daySummaryMoment.textContent = new Date(now).getHours() >= 20 ? "Fechamento do dia" : "Resumo em tempo real";
  if (!events.length) {
    daySummaryText.textContent = `Ainda não há registros hoje. Comece com sono, mamada, fralda ou medicamento para o Ninou montar um resumo acolhedor do dia.`;
    return;
  }
  const latestTitle = latest ? getEventConfig(latest.type).title.toLowerCase() : "registro";
  const parts = [
    `${feeds} ${feeds === 1 ? "alimentação" : "alimentações"}`,
    `${diapers} ${diapers === 1 ? "fralda" : "fraldas"}`,
    `${naps} ${naps === 1 ? "sono" : "sonos"}`,
  ];
  if (bottleMl) parts.push(`${bottleMl} ml em mamadeiras`);
  if (meds) parts.push(`${meds} ${meds === 1 ? "medicamento" : "medicamentos"}`);
  const lastText = latest ? `Último registro: ${latestTitle} às ${formatTime(latest.start)}.` : "";
  daySummaryText.textContent = `Hoje ${baby} teve ${parts.join(", ")}. Total de sono: ${formatShortDuration(sleepMs)}. ${lastText}`.trim();
}

function getSortedWeightsAsc() {
  return normalizeWeights(babyProfile.weights || loadLocalWeights()).sort((a, b) => a.date.localeCompare(b.date));
}

function getWeightKgValue(value) {
  const raw = Number(value);
  if (!Number.isFinite(raw)) return null;
  // Migrações antigas podem ter vindo em gramas, ex.: 4300. No app exibimos sempre em kg real.
  return raw > 40 ? raw / 1000 : raw;
}

function formatKg(value) {
  const kg = getWeightKgValue(value);
  if (kg === null) return "Sem peso";
  return `${kg.toLocaleString("pt-BR", { minimumFractionDigits: 3, maximumFractionDigits: 3 })} kg`;
}

function parseWeightInputValue(value = "") {
  const normalized = String(value || "").trim().replace(",", ".");
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed)) return null;
  return parsed > 40 ? parsed / 1000 : parsed;
}

function isValidBabyWeightValue(value = "") {
  const kg = parseWeightInputValue(value);
  return Number.isFinite(kg) && kg > 0 && kg <= 30;
}

function formatWeightDelta(diff) {
  if (diff === null || !Number.isFinite(Number(diff))) return "Sem comparação anterior";
  const kg = Math.abs(Number(diff));
  const sign = Number(diff) >= 0 ? "+" : "-";
  if (kg < 1) return `${sign}${Math.round(kg * 1000)} g desde o peso anterior`;
  return `${sign}${kg.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 3 })} kg desde o peso anterior`;
}

function renderSparkline(container, weights = []) {
  if (!container) return;
  const normalized = weights
    .map((item) => ({ ...item, kg: getWeightKgValue(item.value) }))
    .filter((item) => Number.isFinite(item.kg))
    .slice(-8);
  if (normalized.length < 2) {
    container.innerHTML = `<span>Gráfico aparece com 2 pesos</span>`;
    return;
  }
  const values = normalized.map((item) => item.kg);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const paddedMin = Math.max(0, min - 0.3);
  const paddedMax = max + 0.3;
  const spread = Math.max(0.15, paddedMax - paddedMin);
  const width = 168;
  const height = 92;
  const chartLeft = 10;
  const chartRight = width - 10;
  const chartTop = 14;
  const chartBottom = height - 22;
  const points = normalized.map((item, index) => {
    const x = normalized.length === 1 ? width / 2 : chartLeft + (index / (normalized.length - 1)) * (chartRight - chartLeft);
    const y = chartBottom - ((item.kg - paddedMin) / spread) * (chartBottom - chartTop);
    return { x, y, item };
  });
  const path = points.map((point, index) => `${index ? "L" : "M"}${point.x.toFixed(1)} ${point.y.toFixed(1)}`).join(" ");
  const areaPath = `${path} L${points[points.length - 1].x.toFixed(1)} ${chartBottom} L${points[0].x.toFixed(1)} ${chartBottom} Z`;
  const circles = points.map((point) => `<circle cx="${point.x.toFixed(1)}" cy="${point.y.toFixed(1)}" r="3.8"><title>${escapeHtml(formatReportDate(point.item.date))} • ${escapeHtml(formatKg(point.item.value))}</title></circle>`).join("");
  const minLabel = escapeHtml(formatKg(paddedMin));
  const maxLabel = escapeHtml(formatKg(paddedMax));
  container.innerHTML = `<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Evolução de peso"><defs><linearGradient id="weightSoftFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="currentColor" stop-opacity=".20"/><stop offset="1" stop-color="currentColor" stop-opacity=".02"/></linearGradient></defs><line x1="${chartLeft}" y1="${chartTop}" x2="${chartRight}" y2="${chartTop}" class="weight-grid-line"></line><line x1="${chartLeft}" y1="${chartBottom}" x2="${chartRight}" y2="${chartBottom}" class="weight-grid-line"></line><path d="${areaPath}" fill="url(#weightSoftFill)"></path><path d="${path}" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"></path>${circles}<text x="${chartLeft}" y="10" class="weight-axis-label">${maxLabel}</text><text x="${chartLeft}" y="${height - 4}" class="weight-axis-label">${minLabel}</text></svg>`;
}

function renderGrowthHistoryMini(weights = []) {
  if (!growthHistoryMini) return;
  const recent = weights.slice(-4).reverse();
  if (!recent.length) {
    growthHistoryMini.innerHTML = `<article>Cadastre o primeiro peso no perfil para acompanhar o crescimento.</article>`;
    return;
  }
  growthHistoryMini.innerHTML = recent.map((item, index) => {
    const previous = weights[weights.length - 1 - index - 1];
    const diff = previous ? (getWeightKgValue(item.value) || 0) - (getWeightKgValue(previous.value) || 0) : 0;
    const diffText = previous ? formatWeightDelta(diff).replace(" desde o peso anterior", "") : "primeiro registro";
    const dateText = String(item.date || "").split("-").reverse().join("/");
    return `<article><strong>${escapeHtml(formatKg(item.value))}</strong><span>${escapeHtml(dateText)} • ${escapeHtml(diffText)}</span></article>`;
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
    renderGrowthHistoryMini([]);
    return;
  }

  const delta = previous ? (getWeightKgValue(latest.value) || 0) - (getWeightKgValue(previous.value) || 0) : 0;
  const deltaText = previous ? `${formatWeightDelta(delta).replace(" desde o peso anterior", "")} desde ${previous.date.split("-").reverse().join("/")}` : "Primeiro peso registrado";
  const latestDate = latest.date.split("-").reverse().join("/");
  targetWeightEls.forEach((el) => { el.textContent = formatKg(latest.value); });
  targetHintEls.forEach((el) => { el.textContent = `Último registro: ${latestDate}. ${deltaText}.`; });
  if (trendGrowthStatus) trendGrowthStatus.textContent = `${weights.length} ${weights.length === 1 ? "peso" : "pesos"}`;
  renderSparkline(todayWeightSparkline, weights);
  renderSparkline(trendWeightSparkline, weights);
  renderGrowthHistoryMini(weights);
}

function renderAuditTrail() {
  if (!auditTrailList) return;
  const items = (Array.isArray(state.auditLog) ? state.auditLog : [])
    .filter((item) => item?.action && item.action !== "adicionou")
    .slice(-8)
    .reverse();
  if (auditCard) auditCard.hidden = !items.length;
  if (!items.length) {
    auditTrailList.innerHTML = "<li>Nenhum ajuste técnico registrado nesta data.</li>";
    return;
  }
  auditTrailList.innerHTML = items.map((item) => {
    const actor = getActorDisplayNameFromEvent({ createdByName: item.byName, createdByRelationship: item.byRelationship, createdByEmail: item.byEmail }) || "Responsável";
    const when = item.at ? formatTime(new Date(item.at).getTime()) : "--:--";
    const action = item.action === "excluiu" ? "Excluído por" : "Editado por";
    return `<li><strong>${escapeHtml(item.title || "Registro")}</strong><span>${escapeHtml(action)} ${escapeHtml(actor)} • ${escapeHtml(when)}</span></li>`;
  }).join("");
}


function renderDayNotesPanel() {
  if (!dayNotesTextarea) return;
  const selectedDayId = getSelectedDayId();
  const value = normalizeSafeDayNotes(getValidDayNotesForDay(state, selectedDayId));
  if (state.dayNotes !== value) {
    state.dayNotes = value;
    state.dayNotesDayId = value ? selectedDayId : "";
  }
  if (document.activeElement !== dayNotesTextarea) {
    dayNotesTextarea.value = value;
  }
  if (dayNotesStatus) {
    const remaining = Math.max(0, MAX_DAY_NOTES_LENGTH - value.length);
    dayNotesStatus.textContent = value.trim() ? `Observação salva neste dia. ${remaining} caracteres restantes.` : "Nenhuma observação salva neste dia.";
  }
}

function saveDayNotes() {
  if (!requireLogin("salvar observações do dia")) return;
  const selectedDayId = getSelectedDayId();
  state.dayNotes = normalizeSafeDayNotes(dayNotesTextarea?.value || "");
  if (dayNotesTextarea) dayNotesTextarea.value = state.dayNotes;
  state.dayNotesDayId = state.dayNotes ? selectedDayId : "";
  state.dayNotesUpdatedAt = state.dayNotes ? Date.now() : 0;
  state = sanitizeDayStateForDay(state, selectedDayId, { preserveLive: true });
  saveDayState();
  renderDayNotesPanel();
}

function renderProductExperienceSections() {
  renderTodayOverview();
  renderGentleAlert();
  renderDaySummaryCard();
  renderGrowthPanels();
  renderDayNotesPanel();
  renderAuditTrail();
  renderNotificationCenter();
}

function saveBabyWeight() {
  if (!requireLogin("registrar peso")) return;
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
  reconcileCurrentAwakeStateFromEvents();
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
  updateProfileReadyExperience();
  normalizeLoggedProfileCards();
  renderCaregiverIdentityPanel();
}

function renderLiveTick() {
  reconcileCurrentAwakeStateFromEvents();
  updateTheme();

  if (!canUsePrivateFeatures()) return;
  if (state.mode === "idle" || !Number.isFinite(state.activeStartedAt)) return;
  const liveElapsed = Date.now() - Number(state.activeStartedAt || Date.now());
  if (!Number.isFinite(liveElapsed) || liveElapsed < 0 || liveElapsed > 48 * hour) {
    state = createEmptyDayState();
    saveLocalDayState();
    renderAll();
    return;
  }

  setText(stateClock, formatDuration(liveElapsed));
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
  if (mode === "awake" && getActiveAwakeWindowStart()) {
    renderAll();
    return;
  }
  const startedAt = Date.now();
  state = startRoutineTimer(state, mode, startedAt);
  if (mode === "awake") addAwakeEvent(startedAt, "Início da rotina");
  reconcileCurrentAwakeStateFromEvents({ persist: false });
  timelineRenderSignature = "";
  orbitRenderSignature = "";
  saveDayState();
  renderAll();

  if (firebaseServices && cloudUser && hasFamilyAccess()) {
    window.clearTimeout(dayCloudSaveTimer);
    void saveDayToCloud(getSelectedDayId());
  }
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
  document.body.dataset.activeScreen = activeScreenName;

  if (activeScreenName === "today") {
    ensureTodaySelectedForView();
    if (!authAccessLoading && firebaseServices && cloudUser && hasFamilyAccess()) {
      void loadFamilyDayIds({ force: true }).then(() => {
        orbitRenderSignature = "";
        renderOrbit();
        renderTodayHomeSections();
        renderSupplementalReports();
      });
    }
  }

  if (activeScreenName === "diary" && !authAccessLoading && firebaseServices && cloudUser && hasFamilyAccess()) {
    void loadFamilyDayIds({ force: true }).then(() => {
      timelineRenderSignature = "";
      renderTimeline();
    });
  }

  updateScreenVisibility({ target, navButtons, screens });
  renderBabyIdentity();
  updateBodyModeClasses();
  renderGuestPremiumContent();
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
  syncSelectedDayIntoFamilyCache();
  setSelectedDiaryDayById(value || getCurrentDayId());
  timelineRenderSignature = "";
  orbitRenderSignature = "";

  if (firebaseServices && cloudUser && hasFamilyAccess()) {
    await loadFamilyDayIds({ force: false });
  }

  const selectedDayId = getSelectedDayId();
  const cachedState = sanitizeDayStateForDay(familyDayStatesCache[selectedDayId] || loadLocalDayState(selectedDayId), selectedDayId);
  state = cachedState;
  loadedStateDayId = selectedDayId;
  saveLocalDayState();
  renderAll();

  if (firebaseServices && cloudUser && hasFamilyAccess()) {
    await subscribeToCloudDay(selectedDayId, { allowAutoLatest: false });
  } else {
    renderTimeline();
  }
}

function initDiaryDatePicker() {
  const today = getDayStart();
  const minDay = today - 30 * day;
  selectedDiaryDay = today;
  loadedStateDayId = getSelectedDayId();
  diaryDateInput.min = toDateInputValue(minDay);
  diaryDateInput.max = toDateInputValue(today);
  diaryDateInput.value = toDateInputValue(today);
}

function resetDayData() {
  if (!requireLogin("zerar a rotina")) return;
  state = createEmptyDayState();
  currentDiaryFilter = "all";
  selectedDiaryDay = getDayStart();
  loadedStateDayId = getSelectedDayId();
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
  if (wakeWindowInput) wakeWindowInput.value = String(nextValue);
  if (wakeWindowValue) wakeWindowValue.textContent = String(nextValue);
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

function getLastCloudSyncAt() {
  try { return Number(localStorage.getItem(lastCloudSyncStorageKey)) || 0; } catch { return 0; }
}

function formatSyncMoment(timestamp = getLastCloudSyncAt()) {
  if (!timestamp) return "—";
  const diff = Math.max(0, Date.now() - Number(timestamp));
  if (diff < 60_000) return "agora";
  if (diff < 60 * 60_000) return `${Math.floor(diff / 60_000)} min atrás`;
  return formatTime(timestamp);
}

function markCloudSynced() {
  try { localStorage.setItem(lastCloudSyncStorageKey, String(Date.now())); } catch {}
  renderSyncDetails();
}

function countFamilyScopedDayCaches() {
  try {
    const scope = sanitizeLocalStorageSegment(getActiveFamilyCacheScope());
    const prefix = `${storageKeys.dayState}.${scope}.`;
    return Object.keys(localStorage).filter((key) => key.startsWith(prefix)).length;
  } catch {
    return 0;
  }
}

function renderSyncDetails() {
  if (syncFamilyLabel) {
    const label = familyAccess?.familyId
      ? (getProfileFamilyDisplayName?.() || familyAccess.familyId)
      : isLoggedIn()
        ? "Conta sem família"
        : "Não conectada";
    syncFamilyLabel.textContent = label;
    syncFamilyLabel.title = familyAccess?.familyId || "";
  }
  if (syncLastSavedLabel) syncLastSavedLabel.textContent = formatSyncMoment();
}

function renderAdminDiagnostics() {
  if (!adminDiagnosticsCard) return;
  const show = Boolean(isGlobalAppAdmin() || (familyAccess?.familyId && !isProfileReadyForDailyUse()));
  adminDiagnosticsCard.hidden = !show;
  if (!show) return;

  const familyId = familyAccess?.familyId || (isGlobalAppAdmin() ? getActiveAdminFamilyId() : "");
  if (diagnosticsVersionLabel) diagnosticsVersionLabel.textContent = `Ninou v${NINOU_RUNTIME_VERSION}`;
  if (diagnosticsSummary) diagnosticsSummary.textContent = "Use este quadro para conferir se a conta, a família, o cache, o PWA e o App Check estão apontando para o lugar certo.";
  if (diagnosticsUserLabel) diagnosticsUserLabel.textContent = cloudUser?.email || "sem login";
  if (diagnosticsFamilyLabel) {
    diagnosticsFamilyLabel.textContent = familyId || "não selecionada";
    diagnosticsFamilyLabel.title = familyId || "";
  }
  if (diagnosticsPwaLabel) diagnosticsPwaLabel.textContent = window.matchMedia?.("(display-mode: standalone)")?.matches || window.navigator.standalone ? "instalado" : "navegador";
  if (diagnosticsCacheLabel) diagnosticsCacheLabel.textContent = `${countFamilyScopedDayCaches()} dia(s) locais`;
  if (diagnosticsAppCheckLabel) {
    const status = firebaseServices?.appCheckStatus;
    diagnosticsAppCheckLabel.textContent = status?.configured
      ? "ativo"
      : status?.reason === "init-error"
        ? "erro"
        : "pendente";
    diagnosticsAppCheckLabel.title = status?.configured
      ? "App Check inicializado no cliente."
      : "Cole a Site Key do reCAPTCHA Enterprise em js/config/constants.js antes de ativar enforcement.";
  }
}

function setSyncStatus(status = "offline", email = "") {
  if (status.includes?.("@") && !email) {
    email = status;
    status = "online";
  }

  // v75.56.2.1.1: o admin global não deve aparecer como "Off-line" depois do login.
  // O painel administrativo depende da autenticação do admin e de regras globais;
  // falhas pontuais de leitura/escrita no Firestore devem aparecer como aviso,
  // mas não devem rebaixar visualmente o admin conectado para visitante/off-line.
  if ((status === "offline" || status === "error") && cloudUser && isGlobalAppAdmin(cloudUser)) {
    status = "online";
    email = email || cloudUser.email || GLOBAL_APP_ADMIN_EMAIL;
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
      : "Rotina familiar sincronizando em tempo real.")
    : loading
      ? "Conectando ao Firebase..."
      : error
        ? "Não foi possível sincronizar. Verifique conexão, login ou regras do Firestore."
        : "Os dados ficam salvos neste aparelho. Entre para sincronizar entre celulares.";

  renderSyncDetails();
  renderAdminDiagnostics();
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
  if (recordForm && !sheet?.hidden) {
    requestAnimationFrame(() => {
      recordForm.scrollTo?.({ top: 0, behavior: "instant" });
      scheduleRecordScrollHintUpdate();
    });
  }
}

function updateRecordScrollHint() {
  if (!sheet || !recordForm || !recordScrollHint || sheet.hidden) {
    recordScrollHint?.setAttribute?.("aria-hidden", "true");
    if (recordScrollHint) recordScrollHint.hidden = true;
    sheet?.classList?.remove?.("record-has-more", "record-at-bottom");
    return;
  }

  const maxScroll = Math.max(0, recordForm.scrollHeight - recordForm.clientHeight);
  const canScroll = maxScroll > 10;
  const atBottom = canScroll && recordForm.scrollTop >= maxScroll - 12;
  const shouldShow = canScroll && !atBottom;

  recordScrollHint.hidden = !shouldShow;
  recordScrollHint.setAttribute("aria-hidden", shouldShow ? "false" : "true");
  sheet.classList.toggle("record-has-more", shouldShow);
  sheet.classList.toggle("record-at-bottom", canScroll && atBottom);
}

function scheduleRecordScrollHintUpdate() {
  requestAnimationFrame(() => {
    updateRecordScrollHint();
    requestAnimationFrame(updateRecordScrollHint);
  });
}

function scrollRecordFormForward() {
  if (!recordForm) return;
  recordForm.scrollBy({ top: Math.max(140, Math.floor(recordForm.clientHeight * 0.42)), behavior: "smooth" });
  scheduleRecordScrollHintUpdate();
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
  requestAnimationFrame(() => {
    recordForm?.scrollTo?.({ top: 0, behavior: "instant" });
    scheduleRecordScrollHintUpdate();
  });
}

function closeSheet() {
  sheet?.classList?.remove?.("record-has-more", "record-at-bottom");
  if (recordScrollHint) {
    recordScrollHint.hidden = true;
    recordScrollHint.setAttribute("aria-hidden", "true");
  }
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
  const payloadDayId = getDayIdFromStart(payload.start);
  const selectedBeforeSaveId = getSelectedDayId();

  if (!existingEvent && payloadDayId !== selectedBeforeSaveId) {
    syncSelectedDayIntoFamilyCache();
    setSelectedDiaryDayById(payloadDayId);
    state = getFamilyDayState(payloadDayId);
    loadedStateDayId = payloadDayId;
    timelineRenderSignature = "";
    orbitRenderSignature = "";
  }

  if (payload.type === "acordou") {
    const duplicateWake = state.events.some((event) => (
      event?.id !== (existingEvent?.id || null)
      && event.type === "acordou"
      && Math.abs(Number(event.start) - Number(payload.start)) < 60000
    ));
    if (duplicateWake) {
      window.alert("Já existe um registro de Acordou nesse mesmo minuto. Para corrigir, edite o registro existente.");
      return;
    }
  }

  const startsLiveSleep = shouldStartLiveSleepFromManualEvent(payload.type, payload.start, existingEvent);
  const startsLiveAwake = shouldStartLiveAwakeFromManualNightWake(payload.type, payload.start, existingEvent);

  if (existingEvent) {
    const wakeWindow = payload.type === "sono" || payload.type === "dormir"
      ? getWakeWindowForSleepStart(payload.start, existingEvent.id)
      : null;
    const actor = getCurrentActorProfile();
    const standardFields = getStandardEventFields(payload.type, payload.start, actor);
    updateEventKeepingDuration(existingEvent, {
      ...standardFields,
      type: payload.type,
      start: payload.start,
      end: payload.hasManualEnd ? payload.end : undefined,
      detail: payload.detail,
      notes: payload.notes,
      wakeWindowStartedAt: wakeWindow?.wakeWindowStartedAt,
      wakeWindowMs: wakeWindow?.wakeWindowMs,
      updatedAt: new Date().toISOString(),
      updatedByUid: actor.uid,
      updatedByEmail: actor.email,
      updatedByDeviceId: actor.deviceId,
      updatedByName: actor.displayName || actor.label,
      updatedByRelationship: actor.relationshipLabel,
      updatedAtClient: Date.now(),
      lastAction: "editou",
    });
    pushAuditEntry("editou", existingEvent);
    state = rebuildRoutineModeAfterMutation(state, getSelectedDayId(), { preserveSleeping: false });
  } else if ((payload.type === "sono" || payload.type === "dormir" || payload.type === "despertar-noturno") && payload.hasManualEnd) {
    const newEvent = makeEvent(payload.type, payload.start, payload.end, payload.detail, payload.notes);
    state.events.push(newEvent);
    pushAuditEntry("adicionou", newEvent);
  } else if (payload.type === "acordou") {
    if (state.mode === "sleeping" && canUseManualTimeForLiveState(payload.start)) {
      state = finishActiveSleep(state, makeEvent, payload.start);
    } else if (state.mode !== "awake" && canUseManualTimeForLiveState(payload.start)) {
      state = startRoutineTimer(state, "awake", payload.start);
    }
    const addedWakeEvent = addAwakeEvent(payload.start, payload.detail || "Acordou", payload.notes, { checkActiveWindow: false });
    if (!addedWakeEvent) {
      window.alert("Não foi possível criar outro Acordou no mesmo minuto. Edite o registro existente se precisar ajustar o horário.");
      return;
    }
  } else if (startsLiveAwake) {
    startLiveAwakeFromManualNightWake(payload.start, payload.detail, payload.notes);
  } else if (startsLiveSleep) {
    startLiveSleepFromManualEvent(payload.type, payload.start, payload.detail, payload.notes);
  } else {
    const newEvent = makeEvent(payload.type, payload.start, payload.hasManualEnd ? payload.end : payload.start, payload.detail, payload.notes);
    state.events.push(newEvent);
    pushAuditEntry("adicionou", newEvent);
  }

  state = rebuildRoutineModeAfterMutation(state, getSelectedDayId(), { preserveSleeping: true });

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

  if (currentDiaryFilter !== "all") {
    currentDiaryFilter = "all";
    diaryFilterButtons.forEach((button) => {
      button.classList.toggle("active", button.dataset.diaryFilter === "all");
    });
    window.setTimeout(updateDiaryChipsMoreButton, 220);
  }

  timelineRenderSignature = "";
  orbitRenderSignature = "";
  saveDayState();
  renderAll();

  if (firebaseServices && cloudUser && hasFamilyAccess()) {
    window.clearTimeout(dayCloudSaveTimer);
    void saveDayToCloud(getSelectedDayId());
  }
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
  state.deletedEventIds = [...new Set([...(state.deletedEventIds || []), event.id])].slice(-240);
  state.events = removeEventById(state.events, eventId).filter((item) => !getDeletedEventIdsFromState(state).has(item.id));
  state = rebuildRoutineModeAfterMutation(state, getSelectedDayId(), { preserveSleeping: false });
  timelineRenderSignature = "";
  orbitRenderSignature = "";
  saveDayState();
  renderAll();

  if (firebaseServices && cloudUser && hasFamilyAccess()) {
    void saveDayToCloud(getSelectedDayId());
  }
}

function getExportEvents() {
  return buildExportEvents(state.events, getEventConfig);
}

function getCustomExportRange(selectedDayId = getSelectedDayId()) {
  const startText = exportStartDateInput?.value || selectedDayId;
  const endText = exportEndDateInput?.value || selectedDayId;
  const startDate = parseLocalDate(startText) || parseLocalDate(selectedDayId) || new Date();
  const endDate = parseLocalDate(endText) || parseLocalDate(selectedDayId) || startDate;
  const start = getDayStart(Math.min(startDate.getTime(), endDate.getTime()));
  const end = getDayStart(Math.max(startDate.getTime(), endDate.getTime())) + day;
  return {
    start,
    end,
    startId: toDateInputValue(start),
    endId: toDateInputValue(end - day),
  };
}

function getEffectiveExportRangeMode(selectedDayId = getSelectedDayId()) {
  const selectedMode = exportRangeSelect?.value || "day";
  const startText = exportStartDateInput?.value || "";
  const endText = exportEndDateInput?.value || "";
  if (selectedMode === "day" && startText && endText && startText !== endText) return "custom";
  return selectedMode;
}

function syncExportRangeModeFromDates() {
  if (!exportRangeSelect || !exportStartDateInput || !exportEndDateInput) return;
  if (exportStartDateInput.value && exportEndDateInput.value && exportStartDateInput.value !== exportEndDateInput.value) {
    exportRangeSelect.value = "custom";
  }
}

function getExportWindow() {
  const selectedStart = selectedDiaryDay ?? getDayStart();
  const selectedDayId = toDateInputValue(selectedStart);
  const mode = getEffectiveExportRangeMode(selectedDayId);
  let start = selectedStart;
  let end = selectedStart + day;
  let label = formatReportDate(selectedDayId);

  if (mode === "7" || mode === "30") {
    const count = Number(mode);
    start = getDayStart() - (count - 1) * day;
    end = getDayStart() + day;
    label = `Últimos ${count} dias`;
  } else if (mode === "custom") {
    const range = getCustomExportRange(selectedDayId);
    start = range.start;
    end = range.end;
    label = range.startId === range.endId
      ? formatReportDate(range.startId)
      : `${formatReportDate(range.startId)} a ${formatReportDate(range.endId)}`;
  }

  return { mode, start, end, label, dayId: selectedDayId };
}

function getDayNotesForWindow(start, end) {
  syncSelectedDayIntoFamilyCache();
  const notes = [];
  for (let cursor = getDayStart(start); cursor < end; cursor += day) {
    const dayId = toDateInputValue(cursor);
    const note = getFamilyDayState(dayId).dayNotes || "";
    if (note.trim()) notes.push(`${formatReportDate(dayId)}: ${note.trim()}`);
  }
  return notes;
}

function getExportPayload() {
  const windowInfo = getExportWindow();
  const selectedState = getFamilyDayState(windowInfo.dayId);
  const events = getFamilyEventsForWindow(windowInfo.start, windowInfo.end);
  const dayNotesList = getDayNotesForWindow(windowInfo.start, windowInfo.end);
  return {
    app: "Ninou",
    exportedAt: new Date().toISOString(),
    exportedBy: cloudUser?.email || "",
    day: windowInfo.dayId,
    period: {
      label: windowInfo.label,
      start: toDateInputValue(windowInfo.start),
      end: toDateInputValue(windowInfo.end - day),
      mode: windowInfo.mode,
    },
    profile: normalizeBabyProfile(babyProfile),
    weights: getSortedWeightsAsc(),
    wakeWindowMinutes,
    state: normalizeDayState(selectedState),
    dayNotes: windowInfo.mode === "day" ? (selectedState.dayNotes || "") : dayNotesList.join("\n"),
    events: buildExportEvents(events, getEventConfig),
    summary: {
      text: daySummaryText?.textContent || "",
      exportedFrom: "Ninou v75.31",
    },
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

function formatReportDate(value) {
  const text = String(value || "");
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text.split("-").reverse().join("/");
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? text : date.toLocaleDateString("pt-BR");
}

function normalizeWhatsappNumber(value = "") {
  let digits = String(value || "").replace(/\D/g, "");
  if (!digits) return "";
  while (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.startsWith("0")) digits = digits.slice(1);
  if (digits.length === 10 || digits.length === 11) digits = `55${digits}`;
  return digits;
}

function getRoutineStats(payload = getExportPayload()) {
  const events = payload.events || [];
  const sleepMinutes = events.reduce((total, event) => {
    const type = String(event.type || "");
    const isSleep = type.includes("sono") || type === "dormir";
    return total + (isSleep ? Number(event.durationMinutes || 0) : 0);
  }, 0);
  const feeds = events.filter((event) => event.type === "mamadeira" || event.type === "amamentacao").length;
  const diapers = events.filter((event) => event.type === "fralda").length;
  const meds = events.filter((event) => event.type === "medicamento").length;
  const naps = events.filter((event) => String(event.type || "").includes("sono") || event.type === "dormir").length;
  const bottleMl = events.reduce((total, event) => {
    if (event.type !== "mamadeira") return total;
    const match = String(event.detail || "").match(/(\d+(?:[,.]\d+)?)\s*ml/i);
    if (!match) return total;
    const value = Number(match[1].replace(",", "."));
    return Number.isFinite(value) ? total + value : total;
  }, 0);
  const latest = [...events].sort((a, b) => String(b.start).localeCompare(String(a.start)))[0] || null;
  return { sleepMinutes, feeds, diapers, meds, naps, bottleMl: Math.round(bottleMl), latest };
}

function getWeightReportInfo(weights = []) {
  const sorted = [...(weights || [])]
    .map((item) => ({ ...item, kg: getWeightKgValue(item.value) }))
    .filter((item) => Number.isFinite(item.kg))
    .sort((a, b) => String(a.date || "").localeCompare(String(b.date || "")));
  const latest = sorted[sorted.length - 1] || null;
  const previous = sorted[sorted.length - 2] || null;
  const diff = latest && previous ? Number(latest.kg) - Number(previous.kg) : null;
  return { sorted, latest, previous, diff };
}

function buildRoutineSummaryText(payload = getExportPayload()) {
  const stats = getRoutineStats(payload);
  const weightInfo = getWeightReportInfo(payload.weights || []);
  const latestWeight = weightInfo.latest;
  const baby = getBabyDisplayName();
  return [
    `Resumo Ninou - ${baby}`,
    `Período: ${payload.period?.label || formatReportDate(payload.day)}`,
    `Sono total: ${formatShortDuration(stats.sleepMinutes * 60000)}`,
    `Alimentações: ${stats.feeds}${stats.bottleMl ? ` (${stats.bottleMl} ml em mamadeiras)` : ""}`,
    `Fraldas: ${stats.diapers}`,
    stats.meds ? `Medicamentos: ${stats.meds}` : "",
    stats.latest ? `Último registro: ${stats.latest.title} às ${formatTime(new Date(stats.latest.start).getTime())}` : "Sem registros no dia.",
    latestWeight ? `Peso atual: ${formatKg(latestWeight.value)} (${formatReportDate(latestWeight.date)})` : "",
    payload.dayNotes ? `Observações do dia: ${payload.dayNotes}` : "",
  ].filter(Boolean).join("\n");
}

function buildPrintableReportHtml(payload = getExportPayload()) {
  const baby = getBabyDisplayName();
  const stats = getRoutineStats(payload);
  const weightInfo = getWeightReportInfo(payload.weights || []);
  const eventRows = (payload.events || []).map((event, index) => {
    const startTime = formatTime(new Date(event.start).getTime());
    const endTime = event.end && event.end !== event.start ? formatTime(new Date(event.end).getTime()) : "";
    const actor = getActorDisplayNameFromEvent(event);
    const detail = [event.detail, event.notes ? `Obs.: ${event.notes}` : ""].filter(Boolean).join(" - ");
    return `<tr><td><b>${escapeHtml(startTime)}</b>${endTime ? `<small>até ${escapeHtml(endTime)}</small>` : ""}</td><td><strong>${escapeHtml(event.title)}</strong><small>${escapeHtml(event.type || "")}</small></td><td>${escapeHtml(detail || "-")}</td><td>${escapeHtml(String(event.durationMinutes || "-"))}</td><td>${escapeHtml(actor || "-")}</td></tr>`;
  }).join("") || `<tr><td colspan="5" class="empty-cell">Sem registros nesta data.</td></tr>`;

  const weightRows = weightInfo.sorted.slice(-10).reverse().map((item) => `<tr><td>${escapeHtml(formatReportDate(item.date))}</td><td><strong>${escapeHtml(formatKg(item.value))}</strong></td></tr>`).join("") || `<tr><td colspan="2" class="empty-cell">Sem pesos cadastrados.</td></tr>`;
  const weightDelta = formatWeightDelta(weightInfo.diff);
  const reportTitle = `Relatório da rotina - ${baby}`;
  const safeSummary = escapeHtml(buildRoutineSummaryText(payload)).replaceAll("\n", "<br>");
  const dayNotesBlock = payload.dayNotes ? `<section><h2>Observações do dia</h2><div class="growth-note">${escapeHtml(payload.dayNotes)}</div></section>` : "";
  const cards = [
    ["Sono", formatShortDuration(stats.sleepMinutes * 60000), payload.period?.mode === "day" ? "Total no dia" : "Total do período"],
    ["Alimentações", String(stats.feeds), stats.bottleMl ? `${stats.bottleMl} ml em mamadeiras` : "Mamadas e mamadeiras"],
    ["Fraldas", String(stats.diapers), payload.period?.mode === "day" ? "Trocas do dia" : "Trocas no período"],
    ["Peso atual", weightInfo.latest ? formatKg(weightInfo.latest.value) : "Sem peso", weightInfo.latest ? formatReportDate(weightInfo.latest.date) : "Cadastre no perfil"],
  ].map(([label, value, hint]) => `<article><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong><small>${escapeHtml(hint)}</small></article>`).join("");

  return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(reportTitle)}</title>
  <style>
    :root{--ink:#30263f;--muted:#756985;--soft:#f8f2e9;--card:#fffaf3;--line:#e8d9ca;--sage:#1f6b57;--purple:#4b3a78;--accent:#8f7cff}
    *{box-sizing:border-box}
    body{margin:0;background:#f2eadf;color:var(--ink);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif;line-height:1.45}
    .page{width:100%;max-width:794px;margin:0 auto;padding:32px;box-sizing:border-box;overflow-wrap:anywhere}
    .cover{padding:28px;border-radius:30px;background:linear-gradient(135deg,#fffaf3,#efe7ff);border:1px solid rgba(75,58,120,.12);box-shadow:0 18px 50px rgba(67,50,94,.12)}
    .brand{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-bottom:24px}
    .brand span{font-size:13px;font-weight:900;letter-spacing:.14em;text-transform:uppercase;color:var(--purple)}
    .brand b{padding:8px 14px;border-radius:999px;background:#e2f5eb;color:var(--sage);font-size:13px}
    h1{font-size:34px;line-height:1.08;margin:0 0 8px}
    .subtitle{font-size:16px;color:var(--muted);margin:0}
    .summary{margin-top:22px;padding:18px;border-radius:22px;background:rgba(255,255,255,.64);border:1px solid rgba(75,58,120,.10)}
    .cards{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin-top:18px}
    .cards article{padding:16px;border-radius:20px;background:var(--card);border:1px solid rgba(75,58,120,.10)}
    .cards span,.cards small{display:block;color:var(--muted);font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:.05em}
    .cards strong{display:block;margin:8px 0 4px;font-size:22px;color:var(--purple)}
    section{margin-top:24px;padding:22px;border-radius:26px;background:#fffaf5;border:1px solid var(--line);break-inside:avoid;page-break-inside:avoid;overflow-wrap:anywhere}
    h2{font-size:22px;margin:0 0 12px;color:var(--purple)}
    .section-hint{margin:-4px 0 14px;color:var(--muted)}
    .table-wrap{width:100%;overflow-x:auto;border-radius:18px;border:1px solid var(--line)}
    table{width:100%;border-collapse:separate;border-spacing:0;font-size:13px;table-layout:fixed;min-width:0}
    th{background:#efe7ff;color:var(--purple);font-size:11px;text-transform:uppercase;letter-spacing:.04em;text-align:left;padding:10px;word-break:normal;overflow-wrap:anywhere}
    td{padding:11px 10px;border-top:1px solid var(--line);vertical-align:top;background:#fffdf9;word-break:normal;overflow-wrap:anywhere}
    td small{display:block;color:var(--muted);margin-top:3px}
    .empty-cell{text-align:center;color:var(--muted);padding:22px}
    .growth-note{padding:14px 16px;border-radius:18px;background:#e9f7f1;color:var(--sage);font-weight:800;margin-bottom:12px}
    .footer{margin-top:18px;color:var(--muted);font-size:12px;text-align:center}
    @media print{body{background:#fff}.page{max-width:100%;padding:0}.cover,section{box-shadow:none}.no-print{display:none}.cards{grid-template-columns:repeat(4,1fr)}table{font-size:11px}th,td{padding:8px 7px}}
    @media (max-width:760px){.page{padding:14px}.cover,section{padding:18px;border-radius:22px}.cards{grid-template-columns:repeat(2,minmax(0,1fr))}h1{font-size:26px}table{font-size:12px}th,td{padding:9px 8px}}
  </style>
</head>
<body>
  <main class="page">
    <div class="cover">
      <div class="brand"><span>Ninou</span><b>Relatório da rotina</b></div>
      <h1>${escapeHtml(reportTitle)}</h1>
      <p class="subtitle">Período: ${escapeHtml(payload.period?.label || formatReportDate(payload.day))} • Exportado em ${escapeHtml(new Date(payload.exportedAt).toLocaleString("pt-BR"))}${payload.exportedBy ? ` • por ${escapeHtml(payload.exportedBy)}` : ""}</p>
      <div class="summary">${safeSummary}</div>
      <div class="cards">${cards}</div>
    </div>

    <section>
      <h2>${payload.period?.mode === "day" ? "Rotina do dia" : "Rotina do período"}</h2>
      <p class="section-hint">Linha do tempo dos registros selecionados para consulta, acompanhamento ou compartilhamento com responsáveis.</p>
      <div class="table-wrap"><table><thead><tr><th>Hora</th><th>Registro</th><th>Detalhe</th><th>Min</th><th>Responsável</th></tr></thead><tbody>${eventRows}</tbody></table></div>
    </section>

    ${dayNotesBlock}

    <section>
      <h2>Crescimento</h2>
      <div class="growth-note">${escapeHtml(weightInfo.latest ? `${formatKg(weightInfo.latest.value)} em ${formatReportDate(weightInfo.latest.date)}. ${weightDelta}` : "Nenhum peso cadastrado para este bebê.")}</div>
      <div class="table-wrap"><table><thead><tr><th>Data</th><th>Peso</th></tr></thead><tbody>${weightRows}</tbody></table></div>
    </section>

    <p class="footer">Relatório gerado pelo Ninou. Use Arquivo > Imprimir ou Salvar como PDF.</p>
  </main>
  <script>window.onload=()=>setTimeout(()=>window.print(),350)</script>
</body>
</html>`;
}

function buildWhatsappShareText(payload = getExportPayload()) {
  const custom = whatsappMessageInput?.value?.trim() || "";
  const summary = buildRoutineSummaryText(payload);
  if (!custom) return `Olá! Segue o resumo da rotina pelo Ninou.\n\n${summary}`;

  const customAlreadyHasSummary = /Resumo Ninou|Principais pontos|Sono registrado|Alimentações:|Fraldas:|Período:/i.test(custom);
  return customAlreadyHasSummary ? custom : `${custom}\n\n${summary}`;
}


function prepareConsultMode() {
  const payload = getExportPayload();
  const baby = getBabyDisplayName();
  const stats = getRoutineStats(payload);
  const weightInfo = getWeightReportInfo(payload.weights || []);
  const lines = [
    `Olá, segue o resumo do Ninou para a consulta de ${baby}.`,
    `Período: ${payload.period?.label || formatReportDate(payload.day)}.`,
    "",
    "Principais pontos:",
    `• Sono registrado: ${formatShortDuration(stats.sleepMinutes * 60000)}`,
    `• Alimentações: ${stats.feeds}${stats.bottleMl ? ` (${stats.bottleMl} ml em mamadeiras)` : ""}`,
    `• Fraldas: ${stats.diapers}`,
    weightInfo.latest ? `• Peso atual: ${formatKg(weightInfo.latest.value)} em ${formatReportDate(weightInfo.latest.date)}` : "• Peso atual: não cadastrado",
    payload.dayNotes ? `• Observações: ${payload.dayNotes.split("\n").slice(-2).join(" | ")}` : "",
  ].filter(Boolean);
  if (whatsappMessageInput) whatsappMessageInput.value = lines.join("\n");
}

function exportRoutine(format) {
  if (!requireLogin("exportar a rotina")) return;
  if (exportRoutineInProgress) return;
  exportRoutineInProgress = true;
  window.setTimeout(() => { exportRoutineInProgress = false; }, 1200);
  const payload = getExportPayload();
  const filenameBase = `ninou-${String(payload.period?.start || payload.day)}-${String(payload.period?.end || payload.day)}`;

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
    const weightRows = (payload.weights || []).map((item) => [item.date, item.value, item.id || ""]);
    const csvParts = [
      [header, ...rows].map((row) => row.map(escapeCsv).join(",")).join("\n"),
      "",
      ["pesos", "valor_kg", "id"].map(escapeCsv).join(","),
      ...weightRows.map((row) => row.map(escapeCsv).join(",")),
    ];
    const csv = csvParts.join("\n");
    downloadFile(`${filenameBase}.csv`, csv, "text/csv;charset=utf-8");
    return;
  }

  if (format === "pdf") {
    const html = buildPrintableReportHtml(payload);
    const win = window.open("", "_blank", "noopener,noreferrer");
    if (win) {
      win.document.write(html);
      win.document.close();
    } else {
      downloadFile(`${filenameBase}-relatorio.html`, html, "text/html;charset=utf-8");
      window.alert("O navegador bloqueou a janela do PDF. Baixei um HTML pronto para abrir e salvar como PDF.");
    }
    return;
  }

  if (format === "whatsapp") {
    const rawNumber = whatsappNumberInput?.value?.trim() || "";
    const number = normalizeWhatsappNumber(rawNumber);
    if (rawNumber && (number.length < 12 || number.length > 13)) {
      window.alert("Confira o número do WhatsApp. Use DDD + número, por exemplo: 21999999999.");
      whatsappNumberInput?.focus();
      return;
    }
    const text = encodeURIComponent(buildWhatsappShareText(payload));
    const url = number ? `https://wa.me/${number}?text=${text}` : `https://wa.me/?text=${text}`;
    window.open(url, "_blank", "noopener,noreferrer");
    return;
  }

  downloadFile(`${filenameBase}.json`, JSON.stringify(payload, null, 2), "application/json;charset=utf-8");
}

function updateProfilePhoto(dataUrl) {
  applyProfilePhotoToImages(profileImages, dataUrl);
}

function resizeImage(file) {
  // v75.56.2.1.1: fotos foram removidas. Mantido apenas para compatibilidade defensiva.
  return resizeProfileImage(file, { size: 120, quality: 0.5 });
}

bindBottomNavigation(navButtons, showScreen);
bindSyncPillNavigation(syncPill, showScreen);

bindShortcutNavigation(shortcutButtons, showScreen);

summaryRangeButtons.forEach((button) => {
  button.addEventListener("click", () => setSummaryRangeMode(button.dataset.summaryRange));
});

if (intelligentTimeline) {
  intelligentTimeline.addEventListener("click", (event) => {
    const moreButton = event.target.closest("[data-intelligent-timeline-more]");
    if (!moreButton) return;
    expandIntelligentTimeline();
  });
}

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
  button.addEventListener("click", () => {
    setSheetType(button.dataset.sheetType);
    scheduleRecordScrollHintUpdate();
  });
});

if (recordForm) {
  recordForm.addEventListener("scroll", updateRecordScrollHint, { passive: true });
  recordForm.addEventListener("input", scheduleRecordScrollHintUpdate);
}
if (recordScrollHint) recordScrollHint.addEventListener("click", scrollRecordFormForward);
window.addEventListener("resize", scheduleRecordScrollHintUpdate, { passive: true });

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
if (saveDayNotesButton) saveDayNotesButton.addEventListener("click", saveDayNotes);
if (saveCaregiverIdentityButton) saveCaregiverIdentityButton.addEventListener("click", saveCaregiverIdentityFromForm);
if (familyCreateInviteButton) familyCreateInviteButton.addEventListener("click", createFamilyCaregiverInvite);
if (familyCopyInviteButton) familyCopyInviteButton.addEventListener("click", copyFamilyInviteCode);
if (familyShareInviteWhatsAppButton) familyShareInviteWhatsAppButton.addEventListener("click", shareFamilyInviteOnWhatsApp);
if (familyJoinInviteButton) familyJoinInviteButton.addEventListener("click", openJoinFamilyModal);
if (confirmJoinInviteButton) confirmJoinInviteButton.addEventListener("click", confirmJoinFamilyInvite);
document.querySelectorAll("[data-close-join-modal]").forEach((button) => button.addEventListener("click", closeJoinFamilyModal));
if (joinFamilyModal) joinFamilyModal.addEventListener("click", (event) => {
  if (event.target === joinFamilyModal) closeJoinFamilyModal();
});
if (supportSuggestionButton) supportSuggestionButton.addEventListener("click", () => openSupportWhatsApp("suggestion"));
if (supportBugButton) supportBugButton.addEventListener("click", () => openSupportWhatsApp("bug"));
if (prepareConsultButton) prepareConsultButton.addEventListener("click", prepareConsultMode);
if (exportPdfButton) exportPdfButton.addEventListener("click", () => exportRoutine("pdf"));
if (shareWhatsappButton) shareWhatsappButton.addEventListener("click", () => exportRoutine("whatsapp"));
if (exportStartDateInput) exportStartDateInput.addEventListener("change", syncExportRangeModeFromDates);
if (exportEndDateInput) exportEndDateInput.addEventListener("change", syncExportRangeModeFromDates);
if (familyWelcomeStartButton) familyWelcomeStartButton.addEventListener("click", () => showScreen("today"));
if (guestWelcomeLoginButton) guestWelcomeLoginButton.addEventListener("click", () => focusProfileAccess("login"));
if (guestWelcomeInviteButton) guestWelcomeInviteButton.addEventListener("click", () => focusProfileAccess("invite"));
if (guestWelcomeCreateFamilyButton) {
  guestWelcomeCreateFamilyButton.addEventListener("click", () => {
    focusProfileAccess("login");
    if (!isLoggedIn()) {
      if (loginHelper) loginHelper.textContent = "Crie sua conta e depois toque em Criar minha família.";
      loginEmail?.focus();
      return;
    }
    activatePersonalFamily().catch((error) => {
      console.error("Erro ao criar família:", error);
      if (loginHelper) loginHelper.textContent = getFirebaseErrorMessage(error);
    });
  });
}
if (guestModalCloseButton) guestModalCloseButton.addEventListener("click", closeGuestLoginModal);
if (guestModalLoginButton) guestModalLoginButton.addEventListener("click", () => focusProfileAccess("login"));
if (guestModalInviteButton) guestModalInviteButton.addEventListener("click", () => focusProfileAccess("invite"));
if (guestOnboardingModal) {
  guestOnboardingModal.addEventListener("click", (event) => {
    if (event.target === guestOnboardingModal) closeGuestLoginModal();
  });
}
document.addEventListener("click", (event) => {
  const postAction = event.target.closest("[data-post-access-action]");
  if (postAction) {
    event.preventDefault();
    event.stopPropagation();
    const action = postAction.dataset.postAccessAction || "profile";
    if (action === "invite") {
      focusProfileAccess("invite");
      return;
    }
    if (action === "start") {
      showScreen("today");
      return;
    }
    const target = caregiverIdentityCard || document.querySelector("#accountJourneyCard");
    target?.scrollIntoView({ behavior: "smooth", block: "center" });
    caregiverNameInput?.focus();
    return;
  }

  const themeAction = event.target.closest("[data-theme-choice]");
  if (themeAction) {
    event.preventDefault();
    event.stopPropagation();
    setGuestThemeChoice(themeAction.dataset.themeChoice || "dark");
    return;
  }

  const journeyAction = event.target.closest("[data-journey-action]");
  if (journeyAction) {
    event.preventDefault();
    event.stopPropagation();
    const action = journeyAction.dataset.journeyAction || "login";
    if (action === "login" && isLoggedIn() && hasFamilyAccess()) {
      showScreen("today");
      return;
    }
    focusProfileAccess(action === "invite" ? "invite" : action === "create" ? "create" : "login");
    return;
  }

  const guestAction = event.target.closest("[data-guest-action]");
  if (!guestAction) return;
  event.preventDefault();
  event.stopPropagation();
  focusProfileAccess(guestAction.dataset.guestAction === "invite" ? "invite" : "login");
}, true);

wakeWindowInput.addEventListener("input", () => {
  const nextValue = Number(wakeWindowInput.value);
  if (nextValue >= 20 && nextValue <= 240) {
    wakeWindowMinutes = nextValue;
    if (wakeWindowValue) wakeWindowValue.textContent = String(nextValue);
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
    if (themeModeInput) themeModeInput.value = nextMode;
    try { localStorage.setItem(storageKeys.themeMode, nextMode); } catch {}

    if (isGlobalAppAdmin() && !window.__ninouAdminFamilyDataOpen) {
      saveBabyProfile();
      updateTheme();
      renderGuestThemeButtons();
      renderProfileFamilyCards();
      return;
    }

    markProfileLocallyChanged();
    saveBabyProfile();
    scheduleProfileCloudSave();
    updateTheme();
    renderGuestThemeButtons();
    renderProfileFamilyCards();
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

if (avatarIconOptions) {
  avatarIconOptions.addEventListener("click", (event) => {
    const button = event.target.closest("[data-avatar-type=\"hair\"][data-avatar-value]");
    if (!button) return;
    updatePendingAvatar("hair", button.dataset.avatarValue);
  });
}

avatarTabs.forEach((button) => {
  button.addEventListener("click", () => {
    avatarTabs.forEach((item) => item.classList.toggle("active", item === button));
    const section = document.querySelector(`[data-avatar-section="${button.dataset.avatarJump}"]`);
    section?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  });
});

if (editBabyAvatarButton) {
  editBabyAvatarButton.addEventListener("click", () => {
    const modalOpen = Boolean(babyAvatarCard && !babyAvatarCard.hidden);
    if (!modalOpen) {
      openAvatarEditor();
    } else {
      closeAvatarEditor();
    }
  });
}

if (babyAvatarModalBackdrop) {
  babyAvatarModalBackdrop.addEventListener("click", () => closeAvatarEditor());
}

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && babyAvatarCard && !babyAvatarCard.hidden) {
    closeAvatarEditor();
  }
});

if (babyAvatarDetails) {
  babyAvatarDetails.addEventListener("toggle", () => {
    if (babyAvatarDetails.open) {
      avatarEditorForceOpen = true;
      renderAvatarCustomizer();
    } else {
      avatarEditorForceOpen = false;
      renderAvatarEditorVisibility();
    }
  });
}

if (saveBabyAvatarButton) saveBabyAvatarButton.addEventListener("click", saveBabyAvatarFromDraft);
if (skipBabyAvatarButton) skipBabyAvatarButton.addEventListener("click", () => {
  pendingBabyAvatar = normalizeAvatarDraft(babyProfile.avatar || {});
  renderAvatarCustomizer();
  closeAvatarEditor();
});

if (profilePhotoInput) profilePhotoInput.addEventListener("change", () => {
  profilePhotoInput.value = "";
  if (loginHelper) loginHelper.textContent = "O Ninou agora usa somente avatars ilustrados prontos. Fotos antigas e novos uploads não são usados.";
});

loginButton.addEventListener("click", signInAccount);
createAccountButton.addEventListener("click", createAccount);
if (clearDeviceDataButton) clearDeviceDataButton.addEventListener("click", signOutAndClearDeviceData);
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


updateProfilePhoto(getBabyAvatarDataUrl(babyProfile.avatar || pendingBabyAvatar));

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

function showAppUpdateNotice(registration) {
  if (!appUpdateNotice || !appUpdateButton) return;
  appUpdateNotice.hidden = false;
  appUpdateButton.onclick = () => {
    const waiting = registration?.waiting;
    if (waiting) waiting.postMessage({ type: "SKIP_WAITING" });
    window.location.reload();
  };
}

if ("serviceWorker" in navigator) {
  let refreshing = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (refreshing) return;
    refreshing = true;
    window.location.reload();
  });

  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js", { updateViaCache: "none" }).then((registration) => {
      registration.update().catch(() => {});

      if (registration.waiting) showAppUpdateNotice(registration);

      registration.addEventListener("updatefound", () => {
        const newWorker = registration.installing;
        if (!newWorker) return;
        newWorker.addEventListener("statechange", () => {
          if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
            showAppUpdateNotice(registration);
          }
        });
      });
    }).catch((error) => {
      console.warn("Service worker não registrado:", error);
    });
  });
}


sheetDateInput?.addEventListener("input", updateSleepDurationPreview);
sheetEndTimeInput?.addEventListener("input", updateSleepDurationPreview);
sheetDetail?.addEventListener("change", updateSleepDurationPreview);
