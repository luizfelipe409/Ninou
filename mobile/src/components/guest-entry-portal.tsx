import Ionicons from '@expo/vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Image,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';

import { ActionArt } from '@/components/action-art';
import { NinouBackground } from '@/components/ninou-background';
import { useNinouAuth } from '@/state/auth-context';
import { useNinouTheme } from '@/theme/tokens';

type EntryView = 'landing' | 'login' | 'register' | 'invite';

function ThemeToggle() {
  const { isDark, setMode } = useNinouTheme();
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: isDark }}
      accessibilityLabel={isDark ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
      onPress={() => setMode(isDark ? 'light' : 'dark')}
      style={[styles.themeToggle, { backgroundColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(68,45,100,0.08)', borderColor: isDark ? 'rgba(255,255,255,0.18)' : 'rgba(68,45,100,0.12)' }]}>
      <Ionicons name={isDark ? 'moon' : 'sunny'} size={15} color={isDark ? '#F4E9C8' : '#7558E8'} />
      <Text style={[styles.themeText, { color: isDark ? '#F8F4FF' : '#4C3A62' }]}>{isDark ? 'Escuro' : 'Claro'}</Text>
      <View style={[styles.toggleTrack, { backgroundColor: isDark ? '#8C74E8' : '#DDD5EA', alignItems: isDark ? 'flex-end' : 'flex-start' }]}>
        <View style={styles.toggleKnob} />
      </View>
    </Pressable>
  );
}

function Brand({ lightPanel = false }: { lightPanel?: boolean }) {
  const { isDark } = useNinouTheme();
  return (
    <View style={styles.brand}>
      <Image source={require('../../assets/images/ninou-icon.png')} style={styles.brandIcon} />
      <Text style={[styles.brandName, { color: lightPanel || !isDark ? '#312244' : '#F8F4FF' }]}>Ninou</Text>
    </View>
  );
}

function DemoOrbit() {
  const { isDark } = useNinouTheme();
  const [pulse] = useState(() => new Animated.Value(0));
  const [rotation] = useState(() => new Animated.Value(0));

  useEffect(() => {
    const pulseLoop = Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1, duration: 2600, useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 0, duration: 2600, useNativeDriver: true }),
    ]));
    const orbitLoop = Animated.loop(Animated.timing(rotation, { toValue: 1, duration: 18000, useNativeDriver: true }));
    pulseLoop.start();
    orbitLoop.start();
    return () => { pulseLoop.stop(); orbitLoop.stop(); };
  }, [pulse, rotation]);

  const orbitTransform = [{ rotate: rotation.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) }];
  return (
    <View style={[styles.demoCard, { backgroundColor: isDark ? 'rgba(22,16,43,0.82)' : 'rgba(255,255,255,0.76)', borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(74,49,103,0.12)' }]}>
      <View style={styles.demoHead}>
        <View>
          <Text style={[styles.demoKicker, { color: isDark ? '#BBAEFF' : '#7558E8' }]}>AGORA NO NINOU</Text>
          <Text style={[styles.demoTitle, { color: isDark ? '#F8F4FF' : '#322443' }]}>O dia inteiro em uma órbita</Text>
        </View>
        <View style={[styles.livePill, { backgroundColor: isDark ? 'rgba(97,225,191,0.12)' : '#E5F8F1' }]}><View style={styles.liveDot} /><Text style={styles.liveText}>AO VIVO</Text></View>
      </View>
      <ImageBackground source={isDark ? require('../../assets/clock-themes/night-sky.png') : require('../../assets/clock-themes/day-sky.png')} resizeMode="cover" imageStyle={styles.demoOrbitImage} style={styles.demoOrbit}>
        <Text style={[styles.demoStar, { color: isDark ? '#FFF8E6' : '#B599E7' }]}>✦</Text>
        <Svg width={258} height={258} style={StyleSheet.absoluteFill}>
          <Circle cx={129} cy={129} r={94} fill="none" stroke={isDark ? 'rgba(91,51,194,0.2)' : 'rgba(255,255,255,0.34)'} strokeWidth={16} />
          <Circle cx={129} cy={129} r={94} fill="none" stroke={isDark ? 'rgba(155,117,255,0.68)' : 'rgba(255,255,255,0.9)'} strokeWidth={isDark ? 4.2 : 5.5} />
          <Circle cx={129} cy={129} r={94} fill="none" stroke={isDark ? '#A684FF' : '#7558E8'} strokeWidth={7} strokeLinecap="round" strokeDasharray="255 336" transform="rotate(-90 129 129)" opacity={0.72} />
        </Svg>
        <Animated.View style={[styles.demoPulse, { opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.2, 0.55] }), transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1.08] }) }] }]} />
        <View style={[styles.demoCore, { backgroundColor: isDark ? 'rgba(25,17,45,0.96)' : 'rgba(255,255,255,0.94)' }]}>
          <Text style={[styles.demoCoreLabel, { color: isDark ? '#B9A9FF' : '#7558E8' }]}>DORMINDO HÁ</Text>
          <Text style={[styles.demoClock, { color: isDark ? '#FFFFFF' : '#302142' }]}>01:24:08</Text>
          <Text style={[styles.demoHint, { color: isDark ? '#B7ADCA' : '#756985' }]}>A rotina acompanha a família em tempo real.</Text>
        </View>
        <View style={[styles.demoMarker, { left: 40, top: 43 }]}><ActionArt type="mamadeira" size={31} /></View>
        <View style={[styles.demoMarker, { right: 28, bottom: 67 }]}><ActionArt type="fralda" size={31} /></View>
        <Animated.View style={[styles.rotatingArm, { transform: orbitTransform }]}><View style={styles.orbitNow} /></Animated.View>
      </ImageBackground>
      <View style={styles.demoStats}>
        <View><Text style={[styles.statLabel, { color: isDark ? '#AFA5C1' : '#7A6D87' }]}>SONO HOJE</Text><Text style={[styles.statValue, { color: isDark ? '#F8F4FF' : '#342646' }]}>07h 42min</Text></View>
        <View><Text style={[styles.statLabel, { color: isDark ? '#AFA5C1' : '#7A6D87' }]}>ÚLTIMO CUIDADO</Text><Text style={[styles.statValue, { color: isDark ? '#F8F4FF' : '#342646' }]}>Mamadeira · 21:10</Text></View>
      </View>
    </View>
  );
}

export function NinouLoadingScreen() {
  const { isDark } = useNinouTheme();
  const [launchPulse] = useState(() => new Animated.Value(0));
  const [launchSpin] = useState(() => new Animated.Value(0));

  useEffect(() => {
    const pulseLoop = Animated.loop(Animated.sequence([
      Animated.timing(launchPulse, { toValue: 1, duration: 1450, useNativeDriver: true }),
      Animated.timing(launchPulse, { toValue: 0, duration: 1450, useNativeDriver: true }),
    ]));
    const spinLoop = Animated.loop(Animated.timing(launchSpin, { toValue: 1, duration: 9000, useNativeDriver: true }));
    pulseLoop.start();
    spinLoop.start();
    return () => { pulseLoop.stop(); spinLoop.stop(); };
  }, [launchPulse, launchSpin]);

  return (
    <SafeAreaView style={styles.loading}>
      <NinouBackground intense />
      <View style={styles.loadingContent}>
        <View style={styles.launchStage}>
          <Animated.View style={[styles.launchGlow, { backgroundColor: isDark ? 'rgba(132,103,241,0.22)' : 'rgba(117,88,232,0.16)', opacity: launchPulse.interpolate({ inputRange: [0, 1], outputRange: [0.42, 0.9] }), transform: [{ scale: launchPulse.interpolate({ inputRange: [0, 1], outputRange: [0.88, 1.14] }) }] }]} />
          <Animated.View style={[styles.launchRing, { borderColor: isDark ? 'rgba(203,188,255,0.26)' : 'rgba(117,88,232,0.2)', transform: [{ rotate: launchSpin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) }] }]}><View style={[styles.launchDot, { backgroundColor: isDark ? '#61E1BF' : '#35B997' }]} /></Animated.View>
          <Animated.View style={{ transform: [{ scale: launchPulse.interpolate({ inputRange: [0, 1], outputRange: [0.97, 1.04] }) }] }}><Image source={require('../../assets/images/ninou-icon.png')} style={styles.loadingIcon} /></Animated.View>
          <Animated.Text style={[styles.launchStar, styles.launchStarA, { opacity: launchPulse.interpolate({ inputRange: [0, 1], outputRange: [0.25, 1] }) }]}>✦</Animated.Text>
          <Animated.Text style={[styles.launchStar, styles.launchStarB, { opacity: launchPulse.interpolate({ inputRange: [0, 1], outputRange: [0.8, 0.22] }) }]}>✧</Animated.Text>
        </View>
        <Text style={[styles.loadingBrand, { color: isDark ? '#FFFFFF' : '#332446' }]}>NINOU</Text>
        <Text style={[styles.loadingTitle, { color: isDark ? '#FFFFFF' : '#332446' }]}>Seu cuidado, no tempo certo.</Text>
        <Text style={[styles.loadingText, { color: isDark ? '#C7BCD9' : '#756985' }]}>Preparando o diário da família…</Text>
        <View style={[styles.loadingTrack, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(74,49,103,0.1)' }]}><Animated.View style={[styles.loadingBar, { transform: [{ translateX: launchPulse.interpolate({ inputRange: [0, 1], outputRange: [-90, 90] }) }] }]}><LinearGradient colors={['rgba(141,116,239,0)', '#8D74EF', '#61E1BF', 'rgba(97,225,191,0)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} /></Animated.View></View>
        <View style={styles.loadingStatus}><View style={[styles.loadingStatusDot, { backgroundColor: isDark ? '#61E1BF' : '#35B997' }]} /><Text style={[styles.loadingStatusText, { color: isDark ? '#BDB2D2' : '#746985' }]}>Conta e família protegidas</Text></View>
      </View>
    </SafeAreaView>
  );
}

function LoginPanel({ onBack, mode, onMode }: { onBack: () => void; mode: Exclude<EntryView, 'landing'>; onMode: (mode: Exclude<EntryView, 'landing'>) => void }) {
  const { login, register, error, submitting, status } = useNinouAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const busy = submitting || status === 'loading' || status === 'resolving-family';
  const submit = async () => {
    if (!email.trim() || !password) return;
    if (mode === 'invite') await AsyncStorage.setItem('ninou.mobile.pending-invite.v1', inviteCode.trim().toUpperCase());
    if (mode === 'register') await register(email, password);
    else await login(email, password);
  };

  const copy = mode === 'register'
    ? { kicker: 'NOVA FAMÍLIA', title: 'Comece no Ninou', subtitle: 'Crie sua conta e, na próxima etapa, configure o bebê e a família.', button: 'Criar minha conta' }
    : mode === 'invite'
      ? { kicker: 'CONVITE FAMILIAR', title: 'Entre na família', subtitle: 'Use o e-mail que recebeu o convite e informe o código enviado pelo responsável.', button: 'Entrar e validar convite' }
      : { kicker: 'CONTA NINOU', title: 'Bem-vindo de volta', subtitle: 'Entre para acompanhar a rotina do bebê com toda a família.', button: 'Entrar no Ninou' };

  return (
    <SafeAreaView style={styles.loginSafe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.loginSafe}>
        <ScrollView contentContainerStyle={styles.loginContent} keyboardShouldPersistTaps="handled">
          <View style={styles.loginTop}>
            <Pressable accessibilityLabel="Voltar" onPress={onBack} style={styles.backButton}><Ionicons name="arrow-back" size={21} color="#39284D" /></Pressable>
            <Brand lightPanel />
            <View style={{ width: 44 }} />
          </View>
          <View style={styles.loginCopy}>
            <Text style={styles.loginKicker}>{copy.kicker}</Text>
            <Text style={styles.loginTitle}>{copy.title}</Text>
            <Text style={styles.loginSubtitle}>{copy.subtitle}</Text>
          </View>
          <View style={styles.form}>
            <Text style={styles.label}>E-mail</Text>
            <TextInput accessibilityLabel="E-mail" autoCapitalize="none" autoComplete="email" keyboardType="email-address" value={email} onChangeText={setEmail} placeholder="voce@exemplo.com" placeholderTextColor="#A89CAE" style={styles.input} />
            <Text style={styles.label}>Senha</Text>
            <TextInput accessibilityLabel="Senha" autoCapitalize="none" autoComplete="password" secureTextEntry value={password} onChangeText={setPassword} placeholder="Sua senha" placeholderTextColor="#A89CAE" style={styles.input} />
            {mode === 'invite' ? <><Text style={styles.label}>Código do convite</Text><TextInput accessibilityLabel="Código do convite" autoCapitalize="characters" value={inviteCode} onChangeText={setInviteCode} placeholder="Ex.: ABCD2345" placeholderTextColor="#A89CAE" style={styles.input} /></> : null}
            <Text style={styles.formHint}>{mode === 'register' ? 'Use uma senha com pelo menos 6 caracteres.' : 'Use a mesma conta do Ninou webapp.'}</Text>
            {error ? <View accessibilityLiveRegion="polite" style={styles.loginErrorCard}><View style={styles.loginErrorIcon}><Ionicons name="alert-circle" size={19} color="#BE4F61" /></View><View style={styles.loginErrorCopy}><Text style={styles.loginErrorTitle}>Não foi possível entrar</Text><Text style={styles.loginError}>{error}</Text></View></View> : null}
            <Pressable disabled={busy || !email.trim() || password.length < 6 || (mode === 'invite' && !inviteCode.trim())} onPress={() => void submit()} style={({ pressed }) => [styles.loginButton, (busy || !email.trim() || password.length < 6 || (mode === 'invite' && !inviteCode.trim())) && styles.disabled, pressed && styles.pressed]}>
              {busy ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.loginButtonText}>{copy.button}</Text>}
            </Pressable>
          </View>
          <View style={styles.loginFooter}>
            <Text style={styles.footerText}>{mode === 'register' ? 'Já tem uma conta?' : mode === 'invite' ? 'O e-mail convidado ainda não tem conta?' : 'Ainda não tem uma conta?'}</Text>
            <Pressable onPress={() => { if (mode === 'invite') void AsyncStorage.setItem('ninou.mobile.pending-invite.v1', inviteCode.trim().toUpperCase()); onMode(mode === 'register' ? 'login' : 'register'); }}><Text style={styles.footerLink}>{mode === 'register' ? 'Entrar na minha conta' : mode === 'invite' ? 'Criar conta e continuar com o convite' : 'Criar minha família no Ninou'}</Text></Pressable>
            <Text style={styles.legal}>Ao continuar, você concorda com os Termos de Uso e a Política de Privacidade.</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export function GuestEntryPortal() {
  const { colors, isDark } = useNinouTheme();
  const [view, setView] = useState<EntryView>('landing');
  if (view !== 'landing') return <LoginPanel mode={view} onMode={setView} onBack={() => setView('landing')} />;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <NinouBackground intense />
      <ScrollView contentContainerStyle={styles.landingContent} showsVerticalScrollIndicator={false}>
        <View style={styles.entryHeader}><Brand /><ThemeToggle /></View>
        <View style={styles.hero}>
          <Text style={[styles.kicker, { color: isDark ? '#B9A9FF' : '#7558E8' }]}>ROTINA EM FAMÍLIA, NO TEMPO CERTO</Text>
          <Text style={[styles.heroTitle, { color: colors.text }]}>Mais presença.{`\n`}Menos preocupação.</Text>
          <Text style={[styles.heroSubtitle, { color: colors.textMuted }]}>Sono, mamadas, fraldas e cuidados reunidos em uma linha do tempo viva — sincronizada para quem cuida.</Text>
          <View style={styles.actions}>
            <Pressable onPress={() => setView('register')} style={({ pressed }) => [styles.primaryCta, pressed && styles.pressed]}><Text style={styles.primaryCtaText}>Começar minha família</Text><Ionicons name="arrow-forward" size={19} color="#FFFFFF" /></Pressable>
            <Pressable onPress={() => setView('login')} style={({ pressed }) => [styles.secondaryCta, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.7)', borderColor: isDark ? 'rgba(255,255,255,0.16)' : 'rgba(67,45,92,0.16)' }, pressed && styles.pressed]}><Text style={[styles.secondaryText, { color: colors.text }]}>Já tenho uma conta</Text></Pressable>
            <Pressable onPress={() => setView('invite')} style={styles.inviteLink}><Text style={[styles.inviteText, { color: isDark ? '#C7BBFA' : '#6D50C8' }]}>✦ Recebi um convite familiar</Text></Pressable>
          </View>
          <View style={styles.trustRow}>
            {['Dados sincronizados', 'Feito para a família', 'Leve e acolhedor'].map((item) => <View key={item} style={styles.trustItem}><Ionicons name="checkmark-circle" size={17} color={isDark ? '#61E1BF' : '#35A98B'} /><Text style={[styles.trustText, { color: colors.textMuted }]}>{item}</Text></View>)}
          </View>
        </View>
        <DemoOrbit />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  landingContent: { width: '100%', maxWidth: 540, alignSelf: 'center', paddingHorizontal: 20, paddingBottom: 60 },
  entryHeader: { height: 62, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  brandIcon: { width: 34, height: 34, borderRadius: 11 },
  brandName: { fontSize: 21, fontWeight: '900', letterSpacing: -0.6 },
  themeToggle: { height: 38, borderRadius: 19, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', gap: 6 },
  themeText: { fontSize: 11, fontWeight: '800' },
  toggleTrack: { width: 28, height: 16, borderRadius: 8, justifyContent: 'center', paddingHorizontal: 2 },
  toggleKnob: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#FFFFFF' },
  hero: { paddingTop: 44 },
  kicker: { fontSize: 11, lineHeight: 16, fontWeight: '900', letterSpacing: 1.35 },
  heroTitle: { marginTop: 16, fontSize: 45, lineHeight: 47, fontWeight: '900', letterSpacing: -2.2 },
  heroSubtitle: { marginTop: 18, maxWidth: 430, fontSize: 16, lineHeight: 24, fontWeight: '600' },
  actions: { marginTop: 28, gap: 11 },
  primaryCta: { minHeight: 58, borderRadius: 19, backgroundColor: '#7558E8', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 11, paddingHorizontal: 20 },
  primaryCtaText: { color: '#FFFFFF', fontSize: 15, fontWeight: '900' },
  secondaryCta: { minHeight: 54, borderRadius: 19, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center' },
  secondaryText: { fontSize: 14, fontWeight: '900' },
  inviteLink: { minHeight: 42, alignItems: 'center', justifyContent: 'center' },
  inviteText: { fontSize: 13, fontWeight: '800' },
  trustRow: { marginTop: 20, flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  trustItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  trustText: { fontSize: 11, fontWeight: '700' },
  demoCard: { marginTop: 45, borderRadius: 28, borderWidth: StyleSheet.hairlineWidth, padding: 14, overflow: 'hidden' },
  demoHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 12 },
  demoKicker: { fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  demoTitle: { marginTop: 3, fontSize: 15, fontWeight: '900' },
  livePill: { borderRadius: 99, paddingHorizontal: 8, paddingVertical: 6, flexDirection: 'row', alignItems: 'center', gap: 5 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#48C9A5' },
  liveText: { color: '#48C9A5', fontSize: 8, fontWeight: '900' },
  demoOrbit: { width: 258, height: 258, alignSelf: 'center', borderRadius: 129, overflow: 'hidden' }, demoOrbitImage: { borderRadius: 129 },
  demoStar: { position: 'absolute', left: 42, top: 47, fontSize: 18 },
  demoPulse: { position: 'absolute', width: 140, height: 140, borderRadius: 70, left: 59, top: 59, backgroundColor: 'rgba(117,88,232,0.22)' },
  demoCore: { position: 'absolute', width: 176, height: 104, borderRadius: 52, left: 41, top: 77, alignItems: 'center', justifyContent: 'center', padding: 9 },
  demoCoreLabel: { fontSize: 8, fontWeight: '900', letterSpacing: 1 },
  demoClock: { fontSize: 25, lineHeight: 29, fontWeight: '900', letterSpacing: -1.2, fontVariant: ['tabular-nums'] },
  demoHint: { maxWidth: 125, fontSize: 7.5, lineHeight: 10, fontWeight: '700', textAlign: 'center' },
  demoMarker: { position: 'absolute', width: 35, height: 35, borderRadius: 18, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  rotatingArm: { position: 'absolute', width: 188, height: 188, left: 35, top: 35 },
  orbitNow: { position: 'absolute', width: 12, height: 12, borderRadius: 6, left: 88, top: -5, backgroundColor: '#61E1BF', borderWidth: 2, borderColor: '#FFFFFF' },
  demoStats: { flexDirection: 'row', justifyContent: 'space-between', gap: 18, paddingHorizontal: 4, paddingTop: 14 },
  statLabel: { fontSize: 8, fontWeight: '900', letterSpacing: 0.8 },
  statValue: { marginTop: 3, fontSize: 11, fontWeight: '800' },
  loginSafe: { flex: 1, backgroundColor: '#FBFAFC' },
  loginContent: { width: '100%', maxWidth: 500, minHeight: '100%', alignSelf: 'center', paddingHorizontal: 23, paddingBottom: 40 },
  loginTop: { height: 72, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#F0EAF5', alignItems: 'center', justifyContent: 'center' },
  loginCopy: { marginTop: 48 },
  loginKicker: { color: '#7558E8', fontSize: 11, fontWeight: '900', letterSpacing: 1.3 },
  loginTitle: { color: '#302142', marginTop: 12, fontSize: 36, lineHeight: 40, fontWeight: '900', letterSpacing: -1.3 },
  loginSubtitle: { color: '#756985', marginTop: 12, fontSize: 15, lineHeight: 22, fontWeight: '600' },
  form: { marginTop: 35 },
  label: { color: '#42344F', fontSize: 13, fontWeight: '800', marginBottom: 8, marginTop: 14 },
  input: { height: 56, borderRadius: 17, borderWidth: 1, borderColor: '#DED5E6', backgroundColor: '#FFFFFF', paddingHorizontal: 16, color: '#302142', fontSize: 15, fontWeight: '600' },
  formHint: { color: '#86798E', marginTop: 10, fontSize: 11.5, lineHeight: 17 },
  loginErrorCard: { marginTop: 14, borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(190,79,97,0.28)', backgroundColor: 'rgba(190,79,97,0.07)', padding: 11, flexDirection: 'row', alignItems: 'flex-start', gap: 9 },
  loginErrorIcon: { width: 32, height: 32, borderRadius: 11, backgroundColor: 'rgba(190,79,97,0.1)', alignItems: 'center', justifyContent: 'center' },
  loginErrorCopy: { flex: 1 },
  loginErrorTitle: { color: '#8E3343', fontSize: 12, lineHeight: 16, fontWeight: '900' },
  loginError: { color: '#A74758', marginTop: 1, fontSize: 11.5, lineHeight: 16, fontWeight: '700' },
  loginButton: { minHeight: 58, marginTop: 24, borderRadius: 18, backgroundColor: '#7558E8', alignItems: 'center', justifyContent: 'center' },
  loginButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '900' },
  disabled: { opacity: 0.5 },
  loginFooter: { marginTop: 34, alignItems: 'center', gap: 5 },
  footerText: { color: '#756985', fontSize: 13 },
  footerLink: { color: '#7558E8', fontSize: 13, fontWeight: '800' },
  legal: { color: '#94899A', maxWidth: 340, marginTop: 18, fontSize: 10.5, lineHeight: 16, textAlign: 'center' },
  loading: { flex: 1 },
  loadingContent: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  launchStage: { width: 170, height: 170, alignItems: 'center', justifyContent: 'center' }, launchGlow: { position: 'absolute', width: 140, height: 140, borderRadius: 70 }, launchRing: { position: 'absolute', width: 156, height: 156, borderRadius: 78, borderWidth: 1 }, launchDot: { position: 'absolute', width: 10, height: 10, borderRadius: 5, top: -5, left: 72, shadowColor: '#61E1BF', shadowOpacity: 0.8, shadowRadius: 8 }, launchStar: { position: 'absolute', color: '#FFF4D4' }, launchStarA: { left: 7, top: 47, fontSize: 19 }, launchStarB: { right: 10, bottom: 43, fontSize: 15 },
  loadingIcon: { width: 92, height: 92, borderRadius: 29, shadowColor: '#06030D', shadowOpacity: 0.28, shadowRadius: 20, shadowOffset: { width: 0, height: 12 } },
  loadingBrand: { marginTop: 12, fontSize: 12, fontWeight: '900', letterSpacing: 4.5 },
  loadingTitle: { marginTop: 24, fontSize: 22, lineHeight: 28, fontWeight: '900', textAlign: 'center' },
  loadingText: { marginTop: 8, fontSize: 13, fontWeight: '600' },
  loadingTrack: { width: 230, height: 6, marginTop: 28, borderRadius: 4, overflow: 'hidden' },
  loadingBar: { width: 150, height: '100%', borderRadius: 4, alignSelf: 'center', overflow: 'hidden' },
  loadingStatus: { marginTop: 17, flexDirection: 'row', alignItems: 'center', gap: 7 }, loadingStatusDot: { width: 6, height: 6, borderRadius: 3 }, loadingStatusText: { fontSize: 10.5, fontWeight: '700' },
  pressed: { opacity: 0.76, transform: [{ scale: 0.985 }] },
});
