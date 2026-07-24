import Ionicons from '@expo/vector-icons/Ionicons';
import * as FileSystem from 'expo-file-system/legacy';
import { LinearGradient } from 'expo-linear-gradient';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useMemo, useState } from 'react';
import { Alert, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DateField } from '@/components/date-field';
import { NinouBackground } from '@/components/ninou-background';
import { canExportFamilyReports, familyRoleLabel } from '@/domain/family-access';
import { formatDuration, formatRoutineActorLabel, formatTime, getTodaySummary, recordConfig, type DayState, type RoutineEvent } from '@/domain/routine';
import { getLocalDateId } from '@/services/firebase';
import { buildExcelCsv, buildProfessionalPdfHtml, buildWhatsappSummary, type ReportExportModel } from '@/services/report-document';
import { useNinouAuth } from '@/state/auth-context';
import { useBabyProfile } from '@/state/profile-context';
import { useFamilyPreferences } from '@/state/preferences-context';
import { useRoutine } from '@/state/routine-context';
import { useNinouLayout } from '@/theme/layout';
import { useNinouTheme } from '@/theme/tokens';

type Period = 'day' | '3d' | '7d' | '30d' | 'custom';

const DAY_MS = 86400000;

function dateAt(dateId: string, endOfDay = false) {
  return new Date(`${dateId}T${endOfDay ? '23:59:59.999' : '00:00:00.000'}`).getTime();
}

function shiftDateId(dateId: string, days: number) {
  const date = new Date(`${dateId}T12:00:00`);
  date.setDate(date.getDate() + days);
  return getLocalDateId(date.getTime());
}

function dateFromId(dateId: string) {
  return new Date(`${dateId}T12:00:00`);
}

function formatDateId(dateId: string, options?: Intl.DateTimeFormatOptions) {
  return dateFromId(dateId).toLocaleDateString('pt-BR', options);
}

function safeFilePart(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '').toLowerCase();
}

function eventDetail(event: RoutineEvent) {
  const volume = Number.isFinite(event.amountMl) ? `${event.amountMl} ml` : '';
  return [event.detail, volume].filter(Boolean).join(' · ') || 'Sem detalhe';
}

function downloadWebFile(content: string, mimeType: string, fileName: string) {
  if (Platform.OS !== 'web' || typeof document === 'undefined' || typeof URL === 'undefined') return false;
  const uri = URL.createObjectURL(new Blob([content], { type: `${mimeType};charset=utf-8` }));
  const link = document.createElement('a');
  link.href = uri;
  link.download = fileName;
  link.rel = 'noopener';
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(uri), 1000);
  return true;
}

export default function ReportsScreen() {
  const { colors, isDark } = useNinouTheme();
  const { isDesktop } = useNinouLayout();
  const { access } = useNinouAuth();
  const { state, history } = useRoutine();
  const { profile } = useBabyProfile();
  const { preferences, updatePreferences } = useFamilyPreferences();
  const todayId = getLocalDateId();
  const [period, setPeriod] = useState<Period>('7d');
  const [startDate, setStartDate] = useState(shiftDateId(todayId, -6));
  const [endDate, setEndDate] = useState(todayId);
  const [message, setMessage] = useState('Olá! Compartilho abaixo o resumo da rotina preparado no Ninou.');
  const [busy, setBusy] = useState('');
  const canExport = Boolean(access && canExportFamilyReports(access.role));

  const report = useMemo(() => {
    const periodDays = period === 'day' ? 1 : period === '3d' ? 3 : period === '7d' ? 7 : period === '30d' ? 30 : 0;
    let startId = period === 'custom' ? startDate : shiftDateId(todayId, -(periodDays - 1));
    let endId = period === 'custom' ? endDate : todayId;
    if (startId > endId) [startId, endId] = [endId, startId];

    const start = dateAt(startId);
    const end = dateAt(endId, true);
    const days = Math.max(1, Math.round((dateAt(endId) - dateAt(startId)) / DAY_MS) + 1);
    const allStates: [string, DayState][] = Object.entries({ ...history, [todayId]: state });
    const events = allStates
      .flatMap(([, day]) => day.events)
      .filter((event) => event.start >= start && event.start <= end)
      .sort((left, right) => left.start - right.start);
    const notes = allStates
      .filter(([id]) => id >= startId && id <= endId)
      .flatMap(([id, day]) => [
        day.dayNotes ? `${formatDateId(id)}: ${day.dayNotes}` : '',
        ...day.noteEpisodes.map((note) => `${formatDateId(id)} às ${formatTime(note.time)}: ${note.text}`),
      ])
      .filter(Boolean);
    const aggregateState: DayState = { ...state, mode: 'idle', activeStartedAt: null, events };
    const summary = getTodaySummary(aggregateState, end);
    const periodLabel = startId === endId
      ? formatDateId(startId, { day: '2-digit', month: 'long', year: 'numeric' })
      : `${formatDateId(startId)} a ${formatDateId(endId)}`;
    return { startId, endId, start, end, events, notes, summary, days, periodLabel };
  }, [endDate, history, period, startDate, state, todayId]);

  const exportModel = useMemo<ReportExportModel>(() => ({
    babyName: profile.name || 'Bebê',
    periodLabel: report.periodLabel,
    generatedAtLabel: new Date().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }),
    days: report.days,
    sleep: formatDuration(report.summary.sleepMs),
    feedings: report.summary.feeding,
    diapers: report.summary.diapers,
    medicines: report.summary.medicine,
    records: report.events.length,
    notes: report.notes,
    events: report.events.map((event) => ({
      date: new Date(event.start).toLocaleDateString('pt-BR'),
      startTime: formatTime(event.start),
      endTime: event.end > event.start ? formatTime(event.end) : '',
      care: recordConfig[event.type].title,
      detail: eventDetail(event),
      notes: event.notes || '',
      duration: event.end > event.start ? formatDuration(event.end - event.start) : '',
      durationMinutes: event.end > event.start ? Math.max(1, Math.round((event.end - event.start) / 60000)) : '',
      actor: formatRoutineActorLabel(event),
    })),
  }), [profile.name, report]);

  const filename = `ninou-${safeFilePart(profile.name || 'bebe')}-${report.startId}-${report.endId}`;

  async function shareFile(uri: string, mimeType: string, dialogTitle: string, UTI?: string) {
    if (!(await Sharing.isAvailableAsync())) throw new Error('O compartilhamento não está disponível neste aparelho.');
    await Sharing.shareAsync(uri, { mimeType, dialogTitle, UTI });
  }

  async function generatePdf() {
    if (!canExport) return;
    setBusy('pdf');
    try {
      const html = buildProfessionalPdfHtml(exportModel);
      if (Platform.OS === 'web') {
        await Print.printAsync({ html });
      } else {
        const result = await Print.printToFileAsync({ html });
        const destination = `${FileSystem.cacheDirectory}${filename}.pdf`;
        await FileSystem.deleteAsync(destination, { idempotent: true });
        await FileSystem.copyAsync({ from: result.uri, to: destination });
        await shareFile(destination, 'application/pdf', 'PDF profissional do Ninou', 'com.adobe.pdf');
      }
    } catch (error) {
      Alert.alert('Não foi possível gerar o PDF', String((error as Error).message || error));
    } finally {
      setBusy('');
    }
  }

  async function exportCsv() {
    if (!canExport) return;
    setBusy('csv');
    try {
      const content = buildExcelCsv(exportModel);
      if (downloadWebFile(content, 'text/csv', `${filename}.csv`)) return;
      const uri = `${FileSystem.cacheDirectory}${filename}.csv`;
      await FileSystem.writeAsStringAsync(uri, content, { encoding: FileSystem.EncodingType.UTF8 });
      await shareFile(uri, 'text/csv', 'Planilha da rotina Ninou', 'public.comma-separated-values-text');
    } catch (error) {
      Alert.alert('Não foi possível preparar a planilha', String((error as Error).message || error));
    } finally {
      setBusy('');
    }
  }

  async function shareWhatsapp() {
    if (!canExport) return;
    setBusy('whatsapp');
    try {
      const number = preferences.reportWhatsapp.replace(/\D/g, '');
      const summary = buildWhatsappSummary(exportModel, message);
      await Linking.openURL(`https://wa.me/${number}?text=${encodeURIComponent(summary)}`);
    } catch {
      Alert.alert('WhatsApp indisponível', 'Não foi possível abrir o WhatsApp neste aparelho.');
    } finally {
      setBusy('');
    }
  }

  if (!canExport) return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['bottom']}>
      <NinouBackground />
      <View style={styles.restrictedWrap}>
        <View style={[styles.restrictedCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.restrictedIcon, { backgroundColor: colors.primarySoft }]}><Ionicons name="lock-closed-outline" size={30} color={colors.primary} /></View>
          <Text style={[styles.kicker, { color: colors.primary }]}>ACESSO RESTRITO</Text>
          <Text style={[styles.restrictedTitle, { color: colors.text }]}>Relatórios protegidos</Text>
          <Text style={[styles.restrictedText, { color: colors.textMuted }]}>PDF profissional, resumo pelo WhatsApp e CSV para Excel estão disponíveis para responsáveis e cuidadores. Seu acesso atual é {familyRoleLabel(access?.role).toLowerCase()}.</Text>
        </View>
      </View>
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['bottom']}>
      <NinouBackground intense />
      <ScrollView contentContainerStyle={[styles.content, isDesktop && styles.contentDesktop]} showsVerticalScrollIndicator={false}>
        <View style={[styles.hero, isDesktop && styles.heroDesktop]}>
          <LinearGradient colors={isDark ? ['#21143E', '#6246C6', '#2D806D'] : ['#3A2768', '#7558E8', '#35A98C']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
          <View style={styles.heroOrbLarge} />
          <View style={styles.heroOrbSmall} />
          <View style={styles.heroTop}>
            <View style={styles.heroIcon}><Ionicons name="document-text-outline" size={28} color="#FFFFFF" /></View>
            <View style={styles.heroBadge}><Ionicons name="sparkles" size={13} color="#DDFBF2" /><Text style={styles.heroBadgeText}>ACABAMENTO NINOU</Text></View>
          </View>
          <Text style={styles.heroKicker}>RELATÓRIO DE ROTINA</Text>
          <Text style={[styles.heroTitle, isDesktop && styles.heroTitleDesktop]}>Informações claras, em um documento feito para cuidar.</Text>
          <Text style={styles.heroSubtitle}>Escolha o período uma vez e use o mesmo resumo no PDF profissional, WhatsApp ou Excel.</Text>
          <View style={styles.heroFormats}>
            <FormatPill icon="document-text" label="PDF principal" />
            <FormatPill icon="logo-whatsapp" label="Resumo" />
            <FormatPill icon="grid" label="Excel" />
          </View>
        </View>

        <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <SectionHeading number="01" title="Escolha o período" subtitle="As datas personalizadas aparecem somente quando você precisar." />
          <View style={styles.periodRow}>
            {([
              ['day', 'Hoje'],
              ['3d', '3 dias'],
              ['7d', '7 dias'],
              ['30d', '30 dias'],
              ['custom', 'Personalizado'],
            ] as [Period, string][]).map(([value, label]) => {
              const selected = period === value;
              return (
                <Pressable
                  key={value}
                  onPress={() => setPeriod(value)}
                  style={({ pressed }) => [
                    styles.period,
                    { backgroundColor: selected ? colors.primary : colors.surfaceElevated, borderColor: selected ? colors.primary : colors.border },
                    pressed && styles.pressed,
                  ]}>
                  {selected ? <Ionicons name="checkmark-circle" size={15} color="#FFFFFF" /> : null}
                  <Text style={[styles.periodText, { color: selected ? '#FFFFFF' : colors.text }]}>{label}</Text>
                </Pressable>
              );
            })}
          </View>
          {period === 'custom' ? (
            <View style={[styles.customDates, isDesktop && styles.customDatesDesktop]}>
              <View style={styles.customDateField}><DateField label="Data inicial" value={startDate} onChange={setStartDate} maximumDate={dateFromId(endDate)} /></View>
              <View style={styles.customDateField}><DateField label="Data final" value={endDate} onChange={setEndDate} minimumDate={dateFromId(startDate)} maximumDate={dateFromId(todayId)} /></View>
            </View>
          ) : null}
          <View style={[styles.periodSummary, { backgroundColor: colors.primarySoft }]}>
            <View style={[styles.periodSummaryIcon, { backgroundColor: colors.primary }]}><Ionicons name="calendar-clear-outline" size={18} color="#FFFFFF" /></View>
            <View style={styles.periodSummaryCopy}>
              <Text style={[styles.periodSummaryLabel, { color: colors.primary }]}>PERÍODO SELECIONADO</Text>
              <Text style={[styles.periodSummaryValue, { color: colors.text }]}>{report.periodLabel}</Text>
            </View>
            <View style={[styles.dayCount, { backgroundColor: colors.surface }]}><Text style={[styles.dayCountValue, { color: colors.primary }]}>{report.days}</Text><Text style={[styles.dayCountLabel, { color: colors.textMuted }]}>{report.days === 1 ? 'dia' : 'dias'}</Text></View>
          </View>
        </View>

        <View style={[styles.preview, isDesktop && styles.previewDesktop, { backgroundColor: isDark ? '#211638' : '#FFFDFC', borderColor: colors.border }]}>
          <View style={styles.previewHead}>
            <View style={styles.previewHeadCopy}>
              <Text style={[styles.previewKicker, { color: colors.primary }]}>PRÉVIA DO CONTEÚDO</Text>
              <Text style={[styles.previewTitle, { color: colors.text }]}>Rotina de {profile.name || 'seu bebê'}</Text>
              <Text style={[styles.previewSubtitle, { color: colors.textMuted }]}>Os três formatos usam exatamente estes dados.</Text>
            </View>
            <View style={[styles.previewSeal, { backgroundColor: colors.primarySoft, borderColor: `${colors.primary}38` }]}><Ionicons name="shield-checkmark" size={22} color={colors.primary} /><Text style={[styles.previewSealText, { color: colors.primary }]}>DADOS REAIS</Text></View>
          </View>
          <View style={[styles.kpiGrid, isDesktop && styles.kpiGridDesktop]}>
            <Kpi icon="moon" label="Sono" value={formatDuration(report.summary.sleepMs)} color="#7558E8" soft={isDark ? '#38275F' : '#EEE7FF'} />
            <Kpi icon="nutrition" label="Alimentações" value={String(report.summary.feeding)} color="#35A98C" soft={isDark ? '#163E38' : '#E1F5EF'} />
            <Kpi icon="water" label="Fraldas" value={String(report.summary.diapers)} color="#D68657" soft={isDark ? '#4A2B28' : '#FCE9DE'} />
            <Kpi icon="medical" label="Medicamentos" value={String(report.summary.medicine)} color="#BC5D7B" soft={isDark ? '#452437' : '#F8E4EB'} />
          </View>
          <View style={[styles.previewFooter, { borderTopColor: colors.border }]}>
            <PreviewMetric label="Registros" value={String(report.events.length)} />
            <PreviewMetric label="Observações" value={String(report.notes.length)} />
            <PreviewMetric label="Período" value={`${report.days} ${report.days === 1 ? 'dia' : 'dias'}`} />
          </View>
        </View>

        <View style={styles.exportHeading}>
          <Text style={[styles.kicker, { color: colors.primary }]}>FORMATOS DE SAÍDA</Text>
          <Text style={[styles.exportTitle, { color: colors.text }]}>Escolha como deseja compartilhar</Text>
        </View>

        <View style={styles.pdfCard}>
          <LinearGradient colors={isDark ? ['#2A1A4D', '#6044C5'] : ['#4A317E', '#7558E8']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
          <View style={styles.pdfGlow} />
          <View style={styles.pdfTop}>
            <View style={styles.pdfIcon}><Ionicons name="document-text" size={31} color="#FFFFFF" /></View>
            <View style={styles.principalBadge}><Ionicons name="diamond" size={12} color="#533BA8" /><Text style={styles.principalBadgeText}>PRINCIPAL</Text></View>
          </View>
          <Text style={styles.pdfKicker}>DOCUMENTO COMPLETO</Text>
          <Text style={styles.pdfTitle}>PDF profissional Ninou</Text>
          <Text style={styles.pdfDescription}>Cabeçalho premium, indicadores, linha do tempo, autoria dos registros, observações e aviso de uso responsável.</Text>
          <View style={styles.pdfFeatureRow}>
            <PdfFeature icon="color-palette-outline" label="Identidade visual" />
            <PdfFeature icon="people-outline" label="Autoria" />
            <PdfFeature icon="print-outline" label="Pronto para imprimir" />
          </View>
          <Pressable disabled={Boolean(busy)} onPress={() => void generatePdf()} style={({ pressed }) => [styles.pdfButton, Boolean(busy) && styles.disabled, pressed && !busy && styles.pressed]}>
            <Ionicons name={busy === 'pdf' ? 'hourglass-outline' : 'sparkles'} size={19} color="#5D43BF" />
            <Text style={styles.pdfButtonText}>{busy === 'pdf' ? 'Preparando documento…' : 'Gerar PDF profissional'}</Text>
            {busy !== 'pdf' ? <Ionicons name="arrow-forward" size={18} color="#5D43BF" /> : null}
          </Pressable>
        </View>

        <View style={[styles.secondaryExports, isDesktop && styles.secondaryExportsDesktop]}>
          <View style={[styles.exportCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.exportCardHead}>
              <View style={[styles.exportIcon, { backgroundColor: isDark ? '#173F36' : '#E1F5EF' }]}><Ionicons name="logo-whatsapp" size={23} color="#25A96B" /></View>
              <View style={styles.exportCardHeadCopy}><Text style={[styles.exportCardKicker, { color: '#26906B' }]}>RESUMO RÁPIDO</Text><Text style={[styles.exportCardTitle, { color: colors.text }]}>WhatsApp</Text></View>
            </View>
            <Text style={[styles.exportCardText, { color: colors.textMuted }]}>Envia os principais números do período em uma mensagem limpa e fácil de ler.</Text>
            <Field label="Número com DDD (opcional)" helper="Deixe vazio para escolher o contato no WhatsApp." value={preferences.reportWhatsapp} onChangeText={(value) => updatePreferences({ reportWhatsapp: value })} keyboardType="phone-pad" />
            <Field label="Mensagem de abertura" value={message} onChangeText={setMessage} multiline />
            <Pressable disabled={Boolean(busy)} onPress={() => void shareWhatsapp()} style={({ pressed }) => [styles.whatsappButton, Boolean(busy) && styles.disabled, pressed && !busy && styles.pressed]}>
              <Ionicons name="logo-whatsapp" size={19} color="#FFFFFF" />
              <Text style={styles.whatsappButtonText}>{busy === 'whatsapp' ? 'Abrindo WhatsApp…' : 'Compartilhar resumo'}</Text>
            </Pressable>
          </View>

          <View style={[styles.exportCard, styles.csvCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.exportCardHead}>
              <View style={[styles.exportIcon, { backgroundColor: isDark ? '#21364A' : '#E5F1FA' }]}><Ionicons name="grid" size={23} color="#2877A8" /></View>
              <View style={styles.exportCardHeadCopy}><Text style={[styles.exportCardKicker, { color: '#2877A8' }]}>PLANILHA</Text><Text style={[styles.exportCardTitle, { color: colors.text }]}>CSV para Excel</Text></View>
            </View>
            <Text style={[styles.exportCardText, { color: colors.textMuted }]}>Arquivo em português, com acentos preservados e colunas organizadas para abrir diretamente no Excel.</Text>
            <View style={[styles.csvColumns, { backgroundColor: colors.surfaceElevated }]}>
              {['Data e horários', 'Tipo de cuidado', 'Detalhes e observações', 'Duração', 'Quem registrou'].map((label) => <View key={label} style={styles.csvColumn}><Ionicons name="checkmark-circle" size={15} color={colors.accent} /><Text style={[styles.csvColumnText, { color: colors.text }]}>{label}</Text></View>)}
            </View>
            <Pressable disabled={Boolean(busy)} onPress={() => void exportCsv()} style={({ pressed }) => [styles.csvButton, { borderColor: colors.primary }, Boolean(busy) && styles.disabled, pressed && !busy && styles.pressed]}>
              <Ionicons name={busy === 'csv' ? 'hourglass-outline' : 'download-outline'} size={19} color={colors.primary} />
              <Text style={[styles.csvButtonText, { color: colors.primary }]}>{busy === 'csv' ? 'Preparando planilha…' : 'Baixar CSV para Excel'}</Text>
            </Pressable>
          </View>
        </View>

        <View style={[styles.disclaimer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.disclaimerIcon, { backgroundColor: colors.primarySoft }]}><Ionicons name="information-circle-outline" size={20} color={colors.primary} /></View>
          <Text style={[styles.disclaimerText, { color: colors.textMuted }]}>Os relatórios organizam os dados informados pela família. Eles não oferecem diagnóstico e não substituem avaliação profissional.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );

  function FormatPill({ icon, label }: { icon: keyof typeof Ionicons.glyphMap; label: string }) {
    return <View style={styles.formatPill}><Ionicons name={icon} size={14} color="#FFFFFF" /><Text style={styles.formatPillText}>{label}</Text></View>;
  }

  function SectionHeading({ number, title, subtitle }: { number: string; title: string; subtitle: string }) {
    return <View style={styles.sectionHeading}><View style={[styles.sectionNumber, { backgroundColor: colors.primarySoft }]}><Text style={[styles.sectionNumberText, { color: colors.primary }]}>{number}</Text></View><View style={styles.sectionHeadingCopy}><Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text><Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>{subtitle}</Text></View></View>;
  }

  function Kpi({ icon, label, value, color, soft }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string; color: string; soft: string }) {
    return <View style={[styles.kpi, { backgroundColor: soft }]}><View style={[styles.kpiIcon, { backgroundColor: `${color}1F` }]}><Ionicons name={icon} size={17} color={color} /></View><Text style={[styles.kpiLabel, { color }]}>{label}</Text><Text style={[styles.kpiValue, { color: colors.text }]} numberOfLines={1} adjustsFontSizeToFit>{value}</Text></View>;
  }

  function PreviewMetric({ label, value }: { label: string; value: string }) {
    return <View style={styles.previewMetric}><Text style={[styles.previewMetricLabel, { color: colors.textMuted }]}>{label}</Text><Text style={[styles.previewMetricValue, { color: colors.text }]}>{value}</Text></View>;
  }

  function PdfFeature({ icon, label }: { icon: keyof typeof Ionicons.glyphMap; label: string }) {
    return <View style={styles.pdfFeature}><Ionicons name={icon} size={14} color="#DDFBF2" /><Text style={styles.pdfFeatureText}>{label}</Text></View>;
  }

  function Field({ label, helper, value, onChangeText, multiline = false, keyboardType = 'default' }: { label: string; helper?: string; value: string; onChangeText: (value: string) => void; multiline?: boolean; keyboardType?: 'default' | 'phone-pad' }) {
    return <View style={styles.field}><Text style={[styles.fieldLabel, { color: colors.text }]}>{label}</Text>{helper ? <Text style={[styles.fieldHelper, { color: colors.textMuted }]}>{helper}</Text> : null}<TextInput multiline={multiline} keyboardType={keyboardType} value={value} onChangeText={onChangeText} placeholderTextColor={colors.textMuted} style={[styles.input, multiline && styles.multiline, { color: colors.text, backgroundColor: colors.surfaceElevated, borderColor: colors.border }]} /></View>;
  }
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { width: '100%', maxWidth: 760, alignSelf: 'center', padding: 16, paddingBottom: 56, gap: 16 },
  contentDesktop: { maxWidth: 1120, paddingHorizontal: 28, paddingBottom: 72, gap: 22 },
  hero: { position: 'relative', minHeight: 340, overflow: 'hidden', borderRadius: 32, padding: 24 },
  heroDesktop: { minHeight: 390, padding: 38 },
  heroOrbLarge: { position: 'absolute', width: 260, height: 260, borderRadius: 999, borderWidth: 45, borderColor: 'rgba(255,255,255,0.08)', right: -100, top: -105 },
  heroOrbSmall: { position: 'absolute', width: 170, height: 170, borderRadius: 999, backgroundColor: 'rgba(191,246,230,0.12)', right: 45, bottom: -110 },
  heroTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heroIcon: { width: 54, height: 54, borderRadius: 19, borderWidth: 1, borderColor: 'rgba(255,255,255,0.28)', backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  heroBadge: { minHeight: 34, borderRadius: 999, paddingHorizontal: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.22)', backgroundColor: 'rgba(23,16,46,0.18)', flexDirection: 'row', alignItems: 'center', gap: 6 },
  heroBadgeText: { color: '#F0FFFA', fontSize: 9, fontWeight: '900', letterSpacing: 1.1 },
  heroKicker: { marginTop: 30, color: '#C7F7E9', fontSize: 10.5, fontWeight: '900', letterSpacing: 1.7 },
  heroTitle: { marginTop: 8, maxWidth: 590, color: '#FFFFFF', fontSize: 30, lineHeight: 35, fontWeight: '900', letterSpacing: -1 },
  heroTitleDesktop: { maxWidth: 770, fontSize: 45, lineHeight: 50, letterSpacing: -1.6 },
  heroSubtitle: { marginTop: 11, maxWidth: 690, color: 'rgba(255,255,255,0.78)', fontSize: 13.5, lineHeight: 20 },
  heroFormats: { marginTop: 22, flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  formatPill: { minHeight: 34, borderRadius: 999, paddingHorizontal: 11, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', backgroundColor: 'rgba(255,255,255,0.12)', flexDirection: 'row', alignItems: 'center', gap: 6 },
  formatPillText: { color: '#FFFFFF', fontSize: 9.5, fontWeight: '800' },
  sectionCard: { borderRadius: 28, borderWidth: StyleSheet.hairlineWidth, padding: 18 },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  sectionNumber: { width: 43, height: 43, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  sectionNumberText: { fontSize: 12, fontWeight: '900', letterSpacing: 0.7 },
  sectionHeadingCopy: { flex: 1 },
  sectionTitle: { fontSize: 19, lineHeight: 23, fontWeight: '900' },
  sectionSubtitle: { marginTop: 3, fontSize: 11.5, lineHeight: 17 },
  periodRow: { marginTop: 18, flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  period: { minHeight: 43, borderRadius: 15, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  periodText: { fontSize: 11, fontWeight: '900' },
  customDates: { marginTop: 17, gap: 12 },
  customDatesDesktop: { flexDirection: 'row' },
  customDateField: { flex: 1 },
  periodSummary: { marginTop: 17, minHeight: 74, borderRadius: 21, padding: 11, flexDirection: 'row', alignItems: 'center', gap: 11 },
  periodSummaryIcon: { width: 44, height: 44, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  periodSummaryCopy: { flex: 1, minWidth: 0 },
  periodSummaryLabel: { fontSize: 8.5, fontWeight: '900', letterSpacing: 1 },
  periodSummaryValue: { marginTop: 4, fontSize: 13, lineHeight: 17, fontWeight: '900', textTransform: 'capitalize' },
  dayCount: { minWidth: 54, height: 50, paddingHorizontal: 9, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  dayCountValue: { fontSize: 18, lineHeight: 19, fontWeight: '900' },
  dayCountLabel: { marginTop: 2, fontSize: 8, fontWeight: '800' },
  preview: { borderRadius: 30, borderWidth: StyleSheet.hairlineWidth, padding: 19 },
  previewDesktop: { padding: 27 },
  previewHead: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14 },
  previewHeadCopy: { flex: 1 },
  previewKicker: { fontSize: 9, fontWeight: '900', letterSpacing: 1.1 },
  previewTitle: { marginTop: 5, fontSize: 23, lineHeight: 27, fontWeight: '900' },
  previewSubtitle: { marginTop: 4, fontSize: 11, lineHeight: 16 },
  previewSeal: { width: 72, height: 72, borderRadius: 23, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center' },
  previewSealText: { marginTop: 5, fontSize: 7, fontWeight: '900', letterSpacing: 0.7 },
  kpiGrid: { marginTop: 19, flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  kpiGridDesktop: { flexWrap: 'nowrap' },
  kpi: { width: '47%', flexGrow: 1, minHeight: 106, borderRadius: 20, padding: 12 },
  kpiIcon: { width: 32, height: 32, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  kpiLabel: { marginTop: 9, fontSize: 9, fontWeight: '800' },
  kpiValue: { marginTop: 4, fontSize: 20, fontWeight: '900', letterSpacing: -0.4 },
  previewFooter: { marginTop: 16, paddingTop: 14, borderTopWidth: StyleSheet.hairlineWidth, flexDirection: 'row' },
  previewMetric: { flex: 1, minWidth: 0, paddingHorizontal: 8, borderRightWidth: StyleSheet.hairlineWidth, borderRightColor: 'rgba(128,110,145,0.18)' },
  previewMetricLabel: { fontSize: 8.5, fontWeight: '800' },
  previewMetricValue: { marginTop: 4, fontSize: 13, fontWeight: '900' },
  exportHeading: { paddingHorizontal: 5, paddingTop: 5 },
  kicker: { fontSize: 10, fontWeight: '900', letterSpacing: 1.3 },
  exportTitle: { marginTop: 6, fontSize: 24, lineHeight: 29, fontWeight: '900', letterSpacing: -0.5 },
  pdfCard: { position: 'relative', minHeight: 430, overflow: 'hidden', borderRadius: 31, padding: 23 },
  pdfGlow: { position: 'absolute', width: 250, height: 250, borderRadius: 999, right: -100, top: -95, borderWidth: 42, borderColor: 'rgba(255,255,255,0.08)' },
  pdfTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pdfIcon: { width: 57, height: 57, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.26)', backgroundColor: 'rgba(255,255,255,0.14)', alignItems: 'center', justifyContent: 'center' },
  principalBadge: { minHeight: 33, borderRadius: 999, paddingHorizontal: 11, backgroundColor: '#E7DFFF', flexDirection: 'row', alignItems: 'center', gap: 5 },
  principalBadgeText: { color: '#533BA8', fontSize: 8.5, fontWeight: '900', letterSpacing: 0.8 },
  pdfKicker: { marginTop: 25, color: '#C9F8EB', fontSize: 9.5, fontWeight: '900', letterSpacing: 1.4 },
  pdfTitle: { marginTop: 5, color: '#FFFFFF', fontSize: 28, lineHeight: 33, fontWeight: '900', letterSpacing: -0.7 },
  pdfDescription: { marginTop: 9, maxWidth: 680, color: 'rgba(255,255,255,0.76)', fontSize: 12.5, lineHeight: 19 },
  pdfFeatureRow: { marginTop: 18, flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  pdfFeature: { minHeight: 32, borderRadius: 999, paddingHorizontal: 10, backgroundColor: 'rgba(255,255,255,0.1)', flexDirection: 'row', alignItems: 'center', gap: 5 },
  pdfFeatureText: { color: '#F4F0FF', fontSize: 8.5, fontWeight: '800' },
  pdfButton: { minHeight: 57, marginTop: 24, borderRadius: 19, paddingHorizontal: 16, backgroundColor: '#FFFFFF', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 },
  pdfButtonText: { flex: 1, color: '#5D43BF', fontSize: 13, fontWeight: '900', textAlign: 'center' },
  secondaryExports: { gap: 14 },
  secondaryExportsDesktop: { flexDirection: 'row', alignItems: 'stretch' },
  exportCard: { flex: 1, borderRadius: 28, borderWidth: StyleSheet.hairlineWidth, padding: 18 },
  csvCard: { minHeight: 390 },
  exportCardHead: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  exportIcon: { width: 48, height: 48, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  exportCardHeadCopy: { flex: 1 },
  exportCardKicker: { fontSize: 8.5, fontWeight: '900', letterSpacing: 1 },
  exportCardTitle: { marginTop: 3, fontSize: 20, fontWeight: '900' },
  exportCardText: { marginTop: 12, fontSize: 11.5, lineHeight: 17.5 },
  field: { marginTop: 14 },
  fieldLabel: { fontSize: 10.5, fontWeight: '900' },
  fieldHelper: { marginTop: 3, fontSize: 9.5, lineHeight: 14 },
  input: { minHeight: 50, marginTop: 7, borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 12, fontSize: 12 },
  multiline: { minHeight: 82, paddingTop: 12, textAlignVertical: 'top' },
  whatsappButton: { minHeight: 54, marginTop: 15, borderRadius: 18, backgroundColor: '#25A96B', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  whatsappButtonText: { color: '#FFFFFF', fontSize: 12.5, fontWeight: '900' },
  csvColumns: { marginTop: 16, padding: 12, borderRadius: 17, gap: 9 },
  csvColumn: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  csvColumnText: { flex: 1, fontSize: 10.5, fontWeight: '700' },
  csvButton: { minHeight: 54, marginTop: 17, borderRadius: 18, borderWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  csvButtonText: { fontSize: 12.5, fontWeight: '900' },
  disclaimer: { borderRadius: 20, borderWidth: StyleSheet.hairlineWidth, padding: 13, flexDirection: 'row', alignItems: 'center', gap: 10 },
  disclaimerIcon: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  disclaimerText: { flex: 1, fontSize: 9.5, lineHeight: 15 },
  restrictedWrap: { flex: 1, padding: 18, alignItems: 'center', justifyContent: 'center' },
  restrictedCard: { width: '100%', maxWidth: 440, minHeight: 330, borderRadius: 30, borderWidth: StyleSheet.hairlineWidth, padding: 28, alignItems: 'center', justifyContent: 'center' },
  restrictedIcon: { width: 68, height: 68, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  restrictedTitle: { marginTop: 9, fontSize: 27, lineHeight: 31, fontWeight: '900', textAlign: 'center' },
  restrictedText: { marginTop: 12, maxWidth: 340, fontSize: 13.5, lineHeight: 21, textAlign: 'center' },
  pressed: { opacity: 0.82, transform: [{ scale: 0.992 }] },
  disabled: { opacity: 0.5 },
});
