import { readFile, stat } from "node:fs/promises";
import assert from "node:assert/strict";

const root = new URL("../", import.meta.url);
const [html, boot, core, ux, stability, premiumCss, visualGuard, sw, build, vercel] = await Promise.all([
  readFile(new URL("index.html", root), "utf8"),
  readFile(new URL("js/boot-v79.0.0.mjs", root), "utf8"),
  readFile(new URL("js/ninou-core-v79.0.0.mjs", root), "utf8"),
  readFile(new URL("js/ninou-ux-v79.0.0.mjs", root), "utf8"),
  readFile(new URL("js/ninou-stability-v79.0.0.mjs", root), "utf8"),
  readFile(new URL("styles/premium-v79.css", root), "utf8"),
  readFile(new URL("js/runtime/visual-guard-v79.0.0.mjs", root), "utf8"),
  readFile(new URL("sw.js", root), "utf8"),
  readFile(new URL("scripts/build-production.mjs", root), "utf8"),
  readFile(new URL("vercel.json", root), "utf8"),
]);

const headEnd = html.indexOf("</head>");
const bootBarrier = html.indexOf('classList.add("ninou-booting", "ninou-v790")');
assert.ok(bootBarrier > 0 && bootBarrier < headEnd, "A barreira de boot deve começar dentro do <head>.");
assert.match(html, /<body data-profile-access-state="booting">/);
assert.match(html, /id="quickActions" class="quick-actions"/);
assert.match(html, /class="bottom-bar"/);
assert.match(html, /styles\/legacy\.css\?v=79\.0\.0/);
assert.match(html, /styles\/premium-v79\.css\?v=79\.0\.0/);
assert.doesNotMatch(html, /styles\/(tokens|foundation|home|components|motion|responsive|v78\.4-critical)\.css/);
assert.match(html, /boot-v79\.0\.0\.mjs\?v=79\.0\.0/);
assert.match(html, /__NINOU_BOOT_WATCHDOG__/);
assert.match(html, /history\.replaceState/);
assert.doesNotMatch(html, /return new Promise\(\(\) => \{\}\)/);

assert.match(boot, /const NINOU_VERSION = "79\.0\.0"/);
assert.match(boot, /const MIN_SPLASH_MS = 1500;/);
assert.match(boot, /window\.NinouLoading/);
assert.match(boot, /hasResolvedAccessState/);
assert.match(boot, /waitForStableFirstPaint/);
assert.match(boot, /visual-guard-v79\.0\.0/);

assert.match(core, /const NINOU_RUNTIME_VERSION = "79\.0\.0"/);
assert.match(core, /const NINOU_FAMILY_SCOPE_VERSION = "79\.0\.0-premium-consolidated"/);
assert.match(core, /family-daily-surface/);

assert.match(ux, /const UX_VERSION = "79\.0\.0"/);
assert.match(stability, /const STABILITY_VERSION = "79\.0\.0"/);

assert.match(premiumCss, /autoridade visual única/);
assert.match(premiumCss, /html\.ninou-v790 \[hidden\]/);
assert.match(premiumCss, /#quickActions\.quick-actions/);
assert.match(premiumCss, /grid-template-columns: repeat\(2, minmax\(0,1fr\)\)/);
assert.match(premiumCss, /\.client-family-member-avatar/);
assert.match(premiumCss, /max-width: 48px !important/);
assert.match(premiumCss, /\.record-types/);
assert.match(premiumCss, /grid-template-columns: repeat\(4, minmax\(0,1fr\)\)/);
assert.match(premiumCss, /body\.record-sheet-open \.bottom-bar/);
assert.match(premiumCss, /\.quick-observations-panel/);
assert.match(premiumCss, /\.premium-new-episode-button/);
assert.match(premiumCss, /\.weight-sparkline svg/);
assert.match(premiumCss, /prefers-reduced-motion/);

assert.match(visualGuard, /function verifyOrbit/);
assert.match(visualGuard, /function verifyQuickActions/);
assert.match(visualGuard, /function verifyMemberAvatars/);
assert.match(visualGuard, /function verifyRecordSheet/);
assert.doesNotMatch(visualGuard, /style\.setProperty/);

assert.match(sw, /ninou-v79-0-0-premium-consolidated/);
assert.match(sw, /const APP_VERSION = "79\.0\.0"/);
assert.match(sw, /const STYLE_MODULES = \["legacy", "premium-v79"\]/);
assert.match(sw, /visual-guard-v79\.0\.0/);
assert.match(build, /"styles"/);
assert.doesNotMatch(build, /"css"/);
assert.match(vercel, /"buildCommand": "npm run build"/);
assert.match(vercel, /"outputDirectory": "dist"/);

const legacySize = (await stat(new URL("styles/legacy.css", root))).size;
const premiumSize = (await stat(new URL("styles/premium-v79.css", root))).size;
assert.ok(legacySize < 800 * 1024, "O CSS legado deve permanecer abaixo de 800 KB.");
assert.ok(premiumSize > 20 * 1024 && premiumSize < 100 * 1024, "A autoridade premium deve ser substancial sem virar outro monólito.");

console.log("Regressões v79.0.0 validadas: loading, autoridade CSS única, Home, Perfil, Diário, folha de registro, navegação e deploy.");
