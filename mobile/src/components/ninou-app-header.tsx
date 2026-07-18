import { router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { AvatarArt } from '@/components/avatar-art';
import { useBabyProfile } from '@/state/profile-context';
import { useNinouAuth } from '@/state/auth-context';
import { useRoutine } from '@/state/routine-context';
import { radius, spacing, useNinouTheme } from '@/theme/tokens';

export function NinouAppHeader() {
  const { colors } = useNinouTheme();
  const { profile } = useBabyProfile();
  const { access, signOut } = useNinouAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const { hydrated, syncStatus } = useRoutine();
  const syncLabel = access
    ? syncStatus === 'saving' ? 'Sincronizando' : syncStatus === 'synced' ? 'Sincronizado' : syncStatus === 'pending' ? 'Pendente' : 'Conectando'
    : hydrated ? 'Neste aparelho' : 'Carregando';
  const synchronized = syncStatus === 'synced';

  return (
    <View style={[styles.header, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Pressable accessibilityRole="button" accessibilityLabel="Abrir menu do avatar" onPress={() => setMenuOpen(true)} style={styles.identity}>
        <AvatarArt avatarId={profile.avatarId} size={42} rounded />
        <View style={styles.copy}>
          <Text style={[styles.brand, { color: colors.primary }]}>Ninou</Text>
          <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>{profile.name ? `Diário ${profile.article} ${profile.name}` : 'Diário do bebê'}</Text>
        </View>
      </Pressable>
      <View style={[styles.syncPill, { backgroundColor: synchronized ? `${colors.accent}18` : colors.primarySoft, borderColor: synchronized ? `${colors.accent}66` : colors.border }]}>
        <View style={[styles.syncDot, { backgroundColor: synchronized ? colors.accent : colors.warning }]} />
        <Text style={[styles.syncText, { color: synchronized ? colors.accent : colors.text }]}>{syncLabel}</Text>
      </View>
      <Modal visible={menuOpen} transparent animationType="fade" onRequestClose={() => setMenuOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setMenuOpen(false)}>
          <Pressable style={[styles.avatarMenu, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={(event) => event.stopPropagation()}>
            <View style={styles.menuIdentity}><AvatarArt avatarId={profile.avatarId} size={52} rounded /><View style={styles.menuCopy}><Text style={[styles.menuName, { color: colors.text }]}>{profile.name || 'Seu bebê'}</Text><Text style={[styles.menuMeta, { color: colors.textMuted }]}>{access ? 'Família conectada' : 'Neste aparelho'}</Text></View></View>
            <View style={[styles.separator, { backgroundColor: colors.border }]} />
            <MenuItem icon="person-outline" label="Perfil do bebê" onPress={() => open('/perfil')} />
            <MenuItem icon="book-outline" label="Abrir diário" onPress={() => open('/diario')} />
            <MenuItem icon="document-text-outline" label="Relatórios" onPress={() => open('/relatorios')} />
            <View style={[styles.separator, { backgroundColor: colors.border }]} />
            <MenuItem icon="log-out-outline" label="Sair desta conta" danger onPress={() => { setMenuOpen(false); void signOut(); }} />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );

  function open(path: '/perfil' | '/diario' | '/relatorios') { setMenuOpen(false); router.push(path as never); }
  function MenuItem({ icon, label, danger = false, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; danger?: boolean; onPress: () => void }) {
    return <Pressable onPress={onPress} style={styles.menuItem}><Ionicons name={icon} size={20} color={danger ? colors.danger : colors.primary} /><Text style={[styles.menuLabel, { color: danger ? colors.danger : colors.text }]}>{label}</Text><Ionicons name="chevron-forward" size={16} color={colors.textMuted} /></Pressable>;
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
  },
  identity: { minWidth: 0, flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  copy: { minWidth: 0, flex: 1 },
  brand: { marginBottom: 2, fontSize: 10.5, lineHeight: 11, fontWeight: '900', letterSpacing: 1.35, textTransform: 'uppercase' },
  title: { fontSize: 16, lineHeight: 19, fontWeight: '900', letterSpacing: -0.25 },
  syncPill: { minHeight: 34, borderRadius: radius.pill, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 11, flexDirection: 'row', alignItems: 'center', gap: 7 },
  syncDot: { width: 7, height: 7, borderRadius: 4 },
  syncText: { fontSize: 11, fontWeight: '900' },
  backdrop: { flex: 1, backgroundColor: 'rgba(6,3,13,0.38)' },
  avatarMenu: { position: 'absolute', top: 76, right: 14, width: 285, borderRadius: 24, borderWidth: StyleSheet.hairlineWidth, padding: 13 },
  menuIdentity: { flexDirection: 'row', alignItems: 'center', gap: 11, padding: 5 }, menuCopy: { flex: 1 }, menuName: { fontSize: 16, fontWeight: '900' }, menuMeta: { marginTop: 2, fontSize: 10.5, fontWeight: '700' },
  separator: { height: StyleSheet.hairlineWidth, marginVertical: 8 }, menuItem: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 11, paddingHorizontal: 7 }, menuLabel: { flex: 1, fontSize: 13, fontWeight: '800' },
});
