import { readFile, stat } from "node:fs/promises";
import assert from "node:assert/strict";

const root = new URL("../", import.meta.url);
const [html, boot, core, ux, stability, premiumCss, visualGuard, sw, build, vercel] = await Promise.all([
  readFile(new URL("index.html", root), "utf8"),
  readFile(new URL("js/boot-v79.1.0.mjs", root), "utf8"),
  readFile(new URL("js/ninou-core-v79.1.0.mjs", root), "utf8"),
  readFile(new URL("js/ninou-ux-v79.1.0.mjs", root), "utf8"),
  readFile(new URL("js/ninou-stability-v79.1.0.mjs", root), "utf8"),
  readFile(new URL("styles/premium-v79.1.css", root), "utf8"),
  readFile(new URL("js/runtime/visual-guard-v79.1.0.mjs", root), "utf8"),
  readFile(new URL("sw.js", root), "utf8"),
  readFile(new URL("scripts/build-production.mjs", root), "utf8"),
  readFile(new URL("vercel.json", root), "utf8"),
]);

const headEnd = html.indexOf("</head>");
const bootBarrier = html.indexOf('classList.add("ninou-booting", "ninou-v791")');
assert.ok(bootBarrier > 0 && bootBarrier < headEnd, "A barreira de boot deve começar dentro do <head>.");
assert.match(html, /<body data-profile-access-state="booting">/);
assert.match(html, /id="quickActions" class="quick-actions"/);
assert.match(html, /class="bottom-bar"/);
assert.match(html, /styles\/legacy\.css\?v=79\.1\.0/);
assert.match(html, /styles\/premium-v79\.1\.css\?v=79\.1\.0/);
assert.doesNotMatch(html, /id="diaryChipsMoreButton"/);
assert.doesNotMatch(html, /styles\/(tokens|foundation|home|components|motion|responsive|v78\.4-critical)\.css/);
assert.match(html, /boot-v79\.1\.0\.mjs\?v=79\.1\.0/);
assert.match(html, /__NINOU_BOOT_WATCHDOG__/);
assert.match(html, /history\.replaceState/);
assert.doesNotMatch(html, /return new Promise\(\(\) => \{\}\)/);

assert.match(boot, /const NINOU_VERSION = "79\.1\.0"/);
assert.match(boot, /const MIN_SPLASH_MS = 1500;/);
assert.match(boot, /window\.NinouLoading/);
assert.match(boot, /hasResolvedAccessState/);
assert.match(boot, /waitForStableFirstPaint/);
assert.match(boot, /visual-guard-v79\.1\.0/);

assert.match(core, /const NINOU_RUNTIME_VERSION = "79\.1\.0"/);
assert.match(core, /const NINOU_FAMILY_SCOPE_VERSION = "79\.1\.0-premium-consolidated"/);
assert.match(core, /const chartKey = String\(container\.id/);
assert.match(core, /weightPremiumFill-\$\{chartKey\}/);
assert.doesNotMatch(core, /weightGlowReadable/);
assert.doesNotMatch(core, /filter="url\(#weightGlowReadable\)"/);

assert.match(ux, /const UX_VERSION = "79\.1\.0"/);
assert.match(stability, /const STABILITY_VERSION = "79\.1\.0"/);

assert.match(premiumCss, /autoridade visual revisada/);
assert.match(premiumCss, /body\.family-daily-surface:not\(\[data-active-screen="profile"\]\)/);
assert.match(premiumCss, /body\.family-daily-surface\[data-active-screen="profile"\] #clientFamilyMembersList/);
assert.match(premiumCss, /#quickActions\.quick-actions/);
assert.match(premiumCss, /flex-direction: column !important/);
assert.match(premiumCss, /\.chips \{/);
assert.match(premiumCss, /flex-wrap: wrap !important/);
assert.match(premiumCss, /#diaryChipsMoreButton/);
assert.match(premiumCss, /\.timeline \.event-meta-primary/);
assert.match(premiumCss, /\.timeline \.event-author-line/);
assert.match(premiumCss, /\.weight-axis-label/);
assert.match(premiumCss, /paint-order: normal !important/);
assert.match(premiumCss, /\.weight-main-path/);
assert.match(premiumCss, /filter: none !important/);
assert.match(premiumCss, /\.client-family-member-avatar/);
assert.match(premiumCss, /max-width: 48px !important/);
assert.match(premiumCss, /\.record-types/);
assert.match(premiumCss, /body\.record-sheet-open \.bottom-bar/);
assert.match(premiumCss, /\.quick-observations-panel/);
assert.match(premiumCss, /\.premium-new-episode-button/);
assert.match(premiumCss, /prefers-reduced-motion/);

assert.match(visualGuard, /function verifyOrbit/);
assert.match(visualGuard, /function verifyQuickActions/);
assert.match(visualGuard, /function verifyMemberAvatars/);
assert.match(visualGuard, /function verifyRecordSheet/);
assert.doesNotMatch(visualGuard, /style\.setProperty/);

assert.match(sw, /ninou-v79-1-0-premium-consolidated/);
assert.match(sw, /const APP_VERSION = "79\.1\.0"/);
assert.match(sw, /const STYLE_MODULES = \["legacy", "premium-v79\.1"\]/);
assert.match(sw, /visual-guard-v79\.1\.0/);
assert.match(build, /"styles"/);
assert.doesNotMatch(build, /"css"/);
assert.match(vercel, /"buildCommand": "npm run build"/);
assert.match(vercel, /"outputDirectory": "dist"/);

const legacySize = (await stat(new URL("styles/legacy.css", root))).size;
const premiumSize = (await stat(new URL("styles/premium-v79.1.css", root))).size;
assert.ok(legacySize < 800 * 1024, "O CSS legado deve permanecer abaixo de 800 KB.");
assert.ok(premiumSize > 20 * 1024 && premiumSize < 110 * 1024, "A autoridade premium deve ser substancial sem virar outro monólito.");

console.log("Regressões v79.1.0 validadas: atalhos centralizados, gráfico legível, linha de peso independente, Diário contrastado, Perfil restaurado e filtros sem botão auxiliar.");
