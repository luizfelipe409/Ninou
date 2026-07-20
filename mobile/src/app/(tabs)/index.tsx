import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useMemo } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ActionArt } from '@/components/action-art';
import { NinouCard } from '@/components/ninou-screen';
import { RoutineOrbit } from '@/components/routine-orbit';
import { NinouAppHeader } from '@/components/ninou-app-header';
import { NinouBackground } from '@/components/ninou-background';
import { formatDuration, formatTime, getPrimaryAction, getTodayAwakeMs, getTodaySummary, recordConfig, type RecordType, type RoutineEvent } from '@/domain/routine';
import { getLocalDateId } from '@/services/firebase';
import { useRoutine } from '@/state/routine-context';
import { getBabyAgeText, useBabyProfile } from '@/state/profile-context';
import { radius, spacing, useNinouTheme } from '@/theme/tokens';

const quickTypes: RecordType[] = ['amamentacao', 'fralda', 'mamadeira', 'medicamento'];

export default function TodayScreen() {
  const { colors, isDark } = useNinouTheme();
  const { state, history, now, canUndo, beginRoutine, runPrimaryAction, undoLastAction } = useRoutine();
  const { profile } = useBabyProfile();
  const orbitState = useMemo(() => {
    const referenceTime = now || Date.now();
    const previousDate = new Date(referenceTime);
    previousDate.setDate(previousDate.getDate() - 1);
    const previousState = history[getLocalDateId(previousDate.getTime())];
    const events = new Map<string, RoutineEvent>();
    previousState?.events.forEach((event) => events.set(event.id, event));
    state.events.forEach((event) => events.set(event.id, event));
    return { ...state, events: [...events.values()].sort((left, right) => left.start - right.start) };
  }, [history, now, state]);
  const primaryAction = getPrimaryAction(state, now);
  const summary = getTodaySummary(orbitState, now);
  const latest = [...state.events].sort((a, b) => b.start - a.start)[0];

  const openRecord = (type?: RecordType) => {
    void Haptics.selectionAsync();
    router.push(type ? { pathname: '/registrar', params: { type } } : '/registrar');
  };

  const editLatest = () => {
    if (!latest) return;
    void Haptics.selectionAsync();
    router.push({ pathname: '/diario', params: { dayId: getLocalDateId(latest.start), editEventId: latest.id, editRequest: String(Date.now()) } });
  };

  const getLast = (types: RecordType[]) => [...state.events].reverse().find((event) => types.includes(event.type));
  const lastBottle = getLast(['mamadeira']);
  const lastDiaper = getLast(['fralda']);
  const awakeMs = state.mode === 'awake' && state.activeStartedAt ? Math.max(0, now - state.activeStartedAt) : 0;
  const awakeTodayMs = getTodayAwakeMs(orbitState, now);
  const wakeWindowMs = profile.wakeWindowMinutes * 60000;
  const wakeOverdueMs = Math.max(0, awakeMs - wakeWindowMs);
  const wakeWindowApproaching = state.mode === 'awake' && awakeMs >= wakeWindowMs * 0.9;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top']}>
      <NinouBackground />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <NinouAppHeader />

        <View style={styles.topline}>
          <Text style={[styles.toplineText, { color: colors.textMuted }]} numberOfLines={1}>{getBabyAgeText(profile.birthDate)}</Text>
          <Pressable onPress={() => router.push('/perfil')} style={[styles.profileButton, { backgroundColor: colors.surfaceElevated }]}><Text style={[styles.profileButtonText, { color: colors.text }]}>Perfil</Text></Pressable>
        </View>

        <RoutineOrbit state={orbitState} now={now} />

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

        {latest ? <View style={[styles.lastAction, { backgroundColor: colors.surface, borderColor: colors.border }]}><View style={styles.lastActionCopy}><Text style={[styles.lastKicker, { color: colors.textMuted }]}>ÚLTIMA AÇÃO</Text><Text style={[styles.lastTitle, { color: colors.text }]}>{recordConfig[latest.type].title} · {formatTime(latest.start)}</Text></View><Pressable onPress={editLatest} style={styles.lastButton}><Text style={[styles.lastButtonText, { color: colors.primary }]}>Editar</Text></Pressable><Pressable disabled={!canUndo} onPress={() => { void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning); undoLastAction(); }} style={[styles.lastButton, !canUndo && styles.lastButtonDisabled]}><Text style={[styles.lastButtonText, { color: colors.danger }]}>Desfazer</Text></Pressable></View> : null}

        <NinouCard>
          <View style={styles.cardHead}>
            <View><Text style={[styles.cardKicker, { color: colors.primary }]}>Resumo do dia</Text><Text style={[styles.cardTitle, { color: colors.text }]}>Hoje com {profile.name || 'o bebê'}</Text></View>
            <Pressable onPress={() => router.push('/diario')}><Text style={[styles.link, { color: colors.primary }]}>Ver diário</Text></Pressable>
          </View>
          <View style={styles.overviewGrid}>
            <OverviewItem label="Estado atual" value={state.mode === 'sleeping' ? `Dormindo há ${formatDuration(now - (state.activeStartedAt || now))}` : state.mode === 'awake' ? `Acordado há ${formatDuration(awakeMs)}` : 'Ainda não iniciado'} />
            <OverviewItem label="Sono total" value={formatDuration(summary.sleepMs)} />
            <OverviewItem label="Acordado hoje" value={formatDuration(awakeTodayMs)} />
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
            <Text style={[styles.insightTitle, { color: colors.text }]}>{wakeWindowApproaching ? `${profile.name || 'O bebê'} está acordado há ${formatDuration(awakeMs)}` : 'Dentro da referência gentil'}</Text>
            <Text style={[styles.insightText, { color: colors.textMuted }]}>{wakeWindowApproaching ? `A referência escolhida pela família é de ${profile.wakeWindowMinutes} minutos. Observe os sinais com calma, sem diagnóstico.` : `Referência atual: ${profile.wakeWindowMinutes} minutos. O aviso muda conforme o tempo acordado avança.`}</Text>
          </NinouCard>
        ) : null}

        <NinouCard>
          <Text style={[styles.cardKicker, { color: colors.textMuted }]}>Janela acordado</Text>
          <Text style={[styles.cardTitle, { color: colors.text }]}>{state.mode === 'sleeping' ? 'Pausada durante o sono' : state.mode === 'idle' ? 'Aguardando o início da rotina' : wakeOverdueMs > 0 ? 'Pode ser hora de preparar a soneca' : 'Dentro da janela de referência'}</Text>
          <Text style={[styles.cardBody, { color: colors.textMuted }]}>{state.mode === 'sleeping' ? `A referência de ${profile.wakeWindowMinutes} minutos começa novamente quando o bebê acordar.` : state.mode === 'idle' ? `Referência atual: ${profile.wakeWindowMinutes} minutos. O acompanhamento começa ao registrar que o bebê acordou.` : wakeOverdueMs > 0 ? `Já passou da janela de referência em ${formatDuration(wakeOverdueMs)}. Sem pressa: observe os sinais do bebê.` : `Referência atual: ${profile.wakeWindowMinutes} minutos. Ajuste no Perfil conforme a rotina da família.`}</Text>
        </NinouCard>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>Registre em poucos toques</Text>
        <View style={styles.quickGrid}>
          {quickTypes.map((type) => (
            <Pressable key={type} onPress={() => openRecord(type)} style={({ pressed }) => [styles.quickCard, { backgroundColor: colors.surface, borderColor: colors.border }, pressed && styles.pressed]}>
              <ActionArt type={type} size={54} />
              <View style={styles.quickCopy}><Text adjustsFontSizeToFit minimumFontScale={0.82} numberOfLines={1} style={[styles.quickTitle, { color: colors.text }]}>{recordConfig[type].title}</Text><Text numberOfLines={2} style={[styles.quickHint, { color: colors.textMuted }]}>{recordConfig[type].hint}</Text></View>
            </Pressable>
          ))}
        </View>

        <NinouCard>
          <View style={styles.cardHead}>
            <View><Text style={[styles.cardKicker, { color: colors.textMuted }]}>Próxima soneca</Text><Text style={[styles.cardTitle, { color: colors.text }]}>{state.mode === 'awake' ? 'Janela em andamento' : 'Aguardando'}</Text></View>
            <View style={[styles.miniRing, { borderColor: colors.primary }]}><Text style={[styles.miniRingText, { color: colors.primary }]}>{profile.wakeWindowMinutes}</Text></View>
          </View>
          <Text style={[styles.cardBody, { color: colors.textMuted }]}>O acompanhamento usa os registros da rotina e não substitui orientação pediátrica.</Text>
        </NinouCard>

        <View style={styles.summaryGrid}>
          <SummaryItem label="Sono" value={formatDuration(summary.sleepMs)} />
          <SummaryItem label="Acordado" value={formatDuration(awakeTodayMs)} />
          <SummaryItem label="Mamadas" value={String(summary.feeding)} />
          <SummaryItem label="Fraldas" value={String(summary.diapers)} />
          <SummaryItem label="Medicamentos" value={String(summary.medicine)} />
        </View>
      </ScrollView>

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
  link: { fontSize: 13, fontWeight: '800' },
  startChoice: { gap: spacing.md },
  startButton: { minHeight: 78, borderRadius: radius.lg, borderWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', padding: spacing.md, gap: spacing.md },
  startText: { flex: 1, fontSize: 15, lineHeight: 20, fontWeight: '800' },
  primaryAction: { minHeight: 76, borderRadius: radius.lg, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: spacing.xl, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.md, overflow: 'hidden' },
  primaryTitle: { fontSize: 16, fontWeight: '900' },
  pressed: { opacity: 0.72, transform: [{ scale: 0.985 }] },
  lastAction: { minHeight: 66, borderRadius: 20, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', gap: 8 }, lastActionCopy: { flex: 1 }, lastKicker: { fontSize: 8, fontWeight: '900', letterSpacing: 1 }, lastTitle: { marginTop: 3, fontSize: 12, fontWeight: '900' }, lastButton: { minHeight: 38, justifyContent: 'center', paddingHorizontal: 5 }, lastButtonDisabled: { opacity: 0.35 }, lastButtonText: { fontSize: 10.5, fontWeight: '900' },
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
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  quickCard: { width: '47%', flexGrow: 1, minHeight: 100, borderRadius: 22, borderWidth: StyleSheet.hairlineWidth, padding: 10, flexDirection: 'row', alignItems: 'center', gap: 7 },
  quickCopy: { flex: 1, gap: 3 },
  quickTitle: { width: '100%', fontSize: 12.5, lineHeight: 15, fontWeight: '900' },
  quickHint: { fontSize: 10, lineHeight: 13 },
  miniRing: { width: 54, height: 54, borderRadius: 27, borderWidth: 5, alignItems: 'center', justifyContent: 'center' },
  miniRingText: { fontSize: 14, fontWeight: '900' },
  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  summaryItem: { width: '31%', flexGrow: 1, minHeight: 78, borderRadius: radius.md, borderWidth: StyleSheet.hairlineWidth, padding: spacing.md, gap: spacing.xs },
  summaryLabel: { fontSize: 11, fontWeight: '700' },
  summaryValue: { fontSize: 17, fontWeight: '900' },
});
