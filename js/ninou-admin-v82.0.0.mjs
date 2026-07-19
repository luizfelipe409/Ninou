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

const $ = (selector, root = document) => root.querySelector(selector);
const escapeHtml = (value = '') => String(value ?? '').replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character]));
const formatDate = (value, withTime = false) => value ? new Intl.DateTimeFormat('pt-BR', withTime ? { dateStyle: 'short', timeStyle: 'short' } : { dateStyle: 'short' }).format(new Date(value)) : 'Sem registro';
const initials = (value = '') => String(value).split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'N';
const planLabels = { trial: 'Teste', premium: 'Premium', courtesy: 'Cortesia', suspended: 'Suspenso' };
const roleLabels = { owner: 'Responsável', admin_familiar: 'Administrador familiar', cuidador: 'Cuidador', caregiver: 'Cuidador', visualizacao: 'Somente leitura' };
const statusLabels = { active: 'Ativa', suspended: 'Suspensa', archived: 'Arquivada', blocked: 'Bloqueado', pending: 'Pendente', expired: 'Expirado', cancelled: 'Cancelado', open: 'Aberto', in_progress: 'Em atendimento', resolved: 'Resolvido', rejected: 'Recusado' };

function status(value = '') {
  const tone = ['active', 'resolved', 'accepted'].includes(value) ? 'good' : ['pending', 'open', 'in_progress', 'trialing'].includes(value) ? 'warn' : 'danger';
  return `<span class="premium-admin-status" data-tone="${tone}"><i></i>${escapeHtml(statusLabels[value] || value)}</span>`;
}

function icon(name) {
  const icons = { overview: '✦', families: '⌂', users: '♙', support: '◌', audit: '✓', refresh: '↻', logout: '↗', warning: '!', plan: '◇', invite: '✉', routine: '◷', shield: '◈' };
  return `<span aria-hidden="true">${icons[name] || '•'}</span>`;
}

function resetSession() {
  window.clearTimeout(sessionTimer);
  sessionEndsAt = Date.now() + 30 * 60 * 1000;
  sessionTimer = window.setTimeout(() => apiRef?.signOutAccount?.(), 30 * 60 * 1000);
}

function showNotice(message = '', tone = 'success') {
  const node = $('#premiumAdminNotice');
  if (!node) return;
  node.hidden = !message;
  node.dataset.tone = tone;
  node.innerHTML = message ? `<strong>${tone === 'error' ? 'Não foi possível concluir' : 'Tudo certo'}</strong><span>${escapeHtml(message)}</span><button type="button" data-admin-action="dismiss-notice" aria-label="Fechar">×</button>` : '';
}

function shellMarkup(user) {
  return `
    <div class="premium-admin-shell">
      <header class="premium-admin-topbar">
        <div class="premium-admin-brand"><span class="premium-admin-brandmark">✓</span><div><strong>Ninou Admin</strong><small>OPERAÇÃO PREMIUM</small></div></div>
        <div class="premium-admin-top-actions"><button type="button" data-admin-action="refresh" aria-label="Atualizar">${icon('refresh')}</button><button type="button" data-admin-action="logout" aria-label="Sair">${icon('logout')}</button></div>
      </header>
      <section class="premium-admin-hero">
        <div class="premium-admin-hero-top"><span class="premium-admin-connected"><i></i> ADMIN GLOBAL</span><small>${ADMIN_WEB_VERSION}</small></div>
        <h1>Centro de operação</h1>
        <p>Gerencie clientes, acessos, planos e suporte sem criar uma família pessoal para o administrador.</p>
        <span class="premium-admin-session">◷ Sessão protegida por 30 minutos · ${escapeHtml(user?.email || '')}</span>
      </section>
      <div id="premiumAdminNotice" class="premium-admin-notice" hidden></div>
      <nav class="premium-admin-tabs" aria-label="Seções administrativas">
        ${[['overview', 'Visão geral'], ['families', 'Famílias'], ['users', 'Usuários'], ['support', 'Suporte'], ['audit', 'Auditoria']].map(([id, label]) => `<button type="button" data-admin-tab="${id}">${icon(id)}<span>${label}</span><b data-admin-count="${id}"></b></button>`).join('')}
      </nav>
      <main id="premiumAdminContent" class="premium-admin-content"><div class="premium-admin-loading"><i></i><span>Montando o centro administrativo…</span></div></main>
    </div>
    <div id="premiumAdminModal" class="premium-admin-modal" hidden></div>`;
}

function title(kicker, heading, subtitle, action = '') {
  return `<header class="premium-admin-section-title"><div><small>${escapeHtml(kicker)}</small><h2>${escapeHtml(heading)}</h2><p>${escapeHtml(subtitle)}</p></div>${action}</header>`;
}

function metric(label, value, type) {
  return `<article class="premium-admin-metric" data-type="${type}">${icon(type === 'family' ? 'families' : type === 'user' ? 'users' : type === 'ticket' ? 'support' : 'invite')}<strong>${Number(value || 0)}</strong><span>${escapeHtml(label)}</span></article>`;
}

function familyCard(family) {
  return `<button type="button" class="premium-admin-family-card" data-family-open="${escapeHtml(family.id)}"><span class="premium-admin-avatar">${escapeHtml(initials(family.babyName || family.name))}</span><div><div class="premium-admin-card-title"><strong>${escapeHtml(family.name)}</strong>${status(family.status)}</div><p>${escapeHtml(family.babyName ? `Diário de ${family.babyName}` : 'Perfil do bebê incompleto')}</p><small><span>♙ ${family.members.length} membro(s)</span><span>◇ ${escapeHtml(planLabels[family.plan] || family.plan)}</span><span>! ${family.integrityIssues.length} alerta(s)</span></small></div><i>›</i></button>`;
}

function renderOverview() {
  const alerts = [workspace.metrics.trialsEndingSoon ? `${workspace.metrics.trialsEndingSoon} teste(s) terminam nos próximos 7 dias` : '', workspace.metrics.orphanUsers ? `${workspace.metrics.orphanUsers} conta(s) sem família ou convite` : '', workspace.metrics.syncWarnings ? `${workspace.metrics.syncWarnings} família(s) sem sincronização recente` : ''].filter(Boolean);
  return `${title('HOJE', 'Visão executiva', 'A saúde da operação em um só lugar.')}
    <section class="premium-admin-metrics">${metric('Famílias ativas', workspace.metrics.activeFamilies, 'family')}${metric('Usuários ativos', workspace.metrics.activeUsers, 'user')}${metric('Convites pendentes', workspace.metrics.pendingInvites, 'invite')}${metric('Tickets abertos', workspace.metrics.openTickets, 'ticket')}</section>
    <div class="premium-admin-quick"><button type="button" data-admin-action="create-family">＋ Nova família</button><button type="button" data-admin-tab="support">◌ Fila de suporte</button></div>
    <section class="premium-admin-panel"><h3>${icon('warning')} Atenção necessária</h3>${alerts.length ? `<ul class="premium-admin-alerts">${alerts.map((item) => `<li><i></i>${escapeHtml(item)}</li>`).join('')}</ul>` : '<p class="premium-admin-empty-line">✓ Nenhum alerta operacional importante.</p>'}</section>
    <section class="premium-admin-panel"><h3>${icon('routine')} Atividade recente</h3><div class="premium-admin-list">${workspace.families.slice(0, 5).map(familyCard).join('') || '<p class="premium-admin-empty-line">Nenhuma família cliente cadastrada.</p>'}</div></section>`;
}

function renderFamilies() {
  const needle = searchTerm.toLowerCase();
  const families = workspace.families.filter((family) => (!needle || `${family.name} ${family.babyName} ${family.ownerEmail} ${family.id}`.toLowerCase().includes(needle)) && (familyFilter === 'all' || (familyFilter === 'active' ? family.status === 'active' : family.status !== 'active' || family.integrityIssues.length || family.supportCount)));
  return `${title('CLIENTES', 'Famílias', `${families.length} resultado(s), sem contas técnicas.`, '<button type="button" class="premium-admin-add" data-admin-action="create-family">＋ Criar</button>')}
    <label class="premium-admin-search">⌕<input type="search" data-admin-search placeholder="Nome, bebê, e-mail ou ID" value="${escapeHtml(searchTerm)}"></label>
    <div class="premium-admin-filters">${[['all', 'Todas'], ['active', 'Ativas'], ['attention', 'Atenção']].map(([id, label]) => `<button type="button" data-family-filter="${id}" aria-pressed="${familyFilter === id}">${label}</button>`).join('')}</div>
    <div class="premium-admin-card-list">${families.map(familyCard).join('') || '<div class="premium-admin-empty"><b>⌕</b><strong>Nenhuma família encontrada</strong><p>Ajuste a busca ou os filtros. A família técnica do admin nunca aparece aqui.</p></div>'}</div>`;
}

function renderUsers() {
  const needle = searchTerm.toLowerCase(); const users = workspace.users.filter((item) => !needle || `${item.email} ${item.name} ${item.uid}`.toLowerCase().includes(needle));
  return `${title('ACESSOS', 'Usuários', 'Identidades, vínculos e bloqueios globais.')}<label class="premium-admin-search">⌕<input type="search" data-admin-search placeholder="Buscar usuário" value="${escapeHtml(searchTerm)}"></label><div class="premium-admin-card-list">${users.map((known) => `<article class="premium-admin-user-card"><header><span>${known.orphan ? '!' : '♙'}</span><div><strong>${escapeHtml(known.name || known.email || known.uid)}</strong><small>${escapeHtml(known.email || known.uid)}</small></div>${status(known.status)}</header><div class="premium-admin-user-families">${known.families.length ? known.families.map((family) => `<span>${escapeHtml(family.name)} · ${escapeHtml(roleLabels[family.role] || family.role)}</span>`).join('') : `<em>${known.hasPendingInvite ? 'Aguardando aceite de convite' : 'Conta órfã: sem família e sem convite'}</em>`}</div><button type="button" class="premium-admin-outline danger" data-user-toggle="${escapeHtml(known.uid)}">${known.status === 'blocked' ? 'Reativar conta' : 'Bloquear conta'}</button></article>`).join('')}</div>`;
}

function renderSupport() {
  return `${title('ATENDIMENTO', 'Suporte e privacidade', 'Solicitações com responsável, prazo e histórico.')}<div class="premium-admin-card-list">${workspace.tickets.map((ticket) => `<button type="button" class="premium-admin-ticket" data-ticket-open="${escapeHtml(`${ticket.familyId}::${ticket.id}`)}"><header><span>${ticket.type === 'data_deletion_request' ? '⌫' : '◌'}</span><div><strong>${escapeHtml(ticket.category)}</strong><small>${escapeHtml(ticket.familyName)} · ${formatDate(ticket.createdAt, true)}</small></div>${status(ticket.status)}</header><p>${escapeHtml(ticket.message)}</p></button>`).join('') || '<div class="premium-admin-empty"><b>✓</b><strong>Fila em dia</strong><p>Nenhuma solicitação de suporte ou privacidade registrada.</p></div>'}</div>`;
}

function renderAudit() {
  return `${title('SEGURANÇA', 'Trilha de auditoria', 'Registro das ações administrativas e familiares.')}<section class="premium-admin-panel"><h3>${icon('shield')} ${workspace.audits.length} evento(s) recentes</h3><div class="premium-admin-audit">${workspace.audits.map((entry) => `<article><i></i><div><strong>${escapeHtml(entry.summary)}</strong><span>${escapeHtml(entry.actorEmail || 'Sistema')} · ${formatDate(entry.createdAt, true)}</span><small>${escapeHtml(entry.action)} · ${escapeHtml(entry.familyId || 'global')}</small></div></article>`).join('') || '<p class="premium-admin-empty-line">Nenhuma ação registrada.</p>'}</div></section>`;
}

function render() {
  const content = $('#premiumAdminContent'); if (!content || !workspace) return;
  document.querySelectorAll('[data-admin-tab]').forEach((button) => button.toggleAttribute('aria-current', button.dataset.adminTab === activeSection));
  const supportCount = $('[data-admin-count="support"]'); if (supportCount) { supportCount.textContent = workspace.metrics.openTickets || ''; supportCount.hidden = !workspace.metrics.openTickets; }
  content.innerHTML = activeSection === 'families' ? renderFamilies() : activeSection === 'users' ? renderUsers() : activeSection === 'support' ? renderSupport() : activeSection === 'audit' ? renderAudit() : renderOverview();
}

async function refresh({ quiet = false } = {}) {
  const content = $('#premiumAdminContent'); if (!quiet && content) content.innerHTML = '<div class="premium-admin-loading"><i></i><span>Atualizando dados administrativos…</span></div>';
  try { workspace = await loadAdminWorkspace(apiRef.getCurrentUser()); render(); resetSession(); }
  catch (error) { if (content) content.innerHTML = `<div class="premium-admin-empty"><b>!</b><strong>Não foi possível carregar</strong><p>${escapeHtml(apiRef.getErrorMessage?.(error) || error.message)}</p><button type="button" data-admin-action="refresh">Tentar novamente</button></div>`; }
}

function openModal(markup, size = '') {
  const modal = $('#premiumAdminModal'); if (!modal) return; modal.hidden = false; modal.dataset.size = size; modal.innerHTML = `<div class="premium-admin-modal-backdrop" data-modal-close></div><section class="premium-admin-dialog" role="dialog" aria-modal="true">${markup}</section>`; document.body.classList.add('premium-admin-modal-open');
}
function closeModal() { const modal = $('#premiumAdminModal'); if (modal) { modal.hidden = true; modal.innerHTML = ''; } document.body.classList.remove('premium-admin-modal-open'); pendingConfirmation = null; }
function modalHead(titleText, subtitle = '') { return `<header class="premium-admin-dialog-head"><div><h2>${escapeHtml(titleText)}</h2>${subtitle ? `<p>${escapeHtml(subtitle)}</p>` : ''}</div><button type="button" data-modal-close aria-label="Fechar">×</button></header>`; }

function openCreateFamily() {
  openModal(`${modalHead('Nova família cliente', 'Crie o espaço e convide o responsável.')}<form id="premiumCreateFamilyForm" class="premium-admin-form"><label>Nome da família<input name="familyName" required placeholder="Ex.: Família Oliveira"></label><label>Nome do bebê<input name="babyName" required></label><label>Nascimento<input name="birthDate" type="date"></label><label>E-mail do responsável<input name="responsibleEmail" type="email"></label><div class="premium-admin-form-row"><label>Plano inicial<select name="plan"><option value="trial">Teste</option><option value="premium">Premium</option><option value="courtesy">Cortesia</option></select></label><label>Duração em dias<input name="days" type="number" value="14" min="1"></label></div><button class="premium-admin-primary" type="submit">＋ Criar família</button></form>`);
}

function openConfirmation({ titleText, message, familyId = '', destructive = false, action }) {
  pendingConfirmation = { titleText, familyId, action };
  openModal(`${modalHead(titleText)}<div class="premium-admin-confirm-icon ${destructive ? 'danger' : ''}">${destructive ? '!' : '✓'}</div><p class="premium-admin-confirm-copy">${escapeHtml(message)}</p><label class="premium-admin-reason">Justificativa para auditoria<textarea id="premiumConfirmReason" placeholder="Explique o motivo (mínimo 5 caracteres)"></textarea></label><div class="premium-admin-dialog-actions"><button type="button" data-modal-close>Cancelar</button><button type="button" data-confirm-run class="${destructive ? 'danger' : ''}" disabled>Confirmar</button></div>`, 'compact');
}

function familyModalMarkup(family) {
  const memberRows = family.members.map((member) => `<article class="premium-admin-member"><header><div><strong>${escapeHtml(member.name || member.email || member.uid)}</strong><small>${escapeHtml(member.email)} · ${escapeHtml(roleLabels[member.role] || member.role)}</small></div>${status(member.status)}</header><div><select data-member-role-select="${escapeHtml(member.uid)}" ${member.role === 'owner' ? 'disabled' : ''}>${['admin_familiar', 'cuidador', 'visualizacao'].map((role) => `<option value="${role}" ${member.role === role ? 'selected' : ''}>${roleLabels[role]}</option>`).join('')}</select>${member.role !== 'owner' ? `<button type="button" data-member-role-save="${escapeHtml(member.uid)}">Salvar papel</button><button type="button" data-member-owner="${escapeHtml(member.uid)}">Tornar responsável</button>` : ''}<button type="button" class="danger" data-member-toggle="${escapeHtml(member.uid)}">${member.status === 'blocked' ? 'Reativar' : 'Remover'}</button></div></article>`).join('') || '<p class="premium-admin-empty-line">Nenhum membro cliente cadastrado.</p>';
  const inviteRows = family.invites.slice(0, 8).map((invite) => `<article class="premium-admin-invite"><div><strong>${escapeHtml(invite.email)}</strong><small>${escapeHtml(invite.code)} · expira ${formatDate(invite.expiresAt)}</small></div>${status(invite.status)}<button type="button" data-invite-copy="${escapeHtml(invite.code)}">Copiar</button>${invite.status !== 'cancelled' ? `<button type="button" class="${invite.status === 'expired' ? '' : 'danger'}" data-invite-update="${escapeHtml(invite.code)}">${invite.status === 'expired' ? 'Renovar' : 'Cancelar'}</button>` : ''}</article>`).join('');
  const days = family.days.slice(0, 7).map((dayItem) => `<article class="premium-admin-day"><div><strong>${escapeHtml(dayItem.dayId.split('-').reverse().join('/'))}</strong><small>${dayItem.eventCount} evento(s)</small></div><span>${dayItem.events.slice(-8).map((event) => `<i data-type="${escapeHtml(event.type)}"></i>`).join('')}</span></article>`).join('') || '<p class="premium-admin-empty-line">Nenhum dia sincronizado.</p>';
  return `${modalHead(family.name, family.id)}<div class="premium-admin-family-modal-body"><section class="premium-admin-support-banner">◉ <div><strong>Modo suporte — leitura por padrão</strong><p>Toda alteração exige confirmação, justificativa e gera auditoria.</p></div></section><div class="premium-admin-summary"><article><small>Bebê</small><strong>${escapeHtml(family.babyName || 'Incompleto')}</strong></article><article><small>Plano</small><strong>${escapeHtml(planLabels[family.plan] || family.plan)}</strong></article><article><small>Membros</small><strong>${family.members.length}</strong></article><article><small>Última atividade</small><strong>${formatDate(family.lastActivityAt)}</strong></article></div>
    <section class="premium-admin-modal-panel"><h3>◇ Assinatura e entitlement</h3><div class="premium-admin-form-row"><label>Plano<select id="premiumFamilyPlan">${['trial', 'premium', 'courtesy', 'suspended'].map((plan) => `<option value="${plan}" ${family.plan === plan ? 'selected' : ''}>${planLabels[plan]}</option>`).join('')}</select></label><label>Duração em dias<input id="premiumFamilyPlanDays" type="number" min="1" value="30"></label></div><button type="button" data-family-plan>Atualizar plano</button></section>
    <section class="premium-admin-modal-panel"><h3>♙ Membros e permissões</h3>${memberRows}</section>
    <section class="premium-admin-modal-panel"><h3>✉ Convites</h3><form id="premiumInviteForm" class="premium-admin-inline-form"><input name="email" type="email" required placeholder="familiar@email.com"><select name="role"><option value="admin_familiar">Administrador familiar</option><option value="cuidador">Cuidador</option><option value="visualizacao">Somente leitura</option></select><button type="submit">Criar convite</button></form>${inviteRows}</section>
    <section class="premium-admin-modal-panel"><h3>◷ Rotina sincronizada (somente leitura)</h3>${days}</section>
    <section class="premium-admin-modal-panel"><h3>◈ Integridade e dados</h3>${family.integrityIssues.length ? `<ul class="premium-admin-alerts">${family.integrityIssues.map((issue) => `<li><i></i>${escapeHtml(issue)}</li>`).join('')}</ul>` : '<p class="premium-admin-empty-line">✓ Nenhuma inconsistência detectada.</p>'}<div class="premium-admin-modal-actions"><button type="button" data-family-integrity>Executar checklist</button><button type="button" data-family-export>Exportar JSON</button></div></section>
    <section class="premium-admin-modal-panel"><h3>⚙ Estado da família</h3><div class="premium-admin-modal-actions">${['active', 'suspended', 'archived'].map((value) => `<button type="button" data-family-status="${value}" class="${value !== 'active' ? 'danger' : ''}" ${family.status === value ? 'disabled' : ''}>${statusLabels[value]}</button>`).join('')}</div></section></div>`;
}

function openFamily(familyId) { const family = workspace.families.find((item) => item.id === familyId); if (!family) return; selectedFamilyId = familyId; openModal(familyModalMarkup(family), 'wide'); }
function findSelectedFamily() { return workspace?.families.find((item) => item.id === selectedFamilyId) || null; }

function openTicket(key) {
  const ticket = workspace.tickets.find((item) => `${item.familyId}::${item.id}` === key); if (!ticket) return;
  openModal(`${modalHead(ticket.category, `${ticket.familyName} · ${ticket.email}`)}<div class="premium-admin-ticket-copy"><p>${escapeHtml(ticket.message)}</p>${ticket.diagnostics ? `<small>${escapeHtml(ticket.diagnostics)}</small>` : ''}</div><form id="premiumTicketForm" class="premium-admin-form" data-ticket-key="${escapeHtml(key)}"><label>Status<select name="status">${['open', 'in_progress', 'resolved', 'rejected'].map((value) => `<option value="${value}" ${ticket.status === value ? 'selected' : ''}>${statusLabels[value]}</option>`).join('')}</select></label><label>Nota interna / resposta<textarea name="note">${escapeHtml(ticket.note)}</textarea></label><button class="premium-admin-primary" type="submit">Salvar atendimento</button></form>`, 'compact');
}

async function mutate(task, success, { reopenFamily = false } = {}) {
  showNotice('', 'success'); document.body.classList.add('premium-admin-busy');
  try { await task(); closeModal(); await refresh({ quiet: true }); showNotice(success); if (reopenFamily && selectedFamilyId) openFamily(selectedFamilyId); resetSession(); }
  catch (error) { showNotice(apiRef.getErrorMessage?.(error) || error.message, 'error'); }
  finally { document.body.classList.remove('premium-admin-busy'); }
}

function bindEvents(panel) {
  panel.addEventListener('input', (event) => {
    if (event.target.matches('[data-admin-search]')) { searchTerm = event.target.value; render(); const input = $('[data-admin-search]'); input?.focus(); input?.setSelectionRange(searchTerm.length, searchTerm.length); }
    if (event.target.id === 'premiumConfirmReason') { const button = $('[data-confirm-run]'); if (button) button.disabled = event.target.value.trim().length < 5; }
  });
  panel.addEventListener('submit', (event) => {
    event.preventDefault(); const form = event.target;
    if (form.id === 'premiumCreateFamilyForm') { const values = Object.fromEntries(new FormData(form)); void mutate(() => createAdminFamily(apiRef.getCurrentUser(), values), 'Família criada e convite preparado.'); }
    if (form.id === 'premiumInviteForm') { const family = findSelectedFamily(); const values = Object.fromEntries(new FormData(form)); if (family) void mutate(async () => { const invite = await createAdminInvite(apiRef.getCurrentUser(), family, values.email, values.role); await navigator.clipboard?.writeText?.(`Convite Ninou para ${family.name}: ${invite.code}`); }, 'Convite criado e copiado.', { reopenFamily: true }); }
    if (form.id === 'premiumTicketForm') { const ticket = workspace.tickets.find((item) => `${item.familyId}::${item.id}` === form.dataset.ticketKey); const values = Object.fromEntries(new FormData(form)); if (ticket) void mutate(() => updateAdminTicket(apiRef.getCurrentUser(), ticket, values.status, values.note), 'Atendimento atualizado.'); }
  });
  panel.addEventListener('click', (event) => {
    if (event.target.matches('[data-modal-close]')) { closeModal(); return; }
    const button = event.target.closest('button'); if (!button) return;
    if (button.matches('[data-modal-close], [data-modal-close] *')) { closeModal(); return; }
    if (button.dataset.adminTab) { activeSection = button.dataset.adminTab; searchTerm = ''; render(); return; }
    if (button.dataset.familyFilter) { familyFilter = button.dataset.familyFilter; render(); return; }
    if (button.dataset.familyOpen) { openFamily(button.dataset.familyOpen); return; }
    if (button.dataset.ticketOpen) { openTicket(button.dataset.ticketOpen); return; }
    const action = button.dataset.adminAction;
    if (action === 'refresh') { void refresh(); return; } if (action === 'logout') { void apiRef.signOutAccount(); return; } if (action === 'create-family') { openCreateFamily(); return; } if (action === 'dismiss-notice') { showNotice(''); return; }
    if (button.dataset.userToggle) { const known = workspace.users.find((item) => item.uid === button.dataset.userToggle); if (!known) return; openConfirmation({ titleText: known.status === 'blocked' ? 'Reativar usuário' : 'Bloquear usuário', message: `${known.status === 'blocked' ? 'Restaurar' : 'Suspender'} o acesso de ${known.email || known.uid} em todas as famílias?`, destructive: known.status !== 'blocked', action: (reason) => updateAdminUser(apiRef.getCurrentUser(), known, known.status === 'blocked' ? 'active' : 'blocked', reason) }); return; }
    const family = findSelectedFamily(); if (!family) return;
    if (button.hasAttribute('data-family-plan')) { const plan = $('#premiumFamilyPlan').value; const days = Math.max(1, Number($('#premiumFamilyPlanDays').value) || 30); openConfirmation({ titleText: 'Atualizar assinatura', message: `Aplicar o plano ${planLabels[plan]} por ${days} dias?`, familyId: family.id, action: (reason) => updateAdminFamily(apiRef.getCurrentUser(), family, { subscriptionPlan: plan, subscriptionStatus: plan === 'suspended' ? 'suspended' : plan === 'trial' ? 'trialing' : 'active', trialEndsAtClient: plan === 'trial' ? Date.now() + days * 86400000 : 0, premiumUntilClient: ['premium', 'courtesy'].includes(plan) ? Date.now() + days * 86400000 : 0 }, 'subscription_updated', reason) }); return; }
    if (button.dataset.familyStatus) { const next = button.dataset.familyStatus; openConfirmation({ titleText: `${statusLabels[next]} família`, message: `Alterar ${family.name} para o estado “${statusLabels[next]}”?`, familyId: family.id, destructive: next !== 'active', action: (reason) => updateAdminFamily(apiRef.getCurrentUser(), family, { status: next }, 'family_status_updated', reason) }); return; }
    if (button.hasAttribute('data-family-integrity')) { void mutate(() => logIntegrityCheck(apiRef.getCurrentUser(), family), 'Diagnóstico registrado na auditoria.', { reopenFamily: true }); return; }
    if (button.hasAttribute('data-family-export')) { const blob = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), family }, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = `ninou-${family.id}.json`; link.click(); URL.revokeObjectURL(url); return; }
    if (button.dataset.inviteCopy) { void navigator.clipboard?.writeText?.(`Convite Ninou para ${family.name}: ${button.dataset.inviteCopy}`); showNotice('Código de convite copiado.'); return; }
    if (button.dataset.inviteUpdate) { const invite = family.invites.find((item) => item.code === button.dataset.inviteUpdate); if (!invite) return; const renew = invite.status === 'expired'; openConfirmation({ titleText: renew ? 'Renovar convite' : 'Cancelar convite', message: `Alterar o convite enviado para ${invite.email}?`, familyId: family.id, destructive: !renew, action: (reason) => updateAdminInvite(apiRef.getCurrentUser(), invite, renew ? 'renew' : 'cancel', reason) }); return; }
    if (button.dataset.memberRoleSave) { const member = family.members.find((item) => item.uid === button.dataset.memberRoleSave); const role = $(`[data-member-role-select="${CSS.escape(button.dataset.memberRoleSave)}"]`)?.value; if (member && role) openConfirmation({ titleText: 'Alterar permissão', message: `Alterar ${member.email} para ${roleLabels[role]}?`, familyId: family.id, action: (reason) => updateAdminMember(apiRef.getCurrentUser(), family, member, { role }, reason) }); return; }
    if (button.dataset.memberOwner) { const member = family.members.find((item) => item.uid === button.dataset.memberOwner); if (member) openConfirmation({ titleText: 'Transferir responsabilidade', message: `${member.email} passará a ser o responsável principal da família.`, familyId: family.id, action: (reason) => transferAdminOwnership(apiRef.getCurrentUser(), family, member, reason) }); return; }
    if (button.dataset.memberToggle) { const member = family.members.find((item) => item.uid === button.dataset.memberToggle); if (member) openConfirmation({ titleText: member.status === 'blocked' ? 'Reativar membro' : 'Remover acesso', message: `Alterar o acesso de ${member.email}?`, familyId: family.id, destructive: member.status !== 'blocked', action: (reason) => updateAdminMember(apiRef.getCurrentUser(), family, member, { status: member.status === 'blocked' ? 'active' : 'blocked' }, reason) }); return; }
    if (button.hasAttribute('data-confirm-run') && pendingConfirmation) { const reason = $('#premiumConfirmReason')?.value.trim() || ''; if (reason.length < 5) return; const confirmation = pendingConfirmation; void mutate(() => confirmation.action(reason), `${confirmation.titleText} concluído.`, { reopenFamily: Boolean(confirmation.familyId) }); }
  });
}

export function initializeNinouAdminRuntime(api = {}) {
  if (initialized || !api.isGlobalAppAdmin?.()) return { initialized };
  initialized = true; apiRef = api; const panel = $('#adminInvitePanel'); if (!panel) return { initialized: false };
  panel.className = 'premium-admin-root'; panel.innerHTML = shellMarkup(api.getCurrentUser?.()); panel.hidden = false; bindEvents(panel); resetSession(); void refresh(); document.body.dataset.adminRuntimeState = 'ready';
  return { initialized: true };
}
