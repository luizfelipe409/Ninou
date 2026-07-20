import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ActionArt } from '@/components/action-art';
import { NinouBackground } from '@/components/ninou-background';
import { formatDuration, formatTime, recordConfig, resolveRoutineIntervalEnd, type RecordType } from '@/domain/routine';
import { getLocalDateId } from '@/services/firebase';
import { useRoutine } from '@/state/routine-context';
import { useFamilyPreferences } from '@/state/preferences-context';
import { radius, spacing, useNinouTheme } from '@/theme/tokens';

const careTypes: RecordType[] = ['amamentacao', 'mamadeira', 'fralda', 'sono', 'dormir', 'acordou', 'despertar-noturno', 'medicamento'];

function isValidDayId(dayId: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dayId)) return false;
  const date = new Date(`${dayId}T12:00:00`);
  return Number.isFinite(date.getTime()) && getLocalDateId(date.getTime()) === dayId;
}

function isValidTime(time: string) {
  return /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(time.trim());
}

function timestampFor(dayId: string, time: string) {
  const [hours, minutes] = time.split(':').map(Number);
  const date = new Date(`${dayId}T00:00:00`);
  date.setHours(hours, minutes, 0, 0);
  return date.getTime();
}

function formatTimer(seconds: number) {
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
}

function validType(value: unknown): value is RecordType {
  return typeof value === 'string' && value in recordConfig;
}

function CareMenu({ onClose, onSelect }: { onClose: () => void; onSelect: (type: RecordType) => void }) {
  const { colors, isDark } = useNinouTheme();
  return (
    <View style={styles.menuScreen}>
      <View style={styles.intro}>
        <View style={styles.introTop}>
          <Text style={[styles.eyebrow, { color: colors.primary }]}>Novo registro</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="Fechar menu" onPress={onClose} style={[styles.closeButton, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}><Ionicons name="close" size={24} color={colors.text} /></Pressable>
        </View>
        <Text style={[styles.title, { color: colors.text }]}>O que aconteceu agora?</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>Escolha um cuidado para registrar em poucos toques.</Text>
      </View>
      <View style={styles.grid}>
        {careTypes.map((type) => (
          <Pressable
            key={type}
            accessibilityRole="button"
            accessibilityLabel={`${recordConfig[type].title}. ${recordConfig[type].hint}`}
            onPress={() => onSelect(type)}
            style={({ pressed }) => [styles.action, { backgroundColor: colors.surface, borderColor: pressed ? colors.primary : colors.border, shadowColor: isDark ? '#000000' : colors.primary }, pressed && styles.actionPressed]}>
            <LinearGradient pointerEvents="none" colors={isDark ? ['rgba(180,151,255,0.10)', 'rgba(87,225,194,0.02)'] : ['rgba(255,255,255,0.88)', 'rgba(126,91,224,0.035)']} style={styles.actionSheen} />
            <View style={styles.actionTop}>
              <ActionArt type={type} size={48} />
              <View style={[styles.actionChevron, { backgroundColor: colors.primarySoft }]}><Ionicons name="chevron-forward" size={17} color={colors.primary} /></View>
            </View>
            <View style={styles.actionCopy}>
              <Text numberOfLines={1} style={[styles.actionTitle, { color: colors.text }]}>{recordConfig[type].title}</Text>
              <Text numberOfLines={1} style={[styles.actionHint, { color: colors.textMuted }]}>{recordConfig[type].hint}</Text>
            </View>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

export default function RegisterScreen() {
  const { colors, isDark } = useNinouTheme();
  const { addRecord } = useRoutine();
  const { preferences } = useFamilyPreferences();
  const params = useLocalSearchParams<{ type?: string; dayId?: string }>();
  const scrollRef = useRef<ScrollView>(null);
  const [selectedType, setSelectedType] = useState<RecordType | null>(validType(params.type) ? params.type : null);
  const [detail, setDetail] = useState('');
  const [notes, setNotes] = useState('');
  const [amountMl, setAmountMl] = useState(105);
  const [manualTime, setManualTime] = useState(Boolean(params.dayId && params.dayId !== getLocalDateId()));
  const [recordDayId, setRecordDayId] = useState(params.dayId || getLocalDateId());
  const [startTime, setStartTime] = useState(formatTime(Date.now()));
  const [endTime, setEndTime] = useState('');
  const [leftBreastSeconds, setLeftBreastSeconds] = useState(0);
  const [rightBreastSeconds, setRightBreastSeconds] = useState(0);
  const [activeBreastSide, setActiveBreastSide] = useState<'left' | 'right' | null>(null);
  const [medicineName, setMedicineName] = useState('');
  const [medicineDose, setMedicineDose] = useState('');
  const [savedRecord, setSavedRecord] = useState<{ type: RecordType; timestamp: number; end?: number; caregiver: string; status: 'timer' | 'completed' | 'recorded' } | null>(null);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (validType(params.type)) setSelectedType(params.type);
  }, [params.type]);

  useEffect(() => {
    if (!activeBreastSide) return;
    const timer = setInterval(() => activeBreastSide === 'left' ? setLeftBreastSeconds((value) => value + 1) : setRightBreastSeconds((value) => value + 1), 1000);
    return () => clearInterval(timer);
  }, [activeBreastSide]);

  const selectType = useCallback((type: RecordType) => {
    void Haptics.selectionAsync();
    setSelectedType(type);
    setDetail('');
    setNotes('');
    setFormError('');
  }, []);

  const showCareMenu = useCallback(() => {
    setActiveBreastSide(null);
    setSelectedType(null);
    setFormError('');
    router.setParams({ type: '' });
  }, []);

  useEffect(() => {
    if (selectedType) return;
    const frame = requestAnimationFrame(() => scrollRef.current?.scrollTo({ y: 0, animated: false }));
    return () => cancelAnimationFrame(frame);
  }, [selectedType]);

  const isSleepType = selectedType === 'sono' || selectedType === 'dormir';
  const manualSleepCrossesMidnight = Boolean(
    manualTime
    && isSleepType
    && isValidDayId(recordDayId)
    && isValidTime(startTime)
    && isValidTime(endTime)
    && timestampFor(recordDayId, endTime.trim()) < timestampFor(recordDayId, startTime.trim()),
  );

  const save = () => {
    if (!selectedType || savedRecord) return;
    setFormError('');
    const isSleep = selectedType === 'sono' || selectedType === 'dormir';
    const breastTotal = leftBreastSeconds + rightBreastSeconds;
    let start: number | undefined;
    let end: number | undefined;

    if (manualTime) {
      if (!isValidDayId(recordDayId)) { setFormError('Informe uma data válida no formato AAAA-MM-DD.'); return; }
      if (!isValidTime(startTime)) { setFormError('Informe o horário inicial no formato 00:00.'); return; }
      if (endTime.trim() && !isValidTime(endTime)) { setFormError('Informe o horário final no formato 00:00.'); return; }
      start = timestampFor(recordDayId, startTime.trim());
      if (start > Date.now() + 60 * 1000) { setFormError('O horário inicial não pode estar no futuro.'); return; }
      if (endTime.trim()) {
        const resolvedEnd = resolveRoutineIntervalEnd(selectedType, start, timestampFor(recordDayId, endTime.trim()));
        if (resolvedEnd === null || (isSleep && resolvedEnd === start)) { setFormError('O término do sono precisa ser diferente do horário inicial.'); return; }
        end = resolvedEnd;
        if (end > Date.now() + 60 * 1000) { setFormError('O horário final não pode estar no futuro.'); return; }
      } else if (isSleep && recordDayId !== getLocalDateId()) {
        setFormError('Para um sono iniciado em outro dia, informe também o horário de término.');
        return;
      }
    }

    if (selectedType === 'amamentacao' && breastTotal > 0 && !manualTime) { end = Date.now(); start = end - breastTotal * 1000; }
    const breastDetail = selectedType === 'amamentacao' && breastTotal > 0 ? `Esquerdo ${formatTimer(leftBreastSeconds)} • Direito ${formatTimer(rightBreastSeconds)}` : '';
    const medicineDetail = selectedType === 'medicamento' ? [medicineName.trim(), medicineDose.trim(), detail].filter(Boolean).join(' • ') : '';
    addRecord({
      type: selectedType,
      detail: breastDetail || medicineDetail || detail || recordConfig[selectedType].options[0],
      notes: notes.trim(),
      ...(selectedType === 'mamadeira' ? { amountMl } : {}),
      ...(Number.isFinite(start) ? { start, ...(Number.isFinite(end) ? { end } : {}) } : {}),
    });
    const caregiver = [preferences.caregiverName.trim(), preferences.caregiverRelation.trim()].filter(Boolean).join(' · ') || 'Responsável';
    const completedSleep = isSleep && Number.isFinite(start) && Number.isFinite(end) && Number(end) > Number(start);
    const status = isSleep ? (completedSleep ? 'completed' : 'timer') : 'recorded';
    setActiveBreastSide(null);
    setSavedRecord({ type: selectedType, timestamp: Number.isFinite(start) ? Number(start) : Date.now(), ...(Number.isFinite(end) ? { end: Number(end) } : {}), caregiver, status });
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const registerAnother = () => {
    setSavedRecord(null);
    setDetail('');
    setNotes('');
    setMedicineName('');
    setMedicineDose('');
    setLeftBreastSeconds(0);
    setRightBreastSeconds(0);
    setFormError('');
    showCareMenu();
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['bottom']}>
      <NinouBackground />
      <ScrollView ref={scrollRef} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {!selectedType ? (
          <CareMenu onClose={() => router.back()} onSelect={selectType} />
        ) : (
          <>
            <Pressable onPress={showCareMenu} style={styles.backButton}>
              <Ionicons name="chevron-back" size={20} color={colors.primary} />
              <Text style={[styles.backText, { color: colors.primary }]}>Cuidados</Text>
            </Pressable>
            <View style={styles.formHero}>
              <ActionArt type={selectedType} size={82} />
              <View style={styles.formHeroCopy}>
                <Text style={[styles.eyebrow, { color: colors.primary }]}>Novo registro</Text>
                <Text style={[styles.title, { color: colors.text }]}>{recordConfig[selectedType].title}</Text>
                <Text style={[styles.subtitle, { color: colors.textMuted }]}>Agora • o horário poderá ser corrigido no Diário</Text>
              </View>
            </View>

            <View style={[styles.formCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.fieldLabel, { color: colors.text }]}>{selectedType === 'mamadeira' ? 'Tipo de leite' : 'Detalhe'}</Text>
              <View style={styles.chips}>
                {recordConfig[selectedType].options.map((option) => (
                  <Pressable
                    key={option}
                    onPress={() => setDetail(option)}
                    style={[styles.chip, { backgroundColor: detail === option ? colors.primary : colors.surfaceElevated, borderColor: detail === option ? colors.primary : colors.border }]}>
                    <Text style={[styles.chipText, { color: detail === option ? '#FFFFFF' : colors.text }]}>{option}</Text>
                  </Pressable>
                ))}
              </View>

              {selectedType === 'mamadeira' ? (
                <View style={styles.amountSection}>
                  <Text style={[styles.fieldLabel, { color: colors.text }]}>Quantidade</Text>
                  <View style={styles.amountRow}>
                    <Pressable onPress={() => setAmountMl((value) => Math.max(0, value - 5))} style={[styles.amountButton, { backgroundColor: colors.primarySoft }]}><Ionicons name="remove" size={24} color={colors.primary} /></Pressable>
                    <Text style={[styles.amountValue, { color: colors.text }]}>{amountMl} ml</Text>
                    <Pressable onPress={() => setAmountMl((value) => Math.min(350, value + 5))} style={[styles.amountButton, { backgroundColor: colors.primarySoft }]}><Ionicons name="add" size={24} color={colors.primary} /></Pressable>
                  </View>
                </View>
              ) : null}

              <View style={styles.manualSection}>
                <View style={styles.manualHead}>
                  <View style={styles.manualCopy}><Text style={[styles.fieldLabel, { color: colors.text }]}>Horário do registro</Text><Text style={[styles.manualHint, { color: colors.textMuted }]}>{manualTime ? 'Preencha somente quando precisar informar outro horário.' : 'Agora, usando o horário deste aparelho.'}</Text></View>
                  <Pressable onPress={() => setManualTime((value) => !value)} style={[styles.manualToggle, { backgroundColor: manualTime ? colors.primary : colors.surfaceElevated }]}><Text style={[styles.manualToggleText, { color: manualTime ? '#FFF' : colors.text }]}>{manualTime ? 'Manual' : 'Agora'}</Text></Pressable>
                </View>
                {manualTime ? <>
                  <View style={styles.manualFields}>
                    <View style={styles.dateField}><Text style={[styles.miniLabel, { color: colors.textMuted }]}>Data de início</Text><TextInput value={recordDayId} onChangeText={(value) => { setRecordDayId(value); setFormError(''); }} placeholder="AAAA-MM-DD" placeholderTextColor={colors.textMuted} style={[styles.smallInput, { color: colors.text, backgroundColor: colors.surfaceElevated, borderColor: colors.border }]} /></View>
                    <View style={styles.timeField}><Text style={[styles.miniLabel, { color: colors.textMuted }]}>Início</Text><TextInput value={startTime} onChangeText={(value) => { setStartTime(value); setFormError(''); }} placeholder="00:00" placeholderTextColor={colors.textMuted} style={[styles.smallInput, { color: colors.text, backgroundColor: colors.surfaceElevated, borderColor: colors.border }]} /></View>
                    <View style={styles.timeField}><Text style={[styles.miniLabel, { color: colors.textMuted }]}>{isSleepType && recordDayId !== getLocalDateId() ? 'Fim' : 'Fim opcional'}</Text><TextInput value={endTime} onChangeText={(value) => { setEndTime(value); setFormError(''); }} placeholder="—" placeholderTextColor={colors.textMuted} style={[styles.smallInput, { color: colors.text, backgroundColor: colors.surfaceElevated, borderColor: colors.border }]} /></View>
                  </View>
                  {manualSleepCrossesMidnight ? <View style={[styles.overnightHint, { backgroundColor: colors.primarySoft, borderColor: `${colors.primary}33` }]}><Ionicons name="moon-outline" size={16} color={colors.primary} /><Text style={[styles.overnightHintText, { color: colors.primary }]}>O término será salvo no dia seguinte.</Text></View> : null}
                </> : null}
              </View>

              {selectedType === 'amamentacao' ? <View style={[styles.breastPanel, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}><View style={styles.breastHead}><View><Text style={[styles.miniLabel, { color: colors.textMuted }]}>TIMER DA MAMADA</Text><Text style={[styles.breastTotal, { color: colors.text }]}>{formatTimer(leftBreastSeconds + rightBreastSeconds)}</Text></View><Pressable onPress={() => { setActiveBreastSide(null); setLeftBreastSeconds(0); setRightBreastSeconds(0); }} style={[styles.resetTimer, { backgroundColor: colors.surface }]}><Text style={[styles.resetTimerText, { color: colors.primary }]}>Zerar</Text></Pressable></View><View style={styles.breastSides}><BreastSide side="left" label="Esquerdo" seconds={leftBreastSeconds} /><BreastSide side="right" label="Direito" seconds={rightBreastSeconds} /></View><Text style={[styles.breastHelp, { color: colors.textMuted }]}>Toque para iniciar ou pausar. Ao trocar de lado, o outro timer é pausado automaticamente.</Text></View> : null}

              {selectedType === 'medicamento' ? <View style={styles.medicineFields}><View style={styles.medicineField}><Text style={[styles.miniLabel, { color: colors.textMuted }]}>Medicamento</Text><TextInput value={medicineName} onChangeText={setMedicineName} placeholder="Nome informado pela família" placeholderTextColor={colors.textMuted} style={[styles.smallInput, { color: colors.text, backgroundColor: colors.surfaceElevated, borderColor: colors.border }]} /></View><View style={styles.medicineField}><Text style={[styles.miniLabel, { color: colors.textMuted }]}>Dose</Text><TextInput value={medicineDose} onChangeText={setMedicineDose} placeholder="Ex.: 5 gotas" placeholderTextColor={colors.textMuted} style={[styles.smallInput, { color: colors.text, backgroundColor: colors.surfaceElevated, borderColor: colors.border }]} /></View></View> : null}

              <Text style={[styles.fieldLabel, { color: colors.text }]}>Observações</Text>
              <TextInput
                multiline
                numberOfLines={4}
                value={notes}
                onChangeText={setNotes}
                placeholder="Observações sobre este registro"
                placeholderTextColor={colors.textMuted}
                style={[styles.textArea, { color: colors.text, backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
              />
            </View>

            {formError ? <View style={[styles.formError, { backgroundColor: `${colors.danger}14`, borderColor: `${colors.danger}55` }]}><Ionicons name="alert-circle-outline" size={18} color={colors.danger} /><Text style={[styles.formErrorText, { color: colors.danger }]}>{formError}</Text></View> : null}
            <Pressable onPress={save} style={({ pressed }) => [styles.saveButton, { backgroundColor: colors.primary }, pressed && styles.pressed]}>
              <Text style={styles.saveText}>{selectedType === 'sono' || selectedType === 'dormir' ? (manualTime && endTime.trim() ? 'Registrar sono concluído' : 'Iniciar timer') : 'Registrar'}</Text>
            </Pressable>
          </>
        )}
      </ScrollView>
      <Modal visible={Boolean(savedRecord)} transparent animationType="fade" onRequestClose={() => router.back()}>
        <View style={styles.successBackdrop}>
          <View style={[styles.successCard, { backgroundColor: colors.surface, borderColor: colors.border, shadowColor: isDark ? '#000000' : colors.primary }]}>
            <LinearGradient pointerEvents="none" colors={isDark ? ['rgba(122,94,232,0.22)', 'rgba(93,226,193,0.05)', 'rgba(19,13,38,0)'] : ['rgba(137,103,239,0.16)', 'rgba(91,213,183,0.07)', 'rgba(255,255,255,0)']} style={StyleSheet.absoluteFill} />
            <View style={styles.successArtWrap}>
              <View style={[styles.successHalo, { backgroundColor: `${colors.accent}1F`, borderColor: `${colors.accent}55` }]} />
              <View style={[styles.successArt, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>{savedRecord ? <ActionArt type={savedRecord.type} size={74} /> : null}</View>
              <View style={[styles.successCheck, { backgroundColor: colors.accent, borderColor: colors.surface }]}><Ionicons name="checkmark" size={20} color="#12362E" /></View>
            </View>
            <Text style={[styles.successKicker, { color: colors.primary }]}>{savedRecord?.status === 'timer' ? 'ACOMPANHAMENTO INICIADO' : 'REGISTRO CONCLUÍDO'}</Text>
            <Text style={[styles.successTitle, { color: colors.text }]}>{savedRecord?.status === 'timer' ? 'Timer iniciado' : savedRecord?.status === 'completed' ? 'Sono registrado' : 'Cuidado registrado'}</Text>
            <Text style={[styles.successText, { color: colors.textMuted }]}>{savedRecord ? savedRecord.status === 'completed' && savedRecord.end ? `${recordConfig[savedRecord.type].title} de ${formatTime(savedRecord.timestamp)} até ${formatTime(savedRecord.end)} · ${formatDuration(savedRecord.end - savedRecord.timestamp)}.` : savedRecord.status === 'timer' ? `${recordConfig[savedRecord.type].title} iniciada às ${formatTime(savedRecord.timestamp)}. O timer está em andamento.` : `${recordConfig[savedRecord.type].title} às ${formatTime(savedRecord.timestamp)}. O diário identificará quem realizou este cuidado.` : ''}</Text>
            <View style={[styles.successIdentity, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}><View style={[styles.successIdentityIcon, { backgroundColor: colors.primarySoft }]}><Ionicons name="person-outline" size={18} color={colors.primary} /></View><View style={styles.successIdentityCopy}><Text style={[styles.successIdentityLabel, { color: colors.textMuted }]}>REGISTRADO POR</Text><Text numberOfLines={1} style={[styles.successIdentityName, { color: colors.text }]}>{savedRecord?.caregiver}</Text></View><Ionicons name="cloud-done-outline" size={21} color={colors.accent} /></View>
            <Pressable onPress={() => router.back()} style={({ pressed }) => [styles.successPrimary, { backgroundColor: colors.primary }, pressed && styles.pressed]}><Text style={styles.successPrimaryText}>Concluir</Text><Ionicons name="arrow-forward" size={18} color="#FFFFFF" /></Pressable>
            <Pressable onPress={registerAnother} style={({ pressed }) => [styles.successSecondary, { borderColor: colors.border }, pressed && styles.pressed]}><Ionicons name="add-circle-outline" size={18} color={colors.primary} /><Text style={[styles.successSecondaryText, { color: colors.primary }]}>Registrar outro cuidado</Text></Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );

  function BreastSide({ side, label, seconds }: { side: 'left' | 'right'; label: string; seconds: number }) {
    const active = activeBreastSide === side;
    return <Pressable accessibilityRole="button" accessibilityState={{ selected: active }} onPress={() => setActiveBreastSide((current) => current === side ? null : side)} style={[styles.breastSide, { backgroundColor: active ? colors.primarySoft : colors.surface, borderColor: active ? colors.primary : colors.border }]}><View style={[styles.breastPlay, { backgroundColor: active ? colors.primary : colors.surfaceElevated }]}><Text style={[styles.breastLetter, { color: active ? '#FFF' : colors.primary }]}>{side === 'left' ? 'E' : 'D'}</Text><Ionicons name={active ? 'pause' : 'play'} size={12} color={active ? '#FFF' : colors.primary} /></View><Text style={[styles.breastTime, { color: colors.text }]}>{formatTimer(seconds)}</Text><Text style={[styles.breastLabel, { color: colors.textMuted }]}>{label}</Text></Pressable>;
  }
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  content: { width: '100%', maxWidth: 720, alignSelf: 'center', padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.xl },
  menuScreen: { gap: 18 },
  intro: { gap: spacing.xs },
  introTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, closeButton: { width: 48, height: 48, borderRadius: 17, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center' },
  eyebrow: { fontSize: 11.5, lineHeight: 15, fontWeight: '900', letterSpacing: 1.2, textTransform: 'uppercase' },
  title: { fontSize: 29, lineHeight: 34, fontWeight: '900', letterSpacing: -0.7 },
  subtitle: { fontSize: 15, lineHeight: 21 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  action: { width: '48%', flexGrow: 1, minHeight: 108, borderRadius: 23, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 12, paddingVertical: 11, justifyContent: 'space-between', gap: 7, overflow: 'hidden', shadowOpacity: 0.14, shadowRadius: 12, shadowOffset: { width: 0, height: 7 }, elevation: 3 },
  actionSheen: { position: 'absolute', inset: 0, borderRadius: 23 },
  actionPressed: { borderWidth: 1, opacity: 0.88, transform: [{ scale: 0.985 }], shadowOpacity: 0.26, shadowRadius: 16 },
  actionTop: { width: '100%', flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  actionCopy: { width: '100%', minWidth: 0 },
  actionTitle: { width: '100%', fontSize: 14, lineHeight: 17, fontWeight: '900', letterSpacing: -0.15 },
  actionHint: { marginTop: 2, fontSize: 11, lineHeight: 14, fontWeight: '600' },
  actionChevron: { width: 27, height: 27, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  pressed: { opacity: 0.72, transform: [{ scale: 0.985 }] },
  backButton: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 2 },
  backText: { fontSize: 14, fontWeight: '800' },
  formHero: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  formHeroCopy: { flex: 1, gap: spacing.xs },
  formCard: { borderRadius: radius.lg, borderWidth: StyleSheet.hairlineWidth, padding: spacing.lg, gap: spacing.md },
  fieldLabel: { fontSize: 13, fontWeight: '900' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: { minHeight: 38, borderRadius: radius.pill, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: spacing.md, alignItems: 'center', justifyContent: 'center' },
  chipText: { fontSize: 12, fontWeight: '700' },
  amountSection: { gap: spacing.md },
  amountRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xl },
  amountButton: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  amountValue: { minWidth: 100, textAlign: 'center', fontSize: 25, fontWeight: '900', fontVariant: ['tabular-nums'] },
  manualSection: { gap: spacing.md, paddingTop: 4 },
  manualHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  manualCopy: { flex: 1 }, manualHint: { marginTop: 3, fontSize: 10.5, lineHeight: 15 },
  manualToggle: { minWidth: 72, minHeight: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10 }, manualToggleText: { fontSize: 11, fontWeight: '900' },
  manualFields: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, dateField: { flexGrow: 1, minWidth: 138, gap: 5 }, timeField: { flex: 1, minWidth: 85, gap: 5 }, miniLabel: { fontSize: 9.5, fontWeight: '900', textTransform: 'uppercase' }, smallInput: { minHeight: 48, borderRadius: 15, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 11, fontSize: 12.5, fontWeight: '700' },
  overnightHint: { minHeight: 42, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 11, flexDirection: 'row', alignItems: 'center', gap: 7 }, overnightHintText: { flex: 1, fontSize: 11.5, lineHeight: 16, fontWeight: '800' },
  breastPanel: { borderRadius: 20, borderWidth: StyleSheet.hairlineWidth, padding: 13 }, breastHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, breastTotal: { marginTop: 3, fontSize: 24, fontWeight: '900', fontVariant: ['tabular-nums'] }, resetTimer: { minHeight: 38, borderRadius: 13, paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center' }, resetTimerText: { fontSize: 11, fontWeight: '900' }, breastSides: { flexDirection: 'row', gap: 9, marginTop: 13 }, breastSide: { flex: 1, minHeight: 118, borderRadius: 18, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center' }, breastPlay: { width: 44, height: 44, borderRadius: 22, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 2 }, breastLetter: { fontSize: 14, fontWeight: '900' }, breastTime: { marginTop: 8, fontSize: 19, fontWeight: '900', fontVariant: ['tabular-nums'] }, breastLabel: { marginTop: 2, fontSize: 10, fontWeight: '800' }, breastHelp: { marginTop: 11, fontSize: 10, lineHeight: 15, textAlign: 'center' },
  medicineFields: { flexDirection: 'row', gap: 8 }, medicineField: { flex: 1, gap: 5 },
  textArea: { minHeight: 112, borderRadius: radius.md, borderWidth: StyleSheet.hairlineWidth, padding: spacing.md, fontSize: 14, textAlignVertical: 'top' },
  formError: { marginTop: 14, borderWidth: StyleSheet.hairlineWidth, borderRadius: 16, paddingHorizontal: 13, paddingVertical: 11, flexDirection: 'row', alignItems: 'center', gap: 8 },
  formErrorText: { flex: 1, fontSize: 12, lineHeight: 17, fontWeight: '800' },
  saveButton: { minHeight: 54, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  saveText: { color: '#FFFFFF', fontSize: 16, fontWeight: '900' },
  successBackdrop: { flex: 1, backgroundColor: 'rgba(6,3,13,0.72)', padding: 18, alignItems: 'center', justifyContent: 'center' },
  successCard: { width: '100%', maxWidth: 390, borderRadius: 31, borderWidth: StyleSheet.hairlineWidth, padding: 22, alignItems: 'center', overflow: 'hidden', shadowOpacity: 0.34, shadowRadius: 28, shadowOffset: { width: 0, height: 14 }, elevation: 10 },
  successArtWrap: { width: 122, height: 122, alignItems: 'center', justifyContent: 'center' }, successHalo: { position: 'absolute', width: 122, height: 122, borderRadius: 61, borderWidth: 1 }, successArt: { width: 94, height: 94, borderRadius: 32, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center' }, successCheck: { position: 'absolute', right: 5, bottom: 7, width: 35, height: 35, borderRadius: 18, borderWidth: 3, alignItems: 'center', justifyContent: 'center' },
  successKicker: { marginTop: 15, fontSize: 9.5, fontWeight: '900', letterSpacing: 1.35 }, successTitle: { marginTop: 7, fontSize: 28, lineHeight: 33, fontWeight: '900', letterSpacing: -0.7, textAlign: 'center' }, successText: { marginTop: 8, maxWidth: 320, fontSize: 12.5, lineHeight: 18, fontWeight: '600', textAlign: 'center' },
  successIdentity: { width: '100%', minHeight: 64, marginTop: 19, borderRadius: 19, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 11, flexDirection: 'row', alignItems: 'center', gap: 10 }, successIdentityIcon: { width: 39, height: 39, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }, successIdentityCopy: { flex: 1 }, successIdentityLabel: { fontSize: 8, fontWeight: '900', letterSpacing: 0.9 }, successIdentityName: { marginTop: 3, fontSize: 12.5, fontWeight: '900' },
  successPrimary: { width: '100%', minHeight: 54, marginTop: 16, borderRadius: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }, successPrimaryText: { color: '#FFFFFF', fontSize: 14, fontWeight: '900' }, successSecondary: { width: '100%', minHeight: 49, marginTop: 8, borderRadius: 17, borderWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 }, successSecondaryText: { fontSize: 12.5, fontWeight: '900' },
});
