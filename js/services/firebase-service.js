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
      import(`https://www.gstatic.com/firebasejs/${firebaseSdkVersion}/firebase-app-check.js`).catch((error) => {
        console.warn("Firebase App Check indisponível neste carregamento.", error);
        return null;
      }),
    ])
      .then(([appModule, authModule, firestoreModule, appCheckModule]) => {
        const app = appModule.initializeApp(firebaseConfig);

        const appCheckStatus = {
          enabled: false,
          configured: false,
          provider: appCheckConfig?.provider || "none",
          reason: "site-key-pending",
        };

        try {
          const siteKey = String(appCheckConfig?.siteKey || "").trim();
          const hasRealSiteKey = Boolean(siteKey)
            && !siteKey.includes("COLE_A_SITE_KEY")
            && siteKey.length >= 20;

          if (appCheckConfig?.enabled && appCheckModule && hasRealSiteKey) {
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
            } else {
              appCheckStatus.reason = "provider-unavailable";
            }
          }
        } catch (error) {
          appCheckStatus.reason = "init-error";
          console.warn("Não foi possível iniciar o App Check. O app continuará sem enforcement local.", error);
        }
        const db = (() => {
          try {
            if (
              typeof firestoreModule.initializeFirestore === "function" &&
              typeof firestoreModule.persistentLocalCache === "function"
            ) {
              const cacheOptions = typeof firestoreModule.persistentMultipleTabManager === "function"
                ? { tabManager: firestoreModule.persistentMultipleTabManager() }
                : null;
              const localCache = cacheOptions
                ? firestoreModule.persistentLocalCache(cacheOptions)
                : firestoreModule.persistentLocalCache();
              return firestoreModule.initializeFirestore(app, { localCache });
            }
          } catch (error) {
            console.warn("Persistência offline do Firestore indisponível; usando cache padrão em memória.", error);
          }
          return firestoreModule.getFirestore(app);
        })();

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
    "auth/network-request-failed": "Falha de conexão. Verifique a internet.",
    "permission-denied": "Sem permissão no banco. Revise convites, membros da família ou regras do Firestore.",
    "resource-exhausted": "Não foi possível salvar. Os dados ficaram grandes demais para o Firestore.",
    "invalid-argument": "Não foi possível salvar. Revise os dados do perfil.",
    unavailable: "Firebase indisponível no momento. Tente novamente em alguns segundos.",
  };

  return messages[code] || "Não foi possível concluir a operação. Tente novamente.";
}
