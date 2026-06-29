const ONE_HOUR_MS = 60 * 60 * 1000;

export const SOUND_DURATION_MS = ONE_HOUR_MS;

export const soundOptions = {
  womb: {
    title: "Som do útero",
    desc: "Som profundo com batimentos e sensação acolhedora de útero.",
    icon: "💗",
    src: "./audio/som-utero.mp3",
  },
  relax: {
    title: "Som para relaxar",
    desc: "Som relaxante enviado para acalmar e embalar o sono.",
    icon: "🌙",
    src: "./audio/som-relaxar.mp3",
  },
  rhythm: {
    title: "Ritmo suave bebê",
    desc: "Ritmo suave enviado para uma rotina tranquila.",
    icon: "🧸",
    src: "./audio/ritmo-suave-bebe.mp3",
  },
};

export function normalizeSoundKey(key) {
  return Object.prototype.hasOwnProperty.call(soundOptions, key) ? key : "womb";
}

export function getSoundOption(key) {
  return soundOptions[normalizeSoundKey(key)];
}

export function formatSoundTime(ms) {
  const totalSeconds = Math.max(0, Math.ceil(Number(ms || 0) / 1000));
  const hoursValue = Math.floor(totalSeconds / 3600);
  const minutesValue = Math.floor((totalSeconds % 3600) / 60);
  const secondsValue = totalSeconds % 60;
  return `${String(hoursValue).padStart(2, "0")}:${String(minutesValue).padStart(2, "0")}:${String(secondsValue).padStart(2, "0")}`;
}

export function getRemainingSoundMs({ timerStartedAt, isPlaying, pausedRemainingMs }) {
  if (!timerStartedAt || !isPlaying) return Math.max(0, Number(pausedRemainingMs || 0));
  return Math.max(0, Number(pausedRemainingMs || 0) - (Date.now() - timerStartedAt));
}

export function getSoundProgressPercent(remainingMs, durationMs = SOUND_DURATION_MS) {
  const safeDuration = Math.max(1, Number(durationMs || SOUND_DURATION_MS));
  const elapsed = safeDuration - Math.max(0, Number(remainingMs || 0));
  return Math.min(100, Math.max(0, (elapsed / safeDuration) * 100));
}

export function getSoundButtonLabel({ isPlaying, pausedRemainingMs }, durationMs = SOUND_DURATION_MS) {
  if (isPlaying) return "⏸ Pausar";
  if (pausedRemainingMs < durationMs) return "▶ Continuar";
  return "▶ Tocar por 1h";
}

export function getSoundStatusLabel({ isPlaying, pausedRemainingMs }, durationMs = SOUND_DURATION_MS) {
  if (isPlaying) return "Tocando agora";
  if (pausedRemainingMs < durationMs) return "Pausado";
  return "Pronto para tocar";
}
