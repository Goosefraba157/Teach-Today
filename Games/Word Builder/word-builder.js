(() => {
  "use strict";

  const STORAGE_KEY = "wilsonWordBuilder.v1";
  const HUB_STORAGE_KEY = "teachTodayGameHub.v1";
  const GAME_ID = "wordBuilder";
  const BASE_TIME = 18000;
  const milestones = [250, 750, 1500, 3000, 5500, 9000, 14000];
  const vowelSet = new Set(["a", "e", "i", "o", "u"]);

  const WORDS = [
    entry("cat", ["c", "a", "t"], "CVC"),
    entry("map", ["m", "a", "p"], "CVC"),
    entry("sad", ["s", "a", "d"], "CVC"),
    entry("sit", ["s", "i", "t"], "CVC"),
    entry("lip", ["l", "i", "p"], "CVC"),
    entry("dog", ["d", "o", "g"], "CVC"),
    entry("sun", ["s", "u", "n"], "CVC"),
    entry("rub", ["r", "u", "b"], "CVC"),
    entry("pen", ["p", "e", "n"], "CVC"),
    entry("gum", ["g", "u", "m"], "CVC"),
    entry("top", ["t", "o", "p"], "CVC"),
    entry("bus", ["b", "u", "s"], "CVC"),
    entry("ship", ["sh", "i", "p"], "Opening digraph"),
    entry("shop", ["sh", "o", "p"], "Opening digraph"),
    entry("shut", ["sh", "u", "t"], "Opening digraph"),
    entry("shed", ["sh", "e", "d"], "Opening digraph"),
    entry("chat", ["ch", "a", "t"], "Opening digraph"),
    entry("chip", ["ch", "i", "p"], "Opening digraph"),
    entry("chop", ["ch", "o", "p"], "Opening digraph"),
    entry("chin", ["ch", "i", "n"], "Opening digraph"),
    entry("that", ["th", "a", "t"], "Opening digraph"),
    entry("then", ["th", "e", "n"], "Opening digraph"),
    entry("thin", ["th", "i", "n"], "Opening digraph"),
    entry("whip", ["wh", "i", "p"], "Opening digraph"),
    entry("when", ["wh", "e", "n"], "Opening digraph"),
    entry("back", ["b", "a", "ck"], "Closing digraph"),
    entry("deck", ["d", "e", "ck"], "Closing digraph"),
    entry("duck", ["d", "u", "ck"], "Closing digraph"),
    entry("kick", ["k", "i", "ck"], "Closing digraph"),
    entry("rock", ["r", "o", "ck"], "Closing digraph"),
    entry("sick", ["s", "i", "ck"], "Closing digraph"),
    entry("dish", ["d", "i", "sh"], "Closing digraph"),
    entry("fish", ["f", "i", "sh"], "Closing digraph"),
    entry("mash", ["m", "a", "sh"], "Closing digraph"),
    entry("rush", ["r", "u", "sh"], "Closing digraph"),
    entry("wish", ["w", "i", "sh"], "Closing digraph"),
    entry("much", ["m", "u", "ch"], "Closing digraph"),
    entry("rich", ["r", "i", "ch"], "Closing digraph"),
    entry("bath", ["b", "a", "th"], "Closing digraph"),
    entry("math", ["m", "a", "th"], "Closing digraph"),
    entry("path", ["p", "a", "th"], "Closing digraph"),
    entry("can", ["c", "a", "n"], "Glued sound", { weldedIndexes: [1, 2], markIndexes: [1, 2], markName: "glued sound" }),
    entry("fan", ["f", "a", "n"], "Glued sound", { weldedIndexes: [1, 2], markIndexes: [1, 2], markName: "glued sound" }),
    entry("man", ["m", "a", "n"], "Glued sound", { weldedIndexes: [1, 2], markIndexes: [1, 2], markName: "glued sound" }),
    entry("pan", ["p", "a", "n"], "Glued sound", { weldedIndexes: [1, 2], markIndexes: [1, 2], markName: "glued sound" }),
    entry("ran", ["r", "a", "n"], "Glued sound", { weldedIndexes: [1, 2], markIndexes: [1, 2], markName: "glued sound" }),
    entry("tan", ["t", "a", "n"], "Glued sound", { weldedIndexes: [1, 2], markIndexes: [1, 2], markName: "glued sound" }),
    entry("ham", ["h", "a", "m"], "Glued sound", { weldedIndexes: [1, 2], markIndexes: [1, 2], markName: "glued sound" }),
    entry("jam", ["j", "a", "m"], "Glued sound", { weldedIndexes: [1, 2], markIndexes: [1, 2], markName: "glued sound" }),
    entry("shack", ["sh", "a", "ck"], "Boss build", { boss: true }),
    entry("check", ["ch", "e", "ck"], "Boss build", { boss: true }),
    entry("chick", ["ch", "i", "ck"], "Boss build", { boss: true }),
    entry("thick", ["th", "i", "ck"], "Boss build", { boss: true }),
    entry("whack", ["wh", "a", "ck"], "Boss build", { boss: true })
  ];

  const DISTRACTORS = ["a", "e", "i", "o", "u", "b", "d", "f", "g", "h", "j", "k", "l", "m", "n", "p", "r", "s", "t", "v", "w", "z", "sh", "ch", "th", "wh", "ck"];

  const dom = {
    playerInitials: document.querySelector("#playerInitials"),
    playerName: document.querySelector("#playerName"),
    totalPoints: document.querySelector("#totalPoints"),
    roundLevel: document.querySelector("#roundLevel"),
    prompt: document.querySelector("#prompt"),
    timerFill: document.querySelector("#timerFill"),
    targetWord: document.querySelector("#targetWord"),
    buildStage: document.querySelector("#buildStage"),
    slotRow: document.querySelector("#slotRow"),
    tileBank: document.querySelector("#tileBank"),
    markPanel: document.querySelector("#markPanel"),
    markPrompt: document.querySelector("#markPrompt"),
    markWord: document.querySelector("#markWord"),
    scoopBtn: document.querySelector("#scoopBtn"),
    closedBtn: document.querySelector("#closedBtn"),
    clearBtn: document.querySelector("#clearBtn"),
    checkBtn: document.querySelector("#checkBtn"),
    nextBtn: document.querySelector("#nextBtn"),
    streakCount: document.querySelector("#streakCount"),
    roundPoints: document.querySelector("#roundPoints"),
    nextBonus: document.querySelector("#nextBonus"),
    roadFill: document.querySelector("#roadFill"),
    roadDots: document.querySelector("#roadDots"),
    toast: document.querySelector("#toast")
  };

  let state = loadState();
  let playerId = "";
  let round = null;
  let timerId = 0;
  let nextRoundTimer = 0;
  let toastTimer = 0;

  init();

  function init() {
    restorePlayer();
    renderRoadDots();
    bindEvents();
    nextRound();
  }

  function bindEvents() {
    dom.clearBtn.addEventListener("click", clearBuild);
    dom.checkBtn.addEventListener("click", checkBuild);
    dom.nextBtn.addEventListener("click", nextRound);
    dom.scoopBtn.addEventListener("click", markScoop);
    dom.closedBtn.addEventListener("click", markClosed);
  }

  function nextRound() {
    clearInterval(timerId);
    clearTimeout(nextRoundTimer);
    const stats = playerStats();
    const pool = WORDS.filter((item) => !item.boss || stats.streak >= 4 || stats.totalPoints >= 750);
    const recent = stats.recentWords || [];
    const fresh = pool.filter((item) => !recent.includes(item.word));
    const choices = fresh.length ? fresh : pool;
    const selected = choices[Math.floor(Math.random() * choices.length)];
    const timeLimit = Math.max(9500, BASE_TIME - Math.min(3800, stats.streak * 420) + (selected.boss ? 2500 : 0));
    round = {
      ...selected,
      selected: Array.from({ length: selected.phonemes.length }, () => ""),
      tiles: buildTileBank(selected),
      startedAt: performance.now(),
      timeLimit,
      timeLeft: timeLimit,
      checked: false,
      reveal: false,
      wasCorrect: false,
      marking: false,
      markStep: 0,
      markedIndexes: [],
      done: false
    };
    stats.recentWords = [selected.word, ...recent.filter((word) => word !== selected.word)].slice(0, 12);
    saveState();
    renderRound();
    startTimer();
  }

  function renderRound() {
    if (!round) return;
    const stats = playerStats();
    dom.playerInitials.textContent = initials(state.playerName);
    dom.playerName.textContent = state.playerName;
    dom.totalPoints.textContent = stats.totalPoints;
    dom.streakCount.textContent = stats.streak;
    dom.roundPoints.textContent = stats.lastPoints ? `+${stats.lastPoints}` : "+0";
    dom.nextBonus.textContent = stats.streak >= 4 ? "Ready" : 4 - stats.streak;
    dom.roundLevel.textContent = round.level;
    dom.prompt.textContent = round.marking ? "Mark the word." : `Build ${round.word}.`;
    dom.targetWord.textContent = round.word;
    dom.clearBtn.disabled = round.checked;
    dom.checkBtn.disabled = round.checked;
    dom.checkBtn.textContent = round.checked ? "Built" : "Build";
    dom.nextBtn.classList.toggle("hidden", !round.checked);
    renderSlots();
    renderBank();
    renderMarkPanel();
    updateProgress();
  }

  function renderSlots() {
    dom.slotRow.innerHTML = round.phonemes.map((phoneme, index) => {
      const chosen = round.tiles.find((tile) => tile.id === round.selected[index]);
      const reveal = round.reveal && !round.wasCorrect;
      const tile = reveal ? phoneme : chosen;
      const ready = tile ? " is-ready" : "";
      const wrong = round.reveal && !round.wasCorrect ? " is-wrong" : "";
      return `
        <button class="slot${ready}${wrong}" type="button" data-slot="${index}" ${round.checked ? "disabled" : ""} aria-label="Build slot ${index + 1}">
          ${tile ? tileFace(tile) : `<span>${index + 1}</span>`}
        </button>
      `;
    }).join("");
    dom.slotRow.querySelectorAll(".slot").forEach((slot) => {
      slot.addEventListener("click", () => removeSlot(Number(slot.dataset.slot)));
    });
  }

  function renderBank() {
    dom.tileBank.innerHTML = round.tiles.map((tile) => `
      <button class="tile" type="button" data-tile-id="${escapeHtml(tile.id)}" data-kind="${escapeHtml(tile.kind)}" ${tile.used || round.checked ? "disabled" : ""} aria-label="Sound ${escapeHtml(tile.text)}">
        ${tileInner(tile)}
      </button>
    `).join("");
    dom.tileBank.querySelectorAll(".tile").forEach((button) => {
      button.addEventListener("click", () => pickTile(button.dataset.tileId));
    });
  }

  function renderMarkPanel() {
    dom.markPanel.classList.toggle("hidden", !round.marking);
    if (!round.marking) return;
    const prompt = round.markStep === 0
      ? `Tap the ${round.markName}.`
      : round.markStep === 1
        ? "Scoop the whole word."
        : "Name the syllable type.";
    dom.markPrompt.textContent = prompt;
    dom.markWord.classList.toggle("is-scooped", round.markStep >= 2);
    dom.markWord.innerHTML = round.phonemes.map((tile, index) => {
      const marked = round.markedIndexes.includes(index) ? " is-marked" : "";
      return `
        <button class="mark-tile${marked}" type="button" data-mark-index="${index}" data-kind="${escapeHtml(tile.kind)}" aria-label="Mark ${escapeHtml(tile.text)}">
          ${tileInner(tile)}
        </button>
      `;
    }).join("");
    dom.markWord.querySelectorAll(".mark-tile").forEach((button) => {
      button.addEventListener("click", () => markTile(Number(button.dataset.markIndex)));
    });
    dom.scoopBtn.disabled = round.markStep !== 1;
    dom.closedBtn.disabled = round.markStep !== 2;
  }

  function pickTile(tileId) {
    if (!round || round.checked) return;
    const tile = round.tiles.find((item) => item.id === tileId);
    const openIndex = round.selected.findIndex((item) => !item);
    if (!tile || tile.used || openIndex === -1) {
      showToast(openIndex === -1 ? "Tap a slot to change a tile." : "That tile is already used.");
      return;
    }
    tile.used = true;
    round.selected[openIndex] = tile.id;
    renderRound();
  }

  function removeSlot(index) {
    if (!round || round.checked) return;
    const tileId = round.selected[index];
    if (!tileId) return;
    const tile = round.tiles.find((item) => item.id === tileId);
    if (tile) tile.used = false;
    round.selected[index] = "";
    renderRound();
  }

  function clearBuild() {
    if (!round || round.checked) return;
    round.selected = round.selected.map(() => "");
    round.tiles.forEach((tile) => {
      tile.used = false;
    });
    renderRound();
  }

  function checkBuild() {
    if (!round || round.checked) return;
    if (round.selected.some((item) => !item)) {
      showToast("Fill every sound slot.");
      return;
    }
    clearInterval(timerId);
    round.checked = true;
    const built = round.selected.map((tileId) => round.tiles.find((tile) => tile.id === tileId)?.text || "");
    const expected = round.phonemes.map((tile) => tile.text);
    const correct = arraysEqual(built, expected);
    round.wasCorrect = correct;
    round.reveal = !correct;
    if (correct) awardBuild();
    else missBuild();
  }

  function awardBuild() {
    const stats = playerStats();
    const elapsed = performance.now() - round.startedAt;
    const speedRatio = Math.max(0, 1 - elapsed / round.timeLimit);
    const base = 130 * round.phonemes.length;
    const speed = Math.round(230 * speedRatio);
    const streakBonus = Math.min(420, stats.streak * 45);
    const boss = round.boss ? 350 : 0;
    const points = base + speed + streakBonus + boss;
    stats.totalPoints += points;
    stats.lastPoints = points;
    stats.streak += 1;
    stats.bestStreak = Math.max(stats.bestStreak || 0, stats.streak);
    saveState();
    addHubPoints(points, { word: round.word, phonemes: round.phonemes.map((tile) => tile.text), build: true });
    round.marking = true;
    dom.buildStage.classList.remove("burst");
    void dom.buildStage.offsetWidth;
    dom.buildStage.classList.add("burst");
    renderRound();
    showToast(`Built ${round.word} +${points}`);
  }

  function missBuild() {
    const stats = playerStats();
    stats.totalPoints += 25;
    stats.lastPoints = 25;
    stats.streak = 0;
    saveState();
    addHubPoints(25, { word: round.word, miss: true });
    renderRound();
    dom.buildStage.classList.remove("shake");
    void dom.buildStage.offsetWidth;
    dom.buildStage.classList.add("shake");
    showToast(`${round.word}: ${round.phonemes.map((tile) => tile.text).join(" - ")}   +25 try points`);
    scheduleNextRound(2200);
  }

  function markTile(index) {
    if (!round || !round.marking) return;
    if (round.markStep !== 0) {
      showToast(round.markStep === 1 ? "Now scoop the word." : "Now choose closed.");
      return;
    }
    if (!round.markIndexes.includes(index)) {
      showToast(`Find the ${round.markName}.`);
      return;
    }
    if (!round.markedIndexes.includes(index)) {
      round.markedIndexes.push(index);
    }
    const complete = round.markIndexes.every((item) => round.markedIndexes.includes(item));
    if (complete) {
      round.markStep = 1;
      awardMarkBonus(40, { mark: round.markName });
      showToast(`${titleCase(round.markName)} marked +40`);
    } else {
      showToast(`Tap the rest of the ${round.markName}.`);
    }
    renderRound();
  }

  function markScoop() {
    if (!round || !round.marking) return;
    if (round.markStep !== 1) {
      showToast(`Mark the ${round.markName} first.`);
      return;
    }
    round.markStep = 2;
    awardMarkBonus(40, { scoop: true });
    renderRound();
    showToast("Scooped +40");
  }

  function markClosed() {
    if (!round || !round.marking) return;
    if (round.markStep !== 2) {
      showToast("Scoop before naming the syllable.");
      return;
    }
    round.markStep = 3;
    round.done = true;
    round.marking = false;
    awardMarkBonus(70, { syllable: "closed" });
    renderRound();
    showToast("Closed syllable complete +70");
    scheduleNextRound(1300);
  }

  function awardMarkBonus(points, detail) {
    const stats = playerStats();
    stats.totalPoints += points;
    stats.lastPoints += points;
    saveState();
    addHubPoints(points, { word: round.word, ...detail });
  }

  function startTimer() {
    updateProgress();
    timerId = setInterval(() => {
      if (!round || round.checked) return;
      round.timeLeft = Math.max(0, round.timeLimit - (performance.now() - round.startedAt));
      updateProgress();
      if (round.timeLeft <= 0) {
        clearInterval(timerId);
        checkTimeout();
      }
    }, 80);
  }

  function checkTimeout() {
    if (!round || round.checked) return;
    const stats = playerStats();
    round.checked = true;
    round.reveal = true;
    round.wasCorrect = false;
    stats.totalPoints += 10;
    stats.lastPoints = 10;
    stats.streak = 0;
    saveState();
    addHubPoints(10, { word: round.word, timeout: true });
    renderRound();
    showToast(`Time. ${round.phonemes.map((tile) => tile.text).join(" - ")}   +10`);
    scheduleNextRound(1600);
  }

  function buildTileBank(item) {
    const correct = item.phonemes.map((tile, index) => ({
      ...tile,
      id: `c-${index}-${tile.text}`,
      used: false
    }));
    const needed = item.boss ? 4 : 3;
    const usedTexts = new Set(item.phonemes.map((tile) => tile.text));
    const extra = shuffle(DISTRACTORS)
      .filter((text) => !usedTexts.has(text))
      .slice(0, needed)
      .map((text, index) => ({
        id: `d-${index}-${text}`,
        text,
        kind: kindFor(text),
        used: false
      }));
    return shuffle([...correct, ...extra]);
  }

  function updateProgress() {
    if (!round) return;
    const stats = playerStats();
    const timePercent = round.checked ? 0 : Math.max(0, Math.min(1, round.timeLeft / round.timeLimit));
    dom.timerFill.style.transform = `scaleX(${timePercent})`;
    const next = nextMilestone(stats.totalPoints);
    const prev = previousMilestone(stats.totalPoints);
    const span = next - prev || 1;
    dom.roadFill.style.width = `${Math.min(100, ((stats.totalPoints - prev) / span) * 100)}%`;
  }

  function scheduleNextRound(delay) {
    clearTimeout(nextRoundTimer);
    nextRoundTimer = setTimeout(nextRound, delay);
  }

  function renderRoadDots() {
    dom.roadDots.innerHTML = "<span></span><span></span><span></span><span></span><span></span>";
  }

  function showToast(message) {
    clearTimeout(toastTimer);
    dom.toast.textContent = message;
    dom.toast.classList.add("show");
    toastTimer = setTimeout(() => dom.toast.classList.remove("show"), 1150);
  }

  function tileFace(tile) {
    return `<span class="tile" data-kind="${escapeHtml(tile.kind)}">${tileInner(tile)}</span>`;
  }

  function tileInner(tile) {
    return `<span>${escapeHtml(tile.text)}</span><small>${tileLabel(tile.kind)}</small>`;
  }

  function tileLabel(kind) {
    if (kind === "vowel") return "vowel";
    if (kind === "welded") return "glued";
    return "cons.";
  }

  function entry(word, phonemes, level, options = {}) {
    const welded = new Set(options.weldedIndexes || []);
    const markIndexes = options.markIndexes || [phonemes.findIndex((text) => vowelSet.has(text.toLowerCase()))].filter((index) => index >= 0);
    return {
      word,
      level,
      boss: Boolean(options.boss),
      markIndexes,
      markName: options.markName || "short vowel",
      phonemes: phonemes.map((text, index) => ({
        text,
        kind: welded.has(index) ? "welded" : kindFor(text)
      }))
    };
  }

  function kindFor(text) {
    return text.length === 1 && vowelSet.has(text.toLowerCase()) ? "vowel" : "consonant";
  }

  function restorePlayer() {
    const queryName = new URLSearchParams(window.location.search).get("student");
    const hubName = readHubStudentName();
    state.playerName = (queryName || hubName || state.playerName || "Player").trim();
    playerId = slugify(state.playerName);
    state.activePlayerId = playerId;
    playerStats();
    saveState();
    saveHubSelection();
  }

  function playerStats() {
    state.players ||= {};
    state.players[playerId] ||= {
      totalPoints: 0,
      streak: 0,
      bestStreak: 0,
      lastPoints: 0,
      recentWords: []
    };
    const stats = state.players[playerId];
    stats.recentWords = Array.isArray(stats.recentWords) ? stats.recentWords : [];
    return stats;
  }

  function loadState() {
    const empty = {
      playerName: "Player",
      activePlayerId: "",
      players: {}
    };
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      if (!saved || typeof saved !== "object") return empty;
      return {
        ...empty,
        ...saved,
        players: saved.players && typeof saved.players === "object" ? saved.players : {}
      };
    } catch {
      return empty;
    }
  }

  function saveState() {
    state.updatedAt = new Date().toISOString();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function readHubStudentName() {
    try {
      const hub = JSON.parse(localStorage.getItem(HUB_STORAGE_KEY) || "null");
      if (!hub || !hub.activeStudentId || !hub.students) return "";
      return hub.students[hub.activeStudentId]?.name || "";
    } catch {
      return "";
    }
  }

  function saveHubSelection() {
    const stats = playerStats();
    const hub = readHubState();
    const student = ensureHubStudent(hub, state.playerName);
    hub.activeStudentId = student.id;
    const game = ensureHubGame(hub, student.id);
    game.points = Math.max(game.points || 0, stats.totalPoints || 0);
    game.lastPlayedAt = state.updatedAt || new Date().toISOString();
    saveHubState(hub);
  }

  function addHubPoints(points, detail) {
    const stats = playerStats();
    const hub = readHubState();
    const student = ensureHubStudent(hub, state.playerName);
    hub.activeStudentId = student.id;
    student.lastPlayedAt = new Date().toISOString();
    const game = ensureHubGame(hub, student.id);
    game.points = Math.max((game.points || 0) + points, stats.totalPoints || 0);
    game.sessions = (game.sessions || 0) + 1;
    game.lastPlayedAt = student.lastPlayedAt;
    hub.events.push({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      studentId: student.id,
      studentName: student.name,
      gameId: GAME_ID,
      points,
      detail,
      createdAt: student.lastPlayedAt
    });
    hub.events = hub.events.slice(-3000);
    saveHubState(hub);
  }

  function readHubState() {
    const empty = { version: 1, activeStudentId: "", students: {}, games: {}, events: [] };
    try {
      const saved = JSON.parse(localStorage.getItem(HUB_STORAGE_KEY) || "null");
      if (!saved || typeof saved !== "object") return empty;
      return {
        ...empty,
        ...saved,
        students: saved.students && typeof saved.students === "object" ? saved.students : {},
        games: saved.games && typeof saved.games === "object" ? saved.games : {},
        events: Array.isArray(saved.events) ? saved.events : []
      };
    } catch {
      return empty;
    }
  }

  function ensureHubStudent(hub, name) {
    const id = slugify(name);
    if (!hub.students[id]) {
      hub.students[id] = { id, name, createdAt: new Date().toISOString(), lastPlayedAt: "" };
    }
    return hub.students[id];
  }

  function ensureHubGame(hub, studentId) {
    hub.games[studentId] ||= {};
    hub.games[studentId][GAME_ID] ||= { points: 0, sessions: 0, lastPlayedAt: "" };
    return hub.games[studentId][GAME_ID];
  }

  function saveHubState(hub) {
    hub.updatedAt = new Date().toISOString();
    localStorage.setItem(HUB_STORAGE_KEY, JSON.stringify(hub));
  }

  function nextMilestone(points) {
    return milestones.find((mark) => mark > points) || milestones[milestones.length - 1];
  }

  function previousMilestone(points) {
    return [...milestones].reverse().find((mark) => mark <= points) || 0;
  }

  function shuffle(items) {
    const copy = [...items];
    for (let index = copy.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
    }
    return copy;
  }

  function arraysEqual(a, b) {
    return a.length === b.length && a.every((value, index) => value === b[index]);
  }

  function titleCase(text) {
    return text.charAt(0).toUpperCase() + text.slice(1);
  }

  function initials(name) {
    return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0].toUpperCase()).join("") || "?";
  }

  function slugify(text) {
    return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "student";
  }

  function escapeHtml(value) {
    return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
  }
})();
