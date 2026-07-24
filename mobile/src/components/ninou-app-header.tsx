import { router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AvatarArt } from '@/components/avatar-art';
import { canExportFamilyReports, familyRoleLabel } from '@/domain/family-access';
import { useBabyProfile } from '@/state/profile-context';
import { useNinouAuth } from '@/state/auth-context';
import { useRoutine } from '@/state/routine-context';
import { radius, spacing, useNinouTheme } from '@/theme/tokens';
import { useNinouLayout } from '@/theme/layout';

export function NinouAppHeader() {
  const { colors, isDark, mode, setMode } = useNinouTheme();
  const { profile } = useBabyProfile();
  const { access, signOut } = useNinouAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const insets = useSafeAreaInsets();
  const { hydrated, syncStatus } = useRoutine();
  const { isDesktop } = useNinouLayout();
  const canExportReports = Boolean(access && canExportFamilyReports(access.role));
  const syncLabel = access
    ? syncStatus === 'saving' ? 'Sincronizando' : syncStatus === 'synced' ? 'Sincronizado' : syncStatus === 'pending' ? 'Pendente' : 'Conectando'
    : hydrated ? 'Neste aparelho' : 'Carregando';
  const synchronized = syncStatus === 'synced';

  return (
    <View style={[styles.header, isDesktop && styles.headerDesktop, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <LinearGradient pointerEvents="none" colors={isDark ? ['rgba(168,146,255,0.11)', 'rgba(29,20,53,0.03)'] : ['rgba(255,255,255,0.96)', 'rgba(241,230,255,0.62)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
      <Pressable accessibilityRole="button" accessibilityLabel="Abrir menu do avatar" onPress={() => setMenuOpen(true)} style={styles.identity}>
        <View style={[styles.avatarFrame, isDesktop && styles.avatarFrameDesktop, { borderColor: isDark ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.9)', backgroundColor: colors.primarySoft }]}><AvatarArt avatarId={profile.avatarId} size={isDesktop ? 52 : 42} rounded /><View style={[styles.avatarStatus, { backgroundColor: colors.accent, borderColor: colors.surface }]} /></View>
        <View style={styles.copy}>
          <Text style={[styles.brand, isDesktop && styles.brandDesktop, { color: colors.primary }]}>Ninou</Text>
          <Text style={[styles.title, isDesktop && styles.titleDesktop, { color: colors.text }]} numberOfLines={1}>{profile.name ? `Diário ${profile.article} ${profile.name}` : 'Diário do bebê'}</Text>
        </View>
      </Pressable>
      <View style={[styles.syncPill, isDesktop && styles.syncPillDesktop, { backgroundColor: synchronized ? `${colors.accent}18` : colors.primarySoft, borderColor: synchronized ? `${colors.accent}66` : colors.border }]}>
        <View style={[styles.syncDot, { backgroundColor: synchronized ? colors.accent : colors.warning }]} />
        <Text style={[styles.syncText, isDesktop && styles.syncTextDesktop, { color: synchronized ? colors.accent : colors.text }]}>{syncLabel}</Text>
      </View>
      <Modal visible={menuOpen} transparent animationType="fade" onRequestClose={() => setMenuOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setMenuOpen(false)}>
          <Pressable style={[styles.avatarMenu, { backgroundColor: colors.surface, borderColor: colors.border, paddingBottom: Math.max(20, insets.bottom + 10) }]} onPress={(event) => event.stopPropagation()}>
            <LinearGradient pointerEvents="none" colors={isDark ? ['rgba(124,91,228,0.2)', 'rgba(23,16,43,0)'] : ['rgba(229,214,255,0.72)', 'rgba(255,255,255,0)']} style={StyleSheet.absoluteFill} />
            <View style={[styles.menuHandle, { backgroundColor: colors.border }]} />
            <View style={styles.menuIdentity}><View style={[styles.menuAvatar, { backgroundColor: colors.primarySoft }]}><AvatarArt avatarId={profile.avatarId} size={64} rounded /></View><View style={styles.menuCopy}><Text style={[styles.menuBrand, { color: colors.primary }]}>DIÁRIO NINOU</Text><Text style={[styles.menuName, { color: colors.text }]}>{profile.name || 'Seu bebê'}</Text><Text style={[styles.menuMeta, { color: colors.textMuted }]}>{access ? `${familyRoleLabel(access.role)} · ${access.email}` : 'Dados salvos neste aparelho'}</Text></View><Pressable accessibilityLabel="Fechar menu" onPress={() => setMenuOpen(false)} style={[styles.menuClose, { backgroundColor: colors.surfaceElevated }]}><Ionicons name="close" size={21} color={colors.text} /></Pressable></View>
            <View style={[styles.familyStatus, { backgroundColor: synchronized ? `${colors.accent}12` : colors.surfaceElevated, borderColor: synchronized ? `${colors.accent}4D` : colors.border }]}><View style={[styles.syncDot, { backgroundColor: synchronized ? colors.accent : colors.warning }]} /><View style={styles.familyStatusCopy}><Text style={[styles.familyStatusTitle, { color: colors.text }]}>{syncLabel}</Text><Text style={[styles.familyStatusText, { color: colors.textMuted }]}>As alterações desta família são atualizadas em tempo real.</Text></View><Ionicons name={synchronized ? 'cloud-done-outline' : 'cloud-outline'} size={22} color={synchronized ? colors.accent : colors.warning} /></View>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.menuScroll}>
              <Text style={[styles.menuSectionLabel, { color: colors.textMuted }]}>ACESSOS RÁPIDOS</Text>
              <View style={styles.menuGrid}>
                <MenuItem icon="person-outline" label="Perfil" hint="Bebê e família" onPress={() => open('/perfil')} />
                <MenuItem icon="book-outline" label="Diário" hint="Histórico completo" onPress={() => open('/diario')} />
                <MenuItem icon="stats-chart-outline" label="Dados" hint="Tendências" onPress={() => open('/dados')} />
                <MenuItem icon="musical-notes-outline" label="Sons" hint="Relaxamento" onPress={() => open('/sons')} />
                {canExportReports ? <MenuItem icon="document-text-outline" label="Relatórios" hint="PDF, WhatsApp e Excel" onPress={() => open('/relatorios')} /> : null}
                <MenuItem icon="add-circle-outline" label="Novo registro" hint="Registrar cuidado" onPress={() => open('/registrar')} />
              </View>
              <Text style={[styles.menuSectionLabel, { color: colors.textMuted }]}>APARÊNCIA</Text>
              <View style={[styles.themeSegment, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>{([
                ['light', 'sunny-outline', 'Claro'], ['dark', 'moon-outline', 'Escuro'], ['system', 'phone-portrait-outline', 'Automático'],
              ] as const).map(([value, icon, label]) => <Pressable key={value} onPress={() => setMode(value)} style={[styles.themeChoice, mode === value && { backgroundColor: colors.surface, borderColor: colors.border }]}><Ionicons name={icon} size={17} color={mode === value ? colors.primary : colors.textMuted} /><Text style={[styles.themeChoiceText, { color: mode === value ? colors.text : colors.textMuted }]}>{label}</Text></Pressable>)}</View>
              <Pressable onPress={() => { setMenuOpen(false); void signOut(); }} style={[styles.signOut, { borderColor: `${colors.danger}40`, backgroundColor: `${colors.danger}0D` }]}><Ionicons name="log-out-outline" size={20} color={colors.danger} /><View style={styles.signOutCopy}><Text style={[styles.signOutTitle, { color: colors.danger }]}>Sair desta conta</Text><Text style={[styles.signOutHint, { color: colors.textMuted }]}>O diário continuará salvo e sincronizado.</Text></View><Ionicons name="chevron-forward" size={16} color={colors.danger} /></Pressable>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );

  function open(path: '/perfil' | '/diario' | '/dados' | '/sons' | '/relatorios' | '/registrar') { setMenuOpen(false); router.push(path as never); }
  function MenuItem({ icon, label, hint, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; hint: string; onPress: () => void }) {
    return <Pressable onPress={onPress} style={({ pressed }) => [styles.menuItem, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }, pressed && styles.menuPressed]}><View style={[styles.menuIcon, { backgroundColor: colors.primarySoft }]}><Ionicons name={icon} size={20} color={colors.primary} /></View><Text style={[styles.menuLabel, { color: colors.text }]}>{label}</Text><Text style={[styles.menuHint, { color: colors.textMuted }]} numberOfLines={1}>{hint}</Text></Pressable>;
  }
}

const styles = StyleSheet.create({
  header: {
    minHeight: 66,
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    overflow: 'hidden',
    shadowColor: '#06030D', shadowOpacity: 0.16, shadowRadius: 18, shadowOffset: { width: 0, height: 9 }, elevation: 5,
  },
  headerDesktop: { minHeight: 82, borderRadius: 26, paddingHorizontal: 18, paddingVertical: 12 },
  identity: { minWidth: 0, flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatarFrame: { width: 46, height: 46, borderRadius: 16, borderWidth: 2, alignItems: 'center', justifyContent: 'center' }, avatarStatus: { position: 'absolute', right: -1, bottom: -1, width: 11, height: 11, borderRadius: 6, borderWidth: 2 },
  avatarFrameDesktop: { width: 58, height: 58, borderRadius: 19 },
  copy: { minWidth: 0, flex: 1 },
  brand: { marginBottom: 2, fontSize: 10.5, lineHeight: 11, fontWeight: '900', letterSpacing: 1.35, textTransform: 'uppercase' },
  brandDesktop: { fontSize: 11.5, lineHeight: 13 },
  title: { fontSize: 16, lineHeight: 19, fontWeight: '900', letterSpacing: -0.25 },
  titleDesktop: { fontSize: 20, lineHeight: 24 },
  syncPill: { minHeight: 34, borderRadius: radius.pill, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 11, flexDirection: 'row', alignItems: 'center', gap: 7 },
  syncPillDesktop: { minHeight: 42, paddingHorizontal: 15 },
  syncDot: { width: 7, height: 7, borderRadius: 4 },
  syncText: { fontSize: 11, fontWeight: '900' },
  syncTextDesktop: { fontSize: 12.5 },
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(6,3,13,0.58)' },
  avatarMenu: { width: '100%', maxWidth: 540, maxHeight: '88%', alignSelf: 'center', borderTopLeftRadius: 34, borderTopRightRadius: 34, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 16, paddingTop: 9, overflow: 'hidden' },
  menuHandle: { width: 44, height: 5, borderRadius: 3, alignSelf: 'center', marginBottom: 14 },
  menuIdentity: { flexDirection: 'row', alignItems: 'center', gap: 12 }, menuAvatar: { width: 68, height: 68, borderRadius: 23, alignItems: 'center', justifyContent: 'center' }, menuCopy: { flex: 1, minWidth: 0 }, menuBrand: { fontSize: 9, fontWeight: '900', letterSpacing: 1.2 }, menuName: { marginTop: 3, fontSize: 21, lineHeight: 24, fontWeight: '900' }, menuMeta: { marginTop: 3, fontSize: 10.5, lineHeight: 14, fontWeight: '700' }, menuClose: { width: 42, height: 42, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  familyStatus: { marginTop: 16, minHeight: 68, borderRadius: 20, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', gap: 10 }, familyStatusCopy: { flex: 1 }, familyStatusTitle: { fontSize: 12, fontWeight: '900' }, familyStatusText: { marginTop: 2, fontSize: 9.5, lineHeight: 13 },
  menuScroll: { paddingTop: 17, paddingBottom: 4 }, menuSectionLabel: { marginBottom: 9, fontSize: 9, fontWeight: '900', letterSpacing: 1.2 },
  menuGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9, marginBottom: 19 }, menuItem: { width: '31%', flexGrow: 1, minHeight: 105, borderRadius: 20, borderWidth: StyleSheet.hairlineWidth, padding: 10, alignItems: 'flex-start', justifyContent: 'center' }, menuIcon: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center', marginBottom: 7 }, menuLabel: { fontSize: 12, fontWeight: '900' }, menuHint: { width: '100%', marginTop: 2, fontSize: 8.5, fontWeight: '600' }, menuPressed: { opacity: 0.72, transform: [{ scale: 0.97 }] },
  themeSegment: { minHeight: 58, borderRadius: 19, borderWidth: StyleSheet.hairlineWidth, padding: 5, flexDirection: 'row', gap: 4, marginBottom: 14 }, themeChoice: { flex: 1, borderRadius: 15, borderWidth: StyleSheet.hairlineWidth, borderColor: 'transparent', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }, themeChoiceText: { fontSize: 10.5, fontWeight: '900' },
  signOut: { minHeight: 64, borderRadius: 19, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', gap: 10 }, signOutCopy: { flex: 1 }, signOutTitle: { fontSize: 12, fontWeight: '900' }, signOutHint: { marginTop: 2, fontSize: 9.5, lineHeight: 13 },
});
