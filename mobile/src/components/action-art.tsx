import Ionicons from '@expo/vector-icons/Ionicons';
import { Image, StyleSheet, View } from 'react-native';

import type { RecordType } from '@/domain/routine';
import { useNinouTheme } from '@/theme/tokens';

const images = {
  acordou: require('@/assets/actions/acordou.png'),
  sono: require('@/assets/actions/soneca.png'),
  dormir: require('@/assets/actions/dormir.png'),
  'despertar-noturno': require('@/assets/actions/despertar-noturno.png'),
  amamentacao: require('@/assets/actions/amamentacao.png'),
  mamadeira: require('@/assets/actions/mamadeira.png'),
  fralda: require('@/assets/actions/fralda.png'),
} as const;

export function ActionArt({ type, size = 64 }: { type: RecordType; size?: number }) {
  const { colors } = useNinouTheme();
  if (type === 'medicamento') {
    return (
      <View style={[styles.medicine, { width: size, height: size, borderRadius: size / 2, backgroundColor: colors.primarySoft }]}>
        <Ionicons name="medical" size={size * 0.46} color={colors.accent} />
      </View>
    );
  }
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, overflow: 'hidden' }}>
      <Image
        source={images[type]}
        resizeMode="contain"
        fadeDuration={0}
        style={{ width: size, height: size }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  medicine: { alignItems: 'center', justifyContent: 'center' },
});
