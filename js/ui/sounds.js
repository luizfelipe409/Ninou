import { setText } from "../dom/dom.js";
import {
  SOUND_DURATION_MS,
  formatSoundTime,
  getRemainingSoundMs,
  getSoundButtonLabel,
  getSoundOption,
  getSoundProgressPercent,
  getSoundStatusLabel,
  normalizeSoundKey,
} from "../domain/sounds.js";

function audioNeedsSource(audio, src) {
  return !audio.src || !audio.src.endsWith(src.replace("./", ""));
}

export function initSleepSounds({ root = document } = {}) {
  const audio = root.querySelector("#sleepSoundAudio");
  const playPauseButton = root.querySelector("#soundPlayPause");
  const stopButton = root.querySelector("#soundStop");
  const timerLabel = root.querySelector("#soundTimer");
  const statusLabel = root.querySelector("#soundStatus");
  const progressBar = root.querySelector("#soundProgress");
  const currentIcon = root.querySelector("#soundCurrentIcon");
  const currentTitle = root.querySelector("#soundCurrentTitle");
  const currentDesc = root.querySelector("#soundCurrentDesc");
  const optionButtons = root.querySelectorAll(".sound-option");

  if (!audio || !playPauseButton || !stopButton || !optionButtons.length) return null;

  let selectedKey = "womb";
  let timerStartedAt = null;
  let pausedRemainingMs = SOUND_DURATION_MS;
  let timerInterval = null;
  let isPlaying = false;

  function getState() {
    return { timerStartedAt, pausedRemainingMs, isPlaying };
  }

  function getRemainingMs() {
    return getRemainingSoundMs(getState());
  }

  function renderSoundState() {
    const remaining = getRemainingMs();
    const progress = getSoundProgressPercent(remaining);

    setText(timerLabel, formatSoundTime(remaining));
    if (progressBar) progressBar.style.width = `${progress}%`;

    if (remaining <= 0) {
      stopSound({ completed: true });
      return;
    }

    setText(statusLabel, getSoundStatusLabel(getState()));
    setText(playPauseButton, getSoundButtonLabel(getState()));
  }

  function setSelectedSound(key, options = {}) {
    selectedKey = normalizeSoundKey(key);
    const selected = getSoundOption(selectedKey);

    optionButtons.forEach((button) => {
      button.classList.toggle("active", button.dataset.soundKey === selectedKey);
    });

    setText(currentIcon, selected.icon);
    setText(currentTitle, selected.title);
    setText(currentDesc, selected.desc);

    const shouldContinuePlaying = Boolean(options.continuePlaying && isPlaying);
    if (audioNeedsSource(audio, selected.src)) {
      audio.src = selected.src;
      audio.load();
    }

    if (shouldContinuePlaying) {
      audio.play().catch(() => {
        isPlaying = false;
        renderSoundState();
      });
    }
  }

  async function playSound() {
    const selected = getSoundOption(selectedKey);
    if (audioNeedsSource(audio, selected.src)) {
      audio.src = selected.src;
      audio.load();
    }

    audio.loop = true;
    try {
      await audio.play();
      isPlaying = true;
      timerStartedAt = Date.now();
      if (!timerInterval) timerInterval = setInterval(renderSoundState, 1000);
      renderSoundState();
    } catch {
      isPlaying = false;
      setText(statusLabel, "Toque novamente para liberar o áudio");
      setText(playPauseButton, "▶ Tocar por 1h");
    }
  }

  function pauseSound() {
    pausedRemainingMs = getRemainingMs();
    isPlaying = false;
    timerStartedAt = null;
    audio.pause();
    renderSoundState();
  }

  function stopSound(options = {}) {
    isPlaying = false;
    timerStartedAt = null;
    pausedRemainingMs = SOUND_DURATION_MS;
    audio.pause();
    audio.currentTime = 0;
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
    setText(statusLabel, options.completed ? "Timer finalizado" : "Pronto para tocar");
    renderSoundState();
  }

  playPauseButton.addEventListener("click", () => {
    if (isPlaying) {
      pauseSound();
      return;
    }
    playSound();
  });

  stopButton.addEventListener("click", () => stopSound());

  optionButtons.forEach((button) => {
    button.addEventListener("click", () => {
      setSelectedSound(button.dataset.soundKey, { continuePlaying: true });
    });
  });

  audio.addEventListener("ended", () => {
    if (isPlaying) {
      audio.currentTime = 0;
      audio.play().catch(() => {});
    }
  });

  setSelectedSound(selectedKey);
  renderSoundState();

  return {
    play: playSound,
    pause: pauseSound,
    stop: stopSound,
    select: setSelectedSound,
    getState: () => ({ selectedKey, remainingMs: getRemainingMs(), isPlaying }),
  };
}
