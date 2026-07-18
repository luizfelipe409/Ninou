import { Image, type ImageSourcePropType, StyleSheet, View } from 'react-native';

import { useNinouTheme } from '@/theme/tokens';
import { normalizeAvatarId, type AvatarId } from '@/domain/avatar';

const avatarImages: Record<AvatarId, ImageSourcePropType> = {
  'avatar-01': require('@/assets/avatars/avatar-01.webp'),
  'avatar-02': require('@/assets/avatars/avatar-02.webp'),
  'avatar-03': require('@/assets/avatars/avatar-03.webp'),
  'avatar-04': require('@/assets/avatars/avatar-04.webp'),
  'avatar-05': require('@/assets/avatars/avatar-05.webp'),
  'avatar-06': require('@/assets/avatars/avatar-06.webp'),
  'avatar-07': require('@/assets/avatars/avatar-07.webp'),
  'avatar-08': require('@/assets/avatars/avatar-08.webp'),
  'avatar-09': require('@/assets/avatars/avatar-09.webp'),
  'avatar-10': require('@/assets/avatars/avatar-10.webp'),
  'avatar-11': require('@/assets/avatars/avatar-11.webp'),
  'avatar-12': require('@/assets/avatars/avatar-12.webp'),
};

export function AvatarArt({ avatarId, size = 64, rounded = false }: { avatarId?: string; size?: number; rounded?: boolean }) {
  const { colors } = useNinouTheme();
  const radius = rounded ? size * 0.34 : size / 2;
  return (
    <View style={[styles.frame, { width: size, height: size, borderRadius: radius, borderColor: colors.border, backgroundColor: colors.surfaceElevated }]}>
      <Image source={avatarImages[normalizeAvatarId(avatarId)]} resizeMode="cover" style={{ width: '100%', height: '100%', borderRadius: Math.max(0, radius - 3) }} />
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    padding: 3,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
  },
});
