import { FieldValue } from 'firebase-admin/firestore';

const DELETE_CONFIRMATION = 'DELETE_NINOU_ACCOUNT';

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

async function deleteReferences(db, references) {
  const uniqueReferences = [...new Map(
    references.map((reference) => [reference.path, reference]),
  ).values()];

  for (let offset = 0; offset < uniqueReferences.length; offset += 400) {
    const batch = db.batch();
    uniqueReferences
      .slice(offset, offset + 400)
      .forEach((reference) => batch.delete(reference));
    await batch.commit();
  }
}

async function referencesFromQuery(query) {
  const snapshot = await query.get();
  return snapshot.docs.map((document) => document.ref);
}

async function removeFamilyPointer(db, uid, familyId) {
  const pointerRef = db.doc(`users/${uid}/access/ninou`);
  const pointer = await pointerRef.get();
  if (pointer.exists && pointer.get('familyId') === familyId) {
    await pointerRef.delete();
  }
}

async function collectDeletionScope(db, uid, requestedFamilyId) {
  const [ownedFamilies, indexedFamilies] = await Promise.all([
    db.collection('families').where('ownerUid', '==', uid).get(),
    db.collection(`users/${uid}/families`).get(),
  ]);

  const ownedFamilyIds = ownedFamilies.docs.map((document) => document.id);
  const indexedFamilyIds = indexedFamilies.docs.map((document) => document.id);

  if (requestedFamilyId) {
    const [family, member] = await Promise.all([
      db.doc(`families/${requestedFamilyId}`).get(),
      db.doc(`families/${requestedFamilyId}/members/${uid}`).get(),
    ]);
    if (
      family.exists
      && family.get('ownerUid') === uid
    ) {
      ownedFamilyIds.push(requestedFamilyId);
    } else if (member.exists) {
      indexedFamilyIds.push(requestedFamilyId);
    }
  }

  const canonicalOwnedFamilyIds = [];
  const memberUidsByFamily = {};

  for (const familyId of unique(ownedFamilyIds)) {
    const familyRef = db.doc(`families/${familyId}`);
    const [family, members] = await Promise.all([
      familyRef.get(),
      familyRef.collection('members').get(),
    ]);
    if (!family.exists || family.get('ownerUid') !== uid) continue;

    canonicalOwnedFamilyIds.push(familyId);
    memberUidsByFamily[familyId] = unique([
      uid,
      ...members.docs.map((member) => member.id),
    ]);
  }

  return {
    ownedFamilyIds: canonicalOwnedFamilyIds,
    membershipFamilyIds: unique(indexedFamilyIds)
      .filter((familyId) => !canonicalOwnedFamilyIds.includes(familyId)),
    memberUidsByFamily,
  };
}

async function blockFamilyDuringDeletion(db, uid, familyId) {
  const familyRef = db.doc(`families/${familyId}`);
  await db.runTransaction(async (transaction) => {
    const family = await transaction.get(familyRef);
    if (!family.exists) return;
    if (family.get('ownerUid') !== uid) {
      throw new Error(`A conta não é responsável pela família ${familyId}.`);
    }
    transaction.set(familyRef, {
      status: 'deleting',
      deletionOwnerUid: uid,
      deletionStartedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });
  });
}

async function deleteOwnedFamily(db, uid, familyId, storedMemberUids = []) {
  const familyRef = db.doc(`families/${familyId}`);
  const family = await familyRef.get();
  let memberUids = unique([uid, ...storedMemberUids]);

  if (family.exists) {
    if (family.get('ownerUid') !== uid) {
      throw new Error(`A conta não é responsável pela família ${familyId}.`);
    }
    await blockFamilyDuringDeletion(db, uid, familyId);
    const members = await familyRef.collection('members').get();
    memberUids = unique([
      ...memberUids,
      ...members.docs.map((member) => member.id),
    ]);
  }

  for (const memberUid of memberUids) {
    await Promise.all([
      db.doc(`users/${memberUid}/families/${familyId}`).delete(),
      removeFamilyPointer(db, memberUid, familyId),
    ]);
  }

  const [inviteReferences, auditReferences] = await Promise.all([
    referencesFromQuery(
      db.collection('invites').where('familyId', '==', familyId),
    ),
    referencesFromQuery(
      db.collection('adminAuditLogs').where('familyId', '==', familyId),
    ),
  ]);
  await deleteReferences(db, [...inviteReferences, ...auditReferences]);

  if ((await familyRef.get()).exists) {
    await db.recursiveDelete(familyRef);
  }
}

async function removePersonalMembership(db, uid, familyId) {
  await Promise.all([
    db.doc(`families/${familyId}/members/${uid}`).delete(),
    db.doc(`users/${uid}/families/${familyId}`).delete(),
    removeFamilyPointer(db, uid, familyId),
  ]);
}

export async function executeAccountDeletion({
  db,
  auth,
  uid,
  requestedFamilyId = '',
  confirmation,
}) {
  if (!uid) throw new Error('Usuário autenticado não encontrado.');
  if (confirmation !== DELETE_CONFIRMATION) {
    throw new Error('Confirmação de exclusão inválida.');
  }

  const jobRef = db.doc(`accountDeletionJobs/${uid}`);
  const existingJob = await jobRef.get();
  const scope = existingJob.exists
    ? {
        ownedFamilyIds: existingJob.get('ownedFamilyIds') || [],
        membershipFamilyIds: existingJob.get('membershipFamilyIds') || [],
        memberUidsByFamily: existingJob.get('memberUidsByFamily') || {},
      }
    : await collectDeletionScope(db, uid, requestedFamilyId);

  await jobRef.set({
    uid,
    ...scope,
    status: 'processing',
    updatedAt: FieldValue.serverTimestamp(),
    createdAt: existingJob.exists
      ? existingJob.get('createdAt') || FieldValue.serverTimestamp()
      : FieldValue.serverTimestamp(),
  }, { merge: true });

  for (const familyId of scope.ownedFamilyIds) {
    await deleteOwnedFamily(
      db,
      uid,
      familyId,
      scope.memberUidsByFamily[familyId] || [],
    );
  }

  for (const familyId of scope.membershipFamilyIds) {
    await removePersonalMembership(db, uid, familyId);
  }

  const userRef = db.doc(`users/${uid}`);
  if ((await userRef.get()).exists) {
    await db.recursiveDelete(userRef);
  }

  await auth.deleteUser(uid);
  await jobRef.delete().catch(() => undefined);

  return {
    deleted: true,
    deletedFamilyIds: scope.ownedFamilyIds,
    removedMembershipIds: scope.membershipFamilyIds,
    familyCascade: scope.ownedFamilyIds.length > 0,
  };
}

export { DELETE_CONFIRMATION };
