import { readFile, readdir, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, relative } from "node:path";
import { spawnSync } from "node:child_process";

const root = new URL("../", import.meta.url).pathname;
const failures = [];
const required = [
  "index.html", "styles.css", "sw.js", "manifest.webmanifest", "firestore.rules",
  "js/boot-v78.1.0.mjs", "js/ninou-core-v78.1.0.mjs", "js/ninou-ux-v78.1.0.mjs",
  "js/ninou-consistency-v78.1.0.mjs", "js/ninou-stability-v78.1.0.mjs",
  "js/runtime/architecture-v78.1.0.mjs", "js/runtime/diagnostics-v78.1.0.mjs",
  "js/core/event-bus.js", "js/core/app-state.js", "js/core/logger.js",
  "js/repositories/json-repository.js", "js/repositories/routine-repository.js", "js/repositories/profile-repository.js",
  "js/storage/local-storage.js", "js/utils/security.js",
];

for (const file of required) if (!existsSync(join(root, file))) failures.push(`Arquivo obrigatório ausente: ${file}`);

async function walk(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (["node_modules", ".git", ".vercel"].includes(entry.name)) continue;
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


// Limites arquiteturais: módulos novos não acessam localStorage diretamente.
for (const file of scripts.filter((file) => /js\/(?:core|repositories|runtime)\//.test(relative(root, file)) && !file.endsWith("diagnostics-v78.1.0.mjs"))) {
  const source = await readFile(file, "utf8");
  if (/\blocalStorage\b/.test(source)) failures.push(`Acesso direto a localStorage em ${relative(root, file)}`);
}

const html = await readFile(join(root, "index.html"), "utf8");
const ids = [...html.matchAll(/\sid=["']([^"']+)["']/g)].map((match) => match[1]);
const duplicates = [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))];
if (duplicates.length) failures.push(`IDs duplicados no HTML: ${duplicates.join(", ")}`);
if (/77\.3\.0|v77\.3\.0|78\.0\.0/.test(html)) failures.push("index.html ainda referencia uma versão antiga");
if (!html.includes("boot-v78.1.0.mjs?v=78.1.0")) failures.push("Boot v78 não está ligado ao index.html");

const sw = await readFile(join(root, "sw.js"), "utf8");
for (const asset of required.filter((file) => file.startsWith("js/"))) {
  if (!sw.includes(asset.split("/").at(-1)) && !["js/storage/local-storage.js", "js/utils/security.js"].includes(asset)) {
    failures.push(`Service Worker não referencia ${asset}`);
  }
}
if (/77\.3\.0|77-3-0/.test(sw)) failures.push("Service Worker ainda contém versão antiga");

const forbidden = files.map((file) => relative(root, file)).filter((file) => /(^|\/)(\.env|\.env\.|project\.json$)/.test(file));
if (forbidden.length) failures.push(`Arquivos sensíveis/de ambiente no pacote: ${forbidden.join(", ")}`);

const cssSize = (await stat(join(root, "styles.css"))).size;
console.log(`Ninou v78.1.0: ${files.length} arquivos, ${scripts.length} scripts validados, CSS ${(cssSize / 1024).toFixed(1)} KB.`);
if (failures.length) {
  console.error(failures.map((failure) => `- ${failure}`).join("\n"));
  process.exit(1);
}
console.log("Validação estrutural concluída sem erros.");
