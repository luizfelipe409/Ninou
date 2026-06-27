export function buildSyncStatus({ online, email = "" } = {}) {
  if (!online) return { title: "Offline", text: "Os registros serão sincronizados quando houver conexão." };
  return { title: "Sincronizado", text: email ? `Conta: ${email}` : "Conta conectada" };
}

export function getExportFileName(prefix = "ninou", date = new Date()) {
  const stamp = date.toISOString().replace(/[:.]/g, "-");
  return `${prefix}-${stamp}`;
}

export function buildAccountSummary({ email = "", hasPhoto = false, hasWeights = false } = {}) {
  return { email, hasPhoto, hasWeights };
}
