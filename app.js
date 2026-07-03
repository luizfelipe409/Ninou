// Ninou v75.60.11 - Login estável + App Check seguro
// Loader modular com cache renovado e fallback de carregamento.
const NINOU_APP_VERSION = "75.60.11";

import(`./js/app.legacy.js?v=${NINOU_APP_VERSION}`).catch((error) => {
  console.error("Não foi possível iniciar o Ninou:", error);
  document.documentElement.style.background = "#f8f6fc";
  document.body.style.background = "#f8f6fc";
  document.body.style.color = "#3d315f";
  const fallback = document.createElement("div");
  fallback.style.cssText = "margin:16px;padding:18px;border-radius:20px;background:#fff3f3;color:#4a1220;font:15px system-ui;box-shadow:0 12px 30px rgba(74,18,32,.08)";
  fallback.innerHTML = "<strong>Não foi possível carregar o Ninou.</strong><br>Atualize a página. Se continuar, remova o app da tela inicial e instale novamente.";
  document.body.prepend(fallback);
});
