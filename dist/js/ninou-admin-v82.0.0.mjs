import {
  ADMIN_WEB_VERSION,
  createAdminFamily,
  createAdminInvite,
  loadAdminWorkspace,
  logIntegrityCheck,
  transferAdminOwnership,
  updateAdminFamily,
  updateAdminInvite,
  updateAdminMember,
  updateAdminTicket,
  updateAdminUser,
} from './services/admin-service.js';

let initialized = false;
let workspace = null;
let activeSection = 'overview';
let searchTerm = '';
let familyFilter = 'all';
let selectedFamilyId = '';
let pendingConfirmation = null;
let apiRef = null;
let sessionTimer = 0;
let sessionEndsAt = 0;
let modalCloseTimer = 0;
let familyFeedback = null;

const $ = (selector, root = document) => root.querySelector(selector);
const escapeHtml = (value = '') => String(value ?? '').replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character]));
const formatDate = (value, withTime = false) => value ? new Intl.DateTimeFormat('pt-BR', withTime ? { dateStyle: 'short', timeStyle: 'short' } : { dateStyle: 'short' }).format(new Date(value)) : 'Sem registro';
const initials = (value = '') => String(value).split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'N';
const planLabels = { trial: 'Teste', premium: 'Premium', courtesy: 'Cortesia', suspended: 'Suspenso' };
const roleLabels = { owner: 'Responsável principal', responsavel: 'Responsável principal', admin_familiar: 'Administrador familiar', cuidador: 'Cuidador', caregiver: 'Cuidador', visualizacao: 'Somente leitura' };
const statusLabels = { active: 'Ativa', suspended: 'Suspensa', archived: 'Arquivada', blocked: 'Bloqueado', pending: 'Pendente', expired: 'Expirado', cancelled: 'Cancelado', open: 'Aberto', in_progress: 'Em atendimento', resolved: 'Resolvido', rejected: 'Recusado' };
const uniqueTextItems = (items = []) => [...new Set(items.map((item) => String(item || '').trim()).filter(Boolean))];
const eventLabels = { sono: 'Sono', dormir: 'Sono', soneca: 'Soneca', amamentacao: 'Amamentação', mamadeira: 'Mamadeira', fralda: 'Fralda', banho: 'Banho', remedio: 'Medicamento', medicamento: 'Medicamento', observacao: 'Observação' };
const normalizeAdminRole = (value = '') => ['owner','responsavel','responsável','pai','mae','mãe'].includes(String(value).toLowerCase()) ? 'owner' : ['admin','manager','gestor'].includes(String(value).toLowerCase()) ? 'admin_familiar' : String(value || 'cuidador').toLowerCase();

function getSubscriptionSummary(family) {
  const until = family.plan === 'trial' ? family.trialEndsAt : family.premiumUntil;
  if (family.plan === 'suspended') return { until: 0, remaining: 0, text: 'Acesso suspenso' };
  if (!until) return { until: 0, remaining: 0, text: 'Sem validade definida' };
  const remaining = Math.max(0, Math.ceil((until - Date.now()) / 86400000));
  return { until, remaining, text: until <= Date.now() ? `Expirou em ${formatDate(until)}` : `Válido até ${formatDate(until)} · ${remaining} dia(s) restante(s)` };
}

function formatEventTime(value) {
  return value ? new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(new Date(value)) : 'Sem horário';
}

function eventDescription(event = {}) {
  const label = eventLabels[event.type] || event.type || 'Registro';
  const range = event.end && event.end > event.start ? `${formatEventTime(event.start)}–${formatEventTime(event.end)}` : formatEventTime(event.start);
  const extras = [event.amount || event.volume ? `${event.amount || event.volume} ml` : '', event.side ? `lado ${event.side}` : '', event.note || event.notes || ''].filter(Boolean);
  return `${label} · ${range}${extras.length ? ` · ${extras.join(' · ')}` : ''}`;
}

function integrityIssuesMessage(family) {
  const count = uniqueTextItems(family?.integrityIssues).length;
  return count ? `Diagnóstico concluído: ${count} ponto(s) exibido(s) abaixo e registrado(s) na auditoria.` : 'Diagnóstico concluído: 7 verificações aprovadas e resultado registrado na auditoria.';
}

function adminOperation(name, fallback, ...args) {
  return (apiRef?.[name] || fallback)(...args);
}

const iconPaths = {
  shield: '<path d="M12 3 4.5 6v5.2c0 4.7 3.2 8.2 7.5 9.8 4.3-1.6 7.5-5.1 7.5-9.8V6L12 3Z"/><path d="m8.5 12 2.2 2.2 4.8-5"/>',
  grid: '<rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><rect x="14" y="14" width="6" height="6" rx="1"/>',
  home: '<path d="m3 11 9-7 9 7"/><path d="M5.5 9.5V20h13V9.5M9 20v-6h6v6"/>',
  users: '<path d="M16 20v-1.5c0-2.5-2.2-4.5-5-4.5s-5 2-5 4.5V20"/><circle cx="11" cy="8" r="3.5"/><path d="M17 5.4a3 3 0 0 1 0 5.7M18.5 14.2c1.8.7 2.5 2.1 2.5 3.8v2"/>',
  headset: '<path d="M4 13v-1a8 8 0 0 1 16 0v1"/><path d="M6.5 12.5H4.8A1.8 1.8 0 0 0 3 14.3v2.4a1.8 1.8 0 0 0 1.8 1.8H7v-6ZM17.5 12.5h1.7a1.8 1.8 0 0 1 1.8 1.8v2.4a1.8 1.8 0 0 1-1.8 1.8H17v-6ZM17 18.5c-.8 1.5-2.2 2-4 2"/>',
  refresh: '<path d="M20 6v5h-5"/><path d="M18.4 16.5A8 8 0 1 1 20 11"/>',
  logout: '<path d="M10 5H5v14h5M14 8l4 4-4 4M18 12H9"/>',
  time: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  plus: '<circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/>',
  chat: '<path d="M20 11.5a7.5 7.5 0 0 1-8 7.5 9 9 0 0 1-3.7-.9L4 20l1.3-4A7.2 7.2 0 0 1 4 12.5a7.5 7.5 0 0 1 8-7.5 7.5 7.5 0 0 1 8 6.5Z"/><path d="M8.5 12h.1M12 12h.1M15.5 12h.1"/>',
  pulse: '<path d="M3 12h4l2-5 4 10 2-5h6"/>',
  check: '<circle cx="12" cy="12" r="9"/><path d="m8 12 2.6 2.6L16.5 9"/>',
  chevron: '<path d="m9 6 6 6-6 6"/>',
  search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4 4"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/>',
  warning: '<path d="M12 3 2.8 20h18.4L12 3Z"/><path d="M12 9v5M12 17h.01"/>',
  card: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18M7 15h4"/>',
  eye: '<path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6S2.5 12 2.5 12Z"/><circle cx="12" cy="12" r="2.5"/>',
  sparkles: '<path d="m12 3 1.2 3.8L17 8l-3.8 1.2L12 13l-1.2-3.8L7 8l3.8-1.2L12 3ZM5 14l.8 2.2L8 17l-2.2.8L5 20l-.8-2.2L2 17l2.2-.8L5 14ZM19 13l.6 1.4L21 15l-1.4.6L19 17l-.6-1.4L17 15l1.4-.6L19 13Z"/>',
  send: '<path d="m3 11 18-8-7.5 18-2.2-7.3L3 11Z"/><path d="m11.3 13.7 4-4"/>',
  planet: '<circle cx="12" cy="12" r="5"/><path d="M3.5 16.5c-1-1.7 2-5.4 6.6-8.1 4.6-2.6 9-3.2 10-1.5 1 1.7-2 5.4-6.6 8.1-4.6 2.6-9 3.2-10 1.5Z"/>',
  download: '<path d="M12 3v12M8 11l4 4 4-4M4 20h16"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19 13.5v-3l-2-.7a7 7 0 0 0-.7-1.7l.9-1.9-2.1-2.1-1.9.9a7 7 0 0 0-1.7-.7L10.5 2h-3l-.7 2a7 7 0 0 0-1.7.7l-1.9-.9-2.1 2.1.9 1.9a7 7 0 0 0-.7 1.7L0 10.5v3l2 .7c.2.6.4 1.2.7 1.7l-.9 1.9 2.1 2.1 1.9-.9c.5.3 1.1.5 1.7.7l.7 2h3l.7-2c.6-.2 1.2-.4 1.7-.7l1.9.9 2.1-2.1-.9-1.9c.3-.5.5-1.1.7-1.7l1.5-.7Z" transform="translate(2) scale(.83)"/>',
  close: '<path d="m6 6 12 12M18 6 6 18"/>',
  lock: '<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
  person: '<circle cx="12" cy="8" r="4"/><path d="M4.5 21c.7-4.2 3.2-6.5 7.5-6.5s6.8 2.3 7.5 6.5"/>',
  trash: '<path d="M4 7h16M9 7V4h6v3M7 7l1 14h8l1-14M10 11v6M14 11v6"/>',
  fingerprint: '<path d="M8 11a4 4 0 0 1 8 0c0 5-1 8-3 10M5 13c0-5 2.5-8 7-8s7 3 7 8c0 2-.2 4-.7 6M9 14c0 3-.4 5.2-1.3 7M12 9.5a2.5 2.5 0 0 1 2.5 2.5c0 4-.5 6.8-1.5 9"/>',
  share: '<circle cx="18" cy="5" r="2"/><circle cx="6" cy="12" r="2"/><circle cx="18" cy="19" r="2"/><path d="m8 11 8-5M8 13l8 5"/>',
  scan: '<path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5"/><path d="M8 12h8"/>',
};

function icon(name, size = 18) {
  return `<svg class="premium-admin-icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${iconPaths[name] || iconPaths.shield}</svg>`;
}

function status(value = '') {
  const tone = ['active', 'resolved', 'accepted'].includes(value) ? 'good' : ['pending', 'open', 'in_progress', 'trialing'].includes(value) ? 'warn' : 'danger';
  return `<span class="premium-admin-status" data-tone="${tone}"><i></i>${escapeHtml(statusLabels[value] || value)}</span>`;
}

function resetSession() {
  window.clearTimeout(sessionTimer);
  sessionEndsAt = Date.now() + 30 * 60 * 1000;
  sessionTimer = window.setTimeout(() => apiRef?.signOutAccount?.(), 30 * 60 * 1000);
  const session = $('#premiumAdminSession');
  if (session) session.innerHTML = `${icon('time', 15)}<span>Sessão protegida até ${new Date(sessionEndsAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>`;
}

function showNotice(message = '', tone = 'success') {
  const node = $('#premiumAdminNotice');
  if (!node) return;
  node.hidden = !message;
  node.dataset.tone = tone;
  node.innerHTML = message ? `${icon(tone === 'error' ? 'warning' : 'check', 20)}<span>${escapeHtml(message)}</span><button type="button" data-admin-action="dismiss-notice" aria-label="Fechar">${icon('close', 18)}</button>` : '';
}

function shellMarkup(user) {
  return `<div class="premium-admin-background" aria-hidden="true"><i></i><i></i><i></i><b>✦</b><b>✧</b></div>
    <div class="premium-admin-safe"><div class="premium-admin-scroll">
      <header class="premium-admin-topbar"><div class="premium-admin-brand"><span class="premium-admin-brandmark">${icon('shield', 22)}</span><div><strong>Ninou Admin</strong><small>OPERAÇÃO PREMIUM</small></div></div><div class="premium-admin-top-actions"><button type="button" data-admin-action="refresh" aria-label="Atualizar painel">${icon('refresh', 20)}</button><button type="button" data-admin-action="logout" aria-label="Sair">${icon('logout', 20)}</button></div></header>
      <section class="premium-admin-hero"><div class="premium-admin-hero-top"><span class="premium-admin-connected"><i></i>ADMIN GLOBAL</span><small>${ADMIN_WEB_VERSION}</small></div><h1>Centro de operação</h1><p>Gerencie clientes, acessos, planos e suporte sem criar uma família pessoal para o administrador.</p><span id="premiumAdminSession" class="premium-admin-session">${icon('time', 15)}<span>Sessão protegida</span></span></section>
      <div id="premiumAdminNotice" class="premium-admin-notice" hidden></div>
      <nav class="premium-admin-tabs" aria-label="Seções administrativas">${[['overview','Visão geral','grid'],['families','Famílias','home'],['users','Usuários','users'],['support','Suporte','headset'],['audit','Auditoria','shield']].map(([id,label,glyph]) => `<button type="button" data-admin-tab="${id}">${icon(glyph,16)}<span>${label}</span><b data-admin-count="${id}" hidden></b></button>`).join('')}</nav>
      <main id="premiumAdminContent" class="premium-admin-content"><div class="premium-admin-loading"><i></i><span>Montando o centro administrativo…</span></div></main>
    </div></div>
    <div id="premiumAdminModal" class="premium-admin-modal" hidden></div>
    <div id="premiumAdminConfirmModal" class="premium-admin-modal premium-admin-confirm-layer" hidden></div>
    <div id="premiumAdminBusy" class="premium-admin-busy-overlay" hidden><i></i></div>`;
}

function sectionTitle(kicker, heading, subtitle, action = '') {
  return `<header class="premium-admin-section-title"><div><small>${escapeHtml(kicker)}</small><h2>${escapeHtml(heading)}</h2><p>${escapeHtml(subtitle)}</p></div>${action}</header>`;
}

function metric(label, value, glyph, tone) {
  return `<article class="premium-admin-metric" data-tone="${tone}"><span>${icon(glyph,18)}</span><strong>${Number(value || 0)}</strong><small>${escapeHtml(label)}</small></article>`;
}

function panel(title, glyph, content) {
  return `<section class="premium-admin-panel"><header><span>${icon(glyph,17)}</span><h3>${escapeHtml(title)}</h3></header>${content}</section>`;
}

function familyCard(family) {
  return `<button type="button" class="premium-admin-family-card" data-family-open="${escapeHtml(family.id)}"><span class="premium-admin-avatar large">${escapeHtml(initials(family.babyName || family.name))}</span><div><header><strong>${escapeHtml(family.name)}</strong>${status(family.status)}</header><p>${escapeHtml(family.babyName ? `Diário de ${family.babyName}` : 'Perfil do bebê incompleto')}</p><small><span>${icon('users',12)}${family.members.length} membro(s)</span><span>${icon('card',12)}${escapeHtml(planLabels[family.plan] || family.plan)}</span><span>${icon('warning',12)}${family.integrityIssues.length} alerta(s)</span></small></div>${icon('chevron',19)}</button>`;
}

function recentFamilyRow(family) {
  return `<button type="button" class="premium-admin-list-row" data-family-open="${escapeHtml(family.id)}"><span class="premium-admin-avatar">${escapeHtml(initials(family.babyName || family.name))}</span><span><strong>${escapeHtml(family.name)}</strong><small>${escapeHtml(family.babyName || 'Perfil incompleto')} · ${escapeHtml(formatDate(family.lastActivityAt, true))}</small></span>${icon('chevron',18)}</button>`;
}

function renderOverview() {
  const alerts = [workspace.metrics.trialsEndingSoon ? `${workspace.metrics.trialsEndingSoon} teste(s) terminam nos próximos 7 dias` : '', workspace.metrics.orphanUsers ? `${workspace.metrics.orphanUsers} conta(s) sem família ou convite` : '', workspace.metrics.syncWarnings ? `${workspace.metrics.syncWarnings} família(s) sem sincronização recente` : ''].filter(Boolean);
  return `${sectionTitle('HOJE','Visão executiva','A saúde da operação em um só lugar.')}
    <section class="premium-admin-metrics">${metric('Famílias ativas',workspace.metrics.activeFamilies,'home','primary')}${metric('Usuários ativos',workspace.metrics.activeUsers,'users','accent')}${metric('Convites pendentes',workspace.metrics.pendingInvites,'mail','warning')}${metric('Tickets abertos',workspace.metrics.openTickets,'headset','danger')}</section>
    <div class="premium-admin-quick"><button type="button" data-admin-tab="families">${icon('plus',21)}<span>Nova família</span></button><button type="button" data-admin-tab="support">${icon('chat',21)}<span>Fila de suporte</span></button></div>
    ${panel('Atenção necessária','pulse',alerts.length ? `<div class="premium-admin-alerts">${alerts.map((item) => `<p><i></i><span>${escapeHtml(item)}</span></p>`).join('')}</div>` : `<p class="premium-admin-empty-line">${icon('check',19)}<span>Nenhum alerta operacional importante.</span></p>`)}
    ${panel('Atividade recente','time',workspace.families.slice(0,5).map(recentFamilyRow).join('') || `<p class="premium-admin-empty-line">${icon('home',19)}<span>Nenhuma família cliente cadastrada.</span></p>`)} `;
}

function renderFamilies() {
  const needle = searchTerm.toLowerCase();
  const families = workspace.families.filter((family) => (!needle || `${family.name} ${family.babyName} ${family.ownerEmail} ${family.id}`.toLowerCase().includes(needle)) && (familyFilter === 'all' || (familyFilter === 'active' ? family.status === 'active' : family.status !== 'active' || family.integrityIssues.length || family.supportCount)));
  return `${sectionTitle('CLIENTES','Famílias',`${families.length} resultado(s), sem contas técnicas.`,`<button type="button" class="premium-admin-add" data-admin-action="create-family">${icon('plus',18)}<span>Criar</span></button>`)}
    <label class="premium-admin-search">${icon('search',18)}<input type="search" data-admin-search placeholder="Nome, bebê, e-mail ou ID" value="${escapeHtml(searchTerm)}"><button type="button" data-admin-action="clear-search" aria-label="Limpar busca" ${searchTerm ? '' : 'hidden'}>${icon('close',18)}</button></label>
    <div class="premium-admin-filters">${[['all','Todas'],['active','Ativas'],['attention','Atenção']].map(([id,label]) => `<button type="button" data-family-filter="${id}" aria-pressed="${familyFilter === id}">${label}</button>`).join('')}</div>
    <div class="premium-admin-card-list">${families.map(familyCard).join('') || `<div class="premium-admin-empty">${icon('search',30)}<strong>Nenhuma família encontrada</strong><p>Ajuste a busca ou os filtros. A família técnica do admin nunca aparece aqui.</p></div>`}</div>`;
}

function renderUsers() {
  const needle = searchTerm.toLowerCase();
  const users = workspace.users.filter((item) => !needle || `${item.email} ${item.name} ${item.uid}`.toLowerCase().includes(needle));
  return `${sectionTitle('ACESSOS','Usuários','Identidades, vínculos e bloqueios globais.')}<label class="premium-admin-search">${icon('search',18)}<input type="search" data-admin-search placeholder="Buscar usuário" value="${escapeHtml(searchTerm)}"><button type="button" data-admin-action="clear-search" aria-label="Limpar busca" ${searchTerm ? '' : 'hidden'}>${icon('close',18)}</button></label><div class="premium-admin-card-list">${users.map((known) => `<article class="premium-admin-user-card"><header><span>${icon('person',20)}</span><div><strong>${escapeHtml(known.name || known.email || known.uid)}</strong><small>${escapeHtml(known.email || known.uid)}</small></div>${status(known.status)}</header><div class="premium-admin-user-families">${known.families.length ? known.families.map((family) => `<span>${escapeHtml(family.name)} · ${escapeHtml(roleLabels[family.role] || family.role)}</span>`).join('') : `<em>${known.hasPendingInvite ? 'Aguardando aceite de convite' : 'Conta órfã: sem família e sem convite'}</em>`}</div><button type="button" class="premium-admin-outline danger" data-user-toggle="${escapeHtml(known.uid)}">${icon('lock',15)}<span>${known.status === 'blocked' ? 'Reativar conta' : 'Bloquear conta'}</span></button></article>`).join('')}</div>`;
}

function renderSupport() {
  return `${sectionTitle('ATENDIMENTO','Suporte e privacidade','Solicitações com responsável, prazo e histórico.')}<div class="premium-admin-card-list">${workspace.tickets.map((ticket) => `<button type="button" class="premium-admin-ticket" data-ticket-open="${escapeHtml(`${ticket.familyId}::${ticket.id}`)}"><header><span>${icon(ticket.type === 'data_deletion_request' ? 'trash' : 'chat',19)}</span><div><strong>${escapeHtml(ticket.category)}</strong><small>${escapeHtml(ticket.familyName)} · ${formatDate(ticket.createdAt,true)}</small></div>${status(ticket.status)}</header><p>${escapeHtml(ticket.message)}</p></button>`).join('') || `<div class="premium-admin-empty">${icon('check',30)}<strong>Fila em dia</strong><p>Nenhuma solicitação de suporte ou privacidade registrada.</p></div>`}</div>`;
}

function renderAudit() {
  return `${sectionTitle('SEGURANÇA','Trilha de auditoria','Registro das ações administrativas e familiares.')} ${panel(`${workspace.audits.length} evento(s) recentes`,'fingerprint',`<div class="premium-admin-audit">${workspace.audits.map((entry) => `<article><i></i><div><strong>${escapeHtml(entry.summary)}</strong><span>${escapeHtml(entry.actorEmail || 'Sistema')} · ${formatDate(entry.createdAt,true)}</span><small>${escapeHtml(entry.action)} · ${escapeHtml(entry.familyId || 'global')}</small></div></article>`).join('')}</div>`)}`;
}

function render() {
  const content = $('#premiumAdminContent');
  if (!content || !workspace) return;
  document.querySelectorAll('[data-admin-tab]').forEach((button) => button.toggleAttribute('aria-current', button.dataset.adminTab === activeSection));
  const supportCount = $('[data-admin-count="support"]');
  if (supportCount) { supportCount.textContent = workspace.metrics.openTickets || ''; supportCount.hidden = !workspace.metrics.openTickets; }
  content.dataset.section = activeSection;
  content.innerHTML = activeSection === 'families' ? renderFamilies() : activeSection === 'users' ? renderUsers() : activeSection === 'support' ? renderSupport() : activeSection === 'audit' ? renderAudit() : renderOverview();
  content.classList.remove('is-entering');
  requestAnimationFrame(() => content.classList.add('is-entering'));
}

async function refresh({ quiet = false } = {}) {
  const content = $('#premiumAdminContent');
  if (!quiet && content) content.innerHTML = '<div class="premium-admin-loading"><i></i><span>Montando o centro administrativo…</span></div>';
  try { workspace = await (apiRef.loadAdminWorkspace || loadAdminWorkspace)(apiRef.getCurrentUser()); render(); resetSession(); if (selectedFamilyId) renderFamilyScreen(false); }
  catch (error) { if (content) content.innerHTML = `<div class="premium-admin-empty">${icon('warning',30)}<strong>Não foi possível carregar</strong><p>${escapeHtml(apiRef.getErrorMessage?.(error) || error.message)}</p><button type="button" data-admin-action="refresh">Tentar novamente</button></div>`; }
}

function openMainModal(markup, variant = 'dialog') {
  const modal = $('#premiumAdminModal');
  if (!modal) return;
  window.clearTimeout(modalCloseTimer);
  modal.hidden = false;
  modal.dataset.variant = variant;
  modal.className = 'premium-admin-modal';
  modal.innerHTML = variant === 'family' ? markup : `<button type="button" class="premium-admin-modal-backdrop" data-main-modal-close aria-label="Fechar"></button><section class="premium-admin-dialog" role="dialog" aria-modal="true">${markup}</section>`;
  document.body.classList.add('premium-admin-modal-open');
  requestAnimationFrame(() => modal.classList.add('is-open'));
}

function closeMainModal({ immediate = false } = {}) {
  const modal = $('#premiumAdminModal');
  if (!modal || modal.hidden) return;
  const finish = () => { modal.hidden = true; modal.innerHTML = ''; modal.className = 'premium-admin-modal'; delete modal.dataset.variant; document.body.classList.remove('premium-admin-modal-open'); };
  if (immediate) { finish(); return; }
  modal.classList.remove('is-open'); modal.classList.add('is-closing');
  modalCloseTimer = window.setTimeout(finish, modal.dataset.variant === 'family' ? 330 : 190);
}

function closeConfirmModal() {
  const modal = $('#premiumAdminConfirmModal');
  pendingConfirmation = null;
  if (!modal || modal.hidden) return;
  modal.classList.remove('is-open');
  window.setTimeout(() => { modal.hidden = true; modal.innerHTML = ''; }, 170);
}

function dialogHead(titleText, subtitle = '') {
  return `<header class="premium-admin-dialog-head"><div><h2>${escapeHtml(titleText)}</h2>${subtitle ? `<p>${escapeHtml(subtitle)}</p>` : ''}</div><button type="button" data-main-modal-close aria-label="Fechar">${icon('close',23)}</button></header>`;
}

function openCreateFamily() {
  openMainModal(`${dialogHead('Nova família cliente','Crie o espaço e convide o responsável.')}<form id="premiumCreateFamilyForm" class="premium-admin-form"><label>Nome da família<input name="familyName" required placeholder="Ex.: Família Oliveira"></label><label>Nome do bebê<input name="babyName" required></label><label>Nascimento (AAAA-MM-DD)<input name="birthDate" inputmode="numeric"></label><label>E-mail do responsável<input name="responsibleEmail" type="email"></label><small class="premium-admin-field-label">Plano inicial</small><div class="premium-admin-filters modal-chips">${['trial','premium','courtesy'].map((value) => `<button type="button" data-create-plan="${value}" aria-pressed="${value === 'trial'}">${planLabels[value]}</button>`).join('')}</div><input type="hidden" name="plan" value="trial"><label data-create-trial-days>Dias de teste<input name="days" type="number" value="14" min="1"></label><button class="premium-admin-primary" type="submit">${icon('plus',18)}<span>Criar família</span></button></form>`);
}

function openTicket(key) {
  const ticket = workspace.tickets.find((item) => `${item.familyId}::${item.id}` === key);
  if (!ticket) return;
  const initialStatus = ['open','in_progress','resolved','rejected'].includes(ticket.status) ? ticket.status : 'in_progress';
  openMainModal(`${dialogHead(ticket.category,`${ticket.familyName} · ${ticket.email}`)}<form id="premiumTicketForm" class="premium-admin-form" data-ticket-key="${escapeHtml(key)}"><div class="premium-admin-message-box"><p>${escapeHtml(ticket.message)}</p>${ticket.diagnostics ? `<small>${escapeHtml(ticket.diagnostics)}</small>` : ''}</div><div class="premium-admin-filters modal-chips">${['open','in_progress','resolved','rejected'].map((value) => `<button type="button" data-ticket-status="${value}" aria-pressed="${value === initialStatus}">${statusLabels[value]}</button>`).join('')}</div><input type="hidden" name="status" value="${initialStatus}"><label>Nota interna / resposta<textarea name="note">${escapeHtml(ticket.note)}</textarea></label><button class="premium-admin-primary" type="submit">${icon('check',18)}<span>Salvar atendimento</span></button></form>`);
}

function familyPanel(titleText, glyph, body) { return panel(titleText, glyph, body); }

function renderFamilyScreen(animate = true) {
  const family = workspace?.families.find((item) => item.id === selectedFamilyId);
  if (!family) return;
  const integrityIssues = uniqueTextItems(family.integrityIssues);
  const memberRows = family.members.map((member) => { const canonicalRole = normalizeAdminRole(member.role); const isOwner = canonicalRole === 'owner'; const ownerLinked = family.ownerUid === member.uid; return `<article class="premium-admin-member"><header><div><strong>${escapeHtml(member.name || member.email || member.uid)}</strong><small>${escapeHtml(member.email)} · ${escapeHtml(roleLabels[canonicalRole] || canonicalRole)}</small></div>${isOwner ? `<span class="premium-admin-owner-badge">${ownerLinked ? 'Responsável' : 'Vínculo pendente'}</span>` : status(member.status)}</header><div class="premium-admin-member-actions">${isOwner && !ownerLinked ? `<button type="button" data-member-owner="${escapeHtml(member.uid)}">Consolidar vínculo</button>` : ''}${!isOwner ? `<button type="button" data-member-owner="${escapeHtml(member.uid)}">Tornar responsável</button>${['admin_familiar','cuidador','visualizacao'].map((role) => `<button type="button" data-member-role="${escapeHtml(member.uid)}" data-role="${role}" aria-pressed="${canonicalRole === role}">${roleLabels[role]}</button>`).join('')}` : ''}<button type="button" class="danger" data-member-toggle="${escapeHtml(member.uid)}">${member.status === 'blocked' ? 'Reativar' : 'Remover'}</button></div></article>`; }).join('') || `<p class="premium-admin-empty-line">${icon('person',19)}<span>Nenhum membro cliente cadastrado.</span></p>`;
  const inviteRows = family.invites.slice(0,8).map((invite) => `<article class="premium-admin-invite"><div><strong>${escapeHtml(invite.email)}</strong><small>${escapeHtml(invite.code)} · ${invite.status === 'accepted' ? 'aceito' : `expira ${formatDate(invite.expiresAt)}`}</small></div>${status(invite.status)}<button type="button" data-invite-copy="${escapeHtml(invite.code)}" aria-label="Compartilhar convite">${icon('share',19)}</button>${['pending','expired'].includes(invite.status) ? `<button type="button" data-invite-update="${escapeHtml(invite.code)}" aria-label="${invite.status === 'expired' ? 'Renovar' : 'Cancelar'} convite">${icon(invite.status === 'expired' ? 'refresh' : 'close',19)}</button>` : ''}</article>`).join('');
  const days = family.days.slice(0,7).map((dayItem) => `<details class="premium-admin-day"><summary><div><strong>${escapeHtml(dayItem.dayId.split('-').reverse().join('/'))}</strong><small>${dayItem.eventCount} registro(s) sincronizado(s)</small></div><span>${dayItem.events.slice(-8).map((event) => `<i data-tone="${event.type === 'sono' || event.type === 'dormir' || event.type === 'soneca' ? 'primary' : event.type === 'amamentacao' || event.type === 'mamadeira' ? 'warning' : 'accent'}"></i>`).join('')}${icon('chevron',16)}</span></summary><div class="premium-admin-event-list">${dayItem.events.length ? dayItem.events.map((event) => `<p><b>${escapeHtml(eventLabels[event.type] || event.type || 'Registro')}</b><span>${escapeHtml(eventDescription(event).replace(`${eventLabels[event.type] || event.type || 'Registro'} · `,''))}</span></p>`).join('') : '<p><b>Nenhum evento</b><span>O documento do dia existe, mas não contém registros.</span></p>'}</div></details>`).join('') || `<p class="premium-admin-empty-line">${icon('planet',19)}<span>Nenhum dia sincronizado.</span></p>`;
  const subscription = getSubscriptionSummary(family);
  const feedbackMarkup = familyFeedback?.familyId === family.id ? `<div class="premium-admin-family-feedback" data-tone="${familyFeedback.tone}">${icon(familyFeedback.tone === 'error' ? 'warning' : 'check',19)}<span>${escapeHtml(familyFeedback.message)}</span></div>` : '';
  const markup = `<section class="premium-admin-family-screen" role="dialog" aria-modal="true"><header class="premium-admin-family-header"><button type="button" data-family-close aria-label="Voltar para famílias">${icon('close',22)}</button><div><h2>${escapeHtml(family.name)}</h2><p>${escapeHtml(family.id)}</p></div>${status(family.status)}</header><div class="premium-admin-family-scroll"><main class="premium-admin-family-content">${feedbackMarkup}
    <section class="premium-admin-support-banner">${icon('eye',20)}<div><strong>Modo suporte — leitura por padrão</strong><p>Toda alteração exige confirmação, justificativa e gera auditoria.</p></div></section>
    <section class="premium-admin-summary"><article><small>Bebê</small><strong>${escapeHtml(family.babyName || 'Incompleto')}</strong></article><article><small>Plano</small><strong>${escapeHtml(planLabels[family.plan] || family.plan)}</strong></article><article><small>Membros</small><strong>${family.members.length}</strong></article><article><small>Última atividade</small><strong>${formatDate(family.lastActivityAt)}</strong></article></section>
    <div class="premium-admin-family-grid">
    ${familyPanel('Assinatura e acesso','card',`<div class="premium-admin-subscription-current"><small>ACESSO ATUAL</small><strong>${escapeHtml(planLabels[family.plan] || family.plan)}</strong><span>${escapeHtml(subscription.text)}</span></div><div class="premium-admin-filters modal-chips">${['trial','premium','courtesy','suspended'].map((value) => `<button type="button" data-family-plan-choice="${value}" aria-pressed="${family.plan === value}">${planLabels[value]}</button>`).join('')}</div><label class="premium-admin-field">Nova validade (dias)<input id="premiumFamilyPlanDays" type="number" value="${subscription.remaining || 30}" min="1"></label><button type="button" class="premium-admin-primary" data-family-plan>${icon('sparkles',18)}<span>Salvar plano e validade</span></button>`)}
    ${familyPanel('Membros e permissões','users',memberRows)}
    ${familyPanel('Convites','mail',`<form id="premiumInviteForm" class="premium-admin-form compact"><label>E-mail<input name="email" type="email" required></label><div class="premium-admin-filters modal-chips">${['admin_familiar','cuidador','visualizacao'].map((value) => `<button type="button" data-invite-role="${value}" aria-pressed="${value === 'cuidador'}">${roleLabels[value]}</button>`).join('')}</div><input type="hidden" name="role" value="cuidador"><button type="submit" class="premium-admin-primary">${icon('send',18)}<span>Criar e compartilhar convite</span></button></form>${inviteRows}`)}
    ${familyPanel('Rotina sincronizada (somente leitura)','planet',days)}
    ${familyPanel('Integridade e dados','pulse',`<p class="premium-admin-integrity-summary"><strong>${integrityIssues.length ? `${integrityIssues.length} ponto(s) para revisar` : '7 verificações aprovadas'}</strong><span>Membros, responsável, perfil, convites, rotina e validade do acesso.</span></p>${integrityIssues.length ? `<div class="premium-admin-alerts">${integrityIssues.map((issue) => `<p><i></i><span>${escapeHtml(issue)}</span></p>`).join('')}</div>` : `<p class="premium-admin-empty-line">${icon('shield',19)}<span>Nenhuma inconsistência detectada.</span></p>`}<div class="premium-admin-dual-actions"><button type="button" data-family-integrity>${icon('scan',17)}<span>Verificar integridade</span></button><button type="button" data-family-export>${icon('download',17)}<span>Exportar JSON</span></button></div>`)}
    ${familyPanel('Estado da família','settings',`<div class="premium-admin-filters modal-chips">${['active','suspended','archived'].map((value) => `<button type="button" data-family-status="${value}" aria-pressed="${family.status === value}">${statusLabels[value]}</button>`).join('')}</div>`)}
    </div>
  </main></div></section>`;
  if (animate) openMainModal(markup,'family');
  else { const modal = $('#premiumAdminModal'); if (modal && modal.dataset.variant === 'family') modal.innerHTML = markup; }
}

function openFamily(familyId) { selectedFamilyId = familyId; familyFeedback = null; renderFamilyScreen(true); }
function selectedFamily() { return workspace?.families.find((item) => item.id === selectedFamilyId) || null; }

function openConfirmation({ titleText, message, familyId = '', destructive = false, action }) {
  pendingConfirmation = { titleText, familyId, action };
  const modal = $('#premiumAdminConfirmModal');
  if (!modal) return;
  modal.hidden = false;
  modal.innerHTML = `<div class="premium-admin-modal-backdrop"></div><section class="premium-admin-confirm-dialog" role="alertdialog" aria-modal="true"><span class="premium-admin-confirm-icon ${destructive ? 'danger' : ''}">${icon(destructive ? 'warning' : 'shield',25)}</span><h2>${escapeHtml(titleText)}</h2><p>${escapeHtml(message)}</p><label>Motivo registrado na auditoria<textarea id="premiumConfirmReason" placeholder="Informe um motivo">Ajuste administrativo solicitado</textarea></label><div><button type="button" data-confirm-close>Cancelar</button><button type="button" data-confirm-run class="${destructive ? 'danger' : ''}">Confirmar</button></div></section>`;
  requestAnimationFrame(() => modal.classList.add('is-open'));
  window.setTimeout(() => $('#premiumConfirmReason')?.focus(), 120);
}

async function mutate(task, success, { closeMain = false, showFamily = false } = {}) {
  const busy = $('#premiumAdminBusy');
  if (busy) busy.hidden = false;
  try {
    const result = await task();
    closeConfirmModal();
    if (closeMain) closeMainModal();
    await refresh({ quiet: true });
    if (selectedFamilyId && !closeMain) {
      familyFeedback = { familyId: selectedFamilyId, message: success, tone: 'success' };
      renderFamilyScreen(false);
    } else showNotice(success);
    if (showFamily && selectedFamilyId) renderFamilyScreen(true);
    resetSession();
    return result;
  } catch (error) {
    const message = apiRef.getErrorMessage?.(error) || error.message;
    if (selectedFamilyId) { familyFeedback = { familyId: selectedFamilyId, message, tone: 'error' }; renderFamilyScreen(false); }
    else showNotice(message,'error');
  }
  finally { if (busy) busy.hidden = true; }
}

function setPressedChoice(button, selector, hiddenSelector, value) {
  button.closest('.premium-admin-form, .premium-admin-panel, .premium-admin-family-content')?.querySelectorAll(selector).forEach((item) => item.setAttribute('aria-pressed', String(item === button)));
  const hidden = button.closest('.premium-admin-form, .premium-admin-panel, .premium-admin-family-content')?.querySelector(hiddenSelector);
  if (hidden) hidden.value = value;
}

function bindEvents(panelRoot) {
  panelRoot.addEventListener('input', (event) => {
    if (event.target.matches('[data-admin-search]')) { searchTerm = event.target.value; render(); const input = $('[data-admin-search]'); input?.focus(); input?.setSelectionRange(searchTerm.length,searchTerm.length); }
    if (event.target.id === 'premiumConfirmReason') { const button = $('[data-confirm-run]'); if (button) button.disabled = event.target.value.trim().length < 5; }
  });
  panelRoot.addEventListener('submit', (event) => {
    event.preventDefault(); const form = event.target;
    if (form.id === 'premiumCreateFamilyForm') { const values = Object.fromEntries(new FormData(form)); void mutate(async () => { const result = await createAdminFamily(apiRef.getCurrentUser(),values); selectedFamilyId = result.familyId; return result; },'Família criada e convite preparado.',{ closeMain: true, showFamily: true }); }
    if (form.id === 'premiumInviteForm') { const family = selectedFamily(); const values = Object.fromEntries(new FormData(form)); if (family) void mutate(async () => { const invite = await createAdminInvite(apiRef.getCurrentUser(),family,values.email,values.role); await navigator.clipboard?.writeText?.(`Convite Ninou para ${family.name}: ${invite.code}`); },'Convite criado com validade de 7 dias.'); }
    if (form.id === 'premiumTicketForm') { const ticket = workspace.tickets.find((item) => `${item.familyId}::${item.id}` === form.dataset.ticketKey); const values = Object.fromEntries(new FormData(form)); if (ticket) void mutate(() => updateAdminTicket(apiRef.getCurrentUser(),ticket,values.status,values.note),'Atendimento atualizado.',{ closeMain: true }); }
  });
  panelRoot.addEventListener('click', (event) => {
    const button = event.target.closest('button'); if (!button) return;
    if (button.matches('[data-main-modal-close]')) { closeMainModal(); return; }
    if (button.matches('[data-family-close]')) { selectedFamilyId = ''; familyFeedback = null; closeMainModal(); return; }
    if (button.matches('[data-confirm-close]')) { closeConfirmModal(); return; }
    if (button.dataset.adminTab) { activeSection = button.dataset.adminTab; searchTerm = ''; render(); return; }
    if (button.dataset.familyFilter) { familyFilter = button.dataset.familyFilter; render(); return; }
    if (button.dataset.familyOpen) { openFamily(button.dataset.familyOpen); return; }
    if (button.dataset.ticketOpen) { openTicket(button.dataset.ticketOpen); return; }
    const action = button.dataset.adminAction;
    if (action === 'refresh') { void refresh(); return; }
    if (action === 'logout') { void apiRef.signOutAccount(); return; }
    if (action === 'create-family') { openCreateFamily(); return; }
    if (action === 'dismiss-notice') { showNotice(''); return; }
    if (action === 'clear-search') { searchTerm = ''; render(); return; }
    if (button.dataset.createPlan) { setPressedChoice(button,'[data-create-plan]','input[name="plan"]',button.dataset.createPlan); const days = button.closest('form')?.querySelector('[data-create-trial-days]'); if (days) days.hidden = button.dataset.createPlan !== 'trial'; return; }
    if (button.dataset.ticketStatus) { setPressedChoice(button,'[data-ticket-status]','input[name="status"]',button.dataset.ticketStatus); return; }
    if (button.dataset.inviteRole) { setPressedChoice(button,'[data-invite-role]','input[name="role"]',button.dataset.inviteRole); return; }
    if (button.dataset.familyPlanChoice) { button.closest('.premium-admin-panel')?.querySelectorAll('[data-family-plan-choice]').forEach((item) => item.setAttribute('aria-pressed',String(item === button))); return; }
    if (button.dataset.userToggle) { const known = workspace.users.find((item) => item.uid === button.dataset.userToggle); if (!known) return; openConfirmation({ titleText: known.status === 'blocked' ? 'Reativar usuário' : 'Bloquear usuário', message: `${known.status === 'blocked' ? 'Restaurar' : 'Suspender'} o acesso de ${known.email || known.uid} em todas as famílias?`, destructive: known.status !== 'blocked', action: (reason) => updateAdminUser(apiRef.getCurrentUser(),known,known.status === 'blocked' ? 'active' : 'blocked',reason) }); return; }
    const family = selectedFamily(); if (!family) return;
    if (button.hasAttribute('data-family-plan')) { const choice = button.closest('.premium-admin-panel')?.querySelector('[data-family-plan-choice][aria-pressed="true"]')?.dataset.familyPlanChoice || family.plan; const days = Math.max(1,Number($('#premiumFamilyPlanDays')?.value) || 30); openConfirmation({ titleText:'Atualizar assinatura',message:`Aplicar o plano ${planLabels[choice]} por ${days} dias?`,familyId:family.id,action:(reason) => adminOperation('updateAdminFamily',updateAdminFamily,apiRef.getCurrentUser(),family,{ subscriptionPlan:choice,subscriptionStatus:choice === 'suspended' ? 'suspended' : choice === 'trial' ? 'trialing' : 'active',trialEndsAtClient:choice === 'trial' ? Date.now()+days*86400000 : 0,premiumUntilClient:['premium','courtesy'].includes(choice) ? Date.now()+days*86400000 : 0 },'subscription_updated',reason) }); return; }
    if (button.dataset.familyStatus) { const next = button.dataset.familyStatus; if (next === family.status) return; openConfirmation({ titleText:`${statusLabels[next]} família`,message:`Alterar ${family.name} para o estado “${statusLabels[next]}”?`,familyId:family.id,destructive:next !== 'active',action:(reason) => adminOperation('updateAdminFamily',updateAdminFamily,apiRef.getCurrentUser(),family,{status:next},'family_status_updated',reason) }); return; }
    if (button.hasAttribute('data-family-integrity')) { void mutate(async () => { const report = await adminOperation('logIntegrityCheck',logIntegrityCheck,apiRef.getCurrentUser(),family); return report; }, integrityIssuesMessage(family)); return; }
    if (button.hasAttribute('data-family-export')) { const blob = new Blob([JSON.stringify({exportedAt:new Date().toISOString(),family},null,2)],{type:'application/json'}); const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href=url; link.download=`ninou-${family.id}.json`; link.click(); URL.revokeObjectURL(url); return; }
    if (button.dataset.inviteCopy) { void navigator.clipboard?.writeText?.(`Convite Ninou para ${family.name}: ${button.dataset.inviteCopy}`); familyFeedback = { familyId: family.id, message: 'Código de convite copiado.', tone: 'success' }; renderFamilyScreen(false); return; }
    if (button.dataset.inviteUpdate) { const invite = family.invites.find((item) => item.code === button.dataset.inviteUpdate); if (!invite) return; const renew = invite.status === 'expired'; openConfirmation({ titleText:renew ? 'Renovar convite' : 'Cancelar convite',message:`Alterar o convite enviado para ${invite.email}?`,familyId:family.id,destructive:!renew,action:(reason) => updateAdminInvite(apiRef.getCurrentUser(),invite,renew ? 'renew' : 'cancel',reason) }); return; }
    if (button.dataset.memberRole) { const member = family.members.find((item) => item.uid === button.dataset.memberRole); const role = button.dataset.role; if (member && role && member.role !== role) openConfirmation({ titleText:'Alterar permissão',message:`Alterar ${member.email} para ${roleLabels[role]}?`,familyId:family.id,action:(reason) => adminOperation('updateAdminMember',updateAdminMember,apiRef.getCurrentUser(),family,member,{role},reason) }); return; }
    if (button.dataset.memberOwner) { const member = family.members.find((item) => item.uid === button.dataset.memberOwner); if (member) openConfirmation({ titleText:normalizeAdminRole(member.role) === 'owner' ? 'Consolidar responsável' : 'Transferir responsabilidade',message:`${member.email} passará a ser o responsável principal da família.`,familyId:family.id,action:(reason) => adminOperation('transferAdminOwnership',transferAdminOwnership,apiRef.getCurrentUser(),family,member,reason) }); return; }
    if (button.dataset.memberToggle) { const member = family.members.find((item) => item.uid === button.dataset.memberToggle); if (member) openConfirmation({ titleText:member.status === 'blocked' ? 'Reativar membro' : 'Remover acesso',message:`Alterar o acesso de ${member.email}?`,familyId:family.id,destructive:member.status !== 'blocked',action:(reason) => updateAdminMember(apiRef.getCurrentUser(),family,member,{status:member.status === 'blocked' ? 'active' : 'blocked'},reason) }); return; }
    if (button.hasAttribute('data-confirm-run') && pendingConfirmation) { const reason = $('#premiumConfirmReason')?.value.trim() || ''; if (reason.length < 5) return; const confirmation = pendingConfirmation; void mutate(() => confirmation.action(reason),`${confirmation.titleText} concluído.`); }
  });
}

export function initializeNinouAdminRuntime(api = {}) {
  if (initialized || !api.isGlobalAppAdmin?.()) return { initialized };
  initialized = true; apiRef = api;
  const panelRoot = $('#adminInvitePanel'); if (!panelRoot) return { initialized:false };
  panelRoot.className = 'premium-admin-root'; panelRoot.innerHTML = shellMarkup(api.getCurrentUser?.()); panelRoot.hidden = false;
  bindEvents(panelRoot); resetSession(); void refresh(); document.body.dataset.adminRuntimeState = 'ready';
  return { initialized:true };
}
