/* Ninou v75.75.29 — acabamento premium de interface
   Pequena camada de UX: protege e-mails, encurta botões longos no painel admin
   e reaplica os ajustes quando o app renderiza listas dinamicamente. */
(() => {
  const VERSION = "75.75.29";
  const EMAIL_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
  const TEXT_TAGS = "strong,small,span,p,em,li,b";
  const SKIP_SELECTOR = "script,style,textarea,input,select,option,button,.ninou-email-token";

  const buttonLabels = new Map([
    ["Abrir rotina da família selecionada", "Abrir rotina"],
    ["Gerenciar membros", "Membros"],
    ["Criar convite", "Convite"],
    ["Revisar migração", "Migração"],
    ["Criar família", "Nova família"],
    ["Buscar por e-mail", "Buscar"],
    ["Preparar para consulta", "Consulta"],
    ["Enviar WhatsApp", "WhatsApp"],
  ]);

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function protectEmailText(element) {
    if (!element || element.closest(SKIP_SELECTOR)) return;
    if (element.dataset?.ninouEmailProtected === "true") return;
    if (element.children.length) return;

    const text = element.textContent || "";
    if (!EMAIL_RE.test(text)) return;
    EMAIL_RE.lastIndex = 0;

    const nextHtml = escapeHtml(text).replace(EMAIL_RE, (email) => {
      const safe = escapeHtml(email);
      return `<span class="ninou-email-token" title="${safe}">${safe}</span>`;
    });

    element.innerHTML = nextHtml;
    element.dataset.ninouEmailProtected = "true";
  }

  function protectEmails(root = document) {
    root.querySelectorAll?.(TEXT_TAGS).forEach(protectEmailText);
  }

  function polishButtons(root = document) {
    root.querySelectorAll?.("button").forEach((button) => {
      if (button.dataset.ninouPremiumShortened === "true") return;
      const current = (button.textContent || "").replace(/\s+/g, " ").trim();
      const replacement = buttonLabels.get(current);
      if (!replacement) return;
      button.dataset.ninouPremiumShortened = "true";
      button.dataset.ninouOriginalLabel = current;
      if (!button.getAttribute("aria-label")) button.setAttribute("aria-label", current);
      button.title = current;

      const symbol = button.querySelector(".nav-symbol, .action-icon, .type-icon");
      if (symbol && button.children.length > 1) {
        const last = Array.from(button.children).reverse().find((child) => child.textContent?.trim());
        if (last) last.textContent = replacement;
      } else {
        button.textContent = replacement;
      }
    });
  }

  function markAdminMode() {
    const adminCard = document.querySelector(".admin-access-card, #adminDiagnosticsCard, .admin-clean-panel");
    const hasAdmin = Boolean(adminCard && !adminCard.hidden);
    document.body.classList.toggle("ninou-premium-admin-ready", hasAdmin);
  }

  function polish(root = document) {
    document.documentElement.dataset.ninouPremium = VERSION;
    protectEmails(root);
    polishButtons(root);
    markAdminMode();
  }

  let scheduled = false;
  function schedulePolish() {
    if (scheduled) return;
    scheduled = true;
    window.requestAnimationFrame(() => {
      scheduled = false;
      polish(document);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => polish(document), { once: true });
  } else {
    polish(document);
  }

  const observer = new MutationObserver(schedulePolish);
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
    characterData: true,
  });

  window.addEventListener("resize", schedulePolish, { passive: true });
})();
