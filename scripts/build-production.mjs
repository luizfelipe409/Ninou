import { cp, mkdir, rm, stat } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const output = join(root, "dist");
const publicFiles = [
  "index.html",
  "sw.js",
  "manifest.webmanifest",

  "styles/legacy.css",
  "styles/admin-v82.0.0.css",
  "styles/premium-v82.0.0.css",
  "styles/focused-flow-v82.0.0.css",

  "js/boot-v82.0.0.mjs",
  "js/ninou-core-v82.0.0.mjs",
  "js/ninou-admin-v82.0.0.mjs",
  "js/ninou-ux-v82.0.0.mjs",
  "js/ninou-consistency-v82.0.0.mjs",
  "js/ninou-stability-v82.0.0.mjs",
  "js/config/constants.js",
  "js/core/app-state.js",
  "js/core/event-bus.js",
  "js/core/logger.js",
  "js/dom/dom.js",
  "js/domain/baby-profile.js",
  "js/domain/diaper.js",
  "js/domain/event-editor.js",
  "js/domain/feeding.js",
  "js/domain/medication.js",
  "js/domain/record-types.js",
  "js/domain/records.js",
  "js/domain/sleep.js",
  "js/domain/sounds.js",
  "js/domain/weights.js",
  "js/repositories/json-repository.js",
  "js/repositories/profile-repository.js",
  "js/repositories/routine-repository.js",
  "js/runtime/architecture-v82.0.0.mjs",
  "js/runtime/diagnostics-v82.0.0.mjs",
  "js/runtime/visual-guard-v82.0.0.mjs",
  "js/services/account-service.js",
  "js/services/export-service.js",
  "js/services/firebase-service.js",
  "js/services/timer-service.js",
  "js/storage/local-storage.js",
  "js/ui/account.js",
  "js/ui/action-launcher.js",
  "js/ui/app-navigation.js",
  "js/ui/charts.js",
  "js/ui/empty-states.js",
  "js/ui/event-formatters.js",
  "js/ui/home.js",
  "js/ui/intelligence.js",
  "js/ui/navigation.js",
  "js/ui/profile.js",
  "js/ui/record-sheet.js",
  "js/ui/render-utils.js",
  "js/ui/sounds.js",
  "js/ui/theme.js",
  "js/utils/security.js",
  "js/utils/text.js",
  "js/utils/time.js",

  "assets/clock-themes/day-sky.svg",
  "assets/clock-themes/night-sky.svg",
  "audio/ritmo-suave-bebe.mp3",
  "audio/som-relaxar.mp3",
  "audio/som-utero.mp3",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/apple-touch-icon.png",
  "icons/actions/acordou.png",
  "icons/actions/amamentacao.png",
  "icons/actions/despertar-noturno.png",
  "icons/actions/dormir.png",
  "icons/actions/fralda.png",
  "icons/actions/mamadeira.png",
  "icons/actions/soneca.png",
  "icons/baby-avatars/avatar-01.webp",
  "icons/baby-avatars/avatar-02.webp",
  "icons/baby-avatars/avatar-03.webp",
  "icons/baby-avatars/avatar-04.webp",
  "icons/baby-avatars/avatar-05.webp",
  "icons/baby-avatars/avatar-06.webp",
  "icons/baby-avatars/avatar-07.webp",
  "icons/baby-avatars/avatar-08.webp",
  "icons/baby-avatars/avatar-09.webp",
  "icons/baby-avatars/avatar-10.webp",
  "icons/baby-avatars/avatar-11.webp",
  "icons/baby-avatars/avatar-12.webp",
];

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
let publicBytes = 0;
for (const file of publicFiles) {
  const source = join(root, file);
  const target = join(output, file);
  await mkdir(dirname(target), { recursive: true });
  await cp(source, target);
  publicBytes += (await stat(source)).size;
}

console.log(`Build de produção v82.0.0 concluído em dist/ (${publicFiles.length} arquivos públicos, ${(publicBytes / 1024 / 1024).toFixed(1)} MB).`);
