import { getFirebaseServices } from './firebase-service.js';

export const GLOBAL_ADMIN_EMAIL = 'luizfelipe.dasilva@gmail.com';
export const INTERNAL_ADMIN_FAMILY_ID = 'ninou-family-luizfelipe';
export const ADMIN_WEB_VERSION = '82.1.0-web-admin';

const clean = (value) => String(value || '').trim();
const lower = (value) => clean(value).toLowerCase();
const toMillis = (value) => {
  if (value && typeof value.toMillis === 'function') return value.toMillis();
  if (value && typeof value === 'object' && Number.isFinite(Number(value.seconds))) return Number(value.seconds) * 1000;
  return Number.isFinite(Number(value)) ? Number(value) : 0;
};

export function isInternalAdminFamily(familyId = '', data = {}) {
  const type = lower(data.familyType || data.type);
  const label = lower(data.customerLabel || data.subtitle || data.title || data.name);
  return clean(familyId) === INTERNAL_ADMIN_FAMILY_ID
    || data.internalAdminFamily === true
    || data.supportOnly === true
    || lower(data.accessMode) === 'support'
    || type === 'internal_admin'
    || label.includes('área técnica')
    || label.includes('area tecnica')
    || label.includes('admin interno');
}

function assertAdmin(user) {
  if (!user || lower(user.email) !== GLOBAL_ADMIN_EMAIL) throw new Error('Esta conta não possui permissão administrativa global.');
}

function isActive(value) {
  return !['inactive', 'revoked', 'removed', 'blocked', 'suspended', 'archived'].includes(lower(value) || 'active');
}

function expired(invite = {}) {
  const expiresAt = Number(invite.expiresAtClient || toMillis(invite.expiresAt));
  return Boolean(expiresAt && expiresAt <= Date.now());
}

function makeCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 8 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('');
}

function makeFamilyId(name = '') {
  const slug = clean(name).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 34) || 'cliente';
  return `family-${slug}-${Math.random().toString(36).slice(2, 7)}`;
}

function normalizeEvent(event = {}) {
  const start = Number(event.start || event.eventTime || 0);
  if (!Number.isFinite(start) || !start) return null;
  return { ...event, id: clean(event.id) || `event-${start}`, type: clean(event.type), start, end: Number(event.end || start) };
}

function buildIssues({ data, profile, members, invites, days }) {
  const issues = [];
  const activeMembers = members.filter((member) => isActive(member.status));
  const emails = activeMembers.map((member) => lower(member.email)).filter(Boolean);
  if (!clean(data.ownerUid) && !activeMembers.some((member) => member.role === 'owner')) issues.push('Família sem responsável principal definido.');
  if (!clean(profile.name || data.babyName)) issues.push('Perfil do bebê incompleto.');
  if (!activeMembers.length) issues.push('Família sem membros ativos.');
  if (new Set(emails).size !== emails.length) issues.push('Existem e-mails duplicados entre os membros.');
  if (invites.some((invite) => invite.status === 'expired')) issues.push('Existem convites expirados ainda não resolvidos.');
  if (!days.length) issues.push('Nenhuma rotina sincronizada foi encontrada.');
  return issues;
}

async function logAction(user, { action, summary, familyId = '', targetId = '', metadata = {} }) {
  assertAdmin(user);
  const services = await getFirebaseServices();
  const createdAtClient = Date.now();
  const id = `admin-${createdAtClient}-${Math.random().toString(36).slice(2, 7)}`;
  const payload = { id, familyId, action, summary, targetId, metadata, actorUid: user.uid, actorEmail: lower(user.email), source: ADMIN_WEB_VERSION, createdAtClient, createdAt: services.serverTimestamp() };
  const writes = [services.setDoc(services.doc(services.db, 'adminAuditLogs', id), payload, { merge: true })];
  if (familyId) writes.push(services.setDoc(services.doc(services.db, 'families', familyId, 'audit', id), payload, { merge: true }));
  await Promise.all(writes);
}

export async function loadAdminWorkspace(user) {
  assertAdmin(user);
  const services = await getFirebaseServices();
  const [familiesSnapshot, usersSnapshot, globalInvitesSnapshot, globalAuditSnapshot] = await Promise.all([
    services.getDocs(services.collection(services.db, 'families')),
    services.getDocs(services.collection(services.db, 'users')),
    services.getDocs(services.collection(services.db, 'invites')),
    services.getDocs(services.collection(services.db, 'adminAuditLogs')),
  ]);
  const globalInvites = globalInvitesSnapshot.docs.map((item) => ({ id: item.id, data: item.data() || {} }));
  const familyDocuments = familiesSnapshot.docs.filter((item) => !isInternalAdminFamily(item.id, item.data() || {}));
  const tickets = [];

  const families = await Promise.all(familyDocuments.map(async (familyDocument) => {
    const familyId = familyDocument.id;
    const data = familyDocument.data() || {};
    const [profileSnapshot, membersSnapshot, invitesSnapshot, auditsSnapshot, legalSnapshot, daysSnapshot] = await Promise.all([
      services.getDoc(services.doc(services.db, 'families', familyId, 'profile', 'main')),
      services.getDocs(services.collection(services.db, 'families', familyId, 'members')),
      services.getDocs(services.collection(services.db, 'families', familyId, 'invites')),
      services.getDocs(services.collection(services.db, 'families', familyId, 'audit')),
      services.getDocs(services.collection(services.db, 'families', familyId, 'legal')),
      services.getDocs(services.collection(services.db, 'families', familyId, 'days')),
    ]);
    const profile = profileSnapshot.exists() ? profileSnapshot.data() || {} : {};
    const members = membersSnapshot.docs.flatMap((item) => {
      const member = item.data() || {};
      if (lower(member.email) === GLOBAL_ADMIN_EMAIL || lower(member.role) === 'global_admin') return [];
      return [{ uid: item.id, email: lower(member.email), name: clean(member.name || member.displayName), relation: clean(member.relation || member.relationship), role: clean(member.role || 'cuidador'), status: lower(member.status || 'active'), lastSeenAt: toMillis(member.lastSeenAt || member.updatedAt) }];
    });
    const inviteMap = new Map();
    globalInvites.filter((item) => clean(item.data.familyId) === familyId).forEach((item) => inviteMap.set(item.id, item.data));
    invitesSnapshot.docs.forEach((item) => inviteMap.set(item.id, item.data() || {}));
    const invites = [...inviteMap.entries()].map(([code, invite]) => ({ code: clean(invite.code || code), familyId, email: lower(invite.email), role: clean(invite.role || 'cuidador'), status: expired(invite) && lower(invite.status || 'pending') === 'pending' ? 'expired' : lower(invite.status || 'pending'), expiresAt: Number(invite.expiresAtClient || toMillis(invite.expiresAt)), createdAt: Number(invite.createdAtClient || toMillis(invite.createdAt)) })).sort((a, b) => b.createdAt - a.createdAt);
    const days = daysSnapshot.docs.map((item) => {
      const dayData = item.data() || {};
      const source = dayData.state && typeof dayData.state === 'object' ? dayData.state : dayData;
      const events = (Array.isArray(source.events) ? source.events : []).map(normalizeEvent).filter(Boolean).sort((a, b) => a.start - b.start);
      return { dayId: item.id, events, eventCount: events.length, updatedAt: Math.max(toMillis(dayData.updatedAt), Number(dayData.clientUpdatedAt || 0), ...events.map((event) => event.end || event.start)) };
    }).sort((a, b) => b.dayId.localeCompare(a.dayId)).slice(0, 14);
    const audits = auditsSnapshot.docs.map((item) => { const value = item.data() || {}; return { id: item.id, familyId, action: clean(value.action || value.type || 'admin_action'), summary: clean(value.summary || value.detail || value.message || 'Ação administrativa'), actorEmail: clean(value.actorEmail || value.byEmail), createdAt: toMillis(value.createdAtClient || value.createdAt || value.updatedAt) }; }).sort((a, b) => b.createdAt - a.createdAt);
    const familyName = clean(data.title || data.name || profile.familyName || `Família ${familyId.slice(-6)}`);
    legalSnapshot.docs.forEach((item) => {
      const legal = item.data() || {};
      const type = lower(legal.type);
      if (!['support_request', 'data_deletion_request', 'privacy_request'].includes(type)) return;
      tickets.push({ id: item.id, familyId, familyName, uid: clean(legal.uid || legal.actorUid), email: lower(legal.email || legal.actorEmail), category: clean(legal.category || (type === 'data_deletion_request' ? 'Exclusão de dados' : 'Privacidade')), message: clean(legal.message || legal.description || 'Solicitação registrada pelo usuário.'), diagnostics: clean(legal.diagnostics), type, status: lower(legal.status || 'open'), note: clean(legal.note || legal.userNote), createdAt: toMillis(legal.createdAtClient || legal.requestedAtClient || legal.createdAt || legal.requestedAt) });
    });
    const rawPlan = lower(data.subscriptionPlan || data.plan || data.planId || 'trial');
    const plan = ['premium', 'courtesy', 'suspended'].includes(rawPlan) ? rawPlan : 'trial';
    return { id: familyId, name: familyName, babyName: clean(data.babyName || profile.name), birthDate: clean(profile.birthDate || data.birthDate), status: lower(data.status || 'active'), ownerUid: clean(data.ownerUid), ownerEmail: lower(data.ownerEmail || data.accountEmail), plan, subscriptionStatus: lower(data.subscriptionStatus || (plan === 'trial' ? 'trialing' : 'active')), trialEndsAt: toMillis(data.trialEndsAt || data.trialEndsAtClient), premiumUntil: toMillis(data.premiumUntil || data.premiumUntilClient), members, invites, days, audits, supportCount: 0, lastActivityAt: Math.max(toMillis(data.lastActivityAt || data.updatedAt), toMillis(profile.updatedAt), ...days.map((dayItem) => dayItem.updatedAt), ...members.map((member) => member.lastSeenAt)), integrityIssues: buildIssues({ data, profile, members, invites, days }) };
  }));

  tickets.forEach((ticket) => { const family = families.find((item) => item.id === ticket.familyId); if (family && !['resolved', 'rejected'].includes(ticket.status)) family.supportCount += 1; });
  families.sort((a, b) => b.lastActivityAt - a.lastActivityAt || a.name.localeCompare(b.name, 'pt-BR'));
  const userMap = new Map();
  usersSnapshot.docs.forEach((item) => { const data = item.data() || {}; const email = lower(data.email || data.accountEmail); if (email === GLOBAL_ADMIN_EMAIL) return; userMap.set(item.id, { uid: item.id, email, name: clean(data.name || data.displayName), status: lower(data.status || 'active'), families: [], hasPendingInvite: false, orphan: true, lastSeenAt: toMillis(data.lastSeenAt || data.updatedAt) }); });
  families.forEach((family) => family.members.forEach((member) => { const key = member.uid || `email:${member.email}`; const known = userMap.get(key) || { uid: member.uid, email: member.email, name: member.name, status: 'active', families: [], hasPendingInvite: false, orphan: false, lastSeenAt: 0 }; known.email ||= member.email; known.name ||= member.name; known.lastSeenAt = Math.max(known.lastSeenAt, member.lastSeenAt); known.families.push({ id: family.id, name: family.name, role: member.role, status: member.status }); known.orphan = false; userMap.set(key, known); }));
  families.forEach((family) => family.invites.filter((invite) => invite.status === 'pending').forEach((invite) => { const known = [...userMap.values()].find((item) => item.email === invite.email); if (known) known.hasPendingInvite = true; }));
  const users = [...userMap.values()].sort((a, b) => Number(b.orphan) - Number(a.orphan) || (a.email || a.uid).localeCompare(b.email || b.uid));
  const globalAudits = globalAuditSnapshot.docs.map((item) => { const value = item.data() || {}; return { id: item.id, familyId: clean(value.familyId), action: clean(value.action || value.type || 'admin_action'), summary: clean(value.summary || value.detail || value.message || 'Ação administrativa'), actorEmail: clean(value.actorEmail || value.byEmail), createdAt: toMillis(value.createdAtClient || value.createdAt || value.updatedAt) }; });
  const audits = [...globalAudits, ...families.flatMap((family) => family.audits)].sort((a, b) => b.createdAt - a.createdAt).slice(0, 200);
  tickets.sort((a, b) => b.createdAt - a.createdAt);
  const soon = Date.now() + 7 * 86400000;
  const stale = Date.now() - 14 * 86400000;
  return { families, users, tickets, audits, metrics: { activeFamilies: families.filter((family) => family.status === 'active').length, suspendedFamilies: families.filter((family) => family.status === 'suspended').length, activeUsers: users.filter((item) => item.status === 'active' && !item.orphan).length, pendingInvites: families.reduce((total, family) => total + family.invites.filter((invite) => invite.status === 'pending').length, 0), openTickets: tickets.filter((ticket) => !['resolved', 'rejected'].includes(ticket.status)).length, orphanUsers: users.filter((item) => item.orphan && !item.hasPendingInvite).length, trialsEndingSoon: families.filter((family) => family.plan === 'trial' && family.trialEndsAt > Date.now() && family.trialEndsAt <= soon).length, syncWarnings: families.filter((family) => family.lastActivityAt && family.lastActivityAt < stale).length } };
}

export async function createAdminFamily(user, input = {}) {
  assertAdmin(user); const services = await getFirebaseServices();
  const name = clean(input.familyName); const babyName = clean(input.babyName); const email = lower(input.responsibleEmail);
  if (!name || !babyName) throw new Error('Informe o nome da família e do bebê.');
  if (email && !email.includes('@')) throw new Error('Confira o e-mail do responsável.');
  const familyId = makeFamilyId(name); const now = Date.now(); const plan = ['trial', 'premium', 'courtesy'].includes(input.plan) ? input.plan : 'trial'; const days = Math.max(1, Number(input.days) || 14);
  await services.setDoc(services.doc(services.db, 'families', familyId), { familyId, title: name, name, babyName, familyType: 'client', status: 'active', ownerUid: '', ownerEmail: email, subscriptionPlan: plan, subscriptionStatus: plan === 'trial' ? 'trialing' : 'active', trialEndsAtClient: plan === 'trial' ? now + days * 86400000 : 0, premiumUntilClient: plan !== 'trial' ? now + days * 86400000 : 0, appVersion: ADMIN_WEB_VERSION, createdByAdminUid: user.uid, createdByAdminEmail: lower(user.email), createdAt: services.serverTimestamp(), updatedAt: services.serverTimestamp() }, { merge: true });
  await services.setDoc(services.doc(services.db, 'families', familyId, 'profile', 'main'), { familyId, familyName: name, name: babyName, birthDate: clean(input.birthDate), article: 'do', updatedAt: services.serverTimestamp() }, { merge: true });
  let invite = null; if (email) invite = await createAdminInvite(user, { id: familyId, name }, email, 'admin_familiar');
  await logAction(user, { action: 'family_created', summary: `${name} criada pelo painel administrativo.`, familyId, targetId: familyId, metadata: { plan, responsibleEmail: email } });
  return { familyId, invite };
}

export async function createAdminInvite(user, family, emailValue, roleValue = 'cuidador') {
  assertAdmin(user); const services = await getFirebaseServices(); const email = lower(emailValue); if (!email.includes('@')) throw new Error('Informe um e-mail válido.');
  const code = makeCode(); const now = Date.now(); const role = ['admin_familiar', 'cuidador', 'visualizacao'].includes(roleValue) ? roleValue : 'cuidador';
  const payload = { code, familyId: family.id, email, role, status: 'pending', maxUses: 1, useCount: 0, expiresAtClient: now + 7 * 86400000, createdAtClient: now, createdByUid: user.uid, createdByEmail: lower(user.email), source: ADMIN_WEB_VERSION, createdAt: services.serverTimestamp(), updatedAt: services.serverTimestamp() };
  await Promise.all([services.setDoc(services.doc(services.db, 'invites', code), payload, { merge: true }), services.setDoc(services.doc(services.db, 'families', family.id, 'invites', code), payload, { merge: true }), services.setDoc(services.doc(services.db, 'families', family.id, 'invitations', code), payload, { merge: true })]);
  await logAction(user, { action: 'invite_created', summary: `Convite criado para ${email}.`, familyId: family.id, targetId: code, metadata: { role } }); return { ...payload, expiresAt: payload.expiresAtClient, createdAt: now };
}

export async function updateAdminInvite(user, invite, action, reason = '') {
  assertAdmin(user); const services = await getFirebaseServices(); const patch = action === 'renew' ? { status: 'pending', useCount: 0, expiresAtClient: Date.now() + 7 * 86400000, renewedAt: services.serverTimestamp(), updatedAt: services.serverTimestamp() } : { status: 'cancelled', cancelledAt: services.serverTimestamp(), updatedAt: services.serverTimestamp() };
  await Promise.all([services.setDoc(services.doc(services.db, 'invites', invite.code), patch, { merge: true }), services.setDoc(services.doc(services.db, 'families', invite.familyId, 'invites', invite.code), patch, { merge: true }), services.setDoc(services.doc(services.db, 'families', invite.familyId, 'invitations', invite.code), patch, { merge: true })]);
  await logAction(user, { action: action === 'renew' ? 'invite_renewed' : 'invite_cancelled', summary: `Convite de ${invite.email} ${action === 'renew' ? 'renovado' : 'cancelado'}.`, familyId: invite.familyId, targetId: invite.code, metadata: { reason } });
}

export async function updateAdminFamily(user, family, patch, action, reason = '') {
  assertAdmin(user); const services = await getFirebaseServices(); await services.setDoc(services.doc(services.db, 'families', family.id), { ...patch, updatedAt: services.serverTimestamp(), updatedByEmail: lower(user.email) }, { merge: true }); await logAction(user, { action, summary: `${family.name}: configuração administrativa atualizada.`, familyId: family.id, targetId: family.id, metadata: { ...patch, reason } });
}

export async function updateAdminMember(user, family, member, patch, reason = '') {
  assertAdmin(user); const services = await getFirebaseServices(); const next = { ...patch, updatedAt: services.serverTimestamp(), updatedBy: user.uid, updatedByEmail: lower(user.email) };
  const writes = [services.setDoc(services.doc(services.db, 'families', family.id, 'members', member.uid), next, { merge: true }), services.setDoc(services.doc(services.db, 'users', member.uid, 'families', family.id), next, { merge: true })];
  const legacyRef = services.doc(services.db, 'users', member.uid, 'access', 'ninou');
  const legacySnapshot = await services.getDoc(legacyRef);
  if (legacySnapshot.exists() && clean(legacySnapshot.data()?.familyId) === family.id) writes.push(services.setDoc(legacyRef, next, { merge: true }));
  await Promise.all(writes);
  await logAction(user, { action: 'member_updated', summary: `${member.email || member.name || member.uid}: acesso atualizado.`, familyId: family.id, targetId: member.uid, metadata: { ...patch, reason } });
}

export async function transferAdminOwnership(user, family, member, reason = '') {
  assertAdmin(user); const services = await getFirebaseServices(); const writes = [];
  family.members.filter((item) => item.role === 'owner' && item.uid !== member.uid).forEach((oldOwner) => { writes.push(services.setDoc(services.doc(services.db, 'families', family.id, 'members', oldOwner.uid), { role: 'admin_familiar', updatedAt: services.serverTimestamp() }, { merge: true })); writes.push(services.setDoc(services.doc(services.db, 'users', oldOwner.uid, 'families', family.id), { role: 'admin_familiar', updatedAt: services.serverTimestamp() }, { merge: true })); });
  writes.push(services.setDoc(services.doc(services.db, 'families', family.id, 'members', member.uid), { role: 'owner', status: 'active', updatedAt: services.serverTimestamp() }, { merge: true }));
  writes.push(services.setDoc(services.doc(services.db, 'users', member.uid, 'families', family.id), { familyId: family.id, role: 'owner', status: 'active', ownerUid: member.uid, updatedAt: services.serverTimestamp() }, { merge: true }));
  writes.push(services.setDoc(services.doc(services.db, 'users', member.uid, 'access', 'ninou'), { familyId: family.id, role: 'owner', status: 'active', ownerUid: member.uid, email: member.email, updatedAt: services.serverTimestamp() }, { merge: true }));
  writes.push(services.setDoc(services.doc(services.db, 'families', family.id), { ownerUid: member.uid, ownerEmail: member.email, updatedAt: services.serverTimestamp(), updatedByEmail: lower(user.email) }, { merge: true })); await Promise.all(writes);
  await logAction(user, { action: 'ownership_transferred', summary: `Responsabilidade transferida para ${member.email || member.name}.`, familyId: family.id, targetId: member.uid, metadata: { reason } });
}

export async function updateAdminUser(user, knownUser, status, reason = '') {
  assertAdmin(user); const services = await getFirebaseServices(); if (!knownUser.uid) throw new Error('Esta conta ainda não possui UID.');
  await services.setDoc(services.doc(services.db, 'users', knownUser.uid), { status, email: knownUser.email, updatedAt: services.serverTimestamp(), updatedByEmail: lower(user.email) }, { merge: true });
  await Promise.all(knownUser.families.map((family) => services.setDoc(services.doc(services.db, 'families', family.id, 'members', knownUser.uid), { status: status === 'blocked' ? 'blocked' : 'active', updatedAt: services.serverTimestamp() }, { merge: true })));
  await logAction(user, { action: 'user_status_updated', summary: `${knownUser.email || knownUser.uid}: conta ${status === 'blocked' ? 'bloqueada' : 'reativada'}.`, targetId: knownUser.uid, metadata: { status, reason } });
}

export async function updateAdminTicket(user, ticket, status, note = '') {
  assertAdmin(user); const services = await getFirebaseServices(); const patch = { status, note: clean(note), resolvedAt: ['resolved', 'rejected'].includes(status) ? services.serverTimestamp() : null, updatedAt: services.serverTimestamp(), updatedByEmail: lower(user.email) };
  await services.setDoc(services.doc(services.db, 'families', ticket.familyId, 'legal', ticket.id), patch, { merge: true });
  if (ticket.uid && ticket.type === 'support_request') await services.setDoc(services.doc(services.db, 'users', ticket.uid, 'account', 'supportLastRequest'), patch, { merge: true });
  if (ticket.uid && ticket.type === 'data_deletion_request') await services.setDoc(services.doc(services.db, 'users', ticket.uid, 'account', 'dataDeletionRequest'), patch, { merge: true });
  await logAction(user, { action: 'ticket_updated', summary: `${ticket.category}: status alterado para ${status}.`, familyId: ticket.familyId, targetId: ticket.id, metadata: { status, note: clean(note) } });
}

export async function logIntegrityCheck(user, family) {
  await logAction(user, { action: 'integrity_check', summary: family.integrityIssues.length ? `Diagnóstico encontrou ${family.integrityIssues.length} alerta(s).` : 'Diagnóstico concluído sem alertas.', familyId: family.id, targetId: family.id, metadata: { issues: family.integrityIssues } });
}
