import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import { router } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ActionArt } from '@/components/action-art';
import { NinouCard } from '@/components/ninou-screen';
import { RoutineOrbit } from '@/components/routine-orbit';
import { NinouAppHeader } from '@/components/ninou-app-header';
import { NinouBackground } from '@/components/ninou-background';
import { formatDuration, formatTime, getPrimaryAction, getTodayAwakeMs, getTodaySummary, recordConfig, type RecordType, type RoutineEvent, type RoutineInitialState } from '@/domain/routine';
import { getLocalDateId } from '@/services/firebase';
import { useRoutine } from '@/state/routine-context';
import { getBabyAgeText, useBabyProfile } from '@/state/profile-context';
import { useNinouLayout } from '@/theme/layout';
import { radius, spacing, useNinouTheme } from '@/theme/tokens';

const quickTypes: RecordType[] = ['amamentacao', 'fralda', 'mamadeira', 'medicamento'];

export default function TodayScreen() {
  const { colors, isDark } = useNinouTheme();
  const { width, isDesktop, contentOffset } = useNinouLayout();
  const isWideDesktop = isDesktop && width >= 1380;
  const { state, history, now, hydrated, canUndo, canWrite, beginRoutine, deferRoutineSetup, runPrimaryAction, undoLastAction } = useRoutine();
  const { profile } = useBabyProfile();
  const [startStep, setStartStep] = useState<'state' | 'current' | null>(null);
  const [currentState, setCurrentState] = useState<RoutineInitialState>('awake');
  const [currentStateStartTime, setCurrentStateStartTime] = useState(() => new Date());
  const [pendingRecordType, setPendingRecordType] = useState<RecordType | null>(null);
  const [startError, setStartError] = useState('');
  const [transitionNotice, setTransitionNotice] = useState('');
  const autoOpenedSetupRef = useRef(false);
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
    if (!canWrite) return;
    void Haptics.selectionAsync();
    if (state.mode === 'idle') {
      setPendingRecordType(type || null);
      openStartFlow();
      return;
    }
    router.push(type ? { pathname: '/registrar', params: { type } } : '/registrar');
  };

  const editLatest = () => {
    if (!latest || !canWrite) return;
    void Haptics.selectionAsync();
    router.push({ pathname: '/diario', params: { dayId: getLocalDateId(latest.start), editEventId: latest.id, editRequest: String(Date.now()) } });
  };


  const timeToday = (value: Date) => {
    const reference = new Date();
    const selected = new Date(reference);
    selected.setHours(value.getHours(), value.getMinutes(), 0, 0);
    return selected.getTime();
  };

  const openStartFlow = () => {
    const reference = new Date();
    setCurrentState('awake');
    setCurrentStateStartTime(reference);
    setStartError('');
    setStartStep('state');
    void Haptics.selectionAsync();
  };

  const closeStartFlow = () => {
    setStartStep(null);
    setStartError('');
    setPendingRecordType(null);
  };

  useEffect(() => {
    if (
      autoOpenedSetupRef.current
      || !hydrated
      || !canWrite
      || state.mode !== 'idle'
      || state.events.length
      || state.routineStartDeferredAt
    ) return;
    autoOpenedSetupRef.current = true;
    setCurrentState('awake');
    setCurrentStateStartTime(new Date());
    setStartError('');
    setStartStep('state');
  }, [canWrite, hydrated, state.events.length, state.mode, state.routineStartDeferredAt]);

  const chooseCurrentState = (nextState: RoutineInitialState) => {
    setCurrentState(nextState);
    setCurrentStateStartTime(new Date());
    setStartError('');
    setStartStep('current');
    void Haptics.selectionAsync();
  };

  const confirmCurrentStateStart = () => {
    if (!canWrite) return;
    const reference = Date.now();
    const currentStartedAt = timeToday(currentStateStartTime);
    if (currentStartedAt > reference) {
      setStartError('O início do estado atual não pode estar no futuro.');
      return;
    }
    beginRoutine({ currentState, currentStateStartedAt: currentStartedAt });
    const nextRecord = pendingRecordType;
    setPendingRecordType(null);
    closeStartFlow();
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (nextRecord) router.push({ pathname: '/registrar', params: { type: nextRecord } });
  };

  const handlePrimaryAction = () => {
    const result = runPrimaryAction();
    if (!result.ok) {
      setTransitionNotice(result.message);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
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
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }, isDesktop && { paddingLeft: contentOffset }]} edges={['top']}>
      <NinouBackground />
      <ScrollView contentContainerStyle={[styles.content, isDesktop && styles.contentDesktop, state.breastfeedingTimer && styles.contentWithTimer]} showsVerticalScrollIndicator={false}>
        <NinouAppHeader />

        <View style={styles.topline}>
          <Text style={[styles.toplineText, { color: colors.textMuted }]} numberOfLines={1}>{getBabyAgeText(profile.birthDate)}</Text>
          {!isDesktop ? <Pressable onPress={() => router.push('/perfil')} style={[styles.profileButton, { backgroundColor: colors.surfaceElevated }]}><Text style={[styles.profileButtonText, { color: colors.text }]}>Perfil</Text></Pressable> : null}
        </View>

        <View style={[styles.heroWorkspace, isWideDesktop && styles.heroWorkspaceDesktop]}>
          <View style={[styles.orbitColumn, isWideDesktop && styles.orbitColumnDesktop]}>
            <RoutineOrbit state={orbitState} now={now} />
          </View>
          <View style={[styles.heroSide, isWideDesktop && styles.heroSideDesktop]}>
            {state.mode === 'idle' ? (
              canWrite ? <View style={[styles.startPanel, isDesktop && styles.startPanelDesktop, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.startKicker, { color: colors.primary }]}>COMEÇAR ACOMPANHAMENTO</Text>
                <Text style={[styles.startTitle, isDesktop && styles.startTitleDesktop, { color: colors.text }]}>Como {profile.name || 'o bebê'} está agora?</Text>
                <Text style={[styles.startSubtitle, isDesktop && styles.startSubtitleDesktop, { color: colors.textMuted }]}>Informe apenas o estado atual. O Ninou não criará acontecimentos anteriores automaticamente.</Text>
                <Pressable onPress={openStartFlow} style={({ pressed }) => [styles.startButton, isDesktop && styles.startButtonDesktop, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }, pressed && styles.pressed]}>
                  <ActionArt type="acordou" size={isDesktop ? 64 : 52} />
                  <View style={styles.startCopy}><Text style={[styles.startText, isDesktop && styles.startTextDesktop, { color: colors.text }]}>Informar estado atual</Text><Text style={[styles.startHint, isDesktop && styles.startHintDesktop, { color: colors.textMuted }]}>Acordado, soneca ou sono da noite.</Text></View>
                  <Ionicons name="chevron-forward" size={isDesktop ? 23 : 19} color={colors.textMuted} />
                </Pressable>
              </View> : <View style={[styles.readOnlyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}><Ionicons name="eye-outline" size={26} color={colors.primary} /><View style={styles.readOnlyCopy}><Text style={[styles.readOnlyTitle, { color: colors.text }]}>Acesso de visualização</Text><Text style={[styles.readOnlyText, { color: colors.textMuted }]}>Você pode acompanhar a rotina, mas não criar ou alterar registros.</Text></View></View>
            ) : primaryAction && canWrite ? (
              <Pressable
                accessibilityRole="button"
                onPress={handlePrimaryAction}
                style={({ pressed }) => [styles.primaryAction, isDesktop && styles.primaryActionDesktop, { borderColor: `${colors.accent}88` }, pressed && styles.pressed]}>
                <LinearGradient colors={isDark ? ['#B8F2D7', '#8CDEBF'] : ['#7558E8', '#9A67ED']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
                <ActionArt type={primaryAction.type} size={isDesktop ? 62 : 58} />
                {isDesktop ? (
                  <>
                    <View style={styles.primaryActionCopyDesktop}>
                      <Text style={[styles.primaryActionKickerDesktop, { color: isDark ? '#285D50' : 'rgba(255,255,255,0.76)' }]}>PRÓXIMA TRANSIÇÃO</Text>
                      <Text style={[styles.primaryTitle, styles.primaryTitleDesktop, { color: isDark ? '#172A24' : '#FFFFFF' }]}>{primaryAction.label}</Text>
                      <Text style={[styles.primaryActionHintDesktop, { color: isDark ? '#326D5E' : 'rgba(255,255,255,0.82)' }]}>Atualize a rotina e sincronize com toda a família.</Text>
                    </View>
                    <View style={[styles.primaryActionArrowDesktop, { backgroundColor: isDark ? 'rgba(23,42,36,0.11)' : 'rgba(255,255,255,0.16)' }]}>
                      <Ionicons name="arrow-forward" size={20} color={isDark ? '#172A24' : '#FFFFFF'} />
                    </View>
                  </>
                ) : <Text style={[styles.primaryTitle, { color: isDark ? '#172A24' : '#FFFFFF' }]}>{primaryAction.label}</Text>}
              </Pressable>
            ) : null}

            {latest ? <View style={[styles.lastAction, isDesktop && styles.lastActionDesktop, { backgroundColor: colors.surface, borderColor: colors.border }]}><View style={styles.lastActionCopy}><Text style={[styles.lastKicker, { color: colors.textMuted }]}>ÚLTIMA AÇÃO</Text><Text style={[styles.lastTitle, isDesktop && styles.lastTitleDesktop, { color: colors.text }]}>{recordConfig[latest.type].title} · {formatTime(latest.start)}</Text></View>{canWrite ? <><Pressable onPress={editLatest} style={styles.lastButton}><Text style={[styles.lastButtonText, isDesktop && styles.lastButtonTextDesktop, { color: colors.primary }]}>Editar</Text></Pressable><Pressable disabled={!canUndo} onPress={() => { void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning); undoLastAction(); }} style={[styles.lastButton, !canUndo && styles.lastButtonDisabled]}><Text style={[styles.lastButtonText, isDesktop && styles.lastButtonTextDesktop, { color: colors.danger }]}>Desfazer</Text></Pressable></> : null}</View> : null}
          </View>
        </View>

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
            <Pressable key={type} disabled={!canWrite} onPress={() => openRecord(type)} style={({ pressed }) => [styles.quickCard, { backgroundColor: colors.surface, borderColor: colors.border }, pressed && canWrite && styles.pressed, !canWrite && styles.readOnlyDisabled]}>
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

      <Modal visible={startStep !== null} transparent animationType="fade" onRequestClose={closeStartFlow}>
        <View style={styles.startBackdrop}>
          <View style={[styles.startModal, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.startModalHead}>
              <View style={[styles.startModalIcon, { backgroundColor: colors.primarySoft }]}>
                <ActionArt type={currentState === 'night' ? 'dormir' : currentState === 'nap' ? 'sono' : 'acordou'} size={58} />
              </View>
              <Pressable accessibilityLabel="Fechar início da rotina" onPress={closeStartFlow} style={[styles.startModalClose, { backgroundColor: colors.surfaceElevated }]}>
                <Ionicons name="close" size={21} color={colors.text} />
              </Pressable>
            </View>

            {startStep === 'state' ? (
              <>
                <Text style={[styles.startModalKicker, { color: colors.primary }]}>ESTADO ATUAL</Text>
                <Text style={[styles.startModalTitle, { color: colors.text }]}>Como {profile.name || 'o bebê'} está agora?</Text>
                <Text style={[styles.startModalText, { color: colors.textMuted }]}>Escolha o estado real deste momento. Nenhum histórico anterior será inventado.</Text>
                <View style={styles.currentStateChoices}>
                  <Pressable onPress={() => chooseCurrentState('awake')} style={({ pressed }) => [styles.currentStateButton, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }, pressed && styles.pressed]}>
                    <ActionArt type="acordou" size={50} />
                    <View style={styles.currentStateCopy}><Text style={[styles.currentStateTitle, { color: colors.text }]}>Acordado</Text><Text style={[styles.currentStateHint, { color: colors.textMuted }]}>Informe desde quando está acordado.</Text></View>
                    <Ionicons name="checkmark-circle-outline" size={22} color={colors.primary} />
                  </Pressable>
                  <Pressable onPress={() => chooseCurrentState('nap')} style={({ pressed }) => [styles.currentStateButton, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }, pressed && styles.pressed]}>
                    <ActionArt type="sono" size={50} />
                    <View style={styles.currentStateCopy}><Text style={[styles.currentStateTitle, { color: colors.text }]}>Tirando uma soneca</Text><Text style={[styles.currentStateHint, { color: colors.textMuted }]}>Inicie o acompanhamento do sono atual.</Text></View>
                    <Ionicons name="arrow-forward-circle-outline" size={22} color={colors.primary} />
                  </Pressable>
                  <Pressable onPress={() => chooseCurrentState('night')} style={({ pressed }) => [styles.currentStateButton, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }, pressed && styles.pressed]}>
                    <ActionArt type="dormir" size={50} />
                    <View style={styles.currentStateCopy}><Text style={[styles.currentStateTitle, { color: colors.text }]}>No sono da noite</Text><Text style={[styles.currentStateHint, { color: colors.textMuted }]}>Registre o início do período noturno.</Text></View>
                    <Ionicons name="arrow-forward-circle-outline" size={22} color={colors.primary} />
                  </Pressable>
                  <Pressable onPress={() => { deferRoutineSetup(); setPendingRecordType(null); closeStartFlow(); }} style={styles.startCancel}><Text style={[styles.startCancelText, { color: colors.textMuted }]}>Começar depois</Text></Pressable>
                </View>
              </>
            ) : null}

            {startStep === 'current' ? (
              <>
                <Text style={[styles.startModalKicker, { color: colors.primary }]}>INÍCIO DO ESTADO ATUAL</Text>
                <Text style={[styles.startModalTitle, { color: colors.text }]}>{currentState === 'awake' ? 'Desde que horas está acordado?' : currentState === 'night' ? 'Quando começou o sono da noite?' : 'Quando essa soneca começou?'}</Text>
                <Text style={[styles.startModalText, { color: colors.textMuted }]}>Use “agora” ou ajuste o horário aproximado. Ele poderá ser corrigido no Diário.</Text>
                <View style={[styles.timeCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
                  <DateTimePicker value={currentStateStartTime} mode="time" display={Platform.OS === 'ios' ? 'spinner' : 'clock'} locale="pt-BR" onValueChange={(_, value) => { setCurrentStateStartTime(value); setStartError(''); }} accentColor={colors.primary} themeVariant={isDark ? 'dark' : 'light'} />
                </View>
                {startError ? <Text style={[styles.startError, { color: colors.danger }]}>{startError}</Text> : null}
                <Pressable onPress={confirmCurrentStateStart} style={[styles.startConfirm, { backgroundColor: colors.primary }]}><Ionicons name="checkmark-circle" size={19} color="#FFF" /><Text style={styles.startConfirmText}>Confirmar desde {currentStateStartTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</Text></Pressable>
                <Pressable onPress={() => { setStartError(''); setStartStep('state'); }} style={styles.startCancel}><Text style={[styles.startCancelText, { color: colors.textMuted }]}>Voltar</Text></Pressable>
              </>
            ) : null}
          </View>
        </View>
      </Modal>

      <Modal visible={Boolean(transitionNotice)} transparent animationType="fade" onRequestClose={() => setTransitionNotice('')}>
        <View style={styles.startBackdrop}>
          <View style={[styles.transitionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.transitionIcon, { backgroundColor: `${colors.danger}18` }]}><Ionicons name="time-outline" size={34} color={colors.danger} /></View>
            <Text style={[styles.startModalKicker, { color: colors.danger }]}>AÇÃO MUITO PRÓXIMA</Text>
            <Text style={[styles.transitionTitle, { color: colors.text }]}>Evite registros acidentais</Text>
            <Text style={[styles.transitionText, { color: colors.textMuted }]}>{transitionNotice}</Text>
            <Pressable onPress={() => setTransitionNotice('')} style={[styles.startConfirm, { backgroundColor: colors.primary }]}><Text style={styles.startConfirmText}>Entendi</Text></Pressable>
            <Pressable onPress={() => { setTransitionNotice(''); router.push('/diario'); }} style={styles.startCancel}><Text style={[styles.startCancelText, { color: colors.primary }]}>Corrigir no Diário</Text></Pressable>
          </View>
        </View>
      </Modal>
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
  contentDesktop: { maxWidth: 1280, paddingHorizontal: 30, paddingTop: 28, paddingBottom: 64, gap: 20 },
  contentWithTimer: { paddingBottom: 232 },
  topline: { minHeight: 46, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.md, paddingHorizontal: 3 },
  toplineText: { flex: 1, fontSize: 12, fontWeight: '800', letterSpacing: 0.45, textTransform: 'uppercase' },
  profileButton: { minHeight: 42, borderRadius: 15, paddingHorizontal: spacing.lg, alignItems: 'center', justifyContent: 'center' },
  profileButtonText: { fontSize: 13, fontWeight: '900' },
  link: { fontSize: 13, fontWeight: '800' },
  heroWorkspace: { gap: 14 },
  heroWorkspaceDesktop: { width: '100%', maxWidth: 990, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 36 },
  orbitColumn: { alignItems: 'center' },
  orbitColumnDesktop: { width: 540, minHeight: 520, justifyContent: 'center', flexShrink: 0 },
  heroSide: { gap: 14 },
  heroSideDesktop: { width: 390, flexGrow: 0, flexShrink: 0, justifyContent: 'center', gap: 16 },
  startPanel: { borderRadius: radius.lg, borderWidth: StyleSheet.hairlineWidth, padding: 16 }, startKicker: { fontSize: 9.5, fontWeight: '900', letterSpacing: 1.1 }, startTitle: { marginTop: 5, fontSize: 20, lineHeight: 25, fontWeight: '900' }, startSubtitle: { marginTop: 5, marginBottom: 14, fontSize: 12, lineHeight: 18, fontWeight: '600' },
  startPanelDesktop: { minHeight: 320, borderRadius: 30, padding: 30, justifyContent: 'center' },
  startTitleDesktop: { marginTop: 10, fontSize: 32, lineHeight: 38 },
  startSubtitleDesktop: { marginTop: 12, marginBottom: 24, fontSize: 16, lineHeight: 24 },
  startChoice: { gap: spacing.md },
  startButton: { minHeight: 78, borderRadius: radius.lg, borderWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', padding: spacing.md, gap: spacing.md },
  startButtonDesktop: { minHeight: 106, borderRadius: 24, paddingHorizontal: 22, gap: 18 },
  startCopy: { flex: 1 }, startText: { fontSize: 15, lineHeight: 20, fontWeight: '900' }, startHint: { marginTop: 3, fontSize: 10.5, lineHeight: 15, fontWeight: '600' },
  startTextDesktop: { fontSize: 19, lineHeight: 25 },
  startHintDesktop: { marginTop: 5, fontSize: 14, lineHeight: 20 },
  readOnlyCard: { minHeight: 82, borderRadius: radius.lg, borderWidth: StyleSheet.hairlineWidth, padding: 15, flexDirection: 'row', alignItems: 'center', gap: 12 }, readOnlyCopy: { flex: 1 }, readOnlyTitle: { fontSize: 14, fontWeight: '900' }, readOnlyText: { marginTop: 4, fontSize: 11, lineHeight: 16, fontWeight: '600' }, readOnlyDisabled: { opacity: 0.48 },
  primaryAction: { minHeight: 76, borderRadius: radius.lg, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: spacing.xl, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.md, overflow: 'hidden' },
  primaryActionDesktop: { width: '100%', maxWidth: 390, minHeight: 122, alignSelf: 'center', justifyContent: 'flex-start', borderRadius: 27, paddingHorizontal: 20, gap: 15, boxShadow: '0 20px 50px rgba(25, 13, 53, 0.24)' },
  primaryActionCopyDesktop: { flex: 1, minWidth: 0 },
  primaryActionKickerDesktop: { fontSize: 9, lineHeight: 12, fontWeight: '900', letterSpacing: 1.15 },
  primaryActionHintDesktop: { marginTop: 5, maxWidth: 210, fontSize: 11.5, lineHeight: 16, fontWeight: '700' },
  primaryActionArrowDesktop: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  primaryTitle: { fontSize: 16, fontWeight: '900' },
  primaryTitleDesktop: { marginTop: 3, fontSize: 22, lineHeight: 27 },
  pressed: { opacity: 0.72, transform: [{ scale: 0.985 }] },
  lastAction: { minHeight: 66, borderRadius: 20, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', gap: 8 }, lastActionCopy: { flex: 1 }, lastKicker: { fontSize: 8, fontWeight: '900', letterSpacing: 1 }, lastTitle: { marginTop: 3, fontSize: 12, fontWeight: '900' }, lastButton: { minHeight: 38, justifyContent: 'center', paddingHorizontal: 5 }, lastButtonDisabled: { opacity: 0.35 }, lastButtonText: { fontSize: 10.5, fontWeight: '900' },
  lastActionDesktop: { minHeight: 92, borderRadius: 24, paddingHorizontal: 22, gap: 14 },
  lastTitleDesktop: { marginTop: 6, fontSize: 17 },
  lastButtonTextDesktop: { fontSize: 14 },
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
  startBackdrop: { flex: 1, backgroundColor: 'rgba(6,3,13,0.7)', alignItems: 'center', justifyContent: 'center', padding: 18 },
  startModal: { width: '100%', maxWidth: 390, borderRadius: 30, borderWidth: StyleSheet.hairlineWidth, padding: 20 },
  startModalHead: { width: '100%', flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  startModalIcon: { width: 82, height: 82, borderRadius: 27, alignItems: 'center', justifyContent: 'center' },
  startModalClose: { width: 44, height: 44, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  startModalKicker: { marginTop: 16, fontSize: 9.5, fontWeight: '900', letterSpacing: 1.3 },
  startModalTitle: { marginTop: 6, fontSize: 26, lineHeight: 31, fontWeight: '900' },
  startModalText: { marginTop: 8, fontSize: 12.5, lineHeight: 19, fontWeight: '600' },
  timeCard: { width: '100%', marginTop: 17, borderRadius: 20, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden', alignItems: 'center' },
  startError: { marginTop: 9, fontSize: 11, lineHeight: 16, fontWeight: '800', textAlign: 'center' },
  startConfirm: { width: '100%', minHeight: 56, marginTop: 15, borderRadius: 17, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  startConfirmText: { color: '#FFF', fontSize: 12.5, lineHeight: 17, fontWeight: '900', textAlign: 'center' },
  startCancel: { minHeight: 45, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  startCancelText: { fontSize: 11.5, fontWeight: '800' },
  currentStateChoices: { width: '100%', marginTop: 18, gap: 10 },
  currentStateButton: { minHeight: 84, borderRadius: 20, borderWidth: StyleSheet.hairlineWidth, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 11 },
  currentStateCopy: { flex: 1 },
  currentStateTitle: { fontSize: 14.5, fontWeight: '900' },
  currentStateHint: { marginTop: 3, fontSize: 10.5, lineHeight: 15, fontWeight: '600' },
  transitionCard: { width: '100%', maxWidth: 390, borderRadius: 30, borderWidth: StyleSheet.hairlineWidth, padding: 22, alignItems: 'center' },
  transitionIcon: { width: 72, height: 72, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  transitionTitle: { marginTop: 7, fontSize: 24, lineHeight: 29, fontWeight: '900', textAlign: 'center' },
  transitionText: { marginTop: 9, fontSize: 12.5, lineHeight: 19, fontWeight: '600', textAlign: 'center' },
});
