import Ionicons from '@expo/vector-icons/Ionicons';
import * as FileSystem from 'expo-file-system/legacy';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useState } from 'react';
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { NinouBackground } from '@/components/ninou-background';
import { canExportFamilyReports, familyRoleLabel } from '@/domain/family-access';
import { formatDuration, formatTime, getTodaySummary, recordConfig, type DayState } from '@/domain/routine';
import { getLocalDateId } from '@/services/firebase';
import { useNinouAuth } from '@/state/auth-context';
import { useBabyProfile } from '@/state/profile-context';
import { useFamilyPreferences } from '@/state/preferences-context';
import { useRoutine } from '@/state/routine-context';
import { useNinouTheme } from '@/theme/tokens';

type Period = 'day' | '3d' | '7d' | '30d' | 'custom';

function escapeHtml(value: string) { return value.replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[character] || character); }

export default function ReportsScreen() {
  const { colors, isDark } = useNinouTheme();
  const { access } = useNinouAuth();
  const { state, history } = useRoutine();
  const { profile } = useBabyProfile();
  const { preferences, updatePreferences } = useFamilyPreferences();
  const [period, setPeriod] = useState<Period>('7d');
  const [startDate, setStartDate] = useState(getLocalDateId(Date.now() - 6 * 86400000));
  const [endDate, setEndDate] = useState(getLocalDateId());
  const [message, setMessage] = useState('Olá! Segue o resumo da rotina do bebê preparado no Ninou.');
  const [busy, setBusy] = useState('');
  const canExport = Boolean(access && canExportFamilyReports(access.role));
  const report = buildReport();

  function buildReport() {
    const end = period === 'custom' ? new Date(`${endDate}T23:59:59`).getTime() : Date.now();
    const days = period === 'day' ? 1 : period === '3d' ? 3 : period === '7d' ? 7 : period === '30d' ? 30 : Math.max(1, Math.ceil((end - new Date(`${startDate}T00:00:00`).getTime()) / 86400000));
    const start = period === 'custom' ? new Date(`${startDate}T00:00:00`).getTime() : end - (days - 1) * 86400000;
    const allStates: [string, DayState][] = Object.entries({ ...history, [getLocalDateId()]: state });
    const events = allStates.flatMap(([, day]) => day.events).filter((event) => event.start >= start && event.start <= end).sort((a, b) => a.start - b.start);
    const notes = allStates.filter(([id]) => { const time = new Date(`${id}T12:00:00`).getTime(); return time >= start && time <= end; }).flatMap(([id, day]) => [day.dayNotes ? `${id}: ${day.dayNotes}` : '', ...day.noteEpisodes.map((note) => `${id} ${formatTime(note.time)}: ${note.text}`)]).filter(Boolean);
    const aggregateState: DayState = { ...state, mode: 'idle', activeStartedAt: null, events };
    const summary = getTodaySummary(aggregateState, end);
    return { start, end, events, notes, summary, days };
  }

  const filename = `ninou-relatorio-${getLocalDateId()}`;
  const summaryText = `${profile.name || 'Bebê'} · ${report.days} dia(s)\nSono: ${formatDuration(report.summary.sleepMs)}\nAlimentações: ${report.summary.feeding}\nFraldas: ${report.summary.diapers}\nMedicamentos: ${report.summary.medicine}\nRegistros: ${report.events.length}`;

  async function shareFile(uri: string, mimeType: string, dialogTitle: string) {
    if (!(await Sharing.isAvailableAsync())) throw new Error('O compartilhamento não está disponível neste aparelho.');
    await Sharing.shareAsync(uri, { mimeType, dialogTitle });
  }

  async function generatePdf() {
    if (!canExport) return;
    setBusy('pdf');
    try {
      const rows = report.events.map((event) => `<tr><td>${new Date(event.start).toLocaleDateString('pt-BR')}</td><td>${formatTime(event.start)}</td><td>${escapeHtml(recordConfig[event.type].title)}</td><td>${escapeHtml(event.detail || '—')}</td><td>${event.end > event.start ? formatDuration(event.end - event.start) : '—'}</td></tr>`).join('');
      const html = `<!doctype html><html><head><meta charset="utf-8"><style>@page{margin:28px}body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#302142;background:#fff}header{padding:28px;border-radius:24px;background:linear-gradient(135deg,#17102e,#6548c9);color:#fff}h1{font-size:32px;margin:8px 0}.brand{letter-spacing:4px;font-size:11px;font-weight:800}.meta{color:#ded5f3}.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin:22px 0}.kpi{padding:15px;border-radius:16px;background:#f4effb}.kpi b{display:block;font-size:20px;margin-top:5px}table{width:100%;border-collapse:collapse;font-size:11px}th{text-align:left;color:#7558e8;padding:9px;border-bottom:2px solid #e8e0f0}td{padding:9px;border-bottom:1px solid #eee8f3}.note{margin-top:18px;padding:16px;border-radius:16px;background:#eef8f5;white-space:pre-wrap}footer{margin-top:24px;color:#82768d;font-size:9px}</style></head><body><header><div class="brand">NINOU · RELATÓRIO DE ROTINA</div><h1>${escapeHtml(profile.name || 'Diário do bebê')}</h1><div class="meta">${new Date(report.start).toLocaleDateString('pt-BR')} — ${new Date(report.end).toLocaleDateString('pt-BR')} · preparado para a família</div></header><section class="grid"><div class="kpi">Sono<b>${formatDuration(report.summary.sleepMs)}</b></div><div class="kpi">Alimentações<b>${report.summary.feeding}</b></div><div class="kpi">Fraldas<b>${report.summary.diapers}</b></div><div class="kpi">Medicamentos<b>${report.summary.medicine}</b></div></section><h2>Linha do tempo</h2><table><thead><tr><th>Data</th><th>Hora</th><th>Cuidado</th><th>Detalhe</th><th>Duração</th></tr></thead><tbody>${rows || '<tr><td colspan="5">Sem registros no período.</td></tr>'}</tbody></table>${report.notes.length ? `<div class="note"><strong>Observações da família</strong><br><br>${escapeHtml(report.notes.join('\n'))}</div>` : ''}<footer>Documento informativo. O Ninou não realiza diagnóstico e não substitui orientação pediátrica.</footer></body></html>`;
      const result = await Print.printToFileAsync({ html });
      await shareFile(result.uri, 'application/pdf', 'Relatório premium do Ninou');
    } catch (error) { Alert.alert('Não foi possível gerar o PDF', String((error as Error).message || error)); } finally { setBusy(''); }
  }

  async function exportData(format: 'csv' | 'json') {
    if (!canExport) return;
    setBusy(format);
    try {
      const content = format === 'json' ? JSON.stringify({ generatedAt: new Date().toISOString(), baby: profile, report }, null, 2) : ['data,hora,tipo,detalhe,observacoes,duracao_minutos', ...report.events.map((event) => [new Date(event.start).toLocaleDateString('pt-BR'), formatTime(event.start), recordConfig[event.type].title, event.detail, event.notes, Math.round((event.end - event.start) / 60000)].map((value) => `"${String(value).replaceAll('"', '""')}"`).join(','))].join('\n');
      const uri = `${FileSystem.cacheDirectory}${filename}.${format}`;
      await FileSystem.writeAsStringAsync(uri, content, { encoding: FileSystem.EncodingType.UTF8 });
      await shareFile(uri, format === 'json' ? 'application/json' : 'text/csv', `Relatório Ninou em ${format.toUpperCase()}`);
    } catch (error) { Alert.alert('Exportação indisponível', String((error as Error).message || error)); } finally { setBusy(''); }
  }

  async function shareWhatsapp() {
    if (!canExport) return;
    setBusy('whatsapp');
    try { await Linking.openURL(`https://wa.me/${preferences.reportWhatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(`${message}\n\n${summaryText}`)}`); } catch { Alert.alert('WhatsApp indisponível', 'Não foi possível abrir o WhatsApp neste aparelho.'); } finally { setBusy(''); }
  }

  if (!canExport) return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['bottom']}>
      <NinouBackground />
      <View style={styles.restrictedWrap}>
        <View style={[styles.restrictedCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.restrictedIcon, { backgroundColor: colors.primarySoft }]}><Ionicons name="lock-closed-outline" size={30} color={colors.primary} /></View>
          <Text style={[styles.kicker, { color: colors.primary }]}>ACESSO RESTRITO</Text>
          <Text style={[styles.restrictedTitle, { color: colors.text }]}>Exportações não disponíveis</Text>
          <Text style={[styles.restrictedText, { color: colors.textMuted }]}>PDF, WhatsApp, CSV e JSON ficam disponíveis somente para responsáveis, administradores e cuidadores. Seu acesso atual é {familyRoleLabel(access?.role).toLowerCase()}.</Text>
        </View>
      </View>
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['bottom']}><NinouBackground /><ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.heading}><Text style={[styles.kicker, { color: colors.primary }]}>RELATÓRIO DE ROTINA</Text><Text style={[styles.title, { color: colors.text }]}>Compartilhe a rotina com clareza</Text><Text style={[styles.subtitle, { color: colors.textMuted }]}>PDF profissional, WhatsApp e dados portáteis com os registros reais da família.</Text></View>
      <View style={styles.periodRow}>{([['day', 'Hoje'], ['3d', '3 dias'], ['7d', '7 dias'], ['30d', '30 dias'], ['custom', 'Personalizado']] as [Period, string][]).map(([value, label]) => <Pressable key={value} onPress={() => setPeriod(value)} style={[styles.period, { backgroundColor: period === value ? colors.primary : colors.surface, borderColor: period === value ? colors.primary : colors.border }]}><Text style={[styles.periodText, { color: period === value ? '#FFF' : colors.text }]}>{label}</Text></Pressable>)}</View>
      {period === 'custom' ? <View style={styles.customRow}><Field label="Início" value={startDate} onChangeText={setStartDate} /><Field label="Fim" value={endDate} onChangeText={setEndDate} /></View> : null}
      <View style={[styles.preview, { backgroundColor: isDark ? '#211638' : '#FFFFFF', borderColor: colors.border }]}><View style={styles.previewHead}><View><Text style={[styles.previewKicker, { color: colors.primary }]}>PRÉVIA DO DOCUMENTO</Text><Text style={[styles.previewTitle, { color: colors.text }]}>{profile.name || 'Diário do bebê'}</Text></View><View style={[styles.daysBadge, { backgroundColor: colors.primarySoft }]}><Text style={[styles.daysValue, { color: colors.primary }]}>{report.days}</Text><Text style={[styles.daysLabel, { color: colors.primary }]}>dias</Text></View></View><View style={styles.kpiGrid}><Kpi label="Sono" value={formatDuration(report.summary.sleepMs)} /><Kpi label="Alimentações" value={String(report.summary.feeding)} /><Kpi label="Fraldas" value={String(report.summary.diapers)} /><Kpi label="Registros" value={String(report.events.length)} /></View><Text style={[styles.previewHint, { color: colors.textMuted }]}>{report.notes.length} observação(ões) da família incluída(s).</Text></View>
      <View style={[styles.shareCard, { backgroundColor: colors.surface, borderColor: colors.border }]}><Text style={[styles.sectionTitle, { color: colors.text }]}>Enviar pelo WhatsApp</Text><Field label="Número (opcional)" value={preferences.reportWhatsapp} onChangeText={(value) => updatePreferences({ reportWhatsapp: value })} /><Field label="Mensagem personalizada" value={message} onChangeText={setMessage} multiline /><Pressable disabled={Boolean(busy)} onPress={() => void shareWhatsapp()} style={[styles.whatsapp, Boolean(busy) && styles.disabled]}><Ionicons name="logo-whatsapp" size={20} color="#FFF" /><Text style={styles.actionText}>{busy === 'whatsapp' ? 'Abrindo…' : 'Enviar resumo no WhatsApp'}</Text></Pressable></View>
      <View style={styles.actions}><Action icon="document-text-outline" label="Gerar PDF profissional" kind="primary" busy={busy === 'pdf'} onPress={() => void generatePdf()} /><Action icon="grid-outline" label="Exportar CSV" busy={busy === 'csv'} onPress={() => void exportData('csv')} /><Action icon="code-slash-outline" label="Exportar JSON" busy={busy === 'json'} onPress={() => void exportData('json')} /></View>
      <Text style={[styles.disclaimer, { color: colors.textMuted }]}>O relatório organiza os dados informados pela família. Ele não oferece diagnóstico e não substitui avaliação profissional.</Text>
    </ScrollView></SafeAreaView>
  );

  function Field({ label, value, onChangeText, multiline = false }: { label: string; value: string; onChangeText: (value: string) => void; multiline?: boolean }) { return <View style={styles.field}><Text style={[styles.fieldLabel, { color: colors.textMuted }]}>{label}</Text><TextInput multiline={multiline} value={value} onChangeText={onChangeText} placeholderTextColor={colors.textMuted} style={[styles.input, multiline && styles.multiline, { color: colors.text, backgroundColor: colors.surfaceElevated, borderColor: colors.border }]} /></View>; }
  function Kpi({ label, value }: { label: string; value: string }) { return <View style={[styles.kpi, { backgroundColor: colors.surfaceElevated }]}><Text style={[styles.kpiLabel, { color: colors.textMuted }]}>{label}</Text><Text style={[styles.kpiValue, { color: colors.text }]}>{value}</Text></View>; }
  function Action({ icon, label, kind, busy: working, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; kind?: 'primary'; busy: boolean; onPress: () => void }) { return <Pressable disabled={Boolean(busy)} onPress={onPress} style={[styles.action, { backgroundColor: kind === 'primary' ? colors.primary : colors.surface, borderColor: kind === 'primary' ? colors.primary : colors.border }, Boolean(busy) && styles.disabled]}><Ionicons name={icon} size={22} color={kind === 'primary' ? '#FFF' : colors.primary} /><Text style={[styles.actionText, { color: kind === 'primary' ? '#FFF' : colors.text }]}>{working ? 'Preparando…' : label}</Text></Pressable>; }
}

const styles = StyleSheet.create({ safe: { flex: 1 }, content: { width: '100%', maxWidth: 620, alignSelf: 'center', padding: 16, paddingBottom: 45, gap: 14 }, restrictedWrap: { flex: 1, padding: 18, alignItems: 'center', justifyContent: 'center' }, restrictedCard: { width: '100%', maxWidth: 440, minHeight: 330, borderRadius: 30, borderWidth: StyleSheet.hairlineWidth, padding: 28, alignItems: 'center', justifyContent: 'center' }, restrictedIcon: { width: 68, height: 68, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 20 }, restrictedTitle: { marginTop: 9, fontSize: 27, lineHeight: 31, fontWeight: '900', textAlign: 'center' }, restrictedText: { marginTop: 12, maxWidth: 340, fontSize: 13.5, lineHeight: 21, textAlign: 'center' }, heading: { paddingVertical: 10 }, kicker: { fontSize: 10.5, fontWeight: '900', letterSpacing: 1.3 }, title: { marginTop: 8, fontSize: 31, lineHeight: 35, fontWeight: '900', letterSpacing: -1 }, subtitle: { marginTop: 8, fontSize: 14, lineHeight: 21 }, periodRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 }, period: { minHeight: 39, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center' }, periodText: { fontSize: 11, fontWeight: '900' }, customRow: { flexDirection: 'row', gap: 10 }, preview: { borderRadius: 28, borderWidth: StyleSheet.hairlineWidth, padding: 18 }, previewHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, previewKicker: { fontSize: 9, fontWeight: '900', letterSpacing: 1 }, previewTitle: { marginTop: 4, fontSize: 23, fontWeight: '900' }, daysBadge: { width: 64, height: 64, borderRadius: 21, alignItems: 'center', justifyContent: 'center' }, daysValue: { fontSize: 22, fontWeight: '900' }, daysLabel: { fontSize: 9, fontWeight: '900' }, kpiGrid: { marginTop: 18, flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, kpi: { width: '47%', flexGrow: 1, minHeight: 72, borderRadius: 17, padding: 11 }, kpiLabel: { fontSize: 9.5, fontWeight: '800' }, kpiValue: { marginTop: 5, fontSize: 18, fontWeight: '900' }, previewHint: { marginTop: 12, fontSize: 11 }, shareCard: { borderRadius: 25, borderWidth: StyleSheet.hairlineWidth, padding: 16, gap: 12 }, sectionTitle: { fontSize: 17, fontWeight: '900' }, field: { flex: 1, gap: 6 }, fieldLabel: { fontSize: 10.5, fontWeight: '900' }, input: { minHeight: 48, borderRadius: 15, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 12, fontSize: 12.5 }, multiline: { minHeight: 82, paddingTop: 12, textAlignVertical: 'top' }, whatsapp: { minHeight: 52, borderRadius: 17, backgroundColor: '#25A96B', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }, actions: { gap: 9 }, action: { minHeight: 55, borderRadius: 18, borderWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 }, actionText: { color: '#FFF', fontSize: 13, fontWeight: '900' }, disclaimer: { paddingHorizontal: 10, fontSize: 10.5, lineHeight: 16, textAlign: 'center' }, disabled: { opacity: 0.5 } });
