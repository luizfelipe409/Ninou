import type { PropsWithChildren, ReactNode } from 'react';
import { Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { radius, spacing, useNinouTheme } from '@/theme/tokens';
import { NinouAppHeader } from '@/components/ninou-app-header';
import { NinouBackground } from '@/components/ninou-background';

type NinouScreenProps = PropsWithChildren<{
  eyebrow?: string;
  title: string;
  subtitle?: string;
  accessory?: ReactNode;
  hidePageHeader?: boolean;
}>;

export function NinouScreen({ eyebrow, title, subtitle, accessory, hidePageHeader = false, children }: NinouScreenProps) {
  const { colors } = useNinouTheme();

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top']}>
      <NinouBackground />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic">
        <NinouAppHeader />
        {!hidePageHeader ? (
          <View style={styles.header}>
            <View style={styles.headerCopy}>
              {eyebrow ? <Text style={[styles.eyebrow, { color: colors.primary }]}>{eyebrow}</Text> : null}
              <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
              {subtitle ? <Text style={[styles.subtitle, { color: colors.textMuted }]}>{subtitle}</Text> : null}
            </View>
            {accessory}
          </View>
        ) : null}
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

export function NinouCard({ children, style }: PropsWithChildren<{ style?: object }>) {
  const { colors } = useNinouTheme();
  const shadow = Platform.select({
    web: { boxShadow: `0 10px 20px ${colors.shadow}1A` },
    ios: {
      shadowColor: colors.shadow,
      shadowOpacity: 0.1,
      shadowRadius: 20,
      shadowOffset: { width: 0, height: 10 },
    },
    android: { elevation: 3 },
  });
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border },
        shadow,
        style,
      ]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  content: {
    width: '100%',
    maxWidth: 540,
    alignSelf: 'center',
    paddingHorizontal: 14,
    paddingTop: Platform.OS === 'web' ? 38 : spacing.md,
    paddingBottom: 132,
    gap: 14,
  },
  header: {
    minHeight: 86,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.lg,
  },
  headerCopy: { flex: 1, gap: spacing.xs },
  eyebrow: { fontSize: 12, fontWeight: '800', letterSpacing: 1.2, textTransform: 'uppercase' },
  title: { fontSize: 30, lineHeight: 35, fontWeight: '800', letterSpacing: -0.8 },
  subtitle: { fontSize: 15, lineHeight: 21 },
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
});
