export type RoutineMode = 'idle' | 'awake' | 'sleeping';
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
  createdAtClient: number;
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
  lastWakeWindowStartedAt: number | null;
  lastWakeWindowMs: number | null;
  routineStateUpdatedAt: number;
  routineStateMutationId: string;
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
    lastWakeWindowStartedAt: null,
    lastWakeWindowMs: null,
    routineStateUpdatedAt: 0,
    routineStateMutationId: '',
    events: [],
    dayNotes: '',
    dayNotesUpdatedAt: 0,
    noteEpisodes: [],
    deletedEventIds: [],
    deletedNoteEpisodeIds: [],
  };
}

export function makeEvent(type: RecordType, start: number, end = start, detail = '', notes = '', amountMl?: number): RoutineEvent {
  return {
    id: `${type}-${Math.round(start)}-${Math.random().toString(36).slice(2, 8)}`,
    type,
    start,
    end,
    detail,
    notes,
    ...(Number.isFinite(amountMl) ? { amountMl } : {}),
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
  return {
    id: typeof event.id === 'string' && event.id ? event.id : `${event.type}-${start}`,
    type: event.type,
    start: start as number,
    end: Number.isFinite(endValue) ? endValue as number : start as number,
    detail,
    notes: typeof event.notes === 'string' ? event.notes : '',
    ...(Number.isFinite(amountMl) ? { amountMl } : {}),
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

export function mergeDayStates(localValue: Partial<DayState>, cloudValue: Partial<DayState>) {
  const local = normalizeDayState(localValue);
  const cloud = normalizeDayState(cloudValue);
  const latestLive = compareLiveState(local, cloud) >= 0 ? local : cloud;
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
    lastWakeWindowStartedAt: latestLive.lastWakeWindowStartedAt,
    lastWakeWindowMs: latestLive.lastWakeWindowMs,
    routineStateUpdatedAt: latestLive.routineStateUpdatedAt,
    routineStateMutationId: latestLive.routineStateMutationId,
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

export function startRoutine(state: DayState, mode: Exclude<RoutineMode, 'idle'>, now = Date.now()): DayState {
  return stamp({
    ...state,
    mode,
    activeStartedAt: now,
    activeType: mode === 'sleeping' ? 'sono' : 'acordou',
    activeDetail: mode === 'sleeping' ? 'Timer' : '',
    activeNotes: '',
    events: mode === 'awake'
      ? [...state.events, makeEvent('acordou', now, now, 'Rotina iniciada agora')]
      : state.events,
  }, now, `start-${mode}`);
}

export function startSleep(state: DayState, type: 'sono' | 'dormir', now = Date.now()): DayState {
  const awakeStart = state.mode === 'awake' ? state.activeStartedAt : null;
  return stamp({
    ...state,
    mode: 'sleeping',
    activeStartedAt: now,
    activeType: type,
    activeDetail: type === 'dormir' ? 'Sono noturno' : 'Timer',
    activeNotes: '',
    lastWakeWindowStartedAt: awakeStart,
    lastWakeWindowMs: awakeStart ? Math.max(0, now - awakeStart) : null,
  }, now, `start-${type}`);
}

export function finishSleep(state: DayState, now = Date.now()): DayState {
  if (state.mode !== 'sleeping' || !state.activeStartedAt) return state;
  const isNight = state.activeType === 'dormir' || isNightPeriod(now);
  const wakeType: RecordType = isNight ? 'despertar-noturno' : 'acordou';
  return stamp({
    ...state,
    mode: 'awake',
    activeStartedAt: now,
    activeType: wakeType,
    activeDetail: '',
    activeNotes: '',
    events: [
      ...state.events,
      makeEvent(state.activeType === 'dormir' ? 'dormir' : 'sono', state.activeStartedAt, now, state.activeDetail || 'Timer', state.activeNotes),
      makeEvent(wakeType, now, now, isNight ? 'Despertar noturno' : 'Após soneca'),
    ],
  }, now, `finish-${state.activeType}`);
}

export function addRoutineRecord(state: DayState, input: { type: RecordType; detail?: string; notes?: string; amountMl?: number; start?: number; end?: number }, now = Date.now()): DayState {
  const { type, detail = '', notes = '', amountMl } = input;
  const customStart = Number(input.start);
  const customEnd = Number(input.end);
  if (Number.isFinite(customStart)) {
    const end = Number.isFinite(customEnd) ? Math.max(customStart, customEnd) : customStart;
    return stamp({ ...state, events: [...state.events, makeEvent(type, customStart, end, detail, notes, amountMl)] }, now, `record-${type}`);
  }
  if (type === 'sono' || type === 'dormir') return startSleep(state, type, now);
  if (type === 'acordou' || type === 'despertar-noturno') {
    if (state.mode === 'sleeping') return finishSleep(state, now);
    const base = state;
    return stamp({
      ...base,
      mode: 'awake',
      activeStartedAt: now,
      activeType: type,
      activeDetail: '',
      activeNotes: '',
      events: [...base.events, makeEvent(type, now, now, detail, notes)],
    }, now, `record-${type}`);
  }
  const durableDetail = type === 'mamadeira' && Number.isFinite(amountMl)
    ? [detail, `${amountMl} ml`].filter(Boolean).join(' • ')
    : detail;
  return stamp({ ...state, events: [...state.events, makeEvent(type, now, now, durableDetail, notes, amountMl)] }, now, `record-${type}`);
}

export function updateRoutineEvent(state: DayState, eventId: string, patch: Partial<Pick<RoutineEvent, 'type' | 'start' | 'end' | 'detail' | 'notes' | 'amountMl'>>, now = Date.now()) {
  return stamp({
    ...state,
    events: state.events.map((event) => event.id === eventId ? normalizeRoutineEvent({ ...event, ...patch }) || event : event),
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
    deletedEventIds: [...new Set([...state.deletedEventIds, ...state.events.map((event) => event.id)])],
    deletedNoteEpisodeIds: [...new Set([...state.deletedNoteEpisodeIds, ...state.noteEpisodes.map((episode) => episode.id)])],
    dayNotesUpdatedAt: now,
  }, now, 'clear-day');
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
  const events = state.events;
  const sleepMs = events.filter((event) => event.type === 'sono' || event.type === 'dormir')
    .reduce((total, event) => total + Math.max(0, event.end - event.start), 0)
    + (state.mode === 'sleeping' && state.activeStartedAt ? Math.max(0, now - state.activeStartedAt) : 0);
  return {
    sleepMs,
    feeding: events.filter((event) => event.type === 'amamentacao' || event.type === 'mamadeira').length,
    diapers: events.filter((event) => event.type === 'fralda').length,
    medicine: events.filter((event) => event.type === 'medicamento').length,
  };
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
