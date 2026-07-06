(function () {
  "use strict";

  const SESSION_KEY = "tt_student_v1";
  const AVATARS = ["🦊", "🦅", "🦁", "🐺", "🐬", "🦋", "🐉", "🦄"];
  const params = new URLSearchParams(location.search);
  const substepId = params.get("substep") || "2.1";
  const dataApi = window.TTStudentLessonData;
  const progressApi = window.TTStudentLessonProgress;
  const config = dataApi?.getSubstep(substepId);

  let profile = readSessionProfile();
  let progressState = progressApi?.load(profile.id, profile);
  let developerAccess = window.TTStudentDeveloperAccess?.isEnabled(profile) || false;
  let currentRoute = params.get("route") === "drill" ? "drill" : "hero";
  let currentRound = null;
  let answerLocked = false;
  let didFocusRequestedSet = false;

  function readSessionProfile() {
    let storedProfile = null;
    try {
      const stored = JSON.parse(localStorage.getItem(SESSION_KEY) || "{}");
      storedProfile = stored.profile || null;
    } catch {}
    const requestedId = params.get("studentId");
    if (requestedId && String(storedProfile?.id || "") !== requestedId) {
      return {
        id: requestedId,
        name: params.get("student") || "Student",
        fullName: params.get("student") || "Student",
        groupId: params.get("group") || "",
        groupName: params.get("groupName") || "",
        substep: substepId,
        xp: 0,
        streak: 0,
        avatarId: 0,
        completedLessons: [],
        rewards: []
      };
    }
    if (storedProfile) return storedProfile;
    return {
      id: params.get("studentId") || "demo",
      name: params.get("student") || "Alex",
      substep: substepId,
      xp: 620,
      streak: 7,
      avatarId: 0,
      completedLessons: [],
      rewards: []
    };
  }

  function esc(value) {
    return String(value ?? "").replace(/[&<>"']/g, (character) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
    })[character]);
  }

  function shuffle(values) {
    const result = values.slice();
    for (let index = result.length - 1; index > 0; index -= 1) {
      const swap = Math.floor(Math.random() * (index + 1));
      [result[index], result[swap]] = [result[swap], result[index]];
    }
    return result;
  }

  function percent(value) { return `${Math.round((Number(value) || 0) * 100)}%`; }
  function currentProfile() {
    try {
      const storedProfile = JSON.parse(localStorage.getItem(SESSION_KEY) || "{}").profile || null;
      const requestedId = params.get("studentId");
      if (requestedId && String(storedProfile?.id || "") !== requestedId) return profile;
      return storedProfile || profile;
    } catch { return profile; }
  }

  function boot() {
    document.getElementById("backHomeBtn").addEventListener("click", goHome);
    if (!config && developerAccess) {
      renderDeveloperEmptyShell();
      return;
    }
    if (!config || !progressApi) {
      document.getElementById("lessonApp").innerHTML = `<main class="lesson-main"><div class="campaign-hero"><div class="campaign-copy"><h1>Lesson data is not ready</h1><p>Return home and try this sub-step again.</p></div></div></main>`;
      return;
    }
    document.getElementById("exitActivityBtn").addEventListener("click", exitActivity);
    document.getElementById("rewardContinueBtn").addEventListener("click", closeReward);
    document.querySelectorAll(".path-tab").forEach((button) => {
      button.addEventListener("click", () => switchRoute(button.dataset.route));
    });
    window.addEventListener("pageshow", () => {
      profile = currentProfile();
      progressState = progressApi.load(profile.id, profile);
      renderAll();
    });
    buildConfetti();
    renderAll();
  }

  function renderDeveloperEmptyShell() {
    const refreshed = currentProfile();
    const stepId = substepId.split(".")[0];
    document.getElementById("lessonStudentName").textContent = refreshed.name || "Student";
    document.getElementById("lessonAvatar").textContent = AVATARS[refreshed.avatarId || 0] || AVATARS[0];
    document.getElementById("lessonConcept").textContent = `Sub-step ${substepId} developer shell`;
    document.getElementById("lessonBreadcrumb").textContent = `Step ${stepId} · Sub-step ${substepId}`;
    document.getElementById("lessonStreak").textContent = Number(refreshed.streak || 0);
    document.getElementById("lessonXp").textContent = `${Number(refreshed.xp || 0).toLocaleString()} XP`;
    document.getElementById("developerBadge").hidden = false;
    document.getElementById("masteryStatus").textContent = "No material yet";
    document.getElementById("decodeAccuracy").textContent = "—";
    document.getElementById("encodeAccuracy").textContent = "—";
    document.getElementById("masteredCount").textContent = "0";
    document.getElementById("reviewCount").textContent = "0";
    document.getElementById("masteryFill").style.width = "0%";
    document.getElementById("campaignRing").style.setProperty("--progress", "0");
    document.getElementById("campaignPercent").textContent = "DEV";
    document.getElementById("campaignProgressText").textContent = "Unlocked shell";
    document.querySelector(".campaign-progress-card div:last-child span").textContent = "curriculum not added yet";
    document.getElementById("exitActivityBtn").addEventListener("click", goHome);
    document.getElementById("rewardContinueBtn").addEventListener("click", goHome);
    document.querySelectorAll(".path-tab").forEach((button) => {
      button.addEventListener("click", () => {
        currentRoute = button.dataset.route === "drill" ? "drill" : "hero";
        const url = new URL(location.href);
        url.searchParams.set("route", currentRoute);
        history.replaceState({}, "", url);
        renderDeveloperEmptyRoute();
      });
    });
    renderDeveloperEmptyRoute();
  }

  function renderDeveloperEmptyRoute() {
    const isHero = currentRoute === "hero";
    document.getElementById("pathEyebrow").textContent = `DEVELOPER LAB · SUB-STEP ${substepId}`;
    document.getElementById("pathTitle").textContent = isHero ? `Sub-step ${substepId} is unlocked` : `Sub-step ${substepId} practice shell is unlocked`;
    document.getElementById("pathDescription").textContent = "This location is open for testing even though lesson material has not been added yet.";
    document.getElementById("heroLobby").innerHTML = `<article class="set-card">
      <div class="set-head">
        <div class="set-number" style="background:#534AB7">🧪</div>
        <div class="set-copy"><b>Open lesson shell</b><span>Hero's Path sets will appear here when this sub-step receives curriculum data.</span></div>
        <div class="set-state developer">DEV · Open</div>
      </div>
    </article>`;
    document.getElementById("drillLobby").innerHTML = `<article class="power-card">
      <div class="power-icon">⚡</div><h2>Open practice shell</h2>
      <p>The adaptive decoding and encoding loop is accessible. It will activate when a word pool is connected to Sub-step ${esc(substepId)}.</p>
      <div class="recommendation"><span>Developer status</span><b>Unlocked · awaiting material</b></div>
    </article>`;
    document.getElementById("heroLobby").hidden = !isHero;
    document.getElementById("drillLobby").hidden = isHero;
    document.querySelectorAll(".path-tab").forEach((button) => {
      const active = button.dataset.route === currentRoute;
      button.classList.toggle("active", active);
      button.setAttribute("aria-selected", String(active));
    });
  }

  function goHome() {
    const target = params.get("return") || "student.html";
    location.href = new URL(target, location.href).href;
  }

  function switchRoute(route) {
    if (currentRound && !confirm("Exit this practice round? Your completed questions are already saved.")) return;
    currentRound = null;
    currentRoute = route === "drill" ? "drill" : "hero";
    const url = new URL(location.href);
    url.searchParams.set("route", currentRoute);
    history.replaceState({}, "", url);
    showLobby();
    renderAll();
  }

  function renderAll() {
    profile = currentProfile();
    developerAccess = window.TTStudentDeveloperAccess?.isEnabled(profile) || false;
    updateRail();
    renderRouteHeader();
    renderHeroLobby();
    renderDrillLobby();
    document.getElementById("heroLobby").hidden = currentRoute !== "hero";
    document.getElementById("drillLobby").hidden = currentRoute !== "drill";
    document.querySelectorAll(".path-tab").forEach((button) => {
      const active = button.dataset.route === currentRoute;
      button.classList.toggle("active", active);
      button.setAttribute("aria-selected", String(active));
    });
  }

  function updateRail() {
    const summary = progressApi.summary(progressState, config);
    const refreshed = currentProfile();
    document.getElementById("lessonStudentName").textContent = refreshed.name || "Student";
    document.getElementById("lessonAvatar").textContent = AVATARS[refreshed.avatarId || 0] || AVATARS[0];
    document.getElementById("lessonConcept").textContent = config.substepTitle;
    document.getElementById("lessonBreadcrumb").textContent = `Step ${config.stepId} · Sub-step ${config.substepId}`;
    document.getElementById("lessonStreak").textContent = Number(refreshed.streak || 0);
    document.getElementById("lessonXp").textContent = `${Number(refreshed.xp || 0).toLocaleString()} XP`;
    document.getElementById("developerBadge").hidden = !developerAccess;
    document.getElementById("masteryStatus").textContent = summary.masteryStatus;
    document.getElementById("decodeAccuracy").textContent = percent(summary.decodingAccuracy);
    document.getElementById("encodeAccuracy").textContent = percent(summary.encodingAccuracy);
    document.getElementById("masteredCount").textContent = summary.masteredWords.length;
    document.getElementById("reviewCount").textContent = summary.missedWords.length;
    const combined = summary.decodingAccuracy && summary.encodingAccuracy
      ? (summary.decodingAccuracy + summary.encodingAccuracy) / 2
      : Math.max(summary.decodingAccuracy, summary.encodingAccuracy);
    document.getElementById("masteryFill").style.width = percent(combined);
  }

  function renderRouteHeader() {
    const summary = progressApi.summary(progressState, config);
    const ring = document.getElementById("campaignRing");
    let progress = summary.totalActivities ? summary.completedActivities / summary.totalActivities : 0;
    if (currentRoute === "hero") {
      document.getElementById("pathEyebrow").textContent = `HERO'S PATH · STEP ${config.substepId}`;
      document.getElementById("pathTitle").textContent = "Train your welded sound powers";
      document.getElementById("pathDescription").textContent = "Clear each set to unlock the next part of the campaign.";
      document.getElementById("campaignProgressText").textContent = `${summary.completedActivities} of ${summary.totalActivities}`;
      document.querySelector(".campaign-progress-card div:last-child span").textContent = "activities complete";
    } else {
      const substepProgress = progressApi.getSubstep(progressState, config.substepId);
      const rule = progressApi.adaptiveRule(substepProgress, config);
      const combinedTotal = substepProgress.decoding.total + substepProgress.encoding.total;
      const combinedCorrect = substepProgress.decoding.correct + substepProgress.encoding.correct;
      progress = combinedTotal ? combinedCorrect / combinedTotal : 0;
      document.getElementById("pathEyebrow").textContent = `POWER-UP LOOP · LEVEL ${rule.level}`;
      document.getElementById("pathTitle").textContent = "Practice until it feels automatic";
      document.getElementById("pathDescription").textContent = "Missed words return more often. Mastered words step back while you build speed.";
      document.getElementById("campaignProgressText").textContent = `${summary.drillRounds} rounds`;
      document.querySelector(".campaign-progress-card div:last-child span").textContent = summary.masteryStatus;
    }
    const progressPercent = Math.round(progress * 100);
    ring.style.setProperty("--progress", String(progressPercent));
    document.getElementById("campaignPercent").textContent = `${progressPercent}%`;
  }

  function renderHeroLobby() {
    const progress = progressApi.getSubstep(progressState, config.substepId);
    const sets = config.heroPath.lessonSets;
    document.getElementById("heroLobby").innerHTML = sets.map((set, setIndex) => {
      const naturallyUnlocked = setIndex === 0 || progress.completedSets.includes(sets[setIndex - 1].setId);
      const previousComplete = developerAccess || naturallyUnlocked;
      const completedCount = set.activities.filter((activity) => progress.completedActivities.includes(activity.id)).length;
      const setComplete = completedCount === set.activities.length;
      const stateLabel = setComplete ? "Complete ✓" : developerAccess && !naturallyUnlocked ? "🧪 DEV · Open" : previousComplete ? `${completedCount}/${set.activities.length} cleared` : "🔒 Locked";
      const stateClass = setComplete ? "complete" : developerAccess && !naturallyUnlocked ? "developer" : previousComplete ? "" : "locked";
      return `<article class="set-card${previousComplete ? "" : " locked"}" data-set-id="${esc(set.setId)}" style="animation-delay:${setIndex * 45}ms">
        <div class="set-head">
          <div class="set-number" style="background:${esc(set.color)}">${set.icon}</div>
          <div class="set-copy"><b>Set ${set.number}: ${esc(set.title)}</b><span>${esc(set.description)}</span></div>
          <div class="set-state ${stateClass}">${stateLabel}</div>
        </div>
        <div class="activity-chain">
          ${set.activities.map((activity, activityIndex) => {
            const complete = progress.completedActivities.includes(activity.id);
            const priorActivityComplete = activityIndex === 0 || progress.completedActivities.includes(set.activities[activityIndex - 1].id);
            const unlocked = developerAccess || (previousComplete && (priorActivityComplete || complete));
            return `<button class="activity-node" data-activity-id="${esc(activity.id)}" ${unlocked ? "" : "disabled"}>
              ${complete ? '<span class="activity-check">✓</span>' : ""}
              <span class="activity-icon">${unlocked ? activity.icon : "🔒"}</span>
              <b>${esc(activity.title)}</b>
              <small>${complete ? "Replay" : developerAccess && !priorActivityComplete ? `Developer access · +${activity.xpReward} XP` : unlocked ? `+${activity.xpReward} XP` : "Finish the last activity"}</small>
            </button>`;
          }).join("")}
        </div>
      </article>`;
    }).join("");
    document.querySelectorAll(".activity-node:not(:disabled)").forEach((button) => {
      button.addEventListener("click", () => {
        const activity = findActivity(button.dataset.activityId);
        if (activity) startActivity(activity, { drill: false });
      });
    });
    const requestedSet = params.get("set");
    if (!didFocusRequestedSet && requestedSet && currentRoute === "hero") {
      didFocusRequestedSet = true;
      requestAnimationFrame(() => document.querySelector(`[data-set-id="${CSS.escape(requestedSet)}"]`)?.scrollIntoView({ block: "center", behavior: "smooth" }));
    }
  }

  function renderDrillLobby() {
    const progress = progressApi.getSubstep(progressState, config.substepId);
    const summary = progressApi.summary(progressState, config);
    const rule = progressApi.adaptiveRule(progress, config);
    const nextMode = progress.lastDrillMode === "decoding" ? "encoding" : "decoding";
    const modeLabel = nextMode === "decoding" ? "Decoding Set" : "Encoding Set";
    const reviewTags = summary.missedWords.slice(0, 6).map((word) => `<span class="word-tag">${esc(word)}</span>`).join("");
    const masteredTags = summary.masteredWords.slice(0, 4).map((word) => `<span class="word-tag mastered">${esc(word)} ✓</span>`).join("");
    document.getElementById("drillLobby").innerHTML = `<div class="drill-grid">
      <section class="power-card">
        <div class="power-icon">⚡</div>
        <h2>${esc(modeLabel)}</h2>
        <p>Six quick questions selected from your Step 2.1 word bank. The loop alternates decoding and encoding automatically.</p>
        <div class="recommendation"><span>Recommended now</span><b>Level ${rule.level}: ${esc(rule.label)}</b></div>
        <button class="primary-btn" id="startDrillBtn">Start ${esc(modeLabel)} →</button>
      </section>
      <aside class="practice-card">
        <h3>Your practice data</h3>
        <div class="stat-stack">
          <div class="stat-line"><div><span>Decoding accuracy</span><b>${percent(summary.decodingAccuracy)}</b></div><div class="mini-meter"><span style="width:${percent(summary.decodingAccuracy)}"></span></div></div>
          <div class="stat-line"><div><span>Encoding accuracy</span><b>${percent(summary.encodingAccuracy)}</b></div><div class="mini-meter"><span style="width:${percent(summary.encodingAccuracy)}"></span></div></div>
          <div class="stat-line"><div><span>Practice rounds</span><b>${summary.drillRounds}</b></div></div>
        </div>
        <div class="word-tags">${reviewTags || masteredTags || '<span class="word-tag">Start a round to build word memory</span>'}</div>
      </aside>
    </div>`;
    document.getElementById("startDrillBtn").addEventListener("click", () => startDrill(nextMode, rule));
  }

  function findActivity(activityId) {
    return config.heroPath.lessonSets.flatMap((set) => set.activities).find((activity) => activity.id === activityId) || null;
  }

  function startDrill(mode, rule) {
    const type = mode === "decoding" ? rule.decodingType : rule.encodingType;
    startActivity({
      id: `2.1-drill-${mode}`,
      title: mode === "decoding" ? "Decoding Power-Up" : "Encoding Power-Up",
      icon: mode === "decoding" ? "👀" : "⌨️",
      type,
      rounds: config.drillPath.roundSize,
      hints: Boolean(rule.hints),
      timed: Boolean(rule.timed),
      xpReward: 0
    }, { drill: true, mode, level: rule.level, rule });
  }

  function startActivity(activity, context) {
    if (activity.type === "external-sounds") {
      launchSoundsActivity();
      return;
    }
    const count = Number(activity.rounds || 5);
    const items = activity.type === "sentence-read"
      ? shuffle(config.sentencePool).slice(0, count)
      : progressApi.chooseWords(progressState, config, { count, patterns: activity.patterns });
    currentRound = {
      activity,
      context,
      items,
      index: 0,
      correct: 0,
      startedAt: Date.now(),
      questionStartedAt: Date.now(),
      builtTiles: []
    };
    answerLocked = false;
    document.getElementById("lobbyView").hidden = true;
    document.getElementById("activityView").hidden = false;
    renderQuestion();
  }

  function launchSoundsActivity() {
    const url = new URL("lesson-21-s1.html", location.href);
    url.searchParams.set("studentId", profile.id || "");
    url.searchParams.set("student", profile.name || "Student");
    url.searchParams.set("group", profile.groupId || "");
    url.searchParams.set("groupName", profile.groupName || "");
    url.searchParams.set("source", "student-home");
    if (developerAccess) url.searchParams.set("developer", "1");
    const returnUrl = new URL("student-lesson.html", location.href);
    returnUrl.searchParams.set("substep", config.substepId);
    returnUrl.searchParams.set("route", "hero");
    if (developerAccess) returnUrl.searchParams.set("developer", "1");
    returnUrl.searchParams.set("return", params.get("return") || "student.html");
    url.searchParams.set("return", `${returnUrl.pathname.split("/").pop()}${returnUrl.search}`);
    location.href = url.href;
  }

  function questionType() {
    if (currentRound.activity.type === "mastery-mixed") return currentRound.index % 2 ? "encoding-type" : "decode-choice";
    return currentRound.activity.type;
  }

  function renderQuestion() {
    answerLocked = false;
    currentRound.questionStartedAt = Date.now();
    currentRound.builtTiles = [];
    const total = currentRound.items.length;
    const current = currentRound.items[currentRound.index];
    const word = typeof current === "string" ? current : current.word;
    document.getElementById("roundProgressFill").style.width = `${(currentRound.index / total) * 100}%`;
    document.getElementById("roundCount").textContent = `${currentRound.index + 1} / ${total}`;
    document.getElementById("feedbackBar").className = "feedback-bar";
    document.getElementById("feedbackBar").textContent = "";
    const type = questionType();
    if (type === "decode-choice") renderDecodeChoice(current);
    else if (type === "rapid-decode") renderRapidDecode(current);
    else if (type === "tile-build") renderTileBuild(current);
    else if (type === "encoding-type") renderEncodingType(current);
    else if (type === "sentence-read") renderSentenceRead(word);
  }

  function renderDecodeChoice(item) {
    const word = item.word;
    const samePattern = config.wordPool.filter((candidate) => candidate.word !== word && candidate.pattern === item.pattern);
    const fallback = config.wordPool.filter((candidate) => candidate.word !== word);
    const distractors = shuffle(samePattern.length >= 3 ? samePattern : fallback).slice(0, 3).map((candidate) => candidate.word);
    const choices = shuffle([word, ...distractors]);
    document.getElementById("activityStage").innerHTML = `<div class="question-card">
      <div class="prompt-kicker">Listen + find</div>
      <h2>Tap the word you hear</h2>
      <p class="question-help">Listen again as many times as you need.</p>
      <button class="listen-btn" id="listenWordBtn">🔊 Hear the word</button>
      <div class="choice-grid">${choices.map((choice) => `<button class="word-choice" data-choice="${esc(choice)}">${esc(choice)}</button>`).join("")}</div>
    </div>`;
    document.getElementById("listenWordBtn").addEventListener("click", () => speak(word));
    document.querySelectorAll(".word-choice").forEach((button) => button.addEventListener("click", () => {
      if (answerLocked) return;
      const correct = button.dataset.choice === word;
      button.classList.add(correct ? "correct" : "wrong");
      if (!correct) document.querySelector(`.word-choice[data-choice="${CSS.escape(word)}"]`)?.classList.add("correct");
      answer(correct, word, correct ? "Great listening! You matched the welded sound." : `Almost there — the word was “${word}.”`);
    }));
    setTimeout(() => speak(word), 180);
  }

  function renderRapidDecode(item) {
    const word = item.word;
    document.getElementById("activityStage").innerHTML = `<div class="question-card">
      <div class="prompt-kicker">Read it</div>
      <h2>Read this word aloud</h2>
      <p class="question-help">Say it, then tell the app how it went.</p>
      <div class="flash-word">${esc(word)}</div>
      <div class="self-grade">
        <button class="self-btn retry" data-correct="false">🔁 Need review</button>
        <button class="self-btn yes" data-correct="true">✓ I read it</button>
      </div>
    </div>`;
    document.querySelectorAll(".self-btn").forEach((button) => button.addEventListener("click", () => {
      const correct = button.dataset.correct === "true";
      answer(correct, word, correct ? "Strong read! You’re getting faster." : "Good call. This word will return for more practice.");
    }));
  }

  function renderTileBuild(item) {
    const word = item.word;
    const graphemes = item.graphemes || dataApi.graphemesFor(word);
    const extras = shuffle(["a", "e", "i", "o", "u", "ng", "nk", "ch", "sh"].filter((tile) => !graphemes.includes(tile))).slice(0, 2);
    const tiles = shuffle([...graphemes, ...extras].map((value, index) => ({ id: `${index}-${value}-${Math.random()}`, value })));
    currentRound.availableTiles = tiles;
    document.getElementById("activityStage").innerHTML = `<div class="question-card">
      <div class="prompt-kicker">Build with sound tiles</div>
      <h2>Build the word you hear</h2>
      <p class="question-help">Tap the graphemes in order. The welded ending stays together.</p>
      <button class="listen-btn" id="listenWordBtn">🔊 Hear the word</button>
      <div class="tile-workspace">
        <div class="built-word" id="builtWord"><span class="built-placeholder">Tap tiles to build the word</span></div>
        <div class="tile-bank">${tiles.map((tile) => `<button class="sound-tile" data-tile-id="${esc(tile.id)}">${esc(tile.value)}</button>`).join("")}</div>
        <div class="tile-actions"><button class="secondary-btn" id="clearTilesBtn">Clear</button><button class="primary-btn" id="checkTilesBtn">Check word</button></div>
      </div>
    </div>`;
    document.getElementById("listenWordBtn").addEventListener("click", () => speak(word));
    document.querySelectorAll(".sound-tile").forEach((button) => button.addEventListener("click", () => addTile(button.dataset.tileId)));
    document.getElementById("clearTilesBtn").addEventListener("click", clearTiles);
    document.getElementById("checkTilesBtn").addEventListener("click", () => {
      if (answerLocked) return;
      const built = currentRound.builtTiles.map((tile) => tile.value).join("");
      answer(built === word, word, built === word ? "Perfect build! Every sound is in place." : `Nice try — “${word}” builds as ${graphemes.join(" + ")}.`);
    });
    setTimeout(() => speak(word), 180);
  }

  function addTile(tileId) {
    const tile = currentRound.availableTiles.find((entry) => entry.id === tileId);
    if (!tile || currentRound.builtTiles.some((entry) => entry.id === tileId)) return;
    currentRound.builtTiles.push(tile);
    document.querySelector(`.sound-tile[data-tile-id="${CSS.escape(tileId)}"]`)?.setAttribute("disabled", "");
    renderBuiltWord();
  }

  function clearTiles() {
    currentRound.builtTiles = [];
    document.querySelectorAll(".sound-tile").forEach((button) => button.removeAttribute("disabled"));
    renderBuiltWord();
  }

  function renderBuiltWord() {
    document.getElementById("builtWord").innerHTML = currentRound.builtTiles.length
      ? currentRound.builtTiles.map((tile) => `<span class="built-tile">${esc(tile.value)}</span>`).join("")
      : '<span class="built-placeholder">Tap tiles to build the word</span>';
  }

  function renderEncodingType(item) {
    const word = item.word;
    const graphemes = item.graphemes || dataApi.graphemesFor(word);
    const showHints = currentRound.activity.hints;
    document.getElementById("activityStage").innerHTML = `<div class="question-card">
      <div class="prompt-kicker">Hear it + spell it</div>
      <h2>Type the word you hear</h2>
      <p class="question-help">Use the keyboard on your laptop or iPad.</p>
      <button class="listen-btn" id="listenWordBtn">🔊 Hear the word</button>
      <div class="type-wrap">
        <input class="type-input" id="encodingInput" type="text" inputmode="text" autocomplete="off" autocapitalize="none" spellcheck="false" aria-label="Type the word">
        <div class="hint-chips">${showHints ? `Sound hint: ${graphemes.map(esc).join(" · ")}` : "No hints this round — trust your sounds!"}</div>
        <button class="primary-btn" id="checkTypingBtn">Check spelling</button>
      </div>
    </div>`;
    document.getElementById("listenWordBtn").addEventListener("click", () => speak(word));
    const input = document.getElementById("encodingInput");
    const submit = () => {
      if (answerLocked || !input.value.trim()) return;
      const typed = input.value.trim().toLowerCase();
      answer(typed === word, word, typed === word ? "Yes! Your spelling matched every sound." : `Almost there — the word is “${word}.” It will come back.`);
    };
    document.getElementById("checkTypingBtn").addEventListener("click", submit);
    input.addEventListener("keydown", (event) => { if (event.key === "Enter") submit(); });
    input.focus();
    setTimeout(() => speak(word), 180);
  }

  function renderSentenceRead(sentence) {
    document.getElementById("activityStage").innerHTML = `<div class="question-card">
      <div class="prompt-kicker">Apply it in a sentence</div>
      <h2>Read the whole sentence</h2>
      <p class="question-help">Take your time and scoop through each phrase.</p>
      <div class="sentence-card">${esc(sentence)}</div>
      <div class="self-grade"><button class="self-btn retry" data-correct="false">🔁 Practice again</button><button class="self-btn yes" data-correct="true">✓ I read it</button></div>
    </div>`;
    document.querySelectorAll(".self-btn").forEach((button) => button.addEventListener("click", () => {
      const correct = button.dataset.correct === "true";
      answer(correct, "", correct ? "Sentence cleared! Nice connected reading." : "Good choice. Repetition builds smooth reading.");
    }));
  }

  function answer(correct, word, message) {
    if (answerLocked) return;
    answerLocked = true;
    const type = questionType();
    const mode = type === "tile-build" || type === "encoding-type" ? "encoding" : "decoding";
    const responseMs = Date.now() - currentRound.questionStartedAt;
    progressApi.recordAttempt(progressState, {
      substepId: config.substepId,
      mode,
      word,
      correct,
      responseMs
    });
    if (correct) currentRound.correct += 1;
    showFeedback(correct, message);
    playTone(correct);
    setTimeout(nextQuestion, correct ? 720 : 1100);
  }

  function showFeedback(correct, message) {
    const bar = document.getElementById("feedbackBar");
    bar.className = `feedback-bar show ${correct ? "good" : "try"}`;
    bar.textContent = `${correct ? "✨" : "💪"} ${message}`;
  }

  function nextQuestion() {
    if (!currentRound) return;
    currentRound.index += 1;
    if (currentRound.index >= currentRound.items.length) finishRound();
    else renderQuestion();
  }

  function finishRound() {
    const elapsedMs = Date.now() - currentRound.startedAt;
    const result = { correct: currentRound.correct, total: currentRound.items.length, elapsedMs };
    let completion;
    if (currentRound.context.drill) {
      completion = progressApi.completeDrillRound(progressState, config, {
        ...result,
        mode: currentRound.context.mode,
        level: currentRound.context.level
      });
    } else {
      completion = progressApi.completeActivity(progressState, config, currentRound.activity, result);
    }
    const summary = progressApi.summary(progressState, config);
    const accuracy = result.total ? result.correct / result.total : 1;
    showReward({
      accuracy,
      xpDelta: completion.xpDelta,
      mastered: summary.masteredWords.length,
      passed: currentRound.context.drill ? true : completion.passed,
      requiredAccuracy: completion.requiredAccuracy,
      setComplete: completion.newlyCompletedSets?.[0] || null,
      reward: completion.reward || null
    });
    currentRound = null;
    updateRail();
  }

  function showReward(details) {
    const setComplete = details.setComplete;
    document.getElementById("rewardIcon").textContent = details.reward ? "🛡️" : setComplete ? setComplete.icon : details.passed && details.accuracy >= .85 ? "🌟" : "💪";
    document.getElementById("rewardTitle").textContent = details.reward ? "Mastery badge unlocked!" : setComplete ? `${setComplete.title} cleared!` : details.passed && details.accuracy >= .85 ? "Power-up complete!" : details.passed ? "Path cleared!" : "Practice makes progress!";
    document.getElementById("rewardMessage").textContent = !details.passed
      ? `You need ${Math.round((details.requiredAccuracy || .7) * 100)}% to clear this activity. The same level stays open for another try.`
      : details.accuracy >= .85 ? "You showed strong accuracy. Keep building speed!" : "These words will cycle back so your brain gets another chance.";
    document.getElementById("rewardAccuracy").textContent = percent(details.accuracy);
    document.getElementById("rewardXp").textContent = `+${details.xpDelta}`;
    document.getElementById("rewardWords").textContent = details.mastered;
    document.getElementById("rewardScreen").hidden = false;
  }

  function closeReward() {
    document.getElementById("rewardScreen").hidden = true;
    showLobby();
    renderAll();
  }

  function exitActivity() {
    if (!currentRound || confirm("Exit this round? Your completed questions are already saved.")) {
      currentRound = null;
      showLobby();
      renderAll();
    }
  }

  function showLobby() {
    document.getElementById("lobbyView").hidden = false;
    document.getElementById("activityView").hidden = true;
  }

  function speak(text) {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(String(text));
    utterance.rate = .78;
    utterance.pitch = 1.02;
    window.speechSynthesis.speak(utterance);
  }

  function playTone(correct) {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const context = new AudioContext();
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(correct ? 520 : 240, context.currentTime);
      if (correct) oscillator.frequency.exponentialRampToValueAtTime(760, context.currentTime + .12);
      gain.gain.setValueAtTime(.08, context.currentTime);
      gain.gain.exponentialRampToValueAtTime(.001, context.currentTime + .2);
      oscillator.connect(gain).connect(context.destination);
      oscillator.start();
      oscillator.stop(context.currentTime + .21);
    } catch {}
  }

  function buildConfetti() {
    const colors = ["#534AB7", "#EF9F27", "#1D9E75", "#4B9FE3", "#F07B72"];
    document.querySelector(".confetti").innerHTML = Array.from({ length: 28 }, (_, index) => `<i style="left:${(index * 37) % 100}%;background:${colors[index % colors.length]};animation-delay:${(index % 8) * .16}s;animation-duration:${2.2 + (index % 5) * .2}s"></i>`).join("");
  }

  boot();
})();
