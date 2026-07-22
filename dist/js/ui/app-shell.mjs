/* Ninou 83.0.2 — shell visual único da web. */
import { initActionLauncher } from './action-launcher.js';

const q = (selector, root = document) => root.querySelector(selector);
const qa = (selector, root = document) => [...root.querySelectorAll(selector)];

const icons = {
  home: (filled = false) => filled
    ? '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2.7 2.8 10v10.2c0 .6.5 1.1 1.1 1.1h5.4v-6.4c0-.6.5-1.1 1.1-1.1h3.2c.6 0 1.1.5 1.1 1.1v6.4h5.4c.6 0 1.1-.5 1.1-1.1V10L12 2.7Z"/></svg>'
    : '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7h-6v7H4a1 1 0 0 1-1-1V10Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"/></svg>',
  reader: (filled = false) => filled
    ? '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M5 2.5h14A2.5 2.5 0 0 1 21.5 5v14a2.5 2.5 0 0 1-2.5 2.5H5A2.5 2.5 0 0 1 2.5 19V5A2.5 2.5 0 0 1 5 2.5Zm2.2 5.2h9.6a.9.9 0 1 0 0-1.8H7.2a.9.9 0 1 0 0 1.8Zm0 4.2h9.6a.9.9 0 1 0 0-1.8H7.2a.9.9 0 1 0 0 1.8Zm0 4.2h6.2a.9.9 0 1 0 0-1.8H7.2a.9.9 0 1 0 0 1.8Z"/></svg>'
    : '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2.5" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M7 7h10M7 11h10M7 15h6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
  stats: (filled = false) => filled
    ? '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M4 19.5h16a1 1 0 1 1 0 2H3a1 1 0 0 1-1-1v-17a1 1 0 1 1 2 0v16Zm2.2-2.1V12c0-.6.5-1.1 1.1-1.1h1.5c.6 0 1.1.5 1.1 1.1v5.4H6.2Zm5.3 0V7.9c0-.6.5-1.1 1.1-1.1h1.5c.6 0 1.1.5 1.1 1.1v9.5h-3.7Zm5.3 0V4.8c0-.6.5-1.1 1.1-1.1h1.5c.6 0 1.1.5 1.1 1.1v12.6h-3.7Z"/></svg>'
    : '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 3v18h18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><rect x="6" y="12" width="3" height="6" rx=".8" fill="none" stroke="currentColor" stroke-width="1.6"/><rect x="11" y="8" width="3" height="10" rx=".8" fill="none" stroke="currentColor" stroke-width="1.6"/><rect x="16" y="4" width="3" height="14" rx=".8" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>',
  music: (filled = false) => filled
    ? '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M19.6 2.2a1 1 0 0 1 1.2 1v12.1a3.8 3.8 0 1 1-2-3.3V7.4l-8 1.8v8.1a3.8 3.8 0 1 1-2-3.3V6.5a1 1 0 0 1 .8-1l10-2.3Z"/></svg>'
    : '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 18V6l11-2v12M9 9l11-2" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><ellipse cx="6" cy="18" rx="3" ry="2.4" fill="none" stroke="currentColor" stroke-width="1.8"/><ellipse cx="17" cy="16" rx="3" ry="2.4" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>',
  person: (filled = false) => filled
    ? '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 4.2a3.4 3.4 0 1 1 0 6.8 3.4 3.4 0 0 1 0-6.8Zm0 14a8.2 8.2 0 0 1-6.1-2.7c.7-2.2 3.1-3.7 6.1-3.7s5.4 1.5 6.1 3.7a8.2 8.2 0 0 1-6.1 2.7Z"/></svg>'
    : '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9.5" fill="none" stroke="currentColor" stroke-width="1.7"/><circle cx="12" cy="9" r="3" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M6.6 18.2c.9-2.6 2.9-4 5.4-4s4.5 1.4 5.4 4" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>',
  document: () => '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3h7l4 4v14H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M14 3v5h5M9 12h6M9 16h6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
  plusCircle: () => '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M12 8v8M8 12h8" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
  sun: () => '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
  moon: () => '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.4 15.3A8.7 8.7 0 0 1 8.7 3.6 8.8 8.8 0 1 0 20.4 15.3Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>',
  phone: () => '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="7" y="2.5" width="10" height="19" rx="2" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M10 5h4M11 18.5h2" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
  cloud: () => '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7.2 18.5h10.6a3.7 3.7 0 0 0 .5-7.4A6.2 6.2 0 0 0 6.5 9.4a4.6 4.6 0 0 0 .7 9.1Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="m9.5 14.2 1.7 1.7 3.5-3.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  logout: () => '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 4H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h5M14 8l4 4-4 4M18 12H8" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  chevron: () => '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 6 6 6-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
};

const navIconByTarget = { today: 'home', diary: 'reader', trends: 'stats', sounds: 'music', profile: 'person' };

function hydrateBottomNav() {
  qa('#bottomBar .bottom-nav > button[data-target]').forEach((button) => {
    const iconName = navIconByTarget[button.dataset.target];
    const symbol = q('.nav-symbol', button);
    const label = q('span:last-child', button);
    if (label) label.classList.add('nav-label');
    if (symbol && icons[iconName]) symbol.innerHTML = icons[iconName](button.classList.contains('active'));
    button.setAttribute('role', 'tab');
    button.setAttribute('aria-selected', button.classList.contains('active') ? 'true' : 'false');
  });
}

function refreshBottomNavState() {
  qa('#bottomBar .bottom-nav > button[data-target]').forEach((button) => {
    const active = button.classList.contains('active');
    const iconName = navIconByTarget[button.dataset.target];
    const symbol = q('.nav-symbol', button);
    button.setAttribute('aria-selected', active ? 'true' : 'false');
    if (symbol && icons[iconName]) symbol.innerHTML = icons[iconName](active);
  });
}

function openScreen(target) {
  const button = q(`#bottomBar .bottom-nav > button[data-target="${target}"]`);
  button?.click();
}

function getThemeMode() {
  const value = q('#themeModeInput')?.value || localStorage.getItem('ninou.demo.themeMode') || 'dark';
  return value === 'auto' ? 'system' : value;
}

function refreshThemeChoices() {
  const current = getThemeMode();
  qa('[data-avatar-theme]').forEach((button) => {
    button.setAttribute('aria-pressed', button.dataset.avatarTheme === current ? 'true' : 'false');
  });
}

function setTheme(mode) {
  const input = q('#themeModeInput');
  const webMode = mode === 'system' ? 'auto' : mode;
  if (input) {
    input.value = webMode;
    input.dispatchEvent(new Event('change', { bubbles: true }));
  } else {
    localStorage.setItem('ninou.demo.themeMode', webMode);
    document.body.classList.toggle('day-theme', webMode === 'light');
  }
  refreshThemeChoices();
}

function refreshMenuIdentity() {
  const headerAvatar = q('.app-header .identity img');
  const menuAvatar = q('#avatarQuickMenuPhoto');
  if (headerAvatar && menuAvatar && menuAvatar.src !== headerAvatar.src) menuAvatar.src = headerAvatar.src;

  const profileName = (q('#profileBabyName')?.textContent || '').trim();
  const diaryTitle = (q('#diaryTitle')?.textContent || '').trim();
  const inferredName = profileName && profileName !== 'Bebê'
    ? profileName
    : diaryTitle.replace(/^Diário\s+(?:do|da)\s+/i, '').trim() || 'Seu bebê';
  const menuName = q('#avatarQuickMenuName');
  if (menuName) menuName.textContent = inferredName;

  const role = (q('#familyAccessSummaryRole')?.textContent || q('#familyAccessSummaryRoleBadge')?.textContent || 'Familiar').trim();
  const user = (q('#familyAccessSummaryUser')?.textContent || q('#loginEmail')?.value || 'Conta familiar').trim();
  const menuMeta = q('#avatarQuickMenuMeta');
  if (menuMeta) menuMeta.textContent = [role, user].filter(Boolean).join(' · ');

  const syncPill = q('.app-header .sync-pill');
  const syncTitle = q('#avatarQuickMenuSyncTitle');
  const status = (syncPill?.textContent || 'Neste aparelho').trim();
  if (syncTitle) syncTitle.textContent = status;
  const synchronized = !/off|pendente|conectando|carregando/i.test(status);
  q('#avatarQuickMenuStatusDot')?.classList.toggle('is-pending', !synchronized);
  q('#avatarQuickMenuCloud')?.classList.toggle('is-pending', !synchronized);

  const reportsButton = q('[data-avatar-action="reports"]');
  const exportButton = q('#exportPdfButton');
  if (reportsButton) reportsButton.hidden = !exportButton || exportButton.disabled || exportButton.closest('[hidden]');
}

function openAvatarMenu() {
  const menu = q('#avatarQuickMenu');
  const trigger = q('#avatarMenuTrigger');
  if (!menu || !trigger) return;
  refreshMenuIdentity();
  refreshThemeChoices();
  menu.hidden = false;
  document.body.classList.add('avatar-quick-menu-open');
  trigger.setAttribute('aria-expanded', 'true');
  requestAnimationFrame(() => q('#avatarQuickMenuClose')?.focus({ preventScroll: true }));
}

function closeAvatarMenu({ restoreFocus = true } = {}) {
  const menu = q('#avatarQuickMenu');
  const trigger = q('#avatarMenuTrigger');
  if (!menu || menu.hidden) return;
  menu.hidden = true;
  document.body.classList.remove('avatar-quick-menu-open');
  trigger?.setAttribute('aria-expanded', 'false');
  if (restoreFocus) trigger?.focus({ preventScroll: true });
}

function openReports() {
  closeAvatarMenu({ restoreFocus: false });
  openScreen('profile');
  window.setTimeout(() => {
    const target = q('#exportPdfButton')?.closest('.profile-family-card, article, section') || q('#exportPdfButton');
    target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 120);
}

function signOut() {
  closeAvatarMenu({ restoreFocus: false });
  const accountButton = q('#createAccountButton');
  if (accountButton && /sair/i.test(accountButton.textContent || '')) {
    accountButton.click();
    return;
  }
  const leaveButton = q('#familyLeaveButton:not([hidden])');
  if (leaveButton) {
    leaveButton.click();
    return;
  }
  q('#subscriptionSignOutButton')?.click();
}

function bindMenu() {
  q('#avatarMenuTrigger')?.addEventListener('click', openAvatarMenu);
  q('#avatarQuickMenuClose')?.addEventListener('click', () => closeAvatarMenu());
  q('[data-close-avatar-quick-menu]')?.addEventListener('click', () => closeAvatarMenu());

  qa('[data-avatar-target]').forEach((button) => button.addEventListener('click', () => {
    const target = button.dataset.avatarTarget;
    closeAvatarMenu({ restoreFocus: false });
    if (target) openScreen(target);
  }));

  q('[data-avatar-action="new-record"]')?.addEventListener('click', () => {
    closeAvatarMenu({ restoreFocus: false });
    q('#openActionLauncherButton')?.click();
  });
  q('[data-avatar-action="reports"]')?.addEventListener('click', openReports);
  q('#avatarQuickMenuSignOut')?.addEventListener('click', signOut);
  qa('[data-avatar-theme]').forEach((button) => button.addEventListener('click', () => setTheme(button.dataset.avatarTheme || 'dark')));

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !q('#avatarQuickMenu')?.hidden) closeAvatarMenu();
  });
}

function installObservers() {
  const nav = q('#bottomBar .bottom-nav');
  if (nav) new MutationObserver(refreshBottomNavState).observe(nav, { subtree: true, attributes: true, attributeFilter: ['class'] });

  const identitySources = [q('#diaryTitle'), q('#profileBabyName'), q('.app-header .sync-pill'), q('#familyAccessSummaryRole'), q('#familyAccessSummaryRoleBadge'), q('#familyAccessSummaryUser'), q('.app-header .identity img')].filter(Boolean);
  identitySources.forEach((element) => new MutationObserver(refreshMenuIdentity).observe(element, { subtree: true, childList: true, attributes: true, characterData: true }));
  q('#themeModeInput')?.addEventListener('change', refreshThemeChoices);
}

function hydrateMenuIcons() {
  const iconMap = {
    profile: icons.person(false), diary: icons.reader(false), trends: icons.stats(false), sounds: icons.music(false), reports: icons.document(), newRecord: icons.plusCircle(),
  };
  Object.entries(iconMap).forEach(([key, svg]) => {
    const node = q(`[data-avatar-icon="${key}"]`);
    if (node) node.innerHTML = svg;
  });
  const themeMap = { light: icons.sun(), dark: icons.moon(), system: icons.phone() };
  Object.entries(themeMap).forEach(([key, svg]) => {
    const node = q(`[data-avatar-theme="${key}"] .avatar-theme-icon`);
    if (node) node.innerHTML = svg;
  });
  const cloud = q('#avatarQuickMenuCloud');
  if (cloud) cloud.innerHTML = icons.cloud();
  const logout = q('#avatarQuickMenuSignOut > .avatar-menu-signout-icon');
  if (logout) logout.innerHTML = icons.logout();
  const chevron = q('#avatarQuickMenuSignOut > .avatar-menu-chevron');
  if (chevron) chevron.innerHTML = icons.chevron();
}

function init() {
  hydrateBottomNav();
  hydrateMenuIcons();
  bindMenu();
  installObservers();
  refreshMenuIdentity();
  refreshThemeChoices();
  document.documentElement.classList.add('ninou-app-shell-ready');
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
else init();


const VERSION = "83.0.2";

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


if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initActionLauncher, { once: true });
} else {
  initActionLauncher();
}
