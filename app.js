const navButtons = document.querySelectorAll(".bottom-nav button");
const screens = document.querySelectorAll(".screen");
const wakeAction = document.querySelector("#wakeAction");
const wakeActionLabel = document.querySelector("#wakeActionLabel");
const wakeActionIcon = wakeAction.querySelector(".action-icon");
const startChoice = document.querySelector("#startChoice");
const startModeButtons = document.querySelectorAll("[data-start-mode]");
const stateLabel = document.querySelector("#stateLabel");
const stateClock = document.querySelector("#stateClock");
const stateHint = document.querySelector("#stateHint");
const orbitEvents = document.querySelector("#orbitEvents");
const sheet = document.querySelector("#recordSheet");
const sheetBackdrop = document.querySelector("#sheetBackdrop");
const closeSheetButton = document.querySelector("#closeSheet");
const openSheetButtons = document.querySelectorAll("[data-open-sheet]");
const sheetTypeButtons = document.querySelectorAll("[data-sheet-type]");
const sheetTitle = document.querySelector("#sheetTitle");
const sheetDetailLabel = document.querySelector("#sheetDetailLabel");
const sheetDetail = document.querySelector("#sheetDetail");
const sheetAmountField = document.querySelector("#sheetAmountField");
const sheetDateInput = document.querySelector('.record-form input[type="datetime-local"]');
const sheetAmountInput = sheetAmountField.querySelector("input");
const sheetNotesInput = document.querySelector(".record-form textarea");
const shortcutButtons = document.querySelectorAll("[data-target-shortcut]");
const diaryFilterButtons = document.querySelectorAll("[data-diary-filter]");
const timeline = document.querySelector(".timeline");
const diaryDateInput = document.querySelector("#diaryDateInput");
const diaryDateTitle = document.querySelector("#diaryDateTitle");
const diaryDateHint = document.querySelector("#diaryDateHint");
const saveButton = document.querySelector(".save-button");
const diaryTitle = document.querySelector("#diaryTitle");
const babyAgeLine = document.querySelector("#babyAgeLine");
const profileBabyName = document.querySelector("#profileBabyName");
const profileBabyAge = document.querySelector("#profileBabyAge");
const babyNameInput = document.querySelector("#babyNameInput");
const babyArticleInput = document.querySelector("#babyArticleInput");
const babyBirthInput = document.querySelector("#babyBirthInput");
const profilePhotoInput = document.querySelector("#profilePhotoInput");
const profileImages = document.querySelectorAll("#profilePhoto, .identity img");
const loginEmail = document.querySelector("#loginEmail");
const loginPassword = document.querySelector("#loginPassword");
const loginButton = document.querySelector("#loginButton");
const createAccountButton = document.querySelector("#createAccountButton");
const loginHelper = document.querySelector("#loginHelper");
const resetDataButton = document.querySelector("#resetDataButton");
const exportJsonButton = document.querySelector("#exportJsonButton");
const exportCsvButton = document.querySelector("#exportCsvButton");
const syncPill = document.querySelector(".sync-pill");
const syncStatusTitle = document.querySelector("#syncStatusTitle");
const syncStatusText = document.querySelector("#syncStatusText");
const wakeWindowInput = document.querySelector("#wakeWindowInput");
const wakeWindowValue = document.querySelector("#wakeWindowValue");
const sleepAverage = document.querySelector("#sleepAverage");
const sleepAverageHint = document.querySelector("#sleepAverageHint");
const napAverage = document.querySelector("#napAverage");
const napAverageHint = document.querySelector("#napAverageHint");
const sleepBars = document.querySelector("#sleepBars");
const bestWindow = document.querySelector("#bestWindow");
const bestWindowHint = document.querySelector("#bestWindowHint");
const routineStatus = document.querySelector("#routineStatus");
const routineHint = document.querySelector("#routineHint");

const storageKeys = {
  photo: "ninou.demo.profilePhoto",
  email: "ninou.demo.email",
  wakeWindow: "ninou.demo.wakeWindow",
  profile: "ninou.demo.profile",
  profileVersion: "ninou.demo.profileVersion",
  dayState: "ninou.demo.dayState",
};

const firebaseConfig = {
  apiKey: "AIzaSyAlGGx3z6kDWk4vsgBjSH2BDkDQwPoZlAM",
  authDomain: "ninou-3c936.firebaseapp.com",
  projectId: "ninou-3c936",
  storageBucket: "ninou-3c936.firebasestorage.app",
  messagingSenderId: "18333404018",
  appId: "1:18333404018:web:6faefb89f2e79e737c6beb",
  measurementId: "G-WPEYS3SH60",
};

const firebaseSdkVersion = "10.12.4";

const typeConfig = {
  sono: {
    title: "Soneca",
    label: "Detalhes da soneca",
    options: ["No berço", "Amamentação", "Colo", "Carrinho de bebê", "Mamadeira", "Cama"],
    amount: false,
    arcType: "sleep",
    icon: '<svg><use href="#ux-moon"></use></svg>',
  },
  dormir: {
    title: "Noite",
    label: "Detalhes do sono",
    options: ["Não se aplica"],
    amount: false,
    arcType: "dormir",
    icon: '<svg><use href="#ux-night"></use></svg>',
  },
  "despertar-noturno": {
    title: "Despertar noturno",
    label: "Humor ao acordar",
    options: ["Mau humor", "Neutro(a)", "Bom humor"],
    amount: false,
    arcType: "despertar-noturno",
    icon: '<svg><use href="#ux-wake"></use></svg>',
  },
  amamentacao: {
    title: "Amamentação",
    label: "Lado",
    options: ["Esquerdo", "Direito", "Ambos"],
    amount: false,
    arcType: "amamentacao",
    icon: '<svg><use href="#ux-feed"></use></svg>',
  },
  mamadeira: {
    title: "Mamadeira",
    label: "Tipo de leite",
    options: ["Leite materno", "Fórmula", "Misto"],
    amount: true,
    arcType: "mamadeira",
    icon: '<svg><use href="#ux-bottle"></use></svg>',
  },
  fralda: {
    title: "Fralda",
    label: "Tipo de fralda",
    options: ["Xixi", "Cocô", "Mista"],
    amount: false,
    arcType: "fralda",
    icon: '<svg><use href="#ux-diaper"></use></svg>',
  },
};

const hour = 60 * 60 * 1000;
const day = 24 * hour;

let currentSheetType = "sono";
let currentEditingEventId = null;
let currentDiaryFilter = "all";
let selectedDiaryDay = null;
let wakeWindowMinutes = Number(localStorage.getItem(storageKeys.wakeWindow)) || 70;
let babyProfile = loadBabyProfile();
let currentProfilePhoto = localStorage.getItem(storageKeys.photo) || "";
let profileClientUpdatedAt = Number(localStorage.getItem(storageKeys.profileVersion)) || 0;
let firebaseServices = null;
let firebaseServicesPromise = null;
let cloudUser = null;
let profileUnsubscribe = null;
let dayUnsubscribe = null;
let profileCloudSaveTimer = null;
let dayCloudSaveTimer = null;
let applyingCloudState = false;
let pendingProfilePhotoSave = false;
let state = loadLocalDayState();

function createEmptyDayState() {
  return {
    mode: "idle",
    activeStartedAt: null,
    events: [],
  };
}

function makeEvent(type, start, end = start, detail = "", notes = "") {
  return {
    id: `${type}-${Math.round(start)}-${Math.random().toString(36).slice(2, 8)}`,
    type,
    start,
    end,
    detail,
    notes,
  };
}

function normalizeEvent(event = {}) {
  const type = typeof event.type === "string" && typeConfig[event.type] ? event.type : "sono";
  const start = Number(event.start);
  const end = Number(event.end);

  if (!Number.isFinite(start)) return null;

  return {
    id: typeof event.id === "string" ? event.id : `${type}-${Math.round(start)}-${Math.random().toString(36).slice(2, 8)}`,
    type,
    start,
    end: Number.isFinite(end) ? end : start,
    detail: typeof event.detail === "string" ? event.detail : "",
    notes: typeof event.notes === "string" ? event.notes : "",
  };
}

function normalizeDayState(dayState = {}) {
  const validModes = ["idle", "awake", "sleeping"];
  const mode = validModes.includes(dayState.mode) ? dayState.mode : "idle";
  const activeStartedAt = Number(dayState.activeStartedAt);

  return {
    mode,
    activeStartedAt: mode === "idle" || !Number.isFinite(activeStartedAt) ? null : activeStartedAt,
    events: Array.isArray(dayState.events) ? dayState.events.map(normalizeEvent).filter(Boolean) : [],
  };
}

function loadLocalDayState() {
  try {
    return normalizeDayState(JSON.parse(localStorage.getItem(storageKeys.dayState) || "{}"));
  } catch {
    return createEmptyDayState();
  }
}

function saveLocalDayState() {
  localStorage.setItem(storageKeys.dayState, JSON.stringify(normalizeDayState(state)));
}

function isLoggedIn() {
  return Boolean(cloudUser);
}

function requireLogin(actionText = "salvar dados") {
  if (isLoggedIn()) return true;
  closeSheet();
  showScreen("profile");
  setSyncStatus("offline");
  loginHelper.textContent = `Entre com e-mail e senha para ${actionText}.`;
  return false;
}

function saveDayState() {
  if (!isLoggedIn() && !applyingCloudState) return;
  saveLocalDayState();
  scheduleDayCloudSave();
}

function formatDuration(ms) {
  const safeMs = Math.max(0, ms);
  const totalSeconds = Math.floor(safeMs / 1000);
  const hoursValue = Math.floor(totalSeconds / 3600);
  const minutesValue = Math.floor((totalSeconds % 3600) / 60);
  const secondsValue = totalSeconds % 60;
  const pad = (value) => String(value).padStart(2, "0");
  return `${pad(hoursValue)}:${pad(minutesValue)}:${pad(secondsValue)}`;
}

function formatShortDuration(ms) {
  const safeMs = Math.max(0, ms);
  const minutes = Math.round(safeMs / 60000);
  if (minutes < 60) return `${minutes} min`;
  const hoursValue = Math.floor(minutes / 60);
  const minutesValue = minutes % 60;
  return minutesValue ? `${hoursValue}h ${String(minutesValue).padStart(2, "0")}` : `${hoursValue}h`;
}

function formatTime(timestamp) {
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(timestamp));
}

function formatEventMeta(event) {
  const duration = event.end > event.start ? formatShortDuration(event.end - event.start) : "";
  const timeText = isSleepEvent(event) && event.end > event.start
    ? `${formatTime(event.start)}-${formatTime(event.end)}`
    : formatTime(event.start);
  return [timeText, duration, event.detail].filter(Boolean).join(" • ");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function toDateTimeInputValue(timestamp = Date.now()) {
  const date = new Date(timestamp);
  const timezoneOffset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - timezoneOffset).toISOString().slice(0, 16);
}

function toDateInputValue(timestamp = Date.now()) {
  const date = new Date(timestamp);
  const timezoneOffset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - timezoneOffset).toISOString().slice(0, 10);
}

function getDefaultBabyProfile() {
  return {
    name: "",
    article: "do",
    birthDate: "",
  };
}

function normalizeBabyProfile(profile = {}) {
  return {
    name: typeof profile.name === "string" ? profile.name : "",
    article: profile.article === "da" ? "da" : "do",
    birthDate: typeof profile.birthDate === "string" ? profile.birthDate : "",
  };
}

function loadBabyProfile() {
  try {
    return normalizeBabyProfile({
      ...getDefaultBabyProfile(),
      ...JSON.parse(localStorage.getItem(storageKeys.profile) || "{}"),
    });
  } catch {
    return getDefaultBabyProfile();
  }
}

function saveBabyProfile() {
  if (!isLoggedIn() && !applyingCloudState) return;
  localStorage.setItem(storageKeys.profile, JSON.stringify(normalizeBabyProfile(babyProfile)));
  if (profileClientUpdatedAt) {
    localStorage.setItem(storageKeys.profileVersion, String(profileClientUpdatedAt));
  }
}

function markProfileLocallyChanged() {
  profileClientUpdatedAt = Math.max(Date.now(), profileClientUpdatedAt + 1);
  localStorage.setItem(storageKeys.profileVersion, String(profileClientUpdatedAt));
}

function ensureProfileVersion() {
  if (!profileClientUpdatedAt) {
    markProfileLocallyChanged();
  }
  return profileClientUpdatedAt;
}

function getCloudProfileVersion(data = {}) {
  const version = Number(data.clientUpdatedAt);
  return Number.isFinite(version) ? version : 0;
}

function hasProfileContent(profile = babyProfile, photo = currentProfilePhoto, windowMinutes = wakeWindowMinutes) {
  const normalizedProfile = normalizeBabyProfile(profile);
  return Boolean(
    normalizedProfile.name.trim() ||
      normalizedProfile.birthDate ||
      photo ||
      normalizedProfile.article === "da" ||
      windowMinutes !== 70,
  );
}

function hasCloudProfileContent(data = {}) {
  const profileSource = data.babyProfile && typeof data.babyProfile === "object" ? data.babyProfile : data;
  const photoValue = data.photo || data.photoDataUrl || "";
  const cloudWakeWindow = Number.isFinite(Number(data.wakeWindowMinutes)) ? Number(data.wakeWindowMinutes) : 70;
  return hasProfileContent(profileSource, photoValue, cloudWakeWindow);
}

function getBabyName() {
  return babyProfile.name.trim();
}

function getBabyReference() {
  return getBabyName() || "o bebê";
}

function getDiaryTitle() {
  const name = getBabyName();
  return name ? `Diário ${babyProfile.article} ${name}` : "Diário do bebê";
}

function parseLocalDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, date] = value.split("-").map(Number);
  return new Date(year, month - 1, date, 12, 0, 0, 0);
}

function pluralize(value, singular, plural) {
  return value === 1 ? singular : plural;
}

function getBabyAgeText() {
  const birthDate = parseLocalDate(babyProfile.birthDate);
  if (!birthDate) {
    return {
      short: "Nascimento não preenchido",
      profile: "Preencha o nascimento",
    };
  }

  const today = new Date();
  today.setHours(12, 0, 0, 0);
  if (birthDate.getTime() > today.getTime()) {
    return {
      short: "Revise o nascimento",
      profile: "Data futura",
    };
  }

  const daysAlive = Math.floor((today.getTime() - birthDate.getTime()) / day);
  const weeksAlive = Math.floor(daysAlive / 7);
  const daysText = `${daysAlive} ${pluralize(daysAlive, "dia", "dias")} de vida`;
  const weeksText = `${weeksAlive} ${pluralize(weeksAlive, "semana", "semanas")}`;
  return {
    short: `${daysText} • ${weeksText}`,
    profile: `${daysText} • ${weeksText}`,
  };
}

function renderBabyIdentity() {
  const name = getBabyName();
  const ageText = getBabyAgeText();
  diaryTitle.textContent = getDiaryTitle();
  babyAgeLine.textContent = ageText.short;
  profileBabyName.textContent = name || "Bebê";
  profileBabyAge.textContent = ageText.profile;
}

function syncBabyProfileForm() {
  babyNameInput.value = babyProfile.name;
  babyArticleInput.value = babyProfile.article;
  babyBirthInput.value = babyProfile.birthDate;
  babyBirthInput.max = toDateInputValue();
}

function updateBabyProfile(patch) {
  if (!requireLogin("salvar o perfil")) {
    syncBabyProfileForm();
    return;
  }

  babyProfile = normalizeBabyProfile({
    ...babyProfile,
    ...patch,
  });
  markProfileLocallyChanged();
  saveBabyProfile();
  renderBabyIdentity();
  renderCurrentState();
  scheduleProfileCloudSave();
}

async function getFirebaseServices() {
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
          setDoc: firestoreModule.setDoc,
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

function getCurrentDayId() {
  return toDateInputValue(getDayStart());
}

function getCloudProfileRef() {
  if (!firebaseServices || !cloudUser) return null;
  return firebaseServices.doc(firebaseServices.db, "users", cloudUser.uid, "profile", "main");
}

function getCloudDayRef(dayId = getCurrentDayId()) {
  if (!firebaseServices || !cloudUser) return null;
  return firebaseServices.doc(firebaseServices.db, "users", cloudUser.uid, "days", dayId);
}

function unsubscribeCloudListeners() {
  if (profileUnsubscribe) profileUnsubscribe();
  if (dayUnsubscribe) dayUnsubscribe();
  profileUnsubscribe = null;
  dayUnsubscribe = null;
}

function renderAuthControls() {
  const connected = isLoggedIn();
  loginButton.textContent = connected ? "Conectado" : "Entrar";
  loginButton.disabled = connected;
  createAccountButton.textContent = connected ? "Sair" : "Criar conta nova";
  createAccountButton.classList.toggle("logout-button", connected);
  loginEmail.disabled = connected;
  loginPassword.disabled = connected;
}

function clearLocalAccountData() {
  [
    storageKeys.photo,
    storageKeys.email,
    storageKeys.wakeWindow,
    storageKeys.profile,
    storageKeys.profileVersion,
    storageKeys.dayState,
  ].forEach((key) => {
    localStorage.removeItem(key);
  });

  state = createEmptyDayState();
  babyProfile = getDefaultBabyProfile();
  currentProfilePhoto = "";
  profileClientUpdatedAt = 0;
  pendingProfilePhotoSave = false;
  wakeWindowMinutes = 70;
  updateProfilePhoto("./icons/icon-192.png");
  syncBabyProfileForm();
  updateWakeWindow(wakeWindowMinutes, { skipLogin: true, skipPersist: true });
  renderAll();
}

async function connectCurrentAccount() {
  await subscribeToCloudProfile();
  await subscribeToCloudDay();
}

function getProfilePayload(options = {}) {
  const payload = {
    ...normalizeBabyProfile(babyProfile),
    wakeWindowMinutes,
    clientUpdatedAt: ensureProfileVersion(),
    updatedAt: firebaseServices.serverTimestamp(),
  };

  if (options.includePhoto) {
    payload.photo = currentProfilePhoto || "";
  }

  return payload;
}

function applyCloudProfile(data = {}) {
  const cloudProfileVersion = getCloudProfileVersion(data);
  const cloudHasContent = hasCloudProfileContent(data);
  const localHasContent = hasProfileContent();

  if (!cloudHasContent && localHasContent) {
    saveProfileToCloud({ includePhoto: Boolean(currentProfilePhoto) });
    return;
  }

  if (localHasContent && profileClientUpdatedAt && cloudProfileVersion < profileClientUpdatedAt) {
    return;
  }

  applyingCloudState = true;
  try {
    profileClientUpdatedAt = cloudProfileVersion;

    const profileSource = data.babyProfile && typeof data.babyProfile === "object" ? data.babyProfile : data;
    babyProfile = normalizeBabyProfile(profileSource);
    if (Object.prototype.hasOwnProperty.call(data, "photo") || Object.prototype.hasOwnProperty.call(data, "photoDataUrl")) {
      const photoValue = data.photo || data.photoDataUrl;
      currentProfilePhoto = typeof photoValue === "string" ? photoValue : "";
    }

    if (Number.isFinite(Number(data.wakeWindowMinutes))) {
      wakeWindowMinutes = Math.min(240, Math.max(20, Number(data.wakeWindowMinutes)));
      localStorage.setItem(storageKeys.wakeWindow, String(wakeWindowMinutes));
    }

    saveBabyProfile();

    if (currentProfilePhoto) {
      try {
        localStorage.setItem(storageKeys.photo, currentProfilePhoto);
      } catch {
        // A foto continua visível mesmo se o navegador não permitir salvar localmente.
      }
      updateProfilePhoto(currentProfilePhoto);
    } else {
      localStorage.removeItem(storageKeys.photo);
      updateProfilePhoto("./icons/icon-192.png");
    }

    syncBabyProfileForm();
    wakeWindowInput.value = String(wakeWindowMinutes);
    wakeWindowValue.textContent = String(wakeWindowMinutes);
    renderAll();
  } finally {
    applyingCloudState = false;
  }
}

function applyCloudDay(data = {}) {
  applyingCloudState = true;
  const daySource = data.state && typeof data.state === "object" ? data.state : data;
  state = normalizeDayState(daySource);
  saveLocalDayState();
  renderAll();
  applyingCloudState = false;
}

function scheduleProfileCloudSave(options = {}) {
  if (applyingCloudState || !cloudUser || !firebaseServices) return;
  if (options.includePhoto) pendingProfilePhotoSave = true;

  window.clearTimeout(profileCloudSaveTimer);
  profileCloudSaveTimer = window.setTimeout(saveProfileToCloud, options.includePhoto ? 120 : 600);
}

async function saveProfileToCloud(options = {}) {
  const profileRef = getCloudProfileRef();
  if (!profileRef) return;

  const includePhoto = Boolean(options.includePhoto || pendingProfilePhotoSave);
  const payload = getProfilePayload({ includePhoto });
  const savedProfileVersion = payload.clientUpdatedAt;

  try {
    await firebaseServices.setDoc(profileRef, payload, { merge: true });
    if (includePhoto) pendingProfilePhotoSave = false;
    if (savedProfileVersion === profileClientUpdatedAt) {
      setSyncStatus("online", cloudUser.email);
    }
  } catch (error) {
    console.error("Erro ao salvar perfil:", error);
    if (savedProfileVersion === profileClientUpdatedAt) {
      setSyncStatus("error", cloudUser.email);
      loginHelper.textContent = getFirebaseErrorMessage(error);
    }
  }
}

function scheduleDayCloudSave() {
  if (applyingCloudState || !cloudUser || !firebaseServices) return;

  window.clearTimeout(dayCloudSaveTimer);
  dayCloudSaveTimer = window.setTimeout(saveDayToCloud, 500);
}

async function saveDayToCloud() {
  const dayRef = getCloudDayRef();
  if (!dayRef || applyingCloudState) return;

  try {
    await firebaseServices.setDoc(
      dayRef,
      {
        ...normalizeDayState(state),
        updatedAt: firebaseServices.serverTimestamp(),
      },
      { merge: true },
    );
    setSyncStatus("online", cloudUser.email);
  } catch (error) {
    console.error("Erro ao salvar rotina:", error);
    setSyncStatus("error", cloudUser.email);
    loginHelper.textContent = getFirebaseErrorMessage(error);
  }
}

async function subscribeToCloudProfile() {
  const profileRef = getCloudProfileRef();
  if (!profileRef) return;

  if (profileUnsubscribe) profileUnsubscribe();

  profileUnsubscribe = firebaseServices.onSnapshot(profileRef, (snapshot) => {
    if (!snapshot.exists()) {
      if (hasProfileContent()) {
        saveProfileToCloud({ includePhoto: Boolean(currentProfilePhoto) });
      }
      return;
    }

    applyCloudProfile(snapshot.data());
  }, (error) => {
    console.error("Erro ao ler perfil:", error);
    setSyncStatus("error", cloudUser?.email || "");
  });
}

async function subscribeToCloudDay() {
  const dayRef = getCloudDayRef();
  if (!dayRef) return;

  if (dayUnsubscribe) dayUnsubscribe();

  dayUnsubscribe = firebaseServices.onSnapshot(dayRef, (snapshot) => {
    if (!snapshot.exists()) {
      saveDayToCloud();
      return;
    }

    applyCloudDay(snapshot.data());
  }, (error) => {
    console.error("Erro ao ler rotina:", error);
    setSyncStatus("error", cloudUser?.email || "");
  });
}

async function initFirebaseAuthState() {
  const services = await getFirebaseServices();

  services.onAuthStateChanged(services.auth, async (user) => {
    cloudUser = user;

    if (!user) {
      unsubscribeCloudListeners();
      clearLocalAccountData();
      setSyncStatus("offline");
      loginEmail.value = "";
      loginPassword.value = "";
      renderAuthControls();
      loginHelper.textContent = "Entre com e-mail e senha para sincronizar entre aparelhos.";
      return;
    }

    localStorage.setItem(storageKeys.email, user.email || "");
    loginEmail.value = user.email || "";

    setSyncStatus("loading", user.email || "");
    renderAuthControls();
    loginHelper.textContent = "Conectando à conta...";

    try {
      await connectCurrentAccount();
      setSyncStatus("online", user.email || "");
      loginHelper.textContent = "Conta conectada e sincronizando.";
    } catch (error) {
      console.error("Erro ao conectar família:", error);
      setSyncStatus("error", user.email || "");
      loginHelper.textContent = getFirebaseErrorMessage(error);
    }
  });
}

function getFirebaseErrorMessage(error) {
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
    "permission-denied": "Sem permissão no banco. Libere users/{uid}/profile/main e users/{uid}/days nas regras do Firestore.",
    "resource-exhausted": "Não foi possível salvar. A foto ou os dados ficaram grandes demais para o Firestore.",
    "invalid-argument": "Não foi possível salvar. Revise a foto ou os dados do perfil.",
    "unavailable": "Firebase indisponível no momento. Tente novamente em alguns segundos.",
  };

  return messages[code] || "Não foi possível concluir a operação. Tente novamente.";
}

async function signInAccount() {
  const credentials = getLoginCredentials("entrar");
  if (!credentials) return;

  try {
    const services = await getFirebaseServices();

    loginHelper.textContent = "Entrando...";
    loginButton.disabled = true;
    createAccountButton.disabled = true;

    await services.signInWithEmailAndPassword(services.auth, credentials.email, credentials.password);
    localStorage.setItem(storageKeys.email, credentials.email);
  } catch (error) {
    console.error("Erro ao entrar:", error);
    loginHelper.textContent = getFirebaseErrorMessage(error);
  } finally {
    renderAuthControls();
    createAccountButton.disabled = false;
  }
}

async function createAccount() {
  if (isLoggedIn()) {
    await signOutAccount();
    return;
  }

  const credentials = getLoginCredentials("criar a conta");
  if (!credentials) return;

  if (credentials.password.length < 6) {
    loginHelper.textContent = "A senha precisa ter pelo menos 6 caracteres.";
    return;
  }

  try {
    const services = await getFirebaseServices();

    loginHelper.textContent = "Criando conta...";
    loginButton.disabled = true;
    createAccountButton.disabled = true;

    await services.createUserWithEmailAndPassword(services.auth, credentials.email, credentials.password);
    localStorage.setItem(storageKeys.email, credentials.email);
  } catch (error) {
    console.error("Erro ao criar conta:", error);
    loginHelper.textContent = getFirebaseErrorMessage(error);
  } finally {
    renderAuthControls();
    createAccountButton.disabled = false;
  }
}

async function signOutAccount() {
  try {
    const services = await getFirebaseServices();
    loginHelper.textContent = "Saindo...";
    createAccountButton.disabled = true;
    await services.signOut(services.auth);
    cloudUser = null;
    unsubscribeCloudListeners();
    clearLocalAccountData();
    setSyncStatus("offline");
    loginEmail.value = "";
    loginPassword.value = "";
    loginEmail.disabled = false;
    loginPassword.disabled = false;
    renderAuthControls();
    loginHelper.textContent = "Conta desconectada neste aparelho.";
  } catch (error) {
    console.error("Erro ao sair:", error);
    loginHelper.textContent = "Não foi possível sair. Tente novamente.";
  } finally {
    createAccountButton.disabled = false;
  }
}

function getEventConfig(type) {
  return typeConfig[type] || typeConfig.sono;
}

function isSleepEvent(event) {
  return event.type === "sono" || event.type === "dormir";
}

function getDayStart(timestamp = Date.now()) {
  const date = new Date(timestamp);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

function getDayLabel(timestamp) {
  return new Intl.DateTimeFormat("pt-BR", { weekday: "short" })
    .format(new Date(timestamp))
    .replace(".", "");
}

function formatDiaryDate(timestamp) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
  }).format(new Date(timestamp));
}

function matchesDiaryFilter(event) {
  if (currentDiaryFilter === "all") return true;
  if (currentDiaryFilter === "sleep") return isSleepEvent(event) || event.type === "despertar-noturno";
  if (currentDiaryFilter === "feeding") return event.type === "mamadeira" || event.type === "amamentacao";
  if (currentDiaryFilter === "diaper") return event.type === "fralda";
  return true;
}

function getWakeWindowText() {
  const elapsed = Date.now() - state.activeStartedAt;
  return state.mode === "sleeping"
    ? `Ficou acordado ${formatShortDuration(elapsed)} antes de dormir.`
    : `Acordado desde ${formatTime(state.activeStartedAt)}.`;
}

function setWakeActionIcon() {
  wakeActionIcon.innerHTML = state.mode === "sleeping" ? '<svg><use href="#ux-sunrise"></use></svg>' : "☾";
}

function renderCurrentState() {
  if (state.mode === "idle") {
    wakeAction.hidden = true;
    startChoice.hidden = false;
    stateLabel.textContent = "Rotina zerada";
    stateClock.textContent = "00:00:00";
    stateHint.textContent = `Escolha se ${getBabyReference()} acordou ou iniciou uma soneca.`;
    return;
  }

  wakeAction.hidden = false;
  startChoice.hidden = true;
  const elapsed = Date.now() - state.activeStartedAt;
  const sleeping = state.mode === "sleeping";
  wakeActionLabel.textContent = sleeping ? "Acordou" : "Iniciar soneca";
  stateLabel.textContent = sleeping ? "Dormindo há" : "Acordado há";
  stateClock.textContent = formatDuration(elapsed);
  stateHint.textContent = getWakeWindowText();
  setWakeActionIcon();
}

function eventPosition(timestamp) {
  const date = new Date(timestamp);
  const minutes = date.getHours() * 60 + date.getMinutes();
  const progress = minutes / 1440;
  const startAngle = 142;
  const arcSize = 256;
  const angle = ((startAngle + progress * arcSize) * Math.PI) / 180;
  const radius = 132;
  return {
    x: Math.round(Math.cos(angle) * radius),
    y: Math.round(Math.sin(angle) * radius),
  };
}

function createOrbitEvent(event, active = false) {
  const config = getEventConfig(event.type);
  const position = eventPosition(event.start);
  const item = document.createElement("div");
  item.className = `orbit-event ${config.arcType}${active ? " active" : ""}`;
  item.style.setProperty("--x", `${position.x}px`);
  item.style.setProperty("--y", `${position.y}px`);

  const icon = document.createElement("i");
  icon.innerHTML = config.icon;
  const label = document.createElement("b");
  label.textContent = formatTime(event.start);

  item.append(icon, label);
  item.title = `${config.title} às ${formatTime(event.start)}`;
  return item;
}

function renderOrbit() {
  orbitEvents.innerHTML = "";
  const dayAgo = Date.now() - 24 * hour;
  const events = state.events.filter((event) => event.start >= dayAgo).slice(-14);
  events.forEach((event) => orbitEvents.append(createOrbitEvent(event)));

  if (state.mode === "sleeping") {
    orbitEvents.append(createOrbitEvent(makeEvent("sono", state.activeStartedAt), true));
  }
}

function renderTimeline() {
  const lastCard = document.querySelector(".last-card .event-card");
  if (!timeline || !lastCard) return;

  const selectedStart = selectedDiaryDay ?? getDayStart();
  const selectedEnd = selectedStart + day;
  const orderedEvents = [...state.events].sort((a, b) => b.start - a.start);
  const dayEvents = orderedEvents.filter((event) => event.start >= selectedStart && event.start < selectedEnd);
  const visibleEvents = dayEvents.filter(matchesDiaryFilter);
  timeline.innerHTML = "";
  diaryDateTitle.textContent = formatDiaryDate(selectedStart);
  diaryDateHint.textContent = selectedStart === getDayStart() ? "Hoje" : "Data selecionada";

  if (!visibleEvents.length) {
    const emptyItem = document.createElement("li");
    emptyItem.className = "event-card empty-event";
    emptyItem.innerHTML = `
      <i class="mark"></i>
      <div>
        <strong>Nenhum registro</strong>
        <span>Escolha outro filtro, outra data ou crie um novo registro.</span>
      </div>
    `;
    timeline.append(emptyItem);
  }

  visibleEvents.slice(0, 8).forEach((event) => {
    const config = getEventConfig(event.type);
    const item = document.createElement("li");
    item.className = "event-card";
    item.innerHTML = `
      <i class="mark ${config.arcType}"></i>
      <div>
        <strong>${escapeHtml(config.title)}</strong>
        <span>${escapeHtml(formatEventMeta(event))}</span>
        ${event.notes ? `<p>${escapeHtml(event.notes)}</p>` : ""}
        <div class="event-actions">
          <button type="button" data-event-edit="${escapeHtml(event.id)}">Editar</button>
          <button type="button" data-event-delete="${escapeHtml(event.id)}">Excluir</button>
        </div>
      </div>
    `;
    timeline.append(item);
  });

  const latest = orderedEvents[0];
  if (!latest) {
    lastCard.innerHTML = `
      <i class="mark"></i>
      <div>
        <strong>Nenhum registro</strong>
        <span>O dia ainda está zerado.</span>
      </div>
    `;
    return;
  }
  const latestConfig = getEventConfig(latest.type);
  lastCard.innerHTML = `
    <i class="mark ${latestConfig.arcType}"></i>
    <div>
      <strong>${escapeHtml(latestConfig.title)}</strong>
      <span>${escapeHtml(formatEventMeta(latest))}</span>
      ${latest.notes ? `<p>${escapeHtml(latest.notes)}</p>` : ""}
    </div>
  `;
}

function renderSummary() {
  const todayStart = getDayStart();
  const todaysEvents = state.events.filter((event) => event.start >= todayStart);
  const sleepMs = todaysEvents
    .filter(isSleepEvent)
    .reduce((total, event) => total + Math.max(0, event.end - event.start), 0);
  const feedingCount = todaysEvents.filter((event) => event.type === "mamadeira" || event.type === "amamentacao").length;
  const diaperCount = todaysEvents.filter((event) => event.type === "fralda").length;
  const awakeMs = state.mode === "awake" ? Date.now() - state.activeStartedAt : 0;
  const summaryValues = document.querySelectorAll(".summary-grid strong");
  const nextCard = document.querySelector(".next-card strong");
  const nextHint = document.querySelector(".next-card p");
  const miniRing = document.querySelector(".mini-ring");

  if (summaryValues.length >= 4) {
    summaryValues[0].textContent = formatShortDuration(sleepMs);
    summaryValues[1].textContent = formatShortDuration(awakeMs);
    summaryValues[2].textContent = String(feedingCount);
    summaryValues[3].textContent = String(diaperCount);
  }

  if (miniRing) {
    miniRing.textContent = String(wakeWindowMinutes);
  }

  if (nextCard && nextHint) {
    if (state.mode === "idle") {
      nextCard.textContent = "Aguardando";
      nextHint.textContent = "Escolha como começar a rotina diária.";
      return;
    }

    const target = state.mode === "awake" ? state.activeStartedAt + wakeWindowMinutes * 60000 : Date.now() + wakeWindowMinutes * 60000;
    nextCard.textContent = formatTime(target);
    nextHint.textContent = state.mode === "awake"
      ? `Hora de preparar a soneca em ${formatShortDuration(target - Date.now())}.`
      : "Próxima janela calculada após acordar.";
  }
}

function getSleepReportDays() {
  const todayStart = getDayStart();
  return Array.from({ length: 7 }, (_, index) => {
    const start = todayStart - (6 - index) * day;
    const end = start + day;
    const events = state.events.filter((event) => isSleepEvent(event) && event.start >= start && event.start < end);
    const sleepMs = events.reduce((total, event) => total + Math.max(0, event.end - event.start), 0);
    return {
      start,
      label: getDayLabel(start),
      events,
      sleepMs,
    };
  });
}

function renderSleepReport() {
  if (!sleepBars) return;
  const days = getSleepReportDays();
  const totalSleep = days.reduce((total, item) => total + item.sleepMs, 0);
  const totalNaps = days.reduce((total, item) => total + item.events.length, 0);
  const daysWithDataCount = days.filter((item) => item.events.length > 0).length;
  const daysWithData = daysWithDataCount || 1;
  const maxSleep = Math.max(...days.map((item) => item.sleepMs), 60 * 60000);
  const sleepEvents = days.flatMap((item) => item.events);
  const routineEvents = sleepEvents.filter((event) => {
    const duration = event.end - event.start;
    return duration >= 10 * 60000;
  });

  sleepAverage.textContent = formatShortDuration(totalSleep / daysWithData);
  sleepAverageHint.textContent = daysWithDataCount
    ? `Com base em ${daysWithDataCount} ${daysWithDataCount === 1 ? "dia" : "dias"} com registro.`
    : "Nenhum sono registrado no período.";
  napAverage.textContent = totalNaps ? (totalNaps / daysWithData).toFixed(1).replace(".", ",") : "0";
  napAverageHint.textContent = totalNaps
    ? `${totalNaps} registros de sono nos últimos 7 dias.`
    : "Nenhuma soneca registrada nos últimos 7 dias.";

  sleepBars.innerHTML = "";
  days.forEach((item) => {
    const bar = document.createElement("span");
    const height = Math.max(6, Math.round((item.sleepMs / maxSleep) * 100));
    bar.style.setProperty("--h", `${height}%`);
    bar.innerHTML = `<b>${item.sleepMs ? formatShortDuration(item.sleepMs) : "0"}</b><i>${item.label}</i>`;
    sleepBars.append(bar);
  });

  if (!routineEvents.length) {
    bestWindow.textContent = "Sem dados";
    bestWindowHint.textContent = "Registre sonecas para calcular a melhor janela.";
    routineStatus.textContent = "Aprendendo";
    routineHint.textContent = "O relatório será atualizado automaticamente.";
    return;
  }

  const startMinutes = routineEvents.map((event) => {
    const date = new Date(event.start);
    return date.getHours() * 60 + date.getMinutes();
  });
  const averageStart = startMinutes.reduce((total, value) => total + value, 0) / startMinutes.length;
  const averageDeviation = startMinutes.reduce((total, value) => total + Math.abs(value - averageStart), 0) / startMinutes.length;
  const commonWindowStart = Math.max(0, Math.round((averageStart - 15) / 5) * 5);
  const commonWindowEnd = Math.min(1439, commonWindowStart + 45);
  const formatMinutes = (minutes) => `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;

  bestWindow.textContent = `${formatMinutes(commonWindowStart)}-${formatMinutes(commonWindowEnd)}`;
  bestWindowHint.textContent = "Janela estimada pelos horários em que as sonecas começaram.";

  if (averageDeviation <= 35) {
    routineStatus.textContent = "Estável";
    routineHint.textContent = "As sonecas estão começando em horários bem parecidos.";
  } else if (averageDeviation <= 75) {
    routineStatus.textContent = "Em ajuste";
    routineHint.textContent = "Há alguma variação, mas já existe um padrão se formando.";
  } else {
    routineStatus.textContent = "Irregular";
    routineHint.textContent = "Os horários ainda variam bastante; mais registros ajudam a orientar.";
  }
}

function updateTheme() {
  const hourValue = new Date().getHours();
  const dayTheme = hourValue >= 6 && hourValue < 18;
  document.body.classList.toggle("day-theme", dayTheme);
}

function renderAll() {
  updateTheme();
  renderBabyIdentity();
  renderCurrentState();
  renderOrbit();
  renderTimeline();
  renderSummary();
  renderSleepReport();
}

function finishSleep() {
  if (!requireLogin("salvar a rotina")) return;
  const finishedAt = Date.now();
  state.events.push(makeEvent("sono", state.activeStartedAt, finishedAt, "Timer"));
  state.mode = "awake";
  state.activeStartedAt = finishedAt;
  saveDayState();
}

function startSleep() {
  if (!requireLogin("salvar a rotina")) return;
  state.mode = "sleeping";
  state.activeStartedAt = Date.now();
  saveDayState();
}

function startRoutine(mode) {
  if (!requireLogin("salvar a rotina")) return;
  state.mode = mode === "sleeping" ? "sleeping" : "awake";
  state.activeStartedAt = Date.now();
  saveDayState();
  renderAll();
}

function showScreen(target) {
  navButtons.forEach((item) => item.classList.toggle("active", item.dataset.target === target));
  screens.forEach((screen) => {
    screen.classList.toggle("active", screen.dataset.screen === target);
  });
}

function setDiaryFilter(filter) {
  currentDiaryFilter = filter;
  diaryFilterButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.diaryFilter === filter);
  });
  renderTimeline();
}

function setDiaryDate(value) {
  selectedDiaryDay = value ? getDayStart(new Date(`${value}T12:00:00`).getTime()) : getDayStart();
  renderTimeline();
}

function initDiaryDatePicker() {
  const today = getDayStart();
  const minDay = today - 4 * day;
  selectedDiaryDay = today;
  diaryDateInput.min = toDateInputValue(minDay);
  diaryDateInput.max = toDateInputValue(today);
  diaryDateInput.value = toDateInputValue(today);
}

function resetDayData() {
  if (!requireLogin("zerar a rotina")) return;
  state = createEmptyDayState();
  currentDiaryFilter = "all";
  selectedDiaryDay = getDayStart();
  diaryDateInput.value = toDateInputValue(selectedDiaryDay);
  diaryFilterButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.diaryFilter === "all");
  });
  closeSheet();
  showScreen("today");
  saveDayState();
  renderAll();
}

function updateWakeWindow(value, options = {}) {
  if (!options.skipLogin && !requireLogin("salvar a janela de despertar")) {
    wakeWindowInput.value = String(wakeWindowMinutes);
    return;
  }

  const nextValue = Math.min(240, Math.max(20, Number(value) || 70));
  wakeWindowMinutes = nextValue;
  wakeWindowInput.value = String(nextValue);
  wakeWindowValue.textContent = String(nextValue);
  if (!options.skipPersist) {
    markProfileLocallyChanged();
    localStorage.setItem(storageKeys.wakeWindow, String(nextValue));
  }
  renderSummary();
  if (!options.skipPersist) {
    scheduleProfileCloudSave();
  }
}

function setSyncStatus(status = "offline", email = "") {
  if (status.includes?.("@") && !email) {
    email = status;
    status = "online";
  }

  const online = status === "online";
  const loading = status === "loading";
  const error = status === "error";

  syncPill.textContent = online ? "Online" : loading ? "Conectando" : error ? "Erro" : "Off-line";
  syncPill.classList.toggle("online", online);
  syncPill.classList.toggle("offline", !online);
  syncStatusTitle.textContent = online ? "Sincronização ativa" : loading ? "Conectando" : error ? "Erro na sincronização" : "Sincronização off-line";
  syncStatusText.textContent = online
    ? `${email} está sincronizando a rotina familiar em tempo real.`
    : loading
      ? "Conectando ao Firebase..."
      : error
        ? "Não foi possível sincronizar. Verifique conexão, login ou regras do Firestore."
        : "Entre com e-mail e senha para ativar a sincronização entre aparelhos.";
}

function getLoginCredentials(actionText) {
  const email = loginEmail.value.trim();
  const password = loginPassword.value.trim();
  if (!email) {
    loginEmail.focus();
    loginHelper.textContent = `Digite o e-mail para ${actionText}.`;
    return null;
  }
  if (!password) {
    loginPassword.focus();
    loginHelper.textContent = `Digite a senha para ${actionText}.`;
    return null;
  }
  return { email, password };
}

function getEventById(eventId) {
  return state.events.find((event) => event.id === eventId);
}

function setSheetType(type) {
  currentSheetType = type;
  const config = getEventConfig(type);
  sheetTitle.textContent = currentEditingEventId ? `Editar ${config.title}` : config.title;
  sheetDetailLabel.textContent = config.label;
  sheetAmountField.hidden = !config.amount;
  sheetDetail.innerHTML = "";
  config.options.forEach((optionText) => {
    const option = document.createElement("option");
    option.textContent = optionText;
    sheetDetail.append(option);
  });
  sheetTypeButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.sheetType === type);
  });
}

function resetSheetState() {
  currentEditingEventId = null;
  saveButton.textContent = "Registrar";
  sheetAmountInput.value = "";
  sheetNotesInput.value = "";
}

function hydrateSheetFromEvent(event) {
  const config = getEventConfig(event.type);
  sheetDateInput.value = toDateTimeInputValue(event.start);
  sheetNotesInput.value = event.notes || "";
  sheetAmountInput.value = "";

  if (config.amount) {
    const amountMatch = String(event.detail || "").match(/[\d,.]+/);
    sheetAmountInput.value = amountMatch ? amountMatch[0].replace(",", ".") : "";
    return;
  }

  if ([...sheetDetail.options].some((option) => option.value === event.detail || option.textContent === event.detail)) {
    sheetDetail.value = event.detail;
  }
}

function openSheet(type = "sono", eventId = null) {
  const editingEvent = eventId ? getEventById(eventId) : null;
  if (!requireLogin(editingEvent ? "editar registros" : "criar registros")) return;

  currentEditingEventId = editingEvent?.id || null;
  setSheetType(editingEvent?.type || type);
  saveButton.textContent = editingEvent ? "Salvar alterações" : "Registrar";
  sheetDateInput.value = toDateTimeInputValue();
  sheetAmountInput.value = "";
  sheetNotesInput.value = "";

  if (editingEvent) {
    hydrateSheetFromEvent(editingEvent);
  }

  sheet.hidden = false;
  sheetBackdrop.hidden = false;
}

function closeSheet() {
  sheet.hidden = true;
  sheetBackdrop.hidden = true;
  resetSheetState();
}

function saveManualEvent() {
  if (!requireLogin("salvar registros")) return;
  const start = sheetDateInput.value ? new Date(sheetDateInput.value).getTime() : Date.now();
  const detail = typeConfig[currentSheetType].amount && sheetAmountInput.value
    ? `${sheetAmountInput.value} ml`
    : sheetDetail.value;
  const existingEvent = currentEditingEventId ? getEventById(currentEditingEventId) : null;

  if (existingEvent) {
    const duration = Math.max(0, existingEvent.end - existingEvent.start);
    Object.assign(existingEvent, {
      type: currentSheetType,
      start,
      end: duration ? start + duration : start,
      detail,
      notes: sheetNotesInput.value.trim(),
    });
  } else {
    state.events.push(makeEvent(currentSheetType, start, start, detail, sheetNotesInput.value.trim()));
  }

  sheetAmountInput.value = "";
  sheetNotesInput.value = "";
  closeSheet();
  saveDayState();
  renderAll();
}

function editEvent(eventId) {
  const event = getEventById(eventId);
  if (!event) return;
  openSheet(event.type, event.id);
}

function deleteEvent(eventId) {
  if (!requireLogin("excluir registros")) return;
  const event = getEventById(eventId);
  if (!event) return;
  if (!window.confirm(`Excluir ${getEventConfig(event.type).title.toLowerCase()} das ${formatTime(event.start)}?`)) return;

  state.events = state.events.filter((item) => item.id !== eventId);
  saveDayState();
  renderAll();
}

function getExportEvents() {
  return [...state.events]
    .sort((a, b) => a.start - b.start)
    .map((event) => ({
      id: event.id,
      type: event.type,
      title: getEventConfig(event.type).title,
      start: new Date(event.start).toISOString(),
      end: new Date(event.end).toISOString(),
      durationMinutes: Math.round(Math.max(0, event.end - event.start) / 60000),
      detail: event.detail || "",
      notes: event.notes || "",
    }));
}

function getExportPayload() {
  return {
    app: "Ninou",
    exportedAt: new Date().toISOString(),
    exportedBy: cloudUser?.email || "",
    day: getCurrentDayId(),
    profile: normalizeBabyProfile(babyProfile),
    wakeWindowMinutes,
    state: normalizeDayState(state),
    events: getExportEvents(),
  };
}

function downloadFile(filename, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function escapeCsv(value) {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function exportRoutine(format) {
  if (!requireLogin("exportar a rotina")) return;
  const payload = getExportPayload();
  const filenameBase = `ninou-${payload.day}`;

  if (format === "csv") {
    const header = ["id", "tipo", "titulo", "inicio", "fim", "duracao_min", "detalhe", "observacoes"];
    const rows = payload.events.map((event) => [
      event.id,
      event.type,
      event.title,
      event.start,
      event.end,
      event.durationMinutes,
      event.detail,
      event.notes,
    ]);
    const csv = [header, ...rows].map((row) => row.map(escapeCsv).join(",")).join("\n");
    downloadFile(`${filenameBase}.csv`, csv, "text/csv;charset=utf-8");
    return;
  }

  downloadFile(`${filenameBase}.json`, JSON.stringify(payload, null, 2), "application/json;charset=utf-8");
}

function updateProfilePhoto(dataUrl) {
  profileImages.forEach((image) => {
    image.src = dataUrl;
  });
}

function resizeImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const image = new Image();
      image.onerror = reject;
      image.onload = () => {
        const size = 320;
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        const scale = Math.max(size / image.width, size / image.height);
        const width = image.width * scale;
        const height = image.height * scale;
        canvas.width = size;
        canvas.height = size;
        context.drawImage(image, (size - width) / 2, (size - height) / 2, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      };
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

navButtons.forEach((button) => {
  button.addEventListener("click", () => showScreen(button.dataset.target));
});

syncPill.addEventListener("click", () => showScreen("profile"));

shortcutButtons.forEach((button) => {
  button.addEventListener("click", () => showScreen(button.dataset.targetShortcut));
});

diaryFilterButtons.forEach((button) => {
  button.addEventListener("click", () => setDiaryFilter(button.dataset.diaryFilter));
});

diaryDateInput.addEventListener("change", () => setDiaryDate(diaryDateInput.value));

timeline.addEventListener("click", (event) => {
  const editButton = event.target.closest("[data-event-edit]");
  const deleteButton = event.target.closest("[data-event-delete]");

  if (editButton) {
    editEvent(editButton.dataset.eventEdit);
  }

  if (deleteButton) {
    deleteEvent(deleteButton.dataset.eventDelete);
  }
});

startModeButtons.forEach((button) => {
  button.addEventListener("click", () => startRoutine(button.dataset.startMode));
});

wakeAction.addEventListener("click", () => {
  if (state.mode === "idle") return;
  if (state.mode === "sleeping") {
    finishSleep();
  } else {
    startSleep();
  }
  renderAll();
});

openSheetButtons.forEach((button) => {
  button.addEventListener("click", () => openSheet(button.dataset.openSheet));
});

sheetTypeButtons.forEach((button) => {
  button.addEventListener("click", () => setSheetType(button.dataset.sheetType));
});

closeSheetButton.addEventListener("click", closeSheet);
sheetBackdrop.addEventListener("click", closeSheet);
saveButton.addEventListener("click", saveManualEvent);
resetDataButton.addEventListener("click", resetDayData);
exportJsonButton.addEventListener("click", () => exportRoutine("json"));
exportCsvButton.addEventListener("click", () => exportRoutine("csv"));

wakeWindowInput.addEventListener("input", () => {
  if (!isLoggedIn()) return;
  const nextValue = Number(wakeWindowInput.value);
  if (nextValue >= 20 && nextValue <= 240) {
    wakeWindowMinutes = nextValue;
    wakeWindowValue.textContent = String(nextValue);
    renderSummary();
  }
});
wakeWindowInput.addEventListener("change", () => updateWakeWindow(wakeWindowInput.value));

babyNameInput.addEventListener("input", () => {
  updateBabyProfile({ name: babyNameInput.value.trim() });
});

babyArticleInput.addEventListener("change", () => {
  updateBabyProfile({ article: babyArticleInput.value === "da" ? "da" : "do" });
});

babyBirthInput.addEventListener("change", () => {
  updateBabyProfile({ birthDate: babyBirthInput.value });
});

profilePhotoInput.addEventListener("change", async () => {
  if (!requireLogin("salvar a foto")) {
    profilePhotoInput.value = "";
    return;
  }

  const file = profilePhotoInput.files?.[0];
  if (!file) return;
  const dataUrl = await resizeImage(file);
  currentProfilePhoto = dataUrl;
  markProfileLocallyChanged();
  updateProfilePhoto(dataUrl);
  try {
    localStorage.setItem(storageKeys.photo, dataUrl);
  } catch {
    // A foto continua visível mesmo se o navegador não permitir salvar localmente.
  }
  scheduleProfileCloudSave({ includePhoto: true });
});

loginButton.addEventListener("click", signInAccount);
createAccountButton.addEventListener("click", createAccount);

if (currentProfilePhoto) updateProfilePhoto(currentProfilePhoto);

const savedEmail = localStorage.getItem(storageKeys.email);
if (savedEmail) {
  loginEmail.value = savedEmail;
  setSyncStatus("loading", savedEmail);
} else {
  setSyncStatus("offline");
}

initDiaryDatePicker();
syncBabyProfileForm();
updateWakeWindow(wakeWindowMinutes, { skipLogin: true, skipPersist: true });
renderAll();
setInterval(renderAll, 500);

initFirebaseAuthState().catch((error) => {
  console.error("Firebase não iniciou:", error);
  setSyncStatus("error");
  loginHelper.textContent = "Não foi possível iniciar a sincronização.";
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch((error) => {
      console.warn("Service worker não registrado:", error);
    });
  });
}
