import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, type PropsWithChildren, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { observeBabyProfile, saveBabyProfile } from '@/services/firebase';
import { useNinouAuth } from '@/state/auth-context';
import { normalizeAvatarId, type AvatarId } from '@/domain/avatar';

export type BabyProfile = {
  name: string;
  birthDate: string;
  wakeWindowMinutes: number;
  avatarId: AvatarId;
  article: 'do' | 'da';
  weights: WeightEntry[];
};

export type WeightEntry = { id: string; date: string; value: number };

function normalizeWeights(value: unknown): WeightEntry[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== 'object') return [];
    const source = item as { id?: unknown; date?: unknown; value?: unknown; weight?: unknown };
    const rawValue = Number(String(source.value ?? source.weight ?? '').replace(',', '.'));
    const weight = rawValue > 40 ? rawValue / 1000 : rawValue;
    const date = typeof source.date === 'string' ? source.date : '';
    if (!date || !Number.isFinite(weight) || weight <= 0 || weight > 30) return [];
    return [{ id: typeof source.id === 'string' && source.id ? source.id : `peso-${date}`, date, value: weight }];
  }).sort((left, right) => right.date.localeCompare(left.date));
}

const STORAGE_KEY_PREFIX = 'ninou.universal.profile.v3';
const initialProfile: BabyProfile = { name: '', birthDate: '', wakeWindowMinutes: 90, avatarId: 'avatar-01', article: 'do', weights: [] };

const ProfileContext = createContext<{
  profile: BabyProfile;
  hydrated: boolean;
  updateProfile: (patch: Partial<BabyProfile>) => void;
} | null>(null);

export function ProfileProvider({ children }: PropsWithChildren) {
  const { user, access, status: authStatus } = useNinouAuth();
  const [profile, setProfile] = useState(initialProfile);
  const profileRef = useRef(profile);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const storageScope = access?.familyId || (user ? `account-${user.uid}` : 'guest');
  const storageKey = `${STORAGE_KEY_PREFIX}.${storageScope}`;

  useEffect(() => {
    if (authStatus === 'loading' || authStatus === 'resolving-family') return;
    let mounted = true;
    let unsubscribe: () => void = () => undefined;
    Promise.resolve()
      .then(() => {
        if (!mounted) return null;
        setHydrated(false);
        profileRef.current = initialProfile;
        setProfile(initialProfile);
        return AsyncStorage.getItem(storageKey);
      })
      .then((raw) => {
        if (!mounted) return;
        const parsed = raw ? JSON.parse(raw) : null;
        const localProfile = parsed ? { ...initialProfile, ...parsed, avatarId: normalizeAvatarId(parsed.avatarId), article: parsed.article === 'da' ? 'da' : 'do', weights: normalizeWeights(parsed.weights) } : initialProfile;
        profileRef.current = localProfile;
        setProfile(localProfile);
        if (access) {
          unsubscribe = observeBabyProfile(access.familyId, (cloudProfile) => {
            if (!mounted) return;
            const wakeWindow = Number(cloudProfile.wakeWindowMinutes ?? cloudProfile.wakeWindow);
            // O documento families/{familyId}/profile/main é a fonte canônica em todas as plataformas.
            const next = {
              name: typeof cloudProfile.name === 'string' ? cloudProfile.name.trim() : '',
              birthDate: typeof cloudProfile.birthDate === 'string' ? cloudProfile.birthDate : '',
              wakeWindowMinutes: Number.isFinite(wakeWindow) && wakeWindow > 0 ? wakeWindow : 90,
              avatarId: normalizeAvatarId(cloudProfile.avatar?.hair || cloudProfile.avatar?.icon || cloudProfile.avatarId || 'avatar-01'),
              article: cloudProfile.article === 'da' ? 'da' as const : 'do' as const,
              weights: Array.isArray(cloudProfile.weights) ? normalizeWeights(cloudProfile.weights) : [],
            };
            profileRef.current = next;
            setProfile(next);
            void AsyncStorage.setItem(storageKey, JSON.stringify(next));
          }, () => undefined);
        }
      })
      .catch(() => undefined)
      .finally(() => { if (mounted) setHydrated(true); });
    return () => {
      mounted = false;
      unsubscribe();
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [access, authStatus, storageKey]);

  const updateProfile = useCallback((patch: Partial<BabyProfile>) => {
    const next = { ...profileRef.current, ...patch };
    profileRef.current = next;
    setProfile(next);
    void AsyncStorage.setItem(storageKey, JSON.stringify(next));
    if (access) {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        void saveBabyProfile(access.familyId, profileRef.current).catch(() => undefined);
      }, 600);
    }
  }, [access, storageKey]);

  const value = useMemo(() => ({ profile, hydrated, updateProfile }), [profile, hydrated, updateProfile]);
  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useBabyProfile() {
  const context = useContext(ProfileContext);
  if (!context) throw new Error('useBabyProfile deve ser usado dentro de ProfileProvider');
  return context;
}

export function getBabyAgeText(birthDate: string) {
  if (!birthDate) return 'Nascimento não preenchido';
  const birth = new Date(`${birthDate}T12:00:00`);
  if (!Number.isFinite(birth.getTime())) return 'Nascimento não preenchido';
  const days = Math.max(0, Math.floor((Date.now() - birth.getTime()) / 86400000));
  if (days < 90) {
    const weeks = Math.floor(days / 7);
    return `${days} dia${days === 1 ? '' : 's'} de vida${weeks > 0 ? ` • ${weeks} semana${weeks === 1 ? '' : 's'}` : ''}`;
  }
  const months = Math.floor(days / 30.4375);
  if (months < 24) return `${months} ${months === 1 ? 'mês' : 'meses'}`;
  const years = Math.floor(months / 12);
  return `${years} ${years === 1 ? 'ano' : 'anos'}`;
}
