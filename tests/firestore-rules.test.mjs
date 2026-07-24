import { readFile } from 'node:fs/promises';
import { after, before, beforeEach, test } from 'node:test';
import assert from 'node:assert/strict';

import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from '@firebase/rules-unit-testing';
import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  writeBatch,
} from 'firebase/firestore';

const PROJECT_ID = 'demo-ninou-rules-v84-1-2';
const FAMILY_A = 'family-alpha';
const FAMILY_B = 'family-beta';
const FUTURE = Date.now() + 7 * 24 * 60 * 60 * 1000;

let testEnv;

function authenticated(uid, email) {
  return testEnv.authenticatedContext(uid, { email }).firestore();
}

function routineDay(familyId, dayId, uid, email, extra = {}) {
  return {
    familyId,
    dayId,
    date: dayId,
    events: [],
    routineState: 'awake',
    updatedByUid: uid,
    updatedByEmail: email,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    ...extra,
  };
}

async function seedBaseData() {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    await setDoc(doc(db, 'families', FAMILY_A), {
      familyId: FAMILY_A,
      name: 'Família Alpha',
      ownerUid: 'owner-a',
      ownerEmail: 'owner-a@example.com',
      status: 'active',
    });
    await setDoc(doc(db, 'families', FAMILY_A, 'members', 'owner-a'), {
      uid: 'owner-a',
      familyId: FAMILY_A,
      role: 'owner',
      ownerUid: 'owner-a',
      email: 'owner-a@example.com',
      status: 'active',
    });
    await setDoc(doc(db, 'families', FAMILY_A, 'members', 'care-a'), {
      uid: 'care-a',
      familyId: FAMILY_A,
      role: 'cuidador',
      ownerUid: 'owner-a',
      email: 'care-a@example.com',
      status: 'active',
    });
    await setDoc(doc(db, 'families', FAMILY_A, 'members', 'viewer-a'), {
      uid: 'viewer-a',
      familyId: FAMILY_A,
      role: 'visualizacao',
      ownerUid: 'owner-a',
      email: 'viewer-a@example.com',
      status: 'active',
    });
    await setDoc(doc(db, 'families', FAMILY_A, 'days', '2026-07-20'), {
      familyId: FAMILY_A,
      dayId: '2026-07-20',
      date: '2026-07-20',
      events: [],
      updatedByUid: 'owner-a',
      updatedByEmail: 'owner-a@example.com',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await setDoc(doc(db, 'families', FAMILY_B), {
      familyId: FAMILY_B,
      name: 'Família Beta',
      ownerUid: 'owner-b',
      ownerEmail: 'owner-b@example.com',
      status: 'active',
    });
    await setDoc(doc(db, 'families', FAMILY_B, 'members', 'owner-b'), {
      uid: 'owner-b',
      familyId: FAMILY_B,
      role: 'owner',
      ownerUid: 'owner-b',
      email: 'owner-b@example.com',
      status: 'active',
    });
  });
}

before(async () => {
  const [host = '127.0.0.1', port = '8089'] = String(
    process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8089',
  ).split(':');
  const rules = await readFile(new URL('../firestore.rules', import.meta.url), 'utf8');
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      host,
      port: Number(port),
      rules,
    },
  });
});

beforeEach(async () => {
  await testEnv.clearFirestore();
  await seedBaseData();
});

after(async () => {
  await testEnv?.cleanup();
});

test('usa somente o membro canônico para autorizar uma família', async () => {
  const intruder = authenticated('intruder', 'intruder@example.com');

  await assertFails(setDoc(doc(intruder, 'users', 'intruder', 'families', FAMILY_A), {
    familyId: FAMILY_A,
    role: 'owner',
    ownerUid: 'intruder',
    email: 'intruder@example.com',
    status: 'active',
  }));

  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), 'users', 'intruder', 'families', FAMILY_A), {
      familyId: FAMILY_A,
      role: 'owner',
      ownerUid: 'intruder',
      email: 'intruder@example.com',
      status: 'active',
    });
  });

  await assertFails(getDoc(doc(intruder, 'families', FAMILY_A)));
  await assertFails(getDoc(doc(intruder, 'families', FAMILY_A, 'days', '2026-07-20')));
});

test('permite o bootstrap atômico e coerente da família pessoal', async () => {
  const uid = 'new-owner';
  const email = 'new-owner@example.com';
  const familyId = `family-${uid}`;
  const db = authenticated(uid, email);
  const access = {
    familyId,
    role: 'owner',
    email,
    ownerUid: uid,
    status: 'active',
    roleVersion: 3,
    isPrimary: true,
    selectedAtClient: Date.now(),
    updatedAt: serverTimestamp(),
  };
  const batch = writeBatch(db);

  batch.set(doc(db, 'users', uid, 'families', familyId), {
    ...access,
    joinedAt: serverTimestamp(),
  });
  batch.set(doc(db, 'users', uid, 'access', 'ninou'), access);
  batch.set(doc(db, 'families', familyId, 'members', uid), {
    uid,
    ...access,
    name: 'Pessoa responsável',
    relation: 'Mãe',
    joinedAt: serverTimestamp(),
  });
  batch.set(doc(db, 'families', familyId), {
    familyId,
    title: 'Família Nova',
    name: 'Família Nova',
    babyName: 'Bebê',
    babyArticle: 'do',
    ownerUid: uid,
    ownerEmail: email,
    responsibleName: 'Pessoa responsável',
    responsibleRelation: 'Mãe',
    familyType: 'client',
    status: 'active',
    appVersion: '84.1.2',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  await assertSucceeds(batch.commit());
  await assertSucceeds(setDoc(doc(db, 'families', familyId, 'profile', 'main'), {
    familyId,
    familyName: 'Família Nova',
    name: 'Bebê',
    birthDate: '2026-07-24',
    article: 'do',
    updatedAt: serverTimestamp(),
  }));
  assert.equal((await getDoc(doc(db, 'families', familyId))).data().ownerUid, uid);
});

test('recusa bootstrap incompleto ou apontado para uma família existente', async () => {
  const uid = 'attacker';
  const email = 'attacker@example.com';
  const db = authenticated(uid, email);

  await assertFails(setDoc(doc(db, 'families', `family-${uid}`), {
    familyId: `family-${uid}`,
    title: 'Família sem lote',
    name: 'Família sem lote',
    babyName: 'Bebê',
    babyArticle: 'do',
    ownerUid: uid,
    ownerEmail: email,
    responsibleName: 'Atacante',
    responsibleRelation: 'Outro',
    familyType: 'client',
    status: 'active',
    appVersion: '84.1.2',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }));

  await assertFails(setDoc(doc(db, 'users', uid, 'access', 'ninou'), {
    familyId: FAMILY_A,
    role: 'owner',
    email,
    ownerUid: uid,
    status: 'active',
  }));
});

test('aplica corretamente owner, cuidador e visualização na rotina', async () => {
  const owner = authenticated('owner-a', 'owner-a@example.com');
  const caregiver = authenticated('care-a', 'care-a@example.com');
  const viewer = authenticated('viewer-a', 'viewer-a@example.com');

  await assertSucceeds(setDoc(
    doc(owner, 'families', FAMILY_A, 'days', '2026-07-21'),
    routineDay(FAMILY_A, '2026-07-21', 'owner-a', 'owner-a@example.com'),
  ));
  await assertSucceeds(setDoc(
    doc(caregiver, 'families', FAMILY_A, 'days', '2026-07-22'),
    routineDay(FAMILY_A, '2026-07-22', 'care-a', 'care-a@example.com'),
  ));
  await assertSucceeds(getDoc(doc(viewer, 'families', FAMILY_A, 'days', '2026-07-20')));
  await assertFails(setDoc(
    doc(viewer, 'families', FAMILY_A, 'days', '2026-07-23'),
    routineDay(FAMILY_A, '2026-07-23', 'viewer-a', 'viewer-a@example.com'),
  ));
});

test('bloqueia novos acessos assim que a família entra em exclusão', async () => {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), 'families', FAMILY_A), {
      status: 'deleting',
    }, { merge: true });
  });

  const owner = authenticated('owner-a', 'owner-a@example.com');
  await assertFails(getDoc(doc(owner, 'families', FAMILY_A)));
  await assertFails(setDoc(
    doc(owner, 'families', FAMILY_A, 'days', '2026-07-24'),
    routineDay(FAMILY_A, '2026-07-24', 'owner-a', 'owner-a@example.com'),
  ));
});

test('reserva a exclusão definitiva para o backend administrativo', async () => {
  const owner = authenticated('owner-a', 'owner-a@example.com');

  await assertFails(setDoc(
    doc(owner, 'users', 'owner-a', 'account', 'dataDeletionRequest'),
    { status: 'open', type: 'data_deletion_request' },
  ));
  await assertFails(setDoc(
    doc(owner, 'accountDeletionJobs', 'owner-a'),
    { uid: 'owner-a', status: 'processing' },
  ));
});

test('valida escopo, data e autoria de uma gravação da rotina', async () => {
  const caregiver = authenticated('care-a', 'care-a@example.com');

  await assertFails(setDoc(
    doc(caregiver, 'families', FAMILY_A, 'days', '2026-07-24'),
    routineDay(FAMILY_B, '2026-07-24', 'care-a', 'care-a@example.com'),
  ));
  await assertFails(setDoc(
    doc(caregiver, 'families', FAMILY_A, 'days', 'data-livre'),
    routineDay(FAMILY_A, 'data-livre', 'care-a', 'care-a@example.com'),
  ));
  await assertFails(setDoc(
    doc(caregiver, 'families', FAMILY_A, 'days', '2026-07-25'),
    routineDay(FAMILY_A, '2026-07-25', 'owner-a', 'owner-a@example.com'),
  ));
});

test('aceita convite atual sem permitir troca de e-mail ou papel', async () => {
  const code = 'CARE2026';
  const email = 'invited@example.com';
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    const invite = {
      code,
      familyId: FAMILY_A,
      email,
      role: 'cuidador',
      status: 'pending',
      maxUses: 1,
      useCount: 0,
      expiresAtClient: FUTURE,
      createdByUid: 'owner-a',
      createdByEmail: 'owner-a@example.com',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await setDoc(doc(db, 'invites', code), invite);
    await setDoc(doc(db, 'families', FAMILY_A, 'invites', code), invite);
    await setDoc(doc(db, 'families', FAMILY_A, 'invitations', code), invite);
  });

  const wrongUser = authenticated('wrong-user', 'wrong@example.com');
  await assertFails(getDoc(doc(wrongUser, 'invites', code)));

  const uid = 'invited-user';
  const db = authenticated(uid, email);
  const access = {
    familyId: FAMILY_A,
    role: 'cuidador',
    email,
    ownerUid: 'owner-a',
    inviteCode: code,
    status: 'active',
    roleVersion: 3,
    isPrimary: true,
    selectedAtClient: Date.now(),
    joinedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const accepted = {
    status: 'accepted',
    useCount: 1,
    acceptedByUid: uid,
    acceptedByEmail: email,
    acceptedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  const acceptBatch = writeBatch(db);
  acceptBatch.set(doc(db, 'users', uid, 'families', FAMILY_A), access, { merge: true });
  acceptBatch.set(doc(db, 'users', uid, 'access', 'ninou'), access, { merge: true });
  acceptBatch.set(doc(db, 'families', FAMILY_A, 'members', uid), {
    uid,
    ...access,
  }, { merge: true });
  acceptBatch.set(doc(db, 'invites', code), accepted, { merge: true });
  acceptBatch.set(doc(db, 'families', FAMILY_A, 'invites', code), accepted, { merge: true });
  acceptBatch.set(doc(db, 'families', FAMILY_A, 'invitations', code), accepted, { merge: true });
  await assertSucceeds(acceptBatch.commit());
  await assertSucceeds(getDoc(doc(db, 'families', FAMILY_A)));

  const secondCode = 'ROLE2026';
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), 'invites', secondCode), {
      code: secondCode,
      familyId: FAMILY_A,
      email,
      role: 'visualizacao',
      status: 'pending',
      maxUses: 1,
      useCount: 0,
      expiresAtClient: FUTURE,
      createdByUid: 'owner-a',
      createdByEmail: 'owner-a@example.com',
    });
  });
  await assertFails(setDoc(doc(db, 'users', uid, 'families', FAMILY_A), {
    ...access,
    inviteCode: secondCode,
    role: 'owner',
  }));
});

test('impede o gestor familiar de alterar assinatura ou proprietário', async () => {
  const owner = authenticated('owner-a', 'owner-a@example.com');

  await assertFails(setDoc(doc(owner, 'families', FAMILY_A), {
    subscriptionPlan: 'premium',
    subscriptionStatus: 'active',
  }, { merge: true }));
  await assertFails(setDoc(doc(owner, 'families', FAMILY_A), {
    ownerUid: 'other-owner',
  }, { merge: true }));
});
