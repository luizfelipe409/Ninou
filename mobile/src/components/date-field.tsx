import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo, useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { useNinouTheme } from '@/theme/tokens';

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

export function DateField({
  label,
  value,
  onChange,
  placeholder = 'Selecionar data',
  maximumDate = new Date(),
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
  const { colors, isDark } = useNinouTheme();
  const [open, setOpen] = useState(false);
  const selectedDate = useMemo(() => parseDate(value), [value]);
  const formatted = value && /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? selectedDate.toLocaleDateString('pt-BR')
    : '';

  const apply = (_event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === 'android') setOpen(false);
    if (date) onChange(toDateId(date));
  };

  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
      <Pressable
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${formatted || placeholder}`}
        onPress={() => setOpen(true)}
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
          <Text style={[styles.helper, { color: colors.textMuted }]}>Toque para abrir o calendário</Text>
        </View>
        <Ionicons name="chevron-down" size={17} color={colors.textMuted} />
      </Pressable>

      {Platform.OS === 'android' && open ? (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display="calendar"
          locale="pt-BR"
          maximumDate={maximumDate}
          minimumDate={minimumDate}
          onChange={apply}
        />
      ) : null}

      <Modal visible={Platform.OS !== 'android' && open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <View style={styles.backdrop}>
          <View style={[styles.modal, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={[styles.kicker, { color: colors.primary }]}>CALENDÁRIO</Text>
                <Text style={[styles.title, { color: colors.text }]}>{label}</Text>
              </View>
              <Pressable onPress={() => setOpen(false)} style={[styles.close, { backgroundColor: colors.surfaceElevated }]}>
                <Ionicons name="close" size={21} color={colors.text} />
              </Pressable>
            </View>
            <DateTimePicker
              value={selectedDate}
              mode="date"
              display="inline"
              locale="pt-BR"
              maximumDate={maximumDate}
              minimumDate={minimumDate}
              accentColor={colors.primary}
              themeVariant={isDark ? 'dark' : 'light'}
              onChange={apply}
            />
            <Pressable onPress={() => setOpen(false)} style={[styles.done, { backgroundColor: colors.primary }]}>
              <Text style={styles.doneText}>Concluir</Text>
            </Pressable>
          </View>
        </View>
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
  backdrop: { flex: 1, backgroundColor: 'rgba(6,3,13,0.68)', alignItems: 'center', justifyContent: 'center', padding: 16 },
  modal: { width: '100%', maxWidth: 390, borderRadius: 28, borderWidth: StyleSheet.hairlineWidth, padding: 16, overflow: 'hidden' },
  modalHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  kicker: { fontSize: 10, fontWeight: '900', letterSpacing: 1.2 },
  title: { marginTop: 5, fontSize: 23, lineHeight: 28, fontWeight: '900' },
  close: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  done: { minHeight: 49, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  doneText: { color: '#FFF', fontSize: 13, fontWeight: '900' },
});
