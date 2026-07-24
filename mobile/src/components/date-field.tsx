import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useNinouTheme } from '@/theme/tokens';

const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'] as const;

function parseDate(value: string) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const parsed = new Date(`${value}T12:00:00`);
    if (Number.isFinite(parsed.getTime())) return parsed;
  }
  const fallback = new Date();
  fallback.setHours(12, 0, 0, 0);
  return fallback;
}

function toDateId(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function dayOnly(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0, 0);
}

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function clampDate(date: Date, minimumDate?: Date, maximumDate?: Date) {
  const candidate = dayOnly(date);
  const minimum = minimumDate ? dayOnly(minimumDate) : null;
  const maximum = maximumDate ? dayOnly(maximumDate) : null;
  if (minimum && candidate < minimum) return minimum;
  if (maximum && candidate > maximum) return maximum;
  return candidate;
}

function withDatePart(date: Date, part: 'day' | 'month' | 'year', value: number, minimumDate?: Date, maximumDate?: Date) {
  const year = part === 'year' ? value : date.getFullYear();
  const month = part === 'month' ? value : date.getMonth();
  const day = part === 'day' ? value : Math.min(date.getDate(), daysInMonth(year, month));
  return clampDate(new Date(year, month, day, 12, 0, 0, 0), minimumDate, maximumDate);
}

function DateColumn({
  label,
  values,
  selected,
  format,
  onSelect,
}: {
  label: string;
  values: number[];
  selected: number;
  format: (value: number) => string;
  onSelect: (value: number) => void;
}) {
  const { colors } = useNinouTheme();
  return (
    <View style={styles.column}>
      <Text style={[styles.columnLabel, { color: colors.textMuted }]}>{label}</Text>
      <ScrollView
        nestedScrollEnabled
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.columnContent}>
        {values.map((value) => {
          const active = value === selected;
          return (
            <Pressable
              key={`${label}-${value}`}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              onPress={() => onSelect(value)}
              style={({ pressed }) => [
                styles.option,
                { backgroundColor: active ? colors.primarySoft : 'transparent', borderColor: active ? colors.primary : 'transparent' },
                pressed && styles.pressed,
              ]}>
              <Text style={[styles.optionText, { color: active ? colors.primary : colors.text, fontWeight: active ? '900' : '700' }]}>{format(value)}</Text>
              {active ? <Ionicons name="checkmark-circle" size={17} color={colors.primary} /> : null}
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

export function DateField({
  label,
  value,
  onChange,
  placeholder = 'Selecionar data',
  maximumDate,
  minimumDate,
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maximumDate?: Date;
  minimumDate?: Date;
  disabled?: boolean;
}) {
  const { colors } = useNinouTheme();
  const [open, setOpen] = useState(false);
  const today = useMemo(() => new Date(), []);
  const minimumTimestamp = minimumDate?.getTime();
  const maximumTimestamp = maximumDate?.getTime() ?? today.getTime();
  const effectiveMinimumDate = useMemo(() => minimumTimestamp === undefined ? undefined : new Date(minimumTimestamp), [minimumTimestamp]);
  const effectiveMaximumDate = useMemo(() => new Date(maximumTimestamp), [maximumTimestamp]);
  const selectedDate = useMemo(() => clampDate(parseDate(value), effectiveMinimumDate, effectiveMaximumDate), [effectiveMaximumDate, effectiveMinimumDate, value]);
  const [draftDate, setDraftDate] = useState(selectedDate);
  const formatted = value && /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? selectedDate.toLocaleDateString('pt-BR')
    : '';
  const minimumYear = effectiveMinimumDate?.getFullYear() ?? 2000;
  const maximumYear = effectiveMaximumDate.getFullYear();
  const years = useMemo(() => Array.from({ length: Math.max(1, maximumYear - minimumYear + 1) }, (_, index) => maximumYear - index), [maximumYear, minimumYear]);
  const months = useMemo(() => Array.from({ length: 12 }, (_, index) => index), []);
  const days = useMemo(() => Array.from({ length: daysInMonth(draftDate.getFullYear(), draftDate.getMonth()) }, (_, index) => index + 1), [draftDate]);

  const confirm = () => {
    onChange(toDateId(draftDate));
    setOpen(false);
  };

  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
      <Pressable
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${formatted || placeholder}`}
        onPress={() => {
          setDraftDate(selectedDate);
          setOpen(true);
        }}
        style={({ pressed }) => [
          styles.input,
          { backgroundColor: colors.surfaceElevated, borderColor: colors.border },
          pressed && !disabled && styles.pressed,
          disabled && styles.disabled,
        ]}>
        <View style={[styles.icon, { backgroundColor: colors.primarySoft }]}>
          <Ionicons name="calendar-outline" size={19} color={colors.primary} />
        </View>
        <View style={styles.copy}>
          <Text style={[styles.value, { color: formatted ? colors.text : colors.textMuted }]}>{formatted || placeholder}</Text>
          <Text style={[styles.helper, { color: colors.textMuted }]}>Escolha dia, mês e ano</Text>
        </View>
        <Ionicons name="chevron-down" size={17} color={colors.textMuted} />
      </Pressable>

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={[styles.modal, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={(event) => event.stopPropagation()}>
            <View style={[styles.handle, { backgroundColor: colors.border }]} />
            <View style={styles.modalHeader}>
              <View style={styles.headerCopy}>
                <Text style={[styles.kicker, { color: colors.primary }]}>DATA COMPLETA</Text>
                <Text style={[styles.title, { color: colors.text }]}>{label}</Text>
                <Text style={[styles.preview, { color: colors.textMuted }]}>{draftDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</Text>
              </View>
              <Pressable accessibilityLabel="Fechar calendário" onPress={() => setOpen(false)} style={[styles.close, { backgroundColor: colors.surfaceElevated }]}>
                <Ionicons name="close" size={21} color={colors.text} />
              </Pressable>
            </View>

            <View style={[styles.pickerFrame, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
              <DateColumn label="DIA" values={days} selected={draftDate.getDate()} format={(day) => String(day).padStart(2, '0')} onSelect={(day) => setDraftDate((current) => withDatePart(current, 'day', day, effectiveMinimumDate, effectiveMaximumDate))} />
              <View style={[styles.separator, { backgroundColor: colors.border }]} />
              <DateColumn label="MÊS" values={months} selected={draftDate.getMonth()} format={(month) => MONTHS[month]} onSelect={(month) => setDraftDate((current) => withDatePart(current, 'month', month, effectiveMinimumDate, effectiveMaximumDate))} />
              <View style={[styles.separator, { backgroundColor: colors.border }]} />
              <DateColumn label="ANO" values={years} selected={draftDate.getFullYear()} format={String} onSelect={(year) => setDraftDate((current) => withDatePart(current, 'year', year, effectiveMinimumDate, effectiveMaximumDate))} />
            </View>

            <View style={styles.actions}>
              <Pressable onPress={() => setOpen(false)} style={[styles.secondary, { borderColor: colors.border }]}><Text style={[styles.secondaryText, { color: colors.text }]}>Cancelar</Text></Pressable>
              <Pressable onPress={confirm} style={[styles.done, { backgroundColor: colors.primary }]}><Ionicons name="checkmark-circle" size={19} color="#FFF" /><Text style={styles.doneText}>Usar esta data</Text></Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: 7 },
  label: { fontSize: 12, fontWeight: '900' },
  input: { minHeight: 68, borderRadius: 19, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', gap: 11 },
  icon: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  copy: { flex: 1 },
  value: { fontSize: 14.5, fontWeight: '900' },
  helper: { marginTop: 3, fontSize: 9.5, fontWeight: '700' },
  pressed: { opacity: 0.82 },
  disabled: { opacity: 0.48 },
  backdrop: { flex: 1, backgroundColor: 'rgba(6,3,13,0.7)', justifyContent: 'flex-end' },
  modal: { width: '100%', maxWidth: 540, maxHeight: '88%', alignSelf: 'center', borderTopLeftRadius: 32, borderTopRightRadius: 32, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 18, paddingTop: 10, paddingBottom: 24 },
  handle: { width: 46, height: 5, borderRadius: 3, alignSelf: 'center', marginBottom: 18 },
  modalHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  headerCopy: { flex: 1 },
  kicker: { fontSize: 10, fontWeight: '900', letterSpacing: 1.2 },
  title: { marginTop: 5, fontSize: 24, lineHeight: 29, fontWeight: '900' },
  preview: { marginTop: 6, fontSize: 12, lineHeight: 17, fontWeight: '700', textTransform: 'capitalize' },
  close: { width: 42, height: 42, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  pickerFrame: { height: 270, marginTop: 18, borderRadius: 23, borderWidth: StyleSheet.hairlineWidth, padding: 8, flexDirection: 'row', overflow: 'hidden' },
  column: { flex: 1, minWidth: 0 },
  columnLabel: { height: 31, textAlign: 'center', fontSize: 9, lineHeight: 24, fontWeight: '900', letterSpacing: 1 },
  columnContent: { paddingBottom: 8, gap: 4 },
  option: { minHeight: 42, borderRadius: 13, borderWidth: 1, paddingHorizontal: 7, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 },
  optionText: { fontSize: 13 },
  separator: { width: StyleSheet.hairlineWidth, marginHorizontal: 3, marginTop: 31, marginBottom: 4 },
  actions: { marginTop: 16, flexDirection: 'row', gap: 9 },
  secondary: { flex: 0.72, minHeight: 52, borderRadius: 17, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center' },
  secondaryText: { fontSize: 12.5, fontWeight: '900' },
  done: { flex: 1.28, minHeight: 52, borderRadius: 17, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  doneText: { color: '#FFF', fontSize: 12.5, fontWeight: '900' },
});
