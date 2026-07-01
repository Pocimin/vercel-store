const USER_ID = "1160416704791330926";
const TRACK_LENGTH_SECONDS = 269;
const DISPLAY_OFFSET_SECONDS = 81;

const statusMap = {
  online: "Online",
  idle: "Idle",
  dnd: "Do not disturb",
  offline: "Offline",
};

function setStatus(status) {
  const dot = document.getElementById("status-dot");
  const text = document.getElementById("status-text");
  const normalized = statusMap[status] ? status : "offline";

  dot.className = `status-dot ${normalized}`;
  dot.title = statusMap[normalized];
  text.textContent = statusMap[normalized];
}

async function loadDiscordStatus() {
  try {
    const response = await fetch(`https://api.lanyard.rest/v1/users/${USER_ID}`);
    const result = await response.json();
    setStatus(result.success ? result.data.discord_status : "offline");
  } catch (error) {
    setStatus("offline");
  }
}

function formatTime(seconds) {
  const safeSeconds = Math.max(0, Math.floor(seconds || 0));
  const minutes = Math.floor(safeSeconds / 60);
  const rest = String(safeSeconds % 60).padStart(2, "0");
  return `${minutes}:${rest}`;
}

function setupMusicPlayer() {
  const card = document.querySelector(".music-card");
  const audio = document.getElementById("track");
  const playButton = document.getElementById("play-button");
  const playIcon = document.getElementById("play-icon");
  const progress = document.getElementById("progress-fill");
  const progressTrack = document.querySelector(".progress-track");
  const current = document.getElementById("current-time");

  audio.volume = 0.14;

  const setPlaying = (playing) => {
    card.dataset.playing = playing ? "true" : "false";
    playIcon.src = playing
      ? "assets/profile/pause-fill.svg"
      : "assets/profile/play-fill.svg";
    playButton.setAttribute("aria-label", playing ? "Pause music" : "Play music");
  };

  const updateProgress = () => {
    const displayTime = Math.min(
      TRACK_LENGTH_SECONDS,
      DISPLAY_OFFSET_SECONDS + (audio.currentTime || 0),
    );
    const percent = (displayTime / TRACK_LENGTH_SECONDS) * 100;

    current.textContent = formatTime(displayTime);
    progress.style.width = `${percent}%`;
    progressTrack.setAttribute("aria-valuenow", String(Math.round(percent)));
  };

  const play = async () => {
    try {
      await audio.play();
      setPlaying(true);
    } catch (error) {
      setPlaying(false);
    }
  };

  audio.addEventListener("timeupdate", updateProgress);
  audio.addEventListener("loadedmetadata", updateProgress);
  audio.addEventListener("play", () => setPlaying(true));
  audio.addEventListener("pause", () => setPlaying(false));

  playButton.addEventListener("click", (event) => {
    event.stopPropagation();
    if (audio.paused) {
      play();
    } else {
      audio.pause();
    }
  });

  setPlaying(false);
  updateProgress();

  return { play };
}

function setupEntryOverlay(player) {
  const overlay = document.getElementById("entry-overlay");
  if (!overlay) return;

  const enter = () => {
    overlay.classList.add("is-hidden");
    player.play();
    window.setTimeout(() => overlay.remove(), 260);
  };

  overlay.addEventListener("click", enter, { once: true });
}

function setupCursorGlitter() {
  const layer = document.getElementById("glitter-layer");
  const colors = ["#ffffff", "#b7c8ff", "#a7f3d0", "#f0abfc", "#fde68a"];
  let lastSpark = 0;

  window.addEventListener("pointermove", (event) => {
    const now = performance.now();
    if (now - lastSpark < 28) return;
    lastSpark = now;

    const sparkle = document.createElement("span");
    const color = colors[Math.floor(Math.random() * colors.length)];
    const driftX = `${(Math.random() - 0.5) * 42}px`;
    const driftY = `${(Math.random() - 0.5) * 42}px`;

    sparkle.className = "sparkle";
    sparkle.style.left = `${event.clientX}px`;
    sparkle.style.top = `${event.clientY}px`;
    sparkle.style.color = color;
    sparkle.style.setProperty("--dx", driftX);
    sparkle.style.setProperty("--dy", driftY);

    layer.appendChild(sparkle);
    window.setTimeout(() => sparkle.remove(), 700);
  });
}

function setupTiltEffect() {
  const card = document.querySelector(".profile-window");
  if (!card) return;

  card.addEventListener("pointermove", (event) => {
    const rect = card.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    const rotateX = `${(-y * 5).toFixed(2)}deg`;
    const rotateY = `${(x * 6).toFixed(2)}deg`;

    card.classList.add("is-tilting");
    card.style.transform = `rotateX(${rotateX}) rotateY(${rotateY})`;
  });

  card.addEventListener("pointerleave", () => {
    card.classList.remove("is-tilting");
    card.style.transform = "";
  });
}

loadDiscordStatus();
window.setInterval(loadDiscordStatus, 30000);
setupEntryOverlay(setupMusicPlayer());
setupCursorGlitter();
setupTiltEffect();
