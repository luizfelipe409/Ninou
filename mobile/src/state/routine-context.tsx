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
  startRoutine,
  startSleep,
  deleteDayNoteEpisode,
  deleteRoutineEvent,
  saveDayNotes,
  updateRoutineEvent,
  type DayState,
  type DayNoteEpisode,
  type RoutineEvent,
  type RecordType,
} from '@/domain/routine';
import { getFirebaseErrorMessage, getLocalDateId, loadRoutineDays, observeRoutineDay, saveRoutineDay } from '@/services/firebase';
import { useNinouAuth } from '@/state/auth-context';

const STORAGE_KEY_PREFIX = 'ninou.mobile.day-state.v2';

export type RoutineSyncStatus = 'local' | 'connecting' | 'saving' | 'synced' | 'pending' | 'error';

type RoutineContextValue = {
  state: DayState;
  history: Record<string, DayState>;
  now: number;
  hydrated: boolean;
  syncStatus: RoutineSyncStatus;
  syncMessage: string;
  beginRoutine: (mode: 'awake' | 'sleeping') => void;
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
  const [state, setState] = useState(createEmptyDayState);
  const [history, setHistory] = useState<Record<string, DayState>>({});
  const stateRef = useRef(state);
  const [hydrated, setHydrated] = useState(false);
  const [now, setNow] = useState(0);
  const [syncStatus, setSyncStatus] = useState<RoutineSyncStatus>('local');
  const [syncMessage, setSyncMessage] = useState('Salvo neste aparelho');
  const saveQueueRef = useRef<Promise<void>>(Promise.resolve());
  const undoStateRef = useRef<DayState | null>(null);
  const dayId = getLocalDateId();
  const storageScope = access?.familyId || (user ? `account-${user.uid}` : 'guest');
  const storageKey = `${STORAGE_KEY_PREFIX}.${storageScope}.${dayId}`;

  useEffect(() => {
    if (authStatus === 'loading' || authStatus === 'resolving-family') return;
    let mounted = true;
    const unsubscribes: (() => void)[] = [];
    AsyncStorage.getItem(storageKey)
      .then((raw) => {
        if (!mounted) return;
        setSyncStatus(access ? 'connecting' : 'local');
        setSyncMessage(access ? 'Conectando à família…' : 'Salvo neste aparelho');
        const localState = raw ? normalizeDayState(JSON.parse(raw)) : createEmptyDayState();
        stateRef.current = localState;
        setState(localState);
        setHistory({ [dayId]: localState });
        if (access) {
          void loadRoutineDays(access.familyId).then((cloudHistory) => {
            if (!mounted) return;
            setHistory((current) => ({ ...cloudHistory, ...current }));
          }).catch(() => undefined);
          const recentDayIds = Array.from({ length: 7 }, (_, index) => getLocalDateId(Date.now() - index * 86400000));
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
                setHistory((current) => ({ ...current, [recentDayId]: cloudState }));
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
      .finally(() => { if (mounted) setHydrated(true); });
    return () => { mounted = false; unsubscribes.forEach((unsubscribe) => unsubscribe()); };
  }, [access, authStatus, dayId, storageKey]);

  useEffect(() => {
    const initialTimer = setTimeout(() => setNow(Date.now()), 0);
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => { clearTimeout(initialTimer); clearInterval(timer); };
  }, []);

  useEffect(() => {
    if (hydrated) void AsyncStorage.setItem(storageKey, JSON.stringify(state));
  }, [hydrated, state, storageKey]);

  const commit = useCallback((buildNext: (current: DayState, at: number) => DayState) => {
    const at = Date.now();
    undoStateRef.current = stateRef.current;
    const next = buildNext(stateRef.current, at);
    setNow(at);
    stateRef.current = next;
    setState(next);
    setHistory((current) => ({ ...current, [dayId]: next }));
    void AsyncStorage.setItem(storageKey, JSON.stringify(next));
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
  }, [access, dayId, storageKey, user]);

  const saveDay = useCallback((targetDayId: string, next: DayState) => {
    setHistory((current) => ({ ...current, [targetDayId]: next }));
    const targetStorageKey = `${STORAGE_KEY_PREFIX}.${storageScope}.${targetDayId}`;
    void AsyncStorage.setItem(targetStorageKey, JSON.stringify(next));
    if (targetDayId === dayId) { stateRef.current = next; setState(next); }
    if (user && access) {
      setSyncStatus('saving');
      setSyncMessage('Enviando atualização…');
      const saveTask = saveQueueRef.current.catch(() => undefined).then(() => saveRoutineDay({ familyId: access.familyId, dayId: targetDayId, state: next, user }));
      saveQueueRef.current = saveTask;
      void saveTask.then(() => { setSyncStatus('synced'); setSyncMessage('Sincronizado com a família'); }).catch((error) => { setSyncStatus('pending'); setSyncMessage(getFirebaseErrorMessage(error)); });
    }
  }, [access, dayId, storageScope, user]);

  const commitDay = useCallback((targetDayId: string, buildNext: (current: DayState, at: number) => DayState) => {
    const current = targetDayId === dayId ? stateRef.current : history[targetDayId] || createEmptyDayState();
    saveDay(targetDayId, buildNext(current, Date.now()));
  }, [dayId, history, saveDay]);

  const beginRoutine = useCallback((mode: 'awake' | 'sleeping') => {
    commit((current, at) => startRoutine(current, mode, at));
  }, [commit]);

  const runPrimaryAction = useCallback(() => {
    commit((current, at) => {
      if (current.mode === 'sleeping') return finishSleep(current, at);
      if (current.mode === 'awake') return startSleep(current, isNightPeriod(at) ? 'dormir' : 'sono', at);
      return current;
    });
  }, [commit]);

  const addRecord = useCallback((input: { type: RecordType; detail?: string; notes?: string; amountMl?: number; start?: number; end?: number }) => {
    const targetDayId = Number.isFinite(Number(input.start)) ? getLocalDateId(Number(input.start)) : dayId;
    if (targetDayId === dayId) commit((current, at) => addRoutineRecord(current, input, at));
    else commitDay(targetDayId, (current, at) => addRoutineRecord(current, input, at));
  }, [commit, commitDay, dayId]);

  const updateEvent = useCallback((targetDayId: string, eventId: string, patch: Partial<Pick<RoutineEvent, 'type' | 'start' | 'end' | 'detail' | 'notes' | 'amountMl'>>) => commitDay(targetDayId, (current, at) => updateRoutineEvent(current, eventId, patch, at)), [commitDay]);
  const deleteEvent = useCallback((targetDayId: string, eventId: string) => commitDay(targetDayId, (current, at) => deleteRoutineEvent(current, eventId, at)), [commitDay]);
  const updateDayNotes = useCallback((targetDayId: string, notes: string) => commitDay(targetDayId, (current, at) => saveDayNotes(current, notes, at)), [commitDay]);
  const addNoteEpisodeToDay = useCallback((targetDayId: string, input: Omit<DayNoteEpisode, 'id'>) => commitDay(targetDayId, (current, at) => addDayNoteEpisode(current, input, at)), [commitDay]);
  const deleteNoteEpisodeFromDay = useCallback((targetDayId: string, episodeId: string) => commitDay(targetDayId, (current, at) => deleteDayNoteEpisode(current, episodeId, at)), [commitDay]);
  const undoLastAction = useCallback(() => {
    if (!undoStateRef.current) return;
    const previous = undoStateRef.current;
    undoStateRef.current = stateRef.current;
    saveDay(dayId, previous);
  }, [dayId, saveDay]);
  const resetDay = useCallback((targetDayId: string) => commitDay(targetDayId, (current, at) => clearRoutineDay(current, at)), [commitDay]);

  const value = useMemo(() => ({ state, history, now, hydrated, syncStatus, syncMessage, beginRoutine, runPrimaryAction, addRecord, updateEvent, deleteEvent, updateDayNotes, addNoteEpisode: addNoteEpisodeToDay, deleteNoteEpisode: deleteNoteEpisodeFromDay, undoLastAction, resetDay }), [state, history, now, hydrated, syncStatus, syncMessage, beginRoutine, runPrimaryAction, addRecord, updateEvent, deleteEvent, updateDayNotes, addNoteEpisodeToDay, deleteNoteEpisodeFromDay, undoLastAction, resetDay]);
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
