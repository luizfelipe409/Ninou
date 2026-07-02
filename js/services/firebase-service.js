import { firebaseConfig, firebaseSdkVersion } from "../config/constants.js";

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

        firebaseServices = {
          auth: authModule.getAuth(app),
          createUserWithEmailAndPassword: authModule.createUserWithEmailAndPassword,
          signInWithEmailAndPassword: authModule.signInWithEmailAndPassword,
          signOut: authModule.signOut,
          onAuthStateChanged: authModule.onAuthStateChanged,
          db: firestoreModule.getFirestore(app),
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
    "resource-exhausted": "Não foi possível salvar. A foto ou os dados ficaram grandes demais para o Firestore.",
    "invalid-argument": "Não foi possível salvar. Revise a foto ou os dados do perfil.",
    unavailable: "Firebase indisponível no momento. Tente novamente em alguns segundos.",
  };

  return messages[code] || "Não foi possível concluir a operação. Tente novamente.";
}
