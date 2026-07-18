import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, type PropsWithChildren, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';

export const palette = {
  light: {
    background: '#FFF0D9',
    surface: '#FFF9F3',
    surfaceElevated: '#F4E8F5',
    text: '#2F2843',
    textMuted: '#675C7D',
    primary: '#7558E8',
    primarySoft: '#EDE3FF',
    accent: '#35B997',
    warning: '#E59062',
    danger: '#C85564',
    border: '#E7D9E5',
    tabBar: '#FFFBF7',
    shadow: '#2D2142',
  },
  dark: {
    background: '#0F0A20',
    surface: '#19112F',
    surfaceElevated: '#281B49',
    text: '#F8F4FF',
    textMuted: '#B7ADCA',
    primary: '#A892FF',
    primarySoft: '#38275F',
    accent: '#61E1BF',
    warning: '#F1A77E',
    danger: '#FF8896',
    border: '#3B2B5D',
    tabBar: '#160E2A',
    shadow: '#06030D',
  },
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 12,
  md: 18,
  lg: 26,
  pill: 999,
} as const;

export type ThemeMode = 'light' | 'dark' | 'system';

type ThemeContextValue = {
  colors: typeof palette.light | typeof palette.dark;
  isDark: boolean;
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  hydrated: boolean;
};

const STORAGE_KEY = 'ninou.mobile.theme.v1';
const ThemeContext = createContext<ThemeContextValue | null>(null);

export function NinouThemeProvider({ children }: PropsWithChildren) {
  const systemScheme = useColorScheme();
  const [mode, setStoredMode] = useState<ThemeMode>('system');
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let active = true;
    void AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (active && (stored === 'light' || stored === 'dark' || stored === 'system')) setStoredMode(stored);
      })
      .finally(() => {
        if (active) setHydrated(true);
      });
    return () => { active = false; };
  }, []);

  const setMode = (nextMode: ThemeMode) => {
    setStoredMode(nextMode);
    void AsyncStorage.setItem(STORAGE_KEY, nextMode);
  };
  const isDark = mode === 'system' ? systemScheme !== 'light' : mode === 'dark';
  const value = useMemo(
    () => ({ colors: isDark ? palette.dark : palette.light, isDark, mode, setMode, hydrated }),
    [hydrated, isDark, mode],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useNinouTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useNinouTheme deve ser usado dentro de NinouThemeProvider');
  return context;
}
