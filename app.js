// Ninou v75.76.2 — carregador compatível com instalações e caches anteriores.
const NINOU_APP_VERSION = "75.76.2";

function showLoaderFailure(error) {
  console.error("Não foi possível iniciar o Ninou:", error);

  const syncPill = document.querySelector(".sync-pill");
  if (syncPill) {
    syncPill.textContent = "Erro";
    syncPill.classList.remove("online", "pending");
    syncPill.classList.add("offline");
    syncPill.title = "Toque para atualizar e tentar novamente";
    syncPill.addEventListener("click", () => window.location.reload(), { once: true });
  }

  document.querySelectorAll('.bottom-nav button[data-target]').forEach((button) => {
    button.disabled = false;
    button.style.pointerEvents = "auto";
    button.addEventListener("click", () => {
      const target = button.dataset.target;
      document.querySelectorAll(".screen").forEach((screen) => {
        screen.classList.toggle("active", screen.dataset.screen === target);
      });
      document.querySelectorAll('.bottom-nav button[data-target]').forEach((item) => {
        item.classList.toggle("active", item === button);
      });
    });
  });

  if (document.querySelector("[data-ninou-loader-error]")) return;
  const fallback = document.createElement("div");
  fallback.dataset.ninouLoaderError = "true";
  fallback.style.cssText = "position:fixed;left:16px;right:16px;top:16px;z-index:99999;padding:14px 16px;border-radius:18px;background:#fff3f3;color:#4a1220;font:14px/1.4 system-ui;box-shadow:0 12px 30px rgba(74,18,32,.18)";
  fallback.innerHTML = '<strong>Falha ao iniciar o Ninou.</strong><br><button type="button" data-reload-ninou style="margin-top:8px;padding:8px 12px;border:0;border-radius:10px;font-weight:700">Atualizar agora</button>';
  fallback.querySelector("[data-reload-ninou]")?.addEventListener("click", () => window.location.reload());
  document.body.prepend(fallback);
}

async function startNinou() {
  try {
    await import(`./js/app.js?v=${NINOU_APP_VERSION}`);
  } catch (primaryError) {
    console.warn("Carregamento principal falhou; tentando caminho compatível.", primaryError);
    try {
      await import(`./js/app.legacy.js?v=${NINOU_APP_VERSION}`);
    } catch (legacyError) {
      showLoaderFailure(legacyError);
    }
  }
}

startNinou();
