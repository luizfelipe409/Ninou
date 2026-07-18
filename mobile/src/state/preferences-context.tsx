import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, type PropsWithChildren, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { loadAccountCaregiverProfile, loadLegalConsent, saveAccountCaregiverProfile } from '@/services/firebase';
import { useNinouAuth } from '@/state/auth-context';

type Preferences = {
  caregiverName: string;
  caregiverRelation: string;
  legalAcceptedAt: number;
  reportWhatsapp: string;
};

const initialPreferences: Preferences = { caregiverName: '', caregiverRelation: 'Responsável', legalAcceptedAt: 0, reportWhatsapp: '' };
const PreferencesContext = createContext<{ preferences: Preferences; updatePreferences: (patch: Partial<Preferences>) => void } | null>(null);

export function PreferencesProvider({ children }: PropsWithChildren) {
  const { user, access } = useNinouAuth();
  const key = `ninou.mobile.preferences.v2.${user?.uid || 'guest'}`;
  const [preferences, setPreferences] = useState(initialPreferences);
  useEffect(() => {
    let active = true;
    void (async () => {
      const raw = await AsyncStorage.getItem(key);
      const local = raw ? { ...initialPreferences, ...JSON.parse(raw) } as Preferences : initialPreferences;
      let next = local;
      if (user) {
        const [legalResult, caregiverResult] = await Promise.allSettled([
          loadLegalConsent(user),
          loadAccountCaregiverProfile(user, access?.familyId),
        ]);
        if (legalResult.status === 'fulfilled') {
          const cloudValue = legalResult.value?.acceptedAtClient;
          const cloudAcceptedAt = typeof cloudValue === 'number' ? cloudValue : typeof cloudValue === 'string' ? Date.parse(cloudValue) : 0;
          if (Number.isFinite(cloudAcceptedAt)) next = { ...next, legalAcceptedAt: Math.max(next.legalAcceptedAt, cloudAcceptedAt) };
        }
        if (caregiverResult.status === 'fulfilled') {
          const cloudIdentity = caregiverResult.value;
          next = {
            ...next,
            caregiverName: cloudIdentity.caregiverName || next.caregiverName,
            caregiverRelation: cloudIdentity.caregiverRelation || next.caregiverRelation,
          };
        }
      }
      if (!active) return;
      setPreferences(next);
      await AsyncStorage.setItem(key, JSON.stringify(next));
    })();
    return () => { active = false; };
  }, [access?.familyId, key, user]);
  const updatePreferences = useCallback((patch: Partial<Preferences>) => setPreferences((current) => {
    const next = { ...current, ...patch };
    void AsyncStorage.setItem(key, JSON.stringify(next));
    if (user && ('caregiverName' in patch || 'caregiverRelation' in patch)) {
      void saveAccountCaregiverProfile(user, access?.familyId, {
        caregiverName: next.caregiverName,
        caregiverRelation: next.caregiverRelation,
      });
    }
    return next;
  }), [access?.familyId, key, user]);
  const value = useMemo(() => ({ preferences, updatePreferences }), [preferences, updatePreferences]);
  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function useFamilyPreferences() {
  const context = useContext(PreferencesContext);
  if (!context) throw new Error('useFamilyPreferences deve ser usado dentro de PreferencesProvider');
  return context;
}
