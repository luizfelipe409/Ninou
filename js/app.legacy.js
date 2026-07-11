// Compatibilidade temporária para instalações/PWAs que ainda apontam para o caminho antigo.
// O código ativo existe somente em js/app.js.
const NINOU_COMPAT_VERSION = "75.76.2";

try {
  await import(`./app.js?v=${NINOU_COMPAT_VERSION}`);
} catch (error) {
  console.error("Falha ao carregar o núcleo compatível do Ninou:", error);
  const status = document.querySelector(".sync-pill");
  if (status) {
    status.textContent = "Erro";
    status.classList.add("offline");
  }
  throw error;
}
