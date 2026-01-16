const screens = document.querySelectorAll("[data-screen]");
const playerListEl = document.querySelector("[data-player-list]");
const leaderboardEl = document.querySelector("[data-leaderboard]");
const podiumEl = document.querySelector("[data-podium]");
const currentPlayerEl = document.querySelector("[data-current-player]");
const weighSubtitleEl = document.querySelector("[data-weigh-subtitle]");
const leaderboardSubtitleEl = document.querySelector("[data-leaderboard-subtitle]");
const fireworksEl = document.querySelector("[data-fireworks]");

const state = {
  players: [],
  currentIndex: 0,
  screen: "splash",
};

const formatScore = (score) => `${score.toFixed(2)}%`;

const showScreen = (name) => {
  screens.forEach((screen) => {
    if (screen.dataset.screen === name) {
      screen.classList.add("screen--active");
    } else {
      screen.classList.remove("screen--active");
    }
  });
  state.screen = name;
};

const updatePlayerList = () => {
  playerListEl.innerHTML = "";

  state.players.forEach((player, index) => {
    const row = document.createElement("div");
    row.className = "player-list__item";
    row.innerHTML = `
      <div>
        <strong>${player.name}</strong>
        <div class="player-list__weight">${player.wholeWeight} g carrot</div>
      </div>
      <button class="btn btn--accent" data-remove="${index}" type="button">Remove</button>
    `;
    playerListEl.appendChild(row);
  });

  const startButton = document.querySelector("[data-action='begin-game']");
  startButton.disabled = state.players.length === 0;
};

const setTurnIntro = () => {
  const player = state.players[state.currentIndex];
  if (!player) return;

  currentPlayerEl.textContent = player.name;
  weighSubtitleEl.textContent = `Whole carrot weight: ${player.wholeWeight} g (holiday harvest)`;
};

const calculateScore = (halfA, halfB, wholeWeight) => {
  const diff = Math.abs(halfA - halfB);
  return (diff / wholeWeight) * 100;
};

const animateLeaderboard = (previousPositions) => {
  const rows = Array.from(leaderboardEl.children);
  rows.forEach((row) => {
    const id = row.dataset.playerId;
    const previous = previousPositions.get(id);
    if (!previous) return;
    const current = row.getBoundingClientRect();
    const deltaY = previous.top - current.top;
    if (deltaY) {
      row.animate(
        [
          { transform: `translateY(${deltaY}px)` },
          { transform: "translateY(0)" },
        ],
        { duration: 400, easing: "ease" }
      );
    }
  });
};

const updateLeaderboard = () => {
  const previousPositions = new Map();
  Array.from(leaderboardEl.children).forEach((row) => {
    previousPositions.set(row.dataset.playerId, row.getBoundingClientRect());
  });

  leaderboardEl.innerHTML = "";
  const sorted = [...state.players].sort((a, b) => {
    if (a.score == null) return 1;
    if (b.score == null) return -1;
    return a.score - b.score;
  });

  sorted.forEach((player, index) => {
    const row = document.createElement("div");
    row.className = "leaderboard__row";
    row.dataset.playerId = player.id;
    row.innerHTML = `
      <div class="leaderboard__rank">${index + 1}</div>
      <div>
        <strong>${player.name}</strong>
        <div class="leaderboard__weight">${player.wholeWeight} g carrot</div>
      </div>
      <div class="leaderboard__score">
        ${player.score == null ? "--" : formatScore(player.score)}
        <span>${player.score == null ? "Waiting" : "Score"}</span>
      </div>
    `;
    leaderboardEl.appendChild(row);
  });

  animateLeaderboard(previousPositions);
};

const updatePodium = () => {
  podiumEl.innerHTML = "";
  const ranked = [...state.players]
    .filter((player) => player.score != null)
    .sort((a, b) => a.score - b.score)
    .slice(0, 3);

  ranked.forEach((player, index) => {
    const row = document.createElement("div");
    row.className = "podium__place";
    row.innerHTML = `
      <div>
        <strong>${player.name}</strong>
        <div class="podium__score">${formatScore(player.score)}</div>
      </div>
      <div class="podium__badge">${index + 1}${
      index === 0 ? "st" : index === 1 ? "nd" : "rd"
    }</div>
    `;
    podiumEl.appendChild(row);
  });
};

const launchFireworks = () => {
  if (!fireworksEl) return;
  const colors = ["#f5c86b", "#d84b3a", "#2f8f4e", "#7cc6ff", "#f29fb1"];
  const bursts = 8;

  for (let i = 0; i < bursts; i += 1) {
    const firework = document.createElement("div");
    firework.className = "firework";
    firework.style.left = `${10 + Math.random() * 80}%`;
    firework.style.top = `${10 + Math.random() * 60}%`;
    firework.style.color = colors[Math.floor(Math.random() * colors.length)];
    firework.style.animationDelay = `${Math.random() * 0.3}s`;
    fireworksEl.appendChild(firework);

    firework.addEventListener(
      "animationend",
      () => {
        firework.remove();
      },
      { once: true }
    );
  }
};

const playCelebrationSound = () => {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return;
  const audioContext = new AudioContextClass();
  const now = audioContext.currentTime;
  const notes = [
    { freq: 523.25, start: 0, duration: 0.16 },
    { freq: 659.25, start: 0.18, duration: 0.16 },
    { freq: 783.99, start: 0.36, duration: 0.2 },
    { freq: 987.77, start: 0.62, duration: 0.3 },
  ];

  notes.forEach((note) => {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    oscillator.type = "triangle";
    oscillator.frequency.value = note.freq;
    gainNode.gain.setValueAtTime(0.001, now + note.start);
    gainNode.gain.exponentialRampToValueAtTime(0.2, now + note.start + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(
      0.001,
      now + note.start + note.duration
    );
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    oscillator.start(now + note.start);
    oscillator.stop(now + note.start + note.duration);
  });

  setTimeout(() => {
    audioContext.close();
  }, 1200);
};

const resetGame = () => {
  state.players = [];
  state.currentIndex = 0;
  updatePlayerList();
  showScreen("splash");
};

const playerForm = document.querySelector("[data-form='player']");
playerForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = new FormData(playerForm);
  const name = formData.get("playerName").trim();
  const weight = Number(formData.get("carrotWeight"));

  if (!name || Number.isNaN(weight) || weight <= 0) {
    return;
  }

  state.players.push({
    id: crypto.randomUUID(),
    name,
    wholeWeight: weight,
    score: null,
  });

  playerForm.reset();
  updatePlayerList();
});

playerListEl.addEventListener("click", (event) => {
  const button = event.target.closest("[data-remove]");
  if (!button) return;
  const index = Number(button.dataset.remove);
  state.players.splice(index, 1);
  updatePlayerList();
});

const weighForm = document.querySelector("[data-form='weigh']");
weighForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = new FormData(weighForm);
  const halfA = Number(formData.get("halfA"));
  const halfB = Number(formData.get("halfB"));

  const player = state.players[state.currentIndex];
  if (!player || halfA <= 0 || halfB <= 0) return;

  player.score = calculateScore(halfA, halfB, player.wholeWeight);
  weighForm.reset();
  updateLeaderboard();

  const isLast = state.currentIndex >= state.players.length - 1;
  leaderboardSubtitleEl.textContent = isLast
    ? "All carrots are weighed! Time for the sparkle finale."
    : `${player.name}'s score is in. Ready for the next snow-slice?`;

  const nextButton = document.querySelector("[data-action='next-turn']");
  const podiumButton = document.querySelector("[data-action='show-podium']");
  nextButton.style.display = isLast ? "none" : "inline-flex";
  podiumButton.style.display = isLast ? "inline-flex" : "none";

  showScreen("leaderboard");
});

document.body.addEventListener("click", (event) => {
  const action = event.target.closest("[data-action]");
  if (!action) return;

  switch (action.dataset.action) {
    case "start-setup":
      showScreen("setup");
      break;
    case "begin-game":
      state.currentIndex = 0;
      setTurnIntro();
      showScreen("turnIntro");
      break;
    case "begin-weigh":
      showScreen("weigh");
      break;
    case "next-turn":
      state.currentIndex += 1;
      setTurnIntro();
      showScreen("turnIntro");
      break;
    case "show-podium":
      updatePodium();
      playCelebrationSound();
      launchFireworks();
      showScreen("podium");
      break;
    case "restart":
      resetGame();
      break;
    default:
      break;
  }
});

updatePlayerList();
