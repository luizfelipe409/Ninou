import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { ActionArt } from '@/components/action-art';
import { formatDuration, getBreastfeedingDurations, type BreastfeedingSide } from '@/domain/routine';
import { useRoutine } from '@/state/routine-context';
import { useNinouTheme } from '@/theme/tokens';

type Props = {
  bottom: number;
  width: number;
  left: number;
};

export function BreastfeedingTimerBar({ bottom, width, left }: Props) {
  const { colors, isDark } = useNinouTheme();
  const {
    state,
    now,
    canWrite,
    pauseBreastfeeding,
    resumeBreastfeeding,
    changeBreastfeedingSide,
    finishBreastfeeding,
  } = useRoutine();
  const timer = state.breastfeedingTimer;
  if (!timer) return null;

  const durations = getBreastfeedingDurations(timer, now || timer.activeSideStartedAt || timer.startedAt);
  const activeSideLabel = timer.activeSide === 'left' ? 'Esquerdo' : timer.activeSide === 'right' ? 'Direito' : 'Pausado';
  const alternateSide: BreastfeedingSide = timer.activeSide === 'right' ? 'left' : 'right';

  const run = (action: () => void) => {
    if (!canWrite) return;
    void Haptics.selectionAsync();
    action();
  };

  return (
    <View
      accessibilityLiveRegion="polite"
      style={[
        styles.container,
        {
          width,
          left,
          bottom,
          backgroundColor: isDark ? 'rgba(25,16,48,0.98)' : 'rgba(255,252,249,0.98)',
          borderColor: isDark ? 'rgba(190,169,255,0.25)' : 'rgba(114,78,188,0.14)',
          shadowColor: isDark ? '#000000' : colors.primary,
        },
      ]}>
      <LinearGradient
        pointerEvents="none"
        colors={isDark ? ['rgba(151,119,255,0.20)', 'rgba(83,226,191,0.06)'] : ['rgba(128,91,237,0.12)', 'rgba(255,255,255,0.58)']}
        style={StyleSheet.absoluteFill}
      />
      <Pressable accessibilityRole="button" accessibilityLabel="Abrir timer completo da amamentação" onPress={() => router.push({ pathname: '/registrar', params: { type: 'amamentacao' } })} style={styles.summary}>
        <ActionArt type="amamentacao" size={38} />
        <View style={styles.copy}>
          <Text style={[styles.kicker, { color: colors.primary }]}>MAMADA EM ANDAMENTO</Text>
          <Text numberOfLines={1} style={[styles.title, { color: colors.text }]}>{activeSideLabel} · {formatDuration(durations.totalDurationMs, true)}</Text>
          <Text numberOfLines={1} style={[styles.sides, { color: colors.textMuted }]}>E {formatDuration(durations.leftDurationMs, true)} · D {formatDuration(durations.rightDurationMs, true)}</Text>
        </View>
      </Pressable>
      {canWrite ? <View style={styles.actions}>
        <TimerButton
          label={timer.activeSide ? 'Pausar' : 'Retomar'}
          icon={timer.activeSide ? 'pause' : 'play'}
          onPress={() => run(timer.activeSide ? pauseBreastfeeding : () => resumeBreastfeeding())}
          color={colors.primary}
          background={colors.primarySoft}
        />
        <TimerButton
          label={alternateSide === 'left' ? 'Lado E' : 'Lado D'}
          icon="swap-horizontal"
          onPress={() => run(() => changeBreastfeedingSide(alternateSide))}
          color={colors.text}
          background={colors.surfaceElevated}
        />
        <TimerButton
          label="Finalizar"
          icon="checkmark"
          onPress={() => run(() => {
            const result = finishBreastfeeding();
            if (!result.ok) Alert.alert(result.conflict.title, result.conflict.message);
          })}
          color="#FFFFFF"
          background={colors.accent}
        />
      </View> : <View style={[styles.viewerBadge, { backgroundColor: colors.surfaceElevated }]}><Ionicons name="eye-outline" size={16} color={colors.textMuted} /><Text style={[styles.viewerText, { color: colors.textMuted }]}>Ao vivo</Text></View>}
    </View>
  );
}

function TimerButton({ label, icon, onPress, color, background }: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  color: string;
  background: string;
}) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={({ pressed }) => [styles.button, { backgroundColor: background }, pressed && styles.pressed]}>
      <Ionicons name={icon} size={15} color={color} />
      <Text numberOfLines={1} style={[styles.buttonText, { color }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    minHeight: 80,
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    overflow: 'hidden',
    shadowOpacity: 0.22,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 16,
    zIndex: 30,
  },
  summary: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 8 },
  copy: { flex: 1, minWidth: 0 },
  kicker: { fontSize: 7.5, lineHeight: 10, fontWeight: '900', letterSpacing: 0.7 },
  title: { marginTop: 2, fontSize: 12, lineHeight: 15, fontWeight: '900', fontVariant: ['tabular-nums'] },
  sides: { marginTop: 2, fontSize: 8.5, lineHeight: 11, fontWeight: '700', fontVariant: ['tabular-nums'] },
  actions: { flexDirection: 'row', gap: 5 },
  viewerBadge: { width: 48, minHeight: 52, borderRadius: 15, alignItems: 'center', justifyContent: 'center', gap: 3 },
  viewerText: { fontSize: 8, fontWeight: '900' },
  button: { width: 48, minHeight: 52, borderRadius: 15, alignItems: 'center', justifyContent: 'center', gap: 3, paddingHorizontal: 2 },
  buttonText: { width: '100%', fontSize: 7.5, lineHeight: 9, fontWeight: '900', textAlign: 'center' },
  pressed: { opacity: 0.72, transform: [{ scale: 0.96 }] },
});
