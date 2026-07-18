import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, Share, StyleSheet, Text, TextInput, View } from 'react-native';

import { NinouCard, NinouScreen } from '@/components/ninou-screen';
import { AvatarArt } from '@/components/avatar-art';
import { avatarIds, avatarLabels, type AvatarId } from '@/domain/avatar';
import { getBabyAgeText, useBabyProfile } from '@/state/profile-context';
import { useNinouAuth } from '@/state/auth-context';
import { useRoutine } from '@/state/routine-context';
import { radius, spacing, useNinouTheme, type ThemeMode } from '@/theme/tokens';
import { useFamilyPreferences } from '@/state/preferences-context';
import { createCaregiverInvite, getFirebaseErrorMessage, getLocalDateId, observeFamilyMembers, requestAccountDeletion, saveLegalConsent, submitSupportRequest, type FamilyMember } from '@/services/firebase';

export default function ProfileScreen() {
  const { colors, mode, setMode } = useNinouTheme();
  const { profile, updateProfile } = useBabyProfile();
  const { user, access, status, error, login, signOut, refreshAccess } = useNinouAuth();
  const { syncMessage, resetDay } = useRoutine();
  const { preferences, updatePreferences } = useFamilyPreferences();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [avatarModalOpen, setAvatarModalOpen] = useState(false);
  const [pendingAvatarId, setPendingAvatarId] = useState<AvatarId>(profile.avatarId);
  const [weightValue, setWeightValue] = useState('');
  const [weightDate, setWeightDate] = useState(new Date().toISOString().slice(0, 10));
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('caregiver');
  const [inviteCode, setInviteCode] = useState('');
  const [inviteFeedback, setInviteFeedback] = useState('');
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [supportOpen, setSupportOpen] = useState(false);
  const [supportCategory, setSupportCategory] = useState('Problema no aplicativo');
  const [supportMessage, setSupportMessage] = useState('');
  const [legalDocument, setLegalDocument] = useState<'terms' | 'privacy' | 'medical' | null>(null);
  const [working, setWorking] = useState('');
  const canEditProfile = !access || ['owner', 'admin', 'global_admin'].includes(access.role);
  const canManageFamily = Boolean(access && ['owner', 'admin', 'global_admin'].includes(access.role));

  useEffect(() => {
    if (!access) return;
    return observeFamilyMembers(access.familyId, setMembers, () => undefined);
  }, [access]);

  const handleLogin = async () => {
    if (!email.trim() || !password) return;
    setSubmitting(true);
    const success = await login(email, password);
    if (success) setPassword('');
    setSubmitting(false);
  };

  const openAvatarEditor = () => {
    setPendingAvatarId(profile.avatarId);
    setAvatarModalOpen(true);
  };

  const saveAvatar = () => {
    updateProfile({ avatarId: pendingAvatarId });
    setAvatarModalOpen(false);
  };

  const addWeight = () => {
    const parsed = Number(weightValue.replace(',', '.'));
    const value = parsed > 40 ? parsed / 1000 : parsed;
    if (!Number.isFinite(value) || value <= 0 || value > 30 || !/^\d{4}-\d{2}-\d{2}$/.test(weightDate)) { Alert.alert('Confira o peso', 'Informe a data e um peso válido em kg.'); return; }
    updateProfile({ weights: [{ id: `peso-${weightDate}-${Date.now()}`, date: weightDate, value }, ...profile.weights].sort((a, b) => b.date.localeCompare(a.date)) });
    setWeightValue('');
  };

  const createInvite = async () => {
    if (!user || !access) return;
    setWorking('invite'); setInviteFeedback('Gerando convite de uso único…');
    try { const invite = await createCaregiverInvite(user, access, inviteEmail, inviteRole); setInviteCode(invite.code); setInviteFeedback(`Convite criado para ${invite.email}. Expira em 7 dias.`); setInviteEmail(''); }
    catch (inviteError) { setInviteFeedback(getFirebaseErrorMessage(inviteError)); } finally { setWorking(''); }
  };

  const shareInvite = async () => { if (inviteCode) await Share.share({ message: `Você foi convidado para cuidar comigo no Ninou. Use o código ${inviteCode} no aplicativo. O convite expira em 7 dias.` }); };

  const acceptLegal = async () => {
    if (!user) return;
    setWorking('legal');
    try { await saveLegalConsent(user, access?.familyId, { termsVersion: '82.0.0', privacyVersion: '82.0.0', medicalDisclaimerVersion: '82.0.0' }); updatePreferences({ legalAcceptedAt: Date.now() }); Alert.alert('Preferências salvas', 'O aceite foi registrado nesta conta e família.'); }
    catch (legalError) { Alert.alert('Não foi possível salvar', getFirebaseErrorMessage(legalError)); } finally { setWorking(''); }
  };

  const sendSupport = async () => {
    if (!user || !supportMessage.trim()) return;
    setWorking('support');
    const diagnostics = `Ninou Expo 82.0.0 | family=${access?.familyId || 'none'} | role=${access?.role || 'none'} | sync=${syncMessage}`;
    try { await submitSupportRequest(user, access?.familyId, { category: supportCategory, message: supportMessage.trim(), diagnostics }); setSupportMessage(''); setSupportOpen(false); Alert.alert('Relato enviado', 'Recebemos o problema junto com as informações técnicas necessárias.'); }
    catch (supportError) { Alert.alert('Não foi possível enviar', getFirebaseErrorMessage(supportError)); } finally { setWorking(''); }
  };

  return (
    <NinouScreen title="Perfil" hidePageHeader>
      <LinearGradient colors={['#2A1D4B', '#171029', '#100C20']} style={[styles.profileHero, { borderColor: colors.border }]}>
        <View style={[styles.avatarHaloOuter, { borderColor: `${colors.accent}66` }]}>
          <View style={[styles.avatarHaloInner, { borderColor: `${colors.primary}AA` }]}>
            <AvatarArt avatarId={profile.avatarId} size={88} />
          </View>
        </View>
        <Text style={[styles.heroName, { color: colors.text }]}>{profile.name || 'Seu bebê'}</Text>
        <Text style={[styles.heroAge, { color: colors.text }]}>{getBabyAgeText(profile.birthDate)}</Text>
      </LinearGradient>

      <NinouCard>
        <Text style={[styles.sectionKicker, { color: colors.primary }]}>Perfil do diário</Text>
        <Text style={[styles.cardTitle, { color: colors.text }]}>Diário de cuidados</Text>
        <Text style={[styles.cardText, { color: colors.textMuted }]}>Ajustes usados no diário de {profile.name || 'seu bebê'}.</Text>
        <View style={styles.form}>
          <Text style={[styles.label, { color: colors.text }]}>Nome exibido no diário</Text>
          <TextInput
            value={profile.name}
            onChangeText={(name) => updateProfile({ name })}
            editable={canEditProfile}
            placeholder="Nome do bebê"
            placeholderTextColor={colors.textMuted}
            style={[styles.input, { color: colors.text, backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
          />
          <Text style={[styles.label, { color: colors.text }]}>Como mostrar no diário</Text>
          <View style={styles.articleRow}>
            {(['do', 'da'] as const).map((article) => {
              const selected = profile.article === article;
              return (
                <Pressable key={article} disabled={!canEditProfile} onPress={() => updateProfile({ article })} style={[styles.articleChoice, { borderColor: selected ? colors.primary : colors.border, backgroundColor: selected ? colors.primary : colors.surfaceElevated }]}>
                  <Text style={[styles.articleChoiceText, { color: selected ? '#FFFFFF' : colors.text }]}>Diário {article}</Text>
                </Pressable>
              );
            })}
          </View>
          <Text style={[styles.label, { color: colors.text }]}>Nascimento</Text>
          <TextInput
            value={profile.birthDate}
            onChangeText={(birthDate) => updateProfile({ birthDate })}
            editable={canEditProfile}
            placeholder="AAAA-MM-DD"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
            keyboardType="numbers-and-punctuation"
            style={[styles.input, { color: colors.text, backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
          />
          <Text style={[styles.label, { color: colors.text }]}>Avatar do diário</Text>
          <Pressable
            disabled={!canEditProfile}
            onPress={openAvatarEditor}
            style={[styles.avatarEditorButton, { backgroundColor: colors.accent, borderColor: `${colors.accent}88` }, !canEditProfile && styles.disabled]}>
            <AvatarArt avatarId={profile.avatarId} size={46} />
            <View style={styles.avatarEditorCopy}>
              <Text style={styles.avatarEditorLabel}>{avatarLabels[profile.avatarId]}</Text>
              <Text style={styles.avatarEditorAction}>✎ Editar avatar</Text>
            </View>
          </Pressable>
        </View>
      </NinouCard>

      <NinouCard>
        <Text style={[styles.sectionKicker, { color: colors.primary }]}>Peso e crescimento</Text>
        <Text style={[styles.cardTitle, { color: colors.text }]}>Atualizar peso</Text>
        <Text style={[styles.cardText, { color: colors.textMuted }]}>Guarde o histórico informado pela família. O Ninou não interpreta curvas nem oferece diagnóstico.</Text>
        <View style={styles.weightForm}><View style={styles.weightField}><Text style={[styles.label, { color: colors.text }]}>Data</Text><TextInput value={weightDate} onChangeText={setWeightDate} placeholder="AAAA-MM-DD" placeholderTextColor={colors.textMuted} style={[styles.input, { color: colors.text, backgroundColor: colors.surfaceElevated, borderColor: colors.border }]} /></View><View style={styles.weightField}><Text style={[styles.label, { color: colors.text }]}>Peso em kg</Text><TextInput value={weightValue} onChangeText={setWeightValue} placeholder="Ex.: 5,250" keyboardType="decimal-pad" placeholderTextColor={colors.textMuted} style={[styles.input, { color: colors.text, backgroundColor: colors.surfaceElevated, borderColor: colors.border }]} /></View></View>
        <Pressable disabled={!canEditProfile || !weightValue.trim()} onPress={addWeight} style={[styles.primaryButton, { backgroundColor: colors.primary }, (!canEditProfile || !weightValue.trim()) && styles.disabled]}><Text style={styles.primaryButtonText}>Atualizar peso</Text></Pressable>
        {profile.weights.slice(0, 4).map((weight) => <View key={weight.id} style={[styles.weightHistory, { borderTopColor: colors.border }]}><Text style={[styles.weightHistoryDate, { color: colors.textMuted }]}>{new Date(`${weight.date}T12:00:00`).toLocaleDateString('pt-BR')}</Text><Text style={[styles.weightHistoryValue, { color: colors.text }]}>{weight.value.toLocaleString('pt-BR', { minimumFractionDigits: 3 })} kg</Text></View>)}
      </NinouCard>

      <NinouCard>
        <Text style={[styles.sectionKicker, { color: colors.primary }]}>Cuidador deste aparelho</Text>
        <Text style={[styles.cardTitle, { color: colors.text }]}>Quem está cuidando agora?</Text>
        <Text style={[styles.cardText, { color: colors.textMuted }]}>Essa identificação acompanha os novos registros feitos neste aparelho.</Text>
        <View style={styles.form}><Text style={[styles.label, { color: colors.text }]}>Nome</Text><TextInput value={preferences.caregiverName} onChangeText={(caregiverName) => updatePreferences({ caregiverName })} placeholder="Ex.: Felipe" placeholderTextColor={colors.textMuted} style={[styles.input, { color: colors.text, backgroundColor: colors.surfaceElevated, borderColor: colors.border }]} /><Text style={[styles.label, { color: colors.text }]}>Relação com o bebê</Text><TextInput value={preferences.caregiverRelation} onChangeText={(caregiverRelation) => updatePreferences({ caregiverRelation })} placeholder="Pai, mãe, avó, babá…" placeholderTextColor={colors.textMuted} style={[styles.input, { color: colors.text, backgroundColor: colors.surfaceElevated, borderColor: colors.border }]} /></View>
      </NinouCard>

      <NinouCard>
        <Text style={[styles.sectionKicker, { color: colors.primary }]}>Janela acordado</Text>
        <Text style={[styles.cardTitle, { color: colors.text }]}>Referência gentil</Text>
        <Text style={[styles.cardText, { color: colors.textMuted }]}>Escolha o tempo usado nos indicadores da rotina. Não é uma recomendação médica.</Text>
        <View style={styles.windowRow}>
          {[60, 75, 90, 120].map((minutes) => (
            <Pressable key={minutes} disabled={!canEditProfile} onPress={() => updateProfile({ wakeWindowMinutes: minutes })} style={[styles.windowChip, { backgroundColor: profile.wakeWindowMinutes === minutes ? colors.primary : colors.surfaceElevated, borderColor: profile.wakeWindowMinutes === minutes ? colors.primary : colors.border }, !canEditProfile && styles.disabled]}>
              <Text style={[styles.windowText, { color: profile.wakeWindowMinutes === minutes ? '#FFFFFF' : colors.text }]}>{minutes} min</Text>
            </Pressable>
          ))}
        </View>
      </NinouCard>

      <NinouCard>
        <Text style={[styles.sectionKicker, { color: colors.primary }]}>Preferências</Text>
        <Text style={[styles.cardTitle, { color: colors.text }]}>Tema do app</Text>
        <Text style={[styles.cardText, { color: colors.textMuted }]}>A escolha fica salva neste aparelho e também muda a órbita entre o céu claro e o cenário cósmico.</Text>
        <View style={styles.themeRow}>
          {([
            ['light', 'sunny-outline', 'Claro'],
            ['dark', 'moon-outline', 'Escuro'],
            ['system', 'phone-portrait-outline', 'Sistema'],
          ] as [ThemeMode, keyof typeof Ionicons.glyphMap, string][]).map(([value, icon, label]) => {
            const selected = mode === value;
            return (
              <Pressable key={value} accessibilityRole="radio" accessibilityState={{ selected }} onPress={() => setMode(value)} style={[styles.themeChoice, { borderColor: selected ? colors.primary : colors.border, backgroundColor: selected ? colors.primarySoft : colors.surfaceElevated }]}>
                <Ionicons name={icon} size={20} color={selected ? colors.primary : colors.textMuted} />
                <Text style={[styles.themeChoiceText, { color: selected ? colors.primary : colors.text }]}>{label}</Text>
              </Pressable>
            );
          })}
        </View>
      </NinouCard>

      <NinouCard>
        <View style={styles.accessRow}><View style={[styles.accessIcon, { backgroundColor: colors.primarySoft }]}><Ionicons name="people-outline" size={24} color={colors.primary} /></View><View style={styles.accessCopy}><Text style={[styles.sectionKicker, { color: colors.primary }]}>Família conectada</Text><Text style={[styles.cardTitle, { color: colors.text }]}>Acesso e convites</Text><Text style={[styles.cardText, { color: colors.textMuted }]}>{canManageFamily ? 'Convide cuidadores por e-mail. O código tem uso único e expira em 7 dias.' : 'Você pode acompanhar a família, mas apenas responsáveis podem gerar convites.'}</Text></View></View>
        {canManageFamily ? <View style={styles.inviteForm}><Text style={[styles.label, { color: colors.text }]}>E-mail do familiar</Text><TextInput value={inviteEmail} onChangeText={setInviteEmail} autoCapitalize="none" keyboardType="email-address" placeholder="familiar@exemplo.com" placeholderTextColor={colors.textMuted} style={[styles.input, { color: colors.text, backgroundColor: colors.surfaceElevated, borderColor: colors.border }]} /><Text style={[styles.label, { color: colors.text }]}>Papel</Text><View style={styles.articleRow}>{[['caregiver', 'Cuidador'], ['admin', 'Responsável']] .map(([value, label]) => <Pressable key={value} onPress={() => setInviteRole(value)} style={[styles.articleChoice, { borderColor: inviteRole === value ? colors.primary : colors.border, backgroundColor: inviteRole === value ? colors.primary : colors.surfaceElevated }]}><Text style={[styles.articleChoiceText, { color: inviteRole === value ? '#FFF' : colors.text }]}>{label}</Text></Pressable>)}</View><Pressable disabled={working === 'invite' || !inviteEmail.trim()} onPress={() => void createInvite()} style={[styles.primaryButton, { backgroundColor: colors.primary }, (working === 'invite' || !inviteEmail.trim()) && styles.disabled]}><Text style={styles.primaryButtonText}>{working === 'invite' ? 'Gerando…' : 'Gerar convite'}</Text></Pressable></View> : null}
        {inviteFeedback ? <Text style={[styles.inviteFeedback, { color: colors.warning }]}>{inviteFeedback}</Text> : null}
        {inviteCode ? <View style={[styles.inviteResult, { backgroundColor: colors.primarySoft, borderColor: colors.primary }]}><Text style={[styles.inviteResultLabel, { color: colors.primary }]}>CÓDIGO DO CONVITE</Text><Text style={[styles.inviteCode, { color: colors.text }]}>{inviteCode}</Text><Pressable onPress={() => void shareInvite()} style={[styles.shareInvite, { backgroundColor: colors.primary }]}><Ionicons name="share-social-outline" size={18} color="#FFF" /><Text style={styles.shareInviteText}>Compartilhar convite</Text></Pressable></View> : null}
        <View style={styles.memberList}><Text style={[styles.label, { color: colors.text }]}>Pessoas com acesso</Text>{members.length ? members.map((member) => <View key={member.uid} style={[styles.member, { backgroundColor: colors.surfaceElevated }]}><View style={[styles.memberAvatar, { backgroundColor: colors.primarySoft }]}><Text style={[styles.memberInitial, { color: colors.primary }]}>{(member.name || member.email || 'F').charAt(0).toUpperCase()}</Text></View><View style={styles.memberCopy}><Text style={[styles.memberName, { color: colors.text }]}>{member.name || member.email}</Text><Text style={[styles.memberMeta, { color: colors.textMuted }]}>{member.role} · {member.status}</Text></View></View>) : <Text style={[styles.cardText, { color: colors.textMuted }]}>A lista aparecerá quando a família estiver sincronizada.</Text>}</View>
      </NinouCard>

      <NinouCard>
        <View style={styles.accessRow}>
          <View style={[styles.accessIcon, { backgroundColor: colors.primarySoft }]}><Ionicons name="people-outline" size={24} color={colors.primary} /></View>
          <View style={styles.accessCopy}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Acesso familiar</Text>
            <Text style={[styles.cardText, { color: colors.textMuted }]}>
              {access ? `${user?.email || ''} • ${access.role}` : user ? 'Conta conectada, aguardando vínculo familiar.' : 'Entre com a mesma conta usada no Ninou para sincronizar a rotina entre aparelhos.'}
            </Text>
          </View>
        </View>

        {!user ? (
          <View style={styles.authForm}>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="E-mail"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              style={[styles.input, { color: colors.text, backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
            />
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Senha"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
              autoComplete="current-password"
              secureTextEntry
              style={[styles.input, { color: colors.text, backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
            />
            <Pressable disabled={submitting || !email.trim() || !password} onPress={() => void handleLogin()} style={[styles.primaryButton, { backgroundColor: colors.primary }, (submitting || !email.trim() || !password) && styles.disabled]}>
              <Text style={styles.primaryButtonText}>{submitting || status === 'loading' ? 'Entrando…' : 'Entrar na família'}</Text>
            </Pressable>
          </View>
        ) : access ? (
          <View style={styles.connectedBox}>
            <View style={styles.statusLine}><View style={[styles.onlineDot, { backgroundColor: colors.accent }]} /><Text style={[styles.statusText, { color: colors.text }]}>{syncMessage}</Text></View>
            <Text style={[styles.familyId, { color: colors.textMuted }]}>Família: {access.familyId}</Text>
            <Pressable onPress={() => void signOut()} style={[styles.secondaryButton, { borderColor: colors.border }]}><Text style={[styles.secondaryButtonText, { color: colors.text }]}>Sair desta conta</Text></Pressable>
          </View>
        ) : (
          <View style={styles.connectedBox}>
            <Text style={[styles.cardText, { color: colors.warning }]}>Não encontrei uma família ativa para esta conta. Aceite o convite no Ninou ou atualize o vínculo.</Text>
            <View style={styles.buttonRow}>
              <Pressable onPress={() => void refreshAccess()} style={[styles.secondaryButton, { borderColor: colors.border }]}><Text style={[styles.secondaryButtonText, { color: colors.text }]}>Atualizar vínculo</Text></Pressable>
              <Pressable onPress={() => void signOut()} style={[styles.secondaryButton, { borderColor: colors.border }]}><Text style={[styles.secondaryButtonText, { color: colors.text }]}>Sair</Text></Pressable>
            </View>
          </View>
        )}
        {error ? <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text> : null}
      </NinouCard>

      <Pressable onPress={() => router.push('/relatorios' as never)} style={[styles.reportCard, { backgroundColor: colors.primary, borderColor: colors.primary }]}><View style={styles.reportIcon}><Ionicons name="document-text-outline" size={27} color="#FFF" /></View><View style={styles.reportCopy}><Text style={styles.reportKicker}>RELATÓRIO DE ROTINA</Text><Text style={styles.reportTitle}>PDF profissional e exportações</Text><Text style={styles.reportText}>WhatsApp, CSV, JSON e períodos personalizados.</Text></View><Ionicons name="chevron-forward" size={22} color="#FFF" /></Pressable>

      <NinouCard>
        <Text style={[styles.sectionKicker, { color: colors.primary }]}>Privacidade e segurança</Text><Text style={[styles.cardTitle, { color: colors.text }]}>Seus dados, suas escolhas</Text><Text style={[styles.cardText, { color: colors.textMuted }]}>Consulte os documentos e registre o aceite. A preferência fica salva na conta e na família.</Text>
        <View style={styles.legalActions}><Pressable onPress={() => setLegalDocument('privacy')} style={[styles.legalButton, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}><Ionicons name="shield-checkmark-outline" size={19} color={colors.primary} /><Text style={[styles.legalText, { color: colors.text }]}>Política</Text></Pressable><Pressable onPress={() => setLegalDocument('terms')} style={[styles.legalButton, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}><Ionicons name="document-text-outline" size={19} color={colors.primary} /><Text style={[styles.legalText, { color: colors.text }]}>Termos</Text></Pressable><Pressable onPress={() => setLegalDocument('medical')} style={[styles.legalButton, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}><Ionicons name="medical-outline" size={19} color={colors.primary} /><Text style={[styles.legalText, { color: colors.text }]}>Aviso médico</Text></Pressable></View>
        <Pressable disabled={working === 'legal'} onPress={() => void acceptLegal()} style={[styles.primaryButton, { backgroundColor: preferences.legalAcceptedAt ? colors.accent : colors.primary }]}><Text style={styles.primaryButtonText}>{working === 'legal' ? 'Salvando…' : preferences.legalAcceptedAt ? `Termos aceitos em ${new Date(preferences.legalAcceptedAt).toLocaleDateString('pt-BR')}` : 'Aceitar termos'}</Text></Pressable>
        <Pressable onPress={() => Alert.alert('Solicitar exclusão?', 'A solicitação será registrada para análise. Nenhum dado será apagado imediatamente.', [{ text: 'Cancelar', style: 'cancel' }, { text: 'Solicitar', style: 'destructive', onPress: async () => { if (user) { await requestAccountDeletion(user, access?.familyId); Alert.alert('Solicitação registrada'); } } }])} style={[styles.secondaryButton, { borderColor: colors.danger }]}><Text style={[styles.secondaryButtonText, { color: colors.danger }]}>Solicitar exclusão dos meus dados</Text></Pressable>
      </NinouCard>

      <NinouCard>
        <Text style={[styles.sectionKicker, { color: colors.primary }]}>Ajuda e suporte</Text><Text style={[styles.cardTitle, { color: colors.text }]}>Encontrou algum problema?</Text><Text style={[styles.cardText, { color: colors.textMuted }]}>Envie uma descrição. O diagnóstico técnico inclui apenas versão, família, papel e estado de sincronização — nunca senha ou conteúdo privado.</Text><Pressable onPress={() => setSupportOpen(true)} style={[styles.primaryButton, { backgroundColor: colors.primary }]}><Text style={styles.primaryButtonText}>Relatar um problema</Text></Pressable>
      </NinouCard>

      <NinouCard>
        <Text style={[styles.sectionKicker, { color: colors.danger }]}>Dados do dia</Text><Text style={[styles.cardTitle, { color: colors.text }]}>Recomeçar os registros de hoje</Text><Text style={[styles.cardText, { color: colors.textMuted }]}>Remove o estado, os eventos e as notas de hoje para toda a família. Relatórios de dias anteriores permanecem intactos.</Text><Pressable onPress={() => Alert.alert('Zerar o dia?', 'Esta ação será sincronizada e não poderá ser desfeita.', [{ text: 'Cancelar', style: 'cancel' }, { text: 'Zerar hoje', style: 'destructive', onPress: () => resetDay(getLocalDateId()) }])} style={[styles.secondaryButton, { borderColor: colors.danger }]}><Text style={[styles.secondaryButtonText, { color: colors.danger }]}>Zerar dia</Text></Pressable>
      </NinouCard>

      <Modal visible={avatarModalOpen} transparent animationType="fade" onRequestClose={() => setAvatarModalOpen(false)}>
        <View style={styles.avatarModalBackdrop}>
          <View style={[styles.avatarModalCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <LinearGradient colors={['rgba(98,68,181,0.24)', 'rgba(26,18,50,0.04)']} style={StyleSheet.absoluteFill} />
            <View style={styles.avatarModalHeader}>
              <View style={styles.avatarModalHeaderCopy}>
                <Text style={[styles.avatarModalKicker, { color: colors.textMuted }]}>Escolha do avatar</Text>
                <Text style={[styles.avatarModalTitle, { color: colors.text }]}>Avatares disponíveis</Text>
                <Text style={[styles.avatarModalHint, { color: colors.textMuted }]}>Escolha o avatar de {profile.name || 'seu bebê'}.</Text>
              </View>
              <View style={[styles.avatarPreview, { borderColor: colors.accent, backgroundColor: colors.surfaceElevated }]}>
                <AvatarArt avatarId={pendingAvatarId} size={88} />
              </View>
            </View>

            <ScrollView style={styles.avatarModalScroll} contentContainerStyle={styles.avatarModalGrid} showsVerticalScrollIndicator={false}>
              {avatarIds.map((avatarId) => {
                const selected = pendingAvatarId === avatarId;
                return (
                  <Pressable
                    key={avatarId}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    accessibilityLabel={avatarLabels[avatarId]}
                    onPress={() => setPendingAvatarId(avatarId)}
                    style={[styles.avatarModalChoice, { borderColor: selected ? colors.accent : colors.border, backgroundColor: selected ? `${colors.accent}12` : colors.surfaceElevated }, selected && styles.avatarModalSelected]}>
                    {selected ? <View style={[styles.avatarCheck, { backgroundColor: colors.primary }]}><Ionicons name="checkmark" size={17} color="#FFFFFF" /></View> : null}
                    <AvatarArt avatarId={avatarId} size={88} />
                    <Text style={[styles.avatarChoiceLabel, { color: colors.text }]}>{avatarLabels[avatarId]}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <View style={styles.avatarModalActions}>
              <Pressable onPress={saveAvatar} style={styles.avatarSaveWrap}>
                <LinearGradient colors={['#6EE7C1', '#FFE26F']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.avatarSaveButton}>
                  <Text style={styles.avatarSaveText}>Salvar</Text>
                </LinearGradient>
              </Pressable>
              <Pressable onPress={() => setAvatarModalOpen(false)} style={[styles.avatarCloseButton, { borderColor: colors.border, backgroundColor: colors.surfaceElevated }]}>
                <Text style={[styles.avatarCloseText, { color: colors.text }]}>Fechar</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={Boolean(legalDocument)} transparent animationType="slide" onRequestClose={() => setLegalDocument(null)}><View style={styles.avatarModalBackdrop}><View style={[styles.legalModal, { backgroundColor: colors.surface, borderColor: colors.border }]}><View style={[styles.modalHandle, { backgroundColor: colors.border }]} /><Text style={[styles.avatarModalKicker, { color: colors.primary }]}>{legalDocument === 'privacy' ? 'POLÍTICA DE PRIVACIDADE' : legalDocument === 'medical' ? 'AVISO MÉDICO' : 'TERMOS DE USO'}</Text><Text style={[styles.avatarModalTitle, { color: colors.text }]}>{legalDocument === 'privacy' ? 'Como o Ninou cuida dos dados' : legalDocument === 'medical' ? 'Apoio à rotina, sem diagnóstico' : 'Uso responsável do Ninou'}</Text><ScrollView style={styles.legalScroll} showsVerticalScrollIndicator={false}><Text style={[styles.legalBody, { color: colors.textMuted }]}>{legalDocument === 'privacy' ? 'O Ninou armazena os registros inseridos pela família para sincronizar a rotina entre pessoas autorizadas. A família controla seus convites e pode solicitar exportação ou exclusão. Dados não são usados para diagnóstico médico. Proteja sua senha e revogue acessos que não sejam mais necessários.' : legalDocument === 'medical' ? 'O Ninou é um diário de organização familiar. Indicadores, janelas e resumos são informativos e dependem dos dados registrados. O aplicativo não diagnostica, não prescreve tratamento e não substitui pediatra ou serviço de emergência. Em caso de preocupação com a saúde do bebê, procure atendimento profissional.' : 'Ao usar o Ninou, a família se compromete a informar dados verdadeiros, proteger o acesso à conta e usar os recursos apenas para organização da rotina. Convites são pessoais, de uso único e não devem ser publicados. O uso do aplicativo pressupõe concordância com a política de privacidade e com o aviso médico.'}</Text></ScrollView><Pressable onPress={() => setLegalDocument(null)} style={[styles.primaryButton, { backgroundColor: colors.primary }]}><Text style={styles.primaryButtonText}>Entendi</Text></Pressable></View></View></Modal>

      <Modal visible={supportOpen} transparent animationType="slide" onRequestClose={() => setSupportOpen(false)}><View style={styles.avatarModalBackdrop}><View style={[styles.legalModal, { backgroundColor: colors.surface, borderColor: colors.border }]}><View style={[styles.modalHandle, { backgroundColor: colors.border }]} /><Text style={[styles.avatarModalKicker, { color: colors.primary }]}>SUPORTE NINOU</Text><Text style={[styles.avatarModalTitle, { color: colors.text }]}>Relatar um problema</Text><Text style={[styles.cardText, { color: colors.textMuted }]}>Conte o que aconteceu e o que você esperava que acontecesse.</Text><Text style={[styles.label, { color: colors.text }]}>Categoria</Text><View style={styles.supportCategories}>{['Problema no aplicativo', 'Sugestão', 'Sincronização', 'Conta e família'].map((category) => <Pressable key={category} onPress={() => setSupportCategory(category)} style={[styles.supportChip, { backgroundColor: supportCategory === category ? colors.primary : colors.surfaceElevated, borderColor: colors.border }]}><Text style={[styles.supportChipText, { color: supportCategory === category ? '#FFF' : colors.text }]}>{category}</Text></Pressable>)}</View><Text style={[styles.label, { color: colors.text }]}>Descrição</Text><TextInput multiline value={supportMessage} onChangeText={setSupportMessage} placeholder="Descreva as etapas, a tela e o resultado observado" placeholderTextColor={colors.textMuted} style={[styles.supportArea, { color: colors.text, backgroundColor: colors.surfaceElevated, borderColor: colors.border }]} /><View style={styles.avatarModalActions}><Pressable onPress={() => setSupportOpen(false)} style={[styles.avatarCloseButton, { borderColor: colors.border, backgroundColor: colors.surfaceElevated }]}><Text style={[styles.avatarCloseText, { color: colors.text }]}>Cancelar</Text></Pressable><Pressable disabled={!supportMessage.trim() || working === 'support'} onPress={() => void sendSupport()} style={[styles.avatarSaveButton, { flex: 1, backgroundColor: colors.primary }, (!supportMessage.trim() || working === 'support') && styles.disabled]}><Text style={styles.primaryButtonText}>{working === 'support' ? 'Enviando…' : 'Enviar relato'}</Text></Pressable></View></View></View></Modal>
    </NinouScreen>
  );
}

const styles = StyleSheet.create({
  profileHero: { minHeight: 308, borderRadius: radius.lg, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.lg, overflow: 'hidden' },
  avatarHaloOuter: { width: 122, height: 122, borderRadius: 61, borderWidth: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.06)' },
  avatarHaloInner: { width: 106, height: 106, borderRadius: 53, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  heroName: { marginTop: spacing.sm, fontSize: 42, lineHeight: 46, fontWeight: '900', letterSpacing: -1.8, textAlign: 'center' },
  heroAge: { fontSize: 18, lineHeight: 23, fontWeight: '900', textAlign: 'center' },
  sectionKicker: { fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: spacing.sm },
  cardTitle: { fontSize: 17, fontWeight: '900' },
  cardText: { fontSize: 13, lineHeight: 19, marginTop: spacing.xs },
  form: { gap: spacing.sm },
  label: { fontSize: 12, fontWeight: '800', marginTop: spacing.sm },
  input: { minHeight: 50, borderRadius: radius.md, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: spacing.md, fontSize: 15 },
  articleRow: { flexDirection: 'row', gap: spacing.sm },
  articleChoice: { minHeight: 42, flex: 1, borderRadius: radius.md, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center' },
  articleChoiceText: { fontSize: 13, fontWeight: '900' },
  avatarEditorButton: { minHeight: 72, borderRadius: radius.md, borderWidth: StyleSheet.hairlineWidth, padding: 10, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatarEditorCopy: { flex: 1, gap: 2 },
  avatarEditorLabel: { color: '#12362E', fontSize: 14, fontWeight: '900' },
  avatarEditorAction: { color: '#12362E', fontSize: 13, fontWeight: '800' },
  windowRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.lg },
  windowChip: { minHeight: 40, borderRadius: radius.pill, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: spacing.md, alignItems: 'center', justifyContent: 'center' },
  windowText: { fontSize: 12, fontWeight: '800' },
  weightForm: { marginTop: spacing.md, flexDirection: 'row', gap: spacing.sm }, weightField: { flex: 1 }, weightHistory: { minHeight: 42, marginTop: spacing.sm, borderTopWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, weightHistoryDate: { fontSize: 11, fontWeight: '700' }, weightHistoryValue: { fontSize: 13, fontWeight: '900' },
  themeRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },
  themeChoice: { flex: 1, minHeight: 70, borderRadius: radius.md, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center', gap: 6 },
  themeChoiceText: { fontSize: 11.5, fontWeight: '900' },
  accessRow: { flexDirection: 'row', gap: spacing.md },
  accessIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  accessCopy: { flex: 1 },
  inviteForm: { marginTop: spacing.lg, gap: spacing.sm }, inviteFeedback: { marginTop: spacing.md, fontSize: 11.5, lineHeight: 17, fontWeight: '700' }, inviteResult: { marginTop: spacing.md, borderRadius: 20, borderWidth: StyleSheet.hairlineWidth, padding: 15, alignItems: 'center' }, inviteResultLabel: { fontSize: 9, fontWeight: '900', letterSpacing: 1.1 }, inviteCode: { marginVertical: 8, fontSize: 28, fontWeight: '900', letterSpacing: 4 }, shareInvite: { minHeight: 44, width: '100%', borderRadius: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 }, shareInviteText: { color: '#FFF', fontSize: 12, fontWeight: '900' }, memberList: { marginTop: spacing.lg, gap: spacing.sm }, member: { minHeight: 58, borderRadius: 17, padding: 9, flexDirection: 'row', alignItems: 'center', gap: 10 }, memberAvatar: { width: 39, height: 39, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }, memberInitial: { fontSize: 16, fontWeight: '900' }, memberCopy: { flex: 1 }, memberName: { fontSize: 12.5, fontWeight: '900' }, memberMeta: { marginTop: 2, fontSize: 9.5, fontWeight: '700' },
  authForm: { marginTop: spacing.lg, gap: spacing.md },
  primaryButton: { minHeight: 50, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.lg },
  primaryButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '900' },
  secondaryButton: { minHeight: 44, borderRadius: radius.md, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.md },
  secondaryButtonText: { fontSize: 13, fontWeight: '800' },
  connectedBox: { marginTop: spacing.lg, gap: spacing.md },
  statusLine: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  onlineDot: { width: 9, height: 9, borderRadius: 5 },
  statusText: { flex: 1, fontSize: 13, fontWeight: '800' },
  familyId: { fontSize: 11, lineHeight: 16 },
  buttonRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  errorText: { marginTop: spacing.md, fontSize: 12, lineHeight: 17, fontWeight: '700' },
  reportCard: { minHeight: 104, borderRadius: radius.lg, borderWidth: StyleSheet.hairlineWidth, padding: 15, flexDirection: 'row', alignItems: 'center', gap: 12 }, reportIcon: { width: 54, height: 54, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.14)', alignItems: 'center', justifyContent: 'center' }, reportCopy: { flex: 1 }, reportKicker: { color: 'rgba(255,255,255,0.72)', fontSize: 8.5, fontWeight: '900', letterSpacing: 1 }, reportTitle: { color: '#FFF', marginTop: 3, fontSize: 15, fontWeight: '900' }, reportText: { color: 'rgba(255,255,255,0.76)', marginTop: 3, fontSize: 10.5, lineHeight: 15 },
  legalActions: { marginVertical: spacing.lg, flexDirection: 'row', gap: 7 }, legalButton: { flex: 1, minHeight: 68, borderRadius: 17, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center', gap: 5 }, legalText: { fontSize: 10.5, fontWeight: '900' },
  disabled: { opacity: 0.48 },
  avatarModalBackdrop: { flex: 1, backgroundColor: 'rgba(7,4,18,0.82)', padding: 14, alignItems: 'center', justifyContent: 'center' },
  avatarModalCard: { width: '100%', maxWidth: 390, height: '92%', maxHeight: 760, borderRadius: 30, borderWidth: StyleSheet.hairlineWidth, padding: 18, overflow: 'hidden' },
  avatarModalHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg },
  avatarModalHeaderCopy: { flex: 1, gap: spacing.sm },
  avatarModalKicker: { fontSize: 11, fontWeight: '900', letterSpacing: 1.5, textTransform: 'uppercase' },
  avatarModalTitle: { fontSize: 30, lineHeight: 31, fontWeight: '900', letterSpacing: -1.2 },
  avatarModalHint: { fontSize: 14, lineHeight: 18, fontWeight: '700' },
  avatarPreview: { width: 104, height: 104, borderRadius: 30, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  avatarModalScroll: { flex: 1 },
  avatarModalGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingBottom: spacing.md },
  avatarModalChoice: { width: '48%', minHeight: 144, borderRadius: 24, borderWidth: StyleSheet.hairlineWidth, padding: 10, alignItems: 'center', justifyContent: 'center', gap: spacing.sm, overflow: 'hidden' },
  avatarModalSelected: { borderWidth: 2 },
  avatarCheck: { position: 'absolute', zIndex: 2, top: 10, right: 10, width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  avatarChoiceLabel: { fontSize: 14, fontWeight: '900', textAlign: 'center' },
  avatarModalActions: { flexDirection: 'row', gap: 10, paddingTop: 10 },
  avatarSaveWrap: { flex: 1 },
  avatarSaveButton: { minHeight: 54, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  avatarSaveText: { color: '#17132F', fontSize: 16, fontWeight: '900' },
  avatarCloseButton: { flex: 1, minHeight: 54, borderRadius: 20, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center' },
  avatarCloseText: { fontSize: 16, fontWeight: '900' },
  legalModal: { width: '100%', maxWidth: 480, maxHeight: '86%', borderRadius: 30, borderWidth: StyleSheet.hairlineWidth, padding: 20 }, modalHandle: { width: 44, height: 5, borderRadius: 3, alignSelf: 'center', marginBottom: 18 }, legalScroll: { marginVertical: 18 }, legalBody: { fontSize: 14, lineHeight: 23 }, supportCategories: { marginTop: 8, flexDirection: 'row', flexWrap: 'wrap', gap: 7 }, supportChip: { minHeight: 38, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 10, alignItems: 'center', justifyContent: 'center' }, supportChipText: { fontSize: 10.5, fontWeight: '900' }, supportArea: { minHeight: 130, borderRadius: 18, borderWidth: StyleSheet.hairlineWidth, padding: 13, fontSize: 13, lineHeight: 19, textAlignVertical: 'top' },
});
