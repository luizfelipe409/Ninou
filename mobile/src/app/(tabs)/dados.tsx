import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient as SvgLinearGradient, Line, Path, Rect, Stop, Text as SvgText } from 'react-native-svg';

import { NinouCard, NinouScreen } from '@/components/ninou-screen';
import { canExportFamilyReports } from '@/domain/family-access';
import { createEmptyDayState, formatDuration, getTodaySummary, type DayState } from '@/domain/routine';
import { getLocalDateId } from '@/services/firebase';
import { useNinouAuth } from '@/state/auth-context';
import { useRoutine } from '@/state/routine-context';
import { useBabyProfile, type WeightEntry } from '@/state/profile-context';
import { useNinouLayout } from '@/theme/layout';
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

function formatKg(value: number) {
  return `${value.toLocaleString('pt-BR', { minimumFractionDigits: 3, maximumFractionDigits: 3 })} kg`;
}

function formatWeightDelta(value: number) {
  const absolute = Math.abs(value);
  const sign = value >= 0 ? '+' : '−';
  if (absolute < 1) return `${sign}${Math.round(absolute * 1000)} g no período`;
  return `${sign}${absolute.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 3 })} kg no período`;
}

function buildSmoothPath(points: { x: number; y: number }[]) {
  if (!points.length) return '';
  if (points.length < 3) return points.map((point, index) => `${index ? 'L' : 'M'}${point.x.toFixed(1)} ${point.y.toFixed(1)}`).join(' ');
  const path = [`M${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`];
  for (let index = 0; index < points.length - 1; index += 1) {
    const current = points[index];
    const next = points[index + 1];
    const previous = points[index - 1] || current;
    const afterNext = points[index + 2] || next;
    const cp1x = current.x + (next.x - previous.x) / 6;
    const cp1y = current.y + (next.y - previous.y) / 6;
    const cp2x = next.x - (afterNext.x - current.x) / 6;
    const cp2y = next.y - (afterNext.y - current.y) / 6;
    path.push(`C${cp1x.toFixed(1)} ${cp1y.toFixed(1)} ${cp2x.toFixed(1)} ${cp2y.toFixed(1)} ${next.x.toFixed(1)} ${next.y.toFixed(1)}`);
  }
  return path.join(' ');
}

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
  const { colors, isDark } = useNinouTheme();
  const { isDesktop } = useNinouLayout();
  const { width } = useWindowDimensions();
  const { state, history, now } = useRoutine();
  const { access } = useNinouAuth();
  const { profile } = useBabyProfile();
  const canExportReports = Boolean(access && canExportFamilyReports(access.role));
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
  const weightsAscending = [...weights].reverse();

  return (
    <NinouScreen title="Dados" hidePageHeader>
      <LinearGradient colors={isDark ? ['#2B2048', '#201632'] : ['#FFFDFC', '#F7EFFB', '#EEF5FF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.hero, isDesktop && styles.heroDesktop, { borderColor: colors.border }]}>
        <View style={styles.heroCopy}>
          <Text style={[styles.kicker, { color: colors.textMuted }]}>Últimos 7 dias</Text>
          <Text style={[styles.heroTitle, isDesktop && styles.heroTitleDesktop, { color: colors.text }]}>Dados inteligentes</Text>
          <Text style={[styles.heroText, isDesktop && styles.heroTextDesktop, { color: colors.textMuted }]}>Um painel mais limpo para acompanhar sono, alimentação, fraldas, medicamentos e crescimento sem poluição visual.</Text>
        </View>
        <View style={[styles.heroBadge, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
          <Text style={[styles.badgeKicker, { color: colors.textMuted }]}>Resumo</Text>
          <Text style={[styles.badgeValue, { color: colors.text }]}>7 dias</Text>
        </View>
      </LinearGradient>

      <Pressable disabled={!canExportReports} onPress={() => router.push('/relatorios' as never)} style={({ pressed }) => [styles.reportButton, isDesktop && styles.reportButtonDesktop, { backgroundColor: colors.primary, borderColor: colors.primary }, !canExportReports && styles.reportDisabled, pressed && canExportReports && styles.pressed]}><View style={[styles.reportIcon, isDesktop && styles.reportIconDesktop]}><Ionicons name={canExportReports ? 'document-text-outline' : 'lock-closed-outline'} size={isDesktop ? 31 : 24} color="#FFFFFF" /></View><View style={styles.reportCopy}><Text style={styles.reportKicker}>RELATÓRIO DE ROTINA</Text><Text style={[styles.reportTitle, isDesktop && styles.reportTitleDesktop]}>{canExportReports ? 'PDF profissional, WhatsApp e Excel' : 'Exportação restrita'}</Text><Text style={[styles.reportHint, isDesktop && styles.reportHintDesktop]}>{canExportReports ? 'Escolha o período e compartilhe dados reais da família.' : 'Disponível para responsáveis e cuidadores.'}</Text></View><Ionicons name={canExportReports ? 'chevron-forward' : 'lock-closed-outline'} size={isDesktop ? 27 : 22} color="#FFFFFF" /></Pressable>

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
          <View style={[styles.statusPill, { backgroundColor: colors.surfaceElevated }]}><Text style={[styles.statusText, { color: colors.textMuted }]}>{weights.length ? `${weights.length} registro${weights.length === 1 ? '' : 's'}` : 'Aguardando registro'}</Text></View>
        </View>
        <WeightChart weights={weightsAscending} />
        {weights.length ? <View style={styles.weightHistory}>
          {weights.slice(0, 4).map((weight) => (
            <View key={weight.id} style={[styles.weightRow, { borderTopColor: colors.border }]}>
              <Text style={[styles.weightRowDate, { color: colors.textMuted }]}>{new Date(`${weight.date}T12:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</Text>
              <Text style={[styles.weightRowValue, { color: colors.text }]}>{formatKg(weight.value)}</Text>
            </View>
          ))}
        </View> : null}
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

function WeightChart({ weights }: { weights: WeightEntry[] }) {
  const { colors, isDark } = useNinouTheme();
  const normalized = weights.filter((item) => Number.isFinite(item.value)).slice(-10);
  const curveColor = isDark ? '#A892FF' : '#5C43C9';
  const gridColor = isDark ? '#C9C0FF' : '#5C43C9';

  if (!normalized.length) {
    return (
      <View style={[styles.weightChart, styles.weightChartEmpty, { borderColor: colors.border, backgroundColor: colors.surfaceElevated }]}>
        <View style={[styles.weightIcon, { backgroundColor: colors.primarySoft }]}><Ionicons name="analytics-outline" size={25} color={colors.primary} /></View>
        <Text style={[styles.weightValue, { color: colors.text }]}>Sem peso cadastrado</Text>
        <Text style={[styles.weightEmptyHint, { color: colors.textMuted }]}>Registre o primeiro peso no Perfil para montar uma curva simples e legível.</Text>
      </View>
    );
  }

  const latest = normalized[normalized.length - 1];
  if (normalized.length === 1) {
    return (
      <View style={[styles.weightChart, styles.weightChartEmpty, { borderColor: colors.border, backgroundColor: colors.surfaceElevated }]}>
        <Text style={[styles.weightEyebrow, { color: colors.textMuted }]}>Peso atual</Text>
        <Text style={[styles.weightSingleValue, { color: colors.text }]}>{formatKg(latest.value)}</Text>
        <Text style={[styles.weightSingleDate, { color: colors.textMuted }]}>{new Date(`${latest.date}T12:00:00`).toLocaleDateString('pt-BR')}</Text>
        <Text style={[styles.weightEmptyHint, { color: colors.textMuted }]}>Com mais um peso, o Ninou desenha a evolução.</Text>
      </View>
    );
  }

  const values = normalized.map((item) => item.value);
  const realMin = Math.min(...values);
  const realMax = Math.max(...values);
  const naturalSpread = Math.max(0.18, realMax - realMin);
  const paddedMin = Math.max(0, realMin - Math.max(0.08, naturalSpread * 0.22));
  const paddedMax = realMax + Math.max(0.08, naturalSpread * 0.22);
  const spread = Math.max(0.18, paddedMax - paddedMin);
  const chartWidth = 360;
  const chartHeight = 190;
  const chartLeft = 58;
  const chartRight = chartWidth - 24;
  const chartTop = 34;
  const chartBottom = chartHeight - 48;
  const points = normalized.map((item, index) => ({
    item,
    x: chartLeft + (index / (normalized.length - 1)) * (chartRight - chartLeft),
    y: chartBottom - ((item.value - paddedMin) / spread) * (chartBottom - chartTop),
  }));
  const path = buildSmoothPath(points);
  const areaPath = `${path} L${points[points.length - 1].x.toFixed(1)} ${chartBottom} L${points[0].x.toFixed(1)} ${chartBottom} Z`;
  const axisValues = [realMax, (realMax + realMin) / 2, realMin];
  const latestPoint = points[points.length - 1];
  const latestLabelX = Math.max(chartLeft + 38, Math.min(chartRight - 46, latestPoint.x));
  const latestLabelY = Math.max(chartTop + 18, latestPoint.y - 14);
  const firstDate = normalized[0].date.split('-').reverse().slice(0, 2).join('/');
  const lastDate = latest.date.split('-').reverse().slice(0, 2).join('/');

  return (
    <View style={[styles.weightChart, { borderColor: colors.border, backgroundColor: isDark ? 'rgba(255,255,255,0.035)' : 'rgba(255,255,255,0.58)' }]}>
      <View style={styles.weightChartTopline}>
        <View style={[styles.weightChartPill, { backgroundColor: isDark ? colors.surfaceElevated : 'rgba(255,255,255,0.78)', borderColor: colors.border }]}><Text style={[styles.weightChartPillText, { color: colors.textMuted }]}>{normalized.length} registros</Text></View>
        <View style={[styles.weightChartPill, { backgroundColor: isDark ? 'rgba(168,146,255,0.16)' : 'rgba(102,81,201,0.10)', borderColor: isDark ? 'rgba(168,146,255,0.22)' : 'rgba(102,81,201,0.15)' }]}><Text style={[styles.weightChartPillText, { color: colors.text }]}>{formatWeightDelta(latest.value - normalized[0].value)}</Text></View>
      </View>
      <Svg accessible accessibilityLabel="Evolução do peso do bebê" width="100%" height={190} viewBox={`0 0 ${chartWidth} ${chartHeight}`}>
        <Defs>
          <SvgLinearGradient id="weightPremiumFillMobile" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={curveColor} stopOpacity={0.2} />
            <Stop offset="1" stopColor={curveColor} stopOpacity={0.025} />
          </SvgLinearGradient>
        </Defs>
        {axisValues.map((value, index) => {
          const y = chartBottom - ((value - paddedMin) / spread) * (chartBottom - chartTop);
          return <Line key={`${value}-${index}`} x1={chartLeft} y1={y} x2={chartRight} y2={y} stroke={gridColor} strokeOpacity={0.2} strokeWidth={1} strokeDasharray="4 6" />;
        })}
        {axisValues.map((value, index) => {
          const y = chartBottom - ((value - paddedMin) / spread) * (chartBottom - chartTop);
          return <SvgText key={`label-${value}-${index}`} x={chartLeft - 8} y={y + 4} textAnchor="end" fill={gridColor} opacity={0.68} fontSize={8.2} fontWeight="900">{formatKg(value)}</SvgText>;
        })}
        <Path d={areaPath} fill="url(#weightPremiumFillMobile)" />
        <Path d={path} fill="none" stroke={curveColor} strokeWidth={4.5} strokeLinecap="round" strokeLinejoin="round" />
        {points.map((point, index) => {
          const isLatest = index === points.length - 1;
          return <Circle key={point.item.id} cx={point.x} cy={point.y} r={isLatest ? 6.2 : 4.2} fill={isLatest ? curveColor : '#FFFFFF'} stroke={isLatest ? '#FFFFFF' : curveColor} strokeWidth={3} />;
        })}
        <Rect x={latestLabelX - 42} y={latestLabelY - 18} width={84} height={26} rx={13} fill={isDark ? '#281B49' : '#FFFFFF'} stroke={curveColor} strokeOpacity={0.25} />
        <SvgText x={latestLabelX} y={latestLabelY - 1} textAnchor="middle" fill={isDark ? '#F8F4FF' : '#3A2C67'} fontSize={9.5} fontWeight="900">{formatKg(latest.value)}</SvgText>
        <SvgText x={chartLeft} y={chartHeight - 18} fill={gridColor} opacity={0.68} fontSize={9} fontWeight="900">{firstDate}</SvgText>
        <SvgText x={chartRight} y={chartHeight - 18} textAnchor="end" fill={gridColor} opacity={0.68} fontSize={9} fontWeight="900">{lastDate}</SvgText>
      </Svg>
    </View>
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
  heroDesktop: { minHeight: 244, borderRadius: 32, paddingHorizontal: 34, gap: 30 },
  heroCopy: { flex: 1, gap: spacing.sm },
  kicker: { fontSize: 11, lineHeight: 14, fontWeight: '900', letterSpacing: 1.05, textTransform: 'uppercase' },
  heroTitle: { fontSize: 39, lineHeight: 40, fontWeight: '900', letterSpacing: -2 },
  heroTitleDesktop: { fontSize: 52, lineHeight: 56, letterSpacing: -2.6 },
  heroText: { fontSize: 14, lineHeight: 20 },
  heroTextDesktop: { maxWidth: 760, fontSize: 17, lineHeight: 25 },
  heroBadge: { width: 86, minHeight: 86, borderRadius: 25, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center', gap: 2 },
  reportButton: { minHeight: 92, borderRadius: radius.lg, borderWidth: StyleSheet.hairlineWidth, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }, reportDisabled: { opacity: 0.56 }, reportIcon: { width: 50, height: 50, borderRadius: 17, backgroundColor: 'rgba(255,255,255,0.14)', alignItems: 'center', justifyContent: 'center' }, reportCopy: { flex: 1 }, reportKicker: { color: 'rgba(255,255,255,0.72)', fontSize: 8.5, fontWeight: '900', letterSpacing: 1 }, reportTitle: { color: '#FFF', marginTop: 3, fontSize: 15, fontWeight: '900' }, reportHint: { color: 'rgba(255,255,255,0.76)', marginTop: 3, fontSize: 10.5, lineHeight: 15 }, pressed: { opacity: 0.72, transform: [{ scale: 0.985 }] },
  reportButtonDesktop: { minHeight: 126, borderRadius: 28, paddingHorizontal: 24, gap: 18 },
  reportIconDesktop: { width: 68, height: 68, borderRadius: 22 },
  reportTitleDesktop: { marginTop: 5, fontSize: 22 },
  reportHintDesktop: { marginTop: 5, fontSize: 14, lineHeight: 20 },
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
  weightChart: { marginTop: spacing.lg, minHeight: 248, borderRadius: 24, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 13, paddingTop: 16, paddingBottom: 12, overflow: 'hidden' },
  weightChartEmpty: { alignItems: 'center', justifyContent: 'center', gap: 6, paddingHorizontal: 24 },
  weightIcon: { width: 48, height: 48, borderRadius: 17, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  weightValue: { fontSize: 21, fontWeight: '900' },
  weightEmptyHint: { maxWidth: 290, fontSize: 12.5, lineHeight: 18, textAlign: 'center' },
  weightEyebrow: { fontSize: 11, fontWeight: '900', letterSpacing: 1, textTransform: 'uppercase' },
  weightSingleValue: { fontSize: 30, lineHeight: 36, fontWeight: '900', letterSpacing: -1 },
  weightSingleDate: { fontSize: 12, fontWeight: '800' },
  weightChartTopline: { minHeight: 30, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 2 },
  weightChartPill: { minHeight: 30, maxWidth: '62%', borderRadius: radius.pill, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 11, alignItems: 'center', justifyContent: 'center' },
  weightChartPillText: { fontSize: 10.5, fontWeight: '900' },
  weightHistory: { marginTop: spacing.md },
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
