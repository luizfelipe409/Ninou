import assert from 'node:assert/strict';

const {
  addRoutineRecord,
  createEmptyDayState,
  clearRoutineDay,
  deleteRoutineEvent,
  finishSleep,
  formatRoutineActorLabel,
  getRoutineEventOrbitTimestamp,
  getRoutineEventsForLocalDay,
  getRoutineMarkerEventsForLocalDay,
  getRoutineSleepSegmentForLocalDay,
  getTodayAwakeMs,
  mergeDayStates,
  restoreRoutineSnapshot,
  saveDayNotes,
  startRoutine,
  startSleep,
  updateRoutineEvent,
} = await import('../src/domain/routine.ts');
const {
  canEditFamilyProfile,
  canExportFamilyReports,
  isGlobalAppAdminEmail,
  normalizeFamilyRole,
} = await import('../src/domain/family-access.ts');

const initial = createEmptyDayState();
const felipe = { uid: 'felipe', email: 'felipe@example.com', name: 'Felipe', relationship: 'Pai', label: 'Felipe · Pai' };
const mary = { uid: 'mary', email: 'mary@example.com', name: 'Mary', relationship: 'Mãe', label: 'Mary · Mãe' };
const awake = startRoutine(initial, 'awake', 1_700_000_000_000, felipe);
const sleeping = startSleep(awake, 'dormir', 1_700_000_005_000, felipe);

assert.equal(mergeDayStates(awake, sleeping).mode, 'sleeping');
assert.equal(mergeDayStates(sleeping, awake).mode, 'sleeping');
assert.equal(mergeDayStates(awake, sleeping).activeStartedAt, 1_700_000_005_000);
assert.equal(mergeDayStates(awake, sleeping).activeActor.label, 'Felipe · Pai');

const wakeByMary = finishSleep(sleeping, 1_700_000_010_000, mary);
const sleepEvent = wakeByMary.events.find((event) => event.type === 'dormir');
const wakeEvent = wakeByMary.events.find((event) => event.type === 'despertar-noturno');
assert.equal(formatRoutineActorLabel(sleepEvent), 'Felipe · Pai');
assert.equal(formatRoutineActorLabel(wakeEvent), 'Mary · Mãe');
assert.equal(getRoutineEventOrbitTimestamp(sleepEvent), sleepEvent.end);
assert.equal(getRoutineEventOrbitTimestamp(wakeEvent), wakeEvent.start);

const orbitToday = new Date(2026, 6, 19, 12, 0, 0, 0).getTime();
const yesterdayMorningNap = {
  ...sleepEvent,
  id: 'yesterday-nap',
  type: 'sono',
  start: new Date(2026, 6, 18, 9, 0, 0, 0).getTime(),
  end: new Date(2026, 6, 18, 10, 0, 0, 0).getTime(),
};
const overnightSleep = {
  ...sleepEvent,
  id: 'overnight-sleep',
  type: 'dormir',
  start: new Date(2026, 6, 18, 20, 21, 0, 0).getTime(),
  end: new Date(2026, 6, 19, 2, 50, 0, 0).getTime(),
};
assert.deepEqual(getRoutineEventsForLocalDay([yesterdayMorningNap, overnightSleep], orbitToday).map((event) => event.id), ['overnight-sleep']);
assert.deepEqual(getRoutineSleepSegmentForLocalDay(overnightSleep, orbitToday), {
  start: new Date(2026, 6, 19, 0, 0, 0, 0).getTime(),
  end: new Date(2026, 6, 19, 2, 50, 0, 0).getTime(),
});
assert.deepEqual(getRoutineMarkerEventsForLocalDay([yesterdayMorningNap, overnightSleep], orbitToday), []);

const dayStart = new Date(2026, 6, 18, 0, 0, 0, 0).getTime();
const firstWake = startRoutine(createEmptyDayState(), 'awake', dayStart + 60 * 60 * 1000, felipe);
const firstSleep = startSleep(firstWake, 'sono', dayStart + 2 * 60 * 60 * 1000, felipe);
const secondWake = finishSleep(firstSleep, dayStart + 3 * 60 * 60 * 1000, mary);
assert.equal(getTodayAwakeMs(secondWake, dayStart + 3.5 * 60 * 60 * 1000), 90 * 60 * 1000);

const withDiaper = addRoutineRecord(awake, { type: 'fralda', detail: 'Xixi' }, 1_700_000_002_000);
const withBottle = addRoutineRecord(awake, { type: 'mamadeira', detail: 'Fórmula', amountMl: 90 }, 1_700_000_003_000);
const mergedEvents = mergeDayStates(withDiaper, withBottle).events;

assert.equal(mergedEvents.length, 3);
assert.ok(mergedEvents.some((event) => event.type === 'fralda'));
assert.ok(mergedEvents.some((event) => event.type === 'mamadeira' && event.detail.includes('90 ml')));

const undoneBottle = restoreRoutineSnapshot(withBottle, awake, 1_700_000_004_000);
assert.equal(undoneBottle.events.some((event) => event.type === 'mamadeira'), false);
assert.ok(undoneBottle.deletedEventIds.includes(withBottle.events.find((event) => event.type === 'mamadeira').id));
assert.equal(mergeDayStates(withBottle, undoneBottle).events.some((event) => event.type === 'mamadeira'), false);

const diaperEvent = withDiaper.events.find((event) => event.type === 'fralda');
const diaperEdited = updateRoutineEvent(withDiaper, diaperEvent.id, { detail: 'Xixi e cocô' }, 1_700_000_003_500, mary);
assert.equal(diaperEdited.events.find((event) => event.id === diaperEvent.id).updatedByLabel, 'Mary · Mãe');
const deletedOnSecondDevice = deleteRoutineEvent(withDiaper, diaperEvent.id, 1_700_000_004_000);
const deletionMerged = mergeDayStates(withDiaper, deletedOnSecondDevice);
assert.ok(!deletionMerged.events.some((event) => event.id === diaperEvent.id));
assert.ok(deletionMerged.deletedEventIds.includes(diaperEvent.id));

const clearedDay = clearRoutineDay(withDiaper, 1_700_000_007_000);
assert.equal(mergeDayStates(withDiaper, clearedDay).events.length, 0);

const olderNotes = saveDayNotes(awake, 'Nota antiga', 1_700_000_002_000);
const newerNotes = saveDayNotes(awake, 'Nota da família atualizada', 1_700_000_006_000);
assert.equal(mergeDayStates(olderNotes, newerNotes).dayNotes, 'Nota da família atualizada');
assert.equal(mergeDayStates(newerNotes, olderNotes).dayNotes, 'Nota da família atualizada');

assert.equal(normalizeFamilyRole('responsavel'), 'admin');
assert.equal(normalizeFamilyRole('cuidador'), 'caregiver');
assert.equal(normalizeFamilyRole('visualizacao'), 'viewer');
assert.equal(canEditFamilyProfile('responsavel'), true);
assert.equal(canExportFamilyReports('admin_familiar'), true);
assert.equal(canExportFamilyReports('cuidador'), true);
assert.equal(canExportFamilyReports('visualizacao'), false);
assert.equal(isGlobalAppAdminEmail(' LuizFelipe.DaSilva@gmail.com '), true);
assert.equal(isGlobalAppAdminEmail('responsavel@example.com'), false);

console.log('Sincronização da rotina e permissões familiares validadas.');
