import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, type PropsWithChildren, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import {
  addRoutineRecord,
  addDayNoteEpisode,
  createEmptyDayState,
  clearRoutineDay,
  finishSleep,
  getPrimaryAction,
  isNightPeriod,
  mergeDayStates,
  normalizeDayState,
  restoreRoutineSnapshot,
  startRoutineAt,
  startSleep,
  deleteDayNoteEpisode,
  deleteRoutineEvent,
  saveDayNotes,
  updateRoutineEvent,
  type DayState,
  type DayNoteEpisode,
  type RoutineEvent,
  type RecordType,
  type RoutineActor,
} from '@/domain/routine';
import { getFirebaseErrorMessage, getLocalDateId, loadRoutineDays, observeRoutineDay, saveRoutineDay } from '@/services/firebase';
import { canWriteFamilyRoutine } from '@/domain/family-access';
import { useNinouAuth } from '@/state/auth-context';
import { useFamilyPreferences } from '@/state/preferences-context';

const STORAGE_KEY_PREFIX = 'ninou.mobile.day-state.v2';
const LIVE_STATE_KEY_PREFIX = 'ninou.mobile.live-state.v1';

export type RoutineSyncStatus = 'local' | 'connecting' | 'saving' | 'synced' | 'pending' | 'error';

function getRecentLocalDayIds(reference = Date.now(), count = 7) {
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(reference);
    date.setHours(12, 0, 0, 0);
    date.setDate(date.getDate() - index);
    return getLocalDateId(date.getTime());
  });
}

function liveStateVersion(state: DayState) {
  return Math.max(state.routineStateUpdatedAt || 0, state.activeStartedAt || 0);
}

function applyLiveRoutineSnapshot(current: DayState, snapshot: DayState) {
  if (liveStateVersion(snapshot) <= liveStateVersion(current)) return current;
  return normalizeDayState({
    ...current,
    mode: snapshot.mode,
    activeStartedAt: snapshot.activeStartedAt,
    activeType: snapshot.activeType,
    activeDetail: snapshot.activeDetail,
    activeNotes: snapshot.activeNotes,
    activeActor: snapshot.activeActor,
    lastWakeWindowStartedAt: snapshot.lastWakeWindowStartedAt,
    lastWakeWindowMs: snapshot.lastWakeWindowMs,
    routineStateUpdatedAt: snapshot.routineStateUpdatedAt,
    routineStateMutationId: snapshot.routineStateMutationId,
  });
}

type RoutineContextValue = {
  state: DayState;
  history: Record<string, DayState>;
  now: number;
  hydrated: boolean;
  syncStatus: RoutineSyncStatus;
  syncMessage: string;
  canUndo: boolean;
  canWrite: boolean;
  beginRoutine: (mode: 'awake' | 'sleeping', startedAt?: number) => void;
  runPrimaryAction: () => void;
  addRecord: (input: { type: RecordType; detail?: string; notes?: string; amountMl?: number; start?: number; end?: number }) => void;
  updateEvent: (dayId: string, eventId: string, patch: Partial<Pick<RoutineEvent, 'type' | 'start' | 'end' | 'detail' | 'notes' | 'amountMl'>>) => void;
  deleteEvent: (dayId: string, eventId: string) => void;
  updateDayNotes: (dayId: string, notes: string) => void;
  addNoteEpisode: (dayId: string, input: Omit<DayNoteEpisode, 'id'>) => void;
  deleteNoteEpisode: (dayId: string, episodeId: string) => void;
  undoLastAction: () => void;
  resetDay: (dayId: string) => void;
};

const RoutineContext = createContext<RoutineContextValue | null>(null);

export function RoutineProvider({ children }: PropsWithChildren) {
  const { user, access, status: authStatus } = useNinouAuth();
  const { preferences } = useFamilyPreferences();
  const [state, setState] = useState(createEmptyDayState);
  const [history, setHistory] = useState<Record<string, DayState>>({});
  const stateRef = useRef(state);
  const [hydrated, setHydrated] = useState(false);
  const [now, setNow] = useState(0);
  const [syncStatus, setSyncStatus] = useState<RoutineSyncStatus>('local');
  const [syncMessage, setSyncMessage] = useState('Salvo neste aparelho');
  const [canUndo, setCanUndo] = useState(false);
  const saveQueueRef = useRef<Promise<void>>(Promise.resolve());
  const undoStateRef = useRef<DayState | null>(null);
  const hydratedStorageKeyRef = useRef('');
  const dayId = getLocalDateId();
  const storageScope = access?.familyId || (user ? `account-${user.uid}` : 'guest');
  const storageKey = `${STORAGE_KEY_PREFIX}.${storageScope}.${dayId}`;
  const undoStorageKey = `${storageKey}.undo`;
  const liveStorageKey = `${LIVE_STATE_KEY_PREFIX}.${storageScope}`;
  const canWrite = !access || canWriteFamilyRoutine(access.role);
  const routineActor = useMemo<RoutineActor>(() => {
    const email = user?.email || access?.email || '';
    const name = preferences.caregiverName.trim() || email.split('@')[0] || 'Responsável';
    const relationship = preferences.caregiverRelation.trim();
    return {
      uid: user?.uid || '',
      email,
      name,
      relationship,
      label: [name, relationship].filter(Boolean).join(' · '),
    };
  }, [access?.email, preferences.caregiverName, preferences.caregiverRelation, user?.email, user?.uid]);

  useEffect(() => {
    if (authStatus === 'loading' || authStatus === 'resolving-family') return;
    let mounted = true;
    const unsubscribes: (() => void)[] = [];
    const recentDayIds = getRecentLocalDayIds(Date.now(), 7);
    const recentStorageKeys = recentDayIds.map((recentDayId) => `${STORAGE_KEY_PREFIX}.${storageScope}.${recentDayId}`);
    hydratedStorageKeyRef.current = '';

    AsyncStorage.multiGet([...recentStorageKeys, undoStorageKey, liveStorageKey])
      .then((entries) => {
        if (!mounted) return;
        const localHistory: Record<string, DayState> = {};
        recentDayIds.forEach((recentDayId, index) => {
          const raw = entries[index]?.[1];
          if (raw) localHistory[recentDayId] = normalizeDayState(JSON.parse(raw));
        });
        const undoRaw = entries[recentStorageKeys.length]?.[1];
        const liveRaw = entries[recentStorageKeys.length + 1]?.[1];
        setSyncStatus(access ? 'connecting' : 'local');
        setSyncMessage(access ? 'Conectando à família…' : 'Salvo neste aparelho');
        undoStateRef.current = undoRaw ? normalizeDayState(JSON.parse(undoRaw)) : null;
        setCanUndo(Boolean(undoStateRef.current));

        let localState = localHistory[dayId] || createEmptyDayState();
        if (liveRaw) localState = applyLiveRoutineSnapshot(localState, normalizeDayState(JSON.parse(liveRaw)));
        localHistory[dayId] = localState;
        stateRef.current = localState;
        setState(localState);
        setHistory(localHistory);

        if (access) {
          void loadRoutineDays(access.familyId).then((cloudHistory) => {
            if (!mounted) return;
            setHistory((current) => {
              const merged = { ...current };
              Object.entries(cloudHistory).forEach(([cloudDayId, cloudState]) => {
                merged[cloudDayId] = mergeDayStates(merged[cloudDayId] || createEmptyDayState(), cloudState);
              });
              return merged;
            });
            let currentWithCloud = cloudHistory[dayId]
              ? mergeDayStates(stateRef.current, cloudHistory[dayId])
              : stateRef.current;
            Object.entries(cloudHistory).forEach(([cloudDayId, cloudState]) => {
              if (cloudDayId === dayId || (cloudState.mode !== 'idle' && cloudState.activeStartedAt)) {
                currentWithCloud = applyLiveRoutineSnapshot(currentWithCloud, cloudState);
              }
            });
            stateRef.current = currentWithCloud;
            setState(currentWithCloud);
            setHistory((current) => ({ ...current, [dayId]: currentWithCloud }));
          }).catch(() => undefined);

          recentDayIds.forEach((recentDayId) => {
            const unsubscribe = observeRoutineDay(access.familyId, recentDayId, (cloudState) => {
              if (!mounted) return;
              if (recentDayId === dayId) {
                const merged = mergeDayStates(stateRef.current, cloudState);
                stateRef.current = merged;
                setState(merged);
                setHistory((current) => ({ ...current, [recentDayId]: merged }));
                setSyncStatus('synced');
                setSyncMessage('Sincronizado com a família');
              } else {
                setHistory((current) => ({
                  ...current,
                  [recentDayId]: mergeDayStates(current[recentDayId] || createEmptyDayState(), cloudState),
                }));
                const withLiveSnapshot = cloudState.mode !== 'idle' && cloudState.activeStartedAt
                  ? applyLiveRoutineSnapshot(stateRef.current, cloudState)
                  : stateRef.current;
                if (withLiveSnapshot !== stateRef.current) {
                  stateRef.current = withLiveSnapshot;
                  setState(withLiveSnapshot);
                  setHistory((current) => ({ ...current, [dayId]: withLiveSnapshot }));
                }
              }
            }, (cloudError) => {
              if (!mounted || recentDayId !== dayId) return;
              setSyncStatus('error');
              setSyncMessage(getFirebaseErrorMessage(cloudError));
            });
            unsubscribes.push(unsubscribe);
          });
        }
      })
      .catch((loadError) => {
        if (mounted) {
          const empty = createEmptyDayState();
          stateRef.current = empty;
          setState(empty);
          setSyncStatus('error');
          setSyncMessage(getFirebaseErrorMessage(loadError));
        }
      })
      .finally(() => {
        if (mounted) {
          hydratedStorageKeyRef.current = storageKey;
          setHydrated(true);
        }
      });
    return () => { mounted = false; unsubscribes.forEach((unsubscribe) => unsubscribe()); };
  }, [access, authStatus, dayId, liveStorageKey, storageKey, storageScope, undoStorageKey]);

  useEffect(() => {
    const initialTimer = setTimeout(() => setNow(Date.now()), 0);
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => { clearTimeout(initialTimer); clearInterval(timer); };
  }, []);

  useEffect(() => {
    if (hydrated && hydratedStorageKeyRef.current === storageKey) {
      void AsyncStorage.multiSet([[storageKey, JSON.stringify(state)], [liveStorageKey, JSON.stringify(state)]]);
    }
  }, [hydrated, liveStorageKey, state, storageKey]);

  const commit = useCallback((buildNext: (current: DayState, at: number) => DayState) => {
    if (!canWrite) return;
    const at = Date.now();
    undoStateRef.current = stateRef.current;
    setCanUndo(true);
    void AsyncStorage.setItem(undoStorageKey, JSON.stringify(stateRef.current));
    const next = buildNext(stateRef.current, at);
    setNow(at);
    stateRef.current = next;
    setState(next);
    setHistory((current) => ({ ...current, [dayId]: next }));
    void AsyncStorage.multiSet([[storageKey, JSON.stringify(next)], [liveStorageKey, JSON.stringify(next)]]);
    if (user && access) {
      setSyncStatus('saving');
      setSyncMessage('Enviando atualização…');
      const saveTask = saveQueueRef.current
        .catch(() => undefined)
        .then(() => saveRoutineDay({ familyId: access.familyId, dayId, state: next, user }));
      saveQueueRef.current = saveTask;
      void saveTask
        .then(() => {
          if (saveQueueRef.current === saveTask) {
            setSyncStatus('synced');
            setSyncMessage('Sincronizado com a família');
          }
        })
        .catch((saveError) => {
          if (saveQueueRef.current === saveTask) {
            setSyncStatus('pending');
            setSyncMessage(`${getFirebaseErrorMessage(saveError)} O registro continua salvo neste aparelho.`);
          }
        });
    } else {
      setSyncStatus('local');
      setSyncMessage('Salvo neste aparelho');
    }
  }, [access, canWrite, dayId, liveStorageKey, storageKey, undoStorageKey, user]);

  const saveDay = useCallback((targetDayId: string, next: DayState) => {
    setHistory((current) => ({ ...current, [targetDayId]: next }));
    const targetStorageKey = `${STORAGE_KEY_PREFIX}.${storageScope}.${targetDayId}`;
    void AsyncStorage.setItem(targetStorageKey, JSON.stringify(next));
    if (targetDayId === dayId) {
      stateRef.current = next;
      setState(next);
      void AsyncStorage.setItem(liveStorageKey, JSON.stringify(next));
    }
    if (user && access) {
      setSyncStatus('saving');
      setSyncMessage('Enviando atualização…');
      const saveTask = saveQueueRef.current.catch(() => undefined).then(() => saveRoutineDay({ familyId: access.familyId, dayId: targetDayId, state: next, user }));
      saveQueueRef.current = saveTask;
      void saveTask.then(() => { setSyncStatus('synced'); setSyncMessage('Sincronizado com a família'); }).catch((error) => { setSyncStatus('pending'); setSyncMessage(getFirebaseErrorMessage(error)); });
    }
  }, [access, dayId, liveStorageKey, storageScope, user]);

  const commitDay = useCallback((targetDayId: string, buildNext: (current: DayState, at: number) => DayState) => {
    if (!canWrite) return;
    const current = targetDayId === dayId ? stateRef.current : history[targetDayId] || createEmptyDayState();
    saveDay(targetDayId, buildNext(current, Date.now()));
  }, [canWrite, dayId, history, saveDay]);

  const beginRoutine = useCallback((mode: 'awake' | 'sleeping', startedAt = Date.now()) => {
    commit((current, at) => startRoutineAt(current, mode, startedAt, at, routineActor));
  }, [commit, routineActor]);

  const runPrimaryAction = useCallback(() => {
    commit((current, at) => {
      if (current.mode === 'sleeping') return finishSleep(current, at, routineActor);
      if (current.mode === 'awake') return startSleep(current, isNightPeriod(at) ? 'dormir' : 'sono', at, routineActor);
      return current;
    });
  }, [commit, routineActor]);

  const addRecord = useCallback((input: { type: RecordType; detail?: string; notes?: string; amountMl?: number; start?: number; end?: number }) => {
    const isOpenSleep = (input.type === 'sono' || input.type === 'dormir')
      && Number.isFinite(Number(input.start))
      && !Number.isFinite(Number(input.end));
    const targetDayId = isOpenSleep ? dayId : Number.isFinite(Number(input.start)) ? getLocalDateId(Number(input.start)) : dayId;
    if (targetDayId === dayId) commit((current, at) => addRoutineRecord(current, input, at, routineActor));
    else commitDay(targetDayId, (current, at) => addRoutineRecord(current, input, at, routineActor));
  }, [commit, commitDay, dayId, routineActor]);

  const updateEvent = useCallback((targetDayId: string, eventId: string, patch: Partial<Pick<RoutineEvent, 'type' | 'start' | 'end' | 'detail' | 'notes' | 'amountMl'>>) => commitDay(targetDayId, (current, at) => updateRoutineEvent(current, eventId, patch, at, routineActor)), [commitDay, routineActor]);
  const deleteEvent = useCallback((targetDayId: string, eventId: string) => commitDay(targetDayId, (current, at) => deleteRoutineEvent(current, eventId, at)), [commitDay]);
  const updateDayNotes = useCallback((targetDayId: string, notes: string) => commitDay(targetDayId, (current, at) => saveDayNotes(current, notes, at)), [commitDay]);
  const addNoteEpisodeToDay = useCallback((targetDayId: string, input: Omit<DayNoteEpisode, 'id'>) => commitDay(targetDayId, (current, at) => addDayNoteEpisode(current, input, at)), [commitDay]);
  const deleteNoteEpisodeFromDay = useCallback((targetDayId: string, episodeId: string) => commitDay(targetDayId, (current, at) => deleteDayNoteEpisode(current, episodeId, at)), [commitDay]);
  const undoLastAction = useCallback(() => {
    if (!undoStateRef.current) return;
    const previous = undoStateRef.current;
    undoStateRef.current = null;
    setCanUndo(false);
    void AsyncStorage.removeItem(undoStorageKey);
    saveDay(dayId, restoreRoutineSnapshot(stateRef.current, previous, Date.now()));
  }, [dayId, saveDay, undoStorageKey]);
  const resetDay = useCallback((targetDayId: string) => commitDay(targetDayId, (current, at) => clearRoutineDay(current, at)), [commitDay]);

  const value = useMemo(() => ({ state, history, now, hydrated, syncStatus, syncMessage, canUndo, canWrite, beginRoutine, runPrimaryAction, addRecord, updateEvent, deleteEvent, updateDayNotes, addNoteEpisode: addNoteEpisodeToDay, deleteNoteEpisode: deleteNoteEpisodeFromDay, undoLastAction, resetDay }), [state, history, now, hydrated, syncStatus, syncMessage, canUndo, canWrite, beginRoutine, runPrimaryAction, addRecord, updateEvent, deleteEvent, updateDayNotes, addNoteEpisodeToDay, deleteNoteEpisodeFromDay, undoLastAction, resetDay]);
  return <RoutineContext.Provider value={value}>{children}</RoutineContext.Provider>;
}

export function useRoutine() {
  const context = useContext(RoutineContext);
  if (!context) throw new Error('useRoutine deve ser usado dentro de RoutineProvider');
  return context;
}

export function usePrimaryRoutineAction() {
  const { state, now } = useRoutine();
  return getPrimaryAction(state, now);
}
