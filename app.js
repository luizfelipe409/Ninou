// Ninou v75.20 - Gráficos familiares e pesos migrados
// Loader modular com cache renovado e fallback de carregamento.
const NINOU_APP_VERSION = "75.20";

import(`./js/app.legacy.js?v=${NINOU_APP_VERSION}`).catch((error) => {
  console.error("Não foi possível iniciar o Ninou:", error);
  const fallback = document.createElement("div");
  fallback.style.cssText = "margin:16px;padding:14px;border-radius:16px;background:#fff3f3;color:#4a1220;font:14px system-ui";
  fallback.textContent = "Não foi possível carregar o aplicativo. Atualize a página ou limpe o cache do navegador.";
  document.body.prepend(fallback);
});
