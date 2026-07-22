import { readFile, readdir, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, relative } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const packageJson = JSON.parse(await readFile(join(root, "package.json"), "utf8"));
const version = packageJson.version;
const failures = [];

const required = [
  "index.html", "sw.js", "manifest.webmanifest", "firestore.rules", "vercel.json",
  "privacidade.html", "termos.html", "suporte.html",
  "styles/app.css", "styles/admin.css",
  "js/bootstrap.mjs", "js/app-core.mjs", "js/admin-runtime.mjs", "js/services/admin-service.js",
  "js/ui/app-shell.mjs", "js/ui/ux-runtime.mjs", "js/ui/consistency-runtime.mjs",
  "js/runtime/architecture.mjs", "js/runtime/stability.mjs", "js/runtime/diagnostics.mjs", "js/runtime/visual-guard.mjs",
  "assets/clock-themes/day-sky.svg", "assets/clock-themes/night-sky.svg",
  "mobile/package.json", "mobile/app.json", "mobile/src/app/_layout.tsx",
];
for (const file of required) if (!existsSync(join(root, file))) failures.push(`Arquivo obrigatório ausente: ${file}`);

for (const forbidden of [".env.local", ".vercel", "mobile/ios/.xcode.env.local", "mobile/ios/Ninou.xcworkspace/xcuserdata"]) {
  if (existsSync(join(root, forbidden))) failures.push(`Artefato local não pode fazer parte da base: ${forbidden}`);
}

async function walk(directory, ignored = new Set(["node_modules", ".git", ".vercel", "dist"])) {
  const files = [];
  if (!existsSync(directory)) return files;
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (ignored.has(entry.name)) continue;
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(path, ignored)); else files.push(path);
  }
  return files;
}

const sourceFiles = await walk(root);
const scripts = sourceFiles.filter((file) => /\.(?:m?js)$/.test(file));
for (const file of scripts) {
  const result = spawnSync(process.execPath, ["--check", file], { encoding: "utf8" });
  if (result.status !== 0) failures.push(`Sintaxe inválida em ${relative(root, file)}: ${result.stderr.trim()}`);
}

const html = await readFile(join(root, "index.html"), "utf8");
const appCss = await readFile(join(root, "styles/app.css"), "utf8");
const adminCss = await readFile(join(root, "styles/admin.css"), "utf8");
const bootstrap = await readFile(join(root, "js/bootstrap.mjs"), "utf8");
const core = await readFile(join(root, "js/app-core.mjs"), "utf8");
const shell = await readFile(join(root, "js/ui/app-shell.mjs"), "utf8");
const sw = await readFile(join(root, "sw.js"), "utf8");
const build = await readFile(join(root, "scripts/build-production.mjs"), "utf8");

const ids = [...html.matchAll(/\sid=["']([^"']+)["']/g)].map((match) => match[1]);
const duplicateIds = [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))];
if (duplicateIds.length) failures.push(`IDs duplicados no HTML: ${duplicateIds.join(", ")}`);

const stylesheetLinks = html.match(/<link[^>]+rel="stylesheet"[^>]*>/g) || [];
if (stylesheetLinks.length !== 1 || !stylesheetLinks[0].includes(`styles/app.css?v=${version}`)) {
  failures.push("A aplicação comum deve carregar exatamente styles/app.css.");
}
if (html.includes("styles/admin.css")) failures.push("O CSS administrativo deve ser carregado somente para a conta admin.");
if (!html.includes(`js/bootstrap.mjs?v=${version}`)) failures.push("Bootstrap estável ausente do HTML.");
if (!html.includes('id="adminWebPortal"') || html.indexOf('id="adminWebPortal"') > html.indexOf('<main class="phone-shell')) {
  failures.push("Portal administrativo deve permanecer fora do shell familiar.");
}
for (const marker of ["avatarMenuTrigger", "avatarQuickMenu", "subscriptionAccessPortal", "guestPortalForgotPasswordButton"]) {
  if (!html.includes(`id="${marker}"`)) failures.push(`Fluxo essencial ausente: ${marker}`);
}
if (html.includes('data-start-mode="now"')) failures.push("Fluxo inicial redundante voltou ao HTML.");
if (html.includes("Criar minha família")) failures.push("Criação pública autônoma de família voltou à entrada comercial.");

for (const feature of [
  "Barra inferior espelhada", "Estabilidade de interações", "Experiência mobile e live wallpaper",
  ".ninou-live-wallpaper", ".premium-delete-record", ".subscription-access-card h2",
]) if (!appCss.includes(feature)) failures.push(`Folha consolidada perdeu: ${feature}`);
for (const feature of ["function openAvatarMenu()", "function ensureLiveWallpaper()", "function ensureDeleteDialog()", "Somente visualização"]) {
  if (!shell.includes(feature)) failures.push(`Shell consolidado perdeu: ${feature}`);
}
if (!shell.includes("initActionLauncher")) failures.push("Inicialização do botão de ações não foi incorporada ao shell.");

for (const expected of [
  `const NINOU_VERSION = "${version}"`, "./app-core.mjs", "./ui/app-shell.mjs", "./runtime/visual-guard.mjs",
]) if (!bootstrap.includes(expected)) failures.push(`Bootstrap inconsistente: ${expected}`);
for (const expected of [
  `const NINOU_RUNTIME_VERSION = "${version}"`, `./styles/admin.css?v=${version}`, `./admin-runtime.mjs?v=${version}`,
]) if (!core.includes(expected)) failures.push(`Núcleo inconsistente: ${expected}`);
if (!core.includes(`navigator.serviceWorker.register("/sw.js?v=${version}"`)) failures.push("Registro do Service Worker não está versionado.");

for (const expected of [
  `const APP_VERSION = "${version}"`, "styles/app.css", "js/bootstrap.mjs", "js/app-core.mjs", "js/ui/app-shell.mjs",
]) if (!sw.includes(expected)) failures.push(`Service Worker não referencia: ${expected}`);
if (!build.includes('"styles", "js", "assets", "audio", "icons"')) failures.push("Build não publica a estrutura consolidada.");
if (sw.includes("styles/admin.css") || sw.includes("admin-runtime.mjs") || sw.includes("admin-service.js")) failures.push("Recursos administrativos não devem ser pré-carregados para famílias clientes.");

const obsoletePatterns = [
  /^styles\/(?:legacy|premium-v|focused-flow-v|customer-ready-v|web-interaction-stability-v|web-mobile-|admin-web-v|admin-mobile-|admin-v)/,
  /^js\/(?:boot-v|ninou-core-v|ninou-admin|ninou-ux-v|ninou-consistency-v|ninou-stability-v|web-mobile-)/,
  /^js\/runtime\/(?:architecture-v|diagnostics-v|visual-guard-v)/,
  /^js\/services\/admin-service-v/,
];
const obsoleteFiles = sourceFiles.map((file) => relative(root, file)).filter((file) => obsoletePatterns.some((pattern) => pattern.test(file)));
if (obsoleteFiles.length) failures.push(`Arquivos de correção/versionados ainda presentes: ${obsoleteFiles.join(", ")}`);

const appCssSize = (await stat(join(root, "styles/app.css"))).size;
const adminCssSize = (await stat(join(root, "styles/admin.css"))).size;
const coreSize = (await stat(join(root, "js/app-core.mjs"))).size;
if (appCssSize > 950 * 1024) failures.push(`CSS comum excedeu 950 KB: ${(appCssSize / 1024).toFixed(1)} KB`);
if (adminCssSize > 60 * 1024) failures.push(`CSS admin excedeu 60 KB: ${(adminCssSize / 1024).toFixed(1)} KB`);
if (coreSize > 750 * 1024) failures.push(`Núcleo excedeu 750 KB: ${(coreSize / 1024).toFixed(1)} KB`);

const commonImportant = (appCss.match(/!important/g) || []).length;
const adminImportant = (adminCss.match(/!important/g) || []).length;
if (commonImportant > 8000) failures.push(`CSS comum ultrapassou o teto de !important: ${commonImportant}`);
if (adminImportant > 200) failures.push(`CSS admin ultrapassou o teto de !important: ${adminImportant}`);

const mobilePackage = JSON.parse(await readFile(join(root, "mobile/package.json"), "utf8"));
const mobileApp = JSON.parse(await readFile(join(root, "mobile/app.json"), "utf8"));
if (mobilePackage.version !== version || mobileApp.expo.version !== version) failures.push("Versões web e mobile não estão alinhadas.");
if (mobileApp.expo.ios.bundleIdentifier !== "com.ninou.app" || mobileApp.expo.android.package !== "com.ninou.app") failures.push("Identificadores de loja foram alterados.");

const productionFiles = await walk(join(root, "dist"), new Set(["node_modules", ".git", ".vercel"]));
if (productionFiles.length) {
  const relativeProduction = productionFiles.map((file) => relative(join(root, "dist"), file));
  for (const expected of ["index.html", "styles/app.css", "styles/admin.css", "js/bootstrap.mjs", "js/app-core.mjs"]) {
    if (!relativeProduction.includes(expected)) failures.push(`Build não contém ${expected}`);
  }
  const obsoleteProduction = relativeProduction.filter((file) => obsoletePatterns.some((pattern) => pattern.test(file)));
  if (obsoleteProduction.length) failures.push(`Build contém legado: ${obsoleteProduction.join(", ")}`);
}

if (failures.length) {
  console.error(`Falhas de validação (${failures.length}):`);
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(`Ninou v${version}: base consolidada aprovada — 1 CSS web, 1 shell, 1 núcleo, admin condicional e mobile alinhado.`);
