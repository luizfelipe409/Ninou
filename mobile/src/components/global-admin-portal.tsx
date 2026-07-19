import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { NinouBackground } from '@/components/ninou-background';
import {
  ADMIN_APP_VERSION,
  adminCreateFamily,
  adminCreateInvite,
  adminLogIntegrityCheck,
  adminLogJustification,
  adminTransferOwnership,
  adminUpdateFamilyStatus,
  adminUpdateInvite,
  adminUpdateMember,
  adminUpdateSubscription,
  adminUpdateTicket,
  adminUpdateUserStatus,
  loadAdminWorkspace,
  normalizeAdminRole,
  type AdminFamily,
  type AdminFamilyStatus,
  type AdminKnownUser,
  type AdminMember,
  type AdminPlan,
  type AdminSupportTicket,
  type AdminTicketStatus,
  type AdminWorkspace,
} from '@/services/admin';
import { getFirebaseErrorMessage } from '@/services/firebase';
import { useNinouAuth } from '@/state/auth-context';
import { useNinouTheme } from '@/theme/tokens';

type Section = 'overview' | 'families' | 'users' | 'support' | 'audit';
type Confirmation = { title: string; message: string; familyId?: string; destructive?: boolean; reasonRequired?: boolean; run: (reason: string) => Promise<void> };

const SECTION_ITEMS: { id: Section; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { id: 'overview', label: 'Visão geral', icon: 'grid-outline' },
  { id: 'families', label: 'Famílias', icon: 'home-outline' },
  { id: 'users', label: 'Usuários', icon: 'people-outline' },
  { id: 'support', label: 'Suporte', icon: 'headset-outline' },
  { id: 'audit', label: 'Auditoria', icon: 'shield-checkmark-outline' },
];

const PLAN_LABEL: Record<string, string> = { trial: 'Teste', premium: 'Premium', courtesy: 'Cortesia', suspended: 'Suspenso' };
const ROLE_LABEL: Record<string, string> = { owner: 'Responsável principal', responsavel: 'Responsável principal', admin_familiar: 'Administrador familiar', cuidador: 'Cuidador', caregiver: 'Cuidador', visualizacao: 'Somente leitura' };
const STATUS_LABEL: Record<string, string> = { active: 'Ativa', suspended: 'Suspensa', archived: 'Arquivada', blocked: 'Bloqueado', pending: 'Pendente', expired: 'Expirado', cancelled: 'Cancelado', open: 'Aberto', in_progress: 'Em atendimento', resolved: 'Resolvido', rejected: 'Recusado' };

function formatDate(value: number, withTime = false) {
  if (!value) return 'Sem registro';
  return new Intl.DateTimeFormat('pt-BR', withTime ? { dateStyle: 'short', timeStyle: 'short' } : { dateStyle: 'short' }).format(new Date(value));
}

function initials(value: string) {
  return value.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'N';
}

const EVENT_LABEL: Record<string, string> = { sono: 'Sono', dormir: 'Sono', soneca: 'Soneca', amamentacao: 'Amamentação', mamadeira: 'Mamadeira', fralda: 'Fralda', banho: 'Banho', remedio: 'Medicamento', medicamento: 'Medicamento', observacao: 'Observação' };
function eventTime(value: number) { return value ? new Date(value).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : 'Sem horário'; }
function eventText(event: AdminFamily['routineDays'][number]['events'][number]) { return `${eventTime(event.start)}${event.end && event.end > event.start ? `–${eventTime(event.end)}` : ''}`; }

export function GlobalAdminPortal() {
  const { colors, isDark } = useNinouTheme();
  const { user, signOut } = useNinouAuth();
  const [workspace, setWorkspace] = useState<AdminWorkspace | null>(null);
  const [section, setSection] = useState<Section>('overview');
  const [query, setQuery] = useState('');
  const [familyFilter, setFamilyFilter] = useState<'all' | 'active' | 'attention'>('all');
  const [selectedFamilyId, setSelectedFamilyId] = useState('');
  const [ticket, setTicket] = useState<AdminSupportTicket | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const [confirmReason, setConfirmReason] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [sessionEndsAt, setSessionEndsAt] = useState(Date.now() + 30 * 60 * 1000);

  const refresh = useCallback(async (quiet = false) => {
    if (!user) return;
    if (!quiet) setLoading(true);
    setError('');
    try {
      setWorkspace(await loadAdminWorkspace(user));
    } catch (loadError) {
      setError(getFirebaseErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { void refresh(); }, [refresh]);
  useEffect(() => {
    const timer = setTimeout(() => void signOut(), Math.max(0, sessionEndsAt - Date.now()));
    return () => clearTimeout(timer);
  }, [sessionEndsAt, signOut]);

  const selectedFamily = workspace?.families.find((family) => family.id === selectedFamilyId) || null;
  const families = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return (workspace?.families || []).filter((family) => {
      const matchesQuery = !needle || `${family.name} ${family.babyName} ${family.ownerEmail} ${family.id}`.toLowerCase().includes(needle);
      const matchesFilter = familyFilter === 'all' || (familyFilter === 'active' ? family.status === 'active' : family.status !== 'active' || family.integrityIssues.length > 0 || family.supportCount > 0);
      return matchesQuery && matchesFilter;
    });
  }, [familyFilter, query, workspace]);

  const runAction = useCallback(async (action: () => Promise<void>, success: string) => {
    setBusy(true);
    setError('');
    try {
      await action();
      setNotice(success);
      setSessionEndsAt(Date.now() + 30 * 60 * 1000);
      await refresh(true);
    } catch (actionError) {
      setError(getFirebaseErrorMessage(actionError));
    } finally {
      setBusy(false);
    }
  }, [refresh]);

  const ask = (next: Confirmation) => { setConfirmReason(next.reasonRequired ? 'Ajuste administrativo solicitado' : ''); setConfirmation(next); };
  const confirm = async () => {
    if (!confirmation || (confirmation.reasonRequired && confirmReason.trim().length < 5)) return;
    const action = confirmation;
    setConfirmation(null);
    const reason = confirmReason.trim();
    await runAction(async () => {
      await action.run(reason);
      if (reason) await adminLogJustification(user!, action.title, reason, action.familyId);
    }, `${action.title} concluído.`);
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <NinouBackground intense />
      <ScrollView
        refreshControl={<RefreshControl refreshing={loading && Boolean(workspace)} onRefresh={() => void refresh()} tintColor={colors.primary} />}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.brand}>
            <LinearGradient colors={isDark ? ['#A98DFF', '#64E1BF'] : ['#7558E8', '#51C5A8']} style={styles.brandIcon}><Ionicons name="shield-checkmark" size={22} color="#FFFFFF" /></LinearGradient>
            <View><Text style={[styles.brandName, { color: colors.text }]}>Ninou Admin</Text><Text style={[styles.brandCaption, { color: colors.textMuted }]}>OPERAÇÃO PREMIUM</Text></View>
          </View>
          <View style={styles.headerActions}>
            <Pressable accessibilityLabel="Atualizar painel" onPress={() => void refresh()} style={[styles.iconButton, { backgroundColor: colors.surface, borderColor: colors.border }]}>{loading ? <ActivityIndicator size="small" color={colors.primary} /> : <Ionicons name="refresh" size={20} color={colors.primary} />}</Pressable>
            <Pressable accessibilityLabel="Sair" onPress={() => void signOut()} style={[styles.iconButton, { backgroundColor: colors.surface, borderColor: colors.border }]}><Ionicons name="log-out-outline" size={20} color={colors.text} /></Pressable>
          </View>
        </View>

        <LinearGradient colors={isDark ? ['#392462', '#1B1435'] : ['#7659E8', '#4F82DB']} style={styles.hero}>
          <View style={styles.heroTop}><View style={styles.adminBadge}><View style={styles.adminDot} /><Text style={styles.adminBadgeText}>ADMIN GLOBAL</Text></View><Text style={styles.version}>{ADMIN_APP_VERSION}</Text></View>
          <Text style={styles.heroTitle}>Centro de operação</Text>
          <Text style={styles.heroText}>Gerencie clientes, acessos, planos e suporte sem criar uma família pessoal para o administrador.</Text>
          <View style={styles.sessionRow}><Ionicons name="time-outline" size={15} color="rgba(255,255,255,0.8)" /><Text style={styles.sessionText}>Sessão protegida até {new Date(sessionEndsAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</Text></View>
        </LinearGradient>

        {error ? <Feedback tone="error" text={error} onClose={() => setError('')} /> : null}
        {notice ? <Feedback tone="success" text={notice} onClose={() => setNotice('')} /> : null}
        {loading && !workspace ? <View style={[styles.loadingCard, { backgroundColor: colors.surface, borderColor: colors.border }]}><ActivityIndicator color={colors.primary} /><Text style={[styles.muted, { color: colors.textMuted }]}>Montando o centro administrativo…</Text></View> : null}

        {workspace ? <>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
            {SECTION_ITEMS.map((item) => <Pressable key={item.id} onPress={() => setSection(item.id)} style={[styles.tab, { borderColor: section === item.id ? colors.primary : colors.border, backgroundColor: section === item.id ? colors.primarySoft : colors.surface }]}><Ionicons name={item.icon} size={16} color={section === item.id ? colors.primary : colors.textMuted} /><Text style={[styles.tabText, { color: section === item.id ? colors.primary : colors.textMuted }]}>{item.label}</Text>{item.id === 'support' && workspace.metrics.openTickets ? <View style={[styles.countBubble, { backgroundColor: colors.danger }]}><Text style={styles.countBubbleText}>{workspace.metrics.openTickets}</Text></View> : null}</Pressable>)}
          </ScrollView>

          {section === 'overview' ? <Overview workspace={workspace} openFamilies={() => setSection('families')} openSupport={() => setSection('support')} openFamily={setSelectedFamilyId} /> : null}
          {section === 'families' ? <FamiliesSection families={families} query={query} setQuery={setQuery} filter={familyFilter} setFilter={setFamilyFilter} create={() => setCreateOpen(true)} open={setSelectedFamilyId} /> : null}
          {section === 'users' ? <UsersSection users={workspace.users} query={query} setQuery={setQuery} ask={ask} user={user!} /> : null}
          {section === 'support' ? <SupportSection tickets={workspace.tickets} open={setTicket} /> : null}
          {section === 'audit' ? <AuditSection workspace={workspace} /> : null}
        </> : null}
      </ScrollView>

      <CreateFamilyModal visible={createOpen} close={() => setCreateOpen(false)} submit={(values) => runAction(async () => { const result = await adminCreateFamily(user!, values); setCreateOpen(false); setSelectedFamilyId(result.familyId); }, 'Família criada e convite preparado.')} busy={busy} />
      <FamilyModal key={selectedFamily?.id || 'no-family'} family={selectedFamily} close={() => setSelectedFamilyId('')} user={user!} runAction={runAction} ask={ask} busy={busy} notice={notice} error={error} />
      <TicketModal key={ticket ? `${ticket.familyId}-${ticket.id}` : 'no-ticket'} ticket={ticket} close={() => setTicket(null)} submit={(status, note) => runAction(async () => { await adminUpdateTicket(user!, ticket!, status, note); setTicket(null); }, 'Atendimento atualizado.')} busy={busy} />
      <ConfirmModal value={confirmation} reason={confirmReason} setReason={setConfirmReason} close={() => setConfirmation(null)} confirm={() => void confirm()} busy={busy} />
      {busy ? <View pointerEvents="none" style={styles.busyOverlay}><ActivityIndicator size="large" color="#FFFFFF" /></View> : null}
    </SafeAreaView>
  );

  function Feedback({ tone, text, onClose }: { tone: 'error' | 'success'; text: string; onClose: () => void }) {
    const color = tone === 'error' ? colors.danger : colors.accent;
    return <View style={[styles.feedback, { backgroundColor: `${color}12`, borderColor: `${color}55` }]}><Ionicons name={tone === 'error' ? 'alert-circle' : 'checkmark-circle'} size={20} color={color} /><Text style={[styles.feedbackText, { color }]}>{text}</Text><Pressable onPress={onClose}><Ionicons name="close" size={18} color={color} /></Pressable></View>;
  }
}

function Overview({ workspace, openFamilies, openSupport, openFamily }: { workspace: AdminWorkspace; openFamilies: () => void; openSupport: () => void; openFamily: (id: string) => void }) {
  const { colors } = useNinouTheme();
  const metrics = [
    ['Famílias ativas', workspace.metrics.activeFamilies, 'home-outline', colors.primary],
    ['Usuários ativos', workspace.metrics.activeUsers, 'people-outline', colors.accent],
    ['Convites pendentes', workspace.metrics.pendingInvites, 'mail-unread-outline', colors.warning],
    ['Tickets abertos', workspace.metrics.openTickets, 'headset-outline', colors.danger],
  ] as const;
  const alerts = [
    workspace.metrics.trialsEndingSoon ? `${workspace.metrics.trialsEndingSoon} teste(s) terminam nos próximos 7 dias` : '',
    workspace.metrics.orphanUsers ? `${workspace.metrics.orphanUsers} conta(s) sem família ou convite` : '',
    workspace.metrics.syncWarnings ? `${workspace.metrics.syncWarnings} família(s) sem sincronização recente` : '',
  ].filter(Boolean);
  return <View>
    <SectionTitle kicker="HOJE" title="Visão executiva" subtitle="A saúde da operação em um só lugar." />
    <View style={styles.metricGrid}>{metrics.map(([label, value, icon, color]) => <View key={label} style={[styles.metric, { backgroundColor: colors.surface, borderColor: colors.border }]}><View style={[styles.metricIcon, { backgroundColor: `${color}16` }]}><Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={18} color={color} /></View><Text style={[styles.metricValue, { color: colors.text }]}>{value}</Text><Text style={[styles.metricLabel, { color: colors.textMuted }]}>{label}</Text></View>)}</View>
    <View style={styles.quickRow}><Pressable onPress={openFamilies} style={[styles.quick, { backgroundColor: colors.primarySoft }]}><Ionicons name="add-circle" size={21} color={colors.primary} /><Text style={[styles.quickText, { color: colors.primary }]}>Nova família</Text></Pressable><Pressable onPress={openSupport} style={[styles.quick, { backgroundColor: `${colors.accent}14` }]}><Ionicons name="chatbubbles" size={21} color={colors.accent} /><Text style={[styles.quickText, { color: colors.accent }]}>Fila de suporte</Text></Pressable></View>
    <Panel title="Atenção necessária" icon="pulse-outline">
      {alerts.length ? alerts.map((alert) => <View key={alert} style={styles.alertRow}><View style={[styles.alertDot, { backgroundColor: colors.warning }]} /><Text style={[styles.rowBody, { color: colors.text }]}>{alert}</Text></View>) : <EmptyLine icon="checkmark-circle-outline" text="Nenhum alerta operacional importante." />}
    </Panel>
    <Panel title="Atividade recente" icon="time-outline">
      {workspace.families.slice(0, 5).map((family) => <Pressable key={family.id} onPress={() => openFamily(family.id)} style={[styles.listRow, { borderBottomColor: colors.border }]}><Avatar label={family.babyName || family.name} /><View style={styles.rowCopy}><Text numberOfLines={1} style={[styles.rowTitle, { color: colors.text }]}>{family.name}</Text><Text style={[styles.rowSubtitle, { color: colors.textMuted }]}>{family.babyName || 'Perfil incompleto'} · {formatDate(family.lastActivityAt, true)}</Text></View><Ionicons name="chevron-forward" size={18} color={colors.textMuted} /></Pressable>)}
    </Panel>
  </View>;
}

function FamiliesSection({ families, query, setQuery, filter, setFilter, create, open }: { families: AdminFamily[]; query: string; setQuery: (v: string) => void; filter: 'all' | 'active' | 'attention'; setFilter: (v: 'all' | 'active' | 'attention') => void; create: () => void; open: (id: string) => void }) {
  const { colors } = useNinouTheme();
  return <View><SectionTitle kicker="CLIENTES" title="Famílias" subtitle={`${families.length} resultado(s), sem contas técnicas.`} action="Criar" onAction={create} />
    <Search value={query} onChange={setQuery} placeholder="Nome, bebê, e-mail ou ID" />
    <View style={styles.filterRow}>{(['all', 'active', 'attention'] as const).map((item) => <Chip key={item} selected={filter === item} label={{ all: 'Todas', active: 'Ativas', attention: 'Atenção' }[item]} onPress={() => setFilter(item)} />)}</View>
    <View style={styles.cardList}>{families.map((family) => <Pressable key={family.id} onPress={() => open(family.id)} style={[styles.familyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}><Avatar label={family.babyName || family.name} large /><View style={styles.familyCopy}><View style={styles.titleLine}><Text numberOfLines={1} style={[styles.familyName, { color: colors.text }]}>{family.name}</Text><Status value={family.status} /></View><Text style={[styles.rowSubtitle, { color: colors.textMuted }]}>{family.babyName ? `Diário de ${family.babyName}` : 'Perfil do bebê incompleto'}</Text><View style={styles.metaRow}><MiniMeta icon="people-outline" text={`${family.members.length} membro(s)`} /><MiniMeta icon="card-outline" text={PLAN_LABEL[family.plan] || family.plan} /><MiniMeta icon="warning-outline" text={`${family.integrityIssues.length} alerta(s)`} /></View></View><Ionicons name="chevron-forward" size={19} color={colors.textMuted} /></Pressable>)}</View>
    {!families.length ? <EmptyCard icon="search-outline" title="Nenhuma família encontrada" text="Ajuste a busca ou os filtros. A família técnica do admin nunca aparece aqui." /> : null}
  </View>;
}

function UsersSection({ users, query, setQuery, ask, user }: { users: AdminKnownUser[]; query: string; setQuery: (v: string) => void; ask: (v: Confirmation) => void; user: NonNullable<ReturnType<typeof useNinouAuth>['user']> }) {
  const { colors } = useNinouTheme();
  const needle = query.trim().toLowerCase();
  const filtered = users.filter((item) => !needle || `${item.email} ${item.name} ${item.uid}`.toLowerCase().includes(needle));
  return <View><SectionTitle kicker="ACESSOS" title="Usuários" subtitle="Identidades, vínculos e bloqueios globais." /><Search value={query} onChange={setQuery} placeholder="Buscar usuário" />
    <View style={styles.cardList}>{filtered.map((known) => <View key={known.uid || known.email} style={[styles.userCard, { backgroundColor: colors.surface, borderColor: colors.border }]}><View style={styles.titleLine}><View style={[styles.userIcon, { backgroundColor: known.orphan ? `${colors.warning}18` : colors.primarySoft }]}><Ionicons name={known.orphan ? 'person-remove-outline' : 'person-outline'} size={20} color={known.orphan ? colors.warning : colors.primary} /></View><View style={styles.rowCopy}><Text numberOfLines={1} style={[styles.rowTitle, { color: colors.text }]}>{known.name || known.email || known.uid}</Text><Text numberOfLines={1} style={[styles.rowSubtitle, { color: colors.textMuted }]}>{known.email || known.uid}</Text></View><Status value={known.status} /></View><View style={styles.familyChips}>{known.families.length ? known.families.map((family) => <View key={family.id} style={[styles.familyChip, { backgroundColor: colors.surfaceElevated }]}><Text style={[styles.familyChipText, { color: colors.textMuted }]}>{family.name} · {ROLE_LABEL[family.role] || family.role}</Text></View>) : <Text style={[styles.orphanText, { color: colors.warning }]}>{known.hasPendingInvite ? 'Aguardando aceite de convite' : 'Conta órfã: sem família e sem convite'}</Text>}</View><Pressable onPress={() => ask({ title: known.status === 'blocked' ? 'Reativar usuário' : 'Bloquear usuário', message: `${known.status === 'blocked' ? 'Restaurar' : 'Suspender'} o acesso de ${known.email || known.uid} em todas as famílias?`, destructive: known.status !== 'blocked', reasonRequired: true, run: async () => adminUpdateUserStatus(user, known, known.status === 'blocked' ? 'active' : 'blocked') })} style={[styles.outlineAction, { borderColor: known.status === 'blocked' ? colors.accent : colors.danger }]}><Ionicons name={known.status === 'blocked' ? 'lock-open-outline' : 'lock-closed-outline'} size={15} color={known.status === 'blocked' ? colors.accent : colors.danger} /><Text style={[styles.outlineActionText, { color: known.status === 'blocked' ? colors.accent : colors.danger }]}>{known.status === 'blocked' ? 'Reativar conta' : 'Bloquear conta'}</Text></Pressable></View>)}</View>
  </View>;
}

function SupportSection({ tickets, open }: { tickets: AdminSupportTicket[]; open: (v: AdminSupportTicket) => void }) {
  const { colors } = useNinouTheme();
  return <View><SectionTitle kicker="ATENDIMENTO" title="Suporte e privacidade" subtitle="Solicitações com responsável, prazo e histórico." />
    <View style={styles.cardList}>{tickets.map((item) => <Pressable key={`${item.familyId}-${item.id}`} onPress={() => open(item)} style={[styles.ticketCard, { backgroundColor: colors.surface, borderColor: colors.border }]}><View style={styles.titleLine}><View style={[styles.ticketIcon, { backgroundColor: item.type === 'data_deletion_request' ? `${colors.danger}16` : colors.primarySoft }]}><Ionicons name={item.type === 'data_deletion_request' ? 'trash-outline' : 'chatbubble-ellipses-outline'} size={19} color={item.type === 'data_deletion_request' ? colors.danger : colors.primary} /></View><View style={styles.rowCopy}><Text style={[styles.rowTitle, { color: colors.text }]}>{item.category}</Text><Text style={[styles.rowSubtitle, { color: colors.textMuted }]}>{item.familyName} · {formatDate(item.createdAt, true)}</Text></View><Status value={item.status} /></View><Text numberOfLines={3} style={[styles.ticketMessage, { color: colors.textMuted }]}>{item.message}</Text></Pressable>)}</View>
    {!tickets.length ? <EmptyCard icon="checkmark-done-circle-outline" title="Fila em dia" text="Nenhuma solicitação de suporte ou privacidade registrada." /> : null}
  </View>;
}

function AuditSection({ workspace }: { workspace: AdminWorkspace }) {
  const { colors } = useNinouTheme();
  return <View><SectionTitle kicker="SEGURANÇA" title="Trilha de auditoria" subtitle="Registro das ações administrativas e familiares." />
    <Panel title={`${workspace.audits.length} evento(s) recentes`} icon="finger-print-outline">{workspace.audits.map((entry) => <View key={`${entry.familyId}-${entry.id}`} style={[styles.auditRow, { borderBottomColor: colors.border }]}><View style={[styles.auditLine, { backgroundColor: colors.primary }]} /><View style={styles.rowCopy}><Text style={[styles.rowTitle, { color: colors.text }]}>{entry.summary}</Text><Text style={[styles.rowSubtitle, { color: colors.textMuted }]}>{entry.actorEmail || 'Sistema'} · {formatDate(entry.createdAt, true)}</Text><Text numberOfLines={1} style={[styles.auditCode, { color: colors.textMuted }]}>{entry.action} · {entry.familyId || 'global'}</Text></View></View>)}</Panel>
  </View>;
}

function FamilyModal({ family, close, user, runAction, ask, busy, notice, error }: { family: AdminFamily | null; close: () => void; user: NonNullable<ReturnType<typeof useNinouAuth>['user']>; runAction: (action: () => Promise<void>, success: string) => Promise<void>; ask: (v: Confirmation) => void; busy: boolean; notice: string; error: string }) {
  const { colors } = useNinouTheme();
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('cuidador');
  const [plan, setPlan] = useState<AdminPlan>(family?.plan || 'premium');
  const [days, setDays] = useState('30');
  const [expandedDayId, setExpandedDayId] = useState('');
  const [subscriptionClock] = useState(() => Date.now());
  if (!family) return null;
  const exportFamily = async () => Share.share({ title: `Exportação ${family.name}`, message: JSON.stringify({ exportedAt: new Date().toISOString(), family }, null, 2) });
  const createInvite = async () => runAction(async () => { const invite = await adminCreateInvite(user, family, inviteEmail, inviteRole); setInviteEmail(''); await Share.share({ title: `Convite Ninou — ${family.name}`, message: `Você foi convidado para ${family.name} no Ninou. Código: ${invite.code}` }); }, 'Convite criado com validade de 7 dias.');
  const subscriptionUntil = family.plan === 'trial' ? family.trialEndsAt : family.premiumUntil;
  const subscriptionRemaining = subscriptionUntil ? Math.max(0, Math.ceil((subscriptionUntil - subscriptionClock) / 86400000)) : 0;
  return <Modal visible animationType="slide" onRequestClose={close}><SafeAreaView style={[styles.modalSafe, { backgroundColor: colors.background }]}><View style={[styles.modalHeader, { borderBottomColor: colors.border }]}><Pressable accessibilityRole="button" accessibilityLabel="Voltar para famílias" hitSlop={12} onPress={close} style={[styles.iconButton, { backgroundColor: colors.surface, borderColor: colors.border }]}><Ionicons name="close" size={22} color={colors.text} /></Pressable><View style={styles.modalHeaderCopy}><Text numberOfLines={1} style={[styles.modalTitle, { color: colors.text }]}>{family.name}</Text><Text style={[styles.rowSubtitle, { color: colors.textMuted }]}>{family.id}</Text></View><Status value={family.status} /></View>
    <ScrollView contentContainerStyle={styles.modalContent} keyboardShouldPersistTaps="handled">
      {error || notice ? <View style={[styles.feedback, { marginTop: 0, marginBottom: 11, backgroundColor: `${error ? colors.danger : colors.accent}12`, borderColor: `${error ? colors.danger : colors.accent}55` }]}><Ionicons name={error ? 'alert-circle' : 'checkmark-circle'} size={20} color={error ? colors.danger : colors.accent} /><Text style={[styles.feedbackText, { color: error ? colors.danger : colors.accent }]}>{error || notice}</Text></View> : null}
      <View style={[styles.supportBanner, { backgroundColor: colors.primarySoft }]}><Ionicons name="eye-outline" size={20} color={colors.primary} /><View style={styles.rowCopy}><Text style={[styles.rowTitle, { color: colors.primary }]}>Modo suporte — leitura por padrão</Text><Text style={[styles.rowSubtitle, { color: colors.textMuted }]}>Toda alteração exige confirmação, justificativa e gera auditoria.</Text></View></View>
      <View style={styles.summaryGrid}><Summary label="Bebê" value={family.babyName || 'Incompleto'} /><Summary label="Plano" value={PLAN_LABEL[family.plan] || family.plan} /><Summary label="Membros" value={String(family.members.length)} /><Summary label="Última atividade" value={formatDate(family.lastActivityAt)} /></View>

      <Panel title="Assinatura e acesso" icon="card-outline"><View style={[styles.subscriptionCurrent, { backgroundColor: colors.surfaceElevated }]}><Text style={[styles.kicker, { color: colors.primary }]}>ACESSO ATUAL</Text><Text style={[styles.subscriptionCurrentTitle, { color: colors.text }]}>{PLAN_LABEL[family.plan] || family.plan}</Text><Text style={[styles.rowSubtitle, { color: colors.textMuted }]}>{family.plan === 'suspended' ? 'Acesso suspenso' : subscriptionUntil ? `${subscriptionUntil <= subscriptionClock ? 'Expirou em' : 'Válido até'} ${formatDate(subscriptionUntil)} · ${subscriptionRemaining} dia(s)` : 'Sem validade definida'}</Text></View><View style={styles.filterRow}>{(['trial', 'premium', 'courtesy', 'suspended'] as AdminPlan[]).map((value) => <Chip key={value} selected={plan === value} label={PLAN_LABEL[value]} onPress={() => setPlan(value)} />)}</View><Field label="Nova validade (dias)" value={days} onChange={setDays} keyboardType="number-pad" /><PrimaryButton label="Salvar plano e validade" icon="sparkles-outline" disabled={busy} onPress={() => ask({ title: 'Atualizar assinatura', message: `Aplicar o plano ${PLAN_LABEL[plan]} por ${days || '30'} dias?`, familyId: family.id, reasonRequired: true, run: async () => adminUpdateSubscription(user, family, { plan, days: Number(days) || 30 }) })} /></Panel>

      <Panel title="Membros e permissões" icon="people-outline">{family.members.map((member) => <MemberRow key={member.uid} family={family} member={member} user={user} ask={ask} />)}{!family.members.length ? <EmptyLine icon="person-remove-outline" text="Nenhum membro cliente cadastrado." /> : null}</Panel>

      <Panel title="Convites" icon="mail-outline"><Field label="E-mail" value={inviteEmail} onChange={setInviteEmail} keyboardType="email-address" autoCapitalize="none" /><View style={styles.filterRow}>{['admin_familiar', 'cuidador', 'visualizacao'].map((value) => <Chip key={value} selected={inviteRole === value} label={ROLE_LABEL[value]} onPress={() => setInviteRole(value)} />)}</View><PrimaryButton label="Criar e compartilhar convite" icon="paper-plane-outline" disabled={busy || !inviteEmail.includes('@')} onPress={() => void createInvite()} />{family.invites.slice(0, 8).map((invite) => <View key={invite.code} style={[styles.inviteRow, { borderTopColor: colors.border }]}><View style={styles.rowCopy}><Text style={[styles.rowTitle, { color: colors.text }]}>{invite.email}</Text><Text style={[styles.rowSubtitle, { color: colors.textMuted }]}>{invite.code} · {invite.status === 'accepted' ? 'aceito' : `expira ${formatDate(invite.expiresAt)}`}</Text></View><Status value={invite.status} /><Pressable onPress={() => void Share.share({ message: `Convite Ninou para ${family.name}: ${invite.code}` })}><Ionicons name="share-outline" size={19} color={colors.primary} /></Pressable>{['pending', 'expired'].includes(invite.status) ? <Pressable onPress={() => ask({ title: invite.status === 'expired' ? 'Renovar convite' : 'Cancelar convite', message: `Alterar o convite enviado para ${invite.email}?`, familyId: family.id, reasonRequired: true, destructive: invite.status !== 'expired', run: async () => adminUpdateInvite(user, invite, invite.status === 'expired' ? 'renew' : 'cancel') })}><Ionicons name={invite.status === 'expired' ? 'refresh' : 'close-circle-outline'} size={19} color={invite.status === 'expired' ? colors.accent : colors.danger} /></Pressable> : null}</View>)}</Panel>

      <Panel title="Rotina sincronizada (somente leitura)" icon="planet-outline">{family.routineDays.slice(0, 7).map((day) => <View key={day.dayId} style={{ borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth }}><Pressable onPress={() => setExpandedDayId(expandedDayId === day.dayId ? '' : day.dayId)} style={styles.dayRow}><View><Text style={[styles.rowTitle, { color: colors.text }]}>{day.dayId.split('-').reverse().join('/')}</Text><Text style={[styles.rowSubtitle, { color: colors.textMuted }]}>{day.eventCount} registro(s) sincronizado(s)</Text></View><View style={styles.eventDots}>{day.events.slice(-6).map((event) => <View key={event.id} style={[styles.eventDot, { backgroundColor: ['sono','dormir','soneca'].includes(event.type) ? colors.primary : ['amamentacao','mamadeira'].includes(event.type) ? colors.warning : colors.accent }]} />)}<Ionicons name={expandedDayId === day.dayId ? 'chevron-up' : 'chevron-down'} size={16} color={colors.textMuted} /></View></Pressable>{expandedDayId === day.dayId ? <View style={styles.eventList}>{day.events.length ? day.events.map((event) => <View key={event.id} style={[styles.eventRow, { backgroundColor: colors.surfaceElevated }]}><Text style={[styles.eventName, { color: colors.text }]}>{EVENT_LABEL[event.type] || event.type || 'Registro'}</Text><Text style={[styles.eventMeta, { color: colors.textMuted }]}>{eventText(event)}</Text></View>) : <Text style={[styles.rowSubtitle, { color: colors.textMuted, paddingBottom: 10 }]}>O dia existe, mas não contém registros.</Text>}</View> : null}</View>)}{!family.routineDays.length ? <EmptyLine icon="cloud-offline-outline" text="Nenhum dia sincronizado." /> : null}</Panel>

      <Panel title="Integridade e dados" icon="pulse-outline"><Text style={[styles.rowTitle, { color: colors.text }]}>{family.integrityIssues.length ? `${new Set(family.integrityIssues).size} ponto(s) para revisar` : '7 verificações aprovadas'}</Text><Text style={[styles.rowSubtitle, { color: colors.textMuted, marginBottom: 7 }]}>Membros, responsável, perfil, convites, rotina e validade do acesso.</Text>{[...new Set(family.integrityIssues)].map((issue) => <View key={issue} style={styles.alertRow}><View style={[styles.alertDot, { backgroundColor: colors.warning }]} /><Text style={[styles.rowBody, { color: colors.text }]}>{issue}</Text></View>)}{!family.integrityIssues.length ? <EmptyLine icon="shield-checkmark-outline" text="Nenhuma inconsistência detectada." /> : null}<View style={styles.dualActions}><Pressable onPress={() => void runAction(() => adminLogIntegrityCheck(user, family).then(() => undefined), family.integrityIssues.length ? `Diagnóstico concluído: ${new Set(family.integrityIssues).size} ponto(s) exibido(s) abaixo.` : 'Diagnóstico concluído: 7 verificações aprovadas.')} style={[styles.smallAction, { backgroundColor: colors.primarySoft }]}><Ionicons name="scan-outline" size={17} color={colors.primary} /><Text style={[styles.smallActionText, { color: colors.primary }]}>Executar diagnóstico</Text></Pressable><Pressable onPress={() => void exportFamily()} style={[styles.smallAction, { backgroundColor: `${colors.accent}14` }]}><Ionicons name="download-outline" size={17} color={colors.accent} /><Text style={[styles.smallActionText, { color: colors.accent }]}>Exportar JSON</Text></Pressable></View></Panel>

      <Panel title="Estado da família" icon="settings-outline"><View style={styles.filterRow}>{(['active', 'suspended', 'archived'] as AdminFamilyStatus[]).map((value) => <Chip key={value} selected={family.status === value} label={STATUS_LABEL[value]} onPress={() => ask({ title: `${STATUS_LABEL[value]} família`, message: `Alterar ${family.name} para o estado “${STATUS_LABEL[value]}”?`, familyId: family.id, destructive: value !== 'active', reasonRequired: true, run: async () => adminUpdateFamilyStatus(user, family, value) })} />)}</View></Panel>
    </ScrollView>
  </SafeAreaView></Modal>;
}

function MemberRow({ family, member, user, ask }: { family: AdminFamily; member: AdminMember; user: NonNullable<ReturnType<typeof useNinouAuth>['user']>; ask: (v: Confirmation) => void }) {
  const { colors } = useNinouTheme();
  const role = normalizeAdminRole(member.role);
  const owner = role === 'owner';
  const ownerLinked = family.ownerUid === member.uid;
  const transfer = () => ask({ title: owner ? 'Consolidar responsável' : 'Transferir responsabilidade', message: owner ? `${member.email} será confirmado como responsável principal em todos os vínculos.` : `${member.email} passará a ser o responsável principal da família.`, familyId: family.id, reasonRequired: true, run: async () => adminTransferOwnership(user, family, member) });
  return <View style={[styles.memberRow, { borderBottomColor: colors.border }]}><View style={styles.titleLine}><View style={styles.rowCopy}><Text style={[styles.rowTitle, { color: colors.text }]}>{member.name || member.email || member.uid}</Text><Text style={[styles.rowSubtitle, { color: colors.textMuted }]}>{member.email} · {ROLE_LABEL[role] || role}</Text></View>{owner ? <View style={[styles.ownerBadge, { backgroundColor: colors.primarySoft }]}><Text style={[styles.ownerBadgeText, { color: colors.primary }]}>{ownerLinked ? 'Responsável' : 'Vínculo pendente'}</Text></View> : <Status value={member.status} />}</View><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.memberActions}>{owner && !ownerLinked ? <Pressable onPress={transfer} style={[styles.inlineAction, { borderColor: colors.primary }]}><Text style={[styles.inlineActionText, { color: colors.primary }]}>Consolidar vínculo</Text></Pressable> : null}{!owner ? <Pressable onPress={transfer} style={[styles.inlineAction, { borderColor: colors.primary }]}><Text style={[styles.inlineActionText, { color: colors.primary }]}>Tornar responsável</Text></Pressable> : null}{!owner ? ['admin_familiar', 'cuidador', 'visualizacao'].map((nextRole) => <Pressable key={nextRole} onPress={() => ask({ title: 'Alterar permissão', message: `Alterar ${member.email} para ${ROLE_LABEL[nextRole]}?`, familyId: family.id, reasonRequired: true, run: async () => adminUpdateMember(user, family, member, { role: nextRole }) })} style={[styles.inlineAction, { borderColor: role === nextRole ? colors.accent : colors.border }]}><Text style={[styles.inlineActionText, { color: role === nextRole ? colors.accent : colors.textMuted }]}>{ROLE_LABEL[nextRole]}</Text></Pressable>) : null}<Pressable onPress={() => ask({ title: member.status === 'blocked' ? 'Reativar membro' : 'Remover acesso', message: `Alterar o acesso de ${member.email}?`, familyId: family.id, destructive: member.status !== 'blocked', reasonRequired: true, run: async () => adminUpdateMember(user, family, member, { status: member.status === 'blocked' ? 'active' : 'blocked' }) })} style={[styles.inlineAction, { borderColor: colors.danger }]}><Text style={[styles.inlineActionText, { color: colors.danger }]}>{member.status === 'blocked' ? 'Reativar' : 'Remover'}</Text></Pressable></ScrollView></View>;
}

function CreateFamilyModal({ visible, close, submit, busy }: { visible: boolean; close: () => void; submit: (input: { familyName: string; babyName: string; birthDate?: string; responsibleEmail?: string; plan: AdminPlan; trialDays?: number }) => Promise<void>; busy: boolean }) {
  const { colors } = useNinouTheme();
  const [familyName, setFamilyName] = useState(''); const [babyName, setBabyName] = useState(''); const [birthDate, setBirthDate] = useState(''); const [email, setEmail] = useState(''); const [plan, setPlan] = useState<AdminPlan>('trial'); const [days, setDays] = useState('14');
  const save = async () => { await submit({ familyName, babyName, birthDate, responsibleEmail: email, plan, trialDays: Number(days) || 14 }); setFamilyName(''); setBabyName(''); setBirthDate(''); setEmail(''); };
  return <Modal visible={visible} transparent animationType="fade" onRequestClose={close}><KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalBackdrop}><View style={[styles.dialog, { backgroundColor: colors.surface }]}><View style={styles.titleLine}><View><Text style={[styles.dialogTitle, { color: colors.text }]}>Nova família cliente</Text><Text style={[styles.rowSubtitle, { color: colors.textMuted }]}>Crie o espaço e convide o responsável.</Text></View><Pressable onPress={close}><Ionicons name="close" size={23} color={colors.textMuted} /></Pressable></View><ScrollView keyboardShouldPersistTaps="handled"><Field label="Nome da família" value={familyName} onChange={setFamilyName} placeholder="Ex.: Família Oliveira" /><Field label="Nome do bebê" value={babyName} onChange={setBabyName} /><Field label="Nascimento (AAAA-MM-DD)" value={birthDate} onChange={setBirthDate} /><Field label="E-mail do responsável" value={email} onChange={setEmail} keyboardType="email-address" autoCapitalize="none" /><Text style={[styles.fieldLabel, { color: colors.textMuted }]}>Plano inicial</Text><View style={styles.filterRow}>{(['trial', 'premium', 'courtesy'] as AdminPlan[]).map((value) => <Chip key={value} selected={plan === value} label={PLAN_LABEL[value]} onPress={() => setPlan(value)} />)}</View>{plan === 'trial' ? <Field label="Dias de teste" value={days} onChange={setDays} keyboardType="number-pad" /> : null}<PrimaryButton label="Criar família" icon="add-circle-outline" disabled={busy || !familyName.trim() || !babyName.trim()} onPress={() => void save()} /></ScrollView></View></KeyboardAvoidingView></Modal>;
}

function TicketModal({ ticket, close, submit, busy }: { ticket: AdminSupportTicket | null; close: () => void; submit: (status: AdminTicketStatus, note: string) => Promise<void>; busy: boolean }) {
  const { colors } = useNinouTheme();
  const initialStatus = ticket && ['open', 'in_progress', 'resolved', 'rejected'].includes(ticket.status) ? ticket.status as AdminTicketStatus : 'in_progress';
  const [status, setStatus] = useState<AdminTicketStatus>(initialStatus);
  const [note, setNote] = useState(ticket?.note || '');
  if (!ticket) return null;
  return <Modal visible transparent animationType="fade" onRequestClose={close}><KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalBackdrop}><View style={[styles.dialog, { backgroundColor: colors.surface }]}><View style={styles.titleLine}><View style={styles.rowCopy}><Text style={[styles.dialogTitle, { color: colors.text }]}>{ticket.category}</Text><Text style={[styles.rowSubtitle, { color: colors.textMuted }]}>{ticket.familyName} · {ticket.email}</Text></View><Pressable onPress={close}><Ionicons name="close" size={23} color={colors.textMuted} /></Pressable></View><View style={[styles.messageBox, { backgroundColor: colors.surfaceElevated }]}><Text style={[styles.rowBody, { color: colors.text }]}>{ticket.message}</Text>{ticket.diagnostics ? <Text style={[styles.auditCode, { color: colors.textMuted }]}>{ticket.diagnostics}</Text> : null}</View><View style={styles.filterRow}>{(['open', 'in_progress', 'resolved', 'rejected'] as AdminTicketStatus[]).map((value) => <Chip key={value} selected={status === value} label={STATUS_LABEL[value]} onPress={() => setStatus(value)} />)}</View><Field label="Nota interna / resposta" value={note} onChange={setNote} multiline /><PrimaryButton label="Salvar atendimento" icon="checkmark-circle-outline" disabled={busy} onPress={() => void submit(status, note)} /></View></KeyboardAvoidingView></Modal>;
}

function ConfirmModal({ value, reason, setReason, close, confirm, busy }: { value: Confirmation | null; reason: string; setReason: (v: string) => void; close: () => void; confirm: () => void; busy: boolean }) {
  const { colors } = useNinouTheme(); if (!value) return null; const actionColor = value.destructive ? colors.danger : colors.primary;
  return <Modal visible transparent animationType="fade" onRequestClose={close}><KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalBackdrop}><View style={[styles.confirmDialog, { backgroundColor: colors.surface }]}><View style={[styles.confirmIcon, { backgroundColor: `${actionColor}14` }]}><Ionicons name={value.destructive ? 'warning-outline' : 'shield-checkmark-outline'} size={25} color={actionColor} /></View><Text style={[styles.confirmTitle, { color: colors.text }]}>{value.title}</Text><Text style={[styles.confirmText, { color: colors.textMuted }]}>{value.message}</Text>{value.reasonRequired ? <Field label="Justificativa para auditoria" value={reason} onChange={setReason} placeholder="Explique o motivo (mínimo 5 caracteres)" multiline /> : null}<View style={styles.dialogButtons}><Pressable onPress={close} style={[styles.dialogButton, { borderColor: colors.border }]}><Text style={[styles.dialogButtonText, { color: colors.textMuted }]}>Cancelar</Text></Pressable><Pressable disabled={busy || Boolean(value.reasonRequired && reason.trim().length < 5)} onPress={confirm} style={[styles.dialogButton, { backgroundColor: actionColor, opacity: value.reasonRequired && reason.trim().length < 5 ? 0.45 : 1 }]}><Text style={[styles.dialogButtonText, { color: '#FFFFFF' }]}>Confirmar</Text></Pressable></View></View></KeyboardAvoidingView></Modal>;
}

function Panel({ title, icon, children }: { title: string; icon: keyof typeof Ionicons.glyphMap; children: React.ReactNode }) { const { colors } = useNinouTheme(); return <View style={[styles.panel, { backgroundColor: colors.surface, borderColor: colors.border }]}><View style={styles.panelHead}><View style={[styles.panelIcon, { backgroundColor: colors.primarySoft }]}><Ionicons name={icon} size={17} color={colors.primary} /></View><Text style={[styles.panelTitle, { color: colors.text }]}>{title}</Text></View>{children}</View>; }
function SectionTitle({ kicker, title, subtitle, action, onAction }: { kicker: string; title: string; subtitle: string; action?: string; onAction?: () => void }) { const { colors } = useNinouTheme(); return <View style={styles.sectionHead}><View style={styles.rowCopy}><Text style={[styles.kicker, { color: colors.primary }]}>{kicker}</Text><Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text><Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>{subtitle}</Text></View>{action ? <Pressable onPress={onAction} style={[styles.addButton, { backgroundColor: colors.primary }]}><Ionicons name="add" size={18} color="#FFFFFF" /><Text style={styles.addButtonText}>{action}</Text></Pressable> : null}</View>; }
function Search({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) { const { colors } = useNinouTheme(); return <View style={[styles.search, { backgroundColor: colors.surface, borderColor: colors.border }]}><Ionicons name="search" size={18} color={colors.textMuted} /><TextInput value={value} onChangeText={onChange} placeholder={placeholder} placeholderTextColor={colors.textMuted} style={[styles.searchInput, { color: colors.text }]} />{value ? <Pressable onPress={() => onChange('')}><Ionicons name="close-circle" size={18} color={colors.textMuted} /></Pressable> : null}</View>; }
function Field({ label, value, onChange, placeholder, keyboardType, autoCapitalize, multiline }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; keyboardType?: 'default' | 'email-address' | 'number-pad'; autoCapitalize?: 'none' | 'sentences'; multiline?: boolean }) { const { colors } = useNinouTheme(); return <View style={styles.field}><Text style={[styles.fieldLabel, { color: colors.textMuted }]}>{label}</Text><TextInput value={value} onChangeText={onChange} placeholder={placeholder} placeholderTextColor={colors.textMuted} keyboardType={keyboardType} autoCapitalize={autoCapitalize} multiline={multiline} style={[styles.input, multiline && styles.multiline, { color: colors.text, backgroundColor: colors.background, borderColor: colors.border }]} /></View>; }
function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) { const { colors } = useNinouTheme(); return <Pressable onPress={onPress} style={[styles.chip, { backgroundColor: selected ? colors.primarySoft : colors.surface, borderColor: selected ? colors.primary : colors.border }]}><Text style={[styles.chipText, { color: selected ? colors.primary : colors.textMuted }]}>{label}</Text></Pressable>; }
function Status({ value }: { value: string }) { const { colors } = useNinouTheme(); const positive = ['active', 'resolved', 'accepted'].includes(value); const caution = ['pending', 'open', 'in_progress', 'trialing'].includes(value); const color = positive ? colors.accent : caution ? colors.warning : colors.danger; return <View style={[styles.status, { backgroundColor: `${color}14` }]}><View style={[styles.statusDot, { backgroundColor: color }]} /><Text style={[styles.statusText, { color }]}>{STATUS_LABEL[value] || value}</Text></View>; }
function Avatar({ label, large }: { label: string; large?: boolean }) { const { colors } = useNinouTheme(); return <LinearGradient colors={[`${colors.primary}32`, `${colors.accent}20`]} style={[styles.avatar, large && styles.avatarLarge]}><Text style={[styles.avatarText, { color: colors.primary }]}>{initials(label)}</Text></LinearGradient>; }
function MiniMeta({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) { const { colors } = useNinouTheme(); return <View style={styles.miniMeta}><Ionicons name={icon} size={12} color={colors.textMuted} /><Text style={[styles.miniMetaText, { color: colors.textMuted }]}>{text}</Text></View>; }
function Summary({ label, value }: { label: string; value: string }) { const { colors } = useNinouTheme(); return <View style={[styles.summary, { backgroundColor: colors.surface, borderColor: colors.border }]}><Text style={[styles.summaryLabel, { color: colors.textMuted }]}>{label}</Text><Text numberOfLines={2} style={[styles.summaryValue, { color: colors.text }]}>{value}</Text></View>; }
function PrimaryButton({ label, icon, disabled, onPress }: { label: string; icon: keyof typeof Ionicons.glyphMap; disabled?: boolean; onPress: () => void }) { const { colors } = useNinouTheme(); return <Pressable disabled={disabled} onPress={onPress} style={[styles.primaryButton, { backgroundColor: colors.primary, opacity: disabled ? 0.45 : 1 }]}><Ionicons name={icon} size={18} color="#FFFFFF" /><Text style={styles.primaryButtonText}>{label}</Text></Pressable>; }
function EmptyLine({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) { const { colors } = useNinouTheme(); return <View style={styles.emptyLine}><Ionicons name={icon} size={19} color={colors.accent} /><Text style={[styles.rowSubtitle, { color: colors.textMuted }]}>{text}</Text></View>; }
function EmptyCard({ icon, title, text }: { icon: keyof typeof Ionicons.glyphMap; title: string; text: string }) { const { colors } = useNinouTheme(); return <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}><Ionicons name={icon} size={30} color={colors.textMuted} /><Text style={[styles.emptyTitle, { color: colors.text }]}>{title}</Text><Text style={[styles.emptyText, { color: colors.textMuted }]}>{text}</Text></View>; }

const styles = StyleSheet.create<Record<string, any>>({
  safe: { flex: 1 }, content: { width: '100%', maxWidth: 720, alignSelf: 'center', paddingHorizontal: 17, paddingBottom: 56 },
  header: { minHeight: 70, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, brand: { flexDirection: 'row', alignItems: 'center', gap: 10 }, brandIcon: { width: 42, height: 42, borderRadius: 15, alignItems: 'center', justifyContent: 'center' }, brandName: { fontSize: 17, fontWeight: '900', letterSpacing: -0.3 }, brandCaption: { marginTop: 1, fontSize: 8, fontWeight: '900', letterSpacing: 1.25 }, headerActions: { flexDirection: 'row', gap: 7 }, iconButton: { width: 43, height: 43, borderRadius: 15, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center' },
  hero: { minHeight: 238, borderRadius: 31, padding: 22, justifyContent: 'flex-end', shadowColor: '#261642', shadowOpacity: 0.25, shadowRadius: 22, shadowOffset: { width: 0, height: 12 }, elevation: 5 }, heroTop: { position: 'absolute', top: 20, left: 20, right: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, adminBadge: { minHeight: 29, borderRadius: 15, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: 'rgba(255,255,255,0.13)' }, adminDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#70E6C6' }, adminBadgeText: { color: '#FFFFFF', fontSize: 8.5, fontWeight: '900', letterSpacing: 1 }, version: { color: 'rgba(255,255,255,0.58)', fontSize: 8.5, fontWeight: '800' }, heroTitle: { color: '#FFFFFF', fontSize: 30, lineHeight: 35, fontWeight: '900', letterSpacing: -1 }, heroText: { color: 'rgba(255,255,255,0.76)', marginTop: 7, maxWidth: 480, fontSize: 13.5, lineHeight: 20, fontWeight: '600' }, sessionRow: { marginTop: 15, flexDirection: 'row', alignItems: 'center', gap: 6 }, sessionText: { color: 'rgba(255,255,255,0.78)', fontSize: 10, fontWeight: '700' },
  feedback: { marginTop: 12, minHeight: 52, padding: 12, borderRadius: 17, borderWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', gap: 9 }, feedbackText: { flex: 1, fontSize: 11, lineHeight: 16, fontWeight: '700' }, loadingCard: { minHeight: 110, marginTop: 14, borderRadius: 22, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center', gap: 10 }, muted: { fontSize: 11, fontWeight: '700' },
  tabs: { paddingVertical: 15, gap: 7 }, tab: { minHeight: 39, paddingHorizontal: 12, borderRadius: 15, borderWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', gap: 6 }, tabText: { fontSize: 10.5, fontWeight: '850' }, countBubble: { minWidth: 17, height: 17, borderRadius: 9, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 }, countBubbleText: { color: '#FFFFFF', fontSize: 8, fontWeight: '900' },
  sectionHead: { marginTop: 13, marginBottom: 14, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 }, kicker: { fontSize: 8.5, fontWeight: '900', letterSpacing: 1.25 }, sectionTitle: { marginTop: 4, fontSize: 25, lineHeight: 29, fontWeight: '900', letterSpacing: -0.7 }, sectionSubtitle: { marginTop: 4, fontSize: 11, lineHeight: 16, fontWeight: '650' }, addButton: { minHeight: 40, paddingHorizontal: 13, borderRadius: 14, flexDirection: 'row', alignItems: 'center', gap: 5 }, addButtonText: { color: '#FFFFFF', fontSize: 11, fontWeight: '900' },
  metricGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, metric: { width: '48.7%', minHeight: 118, borderRadius: 21, borderWidth: StyleSheet.hairlineWidth, padding: 13 }, metricIcon: { width: 35, height: 35, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }, metricValue: { marginTop: 10, fontSize: 25, fontWeight: '900' }, metricLabel: { marginTop: 2, fontSize: 10, fontWeight: '750' }, quickRow: { marginTop: 9, flexDirection: 'row', gap: 8 }, quick: { flex: 1, minHeight: 54, borderRadius: 17, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 }, quickText: { fontSize: 10.5, fontWeight: '900' },
  panel: { marginTop: 12, borderRadius: 22, borderWidth: StyleSheet.hairlineWidth, padding: 13 }, panelHead: { marginBottom: 9, flexDirection: 'row', alignItems: 'center', gap: 8 }, panelIcon: { width: 32, height: 32, borderRadius: 11, alignItems: 'center', justifyContent: 'center' }, panelTitle: { flex: 1, fontSize: 13, fontWeight: '900' }, alertRow: { minHeight: 36, flexDirection: 'row', alignItems: 'center', gap: 9 }, alertDot: { width: 7, height: 7, borderRadius: 4 }, rowBody: { flex: 1, fontSize: 11, lineHeight: 16, fontWeight: '650' },
  listRow: { minHeight: 62, flexDirection: 'row', alignItems: 'center', gap: 9, borderBottomWidth: StyleSheet.hairlineWidth }, rowCopy: { flex: 1, minWidth: 0 }, rowTitle: { fontSize: 11.5, lineHeight: 16, fontWeight: '850' }, rowSubtitle: { marginTop: 2, fontSize: 9.5, lineHeight: 14, fontWeight: '650' }, avatar: { width: 39, height: 39, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }, avatarLarge: { width: 55, height: 55, borderRadius: 19 }, avatarText: { fontSize: 13, fontWeight: '900' },
  search: { minHeight: 48, borderRadius: 17, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', gap: 8 }, searchInput: { flex: 1, fontSize: 12, fontWeight: '650', paddingVertical: 0 }, filterRow: { marginTop: 10, flexDirection: 'row', flexWrap: 'wrap', gap: 6 }, chip: { minHeight: 34, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 10, alignItems: 'center', justifyContent: 'center' }, chipText: { fontSize: 9.5, fontWeight: '850' }, cardList: { marginTop: 10, gap: 9 }, familyCard: { minHeight: 105, borderRadius: 22, borderWidth: StyleSheet.hairlineWidth, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10 }, familyCopy: { flex: 1, minWidth: 0 }, familyName: { flex: 1, fontSize: 13.5, lineHeight: 18, fontWeight: '900' }, titleLine: { flexDirection: 'row', alignItems: 'center', gap: 8 }, metaRow: { marginTop: 10, flexDirection: 'row', flexWrap: 'wrap', gap: 10 }, miniMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 }, miniMetaText: { fontSize: 8.5, fontWeight: '700' },
  status: { minHeight: 23, borderRadius: 12, paddingHorizontal: 7, flexDirection: 'row', alignItems: 'center', gap: 4 }, statusDot: { width: 5, height: 5, borderRadius: 3 }, statusText: { fontSize: 7.8, fontWeight: '900' }, userCard: { borderRadius: 21, borderWidth: StyleSheet.hairlineWidth, padding: 13 }, userIcon: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }, familyChips: { marginTop: 10, flexDirection: 'row', flexWrap: 'wrap', gap: 5 }, familyChip: { minHeight: 27, borderRadius: 10, paddingHorizontal: 8, justifyContent: 'center' }, familyChipText: { fontSize: 8.5, fontWeight: '750' }, orphanText: { fontSize: 9.5, fontWeight: '800' }, outlineAction: { marginTop: 11, minHeight: 37, alignSelf: 'flex-start', borderRadius: 13, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', gap: 6 }, outlineActionText: { fontSize: 9.5, fontWeight: '850' },
  ticketCard: { borderRadius: 21, borderWidth: StyleSheet.hairlineWidth, padding: 13 }, ticketIcon: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }, ticketMessage: { marginTop: 10, fontSize: 10.5, lineHeight: 16, fontWeight: '600' }, auditRow: { minHeight: 67, paddingVertical: 9, flexDirection: 'row', gap: 10, borderBottomWidth: StyleSheet.hairlineWidth }, auditLine: { width: 3, borderRadius: 2 }, auditCode: { marginTop: 4, fontSize: 7.5, lineHeight: 11, fontWeight: '700' },
  emptyCard: { minHeight: 166, borderRadius: 23, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center', padding: 20 }, emptyTitle: { marginTop: 9, fontSize: 15, fontWeight: '900' }, emptyText: { marginTop: 4, maxWidth: 330, textAlign: 'center', fontSize: 10.5, lineHeight: 16, fontWeight: '600' }, emptyLine: { minHeight: 42, flexDirection: 'row', alignItems: 'center', gap: 8 },
  modalSafe: { flex: 1 }, modalHeader: { minHeight: 67, borderBottomWidth: StyleSheet.hairlineWidth, paddingHorizontal: 15, flexDirection: 'row', alignItems: 'center', gap: 10 }, modalHeaderCopy: { flex: 1, minWidth: 0 }, modalTitle: { fontSize: 16, fontWeight: '900' }, modalContent: { width: '100%', maxWidth: 720, alignSelf: 'center', padding: 15, paddingBottom: 50 }, supportBanner: { minHeight: 70, borderRadius: 19, padding: 13, flexDirection: 'row', alignItems: 'center', gap: 10 }, summaryGrid: { marginTop: 11, flexDirection: 'row', flexWrap: 'wrap', gap: 7 }, summary: { width: '48.8%', minHeight: 70, borderRadius: 17, borderWidth: StyleSheet.hairlineWidth, padding: 11 }, summaryLabel: { fontSize: 8.5, fontWeight: '750' }, summaryValue: { marginTop: 6, fontSize: 12, fontWeight: '900' },
  field: { marginTop: 10 }, fieldLabel: { marginBottom: 5, fontSize: 9, fontWeight: '850' }, input: { minHeight: 45, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 12, fontSize: 11.5, fontWeight: '650' }, multiline: { minHeight: 88, paddingTop: 11, textAlignVertical: 'top' }, primaryButton: { marginTop: 12, minHeight: 46, borderRadius: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 }, primaryButtonText: { color: '#FFFFFF', fontSize: 11, fontWeight: '900' },
  subscriptionCurrent: { padding: 12, borderRadius: 15 }, subscriptionCurrentTitle: { marginTop: 4, fontSize: 15, fontWeight: '900' },
  memberRow: { paddingVertical: 11, borderBottomWidth: StyleSheet.hairlineWidth }, ownerBadge: { paddingHorizontal: 8, minHeight: 25, borderRadius: 10, justifyContent: 'center' }, ownerBadgeText: { fontSize: 8, fontWeight: '900' }, memberActions: { paddingTop: 9, gap: 6 }, inlineAction: { minHeight: 31, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 9, alignItems: 'center', justifyContent: 'center' }, inlineActionText: { fontSize: 8.5, fontWeight: '800' }, inviteRow: { minHeight: 59, marginTop: 10, paddingTop: 10, borderTopWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', gap: 8 }, dayRow: { minHeight: 51, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, eventDots: { flexDirection: 'row', alignItems: 'center', gap: 3 }, eventDot: { width: 7, height: 7, borderRadius: 4 }, eventList: { gap: 5, paddingBottom: 10 }, eventRow: { minHeight: 38, paddingHorizontal: 9, borderRadius: 11, flexDirection: 'row', alignItems: 'center', gap: 8 }, eventName: { width: 95, fontSize: 9, fontWeight: '850' }, eventMeta: { flex: 1, fontSize: 9, fontWeight: '650' }, dualActions: { marginTop: 9, flexDirection: 'row', gap: 7 }, smallAction: { flex: 1, minHeight: 43, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }, smallActionText: { fontSize: 8.8, fontWeight: '850' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(9,5,20,0.68)', padding: 16, justifyContent: 'center' }, dialog: { width: '100%', maxWidth: 560, maxHeight: '90%', alignSelf: 'center', borderRadius: 25, padding: 17 }, dialogTitle: { fontSize: 17, fontWeight: '900' }, messageBox: { marginTop: 12, borderRadius: 15, padding: 12 }, confirmDialog: { width: '100%', maxWidth: 480, alignSelf: 'center', borderRadius: 25, padding: 19 }, confirmIcon: { width: 48, height: 48, borderRadius: 17, alignItems: 'center', justifyContent: 'center' }, confirmTitle: { marginTop: 13, fontSize: 19, fontWeight: '900' }, confirmText: { marginTop: 6, fontSize: 11.5, lineHeight: 17, fontWeight: '600' }, dialogButtons: { marginTop: 15, flexDirection: 'row', gap: 8 }, dialogButton: { flex: 1, minHeight: 44, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center' }, dialogButtonText: { fontSize: 10.5, fontWeight: '900' }, busyOverlay: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(20,12,39,0.4)', alignItems: 'center', justifyContent: 'center', zIndex: 50 },
});
