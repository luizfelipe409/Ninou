import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import { Animated, ImageBackground, Modal, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Svg, { Circle, Defs, G, LinearGradient as SvgLinearGradient, Polygon, Rect, Stop, Text as SvgText } from 'react-native-svg';

import { ActionArt } from '@/components/action-art';
import { formatDuration, formatTime, getElapsedMs, getRoutineEventOrbitTimestamp, getRoutineEventsForLocalDay, getRoutineLocalDayBounds, getRoutineMarkerEventsForLocalDay, getRoutineSleepSegmentsForOrbit, recordConfig, type DayState, type RoutineEvent } from '@/domain/routine';
import { useNinouTheme } from '@/theme/tokens';

const darkStarPoints = [
  [4, 10, 1], [9, 18, 1.7], [13, 31, 1], [5, 44, 1.5], [11, 58, 1.1], [6, 72, 1.8], [13, 84, 1], [5, 92, 1.4],
  [95, 9, 1.4], [89, 19, 1], [96, 32, 1.7], [88, 46, 1.1], [95, 60, 1.5], [89, 73, 1], [96, 86, 1.8], [90, 94, 1],
] as const;

const lightStarPoints = [
  [5, 16, 1.4], [10, 27, 1], [6, 41, 1.7], [12, 57, 1.1], [7, 72, 1.5], [11, 86, 1],
  [94, 14, 1.2], [89, 26, 1.6], [95, 43, 1], [88, 59, 1.5], [94, 74, 1.2], [89, 87, 1.6],
] as const;

function pointForTime(timestamp: number, size: number, orbitRadius: number, markerSize = 34) {
  const date = new Date(timestamp);
  const minutes = date.getHours() * 60 + date.getMinutes();
  const angle = -Math.PI / 2 + (minutes / 1440) * Math.PI * 2;
  const center = size / 2;
  return { left: center + Math.cos(angle) * orbitRadius - markerSize / 2, top: center + Math.sin(angle) * orbitRadius - markerSize / 2 };
}

function distanceFromClockAnchor(timestamp: number, anchorMinutes: number) {
  const date = new Date(timestamp);
  const minutes = date.getHours() * 60 + date.getMinutes();
  const distance = Math.abs(minutes - anchorMinutes);
  return Math.min(distance, 1440 - distance);
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
  const { dayStart, dayEnd } = getRoutineLocalDayBounds(now);
  const todayEvents = getRoutineEventsForLocalDay(state.events, now);
  const todayMarkerEvents = getRoutineMarkerEventsForLocalDay(state.events, now);
  const previousDayStartDate = new Date(dayStart);
  previousDayStartDate.setDate(previousDayStartDate.getDate() - 1);
  const previousDayStart = previousDayStartDate.getTime();
  const activeArc = state.mode === 'sleeping'
    && (state.activeType === 'sono' || state.activeType === 'dormir')
    && state.activeStartedAt
    && state.activeStartedAt < dayEnd
    && now > dayStart
    ? {
        id: 'active',
        start: state.activeStartedAt < dayStart && state.activeStartedAt >= previousDayStart
          ? state.activeStartedAt
          : Math.max(state.activeStartedAt, dayStart),
        end: Math.min(now, dayEnd),
      }
    : null;
  const sleepSegments = getRoutineSleepSegmentsForOrbit(
    todayEvents.filter((event) => !(state.mode === 'sleeping' && state.activeStartedAt && Math.abs(event.start - state.activeStartedAt) < 60000)),
    now,
    activeArc ? [activeArc] : [],
  );
  const completedSleep = [
    ...sleepSegments.filter((segment) => segment.carriedFromPreviousDay),
    ...sleepSegments.filter((segment) => !segment.carriedFromPreviousDay).slice(-5),
  ];
  const primaryJourneyId = activeArc?.id || completedSleep.reduce<(typeof completedSleep)[number] | null>((longest, segment) => !longest || segment.end - segment.start > longest.end - longest.start ? segment : longest, null)?.event.id;
  const nowPoint = pointForTime(now, size, orbitRadius, 10);
  const daySunPoint = { left: size * 0.067, top: size * 0.108 };
  const eventGroups = groupNearbyEvents(todayMarkerEvents.filter((event) => event.type !== 'acordou'
    && !(state.mode === 'sleeping'
      && state.activeStartedAt
      && (event.type === 'sono' || event.type === 'dormir')
      && Math.abs(event.start - state.activeStartedAt) < 60000)).slice(-12));
  const orbitMarkerTimestamps = eventGroups.map((group) => group.reduce((sum, item) => sum + getRoutineEventOrbitTimestamp(item), 0) / group.length);
  if (state.mode !== 'idle' && state.activeType !== 'acordou' && state.activeStartedAt) orbitMarkerTimestamps.push(state.mode === 'sleeping' ? now : state.activeStartedAt);
  const anchorIsOccupied = (anchorMinutes: number) => orbitMarkerTimestamps.some((timestamp) => distanceFromClockAnchor(timestamp, anchorMinutes) <= 60);

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
    return (
      <G key={key} opacity={primary ? 1 : 0.48}>
        <Circle cx={center} cy={center} r={orbitRadius} fill="none" stroke={isDark ? 'rgba(137,108,238,0.30)' : 'rgba(104,79,178,0.20)'} strokeWidth={primary ? 18 : 12} strokeLinecap="round" strokeDasharray={`${arcLength} ${circumference - arcLength}`} strokeDashoffset={dashOffset} transform={`rotate(-90 ${center} ${center})`} />
        <Circle cx={center} cy={center} r={orbitRadius} fill="none" stroke={stroke} strokeWidth={segmentWidth} strokeLinecap="round" strokeDasharray={`${arcLength} ${circumference - arcLength}`} strokeDashoffset={dashOffset} transform={`rotate(-90 ${center} ${center})`} />
        <Circle cx={startPoint.x} cy={startPoint.y} r={7.5} fill="rgba(132,99,231,0.13)" stroke="rgba(181,157,255,0.32)" strokeWidth={1} />
        {!active ? <Circle cx={endPoint.x} cy={endPoint.y} r={8} fill="rgba(119,226,204,0.14)" stroke="rgba(145,242,222,0.42)" strokeWidth={1} /> : null}
        <Circle cx={startPoint.x} cy={startPoint.y} r={4} fill={isDark ? '#F6F1FF' : '#FFFFFF'} stroke="#7054BD" strokeWidth={2.2} />
        {!active ? <Circle cx={endPoint.x} cy={endPoint.y} r={5.5} fill={isDark ? '#F6F1FF' : '#FFFFFF'} stroke="#7054BD" strokeWidth={2.4} /> : null}
        {primary && !active ? (
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
      ) : null}
      <Animated.View pointerEvents="none" style={[styles.starLayer, StyleSheet.absoluteFill, { opacity: twinkle.interpolate({ inputRange: [0, 1], outputRange: isDark ? [0.7, 1] : [0.62, 0.94] }) }]}>
        {(isDark ? darkStarPoints : lightStarPoints).map(([left, top, dotSize], index) => <View key={`${left}-${top}`} style={[styles.starDot, { left: `${left}%`, top: `${top}%`, width: dotSize * 2, height: dotSize * 2, borderRadius: dotSize, backgroundColor: isDark ? '#FFF7CE' : '#FFFFFF', shadowColor: isDark ? '#D8B5FF' : '#8B68D5', opacity: 0.68 + (index % 3) * 0.14 }]} />)}
      </Animated.View>
      <Animated.Text style={[styles.sparkle, styles.sparkleSideA, { color: isDark ? '#FFF8E6' : '#B98626', opacity: twinkle.interpolate({ inputRange: [0, 1], outputRange: [0.68, 1] }), transform: [{ scale: twinkle.interpolate({ inputRange: [0, 1], outputRange: [0.72, 1.26] }) }] }]}>✦</Animated.Text>
      <Animated.Text style={[styles.sparkle, styles.sparkleSideB, { color: isDark ? '#FFF8E6' : '#8060B6', opacity: twinkle.interpolate({ inputRange: [0, 1], outputRange: [1, 0.62] }), transform: [{ scale: twinkle.interpolate({ inputRange: [0, 1], outputRange: [1.2, 0.76] }) }] }]}>✧</Animated.Text>
      <Animated.Text style={[styles.sparkle, styles.sparkleSideC, { color: isDark ? '#FFF8E6' : '#8060B6', opacity: twinkle.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }), transform: [{ scale: twinkle.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1.18] }) }] }]}>✦</Animated.Text>

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
        {completedSleep.map((segment) => renderArc(segment.start, segment.end, 'url(#completedJourney)', segment.event.id, false, segment.event.id === primaryJourneyId))}
        {activeArc ? renderArc(activeArc.start, activeArc.end, 'url(#activeJourney)', activeArc.id, true, true) : null}
      </Svg>

      {!activeArc ? <><Animated.View style={[styles.nowDotHalo, { left: nowPoint.left - 5, top: nowPoint.top - 5, backgroundColor: isDark ? 'rgba(255,121,68,0.28)' : 'rgba(255,159,46,0.28)', opacity: breathe.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }), transform: [{ scale: breathe.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1.5] }) }] }]} /><View style={[styles.nowDot, { left: nowPoint.left, top: nowPoint.top, backgroundColor: isDark ? '#FFAD4D' : '#FF9F2E', borderColor: isDark ? '#FFF4D3' : '#FFF9E9' }]} /></> : null}

      {!anchorIsOccupied(0) ? <View style={[styles.anchor, styles.anchorTheme, { top: 8, left: center - 15, backgroundColor: isDark ? 'rgba(27,23,58,0.9)' : 'rgba(255,255,255,0.82)', borderColor: isDark ? 'rgba(157,116,238,0.38)' : 'rgba(255,255,255,0.96)' }]}><Text style={[styles.anchorText, { color: isDark ? '#F6EFFF' : '#44366F' }]}>00</Text></View> : null}
      {!anchorIsOccupied(360) ? <View style={[styles.anchor, styles.anchorTheme, { top: center - 15, right: 8, backgroundColor: isDark ? 'rgba(27,23,58,0.9)' : 'rgba(255,255,255,0.82)', borderColor: isDark ? 'rgba(157,116,238,0.38)' : 'rgba(255,255,255,0.96)' }]}><Text style={[styles.anchorText, { color: isDark ? '#F6EFFF' : '#44366F' }]}>06</Text></View> : null}
      {!anchorIsOccupied(720) ? <View style={[styles.anchor, styles.anchorTheme, { bottom: 8, left: center - 15, backgroundColor: isDark ? 'rgba(27,23,58,0.9)' : 'rgba(255,255,255,0.82)', borderColor: isDark ? 'rgba(157,116,238,0.38)' : 'rgba(255,255,255,0.96)' }]}><Text style={[styles.anchorText, { color: isDark ? '#F6EFFF' : '#44366F' }]}>12</Text></View> : null}
      {!anchorIsOccupied(1080) ? <View style={[styles.anchor, styles.anchorTheme, { top: center - 15, left: 8, backgroundColor: isDark ? 'rgba(27,23,58,0.9)' : 'rgba(255,255,255,0.82)', borderColor: isDark ? 'rgba(157,116,238,0.38)' : 'rgba(255,255,255,0.96)' }]}><Text style={[styles.anchorText, { color: isDark ? '#F6EFFF' : '#44366F' }]}>18</Text></View> : null}

      {eventGroups.map((group) => {
        const event = group[group.length - 1];
        const markerTimestamp = getRoutineEventOrbitTimestamp(event);
        const groupTimestamp = group.reduce((sum, item) => sum + getRoutineEventOrbitTimestamp(item), 0) / group.length;
        const point = pointForTime(groupTimestamp, size, orbitRadius, group.length > 1 ? 44 : 34);
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

      {state.mode !== 'idle' && state.activeType !== 'acordou' && state.activeStartedAt ? (() => {
        const activeMarkerTimestamp = state.mode === 'sleeping' ? now : state.activeStartedAt;
        const activePoint = pointForTime(activeMarkerTimestamp, size, orbitRadius, 50);
        const activeEvent: RoutineEvent = { id: 'active', type: state.activeType, start: state.activeStartedAt, end: now, detail: state.activeDetail, notes: state.activeNotes, createdAtClient: state.activeStartedAt };
        return (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Abrir ${recordConfig[state.activeType].title} em andamento`}
            onPress={() => setSelectedEvent(activeEvent)}
            style={({ pressed }) => [styles.activeMarker, activePoint, pressed && styles.activeMarkerPressed]}>
            <Animated.View
              pointerEvents="none"
              style={[
                styles.activeMarkerAura,
                {
                  borderColor: isDark ? 'rgba(255,207,142,0.72)' : 'rgba(109,81,196,0.48)',
                  opacity: breathe.interpolate({ inputRange: [0, 1], outputRange: [0.34, 0.82] }),
                },
              ]}
            />
            <LinearGradient
              pointerEvents="none"
              colors={isDark ? ['#FFD08E', '#A987FF', '#72E2CC'] : ['#F7C57B', '#795AE2', '#50CDB5']}
              locations={[0, 0.52, 1]}
              start={{ x: 0.08, y: 0.08 }}
              end={{ x: 0.92, y: 0.92 }}
              style={styles.activeMarkerRing}>
              <View style={[styles.activeMarkerInner, { backgroundColor: isDark ? '#17102E' : '#FFFDFC' }]}>
                <ActionArt type={state.activeType} size={40} />
              </View>
            </LinearGradient>
            <Animated.View pointerEvents="none" style={[styles.activeMarkerGlint, { opacity: breathe.interpolate({ inputRange: [0, 1], outputRange: [0.45, 1] }) }]} />
          </Pressable>
        );
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
  starLayer: { zIndex: 1 },
  starDot: { position: 'absolute', shadowOpacity: 0.9, shadowRadius: 5, shadowOffset: { width: 0, height: 0 } },
  sparkle: { position: 'absolute', zIndex: 2, color: '#FFF8E6' },
  sparkleSideA: { left: '4%', top: '26%', fontSize: 16 },
  sparkleSideB: { right: '3%', top: '43%', fontSize: 13 },
  sparkleSideC: { left: '5%', bottom: '22%', fontSize: 11 },
  nowDotHalo: { position: 'absolute', zIndex: 4, width: 18, height: 18, borderRadius: 9 },
  nowDot: { position: 'absolute', zIndex: 4, width: 10, height: 10, borderRadius: 5, borderWidth: 2 },
  anchor: { position: 'absolute', zIndex: 6, width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  anchorTheme: { borderWidth: StyleSheet.hairlineWidth, shadowColor: '#2D174F', shadowOpacity: 0.22, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 4 },
  anchorText: { fontSize: 10.5, fontWeight: '900' },
  marker: { position: 'absolute', width: 34, height: 34, borderRadius: 17, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center', zIndex: 5 },
  clusterMarker: { width: 44, height: 44, borderRadius: 22, borderWidth: 1.5, shadowColor: '#8E5EFF', shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 5 } }, clusterBadge: { position: 'absolute', right: -5, top: -5, minWidth: 20, height: 20, borderRadius: 10, borderWidth: 2, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 }, clusterCount: { color: '#10251F', fontSize: 10, fontWeight: '900' },
  markerPressed: { opacity: 0.7, transform: [{ scale: 0.88 }] },
  markerTime: { position: 'absolute', top: 35, minWidth: 42, textAlign: 'center', fontSize: 8, fontWeight: '900', textShadowColor: 'rgba(255,255,255,0.3)', textShadowRadius: 3 },
  activeMarker: { position: 'absolute', width: 50, height: 50, zIndex: 8, alignItems: 'center', justifyContent: 'center', shadowColor: '#4B2D91', shadowOpacity: 0.44, shadowRadius: 13, shadowOffset: { width: 0, height: 6 }, elevation: 8 },
  activeMarkerAura: { position: 'absolute', width: 56, height: 56, borderRadius: 28, borderWidth: 2, backgroundColor: 'rgba(255,255,255,0.06)' },
  activeMarkerRing: { width: 50, height: 50, borderRadius: 25, padding: 3, alignItems: 'center', justifyContent: 'center' },
  activeMarkerInner: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  activeMarkerGlint: { position: 'absolute', right: 4, top: 3, width: 7, height: 7, borderRadius: 4, backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.72)', shadowColor: '#FFFFFF', shadowOpacity: 1, shadowRadius: 5, shadowOffset: { width: 0, height: 0 } },
  activeMarkerPressed: { opacity: 0.78, transform: [{ scale: 0.96 }] },
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
