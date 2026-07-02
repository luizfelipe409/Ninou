// Ninou v75.57 — Perfil Familiar + Convite de Cuidador
// Integre este bloco ao JS principal do app depois da inicialização das variáveis globais.

const mainFamilyId = "ninou-family-luizfelipe";
const familyDisplayName = "Família do Francisco";
const caregiverStorageKey = "ninou.device.caregiver";
const inviteStorageKey = "ninou.family.activeInvite";
const preferencesStorageKey = "ninou.family.preferences";

let selectedCaregiverAvatar = "pai-modern-01";
let activeInvite = loadActiveInvite();
let profilePreferences = loadProfilePreferences();

const caregiverAvatarMap = {
  "pai-modern-01": "👨‍🍼",
  "mae-modern-01": "👩‍🍼",
  "avo-modern-01": "👵",
  "baba-modern-01": "🧑‍🍼",
};

const editCaregiverButton = document.querySelector("#editCaregiverButton");
const caregiverModal = document.querySelector("#caregiverModal");
const caregiverNameInput = document.querySelector("#caregiverNameInput");
const caregiverRelationshipInput = document.querySelector("#caregiverRelationshipInput");
const saveCaregiverButton = document.querySelector("#saveCaregiverButton");
const deviceCaregiverName = document.querySelector("#deviceCaregiverName");
const deviceCaregiverAvatar = document.querySelector("#deviceCaregiverAvatar");
const deviceCaregiverHint = document.querySelector("#deviceCaregiverHint");
const familyNameLabel = document.querySelector("#familyNameLabel");
const familyAccountLabel = document.querySelector("#familyAccountLabel");
const familyProfileBabyName = document.querySelector("#familyProfileBabyName");
const familyProfileBabyMeta = document.querySelector("#familyProfileBabyMeta");
const familyWakeWindowLabel = document.querySelector("#familyWakeWindowLabel");
const familyWeightUnitLabel = document.querySelector("#familyWeightUnitLabel");
const createInviteButton = document.querySelector("#createInviteButton");
const joinInviteButton = document.querySelector("#joinInviteButton");
const activeInviteBox = document.querySelector("#activeInviteBox");
const activeInviteCode = document.querySelector("#activeInviteCode");
const activeInviteHint = document.querySelector("#activeInviteHint");
const inviteShareActions = document.querySelector("#inviteShareActions");
const copyInviteButton = document.querySelector("#copyInviteButton");
const shareInviteWhatsAppButton = document.querySelector("#shareInviteWhatsAppButton");
const joinFamilyModal = document.querySelector("#joinFamilyModal");
const joinInviteCodeInput = document.querySelector("#joinInviteCodeInput");
const joinInviteFeedback = document.querySelector("#joinInviteFeedback");
const confirmJoinInviteButton = document.querySelector("#confirmJoinInviteButton");
const themeModeSelect = document.querySelector("#themeModeSelect");
const weightUnitSelect = document.querySelector("#weightUnitSelect");
const notifyRoutineToggle = document.querySelector("#notifyRoutineToggle");
const notifyDailyReportToggle = document.querySelector("#notifyDailyReportToggle");
const supportSuggestionButton = document.querySelector("#supportSuggestionButton");
const supportBugButton = document.querySelector("#supportBugButton");

function getDefaultCaregiver() {
  return {
    name: "",
    relationship: "Pai",
    avatar: "pai-modern-01",
    updatedAt: null,
  };
}

function normalizeCaregiver(caregiver = {}) {
  const fallback = getDefaultCaregiver();
  const relationship = ["Pai", "Mãe", "Avó", "Avô", "Tia", "Tio", "Babá", "Outro"].includes(caregiver.relationship)
    ? caregiver.relationship
    : fallback.relationship;

  return {
    name: typeof caregiver.name === "string" ? caregiver.name.trim().slice(0, 40) : "",
    relationship,
    avatar: caregiverAvatarMap[caregiver.avatar] ? caregiver.avatar : fallback.avatar,
    updatedAt: Number.isFinite(Number(caregiver.updatedAt)) ? Number(caregiver.updatedAt) : null,
  };
}

function loadDeviceCaregiver() {
  try {
    return normalizeCaregiver(JSON.parse(localStorage.getItem(caregiverStorageKey) || "{}"));
  } catch {
    return getDefaultCaregiver();
  }
}

function saveDeviceCaregiver(caregiver) {
  const normalized = normalizeCaregiver({
    ...caregiver,
    updatedAt: Date.now(),
  });
  localStorage.setItem(caregiverStorageKey, JSON.stringify(normalized));
  renderDeviceCaregiver();
  saveCaregiverMemberToCloud(normalized);
  return normalized;
}

function getDeviceCaregiver() {
  return loadDeviceCaregiver();
}

function getCaregiverLabel() {
  const caregiver = getDeviceCaregiver();
  if (!caregiver.name) return "Cuidador não configurado";
  return `${caregiver.name} · ${caregiver.relationship}`;
}

function getCaregiverEventFields() {
  const caregiver = getDeviceCaregiver();
  return {
    caregiverName: caregiver.name || "Cuidador",
    caregiverRelationship: caregiver.relationship || "Responsável",
    caregiverLabel: caregiver.name ? `${caregiver.name} · ${caregiver.relationship}` : "Cuidador não configurado",
    createdByUid: cloudUser?.uid || null,
    createdAtClient: Date.now(),
  };
}

function renderDeviceCaregiver() {
  const caregiver = getDeviceCaregiver();
  if (deviceCaregiverName) {
    deviceCaregiverName.textContent = caregiver.name ? `${caregiver.name} · ${caregiver.relationship}` : "Não configurado";
  }
  if (deviceCaregiverAvatar) {
    deviceCaregiverAvatar.textContent = caregiverAvatarMap[caregiver.avatar] || "👤";
  }
  if (deviceCaregiverHint) {
    deviceCaregiverHint.textContent = caregiver.name
      ? `As ações deste aparelho serão registradas como ${caregiver.name} · ${caregiver.relationship}.`
      : "Escolha quem está usando este aparelho para os registros ficarem corretos.";
  }
}

function openCaregiverEditor() {
  const caregiver = getDeviceCaregiver();
  selectedCaregiverAvatar = caregiver.avatar || "pai-modern-01";
  if (caregiverNameInput) caregiverNameInput.value = caregiver.name || "";
  if (caregiverRelationshipInput) caregiverRelationshipInput.value = caregiver.relationship || "Pai";
  renderCaregiverAvatarSelection();
  if (caregiverModal) {
    caregiverModal.hidden = false;
    caregiverModal.setAttribute("aria-hidden", "false");
  }
  setTimeout(() => caregiverNameInput?.focus(), 50);
}

function closeCaregiverEditor() {
  if (caregiverModal) {
    caregiverModal.hidden = true;
    caregiverModal.setAttribute("aria-hidden", "true");
  }
}

function renderCaregiverAvatarSelection() {
  document.querySelectorAll("[data-caregiver-avatar]").forEach((button) => {
    button.classList.toggle("active", button.dataset.caregiverAvatar === selectedCaregiverAvatar);
  });
}

function handleSaveCaregiver() {
  const name = caregiverNameInput?.value?.trim() || "";
  if (!name) {
    caregiverNameInput?.focus();
    return;
  }
  saveDeviceCaregiver({
    name,
    relationship: caregiverRelationshipInput?.value || "Pai",
    avatar: selectedCaregiverAvatar,
  });
  closeCaregiverEditor();
}

function loadActiveInvite() {
  try {
    return JSON.parse(localStorage.getItem(inviteStorageKey) || "null");
  } catch {
    return null;
  }
}

function saveActiveInvite(invite) {
  activeInvite = invite;
  if (invite) {
    localStorage.setItem(inviteStorageKey, JSON.stringify(invite));
  } else {
    localStorage.removeItem(inviteStorageKey);
  }
  renderActiveInvite();
}

function generateInviteCode() {
  return Math.random().toString(36).replace(/[^a-z0-9]/gi, "").slice(2, 10).toUpperCase().padEnd(8, "7");
}

function getInviteMessage(code) {
  return `Você foi convidado(a) para acompanhar a rotina do Francisco no Ninou.\nCódigo de convite: ${code}\nAcesse o Ninou, toque em Perfil > Entrar com código e informe este código.`;
}

async function createCaregiverInvite() {
  const code = generateInviteCode();
  const now = Date.now();
  const expiresAtClient = now + 7 * 24 * 60 * 60 * 1000;
  const caregiver = getDeviceCaregiver();
  const invite = {
    code,
    familyId: mainFamilyId,
    familyName: familyDisplayName,
    status: "active",
    createdByUid: cloudUser?.uid || null,
    createdByName: caregiver.name || cloudUser?.email || "Cuidador",
    createdAtClient: now,
    expiresAtClient,
  };

  saveActiveInvite(invite);

  try {
    const services = await getFirebaseServices?.();
    if (services?.db && cloudUser) {
      const { doc, setDoc, serverTimestamp, Timestamp } = services;
      await setDoc(doc(services.db, "families", mainFamilyId, "invitations", code), {
        ...invite,
        createdAt: serverTimestamp(),
        expiresAt: Timestamp.fromMillis(expiresAtClient),
      }, { merge: true });
    }
  } catch (error) {
    console.warn("Convite salvo apenas localmente:", error);
  }
}

function renderActiveInvite() {
  const invite = activeInvite;
  const isActive = invite && invite.code && (!invite.expiresAtClient || invite.expiresAtClient > Date.now());
  if (activeInviteBox) activeInviteBox.hidden = !isActive;
  if (inviteShareActions) inviteShareActions.hidden = !isActive;
  if (activeInviteCode) activeInviteCode.textContent = isActive ? invite.code : "—";
  if (activeInviteHint) {
    activeInviteHint.textContent = isActive ? "Expira em 7 dias" : "Nenhum convite ativo";
  }
}

async function copyActiveInvite() {
  if (!activeInvite?.code) return;
  const message = getInviteMessage(activeInvite.code);
  try {
    await navigator.clipboard.writeText(activeInvite.code);
  } catch {
    window.prompt("Copie o código do convite:", activeInvite.code);
  }
}

function shareInviteOnWhatsApp() {
  if (!activeInvite?.code) return;
  const url = `https://wa.me/?text=${encodeURIComponent(getInviteMessage(activeInvite.code))}`;
  window.open(url, "_blank", "noopener,noreferrer");
}

function openJoinFamilyModal() {
  if (joinInviteCodeInput) joinInviteCodeInput.value = "";
  if (joinInviteFeedback) joinInviteFeedback.textContent = "";
  if (joinFamilyModal) {
    joinFamilyModal.hidden = false;
    joinFamilyModal.setAttribute("aria-hidden", "false");
  }
  setTimeout(() => joinInviteCodeInput?.focus(), 50);
}

function closeJoinFamilyModal() {
  if (joinFamilyModal) {
    joinFamilyModal.hidden = true;
    joinFamilyModal.setAttribute("aria-hidden", "true");
  }
}

async function confirmJoinInvite() {
  const code = (joinInviteCodeInput?.value || "").trim().toUpperCase().replace(/\s/g, "");
  if (!code) {
    if (joinInviteFeedback) joinInviteFeedback.textContent = "Digite o código do convite.";
    return;
  }

  try {
    const services = await getFirebaseServices?.();
    if (!services?.db || !cloudUser) throw new Error("Firebase indisponível");
    const { doc, getDoc, setDoc, serverTimestamp } = services;
    const inviteRef = doc(services.db, "families", mainFamilyId, "invitations", code);
    const inviteSnap = await getDoc(inviteRef);
    if (!inviteSnap.exists()) throw new Error("Convite não encontrado");
    const invite = inviteSnap.data();
    if (invite.status && invite.status !== "active") throw new Error("Convite inativo");

    await setDoc(doc(services.db, "users", cloudUser.uid, "access", "ninou"), {
      familyId: mainFamilyId,
      role: "caregiver",
      joinedByInvite: code,
      joinedAt: serverTimestamp(),
    }, { merge: true });

    if (joinInviteFeedback) joinInviteFeedback.textContent = "Convite aceito. Agora configure o cuidador deste aparelho.";
    setTimeout(() => {
      closeJoinFamilyModal();
      openCaregiverEditor();
    }, 700);
  } catch (error) {
    console.warn(error);
    if (joinInviteFeedback) {
      joinInviteFeedback.textContent = "Não foi possível validar o convite agora. Verifique a conexão ou as permissões do Firebase.";
    }
  }
}

function loadProfilePreferences() {
  try {
    return {
      themeMode: "light",
      weightUnit: "kg",
      notifications: {
        routine: false,
        dailyReport: false,
      },
      ...JSON.parse(localStorage.getItem(preferencesStorageKey) || "{}"),
    };
  } catch {
    return {
      themeMode: "light",
      weightUnit: "kg",
      notifications: { routine: false, dailyReport: false },
    };
  }
}

function saveProfilePreferences(patch = {}) {
  profilePreferences = {
    ...profilePreferences,
    ...patch,
    notifications: {
      ...profilePreferences.notifications,
      ...(patch.notifications || {}),
    },
  };
  localStorage.setItem(preferencesStorageKey, JSON.stringify(profilePreferences));
  renderProfilePreferences();
  scheduleProfileCloudSave?.();
}

function renderProfilePreferences() {
  document.body.classList.toggle("theme-light", profilePreferences.themeMode === "light");
  document.body.classList.toggle("theme-dark", profilePreferences.themeMode === "dark");
  if (themeModeSelect) themeModeSelect.value = profilePreferences.themeMode || "light";
  if (weightUnitSelect) weightUnitSelect.value = profilePreferences.weightUnit || "kg";
  if (familyWeightUnitLabel) familyWeightUnitLabel.textContent = profilePreferences.weightUnit || "kg";
  if (notifyRoutineToggle) notifyRoutineToggle.checked = Boolean(profilePreferences.notifications?.routine);
  if (notifyDailyReportToggle) notifyDailyReportToggle.checked = Boolean(profilePreferences.notifications?.dailyReport);
}

function renderFamilyProfileCards() {
  const babyName = typeof getBabyName === "function" ? getBabyName() : babyProfile?.name || "";
  const ageText = typeof getBabyAgeText === "function" ? getBabyAgeText() : { profile: "Nascimento não preenchido" };
  if (familyProfileBabyName) familyProfileBabyName.textContent = babyName || "Francisco";
  if (familyProfileBabyMeta) familyProfileBabyMeta.textContent = ageText.profile || "Nascimento não preenchido";
  if (familyWakeWindowLabel) familyWakeWindowLabel.textContent = `${wakeWindowMinutes || 70} min`;
  if (familyNameLabel) familyNameLabel.textContent = familyDisplayName;
  if (familyAccountLabel) familyAccountLabel.textContent = cloudUser?.email || localStorage.getItem("ninou.demo.email") || "Conta não conectada";
  renderDeviceCaregiver();
  renderActiveInvite();
  renderProfilePreferences();
}

async function saveCaregiverMemberToCloud(caregiver) {
  try {
    const services = await getFirebaseServices?.();
    if (!services?.db || !cloudUser) return;
    const { doc, setDoc, serverTimestamp } = services;
    await setDoc(doc(services.db, "families", mainFamilyId, "members", cloudUser.uid), {
      displayName: caregiver.name,
      relationship: caregiver.relationship,
      avatar: caregiver.avatar,
      role: cloudUser.email === "francisco@gmail.com" ? "owner" : "caregiver",
      updatedAt: serverTimestamp(),
      clientUpdatedAt: Date.now(),
    }, { merge: true });
  } catch (error) {
    console.warn("Não foi possível salvar cuidador na nuvem:", error);
  }
}

function openSupportWhatsApp(kind) {
  const text = kind === "bug"
    ? "Olá! Gostaria de reportar um problema no app Ninou."
    : "Olá! Gostaria de enviar uma sugestão para o app Ninou.";
  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
}

// Ponto de integração: ao criar evento, espalhe estes campos dentro do objeto salvo:
// const event = { ...makeEvent(...), ...getCaregiverEventFields() };
// Se a função makeEvent centraliza todos os eventos, prefira incluir esses campos dentro dela.

function enhanceEventWithCaregiver(event) {
  return {
    ...event,
    ...getCaregiverEventFields(),
  };
}

// Ponto de integração: ao renderizar metadados do evento, inclua:
function getEventCaregiverMeta(event = {}) {
  if (event.caregiverLabel) return `Registrado por ${event.caregiverLabel}`;
  if (event.caregiverName) return `Registrado por ${event.caregiverName}${event.caregiverRelationship ? ` · ${event.caregiverRelationship}` : ""}`;
  return "Registrado por cuidador";
}

editCaregiverButton?.addEventListener("click", openCaregiverEditor);
saveCaregiverButton?.addEventListener("click", handleSaveCaregiver);
createInviteButton?.addEventListener("click", createCaregiverInvite);
copyInviteButton?.addEventListener("click", copyActiveInvite);
shareInviteWhatsAppButton?.addEventListener("click", shareInviteOnWhatsApp);
joinInviteButton?.addEventListener("click", openJoinFamilyModal);
confirmJoinInviteButton?.addEventListener("click", confirmJoinInvite);
supportSuggestionButton?.addEventListener("click", () => openSupportWhatsApp("suggestion"));
supportBugButton?.addEventListener("click", () => openSupportWhatsApp("bug"));

document.querySelectorAll("[data-close-caregiver-modal]").forEach((button) => {
  button.addEventListener("click", closeCaregiverEditor);
});

document.querySelectorAll("[data-close-join-modal]").forEach((button) => {
  button.addEventListener("click", closeJoinFamilyModal);
});

document.querySelectorAll("[data-caregiver-avatar]").forEach((button) => {
  button.addEventListener("click", () => {
    selectedCaregiverAvatar = button.dataset.caregiverAvatar || "pai-modern-01";
    renderCaregiverAvatarSelection();
  });
});

themeModeSelect?.addEventListener("change", () => {
  saveProfilePreferences({ themeMode: themeModeSelect.value === "dark" ? "dark" : "light" });
});

weightUnitSelect?.addEventListener("change", () => {
  saveProfilePreferences({ weightUnit: weightUnitSelect.value === "g" ? "g" : "kg" });
});

notifyRoutineToggle?.addEventListener("change", () => {
  saveProfilePreferences({ notifications: { routine: notifyRoutineToggle.checked } });
});

notifyDailyReportToggle?.addEventListener("change", () => {
  saveProfilePreferences({ notifications: { dailyReport: notifyDailyReportToggle.checked } });
});

renderFamilyProfileCards();
