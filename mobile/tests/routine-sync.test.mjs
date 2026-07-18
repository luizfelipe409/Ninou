import assert from 'node:assert/strict';

const {
  addRoutineRecord,
  createEmptyDayState,
  clearRoutineDay,
  deleteRoutineEvent,
  mergeDayStates,
  saveDayNotes,
  startRoutine,
  startSleep,
} = await import('../src/domain/routine.ts');

const initial = createEmptyDayState();
const awake = startRoutine(initial, 'awake', 1_700_000_000_000);
const sleeping = startSleep(awake, 'dormir', 1_700_000_005_000);

assert.equal(mergeDayStates(awake, sleeping).mode, 'sleeping');
assert.equal(mergeDayStates(sleeping, awake).mode, 'sleeping');
assert.equal(mergeDayStates(awake, sleeping).activeStartedAt, 1_700_000_005_000);

const withDiaper = addRoutineRecord(awake, { type: 'fralda', detail: 'Xixi' }, 1_700_000_002_000);
const withBottle = addRoutineRecord(awake, { type: 'mamadeira', detail: 'Fórmula', amountMl: 90 }, 1_700_000_003_000);
const mergedEvents = mergeDayStates(withDiaper, withBottle).events;

assert.equal(mergedEvents.length, 3);
assert.ok(mergedEvents.some((event) => event.type === 'fralda'));
assert.ok(mergedEvents.some((event) => event.type === 'mamadeira' && event.detail.includes('90 ml')));

const diaperEvent = withDiaper.events.find((event) => event.type === 'fralda');
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

console.log('Sincronização da rotina: convergência, exclusões, notas e união de eventos validadas.');
