import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApp, getApps, initializeApp } from 'firebase/app';
import {
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  getAuth,
  getReactNativePersistence,
  initializeAuth,
  onAuthStateChanged,
  setPersistence,
  signInWithEmailAndPassword,
  signOut,
  type Auth,
  type User,
} from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  onSnapshot,
  runTransaction,
  serverTimestamp,
  setDoc,
  writeBatch,
  type Firestore,
  type Unsubscribe,
} from 'firebase/firestore';
import { Platform } from 'react-native';

import { NINOU_CLIENT_VERSION } from '@/config/release';
import { canManageFamily, isGlobalAppAdminEmail, normalizeInviteRole } from '@/domain/family-access';
import { mergeDayStates, normalizeDayState, type DayState } from '@/domain/routine';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || 'AIzaSyAlGGx3z6kDWk4vsgBjSH2BDkDQwPoZlAM',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || 'ninou-3c936.firebaseapp.com',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || 'ninou-3c936',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || 'ninou-3c936.firebasestorage.app',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '18333404018',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || '1:18333404018:web:6faefb89f2e79e737c6beb',
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

function initializeNinouAuth(): Auth {
  if (Platform.OS === 'web') {
    const webAuth = getAuth(app);
    void setPersistence(webAuth, browserLocalPersistence);
    return webAuth;
  }

  try {
    return initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch (error) {
    if ((error as { code?: string })?.code !== 'auth/already-initialized') throw error;
    return getAuth(app);
  }
}

export const auth = initializeNinouAuth();
export const db: Firestore = getFirestore(app);

export type FamilyAccess = {
  familyId: string;
  role: string;
  email: string;
  ownerUid: string;
};

export type FamilyMember = { uid: string; email: string; role: string; name: string; status: string };
export type FamilySubscription = { plan: string; status: string; validUntil: number };

function timestampMillis(value: unknown) {
  if (value && typeof (value as { toMillis?: unknown }).toMillis === 'function') return (value as { toMillis: () => number }).toMillis();
  if (value && typeof value === 'object' && Number.isFinite(Number((value as { seconds?: number }).seconds))) return Number((value as { seconds: number }).seconds) * 1000;
  return Number.isFinite(Number(value)) ? Number(value) : 0;
}

export function observeAuth(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

export async function loginWithEmail(email: string, password: string) {
  return signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
}

export async function registerWithEmail(email: string, password: string) {
  return createUserWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
}

export async function logout() {
  await signOut(auth);
}

function isActiveAccess(data: Record<string, unknown>) {
  return !['inactive', 'revoked', 'removed'].includes(String(data.status || 'active'));
}

function toFamilyAccess(data: Record<string, unknown>, fallbackId: string, user: User): FamilyAccess | null {
  const familyId = String(data.familyId || fallbackId || '').trim();
  if (!familyId || !isActiveAccess(data)) return null;
  return {
    familyId,
    role: String(data.role || 'admin'),
    email: String(data.email || user.email || ''),
    ownerUid: String(data.ownerUid || data.owner || ''),
  };
}

type FamilyAccessCandidate = FamilyAccess & {
  primary: boolean;
  updatedAt: number;
  sourceId: string;
};

function toFamilyAccessCandidate(data: Record<string, unknown>, fallbackId: string, user: User): FamilyAccessCandidate | null {
  const access = toFamilyAccess(data, fallbackId, user);
  if (!access) return null;
  return {
    ...access,
    primary: Boolean(data.isPrimary || data.primary || data.selected),
    updatedAt: Math.max(
      timestampMillis(data.selectedAt),
      timestampMillis(data.lastSeenAt),
      timestampMillis(data.updatedAt),
      timestampMillis(data.joinedAt),
      Number(data.selectedAtClient || 0),
    ),
    sourceId: fallbackId,
  };
}

function compareFamilyAccess(left: FamilyAccessCandidate, right: FamilyAccessCandidate) {
  if (left.primary !== right.primary) return left.primary ? -1 : 1;
  const leftOwner = ['owner', 'responsavel_principal'].includes(left.role.toLowerCase());
  const rightOwner = ['owner', 'responsavel_principal'].includes(right.role.toLowerCase());
  if (leftOwner !== rightOwner) return leftOwner ? -1 : 1;
  if (left.updatedAt !== right.updatedAt) return right.updatedAt - left.updatedAt;
  return left.familyId.localeCompare(right.familyId);
}

async function persistCanonicalFamilyPointer(user: User, access: FamilyAccess, currentPointer: Record<string, unknown> | null) {
  const currentFamilyId = String(currentPointer?.familyId || '').trim();
  const currentRole = String(currentPointer?.role || '').trim();
  if (currentFamilyId === access.familyId && currentRole === access.role && isActiveAccess(currentPointer || {})) return;
  await setDoc(doc(db, 'users', user.uid, 'access', 'ninou'), {
    ...access,
    status: 'active',
    roleVersion: 3,
    selectedAtClient: Date.now(),
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

export async function resolveFamilyAccess(user: User): Promise<FamilyAccess | null> {
  const [pointerSnapshot, familySnapshots] = await Promise.all([
    getDoc(doc(db, 'users', user.uid, 'access', 'ninou')),
    getDocs(collection(db, 'users', user.uid, 'families')),
  ]);
  const pointerData = pointerSnapshot.exists() ? pointerSnapshot.data() : null;
  const pointer = pointerData ? toFamilyAccess(pointerData, '', user) : null;
  const candidates = familySnapshots.docs
    .map((snapshot) => toFamilyAccessCandidate(snapshot.data(), snapshot.id, user))
    .filter((access): access is FamilyAccessCandidate => Boolean(access));

  // O ponteiro canônico tem prioridade quando também existe como vínculo ativo.
  const pointedCandidate = pointer
    ? candidates.find((candidate) => candidate.familyId === pointer.familyId)
    : null;
  const selected = pointedCandidate || [...candidates].sort(compareFamilyAccess)[0] || (pointer ? { ...pointer, primary: true, updatedAt: 0, sourceId: pointer.familyId } : null);
  if (!selected) return null;

  // A autorreparação não deve bloquear a entrada no app em redes móveis lentas.
  // A seleção já é determinística, então as três plataformas podem continuar
  // enquanto o ponteiro canônico é atualizado em segundo plano.
  void persistCanonicalFamilyPointer(user, selected, pointerData).catch(() => {
    // A leitura continua mesmo se a autorreparação estiver temporariamente indisponível.
  });
  return { familyId: selected.familyId, role: selected.role, email: selected.email, ownerUid: selected.ownerUid };
}

export async function createPersonalFamily(user: User, input: { familyName: string; babyName: string; birthDate: string; article: 'do' | 'da'; responsibleName: string; responsibleRelation: string }) {
  const email = (user.email || '').trim().toLowerCase();
  const familyId = `family-${user.uid}`;
  const access: FamilyAccess = { familyId, role: 'owner', email, ownerUid: user.uid };
  const accessPayload = { ...access, status: 'active', roleVersion: 3, isPrimary: true, selectedAtClient: Date.now(), updatedAt: serverTimestamp() };
  const batch = writeBatch(db);
  batch.set(doc(db, 'users', user.uid, 'families', familyId), { ...accessPayload, joinedAt: serverTimestamp() }, { merge: true });
  batch.set(doc(db, 'users', user.uid, 'access', 'ninou'), accessPayload, { merge: true });
  batch.set(doc(db, 'families', familyId, 'members', user.uid), { uid: user.uid, ...accessPayload, name: input.responsibleName, relation: input.responsibleRelation, joinedAt: serverTimestamp() }, { merge: true });
  batch.set(doc(db, 'families', familyId), {
    familyId, title: input.familyName, name: input.familyName, babyName: input.babyName, babyArticle: input.article,
    ownerUid: user.uid, ownerEmail: email, responsibleName: input.responsibleName, responsibleRelation: input.responsibleRelation,
    familyType: 'client', status: 'active', appVersion: NINOU_CLIENT_VERSION, createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
  }, { merge: true });
  await batch.commit();
  await setDoc(doc(db, 'families', familyId, 'profile', 'main'), {
    familyId, familyName: input.familyName, name: input.babyName, birthDate: input.birthDate, article: input.article,
    ownerUid: user.uid, responsibleName: input.responsibleName, responsibleRelation: input.responsibleRelation, updatedAt: serverTimestamp(),
  }, { merge: true });
  return access;
}

function normalizeInviteCode(code: string) {
  return code.trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12);
}

function makeInviteCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 8 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('');
}

export async function createCaregiverInvite(user: User, access: FamilyAccess, emailValue: string, role = 'caregiver') {
  const email = emailValue.trim().toLowerCase();
  if (!email.includes('@')) throw new Error('Informe um e-mail válido.');
  if (!canManageFamily(access.role)) throw new Error('Seu acesso não permite criar convites.');
  const inviteRole = normalizeInviteRole(role);
  const code = makeInviteCode();
  const expiresAtClient = Date.now() + 7 * 86400000;
  const payload = { code, familyId: access.familyId, email, role: inviteRole, status: 'pending', maxUses: 1, useCount: 0, expiresAtClient, createdByUid: user.uid, createdByEmail: user.email || '', source: 'mobile_profile', createdAt: serverTimestamp(), updatedAt: serverTimestamp() };
  await setDoc(doc(db, 'families', access.familyId, 'invites', code), payload, { merge: true });
  await setDoc(doc(db, 'families', access.familyId, 'invitations', code), payload, { merge: true });
  await setDoc(doc(db, 'invites', code), payload, { merge: true });
  return { code, email, role: inviteRole, expiresAtClient };
}

export async function acceptCaregiverInvite(user: User, codeValue: string) {
  const code = normalizeInviteCode(codeValue);
  if (!code) throw new Error('Digite o código do convite.');
  const inviteRef = doc(db, 'invites', code);
  const snapshot = await getDoc(inviteRef);
  if (!snapshot.exists()) throw new Error('Convite não encontrado ou expirado.');
  const invite = snapshot.data();
  const familyId = String(invite.familyId || '');
  const email = (user.email || '').trim().toLowerCase();
  const invitedEmail = String(invite.email || '').trim().toLowerCase();
  if (!familyId) throw new Error('Família do convite não encontrada.');
  if (invitedEmail && invitedEmail !== email) throw new Error(`Este convite foi criado para ${invitedEmail}.`);
  if (String(invite.status || 'pending') !== 'pending' || Number(invite.useCount || 0) >= Number(invite.maxUses || 1)) throw new Error('Este convite já foi utilizado ou cancelado.');
  if (Number(invite.expiresAtClient || 0) && Number(invite.expiresAtClient) < Date.now()) throw new Error('Este convite expirou. Peça um novo código.');
  const role = String(invite.role || 'caregiver');
  const access: FamilyAccess = { familyId, role, email, ownerUid: String(invite.ownerUid || invite.createdByUid || '') };
  const accessPayload = { ...access, inviteCode: code, status: 'active', roleVersion: 3, isPrimary: true, selectedAtClient: Date.now(), joinedAt: serverTimestamp(), updatedAt: serverTimestamp() };
  const acceptedPayload = { status: 'accepted', useCount: Number(invite.useCount || 0) + 1, acceptedByUid: user.uid, acceptedByEmail: email, acceptedAt: serverTimestamp(), updatedAt: serverTimestamp() };
  const batch = writeBatch(db);
  batch.set(doc(db, 'users', user.uid, 'families', familyId), accessPayload, { merge: true });
  batch.set(doc(db, 'users', user.uid, 'access', 'ninou'), accessPayload, { merge: true });
  batch.set(doc(db, 'families', familyId, 'members', user.uid), { uid: user.uid, ...accessPayload }, { merge: true });
  batch.set(inviteRef, acceptedPayload, { merge: true });
  batch.set(doc(db, 'families', familyId, 'invites', code), acceptedPayload, { merge: true });
  batch.set(doc(db, 'families', familyId, 'invitations', code), acceptedPayload, { merge: true });
  await batch.commit();
  return access;
}

export function observeFamilyMembers(familyId: string, onValue: (members: FamilyMember[]) => void, onError: (error: Error) => void): Unsubscribe {
  return onSnapshot(collection(db, 'families', familyId, 'members'), (snapshot) => onValue(snapshot.docs.map((member) => {
    const data = member.data();
    return { uid: member.id, email: String(data.email || ''), role: String(data.role || 'caregiver'), name: String(data.name || data.displayName || ''), status: String(data.status || 'active') };
  })), onError);
}

export function observeFamilySubscription(familyId: string, onValue: (subscription: FamilySubscription | null) => void, onError: (error: Error) => void): Unsubscribe {
  return onSnapshot(doc(db, 'families', familyId), (snapshot) => {
    if (!snapshot.exists()) { onValue(null); return; }
    const data = snapshot.data();
    const plan = String(data.subscriptionPlan || data.plan || 'trial').toLowerCase();
    onValue({
      plan,
      status: String(data.subscriptionStatus || (plan === 'suspended' ? 'suspended' : 'active')).toLowerCase(),
      validUntil: timestampMillis(plan === 'trial' ? (data.trialEndsAtClient || data.trialEndsAt) : (data.premiumUntilClient || data.premiumUntil)),
    });
  }, onError);
}

export async function loadRoutineDays(familyId: string) {
  const snapshot = await getDocs(collection(db, 'families', familyId, 'days'));
  return Object.fromEntries(snapshot.docs.map((day) => {
    const data = day.data();
    return [day.id, normalizeDayState((data.state && typeof data.state === 'object' ? data.state : data) as Partial<DayState>)];
  }));
}

export type AdminFamilySummary = {
  id: string;
  name: string;
  babyName: string;
  status: string;
  membersCount: number;
  pendingInvitesCount: number;
  updatedAt: number;
};

export type AdminDashboard = {
  families: AdminFamilySummary[];
  activeFamiliesCount: number;
  membersCount: number;
  pendingInvitesCount: number;
};

function firestoreValueToMillis(value: unknown) {
  if (value && typeof (value as { toMillis?: unknown }).toMillis === 'function') return (value as { toMillis: () => number }).toMillis();
  if (value && typeof value === 'object' && Number.isFinite(Number((value as { seconds?: number }).seconds))) return Number((value as { seconds: number }).seconds) * 1000;
  return Number.isFinite(Number(value)) ? Number(value) : 0;
}

export async function loadGlobalAdminDashboard(user: User): Promise<AdminDashboard> {
  if (!isGlobalAppAdminEmail(user.email)) throw new Error('Esta conta não possui acesso ao painel administrativo.');
  const familiesSnapshot = await getDocs(collection(db, 'families'));
  const memberIds = new Set<string>();
  const families = await Promise.all(familiesSnapshot.docs.map(async (familyDocument) => {
    const data = familyDocument.data();
    const [profileSnapshot, membersSnapshot, invitesSnapshot] = await Promise.all([
      getDoc(doc(db, 'families', familyDocument.id, 'profile', 'main')),
      getDocs(collection(db, 'families', familyDocument.id, 'members')),
      getDocs(collection(db, 'families', familyDocument.id, 'invites')),
    ]);
    const profile = profileSnapshot.exists() ? profileSnapshot.data() : {};
    const activeMembers = membersSnapshot.docs.filter((memberDocument) => {
      const member = memberDocument.data();
      const active = !['inactive', 'revoked', 'removed'].includes(String(member.status || 'active'));
      const appAdmin = isGlobalAppAdminEmail(String(member.email || '')) || String(member.role || '') === 'global_admin';
      if (active && !appAdmin) memberIds.add(memberDocument.id);
      return active && !appAdmin;
    });
    const pendingInvitesCount = invitesSnapshot.docs.filter((inviteDocument) => {
      const invite = inviteDocument.data();
      return ['pending', 'active'].includes(String(invite.status || 'pending')) && (!Number(invite.expiresAtClient) || Number(invite.expiresAtClient) > Date.now());
    }).length;
    return {
      id: familyDocument.id,
      name: String(data.title || data.name || profile.familyName || `Família ${familyDocument.id.slice(-6)}`),
      babyName: String(data.babyName || profile.name || ''),
      status: String(data.status || 'active'),
      membersCount: activeMembers.length,
      pendingInvitesCount,
      updatedAt: Math.max(firestoreValueToMillis(data.updatedAt), firestoreValueToMillis(profile.updatedAt), Number(data.clientUpdatedAt || 0)),
    } satisfies AdminFamilySummary;
  }));
  families.sort((left, right) => right.updatedAt - left.updatedAt || left.name.localeCompare(right.name, 'pt-BR'));
  return {
    families,
    activeFamiliesCount: families.filter((family) => !['inactive', 'archived', 'removed'].includes(family.status)).length,
    membersCount: memberIds.size,
    pendingInvitesCount: families.reduce((total, family) => total + family.pendingInvitesCount, 0),
  };
}

export async function loadUserAccountStatus(user: User) {
  const accountSnapshot = await getDoc(doc(db, 'users', user.uid));
  if (!accountSnapshot.exists()) return 'active';
  return String(accountSnapshot.data().status || 'active').trim().toLowerCase();
}

export async function loadLegalConsent(user: User) {
  const snapshot = await getDoc(doc(db, 'users', user.uid, 'account', 'legal'));
  return snapshot.exists() ? snapshot.data() : null;
}

export async function loadAccountCaregiverProfile(user: User, familyId?: string) {
  const accountSnapshot = await getDoc(doc(db, 'users', user.uid, 'account', 'profile'));
  const account = accountSnapshot.exists() ? accountSnapshot.data() : {};
  let member: Record<string, unknown> = {};
  if (familyId) {
    try {
      const memberSnapshot = await getDoc(doc(db, 'families', familyId, 'members', user.uid));
      if (memberSnapshot.exists()) member = memberSnapshot.data();
    } catch {
      // O perfil individual continua disponível mesmo durante uma falha no vínculo familiar.
    }
  }
  return {
    caregiverName: String(member.name || member.displayName || account.caregiverName || account.name || account.displayName || '').trim(),
    caregiverRelation: String(member.relation || member.relationship || account.caregiverRelation || account.relation || account.relationship || '').trim(),
  };
}

export async function saveAccountCaregiverProfile(user: User, familyId: string | undefined, input: { caregiverName: string; caregiverRelation: string }) {
  const caregiverName = input.caregiverName.trim().slice(0, 80);
  const caregiverRelation = input.caregiverRelation.trim().slice(0, 80);
  await setDoc(doc(db, 'users', user.uid, 'account', 'profile'), {
    caregiverName,
    caregiverRelation,
    name: caregiverName,
    relation: caregiverRelation,
    updatedAt: serverTimestamp(),
  }, { merge: true });
  if (familyId) {
    try {
      await setDoc(doc(db, 'families', familyId, 'members', user.uid), {
        name: caregiverName,
        displayName: caregiverName,
        relation: caregiverRelation,
        relationship: caregiverRelation,
        lastSeenAt: serverTimestamp(),
      }, { merge: true });
    } catch {
      // A conta continua salva; o membro será atualizado quando o vínculo permitir.
    }
  }
}

export async function saveLegalConsent(user: User, familyId: string | undefined, payload: { termsVersion: string; privacyVersion: string; medicalDisclaimerVersion: string; acceptedAtClient?: number }) {
  const data = {
    ...payload,
    type: 'terms_acceptance',
    legalVersion: payload.termsVersion,
    privacyPolicyVersion: payload.privacyVersion,
    medicalDisclaimerAccepted: true,
    accepted: true,
    acceptedAt: serverTimestamp(),
    acceptedAtClient: payload.acceptedAtClient || Date.now(),
    email: user.email || '',
    uid: user.uid,
  };
  await setDoc(doc(db, 'users', user.uid, 'account', 'legal'), data, { merge: true });
  let familySynced = false;
  if (familyId) {
    try {
      await setDoc(doc(db, 'families', familyId, 'legal', `consent_${user.uid}`), {
        ...data,
        familyId,
        actorUid: user.uid,
        actorEmail: user.email || '',
        status: 'accepted',
      }, { merge: true });
      familySynced = true;
    } catch {
      familySynced = false;
    }
  }
  return { ...data, familySynced };
}

export async function submitSupportRequest(user: User, familyId: string | undefined, input: { category: string; message: string; diagnostics?: string }) {
  const stamp = Date.now();
  const payload = { ...input, uid: user.uid, email: user.email || '', familyId: familyId || '', status: 'open', createdAtClient: stamp, createdAt: serverTimestamp() };
  await setDoc(doc(db, 'users', user.uid, 'account', 'supportLastRequest'), payload, { merge: true });
  if (familyId) await setDoc(doc(db, 'families', familyId, 'legal', `support_${user.uid}_${stamp}`), { ...payload, type: 'support_request', actorUid: user.uid, actorEmail: user.email || '' }, { merge: true });
}

export async function requestAccountDeletion(user: User, familyId?: string) {
  const stamp = Date.now();
  const payload = {
    uid: user.uid,
    email: user.email || '',
    familyId: familyId || '',
    type: 'data_deletion_request',
    category: 'Exclusão da conta',
    message: 'Excluir a conta Ninou e os dados pessoais associados. Dados compartilhados da família devem ser avaliados antes da remoção definitiva.',
    scope: 'account_and_personal_data',
    status: 'open',
    requestState: 'requested',
    requestedAtClient: stamp,
    requestedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  await setDoc(doc(db, 'users', user.uid, 'account', 'dataDeletionRequest'), payload, { merge: true });
  if (familyId) {
    await setDoc(doc(db, 'families', familyId, 'legal', `data_request_${user.uid}_${stamp}`), {
      ...payload,
      actorUid: user.uid,
      actorEmail: user.email || '',
    }, { merge: true });
  }
  await setDoc(doc(db, 'users', user.uid), {
    status: 'deletion_requested',
    deletionRequestStatus: 'open',
    deletionRequestedAtClient: stamp,
    deletionRequestedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }, { merge: true });
  return payload;
}

export function getLocalDateId(now = Date.now()) {
  const date = new Date(now);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function observeRoutineDay(
  familyId: string,
  dayId: string,
  onValue: (state: DayState) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  return onSnapshot(
    doc(db, 'families', familyId, 'days', dayId),
    (snapshot) => {
      if (!snapshot.exists()) return;
      const data = snapshot.data();
      onValue(normalizeDayState((data.state && typeof data.state === 'object' ? data.state : data) as Partial<DayState>));
    },
    onError,
  );
}

export async function saveRoutineDay(input: {
  familyId: string;
  dayId: string;
  state: DayState;
  user: User;
  expectedRoutineStateMutationId?: string;
  expectedBreastfeedingTimerMutationId?: string;
}) {
  const dayRef = doc(db, 'families', input.familyId, 'days', input.dayId);
  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(dayRef);
    const cloudData = snapshot.exists() ? snapshot.data() : {};
    const cloudState = normalizeDayState((cloudData.state && typeof cloudData.state === 'object' ? cloudData.state : cloudData) as Partial<DayState>);
    const liveStateChanged = input.expectedRoutineStateMutationId !== undefined
      && input.state.routineStateMutationId !== input.expectedRoutineStateMutationId;
    const feedingTimerChanged = input.expectedBreastfeedingTimerMutationId !== undefined
      && input.state.breastfeedingTimerMutationId !== input.expectedBreastfeedingTimerMutationId;
    if (
      snapshot.exists()
      && liveStateChanged
      && cloudState.routineStateMutationId !== input.expectedRoutineStateMutationId
    ) {
      const conflict = new Error('A rotina foi atualizada em outro aparelho. A tela será sincronizada antes de uma nova alteração.') as Error & { code?: string };
      conflict.code = 'routine/conflict';
      throw conflict;
    }
    if (
      snapshot.exists()
      && feedingTimerChanged
      && cloudState.breastfeedingTimerMutationId !== input.expectedBreastfeedingTimerMutationId
    ) {
      const conflict = new Error('O timer foi atualizado em outro aparelho. Aguarde a sincronização antes de continuar.') as Error & { code?: string };
      conflict.code = 'routine/conflict';
      throw conflict;
    }
    const merged = mergeDayStates(input.state, cloudState);
    transaction.set(dayRef, {
      ...merged,
      dayId: input.dayId,
      date: input.dayId,
      familyId: input.familyId,
      familyScopeVersion: 2,
      clientUpdatedAt: Date.now(),
      updatedAt: serverTimestamp(),
      updatedByUid: input.user.uid,
      updatedByEmail: input.user.email || '',
      ...(snapshot.exists() ? {} : { createdAt: serverTimestamp() }),
    }, { merge: true });
  });
}

export type CloudBabyProfile = {
  name?: string;
  birthDate?: string;
  wakeWindow?: number | string;
  wakeWindowMinutes?: number;
  avatarId?: string;
  avatar?: { hair?: string; icon?: string };
  article?: 'do' | 'da';
  weights?: unknown[];
};

export function observeBabyProfile(
  familyId: string,
  onValue: (profile: CloudBabyProfile) => void,
  onError: (error: Error) => void,
) {
  return onSnapshot(doc(db, 'families', familyId, 'profile', 'main'), (snapshot) => {
    if (snapshot.exists()) onValue(snapshot.data());
  }, onError);
}

export async function saveBabyProfile(familyId: string, profile: { name: string; birthDate: string; wakeWindowMinutes: number; avatarId: string; article: 'do' | 'da'; weights: { id: string; date: string; value: number }[] }) {
  await setDoc(doc(db, 'families', familyId, 'profile', 'main'), {
    ...profile,
    familyId,
    wakeWindow: profile.wakeWindowMinutes,
    avatarId: profile.avatarId,
    avatar: { hair: profile.avatarId, icon: profile.avatarId },
    avatarConfigured: true,
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

export function getFirebaseErrorMessage(error: unknown) {
  const code = (error as { code?: string })?.code || '';
  const messages: Record<string, string> = {
    'auth/email-already-in-use': 'Este e-mail já possui uma conta. Use Entrar.',
    'auth/invalid-email': 'Digite um e-mail válido.',
    'auth/invalid-credential': 'E-mail ou senha incorretos.',
    'auth/wrong-password': 'E-mail ou senha incorretos.',
    'auth/weak-password': 'A senha precisa ter pelo menos 6 caracteres.',
    'auth/network-request-failed': 'Sem conexão com o Firebase. Confira a internet e tente novamente.',
    'permission-denied': 'Sua conta não tem permissão para esta família.',
    'routine/conflict': 'A rotina mudou em outro aparelho. A tela foi atualizada; confira o estado antes de tentar novamente.',
  };
  return messages[code] || (error instanceof Error ? error.message : 'Não foi possível concluir esta ação agora.');
}
