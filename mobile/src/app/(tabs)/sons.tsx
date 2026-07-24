import { useAudioPlayer } from 'expo-audio';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { NinouCard, NinouScreen } from '@/components/ninou-screen';
import { useNinouLayout } from '@/theme/layout';
import { radius, spacing, useNinouTheme } from '@/theme/tokens';

const ONE_HOUR_MS = 60 * 60 * 1000;

function getWallTime() {
  return Date.now();
}

function enableLoop(player: ReturnType<typeof useAudioPlayer>) {
  player.loop = true;
}

function formatTimer(milliseconds: number) {
  const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export default function SoundsScreen() {
  const { colors } = useNinouTheme();
  const { isDesktop } = useNinouLayout();
  const womb = useAudioPlayer(require('@/assets/audio/som-utero.mp3'));
  const relax = useAudioPlayer(require('@/assets/audio/som-relaxar.mp3'));
  const rhythm = useAudioPlayer(require('@/assets/audio/ritmo-suave-bebe.mp3'));
  const tracks = useMemo(() => [
    { key: 'womb', title: 'Som do útero', description: 'Som profundo com batimentos e sensação acolhedora de útero.', listDescription: 'Som profundo e acolhedor para acalmar.', icon: '💗', player: womb },
    { key: 'relax', title: 'Som para relaxar', description: 'Som relaxante enviado para acalmar e embalar o sono.', listDescription: 'Som contínuo e tranquilo para preparar o sono.', icon: '🌙', player: relax },
    { key: 'rhythm', title: 'Ritmo suave bebê', description: 'Ritmo suave enviado para uma rotina tranquila.', listDescription: 'Ritmo leve para manter uma rotina calma.', icon: '🧸', player: rhythm },
  ], [relax, rhythm, womb]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [remainingMs, setRemainingMs] = useState(ONE_HOUR_MS);
  const timerStartedAtRef = useRef(0);
  const remainingAtStartRef = useRef(ONE_HOUR_MS);
  const current = tracks[selectedIndex];

  useEffect(() => {
    enableLoop(womb);
    enableLoop(relax);
    enableLoop(rhythm);
  }, [relax, rhythm, womb]);

  useEffect(() => {
    if (!playing) return;
    const timer = setInterval(() => {
      const remaining = Math.max(0, remainingAtStartRef.current - (getWallTime() - timerStartedAtRef.current));
      setRemainingMs(remaining);
      if (remaining <= 0) {
        tracks.forEach((track) => {
          track.player.pause();
          void track.player.seekTo(0);
        });
        remainingAtStartRef.current = ONE_HOUR_MS;
        setPlaying(false);
        setRemainingMs(ONE_HOUR_MS);
      }
    }, 500);
    return () => clearInterval(timer);
  }, [playing, tracks]);

  const pause = () => {
    const remaining = Math.max(0, remainingAtStartRef.current - (getWallTime() - timerStartedAtRef.current));
    remainingAtStartRef.current = remaining;
    current.player.pause();
    setRemainingMs(remaining);
    setPlaying(false);
  };

  const play = () => {
    remainingAtStartRef.current = remainingMs || ONE_HOUR_MS;
    timerStartedAtRef.current = getWallTime();
    current.player.play();
    setPlaying(true);
  };

  const stop = () => {
    tracks.forEach((track) => {
      track.player.pause();
      void track.player.seekTo(0);
    });
    remainingAtStartRef.current = ONE_HOUR_MS;
    setRemainingMs(ONE_HOUR_MS);
    setPlaying(false);
  };

  const selectTrack = (index: number) => {
    if (index === selectedIndex) return;
    const shouldContinue = playing;
    current.player.pause();
    setSelectedIndex(index);
    if (shouldContinue) {
      tracks[index].player.play();
      timerStartedAtRef.current = getWallTime();
      remainingAtStartRef.current = remainingMs;
    }
  };

  const elapsedMs = ONE_HOUR_MS - remainingMs;
  const progress = Math.min(100, Math.max(0, (elapsedMs / ONE_HOUR_MS) * 100));
  const paused = !playing && remainingMs < ONE_HOUR_MS;

  return (
    <NinouScreen title="Sons" hidePageHeader>
      <NinouCard style={[styles.hero, isDesktop && styles.heroDesktop]}>
        <View style={[styles.heroIcon, isDesktop && styles.heroIconDesktop, { backgroundColor: colors.primarySoft, borderColor: colors.border }]}><Text style={[styles.heroIconText, isDesktop && styles.heroIconTextDesktop, { color: colors.text }]}>♪</Text></View>
        <View style={styles.heroCopy}>
          <Text style={[styles.kicker, { color: colors.textMuted }]}>Sons para dormir</Text>
          <Text style={[styles.heroTitle, isDesktop && styles.heroTitleDesktop, { color: colors.text }]}>Escolha um som relaxante</Text>
          <Text style={[styles.heroText, isDesktop && styles.heroTextDesktop, { color: colors.textMuted }]}>Toque por 1 hora, com repetição automática até o timer terminar.</Text>
        </View>
      </NinouCard>

      <View style={[styles.soundWorkspace, isDesktop && styles.soundWorkspaceDesktop]}>
        <NinouCard style={[styles.playerCard, isDesktop && styles.playerCardDesktop]}>
          <View style={styles.playerTopline}>
            <Text style={[styles.kicker, { color: colors.textMuted }]}>{playing ? 'Tocando agora' : paused ? 'Pausado' : 'Pronto para tocar'}</Text>
            <Text style={[styles.timer, isDesktop && styles.timerDesktop, { color: colors.text }]}>{formatTimer(remainingMs)}</Text>
          </View>
          <View style={styles.currentSound}>
            <View style={[styles.currentIcon, isDesktop && styles.currentIconDesktop, { backgroundColor: colors.surfaceElevated }]}><Text style={[styles.emoji, isDesktop && styles.emojiDesktop]}>{current.icon}</Text></View>
            <View style={styles.currentCopy}>
              <Text style={[styles.currentTitle, isDesktop && styles.currentTitleDesktop, { color: colors.text }]}>{current.title}</Text>
              <Text style={[styles.currentDescription, isDesktop && styles.currentDescriptionDesktop, { color: colors.textMuted }]}>{current.description}</Text>
            </View>
          </View>
          <View style={[styles.progressTrack, { backgroundColor: colors.surfaceElevated }]}>
            <LinearGradient colors={['#8F75FF', '#78E2C7']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
          <View style={styles.playerMeta}>
            <Text style={[styles.metaText, { color: colors.textMuted }]}>{formatTimer(elapsedMs).replace(/^00:/, '')}</Text>
            <Text style={[styles.metaText, styles.metaCenter, { color: colors.textMuted }]}>Repetir ativo • para em 1h</Text>
            <Text style={[styles.metaText, styles.metaRight, { color: colors.textMuted }]}>{formatTimer(remainingMs)}</Text>
          </View>
          <View style={styles.controls}>
            <Pressable onPress={playing ? pause : play} style={styles.mainControlWrap}>
              <LinearGradient colors={['#FF9675', '#FFD0AD']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.mainControl, isDesktop && styles.mainControlDesktop]}>
                <Text style={[styles.mainControlText, isDesktop && styles.mainControlTextDesktop]}>{playing ? 'Ⅱ  Pausar' : paused ? '▶  Continuar' : '▶  Tocar por 1h'}</Text>
              </LinearGradient>
            </Pressable>
            <Pressable onPress={stop} style={[styles.stopControl, isDesktop && styles.stopControlDesktop, { borderColor: `${colors.warning}88`, backgroundColor: `${colors.warning}12` }]}>
              <Text style={[styles.stopText, { color: colors.warning }]}>■ Parar</Text>
            </Pressable>
          </View>
        </NinouCard>

        <View style={[styles.soundList, isDesktop && styles.soundListDesktop]}>
          {tracks.map((track, index) => {
            const selected = selectedIndex === index;
            return (
              <Pressable
                key={track.key}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                accessibilityLabel={`Selecionar ${track.title}`}
                onPress={() => selectTrack(index)}
                style={[styles.soundOption, isDesktop && styles.soundOptionDesktop, { backgroundColor: selected ? colors.primarySoft : colors.surface, borderColor: selected ? colors.primary : colors.border }]}>
                <View style={[styles.optionIcon, { backgroundColor: colors.surfaceElevated }]}><Text style={styles.emoji}>{track.icon}</Text></View>
                <View style={styles.optionCopy}>
                  <Text style={[styles.optionTitle, { color: colors.text }]}>{track.title}</Text>
                  <Text style={[styles.optionDescription, { color: colors.textMuted }]}>{track.listDescription}</Text>
                </View>
                <Text style={[styles.playMark, { color: selected ? colors.accent : colors.primary }]}>{selected ? '● ▶' : '▶'}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <NinouCard>
        <Text style={[styles.noteTitle, { color: colors.text }]}>Observação</Text>
        <Text style={[styles.noteText, { color: colors.textMuted }]}>O som começa após tocar em play e fica em repetição até completar 1 hora. No iPhone, mantenha o modo silencioso desligado e o volume ativo para melhor reprodução.</Text>
      </NinouCard>
    </NinouScreen>
  );
}

const styles = StyleSheet.create({
  hero: { minHeight: 122, flexDirection: 'row', alignItems: 'center', gap: spacing.lg, padding: 18 },
  heroDesktop: { minHeight: 178, borderRadius: 30, paddingHorizontal: 32, gap: 24 },
  heroIcon: { width: 58, height: 58, borderRadius: 29, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center' },
  heroIconDesktop: { width: 82, height: 82, borderRadius: 28 },
  heroIconText: { fontSize: 28 },
  heroIconTextDesktop: { fontSize: 40 },
  heroCopy: { flex: 1, gap: 4 },
  kicker: { fontSize: 11, lineHeight: 14, fontWeight: '900', letterSpacing: 1.05, textTransform: 'uppercase' },
  heroTitle: { fontSize: 20, lineHeight: 24, fontWeight: '900' },
  heroTitleDesktop: { fontSize: 31, lineHeight: 37 },
  heroText: { fontSize: 14, lineHeight: 20 },
  heroTextDesktop: { maxWidth: 720, fontSize: 16, lineHeight: 24 },
  soundWorkspace: { gap: 14 },
  soundWorkspaceDesktop: { flexDirection: 'row', alignItems: 'stretch', gap: 24 },
  playerCard: { gap: spacing.lg, padding: 20 },
  playerCardDesktop: { flex: 1.35, minHeight: 430, borderRadius: 30, padding: 30, justifyContent: 'space-between' },
  playerTopline: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  timer: { fontSize: 26, lineHeight: 30, fontWeight: '900', fontVariant: ['tabular-nums'] },
  timerDesktop: { fontSize: 38, lineHeight: 44 },
  currentSound: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  currentIcon: { width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center' },
  currentIconDesktop: { width: 76, height: 76, borderRadius: 26 },
  emoji: { fontSize: 24 },
  emojiDesktop: { fontSize: 36 },
  currentCopy: { flex: 1, gap: 3 },
  currentTitle: { fontSize: 17, fontWeight: '900' },
  currentTitleDesktop: { fontSize: 24 },
  currentDescription: { fontSize: 14, lineHeight: 20 },
  currentDescriptionDesktop: { marginTop: 5, fontSize: 16, lineHeight: 24 },
  progressTrack: { height: 10, borderRadius: radius.pill, overflow: 'hidden' },
  progressFill: { height: '100%', minWidth: 0, borderRadius: radius.pill },
  playerMeta: { flexDirection: 'row', alignItems: 'center' },
  metaText: { width: 58, fontSize: 11, lineHeight: 14, fontWeight: '900', fontVariant: ['tabular-nums'] },
  metaCenter: { flex: 1, width: 'auto', textAlign: 'center' },
  metaRight: { textAlign: 'right' },
  controls: { flexDirection: 'row', gap: 10 },
  mainControlWrap: { flex: 1 },
  mainControl: { minHeight: 50, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.md },
  mainControlDesktop: { minHeight: 62, borderRadius: 20 },
  mainControlText: { color: '#211F38', fontSize: 15, fontWeight: '800' },
  mainControlTextDesktop: { fontSize: 17 },
  stopControl: { width: 96, minHeight: 50, borderRadius: radius.md, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center' },
  stopControlDesktop: { width: 122, minHeight: 62, borderRadius: 20 },
  stopText: { fontSize: 14, fontWeight: '800' },
  soundList: { gap: 10 },
  soundListDesktop: { width: 390, justifyContent: 'space-between', gap: 14 },
  soundOption: { minHeight: 82, borderRadius: 22, borderWidth: StyleSheet.hairlineWidth, padding: 12, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  soundOptionDesktop: { flex: 1, minHeight: 126, borderRadius: 26, padding: 18 },
  optionIcon: { width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center' },
  optionCopy: { flex: 1, gap: 3 },
  optionTitle: { fontSize: 16, fontWeight: '900' },
  optionDescription: { fontSize: 13, lineHeight: 18 },
  playMark: { fontSize: 12, fontWeight: '900' },
  noteTitle: { fontSize: 17, fontWeight: '900' },
  noteText: { marginTop: spacing.md, fontSize: 14, lineHeight: 21 },
});
