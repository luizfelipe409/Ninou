import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { NinouBackground } from '@/components/ninou-background';
import { acceptCaregiverInvite, createPersonalFamily, getFirebaseErrorMessage } from '@/services/firebase';
import { useNinouAuth } from '@/state/auth-context';
import { useNinouTheme } from '@/theme/tokens';

type SetupMode = 'choice' | 'create' | 'invite';

export function FamilySetupPortal() {
  const { user, refreshAccess, signOut } = useNinouAuth();
  const { colors, isDark } = useNinouTheme();
  const [mode, setMode] = useState<SetupMode>('choice');
  const [familyName, setFamilyName] = useState('');
  const [babyName, setBabyName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [article, setArticle] = useState<'do' | 'da'>('do');
  const [responsibleName, setResponsibleName] = useState('');
  const [responsibleRelation, setResponsibleRelation] = useState('Responsável');
  const [inviteCode, setInviteCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    void AsyncStorage.getItem('ninou.mobile.pending-invite.v1').then((code) => {
      if (code) { setInviteCode(code); setMode('invite'); }
    });
  }, []);

  const create = async () => {
    if (!user || !familyName.trim() || !babyName.trim() || !responsibleName.trim()) return;
    setBusy(true); setFeedback('Criando a família e preparando o diário…');
    try {
      await createPersonalFamily(user, { familyName: familyName.trim(), babyName: babyName.trim(), birthDate: birthDate.trim(), article, responsibleName: responsibleName.trim(), responsibleRelation: responsibleRelation.trim() || 'Responsável' });
      await refreshAccess();
    } catch (error) { setFeedback(getFirebaseErrorMessage(error)); setBusy(false); }
  };

  const join = async () => {
    if (!user || !inviteCode.trim()) return;
    setBusy(true); setFeedback('Validando convite e conectando a família…');
    try {
      await acceptCaregiverInvite(user, inviteCode);
      await AsyncStorage.removeItem('ninou.mobile.pending-invite.v1');
      await refreshAccess();
    } catch (error) { setFeedback(getFirebaseErrorMessage(error)); setBusy(false); }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <NinouBackground intense />
      <KeyboardAvoidingView style={styles.safe} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.brand}><Image source={require('../../assets/images/ninou-icon.png')} style={styles.icon} /><Text style={[styles.brandText, { color: colors.text }]}>Ninou</Text></View>
          <LinearGradient colors={isDark ? ['rgba(45,31,82,0.96)', 'rgba(24,17,44,0.97)'] : ['rgba(255,255,255,0.96)', 'rgba(248,244,252,0.96)']} style={[styles.card, { borderColor: colors.border }]}>
            {mode !== 'choice' ? <Pressable onPress={() => { setMode('choice'); setFeedback(''); }} style={styles.back}><Ionicons name="arrow-back" size={19} color={colors.primary} /><Text style={[styles.backText, { color: colors.primary }]}>Voltar</Text></Pressable> : null}
            <Text style={[styles.kicker, { color: colors.primary }]}>{mode === 'create' ? 'CONFIGURAR FAMÍLIA' : mode === 'invite' ? 'CONVITE FAMILIAR' : 'CONTA CONECTADA'}</Text>
            <Text style={[styles.title, { color: colors.text }]}>{mode === 'create' ? 'Quem vamos acompanhar?' : mode === 'invite' ? 'Entre na rotina da família' : 'Como você quer começar?'}</Text>
            <Text style={[styles.subtitle, { color: colors.textMuted }]}>{user?.email} está conectado. Agora escolha a família correta para não misturar dados.</Text>

            {mode === 'choice' ? (
              <View style={styles.options}>
                <SetupOption icon="home-outline" title="Criar minha família" text="Para responsáveis começando uma nova rotina." onPress={() => setMode('create')} />
                <SetupOption icon="mail-open-outline" title="Entrar com convite" text="Para cuidadores convidados por uma família existente." onPress={() => setMode('invite')} />
              </View>
            ) : mode === 'create' ? (
              <View style={styles.form}>
                <Field label="Nome da família" value={familyName} onChangeText={setFamilyName} placeholder="Ex.: Família do Francisco" />
                <Field label="Nome do bebê" value={babyName} onChangeText={setBabyName} placeholder="Nome usado no diário" />
                <Field label="Nascimento" value={birthDate} onChangeText={setBirthDate} placeholder="AAAA-MM-DD" />
                <Text style={[styles.label, { color: colors.text }]}>Como mostrar no diário</Text>
                <View style={styles.segment}>{(['do', 'da'] as const).map((value) => <Pressable key={value} onPress={() => setArticle(value)} style={[styles.segmentItem, { backgroundColor: article === value ? colors.primary : colors.surfaceElevated, borderColor: colors.border }]}><Text style={{ color: article === value ? '#FFF' : colors.text, fontWeight: '900' }}>Diário {value}</Text></Pressable>)}</View>
                <Field label="Seu nome" value={responsibleName} onChangeText={setResponsibleName} placeholder="Quem está configurando" />
                <Field label="Relação com o bebê" value={responsibleRelation} onChangeText={setResponsibleRelation} placeholder="Pai, mãe, responsável…" />
                <PrimaryButton label="Criar família agora" busy={busy} disabled={!familyName.trim() || !babyName.trim() || !responsibleName.trim()} onPress={() => void create()} />
              </View>
            ) : (
              <View style={styles.form}>
                <Field label="Código do convite" value={inviteCode} onChangeText={(value) => setInviteCode(value.toUpperCase())} placeholder="ABCD2345" />
                <Text style={[styles.help, { color: colors.textMuted }]}>O código tem uso único, expira em 7 dias e precisa ter sido criado para {user?.email}.</Text>
                <PrimaryButton label="Validar e entrar na família" busy={busy} disabled={!inviteCode.trim()} onPress={() => void join()} />
              </View>
            )}
            {feedback ? <Text style={[styles.feedback, { color: colors.warning }]}>{feedback}</Text> : null}
            <Pressable disabled={busy} onPress={() => void signOut()} style={styles.signOut}><Text style={[styles.signOutText, { color: colors.textMuted }]}>Usar outra conta</Text></Pressable>
          </LinearGradient>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );

  function SetupOption({ icon, title, text, onPress }: { icon: keyof typeof Ionicons.glyphMap; title: string; text: string; onPress: () => void }) {
    return <Pressable onPress={onPress} style={({ pressed }) => [styles.option, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }, pressed && styles.pressed]}><View style={[styles.optionIcon, { backgroundColor: colors.primarySoft }]}><Ionicons name={icon} size={25} color={colors.primary} /></View><View style={styles.optionCopy}><Text style={[styles.optionTitle, { color: colors.text }]}>{title}</Text><Text style={[styles.optionText, { color: colors.textMuted }]}>{text}</Text></View><Ionicons name="chevron-forward" size={19} color={colors.textMuted} /></Pressable>;
  }

  function Field(props: { label: string; value: string; onChangeText: (value: string) => void; placeholder: string }) {
    return <View style={styles.field}><Text style={[styles.label, { color: colors.text }]}>{props.label}</Text><TextInput {...props} placeholderTextColor={colors.textMuted} style={[styles.input, { color: colors.text, backgroundColor: colors.surfaceElevated, borderColor: colors.border }]} /></View>;
  }

  function PrimaryButton({ label, busy: isBusy, disabled, onPress }: { label: string; busy: boolean; disabled: boolean; onPress: () => void }) {
    return <Pressable disabled={isBusy || disabled} onPress={onPress} style={[styles.primary, { backgroundColor: colors.primary }, (isBusy || disabled) && styles.disabled]}>{isBusy ? <ActivityIndicator color="#FFF" /> : <Text style={styles.primaryText}>{label}</Text>}</Pressable>;
  }
}

const styles = StyleSheet.create({
  safe: { flex: 1 }, content: { width: '100%', maxWidth: 520, minHeight: '100%', alignSelf: 'center', padding: 20, justifyContent: 'center' },
  brand: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, marginBottom: 20 }, icon: { width: 42, height: 42, borderRadius: 13 }, brandText: { fontSize: 24, fontWeight: '900' },
  card: { borderRadius: 30, borderWidth: StyleSheet.hairlineWidth, padding: 22, overflow: 'hidden' }, back: { flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start', marginBottom: 20 }, backText: { fontSize: 13, fontWeight: '900' },
  kicker: { fontSize: 10.5, fontWeight: '900', letterSpacing: 1.3 }, title: { marginTop: 10, fontSize: 32, lineHeight: 36, fontWeight: '900', letterSpacing: -1.1 }, subtitle: { marginTop: 10, fontSize: 14, lineHeight: 21 },
  options: { marginTop: 24, gap: 12 }, option: { minHeight: 88, borderRadius: 21, borderWidth: StyleSheet.hairlineWidth, padding: 13, flexDirection: 'row', alignItems: 'center', gap: 12 }, optionIcon: { width: 50, height: 50, borderRadius: 17, alignItems: 'center', justifyContent: 'center' }, optionCopy: { flex: 1 }, optionTitle: { fontSize: 15, fontWeight: '900' }, optionText: { marginTop: 3, fontSize: 11.5, lineHeight: 16 },
  form: { marginTop: 20, gap: 13 }, field: { gap: 7 }, label: { fontSize: 12, fontWeight: '900' }, input: { minHeight: 52, borderRadius: 17, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 14, fontSize: 14, fontWeight: '600' },
  segment: { flexDirection: 'row', gap: 8 }, segmentItem: { flex: 1, minHeight: 44, borderRadius: 15, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center' }, help: { fontSize: 12, lineHeight: 18 },
  primary: { minHeight: 55, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginTop: 5 }, primaryText: { color: '#FFF', fontSize: 14, fontWeight: '900' }, feedback: { marginTop: 15, fontSize: 12, lineHeight: 18, fontWeight: '700' },
  signOut: { minHeight: 42, alignItems: 'center', justifyContent: 'center', marginTop: 12 }, signOutText: { fontSize: 12, fontWeight: '800' }, disabled: { opacity: 0.48 }, pressed: { opacity: 0.72, transform: [{ scale: 0.985 }] },
});
