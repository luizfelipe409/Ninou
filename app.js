const storageKey = "projeto-baby-activities";
const profileStorageKey = "projeto-baby-profile";
const timerStorageKey = "projeto-baby-active-timer";
const routineStorageKey = "projeto-baby-routine-state";

const firebaseConfig = {
  apiKey: "AIzaSyAlGGx3z6kDWk4vsgBjSH2BDkDQwPoZlAM",
  authDomain: "ninou-3c936.firebaseapp.com",
  projectId: "ninou-3c936",
  storageBucket: "ninou-3c936.firebasestorage.app",
  messagingSenderId: "18333404018",
  appId: "1:18333404018:web:6faefb89f2e79e737c6beb",
  measurementId: "G-WPEYS3SH60",
};

const activityLabels = {
  sono: "Soneca",
  despertar: "Acordou",
  dormir: "Noite",
  amamentacao: "Amamentação",
  mamadeira: "Mamadeira",
  fralda: "Troca de fralda",
};

const form = document.querySelector("#activityForm");
const timeInput = document.querySelector("#timeInput");
const durationInput = document.querySelector("#durationInput");
const amountField = document.querySelector("#amountField");
const amountInput = document.querySelector("#amountInput");
const detailField = document.querySelector("#detailField");
const detailLabel = document.querySelector("#detailLabel");
const detailInput = document.querySelector("#detailInput");
const notesInput = document.querySelector("#notesInput");
const submitButton = document.querySelector("#submitButton");
const submitButtonIcon = document.querySelector("#submitButtonIcon");
const submitButtonLabel = document.querySelector("#submitButtonLabel");
const dateFilter = document.querySelector("#dateFilter");
const timeline = document.querySelector("#timeline");
const template = document.querySelector("#eventTemplate");
const emptyState = document.querySelector("#emptyState");
const todayLabel = document.querySelector("#todayLabel");
const eventCount = document.querySelector("#eventCount");
const sleepTotal = document.querySelector("#sleepTotal");
const feedingCount = document.querySelector("#feedingCount");
const bottleTotal = document.querySelector("#bottleTotal");
const diaperCount = document.querySelector("#diaperCount");
const exportButton = document.querySelector("#exportButton");
const clearButton = document.querySelector("#clearButton");
const formStatus = document.querySelector("#formStatus");
const authForm = document.querySelector("#authForm");
const authEmail = document.querySelector("#authEmail");
const authPassword = document.querySelector("#authPassword");
const signUpButton = document.querySelector("#signUpButton");
const signOutButton = document.querySelector("#signOutButton");
const syncStatus = document.querySelector("#syncStatus");
const authTitle = document.querySelector("#authTitle");
const authMessage = document.querySelector("#authMessage");
const diaryLabel = document.querySelector("#diaryLabel");
const profileAvatar = document.querySelector("#profileAvatar");
const profileAvatarInitial = document.querySelector("#profileAvatarInitial");
const profileAvatarImage = document.querySelector("#profileAvatarImage");
const babyNameInput = document.querySelector("#babyNameInput");
const babyBirthInput = document.querySelector("#babyBirthInput");
const babyPhotoInput = document.querySelector("#babyPhotoInput");
const babyDaysOld = document.querySelector("#babyDaysOld");
const babyAgeSummary = document.querySelector("#babyAgeSummary");
const awakeToday = document.querySelector("#awakeToday");
const awakeTodayNote = document.querySelector("#awakeTodayNote");
const wakeWindowInput = document.querySelector("#wakeWindowInput");
const wakeWindowHint = document.querySelector("#wakeWindowHint");
const wakeWindowProfileValue = document.querySelector("#wakeWindowProfileValue");
const wakeWindowProfileNote = document.querySelector("#wakeWindowProfileNote");
const useSuggestionButton = document.querySelector("#useSuggestionButton");
const windowAdjustButtons = document.querySelectorAll("[data-window-adjust]");
const nextNapTime = document.querySelector("#nextNapTime");
const nextNapStatus = document.querySelector("#nextNapStatus");
const wakeWindowValue = document.querySelector("#wakeWindowValue");
const wakeWindowNote = document.querySelector("#wakeWindowNote");
const dayPlan = document.querySelector("#dayPlan");
const dayPlanNote = document.querySelector("#dayPlanNote");
const averageSleep = document.querySelector("#averageSleep");
const averageNaps = document.querySelector("#averageNaps");
const trendBars = document.querySelector("#trendBars");
const timerStatus = document.querySelector("#timerStatus");
const timerButtons = document.querySelectorAll(".timer-button");
const sleepTimerButton = document.querySelector("#sleepTimerButton");
const sleepTimerIcon = document.querySelector("#sleepTimerIcon");
const sleepTimerLabel = document.querySelector("#sleepTimerLabel");
const activeTimer = document.querySelector("#activeTimer");
const activeTimerLabel = document.querySelector("#activeTimerLabel");
const activeTimerElapsed = document.querySelector("#activeTimerElapsed");
const finishTimerButton = document.querySelector("#finishTimerButton");
const cancelTimerButton = document.querySelector("#cancelTimerButton");
const cancelSleepButton = document.querySelector("#cancelSleepButton");
const wakeCard = document.querySelector("#wakeCard");
const stateLabel = document.querySelector("#stateLabel");
const awakeElapsed = document.querySelector("#awakeElapsed");
const awakeSinceLabel = document.querySelector("#awakeSinceLabel");

let activities = loadActivities();
let profile = loadProfile();
let activeTimerState = loadTimer();
let routineState = loadRoutine();
let timerInterval = null;
let firebaseApp = null;
let firebaseAuth = null;
let firebaseDb = null;
let currentUser = null;
let profileUnsubscribe = null;
let activitiesUnsubscribe = null;
let applyingCloudState = false;
saveActivities();

const detailOptionsByType = {
  amamentacao: {
    label: "Lado",
    placeholder: "Escolha o lado",
    options: ["Esquerdo", "Direito", "Ambos"],
  },
  fralda: {
    label: "Tipo de fralda",
    placeholder: "Escolha o tipo",
    options: ["Xixi", "Cocô", "Mista"],
  },
  mamadeira: {
    label: "Tipo de leite",
    placeholder: "Escolha o tipo",
    options: ["Leite materno", "Fórmula", "Misto"],
  },
};

function loadActivities() {
  try {
    return normalizeActivities(JSON.parse(localStorage.getItem(storageKey)) ?? []);
  } catch {
    return [];
  }
}

function normalizeActivities(items) {
  return items.map((activity) => {
    if (
      activity.type === "despertar" &&
      (activity.detail === "Automático" || activity.notes?.includes("iniciado automaticamente"))
    ) {
      return {
        ...activity,
        automatic: true,
        source: activity.source || activity.notes || "Acordou automaticamente.",
        notes: "",
      };
    }

    return activity;
  });
}

function saveActivities() {
  localStorage.setItem(storageKey, JSON.stringify(activities));
}

function loadProfile() {
  try {
    return JSON.parse(localStorage.getItem(profileStorageKey)) ?? {};
  } catch {
    return {};
  }
}

function saveProfile() {
  localStorage.setItem(profileStorageKey, JSON.stringify(profile));
  saveProfileToCloud().catch((error) => {
    console.error(error);
    setSyncMessage("Salvei neste aparelho, mas a nuvem falhou por enquanto.");
  });
}

function loadTimer() {
  try {
    const timer = JSON.parse(localStorage.getItem(timerStorageKey));
    if (timer?.type === "mamadeira") {
      localStorage.removeItem(timerStorageKey);
      return null;
    }

    return timer;
  } catch {
    return null;
  }
}

function saveTimer() {
  if (activeTimerState) {
    localStorage.setItem(timerStorageKey, JSON.stringify(activeTimerState));
    return;
  }

  localStorage.removeItem(timerStorageKey);
}

function loadRoutine() {
  try {
    return JSON.parse(localStorage.getItem(routineStorageKey)) ?? {};
  } catch {
    return {};
  }
}

function saveRoutine() {
  localStorage.setItem(routineStorageKey, JSON.stringify(routineState));
  saveRoutineToCloud().catch((error) => {
    console.error(error);
    setSyncMessage("Salvei a rotina neste aparelho, mas a nuvem falhou por enquanto.");
  });
}

function initializeFirebase() {
  if (!window.firebase) {
    syncStatus.textContent = "Modo local";
    authMessage.textContent = "Firebase não carregou. Confira a internet e recarregue.";
    return;
  }

  firebaseApp = window.firebase.apps.length
    ? window.firebase.app()
    : window.firebase.initializeApp(firebaseConfig);
  firebaseAuth = window.firebase.auth();
  firebaseDb = window.firebase.firestore();
  firebaseAuth.onAuthStateChanged(handleAuthState);
}

function userRoot() {
  return firebaseDb.collection("users").doc(currentUser.uid);
}

function profileDocument() {
  return userRoot().collection("profile").doc("main");
}

function activitiesCollection() {
  return userRoot().collection("activities");
}

function authErrorMessage(error) {
  const messages = {
    "auth/email-already-in-use": "Este e-mail já tem acesso. Use Entrar.",
    "auth/invalid-email": "Confira o e-mail.",
    "auth/invalid-credential": "E-mail ou senha não conferem.",
    "auth/missing-password": "Digite a senha.",
    "auth/weak-password": "Use uma senha com pelo menos 6 caracteres.",
  };

  return messages[error.code] || "Não consegui autenticar agora.";
}

function loadImageFromFile(file) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const url = URL.createObjectURL(file);
    image.addEventListener("load", () => {
      URL.revokeObjectURL(url);
      resolve(image);
    });
    image.addEventListener("error", () => {
      URL.revokeObjectURL(url);
      reject(new Error("Não consegui carregar esta imagem."));
    });
    image.src = url;
  });
}

async function compressProfilePhoto(file) {
  const image = await loadImageFromFile(file);
  const maxSize = 320;
  const scale = Math.min(1, maxSize / Math.max(image.naturalWidth, image.naturalHeight));
  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  canvas.width = width;
  canvas.height = height;
  context.drawImage(image, 0, 0, width, height);

  return canvas.toDataURL("image/jpeg", 0.78);
}

function setSyncMessage(message) {
  authMessage.textContent = message;
}

function updateAuthUI() {
  const isSignedIn = Boolean(currentUser);
  authForm.hidden = isSignedIn;
  signOutButton.hidden = !isSignedIn;
  syncStatus.textContent = isSignedIn ? "Sincronizado" : "Modo local";
  authTitle.textContent = isSignedIn ? "Família conectada" : "Sincronizar com a família";
  authMessage.textContent = isSignedIn
    ? `Entrou como ${currentUser.email}. Os celulares com este login compartilham os registros.`
    : "Entre com o mesmo e-mail nos celulares para manter os registros sincronizados.";
}

async function handleAuthState(user) {
  profileUnsubscribe?.();
  activitiesUnsubscribe?.();
  profileUnsubscribe = null;
  activitiesUnsubscribe = null;
  currentUser = user;
  updateAuthUI();

  if (!currentUser || !firebaseDb) {
    return;
  }

  try {
    await migrateLocalDataToCloud();
    subscribeToCloudData();
  } catch (error) {
    console.error(error);
    setSyncMessage("Conectou, mas não consegui sincronizar. Confira as regras do Firestore.");
  }
}

async function migrateLocalDataToCloud() {
  const batch = firebaseDb.batch();
  let hasWrites = false;
  const localActivities = activities.map((activity) => ({
    ...activity,
    cloudUpdatedAt: window.firebase.firestore.FieldValue.serverTimestamp(),
  }));

  localActivities.forEach((activity) => {
    batch.set(activitiesCollection().doc(activity.id), activity, { merge: true });
    hasWrites = true;
  });

  const profilePayload = {
    updatedAt: window.firebase.firestore.FieldValue.serverTimestamp(),
  };
  if (Object.keys(profile).length) {
    profilePayload.profile = profile;
  }
  if (Object.keys(routineState).length) {
    profilePayload.routineState = routineState;
  }
  if (profilePayload.profile || profilePayload.routineState) {
    batch.set(profileDocument(), profilePayload, { merge: true });
    hasWrites = true;
  }

  if (hasWrites) {
    await batch.commit();
  }
}

function subscribeToCloudData() {
  profileUnsubscribe = profileDocument().onSnapshot((snapshot) => {
    if (!snapshot.exists) {
      return;
    }

    const data = snapshot.data();
    applyingCloudState = true;
    profile = data.profile || {};
    routineState = data.routineState || {};
    localStorage.setItem(profileStorageKey, JSON.stringify(profile));
    localStorage.setItem(routineStorageKey, JSON.stringify(routineState));
    applyingCloudState = false;
    render();
  });

  activitiesUnsubscribe = activitiesCollection().onSnapshot((snapshot) => {
    applyingCloudState = true;
    activities = normalizeActivities(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    saveActivities();
    applyingCloudState = false;
    render();
  }, (error) => {
    console.error(error);
    setSyncMessage("Não consegui ler os registros da nuvem. Confira as regras do Firestore.");
  });
}

async function saveProfileToCloud() {
  if (!currentUser || !firebaseDb || applyingCloudState) {
    return;
  }

  await profileDocument().set({
    profile,
    routineState,
    updatedAt: window.firebase.firestore.FieldValue.serverTimestamp(),
  }, { merge: true });
}

async function saveRoutineToCloud() {
  if (!currentUser || !firebaseDb || applyingCloudState) {
    return;
  }

  await profileDocument().set({
    routineState,
    updatedAt: window.firebase.firestore.FieldValue.serverTimestamp(),
  }, { merge: true });
}

async function saveActivityToCloud(activity) {
  if (!currentUser || !firebaseDb || applyingCloudState) {
    return;
  }

  await activitiesCollection().doc(activity.id).set({
    ...activity,
    cloudUpdatedAt: window.firebase.firestore.FieldValue.serverTimestamp(),
  }, { merge: true });
}

async function deleteActivityFromCloud(activityId) {
  if (!currentUser || !firebaseDb || applyingCloudState) {
    return;
  }

  await activitiesCollection().doc(activityId).delete();
}

async function deleteActivitiesFromCloud(dayEvents) {
  if (!currentUser || !firebaseDb || applyingCloudState || !dayEvents.length) {
    return;
  }

  const batch = firebaseDb.batch();
  dayEvents.forEach((activity) => {
    batch.delete(activitiesCollection().doc(activity.id));
  });
  await batch.commit();
}

function pad(value) {
  return String(value).padStart(2, "0");
}

function toDateValue(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function toDateTimeValue(date) {
  return `${toDateValue(date)}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function formatTime(isoDate) {
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(isoDate));
}

function formatLongDate(dateValue) {
  const date = new Date(`${dateValue}T12:00:00`);
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  }).format(date);
}

function formatMinutes(minutes) {
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  return `${hours}h ${pad(remaining)}`;
}

function formatDurationText(minutes) {
  if (!minutes) {
    return "0 min";
  }

  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;

  if (!hours) {
    return `${remaining} min`;
  }

  if (!remaining) {
    return `${hours}h`;
  }

  return `${hours}h ${remaining}min`;
}

function formatElapsed(milliseconds) {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

function formatClock(date) {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function addMinutes(date, minutes) {
  return new Date(date.getTime() + minutes * 60000);
}

function minutesBetween(start, end) {
  return Math.round((end.getTime() - start.getTime()) / 60000);
}

function daysBetween(start, end) {
  const startDate = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const endDate = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  return Math.floor((endDate.getTime() - startDate.getTime()) / 86400000);
}

function birthDate() {
  if (!profile.birthDate) {
    return null;
  }

  const date = new Date(`${profile.birthDate}T12:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function babyAgeInfo() {
  const birth = birthDate();
  if (!birth) {
    return {
      hasBirthDate: false,
      days: null,
      weeks: null,
      months: 4,
    };
  }

  const today = new Date();
  const days = Math.max(0, daysBetween(birth, today));
  return {
    hasBirthDate: true,
    days,
    weeks: Math.floor(days / 7),
    months: Math.max(0, Math.floor(days / 30.4375)),
  };
}

function effectiveAgeMonths() {
  const ageInfo = babyAgeInfo();
  if (ageInfo.hasBirthDate) {
    return ageInfo.months;
  }

  return 4;
}

function selectedType() {
  return form.querySelector('input[name="type"]:checked')?.value;
}

function isSleepType(type) {
  return type === "sono" || type === "dormir";
}

function currentSleepActionType() {
  return selectedType() === "dormir" ? "dormir" : "sono";
}

function setSelectedType(type) {
  const input = form.querySelector(`input[name="type"][value="${type}"]`);
  if (input) {
    input.checked = true;
  }
  updateDetailOptions(type);
  updateAmountField(type);
}

function updateAmountField(type = selectedType()) {
  const shouldShow = type === "mamadeira";
  amountField.hidden = !shouldShow;
  amountInput.disabled = !shouldShow;
  if (!shouldShow) {
    amountInput.value = "";
  }
}

function updateDetailOptions(type = selectedType()) {
  const config = detailOptionsByType[type];
  const previousValue = detailInput.value;
  detailInput.innerHTML = "";

  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = config?.placeholder ?? "Não se aplica";
  detailInput.append(placeholder);

  if (!config) {
    detailLabel.textContent = "Detalhe";
    detailInput.disabled = true;
    detailField.classList.add("is-disabled");
    return;
  }

  config.options.forEach((optionText) => {
    const option = document.createElement("option");
    option.value = optionText;
    option.textContent = optionText;
    detailInput.append(option);
  });

  detailLabel.textContent = config.label;
  detailInput.disabled = false;
  detailField.classList.remove("is-disabled");
  if (config.options.includes(previousValue)) {
    detailInput.value = previousValue;
  }
}

function eventsForSelectedDate() {
  return activities
    .filter((activity) => activity.time.startsWith(dateFilter.value))
    .sort((a, b) => new Date(b.time) - new Date(a.time));
}

function eventsForDate(dateValue) {
  return activities.filter((activity) => activity.time.startsWith(dateValue));
}

function suggestedWakeWindow(ageMonths) {
  if (ageMonths <= 1) return 60;
  if (ageMonths <= 2) return 75;
  if (ageMonths <= 4) return 100;
  if (ageMonths <= 6) return 135;
  if (ageMonths <= 9) return 170;
  if (ageMonths <= 12) return 210;
  if (ageMonths <= 18) return 260;
  return 300;
}

function currentWakeWindow() {
  const customWindow = Number(profile.wakeWindow);
  if (customWindow > 0) {
    return customWindow;
  }

  return suggestedWakeWindow(effectiveAgeMonths());
}

function suggestedWindow() {
  return suggestedWakeWindow(effectiveAgeMonths());
}

function sleepEnd(activity) {
  if ((activity.type !== "sono" && activity.type !== "dormir") || !activity.duration) {
    return null;
  }

  return addMinutes(new Date(activity.time), Number(activity.duration));
}

function isSameDate(date, dateValue) {
  return toDateValue(date) === dateValue;
}

function awakeMinutesForDate(dateValue) {
  const dayEvents = eventsForDate(dateValue).sort((a, b) => new Date(a.time) - new Date(b.time));
  const today = toDateValue(new Date());
  let awakeStart = null;
  let total = 0;

  dayEvents.forEach((activity) => {
    if (isSleepType(activity.type)) {
      const sleepStartedAt = new Date(activity.time);
      if (awakeStart && sleepStartedAt > awakeStart) {
        total += Math.max(0, minutesBetween(awakeStart, sleepStartedAt));
      }

      const endedAt = sleepEnd(activity);
      awakeStart = endedAt && isSameDate(endedAt, dateValue) ? endedAt : null;
      return;
    }

    if (activity.type === "despertar") {
      awakeStart = new Date(activity.time);
    }
  });

  if (dateValue === today && !isSleepType(activeTimerState?.type)) {
    const routineAwakeSince = routineState.awakeSince ? new Date(routineState.awakeSince) : null;
    if (routineAwakeSince && isSameDate(routineAwakeSince, dateValue)) {
      awakeStart = awakeStart && awakeStart > routineAwakeSince ? awakeStart : routineAwakeSince;
    }

    if (awakeStart) {
      total += Math.max(0, minutesBetween(awakeStart, new Date()));
    }
  }

  return total;
}

function wakeAnchor(dayEvents) {
  const candidates = [];

  dayEvents.forEach((activity) => {
    if (activity.type === "despertar") {
      candidates.push(new Date(activity.time));
    }

    const end = sleepEnd(activity);
    if (end) {
      candidates.push(end);
    }
  });

  return candidates.sort((a, b) => b - a)[0] ?? null;
}

function daySummary(dateValue) {
  const dayEvents = eventsForDate(dateValue);
  const sleepMinutes = dayEvents
    .filter((activity) => activity.type === "sono" || activity.type === "dormir")
    .reduce((sum, activity) => sum + Number(activity.duration || 0), 0);
  const naps = dayEvents.filter((activity) => activity.type === "sono").length;

  return {
    dateValue,
    sleepMinutes,
    naps,
    feedings: dayEvents.filter((activity) => activity.type === "amamentacao").length,
    bottles: dayEvents.filter((activity) => activity.type === "mamadeira").length,
    diapers: dayEvents.filter((activity) => activity.type === "fralda").length,
  };
}

function recentDateValues() {
  const selected = new Date(`${dateFilter.value}T12:00:00`);
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(selected);
    date.setDate(selected.getDate() - (6 - index));
    return toDateValue(date);
  });
}

function buildMeta(activity) {
  const bits = [];

  if (activity.duration) {
    bits.push(`${activity.duration} min`);
  }

  if (activity.awakeBeforeSleep) {
    bits.push(`acordado ${formatDurationText(activity.awakeBeforeSleep)}`);
  }

  if (activity.amount) {
    bits.push(`${activity.amount} ml`);
  }

  if (activity.detail && activity.detail !== "Automático") {
    bits.push(activity.detail);
  }

  return bits.join(" • ");
}

function addActivity(activity) {
  activities.push(activity);
  applyRoutineSideEffects(activity);
}

function createWakeActivity(time, source) {
  return {
    id: crypto.randomUUID(),
    type: "despertar",
    time: toDateTimeValue(time),
    duration: 0,
    amount: 0,
    detail: "Automático",
    notes: "",
    automatic: true,
    source,
    createdAt: new Date().toISOString(),
  };
}

function applyRoutineSideEffects(activity) {
  if (activity.type === "despertar") {
    routineState.awakeSince = new Date(activity.time).toISOString();
    routineState.lastWakeStartedAt = routineState.awakeSince;
    saveRoutine();
    return;
  }

  if ((activity.type === "sono" || activity.type === "dormir") && activity.duration) {
    const end = sleepEnd(activity);
    if (end) {
      routineState.awakeSince = end.toISOString();
      routineState.lastSleepEndedAt = end.toISOString();
      saveRoutine();
    }
  }
}

function renderTimeline() {
  const dayEvents = eventsForSelectedDate().filter((activity) => !(activity.type === "despertar" && activity.automatic));
  timeline.innerHTML = "";

  dayEvents.forEach((activity) => {
    const node = template.content.firstElementChild.cloneNode(true);
    const end = sleepEnd(activity);
    node.dataset.type = activity.type;
    node.classList.toggle("is-automatic", Boolean(activity.automatic));
    node.querySelector(".event-title").textContent = activityLabels[activity.type];
    node.querySelector(".event-time").textContent = end
      ? `${formatTime(activity.time)}-${formatTime(end)}`
      : formatTime(activity.time);
    node.querySelector(".event-meta").textContent = buildMeta(activity);
    node.querySelector(".event-notes").textContent = activity.automatic ? "" : activity.notes;
    node.querySelector(".delete-button").addEventListener("click", () => {
      activities = activities.filter((item) => item.id !== activity.id);
      saveActivities();
      deleteActivityFromCloud(activity.id).catch((error) => {
        console.error(error);
        setSyncMessage("Apaguei neste aparelho, mas a nuvem falhou por enquanto.");
      });
      render();
    });
    timeline.append(node);
  });

  emptyState.hidden = dayEvents.length > 0;
  eventCount.textContent = `${dayEvents.length} ${dayEvents.length === 1 ? "registro" : "registros"}`;
}

function renderStats() {
  const dayEvents = eventsForSelectedDate();
  const totalSleep = dayEvents
    .filter((activity) => activity.type === "sono" || activity.type === "dormir")
    .reduce((sum, activity) => sum + Number(activity.duration || 0), 0);
  const feedings = dayEvents.filter((activity) => activity.type === "amamentacao").length;
  const bottleMl = dayEvents
    .filter((activity) => activity.type === "mamadeira")
    .reduce((sum, activity) => sum + Number(activity.amount || 0), 0);
  const diapers = dayEvents.filter((activity) => activity.type === "fralda").length;

  sleepTotal.textContent = formatMinutes(totalSleep);
  feedingCount.textContent = feedings;
  bottleTotal.textContent = `${bottleMl} ml`;
  diaperCount.textContent = diapers;
}

function renderProfile() {
  const ageInfo = babyAgeInfo();
  const suggested = suggestedWindow();
  const currentWindow = currentWakeWindow();
  const babyName = profile.name?.trim();

  babyNameInput.value = profile.name ?? "";
  babyBirthInput.value = profile.birthDate ?? "";
  wakeWindowInput.value = profile.wakeWindow ?? "";
  profileAvatarInitial.textContent = (babyName?.[0] || "B").toUpperCase();
  profileAvatar.classList.toggle("has-photo", Boolean(profile.photo));
  profileAvatarImage.hidden = !profile.photo;
  profileAvatarImage.src = profile.photo || "";
  diaryLabel.textContent = babyName ? `Diário de ${babyName}` : "Diário do bebê";
  wakeWindowHint.textContent = `Sugestão: ${suggested} min`;
  wakeWindowProfileValue.textContent = `${currentWindow} min`;
  wakeWindowProfileNote.textContent = profile.wakeWindow
    ? `Ajuste personalizado. Sugestão pela idade: ${suggested} min.`
    : ageInfo.hasBirthDate
      ? `Usando a sugestão para ${ageInfo.days} ${ageInfo.days === 1 ? "dia" : "dias"} de vida.`
      : "Usando uma estimativa padrão até preencher o nascimento.";
  babyDaysOld.textContent = ageInfo.hasBirthDate ? String(ageInfo.days) : "--";
  babyAgeSummary.textContent = ageInfo.hasBirthDate
    ? `${ageInfo.weeks} ${ageInfo.weeks === 1 ? "semana" : "semanas"} de vida`
    : "Preencha o nascimento para calcular os dias e semanas.";
  wakeWindowValue.textContent = `${currentWindow} min`;
  wakeWindowNote.textContent = profile.wakeWindow
    ? "Usando a janela personalizada do perfil."
    : ageInfo.hasBirthDate
      ? `Estimativa para ${ageInfo.days} ${ageInfo.days === 1 ? "dia" : "dias"} de vida.`
      : "Estimativa padrão até preencher o nascimento.";
}

function renderTimer() {
  timerButtons.forEach((button) => {
    button.classList.toggle("active", activeTimerState?.type === button.dataset.timerType);
  });

  const sleepIsActive = isSleepType(activeTimerState?.type);
  const sleepActionType = currentSleepActionType();
  const sleepActionIsNight = sleepActionType === "dormir";
  sleepTimerButton.classList.toggle("is-wake-action", sleepIsActive);
  sleepTimerButton.classList.toggle("is-night-action", !sleepIsActive && sleepActionIsNight);
  sleepTimerIcon.textContent = sleepIsActive ? "↟" : sleepActionIsNight ? "◐" : "☾";
  sleepTimerLabel.textContent = sleepIsActive ? "Acordou" : sleepActionIsNight ? "Iniciar noite" : "Iniciar soneca";
  wakeCard.classList.toggle("is-sleeping", sleepIsActive);
  wakeCard.classList.toggle("is-awake", Boolean(routineState.awakeSince) && !sleepIsActive);

  if (sleepIsActive) {
    const startedAt = new Date(activeTimerState.startedAt);
    stateLabel.textContent = "Dormindo há";
    awakeElapsed.textContent = formatElapsed(Date.now() - startedAt.getTime());
    awakeSinceLabel.textContent = activeTimerState.awakeBeforeSleep
      ? `Ficou acordado ${formatDurationText(activeTimerState.awakeBeforeSleep)} antes ${activeTimerState.type === "dormir" ? "da noite" : "desta soneca"}.`
      : activeTimerState.type === "dormir" ? "Sono noturno em andamento." : "Soneca em andamento.";
  } else if (routineState.awakeSince) {
    const awakeSince = new Date(routineState.awakeSince);
    stateLabel.textContent = "Acordado há";
    awakeElapsed.textContent = formatElapsed(Date.now() - awakeSince.getTime());
    awakeSinceLabel.textContent = `Desde ${formatClock(awakeSince)}. Ao iniciar soneca, este tempo pausa.`;
  } else {
    stateLabel.textContent = "Estado atual";
    awakeElapsed.textContent = "--:--";
    awakeSinceLabel.textContent = "Toque em Acordou ou inicie uma soneca para começar.";
  }

  if (!activeTimerState) {
    activeTimer.hidden = true;
    cancelSleepButton.hidden = true;
    timerStatus.textContent = routineState.awakeSince ? "Acordado" : "Nenhum estado ativo";
    activeTimerLabel.textContent = "Timer ativo";
    activeTimerElapsed.textContent = "00:00:00";
    finishTimerButton.textContent = "Finalizar";
    submitButtonIcon.textContent = "＋";
    submitButtonLabel.textContent = sleepActionIsNight ? "Registrar noite" : "Registrar";
    return;
  }

  const startedAt = new Date(activeTimerState.startedAt);
  activeTimer.hidden = sleepIsActive;
  cancelSleepButton.hidden = !sleepIsActive;
  cancelSleepButton.textContent = activeTimerState.type === "dormir" ? "Cancelar noite iniciada" : "Cancelar soneca iniciada";
  timerStatus.textContent = `${activityLabels[activeTimerState.type]} em andamento`;
  activeTimerLabel.textContent = activityLabels[activeTimerState.type];
  activeTimerElapsed.textContent = formatElapsed(Date.now() - startedAt.getTime());
  finishTimerButton.textContent = isSleepType(activeTimerState.type) ? "Acordou" : "Finalizar";
  submitButtonIcon.textContent = "✓";
  submitButtonLabel.textContent = isSleepType(activeTimerState.type)
    ? "Marcar que acordou"
    : `Finalizar ${activityLabels[activeTimerState.type]}`;
}

function startTimer(type) {
  if (activeTimerState && activeTimerState.type !== type) {
    const shouldReplace = window.confirm(
      `Existe um timer de ${activityLabels[activeTimerState.type]} ativo. Trocar para ${activityLabels[type]}?`,
    );

    if (!shouldReplace) {
      return;
    }
  }

  const now = new Date();
  const awakeSince = routineState.awakeSince ? new Date(routineState.awakeSince) : null;
  const awakeBeforeSleep = isSleepType(type) && awakeSince ? Math.max(0, minutesBetween(awakeSince, now)) : 0;

  activeTimerState = {
    type,
    startedAt: now.toISOString(),
    awakeBeforeSleep,
    pausedAwakeSince: isSleepType(type) ? routineState.awakeSince ?? "" : "",
  };

  if (isSleepType(type)) {
    routineState.awakeSince = "";
    saveRoutine();
  }

  setSelectedType(type);
  timeInput.value = toDateTimeValue(new Date(activeTimerState.startedAt));
  saveTimer();
  renderTimer();
}

function finishTimer() {
  if (!activeTimerState) {
    return;
  }

  const startedAt = new Date(activeTimerState.startedAt);
  const endedAt = new Date();
  const duration = Math.max(1, Math.round((Date.now() - startedAt.getTime()) / 60000));
  const activity = {
    id: crypto.randomUUID(),
    type: activeTimerState.type,
    time: toDateTimeValue(startedAt),
    duration,
    amount: Number(amountInput.value) || 0,
    detail: detailInput.value,
    notes: notesInput.value.trim(),
    awakeBeforeSleep: isSleepType(activeTimerState.type) ? activeTimerState.awakeBeforeSleep : 0,
    createdAt: new Date().toISOString(),
  };

  addActivity(activity);
  if (isSleepType(activity.type)) {
    routineState.awakeSince = endedAt.toISOString();
    routineState.lastSleepEndedAt = endedAt.toISOString();
    saveRoutine();
  }

  activeTimerState = null;
  saveActivities();
  saveActivityToCloud(activity).catch((error) => {
    console.error(error);
    setSyncMessage("Salvei neste aparelho, mas a nuvem falhou por enquanto.");
  });
  saveTimer();

  form.reset();
  setSelectedType(isSleepType(activity.type) ? "despertar" : activity.type);
  dateFilter.value = activity.time.slice(0, 10);
  timeInput.value = toDateTimeValue(new Date());
  formStatus.textContent =
    isSleepType(activity.type)
      ? `${activity.type === "dormir" ? "Noite" : "Soneca"} finalizada com ${duration} min. Tempo acordado reiniciado.`
      : `${activityLabels[activity.type]} finalizado com ${duration} min.`;
  render();
}

function cancelTimer() {
  if (!activeTimerState) {
    return;
  }

  if (isSleepType(activeTimerState.type) && activeTimerState.pausedAwakeSince) {
    routineState.awakeSince = activeTimerState.pausedAwakeSince;
    saveRoutine();
  }

  activeTimerState = null;
  saveTimer();
  formStatus.textContent = "Timer cancelado.";
  renderTimer();
}

function renderPlan() {
  const dayEvents = eventsForSelectedDate();
  const anchor = wakeAnchor(dayEvents);
  const windowMinutes = currentWakeWindow();
  const name = profile.name?.trim() || "Bebê";
  const today = toDateValue(new Date());
  const awakeMinutes = awakeMinutesForDate(dateFilter.value);

  if (!anchor) {
    nextNapTime.textContent = "--:--";
    nextNapStatus.textContent = "Registre que acordou ou finalize uma soneca para calcular.";
  } else {
    const nextNap = addMinutes(anchor, windowMinutes);
    nextNapTime.textContent = formatClock(nextNap);

    if (dateFilter.value === today) {
      const distance = minutesBetween(new Date(), nextNap);
      if (distance > 30) {
        nextNapStatus.textContent = `${name} deve começar a desacelerar em cerca de ${distance - 30} min.`;
      } else if (distance >= 0) {
        nextNapStatus.textContent = `Hora de preparar a soneca nos próximos ${distance} min.`;
      } else {
        nextNapStatus.textContent = `A janela passou há ${Math.abs(distance)} min. Observe sinais de sono.`;
      }
    } else {
      nextNapStatus.textContent = `Calculado a partir do último acordar às ${formatClock(anchor)}.`;
    }
  }

  const summary = daySummary(dateFilter.value);
  if (summary.sleepMinutes || summary.naps) {
    dayPlan.textContent = `${summary.naps} ${summary.naps === 1 ? "soneca" : "sonecas"}`;
    dayPlanNote.textContent = `${formatMinutes(summary.sleepMinutes)} de sono registrado hoje.`;
  } else {
    dayPlan.textContent = "Sem sono";
    dayPlanNote.textContent = "Comece registrando que acordou ou finalizando uma soneca.";
  }

  awakeToday.textContent = formatMinutes(awakeMinutes);
  if (dateFilter.value === today && isSleepType(activeTimerState?.type)) {
    awakeTodayNote.textContent = "Pausado enquanto o bebê dorme.";
  } else if (awakeMinutes) {
    awakeTodayNote.textContent = "Somando períodos entre acordar e dormir.";
  } else {
    awakeTodayNote.textContent = "Comece registrando que acordou.";
  }
}

function renderTrends() {
  const summaries = recentDateValues().map(daySummary);
  const totalSleep = summaries.reduce((sum, summary) => sum + summary.sleepMinutes, 0);
  const totalNaps = summaries.reduce((sum, summary) => sum + summary.naps, 0);
  const maxSleep = Math.max(1, ...summaries.map((summary) => summary.sleepMinutes));

  averageSleep.textContent = formatMinutes(Math.round(totalSleep / summaries.length));
  averageNaps.textContent = (totalNaps / summaries.length).toFixed(1);
  trendBars.innerHTML = "";

  summaries.forEach((summary) => {
    const date = new Date(`${summary.dateValue}T12:00:00`);
    const day = document.createElement("div");
    const track = document.createElement("div");
    const fill = document.createElement("div");
    const value = document.createElement("span");
    const label = document.createElement("span");

    day.className = "trend-day";
    track.className = "trend-track";
    fill.className = "trend-fill";
    value.className = "trend-value";
    label.className = "trend-label";

    fill.style.height = `${Math.max(4, (summary.sleepMinutes / maxSleep) * 100)}%`;
    value.textContent = summary.sleepMinutes ? formatMinutes(summary.sleepMinutes) : "0h";
    label.textContent = new Intl.DateTimeFormat("pt-BR", { weekday: "short" }).format(date).replace(".", "");

    track.append(fill);
    day.append(track, value, label);
    trendBars.append(day);
  });
}

function render() {
  todayLabel.textContent = formatLongDate(dateFilter.value);
  renderProfile();
  renderTimer();
  renderStats();
  renderPlan();
  renderTrends();
  renderTimeline();
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const type = selectedType();

  if (!type) {
    formStatus.textContent = "Escolha uma atividade para registrar.";
    return;
  }

  if (activeTimerState) {
    if (activeTimerState.type === type) {
      finishTimer();
      return;
    }

    formStatus.textContent = `Finalize ou cancele ${activityLabels[activeTimerState.type]} antes de registrar ${activityLabels[type]}.`;
    return;
  }

  const activity = {
    id: crypto.randomUUID(),
    type,
    time: timeInput.value,
    duration: Number(durationInput.value) || 0,
    amount: Number(amountInput.value) || 0,
    detail: detailInput.value,
    notes: notesInput.value.trim(),
    createdAt: new Date().toISOString(),
  };

  addActivity(activity);
  saveActivities();
  saveActivityToCloud(activity).catch((error) => {
    console.error(error);
    setSyncMessage("Salvei neste aparelho, mas a nuvem falhou por enquanto.");
  });

  const keepTime = new Date(activity.time);
  form.reset();
  setSelectedType(activity.type);
  timeInput.value = toDateTimeValue(keepTime);
  notesInput.value = "";
  formStatus.textContent = `${activityLabels[activity.type]} registrado às ${formatTime(activity.time)}.`;
  render();
});

dateFilter.addEventListener("change", render);

authForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!firebaseAuth) {
    setSyncMessage("Firebase ainda não carregou. Confira a internet e recarregue.");
    return;
  }

  try {
    setSyncMessage("Entrando...");
    await firebaseAuth.signInWithEmailAndPassword(authEmail.value.trim(), authPassword.value);
    authPassword.value = "";
  } catch (error) {
    setSyncMessage(authErrorMessage(error));
  }
});

signUpButton.addEventListener("click", async () => {
  if (!firebaseAuth) {
    setSyncMessage("Firebase ainda não carregou. Confira a internet e recarregue.");
    return;
  }

  try {
    setSyncMessage("Criando acesso...");
    await firebaseAuth.createUserWithEmailAndPassword(authEmail.value.trim(), authPassword.value);
    authPassword.value = "";
  } catch (error) {
    setSyncMessage(authErrorMessage(error));
  }
});

signOutButton.addEventListener("click", async () => {
  if (!firebaseAuth) {
    return;
  }

  await firebaseAuth.signOut();
});

form.querySelectorAll('input[name="type"]').forEach((input) => {
  input.addEventListener("change", () => {
    updateDetailOptions(input.value);
    updateAmountField(input.value);
    renderTimer();
  });
});

exportButton.addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(activities, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `projeto-baby-registros-${dateFilter.value}.json`;
  link.click();
  URL.revokeObjectURL(url);
});

clearButton.addEventListener("click", () => {
  const dayEvents = eventsForSelectedDate();
  if (!dayEvents.length) {
    return;
  }

  const message = `Limpar ${dayEvents.length} registro(s) de ${formatLongDate(dateFilter.value)}?`;
  if (window.confirm(message)) {
    activities = activities.filter((activity) => !activity.time.startsWith(dateFilter.value));
    saveActivities();
    deleteActivitiesFromCloud(dayEvents).catch((error) => {
      console.error(error);
      setSyncMessage("Limpei neste aparelho, mas a nuvem falhou por enquanto.");
    });
    render();
  }
});

babyNameInput.addEventListener("input", () => {
  profile.name = babyNameInput.value.trim();
  saveProfile();
  renderProfile();
  renderPlan();
});

babyBirthInput.addEventListener("input", () => {
  profile.birthDate = babyBirthInput.value;
  saveProfile();
  renderProfile();
  renderPlan();
});

babyPhotoInput.addEventListener("change", async () => {
  const file = babyPhotoInput.files?.[0];
  if (!file) {
    return;
  }

  try {
    profile.photo = await compressProfilePhoto(file);
    saveProfile();
    renderProfile();
    formStatus.textContent = "Foto do perfil atualizada.";
  } catch (error) {
    console.error(error);
    formStatus.textContent = "Não consegui carregar esta foto. Tente uma imagem JPG ou PNG.";
  } finally {
    babyPhotoInput.value = "";
  }
});

wakeWindowInput.addEventListener("input", () => {
  profile.wakeWindow = Number(wakeWindowInput.value) || "";
  saveProfile();
  renderProfile();
  renderPlan();
});

windowAdjustButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const nextWindow = Math.min(360, Math.max(30, currentWakeWindow() + Number(button.dataset.windowAdjust)));
    profile.wakeWindow = nextWindow;
    saveProfile();
    renderProfile();
    renderPlan();
  });
});

useSuggestionButton.addEventListener("click", () => {
  profile.wakeWindow = "";
  saveProfile();
  renderProfile();
  renderPlan();
});

timerButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const timerType = button.dataset.timerType === "sono" ? currentSleepActionType() : button.dataset.timerType;

    if (button.dataset.timerType === "sono" && isSleepType(activeTimerState?.type)) {
      finishTimer();
      return;
    }

    startTimer(timerType);
  });
});

finishTimerButton.addEventListener("click", finishTimer);
cancelTimerButton.addEventListener("click", cancelTimer);
cancelSleepButton.addEventListener("click", cancelTimer);

const now = new Date();
dateFilter.value = toDateValue(now);
timeInput.value = toDateTimeValue(now);
updateDetailOptions(selectedType());
updateAmountField(selectedType());
timerInterval = window.setInterval(renderTimer, 1000);
initializeFirebase();
render();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch((error) => {
      console.warn("Service worker não registrado.", error);
    });
  });
}
