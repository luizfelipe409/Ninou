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
const orbit = await read('../src/components/routine-orbit.tsx');
const register = await read('../src/app/registrar.tsx');
const rolePolicy = await read('../src/domain/family-access.ts');
const firestoreRules = await read('../../firestore.rules');

assert.ok(familySetup.indexOf('function SetupField') < familySetup.indexOf('export function FamilySetupPortal'), 'O campo deve permanecer fora do componente para não perder foco a cada letra.');
assert.ok(familySetup.includes('<DateField label="Data de nascimento"'));
assert.ok(familySetup.includes('<RelationPicker value={responsibleRelation}'));
assert.ok(familySetup.includes('keyboardShouldPersistTaps="handled"'));
assert.ok(dateField.includes('Escolha dia, mês e ano'));
assert.ok(dateField.includes('label="DIA"'));
assert.ok(dateField.includes('label="MÊS"'));
assert.ok(dateField.includes('label="ANO"'));
assert.ok(dateField.includes('Usar esta data'));
assert.ok(!dateField.includes('DateTimePicker'));
assert.ok(relationPicker.includes('Outra relação'));
assert.ok(relationPicker.includes('IDENTIDADE DO CUIDADOR'));
assert.ok(relationPicker.includes("const options = ['Pai', 'Mãe', 'Avó', 'Avô', 'Babá', 'Cuidador(a)', 'Tia', 'Tio']"));
assert.ok(!relationPicker.includes("'Mãe', 'Responsável', 'Avó'"), 'Responsável não deve aparecer como opção de relação.');
assert.ok(relationPicker.includes('legacyGenericRelations'), 'Valores antigos devem ser ocultados sem quebrar dados existentes.');

assert.ok(firebaseService.includes('const batch = writeBatch(db);'));
assert.ok(firebaseService.includes('await batch.commit();'));
assert.ok(subscriptionPortal.includes("'Acesso encerrado'"));
assert.ok(subscriptionPortal.includes("foreground = isDark ? '#FFF9FF'"));
assert.ok(!subscriptionPortal.includes('Seu período de acesso terminou'));

assert.ok(today.includes('Que horas {profile.name || \'o bebê\'} acordou hoje?'));
assert.ok(today.includes('ETAPA 1 · PRIMEIRO DESPERTAR'));
assert.ok(today.includes('ETAPA 2 · ESTADO ATUAL'));
assert.ok(today.includes('Como está agora?'));
assert.ok(today.includes('ETAPA 3 · INÍCIO DO ESTADO ATUAL'));
assert.ok(today.includes('Desde que horas está acordado?'));
assert.ok(today.includes('Quando esse sono começou?'));
assert.ok(today.includes('currentStateStartedAt'));
assert.ok(today.includes('onValueChange'));
assert.ok(!today.includes('onChange={'));
assert.ok(!today.includes('Começar a partir de agora'));
assert.ok(today.includes('AÇÃO MUITO PRÓXIMA'));

assert.ok(register.includes('o sono precisa durar pelo menos 2 minutos'));
assert.ok(orbit.includes('groupRoutineMarkerEvents'));
assert.ok(orbit.includes('×{group.length}'));
assert.ok(orbit.includes('if (activeMarkerEvent) markerEvents.push(activeMarkerEvent);'));
assert.ok(orbit.includes('const containsActive = group.some(isCurrentActiveMarker);'));
assert.ok(!orbit.includes('activeCollides'), 'O marcador ativo não deve mais cobrir um agrupamento separado.');
assert.ok(orbit.includes('ações agrupadas'));
assert.ok(orbit.includes('formatRoutineActorLabel(event)'));

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
