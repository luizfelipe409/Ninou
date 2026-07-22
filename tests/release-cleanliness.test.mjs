import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const pkg = JSON.parse(await readFile(join(root, "package.json"), "utf8"));
const version = pkg.version;

async function walk(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(path)); else files.push(path);
  }
  return files;
}

const html = await readFile(join(root, "index.html"), "utf8");
assert.equal((html.match(/<link[^>]+rel="stylesheet"/g) || []).length, 1);
assert.match(html, new RegExp(`styles/app\\.css\\?v=${version.replaceAll('.', '\\.')}`));
assert.match(html, new RegExp(`js/bootstrap\\.mjs\\?v=${version.replaceAll('.', '\\.')}`));
assert.doesNotMatch(html, /(?:v82\.|web-mobile-menu-parity|web-mobile-experience|interaction-stability)/);

const distFiles = (await walk(join(root, "dist"))).map((file) => relative(join(root, "dist"), file));
assert.ok(distFiles.includes("styles/app.css"));
assert.ok(distFiles.includes("styles/admin.css"));
assert.ok(distFiles.includes("js/bootstrap.mjs"));
assert.ok(distFiles.includes("js/app-core.mjs"));
assert.ok(distFiles.includes("js/ui/app-shell.mjs"));
assert.ok(!distFiles.some((file) => /(?:v82\.|boot-v|ninou-core-v|admin-web-v|web-mobile-)/.test(file)));

assert.equal(existsSync(join(root, "mobile/ios/.xcode.env.local")), false);
assert.equal(existsSync(join(root, "mobile/ios/Ninou.xcworkspace/xcuserdata")), false);
console.log(`Limpeza de lançamento v${version} aprovada.`);
