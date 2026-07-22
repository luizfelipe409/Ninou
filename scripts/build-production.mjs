import { cp, mkdir, readFile, rm, stat } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const output = join(root, "dist");
const packageJson = JSON.parse(await readFile(join(root, "package.json"), "utf8"));
const version = packageJson.version;
const publicEntries = [
  "index.html", "sw.js", "manifest.webmanifest", "privacidade.html", "termos.html", "suporte.html",
  "styles", "js", "assets", "audio", "icons",
];

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
for (const entry of publicEntries) {
  await cp(join(root, entry), join(output, entry), { recursive: true });
}

async function directorySize(path) {
  const info = await stat(path);
  if (info.isFile()) return info.size;
  const { readdir } = await import("node:fs/promises");
  const entries = await readdir(path);
  let total = 0;
  for (const entry of entries) total += await directorySize(join(path, entry));
  return total;
}

const bytes = await directorySize(output);
console.log(`Build de produção v${version} concluído em dist/ (${(bytes / 1024 / 1024).toFixed(1)} MB).`);
