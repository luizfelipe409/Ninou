import type { User } from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  writeBatch,
} from 'firebase/firestore';

import { ADMIN_APP_VERSION, isInternalAdminFamily } from '@/domain/admin-policy';
import { isGlobalAppAdminEmail } from '@/domain/family-access';
import { normalizeDayState, type RoutineEvent } from '@/domain/routine';
import { db } from '@/services/firebase';

export { ADMIN_APP_VERSION, INTERNAL_ADMIN_FAMILY_ID, isInternalAdminFamily } from '@/domain/admin-policy';

export type AdminPlan = 'trial' | 'premium' | 'courtesy' | 'suspended';
export type AdminFamilyStatus = 'active' | 'suspended' | 'archived';
export type AdminTicketStatus = 'open' | 'in_progress' | 'resolved' | 'rejected';

export type AdminMember = {
  uid: string;
  email: string;
  name: string;
  relation: string;
  role: string;
  status: string;
  lastSeenAt: number;
  deviceId: string;
};

export type AdminInvite = {
  code: string;
  familyId: string;
  email: string;
  role: string;
  status: string;
  expiresAt: number;
  createdAt: number;
};

export type AdminRoutineDay = {
  dayId: string;
  events: RoutineEvent[];
  eventCount: number;
  updatedAt: number;
};

export type AdminAuditEntry = {
  id: string;
  familyId: string;
  action: string;
  summary: string;
  actorEmail: string;
  createdAt: number;
};

export type AdminSupportTicket = {
  id: string;
  familyId: string;
  familyName: string;
  uid: string;
  email: string;
  category: string;
  message: string;
  diagnostics: string;
  type: 'support_request' | 'data_deletion_request' | 'privacy_request';
  status: string;
  note: string;
  createdAt: number;
};

export type AdminFamily = {
  id: string;
  name: string;
  babyName: string;
  birthDate: string;
  status: string;
  ownerUid: string;
  ownerEmail: string;
  plan: AdminPlan;
  subscriptionStatus: string;
  trialEndsAt: number;
  premiumUntil: number;
  members: AdminMember[];
  invites: AdminInvite[];
  routineDays: AdminRoutineDay[];
  audits: AdminAuditEntry[];
  supportCount: number;
  lastActivityAt: number;
  integrityIssues: string[];
};

export type AdminKnownUser = {
  uid: string;
  email: string;
  name: string;
  status: string;
  families: { id: string; name: string; role: string; status: string }[];
  hasPendingInvite: boolean;
  orphan: boolean;
  lastSeenAt: number;
};

export type AdminWorkspace = {
  families: AdminFamily[];
  users: AdminKnownUser[];
  tickets: AdminSupportTicket[];
  audits: AdminAuditEntry[];
  metrics: {
    activeFamilies: number;
    suspendedFamilies: number;
    activeUsers: number;
    pendingInvites: number;
    openTickets: number;
    orphanUsers: number;
    trialsEndingSoon: number;
    syncWarnings: number;
  };
};

function clean(value: unknown) {
  return String(value || '').trim();
}

function lower(value: unknown) {
  return clean(value).toLowerCase();
}

function toMillis(value: unknown) {
  if (value && typeof (value as { toMillis?: unknown }).toMillis === 'function') return (value as { toMillis: () => number }).toMillis();
  if (value && typeof value === 'object' && Number.isFinite(Number((value as { seconds?: number }).seconds))) return Number((value as { seconds: number }).seconds) * 1000;
  return Number.isFinite(Number(value)) ? Number(value) : 0;
}

function isActiveStatus(value: unknown) {
  return !['inactive', 'revoked', 'removed', 'blocked', 'suspended', 'archived'].includes(lower(value) || 'active');
}

export function normalizeAdminRole(value: unknown) {
  const role = lower(value);
  if (['owner', 'responsavel', 'responsável', 'pai', 'mae', 'mãe'].includes(role)) return 'owner';
  if (['admin_familiar', 'admin', 'manager', 'gestor'].includes(role)) return 'admin_familiar';
  if (['visualizacao', 'visualização', 'viewer', 'read_only'].includes(role)) return 'visualizacao';
  return ['cuidador', 'caregiver'].includes(role) ? 'cuidador' : (role || 'cuidador');
}

function assertGlobalAdmin(user: User) {
  if (!isGlobalAppAdminEmail(user.email)) throw new Error('Esta conta não possui permissão administrativa global.');
}

function inviteExpired(data: Record<string, unknown>) {
  const expiresAt = Number(data.expiresAtClient || toMillis(data.expiresAt));
  return Boolean(expiresAt && expiresAt <= Date.now());
}

function buildIntegrityIssues(input: { data: Record<string, unknown>; profile: Record<string, unknown>; members: AdminMember[]; invites: AdminInvite[]; routineDays: AdminRoutineDay[] }) {
  const issues: string[] = [];
  const activeMembers = input.members.filter((member) => isActiveStatus(member.status));
  const ownerMembers = activeMembers.filter((member) => normalizeAdminRole(member.role) === 'owner');
  const emails = activeMembers.map((member) => lower(member.email)).filter(Boolean);
  if (!clean(input.data.ownerUid) && !ownerMembers.length) issues.push('Família sem responsável principal definido.');
  if (!clean(input.data.ownerUid) && ownerMembers.length) issues.push('O responsável existe, mas o vínculo principal ainda precisa ser consolidado.');
  if (ownerMembers.length > 1) issues.push('Mais de um membro está marcado como responsável principal.');
  if (!clean(input.profile.name || input.data.babyName)) issues.push('Perfil do bebê incompleto.');
  if (!activeMembers.length) issues.push('Família sem membros ativos.');
  if (new Set(emails).size !== emails.length) issues.push('Existem e-mails duplicados entre os membros.');
  if (input.invites.filter((invite) => invite.status === 'pending' && invite.expiresAt <= Date.now()).length) issues.push('Existem convites expirados ainda marcados como pendentes.');
  if (!input.routineDays.length) issues.push('Nenhuma rotina sincronizada foi encontrada.');
  if (input.routineDays.some((day) => day.events.some((event) => !event.type || !event.start))) issues.push('Existem registros de rotina incompletos.');
  const plan = lower(input.data.subscriptionPlan || input.data.plan || 'trial');
  const planEndsAt = plan === 'trial' ? toMillis(input.data.trialEndsAt || input.data.trialEndsAtClient) : toMillis(input.data.premiumUntil || input.data.premiumUntilClient);
  if (plan !== 'suspended' && !planEndsAt) issues.push('O acesso não possui uma data de validade definida.');
  if (plan !== 'suspended' && planEndsAt && planEndsAt <= Date.now()) issues.push('A validade do acesso terminou.');
  return issues;
}

function normalizeAudit(id: string, data: Record<string, unknown>, fallbackFamilyId = ''): AdminAuditEntry {
  return {
    id,
    familyId: clean(data.familyId || fallbackFamilyId),
    action: clean(data.action || data.type || 'admin_action'),
    summary: clean(data.summary || data.detail || data.message || 'Ação administrativa'),
    actorEmail: clean(data.actorEmail || data.byEmail || data.updatedByEmail),
    createdAt: toMillis(data.createdAtClient || data.createdAt || data.updatedAt),
  };
}

export async function loadAdminWorkspace(user: User): Promise<AdminWorkspace> {
  assertGlobalAdmin(user);
  const [familiesSnapshot, usersSnapshot, globalInvitesSnapshot, globalAuditSnapshot] = await Promise.all([
    getDocs(collection(db, 'families')),
    getDocs(collection(db, 'users')),
    getDocs(collection(db, 'invites')),
    getDocs(collection(db, 'adminAuditLogs')),
  ]);

  const globalInvites = globalInvitesSnapshot.docs.map((inviteDocument) => ({ id: inviteDocument.id, data: inviteDocument.data() }));
  const clientFamilyDocuments = familiesSnapshot.docs.filter((familyDocument) => !isInternalAdminFamily(familyDocument.id, familyDocument.data()));
  const allTickets: AdminSupportTicket[] = [];

  const families = await Promise.all(clientFamilyDocuments.map(async (familyDocument) => {
    const data = familyDocument.data();
    const familyId = familyDocument.id;
    const [profileSnapshot, membersSnapshot, invitesSnapshot, auditSnapshot, legalSnapshot, daysSnapshot] = await Promise.all([
      getDoc(doc(db, 'families', familyId, 'profile', 'main')),
      getDocs(collection(db, 'families', familyId, 'members')),
      getDocs(collection(db, 'families', familyId, 'invites')),
      getDocs(collection(db, 'families', familyId, 'audit')),
      getDocs(collection(db, 'families', familyId, 'legal')),
      getDocs(collection(db, 'families', familyId, 'days')),
    ]);
    const profile = profileSnapshot.exists() ? profileSnapshot.data() : {};
    const members = membersSnapshot.docs.flatMap((memberDocument) => {
      const member = memberDocument.data();
      if (isGlobalAppAdminEmail(clean(member.email)) || lower(member.role) === 'global_admin') return [];
      return [{
        uid: memberDocument.id,
        email: lower(member.email),
        name: clean(member.name || member.displayName),
        relation: clean(member.relation || member.relationship),
        role: normalizeAdminRole(member.role),
        status: clean(member.status || 'active'),
        lastSeenAt: toMillis(member.lastSeenAt || member.updatedAt),
        deviceId: clean(member.deviceId),
      } satisfies AdminMember];
    });
    const familyInviteMap = new Map<string, Record<string, unknown>>();
    globalInvites.filter((invite) => clean(invite.data.familyId) === familyId).forEach((invite) => familyInviteMap.set(invite.id, invite.data));
    invitesSnapshot.docs.forEach((inviteDocument) => familyInviteMap.set(inviteDocument.id, inviteDocument.data()));
    const invites = [...familyInviteMap.entries()].map(([code, invite]) => ({
      code: clean(invite.code || code),
      familyId,
      email: lower(invite.email),
      role: clean(invite.role || 'caregiver'),
      status: inviteExpired(invite) && lower(invite.status || 'pending') === 'pending' ? 'expired' : lower(invite.status || 'pending'),
      expiresAt: Number(invite.expiresAtClient || toMillis(invite.expiresAt)),
      createdAt: Number(invite.createdAtClient || toMillis(invite.createdAt)),
    } satisfies AdminInvite)).sort((left, right) => right.createdAt - left.createdAt);
    const routineDays = daysSnapshot.docs.map((dayDocument) => {
      const dayData = dayDocument.data();
      const state = normalizeDayState((dayData.state && typeof dayData.state === 'object' ? dayData.state : dayData));
      return {
        dayId: dayDocument.id,
        events: state.events,
        eventCount: state.events.length,
        updatedAt: Math.max(toMillis(dayData.updatedAt), Number(dayData.clientUpdatedAt || 0), ...state.events.map((event) => event.end || event.start)),
      } satisfies AdminRoutineDay;
    }).sort((left, right) => right.dayId.localeCompare(left.dayId)).slice(0, 14);
    const audits = auditSnapshot.docs.map((auditDocument) => normalizeAudit(auditDocument.id, auditDocument.data(), familyId)).sort((left, right) => right.createdAt - left.createdAt);
    const familyName = clean(data.title || data.name || profile.familyName || `Família ${familyId.slice(-6)}`);
    legalSnapshot.docs.forEach((legalDocument) => {
      const legal = legalDocument.data();
      const type = lower(legal.type);
      if (!['support_request', 'data_deletion_request', 'privacy_request'].includes(type)) return;
      allTickets.push({
        id: legalDocument.id,
        familyId,
        familyName,
        uid: clean(legal.uid || legal.actorUid),
        email: lower(legal.email || legal.actorEmail),
        category: clean(legal.category || (type === 'data_deletion_request' ? 'Exclusão de dados' : 'Privacidade')),
        message: clean(legal.message || legal.description || 'Solicitação registrada pelo usuário.'),
        diagnostics: clean(legal.diagnostics),
        type: type as AdminSupportTicket['type'],
        status: lower(legal.status || 'open'),
        note: clean(legal.note || legal.userNote),
        createdAt: toMillis(legal.createdAtClient || legal.requestedAtClient || legal.createdAt || legal.requestedAt),
      });
    });
    const lastActivityAt = Math.max(
      toMillis(data.lastActivityAt || data.updatedAt),
      toMillis(profile.updatedAt),
      ...routineDays.map((day) => day.updatedAt),
      ...members.map((member) => member.lastSeenAt),
    );
    const rawPlan = lower(data.subscriptionPlan || data.plan || data.planId || 'trial');
    const plan: AdminPlan = ['premium', 'courtesy', 'suspended'].includes(rawPlan) ? rawPlan as AdminPlan : 'trial';
    const partial = { data, profile, members, invites, routineDays };
    return {
      id: familyId,
      name: familyName,
      babyName: clean(data.babyName || profile.name),
      birthDate: clean(profile.birthDate || data.birthDate),
      status: lower(data.status || 'active'),
      ownerUid: clean(data.ownerUid),
      ownerEmail: lower(data.ownerEmail || data.accountEmail),
      plan,
      subscriptionStatus: lower(data.subscriptionStatus || (plan === 'trial' ? 'trialing' : 'active')),
      trialEndsAt: toMillis(data.trialEndsAt || data.trialEndsAtClient),
      premiumUntil: toMillis(data.premiumUntil || data.premiumUntilClient),
      members,
      invites,
      routineDays,
      audits,
      supportCount: 0,
      lastActivityAt,
      integrityIssues: buildIntegrityIssues(partial),
    } satisfies AdminFamily;
  }));

  allTickets.forEach((ticket) => {
    const family = families.find((item) => item.id === ticket.familyId);
    if (family && !['resolved', 'rejected'].includes(ticket.status)) family.supportCount += 1;
  });
  families.sort((left, right) => right.lastActivityAt - left.lastActivityAt || left.name.localeCompare(right.name, 'pt-BR'));

  const userMap = new Map<string, AdminKnownUser>();
  usersSnapshot.docs.forEach((userDocument) => {
    const data = userDocument.data();
    const email = lower(data.email || data.accountEmail);
    if (isGlobalAppAdminEmail(email)) return;
    userMap.set(userDocument.id, { uid: userDocument.id, email, name: clean(data.name || data.displayName), status: lower(data.status || 'active'), families: [], hasPendingInvite: false, orphan: true, lastSeenAt: toMillis(data.lastSeenAt || data.updatedAt) });
  });
  families.forEach((family) => family.members.forEach((member) => {
    const key = member.uid || `email:${member.email}`;
    const known = userMap.get(key) || { uid: member.uid, email: member.email, name: member.name, status: 'active', families: [], hasPendingInvite: false, orphan: false, lastSeenAt: 0 };
    known.email ||= member.email;
    known.name ||= member.name;
    known.lastSeenAt = Math.max(known.lastSeenAt, member.lastSeenAt);
    known.families.push({ id: family.id, name: family.name, role: member.role, status: member.status });
    known.orphan = false;
    userMap.set(key, known);
  }));
  families.forEach((family) => family.invites.filter((invite) => invite.status === 'pending').forEach((invite) => {
    const known = [...userMap.values()].find((userItem) => userItem.email === invite.email);
    if (known) known.hasPendingInvite = true;
  }));
  const users = [...userMap.values()].sort((left, right) => Number(right.orphan) - Number(left.orphan) || (left.email || left.uid).localeCompare(right.email || right.uid));
  const globalAudits = globalAuditSnapshot.docs.map((auditDocument) => normalizeAudit(auditDocument.id, auditDocument.data()));
  const audits = [...globalAudits, ...families.flatMap((family) => family.audits)].sort((left, right) => right.createdAt - left.createdAt).slice(0, 200);
  allTickets.sort((left, right) => right.createdAt - left.createdAt);
  const soon = Date.now() + 7 * 86400000;
  const stale = Date.now() - 14 * 86400000;
  return {
    families,
    users,
    tickets: allTickets,
    audits,
    metrics: {
      activeFamilies: families.filter((family) => family.status === 'active').length,
      suspendedFamilies: families.filter((family) => family.status === 'suspended').length,
      activeUsers: users.filter((knownUser) => knownUser.status === 'active' && !knownUser.orphan).length,
      pendingInvites: families.reduce((total, family) => total + family.invites.filter((invite) => invite.status === 'pending').length, 0),
      openTickets: allTickets.filter((ticket) => !['resolved', 'rejected'].includes(ticket.status)).length,
      orphanUsers: users.filter((knownUser) => knownUser.orphan && !knownUser.hasPendingInvite).length,
      trialsEndingSoon: families.filter((family) => family.plan === 'trial' && family.trialEndsAt > Date.now() && family.trialEndsAt <= soon).length,
      syncWarnings: families.filter((family) => family.lastActivityAt && family.lastActivityAt < stale).length,
    },
  };
}

function makeCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 8 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('');
}

function makeFamilyId(name: string) {
  const slug = name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 34) || 'cliente';
  return `family-${slug}-${Math.random().toString(36).slice(2, 7)}`;
}

async function logAdminAction(user: User, input: { action: string; summary: string; familyId?: string; targetId?: string; metadata?: Record<string, unknown> }) {
  assertGlobalAdmin(user);
  const createdAtClient = Date.now();
  const id = `admin-${createdAtClient}-${Math.random().toString(36).slice(2, 7)}`;
  const payload = {
    id,
    familyId: input.familyId || '',
    action: input.action,
    summary: input.summary,
    targetId: input.targetId || '',
    metadata: input.metadata || {},
    actorUid: user.uid,
    actorEmail: lower(user.email),
    source: ADMIN_APP_VERSION,
    createdAtClient,
    createdAt: serverTimestamp(),
  };
  const batch = writeBatch(db);
  batch.set(doc(db, 'adminAuditLogs', id), payload, { merge: true });
  if (input.familyId) batch.set(doc(db, 'families', input.familyId, 'audit', id), payload, { merge: true });
  await batch.commit();
}

export async function adminCreateFamily(user: User, input: { familyName: string; babyName: string; birthDate?: string; responsibleEmail?: string; plan: AdminPlan; trialDays?: number }) {
  assertGlobalAdmin(user);
  const familyName = clean(input.familyName);
  const babyName = clean(input.babyName);
  const responsibleEmail = lower(input.responsibleEmail);
  if (!familyName || !babyName) throw new Error('Informe o nome da família e do bebê.');
  if (responsibleEmail && !responsibleEmail.includes('@')) throw new Error('Confira o e-mail do responsável.');
  const familyId = makeFamilyId(familyName);
  const now = Date.now();
  const trialEndsAtClient = input.plan === 'trial' ? now + Math.max(1, input.trialDays || 14) * 86400000 : 0;
  const batch = writeBatch(db);
  batch.set(doc(db, 'families', familyId), {
    familyId,
    title: familyName,
    name: familyName,
    babyName,
    familyType: 'client',
    status: 'active',
    ownerUid: '',
    ownerEmail: responsibleEmail,
    subscriptionPlan: input.plan,
    subscriptionStatus: input.plan === 'trial' ? 'trialing' : 'active',
    trialEndsAtClient,
    appVersion: ADMIN_APP_VERSION,
    createdByAdminUid: user.uid,
    createdByAdminEmail: lower(user.email),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }, { merge: true });
  batch.set(doc(db, 'families', familyId, 'profile', 'main'), { familyId, familyName, name: babyName, birthDate: clean(input.birthDate), article: 'do', updatedAt: serverTimestamp() }, { merge: true });
  let invite: AdminInvite | null = null;
  if (responsibleEmail) {
    const code = makeCode();
    const payload = { code, familyId, email: responsibleEmail, role: 'admin_familiar', intendedRole: 'owner', status: 'pending', maxUses: 1, useCount: 0, expiresAtClient: now + 7 * 86400000, createdAtClient: now, createdByUid: user.uid, createdByEmail: lower(user.email), source: ADMIN_APP_VERSION, createdAt: serverTimestamp(), updatedAt: serverTimestamp() };
    batch.set(doc(db, 'invites', code), payload, { merge: true });
    batch.set(doc(db, 'families', familyId, 'invites', code), payload, { merge: true });
    batch.set(doc(db, 'families', familyId, 'invitations', code), payload, { merge: true });
    invite = { code, familyId, email: responsibleEmail, role: 'admin_familiar', status: 'pending', expiresAt: now + 7 * 86400000, createdAt: now };
  }
  await batch.commit();
  await logAdminAction(user, { action: 'family_created', summary: `${familyName} criada pelo painel administrativo.`, familyId, targetId: familyId, metadata: { plan: input.plan, responsibleEmail } });
  return { familyId, invite };
}

export async function adminCreateInvite(user: User, family: Pick<AdminFamily, 'id' | 'name'>, emailValue: string, role: string) {
  assertGlobalAdmin(user);
  const email = lower(emailValue);
  if (!email.includes('@')) throw new Error('Informe um e-mail válido.');
  const code = makeCode();
  const now = Date.now();
  const safeRole = ['admin_familiar', 'cuidador', 'visualizacao'].includes(role) ? role : 'cuidador';
  const payload = { code, familyId: family.id, email, role: safeRole, status: 'pending', maxUses: 1, useCount: 0, expiresAtClient: now + 7 * 86400000, createdAtClient: now, createdByUid: user.uid, createdByEmail: lower(user.email), source: ADMIN_APP_VERSION, createdAt: serverTimestamp(), updatedAt: serverTimestamp() };
  const batch = writeBatch(db);
  batch.set(doc(db, 'invites', code), payload, { merge: true });
  batch.set(doc(db, 'families', family.id, 'invites', code), payload, { merge: true });
  batch.set(doc(db, 'families', family.id, 'invitations', code), payload, { merge: true });
  await batch.commit();
  await logAdminAction(user, { action: 'invite_created', summary: `Convite criado para ${email}.`, familyId: family.id, targetId: code, metadata: { role: safeRole } });
  return { code, familyId: family.id, email, role: safeRole, status: 'pending', expiresAt: now + 7 * 86400000, createdAt: now } satisfies AdminInvite;
}

export async function adminUpdateInvite(user: User, invite: AdminInvite, action: 'renew' | 'cancel') {
  assertGlobalAdmin(user);
  const patch = action === 'renew'
    ? { status: 'pending', useCount: 0, expiresAtClient: Date.now() + 7 * 86400000, renewedAt: serverTimestamp(), updatedAt: serverTimestamp() }
    : { status: 'cancelled', cancelledAt: serverTimestamp(), updatedAt: serverTimestamp() };
  const batch = writeBatch(db);
  batch.set(doc(db, 'invites', invite.code), patch, { merge: true });
  batch.set(doc(db, 'families', invite.familyId, 'invites', invite.code), patch, { merge: true });
  batch.set(doc(db, 'families', invite.familyId, 'invitations', invite.code), patch, { merge: true });
  await batch.commit();
  await logAdminAction(user, { action: action === 'renew' ? 'invite_renewed' : 'invite_cancelled', summary: `Convite de ${invite.email} ${action === 'renew' ? 'renovado' : 'cancelado'}.`, familyId: invite.familyId, targetId: invite.code });
}

export async function adminUpdateFamilyStatus(user: User, family: Pick<AdminFamily, 'id' | 'name'>, status: AdminFamilyStatus) {
  assertGlobalAdmin(user);
  await setDoc(doc(db, 'families', family.id), { status, updatedAt: serverTimestamp(), updatedByEmail: lower(user.email) }, { merge: true });
  await logAdminAction(user, { action: 'family_status_updated', summary: `${family.name}: status alterado para ${status}.`, familyId: family.id, targetId: family.id, metadata: { status } });
}

export async function adminUpdateSubscription(user: User, family: Pick<AdminFamily, 'id' | 'name'>, input: { plan: AdminPlan; days: number }) {
  assertGlobalAdmin(user);
  const until = Date.now() + Math.max(1, input.days || 30) * 86400000;
  await setDoc(doc(db, 'families', family.id), {
    subscriptionPlan: input.plan,
    subscriptionStatus: input.plan === 'suspended' ? 'suspended' : input.plan === 'trial' ? 'trialing' : 'active',
    trialEndsAtClient: input.plan === 'trial' ? until : 0,
    premiumUntilClient: input.plan === 'premium' || input.plan === 'courtesy' ? until : 0,
    updatedAt: serverTimestamp(),
    updatedByEmail: lower(user.email),
  }, { merge: true });
  await logAdminAction(user, { action: 'subscription_updated', summary: `${family.name}: plano alterado para ${input.plan}.`, familyId: family.id, targetId: family.id, metadata: { plan: input.plan, days: input.days } });
}

export async function adminUpdateMember(user: User, family: Pick<AdminFamily, 'id' | 'name'>, member: AdminMember, patch: { role?: string; status?: string }) {
  assertGlobalAdmin(user);
  const next = { ...patch, updatedAt: serverTimestamp(), updatedBy: user.uid, updatedByEmail: lower(user.email) };
  const batch = writeBatch(db);
  batch.set(doc(db, 'families', family.id, 'members', member.uid), next, { merge: true });
  batch.set(doc(db, 'users', member.uid, 'families', family.id), next, { merge: true });
  const legacy = await getDoc(doc(db, 'users', member.uid, 'access', 'ninou'));
  if (legacy.exists() && clean(legacy.data().familyId) === family.id) batch.set(doc(db, 'users', member.uid, 'access', 'ninou'), next, { merge: true });
  await batch.commit();
  await logAdminAction(user, { action: 'member_updated', summary: `${member.email || member.name || member.uid}: acesso atualizado.`, familyId: family.id, targetId: member.uid, metadata: patch });
}

export async function adminTransferOwnership(user: User, family: AdminFamily, member: AdminMember) {
  assertGlobalAdmin(user);
  if (!clean(member.uid)) throw new Error('Este membro não possui uma identidade válida para receber a responsabilidade.');
  const batch = writeBatch(db);
  family.members.filter((item) => normalizeAdminRole(item.role) === 'owner' && item.uid !== member.uid).forEach((oldOwner) => {
    batch.set(doc(db, 'families', family.id, 'members', oldOwner.uid), { role: 'admin_familiar', updatedAt: serverTimestamp() }, { merge: true });
    batch.set(doc(db, 'users', oldOwner.uid, 'families', family.id), { role: 'admin_familiar', updatedAt: serverTimestamp() }, { merge: true });
  });
  batch.set(doc(db, 'families', family.id, 'members', member.uid), { role: 'owner', status: 'active', updatedAt: serverTimestamp() }, { merge: true });
  batch.set(doc(db, 'users', member.uid, 'families', family.id), { familyId: family.id, role: 'owner', status: 'active', ownerUid: member.uid, updatedAt: serverTimestamp() }, { merge: true });
  batch.set(doc(db, 'users', member.uid, 'access', 'ninou'), { familyId: family.id, role: 'owner', status: 'active', ownerUid: member.uid, email: member.email, updatedAt: serverTimestamp() }, { merge: true });
  batch.set(doc(db, 'families', family.id), { ownerUid: member.uid, ownerEmail: member.email, updatedAt: serverTimestamp(), updatedByEmail: lower(user.email) }, { merge: true });
  await batch.commit();
  await logAdminAction(user, { action: 'ownership_transferred', summary: `Responsabilidade principal transferida para ${member.email || member.name}.`, familyId: family.id, targetId: member.uid });
}

export async function adminUpdateUserStatus(user: User, knownUser: AdminKnownUser, status: 'active' | 'blocked') {
  assertGlobalAdmin(user);
  if (!knownUser.uid) throw new Error('Esta conta ainda não possui UID para ser bloqueada.');
  await setDoc(doc(db, 'users', knownUser.uid), { status, email: knownUser.email, updatedAt: serverTimestamp(), updatedByEmail: lower(user.email) }, { merge: true });
  await Promise.all(knownUser.families.map((family) => setDoc(doc(db, 'families', family.id, 'members', knownUser.uid), { status: status === 'blocked' ? 'blocked' : 'active', updatedAt: serverTimestamp() }, { merge: true })));
  await logAdminAction(user, { action: 'user_status_updated', summary: `${knownUser.email || knownUser.uid}: conta ${status === 'blocked' ? 'bloqueada' : 'reativada'}.`, targetId: knownUser.uid, metadata: { status } });
}

export async function adminUpdateTicket(user: User, ticket: AdminSupportTicket, status: AdminTicketStatus, note: string) {
  assertGlobalAdmin(user);
  const patch = { status, note: clean(note), resolvedAt: ['resolved', 'rejected'].includes(status) ? serverTimestamp() : null, updatedAt: serverTimestamp(), updatedByEmail: lower(user.email) };
  await setDoc(doc(db, 'families', ticket.familyId, 'legal', ticket.id), patch, { merge: true });
  if (ticket.uid && ticket.type === 'support_request') await setDoc(doc(db, 'users', ticket.uid, 'account', 'supportLastRequest'), patch, { merge: true });
  if (ticket.uid && ticket.type === 'data_deletion_request') await setDoc(doc(db, 'users', ticket.uid, 'account', 'dataDeletionRequest'), patch, { merge: true });
  await logAdminAction(user, { action: 'ticket_updated', summary: `${ticket.category}: status alterado para ${status}.`, familyId: ticket.familyId, targetId: ticket.id, metadata: { status, note: clean(note) } });
}

export async function adminLogIntegrityCheck(user: User, family: AdminFamily) {
  const issues = [...new Set(family.integrityIssues.map(clean).filter(Boolean))];
  const checkedAt = Date.now();
  await logAdminAction(user, { action: 'integrity_check', summary: issues.length ? `Diagnóstico encontrou ${issues.length} alerta(s).` : 'Diagnóstico concluído sem alertas.', familyId: family.id, targetId: family.id, metadata: { issues, checkedAt } });
  return { checkedAt, issues, checks: 7, passed: Math.max(0, 7 - issues.length) };
}

export async function adminLogJustification(user: User, title: string, reason: string, familyId = '') {
  const safeReason = clean(reason);
  if (!safeReason) return;
  await logAdminAction(user, {
    action: 'admin_justification',
    summary: `${title}: ${safeReason}`,
    familyId,
    metadata: { title, reason: safeReason },
  });
}
