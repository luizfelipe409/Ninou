import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (path) => readFile(new URL(path, import.meta.url), 'utf8');
const familySetup = await read('../src/components/family-setup-portal.tsx');
const dateField = await read('../src/components/date-field.tsx');
const relationPicker = await read('../src/components/relation-picker.tsx');
const firebaseService = await read('../src/services/firebase.ts');
const subscriptionPortal = await read('../src/components/subscription-access-portal.tsx');
const today = await read('../src/app/(tabs)/index.tsx');
const diary = await read('../src/app/(tabs)/diario.tsx');
const profile = await read('../src/app/(tabs)/perfil.tsx');
const rolePolicy = await read('../src/domain/family-access.ts');
const firestoreRules = await read('../../firestore.rules');

assert.ok(familySetup.indexOf('function SetupField') < familySetup.indexOf('export function FamilySetupPortal'), 'O campo deve permanecer fora do componente para não perder foco a cada letra.');
assert.ok(familySetup.includes('<DateField label="Data de nascimento"'));
assert.ok(familySetup.includes('<RelationPicker value={responsibleRelation}'));
assert.ok(familySetup.includes('keyboardShouldPersistTaps="handled"'));
assert.ok(dateField.includes('display="inline"'));
assert.ok(dateField.includes('Toque para abrir o calendário'));
assert.ok(relationPicker.includes('Outra relação'));
assert.ok(relationPicker.includes('IDENTIDADE DO CUIDADOR'));

assert.ok(firebaseService.includes('const batch = writeBatch(db);'));
assert.ok(firebaseService.includes('await batch.commit();'));
assert.ok(subscriptionPortal.includes("'Acesso encerrado'"));
assert.ok(subscriptionPortal.includes("foreground = isDark ? '#FFF9FF'"));
assert.ok(!subscriptionPortal.includes('Seu período de acesso terminou'));

assert.ok(today.includes('Quando acordou?'));
assert.ok(today.includes('Informe a hora em que acordou hoje.'));
assert.ok(today.includes('Confirmar: acordou às'));
assert.ok(!today.includes('Começar a partir de agora'));

assert.ok(diary.includes('Remover este registro?'));
assert.ok(diary.includes('Remover registro'));
assert.ok(diary.includes('ALTERAÇÃO NO DIÁRIO'));
assert.ok(diary.includes('animationType="slide"'));

assert.ok(profile.includes('Responsável adicional'));
assert.ok(profile.includes('Somente visualização'));
assert.ok(profile.includes('Quem criou a família continua como responsável principal'));
assert.ok(rolePolicy.includes("return ['owner', 'admin', 'caregiver'].includes"));
assert.ok(rolePolicy.includes("if (normalized === 'viewer') return 'visualizacao'"));
assert.ok(firestoreRules.includes('"visualizacao"'));
assert.ok(firestoreRules.includes('roleCanWriteRoutine'));
const routineWriteRule = firestoreRules.split('function roleCanWriteRoutine')[1].split('function isFamilyAdmin')[0];
assert.ok(!routineWriteRule.includes('visualizacao'), 'Visualização não pode gravar a rotina.');
assert.ok(!routineWriteRule.includes('viewer'), 'Viewer não pode gravar a rotina.');

console.log('Fluxos mobile, foco dos campos, validade, exclusão e permissões validados.');
