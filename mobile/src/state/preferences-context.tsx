import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, type PropsWithChildren, useCallback, useContext, useEffect, useMemo, useState } from 'react';

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
  const key = `ninou.mobile.preferences.v1.${access?.familyId || user?.uid || 'guest'}`;
  const [preferences, setPreferences] = useState(initialPreferences);
  useEffect(() => { let active = true; void AsyncStorage.getItem(key).then((raw) => { if (active) setPreferences(raw ? { ...initialPreferences, ...JSON.parse(raw) } : initialPreferences); }); return () => { active = false; }; }, [key]);
  const updatePreferences = useCallback((patch: Partial<Preferences>) => setPreferences((current) => { const next = { ...current, ...patch }; void AsyncStorage.setItem(key, JSON.stringify(next)); return next; }), [key]);
  const value = useMemo(() => ({ preferences, updatePreferences }), [preferences, updatePreferences]);
  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function useFamilyPreferences() {
  const context = useContext(PreferencesContext);
  if (!context) throw new Error('useFamilyPreferences deve ser usado dentro de PreferencesProvider');
  return context;
}
