import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { NinouCard, NinouScreen } from '@/components/ninou-screen';
import { createEmptyDayState, formatDuration, getTodaySummary, type DayState } from '@/domain/routine';
import { getLocalDateId } from '@/services/firebase';
import { useRoutine } from '@/state/routine-context';
import { useBabyProfile } from '@/state/profile-context';
import { radius, spacing, useNinouTheme } from '@/theme/tokens';

type DayMetric = {
  id: string;
  label: string;
  state: DayState;
  sleepMs: number;
  breastfeeding: number;
  bottleMl: number;
  feeding: number;
  diapers: number;
  medicine: number;
  sleepRecords: number;
};

const dayLabels = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];

function metricForDay(id: string, state: DayState, now: number, isToday: boolean): DayMetric {
  const safeState = isToday ? state : { ...state, mode: 'idle' as const, activeStartedAt: null };
  const summary = getTodaySummary(safeState, now);
  const date = new Date(`${id}T12:00:00`);
  return {
    id,
    label: dayLabels[date.getDay()],
    state,
    sleepMs: summary.sleepMs,
    breastfeeding: state.events.filter((event) => event.type === 'amamentacao').length,
    bottleMl: state.events.filter((event) => event.type === 'mamadeira').reduce((total, event) => total + (event.amountMl || 0), 0),
    feeding: summary.feeding,
    diapers: summary.diapers,
    medicine: summary.medicine,
    sleepRecords: state.events.filter((event) => event.type === 'sono' || event.type === 'dormir').length,
  };
}

export default function DataScreen() {
  const { colors } = useNinouTheme();
  const { width } = useWindowDimensions();
  const { state, history, now } = useRoutine();
  const { profile } = useBabyProfile();
  const todayId = getLocalDateId(now);
  const dayIds = Array.from({ length: 7 }, (_, index) => getLocalDateId(now - (6 - index) * 86400000));
  const days = dayIds.map((id) => metricForDay(id, id === todayId ? state : history[id] || createEmptyDayState(), now, id === todayId));
  const activeDays = days.filter((day) => day.state.events.length > 0);
  const registeredDays = activeDays.length;
  const totalSleep = days.reduce((total, day) => total + day.sleepMs, 0);
  const totalSleepRecords = days.reduce((total, day) => total + day.sleepRecords, 0);
  const averageSleep = registeredDays ? totalSleep / registeredDays : 0;
  const averageNaps = registeredDays ? totalSleepRecords / registeredDays : 0;
  const today = days[days.length - 1];
  const compactCharts = width < 430;
  const weights = [...profile.weights].sort((left, right) => right.date.localeCompare(left.date));
  const latestWeight = weights[0];

  return (
    <NinouScreen title="Dados" hidePageHeader>
      <LinearGradient colors={['#2B2048', '#201632']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.hero, { borderColor: colors.border }]}>
        <View style={styles.heroCopy}>
          <Text style={[styles.kicker, { color: colors.textMuted }]}>Últimos 7 dias</Text>
          <Text style={[styles.heroTitle, { color: colors.text }]}>Dados inteligentes</Text>
          <Text style={[styles.heroText, { color: colors.textMuted }]}>Um painel mais limpo para acompanhar sono, alimentação, fraldas, medicamentos e crescimento sem poluição visual.</Text>
        </View>
        <View style={[styles.heroBadge, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
          <Text style={[styles.badgeKicker, { color: colors.textMuted }]}>Resumo</Text>
          <Text style={[styles.badgeValue, { color: colors.text }]}>7 dias</Text>
        </View>
      </LinearGradient>

      <Pressable onPress={() => router.push('/relatorios' as never)} style={({ pressed }) => [styles.reportButton, { backgroundColor: colors.primary, borderColor: colors.primary }, pressed && styles.pressed]}><View style={styles.reportIcon}><Ionicons name="document-text-outline" size={24} color="#FFFFFF" /></View><View style={styles.reportCopy}><Text style={styles.reportKicker}>RELATÓRIO DE ROTINA</Text><Text style={styles.reportTitle}>PDF, WhatsApp, CSV e JSON</Text><Text style={styles.reportHint}>Escolha o período e compartilhe dados reais da família.</Text></View><Ionicons name="chevron-forward" size={22} color="#FFFFFF" /></Pressable>

      <View style={styles.overviewRow}>
        <NinouCard style={styles.overviewCard}>
          <Text style={[styles.kicker, { color: colors.textMuted }]}>Média de sono</Text>
          <Text style={[styles.overviewValue, { color: colors.text }]}>{formatDuration(averageSleep)}</Text>
          <Text style={[styles.overviewHint, { color: colors.textMuted }]}>{registeredDays ? `Com base em ${registeredDays} dia(s) com registro.` : 'Sono registrado por dia.'}</Text>
        </NinouCard>
        <NinouCard style={styles.overviewCard}>
          <Text style={[styles.kicker, { color: colors.textMuted }]}>Sonecas/dia</Text>
          <Text style={[styles.overviewValue, { color: colors.text }]}>{averageNaps.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}</Text>
          <Text style={[styles.overviewHint, { color: colors.textMuted }]}>{totalSleepRecords ? `${totalSleepRecords} registros de sono nos últimos 7 dias.` : 'Média de sonecas e noites.'}</Text>
        </NinouCard>
      </View>

      <View style={styles.kpiRow}>
        <Kpi label="Sono hoje" value={formatDuration(today.sleepMs)} hint="Total dormido desde meia-noite." />
        <Kpi label="Alimentações" value={String(today.feeding)} hint="Amamentação e mamadeira." />
        <Kpi label="Fraldas" value={String(today.diapers)} hint="Trocas registradas hoje." />
        <Kpi label="Medicamentos" value={String(today.medicine)} hint="Doses registradas hoje." />
      </View>

      <NinouCard>
        <View style={styles.cardTitleRow}>
          <View>
            <Text style={[styles.kicker, { color: colors.textMuted }]}>Peso e crescimento</Text>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Peso do bebê</Text>
          </View>
          <View style={[styles.statusPill, { backgroundColor: colors.surfaceElevated }]}><Text style={[styles.statusText, { color: colors.textMuted }]}>Acompanhe no perfil</Text></View>
        </View>
        <View style={[styles.weightEmpty, { borderColor: colors.border, backgroundColor: colors.surfaceElevated }]}>
          <Text style={[styles.weightValue, { color: colors.text }]}>{latestWeight ? `${latestWeight.value.toLocaleString('pt-BR', { minimumFractionDigits: 3, maximumFractionDigits: 3 })} kg` : 'Sem peso cadastrado'}</Text>
          <Text style={[styles.overviewHint, { color: colors.textMuted }]}>{latestWeight ? `Última pesagem em ${new Date(`${latestWeight.date}T12:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}.` : 'Registre o peso no Perfil para acompanhar evolução e histórico.'}</Text>
          {weights.slice(0, 4).map((weight) => (
            <View key={weight.id} style={[styles.weightRow, { borderTopColor: colors.border }]}>
              <Text style={[styles.weightRowDate, { color: colors.textMuted }]}>{new Date(`${weight.date}T12:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</Text>
              <Text style={[styles.weightRowValue, { color: colors.text }]}>{weight.value.toLocaleString('pt-BR', { minimumFractionDigits: 3, maximumFractionDigits: 3 })} kg</Text>
            </View>
          ))}
        </View>
      </NinouCard>

      <View style={styles.sectionHeading}>
        <Text style={[styles.kicker, { color: colors.textMuted }]}>Tendências</Text>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Rotina por categoria</Text>
        <Text style={[styles.heroText, { color: colors.textMuted }]}>Leitura rápida e comparação visual dos últimos dias.</Text>
      </View>

      <View style={styles.chartGrid}>
        <ChartCard title="Sono" days={days} values={days.map((day) => Math.round(day.sleepMs / 60000))} formatValue={(value) => formatDuration(value * 60000)} wide />
        <ChartCard title="Amamentação" days={days} values={days.map((day) => day.breastfeeding)} formatValue={String} compact={compactCharts} />
        <ChartCard title="Mamadeira" days={days} values={days.map((day) => day.bottleMl)} formatValue={(value) => `${value} ml`} compact={compactCharts} />
        <ChartCard title="Fraldas" days={days} values={days.map((day) => day.diapers)} formatValue={String} compact={compactCharts} />
        <ChartCard title="Medicamentos" days={days} values={days.map((day) => day.medicine)} formatValue={String} compact={compactCharts} />
      </View>

      <View style={styles.insightRow}>
        <NinouCard style={styles.insightCard}>
          <Text style={[styles.kicker, { color: colors.textMuted }]}>Melhor janela</Text>
          <Text style={[styles.insightValue, { color: colors.text }]}>Sem dados</Text>
          <Text style={[styles.overviewHint, { color: colors.textMuted }]}>Registre mais sonecas para calcular a janela mais comum.</Text>
        </NinouCard>
        <NinouCard style={styles.insightCard}>
          <Text style={[styles.kicker, { color: colors.textMuted }]}>Rotina</Text>
          <Text style={[styles.insightValue, { color: colors.text }]}>Aprendendo</Text>
          <Text style={[styles.overviewHint, { color: colors.textMuted }]}>A rotina será calculada com base nos horários das sonecas.</Text>
        </NinouCard>
      </View>
    </NinouScreen>
  );
}

function Kpi({ label, value, hint }: { label: string; value: string; hint: string }) {
  const { colors } = useNinouTheme();
  return (
    <NinouCard style={styles.kpiCard}>
      <Text style={[styles.kicker, { color: colors.textMuted }]} numberOfLines={2}>{label}</Text>
      <Text style={[styles.kpiValue, { color: colors.text }]}>{value}</Text>
      <Text style={[styles.kpiHint, { color: colors.textMuted }]}>{hint}</Text>
    </NinouCard>
  );
}

function ChartCard({ title, days, values, formatValue, wide = false, compact = false }: {
  title: string;
  days: DayMetric[];
  values: number[];
  formatValue: (value: number) => string;
  wide?: boolean;
  compact?: boolean;
}) {
  const { colors } = useNinouTheme();
  const maximum = Math.max(1, ...values);
  const hasData = values.some((value) => value > 0);
  return (
    <NinouCard style={[styles.chartCard, wide || compact ? styles.chartWide : null]}>
      <View style={styles.chartTitleRow}>
        <View style={[styles.rangePill, { backgroundColor: colors.surfaceElevated }]}><Text style={[styles.rangeText, { color: colors.textMuted }]}>Últimos 7 dias</Text></View>
        <Text style={[styles.chartTitle, { color: colors.text }]}>{title}</Text>
      </View>
      <View style={[styles.chartStage, { borderColor: colors.border, backgroundColor: colors.surfaceElevated }]}>
        {!hasData ? <Text style={[styles.emptyChartText, { color: colors.textMuted }]}>Sem registros reais neste período</Text> : null}
        <View style={styles.bars}>
          {days.map((day, index) => {
            const value = values[index];
            const height = value > 0 ? 26 + (value / maximum) * 82 : 2;
            return (
              <View key={day.id} style={styles.barColumn}>
                {value > 0 ? <Text style={[styles.barValue, { color: colors.text }]}>{formatValue(value)}</Text> : null}
                <LinearGradient colors={['#8F75FF', '#78E2C7']} start={{ x: 0, y: 1 }} end={{ x: 0, y: 0 }} style={[styles.bar, { height, opacity: value > 0 ? 1 : 0.2 }]} />
                <Text style={[styles.dayLabel, { color: colors.textMuted }]}>{day.label}</Text>
              </View>
            );
          })}
        </View>
      </View>
    </NinouCard>
  );
}

const styles = StyleSheet.create({
  hero: { minHeight: 188, borderRadius: radius.lg, borderWidth: StyleSheet.hairlineWidth, padding: spacing.xl, flexDirection: 'row', alignItems: 'center', gap: spacing.lg, overflow: 'hidden' },
  heroCopy: { flex: 1, gap: spacing.sm },
  kicker: { fontSize: 11, lineHeight: 14, fontWeight: '900', letterSpacing: 1.05, textTransform: 'uppercase' },
  heroTitle: { fontSize: 39, lineHeight: 40, fontWeight: '900', letterSpacing: -2 },
  heroText: { fontSize: 14, lineHeight: 20 },
  heroBadge: { width: 86, minHeight: 86, borderRadius: 25, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center', gap: 2 },
  reportButton: { minHeight: 92, borderRadius: radius.lg, borderWidth: StyleSheet.hairlineWidth, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }, reportIcon: { width: 50, height: 50, borderRadius: 17, backgroundColor: 'rgba(255,255,255,0.14)', alignItems: 'center', justifyContent: 'center' }, reportCopy: { flex: 1 }, reportKicker: { color: 'rgba(255,255,255,0.72)', fontSize: 8.5, fontWeight: '900', letterSpacing: 1 }, reportTitle: { color: '#FFF', marginTop: 3, fontSize: 15, fontWeight: '900' }, reportHint: { color: 'rgba(255,255,255,0.76)', marginTop: 3, fontSize: 10.5, lineHeight: 15 }, pressed: { opacity: 0.72, transform: [{ scale: 0.985 }] },
  badgeKicker: { fontSize: 9, fontWeight: '900', letterSpacing: 1, textTransform: 'uppercase' },
  badgeValue: { fontSize: 18, fontWeight: '900' },
  overviewRow: { flexDirection: 'row', gap: 12 },
  overviewCard: { flex: 1, minWidth: 0, minHeight: 132, gap: spacing.sm },
  overviewValue: { fontSize: 29, lineHeight: 32, fontWeight: '900', letterSpacing: -1 },
  overviewHint: { fontSize: 12.5, lineHeight: 18 },
  kpiRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  kpiCard: { width: '23%', minWidth: 108, flexGrow: 1, minHeight: 140, padding: 14, gap: spacing.sm },
  kpiValue: { fontSize: 25, fontWeight: '800' },
  kpiHint: { fontSize: 11.5, lineHeight: 16 },
  cardTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.md },
  sectionTitle: { marginTop: 5, fontSize: 20, fontWeight: '900' },
  statusPill: { borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 8 },
  statusText: { fontSize: 10, fontWeight: '900' },
  weightEmpty: { marginTop: spacing.lg, minHeight: 118, borderRadius: radius.md, borderWidth: StyleSheet.hairlineWidth, padding: spacing.lg, justifyContent: 'center', gap: spacing.sm },
  weightValue: { fontSize: 21, fontWeight: '900' },
  weightRow: { minHeight: 34, borderTopWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  weightRowDate: { fontSize: 12, fontWeight: '700' },
  weightRowValue: { fontSize: 13, fontWeight: '900' },
  sectionHeading: { paddingHorizontal: spacing.sm, paddingVertical: spacing.md, gap: spacing.xs },
  chartGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  chartCard: { width: '48%', minWidth: 240, flexGrow: 1, gap: spacing.lg },
  chartWide: { width: '100%' },
  chartTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  rangePill: { borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 6 },
  rangeText: { fontSize: 10, fontWeight: '900', textTransform: 'uppercase' },
  chartTitle: { flex: 1, fontSize: 20, fontWeight: '900', textAlign: 'right' },
  chartStage: { minHeight: 190, borderRadius: radius.lg, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 10, paddingTop: 18, overflow: 'hidden', justifyContent: 'flex-end' },
  emptyChartText: { position: 'absolute', alignSelf: 'center', top: 78, fontSize: 12, fontWeight: '800' },
  bars: { minHeight: 150, flexDirection: 'row', alignItems: 'flex-end', gap: 5 },
  barColumn: { flex: 1, minWidth: 0, alignItems: 'center', justifyContent: 'flex-end', gap: 5 },
  barValue: { fontSize: 8.5, fontWeight: '900', textAlign: 'center' },
  bar: { width: '72%', minWidth: 9, maxWidth: 32, borderTopLeftRadius: 16, borderTopRightRadius: 16 },
  dayLabel: { height: 18, fontSize: 9.5, fontWeight: '800' },
  insightRow: { flexDirection: 'row', gap: 12 },
  insightCard: { flex: 1, gap: spacing.sm },
  insightValue: { fontSize: 20, fontWeight: '900' },
});
