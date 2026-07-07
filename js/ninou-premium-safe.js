/* Ninou v75.75.30 — acabamento seguro de interface
   Protege e-mails e encurta rótulos longos sem remover botões/cards. */
(() => {
  const VERSION = "75.75.30";
  const EMAIL_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
  const TEXT_TAGS = "strong,small,span,p,em,li,b";
  const SKIP_SELECTOR = "script,style,textarea,input,select,option,button,.ninou-email-token";

  const buttonLabels = new Map([
    ["Abrir rotina da família selecionada", "Abrir rotina"],
    ["Gerenciar membros", "Membros"],
    ["Criar convite", "Convite"],
    ["Revisar migração", "Migração"],
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
    element.innerHTML = escapeHtml(text).replace(EMAIL_RE, (email) => {
      const safe = escapeHtml(email);
      return `<span class="ninou-email-token" title="${safe}">${safe}</span>`;
    });
    element.dataset.ninouEmailProtected = "true";
  }

  function protectEmails(root = document) {
    root.querySelectorAll?.(TEXT_TAGS).forEach(protectEmailText);
  }

  function polishButtons(root = document) {
    root.querySelectorAll?.("button").forEach((button) => {
      if (button.dataset.ninouSafeShortened === "true") return;
      const current = (button.textContent || "").replace(/\s+/g, " ").trim();
      const replacement = buttonLabels.get(current);
      if (!replacement) return;
      button.dataset.ninouSafeShortened = "true";
      button.dataset.ninouOriginalLabel = current;
      if (!button.getAttribute("aria-label")) button.setAttribute("aria-label", current);
      button.title = current;
      button.textContent = replacement;
    });
  }

  function polish(root = document) {
    document.documentElement.dataset.ninouPremiumSafe = VERSION;
    protectEmails(root);
    polishButtons(root);
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

  new MutationObserver(schedulePolish).observe(document.documentElement, {
    childList: true,
    subtree: true,
    characterData: true,
  });
})();
