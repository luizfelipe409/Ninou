import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

import { useNinouTheme } from '@/theme/tokens';

export function NinouBackground({ intense = false }: { intense?: boolean }) {
  const { isDark } = useNinouTheme();
  const [drift] = useState(() => new Animated.Value(0));

  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(drift, { toValue: 1, duration: 6500, useNativeDriver: true }),
      Animated.timing(drift, { toValue: 0, duration: 6500, useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [drift]);

  const transform = [{ translateX: drift.interpolate({ inputRange: [0, 1], outputRange: [-18, 18] }) }, { translateY: drift.interpolate({ inputRange: [0, 1], outputRange: [8, -12] }) }, { scale: drift.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] }) }];

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <LinearGradient
        colors={isDark ? ['#100C21', '#17102E', '#0F1429'] : ['#FBF9FD', '#F4EFFB', '#EEF8F5']}
        start={{ x: 0.08, y: 0 }} end={{ x: 0.94, y: 1 }} style={StyleSheet.absoluteFill}
      />
      <Animated.View style={[styles.glow, styles.violet, { opacity: intense ? 0.62 : 0.34, backgroundColor: isDark ? '#7857D8' : '#D9C7FF', transform }]} />
      <Animated.View style={[styles.glow, styles.mint, { opacity: intense ? 0.34 : 0.18, backgroundColor: isDark ? '#2A937B' : '#BDEBDC', transform: [{ translateX: drift.interpolate({ inputRange: [0, 1], outputRange: [12, -16] }) }, { scale: drift.interpolate({ inputRange: [0, 1], outputRange: [1.08, 0.96] }) }] }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  glow: { position: 'absolute', borderRadius: 999 },
  violet: { width: 360, height: 360, right: -150, top: 80 },
  mint: { width: 330, height: 330, left: -180, bottom: -90 },
});
