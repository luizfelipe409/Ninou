export const storageKeys = Object.freeze({
  photo: "ninou.demo.profilePhoto",
  email: "ninou.demo.email",
  wakeWindow: "ninou.demo.wakeWindow",
  profile: "ninou.demo.profile",
  profileVersion: "ninou.demo.profileVersion",
  dayState: "ninou.demo.dayState",
  themeMode: "ninou.demo.themeMode",
  weights: "ninou.demo.weights",
  access: "ninou.demo.access",
  pendingInvite: "ninou.demo.pendingInvite",
  dataOwnerEmail: "ninou.demo.dataOwnerEmail",
});

export const firebaseConfig = Object.freeze({
  apiKey: "AIzaSyAlGGx3z6kDWk4vsgBjSH2BDkDQwPoZlAM",
  authDomain: "ninou-3c936.firebaseapp.com",
  projectId: "ninou-3c936",
  storageBucket: "ninou-3c936.firebasestorage.app",
  messagingSenderId: "18333404018",
  appId: "1:18333404018:web:6faefb89f2e79e737c6beb",
  measurementId: "G-WPEYS3SH60",
});

export const firebaseSdkVersion = "10.12.4";

// v75.75.23 — App Check opcional durante desenvolvimento/testes.
// O Ninou continua protegido por Firebase Authentication + Firestore Rules.
// Deixe `enabled: false` enquanto o App Check estiver apenas em monitoramento
// ou enquanto a chave reCAPTCHA Enterprise ainda gerar 401 no navegador.
// Quando o fluxo principal estiver validado e o App Check estiver sem erros,
// troque para `enabled: true` antes de ativar enforcement no Firebase.
export const appCheckConfig = Object.freeze({
  enabled: false,
  provider: "recaptcha-enterprise",
  siteKey: "6LdizUItAAAAACvIWR7t2EVC5mJHIr4QXMMxa9YX",
});


export const hour = 60 * 60 * 1000;
export const day = 24 * hour;
