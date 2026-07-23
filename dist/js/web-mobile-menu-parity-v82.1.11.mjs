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
  document.documentElement.classList.add('ninou-web-mobile-menu-parity');
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
else init();
