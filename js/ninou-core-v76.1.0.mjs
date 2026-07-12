import { storageKeys, hour, day } from "./config/constants.js";
import { countBreastfeedingEvents, countFeedingEvents, createBreastTimerState, formatBreastTimer as formatBreastTimerValue, getBreastTimerDetail as buildBreastTimerDetail, getBreastTimerSnapshot as buildBreastTimerSnapshot, normalizeBottleAmount, parseAmountMl, resetBreastTimerState, startBreastTimerSide, stopBreastTimerState, sumBottleAmountMl } from "./domain/feeding.js";
import { countDiaperEvents } from "./domain/diaper.js";
import { countMedicationEvents } from "./domain/medication.js";
import { canUseManualTimeForLiveState as canUseManualLiveTime, closeActiveNightWake as closeActiveNightWakeInState, finishActiveSleep, getActiveNightWakeEvent as findActiveNightWakeEvent, getAwakeMsForRange as calculateAwakeMsForRange, getLiveElapsedMs, getOverlapDuration as calculateOverlapDuration, getRoutineStartForRange as calculateRoutineStartForRange, getSleepMsForRange as calculateSleepMsForRange, startLiveAwakeFromManualNightWake as startLiveAwakeFromManualNightWakeInState, startLiveSleepFromManualEvent as startLiveSleepFromManualEventInState, startRoutineTimer, startSleepTimer, shouldStartLiveAwakeFromManualNightWake as shouldStartLiveAwakeDecision, shouldStartLiveSleepFromManualEvent as shouldStartLiveSleepDecision } from "./domain/sleep.js";
import { getActiveTimerDetails as buildActiveTimerDetails, getWakeWindowText as buildWakeWindowText } from "./services/timer-service.js";
import { setHidden } from "./dom/dom.js";
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
import { createEmptyTimelineItem, getDiaryEmptyRecordMarkup, getLatestEmptyRecordMarkup } from "./ui/empty-states.js";
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
const orbitDurationArcs = document.querySelector("#orbitDurationArcs");
const orbitTimelineSvg = document.querySelector("#orbitTimelineSvg");
const sheet = document.querySelector("#recordSheet");
const sheetBackdrop = document.querySelector("#sheetBackdrop");
const orbitClusterSheet = document.querySelector("#orbitClusterSheet");
const orbitClusterTitle = document.querySelector("#orbitClusterTitle");
const orbitClusterList = document.querySelector("#orbitClusterList");
const closeOrbitClusterButton = document.querySelector("#closeOrbitCluster");
const orbitClusterViewAllButton = document.querySelector("#orbitClusterViewAll");
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
const profileHeroCard = document.querySelector('.screen[data-screen="profile"] > .profile-card');
const profileSettingsList = document.querySelector('.screen[data-screen="profile"] .settings-list');
const profilePrivacyCard = document.querySelector('.screen[data-screen="profile"] .privacy-note-card');
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
const familyInviteForm = document.querySelector("#familyInviteForm");
const familyInviteEmailInput = document.querySelector("#familyInviteEmailInput");
const familyInviteRoleSelect = document.querySelector("#familyInviteRoleSelect");
const familyInviteFormHint = document.querySelector("#familyInviteFormHint");
const familyPendingInviteList = document.querySelector("#familyPendingInviteList");
const familyCreateInviteButton = document.querySelector("#familyCreateInviteButton");
const familyJoinInviteButton = document.querySelector("#familyJoinInviteButton");
const familyActiveInviteBox = document.querySelector("#familyActiveInviteBox");
const familyActiveInviteCode = document.querySelector("#familyActiveInviteCode");
const familyActiveInviteHint = document.querySelector("#familyActiveInviteHint");
const familyInviteShareActions = document.querySelector("#familyInviteShareActions");
const familyCopyInviteButton = document.querySelector("#familyCopyInviteButton");
const familyShareInviteWhatsAppButton = document.querySelector("#familyShareInviteWhatsAppButton");
const profileStateNoticeCard = document.querySelector("#profileStateNoticeCard");
const profileStateKicker = document.querySelector("#profileStateKicker");
const profileStateTitle = document.querySelector("#profileStateTitle");
const profileStateText = document.querySelector("#profileStateText");
const familyAccessSummaryCard = document.querySelector("#familyAccessSummaryCard");
const familyAccessSummaryTitle = document.querySelector("#familyAccessSummaryTitle");
const familyAccessSummaryUser = document.querySelector("#familyAccessSummaryUser");
const familyAccessSummaryFamily = document.querySelector("#familyAccessSummaryFamily");
const familyAccessSummaryDevice = document.querySelector("#familyAccessSummaryDevice");
const familyAccessSummaryRole = document.querySelector("#familyAccessSummaryRole");
const familyAccessSummaryRoleBadge = document.querySelector("#familyAccessSummaryRoleBadge");
const familyAccessSummaryMembers = document.querySelector("#familyAccessSummaryMembers");
const clientFamilyMembersList = document.querySelector("#clientFamilyMembersList");
const familyAccessSummaryInviteButton = document.querySelector("#familyAccessSummaryInviteButton");
const familyAccessSummaryProfileButton = document.querySelector("#familyAccessSummaryProfileButton");
const familyAccessSummaryInviteStatus = document.querySelector("#familyAccessSummaryInviteStatus");
const familyLeaveButton = document.querySelector("#familyLeaveButton");
const joinFamilyModal = document.querySelector("#joinFamilyModal");
const joinInviteCodeInput = document.querySelector("#joinInviteCodeInput");
const joinInviteFeedback = document.querySelector("#joinInviteFeedback");
const confirmJoinInviteButton = document.querySelector("#confirmJoinInviteButton");
const supportSuggestionButton = document.querySelector("#supportSuggestionButton");
const supportBugButton = document.querySelector("#supportBugButton");
const caregiverIdentityStatus = document.querySelector("#caregiverIdentityStatus");
const caregiverPresetButtons = document.querySelectorAll("[data-caregiver-preset]");
const todayCaregiverCard = document.querySelector("#todayCaregiverCard");
const todayCaregiverAvatar = document.querySelector("#todayCaregiverAvatar");
const todayCaregiverName = document.querySelector("#todayCaregiverName");
const todayCaregiverHint = document.querySelector("#todayCaregiverHint");
const todayCaregiverEditButton = document.querySelector("#todayCaregiverEditButton");
const familyAccessCard = document.querySelector("#familyAccessCard");
const familyAccessKicker = document.querySelector("#familyAccessCard > span");
const familyAccessTitle = document.querySelector("#familyAccessTitle");
const familyAccessText = document.querySelector("#familyAccessText");
const familyAccessBadge = document.querySelector("#familyAccessBadge");
const createFamilyButton = document.querySelector("#createFamilyButton");
const createFamilyWizard = document.querySelector("#createFamilyWizard");
const newFamilyBabyNameInput = document.querySelector("#newFamilyBabyNameInput");
const newFamilyBabyBirthInput = document.querySelector("#newFamilyBabyBirthInput");
const newFamilyNameInput = document.querySelector("#newFamilyNameInput");
const newFamilyBabyArticleInput = document.querySelector("#newFamilyBabyArticleInput");
const newFamilyResponsibleNameInput = document.querySelector("#newFamilyResponsibleNameInput");
const newFamilyResponsibleRelationInput = document.querySelector("#newFamilyResponsibleRelationInput");
const confirmCreateFamilyButton = document.querySelector("#confirmCreateFamilyButton");
const cancelCreateFamilyButton = document.querySelector("#cancelCreateFamilyButton");
const createFamilyWizardStatus = document.querySelector("#createFamilyWizardStatus");
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
const guestModalCreateFamilyButton = document.querySelector("#guestModalCreateFamilyButton");
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
const adminFamilyAuditList = document.querySelector("#adminFamilyAuditList");
const adminKnownUsersList = document.querySelector("#adminKnownUsersList");
const adminUsersCount = document.querySelector("#adminUsersCount");
const adminFamiliesCount = document.querySelector("#adminFamiliesCount");
const adminKnownUsersStat = document.querySelector("#adminKnownUsersStat");
const adminPendingInvitesCount = document.querySelector("#adminPendingInvitesCount");
const adminAcceptedInvitesCount = document.querySelector("#adminAcceptedInvitesCount");
const adminLastMigrationStatus = document.querySelector("#adminLastMigrationStatus");
const adminStatsHint = document.querySelector("#adminStatsHint");
const refreshAdminStatsButton = document.querySelector("#refreshAdminStatsButton");
const adminModeToggleButton = document.querySelector("#adminModeToggleButton");
const adminModeHint = document.querySelector("#adminModeHint");
const adminClientsList = document.querySelector("#adminClientsList");
const adminSelectedFamilyHint = document.querySelector("#adminSelectedFamilyHint");
const adminCommercialDashboard = document.querySelector("#adminCommercialDashboard");
const adminCommercialActiveFamilies = document.querySelector("#adminCommercialActiveFamilies");
const adminCommercialTotalMembers = document.querySelector("#adminCommercialTotalMembers");
const adminCommercialGlobalPendingInvites = document.querySelector("#adminCommercialGlobalPendingInvites");
const adminCommercialLastActivity = document.querySelector("#adminCommercialLastActivity");
const adminCommercialInsight = document.querySelector("#adminCommercialInsight");
const adminFamilyMonitorList = document.querySelector("#adminFamilyMonitorList");
const adminOpenFamilyButton = document.querySelector("#adminOpenFamilyButton");
const adminCreateClientFamilyButton = document.querySelector("#adminCreateClientFamilyButton");
const adminNewFamilyNameInput = document.querySelector("#adminNewFamilyNameInput");
const adminNewBabyNameInput = document.querySelector("#adminNewBabyNameInput");
const adminNewBabyArticleInput = document.querySelector("#adminNewBabyArticleInput");
const adminNewResponsibleEmailInput = document.querySelector("#adminNewResponsibleEmailInput");
const adminCreateFamilyResult = document.querySelector("#adminCreateFamilyResult");
const prepareFranciscoFamilyButton = document.querySelector("#prepareFranciscoFamilyButton");
const franciscoMigrationResult = document.querySelector("#franciscoMigrationResult");
const adminPreviewBanner = document.querySelector("#adminPreviewBanner");
const adminReturnToPanelButton = document.querySelector("#adminReturnToPanelButton");
const todayOverviewKicker = document.querySelector("#todayOverviewKicker");
const todayOverviewTitle = document.querySelector("#todayOverviewTitle");
const todayOverviewGrid = document.querySelector("#todayOverviewGrid");
const todayOverviewSuggestion = document.querySelector("#todayOverviewSuggestion");
const routineCorrectionCard = document.querySelector("#routineCorrectionCard");
const routineCorrectionKicker = document.querySelector("#routineCorrectionKicker");
const routineCorrectionTitle = document.querySelector("#routineCorrectionTitle");
const routineCorrectionText = document.querySelector("#routineCorrectionText");
const routineCorrectionButtons = document.querySelectorAll("[data-last-record-action]");
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
const dayNotesStatus = document.querySelector("#dayNotesStatus");
const dayNotesEpisodes = document.querySelector("#dayNotesEpisodes");
const dayNotesAutosaveBadge = document.querySelector("#dayNotesAutosaveBadge");
const quickObservationButtons = document.querySelectorAll("[data-quick-observation]");
const openDayNoteModalButton = document.querySelector("#openDayNoteModalButton");
const dayNoteEpisodeModal = document.querySelector("#dayNoteEpisodeModal");
const closeDayNoteModalButton = document.querySelector("#closeDayNoteModalButton");
const cancelDayNoteModalButton = document.querySelector("#cancelDayNoteModalButton");
const saveDayNoteEntryButton = document.querySelector("#saveDayNoteEntryButton");
const deleteDayNoteEntryButton = document.querySelector("#deleteDayNoteEntryButton");
const dayNoteModalTimeInput = document.querySelector("#dayNoteModalTimeInput");
const dayNoteModalActorInput = document.querySelector("#dayNoteModalActorInput");
const dayNoteModalTextInput = document.querySelector("#dayNoteModalTextInput");
const dayNoteModalCounter = document.querySelector("#dayNoteModalCounter");
const dayNoteModalIconPreview = document.querySelector("#dayNoteModalIconPreview");
const dayNoteEpisodeModalEyebrow = document.querySelector("#dayNoteEpisodeModalEyebrow");
const dayNoteEpisodeModalTitle = document.querySelector("#dayNoteEpisodeModalTitle");
const dayNoteIconButtons = document.querySelectorAll("[data-day-note-icon]");
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
const diagnosticsIntegrityLabel = document.querySelector("#diagnosticsIntegrityLabel");
const diagnosticsInviteLabel = document.querySelector("#diagnosticsInviteLabel");
const diagnosticsAppCheckLabel = document.querySelector("#diagnosticsAppCheckLabel");
const familyHealthScore = document.querySelector("#familyHealthScore");
const familyHealthChecklist = document.querySelector("#familyHealthChecklist");
const familyHealthRefreshButton = document.querySelector("#familyHealthRefreshButton");
const familyHealthRepairButton = document.querySelector("#familyHealthRepairButton");
const familyBackupJsonButton = document.querySelector("#familyBackupJsonButton");
const familyHealthStatus = document.querySelector("#familyHealthStatus");
const familyRealTestScore = document.querySelector("#familyRealTestScore");
const familyRealTestChecklist = document.querySelector("#familyRealTestChecklist");
const familyRealTestRefreshButton = document.querySelector("#familyRealTestRefreshButton");
const familyRealTestExportButton = document.querySelector("#familyRealTestExportButton");
const familyRealTestStatus = document.querySelector("#familyRealTestStatus");
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

const NINOU_RUNTIME_VERSION = "76.1.0";
const DAY_NOTE_ENTRY_PATTERN = /^(\d{1,2}:\d{2})\s+[—-]\s+(.+?)(?:\s+\(([^()]+)\))?$/;
let dayNotesAutosaveTimer = null;
let currentDayNotesModel = { dayId: "", entries: [], freeform: "", updatedAt: 0 };
let editingDayNoteEntryId = "";
let selectedDayNoteIcon = "✦";
const INVITE_TTL_MS = 7 * day;
const INVITE_MAX_USES = 1;
const MAX_DAY_NOTES_LENGTH = 1200;
const GLOBAL_APP_ADMIN_EMAIL = "luizfelipe.dasilva@gmail.com";
const NINOU_INTERNAL_ADMIN_FAMILY_ID = "ninou-family-luizfelipe";
const NINOU_FRANCISCO_FATHER_EMAIL = "luizfelipe.4092@hotmail.com";
const NINOU_FRANCISCO_MOTHER_EMAIL = "marry@gmail.com";
const NINOU_FRANCISCO_PARENT_EMAILS = [NINOU_FRANCISCO_FATHER_EMAIL, NINOU_FRANCISCO_MOTHER_EMAIL];
// Compatibilidade: alguns fluxos antigos esperam uma conta principal; pai fica como contato primário.
const NINOU_FRANCISCO_ACCOUNT_EMAIL = NINOU_FRANCISCO_FATHER_EMAIL;
const NINOU_FRANCISCO_FAMILY_ID = "family-francisco-principal";
const NINOU_FRANCISCO_FAMILY_NAME = "Família do Francisco";
const NINOU_FRANCISCO_BABY_NAME = "Francisco";
const NINOU_FRANCISCO_BABY_ARTICLE = "do";
// v75.75.67: alias mantido para não quebrar chamadas antigas.
// As próximas versões passam a tratar a família técnica/admin e famílias clientes
// pelo mesmo resolvedor de escopo familiar.
const APP_ADMIN_FAMILY_ID = NINOU_INTERNAL_ADMIN_FAMILY_ID;
const NINOU_FAMILY_SCOPE_VERSION = "75.75.67-premium-hierarchy-actions-avatar";
const NINOU_CLIENT_FAMILY_PREFIX = "family-";
const ADMIN_WHATSAPP_NUMBER = "5521981904591";
const ADMIN_WHATSAPP_MESSAGE = "Olá! Tenho interesse em acessar o Ninou. Pode me enviar um convite?";
const ADMIN_WHATSAPP_URL = `https://wa.me/${ADMIN_WHATSAPP_NUMBER}?text=${encodeURIComponent(ADMIN_WHATSAPP_MESSAGE)}`;

function isGlobalAdminEmail(email = "") {
  return normalizeEmail(email) === GLOBAL_APP_ADMIN_EMAIL;
}

function isGlobalAppAdmin(user = cloudUser) {
  return Boolean(user && isGlobalAdminEmail(user.email));
}

function isFranciscoFamilyAccountEmail(email = "") {
  const normalized = normalizeEmail(email);
  return NINOU_FRANCISCO_PARENT_EMAILS.some((item) => normalizeEmail(item) === normalized);
}

function isFranciscoSharedAccount(user = cloudUser) {
  // v75.75.67: Felipe e Maria usam e-mails próprios, mas pertencem à mesma família canônica.
  return isFranciscoFamilyAccountEmail(user?.email || "");
}

function isFranciscoFamilyId(familyId = "") {
  return normalizeFamilyId(familyId) === NINOU_FRANCISCO_FAMILY_ID;
}

function getAutomaticCaregiverIdentityForEmail(email = getCurrentIdentityEmail?.() || "") {
  const normalized = normalizeEmail(email);
  if (normalized === NINOU_FRANCISCO_FATHER_EMAIL) {
    return {
      name: "Felipe",
      relation: "pai",
      relationshipLabel: "Pai",
      label: "Felipe · Pai",
      lockedByEmail: true,
      automatic: true,
      source: "francisco-parent-email",
    };
  }
  if (normalized === NINOU_FRANCISCO_MOTHER_EMAIL) {
    return {
      name: "Maria",
      relation: "mae",
      relationshipLabel: "Mãe",
      label: "Maria · Mãe",
      lockedByEmail: true,
      automatic: true,
      source: "francisco-parent-email",
    };
  }
  return null;
}

function isCaregiverIdentityAutomatic() {
  return Boolean(getAutomaticCaregiverIdentityForEmail(getCurrentIdentityEmail?.() || cloudUser?.email || familyAccess?.email || ""));
}

function getDefaultFamilyLabelsForAccount(user = cloudUser) {
  if (isFranciscoSharedAccount(user)) {
    return {
      familyId: NINOU_FRANCISCO_FAMILY_ID,
      familyName: NINOU_FRANCISCO_FAMILY_NAME,
      babyName: NINOU_FRANCISCO_BABY_NAME,
      babyArticle: NINOU_FRANCISCO_BABY_ARTICLE,
      accountEmail: normalizeEmail(user?.email || "") || NINOU_FRANCISCO_ACCOUNT_EMAIL,
      fatherEmail: NINOU_FRANCISCO_FATHER_EMAIL,
      motherEmail: NINOU_FRANCISCO_MOTHER_EMAIL,
      parentEmails: [...NINOU_FRANCISCO_PARENT_EMAILS],
    };
  }
  return { familyId: "", familyName: "", babyName: "", babyArticle: "do", accountEmail: normalizeEmail(user?.email || "") };
}

function getCanonicalFamilyIdForAccount(user = cloudUser, familyName = "", babyName = "") {
  if (isFranciscoSharedAccount(user)) return NINOU_FRANCISCO_FAMILY_ID;
  return createStablePersonalFamilyId(user, familyName, babyName);
}

function getCanonicalFamilyIdForAdminCreation({ responsibleEmail = "", familyName = "", babyName = "" } = {}) {
  if (isFranciscoFamilyAccountEmail(responsibleEmail)) return NINOU_FRANCISCO_FAMILY_ID;
  return createFamilyIdFromNames(familyName, babyName);
}

function buildFranciscoFamilyBasePayload(services = firebaseServices, options = {}) {
  const nowClient = new Date().toISOString();
  const timestamp = services?.serverTimestamp ? services.serverTimestamp() : nowClient;
  return {
    familyId: NINOU_FRANCISCO_FAMILY_ID,
    title: NINOU_FRANCISCO_FAMILY_NAME,
    name: NINOU_FRANCISCO_FAMILY_NAME,
    babyName: NINOU_FRANCISCO_BABY_NAME,
    babyArticle: NINOU_FRANCISCO_BABY_ARTICLE,
    accountEmail: NINOU_FRANCISCO_ACCOUNT_EMAIL,
    fatherEmail: NINOU_FRANCISCO_FATHER_EMAIL,
    motherEmail: NINOU_FRANCISCO_MOTHER_EMAIL,
    parentEmails: [...NINOU_FRANCISCO_PARENT_EMAILS],
    customerLabel: "Família atual do Francisco",
    familyType: "client",
    status: "active",
    legacyMigrationTarget: true,
    franciscoMigrationReady: true,
    migrationVersion: NINOU_RUNTIME_VERSION,
    appVersion: NINOU_RUNTIME_VERSION,
    updatedAt: timestamp,
    ...options,
  };
}


function normalizeFamilyId(value = "") {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (raw === NINOU_INTERNAL_ADMIN_FAMILY_ID) return NINOU_INTERNAL_ADMIN_FAMILY_ID;
  return raw
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9._@-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 96);
}

function getFamilyScopeType(familyId = "") {
  const id = normalizeFamilyId(familyId);
  if (!id) return "none";
  if (id === NINOU_INTERNAL_ADMIN_FAMILY_ID) return "internal_admin";
  if (id.startsWith(NINOU_CLIENT_FAMILY_PREFIX)) return "client_family";
  return "legacy_family";
}

function getLegacyAccountFamilyFallbackId(user = cloudUser) {
  // v75.75.67: os e-mails do pai e da mãe do Francisco agora têm destino canônico.
  // Isso evita que a família atual caia em um familyId temporário por UID.
  if (isFranciscoSharedAccount(user)) return NINOU_FRANCISCO_FAMILY_ID;
  // Compatibilidade: versões antigas usavam o UID como familyId provisório.
  // A partir da jornada comercial, o caminho correto é criar/aceitar família.
  return user?.uid ? String(user.uid) : "";
}

function buildFamilyScopePayload(access = {}, options = {}) {
  const normalizedFamilyId = normalizeFamilyId(access.familyId || options.familyId || "");
  if (!normalizedFamilyId) return null;
  const email = normalizeEmail(access.email || options.email || cloudUser?.email || "");
  const role = getEffectiveRole(access.role || options.role, email);
  return {
    familyId: normalizedFamilyId,
    role,
    email,
    ownerUid: access.ownerUid ? String(access.ownerUid) : (options.ownerUid ? String(options.ownerUid) : ""),
    inviteCode: access.inviteCode ? normalizeInviteCode(access.inviteCode) : "",
    acceptedAt: access.acceptedAt || access.createdAt || options.acceptedAt || new Date().toISOString(),
    scopeVersion: NINOU_FAMILY_SCOPE_VERSION,
    scopeType: getFamilyScopeType(normalizedFamilyId),
  };
}

function getResolvedFamilyScope(options = {}) {
  const allowAdminSelection = options.allowAdminSelection !== false;
  const allowLegacyFallback = options.allowLegacyFallback !== false;
  const access = familyAccess?.familyId ? familyAccess : null;

  if (allowAdminSelection && isGlobalAppAdmin()) {
    const selectedFamilyId = normalizeFamilyId(getActiveAdminFamilyId());
    if (selectedFamilyId) {
      return {
        familyId: selectedFamilyId,
        source: "admin_selection",
        scopeType: getFamilyScopeType(selectedFamilyId),
        role: "admin",
        email: normalizeEmail(cloudUser?.email || GLOBAL_APP_ADMIN_EMAIL),
        isInternalAdminFamily: selectedFamilyId === NINOU_INTERNAL_ADMIN_FAMILY_ID,
        isLegacyFallback: false,
      };
    }
  }

  if (access?.familyId) {
    const payload = buildFamilyScopePayload(access);
    if (payload) {
      return {
        ...payload,
        source: "family_access",
        isInternalAdminFamily: payload.familyId === NINOU_INTERNAL_ADMIN_FAMILY_ID,
        isLegacyFallback: false,
      };
    }
  }

  const legacyId = allowLegacyFallback ? normalizeFamilyId(getLegacyAccountFamilyFallbackId()) : "";
  return {
    familyId: legacyId,
    source: legacyId ? "legacy_account_fallback" : "none",
    scopeType: getFamilyScopeType(legacyId),
    role: legacyId ? "responsavel" : "",
    email: normalizeEmail(cloudUser?.email || ""),
    isInternalAdminFamily: legacyId === NINOU_INTERNAL_ADMIN_FAMILY_ID,
    isLegacyFallback: Boolean(legacyId),
  };
}

function getActiveClientFamilyId() {
  const scope = getResolvedFamilyScope({ allowAdminSelection: false, allowLegacyFallback: false });
  return scope.familyId || "";
}

function getFamilyCollectionPath(familyId = getActiveFamilyId()) {
  const id = normalizeFamilyId(familyId);
  return id ? `families/${id}` : "";
}

function loadSelectedAdminFamilyId() {
  try {
    return normalizeFamilyId(localStorage.getItem("ninou.admin.selectedFamilyId") || APP_ADMIN_FAMILY_ID);
  } catch {
    return APP_ADMIN_FAMILY_ID;
  }
}

function getActiveAdminFamilyId() {
  return normalizeFamilyId(selectedAdminFamilyId || APP_ADMIN_FAMILY_ID);
}

function saveSelectedAdminFamilyId(familyId = APP_ADMIN_FAMILY_ID) {
  selectedAdminFamilyId = normalizeFamilyId(familyId || APP_ADMIN_FAMILY_ID);
  try { localStorage.setItem("ninou.admin.selectedFamilyId", selectedAdminFamilyId); } catch {}
  try { exposeFamilyScopeForDebug(); } catch {}
  return selectedAdminFamilyId;
}

function getSelectedFamilyIdForAdminOrAccess() {
  return getResolvedFamilyScope({ allowLegacyFallback: false }).familyId || "";
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

const FAMILY_ROLE_OWNER = "owner";
const FAMILY_ROLE_ADMIN = "admin_familiar";
const FAMILY_ROLE_CAREGIVER = "cuidador";
const FAMILY_ROLE_VIEWER = "visualizacao";
const FAMILY_ROLE_LEGACY_RESPONSIBLE = "responsavel";
const FAMILY_ROLE_GLOBAL_ADMIN = "admin";

function normalizeRole(value = FAMILY_ROLE_ADMIN) {
  const raw = String(value || "").trim().toLowerCase().replace(/-/g, "_");
  const aliases = {
    proprietario: FAMILY_ROLE_OWNER,
    proprietário: FAMILY_ROLE_OWNER,
    owner: FAMILY_ROLE_OWNER,
    responsavel_principal: FAMILY_ROLE_OWNER,
    responsável_principal: FAMILY_ROLE_OWNER,
    titular: FAMILY_ROLE_OWNER,
    admin: FAMILY_ROLE_GLOBAL_ADMIN,
    global_admin: FAMILY_ROLE_GLOBAL_ADMIN,
    admin_global: FAMILY_ROLE_GLOBAL_ADMIN,
    admin_familiar: FAMILY_ROLE_ADMIN,
    administrador_familiar: FAMILY_ROLE_ADMIN,
    responsavel: FAMILY_ROLE_ADMIN,
    responsável: FAMILY_ROLE_ADMIN,
    familiar_admin: FAMILY_ROLE_ADMIN,
    cuidador: FAMILY_ROLE_CAREGIVER,
    caregiver: FAMILY_ROLE_CAREGIVER,
    leitura: FAMILY_ROLE_VIEWER,
    viewer: FAMILY_ROLE_VIEWER,
    visualizacao: FAMILY_ROLE_VIEWER,
    visualização: FAMILY_ROLE_VIEWER,
    somente_leitura: FAMILY_ROLE_VIEWER,
  };
  return aliases[raw] || FAMILY_ROLE_ADMIN;
}

function getEffectiveRole(role = familyAccess?.role || FAMILY_ROLE_ADMIN, email = cloudUser?.email || familyAccess?.email || "") {
  const normalized = normalizeRole(role);
  if (normalized === FAMILY_ROLE_GLOBAL_ADMIN && !isGlobalAdminEmail(email)) return FAMILY_ROLE_ADMIN;
  return normalized;
}

function isFamilyOwnerRole(role = familyAccess?.role) {
  return getEffectiveRole(role, cloudUser?.email || familyAccess?.email || "") === FAMILY_ROLE_OWNER;
}

function isFamilyManagerRole(role = familyAccess?.role, email = cloudUser?.email || familyAccess?.email || "") {
  const effectiveRole = getEffectiveRole(role || FAMILY_ROLE_VIEWER, email);
  return [FAMILY_ROLE_GLOBAL_ADMIN, FAMILY_ROLE_OWNER, FAMILY_ROLE_ADMIN].includes(effectiveRole);
}

function normalizeInviteRole(value = FAMILY_ROLE_CAREGIVER) {
  const role = normalizeRole(value);
  if (role === FAMILY_ROLE_GLOBAL_ADMIN || role === FAMILY_ROLE_OWNER) return FAMILY_ROLE_ADMIN;
  return role;
}

function normalizeAssignableMemberRole(value = FAMILY_ROLE_CAREGIVER) {
  const role = normalizeInviteRole(value);
  return role === FAMILY_ROLE_OWNER ? FAMILY_ROLE_ADMIN : role;
}

function getAssignableFamilyRoles() {
  return [FAMILY_ROLE_ADMIN, FAMILY_ROLE_CAREGIVER, FAMILY_ROLE_VIEWER];
}

function getRoleRank(role = FAMILY_ROLE_VIEWER) {
  const ranks = {
    [FAMILY_ROLE_GLOBAL_ADMIN]: 100,
    [FAMILY_ROLE_OWNER]: 90,
    [FAMILY_ROLE_ADMIN]: 70,
    [FAMILY_ROLE_CAREGIVER]: 40,
    [FAMILY_ROLE_VIEWER]: 10,
  };
  return ranks[normalizeRole(role)] || 0;
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
    role: normalizeInviteRole(invite.role || FAMILY_ROLE_CAREGIVER),
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
let personalFamilyActivationInFlight = false;
let authFlowRunId = 0;
let familyBootstrapReady = false;
let familyAccess = loadFamilyAccess();
try { exposeFamilyScopeForDebug(); } catch {}
let pendingInviteCode = getInitialInviteCode();
let accessFlowNotice = "";
let recentInvites = [];
let adminStatsRequestId = 0;
let latestAdminStats = null;
let clientFamilyMembersCache = [];
let clientFamilyMembersFamilyId = "";
let clientFamilyMembersFetchedAt = 0;
let clientFamilyMembersLoading = false;
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
let pendingCloudRetryTimer = null;
let pendingCloudFlushInFlight = false;
let applyingCloudState = false;
const pendingCloudSyncStorageKey = "ninou.sync.pendingCloudReason";
const pendingProfileSyncStorageKey = "ninou.sync.pendingProfile";
const pendingDaySyncStorageKey = "ninou.sync.pendingDays";
let pendingProfilePhotoSave = false;
let orbitRenderSignature = "";
let timelineRenderSignature = "";
let lastRoutineUndoSnapshot = null;
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

const BABY_AVATAR_ASSET_VERSION = "75.75.113";

function avatarAsset(path) {
  return `${path}?v=${BABY_AVATAR_ASSET_VERSION}`;
}

const babyAvatarHairOptions = Object.freeze([
  { id: "avatar-01", label: "Bebê clássico", src: avatarAsset("./icons/baby-avatars/avatar-01.webp") },
  { id: "avatar-02", label: "Castanho", src: avatarAsset("./icons/baby-avatars/avatar-02.webp") },
  { id: "avatar-03", label: "Laço", src: avatarAsset("./icons/baby-avatars/avatar-03.webp") },
  { id: "avatar-04", label: "Cacheado", src: avatarAsset("./icons/baby-avatars/avatar-04.webp") },
  { id: "avatar-05", label: "Ondulado", src: avatarAsset("./icons/baby-avatars/avatar-05.webp") },
  { id: "avatar-06", label: "Loirinha", src: avatarAsset("./icons/baby-avatars/avatar-06.webp") },
  { id: "avatar-07", label: "Cacheadinho", src: avatarAsset("./icons/baby-avatars/avatar-07.webp") },
  { id: "avatar-08", label: "Ruivinho", src: avatarAsset("./icons/baby-avatars/avatar-08.webp") },
  { id: "avatar-09", label: "Touca", src: avatarAsset("./icons/baby-avatars/avatar-09.webp") },
  { id: "avatar-10", label: "Tiara", src: avatarAsset("./icons/baby-avatars/avatar-10.webp") },
  { id: "avatar-11", label: "Raspadinho", src: avatarAsset("./icons/baby-avatars/avatar-11.webp") },
  { id: "avatar-12", label: "Cabelo preto", src: avatarAsset("./icons/baby-avatars/avatar-12.webp") },
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

  // v75.75.86: antes de ocultar o modal, tira o foco de qualquer botão dentro dele.
  // Isso evita o warning: "Blocked aria-hidden because its descendant retained focus".
  if (babyAvatarCard) {
    const activeElement = document.activeElement;
    const focusInsideModal = activeElement && babyAvatarCard.contains(activeElement);

    if (editorOpen) {
      babyAvatarCard.hidden = false;
      babyAvatarCard.inert = false;
      babyAvatarCard.setAttribute("aria-hidden", "false");
    } else {
      if (focusInsideModal) {
        try {
          activeElement.blur?.();
        } catch (_) {
          // noop
        }

        if (editBabyAvatarButton && !editBabyAvatarButton.hidden && !editBabyAvatarButton.disabled) {
          window.requestAnimationFrame(() => {
            try {
              editBabyAvatarButton.focus({ preventScroll: true });
            } catch (_) {
              editBabyAvatarButton.focus?.();
            }
          });
        }
      }

      babyAvatarCard.inert = true;
      babyAvatarCard.setAttribute("aria-hidden", "true");
      babyAvatarCard.hidden = true;
    }
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

function setProfileElementHidden(element, hidden) {
  if (!element) return;
  element.hidden = Boolean(hidden);
  element.setAttribute("aria-hidden", hidden ? "true" : "false");
}


function setText(element, value = "") {
  if (element) element.textContent = String(value ?? "");
}

function setOptionalTitle(element, value = "") {
  if (element) element.title = String(value || "");
}

function getProfileAccessState() {
  const connected = isLoggedIn();
  const authorized = hasFamilyAccess();
  const appAdmin = isGlobalAppAdmin();
  const pendingCode = normalizeInviteCode(pendingInviteCode || inviteCodeInput?.value || "");

  if (!connected) return "guest";
  if (appAdmin && !window.__ninouAdminFamilyDataOpen) return "admin-panel";
  if (authorized) return "family-ready";
  if (pendingCode) return "invite-pending";
  return "account-no-family";
}

function canManageFamilyAccess() {
  if (!hasFamilyAccess()) return false;
  return isFamilyManagerRole(familyAccess?.role || FAMILY_ROLE_VIEWER, cloudUser?.email || familyAccess?.email || "");
}

function canEditFamilyProfile() {
  if (!hasFamilyAccess()) return false;
  return isFamilyManagerRole(familyAccess?.role || FAMILY_ROLE_VIEWER, cloudUser?.email || familyAccess?.email || "");
}

function updateProfileStateClasses() {
  const stateName = getProfileAccessState();
  document.body.dataset.profileAccessState = stateName;
  ["guest", "account-no-family", "invite-pending", "family-ready", "admin-panel"].forEach((name) => {
    document.body.classList.toggle(`profile-state-${name}`, stateName === name);
  });
  return stateName;
}

function renderProfileStateNotice() {
  const stateName = updateProfileStateClasses();
  const show = Boolean(profileStateNoticeCard && ["account-no-family", "invite-pending"].includes(stateName));
  setProfileElementHidden(profileStateNoticeCard, !show);
  if (!show) return;

  if (stateName === "invite-pending") {
    setText(profileStateKicker, "Convite familiar");
    setText(profileStateTitle, "Convite detectado. Falta confirmar o acesso.");
    setText(profileStateText, "Entre com o mesmo e-mail convidado e aceite o código. O Ninou vai conectar esta conta à família existente, sem criar outra família.");
    return;
  }

  setText(profileStateKicker, "Conta conectada");
  setText(profileStateTitle, "Esta conta ainda não tem família.");
  setText(profileStateText, "Crie uma família nova somente se você for o primeiro responsável. Se recebeu um convite, use o código para entrar na família já existente.");
}


function getClientMemberDisplayName(member = {}) {
  const email = normalizeEmail(member?.email || "");
  const automatic = getAutomaticCaregiverIdentityForEmail(email);
  if (automatic?.name) return automatic.name;
  const explicit = String(member?.name || member?.displayName || member?.caregiverName || "").trim();
  if (explicit) return explicit;
  if (email === normalizeEmail(cloudUser?.email || "")) {
    const identity = loadCurrentCaregiverIdentity();
    if (identity?.name) return identity.name;
  }
  return "Familiar";
}

function getClientMemberRelationLabel(member = {}) {
  const email = normalizeEmail(member?.email || "");
  const automatic = getAutomaticCaregiverIdentityForEmail(email);
  if (automatic?.relationshipLabel) return automatic.relationshipLabel;
  const relation = String(member?.relationship || member?.relation || member?.caregiverRelation || "").trim();
  if (relation) return getCaregiverRelationLabel(relation);
  const role = normalizeRole(member?.role || FAMILY_ROLE_CAREGIVER);
  if (role === FAMILY_ROLE_OWNER || role === FAMILY_ROLE_ADMIN) return "Responsável";
  if (role === FAMILY_ROLE_VIEWER) return "Visualização";
  return "Cuidador(a)";
}

function getFallbackClientFamilyMembers() {
  const familyId = normalizeFamilyId(familyAccess?.familyId || "");
  if (isFranciscoFamilyId(familyId)) {
    return [
      { uid: "felipe", email: NINOU_FRANCISCO_FATHER_EMAIL, name: "Felipe", relationship: "pai", role: FAMILY_ROLE_ADMIN },
      { uid: "maria", email: NINOU_FRANCISCO_MOTHER_EMAIL, name: "Maria", relationship: "mae", role: FAMILY_ROLE_ADMIN },
    ];
  }
  const currentEmail = normalizeEmail(cloudUser?.email || familyAccess?.email || "");
  const identity = loadCurrentCaregiverIdentity();
  return currentEmail || identity?.name
    ? [{ uid: cloudUser?.uid || "current", email: currentEmail, name: identity?.name || "Familiar", relationship: identity?.relationship || identity?.relation || "", role: familyAccess?.role || FAMILY_ROLE_CAREGIVER }]
    : [];
}

function mergeClientFamilyMembers(members = []) {
  const merged = new Map();
  [...getFallbackClientFamilyMembers(), ...(Array.isArray(members) ? members : [])].forEach((member) => {
    const email = normalizeEmail(member?.email || "");
    if (email && isGlobalAdminEmail(email)) return;
    const key = email || String(member?.uid || member?.id || getClientMemberDisplayName(member)).toLowerCase();
    if (!key) return;
    merged.set(key, { ...(merged.get(key) || {}), ...member, email });
  });
  return [...merged.values()];
}

function renderClientFamilyMembers(members = clientFamilyMembersCache) {
  if (!clientFamilyMembersList) return;
  const currentEmail = normalizeEmail(cloudUser?.email || familyAccess?.email || "");
  const safeMembers = mergeClientFamilyMembers(members);
  if (!safeMembers.length) {
    clientFamilyMembersList.innerHTML = '<article class="client-family-member"><span class="client-family-member-avatar" aria-hidden="true">♡</span><div><strong>Família conectada</strong><small>Os familiares autorizados aparecerão aqui.</small></div><em>Ativa</em></article>';
    return;
  }

  clientFamilyMembersList.innerHTML = safeMembers.map((member) => {
    const email = normalizeEmail(member?.email || "");
    const name = getClientMemberDisplayName(member);
    const relation = getClientMemberRelationLabel(member);
    const isCurrent = Boolean(email && currentEmail && email === currentEmail);
    const avatar = getCaregiverAvatarDataUrl(name, email || member?.uid || name, "member");
    return `<article class="client-family-member${isCurrent ? " is-current" : ""}">
      <img class="client-family-member-avatar" src="${avatar}" alt="" />
      <div><strong>${escapeHtml(name)}</strong><small>${escapeHtml(relation)}${isCurrent ? " · neste aparelho" : ""}</small></div>
      <em>${isCurrent ? "Você" : "Conectado"}</em>
    </article>`;
  }).join("");
}

async function refreshClientFamilyMembers(options = {}) {
  const familyId = normalizeFamilyId(familyAccess?.familyId || "");
  if (!familyId || !hasFamilyAccess()) {
    clientFamilyMembersCache = [];
    clientFamilyMembersFamilyId = "";
    renderClientFamilyMembers([]);
    return;
  }

  const freshEnough = clientFamilyMembersFamilyId === familyId
    && clientFamilyMembersCache.length
    && Date.now() - clientFamilyMembersFetchedAt < 60000;
  if (!options.force && (freshEnough || clientFamilyMembersLoading)) {
    renderClientFamilyMembers(clientFamilyMembersCache);
    return;
  }

  clientFamilyMembersLoading = true;
  clientFamilyMembersFamilyId = familyId;
  renderClientFamilyMembers(clientFamilyMembersCache);
  try {
    const services = await getFirebaseServices();
    const snapshot = await services.getDocs(services.collection(services.db, "families", familyId, "members"));
    const members = [];
    snapshot.forEach((memberDoc) => {
      const data = memberDoc.data() || {};
      const status = String(data.status || "active").toLowerCase();
      if (["inactive", "revoked", "removed"].includes(status)) return;
      const email = normalizeEmail(data.email || "");
      if (isGlobalAdminEmail(email) || data.isAdmin === true) return;
      members.push({ uid: memberDoc.id, ...data, email });
    });
    clientFamilyMembersCache = mergeClientFamilyMembers(members);
    clientFamilyMembersFetchedAt = Date.now();
  } catch (error) {
    console.warn("Não foi possível carregar os membros da família para o perfil:", error);
    clientFamilyMembersCache = mergeClientFamilyMembers(clientFamilyMembersCache);
  } finally {
    clientFamilyMembersLoading = false;
    renderClientFamilyMembers(clientFamilyMembersCache);
  }
}

function renderFamilyAccessSummary() {
  const stateName = updateProfileStateClasses();
  const authorized = hasFamilyAccess();
  const appAdminPanel = isGlobalAppAdmin() && !window.__ninouAdminFamilyDataOpen;
  const show = Boolean(familyAccessSummaryCard && authorized && !appAdminPanel);
  setProfileElementHidden(familyAccessSummaryCard, !show);
  if (!show) return;

  const role = getEffectiveRole(familyAccess?.role || FAMILY_ROLE_ADMIN, cloudUser?.email || familyAccess?.email || "");
  const identity = loadCurrentCaregiverIdentity();
  const familyLabel = getProfileFamilyDisplayName();
  const deviceLabel = identity.label || "Cuidador identificado";
  const canInvite = canManageFamilyAccess();
  const isFranciscoFamily = isFranciscoFamilyId(familyAccess?.familyId || "");

  setText(familyAccessSummaryTitle, familyLabel);
  setText(familyAccessSummaryUser, "Conta conectada");
  setText(familyAccessSummaryFamily, familyLabel);
  setText(familyAccessSummaryDevice, deviceLabel);
  setText(familyAccessSummaryRole, "Familiar");
  setText(familyAccessSummaryRoleBadge, "Conectada");
  if (familyAccessSummaryRoleBadge) {
    familyAccessSummaryRoleBadge.dataset.role = role;
    familyAccessSummaryRoleBadge.dataset.state = "connected";
  }
  setText(
    familyAccessSummaryMembers,
    isFranciscoFamily
      ? "Felipe e Maria estão na mesma família. Cada aparelho registra os cuidados com o nome de quem está usando."
      : "Os familiares conectados compartilham a mesma rotina, mas cada aparelho registra com seu próprio nome."
  );

  if (familyAccessSummaryInviteButton) {
    familyAccessSummaryInviteButton.hidden = !canInvite;
    familyAccessSummaryInviteButton.disabled = !canInvite;
    familyAccessSummaryInviteButton.textContent = "Convidar familiar";
  }
  if (familyAccessSummaryInviteStatus) {
    familyAccessSummaryInviteStatus.textContent = isFranciscoFamily
      ? "Maria já aceitou o convite e faz parte da Família do Francisco."
      : canInvite
        ? "A família já está conectada. Use o convite apenas para adicionar outra pessoa."
        : "Sua família está conectada e pronta para uso.";
  }
  if (familyAccessSummaryProfileButton) {
    const automaticIdentity = Boolean(identity.lockedByEmail);
    familyAccessSummaryProfileButton.hidden = automaticIdentity;
    familyAccessSummaryProfileButton.disabled = automaticIdentity;
  }
  if (familyLeaveButton) {
    const canLeave = canCurrentUserLeaveFamily();
    familyLeaveButton.hidden = !canLeave;
    familyLeaveButton.disabled = !canLeave;
  }

  renderClientFamilyMembers(clientFamilyMembersCache);
  refreshClientFamilyMembers().catch(() => {});
}

function withButtonBusy(button, busyLabel, task, options = {}) {
  if (!button) return task?.();
  if (button.dataset.busy === "true") return undefined;
  const originalText = button.textContent;
  const originalDisabled = button.disabled;
  button.dataset.busy = "true";
  button.disabled = true;
  if (busyLabel) button.textContent = busyLabel;

  const finish = () => {
    delete button.dataset.busy;
    if (options.restoreDisabled !== false) button.disabled = originalDisabled;
    if (!options.keepLabel) button.textContent = originalText;
    if (typeof options.afterFinish === "function") options.afterFinish();
  };

  try {
    const result = task?.();
    if (result && typeof result.finally === "function") {
      return result.finally(finish);
    }
    finish();
    return result;
  } catch (error) {
    finish();
    throw error;
  }
}

function renderLoggedOutProfileShell() {
  const loggedOut = !isLoggedIn();
  document.body.classList.toggle("profile-guest-focused", loggedOut);
  if (profileSettingsList) profileSettingsList.dataset.profileState = loggedOut ? "guest" : "account";

  if (!loggedOut) {
    setProfileElementHidden(profileHeroCard, false);
    setProfileElementHidden(profilePrivacyCard, false);
    renderProfileStateNotice();
    renderFamilyAccessSummary();
    return;
  }

  setProfileElementHidden(profileStateNoticeCard, true);
  setProfileElementHidden(familyAccessSummaryCard, true);
  setProfileElementHidden(profileHeroCard, true);
  setProfileElementHidden(profileFamilyStack, true);
  setProfileElementHidden(profileReadyCard, true);
  setProfileElementHidden(premiumTrustCard, true);
  setProfileElementHidden(postAccessCard, true);
  setProfileElementHidden(dataRealityCard, true);
  setProfileElementHidden(firstUseChecklistCard, true);
  setProfileElementHidden(familyAccessCard, true);
  setProfileElementHidden(profilePrivacyCard, true);

  if (loginCard) {
    loginCard.dataset.state = "guest";
    const kicker = loginCard.querySelector("span");
    const title = loginCard.querySelector("strong");
    if (kicker) kicker.textContent = "Conta";
    if (title) title.textContent = "Entrar ou criar conta";
  }

  if (loginHelper) {
    loginHelper.textContent = "Use e-mail e senha para entrar. Se recebeu convite, crie a conta com o mesmo e-mail convidado.";
  }
  updateProfileStateClasses();
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
  renderLoggedOutProfileShell();
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
      <span>Criar família</span>
      <span>Convite seguro</span>
      <span>Claro ou escuro</span>
    </div>

    <p class="guest-store-cta">${escapeHtml(item.cta)}</p>

    <div class="guest-premium-actions commercial-entry-actions-inline">
      <button type="button" data-guest-action="create">Criar minha família</button>
      <button type="button" data-guest-action="invite">Entrar com convite</button>
      <button type="button" data-guest-action="login">Já tenho conta</button>
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
    focusProfileAccess(normalizeCommercialEntryAction(guestAction.dataset.guestAction));
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

  if (!connected && activeScreenName === "profile") {
    dataRealityCard.hidden = true;
    return;
  }

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
  const role = authorized ? getEffectiveRole(familyAccess?.role || FAMILY_ROLE_ADMIN, cloudUser?.email || familyAccess?.email || "") : "";

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
  renderLoggedOutProfileShell();
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
      if (title) title.textContent = isAdminPanelOnlyContext() ? (cloudUser?.email || "Sessão ativa") : "Conta conectada";
      if (loginHelper && !isAdminPanelOnlyContext()) loginHelper.textContent = "Sua rotina está sincronizada com a família autorizada.";
    } else if (connected) {
      if (kicker) kicker.textContent = "Acesso familiar";
      if (title) title.textContent = "Conta conectada";
    } else {
      if (kicker) kicker.textContent = "Conta";
      if (title) title.textContent = "Entrar ou criar conta";
    }
  }

  renderLoggedOutProfileShell();
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
  const role = authorized ? getEffectiveRole(familyAccess?.role || FAMILY_ROLE_ADMIN, cloudUser?.email || familyAccess?.email || "") : "";
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

function renderInviteResultWithMessage({ title = "Convite pronto", familyLabel = "", email = "", role = FAMILY_ROLE_ADMIN, code = "", link = "" } = {}) {
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

  card.hidden = appAdmin || authorized || !connected;
  if (appAdmin || authorized || !connected) return;

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
          : "Conta criada. Agora você pode criar sua família ou usar o código de convite recebido.")
        : (pendingCode
          ? "Convite salvo neste aparelho. Crie sua conta ou entre usando o mesmo e-mail convidado pelo admin."
          : "Crie sua família se você for o primeiro responsável ou entre com um convite recebido.");
  }

  card.querySelectorAll("[data-journey-action]").forEach((button) => {
    const action = button.dataset.journeyAction || "login";
    if (action === "invite") {
      button.textContent = connected ? "Inserir convite" : "Entrar com convite";
      button.hidden = authorized;
    }
    if (action === "create") {
      button.hidden = connected;
      button.textContent = "Criar minha família";
    }
    if (action === "login") {
      button.hidden = false;
      button.textContent = connected ? (authorized ? "Ver rotina" : "Conta conectada") : "Já tenho conta";
      button.disabled = connected && !authorized;
    }
  });
}

function normalizeCommercialEntryAction(action = "login") {
  const value = String(action || "login").trim();
  if (value === "invite") return "invite";
  if (value === "create" || value === "family") return "create";
  return "login";
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
  setCommercialEntryIntent(wantsCreate ? "create" : wantsInvite ? "invite" : "login");
  if (loginCard) loginCard.dataset.commercialIntent = wantsCreate ? "create" : wantsInvite ? "invite" : "login";
  if (createAccountButton) createAccountButton.textContent = wantsCreate ? "Criar conta familiar" : "Criar conta";
  if (loginButton) loginButton.textContent = wantsInvite ? "Entrar para usar convite" : "Entrar";
  if (loginHelper) {
    loginHelper.textContent = wantsInvite
      ? "Entre ou crie sua conta com o mesmo e-mail do convite. Depois cole o código da família existente."
      : wantsCreate
        ? "Crie sua conta familiar com e-mail e senha. Depois preencha os dados do bebê para criar a família agora."
        : "Entre com sua conta Ninou para acessar uma família já conectada.";
  }

  window.setTimeout(() => {
    const loginCardElement = loginHelper?.closest(".login-card");
    const journeyCard = document.querySelector("#accountJourneyCard");
    const target = wantsInvite && isLoggedIn()
      ? inviteAcceptBox
      : wantsCreate && isLoggedIn()
        ? (createFamilyWizard || familyAccessCard || journeyCard || loginCardElement)
        : (isLoggedIn() ? (journeyCard || loginCardElement) : loginCardElement);
    target?.scrollIntoView({ behavior: "smooth", block: "center" });
    if (wantsInvite && isLoggedIn()) {
      inviteCodeInput?.focus();
    } else if (wantsCreate && isLoggedIn()) {
      openCreateFamilyWizard({ focus: true });
    } else {
      loginEmail?.focus();
    }
  }, 220);
}

const COMMERCIAL_ENTRY_INTENT_KEY = "ninou.commercialEntryIntent";

function setCommercialEntryIntent(action = "login") {
  const value = normalizeCommercialEntryAction(action);
  try { localStorage.setItem(COMMERCIAL_ENTRY_INTENT_KEY, value); } catch {}
  return value;
}

function getCommercialEntryIntent() {
  try { return normalizeCommercialEntryAction(localStorage.getItem(COMMERCIAL_ENTRY_INTENT_KEY) || loginCard?.dataset.commercialIntent || "login"); } catch {
    return normalizeCommercialEntryAction(loginCard?.dataset.commercialIntent || "login");
  }
}

function clearCommercialEntryIntent() {
  try { localStorage.removeItem(COMMERCIAL_ENTRY_INTENT_KEY); } catch {}
  if (loginCard) loginCard.dataset.commercialIntent = "login";
}

function getCreateFamilyWizardDefaults() {
  const identity = loadCurrentCaregiverIdentity();
  const babyName = String(newFamilyBabyNameInput?.value || babyNameInput?.value || babyProfile?.name || "").trim();
  const fallbackFamilyName = babyName ? `Família do ${babyName}` : "";
  return {
    babyName,
    birthDate: String(newFamilyBabyBirthInput?.value || babyBirthInput?.value || babyProfile?.birthDate || "").trim(),
    familyName: String(newFamilyNameInput?.value || fallbackFamilyName).trim(),
    article: String(newFamilyBabyArticleInput?.value || babyProfile?.article || "do").trim() === "da" ? "da" : "do",
    responsibleName: String(newFamilyResponsibleNameInput?.value || identity.name || "").trim(),
    responsibleRelation: String(newFamilyResponsibleRelationInput?.value || identity.relation || "responsavel").trim() || "responsavel",
  };
}

function syncCreateFamilyWizardDefaults({ force = false } = {}) {
  if (!createFamilyWizard) return;
  const defaults = getCreateFamilyWizardDefaults();
  if (newFamilyBabyNameInput && (force || !newFamilyBabyNameInput.value)) newFamilyBabyNameInput.value = defaults.babyName;
  if (newFamilyBabyBirthInput && (force || !newFamilyBabyBirthInput.value)) newFamilyBabyBirthInput.value = defaults.birthDate;
  if (newFamilyNameInput && (force || !newFamilyNameInput.value)) newFamilyNameInput.value = defaults.familyName;
  if (newFamilyBabyArticleInput && (force || !newFamilyBabyArticleInput.value)) newFamilyBabyArticleInput.value = defaults.article;
  if (newFamilyResponsibleNameInput && (force || !newFamilyResponsibleNameInput.value)) newFamilyResponsibleNameInput.value = defaults.responsibleName;
  if (newFamilyResponsibleRelationInput && (force || !newFamilyResponsibleRelationInput.value)) newFamilyResponsibleRelationInput.value = defaults.responsibleRelation;
}

function openCreateFamilyWizard(options = {}) {
  if (!createFamilyWizard) return false;
  setCommercialEntryIntent("create");
  if (!isLoggedIn()) {
    focusProfileAccess("create");
    return false;
  }
  if (hasFamilyAccess()) {
    createFamilyWizard.hidden = true;
    if (loginHelper) loginHelper.textContent = "Esta conta já está vinculada a uma família.";
    return false;
  }
  syncCreateFamilyWizardDefaults();
  createFamilyWizard.hidden = false;
  if (createFamilyWizardStatus) {
    createFamilyWizardStatus.innerHTML = "Preencha os dados e toque em <strong>Criar família agora</strong>.";
  }
  if (options.focus !== false) {
    createFamilyWizard.scrollIntoView({ behavior: "smooth", block: "center" });
    window.setTimeout(() => (newFamilyBabyNameInput || newFamilyNameInput || confirmCreateFamilyButton)?.focus(), 180);
  }
  return true;
}

function closeCreateFamilyWizard() {
  if (createFamilyWizard) createFamilyWizard.hidden = true;
  if (getCommercialEntryIntent() === "create") clearCommercialEntryIntent();
}

function getCommercialFamilyFormValues() {
  const values = getCreateFamilyWizardDefaults();
  values.babyName = String(newFamilyBabyNameInput?.value || values.babyName || "").trim();
  values.birthDate = String(newFamilyBabyBirthInput?.value || values.birthDate || "").trim();
  values.familyName = String(newFamilyNameInput?.value || values.familyName || "").trim();
  values.article = String(newFamilyBabyArticleInput?.value || values.article || "do").trim() === "da" ? "da" : "do";
  values.responsibleName = String(newFamilyResponsibleNameInput?.value || values.responsibleName || "").trim();
  values.responsibleRelation = String(newFamilyResponsibleRelationInput?.value || values.responsibleRelation || "responsavel").trim() || "responsavel";
  if (!values.familyName && values.babyName) values.familyName = `Família do ${values.babyName}`;
  return values;
}

function validateCommercialFamilyForm() {
  const values = getCommercialFamilyFormValues();
  if (!values.babyName) {
    if (createFamilyWizardStatus) createFamilyWizardStatus.textContent = "Informe o nome do bebê para criar a família.";
    newFamilyBabyNameInput?.focus();
    return null;
  }
  if (!values.familyName) {
    values.familyName = `Família do ${values.babyName}`;
    if (newFamilyNameInput) newFamilyNameInput.value = values.familyName;
  }
  if (!values.responsibleName) {
    if (createFamilyWizardStatus) createFamilyWizardStatus.textContent = "Informe seu nome para assinar os registros deste aparelho.";
    newFamilyResponsibleNameInput?.focus();
    return null;
  }
  return values;
}

async function createCommercialFamilyFromWizard() {
  if (!cloudUser) {
    focusProfileAccess("create");
    return null;
  }
  if (hasFamilyAccess()) {
    if (createFamilyWizardStatus) createFamilyWizardStatus.textContent = "Esta conta já possui uma família conectada.";
    return familyAccess;
  }
  const values = validateCommercialFamilyForm();
  if (!values) return null;
  if (confirmCreateFamilyButton) {
    confirmCreateFamilyButton.disabled = true;
    confirmCreateFamilyButton.textContent = "Criando família...";
  }
  if (createFamilyWizardStatus) createFamilyWizardStatus.textContent = "Criando ambiente familiar seguro...";
  try {
    return await activatePersonalFamily(values);
  } finally {
    if (confirmCreateFamilyButton) {
      confirmCreateFamilyButton.disabled = false;
      confirmCreateFamilyButton.textContent = "Criar família agora";
    }
  }
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
  const activeElement = document.activeElement;
  if (babyAvatarCard && activeElement && babyAvatarCard.contains(activeElement)) {
    try {
      activeElement.blur?.();
    } catch (_) {
      // noop
    }
  }
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
  let initialSource = "R";
  for (let index = 0; index < cleaned.length; index += 1) {
    const char = cleaned.charAt(index);
    if (char && char.trim()) { initialSource = char; break; }
  }
  const initial = escapeSvgText(initialSource.toUpperCase());
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
  const normalized = normalizeAvatarDraft(avatar);
  const src = getBabyAvatarDataUrl(normalized);
  if (babyAvatarPreview) {
    babyAvatarPreview.src = src;
    babyAvatarPreview.dataset.avatarId = normalized.hair || "avatar-01";
  }
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

function cloneRoutineDayState(dayState = state) {
  try {
    return normalizeDayState(JSON.parse(JSON.stringify(dayState || createEmptyDayState())));
  } catch {
    return normalizeDayState(dayState || createEmptyDayState());
  }
}

function getSleepKind(type = "sono", start = Date.now(), end = start) {
  const safeStart = Number(start);
  const safeEnd = Number(end);
  if (type === "despertar-noturno") return "night-wake";
  if (type === "dormir") return "night";
  const startHour = Number.isFinite(safeStart) ? new Date(safeStart).getHours() : 0;
  const crossesMidnight = Number.isFinite(safeStart) && Number.isFinite(safeEnd) && toDateInputValue(safeStart) !== toDateInputValue(safeEnd);
  const duration = Number.isFinite(safeStart) && Number.isFinite(safeEnd) ? Math.max(0, safeEnd - safeStart) : 0;
  if (crossesMidnight || startHour >= 19 || startHour < 5 || duration >= 5 * hour) return "night";
  return "nap";
}

function getSleepKindLabel(kind = "nap") {
  if (kind === "night") return "Sono noturno";
  if (kind === "night-wake") return "Despertar noturno";
  return "Soneca";
}

function getSleepClassificationFields(type = "sono", start = Date.now(), end = start) {
  if (!isSleepEvent({ type }) && type !== "despertar-noturno") return {};
  const sleepKind = getSleepKind(type, start, end);
  return {
    sleepKind,
    sleepKindLabel: getSleepKindLabel(sleepKind),
  };
}

function markRoutineMutationSnapshot(action = "alteração") {
  lastRoutineUndoSnapshot = {
    dayId: getSelectedDayId(),
    action,
    at: Date.now(),
    state: cloneRoutineDayState(state),
  };
}

function getLastRoutineUndoSnapshot() {
  if (!lastRoutineUndoSnapshot) return null;
  if (Date.now() - Number(lastRoutineUndoSnapshot.at || 0) > 10 * 60000) {
    lastRoutineUndoSnapshot = null;
    return null;
  }
  return lastRoutineUndoSnapshot;
}

function getLatestEditableEventForToday() {
  const todayStart = getDayStart();
  const events = getFamilyEventsForWindow(todayStart, todayStart + day)
    .filter((event) => eventOverlapsWindow(event, todayStart, todayStart + day));
  return getLatestEvent(events);
}

function restoreLastRoutineMutation() {
  const snapshot = getLastRoutineUndoSnapshot();
  if (!snapshot) {
    window.alert("Não há uma ação recente para desfazer.");
    renderQuickCorrectionCard();
    return;
  }
  if (!window.confirm("Desfazer a última alteração da rotina neste aparelho?")) return;

  syncSelectedDayIntoFamilyCache();
  setSelectedDiaryDayById(snapshot.dayId);
  state = cloneRoutineDayState(snapshot.state);
  loadedStateDayId = snapshot.dayId;
  lastRoutineUndoSnapshot = null;
  timelineRenderSignature = "";
  orbitRenderSignature = "";
  saveDayState();
  renderAll();
  if (firebaseServices && cloudUser && hasFamilyAccess()) {
    window.clearTimeout(dayCloudSaveTimer);
    void saveDayToCloud(snapshot.dayId, { silentRetry: true });
  }
}

function correctLatestRoutineEvent() {
  const event = getLatestEditableEventForToday();
  if (!event) {
    window.alert("Ainda não há registro de hoje para corrigir.");
    return;
  }
  editEvent(event.id);
}

function renderQuickCorrectionCard() {
  if (!routineCorrectionCard) return;
  const latest = getLatestEditableEventForToday();
  const snapshot = getLastRoutineUndoSnapshot();
  const show = canUsePrivateFeatures() && getSelectedDayId() === getCurrentDayId() && (latest || snapshot);
  routineCorrectionCard.hidden = !show;
  if (!show) return;

  const config = latest ? getEventConfig(latest.type) : null;
  if (routineCorrectionKicker) routineCorrectionKicker.textContent = snapshot ? "Correção rápida disponível" : "Correção rápida";
  if (routineCorrectionTitle) routineCorrectionTitle.textContent = latest
    ? `Último registro: ${config.title} às ${formatTime(getEventOrderTime(latest) || latest.start)}`
    : "Última alteração pode ser desfeita";
  if (routineCorrectionText) {
    const editedText = latest?.updatedAtClient ? ` Editado às ${formatTime(latest.updatedAtClient)}.` : "";
    routineCorrectionText.textContent = latest
      ? `Corrija o último registro sem procurar no diário ou desfaça a alteração recente por até 10 minutos.${editedText}`
      : `Você pode desfazer a última alteração recente: ${snapshot?.action || "alteração"}.`;
  }
  routineCorrectionButtons.forEach((button) => {
    const action = button.dataset.lastRecordAction;
    button.disabled = action === "correct" ? !latest : !snapshot;
  });
}

function getManualEventValidationWarning(payload = {}, existingEvent = null) {
  const now = Date.now();
  const type = payload.type || "";
  const start = Number(payload.start);
  const end = Number(payload.hasManualEnd ? payload.end : payload.start);
  if (Number.isFinite(start) && start > now + 2 * 60000) {
    return "Esse horário está no futuro. Revise antes de salvar.";
  }

  const duplicate = (state.events || []).find((event) => event?.id !== existingEvent?.id
    && event.type === type
    && Math.abs(Number(event.start) - start) < 60000);
  if (duplicate) return "Já existe um registro parecido no mesmo minuto. Salvar mesmo assim?";

  if (type === "mamadeira") {
    const amount = parseAmountMl(payload.detail || "");
    if (Number.isFinite(amount) && amount > 300) return "A quantidade da mamadeira parece muito alta para um único registro. Salvar mesmo assim?";
  }

  if ((type === "sono" || type === "dormir") && payload.hasManualEnd && Number.isFinite(start) && Number.isFinite(end)) {
    const duration = end - start;
    if (type === "sono" && duration > 8 * hour) return "Essa soneca ficou com mais de 8 horas. Talvez seja sono noturno. Salvar mesmo assim?";
    if (type === "dormir" && duration > 14 * hour) return "Esse sono noturno ficou com mais de 14 horas. Salvar mesmo assim?";
  }

  if ((type === "sono" || type === "dormir") && !payload.hasManualEnd && state.mode === "sleeping" && !existingEvent) {
    return "Já existe um sono em andamento. Salvar outro início de sono mesmo assim?";
  }

  if (type === "acordou" && state.mode !== "sleeping" && !existingEvent) {
    return "Não há sono em andamento agora. Registrar Acordou mesmo assim?";
  }

  if (type === "fralda") {
    const duplicateDiaper = (state.events || []).find((event) => event?.id !== existingEvent?.id
      && event.type === "fralda"
      && Math.abs(Number(event.start) - start) < 2 * 60000);
    if (duplicateDiaper) return "Já existe uma fralda registrada quase no mesmo horário. Salvar mesmo assim?";
  }

  return "";
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
  const role = getEffectiveRole(familyAccess?.role || FAMILY_ROLE_ADMIN, email);
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

  Felipe e Maria usam e-mails próprios, mas pertencem à mesma família do Francisco.
  Por isso, a identificação do cuidador continua salva por aparelho.
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
  const automaticIdentity = getAutomaticCaregiverIdentityForEmail(getCurrentIdentityEmail());
  if (automaticIdentity) {
    return {
      ...automaticIdentity,
      deviceId: getOrCreateCaregiverDeviceId(),
    };
  }

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
    const label = formatCaregiverNameRole(name, relationLabel) || name || relationLabel;
    return {
      name,
      relation,
      relationshipLabel: relationLabel,
      label,
      deviceId: String(data.deviceId || getOrCreateCaregiverDeviceId()).trim(),
      automatic: false,
      lockedByEmail: false,
    };
  } catch {
    return { name: "", relation: "", relationshipLabel: "", label: "", deviceId: getOrCreateCaregiverDeviceId(), automatic: false, lockedByEmail: false };
  }
}

function saveCurrentCaregiverIdentity(name = "", relation = "", extras = {}) {
  const email = getCurrentIdentityEmail();
  const automaticIdentity = getAutomaticCaregiverIdentityForEmail(email);
  if (automaticIdentity && extras.force !== true) {
    // v75.75.67: Felipe e Maria usam e-mails próprios. O cuidador é definido pelo login,
    // não por um botão de troca neste aparelho. Isso evita registros assinados pela pessoa errada.
    return true;
  }
  const cleanName = String(name || "").trim();
  const cleanRelation = String(relation || "").trim();
  const relationshipLabel = String(extras.relationshipLabel || getCaregiverRelationLabel(cleanRelation) || "").trim();
  const role = getEffectiveRole(familyAccess?.role || FAMILY_ROLE_ADMIN, email);
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
  setProfileElementHidden(familyAccessSummaryCard, true);
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
  const rawMs = Number(ms);
  if (!Number.isFinite(rawMs) || rawMs < 0 || rawMs > 72 * hour) return "revisar horário";
  const minutes = Math.max(0, Math.round(rawMs / 60000));
  if (minutes < 60) return `${minutes} min`;
  const hoursValue = Math.floor(minutes / 60);
  const minutesValue = minutes % 60;
  return minutesValue ? `${hoursValue}h ${minutesValue}min` : `${hoursValue}h`;
}

function isSaneRoutineDuration(ms = 0, maxHours = 72) {
  const value = Number(ms);
  return Number.isFinite(value) && value >= 0 && value <= maxHours * hour;
}

function formatRoutineDurationSafe(ms = 0, maxHours = 72) {
  return isSaneRoutineDuration(ms, maxHours) ? formatShortDuration(ms) : "revisar horário";
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
    const carriedRoutine = getRoutineCarryFromEventsAcrossMidnight(getCurrentDayId(), getFamilyDayState(getCurrentDayId()), now);
    if (carriedRoutine && carriedRoutine.mode === "awake" && Number.isFinite(Number(carriedRoutine.start))) {
      const wakeAt = Number(carriedRoutine.start);
      const durationMs = Math.max(0, now - wakeAt);
      const continuedFromYesterday = wakeAt < todayStart;
      return {
        hasWake: true,
        isOpen: true,
        wakeEvent: carriedRoutine.sourceEvent || { type: "acordou", start: wakeAt, end: wakeAt, eventTime: wakeAt, detail: carriedRoutine.detail || "Continuado" },
        wakeAt,
        endEvent: null,
        endAt: now,
        durationMs,
        sinceLabel: `${continuedFromYesterday ? "ontem, " : ""}${formatTime(wakeAt)}`,
        durationLabel: formatAwakeDuration(durationMs),
        lastActionLabel: continuedFromYesterday
          ? `Acordado desde ontem às ${formatTime(wakeAt)}`
          : `Acordado desde ${formatTime(wakeAt)}`,
      };
    }

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
    deviceCaregiverHint.textContent = identity.lockedByEmail
      ? `Identificação automática pelo e-mail conectado: ${identity.label}.`
      : identity.label
        ? `Registros feitos neste aparelho serão assinados como ${identity.label}.`
        : "Escolha quem está usando este aparelho para os registros ficarem corretos.";
  }
  if (familyNameLabel) familyNameLabel.textContent = familyLabel;
  if (familyAccountLabel) familyAccountLabel.textContent = cloudUser?.email || familyAccess?.email || "Conta não conectada";
  if (familyAccessTypeLabel) familyAccessTypeLabel.textContent = getRoleLabel(familyAccess?.role || FAMILY_ROLE_ADMIN);
  if (familyInviteDescription) {
    familyInviteDescription.textContent = canManageFamilyAccess()
      ? `Convide outro cuidador para acompanhar a rotina ${babyName ? `de ${babyName}` : "do bebê"}. O convite entra na família existente.`
      : "Você pode acompanhar a rotina. Convites ficam com o responsável da família.";
  }
  if (familyCreateInviteButton) {
    familyCreateInviteButton.hidden = !canManageFamilyAccess();
    familyCreateInviteButton.disabled = !canManageFamilyAccess();
  }
  renderFamilyActiveInvite();
  renderFamilyAccessSummary();
}


function renderTodayCaregiverCard() {
  // v75.75.67: Felipe e Maria usam e-mails próprios em celulares próprios.
  // A identificação continua no Perfil e no Diário, mas o card da Home não ocupa mais a tela inicial.
  if (!todayCaregiverCard) return;
  todayCaregiverCard.hidden = true;
  todayCaregiverCard.setAttribute("aria-hidden", "true");
  todayCaregiverCard.classList.add("home-caregiver-card-retired");
  return;

  const identity = loadCurrentCaregiverIdentity();
  const relationLabel = identity.relationshipLabel || getCaregiverRelationLabel(identity.relation);
  const label = formatCaregiverNameRole(identity.name, relationLabel) || identity.label || "Cuidador não configurado";
  const configured = Boolean(identity.name || identity.relation || identity.label);

  todayCaregiverCard.classList.toggle("caregiver-configured", configured);
  todayCaregiverCard.classList.toggle("caregiver-auto-locked", Boolean(identity.lockedByEmail));
  todayCaregiverCard.dataset.configured = configured ? "true" : "false";
  todayCaregiverCard.dataset.autoLocked = identity.lockedByEmail ? "true" : "false";

  if (todayCaregiverAvatar) todayCaregiverAvatar.textContent = getCaregiverEmoji(identity.relation);
  if (todayCaregiverName) todayCaregiverName.textContent = label;
  if (todayCaregiverHint) {
    todayCaregiverHint.textContent = identity.lockedByEmail
      ? "Identificado automaticamente pelo e-mail desta conta."
      : configured
        ? `Os próximos registros serão assinados como ${label}.`
        : "Toque em configurar para o diário mostrar quem fez cada registro.";
  }
  if (todayCaregiverEditButton) {
    todayCaregiverEditButton.hidden = Boolean(identity.lockedByEmail);
    todayCaregiverEditButton.disabled = Boolean(identity.lockedByEmail);
    todayCaregiverEditButton.textContent = configured ? "Trocar" : "Configurar";
    todayCaregiverEditButton.title = configured ? "Trocar cuidador deste aparelho" : "Configurar cuidador deste aparelho";
  }
}

function applyCaregiverPresetFromButton(button) {
  if (!button) return;
  const name = String(button.dataset.caregiverPresetName || "").trim();
  const relation = String(button.dataset.caregiverPresetRelation || "").trim();
  if (!name && !relation) return;

  saveCurrentCaregiverIdentity(name, relation);
  if (caregiverNameInput) caregiverNameInput.value = name;
  if (caregiverRelationInput) caregiverRelationInput.value = relation;

  const identity = loadCurrentCaregiverIdentity();
  if (caregiverIdentityStatus) {
    caregiverIdentityStatus.textContent = identity.label
      ? `Pronto. Este aparelho agora registra como ${identity.label}.`
      : "Identificação atualizada neste aparelho.";
  }

  renderCaregiverIdentityPanel();
  renderFamilyAccessSummary();
  renderTodayCaregiverCard();
  try { updateProfileReadyExperience(); } catch {}
}

function openCaregiverEditor() {
  showScreen("profile");
  renderCaregiverIdentityPanel();
  const identity = loadCurrentCaregiverIdentity();
  if (identity.lockedByEmail) {
    if (caregiverIdentityStatus) caregiverIdentityStatus.textContent = `Este aparelho registra automaticamente como ${identity.label}, conforme o e-mail conectado.`;
    setTimeout(() => caregiverIdentityCard?.scrollIntoView({ behavior: "smooth", block: "center" }), 50);
    return;
  }
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
  caregiverIdentityCard.classList.toggle("caregiver-auto-locked", Boolean(identity.lockedByEmail));
  if (identity.label && !caregiverIdentityCard.dataset.userOpened) {
    caregiverIdentityCard.open = false;
  }
  if (document.activeElement !== caregiverNameInput) caregiverNameInput.value = identity.name || (isPrimaryAdmin ? "Luiz Felipe" : "");
  if (document.activeElement !== caregiverRelationInput) caregiverRelationInput.value = identity.relation || (isPrimaryAdmin ? "pai" : "");
  if (caregiverNameInput) caregiverNameInput.disabled = Boolean(identity.lockedByEmail);
  if (caregiverRelationInput) caregiverRelationInput.disabled = Boolean(identity.lockedByEmail);
  caregiverPresetButtons.forEach((button) => {
    button.hidden = Boolean(identity.lockedByEmail);
    button.disabled = Boolean(identity.lockedByEmail);
  });
  if (saveCaregiverIdentityButton) {
    saveCaregiverIdentityButton.hidden = Boolean(identity.lockedByEmail);
    saveCaregiverIdentityButton.disabled = Boolean(identity.lockedByEmail);
    saveCaregiverIdentityButton.textContent = identity.label ? "Salvar alterações" : "Salvar cuidador";
  }
  if (caregiverIdentityStatus) {
    caregiverIdentityStatus.textContent = identity.lockedByEmail
      ? `Automático: este login registra como ${identity.label}. Não é necessário trocar no aparelho.`
      : identity.label
        ? `Os próximos registros deste aparelho serão assinados como ${identity.label}.`
        : (isPrimaryAdmin
          ? "Sugestão inicial: Luiz Felipe / Pai. Admin é permissão do sistema; Pai é apenas como os registros aparecem no diário."
          : "Defina o nome e o vínculo que aparecerão nos registros deste aparelho.");
  }
  renderProfileFamilyCards();
  renderTodayCaregiverCard();
}

async function saveCaregiverIdentityFromForm() {
  const name = caregiverNameInput?.value || "";
  const relation = caregiverRelationInput?.value || "";

  // v75.56.2.1.1: salva somente neste aparelho.
  // Não grava em users/{uid}/account/profile para não trocar o nome do cuidador
  // em todos os aparelhos da família do Francisco.
  saveCurrentCaregiverIdentity(name, relation);
  const identity = loadCurrentCaregiverIdentity();

  if (saveCaregiverIdentityButton) {
    saveCaregiverIdentityButton.textContent = identity.label ? "Salvar alterações" : "Salvar identificação";
  }

  if (caregiverIdentityStatus) caregiverIdentityStatus.textContent = identity.label
    ? `Os próximos registros deste aparelho serão assinados como ${identity.label}.`
    : "Identificação limpa neste aparelho. Usaremos o e-mail quando necessário.";

  renderCaregiverIdentityPanel();
  renderFamilyAccessSummary();
  renderTodayCaregiverCard();
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
    ...getSleepClassificationFields(type, start, end),
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
  const familyId = getResolvedFamilyScope({ allowLegacyFallback: false }).familyId || "";
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

// v76.1.0 — as observações do dia também recebem um armazenamento dedicado.
// Isso impede que uma atualização do estado da rotina, uma leitura antiga da nuvem
// ou uma sanitização de compatibilidade apague silenciosamente o texto digitado.
function getLocalDayNotesStorageKey(dayId = getCurrentDayId(), familyId = "") {
  const safeDayId = isDateId(dayId) ? dayId : getCurrentDayId();
  const scope = sanitizeLocalStorageSegment(familyId ? `family.${familyId}` : getActiveFamilyCacheScope());
  return `${storageKeys.dayState}.notes.${scope}.${safeDayId}`;
}

function normalizeDayNoteTimeValue(value = "") {
  const match = String(value || "").trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return formatTime(Date.now());
  const hours = Math.max(0, Math.min(23, Number(match[1]) || 0));
  const minutes = Math.max(0, Math.min(59, Number(match[2]) || 0));
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function createDayNoteEntryId() {
  return `note-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function inferDayNoteIcon(text = "") {
  const value = String(text || "").toLowerCase();
  if (/(cólica|colica|gases|dor na barriga)/.test(value)) return "💛";
  if (/(regurg|golf|vomit)/.test(value)) return "💧";
  if (/(banho|banhou)/.test(value)) return "🛁";
  if (/(medic|remédio|remedio|dose)/.test(value)) return "💊";
  if (/(febre|temperatura)/.test(value)) return "🌡️";
  if (/(consulta|pediatra|orientação profissional|orientacao profissional)/.test(value)) return "🩺";
  return "✦";
}

function normalizeDayNoteEntry(entry = {}) {
  const text = String(entry?.text || entry?.label || entry?.title || "").replace(/\s+/g, " ").trim();
  if (!text) return null;
  const actor = String(entry?.actor || entry?.by || entry?.author || "").replace(/\s+/g, " ").trim();
  const icon = String(entry?.icon || inferDayNoteIcon(text) || "✦").trim() || "✦";
  return {
    id: String(entry?.id || createDayNoteEntryId()),
    time: normalizeDayNoteTimeValue(entry?.time || entry?.hour || entry?.timestampLabel || ""),
    text,
    actor,
    icon,
  };
}

function normalizeDayNoteEntries(entries = []) {
  return (Array.isArray(entries) ? entries : []).map((entry) => normalizeDayNoteEntry(entry)).filter(Boolean);
}

function splitDayNotesText(text = "") {
  const lines = normalizeSafeDayNotes(text).split("\n").map((line) => line.trim()).filter(Boolean);
  const entries = [];
  const freeformLines = [];
  lines.forEach((line) => {
    const match = line.match(DAY_NOTE_ENTRY_PATTERN);
    if (match) {
      const normalized = normalizeDayNoteEntry({ time: match[1], text: match[2], actor: match[3] || "" });
      if (normalized) entries.push(normalized);
      return;
    }
    freeformLines.push(line);
  });
  return {
    entries,
    freeform: normalizeSafeDayNotes(freeformLines.join("\n")),
  };
}

function buildDayNotesTextFromModel(model = {}) {
  const entries = normalizeDayNoteEntries(model?.entries || []);
  const freeform = normalizeSafeDayNotes(model?.freeform || "");
  return normalizeSafeDayNotes([
    ...entries.map((entry) => `${entry.time} — ${entry.text}${entry.actor ? ` (${entry.actor})` : ""}`),
    freeform,
  ].filter(Boolean).join("\n"));
}

function normalizeDayNotesModel(model = {}) {
  const entries = normalizeDayNoteEntries(model?.entries || []);
  const freeform = normalizeSafeDayNotes(model?.freeform || "");
  return {
    dayId: isDateId(model?.dayId) ? model.dayId : getSelectedDayId(),
    entries,
    freeform,
    text: buildDayNotesTextFromModel({ entries, freeform }),
    updatedAt: Number(model?.updatedAt) || 0,
  };
}

function loadLocalDayNotes(dayId = getCurrentDayId()) {
  const safeDayId = isDateId(dayId) ? dayId : getCurrentDayId();
  try {
    const raw = localStorage.getItem(getLocalDayNotesStorageKey(safeDayId));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    if (!payloadBelongsToActiveFamily(parsed)) return null;
    if (parsed.dayId && parsed.dayId !== safeDayId) return null;
    const legacyModel = splitDayNotesText(parsed.text || "");
    const freeform = typeof parsed.freeform === "string" ? normalizeSafeDayNotes(parsed.freeform) : legacyModel.freeform;
    const entries = Array.isArray(parsed.entries) ? normalizeDayNoteEntries(parsed.entries) : legacyModel.entries;
    return {
      text: normalizeSafeDayNotes(parsed.text || buildDayNotesTextFromModel({ entries, freeform })),
      updatedAt: Number(parsed.updatedAt) || 0,
      cleared: parsed.cleared === true,
      entries,
      freeform,
    };
  } catch {
    return null;
  }
}

function saveLocalDayNotes(dayId = getCurrentDayId(), text = "", updatedAt = Date.now(), options = {}) {
  const safeDayId = isDateId(dayId) ? dayId : getCurrentDayId();
  const freeform = normalizeSafeDayNotes(options?.freeform || "");
  const entries = normalizeDayNoteEntries(options?.entries || []);
  const safeText = normalizeSafeDayNotes(text || buildDayNotesTextFromModel({ entries, freeform }));
  const safeUpdatedAt = Number(updatedAt) || Date.now();
  const payload = stampFamilyData({
    dayId: safeDayId,
    date: safeDayId,
    text: safeText,
    freeform,
    entries,
    cleared: !safeText,
    updatedAt: safeUpdatedAt,
  });
  try {
    localStorage.setItem(getLocalDayNotesStorageKey(safeDayId), JSON.stringify(payload));
    return true;
  } catch (error) {
    console.error("Não foi possível salvar a observação localmente:", error);
    return false;
  }
}

function applyPersistedDayNotesToState(dayState = {}, dayId = getCurrentDayId()) {
  const safeDayId = isDateId(dayId) ? dayId : getCurrentDayId();
  const normalized = normalizeDayState(dayState || createEmptyDayState());
  const persisted = loadLocalDayNotes(safeDayId);
  if (!persisted) return normalized;

  const stateUpdatedAt = Number(normalized.dayNotesUpdatedAt) || 0;
  if (persisted.updatedAt < stateUpdatedAt) return normalized;

  return normalizeDayState({
    ...normalized,
    dayId: safeDayId,
    date: safeDayId,
    dayNotes: persisted.cleared ? "" : persisted.text,
    dayNotesDayId: persisted.cleared || !persisted.text ? "" : safeDayId,
    dayNotesUpdatedAt: persisted.updatedAt,
  });
}

// v75.75.67 — isolamento local/comercial por família.
// Perfil, pesos e dias passam a usar chaves derivadas do familyId ativo.
// O cache legado fica apenas como compatibilidade para contas antigas sem família comercial.
function getActiveDataScope(options = {}) {
  const scope = getResolvedFamilyScope({
    allowAdminSelection: options.allowAdminSelection !== false,
    allowLegacyFallback: false,
  });
  if (scope.familyId) return {
    ...scope,
    storageScope: sanitizeLocalStorageSegment(`family.${scope.familyId}`),
    isFamilyScoped: true,
  };

  const fallbackScope = getActiveFamilyCacheScope();
  return {
    ...scope,
    familyId: "",
    storageScope: sanitizeLocalStorageSegment(fallbackScope),
    isFamilyScoped: false,
  };
}

function isFamilyScopedDataActive() {
  return Boolean(getActiveDataScope().isFamilyScoped);
}

function getScopedStorageKey(baseKey = "", familyId = "") {
  const base = String(baseKey || "").trim();
  if (!base) return "";
  const scope = familyId
    ? sanitizeLocalStorageSegment(`family.${normalizeFamilyId(familyId)}`)
    : getActiveDataScope().storageScope;
  return `${base}.${scope}`;
}

function getScopedProfileStorageKey(familyId = "") {
  return getScopedStorageKey(storageKeys.profile, familyId);
}

function getScopedProfileVersionStorageKey(familyId = "") {
  return getScopedStorageKey(storageKeys.profileVersion, familyId);
}

function getScopedWakeWindowStorageKey(familyId = "") {
  return getScopedStorageKey(storageKeys.wakeWindow, familyId);
}

function getScopedWeightsStorageKey(familyId = "") {
  return getScopedStorageKey(storageKeys.weights, familyId);
}

function getActiveFamilyMetadata() {
  const scope = getResolvedFamilyScope({ allowLegacyFallback: false });
  return {
    familyId: scope.familyId || "",
    familyScopeType: scope.scopeType || getFamilyScopeType(scope.familyId || ""),
    familyScopeVersion: NINOU_FAMILY_SCOPE_VERSION,
  };
}

function stampFamilyData(payload = {}) {
  const meta = getActiveFamilyMetadata();
  return meta.familyId ? { ...payload, ...meta } : { ...payload };
}

function payloadBelongsToActiveFamily(payload = {}) {
  const activeFamilyId = normalizeFamilyId(getActiveFamilyMetadata().familyId || "");
  const payloadFamilyId = normalizeFamilyId(payload?.familyId || "");
  if (!activeFamilyId || !payloadFamilyId) return true;
  return activeFamilyId === payloadFamilyId;
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
  const familyScoped = isFamilyScopedDataActive();

  try {
    const scopedValue = localStorage.getItem(getLocalDayStateStorageKey(safeDayId));
    if (scopedValue !== null && typeof scopedValue !== "undefined") {
      const parsed = JSON.parse(scopedValue || "{}");
      if (!payloadBelongsToActiveFamily(parsed)) return sanitizeDayStateForDay(createEmptyDayState(), safeDayId);
      return applyPersistedDayNotesToState(sanitizeDayStateForDay(parsed, safeDayId), safeDayId);
    }
  } catch {
    // Se o cache por família+dia estiver inválido, cai para os fluxos seguros abaixo.
  }

  // Famílias comerciais não podem herdar rotina do cache legado/global.
  if (familyScoped) {
    return applyPersistedDayNotesToState(sanitizeDayStateForDay(createEmptyDayState(), safeDayId), safeDayId);
  }

  try {
    const legacyDailyValue = localStorage.getItem(getLegacyLocalDayStateStorageKey(safeDayId));
    if (legacyDailyValue !== null && typeof legacyDailyValue !== "undefined") {
      const legacyDailyState = JSON.parse(legacyDailyValue || "{}");
      if (dayStateBelongsToDay(legacyDailyState, safeDayId) || !dayStateHasVisibleContent(legacyDailyState)) {
        const sanitized = sanitizeDayStateForDay(legacyDailyState, safeDayId);
        localStorage.setItem(getLocalDayStateStorageKey(safeDayId), JSON.stringify(sanitized));
        return applyPersistedDayNotesToState(sanitized, safeDayId);
      }
    }
  } catch {
    // Cache diário antigo inválido. Ignora para não repetir observações.
  }

  // v75.58.3: o cache genérico ninou.demo.dayState não é mais usado para abrir dias,
  // porque ele era a origem de observações e registros herdados entre datas.
  return applyPersistedDayNotesToState(sanitizeDayStateForDay(createEmptyDayState(), safeDayId), safeDayId);
}

function saveLocalDayState(dayId = getSelectedDayId()) {
  const safeDayId = isDateId(dayId) ? dayId : getCurrentDayId();
  const sanitized = sanitizeDayStateForDay(state, safeDayId, { preserveLive: true });
  const now = Date.now();
  const payload = stampFamilyData({
    ...sanitized,
    dayId: safeDayId,
    date: safeDayId,
    dayNotesDayId: sanitized.dayNotes ? safeDayId : "",
    dayNotesUpdatedAt: sanitized.dayNotes ? (sanitized.dayNotesUpdatedAt || now) : 0,
    clientUpdatedAt: now,
  });

  saveLocalDayNotes(safeDayId, payload.dayNotes || "", payload.dayNotesUpdatedAt || now);
  localStorage.setItem(getLocalDayStateStorageKey(safeDayId), JSON.stringify(payload));

  // Compatibilidade apenas para contas antigas sem família comercial ativa.
  if (!isFamilyScopedDataActive()) {
    localStorage.setItem(getLegacyLocalDayStateStorageKey(safeDayId), JSON.stringify(payload));
    localStorage.setItem(storageKeys.dayState, JSON.stringify(payload));
  }
  persistVisibleContextForCurrentOwner();
}


function persistDayStateForDay(dayState = createEmptyDayState(), dayId = getCurrentDayId()) {
  const safeDayId = isDateId(dayId) ? dayId : getCurrentDayId();
  const sanitized = sanitizeDayStateForDay(dayState, safeDayId, { preserveLive: true });
  const now = Date.now();
  const payload = stampFamilyData({
    ...sanitized,
    dayId: safeDayId,
    date: safeDayId,
    dayNotesDayId: sanitized.dayNotes ? safeDayId : "",
    dayNotesUpdatedAt: sanitized.dayNotes ? (sanitized.dayNotesUpdatedAt || now) : 0,
    clientUpdatedAt: now,
  });

  familyDayStatesCache = {
    ...familyDayStatesCache,
    [safeDayId]: payload,
  };
  if ((dayStateHasVisibleContent(payload) || getDeletedEventIdsFromState(payload).size) && !familyDayIdsCache.includes(safeDayId)) {
    familyDayIdsCache = [...familyDayIdsCache, safeDayId].filter(isDateId).sort();
  }

  saveLocalDayNotes(safeDayId, payload.dayNotes || "", payload.dayNotesUpdatedAt || now);
  localStorage.setItem(getLocalDayStateStorageKey(safeDayId), JSON.stringify(payload));
  if (!isFamilyScopedDataActive()) {
    localStorage.setItem(getLegacyLocalDayStateStorageKey(safeDayId), JSON.stringify(payload));
    if (safeDayId === getSelectedDayId()) localStorage.setItem(storageKeys.dayState, JSON.stringify(payload));
  }
  persistVisibleContextForCurrentOwner();
  return payload;
}

function getPreviousDayId(dayId = getCurrentDayId()) {
  const base = getDayStartFromId(isDateId(dayId) ? dayId : getCurrentDayId());
  return toDateInputValue(base - day);
}

function getRoutineCarryFromEventsAcrossMidnight(dayId = getCurrentDayId(), currentDayState = null, now = Date.now()) {
  const safeDayId = isDateId(dayId) ? dayId : getCurrentDayId();
  const todayStart = getDayStartFromId(safeDayId);
  const previousDayId = getPreviousDayId(safeDayId);
  const previousStart = todayStart - day;
  const upperLimit = Math.min(todayStart + day, Number(now) + 2 * 60000);

  const previousState = sanitizeDayStateForDay(
    familyDayStatesCache[previousDayId] || loadLocalDayState(previousDayId),
    previousDayId,
    { preserveLive: true },
  );
  const todayState = sanitizeDayStateForDay(
    currentDayState || familyDayStatesCache[safeDayId] || loadLocalDayState(safeDayId),
    safeDayId,
    { preserveLive: true },
  );

  const events = dedupeEventsByDisplayKey([
    ...getVisibleEventsFromState(previousState),
    ...getVisibleEventsFromState(todayState),
  ])
    .filter((event) => {
      const time = Number(getEventOrderTime(event));
      return Number.isFinite(time) && time >= previousStart && time <= upperLimit;
    })
    .sort((a, b) => Number(getEventOrderTime(a)) - Number(getEventOrderTime(b)));

  let live = null;

  events.forEach((event) => {
    const orderTime = Number(getEventOrderTime(event));
    const start = Number(event.start);
    const end = Number(event.end);

    if (event.type === "acordou") {
      live = {
        dayId: orderTime < todayStart ? previousDayId : safeDayId,
        mode: "awake",
        start: orderTime,
        type: "acordou",
        detail: event.detail || "Continuado do último registro",
        notes: event.notes || "",
        sourceEvent: event,
      };
      return;
    }

    if (event.type === "despertar-noturno") {
      live = {
        dayId: orderTime < todayStart ? previousDayId : safeDayId,
        mode: "awake",
        start: orderTime,
        type: "despertar-noturno",
        detail: event.detail || "Despertar em andamento",
        notes: event.notes || "",
        sourceEvent: event,
      };
      return;
    }

    if (!isSleepEvent(event) || !Number.isFinite(start) || start > upperLimit) return;

    if (Number.isFinite(end) && end > start && end <= upperLimit) {
      live = {
        dayId: end < todayStart ? previousDayId : safeDayId,
        mode: "awake",
        start: end,
        type: "acordou",
        detail: event.type === "dormir" ? "Após sono noturno" : "Após soneca",
        notes: "",
        sourceEvent: event,
      };
      return;
    }

    live = {
      dayId: start < todayStart ? previousDayId : safeDayId,
      mode: "sleeping",
      start,
      type: event.type || "sono",
      detail: event.detail || "Sono em andamento",
      notes: event.notes || "",
      sourceEvent: event,
    };
  });

  if (!live || !Number.isFinite(Number(live.start))) return null;
  if (Number(live.start) < todayStart - 48 * hour || Number(live.start) > Number(now) + 2 * 60000) return null;
  return live;
}

function getOpenRoutineFromPreviousDay(dayId = getCurrentDayId(), now = Date.now()) {
  const safeDayId = isDateId(dayId) ? dayId : getCurrentDayId();
  const previousDayId = getPreviousDayId(safeDayId);
  const previousState = sanitizeDayStateForDay(familyDayStatesCache[previousDayId] || loadLocalDayState(previousDayId), previousDayId, { preserveLive: true });
  const start = Number(previousState.activeStartedAt);
  const todayStart = getDayStartFromId(safeDayId);
  const previousMode = String(previousState.mode || "idle");

  if (["awake", "sleeping", "night-wake"].includes(previousMode)
    && Number.isFinite(start)
    && start < todayStart
    && start >= todayStart - 48 * hour
    && start <= now + 2 * 60000) {
    const fallbackType = previousMode === "sleeping"
      ? "sono"
      : previousMode === "night-wake"
        ? "despertar-noturno"
        : "acordou";

    return {
      dayId: previousDayId,
      mode: previousMode,
      start,
      type: previousState.activeType || fallbackType,
      detail: previousState.activeDetail || "Continuado de ontem",
      notes: previousState.activeNotes || "",
    };
  }

  const inferred = getRoutineCarryFromEventsAcrossMidnight(safeDayId, null, now);
  if (!inferred || Number(inferred.start) >= todayStart) return null;
  return {
    dayId: inferred.dayId || previousDayId,
    mode: inferred.mode,
    start: Number(inferred.start),
    type: inferred.type || (inferred.mode === "sleeping" ? "sono" : "acordou"),
    detail: inferred.detail || "Continuado de ontem",
    notes: inferred.notes || "",
  };
}

function getOpenSleepFromPreviousDay(dayId = getCurrentDayId(), now = Date.now()) {
  const openRoutine = getOpenRoutineFromPreviousDay(dayId, now);
  if (!openRoutine || openRoutine.mode !== "sleeping") return null;
  return {
    ...openRoutine,
    type: isSleepEvent({ type: openRoutine.type }) ? openRoutine.type : "sono",
  };
}

function todayHasPersistentRoutineContent() {
  return (Array.isArray(state.events) && state.events.length > 0) || String(state.dayNotes || "").trim();
}

function continueOpenSleepFromPreviousDayIfNeeded() {
  if (getSelectedDayId() !== getCurrentDayId()) return false;
  if (state.mode !== "idle" || todayHasPersistentRoutineContent()) return false;
  const openRoutine = getOpenRoutineFromPreviousDay(getCurrentDayId());
  if (!openRoutine) return false;

  state = normalizeDayState({
    ...state,
    mode: openRoutine.mode,
    activeStartedAt: openRoutine.start,
    activeType: openRoutine.type,
    activeDetail: openRoutine.detail || "Continuado de ontem",
    activeNotes: openRoutine.notes || "",
  });
  syncSelectedDayIntoFamilyCache();
  saveLocalDayState(getCurrentDayId());
  return true;
}

function parseManualStartTimeInput(mode = "awake") {
  const now = Date.now();
  const label = mode === "sleeping"
    ? `Desde que horas ${getBabyReference()} está dormindo? (HH:MM)`
    : mode === "awake"
      ? `Que horas ${getBabyReference()} acordou ou está acordado(a) desde? (HH:MM)`
      : "";
  if (!label) return now;

  const defaultValue = formatTime(now);
  const answer = window.prompt(label, defaultValue);
  if (answer === null) return null;

  const match = String(answer || "").trim().match(/^(\d{1,2})[:hH](\d{2})$/);
  if (!match) {
    window.alert("Informe um horário no formato HH:MM, por exemplo 07:20.");
    return null;
  }

  const hoursValue = Number(match[1]);
  const minutesValue = Number(match[2]);
  if (!Number.isInteger(hoursValue) || !Number.isInteger(minutesValue) || hoursValue < 0 || hoursValue > 23 || minutesValue < 0 || minutesValue > 59) {
    window.alert("Horário inválido. Use horas entre 00 e 23 e minutos entre 00 e 59.");
    return null;
  }

  const todayStart = getDayStart();
  let timestamp = todayStart + hoursValue * hour + minutesValue * 60000;
  if (mode === "sleeping" && timestamp > now + 2 * 60000) {
    timestamp -= day;
  }

  const earliest = mode === "sleeping" ? todayStart - day : todayStart;
  if (timestamp < earliest) {
    window.alert(mode === "sleeping"
      ? "Para sono atravessando a meia-noite, informe um horário de ontem ou de hoje."
      : "Para acordado, escolha um horário de hoje.");
    return null;
  }
  if (timestamp > now + 2 * 60000) {
    window.alert("Não é possível iniciar a rotina em um horário futuro.");
    return null;
  }

  return timestamp;
}

function getFirstRoutinePromptKey() {
  let familyId = "local";
  try {
    if (typeof getFamilyInviteTargetFamilyId === "function") familyId = getFamilyInviteTargetFamilyId() || familyId;
    if ((!familyId || familyId === "local") && familyAccess?.familyId) familyId = familyAccess.familyId;
    if ((!familyId || familyId === "local") && babyProfile?.familyId) familyId = babyProfile.familyId;
  } catch {}
  return `ninou:first-routine-state:${familyId || "local"}:${getCurrentDayId()}`;
}

function parseFirstRoutineTimeValue(mode = "awake") {
  const input = document.querySelector("#firstRoutineTimeInput");
  const value = String(input?.value || "").trim();
  const now = Date.now();
  const match = value.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) {
    window.alert("Informe o horário no formato HH:MM.");
    return null;
  }
  const h = Number(match[1]);
  const m = Number(match[2]);
  if (!Number.isInteger(h) || !Number.isInteger(m) || h < 0 || h > 23 || m < 0 || m > 59) {
    window.alert("Horário inválido. Use horas entre 00 e 23 e minutos entre 00 e 59.");
    return null;
  }
  let timestamp = getDayStart() + h * hour + m * 60000;
  if (timestamp > now + 2 * 60000) timestamp -= day;
  if (timestamp < now - 36 * hour || timestamp > now + 2 * 60000) {
    window.alert("Escolha um horário das últimas 36 horas.");
    return null;
  }
  return timestamp;
}

function ensureFirstRoutineStatePrompt() {
  let modal = document.querySelector("#firstRoutineStatePrompt");
  if (modal) return modal;
  modal = document.createElement("section");
  modal.id = "firstRoutineStatePrompt";
  modal.className = "first-routine-state-prompt";
  modal.hidden = true;
  modal.setAttribute("aria-label", "Configuração inicial da rotina do bebê");
  modal.innerHTML = `
    <div class="first-routine-backdrop" data-first-routine-close="true"></div>
    <div class="first-routine-card" role="dialog" aria-modal="true" aria-labelledby="firstRoutineTitle">
      <button class="first-routine-close" type="button" data-first-routine-close="true" aria-label="Fechar">×</button>
      <span class="first-routine-kicker">Primeiro registro do dia</span>
      <strong id="firstRoutineTitle">Como ${escapeHtml(getBabyReference())} está agora?</strong>
      <p>Antes do primeiro cuidado, informe se começou acordado ou dormindo. Assim o relógio, o resumo e os gráficos nascem corretos.</p>
      <label class="first-routine-time-label">
        Horário de referência
        <input id="firstRoutineTimeInput" type="time" />
      </label>
      <div class="first-routine-actions">
        <button type="button" data-first-routine-mode="awake">☀️ Acordado desde esse horário</button>
        <button type="button" data-first-routine-mode="sleeping">🌙 Dormindo desde esse horário</button>
      </div>
      <button class="first-routine-now" type="button" data-first-routine-mode="now">Começar agora</button>
      <small>Essa pergunta aparece só no início do dia ou quando ainda não há registros.</small>
    </div>
  `;
  document.body.append(modal);
  modal.addEventListener("click", (event) => {
    const close = event.target.closest("[data-first-routine-close]");
    const action = event.target.closest("[data-first-routine-mode]");
    if (close) {
      try { localStorage.setItem(getFirstRoutinePromptKey(), "dismissed"); } catch {}
      closeFirstRoutineStatePrompt();
      return;
    }
    if (!action) return;
    const mode = action.dataset.firstRoutineMode || "now";
    if (mode === "now") {
      startRoutine("now", Date.now(), "Rotina iniciada agora");
      return;
    }
    const timestamp = parseFirstRoutineTimeValue(mode);
    if (!Number.isFinite(Number(timestamp))) return;
    startRoutine(mode, Number(timestamp), mode === "awake" ? "Primeiro estado informado" : "Sono inicial informado");
  });
  return modal;
}

function closeFirstRoutineStatePrompt() {
  const modal = document.querySelector("#firstRoutineStatePrompt");
  if (!modal) return;
  modal.hidden = true;
  document.body.classList.remove("first-routine-prompt-open");
}

function shouldShowFirstRoutineStatePrompt() {
  if (activeScreenName !== "today") return false;
  if (!isLoggedIn() || !hasFamilyAccess() || authAccessLoading) return false;
  if (getSelectedDayId() !== getCurrentDayId()) return false;
  if (state?.mode !== "idle") return false;
  if (todayHasPersistentRoutineContent()) return false;
  try {
    if (localStorage.getItem(getFirstRoutinePromptKey())) return false;
  } catch {}
  return true;
}

function scheduleFirstRoutineStatePrompt() {
  window.clearTimeout(window.__ninouFirstRoutinePromptTimer);
  window.__ninouFirstRoutinePromptTimer = window.setTimeout(() => {
    if (!shouldShowFirstRoutineStatePrompt()) return;
    const modal = ensureFirstRoutineStatePrompt();
    const input = modal.querySelector("#firstRoutineTimeInput");
    if (input && !input.value) input.value = formatTime(Date.now());
    const title = modal.querySelector("#firstRoutineTitle");
    if (title) title.textContent = `Como ${getBabyReference()} está agora?`;
    modal.hidden = false;
    document.body.classList.add("first-routine-prompt-open");
  }, 750);
}

function persistCrossDaySleepEvent(event = {}) {
  if (!event || !isSleepEvent(event)) return;
  const startDayId = getDayIdFromStart(event.start);
  const currentDayId = getSelectedDayId();
  if (!isDateId(startDayId) || startDayId === currentDayId) return;

  const originState = sanitizeDayStateForDay(familyDayStatesCache[startDayId] || loadLocalDayState(startDayId), startDayId, { preserveLive: true });
  const originEvents = Array.isArray(originState.events) ? originState.events : [];
  const withoutDuplicate = originEvents.filter((item) => item?.id !== event.id && getEventDisplayDedupeKey(item) !== getEventDisplayDedupeKey(event));
  const nextOriginState = stripLiveStateFromHistoricalDay(normalizeDayState({
    ...originState,
    events: dedupeEventsByDisplayKey([...withoutDuplicate, event]),
  }), startDayId);

  persistDayStateForDay(nextOriginState, startDayId);
  if (firebaseServices && cloudUser && hasFamilyAccess()) {
    void saveDayToCloud(startDayId, { silentRetry: true });
  }
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
    v75.75.67: Felipe e Maria usam e-mails próprios na mesma família do Francisco,
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

const familyInviteStorageBaseKey = "ninou.family.activeInvite.v75.75.67";
let familyActiveInvite = loadFamilyActiveInvite();

function getFamilyInviteTargetFamilyId(invite = null) {
  return normalizeFamilyId(invite?.familyId || getActiveClientFamilyId() || familyAccess?.familyId || "");
}

function getFamilyInviteStorageKey(familyId = getFamilyInviteTargetFamilyId()) {
  const normalizedFamilyId = normalizeFamilyId(familyId || "guest");
  return `${familyInviteStorageBaseKey}.${normalizedFamilyId || "guest"}`;
}

function loadFamilyActiveInvite(familyId = getFamilyInviteTargetFamilyId()) {
  try {
    const invite = JSON.parse(localStorage.getItem(getFamilyInviteStorageKey(familyId)) || "null");
    if (!invite || typeof invite !== "object") return null;
    const inviteFamilyId = normalizeFamilyId(invite.familyId || familyId || "");
    const currentFamilyId = normalizeFamilyId(familyId || "");
    if (currentFamilyId && inviteFamilyId && inviteFamilyId !== currentFamilyId) return null;
    return { ...invite, familyId: inviteFamilyId };
  } catch {
    return null;
  }
}

function saveFamilyActiveInvite(invite) {
  const targetFamilyId = getFamilyInviteTargetFamilyId(invite);
  familyActiveInvite = invite ? { ...invite, familyId: targetFamilyId || invite.familyId || "" } : null;
  try {
    const key = getFamilyInviteStorageKey(targetFamilyId);
    if (familyActiveInvite) localStorage.setItem(key, JSON.stringify(familyActiveInvite));
    else localStorage.removeItem(key);
  } catch {}
  renderFamilyActiveInvite();
}

function generateFamilyInviteCode() {
  return createInviteCode();
}

function getFamilyInviteMessage(code) {
  const babyName = getProfileFamilyBabyName();
  const target = babyName ? `do ${babyName}` : "do bebê";
  const invitedEmail = familyActiveInvite?.email ? `
E-mail convidado: ${familyActiveInvite.email}` : "";
  const link = code ? `
Link: ${buildInviteLink(code)}` : "";
  return `Você foi convidado(a) para acompanhar a rotina ${target} no Ninou.
Código de convite: ${code}${invitedEmail}${link}
Entre ou crie sua conta com o mesmo e-mail do convite. Assim você entra na família existente, sem criar outra família.`;
}

function renderFamilyActiveInvite() {
  const currentFamilyId = getFamilyInviteTargetFamilyId();
  const loadedInvite = loadFamilyActiveInvite(currentFamilyId);
  if (loadedInvite?.code !== familyActiveInvite?.code || loadedInvite?.familyId !== familyActiveInvite?.familyId) {
    familyActiveInvite = loadedInvite;
  }

  const invite = familyActiveInvite;
  const active = Boolean(invite?.code && (!invite.expiresAtClient || Number(invite.expiresAtClient) > Date.now()) && (!currentFamilyId || invite.familyId === currentFamilyId));
  const canInvite = canManageFamilyAccess();

  if (familyInviteForm) familyInviteForm.hidden = !canInvite;
  if (familyInviteEmailInput) familyInviteEmailInput.disabled = !canInvite;
  if (familyInviteRoleSelect) familyInviteRoleSelect.disabled = !canInvite;
  if (familyInviteFormHint) {
    familyInviteFormHint.textContent = canInvite
      ? "O convite fica preso a esta família, expira em 7 dias e tem uso único."
      : hasFamilyAccess()
        ? "Seu papel atual não permite criar convites. Peça a um responsável."
        : "Entre ou crie uma família para gerar convites.";
  }

  if (familyActiveInviteBox) familyActiveInviteBox.hidden = !active;
  if (familyInviteShareActions) familyInviteShareActions.hidden = !active;
  if (familyActiveInviteCode) familyActiveInviteCode.textContent = active ? invite.code : "—";
  if (familyActiveInviteHint) {
    const roleLabel = invite?.role ? getRoleLabel(invite.role) : "Cuidador";
    familyActiveInviteHint.textContent = active
      ? `${invite.email ? invite.email + " • " : ""}${roleLabel} • uso único • expira em 7 dias`
      : "Nenhum convite ativo";
  }
  if (familyPendingInviteList) {
    familyPendingInviteList.innerHTML = active
      ? `<li><strong>${escapeHtml(invite.email || "Convidado")}</strong><span>${escapeHtml(getRoleLabel(invite.role || "cuidador"))} • ${escapeHtml(invite.code)}</span></li>`
      : `<li>Nenhum convite familiar ativo neste aparelho.</li>`;
  }
}


async function createFamilyCaregiverInvite() {
  if (!canUsePrivateFeatures()) {
    if (loginHelper) loginHelper.textContent = "Entre em uma família para gerar convite de cuidador.";
    resetProfileFamilyCardsForGuest();
    return;
  }
  if (!canManageFamilyAccess()) {
    if (loginHelper) loginHelper.textContent = "Seu acesso permite registrar a rotina, mas não gerar convites familiares.";
    if (familyAccessSummaryInviteStatus) familyAccessSummaryInviteStatus.textContent = "Peça a um responsável para convidar novos cuidadores.";
    renderFamilyActiveInvite();
    return;
  }

  const familyId = getFamilyInviteTargetFamilyId();
  if (!familyId) {
    const message = "Crie ou entre em uma família antes de gerar convites.";
    if (loginHelper) loginHelper.textContent = message;
    if (familyAccessSummaryInviteStatus) familyAccessSummaryInviteStatus.textContent = message;
    return;
  }

  let invitedEmail = normalizeEmail(familyInviteEmailInput?.value || "");
  if (!invitedEmail && !familyInviteEmailInput) {
    invitedEmail = normalizeEmail(window.prompt("E-mail do cuidador convidado:", "") || "");
  }
  const role = normalizeInviteRole(familyInviteRoleSelect?.value || FAMILY_ROLE_CAREGIVER);

  if (!invitedEmail || !invitedEmail.includes("@")) {
    const message = "Informe o e-mail correto da pessoa convidada.";
    if (loginHelper) loginHelper.textContent = message;
    if (familyAccessSummaryInviteStatus) familyAccessSummaryInviteStatus.textContent = "Convite cancelado: faltou informar um e-mail válido.";
    familyInviteEmailInput?.focus();
    return;
  }
  if (normalizeEmail(cloudUser?.email || "") === invitedEmail) {
    const message = "Convite não criado: o e-mail informado já está conectado neste aparelho.";
    if (loginHelper) loginHelper.textContent = "Este e-mail já é a conta conectada. Use outro e-mail para convidar um cuidador.";
    if (familyAccessSummaryInviteStatus) familyAccessSummaryInviteStatus.textContent = message;
    return;
  }

  const code = generateFamilyInviteCode();
  const now = Date.now();
  const expiry = getInviteExpiryPayload(null, now);
  const actor = getCurrentActorProfile();
  const familyName = getProfileFamilyDisplayName();
  const link = buildInviteLink(code);
  const invite = {
    code,
    familyId,
    familyName,
    familyScopeType: getFamilyScopeType(familyId),
    email: invitedEmail,
    status: "pending",
    role,
    maxUses: INVITE_MAX_USES,
    useCount: 0,
    link,
    inviteVersion: NINOU_RUNTIME_VERSION,
    source: "family_profile",
    createdByUid: cloudUser?.uid || null,
    createdByEmail: normalizeEmail(cloudUser?.email || ""),
    createdByName: actor.label || actor.email || "Cuidador",
    createdAtClient: now,
    expiresAtClient: expiry.expiresAtClient,
  };

  saveFamilyActiveInvite(invite);
  if (familyAccessSummaryInviteStatus) familyAccessSummaryInviteStatus.textContent = `Convite criado para ${invitedEmail}. Copie o código ou envie pelo WhatsApp.`;

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
        link,
        source: "family_profile",
        familyName,
        familyScopeType: getFamilyScopeType(familyId),
        inviteVersion: NINOU_RUNTIME_VERSION,
        createdAt: services.serverTimestamp(),
        updatedAt: services.serverTimestamp(),
      };
      await services.setDoc(services.doc(services.db, "families", familyId, "invites", code), familyInvitePayload, { merge: true });
      await services.setDoc(services.doc(services.db, "families", familyId, "invitations", code), familyInvitePayload, { merge: true });
      await services.setDoc(services.doc(services.db, "invites", code), globalInvitePayload, { merge: true });
      await writeFamilyAuditLog("invite_created", { familyId, targetEmail: invitedEmail, role, code });
    }
    if (familyInviteEmailInput) familyInviteEmailInput.value = "";
  } catch (error) {
    console.warn("Não foi possível salvar o convite no Firebase:", error);
    saveFamilyActiveInvite(null);
    const message = error?.code === "permission-denied"
      ? "Sem permissão para salvar convite. Confira as regras do Firestore e o papel deste usuário na família."
      : "Não foi possível salvar o convite agora. Tente novamente em alguns segundos.";
    if (familyAccessSummaryInviteStatus) familyAccessSummaryInviteStatus.textContent = message;
    if (loginHelper) loginHelper.textContent = message;
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
  const currentCode = normalizeInviteCode(pendingInviteCode || inviteCodeInput?.value || "");
  if (joinInviteCodeInput) joinInviteCodeInput.value = currentCode;
  if (joinInviteFeedback) {
    joinInviteFeedback.textContent = isLoggedIn()
      ? "O convite será validado antes de liberar a rotina da família."
      : "Entre ou crie sua conta com o mesmo e-mail do convite antes de aceitar.";
  }
  if (joinFamilyModal) {
    joinFamilyModal.hidden = false;
    joinFamilyModal.setAttribute("aria-hidden", "false");
    setTimeout(() => joinInviteCodeInput?.focus(), 50);
    return;
  }
  showScreen("profile");
  setTimeout(() => inviteCodeInput?.focus(), 50);
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

  pendingInviteCode = code;
  try { localStorage.setItem(storageKeys.pendingInvite, code); } catch {}

  if (!cloudUser) {
    if (joinInviteFeedback) joinInviteFeedback.textContent = "Agora entre ou crie sua conta com o mesmo e-mail convidado. Depois confirme o código.";
    closeJoinFamilyModal();
    focusProfileAccess("login");
    return;
  }

  try {
    const services = await getFirebaseServices();
    if (!services?.db) throw new Error("Firebase indisponível");

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

    if (!familyId) {
      throw new Error("Convite não encontrado. Confira o código ou peça um novo convite ao responsável.");
    }

    const inviteRef = services.doc(services.db, "families", familyId, "invitations", code);
    const inviteSnap = await services.getDoc(inviteRef);
    if (inviteSnap.exists()) invite = { ...(invite || {}), ...(inviteSnap.data() || {}) };
    if (!inviteSnap.exists() && !invite) throw new Error("Convite não encontrado");
    if (invite.familyId && invite.familyId !== familyId) familyId = invite.familyId;
    if (!isInviteUsable({ ...invite, familyId })) throw new Error(isInviteExpired(invite) ? "Convite expirado" : "Convite inativo ou já utilizado");

    const inviteEmail = normalizeEmail(invite.email || "");
    const userEmail = normalizeEmail(cloudUser.email || "");
    if (hasFamilyAccess() && familyAccess?.familyId && familyId && familyAccess.familyId !== familyId) {
      throw new Error("Esta conta já está vinculada a outra família. Saia e limpe os dados deste aparelho antes de aceitar um convite diferente.");
    }
    if (inviteEmail && inviteEmail !== userEmail) throw new Error(`Este convite foi criado para ${inviteEmail}.`);

    const role = normalizeInviteRole(invite.role || FAMILY_ROLE_CAREGIVER);
    const accessPayload = {
      familyId,
      role,
      email: userEmail,
      ownerUid: invite.ownerUid || invite.createdByUid || invite.createdBy || "",
      inviteCode: code,
      joinedByInvite: code,
      roleVersion: NINOU_FAMILY_SCOPE_VERSION,
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
      await services.setDoc(services.doc(services.db, "families", familyId, "invites", code), acceptedPayload, { merge: true });
      await services.setDoc(services.doc(services.db, "invites", code), acceptedPayload, { merge: true });
      await writeFamilyAuditLog("invite_accepted", { familyId, targetEmail: userEmail, role, code });
    } catch (globalUpdateError) {
      console.warn("Convite aceito, mas o espelho global/familiar não foi atualizado:", globalUpdateError);
    }

    saveFamilyAccess({ ...accessPayload, acceptedAt: new Date().toISOString() });
    clearPendingInviteCode();
    if (inviteCodeInput) inviteCodeInput.value = "";
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
  const role = getEffectiveRole(familyAccess.role, cloudUser?.email || familyAccess?.email || "");
  if ([FAMILY_ROLE_GLOBAL_ADMIN, FAMILY_ROLE_OWNER, FAMILY_ROLE_ADMIN].includes(role)) return true;

  const text = String(actionText).toLowerCase();
  const familyManagement = /(convite|convidar|permiss|família|familia|membro|cuidador)/.test(text);
  const profileManagement = /(perfil|foto|avatar|peso|janela|exportar|backup|relatório|relatorio)/.test(text);
  const destructiveAction = /(excluir|zerar|limpar|apagar)/.test(text);
  const routineWrite = /(registrar|criar registros|editar registros|salvar registros|salvar a rotina|observações|observacoes|sono|mamada|mamadeira|fralda|medicamento)/.test(text);
  const readOnlyAction = /(ver|visualizar|acompanhar|abrir|consultar)/.test(text);

  if (role === FAMILY_ROLE_CAREGIVER) {
    return routineWrite && !familyManagement && !profileManagement && !destructiveAction;
  }

  if (role === FAMILY_ROLE_VIEWER) {
    return readOnlyAction && !routineWrite && !familyManagement && !profileManagement && !destructiveAction;
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
    loginHelper.textContent = `Sua conta precisa estar vinculada a uma família para ${actionText}. Crie sua família ou use um convite recebido.`;
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

function getRoleLabel(role = FAMILY_ROLE_ADMIN) {
  const labels = {
    [FAMILY_ROLE_GLOBAL_ADMIN]: "Administrador global",
    [FAMILY_ROLE_OWNER]: "Responsável principal",
    [FAMILY_ROLE_ADMIN]: "Admin familiar",
    [FAMILY_ROLE_CAREGIVER]: "Cuidador",
    [FAMILY_ROLE_VIEWER]: "Visualização",
  };
  return labels[normalizeRole(role)] || labels[FAMILY_ROLE_ADMIN];
}

function getRoleDescription(role = FAMILY_ROLE_ADMIN) {
  const descriptions = {
    [FAMILY_ROLE_GLOBAL_ADMIN]: "acessa o painel global de suporte e famílias",
    [FAMILY_ROLE_OWNER]: "controla a família, membros, convites, perfil, relatórios e rotina",
    [FAMILY_ROLE_ADMIN]: "gerencia perfil, rotina, membros, convites e relatórios da família",
    [FAMILY_ROLE_CAREGIVER]: "registra rotina, observações, mamadas, fraldas e sono",
    [FAMILY_ROLE_VIEWER]: "acompanha a rotina e relatórios sem alterar registros",
  };
  return descriptions[normalizeRole(role)] || descriptions[FAMILY_ROLE_ADMIN];
}

function getRoleShortDescription(role = FAMILY_ROLE_ADMIN) {
  const descriptions = {
    [FAMILY_ROLE_OWNER]: "dono da família",
    [FAMILY_ROLE_ADMIN]: "gerencia família",
    [FAMILY_ROLE_CAREGIVER]: "registra rotina",
    [FAMILY_ROLE_VIEWER]: "somente acompanha",
    [FAMILY_ROLE_GLOBAL_ADMIN]: "suporte global",
  };
  return descriptions[normalizeRole(role)] || descriptions[FAMILY_ROLE_ADMIN];
}

function getFamilyActionLabel(action = "") {
  const labels = {
    invite_created: "Convite criado",
    invite_accepted: "Convite aceito",
    invite_cancelled: "Convite cancelado",
    member_role_updated: "Permissão alterada",
    member_removed: "Membro removido",
    member_left: "Membro saiu da família",
    family_created: "Família criada",
  };
  return labels[String(action || "")] || "Alteração familiar";
}

function getAuditTimeLabel(value) {
  const millis = toMilliseconds(value);
  if (!millis) return "agora";
  try {
    return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }).format(new Date(millis));
  } catch {
    return "registro recente";
  }
}

function canCurrentUserLeaveFamily() {
  if (!hasFamilyAccess()) return false;
  if (isGlobalAppAdmin() && !window.__ninouAdminFamilyDataOpen) return false;
  const role = getEffectiveRole(familyAccess?.role || FAMILY_ROLE_VIEWER, cloudUser?.email || familyAccess?.email || "");
  return role !== FAMILY_ROLE_OWNER && role !== FAMILY_ROLE_GLOBAL_ADMIN;
}

async function writeFamilyAuditLog(action, details = {}) {
  try {
    if (!cloudUser || !hasFamilyAccess()) return false;
    const services = await getFirebaseServices();
    if (!services?.db) return false;
    const familyId = details.familyId || familyAccess?.familyId;
    if (!familyId) return false;
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    await services.setDoc(services.doc(services.db, "families", familyId, "audit", id), {
      action: String(action || "family_change"),
      actorUid: cloudUser.uid,
      actorEmail: normalizeEmail(cloudUser.email || familyAccess?.email || ""),
      actorName: getCurrentActorProfile().label || "Cuidador",
      targetUid: details.targetUid || "",
      targetEmail: normalizeEmail(details.targetEmail || ""),
      role: details.role ? normalizeRole(details.role) : "",
      code: details.code ? normalizeInviteCode(details.code) : "",
      message: details.message || "",
      createdAtClient: Date.now(),
      createdAt: services.serverTimestamp(),
    }, { merge: true });
    return true;
  } catch (error) {
    console.warn("Não foi possível registrar histórico familiar:", error);
    return false;
  }
}

function loadFamilyAccess() {
  try {
    const data = JSON.parse(localStorage.getItem(storageKeys.access) || "null");
    if (!data || typeof data !== "object" || !data.familyId) return null;
    return buildFamilyScopePayload(data);
  } catch {
    return null;
  }
}

function saveFamilyAccess(access, options = {}) {
  familyAccess = access?.familyId ? buildFamilyScopePayload(access) : null;

  if (familyAccess) {
    localStorage.setItem(storageKeys.access, JSON.stringify(familyAccess));
  } else {
    localStorage.removeItem(storageKeys.access);
  }

  if (options.render !== false) renderFamilyAccessPanel();
  try { exposeFamilyScopeForDebug(); } catch {}
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
  return normalizeFamilyId(`family-${base}-${token}`);
}

function createStablePersonalFamilyId(user = cloudUser, familyName = "", babyName = "") {
  const email = normalizeEmail(user?.email || "");
  const emailName = email.split("@")[0] || "familia";
  const base = slugifyFamilyText(babyName || familyName || emailName || "familia");
  const stableOwnerKey = String(user?.uid || email || base || "familia");
  const token = stableInviteToken(`personal-family|${stableOwnerKey}|${email}`)
    .slice(0, 6)
    .toLowerCase();
  return normalizeFamilyId(`family-${base}-${token}`);
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

function getActiveFamilyId(options = {}) {
  return getResolvedFamilyScope(options).familyId || "";
}

function exposeFamilyScopeForDebug() {
  try {
    window.__ninouFamilyScope = {
      version: NINOU_FAMILY_SCOPE_VERSION,
      active: getResolvedFamilyScope(),
      client: getResolvedFamilyScope({ allowAdminSelection: false, allowLegacyFallback: false }),
      familyPath: getFamilyCollectionPath(),
      franciscoFamilyId: NINOU_FRANCISCO_FAMILY_ID,
      storageScope: getActiveDataScope().storageScope,
      profileKey: getScopedProfileStorageKey(),
      weightsKey: getScopedWeightsStorageKey(),
      commercialReadiness: {
        version: NINOU_RUNTIME_VERSION,
        status: "beta-candidato",
        requiredBeforePublic: ["publicar-firestore-rules", "testar-dispositivos", "politica-privacidade", "termos-uso", "suporte", "exclusao-dados"],
      },
    };
  } catch {}
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
  if (noteDayId) return noteDayId === safeDayId ? note : "";

  const explicitDayId = getExplicitDayIdFromState(sourceState);
  if (explicitDayId) return explicitDayId === safeDayId ? note : "";

  // Somente caches realmente antigos, sem qualquer marcador de dia, passam pela
  // heurística de repetição. Observações atuais podem legitimamente se repetir.
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
    const rawNoteHasDayScope = isDateId(rawState?.dayNotesDayId) || isDateId(getExplicitDayIdFromState(rawState));

    // A deduplicação por texto é mantida apenas para caches muito antigos e sem data.
    // Notas atuais com o mesmo conteúdo em dias diferentes são válidas e não podem sumir.
    if (noteKey && !rawNoteHasDayScope) {
      if (firstLegacyNoteDayByText.has(noteKey)) {
        normalized = normalizeDayState({
          ...normalized,
          dayNotes: "",
          dayNotesDayId: "",
          dayNotesUpdatedAt: 0,
        });
      } else {
        firstLegacyNoteDayByText.set(noteKey, dayId);
      }
    }

    if (noteKey && normalized.dayNotes) {
      normalized = normalizeDayState({
        ...normalized,
        dayNotesDayId: dayId,
        dayNotesUpdatedAt: normalized.dayNotesUpdatedAt || normalized.clientUpdatedAt || 0,
      });
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
    const carriedRoutine = getRoutineCarryFromEventsAcrossMidnight(safeDayId, nextState, Date.now());
    if (carriedRoutine && Number.isFinite(Number(carriedRoutine.start))) {
      return normalizeDayState({
        ...nextState,
        mode: carriedRoutine.mode === "sleeping" ? "sleeping" : "awake",
        activeStartedAt: Number(carriedRoutine.start),
        activeType: carriedRoutine.type || (carriedRoutine.mode === "sleeping" ? "sono" : "acordou"),
        activeDetail: carriedRoutine.detail || (Number(carriedRoutine.start) < getDayStartFromId(safeDayId) ? "Continuado de ontem" : ""),
        activeNotes: carriedRoutine.notes || "",
      });
    }

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
  return hasFamilyAccess() && isFamilyManagerRole(familyAccess?.role, cloudUser?.email || familyAccess?.email || "");
}

function buildGlobalAdminAccess(user = cloudUser, familyId = getActiveAdminFamilyId()) {
  if (!user || !isGlobalAppAdmin(user)) return null;
  return {
    familyId: normalizeFamilyId(familyId || APP_ADMIN_FAMILY_ID),
    role: "admin",
    email: user.email || GLOBAL_APP_ADMIN_EMAIL,
    ownerUid: user.uid,
    accessMode: "support",
    acceptedAt: new Date().toISOString(),
  };
}

function isInternalAdminFamily(familyId = "", data = {}) {
  const id = String(familyId || "").trim();
  const type = String(data.familyType || data.type || "").trim().toLowerCase();
  const label = String(data.customerLabel || data.subtitle || "").trim().toLowerCase();
  return id === APP_ADMIN_FAMILY_ID
    || data.internalAdminFamily === true
    || data.supportOnly === true
    || data.accessMode === "support"
    || type === "internal_admin"
    || label.includes("área técnica")
    || label.includes("area tecnica")
    || label.includes("admin interno");
}

function ensureGlobalAdminAccess(user = cloudUser, familyId = getActiveAdminFamilyId(), options = {}) {
  const selectedFamily = saveSelectedAdminFamilyId(familyId);
  const access = buildGlobalAdminAccess(user, selectedFamily);
  if (!access) return null;
  return saveFamilyAccess(access, options);
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
  renderAdminCommercialDashboard(null);
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
    adminMigrationSources.innerHTML = "<li class=\"polished-admin-empty\">Nenhuma conta em análise. Use busca por e-mail ou UID apenas quando necessário.</li>";
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
  const migrationFamilyId = normalizeFamilyId(context.destinationFamilyId || getSelectedFamilyIdForAdminOrAccess() || getActiveFamilyMetadata().familyId || "");
  const wakeWindowValueForMigration = String(context.wakeWindow || 70);

  if (migrationFamilyId) {
    localStorage.setItem(getScopedProfileStorageKey(migrationFamilyId), JSON.stringify({
      ...migratedProfile,
      familyId: migrationFamilyId,
      familyScopeVersion: NINOU_FAMILY_SCOPE_VERSION,
    }));
    localStorage.setItem(getScopedWakeWindowStorageKey(migrationFamilyId), wakeWindowValueForMigration);
    localStorage.setItem(getScopedProfileVersionStorageKey(migrationFamilyId), String(Date.now()));
    localStorage.setItem(getScopedWeightsStorageKey(migrationFamilyId), JSON.stringify(migratedWeights));
  }

  // Compatibilidade visual: mantém o cache legado apenas para a tela já aberta,
  // mas a leitura normal das famílias passa a usar as chaves escopadas acima.
  localStorage.setItem(storageKeys.profile, JSON.stringify(migratedProfile));
  localStorage.removeItem(storageKeys.photo);
  localStorage.setItem(storageKeys.wakeWindow, wakeWindowValueForMigration);
  localStorage.setItem(storageKeys.profileVersion, String(Date.now()));
  localStorage.setItem(storageKeys.weights, JSON.stringify(migratedWeights));

  const todayId = getCurrentDayId();
  const dayIds = Object.keys(context.dayStates || {}).filter(isDateId).sort();
  const latestDayId = dayIds.at(-1);
  const visibleDayId = (context.dayStates || {})[todayId] ? todayId : latestDayId;
  const currentDayState = (context.dayStates || {})[visibleDayId] || createEmptyDayState();
  const currentDayPayload = { ...normalizeDayState(currentDayState), dayId: visibleDayId || todayId, clientUpdatedAt: Date.now() };
  localStorage.setItem(storageKeys.dayState, JSON.stringify(currentDayPayload));
  if (visibleDayId) {
    localStorage.setItem(getLocalDayStateStorageKey(visibleDayId), JSON.stringify(currentDayPayload));
    if (migrationFamilyId) localStorage.setItem(getLocalDayStateStorageKey(visibleDayId, migrationFamilyId), JSON.stringify({ ...currentDayPayload, familyId: migrationFamilyId, familyScopeVersion: NINOU_FAMILY_SCOPE_VERSION }));
  }
  Object.entries(context.dayStates || {}).forEach(([dayId, dayState]) => {
    if (!isDateId(dayId)) return;
    const dayPayload = {
      ...normalizeDayState(dayState),
      dayId,
      date: dayId,
      clientUpdatedAt: Date.now(),
    };
    localStorage.setItem(getLocalDayStateStorageKey(dayId), JSON.stringify(dayPayload));
    if (migrationFamilyId) localStorage.setItem(getLocalDayStateStorageKey(dayId, migrationFamilyId), JSON.stringify({ ...dayPayload, familyId: migrationFamilyId, familyScopeVersion: NINOU_FAMILY_SCOPE_VERSION }));
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
  const role = FAMILY_ROLE_ADMIN;
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
  const familyId = normalizeFamilyId(getSelectedFamilyIdForAdminOrAccess());
  if (!familyId) throw new Error("Selecione uma família antes de migrar os dados.");
  const isFranciscoTarget = isFranciscoFamilyId(familyId);
  const sourceLabel = context.source === "cloud" ? `users/${context.uid || context.email}` : `cache/${context.email}`;
  const migrationId = `${Date.now()}-${String(context.uid || context.email || "origem").replace(/[^a-z0-9]+/gi, "-").slice(0, 32)}`;
  const normalizedWeights = normalizeWeights(context.weights || context.profile?.weights || []);
  const normalizedProfile = normalizeBabyProfile({
    ...(context.profile || createDefaultBabyProfile()),
    weights: normalizedWeights,
  });

  await services.setDoc(services.doc(services.db, "families", familyId), {
    familyId,
    ...(isFranciscoTarget ? buildFranciscoFamilyBasePayload(services) : {
      title: normalizedProfile.name || "Família selecionada",
      name: normalizedProfile.name ? `Família do ${normalizedProfile.name}` : "Família selecionada",
      babyName: normalizedProfile.name || "",
      babyArticle: normalizedProfile.article || "do",
      customerLabel: "Família cadastrada",
      familyType: "client",
      status: "active",
      appVersion: NINOU_RUNTIME_VERSION,
    }),
    ownerUid: isGlobalAppAdmin() ? (cloudUser.uid || "") : (familyAccess?.ownerUid || cloudUser.uid || ""),
    ownerEmail: cloudUser.email || "",
    latestMigratedDayId: Object.keys(context.dayStates || {}).filter(isDateId).sort().at(-1) || "",
    migratedDayIds: Object.keys(context.dayStates || {}).filter(isDateId).sort(),
    migrationVersion: NINOU_RUNTIME_VERSION,
    lastMigrationAt: services.serverTimestamp(),
    updatedAt: services.serverTimestamp(),
  }, { merge: true });

  const linkedSourceAccount = await linkMigrationSourceAccountToFamily(context, familyId, sourceLabel);

  if (context.profile || normalizedWeights.length) {
    await services.setDoc(services.doc(services.db, "families", familyId, "profile", "main"), {
      ...normalizedProfile,
      name: isFranciscoTarget ? NINOU_FRANCISCO_BABY_NAME : normalizedProfile.name,
      article: isFranciscoTarget ? NINOU_FRANCISCO_BABY_ARTICLE : normalizedProfile.article,
      familyId,
      familyScopeVersion: NINOU_FAMILY_SCOPE_VERSION,
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
      familyId,
      familyScopeVersion: NINOU_FAMILY_SCOPE_VERSION,
      dayId,
      date: dayId,
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
    markCloudSyncPending(error);
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
      : "<li class=\"polished-admin-empty\">Nenhuma conta com e-mail válido para revisão no momento.</li>";
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
    : (appAdmin ? [] : [{
        id: selectedId,
        name: stats?.familyName || "Família selecionada",
        subtitle: "Família cadastrada",
        membersCount: stats?.membersCount ?? 0,
        pendingInvitesCount: stats?.pendingInvitesCount ?? 0,
      }]);

  if (adminClientsList) {
    if (!appAdmin) {
      const family = families[0] || { id: familyAccess?.familyId || "", name: stats?.familyName || getProfileFamilyDisplayName?.() || "Minha família", subtitle: "Acesso familiar", membersCount: stats?.membersCount ?? 0, pendingInvitesCount: stats?.pendingInvitesCount ?? 0 };
      adminClientsList.innerHTML = `
        <li class="admin-access-item admin-client-item is-selected-family">
          <img class="admin-avatar family-avatar" src="${getCaregiverAvatarDataUrl(family.name || "Família", family.id || "family", "family")}" alt="" />
          <div>
            <strong>${escapeHtml(family.name || "Minha família")}</strong>
            <span>Diagnóstico restrito a esta família • ${escapeHtml(pluralize(Number(family.membersCount || 0), "membro", "membros"))} • ${escapeHtml(getPendingInviteText(Number(family.pendingInvitesCount || 0)))}</span>
            <small>Nenhuma outra família é listada para este acesso.</small>
          </div>
        </li>`;
    } else if (!families.length) {
      adminClientsList.innerHTML = `
        <li class="admin-access-item admin-client-item admin-empty-client-list">
          <img class="admin-avatar family-avatar" src="${getCaregiverAvatarDataUrl("Ninou", "empty-family", "family")}" alt="" />
          <div>
            <strong>Nenhuma família de cliente cadastrada</strong>
            <span>A família técnica do admin não entra nesta contagem.</span>
            <small>Use “Criar família” para preparar o primeiro acesso real.</small>
          </div>
        </li>`;
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
    adminSelectedFamilyHint.textContent = appAdmin
      ? (previewOpen
        ? `Você está visualizando a rotina de ${selectedLabel} como administrador global. Use Voltar ao painel para sair da visualização familiar.`
        : `Família selecionada: ${selectedLabel}. A rotina só abre quando você tocar em Abrir rotina.`)
      : `Diagnóstico restrito a ${selectedLabel}. Uma família comum não visualiza dados de outras famílias.`;
  }

  if (adminOpenFamilyButton) {
    adminOpenFamilyButton.hidden = !appAdmin;
    adminOpenFamilyButton.disabled = !appAdmin || previewOpen;
    adminOpenFamilyButton.textContent = previewOpen ? "Rotina aberta" : "Abrir rotina";
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
      adminPendingInviteList.innerHTML = "<li class=\"polished-admin-empty\">Nenhum convite pendente no momento.</li>";
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
      adminMembersList.innerHTML = "<li class=\"polished-admin-empty\">Nenhum membro autorizado ainda. Convide ou vincule um cuidador para compartilhar a rotina.</li>";
    } else {
      adminMembersList.innerHTML = members.slice(0, 12).map((member) => {
        const uid = escapeHtml(member.uid || "");
        const email = escapeHtml(member.email || "Usuário sem e-mail");
        const role = normalizeRole(member.role || FAMILY_ROLE_VIEWER);
        const protectedMember = !member.uid || isGlobalAdminEmail(member.email || "") || role === FAMILY_ROLE_OWNER;
        return `
        <li class="admin-access-item admin-member-item">
          <img class="admin-avatar member-avatar" src="${getCaregiverAvatarDataUrl(member.email || "Membro", member.uid || member.email || "member", "member")}" alt="" />
          <div>
            <strong>${email}</strong>
            <span>${escapeHtml(getRoleLabel(role))} — ${escapeHtml(getRoleDescription(role))}</span>
          </div>
          <div class="admin-access-actions member-permission-actions">
            <label class="member-role-select-label">
              <span>Permissão</span>
              <select data-member-role-select="${uid}" ${protectedMember ? "disabled" : ""}>
                ${[FAMILY_ROLE_ADMIN, FAMILY_ROLE_CAREGIVER, FAMILY_ROLE_VIEWER].map((option) => `<option value="${option}" ${role === option ? "selected" : ""}>${escapeHtml(getRoleLabel(option))}</option>`).join("")}
              </select>
            </label>
            <button type="button" data-update-member-role="${uid}" ${protectedMember ? "disabled" : ""}>Salvar permissão</button>
            <button type="button" class="danger-soft-button" data-remove-member="${uid}" data-remove-member-email="${email}" ${protectedMember ? "disabled" : ""}>Remover</button>
          </div>
        </li>`;
      }).join("");
    }
  }

  if (adminFamilyAuditList) {
    const audit = Array.isArray(stats?.familyAudit) ? stats.familyAudit : [];
    if (!audit.length) {
      adminFamilyAuditList.innerHTML = "<li class=\"polished-admin-empty\">Nenhuma alteração familiar registrada ainda.</li>";
    } else {
      adminFamilyAuditList.innerHTML = audit.slice(0, 12).map((item) => `
        <li class="admin-access-item admin-audit-item">
          <div>
            <strong>${escapeHtml(getFamilyActionLabel(item.action))}</strong>
            <span>${escapeHtml(item.targetEmail || item.code || item.message || "Família")}</span>
            <small>${escapeHtml(item.actorEmail || "Sistema")} • ${escapeHtml(getAuditTimeLabel(item.createdAtClient || item.createdAt))}</small>
          </div>
        </li>`).join("");
    }
  }

  renderKnownUsersList(stats);
}


function buildAdminIntegritySnapshot({ familyId = "", familySummaries = [], members = [], pendingInvites = [], knownUsers = [], familyData = {}, familyProfileData = {} } = {}) {
  const visibleMembers = (members || []).filter((member) => !member.isAdmin);
  const duplicateEmailCount = (() => {
    const counts = new Map();
    (knownUsers || []).forEach((user) => {
      const email = normalizeEmail(user.email || "");
      if (!email) return;
      counts.set(email, (counts.get(email) || 0) + 1);
    });
    return Array.from(counts.values()).filter((count) => count > 1).length;
  })();
  const emptyFamilies = (familySummaries || []).filter((family) => (
    family.id !== familyId
    && Number(family.membersCount || 0) === 0
    && Number(family.pendingInvitesCount || 0) === 0
  )).length;
  const selectedHasProfile = Boolean(familyProfileData?.name || familyProfileData?.familyName || familyData?.name || familyData?.title);
  const usersWithoutLink = (knownUsers || []).filter((user) => (
    user.email
    && !user.isAppAdmin
    && !user.hasFamilyAccess
    && !user.hasPendingInvite
  )).length;

  const expiredPendingInvites = (pendingInvites || []).filter((invite) => invite.expired || isInviteExpired(invite)).length;
  const hasActiveMember = visibleMembers.length > 0;
  const hasFamilyId = Boolean(familyId);

  return {
    hasFamilyId,
    selectedHasProfile,
    hasActiveMember,
    visibleMembersCount: visibleMembers.length,
    pendingInvitesCount: pendingInvites.length,
    expiredPendingInvites,
    duplicateEmailCount,
    emptyFamilies,
    usersWithoutLink,
    hasWarning: Boolean(!hasFamilyId || !selectedHasProfile || duplicateEmailCount || emptyFamilies || usersWithoutLink || expiredPendingInvites),
  };
}

function formatAdminIntegrityLabel(integrity = latestAdminStats?.integrity || {}) {
  if (!integrity) return "—";
  const warnings = [];
  if (!integrity.hasFamilyId) warnings.push("sem família selecionada");
  if (!integrity.selectedHasProfile) warnings.push("perfil ausente");
  if (integrity.expiredPendingInvites) warnings.push(`${integrity.expiredPendingInvites} convite expirado`);
  if (integrity.duplicateEmailCount) warnings.push(`${integrity.duplicateEmailCount} e-mail duplicado`);
  if (integrity.emptyFamilies) warnings.push(`${integrity.emptyFamilies} família vazia`);
  if (integrity.usersWithoutLink) warnings.push(`${integrity.usersWithoutLink} conta sem vínculo`);
  return warnings.length ? warnings.join(" • ") : "OK";
}


function getAdminCommercialActivityMillis(value = {}) {
  if (!value || typeof value !== "object") return toMilliseconds(value);
  return Math.max(
    Number(value.lastActivityAtClient || 0),
    Number(value.lastEventAtClient || 0),
    Number(value.updatedAtClient || 0),
    Number(value.createdAtClient || 0),
    toMilliseconds(value.lastActivityAt),
    toMilliseconds(value.lastEventAt),
    toMilliseconds(value.updatedAt),
    toMilliseconds(value.createdAt),
  );
}

function getAdminCommercialActivityLabel(value = 0) {
  const millis = Number(value || 0);
  if (!millis) return "Sem atividade";
  const diff = Date.now() - millis;
  if (diff < 0) return "Agora";
  if (diff < 60 * 60000) return "Há poucos minutos";
  if (diff < day) return `Há ${Math.max(1, Math.round(diff / 3600000))}h`;
  const days = Math.max(1, Math.round(diff / day));
  if (days <= 30) return `Há ${days} ${days === 1 ? "dia" : "dias"}`;
  try { return new Date(millis).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }); } catch { return "Data registrada"; }
}

function getAdminCommercialFamilyStatus(family = {}) {
  const last = Number(family.lastActivityAt || 0);
  if (!last) return { label: "Sem atividade", tone: "neutral" };
  const diff = Date.now() - last;
  if (diff <= 14 * day) return { label: "Ativa", tone: "good" };
  if (diff <= 45 * day) return { label: "Acompanhar", tone: "warn" };
  return { label: "Inativa", tone: "quiet" };
}

function renderAdminCommercialDashboard(stats = null) {
  if (!adminCommercialDashboard && !adminFamilyMonitorList) return;
  const appAdmin = isGlobalAppAdmin();
  const families = Array.isArray(stats?.families) ? stats.families : [];
  const selectedId = getActiveAdminFamilyId();
  const selectedFamily = families.find((family) => family.id === selectedId) || null;
  const activeCount = Number(stats?.activeFamiliesCount || 0);
  const totalMembers = Number(stats?.totalMembersCount ?? stats?.membersCount ?? 0);
  const globalPending = Number(stats?.globalPendingInvitesCount ?? stats?.pendingInvitesCount ?? 0);
  const selectedLast = Number(stats?.selectedLastActivityAt || selectedFamily?.lastActivityAt || 0);

  setText(adminCommercialActiveFamilies, appAdmin ? String(activeCount) : "1");
  setText(adminCommercialTotalMembers, String(totalMembers || 0));
  setText(adminCommercialGlobalPendingInvites, String(globalPending || 0));
  setText(adminCommercialLastActivity, getAdminCommercialActivityLabel(selectedLast));

  if (adminCommercialInsight) {
    if (!stats) {
      adminCommercialInsight.textContent = "Atualize o painel para carregar a visão comercial.";
    } else if (appAdmin) {
      const activeText = pluralize(activeCount, "família ativa", "famílias ativas");
      const familyText = pluralize(families.length, "família cadastrada", "famílias cadastradas");
      adminCommercialInsight.textContent = `${familyText}, ${activeText}, ${pluralize(globalPending, "convite pendente", "convites pendentes")} e ${pluralize(totalMembers, "membro mapeado", "membros mapeados")}.`;
    } else {
      adminCommercialInsight.textContent = "Visão restrita à família conectada. Usuários comuns não visualizam outras famílias.";
    }
  }

  if (!adminFamilyMonitorList) return;
  if (!stats) {
    adminFamilyMonitorList.innerHTML = "<li class=\"polished-admin-empty\">Atualize o painel para carregar o monitor de famílias.</li>";
    return;
  }
  if (!appAdmin) {
    adminFamilyMonitorList.innerHTML = `
      <li class="admin-access-item admin-family-monitor-item is-selected-family">
        <img class="admin-avatar family-avatar" src="${getCaregiverAvatarDataUrl(stats.familyName || "Família", selectedId || "family", "family")}" alt="" />
        <div>
          <strong>${escapeHtml(stats.familyName || "Minha família")}</strong>
          <span>Ambiente familiar isolado • ${escapeHtml(pluralize(Number(stats.membersCount || 0), "membro", "membros"))} • ${escapeHtml(getPendingInviteText(Number(stats.pendingInvitesCount || 0)))}</span>
          <small>Somente dados desta família aparecem para este acesso.</small>
        </div>
      </li>`;
    return;
  }
  if (!families.length) {
    adminFamilyMonitorList.innerHTML = "<li class=\"polished-admin-empty\">Nenhuma família comercial cadastrada ainda.</li>";
    return;
  }
  adminFamilyMonitorList.innerHTML = families.slice(0, 12).map((family) => {
    const status = getAdminCommercialFamilyStatus(family);
    const membersLabel = Number.isFinite(Number(family.membersCount)) ? pluralize(Number(family.membersCount), "membro", "membros") : "membros sob consulta";
    const pendingLabel = Number.isFinite(Number(family.pendingInvitesCount)) ? getPendingInviteText(Number(family.pendingInvitesCount)) : "convites sob consulta";
    const selected = family.id === selectedId;
    return `
      <li class="admin-access-item admin-family-monitor-item ${selected ? "is-selected-family" : ""}" data-commercial-status="${escapeHtml(status.tone)}">
        <img class="admin-avatar family-avatar" src="${getCaregiverAvatarDataUrl(family.name || "Família", family.id || "family", "family")}" alt="" />
        <div>
          <strong>${escapeHtml(family.name || "Família sem nome")}</strong>
          <span>${escapeHtml(status.label)} • ${escapeHtml(membersLabel)} • ${escapeHtml(pendingLabel)}</span>
          <small>${escapeHtml(family.subtitle || "Família cadastrada")} • última atividade: ${escapeHtml(getAdminCommercialActivityLabel(family.lastActivityAt))}</small>
        </div>
        <div class="admin-access-actions">
          ${selected ? "<small>Selecionada</small>" : `<button type="button" data-select-admin-family="${escapeHtml(family.id)}">Selecionar</button>`}
          <button type="button" data-open-admin-family="${escapeHtml(family.id)}">Abrir rotina</button>
        </div>
      </li>`;
  }).join("");
}

function renderAdminStats(stats = null) {
  latestAdminStats = stats || null;
  if (!adminPendingInvitesCount && !adminFamiliesCount && !adminKnownUsersStat) {
    renderAdminDiagnostics();
    return;
  }

  if (!stats) {
    setAdminStatsPlaceholder();
    renderAdminClients(null);
    renderAdminCommercialDashboard(null);
    renderAdminAccessLists(null);
    renderAdminDiagnostics();
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
    `${pluralize(stats.familiesCount ?? 0, "família de cliente cadastrada", "famílias de clientes cadastradas")}. ${pluralize(stats.membersCount ?? 0, "membro", "membros")} na família selecionada e ${pluralize(stats.knownUsersCount ?? 0, "conta válida para revisão", "contas válidas para revisão")}.`,
  );
  renderAdminClients(stats);
  renderAdminCommercialDashboard(stats);
  renderAdminAccessLists(stats);
  renderFamilyMigrationPanel();
  renderAdminDiagnostics();
}

async function refreshAdminStats(options = {}) {
  if (!isFamilyAdmin()) {
    renderAdminStats(null);
    return null;
  }

  if (isGlobalAppAdmin()) ensureGlobalAdminAccess(cloudUser, getActiveAdminFamilyId(), { render: false });

  const requestId = ++adminStatsRequestId;
  if (!options.silent) setAdminStatsPlaceholder("Atualizando painel...");
  if (refreshAdminStatsButton) refreshAdminStatsButton.disabled = true;

  try {
    const services = await getFirebaseServices();
    const familyId = getSelectedFamilyIdForAdminOrAccess();
    const appAdmin = isGlobalAppAdmin();
    const emptySnapshot = { docs: [], forEach() {} };
    if (!familyId) {
      setAdminStatsPlaceholder("Entre em uma família antes de abrir o diagnóstico familiar.");
      renderAdminStats(null);
      return null;
    }
    const [membersSnapshot, globalInvitesSnapshot, familiesSnapshot, familySnap, familyProfileSnap, familyAuditSnapshot, usersSnapshot, accessSnapshot, accountSnapshot, profileSnapshot] = await Promise.all([
      services.getDocs(services.collection(services.db, "families", familyId, "members")),
      appAdmin
        ? services.getDocs(services.collection(services.db, "invites"))
        : services.getDocs(services.collection(services.db, "families", familyId, "invitations")),
      appAdmin ? services.getDocs(services.query(services.collection(services.db, "families"), services.limit(50))) : Promise.resolve(emptySnapshot),
      services.getDoc(services.doc(services.db, "families", familyId)),
      services.getDoc(services.doc(services.db, "families", familyId, "profile", "main")),
      services.getDocs(services.query(services.collection(services.db, "families", familyId, "audit"), services.limit(40))),
      appAdmin ? services.getDocs(services.query(services.collection(services.db, "users"), services.limit(80))) : Promise.resolve(emptySnapshot),
      appAdmin && services.collectionGroup ? services.getDocs(services.query(services.collectionGroup(services.db, "access"), services.limit(120))) : Promise.resolve(emptySnapshot),
      appAdmin && services.collectionGroup ? services.getDocs(services.query(services.collectionGroup(services.db, "account"), services.limit(120))) : Promise.resolve(emptySnapshot),
      appAdmin && services.collectionGroup ? services.getDocs(services.query(services.collectionGroup(services.db, "profile"), services.limit(120))) : Promise.resolve(emptySnapshot),
    ]);

    const members = [];
    const memberUidSet = new Set();
    const memberEmailSet = new Set();
    membersSnapshot.forEach((memberDoc) => {
      const data = memberDoc.data() || {};
      if ((data.status || "active") === "removed") return;
      const email = normalizeEmail(data.email || "");
      const role = getEffectiveRole(data.role || FAMILY_ROLE_VIEWER, email);
      const isAdminMember = isGlobalAdminEmail(email) || role === FAMILY_ROLE_GLOBAL_ADMIN;
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
    const globalPendingInvites = [];
    const pendingInvitesByFamily = new Map();
    globalInvitesSnapshot.forEach((inviteDoc) => {
      const data = inviteDoc.data() || {};
      const inviteFamilyId = String(data.familyId || familyId || "");
      const emailKey = normalizeEmail(data.email || inviteDoc.id);
      const status = String(data.status || "pending").toLowerCase();
      const invite = {
        code: data.code || inviteDoc.id,
        email: emailKey,
        familyId: inviteFamilyId,
        role: normalizeInviteRole(data.role || FAMILY_ROLE_ADMIN),
        status,
        expiresAt: data.expiresAt || null,
        expiresAtClient: Number(data.expiresAtClient || 0),
        createdAtClient: Number(data.createdAtClient || 0),
        expired: isInviteExpired(data),
      };
      if (inviteFamilyId && status === "pending" && !invite.expired) {
        if (!pendingInvitesByFamily.has(inviteFamilyId)) pendingInvitesByFamily.set(inviteFamilyId, []);
        pendingInvitesByFamily.get(inviteFamilyId).push(invite);
        globalPendingInvites.push(invite);
      }
      if (inviteFamilyId !== familyId) return;
      if (emailKey) invitedEmails.add(emailKey);
      if (status === "accepted" || status === "active") {
        acceptedEmails.add(emailKey);
        pendingMap.delete(emailKey);
      } else if (status === "pending" && !pendingMap.has(emailKey)) {
        pendingMap.set(emailKey, invite);
      }
    });

    acceptedEmails.forEach((email) => pendingMap.delete(email));
    const pendingInvites = Array.from(pendingMap.values()).filter((invite) => invite.email);
    const familyAudit = [];
    familyAuditSnapshot.forEach((auditDoc) => {
      familyAudit.push({ id: auditDoc.id, ...(auditDoc.data() || {}) });
    });
    familyAudit.sort((a, b) => Number(toMilliseconds(b.createdAtClient || b.createdAt) || 0) - Number(toMilliseconds(a.createdAtClient || a.createdAt) || 0));

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
    invitedEmails.forEach((email) => addKnownUser("", { email, familyId }, "invite", appAdmin ? `invites/${email}` : `families/${familyId}/invitations/${email}`));

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
      if (isInternalAdminFamily(familyDoc.id, data)) return;
      const familyPendingCount = pendingInvitesByFamily.has(familyDoc.id)
        ? pendingInvitesByFamily.get(familyDoc.id).length
        : (Number.isFinite(Number(data.pendingInvitesCount)) ? Number(data.pendingInvitesCount) : null);
      familySummaries.push({
        id: familyDoc.id,
        name: profile.name || data.name || data.title || `Família ${familyDoc.id.slice(0, 8)}`,
        subtitle: data.customerLabel || data.subtitle || "Família cadastrada",
        membersCount: familyDoc.id === familyId ? members.filter((member) => !member.isAdmin).length : (Number.isFinite(Number(data.membersCount)) ? Number(data.membersCount) : null),
        pendingInvitesCount: familyDoc.id === familyId ? pendingInvites.length : familyPendingCount,
        lastActivityAt: getAdminCommercialActivityMillis({ ...data, ...profile }),
      });
    });
    if (!isInternalAdminFamily(familyId, familyData) && !familySummaries.some((family) => family.id === familyId)) {
      familySummaries.unshift({ id: familyId, name: familyName, subtitle: "Família cadastrada", membersCount: members.filter((member) => !member.isAdmin).length, pendingInvitesCount: pendingInvites.length, lastActivityAt: getAdminCommercialActivityMillis({ ...familyData, ...familyProfileData }) });
    }
    familySummaries.sort((a, b) => Number(b.id === familyId) - Number(a.id === familyId) || String(a.name).localeCompare(String(b.name)));

    const visibleMembers = members.filter((member) => !member.isAdmin);
    const selectedAuditLastActivity = familyAudit.reduce((latest, item) => Math.max(latest, getAdminCommercialActivityMillis(item)), 0);
    const selectedLastActivityAt = Math.max(getAdminCommercialActivityMillis({ ...familyData, ...familyProfileData }), selectedAuditLastActivity);
    familySummaries.forEach((family) => {
      if (family.id === familyId) family.lastActivityAt = Math.max(Number(family.lastActivityAt || 0), selectedLastActivityAt);
    });
    const commercialActiveCutoff = Date.now() - 14 * day;
    const activeFamiliesCount = familySummaries.filter((family) => Number(family.lastActivityAt || 0) >= commercialActiveCutoff).length;
    const totalMembersCount = familySummaries.reduce((total, family) => total + (Number.isFinite(Number(family.membersCount)) ? Number(family.membersCount) : 0), 0);
    const stats = {
      familyName,
      familyData,
      families: familySummaries,
      members,
      pendingInvites,
      globalPendingInvites,
      familyAudit,
      knownUsers,
      familiesCount: familySummaries.length,
      membersCount: visibleMembers.length,
      totalMembersCount: totalMembersCount || visibleMembers.length,
      activeFamiliesCount,
      selectedLastActivityAt,
      pendingInvitesCount: pendingInvites.length,
      globalPendingInvitesCount: isGlobalAppAdmin() ? globalPendingInvites.length : pendingInvites.length,
      acceptedInvitesCount: acceptedEmails.size,
      knownUsersCount: getCleanKnownUsersForAdmin(knownUsers).length,
      integrity: buildAdminIntegritySnapshot({ familyId, familySummaries, members, pendingInvites, knownUsers, familyData, familyProfileData }),
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
    inviteList.innerHTML = "<li class=\"polished-admin-empty\">Nenhum convite gerado neste aparelho.</li>";
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
  const appAdminPanel = appAdmin && !window.__ninouAdminFamilyDataOpen;
  const email = cloudUser?.email || familyAccess?.email || "";
  const effectiveRole = authorized ? getEffectiveRole(familyAccess.role, email) : "";
  const roleLabel = authorized ? getRoleLabel(effectiveRole) : "";
  const baby = getBabyDisplayName();
  const pendingCode = normalizeInviteCode(pendingInviteCode || inviteCodeInput?.value || "");
  const canInvite = authorized && !appAdmin && canManageFamilyAccess();
  const showFamilyAccessCard = !authorized || appAdminPanel;
  if (familyAccessCard) {
    familyAccessCard.hidden = !showFamilyAccessCard;
    familyAccessCard.classList.toggle("admin-open", Boolean(appAdminPanel));
  }

  if (familyAccessKicker) {
    familyAccessKicker.textContent = authorized
      ? (appAdmin ? "Painel admin" : "Família conectada")
      : "Acesso familiar";
  }

  if (familyAccessTitle) {
    familyAccessTitle.textContent = authorized
      ? (appAdmin ? "Painel admin" : "Família conectada")
      : connected
        ? (pendingCode ? "Aceitar convite familiar" : "Conta sem acesso familiar")
        : "Entrar ou aceitar convite";
  }

  if (familyAccessText) {
    familyAccessText.textContent = authorized
      ? (appAdmin
        ? `${email} está conectado com acesso completo. Os registros são sincronizados no ambiente da família.`
        : `Você acompanha a rotina de ${baby}. Seu acesso: ${roleLabel}. ${effectiveRole === FAMILY_ROLE_VIEWER ? "Você pode acompanhar os registros." : "Você pode participar da rotina conforme sua permissão."}`)
      : connected
        ? (pendingCode
          ? "Convite detectado. Confirme o código para entrar na família existente, sem criar uma nova família."
          : "Esta conta está conectada, mas ainda não encontramos acesso familiar. Crie sua família agora se você for o primeiro responsável ou use um convite recebido.")
        : "Visitantes podem conhecer o app. Para registrar dados reais, entre com usuário e senha. Se recebeu convite, use o mesmo e-mail convidado.";
  }

  if (familyAccessBadge) {
    familyAccessBadge.textContent = authorized ? (appAdmin ? "Admin" : getRoleLabel(effectiveRole)) : connected ? (pendingCode ? "Convite pendente" : "Sem família") : "Visitante";
    familyAccessBadge.dataset.role = authorized ? effectiveRole : "offline";
  }

  if (createFamilyButton) {
    // v75.75.67: criar família agora abre o fluxo real de cadastro da família.
    createFamilyButton.hidden = !connected || authorized || Boolean(pendingCode);
    createFamilyButton.disabled = personalFamilyActivationInFlight;
    createFamilyButton.textContent = personalFamilyActivationInFlight
      ? (appAdmin ? "Ativando..." : "Criando...")
      : (appAdmin ? "Ativar família principal" : "Criar minha família");
  }

  if (createFamilyWizard) {
    const shouldShowCreateWizard = connected
      && !authorized
      && !appAdmin
      && !pendingCode
      && getCommercialEntryIntent() === "create";
    createFamilyWizard.hidden = !shouldShowCreateWizard;
    if (shouldShowCreateWizard) syncCreateFamilyWizardDefaults();
  }

  if (inviteAcceptBox) {
    // Evita mostrar código antigo na tela de visitante/desconectado.
    inviteAcceptBox.hidden = !connected || appAdmin || authorized;
  }

  if (adminInvitePanel) {
    adminInvitePanel.hidden = !appAdminPanel;
  }

  if (appAdminPanel) {
    refreshAdminStats({ silent: true });
  } else {
    renderAdminStats(null);
  }
  renderFamilyMigrationPanel();
  renderAdminClients();

  if (acceptInviteButton) {
    acceptInviteButton.disabled = !connected || appAdmin;
    acceptInviteButton.textContent = appAdmin ? "Admin não precisa de convite" : (pendingCode ? "Confirmar convite" : "Aceitar convite");
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
      if (familyWelcomeText) familyWelcomeText.textContent = `Seu acesso: ${roleLabel}. ${effectiveRole === FAMILY_ROLE_VIEWER ? "Você pode acompanhar os registros." : "Você pode participar da rotina conforme sua permissão."}`;
    }
  }

  renderProfileStateNotice();
  renderFamilyAccessSummary();
  renderInviteList();
  renderSyncDetails();
  renderAdminDiagnostics();
}

async function readAccountAccessFromCloud(user = cloudUser) {
  if (!user) return null;
  const services = await getFirebaseServices();

  try {
    const familyAccessSnapshot = await services.getDocs(services.collection(services.db, "users", user.uid, "families"));
    const availableAccesses = [];
    familyAccessSnapshot.forEach((docSnap) => {
      const data = docSnap.data() || {};
      const familyId = normalizeFamilyId(data.familyId || docSnap.id);
      if (!familyId || ["inactive", "revoked", "removed"].includes(String(data.status || "active"))) return;
      availableAccesses.push({
        familyId,
        role: data.role || FAMILY_ROLE_ADMIN,
        email: data.email || user.email || "",
        ownerUid: data.ownerUid || data.owner || "",
        inviteCode: data.inviteCode || data.joinedByInvite || "",
        acceptedAt: data.acceptedAt || data.joinedAt || data.createdAt || "",
      });
    });
    const selectedAccess = isFranciscoSharedAccount(user)
      ? (availableAccesses.find((access) => isFranciscoFamilyId(access.familyId)) || availableAccesses[0])
      : (availableAccesses.find((access) => getFamilyScopeType(access.familyId) === "client_family") || availableAccesses[0]);
    if (selectedAccess) return saveFamilyAccess(selectedAccess);
  } catch (error) {
    console.warn("Não foi possível ler famílias do usuário:", error);
  }

  const accessRef = services.doc(services.db, "users", user.uid, "access", "ninou");
  const snapshot = await services.getDoc(accessRef);
  if (snapshot.exists()) {
    const data = snapshot.data() || {};
    if (["inactive", "revoked", "removed"].includes(String(data.status || "active"))) return null;
    return saveFamilyAccess({
      familyId: data.familyId,
      role: data.role,
      email: data.email || user.email || "",
      ownerUid: data.ownerUid || "",
      inviteCode: data.inviteCode || "",
      acceptedAt: data.acceptedAt || data.createdAt || "",
    });
  }

  // v75.75.67: não tenta consultar a família principal fixa para usuários comuns.
  // Uma conta recém-autenticada ainda não tem permissão para ler members/{uid} em famílias
  // onde ela não possui vínculo; isso gerava "Missing or insufficient permissions" antes
  // mesmo sem ser um erro real. O vínculo agora vem de users/{uid}/families ou convite.
  const candidateFamilies = [familyAccess?.familyId].filter(Boolean);
  for (const familyId of [...new Set(candidateFamilies)]) {
    try {
      const memberRef = services.doc(services.db, "families", familyId, "members", user.uid);
      const memberSnapshot = await services.getDoc(memberRef);
      if (!memberSnapshot.exists()) continue;
      const data = memberSnapshot.data() || {};
      if (["inactive", "revoked", "removed"].includes(String(data.status || "active"))) continue;
      return saveFamilyAccess({
        familyId,
        role: data.role || FAMILY_ROLE_ADMIN,
        email: data.email || user.email || "",
        ownerUid: data.ownerUid || data.familyId || familyId,
        inviteCode: data.inviteCode || "",
        acceptedAt: data.acceptedAt || data.joinedAt || data.createdAt || "",
      });
    } catch (error) {
      console.warn("Não foi possível confirmar o membro familiar já vinculado:", familyId, error);
    }
  }
  return null;
}

async function saveAccountAccessToCloud(access, user = cloudUser) {
  if (!user || !access?.familyId) return null;
  const payload = {
    familyId: access.familyId,
    role: getEffectiveRole(access.role || FAMILY_ROLE_ADMIN, access.email || user.email || ""),
    email: normalizeEmail(access.email || user.email || ""),
    ownerUid: access.ownerUid || access.familyId,
    roleVersion: NINOU_FAMILY_SCOPE_VERSION,
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

async function activatePersonalFamily(formValues = null) {
  if (personalFamilyActivationInFlight) {
    if (loginHelper) loginHelper.textContent = "A criação da família já está em andamento. Aguarde alguns segundos.";
    return familyAccess;
  }

  personalFamilyActivationInFlight = true;
  renderAuthControls();

  try {
    return await activatePersonalFamilyInternal(formValues);
  } finally {
    personalFamilyActivationInFlight = false;
    renderAuthControls();
  }
}

async function activatePersonalFamilyInternal(formValues = null) {
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
        customerLabel: access.familyId === APP_ADMIN_FAMILY_ID ? "Área técnica do app" : "Família cadastrada",
        familyType: access.familyId === APP_ADMIN_FAMILY_ID ? "internal_admin" : "client",
        internalAdminFamily: access.familyId === APP_ADMIN_FAMILY_ID,
        supportOnly: access.familyId === APP_ADMIN_FAMILY_ID,
        createdAt: services.serverTimestamp(),
        updatedAt: services.serverTimestamp(),
      };
      if (access.familyId === APP_ADMIN_FAMILY_ID) familyPayload.title = familyPayload.title || "Área técnica do admin";
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
    const defaultFamilyLabels = getDefaultFamilyLabelsForAccount(cloudUser);

    const existingAccess = await readAccountAccessFromCloud(cloudUser);
    if (existingAccess?.familyId) {
      saveFamilyAccess(existingAccess);
      setVisibleDataOwnerEmail(email);
      await connectCurrentAccount();
      setSyncStatus("online", email);
      markCloudSynced();
      if (loginHelper) loginHelper.textContent = "Família já existente encontrada. O acesso foi reutilizado, sem criar duplicidade.";
      showScreen("profile");
      return familyAccess;
    }

    const wizardValues = formValues || (getCommercialEntryIntent() === "create" ? getCommercialFamilyFormValues() : null);
    const babyName = String(wizardValues?.babyName || babyNameInput?.value || babyProfile?.name || defaultFamilyLabels.babyName || "").trim() || emailName;
    const fallbackFamilyName = defaultFamilyLabels.familyName || (babyName ? `Família do ${babyName}` : `Família de ${emailName}`);
    const familyName = String(wizardValues?.familyName || fallbackFamilyName).trim();
    const babyBirthDate = String(wizardValues?.birthDate || babyBirthInput?.value || babyProfile?.birthDate || "").trim();
    const babyArticle = String(wizardValues?.article || babyProfile?.article || defaultFamilyLabels.babyArticle || "do") === "da" ? "da" : "do";
    const responsibleName = String(wizardValues?.responsibleName || "").trim();
    const responsibleRelation = String(wizardValues?.responsibleRelation || "responsavel").trim() || "responsavel";

    if (wizardValues && responsibleName) {
      saveCurrentCaregiverIdentity(responsibleName, responsibleRelation, {
        uid: cloudUser.uid,
        email,
        relationshipLabel: getCaregiverRelationLabel(responsibleRelation),
      });
      if (caregiverNameInput) caregiverNameInput.value = responsibleName;
      if (caregiverRelationInput) caregiverRelationInput.value = responsibleRelation;
    }

    babyProfile = normalizeBabyProfile({
      ...babyProfile,
      name: babyName,
      birthDate: babyBirthDate || babyProfile?.birthDate || "",
      article: babyArticle,
    });
    if (babyNameInput) babyNameInput.value = babyProfile.name || "";
    if (babyBirthInput) babyBirthInput.value = babyProfile.birthDate || "";
    if (babyArticleInput) babyArticleInput.value = babyArticle === "da" ? "da" : "do";

    const familyId = getCanonicalFamilyIdForAccount(cloudUser, familyName, babyName || emailName);
    const nowIso = new Date().toISOString();
    const access = {
      familyId,
      role: FAMILY_ROLE_OWNER,
      email,
      ownerUid: cloudUser.uid,
      acceptedAt: nowIso,
    };

    if (loginHelper) loginHelper.textContent = "Criando sua família no Ninou...";

    // v75.75.67: primeiro cria o vínculo do usuário e o member/{uid}.
    // Uma conta nova ainda não tem permissão para ler families/{familyId}; por isso
    // não fazemos getDoc(familyRef) antes. Depois do vínculo, as regras liberam
    // a criação/atualização segura da família e dos subdocumentos.
    await saveAccountAccessToCloud(access, cloudUser);

    const familyRef = services.doc(services.db, "families", familyId);
    const familyPayload = {
      familyId,
      title: familyName,
      name: familyName,
      babyName,
      babyArticle,
      ownerUid: cloudUser.uid,
      ownerEmail: email,
      responsibleName,
      responsibleRelation,
      customerLabel: isFranciscoFamilyId(familyId) ? "Família atual do Francisco" : "Família criada pelo app",
      familyType: "client",
      accountEmail: isFranciscoFamilyId(familyId) ? email : email,
      fatherEmail: isFranciscoFamilyId(familyId) ? NINOU_FRANCISCO_FATHER_EMAIL : "",
      motherEmail: isFranciscoFamilyId(familyId) ? NINOU_FRANCISCO_MOTHER_EMAIL : "",
      parentEmails: isFranciscoFamilyId(familyId) ? [...NINOU_FRANCISCO_PARENT_EMAILS] : [],
      legacyMigrationTarget: isFranciscoFamilyId(familyId),
      franciscoMigrationReady: isFranciscoFamilyId(familyId),
      migrationVersion: isFranciscoFamilyId(familyId) ? NINOU_RUNTIME_VERSION : "",
      status: "active",
      appVersion: NINOU_RUNTIME_VERSION,
      createdAt: services.serverTimestamp(),
      updatedAt: services.serverTimestamp(),
    };
    await services.setDoc(familyRef, familyPayload, { merge: true });

    const profilePayload = {
      ...getProfilePayload(),
      familyId,
      familyName,
      name: babyName,
      birthDate: babyBirthDate || babyProfile?.birthDate || "",
      article: babyArticle,
      ownerUid: cloudUser.uid,
      responsibleName,
      responsibleRelation,
      commercialCreatedAtClient: nowIso,
      updatedAt: services.serverTimestamp(),
    };
    await services.setDoc(services.doc(services.db, "families", familyId, "profile", "main"), profilePayload, { merge: true });

    saveFamilyAccess(access);
    if (wizardValues && responsibleName) {
      saveCurrentCaregiverIdentity(responsibleName, responsibleRelation, {
        uid: cloudUser.uid,
        email,
        familyId,
        accessLevel: getRoleLabel(access.role),
        relationshipLabel: getCaregiverRelationLabel(responsibleRelation),
      });
    }
    clearCommercialEntryIntent();
    closeCreateFamilyWizard();
    setVisibleDataOwnerEmail(email);
    await connectCurrentAccount();
    setSyncStatus("online", email);
    markCloudSynced();
    if (createFamilyWizardStatus) createFamilyWizardStatus.textContent = "Família criada com sucesso.";
    if (loginHelper) loginHelper.textContent = `Família criada para ${babyName}. Agora você já pode registrar a rotina e convidar cuidadores.`;
    renderCaregiverIdentityPanel();
    renderTodayCaregiverCard();
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

async function updateFamilyMemberRole(memberUid = "", roleValue = "") {
  const uid = String(memberUid || "").trim();
  const role = normalizeAssignableMemberRole(roleValue || FAMILY_ROLE_VIEWER);
  if (!uid || !isFamilyAdmin()) return false;
  if (!window.confirm(`Alterar permissão deste membro para ${getRoleLabel(role)}?`)) return false;
  try {
    const services = await getFirebaseServices();
    const familyId = getSelectedFamilyIdForAdminOrAccess();
    const memberRef = services.doc(services.db, "families", familyId, "members", uid);
    const memberSnap = await services.getDoc(memberRef);
    const memberData = memberSnap.exists?.() ? (memberSnap.data() || {}) : {};
    const currentRole = normalizeRole(memberData.role || FAMILY_ROLE_VIEWER);
    if (currentRole === FAMILY_ROLE_OWNER) {
      if (loginHelper) loginHelper.textContent = "O responsável principal não pode ter a permissão alterada nesta etapa. Primeiro será necessário transferir a família.";
      return false;
    }
    const targetEmail = normalizeEmail(memberData.email || "");
    await services.setDoc(memberRef, {
      role,
      updatedBy: cloudUser.uid,
      updatedAt: services.serverTimestamp(),
    }, { merge: true });
    await services.setDoc(services.doc(services.db, "users", uid, "families", familyId), { role, updatedAt: services.serverTimestamp() }, { merge: true });
    await services.setDoc(services.doc(services.db, "users", uid, "access", "ninou"), { role, updatedAt: services.serverTimestamp() }, { merge: true });
    await writeFamilyAuditLog("member_role_updated", { familyId, targetUid: uid, targetEmail, role });
    await refreshAdminStats({ silent: true });
    if (loginHelper) loginHelper.textContent = `Permissão atualizada para ${getRoleLabel(role)}.`;
    return true;
  } catch (error) {
    console.warn("Não foi possível alterar permissão:", error);
    if (loginHelper) loginHelper.textContent = getFirebaseErrorMessage(error);
    return false;
  }
}

async function removeFamilyMember(memberUid = "", memberEmail = "") {
  const uid = String(memberUid || "").trim();
  const email = normalizeEmail(memberEmail || "");
  if (!uid || !isFamilyAdmin()) return false;
  if (uid === cloudUser?.uid) {
    if (loginHelper) loginHelper.textContent = "Use Sair da família para remover seu próprio acesso.";
    return false;
  }
  if (!window.confirm(`Remover ${email || "este membro"} da família? A pessoa perderá acesso aos dados do bebê neste app.`)) return false;
  try {
    const services = await getFirebaseServices();
    const familyId = getSelectedFamilyIdForAdminOrAccess();
    const memberRef = services.doc(services.db, "families", familyId, "members", uid);
    const memberSnap = await services.getDoc(memberRef);
    const memberData = memberSnap.exists?.() ? (memberSnap.data() || {}) : {};
    if (normalizeRole(memberData.role || FAMILY_ROLE_VIEWER) === FAMILY_ROLE_OWNER) {
      if (loginHelper) loginHelper.textContent = "O responsável principal não pode ser removido nesta etapa.";
      return false;
    }
    await services.setDoc(memberRef, {
      status: "removed",
      removedBy: cloudUser.uid,
      removedAt: services.serverTimestamp(),
      updatedAt: services.serverTimestamp(),
    }, { merge: true });
    await services.setDoc(services.doc(services.db, "users", uid, "families", familyId), {
      status: "removed",
      removedAt: services.serverTimestamp(),
      updatedAt: services.serverTimestamp(),
    }, { merge: true });
    await services.setDoc(services.doc(services.db, "users", uid, "access", "ninou"), {
      familyId,
      status: "removed",
      removedAt: services.serverTimestamp(),
      updatedAt: services.serverTimestamp(),
    }, { merge: true });
    await writeFamilyAuditLog("member_removed", { familyId, targetUid: uid, targetEmail: email });
    await refreshAdminStats({ silent: true });
    if (loginHelper) loginHelper.textContent = "Membro removido da família.";
    return true;
  } catch (error) {
    console.warn("Não foi possível remover membro:", error);
    if (loginHelper) loginHelper.textContent = getFirebaseErrorMessage(error);
    return false;
  }
}

async function leaveCurrentFamily() {
  if (!canCurrentUserLeaveFamily()) return false;
  const familyId = familyAccess?.familyId || "";
  if (!familyId || !cloudUser) return false;
  if (!window.confirm("Sair desta família? Você perderá acesso aos registros familiares neste aparelho, mas os dados da família serão preservados.")) return false;
  try {
    const services = await getFirebaseServices();
    await services.setDoc(services.doc(services.db, "families", familyId, "members", cloudUser.uid), {
      status: "removed",
      leftAt: services.serverTimestamp(),
      updatedAt: services.serverTimestamp(),
    }, { merge: true });
    await services.setDoc(services.doc(services.db, "users", cloudUser.uid, "families", familyId), {
      status: "removed",
      leftAt: services.serverTimestamp(),
      updatedAt: services.serverTimestamp(),
    }, { merge: true });
    await services.setDoc(services.doc(services.db, "users", cloudUser.uid, "access", "ninou"), {
      familyId,
      status: "removed",
      leftAt: services.serverTimestamp(),
      updatedAt: services.serverTimestamp(),
    }, { merge: true });
    await writeFamilyAuditLog("member_left", { familyId, targetUid: cloudUser.uid, targetEmail: cloudUser.email || familyAccess?.email || "" });
    saveFamilyAccess(null);
    clearFamilyCacheForAccess();
    renderAll();
    if (loginHelper) loginHelper.textContent = "Você saiu da família neste aparelho. Para voltar, use um novo convite.";
    return true;
  } catch (error) {
    console.warn("Não foi possível sair da família:", error);
    if (loginHelper) loginHelper.textContent = getFirebaseErrorMessage(error);
    return false;
  }
}

async function cancelFamilyInvite(codeValue = "") {
  const code = normalizeInviteCode(codeValue);
  if (!code || !isFamilyAdmin()) return false;
  if (!window.confirm(`Cancelar o convite ${code}? Esse código deixará de funcionar.`)) return false;
  try {
    const services = await getFirebaseServices();
    await services.setDoc(services.doc(services.db, "invites", code), {
      status: "cancelled",
      cancelledBy: cloudUser.uid,
      cancelledAt: services.serverTimestamp(),
      updatedAt: services.serverTimestamp(),
    }, { merge: true });
    try {
      const selectedFamilyId = getSelectedFamilyIdForAdminOrAccess();
      const cancelPayload = {
        status: "cancelled",
        cancelledBy: cloudUser.uid,
        cancelledAt: services.serverTimestamp(),
        updatedAt: services.serverTimestamp(),
      };
      await services.setDoc(services.doc(services.db, "families", selectedFamilyId, "invites", code), cancelPayload, { merge: true });
      await services.setDoc(services.doc(services.db, "families", selectedFamilyId, "invitations", code), cancelPayload, { merge: true });
    } catch (mirrorError) {
      console.warn("Convite cancelado na coleção principal, mas não no espelho:", mirrorError);
    }
    await writeFamilyAuditLog("invite_cancelled", { code, familyId: getSelectedFamilyIdForAdminOrAccess() });
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

async function prepareFranciscoFamilyForMigration() {
  if (!cloudUser || !isGlobalAppAdmin()) {
    if (franciscoMigrationResult) {
      franciscoMigrationResult.hidden = false;
      franciscoMigrationResult.textContent = "Apenas o admin global pode preparar a família Francisco.";
    }
    return null;
  }

  const services = await getFirebaseServices();
  const familyId = NINOU_FRANCISCO_FAMILY_ID;
  const inviteTargets = [
    { email: NINOU_FRANCISCO_FATHER_EMAIL, role: FAMILY_ROLE_ADMIN, label: "Felipe · Pai" },
    { email: NINOU_FRANCISCO_MOTHER_EMAIL, role: FAMILY_ROLE_ADMIN, label: "Maria · Mãe" },
  ];
  const now = Date.now();

  if (prepareFranciscoFamilyButton) {
    prepareFranciscoFamilyButton.disabled = true;
    prepareFranciscoFamilyButton.textContent = "Preparando...";
  }
  if (franciscoMigrationResult) {
    franciscoMigrationResult.hidden = false;
    franciscoMigrationResult.textContent = "Preparando família Francisco e convites para pai e mãe...";
  }

  try {
    await services.setDoc(services.doc(services.db, "families", familyId), {
      ...buildFranciscoFamilyBasePayload(services),
      supportAdminUid: cloudUser.uid,
      supportAdminEmail: cloudUser.email || "",
      pendingInvitesCount: inviteTargets.length,
      updatedAt: services.serverTimestamp(),
    }, { merge: true });

    await services.setDoc(services.doc(services.db, "families", familyId, "profile", "main"), {
      familyId,
      familyName: NINOU_FRANCISCO_FAMILY_NAME,
      name: NINOU_FRANCISCO_BABY_NAME,
      article: NINOU_FRANCISCO_BABY_ARTICLE,
      fatherEmail: NINOU_FRANCISCO_FATHER_EMAIL,
      motherEmail: NINOU_FRANCISCO_MOTHER_EMAIL,
      parentEmails: [...NINOU_FRANCISCO_PARENT_EMAILS],
      weights: [],
      wakeWindowMinutes: 70,
      legacyMigrationTarget: true,
      clientUpdatedAt: new Date().toISOString(),
      updatedAt: services.serverTimestamp(),
    }, { merge: true });

    const preparedInvites = [];
    for (const target of inviteTargets) {
      const code = createInviteCodeForEmail(target.email, familyId);
      const link = buildInviteLink(code);
      const expiry = getInviteExpiryPayload(services, now);
      const invitePayload = {
        code,
        familyId,
        email: target.email,
        role: target.role,
        roleLabel: target.label,
        status: "pending",
        maxUses: INVITE_MAX_USES,
        useCount: 0,
        legacyMigrationTarget: true,
        createdBy: cloudUser.uid,
        createdByUid: cloudUser.uid,
        createdByEmail: cloudUser.email || "",
        createdAt: services.serverTimestamp(),
        updatedAt: services.serverTimestamp(),
        expiresAt: expiry.expiresAt,
        expiresAtClient: expiry.expiresAtClient,
      };
      await services.setDoc(services.doc(services.db, "invites", code), getMinimalGlobalInvitePayload(invitePayload), { merge: true });
      await services.setDoc(services.doc(services.db, "families", familyId, "invites", code), invitePayload, { merge: true });
      await services.setDoc(services.doc(services.db, "families", familyId, "invitations", code), invitePayload, { merge: true });
      await cleanupDuplicatePendingInvites(services, target.email, familyId, code);
      preparedInvites.push({ code, email: target.email, role: target.role, link, label: target.label });
      recentInvites.unshift({ code, email: target.email, role: target.role, link });
    }

    saveSelectedAdminFamilyId(familyId);
    ensureGlobalAdminAccess(cloudUser, familyId);
    window.__ninouAdminFamilyDataOpen = false;
    if (adminMigrationEmailInput) adminMigrationEmailInput.value = NINOU_FRANCISCO_FATHER_EMAIL;
    renderInviteList();

    if (franciscoMigrationResult) {
      const inviteLines = preparedInvites.map((invite) => `
        <span>${escapeHtml(invite.label)}: ${escapeHtml(invite.email)} · código ${escapeHtml(invite.code)}</span>
        <button type="button" data-copy-invite="${escapeHtml(invite.link)}">Copiar convite de ${escapeHtml(invite.label.split(" · ")[0] || "membro")}</button>`).join("");
      franciscoMigrationResult.innerHTML = `
        <strong>Família Francisco preparada</strong>
        <span>Destino: families/${escapeHtml(familyId)}</span>
        <span>Pai: ${escapeHtml(NINOU_FRANCISCO_FATHER_EMAIL)}</span>
        <span>Mãe: ${escapeHtml(NINOU_FRANCISCO_MOTHER_EMAIL)}</span>
        ${inviteLines}`;
    }
    if (loginHelper) loginHelper.textContent = "Família Francisco selecionada. Convites gerados para pai e mãe. Agora use Revisão técnica para migrar dados antigos, se necessário.";
    await refreshAdminStats({ silent: true });
    scrollAdminSection("adminMigrationSection");
    return { familyId, invites: preparedInvites };
  } catch (error) {
    console.error("Erro ao preparar família Francisco:", error);
    if (franciscoMigrationResult) franciscoMigrationResult.textContent = getFirebaseErrorMessage(error);
    return null;
  } finally {
    if (prepareFranciscoFamilyButton) {
      prepareFranciscoFamilyButton.disabled = false;
      prepareFranciscoFamilyButton.textContent = "Preparar família Francisco";
    }
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
  const familyId = getCanonicalFamilyIdForAdminCreation({ responsibleEmail, familyName, babyName });
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
    const isFranciscoTarget = isFranciscoFamilyId(familyId);
    const familyPayload = {
      familyId,
      ...(isFranciscoTarget ? buildFranciscoFamilyBasePayload(services) : {
        title: familyName,
        name: familyName,
        babyName,
        babyArticle,
        customerLabel: "Família cadastrada",
        familyType: "client",
        status: "active",
        appVersion: NINOU_RUNTIME_VERSION,
      }),
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
      familyId,
      familyName: isFranciscoTarget ? NINOU_FRANCISCO_FAMILY_NAME : familyName,
      name: isFranciscoTarget ? NINOU_FRANCISCO_BABY_NAME : babyName,
      article: isFranciscoTarget ? NINOU_FRANCISCO_BABY_ARTICLE : babyArticle,
      weights: [],
      createdByAdmin: cloudUser.uid,
      clientUpdatedAt: new Date().toISOString(),
      updatedAt: services.serverTimestamp(),
    }, { merge: true });

    let inviteMarkup = "";
    if (responsibleEmail) {
      const role = FAMILY_ROLE_ADMIN;
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
        status: "pending",
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
  const role = normalizeInviteRole(adminInviteRole?.value || FAMILY_ROLE_ADMIN);

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
        status: "pending",
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
        ? "Sem permissão para criar convite. Publique as regras Firestore da v75.75.67 e confirme que está logado com luizfelipe.dasilva@gmail.com."
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
    const inviteFamilyId = String(invite.familyId || "");

    if (hasFamilyAccess() && familyAccess?.familyId && inviteFamilyId && familyAccess.familyId !== inviteFamilyId) {
      if (!options.silent && loginHelper) loginHelper.textContent = "Esta conta já está vinculada a outra família. Saia e limpe os dados deste aparelho antes de aceitar um convite diferente.";
      return false;
    }

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
      familyId: inviteFamilyId,
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
    await flushPendingCloudSync("invite-accepted");
    setSyncStatus(hasPendingCloudSyncItems() ? "pending" : "online", cloudUser.email || "", getPendingSyncSummary());
    showScreen("today");
    renderAll();
    return true;
  } catch (error) {
    console.error("Erro ao aceitar convite:", error);
    if (!options.silent && loginHelper) {
      loginHelper.textContent = error?.code === "permission-denied"
        ? "Sem permissão para aceitar convite. Publique as regras Firestore da v75.75.67 e confirme se o convite é para este e-mail."
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
  let familyScoped = false;
  try { familyScoped = isFamilyScopedDataActive(); } catch { familyScoped = false; }
  const scopedKey = familyScoped ? getScopedWeightsStorageKey() : "";
  if (familyScoped && scopedKey) {
    try {
      const raw = localStorage.getItem(scopedKey);
      if (raw !== null && typeof raw !== "undefined") return normalizeWeights(JSON.parse(raw || "[]"));
      return [];
    } catch {
      return [];
    }
  }
  return loadStoredWeights();
}


function persistLocalWeights(weights) {
  const normalized = normalizeWeights(weights);
  let familyScoped = false;
  try { familyScoped = isFamilyScopedDataActive(); } catch { familyScoped = false; }
  const scopedKey = familyScoped ? getScopedWeightsStorageKey() : "";
  if (familyScoped && scopedKey) {
    try { localStorage.setItem(scopedKey, JSON.stringify(normalized)); } catch {}
    return;
  }
  persistStoredWeights(normalized);
}


function getDefaultBabyProfile() {
  return createDefaultBabyProfile();
}


function normalizeBabyProfile(profile = {}) {
  return normalizeStoredBabyProfile(profile);
}


function loadBabyProfile() {
  let familyScoped = false;
  try { familyScoped = isFamilyScopedDataActive(); } catch { familyScoped = false; }
  if (familyScoped) {
    const profileKey = getScopedProfileStorageKey();
    const weightKey = getScopedWeightsStorageKey();
    try {
      const storedProfile = JSON.parse(localStorage.getItem(profileKey) || "{}");
      const storedWeights = JSON.parse(localStorage.getItem(weightKey) || "[]");
      return normalizeBabyProfile({
        themeMode: localStorage.getItem(storageKeys.themeMode) || "dark",
        ...storedProfile,
        weights: normalizeWeights(storedProfile.weights || storedWeights),
      });
    } catch {
      return normalizeBabyProfile({ themeMode: localStorage.getItem(storageKeys.themeMode) || "dark", weights: [] });
    }
  }
  return loadStoredBabyProfile();
}


function saveBabyProfile() {
  let familyScoped = false;
  try { familyScoped = isFamilyScopedDataActive(); } catch { familyScoped = false; }
  if (familyScoped) {
    babyProfile = normalizeBabyProfile({ ...babyProfile, weights: normalizeWeights(babyProfile.weights || loadLocalWeights()) });
    try { localStorage.setItem(getScopedProfileStorageKey(), JSON.stringify(stampFamilyData(babyProfile))); } catch {}
    try { localStorage.setItem(storageKeys.themeMode, babyProfile.themeMode); } catch {}
    persistLocalWeights(babyProfile.weights);
    if (profileClientUpdatedAt) {
      try { localStorage.setItem(getScopedProfileVersionStorageKey(), String(profileClientUpdatedAt)); } catch {}
    }
  } else {
    babyProfile = persistBabyProfile(babyProfile, { profileClientUpdatedAt });
  }
  persistVisibleContextForCurrentOwner();
}


function markProfileLocallyChanged() {
  profileClientUpdatedAt = Math.max(Date.now(), profileClientUpdatedAt + 1);
  if (isFamilyScopedDataActive()) {
    localStorage.setItem(getScopedProfileVersionStorageKey(), String(profileClientUpdatedAt));
  } else {
    localStorage.setItem(storageKeys.profileVersion, String(profileClientUpdatedAt));
  }
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
  const familySurface = Boolean(isLoggedIn() && hasFamilyAccess() && (!appAdmin || previewOpen));
  document.body.classList.toggle("global-admin-mode", appAdmin && !previewOpen);
  document.body.classList.toggle("admin-panel-only", appAdmin && !previewOpen);
  document.body.classList.toggle("admin-family-preview", appAdmin && previewOpen);
  document.body.classList.toggle("family-daily-surface", familySurface);
  document.body.classList.toggle("regular-family-mode", familySurface && !appAdmin);
  renderAdminClients();
}

function renderAuthControls() {
  const connected = isLoggedIn();
  const authorized = hasFamilyAccess();
  const appAdmin = isGlobalAppAdmin();
  const routineAuthorized = authorized && !authAccessLoading && (!appAdmin || Boolean(window.__ninouAdminFamilyDataOpen));
  document.body.classList.toggle("family-bootstrap-ready", Boolean(familyBootstrapReady && authorized));
  loginButton.textContent = connected ? (authorized ? "Conectado" : "Conta autenticada") : "Entrar";
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

  if (hasPendingCloudSyncItems()) {
    void flushPendingCloudSync("connect");
  } else {
    setSyncStatus(isBrowserOnline() ? "online" : "pending", cloudUser?.email || "", getPendingSyncSummary());
  }
}

function getProfilePayload(options = {}) {
  const payload = stampFamilyData({
    ...normalizeBabyProfile(babyProfile),
    wakeWindowMinutes,
    clientUpdatedAt: ensureProfileVersion(),
    updatedAt: firebaseServices.serverTimestamp(),
  });

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
  if (applyingCloudState) return;
  if (cloudUser && hasFamilyAccess()) markProfileSyncQueued();
  if (!cloudUser || !firebaseServices || !hasFamilyAccess()) return;
  pendingProfilePhotoSave = false;

  window.clearTimeout(profileCloudSaveTimer);
  setSyncStatus(isBrowserOnline() ? "saving" : "pending", cloudUser.email || "", getPendingSyncSummary());
  profileCloudSaveTimer = window.setTimeout(() => saveProfileToCloud(options), 600);
}

async function saveProfileToCloud(options = {}) {
  const profileRef = getCloudProfileRef();
  if (!profileRef || applyingCloudState) return;
  if (!isBrowserOnline()) {
    markProfileSyncQueued();
    markCloudSyncPending({ code: "offline" });
    return;
  }

  const includePhoto = false;
  const payload = getProfilePayload();
  const savedProfileVersion = payload.clientUpdatedAt;

  try {
    setSyncStatus("syncing", cloudUser.email || "", "Enviando perfil para a família...");
    await firebaseServices.setDoc(profileRef, payload, { merge: true });
    clearProfileSyncQueued();
    if (includePhoto) pendingProfilePhotoSave = false;
    if (savedProfileVersion === profileClientUpdatedAt) {
      markCloudSynced();
      setSyncStatus(hasPendingCloudSyncItems() ? "pending" : "online", cloudUser.email, getPendingSyncSummary());
    }
  } catch (error) {
    console.error("Erro ao salvar perfil:", error);
    if (savedProfileVersion === profileClientUpdatedAt) {
      markProfileSyncQueued();
      markCloudSyncPending(error);
    }
  }
}

function scheduleDayCloudSave(dayId = getSelectedDayId()) {
  if (applyingCloudState) return;

  const safeDayId = isDateId(dayId) ? dayId : getCurrentDayId();
  if (cloudUser && hasFamilyAccess()) markDaySyncQueued(safeDayId);
  if (!cloudUser || !firebaseServices || !hasFamilyAccess()) return;

  window.clearTimeout(dayCloudSaveTimer);
  setSyncStatus(isBrowserOnline() ? "saving" : "pending", cloudUser.email || "", getPendingSyncSummary());
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
  const currentNotesUpdatedAt = Number(currentState.dayNotesUpdatedAt) || 0;
  const cloudNotesUpdatedAt = Number(cloudState.dayNotesUpdatedAt) || 0;
  const chosenNotes = currentNotes && cloudNotes
    ? (currentNotesUpdatedAt >= cloudNotesUpdatedAt ? currentNotes : cloudNotes)
    : (currentNotes || cloudNotes || "");
  const chosenNotesUpdatedAt = chosenNotes
    ? (chosenNotes === currentNotes ? currentNotesUpdatedAt : cloudNotesUpdatedAt)
    : 0;

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
    dayNotesUpdatedAt: chosenNotesUpdatedAt,
  }, safeDayId, { preserveLive: true });
}

async function saveDayToCloud(dayId = getSelectedDayId(), options = {}) {
  const safeDayId = isDateId(dayId) ? dayId : getCurrentDayId();
  const dayRef = getCloudDayRef(safeDayId);
  if (!dayRef || applyingCloudState) return;
  if (!isBrowserOnline()) {
    markDaySyncQueued(safeDayId);
    markCloudSyncPending({ code: "offline" });
    return;
  }

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

    setSyncStatus("syncing", cloudUser.email || "", `Enviando rotina de ${safeDayId}...`);
    await firebaseServices.setDoc(
      dayRef,
      stampFamilyData({
        ...dayPayload,
        ...cloudTimestamps,
      }),
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

    clearDaySyncQueued(safeDayId);
    markCloudSynced();
    setSyncStatus(hasPendingCloudSyncItems() ? "pending" : "online", cloudUser.email, getPendingSyncSummary());
  } catch (error) {
    console.error("Erro ao salvar rotina:", error);
    markDaySyncQueued(safeDayId);
    markCloudSyncPending(error);
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
    markCloudSyncPending(error);
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
    markCloudSyncPending(error);
  });
}


function installOfflineSyncEventHandlers() {
  if (window.__ninouOfflineSyncEventsInstalled) return;
  window.__ninouOfflineSyncEventsInstalled = true;
  window.addEventListener("online", () => {
    if (cloudUser && hasFamilyAccess()) {
      setSyncStatus(hasPendingCloudSyncItems() ? "syncing" : "online", cloudUser.email || "", hasPendingCloudSyncItems() ? "Conexão voltou. Sincronizando pendências..." : "Conexão restabelecida.");
      void flushPendingCloudSync("online");
    } else {
      setSyncStatus("online", cloudUser?.email || "");
    }
  });
  window.addEventListener("offline", () => {
    if (cloudUser && hasFamilyAccess()) {
      setSyncStatus("pending", cloudUser.email || "", getPendingSyncSummary());
    } else {
      setSyncStatus("offline", cloudUser?.email || "");
    }
  });
}

async function initFirebaseAuthState() {
  installOfflineSyncEventHandlers();
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
      loginHelper.textContent = "Use e-mail e senha para entrar. Se recebeu convite, crie a conta com o mesmo e-mail convidado.";
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
        loginHelper.textContent = "Conta autenticada, mas sem família vinculada. Crie sua família se você for o primeiro responsável ou aceite um convite familiar.";
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

function getOpenAwakeInfoForMainClock(now = Date.now()) {
  if (getSelectedDayId() !== getCurrentDayId()) return null;
  const info = getTodayAwakeCalculation(now);
  if (!info?.hasWake || !info?.isOpen || !Number.isFinite(Number(info.wakeAt))) return null;
  const wakeAt = Number(info.wakeAt);
  const elapsed = Math.max(0, Number(now) - wakeAt);
  if (!Number.isFinite(elapsed) || elapsed < 0 || elapsed > 72 * hour) return null;
  return { ...info, wakeAt, elapsed };
}

function syncMainClockFromOpenAwake(now = Date.now(), options = {}) {
  // v75.75.112: não sobrescrever um sono/soneca já iniciado.
  // A falha do botão "Iniciar soneca" vinha do live tick chamando esta função
  // e voltando o estado para "awake" logo após startSleep().
  if (state.mode === "sleeping" && options.force !== true) return false;

  const info = getOpenAwakeInfoForMainClock(now);
  if (!info) return false;

  const crossedMidnight = info.wakeAt < getDayStart();
  document.body.classList.remove("ninou-empty-profile-state", "ninou-reviewing-past-state", "ninou-daily-empty-state");
  setHidden(wakeAction, false);
  syncStartChoiceVisibility(false);
  applyMainRoutineActionContext(now);
  setText(stateLabel, "Acordado há");
  setText(stateClock, formatDuration(info.elapsed));
  setText(stateHint, crossedMidnight
    ? `Acordado desde ontem, às ${formatTime(info.wakeAt)}. O contador segue a partir do último registro.`
    : getWakeWindowText());

  if (state.mode !== "awake" || Math.abs(Number(state.activeStartedAt || 0) - info.wakeAt) > 60000) {
    state = normalizeDayState({
      ...state,
      mode: "awake",
      activeStartedAt: info.wakeAt,
      activeType: info.wakeEvent?.type || "acordou",
      activeDetail: crossedMidnight ? "Continuado de ontem" : "",
      activeNotes: info.wakeEvent?.notes || "",
    });
    syncSelectedDayIntoFamilyCache();
    saveLocalDayState(getSelectedDayId());
  }

  renderActiveTimerCard();
  return true;
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

function isNightRoutinePeriod(now = Date.now()) {
  const hourValue = new Date(Number(now) || Date.now()).getHours();
  return hourValue >= 19 || hourValue < 6;
}

function isNightSleepState(now = Date.now()) {
  const type = String(state.activeType || "");
  return type === "dormir" || type === "despertar-noturno" || isNightRoutinePeriod(now);
}

function getMainRoutineActionContext(now = Date.now()) {
  const nightWakeActive = getActiveNightWakeEvent();

  if (state.mode === "sleeping") {
    return isNightSleepState(now)
      ? { label: "Despertar noturno", iconKey: "despertar-noturno", action: "night-wake" }
      : { label: "Acordou", iconKey: "acordou", action: "wake" };
  }

  if (nightWakeActive) {
    return { label: "Voltou a dormir", iconKey: "dormir", action: "start-night-sleep", sleepType: "dormir" };
  }

  if (isNightRoutinePeriod(now)) {
    return { label: "Iniciar noite", iconKey: "dormir", action: "start-night-sleep", sleepType: "dormir" };
  }

  return { label: "Iniciar soneca", iconKey: "sono", action: "start-nap", sleepType: "sono" };
}

function applyMainRoutineActionContext(now = Date.now()) {
  const context = getMainRoutineActionContext(now);
  setText(wakeActionLabel, context.label);
  if (wakeActionIcon && wakeActionIcon.dataset.iconKey !== context.iconKey) {
    wakeActionIcon.dataset.iconKey = context.iconKey;
    wakeActionIcon.innerHTML = iconMarkup(context.iconKey);
  }
  return context;
}

function startNightWakeFromMainAction() {
  if (!requireLogin("registrar despertar noturno")) return;
  if (state.mode !== "sleeping") return;

  const startedAt = Date.now();
  const activeStartedAt = Number(state.activeStartedAt);
  if (Number.isFinite(activeStartedAt) && startedAt - activeStartedAt > 14 * hour) {
    const ok = window.confirm("Esse sono passou de 14 horas. Deseja registrar despertar noturno mesmo assim?");
    if (!ok) return;
  }

  markRoutineMutationSnapshot("registrou despertar noturno");
  startLiveAwakeFromManualNightWake(startedAt, "Despertar noturno", "");
  timelineRenderSignature = "";
  orbitRenderSignature = "";
  saveDayState();
}

function startSleepFromMainAction() {
  const context = getMainRoutineActionContext(Date.now());
  startSleep(context.sleepType || "sono", context.label);
}

function runActiveTimerAction() {
  // v75.75.113: a ação principal agora entende madrugada/noite.
  if (state.mode !== "sleeping") syncMainClockFromOpenAwake(Date.now(), { force: true });

  if (state.mode === "idle") {
    const info = getOpenAwakeInfoForMainClock(Date.now());
    if (info?.isOpen && Number.isFinite(Number(info.wakeAt))) {
      state = normalizeDayState({
        ...state,
        mode: "awake",
        activeStartedAt: Number(info.wakeAt),
        activeType: info.wakeEvent?.type || "acordou",
        activeDetail: Number(info.wakeAt) < getDayStart() ? "Continuado de ontem" : "",
        activeNotes: info.wakeEvent?.notes || "",
      });
      syncSelectedDayIntoFamilyCache();
      saveLocalDayState(getSelectedDayId());
    }
  }

  if (state.mode === "idle") {
    renderAll();
    return;
  }

  const context = getMainRoutineActionContext(Date.now());
  if (state.mode === "sleeping") {
    if (context.action === "night-wake") {
      startNightWakeFromMainAction();
    } else {
      finishSleep();
    }
  } else {
    startSleepFromMainAction();
  }
  renderAll();
}

function syncStartChoiceVisibility(visible) {
  setHidden(startChoice, !visible);
  startChoice?.classList.toggle("is-visible", Boolean(visible));
  startChoice?.setAttribute("aria-hidden", visible ? "false" : "true");
}

function renderCurrentState() {
  reconcileCurrentAwakeStateFromEvents();
  if (!canUsePrivateFeatures()) {
    setHidden(wakeAction, true);
    syncStartChoiceVisibility(false);
    document.body.classList.add("ninou-empty-profile-state");
    document.body.classList.remove("ninou-daily-empty-state", "ninou-reviewing-past-state");
    setText(stateLabel, "Entre para registrar");
    setText(stateClock, "--:--");
    setText(stateHint, "A rotina fica protegida na família. Entre, crie uma família ou aceite um convite para começar.");
    renderActiveTimerCard();
    return;
  }

  if (getSelectedDayId() !== getCurrentDayId()) {
    setHidden(wakeAction, true);
    syncStartChoiceVisibility(false);
    document.body.classList.add("ninou-reviewing-past-state");
    document.body.classList.remove("ninou-empty-profile-state", "ninou-daily-empty-state");
    setText(stateLabel, "Dia em revisão");
    setText(stateClock, "--:--");
    setText(stateHint, "Você está vendo uma data anterior. Use o botão + para incluir ou corrigir registros desse dia.");
    renderActiveTimerCard();
    return;
  }

  // v75.75.104: o resumo do dia já inferia corretamente um "Acordou" de ontem,
  // mas o contador principal ainda dependia de state.activeStartedAt. Aqui fazemos
  // o contador principal adotar a mesma origem de tempo do resumo quando a rotina
  // está acordada e aberta, inclusive atravessando a virada do dia.
  const awakeCarryInfo = getTodayAwakeCalculation(Date.now());
  if (state.mode !== "sleeping"
    && awakeCarryInfo?.hasWake
    && awakeCarryInfo?.isOpen
    && Number.isFinite(Number(awakeCarryInfo.wakeAt))) {
    const carriedStart = Number(awakeCarryInfo.wakeAt);
    const currentStart = Number(state.activeStartedAt);
    const shouldAdoptCarry = state.mode !== "awake"
      || !Number.isFinite(currentStart)
      || currentStart > carriedStart + 60000
      || currentStart < carriedStart - 60000;

    if (shouldAdoptCarry) {
      state = normalizeDayState({
        ...state,
        mode: "awake",
        activeStartedAt: carriedStart,
        activeType: awakeCarryInfo.wakeEvent?.type || "acordou",
        activeDetail: carriedStart < getDayStart() ? "Continuado de ontem" : "",
        activeNotes: awakeCarryInfo.wakeEvent?.notes || "",
      });
      syncSelectedDayIntoFamilyCache();
      saveLocalDayState(getSelectedDayId());
      timelineRenderSignature = "";
      orbitRenderSignature = "";
    }
  }

  if (syncMainClockFromOpenAwake(Date.now())) {
    return;
  }

  if (state.mode === "idle") {
    if (continueOpenSleepFromPreviousDayIfNeeded()) {
      renderCurrentState();
      return;
    }
    setHidden(wakeAction, true);
    syncStartChoiceVisibility(true);
    document.body.classList.add("ninou-daily-empty-state");
    document.body.classList.remove("ninou-empty-profile-state", "ninou-reviewing-past-state");
    setText(stateLabel, "Começar hoje");
    setText(stateClock, "00:00:00");
    setText(stateHint, `Ainda não há registros hoje. Informe como ${getBabyReference()} estava quando você começou a acompanhar.`);
    renderActiveTimerCard();
    return;
  }

  document.body.classList.remove("ninou-empty-profile-state", "ninou-reviewing-past-state", "ninou-daily-empty-state");
  setHidden(wakeAction, false);
  syncStartChoiceVisibility(false);
  const elapsed = Date.now() - Number(state.activeStartedAt || Date.now());
  if (!Number.isFinite(elapsed) || elapsed < 0 || elapsed > 48 * hour) {
    const carriedRoutine = getRoutineCarryFromEventsAcrossMidnight(getCurrentDayId(), state, Date.now());
    if (carriedRoutine && Number.isFinite(Number(carriedRoutine.start)) && Date.now() - Number(carriedRoutine.start) <= 72 * hour) {
      state = normalizeDayState({
        ...state,
        mode: carriedRoutine.mode === "sleeping" ? "sleeping" : "awake",
        activeStartedAt: Number(carriedRoutine.start),
        activeType: carriedRoutine.type || (carriedRoutine.mode === "sleeping" ? "sono" : "acordou"),
        activeDetail: carriedRoutine.detail || (Number(carriedRoutine.start) < getDayStart() ? "Continuado de ontem" : ""),
        activeNotes: carriedRoutine.notes || "",
      });
      syncSelectedDayIntoFamilyCache();
      saveLocalDayState(getSelectedDayId());
      renderCurrentState();
      return;
    }
    state = createEmptyDayState();
    saveLocalDayState();
    renderCurrentState();
    return;
  }
  const sleeping = state.mode === "sleeping";
  const nightWakeActive = getActiveNightWakeEvent();
  const mainActionContext = applyMainRoutineActionContext(Date.now());
  setText(stateLabel, sleeping ? (mainActionContext.action === "night-wake" ? "Sono noturno há" : "Dormindo há") : nightWakeActive ? "Despertar noturno há" : "Acordado há");
  setText(stateClock, formatDuration(elapsed));
  const crossedMidnight = Number(state.activeStartedAt) < getDayStart();
  setText(stateHint, crossedMidnight
    ? sleeping
      ? mainActionContext.action === "night-wake"
        ? `Noite continuada de ontem, desde ${formatTime(state.activeStartedAt)}. Ao tocar em Despertar noturno, o Ninou registra a acordada da madrugada.`
        : `Sono continuado de ontem, desde ${formatTime(state.activeStartedAt)}. Ao tocar em Acordou, o Ninou fecha o sono com a duração total.`
      : `Acordado desde ontem, às ${formatTime(state.activeStartedAt)}. O contador segue a partir do último registro.`
    : getWakeWindowText());
  renderActiveTimerCard();
}

const ORBIT_RADIUS = 126;
const ORBIT_CENTER = 160;
const ORBIT_COLLISION_DISTANCE = 34;
const ORBIT_DAY_MINUTES = 1440;

function getOrbitMinuteOfDay(timestamp = Date.now()) {
  const date = new Date(Number(timestamp) || Date.now());
  return date.getHours() * 60 + date.getMinutes() + date.getSeconds() / 60;
}

function getOrbitAngleForMinute(minuteOfDay = 0) {
  // 00:00 embaixo; 06:00 à esquerda; 12:00 em cima; 18:00 à direita.
  return 90 + (Math.max(0, Math.min(ORBIT_DAY_MINUTES, Number(minuteOfDay) || 0)) / ORBIT_DAY_MINUTES) * 360;
}

function orbitPointForMinute(minuteOfDay = 0, radius = ORBIT_RADIUS) {
  const angle = (getOrbitAngleForMinute(minuteOfDay) * Math.PI) / 180;
  return {
    x: Math.round(Math.cos(angle) * radius),
    y: Math.round(Math.sin(angle) * radius),
    svgX: ORBIT_CENTER + Math.cos(angle) * radius,
    svgY: ORBIT_CENTER + Math.sin(angle) * radius,
    angle,
  };
}

function eventPosition(timestamp) {
  return orbitPointForMinute(getOrbitMinuteOfDay(timestamp));
}

function getOrbitPixelScale() {
  const box = orbitTimelineSvg?.getBoundingClientRect?.();
  const width = Number(box?.width);
  return Number.isFinite(width) && width > 0 ? width / (ORBIT_CENTER * 2) : 1;
}

function getScaledOrbitPosition(position = {}) {
  const scale = getOrbitPixelScale();
  return {
    x: (Number(position.x) || 0) * scale,
    y: (Number(position.y) || 0) * scale,
  };
}

function applyOrbitMarkerPosition(element, position) {
  const scaled = getScaledOrbitPosition(position);
  element.style.setProperty("--x", `${scaled.x.toFixed(2)}px`);
  element.style.setProperty("--y", `${scaled.y.toFixed(2)}px`);
}

function getOrbitEventEnd(event) {
  if (event?.isActive) return Date.now();
  return Number(event?.end) || Number(event?.start) || Date.now();
}

function isOrbitDurationEvent(event = {}) {
  const type = String(event?.type || "").toLowerCase();
  return (type.includes("sono") || type === "dormir" || type.includes("soneca"))
    && getOrbitEventEnd(event) > Number(event?.start || 0) + 60 * 1000;
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

function getOrbitGroupPosition(members) {
  const angles = members.map((member) => Math.atan2(member.position.y, member.position.x));
  const avgSin = angles.reduce((total, angle) => total + Math.sin(angle), 0) / angles.length;
  const avgCos = angles.reduce((total, angle) => total + Math.cos(angle), 0) / angles.length;
  const avgAngle = Math.atan2(avgSin, avgCos);
  return {
    x: Math.round(Math.cos(avgAngle) * ORBIT_RADIUS),
    y: Math.round(Math.sin(avgAngle) * ORBIT_RADIUS),
  };
}

function getOrbitGroups(items) {
  const groups = [];
  [...items].sort((a, b) => Number(a.event?.start || 0) - Number(b.event?.start || 0)).forEach((item) => {
    const group = groups.find((candidate) => candidate.items.some((member) => getDistance(member.position, item.position) <= ORBIT_COLLISION_DISTANCE));
    if (group) {
      group.items.push(item);
      group.position = getOrbitGroupPosition(group.items);
    } else {
      groups.push({ items: [item], position: item.position });
    }
  });
  return groups;
}

function polarToCartesian(cx, cy, radius, angleDeg) {
  const angle = (angleDeg * Math.PI) / 180;
  return { x: cx + radius * Math.cos(angle), y: cy + radius * Math.sin(angle) };
}

function describeOrbitArc(startMinute, endMinute, radius = ORBIT_RADIUS) {
  let start = Math.max(0, Math.min(ORBIT_DAY_MINUTES, Number(startMinute) || 0));
  let end = Math.max(0, Math.min(ORBIT_DAY_MINUTES, Number(endMinute) || 0));
  if (end <= start) end = Math.min(ORBIT_DAY_MINUTES, start + 1);
  const startAngle = getOrbitAngleForMinute(start);
  const endAngle = getOrbitAngleForMinute(end);
  const startPoint = polarToCartesian(ORBIT_CENTER, ORBIT_CENTER, radius, startAngle);
  const endPoint = polarToCartesian(ORBIT_CENTER, ORBIT_CENTER, radius, endAngle);
  const largeArcFlag = end - start > ORBIT_DAY_MINUTES / 2 ? 1 : 0;
  return `M ${startPoint.x.toFixed(2)} ${startPoint.y.toFixed(2)} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endPoint.x.toFixed(2)} ${endPoint.y.toFixed(2)}`;
}

function renderOrbitDurationArcs(events = [], orbitStart = getDayStart()) {
  if (!orbitDurationArcs) return;
  orbitDurationArcs.replaceChildren();
  const dayEnd = orbitStart + day;
  events.filter(isOrbitDurationEvent).forEach((event) => {
    const startTs = Math.max(Number(event.start) || orbitStart, orbitStart);
    const endTs = Math.min(getOrbitEventEnd(event), dayEnd);
    if (endTs <= startTs) return;
    const startMinute = (startTs - orbitStart) / 60000;
    const endMinute = (endTs - orbitStart) / 60000;
    const config = getEventConfig(event.type);
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", describeOrbitArc(startMinute, endMinute));
    path.setAttribute("class", `orbit-duration-segment ${config.arcType}${event.isActive ? " active" : ""}`);
    path.setAttribute("pathLength", "100");
    orbitDurationArcs.append(path);
  });
}

function createOrbitEvent(event, active = false, position = eventPosition(event.start)) {
  const config = getEventConfig(event.type);
  const button = document.createElement("button");
  button.type = "button";
  button.className = `orbit-event live-orbit-marker ${config.arcType}${active ? " active" : ""}`;
  applyOrbitMarkerPosition(button, position);
  button.innerHTML = `<i>${config.icon}</i>`;
  button.title = `${config.title} às ${formatTime(event.start)}`;
  button.setAttribute("aria-label", `${config.title} às ${formatTime(event.start)}`);
  button.addEventListener("click", () => openOrbitCluster([event], { title: config.title }));
  return button;
}

function createOrbitCluster(group) {
  const eventList = group.items.map((item) => item.event).sort((a, b) => a.start - b.start);
  const config = getEventConfig(eventList[eventList.length - 1].type);
  const button = document.createElement("button");
  button.type = "button";
  button.className = `orbit-event live-orbit-marker orbit-cluster ${config.arcType}`;
  applyOrbitMarkerPosition(button, group.position);
  button.title = `${eventList.length} ações próximas`;
  button.setAttribute("aria-label", `${eventList.length} ações agrupadas na linha do tempo`);
  button.innerHTML = `<i class="orbit-cluster-icon">${config.icon}<span class="orbit-cluster-count">${eventList.length}</span></i>`;
  button.addEventListener("click", () => openOrbitCluster(eventList, { title: `${eventList.length} ações agrupadas` }));
  return button;
}

function getEventRenderSignature(event, options = {}) {
  return buildEventRenderSignature(event, options);
}

function getOrbitItemSignature(item) {
  return [
    getEventRenderSignature(item.event, { active: item.active }),
    item.active ? `active-${Math.floor(Date.now() / 60000)}` : "done",
    item.position.x,
    item.position.y,
  ].join("|");
}

function getOrbitRenderSignature(items) {
  return [`scale:${getOrbitPixelScale().toFixed(4)}`, items.map(getOrbitItemSignature).join("||")].join("::");
}

function getTimelineRenderSignature(selectedStart, selectedEnd, visibleEvents, latest) {
  return buildTimelineSignature(selectedStart, selectedEnd, currentDiaryFilter, visibleEvents, latest);
}

function renderOrbit() {
  if (!orbitEvents) return;
  const now = Date.now();
  const orbitStart = getDayStart(now);
  const orbitEnd = orbitStart + day;
  const dayEvents = getFamilyEventsForWindow(orbitStart, orbitEnd)
    .filter((event) => eventOverlapsWindow(event, orbitStart, orbitEnd))
    .sort((a, b) => Number(a.start) - Number(b.start));

  const displayEvents = dayEvents.slice(-72).map((event) => ({
    event,
    active: false,
    position: eventPosition(Math.max(Number(event.start) || orbitStart, orbitStart)),
  }));

  let activeEvent = null;
  if (state.mode === "sleeping") {
    const activeStartedAt = Number(state.activeStartedAt) || now;
    activeEvent = {
      id: `active-${state.activeType || "sono"}-${Math.round(activeStartedAt)}`,
      type: state.activeType || "sono",
      start: activeStartedAt,
      end: now,
      detail: state.activeDetail || "Em andamento",
      notes: state.activeNotes || "",
      isActive: true,
    };
    displayEvents.push({ event: activeEvent, active: true, position: eventPosition(activeStartedAt) });
  }

  renderOrbitDurationArcs([...dayEvents, ...(activeEvent ? [activeEvent] : [])], orbitStart);

  const nextSignature = getOrbitRenderSignature(displayEvents);
  if (nextSignature === orbitRenderSignature) return;
  orbitRenderSignature = nextSignature;
  orbitEvents.replaceChildren();

  getOrbitGroups(displayEvents).forEach((group) => {
    orbitEvents.append(group.items.length > 1 ? createOrbitCluster(group) : createOrbitEvent(group.items[0].event, group.items[0].active, group.position));
  });
}

let orbitLayoutTimer = 0;
function scheduleOrbitLayoutRender() {
  window.clearTimeout(orbitLayoutTimer);
  orbitLayoutTimer = window.setTimeout(() => {
    orbitRenderSignature = "";
    renderOrbit();
  }, 120);
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
    timeline.append(createEmptyTimelineItem(getDiaryEmptyRecordMarkup({
      isToday: selectedStart === getDayStart(),
      hasFilter: currentDiaryFilter !== "all",
      babyName: getBabyReference(),
    })));
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

function openOrbitCluster(events, options = {}) {
  const selectedStart = selectedDiaryDay ?? getDayStart();
  const orderedEvents = [...events].sort((a, b) => a.start - b.start);
  orbitClusterTitle.textContent = options?.title || `${orderedEvents.length} registros próximos`;
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
  if (orbitClusterViewAllButton) orbitClusterViewAllButton.textContent = `Ver todos os registros`;
  orbitClusterSheet.hidden = false;
  sheetBackdrop.hidden = false;
  orbitClusterList.scrollTop = 0;
  requestAnimationFrame(() => {
    orbitClusterSheet.scrollTop = 0;
    orbitClusterList.scrollTop = 0;
  });
}

function closeOrbitCluster() {
  orbitClusterSheet.hidden = true;
  orbitClusterList.innerHTML = "";
  if (orbitClusterViewAllButton) orbitClusterViewAllButton.blur();
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

const DATA_REPORT_BAR_MAX_HEIGHT_PERCENT = 64;
const DATA_REPORT_BAR_MIN_FILLED_HEIGHT_PERCENT = 10;
const DATA_REPORT_BAR_EMPTY_HEIGHT_PERCENT = 7;

function getDataReportBarHeightPercent(value, maxValue) {
  const numericValue = Number(value) || 0;
  const numericMax = Math.max(Number(maxValue) || 0, 1);
  if (numericValue <= 0) return DATA_REPORT_BAR_EMPTY_HEIGHT_PERCENT;
  return Math.max(DATA_REPORT_BAR_MIN_FILLED_HEIGHT_PERCENT, Math.round((numericValue / numericMax) * DATA_REPORT_BAR_MAX_HEIGHT_PERCENT));
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
  days.forEach((item, index) => {
    const bar = document.createElement("span");
    const height = getDataReportBarHeightPercent(item.sleepMs, maxSleep);
    bar.style.setProperty("--h", `${height}%`);
    bar.style.setProperty("--delay", `${index * 36}ms`);
    bar.classList.toggle("is-empty", item.sleepMs <= 0);
    bar.classList.toggle("has-value", item.sleepMs > 0);
    bar.dataset.rawValue = String(item.sleepMs || 0);
    bar.dataset.value = item.sleepMs ? formatShortDuration(item.sleepMs) : "0";
    bar.dataset.day = item.label;
    bar.setAttribute("aria-label", `${item.label}: ${item.sleepMs ? formatShortDuration(item.sleepMs) : "0"}`);
    bar.innerHTML = `<b>${item.sleepMs ? formatShortDuration(item.sleepMs) : "0"}</b><i>${item.label}</i>`;
    sleepBars.append(bar);
  });
  const sleepCard = sleepBars.closest(".data-chart-card");
  const hasSleepData = days.some((item) => item.sleepMs > 0);
  sleepBars.dataset.hasRealData = hasSleepData ? "true" : "false";
  sleepBars.dataset.hasData = hasSleepData ? "true" : "false";
  sleepBars.classList.toggle("is-operational", hasSleepData);
  sleepBars.classList.toggle("is-empty", !hasSleepData);
  if (sleepCard) {
    sleepCard.dataset.hasRealData = hasSleepData ? "true" : "false";
    sleepCard.dataset.hasData = hasSleepData ? "true" : "false";
    if (!sleepCard.querySelector(".data-chart-empty-hint")) {
      const hint = document.createElement("small");
      hint.className = "data-chart-empty-hint";
      hint.textContent = "Sem registros neste período.";
      sleepCard.append(hint);
    }
  }

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
  const setChartDataState = (container, values = []) => {
    if (!container) return;
    const card = container.closest(".data-chart-card");
    const hasData = values.some((value) => Number(value) > 0);
    container.dataset.hasRealData = hasData ? "true" : "false";
    if (card) card.dataset.hasRealData = hasData ? "true" : "false";
    if (card && !card.querySelector(".data-chart-empty-hint")) {
      const hint = document.createElement("small");
      hint.className = "data-chart-empty-hint";
      hint.textContent = "Sem registros neste período.";
      card.append(hint);
    }
  };
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

  const breastfeedingValues = reportDays.map((item) => countBreastfeedingEvents(item.events));
  renderBarChart(
    breastfeedingBars,
    reportDays,
    (item) => countBreastfeedingEvents(item.events),
  );
  setChartDataState(breastfeedingBars, breastfeedingValues);

  const bottleValues = reportDays.map((item) => sumBottleAmountMl(item.events));
  renderBarChart(
    bottleBars,
    reportDays,
    (item) => sumBottleAmountMl(item.events),
    (value) => value ? `${formatNumber(value)} ml` : "0",
  );
  setChartDataState(bottleBars, bottleValues);

  const diaperValues = reportDays.map((item) => countDiaperEvents(item.events));
  renderBarChart(
    diaperBars,
    reportDays,
    (item) => countDiaperEvents(item.events),
  );
  setChartDataState(diaperBars, diaperValues);

  const medicationValues = reportDays.map((item) => countMedicationEvents(item.events));
  renderBarChart(
    medicationBars,
    reportDays,
    (item) => countMedicationEvents(item.events),
  );
  setChartDataState(medicationBars, medicationValues);
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
  renderQuickCorrectionCard();
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
  if (!breastTimerPanel) return;

  // v75.75.102: evita timer travado em 00:00 caso CSS antigo tenha deixado
  // o painel visível enquanto o atributo hidden ainda estava ativo.
  const isBreastfeedingType = currentSheetType === "amamentacao";
  if (breastTimerPanel.hidden && isBreastfeedingType) {
    breastTimerPanel.hidden = false;
  }
  if (breastTimerPanel.hidden) return;

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
  const sleepTotalText = formatShortDuration(getSleepMsForRange(todayStart, todayStart + day));
  const bottleCount = events.filter((event) => event.type === "mamadeira").length;
  const bottleTotal = sumBottleAmountMl(events);
  const diaperCount = countDiaperEvents(events);
  const liveStartedAt = Number(state.activeStartedAt);
  const liveElapsedMs = Number.isFinite(liveStartedAt) ? Math.max(0, now - liveStartedAt) : 0;
  const stateText = state.mode === "sleeping"
    ? `Dormindo há ${formatRoutineDurationSafe(liveElapsedMs, 72)}`
    : awakeInfo.hasWake && awakeInfo.isOpen
      ? `Acordado há ${formatRoutineDurationSafe(Number(awakeInfo.durationMs) || 0, 72)}`
      : events.length ? "Rotina em andamento" : "Sem registro";
  const bottleText = lastBottle ? `${formatTime(lastBottle.start)}${getBottleAmountText(lastBottle)}` : "Sem registro";
  const diaperText = lastDiaper ? `${formatTime(lastDiaper.start)}${lastDiaper.detail && lastDiaper.detail !== "Não se aplica" ? ` • ${lastDiaper.detail}` : ""}` : "Sem registro";

  if (todayOverviewTitle) todayOverviewTitle.textContent = `Hoje com ${baby}`;
  if (todayOverviewKicker) todayOverviewKicker.textContent = "Resumo do dia";
  todayOverviewGrid.innerHTML = [
    ["Estado atual", stateText],
    ["Sono total", sleepTotalText],
    ["Mamadeiras", bottleCount ? `${bottleCount}${bottleTotal ? ` • ${bottleTotal} ml` : ""}` : "0"],
    ["Fraldas", String(diaperCount || 0)],
    ["Última mamadeira", bottleText],
    ["Última fralda", diaperText],
  ].map(([label, value]) => `<article><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></article>`).join("");

  if (todayOverviewSuggestion) {
    let suggestion = "Registre a primeira ação para o Ninou acompanhar o dia com você.";
    if (state.mode === "sleeping") suggestion = `${baby} está dormindo agora. O resumo será atualizado quando acordar.`;
    else if (awakeInfo.hasWake && awakeInfo.isOpen) {
      const awakeMs = Math.max(0, Number(awakeInfo.durationMs) || 0);
      const targetMs = wakeWindowMinutes * 60000;
      if (!isSaneRoutineDuration(awakeMs, 72)) suggestion = "O Ninou encontrou um horário antigo demais. Revise o último Acordou/Soneca antes de usar a sugestão.";
      else if (awakeMs >= targetMs * 0.85) suggestion = `${baby} está acordado há ${formatShortDuration(awakeMs)}. Talvez seja hora de observar sinais de sono.`;
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
  const sleepMs = getSleepMsForRange(todayStart, Math.min(todayStart + day, now));
  const feedCount = countFeedingEvents(events);
  const diaperCount = countDiaperEvents(events);

  let title = "Rotina tranquila";
  let text = "O Ninou mostrará lembretes leves conforme os registros aparecerem.";
  let show = false;

  const awakeInfo = getTodayAwakeCalculation(now, events);
  if (state.mode === "awake" && awakeInfo.hasWake && awakeInfo.isOpen) {
    const awakeMs = Number(awakeInfo.durationMs) || 0;
    const referenceMs = Math.max(30, wakeWindowMinutes) * 60000;
    if (awakeMs >= referenceMs * 0.9) {
      title = `${baby} está acordado há ${formatShortDuration(awakeMs)}`;
      text = "Talvez seja um bom momento para observar sinais de sono. Este é só um lembrete gentil, sem diagnóstico.";
      show = true;
    }
  }

  if (!show && lastFeed && now - Number(lastFeed.start) >= 3 * hour) {
    title = `Última alimentação há ${formatShortDuration(now - Number(lastFeed.start))}`;
    text = "Confira com calma se a próxima mamada já faz sentido para a rotina de vocês.";
    show = true;
  }

  if (!show && lastDiaper && now - Number(lastDiaper.start) >= 4 * hour) {
    title = `Última fralda às ${formatTime(lastDiaper.start)}`;
    text = "Quando fizer sentido, vale conferir se já está na hora da próxima troca.";
    show = true;
  }

  if (!show && events.length >= 4 && sleepMs < 45 * 60000 && feedCount >= 2 && diaperCount >= 1) {
    title = "Sono ainda baixo hoje";
    text = "O dia já tem alguns registros, mas pouco sono acumulado. Observe os sinais do bebê com tranquilidade.";
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
  const now = Date.now();
  const events = getFamilyEventsForWindow(todayStart, todayStart + day);
  const ordered = [...events].sort((a, b) => Number(a.start) - Number(b.start));
  const latestFeed = [...ordered].reverse().find((event) => event.type === "mamadeira" || event.type === "amamentacao");
  const latestDiaper = [...ordered].reverse().find((event) => event.type === "fralda");
  const latestAny = ordered[ordered.length - 1] || null;
  const sleepMs = getSleepMsForRange(todayStart, Math.min(todayStart + day, now));
  const feeds = countFeedingEvents(events);
  const diapers = countDiaperEvents(events);
  const meds = countMedicationEvents(events);
  const items = [];

  if (!events.length) {
    items.push({ icon: "✨", title: "Dia pronto para começar", text: "Faça o primeiro registro para o Ninou montar sugestões e resumo do dia." });
    return items;
  }

  const awakeInfo = getTodayAwakeCalculation(now, events);
  if (state.mode === "awake" && awakeInfo.hasWake && awakeInfo.isOpen) {
    const awake = Math.max(0, Number(awakeInfo.durationMs) || 0);
    const reference = Math.max(30, wakeWindowMinutes) * 60000;
    if (awake >= reference * 0.9) {
      items.push({ icon: "🌙", title: "Sono", text: `${getBabyDisplayName()} está acordado há ${formatShortDuration(awake)}. Observe sinais de sono com calma.` });
    }
  }

  if (latestFeed) {
    const elapsed = now - Number(latestFeed.start);
    if (elapsed > 2.5 * hour) {
      items.push({ icon: "🍼", title: "Alimentação", text: `Já faz ${formatShortDuration(elapsed)} desde a última alimentação registrada.` });
    }
  } else if (events.length >= 2) {
    items.push({ icon: "🍼", title: "Alimentação", text: "Ainda não há alimentação registrada hoje." });
  }

  if (latestDiaper) {
    const elapsed = now - Number(latestDiaper.start);
    if (elapsed > 3.5 * hour) {
      items.push({ icon: "🧷", title: "Fralda", text: `Última fralda registrada há ${formatShortDuration(elapsed)}.` });
    }
  } else if (events.length >= 2) {
    items.push({ icon: "🧷", title: "Fralda", text: "Ainda não há fralda registrada hoje." });
  }

  if (events.length >= 4 && sleepMs < 45 * 60000) {
    items.push({ icon: "🌙", title: "Sono acumulado", text: `Sono registrado hoje: ${formatShortDuration(sleepMs)}. Observe se uma soneca faz sentido.` });
  }

  if (meds) {
    items.push({ icon: "💊", title: "Medicamento", text: `${meds} ${meds === 1 ? "dose registrada" : "doses registradas"} hoje.` });
  }

  if (latestAny?.createdByName || latestAny?.createdByEmail) {
    items.push({ icon: "👥", title: "Última atualização", text: `${getActorDisplayNameFromEvent(latestAny)} registrou ${getEventConfig(latestAny.type).title.toLowerCase()} às ${formatTime(latestAny.start)}.` });
  }

  if (!items.length) {
    items.push({ icon: "🌿", title: "Tudo organizado", text: `Hoje há ${events.length} registros, ${feeds} alimentação(ões) e ${diapers} fralda(s).` });
  }
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
  const hourNow = new Date(now).getHours();

  if (daySummaryMoment) {
    daySummaryMoment.textContent = hourNow >= 20 ? "Fechamento do dia" : "Resumo em tempo real";
  }

  if (!events.length) {
    daySummaryText.textContent = "Ainda não há registros hoje. Comece com sono, mamada, fralda ou medicamento para o Ninou montar um resumo acolhedor do dia.";
    return;
  }

  const recentSleepValues = [];
  for (let idx = 1; idx <= 6; idx += 1) {
    const dStart = todayStart - idx * day;
    const dEvents = getFamilyEventsForWindow(dStart, dStart + day);
    if (!dEvents.length) continue;
    recentSleepValues.push(getSleepMsForRange(dStart, dStart + day));
  }
  const recentSleepAvg = recentSleepValues.length
    ? recentSleepValues.reduce((total, value) => total + value, 0) / recentSleepValues.length
    : 0;

  const latestTitle = latest ? getEventConfig(latest.type).title.toLowerCase() : "registro";
  const lastText = latest ? ` Último registro: ${latestTitle} às ${formatTime(latest.start)}.` : "";
  const bottleText = bottleMl ? `, ${bottleMl} ml em mamadeiras` : "";
  const medText = meds ? `, ${meds} ${meds === 1 ? "medicamento" : "medicamentos"}` : "";
  let comparison = "";

  if (recentSleepAvg && sleepMs) {
    const diff = sleepMs - recentSleepAvg;
    if (Math.abs(diff) <= 35 * 60000) {
      comparison = " O sono está próximo da média recente.";
    } else if (diff > 0) {
      comparison = ` O sono está ${formatShortDuration(diff)} acima da média recente.`;
    } else {
      comparison = ` O sono está ${formatShortDuration(Math.abs(diff))} abaixo da média recente.`;
    }
  }

  const rhythmText = events.length >= 6
    ? " A rotina de hoje já tem boa quantidade de registros."
    : " O resumo ainda é parcial e vai melhorar com mais registros.";

  daySummaryText.textContent = `Hoje ${baby} dormiu ${formatShortDuration(sleepMs)}, teve ${feeds} ${feeds === 1 ? "alimentação" : "alimentações"}, ${diapers} ${diapers === 1 ? "fralda" : "fraldas"} e ${naps} ${naps === 1 ? "sono" : "sonos"} registrados${bottleText}${medText}.${comparison}${rhythmText}${lastText}`.trim();
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


function buildPremiumSmoothPath(points = []) {
  if (!points.length) return "";
  if (points.length < 3) {
    return points.map((point, index) => `${index ? "L" : "M"}${point.x.toFixed(1)} ${point.y.toFixed(1)}`).join(" ");
  }
  const path = [`M${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`];
  for (let index = 0; index < points.length - 1; index += 1) {
    const current = points[index];
    const next = points[index + 1];
    const previous = points[index - 1] || current;
    const afterNext = points[index + 2] || next;
    const cp1x = current.x + (next.x - previous.x) / 6;
    const cp1y = current.y + (next.y - previous.y) / 6;
    const cp2x = next.x - (afterNext.x - current.x) / 6;
    const cp2y = next.y - (afterNext.y - current.y) / 6;
    path.push(`C${cp1x.toFixed(1)} ${cp1y.toFixed(1)} ${cp2x.toFixed(1)} ${cp2y.toFixed(1)} ${next.x.toFixed(1)} ${next.y.toFixed(1)}`);
  }
  return path.join(" ");
}

function renderSparkline(container, weights = []) {
  if (!container) return;
  const normalized = weights
    .map((item) => ({ ...item, kg: getWeightKgValue(item.value) }))
    .filter((item) => Number.isFinite(item.kg))
    .slice(-10);

  container.classList.add("premium-weight-chart", "weight-chart-readable");

  if (!normalized.length) {
    container.innerHTML = `
      <div class="weight-empty-state weight-empty-state-readable">
        <strong>Sem peso cadastrado</strong>
        <span>Registre o primeiro peso no Perfil para montar uma curva simples e legível.</span>
      </div>`;
    return;
  }

  const latest = normalized[normalized.length - 1];
  const latestDate = String(latest.date || "").split("-").reverse().join("/");

  if (normalized.length < 2) {
    container.innerHTML = `
      <div class="weight-single-state" aria-label="Peso atual">
        <span>Peso atual</span>
        <strong>${escapeHtml(formatKg(latest.value))}</strong>
        <small>${escapeHtml(latestDate || "Primeiro registro")}</small>
        <em>Com mais um peso, o Ninou desenha a evolução.</em>
      </div>`;
    return;
  }

  const values = normalized.map((item) => item.kg);
  const realMin = Math.min(...values);
  const realMax = Math.max(...values);
  const delta = values[values.length - 1] - values[0];
  const naturalSpread = Math.max(0.18, realMax - realMin);
  const paddedMin = Math.max(0, realMin - Math.max(0.08, naturalSpread * 0.22));
  const paddedMax = realMax + Math.max(0.08, naturalSpread * 0.22);
  const spread = Math.max(0.18, paddedMax - paddedMin);
  const width = 360;
  const height = 190;
  const chartLeft = 58;
  const chartRight = width - 24;
  const chartTop = 34;
  const chartBottom = height - 48;
  const points = normalized.map((item, index) => {
    const x = normalized.length === 1 ? (chartLeft + chartRight) / 2 : chartLeft + (index / (normalized.length - 1)) * (chartRight - chartLeft);
    const y = chartBottom - ((item.kg - paddedMin) / spread) * (chartBottom - chartTop);
    return { x, y, item };
  });
  const path = buildPremiumSmoothPath(points);
  const areaPath = `${path} L${points[points.length - 1].x.toFixed(1)} ${chartBottom} L${points[0].x.toFixed(1)} ${chartBottom} Z`;
  const axisValues = [realMax, (realMax + realMin) / 2, realMin];
  const gridLines = axisValues.map((value) => {
    const y = chartBottom - ((value - paddedMin) / spread) * (chartBottom - chartTop);
    return `<g class="weight-grid-row"><line x1="${chartLeft}" y1="${y.toFixed(1)}" x2="${chartRight}" y2="${y.toFixed(1)}" class="weight-grid-line"></line><text x="${chartLeft - 8}" y="${(y + 4).toFixed(1)}" text-anchor="end" class="weight-axis-label">${escapeHtml(formatKg(value))}</text></g>`;
  }).join("");
  const circles = points.map((point, index) => {
    const isLast = index === points.length - 1;
    const radius = isLast ? 6.2 : 4.2;
    return `<g class="weight-point${isLast ? " is-latest" : ""}"><circle cx="${point.x.toFixed(1)}" cy="${point.y.toFixed(1)}" r="${radius}"></circle><title>${escapeHtml(formatReportDate(point.item.date))} • ${escapeHtml(formatKg(point.item.value))}</title></g>`;
  }).join("");
  const firstDate = escapeHtml(String(normalized[0].date || "").split("-").reverse().slice(0, 2).join("/"));
  const lastDate = escapeHtml(String(normalized[normalized.length - 1].date || "").split("-").reverse().slice(0, 2).join("/"));
  const deltaLabel = escapeHtml(formatWeightDelta(delta).replace(" desde o peso anterior", " no período"));
  const latestLabelX = Math.max(chartLeft + 38, Math.min(chartRight - 46, points[points.length - 1].x));
  const latestLabelY = Math.max(chartTop + 18, points[points.length - 1].y - 14);

  container.innerHTML = `
    <div class="weight-chart-topline weight-chart-topline-readable">
      <span>${normalized.length} registros</span>
      <strong>${deltaLabel}</strong>
    </div>
    <svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Evolução de peso do bebê">
      <defs>
        <linearGradient id="weightPremiumFillReadable" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="currentColor" stop-opacity=".18"/>
          <stop offset="1" stop-color="currentColor" stop-opacity=".025"/>
        </linearGradient>
        <filter id="weightGlowReadable" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="4" stdDeviation="4" flood-color="currentColor" flood-opacity=".14"/>
        </filter>
      </defs>
      ${gridLines}
      <path d="${areaPath}" fill="url(#weightPremiumFillReadable)" class="weight-area-path"></path>
      <path d="${path}" fill="none" stroke="currentColor" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round" filter="url(#weightGlowReadable)" class="weight-main-path"></path>
      ${circles}
      <g class="weight-latest-label">
        <rect x="${(latestLabelX - 42).toFixed(1)}" y="${(latestLabelY - 18).toFixed(1)}" width="84" height="26" rx="13"></rect>
        <text x="${latestLabelX.toFixed(1)}" y="${(latestLabelY - 1).toFixed(1)}" text-anchor="middle">${escapeHtml(formatKg(latest.value))}</text>
      </g>
      <text x="${chartLeft}" y="${height - 18}" class="weight-date-label">${firstDate}</text>
      <text x="${chartRight}" y="${height - 18}" text-anchor="end" class="weight-date-label">${lastDate}</text>
    </svg>`;
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


function getCurrentDayNotesModel(dayId = getSelectedDayId()) {
  const safeDayId = isDateId(dayId) ? dayId : getSelectedDayId();
  if (currentDayNotesModel.dayId === safeDayId) return currentDayNotesModel;

  const persisted = loadLocalDayNotes(safeDayId);
  const sourceText = normalizeSafeDayNotes(getValidDayNotesForDay(state, safeDayId));
  const parsedState = splitDayNotesText(sourceText);
  const model = normalizeDayNotesModel({
    dayId: safeDayId,
    entries: persisted?.entries?.length ? persisted.entries : parsedState.entries,
    freeform: typeof persisted?.freeform === "string" ? persisted.freeform : parsedState.freeform,
    updatedAt: Number(persisted?.updatedAt || state.dayNotesUpdatedAt || 0),
  });
  currentDayNotesModel = model;
  return currentDayNotesModel;
}

function formatDayNotesAutosaveLabel(updatedAt = 0) {
  const time = Number(updatedAt) > 0 ? formatTime(updatedAt) : "agora";
  return `Salvo automaticamente • ${time}`;
}

function updateDayNotesAutosaveBadge(label = "Salvo automaticamente") {
  if (!dayNotesAutosaveBadge) return;
  dayNotesAutosaveBadge.textContent = label;
}

function renderDayNoteEpisodes(entries = []) {
  if (!dayNotesEpisodes) return;
  const normalizedEntries = normalizeDayNoteEntries(entries);
  if (!normalizedEntries.length) {
    dayNotesEpisodes.innerHTML = `<article class="day-note-episode-card is-empty"><span>Nenhum episódio registrado ainda. Toque em um atalho ou em “Novo episódio” para registrar horário, tipo e responsável.</span></article>`;
    return;
  }
  dayNotesEpisodes.innerHTML = normalizedEntries.map((entry) => `
    <article class="day-note-episode-card" data-day-note-entry="${escapeHtml(entry.id)}">
      <span class="day-note-episode-icon" aria-hidden="true">${escapeHtml(entry.icon || inferDayNoteIcon(entry.text))}</span>
      <div class="day-note-episode-main">
        <div class="day-note-episode-topline">
          <span class="day-note-episode-time">${escapeHtml(entry.time)}</span>
          <span class="day-note-episode-tag">👤 ${escapeHtml(entry.actor || "Responsável")}</span>
        </div>
        <strong class="day-note-episode-text">${escapeHtml(entry.text)}</strong>
      </div>
      <div class="day-note-episode-actions">
        <button class="day-note-episode-edit" type="button" aria-label="Editar episódio" title="Editar episódio" data-edit-day-note-entry="${escapeHtml(entry.id)}">✎</button>
        <button class="day-note-episode-remove" type="button" aria-label="Remover episódio" title="Remover episódio" data-remove-day-note-entry="${escapeHtml(entry.id)}">×</button>
      </div>
    </article>
  `).join("");
}

function getDayNotesStatusLabel(model = {}) {
  const entriesCount = normalizeDayNoteEntries(model?.entries || []).length;
  const hasFreeform = Boolean(normalizeSafeDayNotes(model?.freeform || "").trim());
  if (!entriesCount && !hasFreeform) return "Nenhuma observação registrada neste dia.";
  if (!entriesCount && hasFreeform) return "Nota livre salva automaticamente.";
  const episodeLabel = `${entriesCount} ${entriesCount === 1 ? "episódio" : "episódios"}`;
  return hasFreeform
    ? `${episodeLabel} • nota livre salva automaticamente.`
    : `${episodeLabel} salvo${entriesCount === 1 ? "" : "s"} automaticamente.`;
}

function saveDayNotesModel(model = {}, options = {}) {
  const selectedDayId = isDateId(model?.dayId) ? model.dayId : getSelectedDayId();
  const normalizedModel = normalizeDayNotesModel({ ...model, dayId: selectedDayId, updatedAt: Date.now() });
  currentDayNotesModel = normalizedModel;

  state.dayNotes = normalizedModel.text;
  state.dayNotesDayId = normalizedModel.text ? selectedDayId : "";
  state.dayNotesUpdatedAt = normalizedModel.updatedAt;

  const savedLocally = saveLocalDayNotes(selectedDayId, normalizedModel.text, normalizedModel.updatedAt, {
    entries: normalizedModel.entries,
    freeform: normalizedModel.freeform,
  });
  state = sanitizeDayStateForDay(state, selectedDayId, { preserveLive: true });
  saveDayState();
  renderDayNotesPanel();

  if (dayNotesStatus) {
    dayNotesStatus.textContent = savedLocally
      ? getDayNotesStatusLabel(normalizedModel)
      : "Não foi possível salvar neste aparelho.";
  }
  updateDayNotesAutosaveBadge(savedLocally ? formatDayNotesAutosaveLabel(normalizedModel.updatedAt) : "Falha ao salvar");
  if (!options?.silentToast) showToast?.(savedLocally ? (options?.toastMessage || "Observação salva.") : "Falha ao salvar a observação neste aparelho.");
  return savedLocally;
}

function renderDayNotesPanel() {
  if (!dayNotesTextarea) return;
  const selectedDayId = getSelectedDayId();
  const model = getCurrentDayNotesModel(selectedDayId);
  if (state.dayNotes !== model.text) {
    state.dayNotes = model.text;
    state.dayNotesDayId = model.text ? selectedDayId : "";
  }
  if (document.activeElement !== dayNotesTextarea) dayNotesTextarea.value = model.freeform;
  renderDayNoteEpisodes(model.entries);
  if (dayNotesStatus) dayNotesStatus.textContent = getDayNotesStatusLabel(model);
  updateDayNotesAutosaveBadge(model.updatedAt ? formatDayNotesAutosaveLabel(model.updatedAt) : "Salvo automaticamente");
}

function getCurrentActorLabel() {
  const actor = getCurrentActorProfile();
  return actor?.displayName || actor?.label || actor?.email || "Responsável";
}

function setSelectedDayNoteIcon(icon = "✦") {
  selectedDayNoteIcon = String(icon || "✦").trim() || "✦";
  if (dayNoteModalIconPreview) dayNoteModalIconPreview.textContent = selectedDayNoteIcon;
  dayNoteIconButtons.forEach((button) => {
    const selected = button.dataset.dayNoteIcon === selectedDayNoteIcon;
    button.classList.toggle("is-selected", selected);
    button.setAttribute("aria-pressed", selected ? "true" : "false");
  });
}

function updateDayNoteModalCounter() {
  if (!dayNoteModalTextInput || !dayNoteModalCounter) return;
  const remaining = Math.max(0, 180 - String(dayNoteModalTextInput.value || "").length);
  dayNoteModalCounter.textContent = `${remaining} caracteres disponíveis`;
}

function openDayNoteEntryModal(options = {}) {
  if (!requireLogin(options.entryId ? "editar episódio da observação" : "adicionar episódio à observação")) return;
  if (!dayNoteEpisodeModal) return;

  const model = getCurrentDayNotesModel(getSelectedDayId());
  const entry = options.entryId
    ? normalizeDayNoteEntries(model.entries).find((item) => item.id === String(options.entryId))
    : null;

  editingDayNoteEntryId = entry?.id || "";
  const actorLabel = entry?.actor || getCurrentActorLabel();
  const textValue = entry?.text || String(options.text || "").trim();
  const timeValue = entry?.time || normalizeDayNoteTimeValue(formatTime(Date.now()));
  const iconValue = entry?.icon || options.icon || inferDayNoteIcon(textValue);

  if (dayNoteModalTimeInput) dayNoteModalTimeInput.value = normalizeDayNoteTimeValue(timeValue);
  if (dayNoteModalActorInput) dayNoteModalActorInput.value = actorLabel;
  if (dayNoteModalTextInput) dayNoteModalTextInput.value = textValue;
  if (dayNoteEpisodeModalEyebrow) dayNoteEpisodeModalEyebrow.textContent = entry ? "Editar episódio" : "Novo episódio";
  if (dayNoteEpisodeModalTitle) dayNoteEpisodeModalTitle.textContent = entry ? "Ajustar observação" : "Adicionar observação";
  if (saveDayNoteEntryButton) saveDayNoteEntryButton.textContent = entry ? "Salvar alterações" : "Salvar episódio";
  if (deleteDayNoteEntryButton) deleteDayNoteEntryButton.hidden = !entry;

  setSelectedDayNoteIcon(iconValue || "✦");
  updateDayNoteModalCounter();
  dayNoteEpisodeModal.style.removeProperty("display");
  dayNoteEpisodeModal.hidden = false;
  dayNoteEpisodeModal.inert = false;
  dayNoteEpisodeModal.removeAttribute("aria-hidden");
  document.body.classList.add("day-note-episode-modal-open");
  window.setTimeout(() => dayNoteModalTextInput?.focus({ preventScroll: true }), 60);
}

function closeDayNoteEntryModal() {
  if (!dayNoteEpisodeModal) return;
  dayNoteEpisodeModal.hidden = true;
  dayNoteEpisodeModal.inert = true;
  dayNoteEpisodeModal.setAttribute("aria-hidden", "true");
  dayNoteEpisodeModal.style.setProperty("display", "none", "important");
  document.body.classList.remove("day-note-episode-modal-open");
  editingDayNoteEntryId = "";
  selectedDayNoteIcon = "✦";
}

function saveDayNoteEntryFromModal() {
  if (!requireLogin(editingDayNoteEntryId ? "editar episódio da observação" : "adicionar episódio à observação")) return;
  const textValue = String(dayNoteModalTextInput?.value || "").trim().replace(/\s+/g, " ");
  if (!textValue) {
    showToast?.("Descreva o episódio antes de salvar.");
    dayNoteModalTextInput?.focus();
    return;
  }

  const model = getCurrentDayNotesModel(getSelectedDayId());
  const existingEntries = normalizeDayNoteEntries(model.entries);
  const actorLabel = String(dayNoteModalActorInput?.value || getCurrentActorLabel()).trim() || "Responsável";
  const entry = normalizeDayNoteEntry({
    id: editingDayNoteEntryId || createDayNoteEntryId(),
    time: dayNoteModalTimeInput?.value || formatTime(Date.now()),
    text: textValue,
    actor: actorLabel,
    icon: selectedDayNoteIcon || inferDayNoteIcon(textValue),
  });

  if (!entry) return;
  if (editingDayNoteEntryId) {
    model.entries = existingEntries.map((item) => item.id === editingDayNoteEntryId ? entry : item);
  } else {
    model.entries = [...existingEntries, entry];
  }
  model.freeform = normalizeSafeDayNotes(dayNotesTextarea?.value || model.freeform || "");
  const projected = buildDayNotesTextFromModel(model);
  if (projected.length > MAX_DAY_NOTES_LENGTH + 500) {
    showToast?.("As observações deste dia atingiram o limite disponível.");
    return;
  }

  const wasEditing = Boolean(editingDayNoteEntryId);
  closeDayNoteEntryModal();
  try {
    const saved = saveDayNotesModel(model, { silentToast: true });
    if (!saved) showToast?.("Não foi possível salvar o episódio neste aparelho.");
    else updateDayNotesAutosaveBadge(formatDayNotesAutosaveLabel(Date.now()));
  } catch (error) {
    console.error("Falha ao salvar episódio da observação:", error);
    showToast?.(wasEditing ? "Não foi possível atualizar o episódio." : "Não foi possível salvar o episódio.");
  }
}

function removeDayNoteEntry(entryId = "", options = {}) {
  if (!requireLogin("remover episódio da observação")) return;
  const safeEntryId = String(entryId || "").trim();
  if (!safeEntryId) return;
  if (options.confirm !== false && !window.confirm("Remover este episódio das observações do dia?")) return;

  const model = getCurrentDayNotesModel(getSelectedDayId());
  const entries = normalizeDayNoteEntries(model.entries);
  const nextEntries = entries.filter((entry) => entry.id !== safeEntryId);
  if (nextEntries.length === entries.length) return;
  model.entries = nextEntries;
  model.freeform = normalizeSafeDayNotes(dayNotesTextarea?.value || model.freeform || "");
  saveDayNotesModel(model, { toastMessage: "Episódio removido." });
  if (editingDayNoteEntryId === safeEntryId) closeDayNoteEntryModal();
}

function scheduleDayNotesAutosave() {
  if (!requireLogin("editar observações do dia")) return;
  if (!dayNotesTextarea) return;
  const value = normalizeSafeDayNotes(dayNotesTextarea.value || "");
  if (dayNotesStatus) dayNotesStatus.textContent = "Salvando automaticamente…";
  updateDayNotesAutosaveBadge("Salvando…");
  clearTimeout(dayNotesAutosaveTimer);
  dayNotesAutosaveTimer = window.setTimeout(() => {
    const model = getCurrentDayNotesModel(getSelectedDayId());
    model.freeform = value;
    saveDayNotesModel(model, { silentToast: true });
  }, 500);
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
  renderTodayCaregiverCard();
  scheduleFirstRoutineStatePrompt();
}

function renderLiveTick() {
  reconcileCurrentAwakeStateFromEvents();
  updateTheme();

  if (!canUsePrivateFeatures()) return;

  // v75.75.105: atualiza o contador principal diretamente pela mesma lógica
  // do "Estado atual", mesmo quando state.activeStartedAt ficou stale/zerado.
  if (state.mode !== "sleeping" && syncMainClockFromOpenAwake(Date.now())) {
    const currentMinute = Math.floor(Date.now() / 60000);
    if (currentMinute !== liveTickMinute) {
      liveTickMinute = currentMinute;
      renderSummary();
      renderIntelligentHomeSections();
      renderQuickCorrectionCard();
      renderProductExperienceSections();
    }
    return;
  }

  if (state.mode === "idle" || !Number.isFinite(state.activeStartedAt)) return;
  const liveElapsed = Date.now() - Number(state.activeStartedAt || Date.now());
  if (!Number.isFinite(liveElapsed) || liveElapsed < 0 || liveElapsed > 72 * hour) {
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
  renderQuickCorrectionCard();
  renderProductExperienceSections();
}

function finishSleep() {
  if (!requireLogin("salvar a rotina")) return;
  const finishedAt = Date.now();
  const activeStartedAt = Number(state.activeStartedAt);
  if (Number.isFinite(activeStartedAt) && finishedAt - activeStartedAt > 14 * hour) {
    const ok = window.confirm("Esse sono passou de 14 horas. Deseja finalizar mesmo assim?");
    if (!ok) return;
  }
  markRoutineMutationSnapshot("finalizou sono");
  const activeType = state.activeType || "sono";
  const beforeIds = new Set((state.events || []).map((event) => event.id));
  state = finishActiveSleep(state, makeEvent, finishedAt);
  const newSleepEvents = (state.events || []).filter((event) => !beforeIds.has(event.id));
  newSleepEvents.forEach((event) => {
    pushAuditEntry("adicionou", event);
    persistCrossDaySleepEvent(event);
  });
  addAwakeEvent(finishedAt, activeType === "dormir" ? "Após sono noturno" : "Após soneca");
  saveDayState();
}

function startSleep(preferredType = "sono", sourceLabel = "") {
  if (!requireLogin("salvar a rotina")) return;

  if (state.mode !== "sleeping") syncMainClockFromOpenAwake(Date.now(), { force: true });

  if (state.mode === "sleeping") {
    window.alert("Já existe um sono em andamento. Finalize ou corrija o registro atual antes de iniciar outro.");
    return;
  }

  if (state.mode === "idle") {
    const info = getOpenAwakeInfoForMainClock(Date.now());
    if (info?.isOpen && Number.isFinite(Number(info.wakeAt))) {
      state = normalizeDayState({
        ...state,
        mode: "awake",
        activeStartedAt: Number(info.wakeAt),
        activeType: info.wakeEvent?.type || "acordou",
        activeDetail: Number(info.wakeAt) < getDayStart() ? "Continuado de ontem" : "",
        activeNotes: info.wakeEvent?.notes || "",
      });
      syncSelectedDayIntoFamilyCache();
      saveLocalDayState(getSelectedDayId());
    }
  }

  if (state.mode === "idle") {
    window.alert("O Ninou ainda não encontrou um período acordado ativo. Registre ou corrija o último 'Acordou' antes de iniciar a soneca.");
    renderAll();
    return;
  }

  const sleepType = preferredType === "dormir" || isNightRoutinePeriod(Date.now()) || getActiveNightWakeEvent()
    ? "dormir"
    : "sono";
  markRoutineMutationSnapshot(sleepType === "dormir" ? "iniciou noite" : "iniciou soneca");
  if (sleepType === "dormir") {
    startLiveSleepFromManualEvent("dormir", Date.now(), getActiveNightWakeEvent() ? "Após despertar noturno" : "Sono noturno", "");
  } else {
    state = startSleepTimer(state, Date.now());
  }
  saveDayState();
}

function startRoutine(mode, forcedStartedAt = null, sourceLabel = "") {
  if (!requireLogin("salvar a rotina")) return;
  if (getSelectedDayId() !== getCurrentDayId()) {
    window.alert("Volte para hoje para iniciar a rotina em tempo real.");
    return;
  }

  const startMode = mode === "sleeping" ? "sleeping" : "awake";
  if (startMode === "awake" && getActiveAwakeWindowStart()) {
    renderAll();
    return;
  }

  const hasForcedStart = Number.isFinite(Number(forcedStartedAt));
  const startedAt = hasForcedStart ? Number(forcedStartedAt) : (mode === "now" ? Date.now() : parseManualStartTimeInput(startMode));
  if (!Number.isFinite(Number(startedAt))) return;

  try {
    localStorage.setItem(getFirstRoutinePromptKey(), "answered");
  } catch {}

  markRoutineMutationSnapshot(startMode === "sleeping" ? "iniciou sono informado" : "iniciou dia informado");
  state = startRoutineTimer(state, startMode, Number(startedAt));
  if (startMode === "awake") {
    addAwakeEvent(Number(startedAt), sourceLabel || (mode === "now" ? "Rotina iniciada agora" : "Início do dia informado"));
  }
  reconcileCurrentAwakeStateFromEvents({ persist: false });
  timelineRenderSignature = "";
  orbitRenderSignature = "";
  saveDayState();
  closeFirstRoutineStatePrompt();
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
  if (target) window.scrollTo({ top: 0, left: 0, behavior: "auto" });
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


function isBrowserOnline() {
  return typeof navigator === "undefined" || navigator.onLine !== false;
}

function readPendingDaySyncIds() {
  try {
    const raw = JSON.parse(localStorage.getItem(pendingDaySyncStorageKey) || "[]");
    return Array.isArray(raw) ? raw.filter(isDateId) : [];
  } catch {
    return [];
  }
}

function writePendingDaySyncIds(dayIds = []) {
  const ids = [...new Set((dayIds || []).filter(isDateId))].sort();
  try {
    if (ids.length) localStorage.setItem(pendingDaySyncStorageKey, JSON.stringify(ids));
    else localStorage.removeItem(pendingDaySyncStorageKey);
  } catch {}
  return ids;
}

function markDaySyncQueued(dayId = getSelectedDayId()) {
  const safeDayId = isDateId(dayId) ? dayId : getCurrentDayId();
  writePendingDaySyncIds([...readPendingDaySyncIds(), safeDayId]);
  persistPendingCloudSync(getPendingSyncSummary());
  renderSyncDetails();
}

function clearDaySyncQueued(dayId = getSelectedDayId()) {
  const safeDayId = isDateId(dayId) ? dayId : getCurrentDayId();
  writePendingDaySyncIds(readPendingDaySyncIds().filter((id) => id !== safeDayId));
  renderSyncDetails();
}

function isProfileSyncQueued() {
  try { return localStorage.getItem(pendingProfileSyncStorageKey) === "1"; } catch { return false; }
}

function markProfileSyncQueued() {
  try { localStorage.setItem(pendingProfileSyncStorageKey, "1"); } catch {}
  persistPendingCloudSync(getPendingSyncSummary());
  renderSyncDetails();
}

function clearProfileSyncQueued() {
  try { localStorage.removeItem(pendingProfileSyncStorageKey); } catch {}
  renderSyncDetails();
}

function getPendingCloudSyncCount() {
  return readPendingDaySyncIds().length + (isProfileSyncQueued() ? 1 : 0);
}

function hasPendingCloudSyncItems() {
  return getPendingCloudSyncCount() > 0;
}

function getPendingSyncSummary() {
  const count = getPendingCloudSyncCount();
  if (!count) return "Tudo sincronizado.";
  if (!isBrowserOnline()) return `${count} item(ns) salvo(s) neste aparelho aguardando conexão.`;
  return `${count} item(ns) aguardando envio para a família.`;
}

async function flushPendingCloudSync(reason = "manual") {
  if (pendingCloudFlushInFlight || !cloudUser || !firebaseServices || !hasFamilyAccess()) return false;
  if (!isBrowserOnline()) {
    setSyncStatus("pending", cloudUser.email || "", getPendingSyncSummary());
    schedulePendingCloudRetry();
    return false;
  }

  pendingCloudFlushInFlight = true;
  setSyncStatus("syncing", cloudUser.email || "", "Sincronizando pendências salvas neste aparelho...");
  try {
    if (isProfileSyncQueued()) await saveProfileToCloud({ silentRetry: true, reason });
    const dayIds = readPendingDaySyncIds();
    for (const dayId of dayIds) {
      await saveDayToCloud(dayId, { silentRetry: true, reason });
    }
    if (!hasPendingCloudSyncItems()) {
      clearPendingCloudSync();
      markCloudSynced();
      setSyncStatus("online", cloudUser.email || "");
    } else {
      setSyncStatus("pending", cloudUser.email || "", getPendingSyncSummary());
      schedulePendingCloudRetry();
    }
    return true;
  } catch (error) {
    console.warn("Falha ao sincronizar pendências:", error);
    markCloudSyncPending(error);
    return false;
  } finally {
    pendingCloudFlushInFlight = false;
  }
}

function getCloudSyncErrorKind(error = {}) {
  const code = String(error?.code || error?.name || "").toLowerCase();
  const message = String(error?.message || "").toLowerCase();
  if (code.includes("permission-denied") || message.includes("permission")) return "permission";
  if (code.includes("unavailable") || message.includes("network") || message.includes("offline")) return "network";
  return "sync";
}

function getCloudSyncPendingMessage(error = {}) {
  const kind = getCloudSyncErrorKind(error);
  if (kind === "permission") {
    return "Salvo neste aparelho • aguardando ajuste das regras do Firestore.";
  }
  if (kind === "network") {
    return "Salvo neste aparelho • aguardando conexão para sincronizar.";
  }
  return "Salvo neste aparelho • aguardando sincronização.";
}

function persistPendingCloudSync(reason = "pending") {
  try {
    localStorage.setItem(pendingCloudSyncStorageKey, JSON.stringify({ reason, at: Date.now() }));
  } catch {}
}

function clearPendingCloudSync() {
  try { localStorage.removeItem(pendingCloudSyncStorageKey); } catch {}
  if (pendingCloudRetryTimer) {
    window.clearTimeout(pendingCloudRetryTimer);
    pendingCloudRetryTimer = null;
  }
}

function schedulePendingCloudRetry() {
  if (pendingCloudRetryTimer || !cloudUser || !firebaseServices || !hasFamilyAccess()) return;
  pendingCloudRetryTimer = window.setTimeout(async () => {
    pendingCloudRetryTimer = null;
    if (!cloudUser || !firebaseServices || !hasFamilyAccess()) return;
    try {
      await flushPendingCloudSync("retry");
    } catch (error) {
      console.warn("Nova tentativa de sincronização adiada:", error);
      schedulePendingCloudRetry();
    }
  }, isBrowserOnline() ? 8000 : 15000);
}

function markCloudSyncPending(error = {}, fallback = "Salvo neste aparelho • aguardando sincronização.") {
  const message = getCloudSyncPendingMessage(error) || fallback;
  persistPendingCloudSync(message);
  setSyncStatus("pending", cloudUser?.email || "", message);
  if (loginHelper) loginHelper.textContent = message;
  schedulePendingCloudRetry();
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
  if (!hasPendingCloudSyncItems()) clearPendingCloudSync();
  else persistPendingCloudSync(getPendingSyncSummary());
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
    syncFamilyLabel.title = isAdminPanelOnlyContext() ? (familyAccess?.familyId || "") : "";
  }
  if (syncLastSavedLabel) {
    const pendingCount = getPendingCloudSyncCount();
    syncLastSavedLabel.textContent = pendingCount ? `${pendingCount} pendente(s) • ${formatSyncMoment()}` : formatSyncMoment();
  }
}


function getHealthItemMarkup(ok, title, hint) {
  return `<li class="${ok ? "is-ok" : "needs-attention"}"><strong>${ok ? "✓" : "!"} ${escapeHtml(title)}</strong><small>${escapeHtml(hint)}</small></li>`;
}

function buildFamilyHealthItems(stats = latestAdminStats) {
  const integrity = stats?.integrity || null;
  const familyId = familyAccess?.familyId || (isGlobalAppAdmin() ? getActiveAdminFamilyId() : "");
  if (!stats || !integrity) {
    return [{ ok: false, title: "Painel ainda não verificado", hint: "Toque em Verificar família para carregar o diagnóstico atual." }];
  }

  const familyItems = [
    {
      ok: Boolean(integrity.hasFamilyId || familyId),
      title: "Família selecionada",
      hint: familyId || "Nenhuma família ativa foi encontrada para este painel.",
    },
    {
      ok: Boolean(integrity.selectedHasProfile),
      title: "Perfil familiar",
      hint: integrity.selectedHasProfile ? "Nome da família/bebê encontrado." : "O perfil principal está ausente; a correção cria um perfil mínimo.",
    },
    {
      ok: true,
      title: "Membros ativos",
      hint: `${Number(integrity.visibleMembersCount || 0)} membro(s) vinculado(s) nesta família.`,
    },
    {
      ok: !integrity.expiredPendingInvites,
      title: "Convites desta família",
      hint: integrity.expiredPendingInvites ? `${integrity.expiredPendingInvites} convite(s) expirado(s) ainda pendente(s).` : `${Number(integrity.pendingInvitesCount || 0)} convite(s) pendente(s) sem alerta.`,
    },
  ];

  if (!isGlobalAppAdmin()) {
    familyItems.push({
      ok: true,
      title: "Isolamento entre famílias",
      hint: "Este diagnóstico usa somente a família atual; outras famílias não são consultadas nem exibidas.",
    });
    return familyItems;
  }

  return familyItems.concat([
    {
      ok: !integrity.usersWithoutLink,
      title: "Contas sem vínculo",
      hint: integrity.usersWithoutLink ? `${integrity.usersWithoutLink} conta(s) precisam de convite ou vínculo.` : "Nenhuma conta solta detectada na revisão global.",
    },
    {
      ok: !integrity.emptyFamilies,
      title: "Famílias vazias",
      hint: integrity.emptyFamilies ? `${integrity.emptyFamilies} família(s) sem membro/convite para revisar.` : "Nenhuma família vazia crítica detectada no painel global.",
    },
    {
      ok: !integrity.duplicateEmailCount,
      title: "E-mails duplicados",
      hint: integrity.duplicateEmailCount ? `${integrity.duplicateEmailCount} e-mail(s) aparecem em mais de uma origem.` : "Sem duplicidade relevante no painel global.",
    },
  ]);
}

function renderFamilyHealthPanel(stats = latestAdminStats) {
  if (!familyHealthChecklist && !familyHealthScore) return;
  const items = buildFamilyHealthItems(stats);
  const okCount = items.filter((item) => item.ok).length;
  const total = items.length || 1;
  if (familyHealthScore) {
    familyHealthScore.textContent = stats ? `${okCount}/${total}` : "—";
    familyHealthScore.classList.toggle("is-ok", Boolean(stats && okCount === total));
    familyHealthScore.classList.toggle("needs-attention", Boolean(stats && okCount < total));
  }
  if (familyHealthChecklist) familyHealthChecklist.innerHTML = items.map((item) => getHealthItemMarkup(item.ok, item.title, item.hint)).join("");
  if (familyHealthRepairButton) familyHealthRepairButton.disabled = !cloudUser || !hasFamilyAccess();
  if (familyBackupJsonButton) familyBackupJsonButton.disabled = !canUsePrivateFeatures();
  if (familyHealthStatus && stats) {
    familyHealthStatus.textContent = okCount === total
      ? "Diagnóstico sem alertas críticos. Backup recomendado antes de testes grandes."
      : "Há pontos para revisar. Use Corrigir vínculos apenas após confirmar que a família selecionada está correta.";
  }
}

function getRealFamilyTestItemMarkup(item = {}, index = 0) {
  const state = item.ok ? "is-ok" : item.warning ? "needs-review" : "needs-attention";
  const prefix = item.ok ? "✓" : item.warning ? "•" : "!";
  return `<li class="${state}"><strong>${prefix} ${index + 1}. ${escapeHtml(item.title || "Etapa")}</strong><small>${escapeHtml(item.hint || "")}</small></li>`;
}

function buildRealFamilyUseTestItems(stats = latestAdminStats) {
  const familyId = familyAccess?.familyId || (isGlobalAppAdmin() ? getActiveAdminFamilyId() : "");
  const memberCount = Number(stats?.membersCount || 0);
  const pendingInvites = Number(stats?.pendingInvitesCount || 0);
  const acceptedInvites = Number(stats?.acceptedInvitesCount || 0);
  const auditCount = Array.isArray(stats?.familyAudit) ? stats.familyAudit.length : 0;
  const hasProfile = Boolean(stats?.integrity?.selectedHasProfile || stats?.familyData?.name || stats?.familyName);
  const hasFamily = Boolean(familyId && stats);
  const appAdmin = isGlobalAppAdmin();
  const hasAuthorizedAccess = Boolean(cloudUser && (appAdmin || hasFamilyAccess()));
  const canInvite = Boolean(hasFamily && isFamilyAdmin());
  const hasBackupData = Boolean(familyId && (familyDayIdsCache.length || stats));

  if (!stats) {
    return [{ ok: false, title: "Painel ainda não carregado", hint: "Entre como admin e toque em Rodar checklist para carregar os dados atuais do Firestore." }];
  }

  return [
    {
      ok: hasAuthorizedAccess,
      title: "Acesso familiar autenticado",
      hint: hasAuthorizedAccess ? `${cloudUser.email || "Conta conectada"} está validado para esta família.` : "Entre com uma conta vinculada à família antes de rodar o checklist.",
    },
    {
      ok: hasFamily,
      title: "Família selecionada",
      hint: hasFamily ? `Família em teste: ${familyId}.` : "Crie ou selecione uma família antes de convidar outro cuidador.",
    },
    {
      ok: hasProfile,
      title: "Perfil do bebê/família",
      hint: hasProfile ? `Perfil encontrado para ${stats.familyName || "a família selecionada"}.` : "Configure o perfil principal antes de iniciar testes com outro aparelho.",
    },
    {
      ok: memberCount >= 1,
      warning: memberCount === 0,
      title: "Membros ativos",
      hint: memberCount >= 1 ? `${memberCount} membro(s) ativo(s) além do suporte admin.` : "Depois de aceitar um convite, o cuidador deve aparecer aqui como membro ativo.",
    },
    {
      ok: pendingInvites > 0 || acceptedInvites > 0,
      warning: pendingInvites === 0 && acceptedInvites === 0,
      title: "Convite familiar testado",
      hint: pendingInvites > 0 ? `${pendingInvites} convite(s) pendente(s) pronto(s) para envio.` : acceptedInvites > 0 ? `${acceptedInvites} convite(s) já aceito(s).` : "Gere um convite para Maria/cuidador e confira se ele não cria outra família.",
    },
    {
      ok: acceptedInvites > 0 || memberCount >= 2,
      warning: true,
      title: "Aceite em segundo aparelho",
      hint: acceptedInvites > 0 || memberCount >= 2 ? "Há sinal de convite aceito ou múltiplos membros. Confirme com login no outro aparelho." : "Teste em aba anônima/celular: criar conta do convidado, aceitar convite e registrar uma rotina.",
    },
    {
      ok: auditCount > 0,
      warning: auditCount === 0,
      title: "Histórico familiar",
      hint: auditCount > 0 ? `${auditCount} evento(s) de auditoria registrados.` : "Convite criado/aceito, alteração de permissão e saída/remoção devem gerar histórico.",
    },
    {
      ok: canInvite,
      title: "Permissões protegidas",
      hint: canInvite ? "Responsável/admin desta família pode gerenciar convites e membros. Cuidador/visualização ficam sem ações sensíveis." : "Confira se apenas responsável/admin da própria família consegue alterar membros e convites.",
    },
    {
      ok: hasBackupData,
      warning: true,
      title: "Backup antes do teste pesado",
      hint: "Exporte o JSON antes de remover membro, limpar banco ou fazer teste com vários aparelhos.",
    },
    {
      ok: true,
      title: "Roteiro final manual",
      hint: "Felipe cria família → convida Maria → Maria aceita → registra rotina → Felipe vê → Maria não altera permissões → backup/exportação funciona.",
    },
  ];
}

function renderRealFamilyUseTestPanel(stats = latestAdminStats) {
  if (!familyRealTestChecklist && !familyRealTestScore) return;
  const items = buildRealFamilyUseTestItems(stats);
  const okCount = items.filter((item) => item.ok).length;
  const total = items.length || 1;
  if (familyRealTestScore) {
    familyRealTestScore.textContent = stats ? `${okCount}/${total}` : "—";
    familyRealTestScore.classList.toggle("is-ok", Boolean(stats && okCount >= total - 1));
    familyRealTestScore.classList.toggle("needs-attention", Boolean(stats && okCount < total - 1));
  }
  if (familyRealTestChecklist) familyRealTestChecklist.innerHTML = items.map(getRealFamilyTestItemMarkup).join("");
  if (familyRealTestExportButton) familyRealTestExportButton.disabled = !stats;
  if (familyRealTestStatus) {
    familyRealTestStatus.textContent = stats
      ? "Checklist atualizado somente para a família atual. Itens com ponto (•) são testes manuais recomendados, não erros obrigatórios."
      : "Atualize o painel para montar o roteiro com base nos dados reais desta família.";
  }
}

function exportRealFamilyUseChecklist() {
  const items = buildRealFamilyUseTestItems(latestAdminStats);
  const payload = {
    app: "Ninou",
    version: NINOU_RUNTIME_VERSION,
    exportedAt: new Date().toISOString(),
    familyId: getSelectedFamilyIdForAdminOrAccess?.() || familyAccess?.familyId || "",
    exportedBy: cloudUser?.email || "",
    checklist: items.map((item, index) => ({
      order: index + 1,
      status: item.ok ? "ok" : item.warning ? "manual-review" : "attention",
      title: item.title,
      hint: item.hint,
    })),
    roteiroManual: [
      "Responsável/admin valida a família atual",
      "Responsável/admin gera convite para o e-mail do cuidador",
      "Cuidador cria conta ou entra com o mesmo e-mail",
      "Cuidador aceita convite e não cria nova família",
      "Cuidador registra mamadeira/fralda/sono",
      "Responsável/admin visualiza o registro no mesmo familyId",
      "Cuidador não consegue remover membros nem alterar permissões",
      "Responsável/admin exporta backup JSON e PDF da própria família",
      "Logout/login mantém vínculos corretos",
    ],
  };
  const dateId = toDateInputValue(Date.now());
  downloadFile(`ninou-checklist-uso-familiar-${dateId}.json`, JSON.stringify(payload, null, 2), "application/json;charset=utf-8");
  if (familyRealTestStatus) familyRealTestStatus.textContent = "Checklist exportado em JSON neste aparelho.";
}

function buildFullFamilyBackupPayload() {
  syncSelectedDayIntoFamilyCache();
  const dayIds = Array.from(new Set([
    ...familyDayIdsCache,
    getSelectedDayId(),
    getCurrentDayId(),
  ].filter(isDateId))).sort();
  const days = {};
  dayIds.forEach((dayId) => {
    days[dayId] = normalizeDayState(getFamilyDayState(dayId));
  });

  return {
    app: "Ninou",
    version: NINOU_RUNTIME_VERSION,
    exportedAt: new Date().toISOString(),
    exportedBy: cloudUser?.email || familyAccess?.email || "",
    familyAccess: familyAccess ? { ...familyAccess } : null,
    selectedFamilyId: getSelectedFamilyIdForAdminOrAccess?.() || familyAccess?.familyId || "",
    profile: normalizeBabyProfile(babyProfile),
    weights: getSortedWeightsAsc(),
    wakeWindowMinutes,
    caregiver: loadCurrentCaregiverIdentity(),
    days,
    adminStats: latestAdminStats ? {
      familyName: latestAdminStats.familyName || "",
      scope: isGlobalAppAdmin() ? "global-admin" : "family",
      familiesCount: isGlobalAppAdmin() ? (latestAdminStats.familiesCount || 0) : 1,
      membersCount: latestAdminStats.membersCount || 0,
      pendingInvitesCount: latestAdminStats.pendingInvitesCount || 0,
      integrity: latestAdminStats.integrity || null,
    } : null,
  };
}

function exportFullFamilyBackup() {
  if (!requireLogin("exportar backup da família")) return;
  const payload = buildFullFamilyBackupPayload();
  const familyId = sanitizeLocalStorageSegment(payload.selectedFamilyId || "familia");
  const dateId = toDateInputValue(Date.now());
  downloadFile(`ninou-backup-${familyId}-${dateId}.json`, JSON.stringify(payload, null, 2), "application/json;charset=utf-8");
  if (familyHealthStatus) familyHealthStatus.textContent = "Backup JSON gerado neste aparelho.";
}

async function repairFamilyIntegrity() {
  if (!cloudUser || !hasFamilyAccess()) {
    if (familyHealthStatus) familyHealthStatus.textContent = "Entre em uma família antes de corrigir vínculos.";
    return false;
  }
  const familyId = familyAccess?.familyId || getSelectedFamilyIdForAdminOrAccess();
  if (!familyId) {
    if (familyHealthStatus) familyHealthStatus.textContent = "Nenhuma família selecionada para corrigir.";
    return false;
  }
  if (!window.confirm("Corrigir vínculos básicos desta família? O Ninou preserva o histórico e só atualiza documentos mínimos de acesso/perfil.")) return false;

  try {
    const services = await getFirebaseServices();
    const nowPayload = { updatedAt: services.serverTimestamp(), appVersion: NINOU_RUNTIME_VERSION };
    await services.setDoc(services.doc(services.db, "families", familyId), {
      familyId,
      status: "active",
      title: getProfileFamilyDisplayName() || latestAdminStats?.familyName || "Família Ninou",
      ...nowPayload,
    }, { merge: true });

    const profileRef = services.doc(services.db, "families", familyId, "profile", "main");
    const profileSnap = await services.getDoc(profileRef);
    if (!profileSnap.exists?.()) {
      await services.setDoc(profileRef, {
        ...getProfilePayload(),
        familyId,
        createdAt: services.serverTimestamp(),
        ...nowPayload,
      }, { merge: true });
    }

    if (!isGlobalAppAdmin()) {
      await saveAccountAccessToCloud({ ...familyAccess, familyId, role: familyAccess?.role || FAMILY_ROLE_ADMIN, email: cloudUser.email || familyAccess?.email || "" }, cloudUser);
    }

    await writeFamilyAuditLog("family_integrity_repaired", { familyId, message: "Correção básica de vínculos e perfil executada pelo painel." });
    await refreshAdminStats({ silent: true });
    markCloudSynced();
    if (familyHealthStatus) familyHealthStatus.textContent = "Vínculos básicos verificados e corrigidos quando necessário.";
    return true;
  } catch (error) {
    console.warn("Não foi possível corrigir integridade da família:", error);
    if (familyHealthStatus) familyHealthStatus.textContent = getFirebaseErrorMessage(error);
    return false;
  }
}

function renderAdminDiagnostics() {
  if (!adminDiagnosticsCard) return;
  const show = Boolean(isGlobalAppAdmin() || (familyAccess?.familyId && !isProfileReadyForDailyUse()));
  adminDiagnosticsCard.hidden = !show;
  if (!show) return;

  const familyId = familyAccess?.familyId || (isGlobalAppAdmin() ? getActiveAdminFamilyId() : "");
  if (diagnosticsVersionLabel) diagnosticsVersionLabel.textContent = `Ninou v${NINOU_RUNTIME_VERSION}`;
  if (diagnosticsSummary) diagnosticsSummary.textContent = isGlobalAppAdmin()
    ? "Área administrativa global: use para suporte, revisão técnica e diagnóstico geral do app."
    : "Diagnóstico da minha família: este quadro não lista nem consulta outras famílias.";
  if (diagnosticsUserLabel) diagnosticsUserLabel.textContent = cloudUser?.email || "sem login";
  if (diagnosticsFamilyLabel) {
    diagnosticsFamilyLabel.textContent = familyId || "não selecionada";
    diagnosticsFamilyLabel.title = familyId || "";
  }
  if (diagnosticsPwaLabel) diagnosticsPwaLabel.textContent = window.matchMedia?.("(display-mode: standalone)")?.matches || window.navigator.standalone ? "instalado" : "navegador";
  if (diagnosticsCacheLabel) diagnosticsCacheLabel.textContent = `${countFamilyScopedDayCaches()} dia(s) locais`;
  if (diagnosticsIntegrityLabel) {
    const integrity = latestAdminStats?.integrity || null;
    diagnosticsIntegrityLabel.textContent = integrity ? formatAdminIntegrityLabel(integrity) : "aguardando painel";
    diagnosticsIntegrityLabel.title = integrity
      ? (isGlobalAppAdmin() ? "Verifica perfil da família selecionada, famílias vazias, e-mails duplicados e contas sem vínculo." : "Verifica somente perfil, membros e convites da sua família.")
      : "Atualize o painel para montar o diagnóstico de integridade.";
  }
  if (diagnosticsInviteLabel) {
    const pending = Number(latestAdminStats?.pendingInvitesCount || 0);
    const accepted = Number(latestAdminStats?.acceptedInvitesCount || 0);
    diagnosticsInviteLabel.textContent = latestAdminStats ? `${pending} pendente(s) • ${accepted} aceito(s)` : "aguardando";
    diagnosticsInviteLabel.title = "Convites são de uso único, com validade e status pending/accepted/cancelled.";
  }
  if (diagnosticsAppCheckLabel) {
    const status = firebaseServices?.appCheckStatus;
    diagnosticsAppCheckLabel.textContent = status?.configured
      ? "ativo"
      : status?.enabled === false
        ? "opcional"
        : status?.reason === "init-error" || status?.reason === "init-error-monitoring"
          ? "erro"
          : "pendente";
    diagnosticsAppCheckLabel.title = status?.configured
      ? "App Check inicializado no cliente."
      : "App Check está opcional durante os testes. Mantenha o Firebase em modo Monitorando até o fluxo familiar ficar estável.";
  }
  renderFamilyHealthPanel(latestAdminStats);
  renderRealFamilyUseTestPanel(latestAdminStats);
}

function setSyncStatus(status = "offline", email = "", detail = "") {
  if (status.includes?.("@") && !email) {
    email = status;
    status = "online";
  }

  // v75.56.2.1.1: o admin global não deve aparecer como "Off-line" depois do login.
  // O painel administrativo depende da autenticação do admin e de regras globais;
  // falhas pontuais de leitura/escrita no Firestore devem aparecer como aviso,
  // mas não devem rebaixar visualmente o admin conectado para visitante/off-line.
  if ((status === "offline" || status === "error") && cloudUser && isGlobalAppAdmin(cloudUser)) {
    status = isBrowserOnline() ? "online" : "pending";
    email = email || cloudUser.email || GLOBAL_APP_ADMIN_EMAIL;
    detail = detail || (isBrowserOnline() ? "Painel administrativo ativo." : "Offline — alterações ficam neste aparelho até a conexão voltar.");
  }

  if (status === "online" && !isBrowserOnline() && cloudUser && hasFamilyAccess()) {
    status = "pending";
    detail = detail || getPendingSyncSummary();
  }

  const online = status === "online";
  const loading = status === "loading";
  const saving = status === "saving";
  const syncing = status === "syncing";
  const error = status === "error";
  const pending = status === "pending";
  const offline = status === "offline" || !isBrowserOnline();

  syncPill.textContent = online ? "Sincronizado" : syncing ? "Sincronizando" : saving ? "Salvando" : loading ? "Conectando" : pending ? "Pendente" : error ? "Erro" : "Off-line";
  syncPill.classList.toggle("online", online);
  syncPill.classList.toggle("offline", !online && !pending && !saving && !syncing);
  syncPill.classList.toggle("pending", pending || saving || syncing);
  syncStatusTitle.textContent = online
    ? "Tudo sincronizado"
    : syncing
      ? "Sincronizando pendências"
      : saving
        ? "Salvando..."
        : loading
          ? "Conectando"
          : pending
            ? (offline ? "Offline — salvo neste aparelho" : "Aguardando sincronização")
            : error
              ? "Erro na sincronização"
              : "Sincronização off-line";
  syncStatusText.textContent = online
    ? (isGlobalAppAdmin() && !window.__ninouAdminFamilyDataOpen
      ? "Painel administrativo ativo. A rotina de uma família só deve ser aberta quando selecionada."
      : "Rotina familiar sincronizada entre os aparelhos autorizados.")
    : syncing
      ? (detail || "Enviando registros pendentes para a família.")
      : saving
        ? (detail || "Salvando neste aparelho e preparando envio para o Firebase.")
        : loading
          ? "Conectando ao Firebase..."
          : pending
            ? (detail || "Registro salvo neste aparelho. O Ninou tenta sincronizar novamente em instantes.")
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

function isManualSleepType(type = "") {
  return type === "sono" || type === "dormir";
}

function manualSleepOverlapsActiveState(event = {}, dayState = state) {
  if (!event || !isManualSleepType(event.type) || dayState?.mode !== "sleeping") return false;
  const activeStart = Number(dayState.activeStartedAt);
  const start = Number(event.start);
  const end = Number(event.end);
  if (!Number.isFinite(activeStart) || !Number.isFinite(start) || !Number.isFinite(end) || end <= start) return false;
  return activeStart >= start - 5 * 60000 && activeStart <= end + 5 * 60000;
}

function shouldKeepSelectedDayForManualSleep(payload = {}, selectedDayId = getSelectedDayId()) {
  if (!payload || !isManualSleepType(payload.type)) return false;
  if (!isDateId(selectedDayId)) return false;
  const selectedStart = getDayStartFromId(selectedDayId);
  const selectedEnd = selectedStart + day;
  const start = Number(payload.start);
  const end = payload.hasManualEnd ? Number(payload.end) : Date.now();
  if (!Number.isFinite(start) || !Number.isFinite(end)) return false;
  return start < selectedEnd && Math.max(end, start) >= selectedStart;
}

function startCrossDayOpenSleepFromManualPayload(payload = {}) {
  const start = Number(payload.start);
  if (!Number.isFinite(start)) return false;
  state = normalizeDayState({
    ...state,
    mode: "sleeping",
    activeStartedAt: start,
    activeType: isManualSleepType(payload.type) ? payload.type : "sono",
    activeDetail: payload.detail || "Informado manualmente",
    activeNotes: payload.notes || "",
    lastWakeWindowStartedAt: null,
    lastWakeWindowMs: null,
  });
  return true;
}

function reconcileAfterManualSleepEvent(savedEvent = null) {
  if (!savedEvent || !isManualSleepType(savedEvent.type)) return false;
  persistCrossDaySleepEvent(savedEvent);
  if (!manualSleepOverlapsActiveState(savedEvent, state)) return false;
  state = rebuildRoutineModeAfterMutation(state, getSelectedDayId(), { preserveSleeping: false });
  return true;
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
  const validationWarning = getManualEventValidationWarning(payload, existingEvent);
  if (validationWarning && !window.confirm(validationWarning)) return;
  markRoutineMutationSnapshot(existingEvent ? "editou registro" : "adicionou registro");
  const payloadDayId = getDayIdFromStart(payload.start);
  const selectedBeforeSaveId = getSelectedDayId();
  const keepSelectedForManualSleep = !existingEvent
    && payloadDayId !== selectedBeforeSaveId
    && shouldKeepSelectedDayForManualSleep(payload, selectedBeforeSaveId);

  if (!existingEvent && payloadDayId !== selectedBeforeSaveId && !keepSelectedForManualSleep) {
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
    const editReason = String(window.prompt("Motivo da correção (opcional):", existingEvent.editReason || "") || "").trim().slice(0, 120);
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
      ...getSleepClassificationFields(payload.type, payload.start, payload.hasManualEnd ? payload.end : payload.start),
      updatedAt: new Date().toISOString(),
      updatedByUid: actor.uid,
      updatedByEmail: actor.email,
      updatedByDeviceId: actor.deviceId,
      updatedByName: actor.displayName || actor.label,
      updatedByRelationship: actor.relationshipLabel,
      updatedByLabel: formatCaregiverNameRole(actor.displayName || actor.label, actor.relationshipLabel) || actor.label,
      updatedAtClient: Date.now(),
      editReason,
      lastAction: "editou",
    });
    pushAuditEntry("editou", existingEvent);
    state = rebuildRoutineModeAfterMutation(state, getSelectedDayId(), { preserveSleeping: false });
  } else if ((payload.type === "sono" || payload.type === "dormir" || payload.type === "despertar-noturno") && payload.hasManualEnd) {
    const newEvent = makeEvent(payload.type, payload.start, payload.end, payload.detail, payload.notes);
    state.events.push(newEvent);
    pushAuditEntry("adicionou", newEvent);
    if (isManualSleepType(payload.type)) reconcileAfterManualSleepEvent(newEvent);
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
  } else if (keepSelectedForManualSleep && isManualSleepType(payload.type) && !payload.hasManualEnd) {
    startCrossDayOpenSleepFromManualPayload(payload);
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

  markRoutineMutationSnapshot("excluiu registro");
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
      exportedFrom: `Ninou v${NINOU_RUNTIME_VERSION}`,
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

function formatReportDateTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return `${date.toLocaleDateString("pt-BR")} às ${date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;
}

function formatReportDurationMinutes(minutes) {
  const total = Number(minutes || 0);
  if (!Number.isFinite(total) || total <= 0) return "-";
  const hours = Math.floor(total / 60);
  const mins = Math.round(total % 60);
  if (hours && mins) return `${hours}h${String(mins).padStart(2, "0")}`;
  if (hours) return `${hours}h`;
  return `${mins}min`;
}

function getReportDayLabelFromIso(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Sem data";
  return date.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit" }).replace(".", "");
}

function buildReportDayRows(events = []) {
  const buckets = new Map();
  for (const event of events || []) {
    const date = new Date(event.start);
    const key = Number.isNaN(date.getTime()) ? "sem-data" : date.toISOString().slice(0, 10);
    const current = buckets.get(key) || { label: getReportDayLabelFromIso(event.start), events: 0, sleepMinutes: 0, feeds: 0, diapers: 0, bottleMl: 0 };
    current.events += 1;
    const type = String(event.type || "");
    if (type.includes("sono") || type === "dormir") current.sleepMinutes += Number(event.durationMinutes || 0);
    if (type === "mamadeira" || type === "amamentacao") current.feeds += 1;
    if (type === "fralda") current.diapers += 1;
    if (type === "mamadeira") {
      const match = String(event.detail || "").match(/(\d+(?:[,.]\d+)?)\s*ml/i);
      if (match) {
        const value = Number(match[1].replace(",", "."));
        if (Number.isFinite(value)) current.bottleMl += value;
      }
    }
    buckets.set(key, current);
  }
  return [...buckets.entries()]
    .sort(([a], [b]) => String(a).localeCompare(String(b)))
    .map(([, item]) => `<tr><td><strong>${escapeHtml(item.label)}</strong></td><td>${escapeHtml(String(item.events))}</td><td>${escapeHtml(formatReportDurationMinutes(item.sleepMinutes))}</td><td>${escapeHtml(String(item.feeds))}${item.bottleMl ? `<small>${escapeHtml(Math.round(item.bottleMl))} ml</small>` : ""}</td><td>${escapeHtml(String(item.diapers))}</td></tr>`)
    .join("") || `<tr><td colspan="5" class="empty-cell">Sem registros no período.</td></tr>`;
}

function buildPrintableReportHtml(payload = getExportPayload()) {
  const baby = getBabyDisplayName();
  const stats = getRoutineStats(payload);
  const weightInfo = getWeightReportInfo(payload.weights || []);
  const events = payload.events || [];
  const eventRows = events.map((event) => {
    const startText = formatReportDateTime(event.start);
    const endText = event.end && event.end !== event.start ? formatReportDateTime(event.end) : "";
    const actor = getActorDisplayNameFromEvent(event);
    const detail = [event.detail, event.notes ? `Obs.: ${event.notes}` : ""].filter(Boolean).join(" — ");
    const edited = event.updatedAt ? `Editado por ${event.updatedByName || event.updatedByEmail || "responsável"}` : "";
    return `<tr>
      <td><b>${escapeHtml(startText)}</b>${endText ? `<small>até ${escapeHtml(endText)}</small>` : ""}</td>
      <td><strong>${escapeHtml(event.title)}</strong><small>${escapeHtml(event.type || "")}</small></td>
      <td>${escapeHtml(detail || "-")}${edited ? `<small>${escapeHtml(edited)}</small>` : ""}</td>
      <td>${escapeHtml(formatReportDurationMinutes(event.durationMinutes))}</td>
      <td>${escapeHtml(actor || "Responsável")}</td>
    </tr>`;
  }).join("") || `<tr><td colspan="5" class="empty-cell">Sem registros neste período.</td></tr>`;

  const weightRows = weightInfo.sorted.slice(-10).reverse().map((item) => `<tr><td>${escapeHtml(formatReportDate(item.date))}</td><td><strong>${escapeHtml(formatKg(item.value))}</strong></td></tr>`).join("") || `<tr><td colspan="2" class="empty-cell">Sem pesos cadastrados.</td></tr>`;
  const weightDelta = formatWeightDelta(weightInfo.diff);
  const reportTitle = `Relatório da rotina - ${baby}`;
  const safeSummary = escapeHtml(buildRoutineSummaryText(payload)).replaceAll("\n", "<br>");
  const dayRows = buildReportDayRows(events);
  const dayNotesBlock = payload.dayNotes ? `<section><h2>Observações</h2><div class="growth-note">${escapeHtml(payload.dayNotes).replaceAll("\n", "<br>")}</div></section>` : "";
  const generatedAt = new Date(payload.exportedAt).toLocaleString("pt-BR");
  const latestText = stats.latest ? `${stats.latest.title} · ${formatReportDateTime(stats.latest.start)}` : "Sem registros";
  const cards = [
    ["Sono", formatReportDurationMinutes(stats.sleepMinutes), payload.period?.mode === "day" ? "Total no dia" : "Total do período"],
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
    :root{--ink:#30263f;--muted:#756985;--soft:#f8f2e9;--card:#fffaf3;--line:#e8d9ca;--sage:#1f6b57;--purple:#4b3a78;--accent:#8f7cff;--cream:#fffaf3;--lav:#efe7ff}
    @page{size:A4;margin:12mm}
    *{box-sizing:border-box}
    body{margin:0;background:#f2eadf;color:var(--ink);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif;line-height:1.42;-webkit-print-color-adjust:exact;print-color-adjust:exact}
    .page{width:100%;max-width:820px;margin:0 auto;padding:28px;overflow-wrap:anywhere}
    .cover{padding:28px;border-radius:30px;background:linear-gradient(135deg,#fffaf3 0%,#f5edff 58%,#eaf8f1 100%);border:1px solid rgba(75,58,120,.12);box-shadow:0 18px 50px rgba(67,50,94,.12)}
    .brand{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-bottom:20px}
    .brand span{font-size:13px;font-weight:900;letter-spacing:.14em;text-transform:uppercase;color:var(--purple)}
    .brand b{padding:8px 14px;border-radius:999px;background:#e2f5eb;color:var(--sage);font-size:13px;white-space:nowrap}
    h1{font-size:32px;line-height:1.08;margin:0 0 8px;color:var(--purple);letter-spacing:-.03em}
    .subtitle{font-size:14px;color:var(--muted);margin:0;max-width:680px}
    .meta-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-top:18px}
    .meta-grid div{padding:12px 14px;border-radius:18px;background:rgba(255,255,255,.62);border:1px solid rgba(75,58,120,.10)}
    .meta-grid span,.cards span,.cards small{display:block;color:var(--muted);font-size:11px;font-weight:850;text-transform:uppercase;letter-spacing:.05em}
    .meta-grid strong{display:block;margin-top:4px;color:var(--ink);font-size:13px}
    .summary{margin-top:18px;padding:16px;border-radius:22px;background:rgba(255,255,255,.70);border:1px solid rgba(75,58,120,.10);font-size:14px}
    .cards{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin-top:16px}
    .cards article{padding:15px;border-radius:20px;background:var(--card);border:1px solid rgba(75,58,120,.10);min-width:0}
    .cards strong{display:block;margin:7px 0 3px;font-size:20px;color:var(--purple);letter-spacing:-.02em}
    section{margin-top:20px;padding:20px;border-radius:24px;background:#fffaf5;border:1px solid var(--line);break-inside:avoid;page-break-inside:avoid;overflow-wrap:anywhere}
    h2{font-size:20px;margin:0 0 10px;color:var(--purple);letter-spacing:-.02em}
    .section-hint{margin:-2px 0 12px;color:var(--muted);font-size:13px}
    .table-wrap{width:100%;overflow:hidden;border-radius:18px;border:1px solid var(--line);background:#fffdf9}
    table{width:100%;border-collapse:separate;border-spacing:0;font-size:12px;table-layout:fixed}
    th{background:#efe7ff;color:var(--purple);font-size:10px;text-transform:uppercase;letter-spacing:.04em;text-align:left;padding:9px 8px;overflow-wrap:anywhere}
    td{padding:10px 8px;border-top:1px solid var(--line);vertical-align:top;background:#fffdf9;overflow-wrap:anywhere;word-break:break-word}
    tr{break-inside:avoid;page-break-inside:avoid}
    td small{display:block;color:var(--muted);margin-top:3px;font-size:10.5px;line-height:1.35}
    .events-table th:nth-child(1),.events-table td:nth-child(1){width:20%}.events-table th:nth-child(2),.events-table td:nth-child(2){width:19%}.events-table th:nth-child(3),.events-table td:nth-child(3){width:31%}.events-table th:nth-child(4),.events-table td:nth-child(4){width:10%}.events-table th:nth-child(5),.events-table td:nth-child(5){width:20%}
    .empty-cell{text-align:center;color:var(--muted);padding:22px}
    .growth-note{padding:14px 16px;border-radius:18px;background:#e9f7f1;color:var(--sage);font-weight:800;margin-bottom:12px;white-space:pre-line}
    .disclaimer{margin-top:14px;padding:12px 14px;border-radius:18px;background:#f4edff;color:var(--purple);font-size:12px;font-weight:700;border:1px solid rgba(75,58,120,.10)}
    .footer{margin-top:16px;color:var(--muted);font-size:11px;text-align:center}
    .print-actions{display:flex;gap:10px;justify-content:center;margin:18px 0 0}.print-actions button{border:0;border-radius:999px;padding:10px 16px;background:var(--purple);color:white;font-weight:900;cursor:pointer}.print-actions button.secondary{background:#e2f5eb;color:var(--sage)}
    @media print{body{background:#fff}.page{max-width:100%;padding:0}.cover,section{box-shadow:none}.print-actions{display:none}.cards{grid-template-columns:repeat(4,1fr)}table{font-size:10.8px}th,td{padding:7px 6px}.cover{border-radius:22px}section{border-radius:18px;margin-top:14px}h1{font-size:28px}h2{font-size:17px}.summary{font-size:12px}.footer{position:fixed;bottom:0;left:0;right:0}}
    @media (max-width:760px){.page{padding:14px}.cover,section{padding:18px;border-radius:22px}.cards,.meta-grid{grid-template-columns:repeat(2,minmax(0,1fr))}h1{font-size:26px}.table-wrap{overflow-x:auto}table{min-width:720px;font-size:12px}}
  </style>
</head>
<body>
  <main class="page">
    <div class="cover">
      <div class="brand"><span>Ninou</span><b>Relatório da rotina</b></div>
      <h1>${escapeHtml(reportTitle)}</h1>
      <p class="subtitle">Período: ${escapeHtml(payload.period?.label || formatReportDate(payload.day))} • Gerado em ${escapeHtml(generatedAt)}${payload.exportedBy ? ` • por ${escapeHtml(payload.exportedBy)}` : ""}</p>
      <div class="meta-grid">
        <div><span>Bebê</span><strong>${escapeHtml(baby)}</strong></div>
        <div><span>Período analisado</span><strong>${escapeHtml(payload.period?.start || payload.day)} a ${escapeHtml(payload.period?.end || payload.day)}</strong></div>
        <div><span>Último registro</span><strong>${escapeHtml(latestText)}</strong></div>
      </div>
      <div class="summary">${safeSummary}</div>
      <div class="cards">${cards}</div>
      <div class="disclaimer">Relatório informativo para acompanhamento familiar. Não substitui avaliação do pediatra ou orientação profissional.</div>
      <div class="print-actions"><button onclick="window.print()">Imprimir ou salvar PDF</button><button class="secondary" onclick="window.close()">Fechar</button></div>
    </div>

    <section>
      <h2>Resumo por dia</h2>
      <p class="section-hint">Consolidação do período para evitar leitura incorreta de “últimos 30 dias” quando o usuário escolhe outro intervalo.</p>
      <div class="table-wrap"><table><thead><tr><th>Dia</th><th>Registros</th><th>Sono</th><th>Alimentações</th><th>Fraldas</th></tr></thead><tbody>${dayRows}</tbody></table></div>
    </section>

    <section>
      <h2>${payload.period?.mode === "day" ? "Rotina do dia" : "Rotina do período"}</h2>
      <p class="section-hint">Linha do tempo com horário, detalhe e responsável por cada registro.</p>
      <div class="table-wrap"><table class="events-table"><thead><tr><th>Data e hora</th><th>Registro</th><th>Detalhe</th><th>Duração</th><th>Responsável</th></tr></thead><tbody>${eventRows}</tbody></table></div>
    </section>

    ${dayNotesBlock}

    <section>
      <h2>Crescimento</h2>
      <div class="growth-note">${escapeHtml(weightInfo.latest ? `${formatKg(weightInfo.latest.value)} em ${formatReportDate(weightInfo.latest.date)}. ${weightDelta}` : "Nenhum peso cadastrado para este bebê.")}</div>
      <div class="table-wrap"><table><thead><tr><th>Data</th><th>Peso</th></tr></thead><tbody>${weightRows}</tbody></table></div>
    </section>

    <p class="footer">Relatório gerado pelo Ninou v${escapeHtml(NINOU_RUNTIME_VERSION)}.</p>
  </main>
  <script>window.onload=()=>setTimeout(()=>window.print(),450)</script>
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
window.addEventListener("online", () => {
  if (cloudUser && firebaseServices && hasFamilyAccess()) {
    setSyncStatus("pending", cloudUser.email || "", "Conexão voltou. Tentando sincronizar os registros salvos neste aparelho.");
    schedulePendingCloudRetry();
  }
});

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

routineCorrectionButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const action = button.dataset.lastRecordAction;
    if (action === "undo") restoreLastRoutineMutation();
    if (action === "correct") correctLatestRoutineEvent();
  });
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
window.addEventListener("resize", scheduleOrbitLayoutRender, { passive: true });
window.addEventListener("orientationchange", scheduleOrbitLayoutRender, { passive: true });

closeSheetButton.addEventListener("click", closeSheet);
closeOrbitClusterButton.addEventListener("click", closeOrbitCluster);
if (orbitClusterViewAllButton) {
  orbitClusterViewAllButton.addEventListener("click", () => {
    closeOrbitCluster();
    showScreen("diary");
  });
}
sheetBackdrop.addEventListener("click", () => {
  closeSheet();
  closeOrbitCluster();
});
saveButton.addEventListener("click", () => withButtonBusy(saveButton, "Salvando...", saveManualEvent));
resetDataButton.addEventListener("click", () => withButtonBusy(resetDataButton, "Limpando...", resetDayData));
exportJsonButton.addEventListener("click", () => withButtonBusy(exportJsonButton, "Gerando...", () => exportRoutine("json")));
exportCsvButton.addEventListener("click", () => withButtonBusy(exportCsvButton, "Gerando...", () => exportRoutine("csv")));
if (dayNotesTextarea) {
  dayNotesTextarea.addEventListener("input", scheduleDayNotesAutosave);
}
if (dayNotesEpisodes) {
  dayNotesEpisodes.addEventListener("click", (event) => {
    const editButton = event.target.closest("[data-edit-day-note-entry]");
    if (editButton) {
      openDayNoteEntryModal({ entryId: editButton.dataset.editDayNoteEntry || "" });
      return;
    }
    const removeButton = event.target.closest("[data-remove-day-note-entry]");
    if (removeButton) removeDayNoteEntry(removeButton.dataset.removeDayNoteEntry || "");
  });
}
quickObservationButtons.forEach((button) => {
  button.addEventListener("click", () => openDayNoteEntryModal({
    text: button.dataset.quickObservation || button.textContent || "",
    icon: button.dataset.observationIcon || inferDayNoteIcon(button.dataset.quickObservation || button.textContent || ""),
  }));
});
if (openDayNoteModalButton) openDayNoteModalButton.addEventListener("click", () => openDayNoteEntryModal());
if (closeDayNoteModalButton) closeDayNoteModalButton.addEventListener("click", closeDayNoteEntryModal);
if (cancelDayNoteModalButton) cancelDayNoteModalButton.addEventListener("click", closeDayNoteEntryModal);
if (saveDayNoteEntryButton) saveDayNoteEntryButton.addEventListener("click", saveDayNoteEntryFromModal);
if (deleteDayNoteEntryButton) deleteDayNoteEntryButton.addEventListener("click", () => {
  if (editingDayNoteEntryId) removeDayNoteEntry(editingDayNoteEntryId);
});
if (dayNoteModalTextInput) {
  dayNoteModalTextInput.addEventListener("input", updateDayNoteModalCounter);
  dayNoteModalTextInput.addEventListener("keydown", (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
      event.preventDefault();
      saveDayNoteEntryFromModal();
    }
  });
}
dayNoteIconButtons.forEach((button) => {
  button.addEventListener("click", () => setSelectedDayNoteIcon(button.dataset.dayNoteIcon || "✦"));
});
document.querySelectorAll("[data-close-day-note-modal]").forEach((element) => element.addEventListener("click", closeDayNoteEntryModal));
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && dayNoteEpisodeModal && !dayNoteEpisodeModal.hidden) closeDayNoteEntryModal();
});
if (saveCaregiverIdentityButton) saveCaregiverIdentityButton.addEventListener("click", () => withButtonBusy(saveCaregiverIdentityButton, "Salvando...", saveCaregiverIdentityFromForm));
caregiverPresetButtons.forEach((button) => {
  button.addEventListener("click", () => applyCaregiverPresetFromButton(button));
});
if (todayCaregiverEditButton) todayCaregiverEditButton.addEventListener("click", openCaregiverEditor);
if (familyCreateInviteButton) familyCreateInviteButton.addEventListener("click", () => withButtonBusy(familyCreateInviteButton, "Criando...", createFamilyCaregiverInvite));
if (familyCopyInviteButton) familyCopyInviteButton.addEventListener("click", copyFamilyInviteCode);
if (familyShareInviteWhatsAppButton) familyShareInviteWhatsAppButton.addEventListener("click", shareFamilyInviteOnWhatsApp);
if (familyJoinInviteButton) familyJoinInviteButton.addEventListener("click", openJoinFamilyModal);
if (familyAccessSummaryInviteButton) familyAccessSummaryInviteButton.addEventListener("click", () => withButtonBusy(familyAccessSummaryInviteButton, "Criando...", createFamilyCaregiverInvite));
if (familyAccessSummaryProfileButton) familyAccessSummaryProfileButton.addEventListener("click", openCaregiverEditor);
if (familyLeaveButton) familyLeaveButton.addEventListener("click", () => withButtonBusy(familyLeaveButton, "Saindo...", leaveCurrentFamily));
if (confirmJoinInviteButton) confirmJoinInviteButton.addEventListener("click", () => withButtonBusy(confirmJoinInviteButton, "Aceitando...", confirmJoinFamilyInvite));
document.querySelectorAll("[data-close-join-modal]").forEach((button) => button.addEventListener("click", closeJoinFamilyModal));
if (joinFamilyModal) joinFamilyModal.addEventListener("click", (event) => {
  if (event.target === joinFamilyModal) closeJoinFamilyModal();
});
if (supportSuggestionButton) supportSuggestionButton.addEventListener("click", () => openSupportWhatsApp("suggestion"));
if (supportBugButton) supportBugButton.addEventListener("click", () => openSupportWhatsApp("bug"));
if (prepareConsultButton) prepareConsultButton.addEventListener("click", prepareConsultMode);
if (exportPdfButton) exportPdfButton.addEventListener("click", () => withButtonBusy(exportPdfButton, "Gerando...", () => exportRoutine("pdf")));
if (shareWhatsappButton) shareWhatsappButton.addEventListener("click", () => withButtonBusy(shareWhatsappButton, "Preparando...", () => exportRoutine("whatsapp")));
if (exportStartDateInput) exportStartDateInput.addEventListener("change", syncExportRangeModeFromDates);
if (exportEndDateInput) exportEndDateInput.addEventListener("change", syncExportRangeModeFromDates);
if (familyWelcomeStartButton) familyWelcomeStartButton.addEventListener("click", () => showScreen("today"));
if (guestWelcomeLoginButton) guestWelcomeLoginButton.addEventListener("click", () => focusProfileAccess("login"));
if (guestWelcomeInviteButton) guestWelcomeInviteButton.addEventListener("click", () => focusProfileAccess("invite"));
if (guestWelcomeCreateFamilyButton) {
  guestWelcomeCreateFamilyButton.addEventListener("click", () => {
    focusProfileAccess("create");
    if (isLoggedIn()) {
      openCreateFamilyWizard({ focus: true });
    } else {
      if (loginHelper) loginHelper.textContent = "Crie sua conta familiar com e-mail e senha. Depois preencha os dados do bebê para criar a família.";
      loginEmail?.focus();
    }
  });
}
if (guestModalCloseButton) guestModalCloseButton.addEventListener("click", closeGuestLoginModal);
if (guestModalCreateFamilyButton) guestModalCreateFamilyButton.addEventListener("click", () => focusProfileAccess("create"));
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
  focusProfileAccess(normalizeCommercialEntryAction(guestAction.dataset.guestAction));
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
if (saveBabyWeightButton) saveBabyWeightButton.addEventListener("click", () => withButtonBusy(saveBabyWeightButton, "Salvando...", saveBabyWeight));
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

if (saveBabyAvatarButton) saveBabyAvatarButton.addEventListener("click", () => withButtonBusy(saveBabyAvatarButton, "Salvando...", saveBabyAvatarFromDraft));
if (skipBabyAvatarButton) skipBabyAvatarButton.addEventListener("click", () => {
  pendingBabyAvatar = normalizeAvatarDraft(babyProfile.avatar || {});
  renderAvatarCustomizer();
  closeAvatarEditor();
});

if (profilePhotoInput) profilePhotoInput.addEventListener("change", () => {
  profilePhotoInput.value = "";
  if (loginHelper) loginHelper.textContent = "O Ninou agora usa somente avatars ilustrados prontos. Fotos antigas e novos uploads não são usados.";
});

loginButton.addEventListener("click", () => withButtonBusy(loginButton, "Entrando...", signInAccount, { restoreDisabled: false, afterFinish: renderAuthControls }));
createAccountButton.addEventListener("click", () => withButtonBusy(createAccountButton, isLoggedIn() ? "Saindo..." : "Criando...", createAccount, { restoreDisabled: false, afterFinish: renderAuthControls }));
if (clearDeviceDataButton) clearDeviceDataButton.addEventListener("click", signOutAndClearDeviceData);
if (createFamilyButton) {
  createFamilyButton.addEventListener("click", () => {
    if (personalFamilyActivationInFlight) return;
    if (isGlobalAppAdmin()) {
      withButtonBusy(createFamilyButton, "Ativando...", () => activatePersonalFamily().catch((error) => {
        console.error("Erro ao ativar família admin:", error);
        if (loginHelper) loginHelper.textContent = getFirebaseErrorMessage(error);
      }), { restoreDisabled: false, afterFinish: renderAuthControls });
      return;
    }
    openCreateFamilyWizard({ focus: true });
  });
}
if (confirmCreateFamilyButton) {
  confirmCreateFamilyButton.addEventListener("click", () => {
    withButtonBusy(confirmCreateFamilyButton, "Criando...", () => createCommercialFamilyFromWizard().catch((error) => {
      console.error("Erro ao criar família comercial:", error);
      if (createFamilyWizardStatus) createFamilyWizardStatus.textContent = getFirebaseErrorMessage(error);
      if (loginHelper) loginHelper.textContent = getFirebaseErrorMessage(error);
    }), { restoreDisabled: false, afterFinish: renderAuthControls });
  });
}
if (cancelCreateFamilyButton) cancelCreateFamilyButton.addEventListener("click", closeCreateFamilyWizard);
if (newFamilyBabyNameInput) {
  newFamilyBabyNameInput.addEventListener("input", () => {
    if (!newFamilyNameInput) return;
    const babyName = String(newFamilyBabyNameInput.value || "").trim();
    const currentFamilyName = String(newFamilyNameInput.value || "").trim();
    if (!currentFamilyName || /^Família d[oa]\s+/i.test(currentFamilyName) || /^Familia d[oa]\s+/i.test(currentFamilyName)) {
      newFamilyNameInput.value = babyName ? `Família do ${babyName}` : "";
    }
  });
}
if (newFamilyResponsibleRelationInput) {
  newFamilyResponsibleRelationInput.addEventListener("change", () => {
    const relation = String(newFamilyResponsibleRelationInput.value || "responsavel").trim();
    if (caregiverRelationInput && !caregiverRelationInput.value) caregiverRelationInput.value = relation;
  });
}
if (acceptInviteButton) {
  acceptInviteButton.addEventListener("click", () => {
    withButtonBusy(acceptInviteButton, "Aceitando...", () => acceptFamilyInvite().catch((error) => {
      console.error("Erro ao aceitar convite:", error);
      if (loginHelper) loginHelper.textContent = getFirebaseErrorMessage(error);
    }), { restoreDisabled: false, afterFinish: renderAuthControls });
  });
}
if (createInviteButton) {
  createInviteButton.addEventListener("click", () => {
    withButtonBusy(createInviteButton, "Gerando...", () => createFamilyInvite().catch((error) => {
      console.error("Erro ao gerar convite:", error);
      if (inviteResult) {
        inviteResult.hidden = false;
        inviteResult.textContent = getFirebaseErrorMessage(error);
      }
    }));
  });
}
if (refreshAdminStatsButton) {
  refreshAdminStatsButton.addEventListener("click", () => refreshAdminStats());
}
if (adminCreateClientFamilyButton) {
  adminCreateClientFamilyButton.addEventListener("click", () => {
    withButtonBusy(adminCreateClientFamilyButton, "Criando...", () => createAdminClientFamily().catch((error) => {
      console.error("Erro ao criar família/cliente:", error);
      if (adminCreateFamilyResult) {
        adminCreateFamilyResult.hidden = false;
        adminCreateFamilyResult.textContent = getFirebaseErrorMessage(error);
      }
    }));
  });
}
if (prepareFranciscoFamilyButton) {
  prepareFranciscoFamilyButton.addEventListener("click", () => {
    prepareFranciscoFamilyForMigration().catch((error) => {
      console.error("Erro ao preparar família Francisco:", error);
      if (franciscoMigrationResult) {
        franciscoMigrationResult.hidden = false;
        franciscoMigrationResult.textContent = getFirebaseErrorMessage(error);
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
      const map = { "create-family": "adminCreateFamilySection", clients: "adminFamilyMonitorSection", commercial: "adminCommercialDashboard", beta: "adminCommercialReadinessSection", members: "adminMembersSection", invite: "adminInviteSection", migration: "adminMigrationSection" };
      scrollAdminSection(map[target] || target);
      return;
    }

    if (event.target.closest("#familyHealthRefreshButton")) {
      return;
    }

    if (event.target.closest("#familyHealthRepairButton")) {
      const button = event.target.closest("#familyHealthRepairButton");
      button.disabled = true;
      button.textContent = "Corrigindo...";
      await repairFamilyIntegrity();
      button.textContent = "Corrigir vínculos";
      button.disabled = !cloudUser || !hasFamilyAccess();
      return;
    }

    if (event.target.closest("#familyBackupJsonButton")) {
      exportFullFamilyBackup();
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
      return;
    }

    const roleButton = event.target.closest("[data-update-member-role]");
    if (roleButton) {
      const uid = roleButton.dataset.updateMemberRole || "";
      const select = adminInvitePanel.querySelector(`[data-member-role-select="${CSS.escape(uid)}"]`);
      roleButton.disabled = true;
      roleButton.textContent = "Salvando...";
      await updateFamilyMemberRole(uid, select?.value || FAMILY_ROLE_VIEWER);
      return;
    }

    const removeButton = event.target.closest("[data-remove-member]");
    if (removeButton) {
      const uid = removeButton.dataset.removeMember || "";
      const email = removeButton.dataset.removeMemberEmail || "";
      removeButton.disabled = true;
      removeButton.textContent = "Removendo...";
      await removeFamilyMember(uid, email);
      return;
    }
  });
}

function withNinouTimeout(promise, timeoutMs = 12000) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), timeoutMs)),
  ]);
}


function buildBasicFamilyHealthStats() {
  const familyId = familyAccess?.familyId || (isGlobalAppAdmin() ? getActiveAdminFamilyId() : "");
  const hasFamilyId = Boolean(familyId);
  const familyName = getProfileFamilyDisplayName?.() || latestAdminStats?.familyName || getBabyDisplayName?.() || "Família Ninou";
  const hasProfile = Boolean(hasFamilyId && familyName && familyName !== "Bebê");
  return {
    familyName,
    families: hasFamilyId ? [{ id: familyId, name: familyName, subtitle: "Família conectada" }] : [],
    members: [],
    pendingInvites: [],
    familyAudit: [],
    knownUsers: [],
    familiesCount: hasFamilyId ? 1 : 0,
    membersCount: hasFamilyAccess() ? 1 : 0,
    pendingInvitesCount: 0,
    acceptedInvitesCount: 0,
    knownUsersCount: 0,
    integrity: {
      hasFamilyId,
      selectedHasProfile: hasProfile,
      visibleMembersCount: hasFamilyAccess() ? 1 : 0,
      pendingInvitesCount: 0,
      expiredPendingInvites: 0,
      usersWithoutLink: 0,
      emptyFamilies: 0,
      duplicateEmailCount: 0,
    },
  };
}

async function runFamilyHealthRefresh({ button = familyHealthRefreshButton } = {}) {
  if (button?.dataset?.ninouCheckingFamily === "true") return null;
  if (button) {
    button.dataset.ninouCheckingFamily = "true";
    button.disabled = true;
    button.textContent = "Verificando...";
  }
  if (familyHealthStatus) familyHealthStatus.textContent = "Verificando família...";
  try {
    const stats = await withNinouTimeout(refreshAdminStats({ silent: true }), 10000);
    const effectiveStats = stats || latestAdminStats || buildBasicFamilyHealthStats();
    renderFamilyHealthPanel(effectiveStats);
    if (familyHealthStatus) {
      familyHealthStatus.textContent = stats || latestAdminStats
        ? "Verificação concluída. Use os alertas acima apenas como apoio técnico."
        : "Verificação básica concluída neste aparelho. Para checagem completa, confirme conexão e regras do Firebase.";
    }
    return effectiveStats;
  } catch (error) {
    console.warn("Verificação da família não concluiu:", error);
    const fallbackStats = latestAdminStats || buildBasicFamilyHealthStats();
    renderFamilyHealthPanel(fallbackStats);
    if (familyHealthStatus) {
      familyHealthStatus.textContent = error?.message === "timeout"
        ? "Verificação básica exibida. A checagem completa demorou demais; confira a conexão se precisar atualizar os dados da nuvem."
        : "Verificação básica exibida. A checagem completa depende da conexão e das regras do Firebase.";
    }
    return fallbackStats;
  } finally {
    if (button) {
      button.textContent = "Verificar família";
      button.disabled = false;
      delete button.dataset.ninouCheckingFamily;
    }
  }
}

if (familyHealthRefreshButton) {
  familyHealthRefreshButton.addEventListener("click", async (event) => {
    event.preventDefault();
    event.stopPropagation();
    await runFamilyHealthRefresh({ button: familyHealthRefreshButton });
  });
}
if (familyHealthRepairButton) {
  familyHealthRepairButton.addEventListener("click", async () => {
    familyHealthRepairButton.disabled = true;
    familyHealthRepairButton.textContent = "Corrigindo...";
    await repairFamilyIntegrity();
    familyHealthRepairButton.textContent = "Corrigir vínculos";
    familyHealthRepairButton.disabled = !cloudUser || !hasFamilyAccess();
  });
}
if (familyBackupJsonButton) {
  familyBackupJsonButton.addEventListener("click", () => exportFullFamilyBackup());
}
if (familyRealTestRefreshButton) {
  familyRealTestRefreshButton.addEventListener("click", async () => {
    familyRealTestRefreshButton.disabled = true;
    familyRealTestRefreshButton.textContent = "Verificando...";
    if (familyRealTestStatus) familyRealTestStatus.textContent = "Revisando fluxo familiar com os dados atuais...";
    await refreshAdminStats();
    renderRealFamilyUseTestPanel(latestAdminStats);
    familyRealTestRefreshButton.textContent = "Rodar checklist";
    familyRealTestRefreshButton.disabled = false;
  });
}
if (familyRealTestExportButton) {
  familyRealTestExportButton.addEventListener("click", () => exportRealFamilyUseChecklist());
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


function setAdminInterfaceMode(isAdvanced, { persist = true } = {}) {
  const advanced = Boolean(isAdvanced);
  document.body.classList.toggle("ninou-advanced-mode", advanced);
  document.body.classList.toggle("ninou-simple-mode", !advanced);
  if (adminModeToggleButton) {
    adminModeToggleButton.setAttribute("aria-pressed", advanced ? "true" : "false");
    adminModeToggleButton.textContent = advanced ? "Usar modo simples" : "Mostrar modo avançado";
  }
  if (adminModeHint) {
    adminModeHint.textContent = advanced
      ? "Modo avançado ativo: diagnóstico técnico, histórico completo, backup JSON e manutenção ficam visíveis."
      : "Modo simples ativo: o Ninou mostra só o essencial e mantém diagnóstico técnico recolhido.";
  }
  if (persist) localStorage.setItem("ninou_admin_interface_mode", advanced ? "advanced" : "simple");
}

function initAdminInterfaceMode() {
  const savedMode = localStorage.getItem("ninou_admin_interface_mode");
  setAdminInterfaceMode(savedMode === "advanced", { persist: false });
  adminModeToggleButton?.addEventListener("click", () => {
    setAdminInterfaceMode(!document.body.classList.contains("ninou-advanced-mode"));
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
initAdminInterfaceMode();
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
    navigator.serviceWorker.register("/sw.js?v=76.1.0", { updateViaCache: "none" }).then((registration) => {
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


/* Ninou v75.75.67 — base multi-família + polimento seguro consolidado no app.legacy.js */
(() => {
  const VERSION = "75.75.67";
  const EMAIL_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
  const TEXT_TAGS = "strong,small,span,p,em,li,b";
  const SKIP_SELECTOR = "script,style,textarea,input,select,option,button,.ninou-email-token";
  const buttonLabels = new Map([
    ["Abrir rotina da família selecionada", "Abrir rotina"],
    ["Gerenciar membros", "Membros"],
    ["Criar convite", "Convite"],
    ["Revisar migração", "Migração"],
    ["Buscar por e-mail", "Buscar"],
    ["Preparar para consulta", "Consulta"],
    ["Enviar WhatsApp", "WhatsApp"],
  ]);
  function escapeHtmlLocal(value) {
    return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
  }
  function protectEmailText(element) {
    if (!element || element.closest(SKIP_SELECTOR)) return;
    if (element.dataset?.ninouEmailProtected === "true") return;
    if (element.children.length) return;
    const text = element.textContent || "";
    if (!EMAIL_RE.test(text)) return;
    EMAIL_RE.lastIndex = 0;
    element.innerHTML = escapeHtmlLocal(text).replace(EMAIL_RE, (email) => {
      const safe = escapeHtmlLocal(email);
      return `<span class="ninou-email-token" title="${safe}">${safe}</span>`;
    });
    element.dataset.ninouEmailProtected = "true";
  }
  function polish(root = document) {
    document.documentElement.dataset.ninouPremiumSafe = VERSION;
    root.querySelectorAll?.(TEXT_TAGS).forEach(protectEmailText);
    root.querySelectorAll?.("button").forEach((button) => {
      if (button.dataset.ninouSafeShortened === "true") return;
      const current = (button.textContent || "").replace(/\s+/g, " ").trim();
      const replacement = buttonLabels.get(current);
      if (!replacement) return;
      button.dataset.ninouSafeShortened = "true";
      if (!button.getAttribute("aria-label")) button.setAttribute("aria-label", current);
      button.title = current;
      button.textContent = replacement;
    });
  }
  let scheduled = false;
  function schedulePolish() {
    if (scheduled) return;
    scheduled = true;
    window.requestAnimationFrame(() => { scheduled = false; polish(document); });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => polish(document), { once: true });
  else polish(document);
  new MutationObserver(schedulePolish).observe(document.documentElement, { childList: true, subtree: true, characterData: true });
})();


/* Ninou v75.75.67 — guarda de estabilidade + preparação multi-família. */
(() => {
  const VERSION = "75.75.67";
  const RESET_LABELS = new Map([
    ["familyHealthRefreshButton", "Verificar família"],
    ["familyHealthRepairButton", "Corrigir vínculos"],
    ["familyRealTestRefreshButton", "Rodar checklist"],
    ["loginButton", "Entrar"],
    ["createAccountButton", "Criar conta"],
    ["saveBabyWeightButton", "Atualizar peso"],
    ["saveCaregiverIdentityButton", "Salvar identificação"],
  ]);

  function normalizeText(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  function clearLongPendingButton(button) {
    if (!button || button.dataset.ninouAllowPending === "true") return;
    const text = normalizeText(button.textContent);
    if (!button.disabled) return;
    if (!/(verificando|salvando|entrando|criando|corrigindo|carregando|atualizando)/i.test(text)) return;
    const startedAt = Number(button.dataset.ninouPendingStartedAt || 0);
    const now = Date.now();
    if (!startedAt) {
      button.dataset.ninouPendingStartedAt = String(now);
      return;
    }
    if (now - startedAt < 18000) return;
    const fallback = RESET_LABELS.get(button.id);
    if (fallback) button.textContent = fallback;
    button.disabled = false;
    delete button.dataset.ninouCheckingFamily;
    delete button.dataset.ninouPendingStartedAt;
  }

  function markPendingButtons(root = document) {
    root.querySelectorAll?.("button:disabled").forEach(clearLongPendingButton);
  }

  function stabilizeViewport() {
    document.documentElement.dataset.ninouStabilityVersion = VERSION;
    document.querySelectorAll("input, select, textarea").forEach((field) => {
      field.style.fontSize = "16px";
    });
  }

  function stabilize() {
    stabilizeViewport();
    markPendingButtons(document);
  }

  window.addEventListener("pageshow", stabilize);
  window.addEventListener("focus", stabilize);
  setInterval(stabilize, 6000);

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", stabilize, { once: true });
  } else {
    stabilize();
  }
})();


/* Ninou v75.75.67 — centro de privacidade, termos e solicitações de dados. */
(() => {
  const LEGAL_VERSION = "75.75.67";
  const CONSENT_KEY = `ninou_legal_consent_${LEGAL_VERSION}`;
  const REQUEST_KEY = `ninou_legal_last_request_${LEGAL_VERSION}`;
  const modal = document.querySelector("#legalInfoModal");
  const modalKicker = document.querySelector("#legalInfoKicker");
  const modalTitle = document.querySelector("#legalInfoTitle");
  const modalBody = document.querySelector("#legalInfoBody");
  const modalAccept = document.querySelector("#legalInfoAcceptButton");
  const closeButtons = document.querySelectorAll("[data-close-legal-modal], #legalInfoCloseButton");
  const privacyButton = document.querySelector("#legalPrivacyPolicyButton");
  const termsButton = document.querySelector("#legalTermsButton");
  const medicalButton = document.querySelector("#legalMedicalDisclaimerButton");
  const consentButton = document.querySelector("#legalConsentButton");
  const exportButton = document.querySelector("#legalExportDataButton");
  const requestButton = document.querySelector("#legalDataRequestButton");
  const status = document.querySelector("#legalReadinessStatus");
  const badge = document.querySelector("#legalConsentBadge");
  const consentStatus = document.querySelector("#legalConsentStatus");
  const consentDate = document.querySelector("#legalConsentDate");
  const versionLabel = document.querySelector("#legalVersionLabel");

  const content = {
    privacy: {
      kicker: "Privacidade",
      title: "Política de privacidade do Ninou",
      html: `
        <article><strong>Quais dados o Ninou organiza</strong><p>Rotina do bebê, horários, mamadas, fraldas, sono, peso, observações, nomes de cuidadores, vínculo familiar, convites e dados básicos da conta usada para login.</p></article>
        <article><strong>Como os dados são separados</strong><p>Cada família usa um <b>familyId</b>. Um cuidador só deve acessar a família em que foi autorizado por convite ou vínculo familiar.</p></article>
        <article><strong>Finalidade</strong><p>O uso é familiar: acompanhar a rotina, gerar relatórios, compartilhar resumo por WhatsApp/PDF e facilitar a comunicação entre cuidadores.</p></article>
        <article><strong>Controle da família</strong><p>A família pode exportar os dados no Perfil e solicitar exclusão. Em beta, a exclusão deve ser confirmada pelo administrador antes de remoções definitivas.</p></article>
      `,
    },
    terms: {
      kicker: "Termos de uso",
      title: "Termos de uso do beta Ninou",
      html: `
        <article><strong>Uso familiar</strong><p>O Ninou é um diário de rotina familiar para bebês. O responsável deve cadastrar apenas dados necessários e convidar somente cuidadores autorizados.</p></article>
        <article><strong>Conta e convite</strong><p>Cada pessoa deve usar seu próprio e-mail quando possível. Convites são pessoais e devem ser aceitos pelo e-mail informado.</p></article>
        <article><strong>Beta controlado</strong><p>Esta versão é candidata a beta. Pode haver ajustes, correções e revisão jurídica antes de lançamento público ou cobrança recorrente.</p></article>
        <article><strong>Responsabilidade</strong><p>O usuário deve revisar registros, exportar backup antes de testes críticos e procurar suporte ao notar divergência de dados.</p></article>
      `,
    },
    medical: {
      kicker: "Aviso médico",
      title: "O Ninou não substitui pediatra",
      html: `
        <article><strong>Sem diagnóstico</strong><p>O Ninou não diagnostica, não prescreve, não determina tratamento e não substitui avaliação pediátrica.</p></article>
        <article><strong>Medicamentos</strong><p>Registros de medicamentos são apenas anotações familiares. Doses, horários e decisões clínicas devem seguir orientação profissional.</p></article>
        <article><strong>Sinais de alerta</strong><p>Em caso de febre, dificuldade respiratória, engasgos, sonolência incomum, baixa alimentação ou qualquer preocupação, procure atendimento médico.</p></article>
      `,
    },
  };

  function getLegalContext(extra = {}) {
    const familyId = getActiveFamilyId?.({ allowLegacyFallback: false }) || familyAccess?.familyId || "";
    return {
      app: "Ninou",
      legalVersion: LEGAL_VERSION,
      familyId,
      email: cloudUser?.email || localStorage.getItem(storageKeys.email) || "",
      uid: cloudUser?.uid || "",
      createdAtClient: new Date().toISOString(),
      appVersion: NINOU_RUNTIME_VERSION,
      ...extra,
    };
  }

  function readConsent() {
    try { return JSON.parse(localStorage.getItem(CONSENT_KEY) || "null"); }
    catch { return null; }
  }

  function setLegalStatus(message) {
    if (status) status.textContent = message;
  }

  function formatConsentDate(value) {
    if (!value) return "Aguardando aceite";
    try { return new Date(value).toLocaleString("pt-BR"); }
    catch { return "Aceito neste aparelho"; }
  }

  function canUseFamilyDataExport() {
    if (typeof window.ninouCanManageFamilyData === "function") return window.ninouCanManageFamilyData();
    try { return typeof isFamilyAdmin === "function" && isFamilyAdmin(); }
    catch { return false; }
  }

  function canRequestFamilyDataDeletion() {
    if (typeof window.ninouCanRequestFamilyDeletion === "function") return window.ninouCanRequestFamilyDeletion();
    try { return typeof isGlobalAppAdmin === "function" && isGlobalAppAdmin(); }
    catch { return false; }
  }

  function renderLegalCenter() {
    const consent = readConsent();
    if (versionLabel) versionLabel.textContent = `v${LEGAL_VERSION}`;
    const accepted = Boolean(consent?.acceptedAtClient);
    if (badge) {
      badge.dataset.state = accepted ? "accepted" : "pending";
      badge.textContent = accepted ? "Aceito" : "Pendente";
    }
    if (consentStatus) consentStatus.textContent = accepted ? "Confirmado" : "Não confirmado";
    if (consentDate) consentDate.textContent = accepted ? formatConsentDate(consent.acceptedAtClient) : "Aguardando aceite";
    if (consentButton) consentButton.textContent = accepted ? "Aceite registrado" : "Aceitar termos";
    if (exportButton) exportButton.hidden = !canUseFamilyDataExport();
    if (requestButton) requestButton.hidden = !canRequestFamilyDataDeletion();
    if (!canUseFamilyDataExport() && status) {
      status.textContent = "Política, termos e aviso médico ficam disponíveis. Exportação e exclusão aparecem apenas para responsável/admin.";
    }
  }

  function openLegalModal(type = "privacy") {
    const item = content[type] || content.privacy;
    if (!modal || !modalTitle || !modalBody) return;
    if (modalKicker) modalKicker.textContent = item.kicker;
    modalTitle.textContent = item.title;
    modalBody.innerHTML = item.html;
    modal.hidden = false;
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
  }

  function closeLegalModal() {
    if (!modal) return;
    modal.hidden = true;
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
  }

  async function writeLegalDoc(collectionDoc, payload) {
    try {
      const services = await getFirebaseServices();
      await services.setDoc(collectionDoc(services), {
        ...payload,
        updatedAt: services.serverTimestamp(),
      }, { merge: true });
      return true;
    } catch (error) {
      console.warn("Registro legal não salvo na nuvem:", error);
      return false;
    }
  }

  async function saveConsent() {
    const payload = getLegalContext({
      type: "terms_acceptance",
      acceptedAtClient: new Date().toISOString(),
      privacyPolicyVersion: LEGAL_VERSION,
      termsVersion: LEGAL_VERSION,
      medicalDisclaimerAccepted: true,
    });
    localStorage.setItem(CONSENT_KEY, JSON.stringify(payload));
    renderLegalCenter();
    closeLegalModal();
    setLegalStatus("Aceite registrado neste aparelho. Quando logado em uma família, o Ninou também tenta salvar esse aceite na nuvem.");

    if (cloudUser?.uid) {
      await writeLegalDoc((services) => services.doc(services.db, "users", cloudUser.uid, "account", "legal"), payload);
    }
    if (cloudUser?.uid && payload.familyId) {
      await writeLegalDoc((services) => services.doc(services.db, "families", payload.familyId, "legal", `consent_${cloudUser.uid}`), {
        ...payload,
        familyId: payload.familyId,
        actorUid: cloudUser.uid,
        actorEmail: payload.email,
        status: "accepted",
      });
    }
  }

  function downloadLegalRequest(payload) {
    const familyId = sanitizeLocalStorageSegment(payload.familyId || "familia");
    const dateId = toDateInputValue(Date.now());
    downloadFile(`ninou-solicitacao-dados-${familyId}-${dateId}.json`, JSON.stringify(payload, null, 2), "application/json;charset=utf-8");
  }

  async function requestDataDeletion() {
    if (!canRequestFamilyDataDeletion()) {
      setLegalStatus("Solicitação de exclusão fica disponível apenas para responsável principal/admin global.");
      return;
    }
    const confirmed = window.confirm("Deseja registrar uma solicitação de exclusão dos dados desta família/conta? Antes de excluir definitivamente, exporte um backup JSON.");
    if (!confirmed) return;
    const payload = getLegalContext({
      type: "data_deletion_request",
      status: "requested",
      requestedAtClient: new Date().toISOString(),
      note: "Solicitação feita pelo Centro de confiança do Ninou. Exige conferência antes de exclusão definitiva.",
    });
    localStorage.setItem(REQUEST_KEY, JSON.stringify(payload));
    downloadLegalRequest(payload);
    setLegalStatus("Solicitação de exclusão registrada e baixada em JSON. Em beta, confirme com o administrador antes de remover dados definitivos.");

    if (cloudUser?.uid) {
      await writeLegalDoc((services) => services.doc(services.db, "users", cloudUser.uid, "account", "dataDeletionRequest"), payload);
    }
    if (cloudUser?.uid && payload.familyId) {
      await writeLegalDoc((services) => services.doc(services.db, "families", payload.familyId, "legal", `data_request_${cloudUser.uid}`), {
        ...payload,
        familyId: payload.familyId,
        actorUid: cloudUser.uid,
        actorEmail: payload.email,
      });
    }
  }

  privacyButton?.addEventListener("click", () => openLegalModal("privacy"));
  termsButton?.addEventListener("click", () => openLegalModal("terms"));
  medicalButton?.addEventListener("click", () => openLegalModal("medical"));
  consentButton?.addEventListener("click", saveConsent);
  modalAccept?.addEventListener("click", saveConsent);
  closeButtons.forEach((button) => button.addEventListener("click", closeLegalModal));
  modal?.addEventListener("click", (event) => {
    if (event.target?.dataset?.closeLegalModal === "true") closeLegalModal();
  });
  exportButton?.addEventListener("click", () => {
    if (!canUseFamilyDataExport()) {
      setLegalStatus("Exportação de dados fica disponível apenas para responsável/admin familiar.");
      return;
    }
    if (typeof exportFullFamilyBackup === "function") exportFullFamilyBackup();
    else exportRoutine?.("json");
    setLegalStatus("Use o backup JSON como cópia antes de qualquer limpeza ou troca de família.");
  });
  requestButton?.addEventListener("click", requestDataDeletion);
  window.addEventListener("pageshow", renderLegalCenter);
  renderLegalCenter();
})();

/* Ninou v75.75.67 — suporte e monitoramento simples para beta comercial. */
(() => {
  const SUPPORT_VERSION = "75.75.67";
  const REPORTS_KEY = `ninou_support_reports_${SUPPORT_VERSION}`;
  const ERRORS_KEY = `ninou_runtime_errors_${SUPPORT_VERSION}`;

  const modal = document.querySelector("#supportReportModal");
  const reportButton = document.querySelector("#supportReportButton");
  const copyDiagnosticsButton = document.querySelector("#supportCopyDiagnosticsButton");
  const backupButton = document.querySelector("#supportDownloadBackupButton");
  const closeButtons = document.querySelectorAll("[data-close-support-modal], #supportReportCloseButton");
  const submitButton = document.querySelector("#supportSubmitButton");
  const typeInput = document.querySelector("#supportIssueTypeInput");
  const severityInput = document.querySelector("#supportSeverityInput");
  const descriptionInput = document.querySelector("#supportDescriptionInput");
  const preview = document.querySelector("#supportDiagnosticsPreview");
  const status = document.querySelector("#supportBetaStatus");
  const badge = document.querySelector("#supportBetaBadge");
  const versionLabel = document.querySelector("#supportVersionLabel");
  const lastReportLabel = document.querySelector("#supportLastReportLabel");
  const lastReportDetail = document.querySelector("#supportLastReportDetail");
  const adminList = document.querySelector("#adminSupportReportsList");
  const adminReportsCount = document.querySelector("#adminSupportReportsCount");
  const adminErrorsCount = document.querySelector("#adminSupportErrorsCount");
  const adminStatusLabel = document.querySelector("#adminSupportStatusLabel");
  const adminStatus = document.querySelector("#adminSupportReportsStatus");
  const adminRefresh = document.querySelector("#adminSupportRefreshButton");
  const adminDownload = document.querySelector("#adminSupportDownloadButton");

  function canUseSupportBackup() {
    if (typeof window.ninouCanManageFamilyData === "function") return window.ninouCanManageFamilyData();
    try { return typeof isFamilyAdmin === "function" && isFamilyAdmin(); }
    catch { return false; }
  }

  function safeReadList(key) {
    try {
      const value = JSON.parse(localStorage.getItem(key) || "[]");
      return Array.isArray(value) ? value : [];
    } catch {
      return [];
    }
  }

  function safeWriteList(key, items, limit = 20) {
    try {
      localStorage.setItem(key, JSON.stringify(items.slice(0, limit)));
    } catch (error) {
      console.warn("Não foi possível salvar diagnóstico local do Ninou:", error);
    }
  }

  function supportFamilyId() {
    try {
      if (typeof getActiveFamilyId === "function") {
        return getActiveFamilyId({ allowLegacyFallback: false }) || familyAccess?.familyId || "";
      }
      return familyAccess?.familyId || "";
    } catch {
      return familyAccess?.familyId || "";
    }
  }

  function supportEmail() {
    try {
      return cloudUser?.email || localStorage.getItem(storageKeys.email) || "";
    } catch {
      return cloudUser?.email || "";
    }
  }

  function getPwaMode() {
    const standalone = window.matchMedia?.("(display-mode: standalone)")?.matches || navigator.standalone === true;
    return standalone ? "PWA instalado" : "Navegador";
  }

  function collectDiagnostics() {
    const errors = safeReadList(ERRORS_KEY).slice(0, 5);
    const reports = safeReadList(REPORTS_KEY);
    const familyId = supportFamilyId();
    return {
      app: "Ninou",
      supportVersion: SUPPORT_VERSION,
      appVersion: typeof NINOU_RUNTIME_VERSION !== "undefined" ? NINOU_RUNTIME_VERSION : SUPPORT_VERSION,
      familyId,
      familyScopeVersion: typeof NINOU_FAMILY_SCOPE_VERSION !== "undefined" ? NINOU_FAMILY_SCOPE_VERSION : "",
      email: supportEmail(),
      uid: cloudUser?.uid || "",
      pwa: getPwaMode(),
      url: location.href,
      userAgent: navigator.userAgent,
      language: navigator.language,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      screen: `${screen.width}x${screen.height}`,
      online: navigator.onLine,
      localTime: new Date().toISOString(),
      localSupportReports: reports.length,
      recentErrors: errors,
    };
  }

  function diagnosticsText() {
    return JSON.stringify(collectDiagnostics(), null, 2);
  }

  function setSupportStatus(message, state = "ready") {
    if (status) status.textContent = message;
    if (badge) {
      badge.dataset.state = state === "error" ? "pending" : "accepted";
      badge.textContent = state === "error" ? "Atenção" : "Pronto";
    }
  }

  function formatDate(value) {
    if (!value) return "Nenhum";
    try { return new Date(value).toLocaleString("pt-BR"); }
    catch { return "Registrado"; }
  }

  function renderSupportCenter() {
    const reports = safeReadList(REPORTS_KEY);
    const errors = safeReadList(ERRORS_KEY);
    const latest = reports[0];
    if (versionLabel) versionLabel.textContent = `v${SUPPORT_VERSION}`;
    if (lastReportLabel) lastReportLabel.textContent = latest ? formatDate(latest.createdAtClient) : "Nenhum";
    if (lastReportDetail) lastReportDetail.textContent = latest ? `${latest.issueType || "problema"} · ${latest.severity || "normal"}` : "Aguardando teste real";
    if (adminReportsCount) adminReportsCount.textContent = String(reports.length);
    if (adminErrorsCount) adminErrorsCount.textContent = String(errors.length);
    if (adminStatusLabel) adminStatusLabel.textContent = reports.length || errors.length ? "Acompanhar" : "Aguardando beta";
    if (adminStatus) adminStatus.textContent = reports.length || errors.length
      ? "Baixe o diagnóstico antes de investigar permissões, convites ou cache em outro aparelho."
      : "Os relatórios também tentam salvar em families/{familyId}/legal quando o usuário está logado e autorizado.";
    if (backupButton) backupButton.hidden = !canUseSupportBackup();
    const isGlobal = typeof isGlobalAppAdmin === "function" && isGlobalAppAdmin();
    document.querySelectorAll("[data-global-admin-only]").forEach((node) => { node.hidden = !isGlobal; });
    renderAdminSupportList(reports, errors);
  }

  function escapeSupportHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "\"": "&quot;",
      "'": "&#39;",
    }[char] || char));
  }

  function renderAdminSupportList(reports, errors) {
    if (!adminList) return;
    if (!reports.length && !errors.length) {
      adminList.innerHTML = '<li class="polished-admin-empty">Nenhum relatório de suporte registrado neste aparelho.</li>';
      return;
    }
    const reportItems = reports.slice(0, 8).map((item) => {
      const issue = item.issueType || "relatório";
      const severity = item.severity || "normal";
      const familyId = item.familyId || "sem família";
      const description = (item.description || "Sem descrição.").slice(0, 160);
      return `<li><strong>${escapeSupportHtml(issue)} · ${escapeSupportHtml(severity)}</strong><span>${escapeSupportHtml(description)}</span><small>${escapeSupportHtml(familyId)} · ${escapeSupportHtml(formatDate(item.createdAtClient))}</small></li>`;
    });
    const errorItems = errors.slice(0, 4).map((item) => {
      return `<li><strong>Erro local capturado</strong><span>${escapeSupportHtml((item.message || "Erro sem mensagem").slice(0, 160))}</span><small>${escapeSupportHtml(formatDate(item.createdAtClient))}</small></li>`;
    });
    adminList.innerHTML = [...reportItems, ...errorItems].join("");
  }

  function refreshPreview() {
    if (!preview) return;
    const d = collectDiagnostics();
    preview.textContent = `v${d.appVersion} · ${d.email || "sem e-mail"} · ${d.familyId || "sem familyId"} · ${d.pwa} · ${d.viewport} · erros: ${d.recentErrors.length}`;
  }

  function openSupportModal() {
    if (!modal) return;
    refreshPreview();
    modal.hidden = false;
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
    setTimeout(() => descriptionInput?.focus(), 40);
  }

  function closeSupportModal() {
    if (!modal) return;
    modal.hidden = true;
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
  }

  async function writeSupportDoc(payload) {
    if (!cloudUser?.uid || !payload.familyId) return false;
    try {
      const services = await getFirebaseServices();
      const stamp = Date.now();
      const uidSegment = String(cloudUser.uid).replace(/[^a-zA-Z0-9_-]/g, "_");
      await services.setDoc(services.doc(services.db, "families", payload.familyId, "legal", `support_${uidSegment}_${stamp}`), {
        ...payload,
        familyId: payload.familyId,
        actorUid: cloudUser.uid,
        actorEmail: payload.email,
        status: "requested",
        type: "support_request",
        updatedAt: services.serverTimestamp(),
      }, { merge: true });
      await services.setDoc(services.doc(services.db, "users", cloudUser.uid, "account", "supportLastRequest"), {
        ...payload,
        status: "requested",
        type: "support_request",
        updatedAt: services.serverTimestamp(),
      }, { merge: true });
      return true;
    } catch (error) {
      console.warn("Relatório de suporte não salvo na nuvem:", error);
      return false;
    }
  }

  async function saveSupportReport() {
    const description = (descriptionInput?.value || "").trim();
    if (!description) {
      setSupportStatus("Descreva o que aconteceu antes de salvar o relatório.", "error");
      descriptionInput?.focus();
      return;
    }
    const payload = {
      ...collectDiagnostics(),
      type: "support_request",
      issueType: typeInput?.value || "outro",
      severity: severityInput?.value || "normal",
      description,
      status: "requested",
      createdAtClient: new Date().toISOString(),
    };
    const reports = safeReadList(REPORTS_KEY);
    safeWriteList(REPORTS_KEY, [payload, ...reports], 25);
    const savedCloud = await writeSupportDoc(payload);
    renderSupportCenter();
    closeSupportModal();
    if (descriptionInput) descriptionInput.value = "";
    setSupportStatus(savedCloud
      ? "Relatório salvo neste aparelho e enviado para a nuvem da família."
      : "Relatório salvo neste aparelho. Baixe ou copie o diagnóstico para enviar ao suporte.");
  }

  async function copyDiagnostics() {
    const text = diagnosticsText();
    try {
      await navigator.clipboard.writeText(text);
      setSupportStatus("Diagnóstico copiado. Cole na conversa de suporte para investigarmos com mais precisão.");
    } catch {
      downloadDiagnostics();
      setSupportStatus("Não consegui copiar automaticamente. Baixei o diagnóstico em JSON.");
    }
  }

  function downloadDiagnostics() {
    const familyId = typeof sanitizeLocalStorageSegment === "function" ? sanitizeLocalStorageSegment(supportFamilyId() || "familia") : (supportFamilyId() || "familia");
    const dateId = typeof toDateInputValue === "function" ? toDateInputValue(Date.now()) : new Date().toISOString().slice(0, 10);
    const payload = {
      diagnostics: collectDiagnostics(),
      reports: safeReadList(REPORTS_KEY),
      errors: safeReadList(ERRORS_KEY),
    };
    downloadFile(`ninou-suporte-${familyId}-${dateId}.json`, JSON.stringify(payload, null, 2), "application/json;charset=utf-8");
  }

  function backupFamily() {
    if (!canUseSupportBackup()) {
      setSupportStatus("Backup JSON fica disponível apenas para responsável/admin familiar.", "error");
      return;
    }
    try {
      if (typeof exportFullFamilyBackup === "function") exportFullFamilyBackup();
      else if (typeof exportRoutine === "function") exportRoutine("json");
      setSupportStatus("Backup JSON gerado. Guarde antes de limpar cache, trocar família ou investigar sincronização.");
    } catch (error) {
      console.warn("Backup de suporte falhou:", error);
      setSupportStatus("Não consegui gerar o backup automaticamente. Tente novamente após atualizar o app.", "error");
    }
  }

  function captureRuntimeError(source, message, extra = {}) {
    const item = {
      source,
      message: String(message || "Erro sem mensagem"),
      createdAtClient: new Date().toISOString(),
      appVersion: typeof NINOU_RUNTIME_VERSION !== "undefined" ? NINOU_RUNTIME_VERSION : SUPPORT_VERSION,
      familyId: supportFamilyId(),
      email: supportEmail(),
      ...extra,
    };
    const current = safeReadList(ERRORS_KEY);
    safeWriteList(ERRORS_KEY, [item, ...current], 25);
    renderSupportCenter();
  }

  window.addEventListener("error", (event) => {
    captureRuntimeError("window.error", event.message, {
      filename: event.filename || "",
      lineno: event.lineno || 0,
      colno: event.colno || 0,
    });
  });

  window.addEventListener("unhandledrejection", (event) => {
    const reason = event.reason;
    captureRuntimeError("unhandledrejection", reason?.message || reason || "Promise rejeitada", {
      stack: reason?.stack ? String(reason.stack).slice(0, 600) : "",
    });
  });

  reportButton?.addEventListener("click", openSupportModal);
  copyDiagnosticsButton?.addEventListener("click", copyDiagnostics);
  backupButton?.addEventListener("click", backupFamily);
  submitButton?.addEventListener("click", saveSupportReport);
  closeButtons.forEach((button) => button.addEventListener("click", closeSupportModal));
  modal?.addEventListener("click", (event) => {
    if (event.target?.dataset?.closeSupportModal === "true") closeSupportModal();
  });
  adminRefresh?.addEventListener("click", renderSupportCenter);
  adminDownload?.addEventListener("click", downloadDiagnostics);
  window.addEventListener("pageshow", renderSupportCenter);
  window.addEventListener("online", () => setSupportStatus("Conexão voltou. Se houve erro de sincronização, gere um novo relatório se necessário."));
  window.addEventListener("offline", () => setSupportStatus("Sem internet. O relatório pode ser salvo localmente e enviado depois.", "error"));

  refreshPreview();
  renderSupportCenter();
})();

/* Ninou v75.75.67 — revisão comercial final: restrição visual por permissão. */
(() => {
  const REVIEW_VERSION = "75.75.67";

  function currentEffectiveRole() {
    try {
      if (typeof isGlobalAppAdmin === "function" && isGlobalAppAdmin()) return FAMILY_ROLE_GLOBAL_ADMIN || "admin";
      if (typeof getEffectiveRole === "function") return getEffectiveRole(familyAccess?.role || FAMILY_ROLE_VIEWER, cloudUser?.email || familyAccess?.email || "");
      return String(familyAccess?.role || "");
    } catch {
      return "";
    }
  }

  function canManageFamilyData() {
    try {
      if (typeof isGlobalAppAdmin === "function" && isGlobalAppAdmin()) return true;
      if (typeof isFamilyManagerRole === "function") return Boolean(familyAccess?.familyId && isFamilyManagerRole(familyAccess?.role, cloudUser?.email || familyAccess?.email || ""));
      return false;
    } catch {
      return false;
    }
  }

  function canRequestDeletion() {
    try {
      if (typeof isGlobalAppAdmin === "function" && isGlobalAppAdmin()) return true;
      if (typeof isFamilyOwnerRole === "function") return Boolean(familyAccess?.familyId && isFamilyOwnerRole(familyAccess?.role));
      return false;
    } catch {
      return false;
    }
  }

  function isGlobalAdminVisible() {
    try { return typeof isGlobalAppAdmin === "function" && isGlobalAppAdmin(); }
    catch { return false; }
  }

  window.ninouCanManageFamilyData = canManageFamilyData;
  window.ninouCanRequestFamilyDeletion = canRequestDeletion;
  window.ninouCommercialReviewVersion = REVIEW_VERSION;

  function setHidden(node, hidden, title = "") {
    if (!node) return;
    node.hidden = Boolean(hidden);
    if (hidden && title) node.setAttribute("data-permission-hidden-reason", title);
    else node.removeAttribute("data-permission-hidden-reason");
  }

  function applyPermissionVisibility() {
    const managerAllowed = canManageFamilyData();
    const ownerAllowed = canRequestDeletion();
    const globalAllowed = isGlobalAdminVisible();
    const role = currentEffectiveRole();

    document.querySelectorAll('[data-sensitive-action="manager"]').forEach((node) => {
      setHidden(node, !managerAllowed, "Disponível apenas para responsável/admin familiar.");
    });
    document.querySelectorAll('[data-sensitive-action="owner"]').forEach((node) => {
      setHidden(node, !ownerAllowed, "Disponível apenas para responsável principal/admin global.");
    });
    document.querySelectorAll('[data-global-admin-only]').forEach((node) => {
      setHidden(node, !globalAllowed, "Disponível apenas para admin global.");
    });

    const status = document.querySelector("#supportBetaStatus");
    if (status && !managerAllowed) {
      status.textContent = "Você pode relatar problema e copiar diagnóstico. Backup, exportação e exclusão ficam restritos ao responsável/admin.";
    }
    const legalStatus = document.querySelector("#legalReadinessStatus");
    if (legalStatus && !managerAllowed) {
      legalStatus.textContent = "Política, termos e aviso médico ficam disponíveis. Dados sensíveis aparecem conforme o papel na família.";
    }
    const badge = document.querySelector("#supportBetaBadge");
    if (badge) {
      badge.title = `Papel atual: ${role || "sem papel"}`;
    }
  }

  window.ninouApplyCommercialPermissionVisibility = applyPermissionVisibility;
  window.addEventListener("pageshow", applyPermissionVisibility);
  window.addEventListener("focus", applyPermissionVisibility);
  document.addEventListener("visibilitychange", () => { if (!document.hidden) applyPermissionVisibility(); });
  setTimeout(applyPermissionVisibility, 120);
  setInterval(applyPermissionVisibility, 5000);
})();
