// Ninou v75.75.7 - compatibilidade com versões antigas do index.html.
// A partir desta versão, o index.html carrega js/app.legacy.js diretamente para evitar falso aviso de falha no iPhone/PWA.
const NINOU_APP_VERSION = "75.75.7";

import(`./js/app.legacy.js?v=${NINOU_APP_VERSION}`).catch((error) => {
  console.error("Não foi possível iniciar o Ninou:", error);
  const existing = document.querySelector("[data-ninou-loader-error]");
  if (existing) return;
  const fallback = document.createElement("div");
  fallback.dataset.ninouLoaderError = "true";
  fallback.style.cssText = "margin:16px;padding:14px 16px;border-radius:18px;background:#fff3f3;color:#4a1220;font:14px system-ui;box-shadow:0 12px 30px rgba(74,18,32,.08)";
  fallback.innerHTML = "<strong>Falha ao iniciar o Ninou.</strong><br>Toque em Atualizar. Se continuar, abra pelo Safari e limpe os dados do site.";
  document.body.prepend(fallback);
});
