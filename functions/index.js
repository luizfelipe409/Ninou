import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { HttpsError, onCall } from 'firebase-functions/v2/https';

import {
  DELETE_CONFIRMATION,
  executeAccountDeletion,
} from './account-deletion.js';

initializeApp();

export const deleteMyAccount = onCall({
  region: 'southamerica-east1',
  timeoutSeconds: 540,
  memory: '512MiB',
  cors: true,
}, async (request) => {
  if (!request.auth?.uid) {
    throw new HttpsError(
      'unauthenticated',
      'Entre novamente para excluir sua conta.',
    );
  }

  if (request.data?.confirmation !== DELETE_CONFIRMATION) {
    throw new HttpsError(
      'invalid-argument',
      'A confirmação da exclusão não foi reconhecida.',
    );
  }

  try {
    return await executeAccountDeletion({
      db: getFirestore(),
      auth: getAuth(),
      uid: request.auth.uid,
      requestedFamilyId: String(request.data?.familyId || '').trim(),
      confirmation: request.data.confirmation,
    });
  } catch (error) {
    console.error('Falha ao excluir conta Ninou', {
      uid: request.auth.uid,
      error,
    });
    throw new HttpsError(
      'internal',
      'Não foi possível concluir a exclusão. Nenhuma nova tentativa deve ser feita até o processamento ser retomado.',
    );
  }
});
