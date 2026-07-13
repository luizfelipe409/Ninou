import { readFile, readdir, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, relative } from "node:path";
import { spawnSync } from "node:child_process";

const root = new URL("../", import.meta.url).pathname;
const failures = [];
const cssModules = ["legacy", "tokens", "foundation", "home", "components", "motion", "responsive"];
const required = [
  "index.html", "styles.css", "sw.js", "manifest.webmanifest", "firestore.rules",
  ...cssModules.map((name) => `styles/${name}.css`),
  "js/boot-v78.3.0.mjs", "js/ninou-core-v78.3.0.mjs", "js/ninou-ux-v78.3.0.mjs",
  "js/ninou-consistency-v78.3.0.mjs", "js/ninou-stability-v78.3.0.mjs",
  "js/runtime/architecture-v78.3.0.mjs", "js/runtime/diagnostics-v78.3.0.mjs",
  "js/core/event-bus.js", "js/core/app-state.js", "js/core/logger.js",
  "js/repositories/json-repository.js", "js/repositories/routine-repository.js", "js/repositories/profile-repository.js",
  "js/storage/local-storage.js", "js/utils/security.js",
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

for (const file of scripts.filter((file) => /js\/(?:core|repositories|runtime)\//.test(relative(root, file)) && !file.endsWith("diagnostics-v78.3.0.mjs"))) {
  const source = await readFile(file, "utf8");
  if (/\blocalStorage\b/.test(source)) failures.push(`Acesso direto a localStorage em ${relative(root, file)}`);
}

const html = await readFile(join(root, "index.html"), "utf8");
const ids = [...html.matchAll(/\sid=["']([^"']+)["']/g)].map((match) => match[1]);
const duplicates = [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))];
if (duplicates.length) failures.push(`IDs duplicados no HTML: ${duplicates.join(", ")}`);
if (/77\.3\.0|78\.0\.0|78\.1\.1/.test(html)) failures.push("index.html ainda referencia uma versão antiga");
if (!html.includes("boot-v78.3.0.mjs?v=78.3.0")) failures.push("Boot v78.3.0 não está ligado ao index.html");
for (const module of cssModules) if (!html.includes(`styles/${module}.css?v=78.3.0`)) failures.push(`CSS ${module} não está ligado ao HTML`);

const sw = await readFile(join(root, "sw.js"), "utf8");
for (const asset of required.filter((file) => file.startsWith("js/"))) {
  if (!sw.includes(asset.split("/").at(-1)) && !["js/storage/local-storage.js", "js/utils/security.js"].includes(asset)) failures.push(`Service Worker não referencia ${asset}`);
}
if (!sw.includes(`const STYLE_MODULES = [${cssModules.map((name) => `"${name}"`).join(", ")}]`)) failures.push("Service Worker não declara todos os módulos CSS");
if (!sw.includes("STYLE_MODULES.map((name) => `/styles/${name}.css")) failures.push("Service Worker não adiciona os módulos CSS ao APP_SHELL");
if (/77\.3\.0|78\.1\.1|77-3-0|78-1-1/.test(sw)) failures.push("Service Worker ainda contém versão antiga");

const forbidden = files.map((file) => relative(root, file)).filter((file) => /(^|\/)(\.env|\.env\.|project\.json$|\.vercel\/)/.test(file));
if (forbidden.length) failures.push(`Arquivos sensíveis/de ambiente no pacote: ${forbidden.join(", ")}`);

const premiumCss = await Promise.all(cssModules.slice(1).map((name) => readFile(join(root, `styles/${name}.css`), "utf8")));
const premiumImportant = premiumCss.reduce((sum, source) => sum + (source.match(/!important/g) || []).length, 0);
if (premiumImportant > 900) failures.push(`Camada premium usa !important em excesso: ${premiumImportant}`);
const legacySource = await readFile(join(root, "styles/legacy.css"), "utf8");
if (/NINOU v77\.0\.0|ETAPA 1\/4|ETAPA 2\/4|ETAPA 3\/4/.test(legacySource)) failures.push("CSS legado ainda contém as camadas v77 acumuladas que deveriam ter sido removidas");

const sizes = {};
for (const name of cssModules) sizes[name] = (await stat(join(root, `styles/${name}.css`))).size;
const totalCss = Object.values(sizes).reduce((a,b) => a+b,0);
if (totalCss >= 800 * 1024) failures.push(`CSS total ainda está grande demais: ${(totalCss/1024).toFixed(1)} KB`);
console.log(`Ninou v78.3.0: ${files.length} arquivos, ${scripts.length} scripts, CSS total ${(totalCss/1024).toFixed(1)} KB, !important premium ${premiumImportant}.`);
if (failures.length) {
  console.error(failures.map((failure) => `- ${failure}`).join("\n"));
  process.exit(1);
}
console.log("Validação estrutural e visual concluída sem erros.");
