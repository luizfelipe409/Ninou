import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ActionArt } from '@/components/action-art';
import { NinouBackground } from '@/components/ninou-background';
import { formatTime, recordConfig, type RecordType } from '@/domain/routine';
import { getLocalDateId } from '@/services/firebase';
import { useRoutine } from '@/state/routine-context';
import { radius, spacing, useNinouTheme } from '@/theme/tokens';

const quickTypes: RecordType[] = ['amamentacao', 'mamadeira', 'fralda', 'medicamento'];
const sleepTypes: RecordType[] = ['acordou', 'sono', 'dormir', 'despertar-noturno'];

function validType(value: unknown): value is RecordType {
  return typeof value === 'string' && value in recordConfig;
}

export default function RegisterScreen() {
  const { colors } = useNinouTheme();
  const { addRecord } = useRoutine();
  const params = useLocalSearchParams<{ type?: string; dayId?: string }>();
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

  useEffect(() => {
    if (validType(params.type)) setSelectedType(params.type);
  }, [params.type]);

  useEffect(() => {
    if (!activeBreastSide) return;
    const timer = setInterval(() => activeBreastSide === 'left' ? setLeftBreastSeconds((value) => value + 1) : setRightBreastSeconds((value) => value + 1), 1000);
    return () => clearInterval(timer);
  }, [activeBreastSide]);

  const selectType = (type: RecordType) => {
    void Haptics.selectionAsync();
    setSelectedType(type);
    setDetail('');
    setNotes('');
  };

  const save = () => {
    if (!selectedType) return;
    const breastTotal = leftBreastSeconds + rightBreastSeconds;
    let start = manualTime ? timestampFor(recordDayId, startTime) : undefined;
    let end = manualTime && endTime ? Math.max(start || 0, timestampFor(recordDayId, endTime)) : undefined;
    if (selectedType === 'amamentacao' && breastTotal > 0 && !manualTime) { end = Date.now(); start = end - breastTotal * 1000; }
    const breastDetail = selectedType === 'amamentacao' && breastTotal > 0 ? `Esquerdo ${formatTimer(leftBreastSeconds)} • Direito ${formatTimer(rightBreastSeconds)}` : '';
    const medicineDetail = selectedType === 'medicamento' ? [medicineName.trim(), medicineDose.trim(), detail].filter(Boolean).join(' • ') : '';
    addRecord({
      type: selectedType,
      detail: breastDetail || medicineDetail || detail || recordConfig[selectedType].options[0],
      notes: notes.trim(),
      ...(selectedType === 'mamadeira' ? { amountMl } : {}),
      ...(Number.isFinite(start) ? { start, end } : {}),
    });
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['bottom']}>
      <NinouBackground />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {!selectedType ? (
          <>
            <View style={styles.intro}>
              <View style={styles.introTop}><Text style={[styles.eyebrow, { color: colors.primary }]}>Novo cuidado</Text><Pressable accessibilityLabel="Fechar menu" onPress={() => router.back()} style={[styles.closeButton, { backgroundColor: colors.surfaceElevated }]}><Ionicons name="close" size={21} color={colors.text} /></Pressable></View>
              <Text style={[styles.title, { color: colors.text }]}>O que você quer registrar?</Text>
              <Text style={[styles.subtitle, { color: colors.textMuted }]}>Escolha uma ação. O formulário abrirá já preparado.</Text>
            </View>
            <ActionGroup title="Cuidados rápidos" types={quickTypes} />
            <ActionGroup title="Sono e vigília" types={sleepTypes} />
          </>
        ) : (
          <>
            <Pressable onPress={() => setSelectedType(null)} style={styles.backButton}>
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
                {manualTime ? <View style={styles.manualFields}><View style={styles.dateField}><Text style={[styles.miniLabel, { color: colors.textMuted }]}>Data</Text><TextInput value={recordDayId} onChangeText={setRecordDayId} placeholder="AAAA-MM-DD" placeholderTextColor={colors.textMuted} style={[styles.smallInput, { color: colors.text, backgroundColor: colors.surfaceElevated, borderColor: colors.border }]} /></View><View style={styles.timeField}><Text style={[styles.miniLabel, { color: colors.textMuted }]}>Início</Text><TextInput value={startTime} onChangeText={setStartTime} placeholder="00:00" placeholderTextColor={colors.textMuted} style={[styles.smallInput, { color: colors.text, backgroundColor: colors.surfaceElevated, borderColor: colors.border }]} /></View><View style={styles.timeField}><Text style={[styles.miniLabel, { color: colors.textMuted }]}>Fim opcional</Text><TextInput value={endTime} onChangeText={setEndTime} placeholder="—" placeholderTextColor={colors.textMuted} style={[styles.smallInput, { color: colors.text, backgroundColor: colors.surfaceElevated, borderColor: colors.border }]} /></View></View> : null}
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

            <Pressable onPress={save} style={({ pressed }) => [styles.saveButton, { backgroundColor: colors.primary }, pressed && styles.pressed]}>
              <Text style={styles.saveText}>{selectedType === 'sono' || selectedType === 'dormir' ? 'Iniciar timer' : 'Registrar'}</Text>
            </Pressable>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );

  function ActionGroup({ title, types }: { title: string; types: RecordType[] }) {
    return (
      <View style={styles.group}>
        <Text style={[styles.groupTitle, { color: colors.textMuted }]}>{title}</Text>
        <View style={styles.grid}>
          {types.map((type) => (
            <Pressable key={type} onPress={() => selectType(type)} style={({ pressed }) => [styles.action, { backgroundColor: colors.surface, borderColor: colors.border }, pressed && styles.pressed]}>
              <ActionArt type={type} size={72} />
              <Text style={[styles.actionTitle, { color: colors.text }]}>{recordConfig[type].title}</Text>
              <Text style={[styles.actionHint, { color: colors.textMuted }]}>{recordConfig[type].hint}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    );
  }

  function timestampFor(dayId: string, time: string) {
    const [hours, minutes] = time.split(':').map(Number);
    const date = new Date(`${dayId}T00:00:00`);
    date.setHours(Number.isFinite(hours) ? hours : 0, Number.isFinite(minutes) ? minutes : 0, 0, 0);
    return date.getTime();
  }

  function formatTimer(seconds: number) { return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`; }
  function BreastSide({ side, label, seconds }: { side: 'left' | 'right'; label: string; seconds: number }) {
    const active = activeBreastSide === side;
    return <Pressable accessibilityRole="button" accessibilityState={{ selected: active }} onPress={() => setActiveBreastSide((current) => current === side ? null : side)} style={[styles.breastSide, { backgroundColor: active ? colors.primarySoft : colors.surface, borderColor: active ? colors.primary : colors.border }]}><View style={[styles.breastPlay, { backgroundColor: active ? colors.primary : colors.surfaceElevated }]}><Text style={[styles.breastLetter, { color: active ? '#FFF' : colors.primary }]}>{side === 'left' ? 'E' : 'D'}</Text><Ionicons name={active ? 'pause' : 'play'} size={12} color={active ? '#FFF' : colors.primary} /></View><Text style={[styles.breastTime, { color: colors.text }]}>{formatTimer(seconds)}</Text><Text style={[styles.breastLabel, { color: colors.textMuted }]}>{label}</Text></Pressable>;
  }
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  content: { width: '100%', maxWidth: 720, alignSelf: 'center', padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.xl },
  intro: { gap: spacing.xs },
  introTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, closeButton: { width: 42, height: 42, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  eyebrow: { fontSize: 11, fontWeight: '900', letterSpacing: 1.1, textTransform: 'uppercase' },
  title: { fontSize: 27, lineHeight: 32, fontWeight: '900', letterSpacing: -0.6 },
  subtitle: { fontSize: 14, lineHeight: 20 },
  group: { gap: spacing.md },
  groupTitle: { fontSize: 12, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  action: { width: '47%', flexGrow: 1, minHeight: 164, borderRadius: radius.lg, borderWidth: StyleSheet.hairlineWidth, padding: spacing.md, justifyContent: 'flex-end' },
  actionTitle: { fontSize: 15, fontWeight: '900', marginTop: spacing.sm },
  actionHint: { fontSize: 11, marginTop: 2 },
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
  breastPanel: { borderRadius: 20, borderWidth: StyleSheet.hairlineWidth, padding: 13 }, breastHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, breastTotal: { marginTop: 3, fontSize: 24, fontWeight: '900', fontVariant: ['tabular-nums'] }, resetTimer: { minHeight: 38, borderRadius: 13, paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center' }, resetTimerText: { fontSize: 11, fontWeight: '900' }, breastSides: { flexDirection: 'row', gap: 9, marginTop: 13 }, breastSide: { flex: 1, minHeight: 118, borderRadius: 18, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center' }, breastPlay: { width: 44, height: 44, borderRadius: 22, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 2 }, breastLetter: { fontSize: 14, fontWeight: '900' }, breastTime: { marginTop: 8, fontSize: 19, fontWeight: '900', fontVariant: ['tabular-nums'] }, breastLabel: { marginTop: 2, fontSize: 10, fontWeight: '800' }, breastHelp: { marginTop: 11, fontSize: 10, lineHeight: 15, textAlign: 'center' },
  medicineFields: { flexDirection: 'row', gap: 8 }, medicineField: { flex: 1, gap: 5 },
  textArea: { minHeight: 112, borderRadius: radius.md, borderWidth: StyleSheet.hairlineWidth, padding: spacing.md, fontSize: 14, textAlignVertical: 'top' },
  saveButton: { minHeight: 54, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  saveText: { color: '#FFFFFF', fontSize: 16, fontWeight: '900' },
});
