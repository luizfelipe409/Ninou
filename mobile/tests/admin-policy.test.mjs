import assert from 'node:assert/strict';

import { isInternalAdminFamily } from '../src/domain/admin-policy.ts';

assert.equal(isInternalAdminFamily('ninou-family-luizfelipe', { title: 'Área técnica do admin' }), true);
assert.equal(isInternalAdminFamily('qualquer-id', { internalAdminFamily: true }), true);
assert.equal(isInternalAdminFamily('qualquer-id', { accessMode: 'support' }), true);
assert.equal(isInternalAdminFamily('qualquer-id', { familyType: 'internal_admin' }), true);
assert.equal(isInternalAdminFamily('cliente-real', { title: 'Família Oliveira', familyType: 'client' }), false);

console.log('Política de separação entre admin e famílias clientes validada.');
