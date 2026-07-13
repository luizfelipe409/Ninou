import { readFile, stat } from "node:fs/promises";
import assert from "node:assert/strict";

const root = new URL("../", import.meta.url);
const [html, boot, homeCss, foundationCss, motionCss, sw, build] = await Promise.all([
  readFile(new URL("index.html", root), "utf8"),
  readFile(new URL("js/boot-v78.2.0.mjs", root), "utf8"),
  readFile(new URL("styles/home.css", root), "utf8"),
  readFile(new URL("styles/foundation.css", root), "utf8"),
  readFile(new URL("styles/motion.css", root), "utf8"),
  readFile(new URL("sw.js", root), "utf8"),
  readFile(new URL("scripts/build-production.mjs", root), "utf8"),
]);

const headEnd = html.indexOf("</head>");
const bootBarrier = html.indexOf('classList.add("ninou-booting", "ninou-v782")');
assert.ok(bootBarrier > 0 && bootBarrier < headEnd, "A barreira e o namespace visual precisam iniciar no <head>.");
for (const file of ["legacy", "tokens", "foundation", "home", "components", "motion", "responsive"]) {
  assert.match(html, new RegExp(`styles/${file}\\.css\\?v=78\\.2\\.0`));
}
assert.match(html, /boot-v78\.2\.0\.mjs\?v=78\.2\.0/);
assert.doesNotMatch(html, /styles-fixes|78\.1\.1/);

assert.match(boot, /const MIN_SPLASH_MS = 1250;/);
assert.match(boot, /waitForStyleSheets/);
assert.match(boot, /preloadCriticalImages/);
assert.match(boot, /hasResolvedAccessState/);
assert.match(boot, /ninou:boot-revealed/);
assert.doesNotMatch(boot, /loadPatchStylesheet|PATCH_STYLESHEET/);

assert.match(homeCss, /grid-template-columns: repeat\(2,minmax\(0,1fr\)\)/);
assert.match(homeCss, /grid-auto-rows: 118px/);
assert.match(homeCss, /height: 118px !important/);
assert.match(homeCss, /orbit-center-safe/);
assert.match(homeCss, /today-overview-grid/);
assert.match(foundationCss, /backdrop-filter: blur\(20px\)/);
assert.match(motionCss, /ninou-ripple/);
assert.match(motionCss, /prefers-reduced-motion/);

assert.match(sw, /ninou-v78-2-0-premium-consolidated/);
assert.match(sw, /const STYLE_MODULES = \["legacy", "tokens", "foundation", "home", "components", "motion", "responsive"\]/);
assert.match(sw, /STYLE_MODULES\.map\(\(name\) => `\/styles\/\$\{name\}\.css/);
assert.match(build, /"styles"/);

const legacySize = (await stat(new URL("styles/legacy.css", root))).size;
const oldApproximateSize = 887 * 1024;
assert.ok(legacySize < oldApproximateSize, "O CSS legado precisa ficar menor que o monólito anterior.");

console.log("Regressões v78.2.0 validadas: loading, Home premium, microinterações e CSS modular.");
