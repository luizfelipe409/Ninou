import Ionicons from '@expo/vector-icons/Ionicons';
import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider, Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { NinouThemeProvider, useNinouTheme } from '@/theme/tokens';
import { RoutineProvider } from '@/state/routine-context';
import { ProfileProvider } from '@/state/profile-context';
import { AuthProvider, useNinouAuth } from '@/state/auth-context';
import { GuestEntryPortal, NinouLoadingScreen } from '@/components/guest-entry-portal';
import { FamilySetupPortal } from '@/components/family-setup-portal';
import { GlobalAdminPortal } from '@/components/global-admin-portal';
import { BlockedAccountPortal } from '@/components/blocked-account-portal';
import { SubscriptionGate } from '@/components/subscription-gate';
import { PreferencesProvider } from '@/state/preferences-context';

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [iconsLoaded, iconFontError] = useFonts(Ionicons.font);

  useEffect(() => {
    if (iconsLoaded || iconFontError) void SplashScreen.hideAsync();
  }, [iconFontError, iconsLoaded]);

  if (!iconsLoaded && !iconFontError) return null;
  if (iconFontError) throw iconFontError;

  return <NinouThemeProvider><RootNavigation /></NinouThemeProvider>;
}

function RootNavigation() {
  const { colors, isDark } = useNinouTheme();

  const navigationTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
      background: colors.background,
      card: colors.surface,
      border: colors.border,
      primary: colors.primary,
      text: colors.text,
    },
  };

  return (
    <NavigationThemeProvider value={navigationTheme}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <AuthProvider>
        <AppGate />
      </AuthProvider>
    </NavigationThemeProvider>
  );
}

function AppGate() {
  const { user, status } = useNinouAuth();
  const { colors } = useNinouTheme();
  if (status === 'loading' || status === 'resolving-family') return <NinouLoadingScreen />;
  if (!user) return <GuestEntryPortal />;
  if (status === 'admin') return <GlobalAdminPortal />;
  if (status === 'blocked') return <BlockedAccountPortal />;
  if (status === 'no-family' || status === 'error') return <FamilySetupPortal />;
  return (
    <SubscriptionGate>
      <ProfileProvider>
        <PreferencesProvider>
          <RoutineProvider>
          <Stack screenOptions={{ contentStyle: { backgroundColor: colors.background } }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="registrar"
            options={{
              presentation: 'formSheet',
              headerShown: false,
              sheetGrabberVisible: true,
              sheetAllowedDetents: [0.78],
              sheetInitialDetentIndex: 0,
              sheetExpandsWhenScrolledToEdge: false,
              contentStyle: { backgroundColor: colors.background },
            }}
          />
          <Stack.Screen name="relatorios" options={{ presentation: 'modal', title: 'Relatórios', headerShadowVisible: false, headerStyle: { backgroundColor: colors.surface }, headerTintColor: colors.text }} />
          </Stack>
          </RoutineProvider>
        </PreferencesProvider>
      </ProfileProvider>
    </SubscriptionGate>
  );
}
