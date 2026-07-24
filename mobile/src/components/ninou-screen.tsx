import type { PropsWithChildren, ReactNode } from 'react';
import { Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { radius, spacing, useNinouTheme } from '@/theme/tokens';
import { NinouAppHeader } from '@/components/ninou-app-header';
import { NinouBackground } from '@/components/ninou-background';
import { useRoutine } from '@/state/routine-context';
import { useNinouLayout } from '@/theme/layout';

type NinouScreenProps = PropsWithChildren<{
  eyebrow?: string;
  title: string;
  subtitle?: string;
  accessory?: ReactNode;
  hidePageHeader?: boolean;
}>;

export function NinouScreen({ eyebrow, title, subtitle, accessory, hidePageHeader = false, children }: NinouScreenProps) {
  const { colors } = useNinouTheme();
  const { state } = useRoutine();
  const { isDesktop, contentOffset } = useNinouLayout();

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }, isDesktop && { paddingLeft: contentOffset }]} edges={['top']}>
      <NinouBackground />
      <ScrollView
        contentContainerStyle={[styles.content, isDesktop && styles.contentDesktop, state.breastfeedingTimer && styles.contentWithTimer]}
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic">
        <NinouAppHeader />
        {!hidePageHeader ? (
          <View style={[styles.header, isDesktop && styles.headerDesktop]}>
            <View style={styles.headerCopy}>
              {eyebrow ? <Text style={[styles.eyebrow, { color: colors.primary }]}>{eyebrow}</Text> : null}
              <Text style={[styles.title, isDesktop && styles.titleDesktop, { color: colors.text }]}>{title}</Text>
              {subtitle ? <Text style={[styles.subtitle, isDesktop && styles.subtitleDesktop, { color: colors.textMuted }]}>{subtitle}</Text> : null}
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
  contentWithTimer: { paddingBottom: 224 },
  contentDesktop: { maxWidth: 1280, paddingHorizontal: 30, paddingTop: 28, paddingBottom: 64, gap: 20 },
  header: {
    minHeight: 86,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.lg,
  },
  headerCopy: { flex: 1, gap: spacing.xs },
  headerDesktop: { minHeight: 108 },
  eyebrow: { fontSize: 12, fontWeight: '800', letterSpacing: 1.2, textTransform: 'uppercase' },
  title: { fontSize: 30, lineHeight: 35, fontWeight: '800', letterSpacing: -0.8 },
  titleDesktop: { fontSize: 42, lineHeight: 47, letterSpacing: -1.4 },
  subtitle: { fontSize: 15, lineHeight: 21 },
  subtitleDesktop: { maxWidth: 720, fontSize: 17, lineHeight: 24 },
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
});
