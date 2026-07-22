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
  getRoutineSleepSegmentsForOrbit,
  getTodayAwakeMs,
  getTodaySummary,
  mergeDayStates,
  resolveRoutineIntervalEnd,
  restoreRoutineSnapshot,
  saveDayNotes,
  startRoutine,
  startRoutineAt,
  startSleep,
  updateRoutineEvent,
} = await import('../src/domain/routine.ts');
const {
  canEditFamilyProfile,
  canExportFamilyReports,
  canWriteFamilyRoutine,
  familyRoleLabel,
  isGlobalAppAdminEmail,
  normalizeFamilyRole,
  normalizeInviteRole,
} = await import('../src/domain/family-access.ts');

const initial = createEmptyDayState();
const felipe = { uid: 'felipe', email: 'felipe@example.com', name: 'Felipe', relationship: 'Pai', label: 'Felipe · Pai' };
const mary = { uid: 'mary', email: 'mary@example.com', name: 'Mary', relationship: 'Mãe', label: 'Mary · Mãe' };
const awake = startRoutine(initial, 'awake', 1_700_000_000_000, felipe);
const sleeping = startSleep(awake, 'dormir', 1_700_000_005_000, felipe);


const customWakeTime = new Date(2026, 6, 21, 6, 35, 0, 0).getTime();
const customWakeNow = new Date(2026, 6, 21, 8, 0, 0, 0).getTime();
const customWake = startRoutineAt(createEmptyDayState(), 'awake', customWakeTime, customWakeNow, felipe);
assert.equal(customWake.mode, 'awake');
assert.equal(customWake.activeStartedAt, customWakeTime);
assert.equal(customWake.events.find((event) => event.type === 'acordou')?.start, customWakeTime);
assert.equal(customWake.events.find((event) => event.type === 'acordou')?.detail, 'Horário inicial informado');

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


const exactOvernightStart = new Date(2026, 6, 18, 20, 30, 0, 0).getTime();
const rawSameDateEnd = new Date(2026, 6, 18, 2, 30, 0, 0).getTime();
const exactOvernightEnd = new Date(2026, 6, 19, 2, 30, 0, 0).getTime();
assert.equal(resolveRoutineIntervalEnd('sono', exactOvernightStart, rawSameDateEnd), exactOvernightEnd);

const completedOvernightState = addRoutineRecord(createEmptyDayState(), {
  type: 'sono',
  start: exactOvernightStart,
  end: rawSameDateEnd,
  detail: 'No berço',
}, new Date(2026, 6, 19, 15, 0, 0, 0).getTime(), felipe);
const completedOvernightEvent = completedOvernightState.events.find((event) => event.type === 'sono');
assert.ok(completedOvernightEvent);
assert.equal(completedOvernightEvent.end, exactOvernightEnd);
assert.equal(completedOvernightEvent.end - completedOvernightEvent.start, 6 * 60 * 60 * 1000);
assert.equal(completedOvernightState.mode, 'idle');

const openManualSleep = addRoutineRecord(createEmptyDayState(), {
  type: 'sono',
  start: exactOvernightStart,
  detail: 'No berço',
}, new Date(2026, 6, 18, 20, 31, 0, 0).getTime(), felipe);
assert.equal(openManualSleep.mode, 'sleeping');
assert.equal(openManualSleep.activeStartedAt, exactOvernightStart);
assert.equal(openManualSleep.events.length, 0);

const progressiveStart = new Date(2026, 6, 19, 21, 34, 0, 0).getTime();
const progressiveEnd = new Date(2026, 6, 20, 2, 0, 0, 0).getTime();
const progressiveOvernightEvent = {
  ...completedOvernightEvent,
  id: 'progressive-overnight-sleep',
  start: progressiveStart,
  end: progressiveEnd,
};
const progressiveDayStart = new Date(2026, 6, 20, 0, 0, 0, 0).getTime();
const progressivePreviousMidnight = progressiveDayStart;

const orbitAtMorning = getRoutineSleepSegmentsForOrbit([progressiveOvernightEvent], new Date(2026, 6, 20, 6, 43, 0, 0).getTime());
assert.equal(orbitAtMorning.length, 2);
assert.deepEqual(orbitAtMorning.map((segment) => [segment.start, segment.end]), [
  [progressiveStart, progressivePreviousMidnight],
  [progressiveDayStart, progressiveEnd],
]);
assert.deepEqual(orbitAtMorning.map((segment) => [segment.showStartCap, segment.showEndCap, segment.showStartLabel]), [
  [true, false, true],
  [false, true, false],
]);

const orbitBeforeRepeatedStart = getRoutineSleepSegmentsForOrbit([progressiveOvernightEvent], new Date(2026, 6, 20, 21, 20, 0, 0).getTime());
assert.equal(orbitBeforeRepeatedStart[0].end, progressiveDayStart);

const orbitAt2315 = getRoutineSleepSegmentsForOrbit([progressiveOvernightEvent], new Date(2026, 6, 20, 23, 15, 0, 0).getTime());
assert.equal(orbitAt2315.length, 2);
assert.equal(orbitAt2315[0].start, progressiveStart);
assert.equal(orbitAt2315[0].end, new Date(2026, 6, 19, 23, 15, 0, 0).getTime());
assert.equal(orbitAt2315[1].start, progressiveDayStart);
assert.equal(orbitAt2315[1].end, progressiveEnd);
assert.equal(orbitAt2315[0].showEndCap, false);
assert.equal(orbitAt2315[1].showStartCap, false);

const orbitAt2359 = getRoutineSleepSegmentsForOrbit([progressiveOvernightEvent], new Date(2026, 6, 20, 23, 59, 0, 0).getTime());
assert.equal(orbitAt2359[0].end, new Date(2026, 6, 19, 23, 59, 0, 0).getTime());
assert.equal(getRoutineSleepSegmentsForOrbit([progressiveOvernightEvent], new Date(2026, 6, 21, 0, 1, 0, 0).getTime()).length, 0);

const nonOverlappingBlocker = [{
  start: new Date(2026, 6, 20, 10, 0, 0, 0).getTime(),
  end: new Date(2026, 6, 20, 11, 0, 0, 0).getTime(),
}];
const overlappingEveningBlocker = [{
  start: new Date(2026, 6, 20, 23, 15, 0, 0).getTime(),
  end: new Date(2026, 6, 20, 23, 45, 0, 0).getTime(),
}];
const overlappingMorningBlocker = [{
  start: new Date(2026, 6, 20, 1, 0, 0, 0).getTime(),
  end: new Date(2026, 6, 20, 1, 30, 0, 0).getTime(),
}];
const orbitWithNonOverlap = getRoutineSleepSegmentsForOrbit([progressiveOvernightEvent], new Date(2026, 6, 20, 6, 43, 0, 0).getTime(), nonOverlappingBlocker);
assert.equal(orbitWithNonOverlap.length, 2);
assert.equal(orbitWithNonOverlap[0].end, progressiveDayStart);
assert.equal(orbitWithNonOverlap[1].end, progressiveEnd);
const orbitWithEveningCollision = getRoutineSleepSegmentsForOrbit([progressiveOvernightEvent], new Date(2026, 6, 20, 20, 0, 0, 0).getTime(), overlappingEveningBlocker);
assert.equal(orbitWithEveningCollision.length, 2);
assert.equal(orbitWithEveningCollision[0].end, new Date(2026, 6, 19, 23, 15, 0, 0).getTime());
const orbitWithMorningCollision = getRoutineSleepSegmentsForOrbit([progressiveOvernightEvent], new Date(2026, 6, 20, 6, 43, 0, 0).getTime(), overlappingMorningBlocker);
assert.equal(orbitWithMorningCollision.length, 2);
assert.equal(orbitWithMorningCollision[1].end, new Date(2026, 6, 20, 1, 0, 0, 0).getTime());
assert.equal(orbitWithMorningCollision[1].showEndCap, false);

assert.equal(getTodaySummary({ ...createEmptyDayState(), events: [completedOvernightEvent] }, new Date(2026, 6, 19, 15, 0, 0, 0).getTime()).sleepMs, 2.5 * 60 * 60 * 1000);

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
assert.equal(canExportFamilyReports('visualizacao'), true);
assert.equal(canWriteFamilyRoutine('visualizacao'), false);
assert.equal(canWriteFamilyRoutine('cuidador'), true);
assert.equal(normalizeInviteRole('visualizacao'), 'visualizacao');
assert.equal(normalizeInviteRole('responsavel'), 'admin_familiar');
assert.equal(familyRoleLabel('admin_familiar'), 'Responsável adicional');
assert.equal(familyRoleLabel('visualizacao'), 'Somente visualização');
assert.equal(isGlobalAppAdminEmail(' LuizFelipe.DaSilva@gmail.com '), true);
assert.equal(isGlobalAppAdminEmail('responsavel@example.com'), false);

console.log('Sincronização da rotina e permissões familiares validadas.');
