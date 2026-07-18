import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router, Tabs } from 'expo-router';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { useNinouTheme } from '@/theme/tokens';

const tabMeta: Record<string, { label: string; icon: keyof typeof Ionicons.glyphMap }> = {
  index: { label: 'Hoje', icon: 'home-outline' },
  diario: { label: 'Diário', icon: 'menu-outline' },
  dados: { label: 'Dados', icon: 'stats-chart-outline' },
  sons: { label: 'Sons', icon: 'musical-note-outline' },
  perfil: { label: 'Perfil', icon: 'ellipse-outline' },
};

export default function TabsLayout() {
  return (
    <Tabs tabBar={(props) => <PremiumTabBar {...props} />} screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: 'transparent' } }}>
      <Tabs.Screen name="index" options={{ title: 'Hoje' }} />
      <Tabs.Screen name="diario" options={{ title: 'Diário' }} />
      <Tabs.Screen name="dados" options={{ title: 'Dados' }} />
      <Tabs.Screen name="sons" options={{ title: 'Sons' }} />
      <Tabs.Screen name="perfil" options={{ title: 'Perfil' }} />
      <Tabs.Screen name="adicionar" options={{ href: null }} />
    </Tabs>
  );
}

type TabBarProps = { state: { index: number; routes: { key: string; name: string }[] }; navigation: { emit: (event: { type: 'tabPress'; target: string; canPreventDefault: true }) => { defaultPrevented: boolean }; navigate: (name: string) => void } };

function PremiumTabBar({ state, navigation }: TabBarProps) {
  const { colors } = useNinouTheme();
  const { width } = useWindowDimensions();
  const barWidth = Math.min(500, width - 24);
  const routes = state.routes.filter((route) => route.name !== 'adicionar');
  return (
    <View style={[styles.bar, { width: barWidth, left: (width - barWidth) / 2, backgroundColor: colors.tabBar, borderColor: colors.border }]}>
      <View style={styles.nav}>{routes.map((route) => {
        const originalIndex = state.routes.findIndex((item) => item.key === route.key);
        const focused = state.index === originalIndex;
        const meta = tabMeta[route.name];
        if (!meta) return null;
        return <Pressable key={route.key} accessibilityRole="tab" accessibilityState={{ selected: focused }} onPress={() => { const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true }); if (!focused && !event.defaultPrevented) navigation.navigate(route.name); }} style={[styles.item, focused && { backgroundColor: colors.primarySoft }]}><Ionicons name={meta.icon} size={18} color={focused ? colors.text : colors.textMuted} /><Text numberOfLines={1} style={[styles.label, { color: focused ? colors.text : colors.textMuted }]}>{meta.label}</Text></Pressable>;
      })}</View>
      <Pressable accessibilityRole="button" accessibilityLabel="Abrir menu de novos registros" onPress={() => { void Haptics.selectionAsync(); router.push('/registrar'); }} style={({ pressed }) => [styles.add, pressed && styles.pressed]}><LinearGradient colors={['#9C70FF', '#90B7FF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.addGradient}><Ionicons name="add" size={30} color="#FFF" /></LinearGradient></Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { position: 'absolute', bottom: 8, height: 70, borderRadius: 23, borderWidth: StyleSheet.hairlineWidth, padding: 6, paddingRight: 72, shadowColor: '#06030D', shadowOpacity: 0.24, shadowRadius: 22, shadowOffset: { width: 0, height: 12 }, elevation: 12 },
  nav: { flex: 1, flexDirection: 'row', gap: 2 }, item: { flex: 1, minWidth: 0, minHeight: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', gap: 3, paddingHorizontal: 1 }, label: { width: '100%', fontSize: 9, lineHeight: 10, fontWeight: '800', textAlign: 'center' },
  add: { position: 'absolute', right: 9, top: 10, width: 50, height: 50, borderRadius: 18, overflow: 'hidden' }, addGradient: { flex: 1, alignItems: 'center', justifyContent: 'center' }, pressed: { opacity: 0.8, transform: [{ scale: 0.95 }] },
});
