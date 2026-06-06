(() => {
  "use strict";

  const HUB_KEY = "teachTodayGameHub.v1";
  const CURSIVE_KEY = "wilsonCursiveStrokeLab.v1";
  const TEACH_KEY = "dyslexiaInstructionEngine.v2";

  const seedNames = [
    "Angel", "Emma", "Ariana", "Mia", "Emmanuel", "Juan", "Sofia",
    "Alesander", "Linda", "Joshua", "Jayden C.", "Jayden D.", "Aileen",
    "Davonte", "Bethany", "Ayden", "Jedediah", "Makayla", "Rodrigo",
    "Diomedes", "Alberto", "Ta'Marrion", "Jesus", "Madison", "Xavier",
    "Allison", "Jade", "Julianna", "Robert", "Jose", "Jerson", "Yeici", "Katy"
  ];

  const dom = {
    studentGate: document.querySelector("#studentGate"),
    questScreen: document.querySelector("#questScreen"),
    studentSearch: document.querySelector("#studentSearch"),
    studentGrid: document.querySelector("#studentGrid"),
    newStudentName: document.querySelector("#newStudentName"),
    addStudentBtn: document.querySelector("#addStudentBtn"),
    switchStudentBtn: document.querySelector("#switchStudentBtn"),
    activeStudentName: document.querySelector("#activeStudentName"),
    studentInitials: document.querySelector("#studentInitials"),
    totalPoints: document.querySelector("#totalPoints"),
    gamesPlayed: document.querySelector("#gamesPlayed"),
    cursivePoints: document.querySelector("#cursivePoints"),
    rankLabel: document.querySelector("#rankLabel"),
    sparkFill: document.querySelector("#sparkFill"),
    gameGrid: document.querySelector("#gameGrid"),
    leaderboard: document.querySelector("#leaderboard"),
    refreshBtn: document.querySelector("#refreshBtn")
  };

  let hub = loadHub();

  init();

  function init() {
    mergeStudents(seedNames);
    mergeStudents(readTeachingRoster());
    mergeCursivePlayers();
    restoreFromQuery();
    bindEvents();
    render();
    saveHub();
  }

  function bindEvents() {
    dom.studentSearch.addEventListener("input", renderStudentGrid);
    dom.addStudentBtn.addEventListener("click", addStudentFromInput);
    dom.newStudentName.addEventListener("keydown", (event) => {
      if (event.key === "Enter") addStudentFromInput();
    });
    dom.switchStudentBtn.addEventListener("click", () => {
      hub.activeStudentId = "";
      saveHub();
      render();
      dom.studentSearch.focus();
    });
    dom.refreshBtn.addEventListener("click", () => {
      hub = loadHub();
      mergeStudents(seedNames);
      mergeStudents(readTeachingRoster());
      mergeCursivePlayers();
      render();
      saveHub();
    });
  }

  function render() {
    const active = activeStudent();
    dom.studentGate.classList.toggle("hidden", Boolean(active));
    dom.questScreen.classList.toggle("hidden", !active);
    renderStudentGrid();
    if (!active) return;
    renderQuest(active);
  }

  function renderStudentGrid() {
    const query = dom.studentSearch.value.trim().toLowerCase();
    const students = Object.values(hub.students)
      .filter((student) => !query || student.name.toLowerCase().includes(query))
      .sort((a, b) => a.name.localeCompare(b.name));

    dom.studentGrid.innerHTML = students.map((student) => {
      const score = totalForStudent(student);
      return `
        <button class="student-card" type="button" data-student-id="${escapeHtml(student.id)}">
          <span class="avatar">${escapeHtml(initials(student.name))}</span>
          <strong>${escapeHtml(student.name)}<small>${score} pts</small></strong>
        </button>
      `;
    }).join("");

    dom.studentGrid.querySelectorAll(".student-card").forEach((button) => {
      button.addEventListener("click", () => selectStudent(button.dataset.studentId));
    });
  }

  function renderQuest(student) {
    const totals = gameTotalsForStudent(student);
    const total = Object.values(totals).reduce((sum, value) => sum + value, 0);
    const rank = rankFor(total);

    dom.activeStudentName.textContent = student.name;
    dom.studentInitials.textContent = initials(student.name);
    dom.totalPoints.textContent = total;
    dom.gamesPlayed.textContent = Object.values(totals).filter((value) => value > 0).length;
    dom.cursivePoints.textContent = totals.syllableSlice || 0;
    dom.rankLabel.textContent = rank.label;
    dom.sparkFill.style.width = `${rank.progress}%`;
    renderGames(student, totals);
    renderLeaderboard();
  }

  function renderGames(student, totals) {
    const studentParam = encodeURIComponent(student.name);
    const gameCards = [
      {
        id: "cursive",
        title: "Cursive Stroke Lab",
        copy: "Trace letters, build streaks, and turn careful strokes into points.",
        href: `Cursive%20Tracing%20WIlson/index.html?student=${studentParam}`,
        points: totals.cursive || 0,
        status: "Ready",
        art: ["a", "b", "c", "d"],
        playable: true
      },
      {
        id: "syllableSlice",
        title: "Syllable Slice",
        copy: "Slice Reader 3.1 words into syllables, stack speed bonuses, and unlock boss rounds.",
        href: `Syllable%20Slice/index.html?student=${studentParam}`,
        points: totals.syllableSlice || 0,
        status: "Ready",
        art: ["sy", "lla", "ble", "|"],
        playable: true
      },
      {
        id: "word",
        title: "Word Builder",
        copy: "Coming next: build words from sounds and race your best score.",
        href: "#",
        points: 0,
        status: "Soon",
        art: ["w", "o", "r", "d"],
        playable: false
      },
      {
        id: "sound",
        title: "Sound Sprint",
        copy: "Coming next: quick sound-symbol rounds with bonus streaks.",
        href: "#",
        points: 0,
        status: "Soon",
        art: ["s", "p", "r", "n"],
        playable: false
      }
    ];

    dom.gameGrid.innerHTML = gameCards.map((game) => `
      <article class="game-card ${game.playable ? "playable" : "locked"}">
        <div>
          <div class="game-art" aria-hidden="true">
            ${game.art.map((letter) => `<span>${escapeHtml(letter)}</span>`).join("")}
          </div>
          <h2>${escapeHtml(game.title)}</h2>
          <p>${escapeHtml(game.copy)}</p>
        </div>
        <div>
          <div class="game-meta">
            <span>${escapeHtml(game.status)}</span>
            <span>${game.points} pts</span>
          </div>
          ${game.playable
            ? `<a class="launch-button primary" href="${game.href}">Play</a>`
            : `<button class="launch-button" type="button" disabled>Locked</button>`}
        </div>
      </article>
    `).join("");
  }

  function renderLeaderboard() {
    const rows = Object.values(hub.students)
      .map((student) => ({ student, points: totalForStudent(student) }))
      .sort((a, b) => b.points - a.points || a.student.name.localeCompare(b.student.name))
      .slice(0, 8);

    dom.leaderboard.innerHTML = rows.map((row, index) => `
      <div class="leader-row">
        <span>#${index + 1}</span>
        <strong>${escapeHtml(row.student.name)}</strong>
        <span>${row.points}</span>
      </div>
    `).join("");
  }

  function selectStudent(id) {
    if (!hub.students[id]) return;
    hub.activeStudentId = id;
    hub.students[id].lastPlayedAt = new Date().toISOString();
    saveHub();
    render();
  }

  function addStudentFromInput() {
    const name = dom.newStudentName.value.trim();
    if (!name) return;
    const student = ensureStudent(name);
    dom.newStudentName.value = "";
    selectStudent(student.id);
  }

  function loadHub() {
    const empty = { version: 1, activeStudentId: "", students: {}, games: {}, events: [] };
    try {
      const saved = JSON.parse(localStorage.getItem(HUB_KEY) || "null");
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

  function saveHub() {
    hub.updatedAt = new Date().toISOString();
    localStorage.setItem(HUB_KEY, JSON.stringify(hub));
  }

  function restoreFromQuery() {
    const name = new URLSearchParams(window.location.search).get("student");
    if (!name) return;
    const student = ensureStudent(name);
    hub.activeStudentId = student.id;
  }

  function readTeachingRoster() {
    try {
      const saved = JSON.parse(localStorage.getItem(TEACH_KEY) || "null");
      if (!saved || !Array.isArray(saved.rosterStudents)) return [];
      return saved.rosterStudents.map((student) => student.name || student.fullName).filter(Boolean);
    } catch {
      return [];
    }
  }

  function mergeCursivePlayers() {
    try {
      const saved = JSON.parse(localStorage.getItem(CURSIVE_KEY) || "null");
      if (!saved || !saved.players || typeof saved.players !== "object") return;
      Object.values(saved.players).forEach((player) => {
        if (!player || !player.name) return;
        const student = ensureStudent(player.name);
        const game = ensureGameRecord(student.id, "cursive");
        game.points = Math.max(game.points || 0, player.totalPoints || 0);
        game.lastPlayedAt = [game.lastPlayedAt, player.updatedAt].filter(Boolean).sort().pop() || game.lastPlayedAt || "";
      });
    } catch {
      return;
    }
  }

  function mergeStudents(names) {
    names.forEach((name) => {
      if (name) ensureStudent(name);
    });
  }

  function ensureStudent(name) {
    const clean = name.trim();
    const id = slugify(clean);
    if (!hub.students[id]) {
      hub.students[id] = {
        id,
        name: clean,
        createdAt: new Date().toISOString(),
        lastPlayedAt: ""
      };
    }
    return hub.students[id];
  }

  function activeStudent() {
    return hub.students[hub.activeStudentId] || null;
  }

  function ensureGameRecord(studentId, gameId) {
    hub.games[studentId] ||= {};
    hub.games[studentId][gameId] ||= { points: 0, sessions: 0, lastPlayedAt: "" };
    return hub.games[studentId][gameId];
  }

  function gameTotalsForStudent(student) {
    mergeCursivePlayers();
    const records = hub.games[student.id] || {};
    return Object.fromEntries(Object.entries(records).map(([gameId, record]) => [gameId, record.points || 0]));
  }

  function totalForStudent(student) {
    const totals = gameTotalsForStudent(student);
    return Object.values(totals).reduce((sum, value) => sum + value, 0);
  }

  function rankFor(points) {
    const ranks = [
      { label: "Ready", at: 0 },
      { label: "Spark", at: 250 },
      { label: "Builder", at: 750 },
      { label: "Champion", at: 1500 },
      { label: "Legend", at: 3000 }
    ];
    const current = ranks.filter((rank) => points >= rank.at).pop() || ranks[0];
    const next = ranks.find((rank) => rank.at > points);
    if (!next) return { label: current.label, progress: 100 };
    const progress = Math.round(((points - current.at) / (next.at - current.at)) * 100);
    return { label: current.label, progress: Math.max(6, progress) };
  }

  function initials(name) {
    return name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0].toUpperCase())
      .join("") || "?";
  }

  function slugify(text) {
    return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "student";
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
})();
