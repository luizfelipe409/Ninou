import { cp, mkdir, rm, readdir } from "node:fs/promises";
import { join } from "node:path";

const root = new URL("../", import.meta.url).pathname;
const output = join(root, "dist");
const include = [
  "index.html", "styles.css", "styles", "app.js", "sw.js", "manifest.webmanifest", "vercel.json",
  "firestore.rules", "icons", "audio", "js",
];

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
for (const entry of include) await cp(join(root, entry), join(output, entry), { recursive: true });

const files = await readdir(output);
console.log(`Build de produção v79.2.0 concluído em dist/ (${files.length} entradas principais).`);
