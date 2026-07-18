import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router, Tabs } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { InteractionManager, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ActionArt } from '@/components/action-art';
import { recordConfig, type RecordType } from '@/domain/routine';
import { useNinouTheme } from '@/theme/tokens';

const tabMeta: Record<string, { label: string; icon: keyof typeof Ionicons.glyphMap; activeIcon: keyof typeof Ionicons.glyphMap }> = {
  index: { label: 'Hoje', icon: 'home-outline', activeIcon: 'home' },
  diario: { label: 'Diário', icon: 'reader-outline', activeIcon: 'reader' },
  dados: { label: 'Dados', icon: 'stats-chart-outline', activeIcon: 'stats-chart' },
  sons: { label: 'Sons', icon: 'musical-note-outline', activeIcon: 'musical-note' },
  perfil: { label: 'Perfil', icon: 'person-circle-outline', activeIcon: 'person-circle' },
};

const launcherTypes: RecordType[] = ['amamentacao', 'mamadeira', 'fralda', 'sono', 'dormir', 'acordou', 'despertar-noturno', 'medicamento'];

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
  const { colors, isDark } = useNinouTheme();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [launcherOpen, setLauncherOpen] = useState(false);
  const pendingRecordType = useRef<RecordType | null>(null);
  const barWidth = Math.min(500, width - 24);
  const routes = state.routes.filter((route) => route.name !== 'adicionar');
  const navigateToPendingRecord = useCallback(() => {
    const type = pendingRecordType.current;
    if (!type) return;
    pendingRecordType.current = null;
    router.push({ pathname: '/registrar', params: { type } });
  }, []);

  useEffect(() => {
    if (launcherOpen || Platform.OS !== 'android' || !pendingRecordType.current) return;
    const task = InteractionManager.runAfterInteractions(navigateToPendingRecord);
    return () => task.cancel();
  }, [launcherOpen, navigateToPendingRecord]);

  const openRecord = (type: RecordType) => {
    pendingRecordType.current = type;
    setLauncherOpen(false);
    void Haptics.selectionAsync();
  };
  return (
    <View style={[styles.bar, { width: barWidth, left: (width - barWidth) / 2, bottom: Math.max(8, insets.bottom - 2), backgroundColor: isDark ? 'rgba(22,14,43,0.97)' : 'rgba(255,251,247,0.97)', borderColor: isDark ? 'rgba(218,205,255,0.14)' : 'rgba(92,69,126,0.13)' }]}>
      <LinearGradient pointerEvents="none" colors={isDark ? ['rgba(255,255,255,0.055)', 'rgba(255,255,255,0.01)'] : ['rgba(255,255,255,0.95)', 'rgba(247,237,248,0.76)']} style={StyleSheet.absoluteFill} />
      <View style={styles.nav}>{routes.map((route) => {
        const originalIndex = state.routes.findIndex((item) => item.key === route.key);
        const focused = state.index === originalIndex;
        const meta = tabMeta[route.name];
        if (!meta) return null;
        return <Pressable key={route.key} accessibilityRole="tab" accessibilityState={{ selected: focused }} onPress={() => { const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true }); if (!focused && !event.defaultPrevented) { void Haptics.selectionAsync(); navigation.navigate(route.name); } }} style={({ pressed }) => [styles.item, focused && { backgroundColor: colors.primarySoft }, pressed && styles.itemPressed]}>{focused ? <LinearGradient colors={isDark ? ['rgba(168,146,255,0.2)', 'rgba(97,225,191,0.06)'] : ['rgba(117,88,232,0.14)', 'rgba(255,255,255,0.45)']} style={StyleSheet.absoluteFill} /> : null}<Ionicons name={focused ? meta.activeIcon : meta.icon} size={19} color={focused ? colors.primary : colors.textMuted} /><Text numberOfLines={1} style={[styles.label, { color: focused ? colors.text : colors.textMuted }]}>{meta.label}</Text>{focused ? <View style={[styles.activeDot, { backgroundColor: colors.accent }]} /> : null}</Pressable>;
      })}</View>
      <View pointerEvents="none" style={[styles.addHalo, { backgroundColor: isDark ? 'rgba(111,242,203,0.15)' : 'rgba(117,88,232,0.12)' }]} />
      <Pressable accessibilityRole="button" accessibilityLabel="Abrir menu de novos registros" onPress={() => { void Haptics.selectionAsync(); setLauncherOpen(true); }} style={({ pressed }) => [styles.add, pressed && styles.pressed]}><LinearGradient colors={isDark ? ['#72F2C7', '#9FD5FF'] : ['#9C70FF', '#90B7FF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.addGradient}><Ionicons name="add" size={31} color={isDark ? '#10241E' : '#FFF'} /></LinearGradient></Pressable>

      <Modal visible={launcherOpen} transparent animationType="slide" onDismiss={navigateToPendingRecord} onRequestClose={() => setLauncherOpen(false)}>
        <Pressable style={styles.launcherBackdrop} onPress={() => setLauncherOpen(false)}>
          <Pressable style={[styles.launcherSheet, { backgroundColor: colors.surface, borderColor: colors.border, paddingBottom: Math.max(22, insets.bottom + 10) }]} onPress={(event) => event.stopPropagation()}>
            <LinearGradient pointerEvents="none" colors={isDark ? ['rgba(129,91,231,0.2)', 'rgba(23,16,43,0)'] : ['rgba(224,209,255,0.58)', 'rgba(255,255,255,0)']} style={StyleSheet.absoluteFill} />
            <View style={[styles.handle, { backgroundColor: colors.border }]} />
            <View style={styles.launcherHead}><View style={styles.launcherCopy}><Text style={[styles.launcherKicker, { color: colors.primary }]}>NOVO REGISTRO</Text><Text style={[styles.launcherTitle, { color: colors.text }]}>O que aconteceu agora?</Text><Text style={[styles.launcherSubtitle, { color: colors.textMuted }]}>Escolha um cuidado para registrar em poucos toques.</Text></View><Pressable accessibilityLabel="Fechar menu" onPress={() => setLauncherOpen(false)} style={[styles.close, { backgroundColor: colors.surfaceElevated }]}><Ionicons name="close" size={22} color={colors.text} /></Pressable></View>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.launcherGrid}>
              {launcherTypes.map((type) => <Pressable key={type} onPress={() => openRecord(type)} style={({ pressed }) => [styles.launcherItem, { backgroundColor: colors.surfaceElevated, borderColor: pressed ? colors.primary : colors.border, shadowColor: colors.primary }, pressed && styles.launcherItemPressed]}><ActionArt type={type} size={42} /><View style={styles.launcherItemCopy}><Text adjustsFontSizeToFit minimumFontScale={0.78} numberOfLines={1} style={[styles.launcherItemTitle, { color: colors.text }]}>{recordConfig[type].title}</Text><Text style={[styles.launcherItemHint, { color: colors.textMuted }]} numberOfLines={1}>{recordConfig[type].hint}</Text></View><Ionicons name="chevron-forward" size={14} color={colors.textMuted} /></Pressable>)}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { position: 'absolute', height: 70, borderRadius: 23, borderWidth: StyleSheet.hairlineWidth, padding: 6, paddingRight: 72, overflow: 'hidden', shadowColor: '#06030D', shadowOpacity: 0.3, shadowRadius: 24, shadowOffset: { width: 0, height: 13 }, elevation: 14 },
  nav: { flex: 1, flexDirection: 'row', gap: 2 }, item: { flex: 1, minWidth: 0, minHeight: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', gap: 3, paddingHorizontal: 1, overflow: 'hidden' }, label: { width: '100%', fontSize: 9, lineHeight: 10, fontWeight: '800', textAlign: 'center' },
  activeDot: { position: 'absolute', bottom: 4, width: 4, height: 4, borderRadius: 2 },
  itemPressed: { opacity: 0.74, transform: [{ scale: 0.97 }] },
  addHalo: { position: 'absolute', right: 4, top: 5, width: 60, height: 60, borderRadius: 23 },
  add: { position: 'absolute', right: 9, top: 10, width: 50, height: 50, borderRadius: 18, overflow: 'hidden' }, addGradient: { flex: 1, alignItems: 'center', justifyContent: 'center' }, pressed: { opacity: 0.8, transform: [{ scale: 0.95 }] },
  launcherBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(6,3,13,0.62)' },
  launcherSheet: { width: '100%', maxWidth: 540, maxHeight: '78%', alignSelf: 'center', borderTopLeftRadius: 30, borderTopRightRadius: 30, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 14, paddingTop: 9, overflow: 'hidden' },
  handle: { width: 44, height: 5, borderRadius: 3, alignSelf: 'center', marginBottom: 16 },
  launcherHead: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 12 }, launcherCopy: { flex: 1 }, launcherKicker: { fontSize: 9, fontWeight: '900', letterSpacing: 1.3 }, launcherTitle: { marginTop: 4, fontSize: 22, lineHeight: 26, fontWeight: '900', letterSpacing: -0.6 }, launcherSubtitle: { marginTop: 4, fontSize: 11, lineHeight: 15, fontWeight: '600' },
  close: { width: 42, height: 42, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  launcherGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingBottom: 8 },
  launcherItem: { width: '48%', flexGrow: 1, minHeight: 78, borderRadius: 19, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 9, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 7, overflow: 'hidden' }, launcherItemPressed: { borderWidth: 1, shadowOpacity: 0.34, shadowRadius: 13, shadowOffset: { width: 0, height: 0 } }, launcherItemCopy: { flex: 1, minWidth: 0 }, launcherItemTitle: { width: '100%', fontSize: 11.5, lineHeight: 14, fontWeight: '900' }, launcherItemHint: { marginTop: 2, fontSize: 8.8, fontWeight: '600' },
});
