import { readFile, readdir, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, relative } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const releaseVersion = "82.1.3";
const failures = [];
const cssModules = ["legacy", "premium-v82.0.0", "focused-flow-v82.0.0"];
const conditionalCssModules = ["admin-mobile-parity-v82.1.1"];
const conditionalJsModules = ["js/ninou-admin-v82.0.0.mjs"];
const required = [
  "index.html", "sw.js", "manifest.webmanifest", "firestore.rules", "vercel.json",
  ...[...cssModules, ...conditionalCssModules].map((name) => `styles/${name}.css`),
  "js/boot-v82.0.0.mjs", "js/ninou-core-v82.0.0.mjs", ...conditionalJsModules, "js/ninou-ux-v82.0.0.mjs",
  "js/ninou-consistency-v82.0.0.mjs", "js/ninou-stability-v82.0.0.mjs",
  "js/runtime/architecture-v82.0.0.mjs", "js/runtime/diagnostics-v82.0.0.mjs", "js/runtime/visual-guard-v82.0.0.mjs",
  "js/core/event-bus.js", "js/core/app-state.js", "js/core/logger.js",
  "js/repositories/json-repository.js", "js/repositories/routine-repository.js", "js/repositories/profile-repository.js",
  "js/storage/local-storage.js", "js/utils/security.js",
  "assets/clock-themes/day-sky.svg", "assets/clock-themes/night-sky.svg",
];
for (const file of required) if (!existsSync(join(root, file))) failures.push(`Arquivo obrigatório ausente: ${file}`);

async function walk(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (["node_modules", ".git", ".vercel", "dist"].includes(entry.name)) continue;
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(path)); else files.push(path);
  }
  return files;
}

const files = await walk(root);
const scripts = files.filter((file) => /\.(?:m?js)$/.test(file));
for (const file of scripts) {
  const result = spawnSync(process.execPath, ["--check", file], { encoding: "utf8" });
  if (result.status !== 0) failures.push(`Sintaxe inválida em ${relative(root, file)}: ${result.stderr.trim()}`);
}

for (const file of scripts.filter((file) => /js\/(?:core|repositories|runtime)\//.test(relative(root, file)) && !file.endsWith("diagnostics-v82.0.0.mjs") && !file.endsWith("visual-guard-v82.0.0.mjs"))) {
  const source = await readFile(file, "utf8");
  if (/\blocalStorage\b/.test(source)) failures.push(`Acesso direto a localStorage em ${relative(root, file)}`);
}

const html = await readFile(join(root, "index.html"), "utf8");
const ids = [...html.matchAll(/\sid=["']([^"']+)["']/g)].map((match) => match[1]);
const duplicates = [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))];
if (duplicates.length) failures.push(`IDs duplicados no HTML: ${duplicates.join(", ")}`);
if (!html.includes(`boot-v82.0.0.mjs?v=${releaseVersion}`)) failures.push(`Boot v${releaseVersion} não está ligado ao index.html`);
for (const module of cssModules) if (!html.includes(`styles/${module}.css?v=${releaseVersion}`)) failures.push(`CSS ${module} não está ligado ao HTML`);
for (const module of conditionalCssModules) if (html.includes(`styles/${module}.css`)) failures.push(`CSS condicional ${module} não deve ser carregado pelo HTML comum`);
for (const module of conditionalJsModules) if (html.includes(module)) failures.push(`JavaScript condicional ${module} não deve ser carregado pelo HTML comum`);
for (const removed of ["tokens", "foundation", "home", "components", "motion", "responsive", "v78.4-critical"]) {
  if (html.includes(`styles/${removed}.css`)) failures.push(`CSS antigo ainda ligado ao HTML: ${removed}`);
}

const sw = await readFile(join(root, "sw.js"), "utf8");
if (!sw.includes('const STYLE_MODULES = ["legacy", "premium-v82.0.0", "focused-flow-v82.0.0"]')) failures.push("Service Worker não declara a autoridade visual revisada");
if (sw.includes("styles/admin-mobile-parity-v82.1.1.css")) failures.push("Service Worker não deve pré-carregar o CSS administrativo");
if (sw.includes("ninou-admin-v82.0.0")) failures.push("Service Worker não deve pré-carregar o runtime administrativo");
if (!sw.includes(`const APP_VERSION = "${releaseVersion}"`)) failures.push(`Service Worker não está na v${releaseVersion}`);
for (const asset of ["day-sky.svg", "night-sky.svg"]) if (!sw.includes(asset)) failures.push(`Service Worker não referencia ${asset}`);
for (const asset of required.filter((file) => file.startsWith("js/"))) {
  if (!sw.includes(asset.split("/").at(-1)) && !["js/storage/local-storage.js", "js/utils/security.js", ...conditionalJsModules].includes(asset)) failures.push(`Service Worker não referencia ${asset}`);
}

const productionFiles = existsSync(join(root, "dist")) ? await walk(join(root, "dist")) : [];
const forbidden = productionFiles.map((file) => relative(root, file)).filter((file) => /(^|\/)(\.env|\.env\.|project\.json$|\.vercel\/)/.test(file));
if (forbidden.length) failures.push(`Arquivos sensíveis/de ambiente no pacote: ${forbidden.join(", ")}`);
const publicRootFiles = new Set(productionFiles.map((file) => relative(join(root, "dist"), file)));
if (productionFiles.length && !publicRootFiles.has("styles/admin-mobile-parity-v82.1.1.css")) failures.push("CSS administrativo ausente do pacote de produção");
if (productionFiles.length && !publicRootFiles.has("js/ninou-admin-v82.0.0.mjs")) failures.push("Runtime administrativo ausente do pacote de produção");
const forbiddenPublicFiles = ["app.js", "styles.css", "firestore.rules", "vercel.json"]
  .filter((file) => publicRootFiles.has(file));
const obsoletePublicFiles = [...publicRootFiles].filter((file) => /v81\.0\.1|premium-v81\.0\.1|(^|\/)\.DS_Store$/.test(file));
if (forbiddenPublicFiles.length) failures.push(`Arquivos internos publicados em dist: ${forbiddenPublicFiles.join(", ")}`);
if (obsoletePublicFiles.length) failures.push(`Arquivos obsoletos publicados em dist: ${obsoletePublicFiles.join(", ")}`);

const premiumCss = await readFile(join(root, "styles/premium-v82.0.0.css"), "utf8");
const premiumImportant = (premiumCss.match(/!important/g) || []).length;
if (premiumImportant > 1960) failures.push(`Autoridade premium usa !important em excesso: ${premiumImportant}`);
const legacyCss = await readFile(join(root, "styles/legacy.css"), "utf8");
const legacyImportant = (legacyCss.match(/!important/g) || []).length;
if (legacyImportant > 4735) failures.push(`Camada comum usa !important em excesso: ${legacyImportant}`);
const legacyWithoutSharedAccessCard = legacyCss.replace(/\.admin-access-card\b/g, "");
if (/(?:[.#][A-Za-z0-9_-]*admin[A-Za-z0-9_-]*|\[data-(?:global-admin-only|advanced-only)\])/.test(legacyWithoutSharedAccessCard)) failures.push("Seletores exclusivos do painel administrativo retornaram à camada comum");
const adminCss = await readFile(join(root, "styles/admin-mobile-parity-v82.1.1.css"), "utf8");
const adminImportant = (adminCss.match(/!important/g) || []).length;
if (adminImportant > 850) failures.push(`Camada administrativa usa !important em excesso: ${adminImportant}`);
for (const selector of ["body.global-admin-mode", ".premium-admin-root", ".premium-admin-family-screen", ".premium-admin-confirm-dialog"]) {
  if (!adminCss.includes(selector)) failures.push(`Camada administrativa não cobre: ${selector}`);
}
const core = await readFile(join(root, "js/ninou-core-v82.0.0.mjs"), "utf8");
if (!core.includes(`const ADMIN_STYLESHEET_HREF = "./styles/admin-mobile-parity-v82.1.1.css?v=${releaseVersion}"`)) failures.push("Núcleo não declara o CSS administrativo condicional");
if (!core.includes(`const ADMIN_RUNTIME_HREF = "./ninou-admin-v82.0.0.mjs?v=${releaseVersion}"`)) failures.push("Núcleo não declara o runtime administrativo condicional");
if (!core.includes("void ensureAdminRuntime()")) failures.push("Núcleo não restringe o runtime administrativo ao admin global");
if (/createInviteButton\.addEventListener|adminInvitePanel\.addEventListener/.test(core)) failures.push("Listeners administrativos retornaram ao núcleo comum");
const adminRuntime = await readFile(join(root, conditionalJsModules[0]), "utf8");
if (!adminRuntime.includes("export function initializeNinouAdminRuntime")) failures.push("Runtime administrativo não expõe inicialização explícita");
for (const removedSelector of ["chips-more-button", "quick-observation-custom", "family-access-summary-grid", "icon-art-dormir", "icon-art-despertar-noturno"]) {
  if (legacyCss.includes(removedSelector)) failures.push(`Seletor órfão retornou ao legado: ${removedSelector}`);
}
for (const removedAnimation of ["appear", "recordHintFloat"]) {
  if (new RegExp(`@keyframes\\s+${removedAnimation}\\b`).test(legacyCss)) failures.push(`Animação órfã retornou ao legado: ${removedAnimation}`);
}
const totalImportant = (await Promise.all(cssModules.map(async (name) => {
  const css = await readFile(join(root, `styles/${name}.css`), "utf8");
  return (css.match(/!important/g) || []).length;
}))).reduce((total, count) => total + count, 0);
if (totalImportant > 7550) failures.push(`Cascata comum usa !important em excesso: ${totalImportant}`);
for (const selector of ["client-family-member-avatar", "record-sheet-open .bottom-bar", "quick-observations-panel", "premium-new-episode-button", "record-types", "weight-sparkline svg", "event-meta-primary", "diaryChipsMoreButton", "paint-order: normal", "day-sky.svg", "night-sky.svg", "n8012-light-rays", "n8012-star-drift"]) {
  if (!premiumCss.includes(selector)) failures.push(`Autoridade premium não cobre: ${selector}`);
}

const sizes = {};
for (const name of cssModules) sizes[name] = (await stat(join(root, `styles/${name}.css`))).size;
const totalCss = Object.values(sizes).reduce((a,b) => a+b,0);
if (totalCss >= 810 * 1024) failures.push(`CSS comum ainda está grande demais: ${(totalCss/1024).toFixed(1)} KB`);
const adminCssSize = (await stat(join(root, "styles/admin-mobile-parity-v82.1.1.css"))).size;
if (adminCssSize >= 60 * 1024) failures.push(`CSS administrativo ainda está grande demais: ${(adminCssSize/1024).toFixed(1)} KB`);
const coreJsSize = (await stat(join(root, "js/ninou-core-v82.0.0.mjs"))).size;
const adminRuntimeSize = (await stat(join(root, conditionalJsModules[0]))).size;
if (coreJsSize >= 680 * 1024) failures.push(`Núcleo JavaScript comum ainda está grande demais: ${(coreJsSize/1024).toFixed(1)} KB`);
if (adminRuntimeSize >= 48 * 1024) failures.push(`Runtime administrativo está grande demais: ${(adminRuntimeSize/1024).toFixed(1)} KB`);
for (const name of [...cssModules, ...conditionalCssModules]) {
  const css = await readFile(join(root, `styles/${name}.css`), "utf8");
  if (/\{\s*\}/.test(css)) failures.push(`Bloco CSS vazio retornou a styles/${name}.css`);
}

console.log(`Ninou v${releaseVersion}: ${files.length} arquivos, ${scripts.length} scripts, CSS comum ${(totalCss/1024).toFixed(1)} KB + admin condicional ${(adminCssSize/1024).toFixed(1)} KB, JS comum ${(coreJsSize/1024).toFixed(1)} KB + admin condicional ${(adminRuntimeSize/1024).toFixed(1)} KB, !important comum ${totalImportant}, admin ${adminImportant}.`);
if (failures.length) {
  console.error(failures.map((failure) => `- ${failure}`).join("\n"));
  process.exit(1);
}
console.log("Validação estrutural e visual concluída sem erros.");
