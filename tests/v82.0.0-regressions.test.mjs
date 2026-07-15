import { readFile, stat } from "node:fs/promises";
import assert from "node:assert/strict";

const root = new URL("../", import.meta.url);
const [html, boot, core, ux, stability, premiumCss, focusedFlowCss, visualGuard, sw, build, vercel, daySky, nightSky] = await Promise.all([
  readFile(new URL("index.html", root), "utf8"),
  readFile(new URL("js/boot-v82.0.0.mjs", root), "utf8"),
  readFile(new URL("js/ninou-core-v82.0.0.mjs", root), "utf8"),
  readFile(new URL("js/ninou-ux-v82.0.0.mjs", root), "utf8"),
  readFile(new URL("js/ninou-stability-v82.0.0.mjs", root), "utf8"),
  readFile(new URL("styles/premium-v82.0.0.css", root), "utf8"),
  readFile(new URL("styles/focused-flow-v82.0.0.css", root), "utf8"),
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
assert.match(html, /id="quickActions" class="quick-actions"/);
assert.match(html, /class="bottom-bar"/);
assert.match(html, /styles\/legacy\.css\?v=82\.0\.0/);
assert.match(html, /styles\/premium-v82\.0\.0\.css\?v=82\.0\.0/);
assert.match(html, /styles\/focused-flow-v82\.0\.0\.css\?v=82\.0\.0/);
assert.doesNotMatch(html, /styles\/(tokens|foundation|home|components|motion|responsive|v78\.4-critical)\.css/);
assert.match(html, /boot-v82\.0\.0\.mjs\?v=82\.0\.0/);
assert.match(html, /__NINOU_BOOT_WATCHDOG__/);
assert.match(html, /history\.replaceState/);

assert.match(boot, /const NINOU_VERSION = "82\.0\.0"/);
assert.match(boot, /const MIN_SPLASH_MS = 1500;/);
assert.match(boot, /visual-guard-v82\.0\.0/);
assert.match(core, /const NINOU_RUNTIME_VERSION = "82\.0\.0"/);
assert.match(core, /const NINOU_FAMILY_SCOPE_VERSION = "82\.0\.0-premium-consolidated"/);
assert.match(ux, /const UX_VERSION = "82\.0\.0"/);
assert.match(stability, /const STABILITY_VERSION = "82\.0\.0"/);

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
assert.match(premiumCss, /@keyframes n82-marker-arrival/);
assert.match(premiumCss, /body\[data-active-screen="profile"\] \.app-header/);
assert.match(premiumCss, /:is\(#closeSheet, #closeOrbitCluster\)\.icon-button-close/);
assert.match(premiumCss, /@media \(max-width: 430px\)[\s\S]*\.record-types/);
assert.match(premiumCss, /\.chips button:nth-child\(n\+4\)/);
assert.match(premiumCss, /\.action-launcher-grid > button:is\(:active,:hover\)/);

assert.match(core, /return -90 \+ .*ORBIT_DAY_MINUTES.*\* 360/s);
assert.match(core, /function getOrbitMarkerTimestamp[\s\S]*isSleepEvent\(event\)[\s\S]*getOrbitEventEnd\(event\)/);
assert.match(core, /position: eventPosition\(getOrbitMarkerTimestamp\(event, orbitStart, orbitEnd\)\)/);
assert.match(core, /terminou às/);
assert.match(core, /--orbit-celestial-x/);
assert.match(core, /--orbit-celestial-y/);
assert.match(html, /class="orbit-sky"/);
assert.match(visualGuard, /function verifyOrbit/);
assert.doesNotMatch(visualGuard, /style\.setProperty/);

assert.match(sw, /ninou-v82-0-0-record-flow-avatar-chart/);
assert.match(sw, /const APP_VERSION = "82\.0\.0"/);
assert.match(sw, /const STYLE_MODULES = \["legacy", "premium-v82\.0\.0", "focused-flow-v82\.0\.0"\]/);
assert.match(sw, /day-sky\.svg/);
assert.match(sw, /night-sky\.svg/);
assert.match(build, /"assets"/);
assert.match(vercel, /"buildCommand": "npm run build"/);
assert.match(vercel, /"outputDirectory": "dist"/);

assert.match(daySky, /<linearGradient id="sky"/);
assert.match(daySky, /<radialGradient id="sunGlow"/);
assert.match(daySky, /<ellipse/);
assert.match(nightSky, /<linearGradient id="night"/);
assert.match(nightSky, /<radialGradient id="nebulaA"/);
assert.match(nightSky, /mask id="moonCut"/);

const legacySize = (await stat(new URL("styles/legacy.css", root))).size;
const premiumSize = (await stat(new URL("styles/premium-v82.0.0.css", root))).size;
assert.ok(legacySize < 800 * 1024, "O CSS legado deve permanecer abaixo de 800 KB.");
assert.ok(premiumSize > 20 * 1024 && premiumSize < 170 * 1024, "A autoridade premium deve ser substancial sem virar outro monólito.");

console.log("Regressões v82.0.0 validadas: céu claro solar, noite cósmica, órbita local, menu + e estabilidade preservados.");

// v82.0.0: ajustes solicitados após validação visual.
assert.doesNotMatch(html, /class="orbit-sun"/);
assert.match(premiumCss, /#orbitClusterSheet\[hidden\]/);
assert.match(premiumCss, /body\[data-active-screen="profile"\] \.fab-real-plus/);
assert.match(premiumCss, /--n79-nav-height: 70px/);
assert.match(premiumCss, /Marcadores reais com arte legível no céu claro/);

// Fluxo solicitado: escolha no menu, formulário focado e retorno explícito.
const recordSheetMarkup = html.slice(html.indexOf('id="recordSheet"'), html.indexOf('id="orbitClusterSheet"'));
assert.doesNotMatch(recordSheetMarkup, /class="record-types"/);
assert.match(recordSheetMarkup, /id="backToActionLauncher"/);
assert.match(recordSheetMarkup, /id="closeSheet"/);
assert.match(recordSheetMarkup, />Registrar</);
assert.match(core, /function returnToActionLauncher/);
assert.match(core, /NinouOpenActionLauncher/);
assert.match(focusedFlowCss, /--n80-sheet-grid-rows: 16px auto minmax\(0, 1fr\) auto/);
assert.match(focusedFlowCss, /#babyAvatarTestCard \.avatar-option-grid\.icon-grid/);
assert.match(focusedFlowCss, /\.avatar-picker-section::after/);
assert.match(focusedFlowCss, /\.actions-mini-chart span:not\(\.is-empty\)::before/);
