import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AvatarArt } from '@/components/avatar-art';
import { canExportFamilyReports } from '@/domain/family-access';
import { useNinouAuth } from '@/state/auth-context';
import { useBabyProfile } from '@/state/profile-context';
import { useRoutine } from '@/state/routine-context';
import { useNinouTheme } from '@/theme/tokens';

const items: Record<string, { label: string; hint: string; icon: keyof typeof Ionicons.glyphMap; activeIcon: keyof typeof Ionicons.glyphMap }> = {
  index: { label: 'Hoje', hint: 'Órbita e rotina atual', icon: 'home-outline', activeIcon: 'home' },
  diario: { label: 'Diário', hint: 'Histórico da família', icon: 'reader-outline', activeIcon: 'reader' },
  dados: { label: 'Dados', hint: 'Tendências e crescimento', icon: 'stats-chart-outline', activeIcon: 'stats-chart' },
  sons: { label: 'Sons', hint: 'Relaxamento e sono', icon: 'musical-note-outline', activeIcon: 'musical-note' },
  perfil: { label: 'Perfil', hint: 'Bebê, família e conta', icon: 'person-circle-outline', activeIcon: 'person-circle' },
};

type Props = {
  state: { index: number; routes: { key: string; name: string }[] };
  navigation: {
    emit: (event: { type: 'tabPress'; target: string; canPreventDefault: true }) => { defaultPrevented: boolean };
    navigate: (name: string) => void;
  };
};

export function DesktopNavigation({ state, navigation }: Props) {
  const { colors, isDark } = useNinouTheme();
  const { profile } = useBabyProfile();
  const { access } = useNinouAuth();
  const { canWrite, syncStatus } = useRoutine();
  const canExport = Boolean(access && canExportFamilyReports(access.role));
  const routes = state.routes.filter((route) => items[route.name]);
  const synced = syncStatus === 'synced';

  return (
    <View style={[styles.rail, { backgroundColor: isDark ? 'rgba(19,12,38,0.985)' : 'rgba(255,252,249,0.985)', borderColor: colors.border, shadowColor: isDark ? '#000' : colors.primary }]}>
      <LinearGradient pointerEvents="none" colors={isDark ? ['rgba(139,105,245,0.18)', 'rgba(48,29,82,0.03)', 'rgba(81,224,188,0.05)'] : ['rgba(247,238,255,0.95)', 'rgba(255,255,255,0.35)', 'rgba(216,248,239,0.48)']} style={StyleSheet.absoluteFill} />
      <View style={styles.brandRow}>
        <View style={[styles.brandMark, { backgroundColor: colors.primary }]}><Text style={styles.brandLetter}>N</Text></View>
        <View><Text style={[styles.brand, { color: colors.text }]}>Ninou</Text><Text style={[styles.brandTag, { color: colors.textMuted }]}>CUIDADO EM FAMÍLIA</Text></View>
      </View>

      <Pressable onPress={() => navigation.navigate('perfil')} style={[styles.babyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={[styles.avatar, { backgroundColor: colors.primarySoft }]}><AvatarArt avatarId={profile.avatarId} size={54} rounded /><View style={[styles.onlineDot, { backgroundColor: colors.accent, borderColor: colors.surface }]} /></View>
        <View style={styles.babyCopy}><Text style={[styles.babyKicker, { color: colors.primary }]}>DIÁRIO NINOU</Text><Text numberOfLines={1} style={[styles.babyName, { color: colors.text }]}>{profile.name || 'Seu bebê'}</Text><Text numberOfLines={1} style={[styles.babyMeta, { color: colors.textMuted }]}>{access?.email || 'Neste aparelho'}</Text></View>
        <Ionicons name="chevron-forward" size={17} color={colors.textMuted} />
      </Pressable>

      <View style={styles.nav}>
        <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>NAVEGAÇÃO</Text>
        {routes.map((route) => {
          const originalIndex = state.routes.findIndex((item) => item.key === route.key);
          const focused = state.index === originalIndex;
          const meta = items[route.name];
          return (
            <Pressable
              key={route.key}
              accessibilityRole="tab"
              accessibilityState={{ selected: focused }}
              onPress={() => {
                const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
                if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
              }}
              style={({ pressed }) => [styles.navItem, focused && { backgroundColor: colors.primarySoft, borderColor: `${colors.primary}35` }, pressed && styles.pressed]}>
              <View style={[styles.navIcon, { backgroundColor: focused ? colors.primary : colors.surfaceElevated }]}><Ionicons name={focused ? meta.activeIcon : meta.icon} size={21} color={focused ? '#FFF' : colors.textMuted} /></View>
              <View style={styles.navCopy}><Text style={[styles.navLabel, { color: focused ? colors.text : colors.textMuted }]}>{meta.label}</Text><Text style={[styles.navHint, { color: colors.textMuted }]}>{meta.hint}</Text></View>
              {focused ? <View style={[styles.activeDot, { backgroundColor: colors.accent }]} /> : null}
            </Pressable>
          );
        })}
      </View>

      <View style={styles.bottom}>
        <Pressable disabled={!canWrite} onPress={() => router.push('/registrar')} style={[styles.newRecord, { backgroundColor: canWrite ? colors.primary : colors.surfaceElevated }, !canWrite && styles.disabled]}><Ionicons name={canWrite ? 'add' : 'eye-outline'} size={22} color={canWrite ? '#FFF' : colors.textMuted} /><View style={styles.newRecordCopy}><Text style={[styles.newRecordTitle, { color: canWrite ? '#FFF' : colors.textMuted }]}>{canWrite ? 'Novo registro' : 'Somente visualização'}</Text><Text style={[styles.newRecordHint, { color: canWrite ? 'rgba(255,255,255,0.72)' : colors.textMuted }]}>{canWrite ? 'Adicionar um cuidado' : 'Acompanhar a rotina'}</Text></View></Pressable>
        {canExport ? <Pressable onPress={() => router.push('/relatorios')} style={[styles.reportLink, { borderColor: colors.border }]}><Ionicons name="document-text-outline" size={17} color={colors.primary} /><Text style={[styles.reportText, { color: colors.text }]}>Relatórios e exportações</Text></Pressable> : null}
        <View style={[styles.sync, { backgroundColor: synced ? `${colors.accent}12` : colors.surfaceElevated, borderColor: synced ? `${colors.accent}3D` : colors.border }]}><View style={[styles.syncDot, { backgroundColor: synced ? colors.accent : colors.warning }]} /><View style={styles.syncCopy}><Text style={[styles.syncTitle, { color: colors.text }]}>{synced ? 'Sincronizado' : 'Atualizando'}</Text><Text style={[styles.syncHint, { color: colors.textMuted }]}>Mesma rotina em todos os aparelhos</Text></View><Ionicons name={synced ? 'cloud-done-outline' : 'cloud-outline'} size={18} color={synced ? colors.accent : colors.warning} /></View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  rail: { position: 'absolute', zIndex: 50, left: 18, top: 18, bottom: 18, width: 272, borderRadius: 30, borderWidth: StyleSheet.hairlineWidth, padding: 16, overflow: 'hidden', shadowOpacity: 0.22, shadowRadius: 28, shadowOffset: { width: 0, height: 16 } },
  brandRow: { minHeight: 58, flexDirection: 'row', alignItems: 'center', gap: 11, paddingHorizontal: 4 },
  brandMark: { width: 42, height: 42, borderRadius: 15, alignItems: 'center', justifyContent: 'center' }, brandLetter: { color: '#FFF', fontSize: 21, fontWeight: '900' }, brand: { fontSize: 22, lineHeight: 24, fontWeight: '900', letterSpacing: -0.7 }, brandTag: { marginTop: 3, fontSize: 7.5, fontWeight: '900', letterSpacing: 1.05 },
  babyCard: { minHeight: 82, marginTop: 13, borderRadius: 21, borderWidth: StyleSheet.hairlineWidth, padding: 10, flexDirection: 'row', alignItems: 'center', gap: 9 }, avatar: { width: 58, height: 58, borderRadius: 19, alignItems: 'center', justifyContent: 'center' }, onlineDot: { position: 'absolute', right: -1, bottom: -1, width: 12, height: 12, borderRadius: 6, borderWidth: 2 }, babyCopy: { flex: 1, minWidth: 0 }, babyKicker: { fontSize: 7.5, fontWeight: '900', letterSpacing: 1 }, babyName: { marginTop: 3, fontSize: 15.5, fontWeight: '900' }, babyMeta: { marginTop: 3, fontSize: 8.5, fontWeight: '600' },
  nav: { flex: 1, marginTop: 22, gap: 6 }, sectionLabel: { marginBottom: 4, paddingHorizontal: 9, fontSize: 8, fontWeight: '900', letterSpacing: 1.2 },
  navItem: { minHeight: 61, borderRadius: 18, borderWidth: StyleSheet.hairlineWidth, borderColor: 'transparent', paddingHorizontal: 8, flexDirection: 'row', alignItems: 'center', gap: 10 }, navIcon: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }, navCopy: { flex: 1, minWidth: 0 }, navLabel: { fontSize: 13.5, fontWeight: '900' }, navHint: { marginTop: 2, fontSize: 8.5, fontWeight: '600' }, activeDot: { width: 7, height: 7, borderRadius: 4 }, pressed: { opacity: 0.74, transform: [{ scale: 0.985 }] },
  bottom: { gap: 8 }, newRecord: { minHeight: 60, borderRadius: 19, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 10 }, newRecordCopy: { flex: 1 }, newRecordTitle: { fontSize: 12.5, fontWeight: '900' }, newRecordHint: { marginTop: 2, fontSize: 8.5, fontWeight: '700' }, disabled: { opacity: 0.68 },
  reportLink: { minHeight: 43, borderRadius: 15, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 11, flexDirection: 'row', alignItems: 'center', gap: 8 }, reportText: { fontSize: 10.5, fontWeight: '800' },
  sync: { minHeight: 57, borderRadius: 17, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', gap: 8 }, syncDot: { width: 8, height: 8, borderRadius: 4 }, syncCopy: { flex: 1 }, syncTitle: { fontSize: 10.5, fontWeight: '900' }, syncHint: { marginTop: 2, fontSize: 7.5, lineHeight: 10, fontWeight: '600' },
});
