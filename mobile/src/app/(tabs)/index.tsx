import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState } from 'react';
import { Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ActionArt } from '@/components/action-art';
import { NinouCard } from '@/components/ninou-screen';
import { RoutineOrbit } from '@/components/routine-orbit';
import { NinouAppHeader } from '@/components/ninou-app-header';
import { NinouBackground } from '@/components/ninou-background';
import { formatDuration, formatTime, getPrimaryAction, getTodaySummary, recordConfig, type RecordType } from '@/domain/routine';
import { useRoutine } from '@/state/routine-context';
import { getBabyAgeText, useBabyProfile } from '@/state/profile-context';
import { radius, spacing, useNinouTheme } from '@/theme/tokens';
import { useFamilyPreferences } from '@/state/preferences-context';

const quickTypes: RecordType[] = ['amamentacao', 'fralda', 'mamadeira', 'medicamento'];

export default function TodayScreen() {
  const { colors, isDark } = useNinouTheme();
  const { state, now, beginRoutine, runPrimaryAction, undoLastAction } = useRoutine();
  const { profile } = useBabyProfile();
  const { preferences, updatePreferences } = useFamilyPreferences();
  const [caregiverOpen, setCaregiverOpen] = useState(false);
  const [caregiverName, setCaregiverName] = useState(preferences.caregiverName);
  const [caregiverRelation, setCaregiverRelation] = useState(preferences.caregiverRelation);
  const primaryAction = getPrimaryAction(state, now);
  const summary = getTodaySummary(state, now);
  const latest = [...state.events].sort((a, b) => b.start - a.start)[0];

  const openRecord = (type?: RecordType) => {
    void Haptics.selectionAsync();
    router.push(type ? { pathname: '/registrar', params: { type } } : '/registrar');
  };

  const getLast = (types: RecordType[]) => [...state.events].reverse().find((event) => types.includes(event.type));
  const lastBottle = getLast(['mamadeira']);
  const lastDiaper = getLast(['fralda']);
  const awakeMs = state.mode === 'awake' && state.activeStartedAt ? Math.max(0, now - state.activeStartedAt) : 0;
  const wakeWindowMs = profile.wakeWindowMinutes * 60000;
  const wakeOverdueMs = Math.max(0, awakeMs - wakeWindowMs);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top']}>
      <NinouBackground />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <NinouAppHeader />

        <View style={styles.topline}>
          <Text style={[styles.toplineText, { color: colors.textMuted }]} numberOfLines={1}>{getBabyAgeText(profile.birthDate)}</Text>
          <Pressable onPress={() => router.push('/perfil')} style={[styles.profileButton, { backgroundColor: colors.surfaceElevated }]}><Text style={[styles.profileButtonText, { color: colors.text }]}>Perfil</Text></Pressable>
        </View>

        <NinouCard style={styles.caregiverCard}>
          <View style={[styles.caregiverAvatar, { backgroundColor: colors.primarySoft }]}><Text style={[styles.caregiverInitial, { color: colors.primary }]}>{(preferences.caregiverName || 'F').charAt(0).toUpperCase()}</Text></View>
          <View style={styles.caregiverCopy}><Text style={[styles.caregiverKicker, { color: colors.textMuted }]}>CUIDANDO AGORA</Text><Text style={[styles.caregiverName, { color: colors.text }]}>{preferences.caregiverName || 'Identifique este aparelho'}</Text><Text style={[styles.caregiverRelation, { color: colors.textMuted }]}>{preferences.caregiverName ? preferences.caregiverRelation : 'Os registros mostrarão quem cuidou do bebê.'}</Text></View>
          <Pressable onPress={() => { setCaregiverName(preferences.caregiverName); setCaregiverRelation(preferences.caregiverRelation); setCaregiverOpen(true); }} style={[styles.changeCaregiver, { backgroundColor: colors.surfaceElevated }]}><Text style={[styles.changeText, { color: colors.primary }]}>Trocar</Text></Pressable>
        </NinouCard>

        <RoutineOrbit state={state} now={now} />

        {state.mode === 'idle' ? (
          <View style={styles.startChoice}>
            <Pressable onPress={() => beginRoutine('awake')} style={({ pressed }) => [styles.startButton, { backgroundColor: colors.surface, borderColor: colors.border }, pressed && styles.pressed]}>
              <ActionArt type="acordou" size={52} />
              <Text style={[styles.startText, { color: colors.text }]}>Acordou / acordado desde agora</Text>
            </Pressable>
            <Pressable onPress={() => beginRoutine('sleeping')} style={({ pressed }) => [styles.startButton, { backgroundColor: colors.surface, borderColor: colors.border }, pressed && styles.pressed]}>
              <ActionArt type="sono" size={52} />
              <Text style={[styles.startText, { color: colors.text }]}>Está dormindo desde agora</Text>
            </Pressable>
            <Pressable onPress={() => beginRoutine('awake')} style={({ pressed }) => [styles.startButton, { backgroundColor: colors.surface, borderColor: colors.border }, pressed && styles.pressed]}>
              <ActionArt type="acordou" size={52} />
              <Text style={[styles.startText, { color: colors.text }]}>Começar agora</Text>
            </Pressable>
          </View>
        ) : primaryAction ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => { void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); runPrimaryAction(); }}
            style={({ pressed }) => [styles.primaryAction, { borderColor: `${colors.accent}88` }, pressed && styles.pressed]}>
            <LinearGradient colors={isDark ? ['#B8F2D7', '#8CDEBF'] : ['#7558E8', '#9A67ED']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
            <ActionArt type={primaryAction.type} size={58} />
            <Text style={[styles.primaryTitle, { color: isDark ? '#172A24' : '#FFFFFF' }]}>{primaryAction.label}</Text>
          </Pressable>
        ) : null}

        {latest ? <View style={[styles.lastAction, { backgroundColor: colors.surface, borderColor: colors.border }]}><View style={styles.lastActionCopy}><Text style={[styles.lastKicker, { color: colors.textMuted }]}>ÚLTIMA AÇÃO</Text><Text style={[styles.lastTitle, { color: colors.text }]}>{recordConfig[latest.type].title} · {formatTime(latest.start)}</Text></View><Pressable onPress={() => router.push('/diario')} style={styles.lastButton}><Text style={[styles.lastButtonText, { color: colors.primary }]}>Corrigir</Text></Pressable><Pressable onPress={undoLastAction} style={styles.lastButton}><Text style={[styles.lastButtonText, { color: colors.danger }]}>Desfazer</Text></Pressable></View> : null}

        <NinouCard>
          <View style={styles.cardHead}>
            <View><Text style={[styles.cardKicker, { color: colors.primary }]}>Resumo do dia</Text><Text style={[styles.cardTitle, { color: colors.text }]}>Hoje com {profile.name || 'o bebê'}</Text></View>
            <Pressable onPress={() => router.push('/diario')}><Text style={[styles.link, { color: colors.primary }]}>Ver diário</Text></Pressable>
          </View>
          <View style={styles.overviewGrid}>
            <OverviewItem label="Estado atual" value={state.mode === 'sleeping' ? `Dormindo há ${formatDuration(now - (state.activeStartedAt || now))}` : state.mode === 'awake' ? `Acordado há ${formatDuration(awakeMs)}` : 'Ainda não iniciado'} />
            <OverviewItem label="Sono total" value={formatDuration(summary.sleepMs)} />
            <OverviewItem label="Mamadeiras" value={String(state.events.filter((event) => event.type === 'mamadeira').length)} />
            <OverviewItem label="Fraldas" value={String(summary.diapers)} />
            <OverviewItem label="Última mamadeira" value={lastBottle ? `${lastBottle.amountMl || 0} ml • ${formatTime(lastBottle.start)}` : 'Sem registro'} />
            <OverviewItem label="Última fralda" value={lastDiaper ? `${lastDiaper.detail || 'Registrada'} • ${formatTime(lastDiaper.start)}` : 'Sem registro'} />
          </View>
          <Text style={[styles.overviewInsight, { color: colors.textMuted }]}>{awakeMs > wakeWindowMs ? `${profile.name || 'O bebê'} está acordado há ${formatDuration(awakeMs)}. Talvez seja hora de observar sinais de sono.` : latest ? 'A rotina de hoje está sendo atualizada a cada cuidado.' : 'Faça o primeiro registro para o Ninou montar sugestões e resumo do dia.'}</Text>
        </NinouCard>

        <NinouCard style={{ backgroundColor: colors.primarySoft }}>
          <Text style={[styles.insightKicker, { color: colors.primary }]}>💡 Assistente Ninou</Text>
          <Text style={[styles.insightTitle, { color: colors.text }]}>{latest ? 'Rotina atualizada' : 'Começando a aprender a rotina'}</Text>
          <Text style={[styles.insightText, { color: colors.textMuted }]}>
            {latest ? `Último cuidado: ${recordConfig[latest.type].title}, às ${formatTime(latest.start)}.` : 'Registre sono, mamadas e fraldas para o Ninou mostrar observações úteis.'}
          </Text>
        </NinouCard>

        {state.mode === 'awake' ? (
          <NinouCard style={{ backgroundColor: colors.surfaceElevated }}>
            <Text style={[styles.insightKicker, { color: colors.accent }]}>🌿 Lembrete gentil</Text>
            <Text style={[styles.insightTitle, { color: colors.text }]}>{profile.name || 'O bebê'} está acordado há {formatDuration(awakeMs)}</Text>
            <Text style={[styles.insightText, { color: colors.textMuted }]}>Talvez seja um bom momento para observar sinais de sono. Este é só um lembrete gentil, sem diagnóstico.</Text>
          </NinouCard>
        ) : null}

        <NinouCard>
          <Text style={[styles.cardKicker, { color: colors.textMuted }]}>Janela acordado</Text>
          <Text style={[styles.cardTitle, { color: colors.text }]}>{wakeOverdueMs > 0 ? 'Pode ser hora de preparar a soneca' : 'Dentro da janela de referência'}</Text>
          <Text style={[styles.cardBody, { color: colors.textMuted }]}>{wakeOverdueMs > 0 ? `Já passou da janela de referência em ${formatDuration(wakeOverdueMs)}. Sem pressa: observe os sinais do bebê.` : `Referência atual: ${profile.wakeWindowMinutes} minutos. Ajuste no Perfil conforme a rotina da família.`}</Text>
        </NinouCard>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>Registre em poucos toques</Text>
        <View style={styles.quickGrid}>
          {quickTypes.map((type) => (
            <Pressable key={type} onPress={() => openRecord(type)} style={({ pressed }) => [styles.quickCard, { backgroundColor: colors.surface, borderColor: colors.border }, pressed && styles.pressed]}>
              <ActionArt type={type} size={68} />
              <View style={styles.quickCopy}><Text style={[styles.quickTitle, { color: colors.text }]}>{recordConfig[type].title}</Text><Text style={[styles.quickHint, { color: colors.textMuted }]}>{recordConfig[type].hint}</Text></View>
            </Pressable>
          ))}
        </View>

        <NinouCard>
          <View style={styles.cardHead}>
            <View><Text style={[styles.cardKicker, { color: colors.textMuted }]}>Próxima soneca</Text><Text style={[styles.cardTitle, { color: colors.text }]}>{state.mode === 'awake' ? 'Janela em andamento' : 'Aguardando'}</Text></View>
            <View style={[styles.miniRing, { borderColor: colors.primary }]}><Text style={[styles.miniRingText, { color: colors.primary }]}>70</Text></View>
          </View>
          <Text style={[styles.cardBody, { color: colors.textMuted }]}>O acompanhamento usa os registros da rotina e não substitui orientação pediátrica.</Text>
        </NinouCard>

        <View style={styles.summaryGrid}>
          <SummaryItem label="Sono" value={formatDuration(summary.sleepMs)} />
          <SummaryItem label="Acordado" value={state.mode === 'awake' && state.activeStartedAt ? formatDuration(now - state.activeStartedAt) : '—'} />
          <SummaryItem label="Mamadas" value={String(summary.feeding)} />
          <SummaryItem label="Fraldas" value={String(summary.diapers)} />
          <SummaryItem label="Medicamentos" value={String(summary.medicine)} />
        </View>
      </ScrollView>

      <Modal visible={caregiverOpen} transparent animationType="slide" onRequestClose={() => setCaregiverOpen(false)}><View style={styles.modalBackdrop}><View style={[styles.caregiverModal, { backgroundColor: colors.surface, borderColor: colors.border }]}><View style={[styles.modalHandle, { backgroundColor: colors.border }]} /><Text style={[styles.modalKicker, { color: colors.primary }]}>CUIDADOR DESTE APARELHO</Text><Text style={[styles.modalTitle, { color: colors.text }]}>Quem está cuidando agora?</Text><Text style={[styles.modalText, { color: colors.textMuted }]}>Essa identificação fica neste aparelho e acompanha os próximos registros.</Text><Text style={[styles.modalLabel, { color: colors.text }]}>Nome</Text><TextInput value={caregiverName} onChangeText={setCaregiverName} placeholder="Ex.: Felipe" placeholderTextColor={colors.textMuted} style={[styles.modalInput, { color: colors.text, backgroundColor: colors.surfaceElevated, borderColor: colors.border }]} /><Text style={[styles.modalLabel, { color: colors.text }]}>Relação com o bebê</Text><TextInput value={caregiverRelation} onChangeText={setCaregiverRelation} placeholder="Pai, mãe, avó, babá…" placeholderTextColor={colors.textMuted} style={[styles.modalInput, { color: colors.text, backgroundColor: colors.surfaceElevated, borderColor: colors.border }]} /><View style={styles.modalActions}><Pressable onPress={() => setCaregiverOpen(false)} style={[styles.modalCancel, { borderColor: colors.border }]}><Text style={[styles.modalCancelText, { color: colors.text }]}>Cancelar</Text></Pressable><Pressable disabled={!caregiverName.trim()} onPress={() => { updatePreferences({ caregiverName: caregiverName.trim(), caregiverRelation: caregiverRelation.trim() || 'Responsável' }); setCaregiverOpen(false); }} style={[styles.modalSave, { backgroundColor: colors.primary }, !caregiverName.trim() && styles.disabled]}><Text style={styles.modalSaveText}>Salvar identificação</Text></Pressable></View></View></View></Modal>
    </SafeAreaView>
  );

  function OverviewItem({ label, value }: { label: string; value: string }) {
    return <View style={[styles.overviewItem, { backgroundColor: colors.surfaceElevated }]}><Text style={[styles.overviewLabel, { color: colors.textMuted }]}>{label}</Text><Text style={[styles.overviewValue, { color: colors.text }]} numberOfLines={2}>{value}</Text></View>;
  }

  function SummaryItem({ label, value }: { label: string; value: string }) {
    return <View style={[styles.summaryItem, { backgroundColor: colors.surface, borderColor: colors.border }]}><Text style={[styles.summaryLabel, { color: colors.textMuted }]}>{label}</Text><Text style={[styles.summaryValue, { color: colors.text }]}>{value}</Text></View>;
  }
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  content: { width: '100%', maxWidth: 540, alignSelf: 'center', paddingHorizontal: 14, paddingTop: Platform.OS === 'web' ? 38 : spacing.sm, paddingBottom: 140, gap: 14 },
  topline: { minHeight: 46, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.md, paddingHorizontal: 3 },
  toplineText: { flex: 1, fontSize: 12, fontWeight: '800', letterSpacing: 0.45, textTransform: 'uppercase' },
  profileButton: { minHeight: 42, borderRadius: 15, paddingHorizontal: spacing.lg, alignItems: 'center', justifyContent: 'center' },
  profileButtonText: { fontSize: 13, fontWeight: '900' },
  caregiverCard: { minHeight: 78, padding: 11, flexDirection: 'row', alignItems: 'center', gap: 10 }, caregiverAvatar: { width: 48, height: 48, borderRadius: 17, alignItems: 'center', justifyContent: 'center' }, caregiverInitial: { fontSize: 20, fontWeight: '900' }, caregiverCopy: { flex: 1 }, caregiverKicker: { fontSize: 8.5, fontWeight: '900', letterSpacing: 1 }, caregiverName: { marginTop: 2, fontSize: 14, fontWeight: '900' }, caregiverRelation: { marginTop: 2, fontSize: 9.5, lineHeight: 13 }, changeCaregiver: { minHeight: 38, borderRadius: 13, paddingHorizontal: 11, alignItems: 'center', justifyContent: 'center' }, changeText: { fontSize: 11, fontWeight: '900' },
  link: { fontSize: 13, fontWeight: '800' },
  startChoice: { gap: spacing.md },
  startButton: { minHeight: 78, borderRadius: radius.lg, borderWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', padding: spacing.md, gap: spacing.md },
  startText: { flex: 1, fontSize: 15, lineHeight: 20, fontWeight: '800' },
  primaryAction: { minHeight: 76, borderRadius: radius.lg, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: spacing.xl, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.md, overflow: 'hidden' },
  primaryTitle: { fontSize: 16, fontWeight: '900' },
  pressed: { opacity: 0.72, transform: [{ scale: 0.985 }] },
  lastAction: { minHeight: 66, borderRadius: 20, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', gap: 8 }, lastActionCopy: { flex: 1 }, lastKicker: { fontSize: 8, fontWeight: '900', letterSpacing: 1 }, lastTitle: { marginTop: 3, fontSize: 12, fontWeight: '900' }, lastButton: { minHeight: 38, justifyContent: 'center', paddingHorizontal: 5 }, lastButtonText: { fontSize: 10.5, fontWeight: '900' },
  cardHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.md },
  cardKicker: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.6 },
  cardTitle: { fontSize: 18, fontWeight: '900', marginTop: 2 },
  cardBody: { marginTop: spacing.md, fontSize: 13, lineHeight: 19 },
  overviewGrid: { marginTop: spacing.lg, flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  overviewItem: { width: '48%', flexGrow: 1, minHeight: 80, borderRadius: radius.md, padding: spacing.md, gap: 5 },
  overviewLabel: { fontSize: 11, fontWeight: '700' },
  overviewValue: { fontSize: 14, lineHeight: 18, fontWeight: '800' },
  overviewInsight: { marginTop: spacing.md, fontSize: 13, lineHeight: 19, fontWeight: '600' },
  insightKicker: { fontSize: 12, fontWeight: '800' },
  insightTitle: { fontSize: 17, fontWeight: '900', marginTop: spacing.xs },
  insightText: { fontSize: 13, lineHeight: 19, marginTop: spacing.xs },
  sectionTitle: { fontSize: 19, fontWeight: '900' },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  quickCard: { width: '47%', flexGrow: 1, minHeight: 126, borderRadius: radius.lg, borderWidth: StyleSheet.hairlineWidth, padding: spacing.md, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  quickCopy: { flex: 1, gap: 3 },
  quickTitle: { fontSize: 14, fontWeight: '900' },
  quickHint: { fontSize: 11, lineHeight: 15 },
  miniRing: { width: 54, height: 54, borderRadius: 27, borderWidth: 5, alignItems: 'center', justifyContent: 'center' },
  miniRingText: { fontSize: 14, fontWeight: '900' },
  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  summaryItem: { width: '31%', flexGrow: 1, minHeight: 78, borderRadius: radius.md, borderWidth: StyleSheet.hairlineWidth, padding: spacing.md, gap: spacing.xs },
  summaryLabel: { fontSize: 11, fontWeight: '700' },
  summaryValue: { fontSize: 17, fontWeight: '900' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(6,3,13,0.58)', justifyContent: 'flex-end' }, caregiverModal: { width: '100%', maxWidth: 540, alignSelf: 'center', borderTopLeftRadius: 30, borderTopRightRadius: 30, borderWidth: StyleSheet.hairlineWidth, padding: 20, paddingBottom: 30 }, modalHandle: { width: 44, height: 5, borderRadius: 3, alignSelf: 'center', marginBottom: 18 }, modalKicker: { fontSize: 9.5, fontWeight: '900', letterSpacing: 1.2 }, modalTitle: { marginTop: 6, fontSize: 25, fontWeight: '900' }, modalText: { marginTop: 7, fontSize: 12, lineHeight: 18 }, modalLabel: { marginTop: 15, marginBottom: 7, fontSize: 11.5, fontWeight: '900' }, modalInput: { minHeight: 50, borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 13, fontSize: 14 }, modalActions: { flexDirection: 'row', gap: 9, marginTop: 20 }, modalCancel: { flex: 1, minHeight: 52, borderRadius: 17, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center' }, modalCancelText: { fontSize: 12.5, fontWeight: '900' }, modalSave: { flex: 1.5, minHeight: 52, borderRadius: 17, alignItems: 'center', justifyContent: 'center' }, modalSaveText: { color: '#FFF', fontSize: 12.5, fontWeight: '900' }, disabled: { opacity: 0.45 },
});
