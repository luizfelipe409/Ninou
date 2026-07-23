const VERSION = "83.0.3";

const qs = (selector, root = document) => root.querySelector(selector);
const qsa = (selector, root = document) => [...root.querySelectorAll(selector)];

function ensureLiveWallpaper() {
  if (qs("#ninouLiveWallpaper")) return;
  const wallpaper = document.createElement("div");
  wallpaper.id = "ninouLiveWallpaper";
  wallpaper.className = "ninou-live-wallpaper";
  wallpaper.setAttribute("aria-hidden", "true");
  wallpaper.innerHTML = `
    <span class="ninou-live-base"></span>
    <span class="ninou-live-glow ninou-live-violet"></span>
    <span class="ninou-live-glow ninou-live-mint"></span>
    <span class="ninou-live-glow ninou-live-gold"></span>
    <span class="ninou-live-ring ninou-live-ring-a"></span>
    <span class="ninou-live-ring ninou-live-ring-b"></span>
    <span class="ninou-live-star ninou-live-star-a">✦</span>
    <span class="ninou-live-star ninou-live-star-b">✧</span>
    <span class="ninou-live-star ninou-live-star-c">✦</span>
  `;
  document.body.prepend(wallpaper);
  document.body.classList.add("ninou-live-wallpaper-enabled");
}

function upgradeSubscriptionPortal() {
  const portal = qs("#subscriptionAccessPortal");
  if (!portal) return;
  const card = qs(".subscription-access-card", portal);
  if (card && !qs(".subscription-access-icon", card)) {
    const mark = qs(".subscription-access-mark", card);
    const icon = document.createElement("span");
    icon.className = "subscription-access-icon";
    icon.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"></circle><path d="M12 7v5l3 2"></path></svg>`;
    mark?.insertAdjacentElement("afterend", icon);
  }
  if (card && !qs(".subscription-access-preserve", card)) {
    const preserve = document.createElement("div");
    preserve.className = "subscription-access-preserve";
    preserve.innerHTML = `<span aria-hidden="true">✓</span><p><strong>Seus registros estão seguros</strong><small>Nenhum dado da rotina é apagado enquanto o acesso estiver pausado.</small></p>`;
    card.append(preserve);
  }

  let updating = false;
  const normalize = () => {
    if (updating || portal.hidden) return;
    updating = true;
    const setText = (node, value) => { if (node && node.textContent !== value) node.textContent = value; };
    const kicker = qs("#subscriptionAccessKicker");
    const title = qs("#subscriptionAccessTitle");
    const message = qs("#subscriptionAccessMessage");
    const validity = qs("#subscriptionAccessValidity");
    const expired = /validade|encerrad|terminou/i.test(`${kicker?.textContent || ""} ${title?.textContent || ""}`);
    if (expired) {
      setText(kicker, "PERÍODO ENCERRADO");
      setText(title, "Acesso encerrado");
      setText(message, "Seus registros continuam preservados. Renove o acesso para retomar a rotina exatamente de onde parou.");
      if (validity && /^Validade:/i.test(validity.textContent || "")) setText(validity, (validity.textContent || "").replace(/^Validade:\s*/i, "Encerrado em "));
    } else {
      setText(kicker, "ACESSO PAUSADO");
      setText(title, "Acesso pausado");
      setText(message, "Os dados da família permanecem preservados enquanto o atendimento revisa a situação do acesso.");
    }
    updating = false;
  };
  new MutationObserver(normalize).observe(portal, { attributes: true, attributeFilter: ["hidden", "aria-hidden"], subtree: true, childList: true, characterData: true });
  normalize();
}

let deleteBypass = false;
let pendingDeleteButton = null;

function ensureDeleteDialog() {
  let modal = qs("#premiumDeleteRecordDialog");
  if (modal) return modal;
  modal = document.createElement("section");
  modal.id = "premiumDeleteRecordDialog";
  modal.className = "premium-delete-record";
  modal.hidden = true;
  modal.setAttribute("aria-hidden", "true");
  modal.innerHTML = `
    <button class="premium-delete-backdrop" type="button" data-delete-dialog-close aria-label="Fechar"></button>
    <article class="premium-delete-card" role="dialog" aria-modal="true" aria-labelledby="premiumDeleteTitle">
      <span class="premium-delete-handle" aria-hidden="true"></span>
      <div class="premium-delete-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24"><path d="M4 7h16"></path><path d="M9 7V4h6v3"></path><path d="M7 7l1 13h8l1-13"></path><path d="M10 11v5M14 11v5"></path></svg>
      </div>
      <span class="premium-delete-kicker">REMOVER DO DIÁRIO</span>
      <h2 id="premiumDeleteTitle">Excluir este registro?</h2>
      <p id="premiumDeleteSummary">Confira o registro antes de removê-lo.</p>
      <div class="premium-delete-detail"><span>Registro selecionado</span><strong id="premiumDeleteDetail">—</strong></div>
      <div class="premium-delete-warning"><span aria-hidden="true">↻</span><p>A remoção será sincronizada com todas as pessoas desta família.</p></div>
      <div class="premium-delete-actions">
        <button type="button" data-delete-dialog-close>Voltar ao diário</button>
        <button type="button" data-delete-dialog-confirm>Remover registro</button>
      </div>
    </article>
  `;
  document.body.append(modal);
  modal.addEventListener("click", (event) => {
    if (event.target.closest("[data-delete-dialog-close]")) {
      closeDeleteDialog();
      return;
    }
    if (!event.target.closest("[data-delete-dialog-confirm]") || !pendingDeleteButton) return;
    const button = pendingDeleteButton;
    closeDeleteDialog();
    deleteBypass = true;
    const previousConfirm = window.confirm;
    window.confirm = () => true;
    try { button.click(); }
    finally {
      window.confirm = previousConfirm;
      deleteBypass = false;
    }
  });
  return modal;
}

function openDeleteDialog(button) {
  const modal = ensureDeleteDialog();
  pendingDeleteButton = button;
  const card = button.closest(".event-card, li, article");
  const lines = String(card?.innerText || "Registro selecionado")
    .split("\n").map((line) => line.trim()).filter(Boolean)
    .filter((line) => !/excluir|corrigir|toque para/i.test(line));
  const detail = lines.slice(0, 3).join(" · ") || "Registro selecionado";
  const detailNode = qs("#premiumDeleteDetail", modal);
  const summaryNode = qs("#premiumDeleteSummary", modal);
  if (detailNode) detailNode.textContent = detail;
  if (summaryNode) summaryNode.textContent = "Esta ação remove o item do histórico da família, mas não altera os demais registros do dia.";
  modal.hidden = false;
  modal.setAttribute("aria-hidden", "false");
  document.body.classList.add("premium-delete-open");
  qs("[data-delete-dialog-confirm]", modal)?.focus();
}

function closeDeleteDialog() {
  const modal = qs("#premiumDeleteRecordDialog");
  if (modal) {
    modal.hidden = true;
    modal.setAttribute("aria-hidden", "true");
  }
  pendingDeleteButton = null;
  document.body.classList.remove("premium-delete-open");
}

function bindDeleteDialog() {
  document.addEventListener("click", (event) => {
    const button = event.target.closest?.("[data-event-delete]");
    if (!button || deleteBypass) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    openDeleteDialog(button);
  }, true);
}

let startBypass = false;
let pendingStartButton = null;

function ensureInitialStateDialog() {
  let modal = qs("#webInitialStateDialog");
  if (modal) return modal;
  modal = document.createElement("section");
  modal.id = "webInitialStateDialog";
  modal.className = "web-initial-state-dialog";
  modal.hidden = true;
  modal.setAttribute("aria-hidden", "true");
  modal.innerHTML = `
    <button class="web-initial-backdrop" type="button" data-initial-close aria-label="Fechar"></button>
    <article class="web-initial-card" role="dialog" aria-modal="true" aria-labelledby="webInitialTitle">
      <span class="web-initial-handle" aria-hidden="true"></span>
      <span class="web-initial-kicker">PRIMEIRO ESTADO DO DIA</span>
      <h2 id="webInitialTitle">Como o bebê está agora?</h2>
      <p>Informe o estado atual e desde que horário. Assim o relógio, a órbita e o resumo começam corretamente.</p>
      <div class="web-initial-segment" role="group" aria-label="Estado atual">
        <button type="button" data-initial-mode="awake"><img src="./icons/actions/acordou.png" alt="" /><span><strong>Acordado</strong><small>Informar quando acordou</small></span></button>
        <button type="button" data-initial-mode="sleeping"><img src="./icons/actions/soneca.png" alt="" /><span><strong>Dormindo</strong><small>Informar quando começou</small></span></button>
      </div>
      <label class="web-initial-time">Horário de referência<input id="webInitialTimeInput" type="time" /></label>
      <small id="webInitialHint" class="web-initial-hint">O horário atual já vem selecionado. Ajuste apenas se o estado começou antes.</small>
      <div class="web-initial-actions"><button type="button" data-initial-close>Cancelar</button><button type="button" data-initial-confirm>Confirmar estado</button></div>
    </article>
  `;
  document.body.append(modal);
  modal.addEventListener("click", (event) => {
    const modeButton = event.target.closest("[data-initial-mode]");
    if (modeButton) {
      modal.dataset.mode = modeButton.dataset.initialMode || "awake";
      qsa("[data-initial-mode]", modal).forEach((item) => item.classList.toggle("active", item === modeButton));
      const hint = qs("#webInitialHint", modal);
      if (hint) hint.textContent = modal.dataset.mode === "sleeping"
        ? "Se o sono começou ontem à noite, escolha o horário correspondente; o Ninou reconhecerá a virada da meia-noite."
        : "Escolha o horário de hoje em que o bebê acordou ou passou a estar acordado.";
      return;
    }
    if (event.target.closest("[data-initial-close]")) {
      closeInitialStateDialog();
      return;
    }
    if (!event.target.closest("[data-initial-confirm]") || !pendingStartButton) return;
    const value = String(qs("#webInitialTimeInput", modal)?.value || "").trim();
    if (!/^\d{2}:\d{2}$/.test(value)) {
      qs("#webInitialTimeInput", modal)?.focus();
      return;
    }
    const button = pendingStartButton;
    closeInitialStateDialog();
    startBypass = true;
    const previousPrompt = window.prompt;
    window.prompt = () => value;
    try { button.click(); }
    finally {
      window.prompt = previousPrompt;
      startBypass = false;
    }
  });
  return modal;
}

function openInitialStateDialog(button) {
  const modal = ensureInitialStateDialog();
  pendingStartButton = button;
  const requestedMode = button.dataset.startMode === "sleeping" ? "sleeping" : "awake";
  modal.dataset.mode = requestedMode;
  qsa("[data-initial-mode]", modal).forEach((item) => item.classList.toggle("active", item.dataset.initialMode === requestedMode));
  const now = new Date();
  const value = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  const input = qs("#webInitialTimeInput", modal);
  if (input) input.value = value;
  const title = qs("#webInitialTitle", modal);
  if (title) title.textContent = requestedMode === "sleeping" ? "Desde quando está dormindo?" : "Que horas acordou?";
  const hint = qs("#webInitialHint", modal);
  if (hint) hint.textContent = requestedMode === "sleeping"
    ? "Se o sono começou ontem à noite, escolha o horário correspondente; o Ninou reconhecerá a virada da meia-noite."
    : "O horário atual já vem selecionado. Ajuste apenas se o bebê acordou antes.";
  modal.hidden = false;
  modal.setAttribute("aria-hidden", "false");
  document.body.classList.add("web-initial-open");
  input?.focus();
}

function closeInitialStateDialog() {
  const modal = qs("#webInitialStateDialog");
  if (modal) {
    modal.hidden = true;
    modal.setAttribute("aria-hidden", "true");
  }
  pendingStartButton = null;
  document.body.classList.remove("web-initial-open");
}

function upgradeFirstRoutinePrompt(root = document) {
  const modal = qs("#firstRoutineStatePrompt", root) || (root.id === "firstRoutineStatePrompt" ? root : null);
  if (!modal || modal.dataset.webUpgrade === VERSION) return;
  modal.dataset.webUpgrade = VERSION;
  qs(".first-routine-now", modal)?.remove();
  const title = qs("#firstRoutineTitle", modal);
  const copy = qs(".first-routine-card > p", modal);
  const small = qs(".first-routine-card > small", modal);
  if (title) title.textContent = "Como o bebê está agora?";
  if (copy) copy.textContent = "Escolha o estado atual e informe desde que horário. Não é necessário criar uma terceira opção para começar agora.";
  if (small) small.textContent = "O horário atual já vem selecionado; ajuste somente quando o estado começou antes.";
  const awake = qs('[data-first-routine-mode="awake"]', modal);
  const sleeping = qs('[data-first-routine-mode="sleeping"]', modal);
  if (awake) awake.innerHTML = `<img src="./icons/actions/acordou.png" alt="" /><span><strong>Acordado</strong><small>Desde o horário informado</small></span>`;
  if (sleeping) sleeping.innerHTML = `<img src="./icons/actions/soneca.png" alt="" /><span><strong>Dormindo</strong><small>Desde o horário informado</small></span>`;
}

function upgradeInitialRoutineFlow() {
  const nowButton = qs('[data-start-mode="now"]');
  nowButton?.remove();
  const awake = qs('[data-start-mode="awake"]');
  const sleeping = qs('[data-start-mode="sleeping"]');
  if (awake) awake.querySelector(":scope > span:last-child").innerHTML = `<strong>Está acordado</strong><small>Informe que horas acordou</small>`;
  if (sleeping) sleeping.querySelector(":scope > span:last-child").innerHTML = `<strong>Está dormindo</strong><small>Informe quando o sono começou</small>`;

  document.addEventListener("click", (event) => {
    const button = event.target.closest?.("#startChoice [data-start-mode]");
    if (!button || startBypass) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    openInitialStateDialog(button);
  }, true);

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (!(node instanceof Element)) continue;
        if (node.id === "firstRoutineStatePrompt" || node.querySelector?.("#firstRoutineStatePrompt")) upgradeFirstRoutinePrompt(node);
      }
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
  upgradeFirstRoutinePrompt();
}

const roleCopy = {
  admin_familiar: { title: "Responsável adicional", text: "Pode registrar cuidados, editar o perfil, convidar pessoas e administrar a família." },
  cuidador: { title: "Cuidador", text: "Pode registrar e corrigir a rotina, mas não altera configurações da família nem cria convites." },
  visualizacao: { title: "Somente visualização", text: "Pode acompanhar a rotina e os relatórios, sem criar, editar ou excluir registros." },
};

function upgradeRoleSelector() {
  const select = qs("#familyInviteRoleSelect");
  if (!select) return;
  const labels = {
    admin_familiar: "Responsável adicional — administra e registra",
    cuidador: "Cuidador — registra e corrige",
    visualizacao: "Somente visualização — não altera dados",
  };
  qsa("option", select).forEach((option) => { if (labels[option.value]) option.textContent = labels[option.value]; });
  let helper = qs("#familyInviteRoleExplanation");
  if (!helper) {
    helper = document.createElement("div");
    helper.id = "familyInviteRoleExplanation";
    helper.className = "family-role-explanation";
    select.closest("label")?.insertAdjacentElement("afterend", helper);
  }
  const render = () => {
    const copy = roleCopy[select.value] || roleCopy.cuidador;
    helper.innerHTML = `<span aria-hidden="true">${select.value === "visualizacao" ? "◉" : select.value === "admin_familiar" ? "♢" : "✦"}</span><p><strong>${copy.title}</strong><small>${copy.text}</small></p>`;
  };
  select.addEventListener("change", render);
  render();
}

function upgradeProfileForm() {
  const name = qs("#babyNameInput");
  const birth = qs("#babyBirthInput");
  const article = qs("#babyArticleInput");
  const card = name?.closest(".profile-family-card");
  if (card && !qs("#saveBabyIdentityButton", card)) {
    const actions = document.createElement("div");
    actions.className = "profile-actions-row web-profile-save-row";
    actions.innerHTML = `<button id="saveBabyIdentityButton" class="profile-primary-button" type="button">Salvar dados do diário</button><small id="saveBabyIdentityStatus" aria-live="polite">As alterações também são salvas automaticamente.</small>`;
    qs(".profile-edit-grid", card)?.insertAdjacentElement("afterend", actions);
    qs("#saveBabyIdentityButton", actions)?.addEventListener("click", () => {
      name?.dispatchEvent(new Event("input", { bubbles: true }));
      birth?.dispatchEvent(new Event("change", { bubbles: true }));
      article?.dispatchEvent(new Event("change", { bubbles: true }));
      document.activeElement?.blur?.();
      const status = qs("#saveBabyIdentityStatus", actions);
      if (status) {
        status.textContent = "Dados salvos e prontos para sincronização.";
        status.dataset.state = "success";
        window.setTimeout(() => {
          status.textContent = "As alterações também são salvas automaticamente.";
          delete status.dataset.state;
        }, 2600);
      }
    });
  }
  [birth, qs("#newFamilyBabyBirthInput")].filter(Boolean).forEach((input) => {
    input.classList.add("modern-date-input");
    input.setAttribute("aria-label", input.getAttribute("aria-label") || "Escolher data de nascimento");
  });
  [qs("#caregiverRelationInput"), qs("#newFamilyResponsibleRelationInput")].filter(Boolean).forEach((select) => select.classList.add("modern-relation-select"));
}

function upgradeFamilyWizard() {
  const wizard = qs("#createFamilyWizard");
  if (!wizard || qs(".web-family-wizard-note", wizard)) return;
  const note = document.createElement("div");
  note.className = "web-family-wizard-note";
  note.innerHTML = `<span aria-hidden="true">♡</span><p><strong>Responsável principal</strong><small>Quem cria a família administra o acesso. Depois, poderá convidar responsável adicional, cuidador ou pessoa com acesso somente para visualização.</small></p>`;
  qs(".create-family-head", wizard)?.insertAdjacentElement("afterend", note);
}

function upgradeFamilyLabels() {
  const apply = () => {
    const access = qs("#familyAccessTypeLabel");
    if (access) {
      const text = String(access.textContent || "").trim().toLowerCase();
      if (text === "admin familiar" || text === "admin_familiar") access.textContent = "Responsável adicional";
      if (text === "visualizacao" || text === "visualização") access.textContent = "Somente visualização";
    }
    qsa(".family-access-role-badge, .client-family-member small").forEach((node) => {
      const current = String(node.textContent || "");
      const next = current
        .replace(/admin_familiar|admin familiar/gi, "Responsável adicional")
        .replace(/visualizacao|visualização/gi, "Somente visualização")
        .replace(/owner/gi, "Responsável principal")
        .replace(/active/gi, "Ativo");
      if (next !== current) node.textContent = next;
    });
  };
  new MutationObserver(apply).observe(document.body, { childList: true, subtree: true, characterData: true });
  apply();
}

function boot() {
  ensureLiveWallpaper();
  upgradeSubscriptionPortal();
  bindDeleteDialog();
  upgradeInitialRoutineFlow();
  upgradeRoleSelector();
  upgradeProfileForm();
  upgradeFamilyWizard();
  upgradeFamilyLabels();
  document.documentElement.dataset.ninouWebExperience = VERSION;
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, { once: true });
else boot();
