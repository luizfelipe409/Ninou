import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { NinouBackground } from '@/components/ninou-background';
import { useNinouAuth } from '@/state/auth-context';
import { useNinouTheme } from '@/theme/tokens';

export function BlockedAccountPortal() {
  const { colors } = useNinouTheme();
  const { user, signOut } = useNinouAuth();
  return <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}><NinouBackground intense /><View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}><View style={[styles.icon, { backgroundColor: `${colors.danger}14` }]}><Ionicons name="lock-closed-outline" size={31} color={colors.danger} /></View><Text style={[styles.title, { color: colors.text }]}>Acesso suspenso</Text><Text style={[styles.body, { color: colors.textMuted }]}>A conta {user?.email || ''} foi temporariamente bloqueada pela administração. Seus dados permanecem preservados.</Text><Text style={[styles.hint, { color: colors.textMuted }]}>Entre em contato com o suporte Ninou para revisar o acesso.</Text><Pressable onPress={() => void signOut()} style={[styles.button, { backgroundColor: colors.primary }]}><Ionicons name="log-out-outline" size={18} color="#FFFFFF" /><Text style={styles.buttonText}>Voltar para o login</Text></Pressable></View></SafeAreaView>;
}

const styles = StyleSheet.create({ safe: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 }, card: { width: '100%', maxWidth: 450, borderRadius: 29, borderWidth: StyleSheet.hairlineWidth, padding: 25, alignItems: 'center' }, icon: { width: 64, height: 64, borderRadius: 22, alignItems: 'center', justifyContent: 'center' }, title: { marginTop: 18, fontSize: 24, fontWeight: '900' }, body: { marginTop: 9, textAlign: 'center', fontSize: 12.5, lineHeight: 19, fontWeight: '600' }, hint: { marginTop: 13, textAlign: 'center', fontSize: 10.5, lineHeight: 16, fontWeight: '700' }, button: { marginTop: 22, minHeight: 48, width: '100%', borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }, buttonText: { color: '#FFFFFF', fontSize: 11.5, fontWeight: '900' } });
