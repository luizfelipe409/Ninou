import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

import { useNinouTheme } from '@/theme/tokens';

export function NinouBackground({ intense = false }: { intense?: boolean }) {
  const { isDark } = useNinouTheme();
  const [drift] = useState(() => new Animated.Value(0));
  const [twinkle] = useState(() => new Animated.Value(0));

  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(drift, { toValue: 1, duration: 6500, useNativeDriver: true }),
      Animated.timing(drift, { toValue: 0, duration: 6500, useNativeDriver: true }),
    ]));
    const twinkleLoop = Animated.loop(Animated.sequence([
      Animated.timing(twinkle, { toValue: 1, duration: 2100, useNativeDriver: true }),
      Animated.timing(twinkle, { toValue: 0, duration: 2600, useNativeDriver: true }),
    ]));
    loop.start();
    twinkleLoop.start();
    return () => { loop.stop(); twinkleLoop.stop(); };
  }, [drift, twinkle]);

  const transform = [{ translateX: drift.interpolate({ inputRange: [0, 1], outputRange: [-18, 18] }) }, { translateY: drift.interpolate({ inputRange: [0, 1], outputRange: [8, -12] }) }, { scale: drift.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] }) }];

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <LinearGradient
        colors={isDark ? ['#0D091C', '#17102E', '#0B1627'] : ['#FFF0D8', '#FFEEDB', '#F8EEFA']}
        start={{ x: 0.08, y: 0 }} end={{ x: 0.94, y: 1 }} style={StyleSheet.absoluteFill}
      />
      <Animated.View style={[styles.glow, styles.violet, { opacity: intense ? 0.62 : 0.34, backgroundColor: isDark ? '#7857D8' : '#D9C7FF', transform }]} />
      <Animated.View style={[styles.glow, styles.mint, { opacity: intense ? 0.34 : 0.18, backgroundColor: isDark ? '#2A937B' : '#BDEBDC', transform: [{ translateX: drift.interpolate({ inputRange: [0, 1], outputRange: [12, -16] }) }, { scale: drift.interpolate({ inputRange: [0, 1], outputRange: [1.08, 0.96] }) }] }]} />
      <Animated.View style={[styles.glow, styles.gold, { opacity: isDark ? 0.1 : intense ? 0.42 : 0.27, backgroundColor: isDark ? '#F2B35B' : '#FFD18E', transform: [{ translateY: drift.interpolate({ inputRange: [0, 1], outputRange: [-10, 16] }) }, { scale: drift.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1.08] }) }] }]} />
      <View style={[styles.ring, styles.ringA, { borderColor: isDark ? 'rgba(160,134,244,0.07)' : 'rgba(117,88,232,0.055)' }]} />
      <View style={[styles.ring, styles.ringB, { borderColor: isDark ? 'rgba(97,225,191,0.06)' : 'rgba(53,185,151,0.055)' }]} />
      <Animated.Text style={[styles.star, styles.starA, { color: isDark ? '#FFF8E5' : '#B493D9', opacity: twinkle.interpolate({ inputRange: [0, 1], outputRange: [0.18, 0.62] }), transform: [{ scale: twinkle.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1.18] }) }] }]}>✦</Animated.Text>
      <Animated.Text style={[styles.star, styles.starB, { color: isDark ? '#C8B8FF' : '#D3A654', opacity: twinkle.interpolate({ inputRange: [0, 1], outputRange: [0.48, 0.16] }) }]}>✧</Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  glow: { position: 'absolute', borderRadius: 999 },
  violet: { width: 360, height: 360, right: -150, top: 80 },
  mint: { width: 330, height: 330, left: -180, bottom: -90 },
  gold: { width: 260, height: 260, left: -120, top: -90 },
  ring: { position: 'absolute', borderRadius: 999, borderWidth: 44 },
  ringA: { width: 430, height: 430, right: -310, top: 210, transform: [{ rotate: '18deg' }] },
  ringB: { width: 380, height: 380, left: -285, bottom: 90, transform: [{ rotate: '-14deg' }] },
  star: { position: 'absolute', fontSize: 15 }, starA: { right: '13%', top: '12%' }, starB: { left: '11%', top: '38%', fontSize: 11 },
});
