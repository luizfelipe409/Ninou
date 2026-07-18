import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import { Animated, ImageBackground, Modal, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Svg, { Circle, Defs, G, LinearGradient as SvgLinearGradient, Polygon, Rect, Stop, Text as SvgText } from 'react-native-svg';

import { ActionArt } from '@/components/action-art';
import { formatDuration, formatTime, getElapsedMs, getRoutineEventOrbitTimestamp, recordConfig, type DayState, type RoutineEvent } from '@/domain/routine';
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

function svgPointForTime(timestamp: number, size: number, radius: number) {
  const date = new Date(timestamp);
  const minutes = date.getHours() * 60 + date.getMinutes() + date.getSeconds() / 60;
  const angle = -Math.PI / 2 + (minutes / 1440) * Math.PI * 2;
  const center = size / 2;
  return { x: center + Math.cos(angle) * radius, y: center + Math.sin(angle) * radius };
}

function clockHint(state: DayState) {
  if (state.mode === 'idle' || !state.activeStartedAt) return 'Informe como o bebê está para iniciar a rotina com segurança.';
  const started = new Date(state.activeStartedAt);
  const today = new Date();
  const startDay = new Date(started.getFullYear(), started.getMonth(), started.getDate()).getTime();
  const todayDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const subject = state.mode === 'sleeping' ? 'Dormindo' : 'Acordado';
  if (startDay === todayDay) return `${subject} desde ${formatTime(state.activeStartedAt)}.`;
  if (startDay === todayDay - 86400000) return `${subject} desde ontem, às ${formatTime(state.activeStartedAt)}.`;
  return `${subject} desde ${started.toLocaleDateString('pt-BR')}, às ${formatTime(state.activeStartedAt)}.`;
}

function rayPoints(originX: number, originY: number, length: number, angle: number, spread: number) {
  const a = angle - spread;
  const b = angle + spread;
  const x1 = originX + Math.cos(a) * length;
  const y1 = originY + Math.sin(a) * length;
  const x2 = originX + Math.cos(b) * length;
  const y2 = originY + Math.sin(b) * length;
  return `${originX},${originY} ${x1},${y1} ${x2},${y2}`;
}

function groupNearbyEvents(events: RoutineEvent[]) {
  return [...events]
    .sort((a, b) => getRoutineEventOrbitTimestamp(a) - getRoutineEventOrbitTimestamp(b))
    .reduce<RoutineEvent[][]>((groups, event) => {
      const current = groups[groups.length - 1];
      if (current && getRoutineEventOrbitTimestamp(event) - getRoutineEventOrbitTimestamp(current[current.length - 1]) <= 4 * 60 * 1000) current.push(event);
      else groups.push([event]);
      return groups;
    }, []);
}

export function RoutineOrbit({ state, now }: { state: DayState; now: number }) {
  const { colors, isDark } = useNinouTheme();
  const [selectedEvent, setSelectedEvent] = useState<RoutineEvent | null>(null);
  const [selectedCluster, setSelectedCluster] = useState<RoutineEvent[]>([]);
  const [breathe] = useState(() => new Animated.Value(0));
  const [twinkle] = useState(() => new Animated.Value(0));
  const { width } = useWindowDimensions();
  const size = Math.min(390, width - 28);
  const center = size / 2;
  const orbitRadius = (size - 26) * (126 / 320);
  const circumference = 2 * Math.PI * orbitRadius;
  const coreWidth = Math.min(230, size * 0.62);
  const coreHeight = Math.min(150, size * 0.4);
  const elapsed = getElapsedMs(state, now);
  const title = state.mode === 'idle'
    ? 'Começar hoje'
    : state.mode === 'sleeping'
      ? state.activeType === 'dormir' ? 'Sono noturno há' : 'Dormindo há'
      : state.activeType === 'despertar-noturno' ? 'Despertar noturno há' : 'Acordado há';
  const completedSleep = state.events.filter((event) => (event.type === 'sono' || event.type === 'dormir') && event.end > event.start).slice(-5);
  const dayStartDate = new Date(now);
  dayStartDate.setHours(0, 0, 0, 0);
  const dayStart = dayStartDate.getTime();
  const dayEnd = dayStart + 86400000;
  const activeArc = state.mode === 'sleeping'
    && (state.activeType === 'sono' || state.activeType === 'dormir')
    && state.activeStartedAt
    ? { id: 'active', start: Math.max(state.activeStartedAt, dayStart), end: Math.min(now, dayEnd) }
    : null;
  const primaryJourneyId = activeArc?.id || completedSleep.reduce<RoutineEvent | null>((longest, event) => !longest || event.end - event.start > longest.end - longest.start ? event : longest, null)?.id;
  const nowPoint = pointForTime(now, size, orbitRadius, 10);
  const daySunPoint = { left: size * 0.067, top: size * 0.108 };
  const eventGroups = groupNearbyEvents(state.events.filter((event) => event.type !== 'acordou').slice(-12));
  const activeIsAlreadyRecorded = Boolean(state.activeStartedAt && state.events.some((event) => event.type === state.activeType && Math.abs(event.start - state.activeStartedAt!) < 2 * 60 * 1000));

  useEffect(() => {
    const breatheLoop = Animated.loop(Animated.sequence([
      Animated.timing(breathe, { toValue: 1, duration: 1500, useNativeDriver: true, isInteraction: false }),
      Animated.timing(breathe, { toValue: 0, duration: 1500, useNativeDriver: true, isInteraction: false }),
    ]));
    const twinkleLoop = Animated.loop(Animated.sequence([
      Animated.timing(twinkle, { toValue: 1, duration: 950, useNativeDriver: true, isInteraction: false }),
      Animated.timing(twinkle, { toValue: 0, duration: 1150, useNativeDriver: true, isInteraction: false }),
    ]));
    breatheLoop.start();
    twinkleLoop.start();
    return () => { breatheLoop.stop(); twinkleLoop.stop(); };
  }, [breathe, twinkle]);

  const renderArc = (start: number, end: number, stroke: string, key: string, active = false, primary = false) => {
    const durationFraction = Math.max(0.004, Math.min(0.995, (end - start) / 86400000));
    const arcLength = circumference * durationFraction;
    const dashOffset = -dayFraction(start) * circumference;
    const startPoint = svgPointForTime(start, size, orbitRadius);
    const endPoint = svgPointForTime(end, size, orbitRadius);
    const labelPoint = svgPointForTime(start, size, orbitRadius - 18);
    const segmentWidth = primary ? (isDark ? 11 : 10) : 6;
    const glintLength = Math.min(arcLength, 24);
    return (
      <G key={key} opacity={primary ? 1 : 0.48}>
        <Circle cx={center} cy={center} r={orbitRadius} fill="none" stroke={isDark ? 'rgba(137,108,238,0.30)' : 'rgba(104,79,178,0.20)'} strokeWidth={primary ? 18 : 12} strokeLinecap="round" strokeDasharray={`${arcLength} ${circumference - arcLength}`} strokeDashoffset={dashOffset} transform={`rotate(-90 ${center} ${center})`} />
        <Circle cx={center} cy={center} r={orbitRadius} fill="none" stroke={stroke} strokeWidth={segmentWidth} strokeLinecap="round" strokeDasharray={`${arcLength} ${circumference - arcLength}`} strokeDashoffset={dashOffset} transform={`rotate(-90 ${center} ${center})`} />
        {active ? <Circle cx={center} cy={center} r={orbitRadius} fill="none" stroke="rgba(255,255,255,0.78)" strokeWidth={2} strokeLinecap="round" strokeDasharray={`${glintLength} ${circumference - glintLength}`} strokeDashoffset={-(dayFraction(end) * circumference - glintLength)} transform={`rotate(-90 ${center} ${center})`} /> : null}
        <Circle cx={startPoint.x} cy={startPoint.y} r={7.5} fill="rgba(132,99,231,0.13)" stroke="rgba(181,157,255,0.32)" strokeWidth={1} />
        <Circle cx={endPoint.x} cy={endPoint.y} r={active ? 10 : 8} fill={active ? 'rgba(255,188,105,0.18)' : 'rgba(119,226,204,0.14)'} stroke={active ? 'rgba(255,202,139,0.58)' : 'rgba(145,242,222,0.42)'} strokeWidth={1} />
        <Circle cx={startPoint.x} cy={startPoint.y} r={4} fill={isDark ? '#F6F1FF' : '#FFFFFF'} stroke="#7054BD" strokeWidth={2.2} />
        <Circle cx={endPoint.x} cy={endPoint.y} r={5.5} fill={active ? '#FFF4DD' : isDark ? '#F6F1FF' : '#FFFFFF'} stroke={active ? '#EAA45C' : '#7054BD'} strokeWidth={2.4} />
        {primary ? (
          <G>
            <Rect x={labelPoint.x - 22} y={labelPoint.y - 10} width={44} height={20} rx={10} fill={isDark ? 'rgba(23,16,46,0.96)' : 'rgba(255,255,255,0.96)'} stroke={isDark ? 'rgba(188,158,255,0.72)' : 'rgba(103,78,178,0.30)'} strokeWidth={1} />
            <SvgText x={labelPoint.x} y={labelPoint.y + 3.2} fill={isDark ? '#FFF8EC' : '#332650'} fontSize={9} fontWeight="900" textAnchor="middle">{formatTime(start)}</SvgText>
          </G>
        ) : null}
      </G>
    );
  };

  return (
    <View style={[styles.skyFrame, { width: size, height: size, shadowOpacity: isDark ? 0.48 : 0.2 }]}>
      <ImageBackground
        source={isDark ? require('../../assets/clock-themes/night-sky.png') : require('../../assets/clock-themes/day-sky.png')}
        resizeMode="cover"
        imageStyle={styles.skyImage}
        style={[styles.sky, { width: size, height: size, borderColor: isDark ? 'rgba(135,106,223,0.28)' : 'rgba(255,255,255,0.86)' }]}>
      <LinearGradient pointerEvents="none" colors={isDark ? ['rgba(43,28,90,0.02)', 'rgba(2,5,18,0.2)'] : ['rgba(255,255,255,0.01)', 'rgba(255,245,252,0.08)']} style={StyleSheet.absoluteFill} />
      {!isDark ? (
        <>
          <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { opacity: breathe.interpolate({ inputRange: [0, 1], outputRange: [0.68, 1] }) }]}>
            <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
              {[0.08, 0.42, 0.76, 1.08, 1.38].map((angle, index) => <Polygon key={angle} points={rayPoints(daySunPoint.left, daySunPoint.top, size * 0.94, angle, index % 2 ? 0.052 : 0.082)} fill={index % 2 ? 'rgba(255,255,245,0.29)' : 'rgba(255,218,126,0.42)'} />)}
            </Svg>
          </Animated.View>
          <Animated.View
            pointerEvents="none"
            style={[
              styles.sunGlow,
              {
                width: size * 0.34,
                height: size * 0.34,
                borderRadius: size * 0.17,
                left: daySunPoint.left - size * 0.17,
                top: daySunPoint.top - size * 0.17,
                opacity: breathe.interpolate({ inputRange: [0, 1], outputRange: [0.62, 1] }),
                transform: [{ scale: breathe.interpolate({ inputRange: [0, 1], outputRange: [0.91, 1.17] }) }],
              },
            ]}
          />
        </>
      ) : (
        <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { opacity: twinkle.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] }), transform: [{ translateX: twinkle.interpolate({ inputRange: [0, 1], outputRange: [-3, 4] }) }, { translateY: twinkle.interpolate({ inputRange: [0, 1], outputRange: [-2, 3] }) }] }]}>
          {starPoints.map(([left, top, dotSize], index) => <View key={`${left}-${top}`} style={[styles.starDot, { left: `${left}%`, top: `${top}%`, width: dotSize * 2, height: dotSize * 2, borderRadius: dotSize, opacity: 0.68 + (index % 3) * 0.14 }]} />)}
        </Animated.View>
      )}
      <Animated.Text style={[styles.sparkle, styles.sparkleA, { color: isDark ? '#FFF8E6' : '#B98626', opacity: twinkle.interpolate({ inputRange: [0, 1], outputRange: [0.68, 1] }), transform: [{ scale: twinkle.interpolate({ inputRange: [0, 1], outputRange: [0.72, 1.26] }) }] }]}>✦</Animated.Text>
      <Animated.Text style={[styles.sparkle, styles.sparkleB, { color: isDark ? '#FFF8E6' : '#8060B6', opacity: twinkle.interpolate({ inputRange: [0, 1], outputRange: [1, 0.62] }), transform: [{ scale: twinkle.interpolate({ inputRange: [0, 1], outputRange: [1.2, 0.76] }) }] }]}>✧</Animated.Text>
      <Animated.Text style={[styles.sparkle, styles.sparkleC, { color: isDark ? '#FFF8E6' : '#8060B6', opacity: twinkle.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }), transform: [{ scale: twinkle.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1.18] }) }] }]}>✦</Animated.Text>

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
        <Circle cx={center} cy={center} r={orbitRadius} fill="none" stroke={isDark ? 'rgba(92,51,194,0.20)' : 'rgba(92,76,152,0.13)'} strokeWidth={isDark ? 10 : 11} />
        <Circle cx={center} cy={center} r={orbitRadius} fill="none" stroke={isDark ? 'rgba(155,117,255,0.64)' : 'rgba(255,255,255,0.86)'} strokeWidth={isDark ? 4.5 : 5.8} />
        {completedSleep.map((event) => renderArc(Math.max(event.start, dayStart), Math.min(event.end, dayEnd), 'url(#completedJourney)', event.id, false, event.id === primaryJourneyId))}
        {activeArc ? renderArc(activeArc.start, activeArc.end, 'url(#activeJourney)', activeArc.id, true, true) : null}
      </Svg>

      <Animated.View style={[styles.nowDotHalo, { left: nowPoint.left - 5, top: nowPoint.top - 5, backgroundColor: isDark ? 'rgba(255,121,68,0.28)' : 'rgba(255,159,46,0.28)', opacity: breathe.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }), transform: [{ scale: breathe.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1.5] }) }] }]} />
      <View style={[styles.nowDot, { left: nowPoint.left, top: nowPoint.top, backgroundColor: isDark ? '#FFAD4D' : '#FF9F2E', borderColor: isDark ? '#FFF4D3' : '#FFF9E9' }]} />

      <View style={[styles.anchor, styles.anchorTheme, { top: 8, left: center - 15, backgroundColor: isDark ? 'rgba(27,23,58,0.9)' : 'rgba(255,255,255,0.82)', borderColor: isDark ? 'rgba(157,116,238,0.38)' : 'rgba(255,255,255,0.96)' }]}><Text style={[styles.anchorText, { color: isDark ? '#F6EFFF' : '#44366F' }]}>00</Text></View>
      <View style={[styles.anchor, styles.anchorTheme, { top: center - 15, right: 8, backgroundColor: isDark ? 'rgba(27,23,58,0.9)' : 'rgba(255,255,255,0.82)', borderColor: isDark ? 'rgba(157,116,238,0.38)' : 'rgba(255,255,255,0.96)' }]}><Text style={[styles.anchorText, { color: isDark ? '#F6EFFF' : '#44366F' }]}>06</Text></View>
      <View style={[styles.anchor, styles.anchorTheme, { bottom: 8, left: center - 15, backgroundColor: isDark ? 'rgba(27,23,58,0.9)' : 'rgba(255,255,255,0.82)', borderColor: isDark ? 'rgba(157,116,238,0.38)' : 'rgba(255,255,255,0.96)' }]}><Text style={[styles.anchorText, { color: isDark ? '#F6EFFF' : '#44366F' }]}>12</Text></View>
      <View style={[styles.anchor, styles.anchorTheme, { top: center - 15, left: 8, backgroundColor: isDark ? 'rgba(27,23,58,0.9)' : 'rgba(255,255,255,0.82)', borderColor: isDark ? 'rgba(157,116,238,0.38)' : 'rgba(255,255,255,0.96)' }]}><Text style={[styles.anchorText, { color: isDark ? '#F6EFFF' : '#44366F' }]}>18</Text></View>

      {eventGroups.map((group) => {
        const event = group[group.length - 1];
        const markerTimestamp = getRoutineEventOrbitTimestamp(event);
        const point = pointForTime(group.reduce((sum, item) => sum + getRoutineEventOrbitTimestamp(item), 0) / group.length, size, orbitRadius, group.length > 1 ? 44 : 34);
        if (group.length > 1) return (
          <Pressable accessibilityRole="button" accessibilityLabel={`${group.length} registros próximos`} onPress={() => setSelectedCluster(group)} key={`cluster-${group[0].id}`} style={({ pressed }) => [styles.marker, styles.clusterMarker, point, { backgroundColor: isDark ? 'rgba(18,12,43,0.92)' : 'rgba(255,255,255,0.92)', borderColor: isDark ? 'rgba(181,131,255,0.72)' : 'rgba(117,88,232,0.48)' }, pressed && styles.markerPressed]}>
            <ActionArt type={event.type} size={37} />
            <View style={[styles.clusterBadge, { backgroundColor: colors.accent, borderColor: isDark ? '#17102E' : '#FFFFFF' }]}><Text style={styles.clusterCount}>{group.length}</Text></View>
          </Pressable>
        );
        return (
          <Pressable accessibilityRole="button" accessibilityLabel={`Abrir ${recordConfig[event.type].title} ${markerTimestamp > event.start ? `encerrado às ${formatTime(markerTimestamp)}` : `das ${formatTime(markerTimestamp)}`}`} onPress={() => setSelectedEvent(event)} key={event.id} style={({ pressed }) => [styles.marker, point, { backgroundColor: isDark ? 'rgba(21,18,54,0.76)' : 'rgba(255,255,255,0.72)', borderColor: isDark ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.96)' }, pressed && styles.markerPressed]}>
            <ActionArt type={event.type} size={30} />
            <Text style={[styles.markerTime, { color: colors.text }]}>{formatTime(markerTimestamp)}</Text>
          </Pressable>
        );
      })}

      {state.mode !== 'idle' && state.activeType !== 'acordou' && state.activeStartedAt && !activeIsAlreadyRecorded ? (() => {
        const activeMarkerTimestamp = state.mode === 'sleeping' ? now : state.activeStartedAt;
        const activePoint = pointForTime(activeMarkerTimestamp, size, orbitRadius, 40);
        const activeEvent: RoutineEvent = { id: 'active', type: state.activeType, start: state.activeStartedAt, end: now, detail: state.activeDetail, notes: state.activeNotes, createdAtClient: state.activeStartedAt };
        return <Pressable accessibilityRole="button" accessibilityLabel="Abrir cuidado em andamento" onPress={() => setSelectedEvent(activeEvent)} style={({ pressed }) => [styles.marker, styles.activeMarker, activePoint, { backgroundColor: colors.surface, borderColor: colors.accent }, pressed && styles.markerPressed]}><ActionArt type={state.activeType} size={35} /><View style={[styles.activeBadge, { backgroundColor: colors.accent }]} /><Text style={[styles.markerTime, { color: colors.text }]}>{formatTime(state.activeStartedAt)}</Text></Pressable>;
      })() : null}

      <Animated.View pointerEvents="none" style={[styles.coreHalo, { width: coreWidth + 24, height: coreHeight + 24, borderRadius: 999, left: center - (coreWidth + 24) / 2, top: center - (coreHeight + 24) / 2, backgroundColor: isDark ? 'rgba(113,66,210,0.1)' : 'rgba(255,255,255,0.24)', opacity: breathe.interpolate({ inputRange: [0, 1], outputRange: [0.36, 0.72] }), transform: [{ scale: breathe.interpolate({ inputRange: [0, 1], outputRange: [0.98, 1.035] }) }] }]} />
      <LinearGradient colors={isDark ? ['rgba(33,19,59,0.94)', 'rgba(7,10,28,0.86)'] : ['rgba(255,255,255,0.93)', 'rgba(255,255,255,0.72)']} start={{ x: 0.12, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.center, { width: coreWidth, height: coreHeight, borderRadius: 999, left: center - coreWidth / 2, top: center - coreHeight / 2, borderColor: isDark ? 'rgba(181,131,255,0.34)' : 'rgba(255,255,255,0.94)', shadowOpacity: isDark ? 0.43 : 0.19 }]}>
        <Text style={[styles.stateLabel, { color: isDark ? '#B78BFF' : '#6A509F' }]}>{title}</Text>
        <Text adjustsFontSizeToFit minimumFontScale={0.68} numberOfLines={1} style={[styles.clock, { color: isDark ? '#FFFAF2' : '#2F2843', fontSize: size < 340 ? 40 : 49.6, lineHeight: size < 340 ? 44 : 50, textShadowColor: isDark ? 'rgba(255,224,178,0.1)' : 'rgba(255,255,255,0.9)' }]}>{state.mode === 'idle' ? '00:00:00' : formatDuration(elapsed, true)}</Text>
        <Text style={[styles.hint, { color: isDark ? '#AD8AD7' : '#675C7D' }]} numberOfLines={3}>{clockHint(state)}</Text>
      </LinearGradient>

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

      <Modal visible={selectedCluster.length > 0} transparent animationType="slide" onRequestClose={() => setSelectedCluster([])}>
        <Pressable style={styles.modalBackdrop} onPress={() => setSelectedCluster([])}>
          <Pressable style={[styles.sheet, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={(event) => event.stopPropagation()}>
            <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />
            <Text style={[styles.sheetKicker, { color: colors.primary }]}>REGISTROS PRÓXIMOS</Text>
            <Text style={[styles.sheetTitle, { color: colors.text }]}>Atividades no mesmo horário</Text>
            <Text style={[styles.sheetTime, { color: colors.textMuted }]}>{selectedCluster.length ? `${formatTime(selectedCluster[0].start)} — ${formatTime(selectedCluster[selectedCluster.length - 1].start)}` : ''}</Text>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.clusterList}>
              {selectedCluster.map((event) => <Pressable key={event.id} onPress={() => { setSelectedCluster([]); setSelectedEvent(event); }} style={({ pressed }) => [styles.clusterRow, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }, pressed && styles.markerPressed]}><ActionArt type={event.type} size={48} /><View style={styles.clusterCopy}><Text style={[styles.clusterTitle, { color: colors.text }]}>{recordConfig[event.type].title}</Text><Text style={[styles.clusterMeta, { color: colors.textMuted }]}>{formatTime(event.start)}{event.detail ? ` · ${event.detail}` : ''}</Text></View><Ionicons name="chevron-forward" size={17} color={colors.textMuted} /></Pressable>)}
            </ScrollView>
            <Pressable onPress={() => setSelectedCluster([])} style={[styles.closeButton, { backgroundColor: colors.primary }]}><Text style={styles.closeText}>Fechar atividades</Text></Pressable>
          </Pressable>
        </Pressable>
      </Modal>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  skyFrame: { alignSelf: 'center', borderRadius: 34, shadowColor: '#050315', shadowRadius: 32, shadowOffset: { width: 0, height: 18 }, elevation: 10 },
  sky: { borderRadius: 34, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  skyImage: { borderRadius: 34 },
  sunGlow: { position: 'absolute', backgroundColor: 'rgba(255,205,101,0.20)', shadowColor: '#FFC94E', shadowOpacity: 0.72, shadowRadius: 34, shadowOffset: { width: 0, height: 0 } },
  starDot: { position: 'absolute', backgroundColor: '#FFF7CE', shadowColor: '#D8B5FF', shadowOpacity: 0.9, shadowRadius: 5, shadowOffset: { width: 0, height: 0 } },
  sparkle: { position: 'absolute', color: '#FFF8E6' },
  sparkleA: { left: '21%', top: '22%', fontSize: 18 },
  sparkleB: { right: '18%', top: '28%', fontSize: 14 },
  sparkleC: { left: '16%', bottom: '22%', fontSize: 12 },
  nowDotHalo: { position: 'absolute', width: 18, height: 18, borderRadius: 9 },
  nowDot: { position: 'absolute', width: 10, height: 10, borderRadius: 5, borderWidth: 2 },
  anchor: { position: 'absolute', zIndex: 6, width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  anchorTheme: { borderWidth: StyleSheet.hairlineWidth, shadowColor: '#2D174F', shadowOpacity: 0.22, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 4 },
  anchorText: { fontSize: 10.5, fontWeight: '900' },
  marker: { position: 'absolute', width: 34, height: 34, borderRadius: 17, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center', zIndex: 5 },
  clusterMarker: { width: 44, height: 44, borderRadius: 22, borderWidth: 1.5, shadowColor: '#8E5EFF', shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 5 } }, clusterBadge: { position: 'absolute', right: -5, top: -5, minWidth: 20, height: 20, borderRadius: 10, borderWidth: 2, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 }, clusterCount: { color: '#10251F', fontSize: 10, fontWeight: '900' },
  markerPressed: { opacity: 0.7, transform: [{ scale: 0.88 }] },
  markerTime: { position: 'absolute', top: 35, minWidth: 42, textAlign: 'center', fontSize: 8, fontWeight: '900', textShadowColor: 'rgba(255,255,255,0.3)', textShadowRadius: 3 },
  activeMarker: { width: 40, height: 40, borderRadius: 20, borderWidth: 2, zIndex: 7 },
  activeBadge: { position: 'absolute', right: -1, top: -1, width: 9, height: 9, borderRadius: 5, borderWidth: 2, borderColor: '#FFFFFF' },
  coreHalo: { position: 'absolute', zIndex: 2 },
  center: { position: 'absolute', paddingHorizontal: 12, paddingVertical: 16, alignItems: 'center', justifyContent: 'center', borderWidth: StyleSheet.hairlineWidth, gap: 7, zIndex: 3, shadowColor: '#050315', shadowOpacity: 0.2, shadowRadius: 22, shadowOffset: { width: 0, height: 12 }, elevation: 6 },
  stateLabel: { width: '100%', fontSize: 11.8, lineHeight: 12, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.05, textAlign: 'center' },
  clock: { width: '100%', fontWeight: '900', fontVariant: ['tabular-nums'], letterSpacing: -2.5, textAlign: 'center', textShadowRadius: 18 },
  hint: { width: '100%', maxWidth: 205, fontSize: 12, lineHeight: 15.4, fontWeight: '700', textAlign: 'center' },
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
  clusterList: { gap: 9, paddingTop: 18 }, clusterRow: { minHeight: 70, borderRadius: 19, borderWidth: StyleSheet.hairlineWidth, padding: 10, flexDirection: 'row', alignItems: 'center', gap: 10 }, clusterCopy: { flex: 1 }, clusterTitle: { fontSize: 13.5, fontWeight: '900' }, clusterMeta: { marginTop: 3, fontSize: 10.5, lineHeight: 14, fontWeight: '600' },
  closeButton: { width: '100%', minHeight: 52, borderRadius: 17, alignItems: 'center', justifyContent: 'center', marginTop: 20 },
  closeText: { color: '#FFFFFF', fontSize: 14, fontWeight: '900' },
});
