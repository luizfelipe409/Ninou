import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import { Animated, Modal, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';

import { ActionArt } from '@/components/action-art';
import { formatDuration, formatTime, getElapsedMs, recordConfig, type DayState, type RoutineEvent } from '@/domain/routine';
import { useNinouTheme } from '@/theme/tokens';

const starPoints = [
  [12, 17, 2], [21, 28, 1], [31, 12, 1.5], [42, 22, 1], [55, 10, 2],
  [70, 18, 1], [83, 31, 1.5], [91, 54, 2], [76, 72, 1], [62, 88, 1.5],
  [38, 83, 2], [18, 70, 1], [8, 49, 1.5], [27, 55, 1], [51, 32, 1.5],
] as const;

function pointForTime(timestamp: number, size: number, orbitRadius: number, markerSize = 34) {
  const date = new Date(timestamp);
  const minutes = date.getHours() * 60 + date.getMinutes();
  const angle = -Math.PI / 2 + (minutes / 1440) * Math.PI * 2;
  const center = size / 2;
  return { left: center + Math.cos(angle) * orbitRadius - markerSize / 2, top: center + Math.sin(angle) * orbitRadius - markerSize / 2 };
}

function dayFraction(timestamp: number) {
  const date = new Date(timestamp);
  return (date.getHours() * 3600 + date.getMinutes() * 60 + date.getSeconds()) / 86400;
}

function clockHint(state: DayState) {
  if (state.mode === 'idle' || !state.activeStartedAt) return 'Informe como o bebê está para iniciar a rotina com segurança.';
  const started = new Date(state.activeStartedAt);
  const today = new Date();
  const startDay = new Date(started.getFullYear(), started.getMonth(), started.getDate()).getTime();
  const todayDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const dayLabel = startDay === todayDay ? 'hoje' : startDay === todayDay - 86400000 ? 'ontem' : `em ${started.toLocaleDateString('pt-BR')}`;
  const subject = state.mode === 'sleeping' ? 'Dormindo' : 'Acordado';
  return `${subject} desde ${dayLabel}, às ${formatTime(state.activeStartedAt)}. O contador segue a partir do último registro.`;
}

export function RoutineOrbit({ state, now }: { state: DayState; now: number }) {
  const { colors, isDark } = useNinouTheme();
  const [selectedEvent, setSelectedEvent] = useState<RoutineEvent | null>(null);
  const [breathe] = useState(() => new Animated.Value(0));
  const { width } = useWindowDimensions();
  const size = Math.min(390, width - 28);
  const center = size / 2;
  const orbitRadius = size * 0.382;
  const circumference = 2 * Math.PI * orbitRadius;
  const coreWidth = Math.min(230, size * 0.66);
  const coreHeight = Math.min(154, size * 0.44);
  const elapsed = getElapsedMs(state, now);
  const title = state.mode === 'idle'
    ? 'Começar hoje'
    : state.mode === 'sleeping'
      ? state.activeType === 'dormir' ? 'Sono noturno há' : 'Dormindo há'
      : state.activeType === 'despertar-noturno' ? 'Despertar noturno há' : 'Acordado há';
  const completedSleep = state.events.filter((event) => (event.type === 'sono' || event.type === 'dormir') && event.end > event.start).slice(-5);
  const activeArc = state.mode !== 'idle' && state.activeStartedAt
    ? { start: state.activeStartedAt, end: now }
    : null;
  const nowPoint = pointForTime(now, size, orbitRadius, 10);

  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(breathe, { toValue: 1, duration: 2900, useNativeDriver: true }),
      Animated.timing(breathe, { toValue: 0, duration: 2900, useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [breathe]);

  const renderArc = (start: number, end: number, stroke: string, key: string, active = false) => {
    const durationFraction = Math.max(0.004, Math.min(0.995, (end - start) / 86400000));
    const arcLength = circumference * durationFraction;
    return (
      <Circle
        key={key}
        cx={center}
        cy={center}
        r={orbitRadius}
        fill="none"
        stroke={stroke}
        strokeWidth={active ? 17 : 11}
        strokeLinecap="round"
        strokeDasharray={`${arcLength} ${circumference - arcLength}`}
        strokeDashoffset={-dayFraction(start) * circumference}
        transform={`rotate(-90 ${center} ${center})`}
        opacity={active ? 1 : 0.56}
      />
    );
  };

  return (
    <LinearGradient
      colors={isDark ? ['#17102D', '#201746', '#0D1530'] : ['#FFE8A8', '#E3F2FF', '#F8ECF4']}
      start={{ x: 0.08, y: 0.02 }}
      end={{ x: 0.92, y: 1 }}
      style={[styles.sky, { width: size, height: size, borderColor: colors.border }]}>
      <Animated.View style={[styles.glow, styles.glowViolet, { backgroundColor: isDark ? 'rgba(117,88,232,0.25)' : 'rgba(255,255,255,0.34)', opacity: breathe.interpolate({ inputRange: [0, 1], outputRange: [0.65, 1] }), transform: [{ scale: breathe.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1.08] }) }] }]} />
      <View style={[styles.glow, styles.glowGold, { backgroundColor: isDark ? 'rgba(255,190,116,0.12)' : 'rgba(255,190,116,0.23)' }]} />
      {isDark ? starPoints.map(([left, top, dotSize], index) => (
        <View key={`${left}-${top}`} style={[styles.starDot, { left: `${left}%`, top: `${top}%`, width: dotSize * 2, height: dotSize * 2, borderRadius: dotSize, opacity: 0.42 + (index % 3) * 0.2 }]} />
      )) : (
        <>
          <View style={[styles.cloud, styles.cloudA]}><View style={styles.cloudSmall} /><View style={styles.cloudLarge} /></View>
          <View style={[styles.cloud, styles.cloudB]}><View style={styles.cloudSmall} /><View style={styles.cloudLarge} /></View>
        </>
      )}
      <Text style={[styles.sparkle, styles.sparkleA, { color: isDark ? '#FFF8E6' : '#D1B875' }]}>✦</Text>
      <Text style={[styles.sparkle, styles.sparkleB, { color: isDark ? '#FFF8E6' : '#B29AD8' }]}>✧</Text>
      <Text style={[styles.sparkle, styles.sparkleC, { color: isDark ? '#FFF8E6' : '#B29AD8' }]}>✦</Text>
      <Ionicons name={isDark ? 'moon' : 'sunny'} size={size * 0.125} color={isDark ? '#E9DFC0' : '#F2B454'} style={[styles.moon, { right: size * 0.13, top: size * 0.1 }]} />

      <Svg width={size} height={size} style={[StyleSheet.absoluteFill, { pointerEvents: 'none' }]}>
        <Defs>
          <SvgLinearGradient id="completedJourney" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#8F75FF" />
            <Stop offset="1" stopColor="#77E1CD" />
          </SvgLinearGradient>
          <SvgLinearGradient id="activeJourney" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#FFC47F" />
            <Stop offset="1" stopColor="#9F82FF" />
          </SvgLinearGradient>
        </Defs>
        <Circle cx={center} cy={center} r={orbitRadius} fill="none" stroke={isDark ? 'rgba(157,136,230,0.12)' : 'rgba(75,55,120,0.09)'} strokeWidth={30} />
        <Circle cx={center} cy={center} r={orbitRadius} fill="none" stroke={isDark ? 'rgba(222,214,255,0.13)' : 'rgba(75,55,120,0.15)'} strokeWidth={10} />
        {completedSleep.map((event) => renderArc(event.start, event.end, 'url(#completedJourney)', event.id))}
        {activeArc ? renderArc(activeArc.start, activeArc.end, 'url(#activeJourney)', 'active', true) : null}
      </Svg>

      <Animated.View style={[styles.nowDotHalo, { left: nowPoint.left - 4, top: nowPoint.top - 4, backgroundColor: `${colors.accent}24`, opacity: breathe.interpolate({ inputRange: [0, 1], outputRange: [0.45, 1] }), transform: [{ scale: breathe.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1.35] }) }] }]} />
      <View style={[styles.nowDot, { left: nowPoint.left, top: nowPoint.top, backgroundColor: colors.accent, borderColor: isDark ? '#18112C' : '#FFFFFF' }]} />

      <View style={[styles.anchor, { top: 8, left: center - 15, backgroundColor: colors.surfaceElevated }]}><Text style={[styles.anchorText, { color: colors.textMuted }]}>00</Text></View>
      <View style={[styles.anchor, { top: center - 15, right: 8, backgroundColor: colors.surfaceElevated }]}><Text style={[styles.anchorText, { color: colors.textMuted }]}>06</Text></View>
      <View style={[styles.anchor, { bottom: 8, left: center - 15, backgroundColor: colors.surfaceElevated }]}><Text style={[styles.anchorText, { color: colors.textMuted }]}>12</Text></View>
      <View style={[styles.anchor, { top: center - 15, left: 8, backgroundColor: colors.surfaceElevated }]}><Text style={[styles.anchorText, { color: colors.textMuted }]}>18</Text></View>

      {state.events.slice(-8).map((event) => {
        const point = pointForTime(event.start, size, orbitRadius);
        return (
          <Pressable accessibilityRole="button" accessibilityLabel={`Abrir ${recordConfig[event.type].title} das ${formatTime(event.start)}`} onPress={() => setSelectedEvent(event)} key={event.id} style={({ pressed }) => [styles.marker, point, { backgroundColor: colors.surface, borderColor: colors.border }, pressed && styles.markerPressed]}>
            <ActionArt type={event.type} size={30} />
            <Text style={[styles.markerTime, { color: colors.text }]}>{formatTime(event.start)}</Text>
          </Pressable>
        );
      })}

      {state.mode !== 'idle' && state.activeStartedAt ? (() => {
        const activePoint = pointForTime(state.activeStartedAt, size, orbitRadius, 40);
        const activeEvent: RoutineEvent = { id: 'active', type: state.activeType, start: state.activeStartedAt, end: now, detail: state.activeDetail, notes: state.activeNotes, createdAtClient: state.activeStartedAt };
        return <Pressable accessibilityRole="button" accessibilityLabel="Abrir cuidado em andamento" onPress={() => setSelectedEvent(activeEvent)} style={({ pressed }) => [styles.marker, styles.activeMarker, activePoint, { backgroundColor: colors.surface, borderColor: colors.accent }, pressed && styles.markerPressed]}><ActionArt type={state.activeType} size={35} /><View style={[styles.activeBadge, { backgroundColor: colors.accent }]} /><Text style={[styles.markerTime, { color: colors.text }]}>{formatTime(state.activeStartedAt)}</Text></Pressable>;
      })() : null}

      <View style={[styles.center, { width: coreWidth, height: coreHeight, borderRadius: coreHeight * 0.42, left: center - coreWidth / 2, top: center - coreHeight / 2, backgroundColor: isDark ? 'rgba(25,17,45,0.94)' : 'rgba(255,255,255,0.92)', borderColor: colors.border }]}>
        <Text style={[styles.stateLabel, { color: isDark ? '#B9A9FF' : colors.primary }]}>{title}</Text>
        <Text style={[styles.clock, { color: colors.text, fontSize: size < 340 ? 35 : 47, lineHeight: size < 340 ? 38 : 50 }]}>{state.mode === 'idle' ? '00:00:00' : formatDuration(elapsed, true)}</Text>
        <Text style={[styles.hint, { color: colors.textMuted }]} numberOfLines={3}>{clockHint(state)}</Text>
      </View>

      <Modal visible={Boolean(selectedEvent)} transparent animationType="slide" onRequestClose={() => setSelectedEvent(null)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setSelectedEvent(null)}>
          <Pressable style={[styles.sheet, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={(event) => event.stopPropagation()}>
            <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />
            {selectedEvent ? (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.sheetContent}>
                <View style={[styles.sheetHero, { backgroundColor: colors.surfaceElevated }]}><ActionArt type={selectedEvent.type} size={72} /></View>
                <Text style={[styles.sheetKicker, { color: colors.primary }]}>{selectedEvent.id === 'active' ? 'EM ANDAMENTO' : 'REGISTRO DA ÓRBITA'}</Text>
                <Text style={[styles.sheetTitle, { color: colors.text }]}>{recordConfig[selectedEvent.type].title}</Text>
                <Text style={[styles.sheetTime, { color: colors.textMuted }]}>{formatTime(selectedEvent.start)}{selectedEvent.end > selectedEvent.start ? ` — ${formatTime(selectedEvent.end)} · ${formatDuration(selectedEvent.end - selectedEvent.start)}` : ''}</Text>
                {selectedEvent.detail ? <View style={[styles.detailCard, { backgroundColor: colors.surfaceElevated }]}><Text style={[styles.detailLabel, { color: colors.textMuted }]}>DETALHE</Text><Text style={[styles.detailValue, { color: colors.text }]}>{selectedEvent.detail}</Text></View> : null}
                {selectedEvent.notes ? <View style={[styles.detailCard, { backgroundColor: colors.surfaceElevated }]}><Text style={[styles.detailLabel, { color: colors.textMuted }]}>OBSERVAÇÕES</Text><Text style={[styles.detailValue, { color: colors.text }]}>{selectedEvent.notes}</Text></View> : null}
                <Pressable onPress={() => setSelectedEvent(null)} style={[styles.closeButton, { backgroundColor: colors.primary }]}><Text style={styles.closeText}>Fechar detalhes</Text></Pressable>
              </ScrollView>
            ) : null}
          </Pressable>
        </Pressable>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  sky: { alignSelf: 'center', borderRadius: 34, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  glow: { position: 'absolute', borderRadius: 999 },
  glowViolet: { width: 220, height: 220, left: -70, bottom: -35 },
  glowGold: { width: 150, height: 150, right: -50, top: 15 },
  starDot: { position: 'absolute', backgroundColor: '#FFF8DD' },
  sparkle: { position: 'absolute', color: '#FFF8E6' },
  sparkleA: { left: '21%', top: '22%', fontSize: 18 },
  sparkleB: { right: '18%', top: '28%', fontSize: 14 },
  sparkleC: { left: '16%', bottom: '22%', fontSize: 12 },
  moon: { position: 'absolute', opacity: 0.94, transform: [{ rotate: '-18deg' }] },
  cloud: { position: 'absolute', height: 24, opacity: 0.52 },
  cloudA: { left: 35, top: 52, width: 62 },
  cloudB: { right: 25, bottom: 58, width: 52, transform: [{ scale: 0.8 }] },
  cloudSmall: { position: 'absolute', left: 5, top: 7, width: 26, height: 16, borderRadius: 15, backgroundColor: '#FFFFFF' },
  cloudLarge: { position: 'absolute', left: 20, top: 0, width: 38, height: 23, borderRadius: 18, backgroundColor: '#FFFFFF' },
  nowDotHalo: { position: 'absolute', width: 18, height: 18, borderRadius: 9 },
  nowDot: { position: 'absolute', width: 10, height: 10, borderRadius: 5, borderWidth: 2 },
  anchor: { position: 'absolute', zIndex: 4, width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  anchorText: { fontSize: 10.5, fontWeight: '900' },
  marker: { position: 'absolute', width: 34, height: 34, borderRadius: 17, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center', zIndex: 5 },
  markerPressed: { opacity: 0.7, transform: [{ scale: 0.88 }] },
  markerTime: { position: 'absolute', top: 35, minWidth: 42, textAlign: 'center', fontSize: 8, fontWeight: '900', textShadowColor: 'rgba(255,255,255,0.3)', textShadowRadius: 3 },
  activeMarker: { width: 40, height: 40, borderRadius: 20, borderWidth: 2, zIndex: 7 },
  activeBadge: { position: 'absolute', right: -1, top: -1, width: 9, height: 9, borderRadius: 5, borderWidth: 2, borderColor: '#FFFFFF' },
  center: { position: 'absolute', paddingHorizontal: 14, paddingVertical: 10, alignItems: 'center', justifyContent: 'center', borderWidth: StyleSheet.hairlineWidth, gap: 3, zIndex: 3 },
  stateLabel: { width: '100%', fontSize: 11.5, lineHeight: 13, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.05, textAlign: 'center' },
  clock: { width: '100%', fontWeight: '900', fontVariant: ['tabular-nums'], letterSpacing: -2.5, textAlign: 'center' },
  hint: { width: '100%', maxWidth: 202, fontSize: 10.5, lineHeight: 13.5, fontWeight: '700', textAlign: 'center' },
  modalBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(6,3,13,0.52)' },
  sheet: { width: '100%', maxWidth: 540, maxHeight: '78%', alignSelf: 'center', borderTopLeftRadius: 30, borderTopRightRadius: 30, borderWidth: StyleSheet.hairlineWidth, paddingTop: 10, paddingHorizontal: 20, paddingBottom: 26 },
  sheetHandle: { width: 46, height: 5, borderRadius: 3, alignSelf: 'center', marginBottom: 16 },
  sheetContent: { alignItems: 'center', paddingBottom: 8 },
  sheetHero: { width: 102, height: 102, borderRadius: 34, alignItems: 'center', justifyContent: 'center', marginBottom: 17 },
  sheetKicker: { fontSize: 10, fontWeight: '900', letterSpacing: 1.2 },
  sheetTitle: { marginTop: 5, fontSize: 27, lineHeight: 32, fontWeight: '900' },
  sheetTime: { marginTop: 5, fontSize: 13, fontWeight: '700' },
  detailCard: { width: '100%', borderRadius: 18, padding: 14, marginTop: 13 },
  detailLabel: { fontSize: 9, fontWeight: '900', letterSpacing: 0.9 },
  detailValue: { marginTop: 5, fontSize: 14, lineHeight: 20, fontWeight: '700' },
  closeButton: { width: '100%', minHeight: 52, borderRadius: 17, alignItems: 'center', justifyContent: 'center', marginTop: 20 },
  closeText: { color: '#FFFFFF', fontSize: 14, fontWeight: '900' },
});
