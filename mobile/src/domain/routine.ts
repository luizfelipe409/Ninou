export type RoutineMode = 'idle' | 'awake' | 'sleeping';
export const MIN_ROUTINE_STATE_DURATION_MS = 2 * 60 * 1000;

export type RoutineDayStartInput = {
  wakeAt: number;
  currentMode: Exclude<RoutineMode, 'idle'>;
  currentStateStartedAt?: number;
};

export type RoutineTransitionBlock = {
  remainingMs: number;
  message: string;
};
export type RoutineActor = {
  uid: string;
  email: string;
  name: string;
  relationship: string;
  label: string;
};
export type BreastfeedingSide = 'left' | 'right';
export type BreastfeedingTimer = {
  startedAt: number;
  activeSide: BreastfeedingSide | null;
  activeSideStartedAt: number | null;
  leftDurationMs: number;
  rightDurationMs: number;
  notes: string;
};
export type RecordType =
  | 'acordou'
  | 'sono'
  | 'dormir'
  | 'despertar-noturno'
  | 'amamentacao'
  | 'mamadeira'
  | 'fralda'
  | 'medicamento';

export type RoutineEvent = {
  id: string;
  type: RecordType;
  start: number;
  end: number;
  detail: string;
  notes: string;
  amountMl?: number;
  leftDurationMs?: number;
  rightDurationMs?: number;
  createdAtClient: number;
  createdByUid?: string;
  createdByEmail?: string;
  createdByName?: string;
  createdByRelationship?: string;
  createdByLabel?: string;
  updatedByUid?: string;
  updatedByEmail?: string;
  updatedByName?: string;
  updatedByRelationship?: string;
  updatedByLabel?: string;
  caregiverName?: string;
  caregiverRole?: string;
  caregiverRelationship?: string;
  caregiverLabel?: string;
};

export type DayNoteEpisode = {
  id: string;
  icon: string;
  text: string;
  time: number;
  caregiver: string;
};

export type DayState = {
  mode: RoutineMode;
  activeStartedAt: number | null;
  activeType: RecordType;
  activeDetail: string;
  activeNotes: string;
  activeActor: RoutineActor | null;
  lastWakeWindowStartedAt: number | null;
  lastWakeWindowMs: number | null;
  routineStateUpdatedAt: number;
  routineStateMutationId: string;
  breastfeedingTimer: BreastfeedingTimer | null;
  breastfeedingTimerUpdatedAt: number;
  breastfeedingTimerMutationId: string;
  events: RoutineEvent[];
  dayNotes: string;
  dayNotesUpdatedAt: number;
  noteEpisodes: DayNoteEpisode[];
  deletedEventIds: string[];
  deletedNoteEpisodeIds: string[];
};

export const recordConfig: Record<RecordType, { title: string; hint: string; options: string[] }> = {
  acordou: { title: 'Acordou', hint: 'Início da janela', options: ['Acordou bem', 'Acordou calmo(a)', 'Acordou chorando', 'Outro'] },
  sono: { title: 'Soneca', hint: 'Início e fim', options: ['No berço', 'No colo', 'Carrinho', 'Bebê conforto', 'Cama compartilhada', 'Outro'] },
  dormir: { title: 'Sono da noite', hint: 'Rotina noturna', options: ['Berço', 'Mini berço', 'Moisés', 'Cama compartilhada', 'Outro'] },
  'despertar-noturno': { title: 'Despertar', hint: 'Acordou à noite', options: ['Mamou', 'Mamadeira', 'Fralda', 'Cólica', 'Gases', 'Refluxo', 'Sem motivo aparente', 'Outro'] },
  amamentacao: { title: 'Amamentação', hint: 'Timer por lado', options: ['Esquerdo', 'Direito', 'Mista'] },
  mamadeira: { title: 'Mamadeira', hint: 'Volume em ml', options: ['Leite materno', 'Fórmula', 'Misto'] },
  fralda: { title: 'Fralda', hint: 'Troca e detalhe', options: ['Xixi', 'Cocô', 'Mista'] },
  medicamento: { title: 'Medicamento', hint: 'Dose e horário', options: ['Dose', 'Gotas', 'Xarope', 'Vitamina', 'Outro'] },
};

export function createEmptyDayState(): DayState {
  return {
    mode: 'idle',
    activeStartedAt: null,
    activeType: 'sono',
    activeDetail: '',
    activeNotes: '',
    activeActor: null,
    lastWakeWindowStartedAt: null,
    lastWakeWindowMs: null,
    routineStateUpdatedAt: 0,
    routineStateMutationId: '',
    breastfeedingTimer: null,
    breastfeedingTimerUpdatedAt: 0,
    breastfeedingTimerMutationId: '',
    events: [],
    dayNotes: '',
    dayNotesUpdatedAt: 0,
    noteEpisodes: [],
    deletedEventIds: [],
    deletedNoteEpisodeIds: [],
  };
}

function cleanText(value: unknown, maxLength = 120) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

function normalizeRoutineActor(value: unknown): RoutineActor | null {
  if (!value || typeof value !== 'object') return null;
  const actor = value as Partial<RoutineActor>;
  const name = cleanText(actor.name, 80);
  const relationship = cleanText(actor.relationship, 80);
  const email = cleanText(actor.email, 160);
  const label = cleanText(actor.label, 160) || [name, relationship].filter(Boolean).join(' · ') || email;
  if (!label) return null;
  return { uid: cleanText(actor.uid, 128), email, name, relationship, label };
}

function normalizeBreastfeedingTimer(value: unknown): BreastfeedingTimer | null {
  if (!value || typeof value !== 'object') return null;
  const timer = value as Partial<BreastfeedingTimer>;
  const startedAt = Number(timer.startedAt);
  if (!Number.isFinite(startedAt) || startedAt <= 0) return null;
  const requestedActiveSide = timer.activeSide === 'left' || timer.activeSide === 'right' ? timer.activeSide : null;
  const activeSideStartedAt = Number(timer.activeSideStartedAt);
  const activeSide = requestedActiveSide && Number.isFinite(activeSideStartedAt) && activeSideStartedAt > 0 ? requestedActiveSide : null;
  return {
    startedAt,
    activeSide,
    activeSideStartedAt: activeSide ? activeSideStartedAt : null,
    leftDurationMs: Math.max(0, Number(timer.leftDurationMs) || 0),
    rightDurationMs: Math.max(0, Number(timer.rightDurationMs) || 0),
    notes: cleanText(timer.notes, 1200),
  };
}

function createdByFields(actor?: RoutineActor | null) {
  const normalized = normalizeRoutineActor(actor);
  return normalized ? {
    createdByUid: normalized.uid,
    createdByEmail: normalized.email,
    createdByName: normalized.name,
    createdByRelationship: normalized.relationship,
    createdByLabel: normalized.label,
  } : {};
}

function updatedByFields(actor?: RoutineActor | null) {
  const normalized = normalizeRoutineActor(actor);
  return normalized ? {
    updatedByUid: normalized.uid,
    updatedByEmail: normalized.email,
    updatedByName: normalized.name,
    updatedByRelationship: normalized.relationship,
    updatedByLabel: normalized.label,
  } : {};
}

export function formatRoutineActorLabel(event: RoutineEvent) {
  return cleanText(event.createdByLabel, 160)
    || [cleanText(event.createdByName, 80), cleanText(event.createdByRelationship, 80)].filter(Boolean).join(' · ')
    || cleanText(event.caregiverLabel, 160)
    || [cleanText(event.caregiverName, 80), cleanText(event.caregiverRelationship || event.caregiverRole, 80)].filter(Boolean).join(' · ')
    || cleanText(event.createdByEmail, 160)
    || 'Responsável';
}

export function makeEvent(type: RecordType, start: number, end = start, detail = '', notes = '', amountMl?: number, actor?: RoutineActor | null): RoutineEvent {
  return {
    id: `${type}-${Math.round(start)}-${Math.random().toString(36).slice(2, 8)}`,
    type,
    start,
    end,
    detail,
    notes,
    ...(Number.isFinite(amountMl) ? { amountMl } : {}),
    ...createdByFields(actor),
    createdAtClient: Date.now(),
  };
}

export function normalizeDayState(value: Partial<DayState> | null | undefined): DayState {
  const empty = createEmptyDayState();
  if (!value || typeof value !== 'object') return empty;
  const mode: RoutineMode = ['idle', 'awake', 'sleeping'].includes(value.mode || '') ? value.mode as RoutineMode : 'idle';
  const start = Number(value.activeStartedAt);
  return {
    ...empty,
    ...value,
    mode,
    activeStartedAt: mode !== 'idle' && Number.isFinite(start) ? start : null,
    activeType: value.activeType && recordConfig[value.activeType] ? value.activeType : 'sono',
    activeActor: normalizeRoutineActor(value.activeActor),
    breastfeedingTimer: normalizeBreastfeedingTimer(value.breastfeedingTimer),
    breastfeedingTimerUpdatedAt: Number.isFinite(Number(value.breastfeedingTimerUpdatedAt)) ? Number(value.breastfeedingTimerUpdatedAt) : 0,
    breastfeedingTimerMutationId: cleanText(value.breastfeedingTimerMutationId, 160),
    events: Array.isArray(value.events)
      ? value.events.map(normalizeRoutineEvent).filter((event): event is RoutineEvent => Boolean(event))
      : [],
    dayNotes: typeof value.dayNotes === 'string' ? value.dayNotes.slice(0, 6000) : '',
    dayNotesUpdatedAt: Number.isFinite(Number(value.dayNotesUpdatedAt)) ? Number(value.dayNotesUpdatedAt) : 0,
    noteEpisodes: Array.isArray(value.noteEpisodes) ? value.noteEpisodes.flatMap((episode) => normalizeNoteEpisode(episode)) : [],
    deletedEventIds: Array.isArray(value.deletedEventIds) ? value.deletedEventIds.filter((id): id is string => typeof id === 'string').slice(-500) : [],
    deletedNoteEpisodeIds: Array.isArray(value.deletedNoteEpisodeIds) ? value.deletedNoteEpisodeIds.filter((id): id is string => typeof id === 'string').slice(-500) : [],
  };
}

function normalizeNoteEpisode(value: unknown): DayNoteEpisode[] {
  if (!value || typeof value !== 'object') return [];
  const item = value as Partial<DayNoteEpisode>;
  const time = Number(item.time);
  const text = typeof item.text === 'string' ? item.text.trim().slice(0, 600) : '';
  if (!text || !Number.isFinite(time)) return [];
  return [{
    id: typeof item.id === 'string' && item.id ? item.id : `note-${time}`,
    icon: typeof item.icon === 'string' ? item.icon.slice(0, 8) : '✦',
    text,
    time,
    caregiver: typeof item.caregiver === 'string' ? item.caregiver.slice(0, 80) : '',
  }];
}

function toMilliseconds(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) return value > 1_000_000_000 && value < 100_000_000_000 ? value * 1000 : value;
  if (value && typeof (value as { toMillis?: unknown }).toMillis === 'function') return (value as { toMillis: () => number }).toMillis();
  if (value && typeof value === 'object' && Number.isFinite(Number((value as { seconds?: number }).seconds))) {
    return Number((value as { seconds: number }).seconds) * 1000 + Math.floor(Number((value as { nanoseconds?: number }).nanoseconds || 0) / 1_000_000);
  }
  const parsed = typeof value === 'string' ? Date.parse(value) : Number.NaN;
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeRoutineEvent(event: Partial<RoutineEvent> | null | undefined): RoutineEvent | null {
  if (!event || !event.type || !recordConfig[event.type]) return null;
  const start = toMilliseconds(event.start ?? event.createdAtClient);
  if (!Number.isFinite(start)) return null;
  const endValue = toMilliseconds(event.end);
  const detail = typeof event.detail === 'string' ? event.detail : '';
  const amountFromDetail = Number(detail.match(/(\d+(?:[.,]\d+)?)\s*ml/i)?.[1]?.replace(',', '.'));
  const amountMl = Number.isFinite(Number(event.amountMl)) ? Number(event.amountMl) : amountFromDetail;
  const leftDurationMs = Number(event.leftDurationMs);
  const rightDurationMs = Number(event.rightDurationMs);
  return {
    id: typeof event.id === 'string' && event.id ? event.id : `${event.type}-${start}`,
    type: event.type,
    start: start as number,
    end: Number.isFinite(endValue) ? endValue as number : start as number,
    detail,
    notes: typeof event.notes === 'string' ? event.notes : '',
    ...(Number.isFinite(amountMl) ? { amountMl } : {}),
    ...(Number.isFinite(leftDurationMs) ? { leftDurationMs: Math.max(0, leftDurationMs) } : {}),
    ...(Number.isFinite(rightDurationMs) ? { rightDurationMs: Math.max(0, rightDurationMs) } : {}),
    ...Object.fromEntries([
      'createdByUid', 'createdByEmail', 'createdByName', 'createdByRelationship', 'createdByLabel',
      'updatedByUid', 'updatedByEmail', 'updatedByName', 'updatedByRelationship', 'updatedByLabel',
      'caregiverName', 'caregiverRole', 'caregiverRelationship', 'caregiverLabel',
    ].flatMap((key) => {
      const value = cleanText(event[key as keyof RoutineEvent], key.toLowerCase().includes('email') ? 160 : 120);
      return value ? [[key, value]] : [];
    })),
    createdAtClient: Number.isFinite(Number(event.createdAtClient)) ? Number(event.createdAtClient) : start as number,
  };
}

function compareLiveState(left: DayState, right: DayState) {
  const leftVersion = Math.max(left.routineStateUpdatedAt || 0, left.activeStartedAt || 0);
  const rightVersion = Math.max(right.routineStateUpdatedAt || 0, right.activeStartedAt || 0);
  if (leftVersion !== rightVersion) return leftVersion - rightVersion;
  if ((left.activeStartedAt || 0) !== (right.activeStartedAt || 0)) return (left.activeStartedAt || 0) - (right.activeStartedAt || 0);
  return left.routineStateMutationId.localeCompare(right.routineStateMutationId);
}

function compareBreastfeedingState(left: DayState, right: DayState) {
  if (left.breastfeedingTimerUpdatedAt !== right.breastfeedingTimerUpdatedAt) {
    return left.breastfeedingTimerUpdatedAt - right.breastfeedingTimerUpdatedAt;
  }
  return left.breastfeedingTimerMutationId.localeCompare(right.breastfeedingTimerMutationId);
}

export function mergeDayStates(localValue: Partial<DayState>, cloudValue: Partial<DayState>) {
  const local = normalizeDayState(localValue);
  const cloud = normalizeDayState(cloudValue);
  const latestLive = compareLiveState(local, cloud) >= 0 ? local : cloud;
  const latestBreastfeeding = compareBreastfeedingState(local, cloud) >= 0 ? local : cloud;
  const events = new Map<string, RoutineEvent>();
  cloud.events.forEach((event) => events.set(event.id, event));
  local.events.forEach((event) => events.set(event.id, event));
  const deletedEventIds = [...new Set([...cloud.deletedEventIds, ...local.deletedEventIds])];
  deletedEventIds.forEach((id) => events.delete(id));
  const notesSource = local.dayNotesUpdatedAt >= cloud.dayNotesUpdatedAt ? local : cloud;
  const episodes = new Map<string, DayNoteEpisode>();
  cloud.noteEpisodes.forEach((episode) => episodes.set(episode.id, episode));
  local.noteEpisodes.forEach((episode) => episodes.set(episode.id, episode));
  const deletedNoteEpisodeIds = [...new Set([...cloud.deletedNoteEpisodeIds, ...local.deletedNoteEpisodeIds])];
  deletedNoteEpisodeIds.forEach((id) => episodes.delete(id));
  return normalizeDayState({
    ...cloud,
    ...local,
    mode: latestLive.mode,
    activeStartedAt: latestLive.activeStartedAt,
    activeType: latestLive.activeType,
    activeDetail: latestLive.activeDetail,
    activeNotes: latestLive.activeNotes,
    activeActor: latestLive.activeActor,
    lastWakeWindowStartedAt: latestLive.lastWakeWindowStartedAt,
    lastWakeWindowMs: latestLive.lastWakeWindowMs,
    routineStateUpdatedAt: latestLive.routineStateUpdatedAt,
    routineStateMutationId: latestLive.routineStateMutationId,
    breastfeedingTimer: latestBreastfeeding.breastfeedingTimer,
    breastfeedingTimerUpdatedAt: latestBreastfeeding.breastfeedingTimerUpdatedAt,
    breastfeedingTimerMutationId: latestBreastfeeding.breastfeedingTimerMutationId,
    events: [...events.values()].sort((a, b) => a.start - b.start),
    dayNotes: notesSource.dayNotes,
    dayNotesUpdatedAt: notesSource.dayNotesUpdatedAt,
    noteEpisodes: [...episodes.values()].sort((a, b) => a.time - b.time),
    deletedEventIds,
    deletedNoteEpisodeIds,
  });
}

function stamp(state: DayState, now: number, action: string): DayState {
  return {
    ...state,
    routineStateUpdatedAt: Math.max(now, state.routineStateUpdatedAt + 1),
    routineStateMutationId: `${action}-${now}-${Math.random().toString(36).slice(2, 6)}`,
  };
}

function stampBreastfeeding(state: DayState, now: number, action: string): DayState {
  return stamp({
    ...state,
    breastfeedingTimerUpdatedAt: Math.max(now, state.breastfeedingTimerUpdatedAt + 1),
    breastfeedingTimerMutationId: `${action}-${now}-${Math.random().toString(36).slice(2, 6)}`,
  }, now, action);
}

export function getBreastfeedingDurations(timer: BreastfeedingTimer | null, now = Date.now()) {
  if (!timer) return { leftDurationMs: 0, rightDurationMs: 0, totalDurationMs: 0 };
  const liveDuration = timer.activeSide && timer.activeSideStartedAt
    ? Math.max(0, now - timer.activeSideStartedAt)
    : 0;
  const leftDurationMs = timer.leftDurationMs + (timer.activeSide === 'left' ? liveDuration : 0);
  const rightDurationMs = timer.rightDurationMs + (timer.activeSide === 'right' ? liveDuration : 0);
  return { leftDurationMs, rightDurationMs, totalDurationMs: leftDurationMs + rightDurationMs };
}

function settleBreastfeedingTimer(timer: BreastfeedingTimer, now: number): BreastfeedingTimer {
  const durations = getBreastfeedingDurations(timer, now);
  return {
    ...timer,
    activeSide: null,
    activeSideStartedAt: null,
    leftDurationMs: durations.leftDurationMs,
    rightDurationMs: durations.rightDurationMs,
  };
}

export function formatBreastfeedingDetail(leftDurationMs: number, rightDurationMs: number) {
  const entries = [
    leftDurationMs > 0 ? `Esquerdo ${formatDuration(leftDurationMs, true)}` : '',
    rightDurationMs > 0 ? `Direito ${formatDuration(rightDurationMs, true)}` : '',
  ].filter(Boolean);
  return entries.join(' • ') || 'Mamada registrada';
}

export function startBreastfeedingTimer(state: DayState, side: BreastfeedingSide, now = Date.now()): DayState {
  if (state.breastfeedingTimer) {
    return switchBreastfeedingSide(state, side, now);
  }
  return stampBreastfeeding({
    ...state,
    breastfeedingTimer: {
      startedAt: now,
      activeSide: side,
      activeSideStartedAt: now,
      leftDurationMs: 0,
      rightDurationMs: 0,
      notes: '',
    },
  }, now, `breastfeeding-start-${side}`);
}

export function pauseBreastfeedingTimer(state: DayState, now = Date.now()): DayState {
  if (!state.breastfeedingTimer?.activeSide) return state;
  return stampBreastfeeding({
    ...state,
    breastfeedingTimer: settleBreastfeedingTimer(state.breastfeedingTimer, now),
  }, now, 'breastfeeding-pause');
}

export function switchBreastfeedingSide(state: DayState, side: BreastfeedingSide, now = Date.now()): DayState {
  const timer = state.breastfeedingTimer;
  if (!timer) return startBreastfeedingTimer(state, side, now);
  if (timer.activeSide === side) return pauseBreastfeedingTimer(state, now);
  const settled = settleBreastfeedingTimer(timer, now);
  return stampBreastfeeding({
    ...state,
    breastfeedingTimer: {
      ...settled,
      activeSide: side,
      activeSideStartedAt: now,
    },
  }, now, `breastfeeding-side-${side}`);
}

export function resumeBreastfeedingTimer(state: DayState, side?: BreastfeedingSide, now = Date.now()): DayState {
  const timer = state.breastfeedingTimer;
  if (!timer || timer.activeSide) return state;
  const resumeSide = side || (timer.rightDurationMs > timer.leftDurationMs ? 'right' : 'left');
  return stampBreastfeeding({
    ...state,
    breastfeedingTimer: {
      ...timer,
      activeSide: resumeSide,
      activeSideStartedAt: now,
    },
  }, now, `breastfeeding-resume-${resumeSide}`);
}

export function cancelBreastfeedingTimer(state: DayState, now = Date.now()): DayState {
  if (!state.breastfeedingTimer) return state;
  return stampBreastfeeding({ ...state, breastfeedingTimer: null }, now, 'breastfeeding-cancel');
}

export function finishBreastfeedingTimer(state: DayState, now = Date.now(), actor?: RoutineActor | null, notes = ''): DayState {
  const timer = state.breastfeedingTimer;
  if (!timer) return state;
  const { leftDurationMs, rightDurationMs, totalDurationMs } = getBreastfeedingDurations(timer, now);
  if (totalDurationMs < 1000) return cancelBreastfeedingTimer(state, now);
  const event = makeEvent('amamentacao', timer.startedAt, now, formatBreastfeedingDetail(leftDurationMs, rightDurationMs), cleanText(notes, 1200) || timer.notes, undefined, actor);
  event.leftDurationMs = leftDurationMs;
  event.rightDurationMs = rightDurationMs;
  return stampBreastfeeding({
    ...state,
    breastfeedingTimer: null,
    events: [...state.events, event],
  }, now, 'breastfeeding-finish');
}

export function startRoutineAt(state: DayState, mode: Exclude<RoutineMode, 'idle'>, startedAt: number, now = Date.now(), actor?: RoutineActor | null): DayState {
  const safeStartedAt = Math.min(now, Math.max(0, Number(startedAt) || now));
  return stamp({
    ...state,
    mode,
    activeStartedAt: safeStartedAt,
    activeType: mode === 'sleeping' ? 'sono' : 'acordou',
    activeDetail: mode === 'sleeping' ? 'Timer' : '',
    activeNotes: '',
    activeActor: normalizeRoutineActor(actor),
    events: mode === 'awake'
      ? [...state.events, makeEvent('acordou', safeStartedAt, safeStartedAt, safeStartedAt === now ? 'Rotina iniciada agora' : 'Horário inicial informado', '', undefined, actor)]
      : state.events,
  }, now, `start-${mode}`);
}

export function initializeRoutineDay(
  state: DayState,
  input: RoutineDayStartInput,
  now = Date.now(),
  actor?: RoutineActor | null,
): DayState {
  const dayStart = new Date(now);
  dayStart.setHours(0, 0, 0, 0);
  const safeWakeAt = Math.min(now, Math.max(dayStart.getTime(), Number(input.wakeAt) || now));
  const requestedCurrentStart = Number(input.currentStateStartedAt);
  const currentStateStartedAt = Math.min(
    now,
    Math.max(safeWakeAt, Number.isFinite(requestedCurrentStart) ? requestedCurrentStart : safeWakeAt),
  );
  const hasWakeMarker = state.events.some((event) => event.type === 'acordou' && Math.abs(event.start - safeWakeAt) < 60 * 1000);
  const wakeEvent = hasWakeMarker
    ? []
    : [makeEvent('acordou', safeWakeAt, safeWakeAt, 'Primeiro despertar informado', '', undefined, actor)];

  return stamp({
    ...state,
    mode: input.currentMode,
    activeStartedAt: currentStateStartedAt,
    activeType: input.currentMode === 'sleeping'
      ? (isNightPeriod(currentStateStartedAt) ? 'dormir' : 'sono')
      : 'acordou',
    activeDetail: input.currentMode === 'sleeping'
      ? (isNightPeriod(currentStateStartedAt) ? 'Sono noturno' : 'Timer')
      : '',
    activeNotes: '',
    activeActor: normalizeRoutineActor(actor),
    lastWakeWindowStartedAt: input.currentMode === 'sleeping' ? safeWakeAt : null,
    lastWakeWindowMs: input.currentMode === 'sleeping' ? Math.max(0, currentStateStartedAt - safeWakeAt) : null,
    events: [...state.events, ...wakeEvent].sort((left, right) => left.start - right.start),
  }, now, `initialize-${input.currentMode}`);
}

export function startRoutine(state: DayState, mode: Exclude<RoutineMode, 'idle'>, now = Date.now(), actor?: RoutineActor | null): DayState {
  return startRoutineAt(state, mode, now, now, actor);
}

export function startSleep(state: DayState, type: 'sono' | 'dormir', now = Date.now(), actor?: RoutineActor | null): DayState {
  if (state.mode === 'sleeping') return state;
  if (getRoutineTransitionBlock(state, now)) return state;
  const awakeStart = state.mode === 'awake' ? state.activeStartedAt : null;
  return stamp({
    ...state,
    mode: 'sleeping',
    activeStartedAt: now,
    activeType: type,
    activeDetail: type === 'dormir' ? 'Sono noturno' : 'Timer',
    activeNotes: '',
    activeActor: normalizeRoutineActor(actor),
    lastWakeWindowStartedAt: awakeStart,
    lastWakeWindowMs: awakeStart ? Math.max(0, now - awakeStart) : null,
  }, now, `start-${type}`);
}

export function finishSleep(state: DayState, now = Date.now(), actor?: RoutineActor | null): DayState {
  if (state.mode !== 'sleeping' || !state.activeStartedAt) return state;
  if (getRoutineTransitionBlock(state, now)) return state;
  const isNight = state.activeType === 'dormir' || isNightPeriod(now);
  const wakeType: RecordType = isNight ? 'despertar-noturno' : 'acordou';
  return stamp({
    ...state,
    mode: 'awake',
    activeStartedAt: now,
    activeType: wakeType,
    activeDetail: '',
    activeNotes: '',
    activeActor: normalizeRoutineActor(actor),
    events: [
      ...state.events,
      makeEvent(state.activeType === 'dormir' ? 'dormir' : 'sono', state.activeStartedAt, now, state.activeDetail || 'Timer', state.activeNotes, undefined, state.activeActor || actor),
      makeEvent(wakeType, now, now, isNight ? 'Despertar noturno' : 'Após soneca', '', undefined, actor),
    ],
  }, now, `finish-${state.activeType}`);
}

export function getRoutineTransitionBlock(state: DayState, now = Date.now()): RoutineTransitionBlock | null {
  if (state.mode === 'idle' || !state.activeStartedAt) return null;
  const elapsed = Math.max(0, now - state.activeStartedAt);
  if (elapsed >= MIN_ROUTINE_STATE_DURATION_MS) return null;
  const remainingMs = MIN_ROUTINE_STATE_DURATION_MS - elapsed;
  const remainingSeconds = Math.max(1, Math.ceil(remainingMs / 1000));
  const remainingLabel = remainingSeconds >= 60
    ? `${Math.ceil(remainingSeconds / 60)} min`
    : `${remainingSeconds} s`;
  return {
    remainingMs,
    message: `Para evitar registros acidentais, aguarde ${remainingLabel} antes de alternar entre sono e acordado. Se o horário estiver incorreto, ajuste o último registro no Diário.`,
  };
}

export function addRoutineRecord(state: DayState, input: { type: RecordType; detail?: string; notes?: string; amountMl?: number; start?: number; end?: number }, now = Date.now(), actor?: RoutineActor | null): DayState {
  const { type, detail = '', notes = '', amountMl } = input;
  const customStart = Number(input.start);
  const customEnd = Number(input.end);
  if (Number.isFinite(customStart)) {
    const resolvedEnd = resolveRoutineIntervalEnd(type, customStart, Number.isFinite(customEnd) ? customEnd : null);
    if ((type === 'sono' || type === 'dormir') && resolvedEnd === null) {
      if (state.mode === 'sleeping') return state;
      const awakeStart = state.mode === 'awake' ? state.activeStartedAt : null;
      if (awakeStart && (customStart < awakeStart || customStart - awakeStart < MIN_ROUTINE_STATE_DURATION_MS)) return state;
      return stamp({
        ...state,
        mode: 'sleeping',
        activeStartedAt: customStart,
        activeType: type,
        activeDetail: type === 'dormir' ? 'Sono noturno' : 'Timer',
        activeNotes: notes,
        activeActor: normalizeRoutineActor(actor),
        lastWakeWindowStartedAt: awakeStart,
        lastWakeWindowMs: awakeStart ? Math.max(0, customStart - awakeStart) : null,
      }, now, `start-${type}-manual`);
    }
    const end = resolvedEnd ?? customStart;
    if ((type === 'sono' || type === 'dormir') && end > customStart && end - customStart < MIN_ROUTINE_STATE_DURATION_MS) return state;
    if ((type === 'acordou' || type === 'despertar-noturno') && state.mode === 'sleeping' && state.activeStartedAt) {
      if (customStart < state.activeStartedAt || customStart - state.activeStartedAt < MIN_ROUTINE_STATE_DURATION_MS) return state;
      return finishSleep(state, customStart, actor);
    }
    if ((type === 'acordou' || type === 'despertar-noturno') && state.mode === 'awake') return state;
    return stamp({ ...state, events: [...state.events, makeEvent(type, customStart, end, detail, notes, amountMl, actor)] }, now, `record-${type}`);
  }
  if (type === 'sono' || type === 'dormir') return startSleep(state, type, now, actor);
  if (type === 'acordou' || type === 'despertar-noturno') {
    if (state.mode === 'sleeping') return finishSleep(state, now, actor);
    if (state.mode === 'awake') return state;
    const base = state;
    return stamp({
      ...base,
      mode: 'awake',
      activeStartedAt: now,
      activeType: type,
      activeDetail: '',
      activeNotes: '',
      activeActor: normalizeRoutineActor(actor),
      events: [...base.events, makeEvent(type, now, now, detail, notes, undefined, actor)],
    }, now, `record-${type}`);
  }
  const durableDetail = type === 'mamadeira' && Number.isFinite(amountMl)
    ? [detail, `${amountMl} ml`].filter(Boolean).join(' • ')
    : detail;
  return stamp({ ...state, events: [...state.events, makeEvent(type, now, now, durableDetail, notes, amountMl, actor)] }, now, `record-${type}`);
}

export function updateRoutineEvent(state: DayState, eventId: string, patch: Partial<Pick<RoutineEvent, 'type' | 'start' | 'end' | 'detail' | 'notes' | 'amountMl' | 'leftDurationMs' | 'rightDurationMs'>>, now = Date.now(), actor?: RoutineActor | null) {
  return stamp({
    ...state,
    events: state.events.map((event) => event.id === eventId ? normalizeRoutineEvent({ ...event, ...patch, ...updatedByFields(actor) }) || event : event),
  }, now, 'edit-event');
}

export function deleteRoutineEvent(state: DayState, eventId: string, now = Date.now()) {
  return stamp({
    ...state,
    events: state.events.filter((event) => event.id !== eventId),
    deletedEventIds: [...new Set([...state.deletedEventIds, eventId])],
  }, now, 'delete-event');
}

export function saveDayNotes(state: DayState, dayNotes: string, now = Date.now()) {
  return stamp({ ...state, dayNotes: dayNotes.trim().slice(0, 6000), dayNotesUpdatedAt: now }, now, 'day-notes');
}

export function addDayNoteEpisode(state: DayState, input: Omit<DayNoteEpisode, 'id'> & { id?: string }, now = Date.now()) {
  const episode: DayNoteEpisode = { ...input, id: input.id || `note-${now}-${Math.random().toString(36).slice(2, 6)}` };
  return stamp({ ...state, noteEpisodes: [...state.noteEpisodes, episode].sort((a, b) => a.time - b.time), dayNotesUpdatedAt: now }, now, 'day-episode');
}

export function deleteDayNoteEpisode(state: DayState, episodeId: string, now = Date.now()) {
  return stamp({ ...state, noteEpisodes: state.noteEpisodes.filter((episode) => episode.id !== episodeId), deletedNoteEpisodeIds: [...new Set([...state.deletedNoteEpisodeIds, episodeId])], dayNotesUpdatedAt: now }, now, 'delete-episode');
}

export function clearRoutineDay(state: DayState, now = Date.now()) {
  return stamp({
    ...createEmptyDayState(),
    breastfeedingTimerUpdatedAt: Math.max(now, state.breastfeedingTimerUpdatedAt + 1),
    breastfeedingTimerMutationId: `breastfeeding-clear-${now}`,
    deletedEventIds: [...new Set([...state.deletedEventIds, ...state.events.map((event) => event.id)])],
    deletedNoteEpisodeIds: [...new Set([...state.deletedNoteEpisodeIds, ...state.noteEpisodes.map((episode) => episode.id)])],
    dayNotesUpdatedAt: now,
  }, now, 'clear-day');
}

export function restoreRoutineSnapshot(currentValue: DayState, previousValue: DayState, now = Date.now()) {
  const current = normalizeDayState(currentValue);
  const previous = normalizeDayState(previousValue);
  const previousEventIds = new Set(previous.events.map((event) => event.id));
  const previousEpisodeIds = new Set(previous.noteEpisodes.map((episode) => episode.id));
  const eventsRemovedByUndo = current.events.filter((event) => !previousEventIds.has(event.id)).map((event) => event.id);
  const episodesRemovedByUndo = current.noteEpisodes.filter((episode) => !previousEpisodeIds.has(episode.id)).map((episode) => episode.id);
  return stamp({
    ...previous,
    routineStateUpdatedAt: current.routineStateUpdatedAt,
    deletedEventIds: [...new Set([...current.deletedEventIds, ...previous.deletedEventIds, ...eventsRemovedByUndo])].filter((id) => !previousEventIds.has(id)),
    deletedNoteEpisodeIds: [...new Set([...current.deletedNoteEpisodeIds, ...previous.deletedNoteEpisodeIds, ...episodesRemovedByUndo])].filter((id) => !previousEpisodeIds.has(id)),
  }, now, 'undo');
}

export function isNightPeriod(now = Date.now()) {
  const hour = new Date(now).getHours();
  return hour >= 19 || hour < 6;
}

export function getPrimaryAction(state: DayState, now = Date.now()) {
  if (state.mode === 'sleeping') {
    return state.activeType === 'dormir' || isNightPeriod(now)
      ? { label: 'Despertar noturno', type: 'despertar-noturno' as RecordType }
      : { label: 'Acordou', type: 'acordou' as RecordType };
  }
  if (state.mode === 'awake') {
    return isNightPeriod(now)
      ? { label: 'Iniciar noite', type: 'dormir' as RecordType }
      : { label: 'Iniciar soneca', type: 'sono' as RecordType };
  }
  return null;
}

export function getElapsedMs(state: DayState, now = Date.now()) {
  return state.mode === 'idle' || !state.activeStartedAt ? 0 : Math.max(0, now - state.activeStartedAt);
}

export function getTodaySummary(state: DayState, now: number) {
  const { dayStart, dayEnd } = getRoutineLocalDayBounds(now);
  const summaryEnd = Math.min(dayEnd, now);
  const events = getRoutineEventsForLocalDay(state.events, now);
  const sleepMs = events.filter((event) => event.type === 'sono' || event.type === 'dormir')
    .reduce((total, event) => total + Math.max(0, Math.min(event.end, summaryEnd) - Math.max(event.start, dayStart)), 0)
    + (state.mode === 'sleeping' && state.activeStartedAt ? Math.max(0, summaryEnd - Math.max(state.activeStartedAt, dayStart)) : 0);
  return {
    sleepMs,
    feeding: events.filter((event) => event.type === 'amamentacao' || event.type === 'mamadeira').length,
    diapers: events.filter((event) => event.type === 'fralda').length,
    medicine: events.filter((event) => event.type === 'medicamento').length,
  };
}

export function getTodayAwakeMs(state: DayState, now = Date.now()) {
  const dayStartDate = new Date(now);
  dayStartDate.setHours(0, 0, 0, 0);
  const dayStart = dayStartDate.getTime();
  const dayEnd = Math.max(dayStart, now);
  const sleepStarts = state.events
    .filter((event) => event.type === 'sono' || event.type === 'dormir')
    .map((event) => event.start);
  if (state.mode === 'sleeping' && state.activeStartedAt) sleepStarts.push(state.activeStartedAt);
  sleepStarts.sort((left, right) => left - right);

  const intervals: [number, number][] = state.events
    .filter((event) => event.type === 'acordou' || event.type === 'despertar-noturno')
    .map((event) => {
      const sleepStart = sleepStarts.find((timestamp) => timestamp >= event.start);
      const end = sleepStart ?? (state.mode === 'awake' ? dayEnd : event.start);
      return [event.start, Math.max(event.start, end)] as [number, number];
    });

  if (state.lastWakeWindowStartedAt && state.lastWakeWindowMs) {
    intervals.push([state.lastWakeWindowStartedAt, state.lastWakeWindowStartedAt + state.lastWakeWindowMs]);
  }
  if (state.mode === 'awake' && state.activeStartedAt) intervals.push([state.activeStartedAt, dayEnd]);

  const clipped = intervals
    .map(([start, end]) => [Math.max(dayStart, start), Math.min(dayEnd, end)] as [number, number])
    .filter(([start, end]) => end > start)
    .sort((left, right) => left[0] - right[0]);
  const merged = clipped.reduce<[number, number][]>((result, interval) => {
    const previous = result[result.length - 1];
    if (!previous || interval[0] > previous[1]) result.push([...interval]);
    else previous[1] = Math.max(previous[1], interval[1]);
    return result;
  }, []);
  return merged.reduce((total, [start, end]) => total + end - start, 0);
}

export function formatDuration(ms: number, includeSeconds = false) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return includeSeconds
    ? `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
    : `${hours > 0 ? `${hours}h ` : ''}${minutes}min`;
}

export function formatTime(timestamp: number) {
  return new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(timestamp);
}

function addLocalCalendarDays(timestamp: number, amount: number) {
  const date = new Date(timestamp);
  date.setDate(date.getDate() + amount);
  return date.getTime();
}

export function resolveRoutineIntervalEnd(type: RecordType, start: number, end: number | null | undefined) {
  if (!Number.isFinite(start) || end === null || end === undefined || !Number.isFinite(Number(end))) return null;
  const rawEnd = Number(end);
  const canCrossMidnight = type === 'sono' || type === 'dormir' || type === 'amamentacao';
  if (canCrossMidnight && rawEnd < start) return addLocalCalendarDays(rawEnd, 1);
  return Math.max(start, rawEnd);
}

export function getRoutineEventOrbitTimestamp(event: RoutineEvent) {
  const isSleepDuration = event.type === 'sono' || event.type === 'dormir';
  return isSleepDuration && event.end > event.start ? event.end : event.start;
}

export function getRoutineLocalDayBounds(dayTimestamp = Date.now()) {
  const dayStartDate = new Date(dayTimestamp);
  dayStartDate.setHours(0, 0, 0, 0);
  const dayStart = dayStartDate.getTime();
  const nextDayDate = new Date(dayStartDate);
  nextDayDate.setDate(nextDayDate.getDate() + 1);
  const dayEnd = nextDayDate.getTime();
  return { dayStart, dayEnd };
}

export function getRoutineSleepSegmentForLocalDay(event: RoutineEvent, dayTimestamp = Date.now()) {
  if ((event.type !== 'sono' && event.type !== 'dormir') || event.end <= event.start) return null;
  const { dayStart, dayEnd } = getRoutineLocalDayBounds(dayTimestamp);
  if (event.start >= dayEnd || event.end <= dayStart) return null;
  return { start: Math.max(event.start, dayStart), end: Math.min(event.end, dayEnd) };
}

export type RoutineOrbitSleepSegment = {
  event: RoutineEvent;
  start: number;
  end: number;
  carriedFromPreviousDay: boolean;
  orbitKey: string;
  showStartCap: boolean;
  showEndCap: boolean;
  showStartLabel: boolean;
};

function clockMilliseconds(timestamp: number) {
  const date = new Date(timestamp);
  return ((date.getHours() * 60 + date.getMinutes()) * 60 + date.getSeconds()) * 1000 + date.getMilliseconds();
}

export function routineOrbitSegmentsOverlap(
  left: Pick<RoutineOrbitSleepSegment, 'start' | 'end'>,
  right: Pick<RoutineOrbitSleepSegment, 'start' | 'end'>,
  bufferMs = 12 * 60 * 1000,
) {
  const dayMs = 24 * 60 * 60 * 1000;
  const leftDuration = Math.min(dayMs, Math.max(0, left.end - left.start));
  const rightDuration = Math.min(dayMs, Math.max(0, right.end - right.start));
  if (!leftDuration || !rightDuration) return false;
  if (leftDuration >= dayMs || rightDuration >= dayMs) return true;

  const leftStart = clockMilliseconds(left.start);
  const leftEnd = leftStart + leftDuration;
  const rightStart = clockMilliseconds(right.start);
  const rightEnd = rightStart + rightDuration;
  return [-dayMs, 0, dayMs].some((shift) => {
    const shiftedStart = rightStart + shift;
    const shiftedEnd = rightEnd + shift;
    return leftEnd + bufferMs >= shiftedStart && shiftedEnd + bufferMs >= leftStart;
  });
}

export function getRoutineSleepSegmentsForOrbit(
  events: RoutineEvent[],
  dayTimestamp = Date.now(),
  blockers: { start: number; end: number }[] = [],
) {
  const dayMs = 24 * 60 * 60 * 1000;
  const { dayStart, dayEnd } = getRoutineLocalDayBounds(dayTimestamp);
  const previousDayStart = addLocalCalendarDays(dayStart, -1);

  const timestampAtClock = (localDayStart: number, clockMs: number) => {
    const date = new Date(localDayStart);
    const hours = Math.floor(clockMs / (60 * 60 * 1000));
    const minutes = Math.floor((clockMs % (60 * 60 * 1000)) / (60 * 1000));
    const seconds = Math.floor((clockMs % (60 * 1000)) / 1000);
    const milliseconds = clockMs % 1000;
    date.setHours(hours, minutes, seconds, milliseconds);
    return date.getTime();
  };

  const toClockRanges = (segment: { start: number; end: number }) => {
    const duration = Math.min(dayMs, Math.max(0, segment.end - segment.start));
    if (!duration) return [] as { start: number; end: number }[];
    if (duration >= dayMs) return [{ start: 0, end: dayMs }];
    const startClock = clockMilliseconds(segment.start);
    const linearEnd = startClock + duration;
    return linearEnd <= dayMs
      ? [{ start: startClock, end: linearEnd }]
      : [{ start: startClock, end: dayMs }, { start: 0, end: linearEnd - dayMs }];
  };

  const firstCollisionAt = (
    rangeStart: number,
    rangeEnd: number,
    collisionRanges: { start: number; end: number }[],
  ) => collisionRanges.reduce((cutoff, range) => {
    if (range.end <= rangeStart || range.start >= rangeEnd) return cutoff;
    return Math.min(cutoff, Math.max(rangeStart, range.start));
  }, rangeEnd);

  const baseSegments = events.flatMap<RoutineOrbitSleepSegment>((event) => {
    if ((event.type !== 'sono' && event.type !== 'dormir') || event.end <= event.start) return [];
    if (event.start >= dayEnd || event.end <= dayStart) return [];
    const carriedFromPreviousDay = event.start < dayStart
      && event.end > dayStart
      && event.start >= previousDayStart
      && event.end - event.start < dayMs;
    if (carriedFromPreviousDay) return [];
    const start = Math.max(event.start, dayStart);
    const end = Math.min(event.end, dayEnd);
    return [{
      event,
      start,
      end,
      carriedFromPreviousDay: false,
      orbitKey: `${event.id}:current:${start}:${end}`,
      showStartCap: true,
      showEndCap: true,
      showStartLabel: true,
    }];
  });

  const collisionRanges = [
    ...baseSegments.map(({ start, end }) => ({ start, end })),
    ...blockers,
  ].flatMap(toClockRanges);
  const nowClock = clockMilliseconds(dayTimestamp);

  const carryoverSegments = events.flatMap<RoutineOrbitSleepSegment>((event) => {
    if ((event.type !== 'sono' && event.type !== 'dormir') || event.end <= event.start) return [];
    const isCarryover = event.start < dayStart
      && event.end > dayStart
      && event.start >= previousDayStart
      && event.end - event.start < dayMs;
    if (!isCarryover) return [];

    const startClock = clockMilliseconds(event.start);
    const endClock = Math.min(dayMs, clockMilliseconds(event.end));
    let eveningCutoff = firstCollisionAt(startClock, dayMs, collisionRanges);

    // Quando o dia atual alcança novamente o horário em que o sono começou ontem,
    // a cauda futura da volta anterior é ocultada progressivamente. O trecho já
    // percorrido continua visível, assim como a parte real entre 00:00 e o término.
    if (nowClock >= startClock) eveningCutoff = Math.min(eveningCutoff, nowClock);

    const segments: RoutineOrbitSleepSegment[] = [];
    if (eveningCutoff > startClock) {
      segments.push({
        event,
        start: event.start,
        end: timestampAtClock(previousDayStart, eveningCutoff),
        carriedFromPreviousDay: true,
        orbitKey: `${event.id}:carry:evening:${eveningCutoff}`,
        showStartCap: true,
        showEndCap: false,
        showStartLabel: true,
      });
    }

    const morningCutoff = firstCollisionAt(0, endClock, collisionRanges);
    if (morningCutoff > 0) {
      segments.push({
        event,
        start: dayStart,
        end: timestampAtClock(dayStart, morningCutoff),
        carriedFromPreviousDay: true,
        orbitKey: `${event.id}:carry:morning:${morningCutoff}`,
        showStartCap: false,
        showEndCap: morningCutoff >= endClock,
        showStartLabel: false,
      });
    }
    return segments;
  });

  return [...carryoverSegments, ...baseSegments].sort((left, right) => left.start - right.start || left.end - right.end);
}

export function getRoutineEventsForLocalDay(events: RoutineEvent[], dayTimestamp = Date.now()) {
  const { dayStart, dayEnd } = getRoutineLocalDayBounds(dayTimestamp);

  return events.filter((event) => {
    if (getRoutineSleepSegmentForLocalDay(event, dayTimestamp)) return true;
    const timestamp = getRoutineEventOrbitTimestamp(event);
    return timestamp >= dayStart && timestamp < dayEnd;
  });
}

export function getRoutineMarkerEventsForLocalDay(events: RoutineEvent[], dayTimestamp = Date.now()) {
  const { dayStart, dayEnd } = getRoutineLocalDayBounds(dayTimestamp);
  return getRoutineEventsForLocalDay(events, dayTimestamp).filter((event) => event.start >= dayStart && event.start < dayEnd);
}

export function getRoutineClockMinutes(timestamp: number) {
  const date = new Date(timestamp);
  return date.getHours() * 60 + date.getMinutes() + date.getSeconds() / 60;
}

export function getRoutineCircularMinuteDistance(left: number, right: number) {
  const distance = Math.abs(left - right);
  return Math.min(distance, 1440 - distance);
}

export function getRoutineMarkerCollisionWindowMinutes(orbitRadius: number) {
  const circumference = Math.max(1, 2 * Math.PI * orbitRadius);
  return Math.max(18, Math.min(82, (48 / circumference) * 1440));
}

function sortRoutineMarkerGroupCircularly(group: RoutineEvent[]) {
  const sorted = [...group].sort((left, right) => getRoutineClockMinutes(getRoutineEventOrbitTimestamp(left)) - getRoutineClockMinutes(getRoutineEventOrbitTimestamp(right)));
  if (sorted.length < 2) return sorted;
  let largestGap = -1;
  let rotateAt = 0;
  sorted.forEach((event, index) => {
    const current = getRoutineClockMinutes(getRoutineEventOrbitTimestamp(event));
    const next = index === sorted.length - 1
      ? getRoutineClockMinutes(getRoutineEventOrbitTimestamp(sorted[0])) + 1440
      : getRoutineClockMinutes(getRoutineEventOrbitTimestamp(sorted[index + 1]));
    const gap = next - current;
    if (gap > largestGap) {
      largestGap = gap;
      rotateAt = (index + 1) % sorted.length;
    }
  });
  return [...sorted.slice(rotateAt), ...sorted.slice(0, rotateAt)];
}

export function groupRoutineMarkerEvents(events: RoutineEvent[], thresholdMinutes: number) {
  const threshold = Math.max(1, thresholdMinutes);
  const sorted = [...events].sort((left, right) => getRoutineClockMinutes(getRoutineEventOrbitTimestamp(left)) - getRoutineClockMinutes(getRoutineEventOrbitTimestamp(right)));
  const groups = sorted.reduce<RoutineEvent[][]>((result, event) => {
    const current = result[result.length - 1];
    const eventMinutes = getRoutineClockMinutes(getRoutineEventOrbitTimestamp(event));
    const firstMinutes = current?.length ? getRoutineClockMinutes(getRoutineEventOrbitTimestamp(current[0])) : null;
    // Evita agrupamento em cadeia: todos os itens do grupo precisam caber na mesma janela visual.
    if (current && firstMinutes !== null && eventMinutes - firstMinutes <= threshold) current.push(event);
    else result.push([event]);
    return result;
  }, []);
  if (groups.length > 1) {
    const first = groups[0];
    const last = groups[groups.length - 1];
    const firstEndMinutes = getRoutineClockMinutes(getRoutineEventOrbitTimestamp(first[first.length - 1]));
    const lastStartMinutes = getRoutineClockMinutes(getRoutineEventOrbitTimestamp(last[0]));
    const circularSpan = (1440 - lastStartMinutes) + firstEndMinutes;
    if (circularSpan <= threshold) {
      groups[0] = [...last, ...first];
      groups.pop();
    }
  }
  return groups.map(sortRoutineMarkerGroupCircularly);
}

export function getRoutineMarkerGroupTimestamp(group: RoutineEvent[], referenceTimestamp: number) {
  if (!group.length) return referenceTimestamp;
  const vectors = group.map((event) => {
    const angle = (getRoutineClockMinutes(getRoutineEventOrbitTimestamp(event)) / 1440) * Math.PI * 2;
    return { x: Math.cos(angle), y: Math.sin(angle) };
  });
  const angle = Math.atan2(vectors.reduce((sum, vector) => sum + vector.y, 0), vectors.reduce((sum, vector) => sum + vector.x, 0));
  const normalized = angle < 0 ? angle + Math.PI * 2 : angle;
  const minutes = (normalized / (Math.PI * 2)) * 1440;
  const date = new Date(referenceTimestamp);
  date.setHours(Math.floor(minutes / 60), Math.floor(minutes % 60), 0, 0);
  return date.getTime();
}
