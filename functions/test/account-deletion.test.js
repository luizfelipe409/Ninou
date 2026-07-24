import assert from 'node:assert/strict';
import { after, before, beforeEach, test } from 'node:test';

import { deleteApp, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

import {
  DELETE_CONFIRMATION,
  executeAccountDeletion,
} from '../account-deletion.js';

const PROJECT_ID = 'demo-ninou-account-deletion-v84-1-2';
let app;
let db;
let deletedAuthUids;

const fakeAuth = {
  async deleteUser(uid) {
    deletedAuthUids.push(uid);
  },
};

async function clearFirestore() {
  const collections = await db.listCollections();
  for (const collection of collections) {
    const documents = await collection.listDocuments();
    for (const document of documents) {
      await db.recursiveDelete(document);
    }
  }
}

async function exists(path) {
  return (await db.doc(path).get()).exists;
}

async function seedOwnedFamily() {
  await Promise.all([
    db.doc('families/family-owner').set({
      familyId: 'family-owner',
      ownerUid: 'owner',
      status: 'active',
    }),
    db.doc('families/family-owner/profile/main').set({
      familyId: 'family-owner',
      name: 'Bebê',
    }),
    db.doc('families/family-owner/days/2026-07-24').set({
      familyId: 'family-owner',
      events: [{ id: 'event-1' }],
    }),
    db.doc('families/family-owner/members/owner').set({
      uid: 'owner',
      role: 'owner',
      status: 'active',
    }),
    db.doc('families/family-owner/members/caregiver').set({
      uid: 'caregiver',
      role: 'cuidador',
      status: 'active',
    }),
    db.doc('users/owner').set({ uid: 'owner', status: 'active' }),
    db.doc('users/owner/account/profile').set({ name: 'Responsável' }),
    db.doc('users/owner/families/family-owner').set({
      familyId: 'family-owner',
      role: 'owner',
    }),
    db.doc('users/owner/access/ninou').set({
      familyId: 'family-owner',
      role: 'owner',
    }),
    db.doc('users/caregiver').set({ uid: 'caregiver', status: 'active' }),
    db.doc('users/caregiver/families/family-owner').set({
      familyId: 'family-owner',
      role: 'cuidador',
    }),
    db.doc('users/caregiver/access/ninou').set({
      familyId: 'family-owner',
      role: 'cuidador',
    }),
    db.doc('invites/INVITE01').set({
      familyId: 'family-owner',
      status: 'pending',
    }),
    db.doc('adminAuditLogs/audit-1').set({
      familyId: 'family-owner',
      action: 'created',
    }),
  ]);
}

before(() => {
  app = initializeApp({ projectId: PROJECT_ID }, 'account-deletion-tests');
  db = getFirestore(app);
  db.settings({ ignoreUndefinedProperties: true });
});

beforeEach(async () => {
  deletedAuthUids = [];
  await clearFirestore();
});

after(async () => {
  await clearFirestore();
  await deleteApp(app);
});

test('responsável principal exclui a família completa, vínculos e a própria conta', async () => {
  await seedOwnedFamily();

  const result = await executeAccountDeletion({
    db,
    auth: fakeAuth,
    uid: 'owner',
    requestedFamilyId: 'family-owner',
    confirmation: DELETE_CONFIRMATION,
  });

  assert.equal(result.familyCascade, true);
  assert.deepEqual(result.deletedFamilyIds, ['family-owner']);
  assert.deepEqual(deletedAuthUids, ['owner']);
  assert.equal(await exists('families/family-owner'), false);
  assert.equal(await exists('families/family-owner/days/2026-07-24'), false);
  assert.equal(await exists('invites/INVITE01'), false);
  assert.equal(await exists('adminAuditLogs/audit-1'), false);
  assert.equal(await exists('users/owner'), false);
  assert.equal(await exists('users/owner/account/profile'), false);
  assert.equal(await exists('users/caregiver'), true);
  assert.equal(await exists('users/caregiver/families/family-owner'), false);
  assert.equal(await exists('users/caregiver/access/ninou'), false);
  assert.equal(await exists('accountDeletionJobs/owner'), false);
});

test('cuidador exclui somente a própria conta e preserva a família', async () => {
  await seedOwnedFamily();

  const result = await executeAccountDeletion({
    db,
    auth: fakeAuth,
    uid: 'caregiver',
    requestedFamilyId: 'family-owner',
    confirmation: DELETE_CONFIRMATION,
  });

  assert.equal(result.familyCascade, false);
  assert.deepEqual(result.deletedFamilyIds, []);
  assert.deepEqual(deletedAuthUids, ['caregiver']);
  assert.equal(await exists('families/family-owner'), true);
  assert.equal(await exists('families/family-owner/days/2026-07-24'), true);
  assert.equal(await exists('families/family-owner/members/caregiver'), false);
  assert.equal(await exists('users/caregiver'), false);
  assert.equal(await exists('users/owner'), true);
});

test('não aceita a exclusão sem a confirmação canônica', async () => {
  await seedOwnedFamily();

  await assert.rejects(
    executeAccountDeletion({
      db,
      auth: fakeAuth,
      uid: 'owner',
      requestedFamilyId: 'family-owner',
      confirmation: 'EXCLUIR',
    }),
    /Confirmação de exclusão inválida/,
  );

  assert.equal(await exists('families/family-owner'), true);
  assert.deepEqual(deletedAuthUids, []);
});
