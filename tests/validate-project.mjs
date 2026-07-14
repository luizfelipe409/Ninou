import { readFile, readdir, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, relative } from "node:path";
import { spawnSync } from "node:child_process";

const root = new URL("../", import.meta.url).pathname;
const failures = [];
const cssModules = ["legacy", "premium-v80.1.4"];
const required = [
  "index.html", "styles.css", "sw.js", "manifest.webmanifest", "firestore.rules", "vercel.json",
  ...cssModules.map((name) => `styles/${name}.css`),
  "js/boot-v80.1.4.mjs", "js/ninou-core-v80.1.4.mjs", "js/ninou-ux-v80.1.4.mjs",
  "js/ninou-consistency-v80.1.4.mjs", "js/ninou-stability-v80.1.4.mjs",
  "js/runtime/architecture-v80.1.4.mjs", "js/runtime/diagnostics-v80.1.4.mjs", "js/runtime/visual-guard-v80.1.4.mjs",
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

for (const file of scripts.filter((file) => /js\/(?:core|repositories|runtime)\//.test(relative(root, file)) && !file.endsWith("diagnostics-v80.1.4.mjs") && !file.endsWith("visual-guard-v80.1.4.mjs"))) {
  const source = await readFile(file, "utf8");
  if (/\blocalStorage\b/.test(source)) failures.push(`Acesso direto a localStorage em ${relative(root, file)}`);
}

const html = await readFile(join(root, "index.html"), "utf8");
const ids = [...html.matchAll(/\sid=["']([^"']+)["']/g)].map((match) => match[1]);
const duplicates = [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))];
if (duplicates.length) failures.push(`IDs duplicados no HTML: ${duplicates.join(", ")}`);
if (!html.includes("boot-v80.1.4.mjs?v=80.1.4")) failures.push("Boot v80.1.4 não está ligado ao index.html");
for (const module of cssModules) if (!html.includes(`styles/${module}.css?v=80.1.4`)) failures.push(`CSS ${module} não está ligado ao HTML`);
for (const removed of ["tokens", "foundation", "home", "components", "motion", "responsive", "v78.4-critical"]) {
  if (html.includes(`styles/${removed}.css`)) failures.push(`CSS antigo ainda ligado ao HTML: ${removed}`);
}

const sw = await readFile(join(root, "sw.js"), "utf8");
if (!sw.includes('const STYLE_MODULES = ["legacy", "premium-v80.1.4"]')) failures.push("Service Worker não declara a autoridade visual revisada");
if (!sw.includes('const APP_VERSION = "80.1.4"')) failures.push("Service Worker não está na v80.1.4");
for (const asset of ["day-sky.svg", "night-sky.svg"]) if (!sw.includes(asset)) failures.push(`Service Worker não referencia ${asset}`);
for (const asset of required.filter((file) => file.startsWith("js/"))) {
  if (!sw.includes(asset.split("/").at(-1)) && !["js/storage/local-storage.js", "js/utils/security.js"].includes(asset)) failures.push(`Service Worker não referencia ${asset}`);
}

const forbidden = files.map((file) => relative(root, file)).filter((file) => /(^|\/)(\.env|\.env\.|project\.json$|\.vercel\/)/.test(file));
if (forbidden.length) failures.push(`Arquivos sensíveis/de ambiente no pacote: ${forbidden.join(", ")}`);

const premiumCss = await readFile(join(root, "styles/premium-v80.1.4.css"), "utf8");
const premiumImportant = (premiumCss.match(/!important/g) || []).length;
if (premiumImportant > 1450) failures.push(`Autoridade premium usa !important em excesso: ${premiumImportant}`);
for (const selector of ["client-family-member-avatar", "record-sheet-open .bottom-bar", "quick-observations-panel", "premium-new-episode-button", "record-types", "weight-sparkline svg", "event-meta-primary", "diaryChipsMoreButton", "paint-order: normal", "day-sky.svg", "night-sky.svg", "n8012-light-rays", "n8012-star-drift"]) {
  if (!premiumCss.includes(selector)) failures.push(`Autoridade premium não cobre: ${selector}`);
}

const sizes = {};
for (const name of cssModules) sizes[name] = (await stat(join(root, `styles/${name}.css`))).size;
const totalCss = Object.values(sizes).reduce((a,b) => a+b,0);
if (totalCss >= 850 * 1024) failures.push(`CSS total ainda está grande demais: ${(totalCss/1024).toFixed(1)} KB`);

console.log(`Ninou v80.1.4: ${files.length} arquivos, ${scripts.length} scripts, CSS total ${(totalCss/1024).toFixed(1)} KB, !important premium ${premiumImportant}.`);
if (failures.length) {
  console.error(failures.map((failure) => `- ${failure}`).join("\n"));
  process.exit(1);
}
console.log("Validação estrutural e visual concluída sem erros.");
