import { appCheckConfig, firebaseConfig, firebaseSdkVersion } from "../config/constants.js";

let firebaseServices = null;
let firebaseServicesPromise = null;

export async function getFirebaseServices() {
  if (firebaseServices) return firebaseServices;

  if (!firebaseServicesPromise) {
    firebaseServicesPromise = Promise.all([
      import(`https://www.gstatic.com/firebasejs/${firebaseSdkVersion}/firebase-app.js`),
      import(`https://www.gstatic.com/firebasejs/${firebaseSdkVersion}/firebase-auth.js`),
      import(`https://www.gstatic.com/firebasejs/${firebaseSdkVersion}/firebase-firestore.js`),
    ])
      .then(([appModule, authModule, firestoreModule]) => {
        const app = appModule.initializeApp(firebaseConfig);

        const appCheckStatus = {
          enabled: Boolean(appCheckConfig?.enabled),
          configured: false,
          provider: appCheckConfig?.provider || "none",
          reason: "scheduled",
        };

        /*
          v75.60.10 — App Check não bloqueante:
          o login não deve esperar o download/inicialização do módulo de App Check.
          Como o Firebase Console ainda está em modo Monitorando, o app pode abrir Auth/Firestore
          primeiro e inicializar App Check em paralelo. Só ative enforcement após validar que
          appCheckStatus ficou "active" no diagnóstico.
        */
        const ensureBrowserProcessShim = () => {
          /*
            v75.60.10 — correção App Check/reCAPTCHA Enterprise em PWA sem bundler.
            Algumas dependências do módulo CDN do App Check consultam `process.env`.
            Em navegador puro/iPhone/Safari, `process` não existe e gerava:
            ReferenceError: process is not defined.
            O shim abaixo é mínimo, não expõe segredo e evita que a falha do App Check
            prejudique login/Auth/Firestore enquanto o Firebase está em modo Monitorando.
          */
          try {
            if (typeof globalThis.process === "undefined") {
              Object.defineProperty(globalThis, "process", {
                value: { env: {} },
                configurable: true,
                writable: true,
              });
            } else if (!globalThis.process.env) {
              globalThis.process.env = {};
            }
          } catch (_) {
            // Se o navegador bloquear a definição, o App Check apenas ficará em monitoramento pendente.
          }
        };

        const startAppCheckInBackground = () => {
          const siteKey = String(appCheckConfig?.siteKey || "").trim();
          const hasRealSiteKey = Boolean(siteKey)
            && !siteKey.includes("COLE_A_SITE_KEY")
            && siteKey.length >= 20;

          if (!appCheckConfig?.enabled) {
            appCheckStatus.enabled = false;
            appCheckStatus.configured = false;
            appCheckStatus.reason = "optional-disabled";
            return;
          }

          if (!hasRealSiteKey) {
            appCheckStatus.enabled = false;
            appCheckStatus.configured = false;
            appCheckStatus.reason = "site-key-pending";
            return;
          }

          ensureBrowserProcessShim();
          appCheckStatus.reason = "loading";

          const timeout = new Promise((resolve) => {
            window.setTimeout(() => resolve(null), 6500);
          });

          const loadAppCheck = import(`https://www.gstatic.com/firebasejs/${firebaseSdkVersion}/firebase-app-check.js`)
            .then((appCheckModule) => {
              const Provider = appCheckModule.ReCaptchaEnterpriseProvider || appCheckModule.ReCaptchaV3Provider;
              if (typeof Provider === "function" && typeof appCheckModule.initializeAppCheck === "function") {
                const appCheck = appCheckModule.initializeAppCheck(app, {
                  provider: new Provider(siteKey),
                  isTokenAutoRefreshEnabled: true,
                });
                appCheckStatus.enabled = true;
                appCheckStatus.configured = true;
                appCheckStatus.reason = "active";
                appCheckStatus.instance = appCheck;
                return appCheck;
              }
              appCheckStatus.reason = "provider-unavailable";
              return null;
            });

          Promise.race([loadAppCheck, timeout])
            .then((result) => {
              if (!result && appCheckStatus.reason === "loading") {
                appCheckStatus.reason = "timeout-monitoring";
              }
            })
            .catch((error) => {
              appCheckStatus.reason = "init-error-monitoring";
              console.warn("Firebase App Check não foi inicializado neste carregamento. O app continuará em modo monitorado.", error);
            });
        };

        const db = (() => {
          try {
            /*
              v75.59.2 — evitar dados fantasma e login lento:
              o Firestore não precisa manter cache persistente em IndexedDB porque o Ninou já tem
              cache local próprio por família + dia. O cache persistente podia exibir dados antigos
              imediatamente após o login e atrasar a troca de contexto entre contas/famílias.
            */
            if (
              typeof firestoreModule.initializeFirestore === "function" &&
              typeof firestoreModule.memoryLocalCache === "function"
            ) {
              return firestoreModule.initializeFirestore(app, {
                localCache: firestoreModule.memoryLocalCache(),
              });
            }
          } catch (error) {
            console.warn("Cache em memória do Firestore indisponível; usando configuração padrão.", error);
          }
          return firestoreModule.getFirestore(app);
        })();

        // Não bloqueia Auth/Firestore. O App Check entra alguns instantes depois do app responder ao usuário.
        if (typeof window !== "undefined") {
          window.setTimeout(startAppCheckInBackground, 1800);
        }

        firebaseServices = {
          auth: authModule.getAuth(app),
          appCheckStatus,
          createUserWithEmailAndPassword: authModule.createUserWithEmailAndPassword,
          signInWithEmailAndPassword: authModule.signInWithEmailAndPassword,
          signOut: authModule.signOut,
          onAuthStateChanged: authModule.onAuthStateChanged,
          db,
          doc: firestoreModule.doc,
          collection: firestoreModule.collection,
          collectionGroup: firestoreModule.collectionGroup,
          setDoc: firestoreModule.setDoc,
          getDoc: firestoreModule.getDoc,
          getDocs: firestoreModule.getDocs,
          updateDoc: firestoreModule.updateDoc,
          query: firestoreModule.query,
          where: firestoreModule.where,
          orderBy: firestoreModule.orderBy,
          limit: firestoreModule.limit,
          onSnapshot: firestoreModule.onSnapshot,
          runTransaction: firestoreModule.runTransaction,
          serverTimestamp: firestoreModule.serverTimestamp,
        };

        return firebaseServices;
      })
      .catch((error) => {
        firebaseServicesPromise = null;
        console.error("Erro ao carregar Firebase:", error);
        throw error;
      });
  }

  return firebaseServicesPromise;
}

export function getFirebaseErrorMessage(error) {
  const code = error?.code || "";

  const messages = {
    "auth/email-already-in-use": "Este e-mail já tem uma conta. Toque em Entrar.",
    "auth/invalid-email": "Digite um e-mail válido.",
    "auth/user-not-found": "Conta não encontrada. Crie uma conta nova.",
    "auth/wrong-password": "Senha incorreta.",
    "auth/invalid-credential": "E-mail ou senha incorretos.",
    "auth/weak-password": "A senha precisa ter pelo menos 6 caracteres.",
    "auth/operation-not-allowed": "Ative Email/Password no Firebase Authentication.",
    "auth/network-request-failed": "Não foi possível concluir o login agora. Atualize a página e tente novamente. Se persistir, limpe o PWA/cache do Ninou.",
    "permission-denied": "Você não tem permissão para fazer isso nesta família. Confira se o convite foi aceito e se seu acesso ainda está ativo.",
    "not-found": "Não encontrei esse dado no Firebase. Atualize o painel ou peça um novo convite.",
    "cancelled": "A operação foi interrompida. Verifique sua conexão e tente novamente.",
    "deadline-exceeded": "O Firebase demorou para responder. Tente novamente em alguns segundos.",
    "resource-exhausted": "Não foi possível salvar. Os dados ficaram grandes demais para o Firestore.",
    "invalid-argument": "Não foi possível salvar. Revise os dados preenchidos.",
    unavailable: "Firebase indisponível no momento. Tente novamente em alguns segundos.",
  };

  const text = String(error?.message || "");
  if (/insufficient permissions|permission denied/i.test(text)) return messages["permission-denied"];
  if (/network|failed to fetch/i.test(text)) return messages["auth/network-request-failed"];

  return messages[code] || "Não foi possível concluir a operação. Tente novamente. Se continuar, atualize a página e verifique o acesso familiar.";
}
