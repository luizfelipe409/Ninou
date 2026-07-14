import { readFile, stat } from "node:fs/promises";
import assert from "node:assert/strict";

const root = new URL("../", import.meta.url);
const [html, boot, core, ux, stability, premiumCss, visualGuard, sw, build, vercel, daySky, nightSky] = await Promise.all([
  readFile(new URL("index.html", root), "utf8"),
  readFile(new URL("js/boot-v82.0.0.mjs", root), "utf8"),
  readFile(new URL("js/ninou-core-v82.0.0.mjs", root), "utf8"),
  readFile(new URL("js/ninou-ux-v82.0.0.mjs", root), "utf8"),
  readFile(new URL("js/ninou-stability-v82.0.0.mjs", root), "utf8"),
  readFile(new URL("styles/premium-v82.0.0.css", root), "utf8"),
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
assert.match(html, /styles\/legacy\.css\?v=82\.0\.1/);
assert.match(html, /styles\/premium-v82\.0\.0\.css\?v=82\.0\.1/);
assert.doesNotMatch(html, /styles\/(tokens|foundation|home|components|motion|responsive|v78\.4-critical)\.css/);
assert.match(html, /boot-v82\.0\.0\.mjs\?v=82\.0\.1/);
assert.match(html, /__NINOU_BOOT_WATCHDOG__/);
assert.match(html, /history\.replaceState/);

assert.match(boot, /const NINOU_VERSION = "82\.0\.1"/);
assert.match(boot, /const MIN_SPLASH_MS = 1500;/);
assert.match(boot, /visual-guard-v82\.0\.0/);
assert.match(core, /const NINOU_RUNTIME_VERSION = "82\.0\.1"/);
assert.match(core, /const NINOU_FAMILY_SCOPE_VERSION = "82\.0\.1-premium-consolidated"/);
assert.match(ux, /const UX_VERSION = "82\.0\.1"/);
assert.match(stability, /const STABILITY_VERSION = "82\.0\.1"/);

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

assert.match(core, /return -90 \+ .*ORBIT_DAY_MINUTES.*\* 360/s);
assert.match(core, /--orbit-celestial-x/);
assert.match(core, /--orbit-celestial-y/);
assert.match(html, /class="orbit-sky"/);
assert.match(visualGuard, /function verifyOrbit/);
assert.doesNotMatch(visualGuard, /style\.setProperty/);

assert.match(sw, /ninou-v82-0-1-icones-circulares/);
assert.match(sw, /const APP_VERSION = "82\.0\.1"/);
assert.match(sw, /const STYLE_MODULES = \["legacy", "premium-v82\.0\.0"\]/);
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

console.log("Regressões v82.0.1 validadas: céu claro solar, noite cósmica, órbita local, menu + e estabilidade preservados.");

// v82.0.0: ajustes solicitados após validação visual.
assert.doesNotMatch(html, /class="orbit-sun"/);
assert.match(premiumCss, /#orbitClusterSheet\[hidden\]/);
assert.match(premiumCss, /body\[data-active-screen="profile"\] \.fab-real-plus/);
assert.match(premiumCss, /--n79-nav-height: 70px/);
assert.match(premiumCss, /Marcadores reais com arte legível no céu claro/);

// v82.0.1: mesma arte circular em todas as superfícies, X real e CTA centralizado.
const iconAuthorityStart = premiumCss.indexOf("v82.0.1 — autoridade final dos ícones de cuidado");
assert.ok(iconAuthorityStart > premiumCss.indexOf("v82.0.0 — unificação dos ícones e botões da Home"), "A autoridade v82.0.1 deve encerrar a cascata premium.");
const iconAuthority = premiumCss.slice(iconAuthorityStart);
assert.match(iconAuthority, /body \.care-icon[\s\S]*overflow: hidden !important;[\s\S]*border-radius: 50% !important;/);
assert.match(iconAuthority, /#recordSheet \.record-types \.type-icon\.care-icon[\s\S]*border-radius: 50% !important;/);
assert.match(iconAuthority, /#closeSheet[\s\S]*position: relative !important;/);
assert.match(iconAuthority, /\.close-icon-svg[\s\S]*stroke: currentColor !important;/);
assert.match(iconAuthority, /#wakeAction\.primary-action[\s\S]*display: flex !important;[\s\S]*justify-content: center !important;/);
assert.match(iconAuthority, /body\.day-theme :is\(\.orbit-event, \.live-orbit-marker\)[\s\S]*border-radius: 50% !important;[\s\S]*box-shadow: none !important;/);
assert.match(premiumCss, /grid-template-columns: repeat\(6, minmax\(0, 1fr\)\);/);
assert.match(premiumCss, /\.bottom-nav[\s\S]*grid-column: 1 \/ span 5;/);
assert.match(premiumCss, /\.fab-real-plus[\s\S]*position: static !important;[\s\S]*grid-column: 6;[\s\S]*width: 100% !important;/);
assert.doesNotMatch(premiumCss, /padding-right: 58px !important;/);
assert.equal((html.match(/class="close-icon-svg"/g) || []).length, 3, "Os três painéis devem usar o mesmo X em SVG.");
assert.ok((html.match(/care-icon/g) || []).length >= 20, "Launcher, Home e Novo registro devem compartilhar care-icon.");
assert.match(core, /<i class="care-icon">\$\{config\.icon\}<\/i>/);
assert.match(core, /orbit-cluster-icon care-icon/);

for (const icon of ["acordou", "amamentacao", "despertar-noturno", "dormir", "fralda", "mamadeira", "soneca"]) {
  const info = await stat(new URL(`icons/actions/${icon}.png`, root));
  assert.ok(info.size > 10_000, `O ícone ${icon} deve existir e conter a arte completa.`);
}
