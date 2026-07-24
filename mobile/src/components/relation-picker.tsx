import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { useNinouTheme } from '@/theme/tokens';

const options = ['Pai', 'Mãe', 'Avó', 'Avô', 'Babá', 'Cuidador(a)', 'Tia', 'Tio'];
const legacyGenericRelations = new Set(['Responsável']);

export function RelationPicker({ label = 'Relação com o bebê', value, onChange, disabled = false }: { label?: string; value: string; onChange: (value: string) => void; disabled?: boolean }) {
  const { colors } = useNinouTheme();
  const [open, setOpen] = useState(false);
  const visibleValue = legacyGenericRelations.has(value) ? '' : value;
  const [custom, setCustom] = useState(options.includes(visibleValue) ? '' : visibleValue);
  const selectedKnown = options.includes(visibleValue);

  const choose = (next: string) => {
    onChange(next);
    setOpen(false);
  };

  const applyCustom = () => {
    const next = custom.trim();
    if (!next) return;
    onChange(next.slice(0, 40));
    setOpen(false);
  };

  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
      <Pressable
        disabled={disabled}
        accessibilityRole="button"
        onPress={() => {
          setCustom(selectedKnown ? '' : visibleValue);
          setOpen(true);
        }}
        style={({ pressed }) => [styles.input, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }, pressed && !disabled && styles.pressed, disabled && styles.disabled]}>
        <View style={[styles.icon, { backgroundColor: colors.primarySoft }]}><Ionicons name="people-outline" size={19} color={colors.primary} /></View>
        <Text style={[styles.value, { color: visibleValue ? colors.text : colors.textMuted }]}>{visibleValue || 'Escolher relação'}</Text>
        <Ionicons name="chevron-down" size={17} color={colors.textMuted} />
      </Pressable>

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <KeyboardAvoidingView style={styles.backdrop} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setOpen(false)} />
          <View style={[styles.sheet, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.handle, { backgroundColor: colors.border }]} />
            <View style={styles.header}>
              <View style={styles.headerCopy}>
                <Text style={[styles.kicker, { color: colors.primary }]}>IDENTIDADE DO CUIDADOR</Text>
                <Text style={[styles.title, { color: colors.text }]}>{label}</Text>
                <Text style={[styles.subtitle, { color: colors.textMuted }]}>Essa informação aparecerá nos registros do Diário.</Text>
              </View>
              <Pressable onPress={() => setOpen(false)} style={[styles.close, { backgroundColor: colors.surfaceElevated }]}><Ionicons name="close" size={21} color={colors.text} /></Pressable>
            </View>
            <ScrollView contentContainerStyle={styles.options} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {options.map((option) => {
                const selected = visibleValue === option;
                return (
                  <Pressable key={option} onPress={() => choose(option)} style={[styles.option, { backgroundColor: selected ? colors.primarySoft : colors.surfaceElevated, borderColor: selected ? colors.primary : colors.border }]}>
                    <View style={[styles.radio, { borderColor: selected ? colors.primary : colors.textMuted }]}>{selected ? <View style={[styles.radioDot, { backgroundColor: colors.primary }]} /> : null}</View>
                    <Text style={[styles.optionText, { color: colors.text }]}>{option}</Text>
                    {selected ? <Ionicons name="checkmark-circle" size={20} color={colors.primary} /> : null}
                  </Pressable>
                );
              })}
              <View style={[styles.customCard, { backgroundColor: colors.surfaceElevated, borderColor: !selectedKnown && visibleValue ? colors.primary : colors.border }]}>
                <Text style={[styles.customLabel, { color: colors.text }]}>Outra relação</Text>
                <TextInput
                  value={custom}
                  onChangeText={setCustom}
                  placeholder="Ex.: Madrinha, enfermeira…"
                  placeholderTextColor={colors.textMuted}
                  returnKeyType="done"
                  onSubmitEditing={applyCustom}
                  style={[styles.customInput, { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border }]}
                />
                <Pressable disabled={!custom.trim()} onPress={applyCustom} style={[styles.apply, { backgroundColor: colors.primary }, !custom.trim() && styles.disabled]}><Text style={styles.applyText}>Usar esta relação</Text></Pressable>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: 7 },
  label: { fontSize: 12, fontWeight: '900' },
  input: { minHeight: 62, borderRadius: 19, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', gap: 11 },
  icon: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  value: { flex: 1, fontSize: 14, fontWeight: '900' },
  pressed: { opacity: 0.82 },
  disabled: { opacity: 0.48 },
  backdrop: { flex: 1, backgroundColor: 'rgba(6,3,13,0.66)', justifyContent: 'flex-end' },
  sheet: { width: '100%', maxWidth: 540, maxHeight: '94%', alignSelf: 'center', borderTopLeftRadius: 30, borderTopRightRadius: 30, borderWidth: StyleSheet.hairlineWidth, padding: 18 },
  handle: { width: 46, height: 5, borderRadius: 3, alignSelf: 'center', marginBottom: 15 },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  headerCopy: { flex: 1 },
  kicker: { fontSize: 9.5, fontWeight: '900', letterSpacing: 1.1 },
  title: { marginTop: 5, fontSize: 24, lineHeight: 29, fontWeight: '900' },
  subtitle: { marginTop: 5, fontSize: 12, lineHeight: 18, fontWeight: '600' },
  close: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  options: { paddingTop: 14, paddingBottom: 20, gap: 7 },
  option: { minHeight: 50, borderRadius: 17, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', gap: 11 },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  radioDot: { width: 10, height: 10, borderRadius: 5 },
  optionText: { flex: 1, fontSize: 13.5, fontWeight: '800' },
  customCard: { borderRadius: 19, borderWidth: StyleSheet.hairlineWidth, padding: 12, gap: 9, marginTop: 4 },
  customLabel: { fontSize: 12, fontWeight: '900' },
  customInput: { minHeight: 49, borderRadius: 15, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 12, fontSize: 13.5, fontWeight: '700' },
  apply: { minHeight: 47, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  applyText: { color: '#FFF', fontSize: 12.5, fontWeight: '900' },
});
