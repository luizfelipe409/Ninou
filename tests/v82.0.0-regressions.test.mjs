import { readFile, stat } from "node:fs/promises";
import assert from "node:assert/strict";
import { getEventDaySegment } from "../js/domain/records.js";
import { normalizeCommercialSubscription } from "../js/services/commercial-access-service.js";

const root = new URL("../", import.meta.url);
const [html, boot, core, adminRuntime, adminService, firebaseService, ux, stability, adminCss, premiumCss, focusedFlowCss, customerReadyCss, actionLauncher, recordSheet, visualGuard, sw, build, vercel, daySky, nightSky] = await Promise.all([
  readFile(new URL("index.html", root), "utf8"),
  readFile(new URL("js/boot-v82.1.7.mjs", root), "utf8"),
  readFile(new URL("js/ninou-core-v82.1.7.mjs", root), "utf8"),
  readFile(new URL("js/ninou-admin-web-v82.1.7.mjs", root), "utf8"),
  readFile(new URL("js/services/admin-service-v82.1.7.js", root), "utf8"),
  readFile(new URL("js/services/firebase-service.js", root), "utf8"),
  readFile(new URL("js/ninou-ux-v82.0.0.mjs", root), "utf8"),
  readFile(new URL("js/ninou-stability-v82.0.0.mjs", root), "utf8"),
  readFile(new URL("styles/admin-web-v82.1.7.css", root), "utf8"),
  readFile(new URL("styles/premium-v82.0.0.css", root), "utf8"),
  readFile(new URL("styles/focused-flow-v82.0.0.css", root), "utf8"),
  readFile(new URL("styles/customer-ready-v82.1.7.css", root), "utf8"),
  readFile(new URL("js/ui/action-launcher.js", root), "utf8"),
  readFile(new URL("js/ui/record-sheet.js", root), "utf8"),
  readFile(new URL("js/runtime/visual-guard-v82.0.0.mjs", root), "utf8"),
  readFile(new URL("sw.js", root), "utf8"),
  readFile(new URL("scripts/build-production.mjs", root), "utf8"),
  readFile(new URL("vercel.json", root), "utf8"),
  readFile(new URL("assets/clock-themes/day-sky.svg", root), "utf8"),
  readFile(new URL("assets/clock-themes/night-sky.svg", root), "utf8"),
]);

const headEnd = html.indexOf("</head>");
const bootBarrier = html.indexOf('classList.add("ninou-booting", "ninou-v8200")');
assert.ok(bootBarrier > 0 && bootBarrier < headEnd, "A barreira de boot deve começar dentro do <head>.");
assert.match(html, /<body data-profile-access-state="booting">/);
assert.match(html, /id="adminWebPortal" class="premium-admin-root admin-web-portal"/);
assert.ok(html.indexOf('id="adminWebPortal"') < html.indexOf('<main class="phone-shell'), "O portal admin deve existir fora e antes do shell familiar.");
assert.match(adminRuntime, /const panelRoot = \$\('#adminWebPortal'\)/);
assert.match(adminCss, /body\.global-admin-mode > main\.phone-shell[\s\S]*display: none !important/);
assert.match(html, /id="quickActions" class="quick-actions"/);
assert.match(html, /class="bottom-bar"/);
assert.match(html, /styles\/legacy\.css\?v=82\.1\.7/);
assert.doesNotMatch(html, /styles\/admin-v82\.0\.0\.css/);
assert.doesNotMatch(html, /<script[^>]+ninou-admin-web-v82\.1\.7\.mjs/);
assert.match(html, /styles\/premium-v82\.0\.0\.css\?v=82\.1\.7/);
assert.match(html, /styles\/focused-flow-v82\.0\.0\.css\?v=82\.1\.7/);
assert.doesNotMatch(html, /styles\/(tokens|foundation|home|components|motion|responsive|v78\.4-critical)\.css/);
assert.match(html, /boot-v82\.1\.7\.mjs\?v=82\.1\.7/);
assert.match(html, /__NINOU_BOOT_WATCHDOG__/);
assert.match(html, /history\.replaceState/);

assert.match(boot, /const NINOU_VERSION = "82\.1\.7"/);
assert.match(boot, /const MIN_SPLASH_MS = 1500;/);
assert.match(boot, /visual-guard-v82\.0\.0/);
assert.match(core, /const NINOU_RUNTIME_VERSION = "82\.1\.7"/);
assert.match(core, /const NINOU_FAMILY_SCOPE_VERSION = "82\.1\.7-admin-web-portal"/);
assert.match(core, /const ADMIN_STYLESHEET_HREF = "\.\/styles\/admin-web-v82\.1\.7\.css\?v=82\.1\.7"/);
assert.match(core, /const ADMIN_RUNTIME_HREF = "\.\/ninou-admin-web-v82\.1\.7\.mjs\?v=82\.1\.7"/);
assert.match(core, /void ensureAdminRuntime\(\)/);
assert.doesNotMatch(core, /createInviteButton\.addEventListener/);
assert.doesNotMatch(core, /adminInvitePanel\.addEventListener/);
assert.match(adminRuntime, /export function initializeNinouAdminRuntime/);
assert.match(adminRuntime, /admin-service-v82\.1\.7\.js/);
assert.match(core, /async function activateGlobalAdminWebPortal/);
assert.match(core, /showAdminRuntimeFallback/);
assert.match(adminRuntime, /panelRoot\.addEventListener\(['"]click['"]/);
assert.match(adminRuntime, /Centro de operação/);
assert.match(adminRuntime, /panelRoot\.className = 'premium-admin-root'/);
assert.match(adminRuntime, /premium-admin-family-screen/);
assert.match(adminRuntime, /premiumAdminConfirmModal/);
assert.match(adminRuntime, /data-admin-count="\$\{id\}" hidden/);
assert.match(adminService, /isInternalAdminFamily/);
assert.match(adminService, /ninou-family-luizfelipe/);
assert.match(adminService, /familyDocuments = familiesSnapshot\.docs\.filter/);
assert.match(core, /saveFamilyAccess\(null, \{ render: false \}\);[\s\S]*saveSelectedAdminFamilyId\(""\)/);
assert.doesNotMatch(core, /if \(isGlobalAppAdmin\(user\)\)[\s\S]{0,800}await activatePersonalFamily\(\)/);
assert.match(core, /showBlockedAccountPortal/);
assert.match(firebaseService, /"auth\/wrong-password": "E-mail ou senha incorretos\."/);
assert.match(core, /document\.head\.append\(stylesheet\)/);
assert.match(ux, /const UX_VERSION = "82\.1\.4"/);
assert.match(stability, /const STABILITY_VERSION = "82\.1\.4"/);

assert.match(premiumCss, /autoridade visual revisada/);
assert.match(premiumCss, /body\.family-daily-surface:not\(\[data-active-screen="profile"\]\)/);
assert.match(premiumCss, /body\[data-active-screen="profile"\] \.bottom-bar/);
assert.match(premiumCss, /\.action-launcher-grid/);
assert.match(premiumCss, /#closeActionLauncherButton/);
assert.match(premiumCss, /font-variant-numeric: tabular-nums/);
assert.match(premiumCss, /v82\.0\.0 — relógio Céu Vivo/);
assert.match(premiumCss, /day-sky\.svg/);
assert.match(premiumCss, /night-sky\.svg/);
assert.match(premiumCss, /n8012-light-rays/);
assert.match(premiumCss, /n8012-star-drift/);
assert.match(premiumCss, /n8012-star-pulse/);
assert.match(premiumCss, /prefers-reduced-motion/);
assert.match(premiumCss, /body\.day-theme .*\.orbit-track/s);
assert.match(premiumCss, /body:not\(\.day-theme\) .*\.orbit-track/s);
assert.match(premiumCss, /body\.day-theme .*\.orbit-center-safe/s);
assert.match(premiumCss, /body:not\(\.day-theme\) .*\.orbit-center-safe/s);
assert.match(premiumCss, /\.orbit-duration-segment\s*\{[^}]*fill:\s*none[^}]*stroke:\s*url\(#orbitSegmentGradient\)/s);
assert.match(premiumCss, /\.orbit-gradient-stop-a\s*\{\s*stop-color:/);
assert.match(premiumCss, /@keyframes n82-journey-draw/);
assert.match(premiumCss, /body\[data-active-screen="profile"\] \.app-header/);
assert.match(premiumCss, /:is\(#closeSheet, #closeOrbitCluster\)\.icon-button-close/);
assert.match(premiumCss, /@media \(max-width: 430px\)[\s\S]*\.record-types/);
assert.match(premiumCss, /\.chips button:nth-child\(n\+4\)/);
assert.match(premiumCss, /\.action-launcher-grid > button:is\(:active,:hover\)/);
assert.match(focusedFlowCss, /\.breast-side-play::before/);
assert.match(focusedFlowCss, /\.select-control-wrap > select[\s\S]*width: 100%/);
assert.match(focusedFlowCss, /\.select-control-wrap > \.select-control-icon[\s\S]*translate3d\(0, -50%, 0\)/);

assert.match(core, /return -90 \+ .*ORBIT_DAY_MINUTES.*\* 360/s);
assert.match(core, /function getOrbitMarkerTimestamp[\s\S]*isSleepEvent\(event\)[\s\S]*getOrbitEventEnd\(event\)/);
assert.match(core, /position: eventPosition\(getOrbitMarkerTimestamp\(event, orbitStart, orbitEnd\)\)/);
assert.match(core, /terminou às/);
assert.match(core, /--orbit-celestial-x/);
assert.match(core, /--orbit-celestial-y/);

// A órbita de hoje herda apenas o trecho de um sono que realmente atravessou a meia-noite.
const currentDayStart = new Date(2026, 6, 19, 0, 0, 0, 0).getTime();
const currentDayEnd = currentDayStart + 24 * 60 * 60 * 1000;
const overnightSegment = getEventDaySegment({
  start: new Date(2026, 6, 18, 20, 21).getTime(),
  end: new Date(2026, 6, 19, 2, 50).getTime(),
}, currentDayStart, currentDayEnd);
assert.deepEqual(overnightSegment, {
  start: currentDayStart,
  end: new Date(2026, 6, 19, 2, 50).getTime(),
  crossesStart: true,
  crossesEnd: false,
});
assert.equal(getEventDaySegment({
  start: new Date(2026, 6, 18, 8, 15).getTime(),
  end: new Date(2026, 6, 18, 9, 5).getTime(),
}, currentDayStart, currentDayEnd), null);
assert.match(core, /getEventDaySegment\(\{ \.\.\.event, end: getOrbitEventEnd\(event\) \}, orbitStart, dayEnd\)/);
assert.match(html, /class="orbit-sky"/);
assert.match(html, /class="breast-side-play"/);
assert.match(html, /data-breast-side="left" aria-pressed="false"/);
assert.match(core, /button\.setAttribute\("aria-pressed", String\(isActive\)\)/);
assert.match(core, /\$\{isActive \? "Pausar" : "Iniciar"\} timer do peito/);
assert.match(visualGuard, /function verifyOrbit/);
assert.doesNotMatch(visualGuard, /style\.setProperty/);

assert.match(sw, /ninou-v82-1-7-customer-ready/);
assert.match(sw, /ninou-admin-web-v82\.1\.7\.mjs\?v=\$\{APP_VERSION\}/);
assert.match(sw, /const APP_VERSION = "82\.1\.7"/);
assert.match(sw, /const STYLE_MODULES = \["legacy", "premium-v82\.0\.0", "focused-flow-v82\.0\.0", "customer-ready-v82\.1\.7"\]/);
assert.match(sw, /day-sky\.svg/);
assert.match(sw, /night-sky\.svg/);
assert.match(build, /"assets\/clock-themes\/day-sky\.svg"/);
assert.match(build, /const publicFiles = \[/);
assert.match(build, /"js\/ninou-core-v82\.1\.7\.mjs"/);
assert.match(build, /"js\/ninou-admin-web-v82\.1\.7\.mjs"/);
assert.match(build, /"styles\/premium-v82\.0\.0\.css"/);
assert.match(build, /"styles\/admin-web-v82\.1\.7\.css"/);
assert.doesNotMatch(build, /"styles\/admin-v82\.0\.0\.css"/);
assert.doesNotMatch(build, /^\s*"(?:styles|js|icons|audio|assets|app\.js|styles\.css|firestore\.rules|vercel\.json)",?$/m);
assert.match(vercel, /"buildCommand": "npm run build"/);
assert.match(vercel, /"outputDirectory": "dist"/);
assert.doesNotMatch(vercel, /max-age=31536000, immutable/);

assert.match(daySky, /<linearGradient id="sky"/);
assert.match(daySky, /<radialGradient id="sunGlow"/);
assert.match(daySky, /<ellipse/);
assert.match(nightSky, /<linearGradient id="night"/);
assert.match(nightSky, /<radialGradient id="nebulaA"/);
assert.match(nightSky, /mask id="moonCut"/);

const legacySize = (await stat(new URL("styles/legacy.css", root))).size;
const adminSize = (await stat(new URL("styles/admin-web-v82.1.7.css", root))).size;
const premiumSize = (await stat(new URL("styles/premium-v82.0.0.css", root))).size;
assert.ok(legacySize < 620 * 1024, "O CSS comum deve permanecer abaixo de 620 KB.");
assert.ok(adminSize > 25 * 1024 && adminSize < 60 * 1024, "O CSS administrativo deve permanecer isolado e focado.");
assert.match(adminCss, /body\.global-admin-mode/);
assert.match(adminCss, /max-width:\s*720px/);
assert.match(adminCss, /grid-template-columns:\s*repeat\(2,minmax\(0,1fr\)\)/);
assert.match(adminCss, /\.premium-admin-modal\[data-variant="family"\]/);
assert.match(adminCss, /transform:\s*translateY\(100%\)/);
assert.match(adminCss, /@media \(min-width: 860px\)/);
assert.match(adminCss, /grid-template-columns:\s*repeat\(5,minmax\(0,1fr\)\)/);
assert.match(adminRuntime, /Verificar integridade/);
assert.doesNotMatch(adminRuntime, /Executar checklist/);
assert.match(adminRuntime, /Assinatura e acesso/);
assert.match(adminRuntime, /registro\(s\) sincronizado\(s\)/);
assert.match(adminRuntime, /Consolidar vínculo/);
assert.match(adminRuntime, /premium-admin-family-feedback/);
assert.match(adminCss, /max\(env\(safe-area-inset-top\), 46px\)/);
assert.match(core, /renderClientFamilySubscription/);
assert.match(html, /id="familySubscriptionSummary"/);
assert.match(premiumCss, /body\.global-admin-mode #adminInvitePanel/);
assert.ok(premiumSize > 20 * 1024 && premiumSize < 190 * 1024, "A autoridade premium deve ser substancial sem virar outro monólito.");

console.log("Regressões v82.0.0 validadas: céu claro solar, noite cósmica, órbita local, menu + e estabilidade preservados.");

// v82.0.0: ajustes solicitados após validação visual.
assert.doesNotMatch(html, /class="orbit-sun"/);
assert.match(premiumCss, /#orbitClusterSheet\[hidden\]/);
assert.match(premiumCss, /body\[data-active-screen="profile"\] \.fab-real-plus/);
assert.match(premiumCss, /--n79-nav-height: 70px/);
assert.match(premiumCss, /Marcadores reais com arte legível no céu claro/);

const { normalizeAdminRole } = await import(new URL("js/services/admin-service-v82.1.7.js", root));
assert.equal(normalizeAdminRole("responsavel"), "owner");
assert.equal(normalizeAdminRole("caregiver"), "cuidador");
assert.equal(normalizeAdminRole("admin"), "admin_familiar");

// Fechamento reproduzido no vídeo: convite, relatório, aceite e contraste final.
assert.match(core, /let exportRoutineInProgress = false/);
assert.match(core, /familyAccessSummaryInviteButton\.addEventListener\("click", openFamilyInviteComposer\)/);
assert.match(core, /familyInviteArea\.classList\.add\("is-open"\)/);
assert.match(core, /familyAccessCard\.hidden = ready/);
assert.match(core, /syncExportRangeVisibility\(\{ resetPresetDates: true \}\)/);
assert.match(core, /const win = window\.open\("", "_blank"\)/);
assert.match(core, /class="cover"/);
assert.match(core, /if \(!opened\) window\.location\.assign\(url\)/);
assert.match(core, /window\.setTimeout\(\(\) => URL\.revokeObjectURL\(url\), 1500\)/);
assert.match(core, /getConsentStorageKey/);
assert.match(core, /const legacyAccount = legacy\.uid \|\| legacy\.email \|\| "device"/);
assert.doesNotMatch(core, /Em beta, a exclusão/);
assert.match(core, /getLatestRoutineLiveState\(currentState, cloudState\)/);
assert.match(core, /stampRoutineLiveState\(state, previousLocalState/);
assert.match(core, /firebaseServices\.runTransaction\(firebaseServices\.db/);
assert.match(core, /saveDayToCloud\(repairDayId, \{ reason: "live-state-repair" \}\)/);
assert.match(html, /class="export-custom-range-field" hidden/);
assert.match(html, /Como podemos ajudar\?/);
assert.doesNotMatch(html, /Relatar problema com diagnóstico/);
assert.match(premiumCss, /\.day-note-modal-header/);
assert.match(premiumCss, /\.record-success-modal/);
assert.match(core, /function openRecordSuccessModal/);
assert.match(core, /Registrar outro cuidado/);
assert.match(premiumCss, /\.client-family-hidden-meta \{ display: none !important; \}/);
assert.match(premiumCss, /\.profile-invite-area\.is-open/);
assert.match(premiumCss, /\.legal-status-grid, \.support-beta-grid/);

// Fluxo solicitado: escolha no menu, formulário focado e retorno explícito.
const recordSheetMarkup = html.slice(html.indexOf('id="recordSheet"'), html.indexOf('id="orbitClusterSheet"'));
assert.doesNotMatch(recordSheetMarkup, /class="record-types"/);
assert.match(recordSheetMarkup, /id="backToActionLauncher"/);
assert.match(recordSheetMarkup, /id="closeSheet"/);
assert.match(recordSheetMarkup, />Registrar</);
assert.match(core, /function returnToActionLauncher/);
assert.match(core, /NinouOpenActionLauncher/);
assert.match(focusedFlowCss, /--n80-sheet-grid-rows: 16px auto minmax\(0, auto\) auto/);
assert.match(focusedFlowCss, /#babyAvatarTestCard \.avatar-option-grid\.icon-grid/);
assert.match(focusedFlowCss, /\.avatar-picker-section::after/);
assert.match(focusedFlowCss, /\.actions-mini-chart span:not\(\.is-empty\)::before/);

// Correções reproduzidas no iPhone 14 Pro Max.
assert.match(html, /maximum-scale=1, user-scalable=no/);
assert.match(focusedFlowCss, /body\.action-launcher-open[\s\S]*position: fixed/);
assert.match(focusedFlowCss, /data-active-screen="profile"[\s\S]*:is\(\.record-sheet, \.orbit-cluster-sheet\)/);
assert.match(focusedFlowCss, /\.orbit-cluster-count[\s\S]*display: grid !important/);
assert.match(focusedFlowCss, /:is\(\.orbit-event > i, \.live-orbit-marker > i, \.orbit-cluster-icon\)[\s\S]*background: transparent !important/);
assert.doesNotMatch(core, /ORBIT_MARKER_RADIUS/);
assert.doesNotMatch(core, /setOrbitConstellationGeometry/);
assert.match(core, /class="orbit-cluster-compact"/);
assert.doesNotMatch(core, /class="orbit-cluster-preview/);
assert.match(core, /containsActiveEvent \? " contains-active" : ""/);
assert.match(core, /function setOrbitClusterCountGeometry/);
assert.match(core, /const badgeAngle = radialAngle \+ \.52/);
assert.match(focusedFlowCss, /#orbitClusterSheet \.cluster-card \.cluster-icon[\s\S]*width: 40px !important/);
assert.match(focusedFlowCss, /\.orbit-event:not\(\.orbit-cluster\) > \.orbit-marker-icon[\s\S]*width: 36px !important/);
assert.match(focusedFlowCss, /Órbita limpa: um marcador por horário; proximidade vira somente contador/);
assert.match(focusedFlowCss, /Acabamento premium compartilhado fora e dentro do painel de detalhes/);
assert.match(focusedFlowCss, /\.orbit-cluster\.contains-active \.orbit-cluster-icon/);
assert.match(focusedFlowCss, /Mais respiro entre o mostrador central e a linha de vida/);
assert.match(focusedFlowCss, /\.state-orbit\.live-timeline-orbit[\s\S]*width: min\(100%, 390px\) !important/);
assert.match(focusedFlowCss, /Novo cuidado: recorta a margem clara gravada nos PNGs, sem criar aro/);
assert.match(focusedFlowCss, /\.action-launcher-grid \.launcher-icon > img[\s\S]*transform: scale\(1\.06\) !important/);
assert.match(actionLauncher, /NinouOpenRecordSheet[\s\S]*if \(opened !== false\) close\(\)/);
assert.doesNotMatch(actionLauncher, /close\(\);\s*requestAnimationFrame\(\(\) => \{\s*if \(typeof window\.NinouOpenRecordSheet/);
assert.match(recordSheet, /export function lockRecordSheetViewport/);
assert.match(recordSheet, /action-launcher-open/);
assert.match(core, /lockRecordSheetViewport\(\)/);
assert.match(core, /growthPanelsRenderSignature/);
assert.match(boot, /const visualAssetsReady = Promise\.allSettled/);
assert.match(boot, /hasReadyLocalProfile/);
assert.match(focusedFlowCss, /#recordSheet \.select-control-wrap[\s\S]*position: relative !important/);
assert.match(focusedFlowCss, /body\.family-daily-surface \.screen\.active[\s\S]*animation: n79-screen-in 260ms ease both !important/);
assert.match(focusedFlowCss, /day-theme\[data-active-screen="profile"\]/);
assert.match(focusedFlowCss, /\.action-launcher-card::\-webkit-scrollbar/);
assert.match(focusedFlowCss, /#recordSheet\[hidden\][\s\S]*display: none !important/);
assert.match(focusedFlowCss, /#recordSheet \.round-action[\s\S]*position: relative !important/);
assert.match(focusedFlowCss, /screen\[data-screen="profile"\]\.active > :not\(\[hidden\]\)[\s\S]*animation: n79-screen-in/);
assert.match(ux, /control\.matches\("\.orbit-event,\.live-orbit-marker,\.orbit-cluster"\)/);
assert.match(core, /const ORBIT_CLUSTER_WINDOW_MINUTES = 75/);
assert.match(core, /orbit-duration-halo/);
assert.doesNotMatch(core, /orbit-cluster-peek/);
assert.match(core, /orbitClusterSheet\.classList\.add\("is-entering"\)/);
assert.match(core, /orbitCompletedJourneyKeys/);
assert.match(core, /orbit-duration-start-label/);
assert.match(core, /primary-journey/);
assert.match(core, /--cluster-delay:/);
assert.match(premiumCss, /body\.day-theme \.orbit-gradient-stop-a/);
assert.match(premiumCss, /\.orbit-duration-journey\.active \.orbit-duration-glint/);
assert.match(html, /id="orbitClusterHero" class="orbit-cluster-hero"/);
assert.doesNotMatch(core, /class="orbit-cluster-constellation"/);
assert.match(core, /orbit-cluster-compact/);
assert.match(core, /sourceMarker: marker/);
assert.match(core, /animateOrbitMarkerToDetails/);
assert.match(focusedFlowCss, /\.orbit-cluster-constellation/);
assert.match(focusedFlowCss, /@keyframes n82-orbit-detail-in/);
assert.match(focusedFlowCss, /\.orbit-shared-flight/);
assert.doesNotMatch(focusedFlowCss, /transform: scale\(\.985\) !important/);
assert.match(premiumCss, /button:not\(\.orbit-event\):not\(\.live-orbit-marker\):not\(\.orbit-cluster\):active/);
assert.match(focusedFlowCss, /button\.orbit-event[\s\S]*box-shadow: none !important[\s\S]*transform: translate\(-50%, -50%\) !important/);
assert.match(core, /const APP_LAUNCH_SCREEN = "today"/);
assert.match(core, /showScreen\(isGlobalAppAdmin\(user\) \? "profile" : APP_LAUNCH_SCREEN\)/);
assert.match(core, /showScreen\(APP_LAUNCH_SCREEN\);\s*renderAll\(\);/);
assert.match(focusedFlowCss, /@supports \(-webkit-touch-callout: none\)/);
assert.match(focusedFlowCss, /body\.day-theme \.orbit-sky::before[\s\S]*animation-duration:\s*7\.5s/);
assert.match(focusedFlowCss, /body:not\(\.day-theme\) \.orbit-sky::after[\s\S]*animation-duration:\s*3\.8s/);

// Entrada deslogada própria: sem herdar o shell, menu inferior ou botão de registro.
assert.match(html, /id="guestEntryPortal" class="guest-entry-portal"/);
assert.match(html, /id="guestPortalAuthPanel"/);
assert.match(html, /id="guestPortalCreateButton"/);
assert.match(html, /id="guestPortalLoginButton"/);
assert.match(html, /id="guestPortalInviteButton"/);
assert.match(focusedFlowCss, /body\[data-profile-access-state="guest"\] > main\.phone-shell[\s\S]*display: none !important/);
assert.match(focusedFlowCss, /body\[data-profile-access-state="guest"\] > \.guest-entry-portal/);
assert.match(focusedFlowCss, /body\[data-profile-access-state="guest"\]\.day-theme/);
assert.match(focusedFlowCss, /@media \(prefers-reduced-motion: reduce\)[\s\S]*\.guest-entry-orbit/);
assert.match(core, /function openGuestPortalAuth/);
assert.match(core, /function submitGuestPortalAuth/);
assert.match(core, /pendingInviteCode = code/);
assert.match(core, /guestEntryPortal\.hidden = !showGuestPortal/);
assert.match(html, /Ativar meu acesso/);
assert.match(html, /id="subscriptionAccessPortal"/);
assert.match(html, /id="guestPortalForgotPasswordButton"/);
assert.match(html, /href="\/privacidade.html"/);
assert.match(core, /COMMERCIAL_ACCESS_MODE = "invite_only"/);
assert.match(core, /async function verifyCurrentFamilySubscription/);
assert.match(core, /sendPasswordResetEmail/);
assert.match(firebaseService, /sendPasswordResetEmail: authModule.sendPasswordResetEmail/);
assert.match(customerReadyCss, /subscription-access-portal/);
assert.match(adminService, /Informe o e-mail do responsável que adquiriu o acesso/);
assert.doesNotMatch(html, /Beta familiar/);


// Validade comercial: regras puras e previsíveis para clientes adquirentes.
const commercialNow = Date.parse("2026-07-19T12:00:00.000Z");
assert.equal(normalizeCommercialSubscription({}, commercialNow).allowed, true, "Famílias legadas sem metadados continuam acessíveis.");
assert.equal(normalizeCommercialSubscription({ subscriptionPlan: "premium", premiumUntilClient: "2026-08-19T12:00:00.000Z" }, commercialNow).allowed, true);
const expiredCommercialAccess = normalizeCommercialSubscription({ subscriptionPlan: "premium", premiumUntilClient: "2026-07-18T12:00:00.000Z" }, commercialNow);
assert.equal(expiredCommercialAccess.allowed, false);
assert.equal(expiredCommercialAccess.reason, "expired");
const suspendedCommercialAccess = normalizeCommercialSubscription({ status: "suspended", subscriptionPlan: "premium" }, commercialNow);
assert.equal(suspendedCommercialAccess.allowed, false);
assert.equal(suspendedCommercialAccess.reason, "family_suspended");
assert.match(core, /Informe o código de ativação enviado após a aquisição do Ninou/);
assert.match(core, /commercial-access-service\.js/);
assert.match(sw, /commercial-access-service\.js/);
assert.match(build, /commercial-access-service\.js/);

assert.doesNotMatch(html, /Criar minha família/);
assert.match(core, /A criação de famílias é feita pelo atendimento após a aquisição/);
assert.match(core, /COMMERCIAL_ACCESS_MODE === "invite_only" && !isGlobalAppAdmin\(\)/);

assert.match(sw, /standalonePages = new Set\(\["\/privacidade\.html", "\/termos\.html", "\/suporte\.html"\]\)/);
assert.match(sw, /const cacheKey = isStandalonePage \? request : "\/index\.html"/);
