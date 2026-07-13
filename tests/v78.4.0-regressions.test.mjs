import { readFile, stat } from "node:fs/promises";
import assert from "node:assert/strict";

const root = new URL("../", import.meta.url);
const [html, boot, core, stability, homeCss, foundationCss, componentsCss, motionCss, criticalCss, visualGuard, sw, build] = await Promise.all([
  readFile(new URL("index.html", root), "utf8"),
  readFile(new URL("js/boot-v78.4.0.mjs", root), "utf8"),
  readFile(new URL("js/ninou-core-v78.4.0.mjs", root), "utf8"),
  readFile(new URL("js/ninou-stability-v78.4.0.mjs", root), "utf8"),
  readFile(new URL("styles/home.css", root), "utf8"),
  readFile(new URL("styles/foundation.css", root), "utf8"),
  readFile(new URL("styles/components.css", root), "utf8"),
  readFile(new URL("styles/motion.css", root), "utf8"),
  readFile(new URL("styles/v78.4-critical.css", root), "utf8"),
  readFile(new URL("js/runtime/visual-guard-v78.4.0.mjs", root), "utf8"),
  readFile(new URL("sw.js", root), "utf8"),
  readFile(new URL("scripts/build-production.mjs", root), "utf8"),
]);

const headEnd = html.indexOf("</head>");
const bootBarrier = html.indexOf('classList.add("ninou-booting", "ninou-v784")');
assert.ok(bootBarrier > 0 && bootBarrier < headEnd, "A barreira de boot deve começar dentro do <head>.");
assert.match(html, /<body data-profile-access-state="booting">/);
assert.match(html, /id="quickActions" class="quick-actions"/);
assert.match(html, /id="bottomBar" class="bottom-bar"/);
for (const file of ["legacy", "tokens", "foundation", "home", "components", "motion", "responsive", "v78.4-critical"]) {
  assert.ok(html.includes(`styles/${file}.css?v=78.4.0`), `CSS ${file} deve estar ligado à v78.4.0.`);
}
assert.match(html, /boot-v78\.4\.0\.mjs\?v=78\.4\.0/);
assert.match(html, /ninou:runtime-migrated/);
assert.match(html, /__NINOU_EARLY_SHOW_LOADING__/);
assert.doesNotMatch(html, /78\.3\.0|ninou-v783/);

assert.match(boot, /const MIN_SPLASH_MS = 1500;/);
assert.match(boot, /window\.NinouLoading/);
assert.match(boot, /ninou:resume/);
assert.match(boot, /ninou:auth-ready/);
assert.match(boot, /await Promise\.all\(links\.map/);
assert.doesNotMatch(boot, /Promise\.allSettled\(links\.map/);
assert.match(boot, /hasResolvedAccessState/);

assert.match(core, /let authStateResolved = false;/);
assert.match(core, /if \(!authStateResolved\) return "booting";/);
assert.match(core, /auth-refreshing-stable/);
assert.match(core, /sameOwner/);
assert.match(core, /retomada sem tela fantasma/);
assert.match(core, /if \(!authStateResolved \|\| authAccessLoading \|\| isLoggedIn\(\) \|\| cloudUser\) return;/);
assert.match(core, /window\.NinouLoading\?\.show/);
assert.match(core, /window\.NinouLoading\?\.hide/);

assert.match(stability, /dispatchResume/);
assert.match(stability, /hiddenAt/);
assert.match(stability, /Date\.now\(\) - hiddenAt > 450/);

assert.match(homeCss, /#quickActions\.quick-actions/);
assert.match(homeCss, /grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/);
assert.match(homeCss, /position: static !important/);
assert.match(homeCss, /grid-template-rows: 58px minmax\(30px, auto\)/);
assert.match(homeCss, /orbit-center-safe/);

assert.match(foundationCss, /calc\(176px \+ env\(safe-area-inset-bottom\)\)/);
assert.match(foundationCss, /Segurança visual durante restauração de sessão/);
assert.match(foundationCss, /orbit-time-anchor-midnight/);
assert.match(foundationCss, /auth-refreshing-stable/);

assert.match(componentsCss, /#recordSheet \.record-types/);
assert.match(componentsCss, /calc\(\(100% - 24px\) \/ 4\)/);
assert.match(componentsCss, /scroll-snap-type: x proximity/);
assert.match(componentsCss, /padding-bottom: 88px/);
assert.match(componentsCss, /pointer-events: none/);
assert.match(motionCss, /prefers-reduced-motion/);

assert.match(sw, /ninou-v78-4-0-premium-consolidated/);
assert.match(sw, /const APP_VERSION = "78\.4\.0"/);
assert.match(sw, /"v78\.4-critical"/);
assert.match(sw, /visual-guard-v78\.4\.0/);
assert.match(criticalCss, /Uma única composição para os quatro atalhos/);
assert.match(criticalCss, /orbit-center-safe/);
assert.match(visualGuard, /verifyGeometry/);
assert.match(visualGuard, /iconsInside/);
assert.match(build, /"styles"/);

const legacySize = (await stat(new URL("styles/legacy.css", root))).size;
assert.ok(legacySize < 887 * 1024, "O CSS legado deve permanecer menor que o monólito anterior.");

console.log("Regressões v78.4.0 validadas: boot, retomada, sessão, órbita, atalhos, navegação e formulário.");
