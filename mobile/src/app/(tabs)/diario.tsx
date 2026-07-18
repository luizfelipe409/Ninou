import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { ActionArt } from '@/components/action-art';
import { NinouCard, NinouScreen } from '@/components/ninou-screen';
import { createEmptyDayState, formatDuration, formatTime, recordConfig, type RoutineEvent } from '@/domain/routine';
import { getLocalDateId } from '@/services/firebase';
import { useNinouAuth } from '@/state/auth-context';
import { useRoutine } from '@/state/routine-context';
import { radius, spacing, useNinouTheme } from '@/theme/tokens';

type Filter = 'all' | 'sleep' | 'feeding' | 'diaper' | 'medicine';
const filters: { key: Filter; label: string }[] = [
  { key: 'all', label: 'Todos' }, { key: 'sleep', label: 'Sono' }, { key: 'feeding', label: 'Alimentação' }, { key: 'diaper', label: 'Fralda' }, { key: 'medicine', label: 'Medicamento' },
];
const quickObservations = [
  ['💛', 'Teve cólica'], ['💧', 'Regurgitou'], ['🛁', 'Tomou banho'], ['💊', 'Medicamento registrado/administrado'], ['🌡️', 'Teve febre ou temperatura elevada'], ['🩺', 'Consulta ou orientação profissional'],
] as const;

function matches(event: RoutineEvent, filter: Filter) {
  if (filter === 'all') return true;
  if (filter === 'sleep') return ['sono', 'dormir', 'acordou', 'despertar-noturno'].includes(event.type);
  if (filter === 'feeding') return ['amamentacao', 'mamadeira'].includes(event.type);
  if (filter === 'diaper') return event.type === 'fralda';
  return event.type === 'medicamento';
}

function shiftDay(dayId: string, amount: number) {
  return getLocalDateId(new Date(`${dayId}T12:00:00`).getTime() + amount * 86400000);
}

function displayDate(dayId: string) {
  const today = getLocalDateId();
  if (dayId === today) return 'Hoje';
  if (dayId === shiftDay(today, -1)) return 'Ontem';
  return new Date(`${dayId}T12:00:00`).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' });
}

function timeOnDay(dayId: string, value: string) {
  const [hours, minutes] = value.split(':').map(Number);
  const date = new Date(`${dayId}T00:00:00`);
  date.setHours(Number.isFinite(hours) ? hours : 0, Number.isFinite(minutes) ? minutes : 0, 0, 0);
  return date.getTime();
}

export default function DiaryScreen() {
  const { colors } = useNinouTheme();
  const { user } = useNinouAuth();
  const { state, history, updateEvent, deleteEvent, updateDayNotes, addNoteEpisode, deleteNoteEpisode } = useRoutine();
  const [selectedDayId, setSelectedDayId] = useState(getLocalDateId());
  const [filter, setFilter] = useState<Filter>('all');
  const [editing, setEditing] = useState<RoutineEvent | null>(null);
  const [editStart, setEditStart] = useState('');
  const [editEnd, setEditEnd] = useState('');
  const [editDetail, setEditDetail] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [freeform, setFreeform] = useState('');
  const [newEpisodeOpen, setNewEpisodeOpen] = useState(false);
  const [newEpisode, setNewEpisode] = useState('');
  const dayState = selectedDayId === getLocalDateId() ? state : history[selectedDayId] || createEmptyDayState();
  const events = useMemo(() => [...dayState.events].filter((event) => matches(event, filter)).sort((a, b) => b.start - a.start), [dayState.events, filter]);

  useEffect(() => setFreeform(dayState.dayNotes || ''), [dayState.dayNotes, selectedDayId]);
  useEffect(() => {
    if (freeform === dayState.dayNotes) return;
    const timer = setTimeout(() => updateDayNotes(selectedDayId, freeform), 700);
    return () => clearTimeout(timer);
  }, [dayState.dayNotes, freeform, selectedDayId, updateDayNotes]);

  const openEdit = (event: RoutineEvent) => {
    setEditing(event); setEditStart(formatTime(event.start)); setEditEnd(event.end > event.start ? formatTime(event.end) : ''); setEditDetail(event.detail); setEditNotes(event.notes);
  };
  const saveEdit = () => {
    if (!editing) return;
    const start = timeOnDay(selectedDayId, editStart);
    const end = editEnd ? Math.max(start, timeOnDay(selectedDayId, editEnd)) : start;
    updateEvent(selectedDayId, editing.id, { start, end, detail: editDetail.trim(), notes: editNotes.trim() });
    setEditing(null);
  };
  const confirmDelete = (event: RoutineEvent) => Alert.alert('Excluir registro?', `${recordConfig[event.type].title}, às ${formatTime(event.start)}.`, [{ text: 'Cancelar', style: 'cancel' }, { text: 'Excluir', style: 'destructive', onPress: () => deleteEvent(selectedDayId, event.id) }]);
  const saveEpisode = (icon: string, text: string) => addNoteEpisode(selectedDayId, { icon, text, time: Date.now(), caregiver: user?.email || 'Família' });

  return (
    <NinouScreen eyebrow={displayDate(selectedDayId)} title="Diário" subtitle="Registros, acontecimentos e notas compartilhadas pela família.">
      <NinouCard style={styles.dateCard}>
        <Pressable accessibilityLabel="Dia anterior" onPress={() => setSelectedDayId((day) => shiftDay(day, -1))} style={[styles.dateArrow, { backgroundColor: colors.surfaceElevated }]}><Ionicons name="chevron-back" size={20} color={colors.primary} /></Pressable>
        <View style={styles.dateCopy}><Text style={[styles.dateTitle, { color: colors.text }]}>{displayDate(selectedDayId)}</Text><TextInput value={selectedDayId} onChangeText={setSelectedDayId} maxLength={10} keyboardType="numbers-and-punctuation" style={[styles.dateInput, { color: colors.textMuted }]} /></View>
        <Pressable accessibilityLabel="Dia seguinte" disabled={selectedDayId >= getLocalDateId()} onPress={() => setSelectedDayId((day) => shiftDay(day, 1))} style={[styles.dateArrow, { backgroundColor: colors.surfaceElevated }, selectedDayId >= getLocalDateId() && styles.disabled]}><Ionicons name="chevron-forward" size={20} color={colors.primary} /></Pressable>
      </NinouCard>

      <View style={styles.filterRow}>{filters.map((item) => <Pressable key={item.key} onPress={() => setFilter(item.key)} style={[styles.chip, { backgroundColor: filter === item.key ? colors.primary : colors.surface, borderColor: filter === item.key ? colors.primary : colors.border }]}><Text style={[styles.chipText, { color: filter === item.key ? '#FFFFFF' : colors.textMuted }]}>{item.label}</Text></Pressable>)}</View>

      {events.length ? <View style={styles.timeline}>{events.map((event, index) => (
        <View key={event.id} style={styles.timelineRow}>
          <View style={styles.rail}><View style={[styles.dot, { backgroundColor: colors.primary }]} />{index < events.length - 1 ? <View style={[styles.line, { backgroundColor: colors.border }]} /> : null}</View>
          <Pressable onPress={() => openEdit(event)} style={styles.eventPressable}>
            <NinouCard style={styles.eventCard}>
              <View style={styles.eventHead}><ActionArt type={event.type} size={50} /><View style={styles.eventCopy}><Text style={[styles.eventTitle, { color: colors.text }]}>{recordConfig[event.type].title}</Text><Text style={[styles.eventTime, { color: colors.primary }]}>{formatTime(event.start)}{event.end > event.start ? ` · ${formatDuration(event.end - event.start)}` : ''}</Text></View><Pressable onPress={() => confirmDelete(event)} hitSlop={10}><Ionicons name="trash-outline" size={18} color={colors.textMuted} /></Pressable></View>
              {event.detail ? <Text style={[styles.eventDetail, { color: colors.text }]}>{event.detail}{event.amountMl ? ` • ${event.amountMl} ml` : ''}</Text> : null}
              {event.notes ? <Text style={[styles.eventNotes, { color: colors.textMuted }]}>{event.notes}</Text> : null}
              <Text style={[styles.editHint, { color: colors.textMuted }]}>Toque para corrigir horário ou detalhes</Text>
            </NinouCard>
          </Pressable>
        </View>
      ))}</View> : <NinouCard><View style={styles.emptyState}><Ionicons name="book-outline" size={32} color={colors.primary} /><Text style={[styles.emptyTitle, { color: colors.text }]}>Nenhum registro nesta data</Text><Text style={[styles.emptyText, { color: colors.textMuted }]}>Limpe o filtro ou adicione um cuidado para este dia.</Text><Pressable onPress={() => router.push({ pathname: '/registrar', params: { dayId: selectedDayId } })} style={[styles.emptyButton, { backgroundColor: colors.primary }]}><Text style={styles.emptyButtonText}>Novo registro</Text></Pressable></View></NinouCard>}

      <NinouCard>
        <View style={styles.notesHead}><View><Text style={[styles.notesKicker, { color: colors.primary }]}>Observações do dia</Text><Text style={[styles.notesTitle, { color: colors.text }]}>Acontecimentos importantes</Text></View><View style={[styles.autosave, { backgroundColor: colors.primarySoft }]}><Ionicons name="cloud-done-outline" size={14} color={colors.primary} /><Text style={[styles.autosaveText, { color: colors.primary }]}>automático</Text></View></View>
        <View style={styles.quickGrid}>{quickObservations.map(([icon, text]) => <Pressable key={text} onPress={() => saveEpisode(icon, text)} style={[styles.quickNote, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}><Text style={styles.quickIcon}>{icon}</Text><Text style={[styles.quickText, { color: colors.text }]}>{text.replace('Teve ', '').replace('Tomou ', '')}</Text></Pressable>)}</View>
        <Pressable onPress={() => setNewEpisodeOpen(true)} style={[styles.newEpisode, { borderColor: colors.primary }]}><Ionicons name="add-circle-outline" size={20} color={colors.primary} /><Text style={[styles.newEpisodeText, { color: colors.primary }]}>Novo episódio</Text></Pressable>
        {dayState.noteEpisodes.length ? <View style={styles.episodes}>{[...dayState.noteEpisodes].reverse().map((episode) => <View key={episode.id} style={[styles.episode, { backgroundColor: colors.surfaceElevated }]}><Text style={styles.episodeIcon}>{episode.icon}</Text><View style={styles.episodeCopy}><Text style={[styles.episodeText, { color: colors.text }]}>{episode.text}</Text><Text style={[styles.episodeMeta, { color: colors.textMuted }]}>{formatTime(episode.time)} · {episode.caregiver}</Text></View><Pressable onPress={() => deleteNoteEpisode(selectedDayId, episode.id)}><Ionicons name="close" size={18} color={colors.textMuted} /></Pressable></View>)}</View> : null}
        <Text style={[styles.freeLabel, { color: colors.text }]}>Nota livre do dia (opcional)</Text>
        <TextInput multiline value={freeform} onChangeText={setFreeform} placeholder="Ex.: dormiu melhor depois do banho, aceitou bem a mamadeira…" placeholderTextColor={colors.textMuted} style={[styles.textArea, { color: colors.text, backgroundColor: colors.surfaceElevated, borderColor: colors.border }]} />
      </NinouCard>

      <Modal visible={Boolean(editing)} transparent animationType="slide" onRequestClose={() => setEditing(null)}><View style={styles.backdrop}><View style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.border }]}><View style={[styles.handle, { backgroundColor: colors.border }]} /><Text style={[styles.modalKicker, { color: colors.primary }]}>CORRIGIR REGISTRO</Text><Text style={[styles.modalTitle, { color: colors.text }]}>{editing ? recordConfig[editing.type].title : ''}</Text><View style={styles.timeRow}><EditField label="Início" value={editStart} onChangeText={setEditStart} /><EditField label="Fim" value={editEnd} onChangeText={setEditEnd} /></View><EditField label="Detalhe" value={editDetail} onChangeText={setEditDetail} /><EditField label="Observações" value={editNotes} onChangeText={setEditNotes} multiline /><View style={styles.modalActions}><Pressable onPress={() => setEditing(null)} style={[styles.cancel, { borderColor: colors.border }]}><Text style={[styles.cancelText, { color: colors.text }]}>Cancelar</Text></Pressable><Pressable onPress={saveEdit} style={[styles.save, { backgroundColor: colors.primary }]}><Text style={styles.saveText}>Salvar correção</Text></Pressable></View></View></View></Modal>

      <Modal visible={newEpisodeOpen} transparent animationType="fade" onRequestClose={() => setNewEpisodeOpen(false)}><View style={styles.backdrop}><View style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.border }]}><Text style={[styles.modalKicker, { color: colors.primary }]}>NOVO EPISÓDIO</Text><Text style={[styles.modalTitle, { color: colors.text }]}>O que aconteceu?</Text><TextInput multiline value={newEpisode} onChangeText={setNewEpisode} placeholder="Descreva de forma breve" placeholderTextColor={colors.textMuted} style={[styles.textArea, { color: colors.text, backgroundColor: colors.surfaceElevated, borderColor: colors.border }]} /><View style={styles.modalActions}><Pressable onPress={() => setNewEpisodeOpen(false)} style={[styles.cancel, { borderColor: colors.border }]}><Text style={[styles.cancelText, { color: colors.text }]}>Cancelar</Text></Pressable><Pressable disabled={!newEpisode.trim()} onPress={() => { saveEpisode('✦', newEpisode.trim()); setNewEpisode(''); setNewEpisodeOpen(false); }} style={[styles.save, { backgroundColor: colors.primary }, !newEpisode.trim() && styles.disabled]}><Text style={styles.saveText}>Registrar agora</Text></Pressable></View></View></View></Modal>
    </NinouScreen>
  );

  function EditField({ label, value, onChangeText, multiline = false }: { label: string; value: string; onChangeText: (value: string) => void; multiline?: boolean }) {
    return <View style={[styles.editField, !multiline && styles.editFieldCompact]}><Text style={[styles.freeLabel, { color: colors.text }]}>{label}</Text><TextInput multiline={multiline} value={value} onChangeText={onChangeText} placeholderTextColor={colors.textMuted} style={[multiline ? styles.textArea : styles.editInput, { color: colors.text, backgroundColor: colors.surfaceElevated, borderColor: colors.border }]} /></View>;
  }
}

const styles = StyleSheet.create({
  dateCard: { minHeight: 86, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12 }, dateArrow: { width: 44, height: 44, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }, dateCopy: { flex: 1, alignItems: 'center' }, dateTitle: { fontSize: 17, fontWeight: '900', textTransform: 'capitalize' }, dateInput: { marginTop: 2, fontSize: 11, fontWeight: '700', textAlign: 'center', minWidth: 100 },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }, chip: { minHeight: 38, paddingHorizontal: spacing.md, borderRadius: radius.pill, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center' }, chipText: { fontSize: 12, fontWeight: '800' },
  timeline: { gap: 0 }, timelineRow: { flexDirection: 'row', alignItems: 'stretch' }, rail: { width: 26, alignItems: 'center' }, dot: { width: 10, height: 10, borderRadius: 5, marginTop: 27, zIndex: 2 }, line: { width: 2, flex: 1 }, eventPressable: { flex: 1 }, eventCard: { marginBottom: spacing.md, padding: spacing.md }, eventHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.md }, eventCopy: { flex: 1 }, eventTitle: { fontSize: 15, fontWeight: '900' }, eventTime: { fontSize: 12, fontWeight: '800', marginTop: 2 }, eventDetail: { fontSize: 13, fontWeight: '700', marginTop: spacing.md }, eventNotes: { fontSize: 12, lineHeight: 18, marginTop: spacing.xs }, editHint: { marginTop: 10, fontSize: 9.5, fontWeight: '700' },
  emptyState: { minHeight: 230, alignItems: 'center', justifyContent: 'center', gap: spacing.md, paddingHorizontal: spacing.lg }, emptyTitle: { fontSize: 18, fontWeight: '900' }, emptyText: { fontSize: 13, lineHeight: 19, textAlign: 'center' }, emptyButton: { minHeight: 44, borderRadius: radius.md, paddingHorizontal: spacing.xl, alignItems: 'center', justifyContent: 'center' }, emptyButtonText: { color: '#FFF', fontWeight: '900' },
  notesHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }, notesKicker: { fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 }, notesTitle: { fontSize: 18, fontWeight: '900', marginTop: 3 }, autosave: { borderRadius: 99, paddingHorizontal: 8, paddingVertical: 6, flexDirection: 'row', alignItems: 'center', gap: 4 }, autosaveText: { fontSize: 8.5, fontWeight: '900' },
  quickGrid: { marginTop: 16, flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, quickNote: { width: '31%', flexGrow: 1, minHeight: 64, borderRadius: 17, borderWidth: StyleSheet.hairlineWidth, padding: 8, alignItems: 'center', justifyContent: 'center', gap: 4 }, quickIcon: { fontSize: 19 }, quickText: { fontSize: 9.5, fontWeight: '800', textAlign: 'center' }, newEpisode: { minHeight: 48, marginTop: 12, borderRadius: 16, borderWidth: 1, borderStyle: 'dashed', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 }, newEpisodeText: { fontSize: 13, fontWeight: '900' },
  episodes: { marginTop: 14, gap: 8 }, episode: { minHeight: 62, borderRadius: 17, padding: 10, flexDirection: 'row', alignItems: 'center', gap: 10 }, episodeIcon: { fontSize: 22 }, episodeCopy: { flex: 1 }, episodeText: { fontSize: 12.5, lineHeight: 17, fontWeight: '800' }, episodeMeta: { marginTop: 3, fontSize: 9.5, fontWeight: '700' }, freeLabel: { marginTop: 15, marginBottom: 7, fontSize: 11.5, fontWeight: '900' }, textArea: { minHeight: 104, borderRadius: 17, borderWidth: StyleSheet.hairlineWidth, padding: 13, fontSize: 13, lineHeight: 19, textAlignVertical: 'top' },
  backdrop: { flex: 1, backgroundColor: 'rgba(6,3,13,0.62)', justifyContent: 'flex-end' }, modalCard: { width: '100%', maxWidth: 540, alignSelf: 'center', maxHeight: '88%', borderTopLeftRadius: 30, borderTopRightRadius: 30, borderWidth: StyleSheet.hairlineWidth, padding: 20 }, handle: { width: 45, height: 5, borderRadius: 3, alignSelf: 'center', marginBottom: 18 }, modalKicker: { fontSize: 10, fontWeight: '900', letterSpacing: 1.2 }, modalTitle: { marginTop: 5, marginBottom: 8, fontSize: 25, fontWeight: '900' }, timeRow: { flexDirection: 'row', gap: 10 }, editField: { width: '100%' }, editFieldCompact: { flex: 1 }, editInput: { minHeight: 50, borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 13, fontSize: 14, fontWeight: '700' }, modalActions: { flexDirection: 'row', gap: 10, marginTop: 18 }, cancel: { flex: 1, minHeight: 52, borderRadius: 17, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center' }, cancelText: { fontSize: 13, fontWeight: '900' }, save: { flex: 1.35, minHeight: 52, borderRadius: 17, alignItems: 'center', justifyContent: 'center' }, saveText: { color: '#FFF', fontSize: 13, fontWeight: '900' }, disabled: { opacity: 0.45 },
});
