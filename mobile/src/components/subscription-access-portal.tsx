import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { NinouBackground } from '@/components/ninou-background';
import type { FamilySubscription } from '@/services/firebase';
import { useNinouAuth } from '@/state/auth-context';
import { useNinouTheme } from '@/theme/tokens';

const planLabels: Record<string, string> = {
  trial: 'Período de teste',
  premium: 'Plano Premium',
  courtesy: 'Acesso cortesia',
  suspended: 'Acesso suspenso',
};

export function SubscriptionAccessPortal({ subscription, checking, onRetry }: { subscription: FamilySubscription; checking: boolean; onRetry: () => void }) {
  const { colors, isDark } = useNinouTheme();
  const { user, signOut } = useNinouAuth();
  const suspended = subscription.plan === 'suspended' || subscription.status === 'suspended';
  const date = subscription.validUntil ? new Date(subscription.validUntil).toLocaleDateString('pt-BR') : '';
  const foreground = isDark ? '#FFF9FF' : '#2F2843';
  const muted = isDark ? '#D8CFE8' : '#625875';
  const cardBackground = isDark ? '#1A1230' : '#FFF9F3';
  const elevatedBackground = isDark ? '#2B2045' : '#F3EAF4';
  const contact = () => Linking.openURL(`https://wa.me/5521981904591?text=${encodeURIComponent(`Olá! Preciso revisar o acesso da minha família no Ninou. Conta: ${user?.email || ''}`)}`);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <NinouBackground intense />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={[styles.card, { backgroundColor: cardBackground, borderColor: isDark ? '#4B386D' : colors.border, shadowColor: isDark ? '#000' : colors.primary }]}>
          <LinearGradient pointerEvents="none" colors={isDark ? ['rgba(149,119,255,0.24)', 'rgba(97,225,191,0.04)'] : ['rgba(117,88,232,0.13)', 'rgba(53,185,151,0.04)']} style={StyleSheet.absoluteFill} />
          <View style={[styles.iconWrap, { backgroundColor: isDark ? '#342557' : colors.primarySoft, borderColor: `${colors.primary}77` }]}>
            <Ionicons name={suspended ? 'pause-circle-outline' : 'time-outline'} size={39} color={colors.primary} />
          </View>
          <Text style={[styles.kicker, { color: colors.primary }]}>{suspended ? 'ACESSO PAUSADO' : 'PERÍODO ENCERRADO'}</Text>
          <Text
            numberOfLines={2}
            adjustsFontSizeToFit
            minimumFontScale={0.9}
            lineBreakStrategyIOS="push-out"
            style={[styles.title, { color: foreground }]}>
            {suspended ? 'Acesso pausado' : 'Acesso encerrado'}
          </Text>
          <Text style={[styles.body, { color: muted }]}>Seus registros continuam preservados. Renove o acesso para retomar a rotina exatamente de onde parou.</Text>

          <View style={styles.infoGrid}>
            <View style={[styles.infoCard, { backgroundColor: elevatedBackground, borderColor: isDark ? '#4B386D' : colors.border }]}>
              <View style={[styles.infoIcon, { backgroundColor: colors.primarySoft }]}><Ionicons name="diamond-outline" size={17} color={colors.primary} /></View>
              <View style={styles.infoCopy}><Text style={[styles.infoLabel, { color: muted }]}>PLANO</Text><Text style={[styles.infoValue, { color: foreground }]}>{planLabels[subscription.plan] || 'Acesso da família'}</Text></View>
            </View>
            <View style={[styles.infoCard, { backgroundColor: elevatedBackground, borderColor: isDark ? '#4B386D' : colors.border }]}>
              <View style={[styles.infoIcon, { backgroundColor: colors.primarySoft }]}><Ionicons name="calendar-outline" size={17} color={colors.primary} /></View>
              <View style={styles.infoCopy}><Text style={[styles.infoLabel, { color: muted }]}>SITUAÇÃO</Text><Text style={[styles.infoValue, { color: foreground }]}>{suspended ? 'Revisão necessária' : date ? `Encerrado em ${date}` : 'Período encerrado'}</Text></View>
            </View>
          </View>

          <Pressable disabled={checking} onPress={onRetry} style={[styles.primary, { backgroundColor: colors.primary }, checking && styles.disabled]}>
            <Ionicons name="refresh" size={19} color="#FFF" />
            <Text style={styles.primaryText}>{checking ? 'Verificando…' : 'Verificar novamente'}</Text>
          </Pressable>
          <Pressable onPress={() => void contact()} style={[styles.secondary, { backgroundColor: elevatedBackground, borderColor: isDark ? '#4B386D' : colors.border }]}>
            <Ionicons name="logo-whatsapp" size={19} color={colors.accent} />
            <Text style={[styles.secondaryText, { color: foreground }]}>Falar com atendimento</Text>
          </Pressable>
          <Pressable onPress={() => void signOut()} style={styles.signOut}><Text style={[styles.signOutText, { color: muted }]}>Sair da conta</Text></Pressable>
          <View style={[styles.preserve, { backgroundColor: isDark ? '#2A2245' : colors.primarySoft }]}><Ionicons name="shield-checkmark-outline" size={18} color={colors.primary} /><Text style={[styles.preserveText, { color: foreground }]}>Nenhum registro é apagado enquanto o acesso estiver pausado.</Text></View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scrollContent: { width: '100%', maxWidth: 490, minHeight: '100%', alignSelf: 'center', justifyContent: 'center', padding: 20 },
  card: { width: '100%', borderRadius: 31, borderWidth: StyleSheet.hairlineWidth, padding: 24, alignItems: 'center', overflow: 'hidden', shadowOpacity: 0.3, shadowRadius: 28, shadowOffset: { width: 0, height: 14 }, elevation: 15 },
  iconWrap: { width: 78, height: 78, borderRadius: 26, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  kicker: { marginTop: 20, fontSize: 10.5, fontWeight: '900', letterSpacing: 1.8, textAlign: 'center' },
  title: { width: '100%', maxWidth: 380, marginTop: 8, fontSize: 34, lineHeight: 39, fontWeight: '900', letterSpacing: -1.15, textAlign: 'center' },
  body: { maxWidth: 370, marginTop: 13, fontSize: 14.5, lineHeight: 22, fontWeight: '700', textAlign: 'center' },
  infoGrid: { width: '100%', marginTop: 22, gap: 9 },
  infoCard: { minHeight: 82, borderRadius: 19, borderWidth: StyleSheet.hairlineWidth, padding: 13, flexDirection: 'row', alignItems: 'center', gap: 11 },
  infoIcon: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  infoCopy: { flex: 1 },
  infoLabel: { fontSize: 9.5, fontWeight: '900', letterSpacing: 1.3 },
  infoValue: { marginTop: 5, fontSize: 15, lineHeight: 20, fontWeight: '900' },
  primary: { width: '100%', minHeight: 55, marginTop: 20, borderRadius: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  primaryText: { color: '#FFF', fontSize: 13.5, fontWeight: '900' },
  secondary: { width: '100%', minHeight: 53, marginTop: 10, borderRadius: 18, borderWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  secondaryText: { fontSize: 13, fontWeight: '900' },
  signOut: { minHeight: 48, paddingHorizontal: 18, alignItems: 'center', justifyContent: 'center' },
  signOutText: { fontSize: 12, fontWeight: '850' },
  preserve: { width: '100%', minHeight: 56, borderRadius: 17, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', gap: 9 },
  preserveText: { flex: 1, fontSize: 10.5, lineHeight: 16, fontWeight: '800' },
  disabled: { opacity: 0.55 },
});
