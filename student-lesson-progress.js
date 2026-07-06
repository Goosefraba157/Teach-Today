(function () {
  "use strict";

  const STORAGE_PREFIX = "teachToday.studentLessonProgress.v1";
  const PORTAL_SESSION_KEY = "tt_student_v1";

  function nowIso() { return new Date().toISOString(); }
  function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
  function round(value, places = 0) {
    const factor = 10 ** places;
    return Math.round((Number(value) || 0) * factor) / factor;
  }
  function safeRead(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key) || "null") || fallback; }
    catch { return fallback; }
  }
  function portalProfile() {
    return safeRead(PORTAL_SESSION_KEY, {}).profile || null;
  }
  function keyFor(studentId) { return `${STORAGE_PREFIX}.${studentId || "guest"}`; }

  function emptySkillStats() {
    return { correct: 0, total: 0, totalResponseMs: 0, bestResponseMs: null };
  }

  function emptySubstep(substepId) {
    return {
      substepId,
      completedActivities: [],
      completedSets: [],
      rewardedActivities: [],
      rewardedSets: [],
      activityScores: {},
      decoding: emptySkillStats(),
      encoding: emptySkillStats(),
      wordStats: {},
      drillRounds: [],
      lastDrillMode: "encoding",
      xpEarned: 0,
      masteryStatus: "Accuracy building",
      updatedAt: nowIso()
    };
  }

  function emptyState(studentId) {
    return { version: 1, studentId: studentId || "guest", substeps: {}, updatedAt: nowIso() };
  }

  function hydrateSubstep(raw, substepId) {
    const clean = { ...emptySubstep(substepId), ...(raw || {}) };
    clean.completedActivities = [...new Set(clean.completedActivities || [])];
    clean.completedSets = [...new Set(clean.completedSets || [])];
    clean.rewardedActivities = [...new Set(clean.rewardedActivities || [])];
    clean.rewardedSets = [...new Set(clean.rewardedSets || [])];
    clean.decoding = { ...emptySkillStats(), ...(clean.decoding || {}) };
    clean.encoding = { ...emptySkillStats(), ...(clean.encoding || {}) };
    clean.wordStats = clean.wordStats || {};
    clean.activityScores = clean.activityScores || {};
    clean.drillRounds = clean.drillRounds || [];
    return clean;
  }

  function load(studentId, profile = portalProfile()) {
    const state = { ...emptyState(studentId), ...safeRead(keyFor(studentId), {}) };
    state.studentId = studentId || state.studentId || "guest";
    state.substeps = { ...(profile?.lessonProgress?.substeps || {}), ...(state.substeps || {}) };
    Object.keys(state.substeps).forEach((id) => { state.substeps[id] = hydrateSubstep(state.substeps[id], id); });

    // Preserve completion from the existing Step 2.1 sound drill.
    if ((profile?.completedLessons || []).includes("2.1-sounds-1")) {
      const progress = state.substeps["2.1"] = hydrateSubstep(state.substeps["2.1"], "2.1");
      if (!progress.completedActivities.includes("2.1-learn-sounds")) progress.completedActivities.push("2.1-learn-sounds");
      if (!progress.rewardedActivities.includes("2.1-learn-sounds")) progress.rewardedActivities.push("2.1-learn-sounds");
    }
    return state;
  }

  function syncProfile(state, xpDelta = 0, reward = null) {
    const stored = safeRead(PORTAL_SESSION_KEY, {});
    const profile = stored.profile;
    if (!profile || String(profile.id) !== String(state.studentId)) return profile;
    profile.xp = Number(profile.xp || 0) + Number(xpDelta || 0);
    profile.lessonProgress = { version: state.version, substeps: state.substeps, updatedAt: state.updatedAt };
    if (reward) {
      profile.rewards = Array.isArray(profile.rewards) ? profile.rewards : [];
      if (!profile.rewards.some((item) => item?.id === reward.id)) profile.rewards.push(reward);
    }
    localStorage.setItem(PORTAL_SESSION_KEY, JSON.stringify({ ...stored, profile }));
    return profile;
  }

  function save(state, options = {}) {
    state.updatedAt = nowIso();
    localStorage.setItem(keyFor(state.studentId), JSON.stringify(state));
    syncProfile(state, options.xpDelta, options.reward);
    return state;
  }

  function getSubstep(state, substepId) {
    state.substeps[substepId] = hydrateSubstep(state.substeps[substepId], substepId);
    return state.substeps[substepId];
  }

  function accuracy(stats) {
    return stats?.total ? stats.correct / stats.total : 0;
  }

  function averageResponseMs(stats) {
    return stats?.total ? stats.totalResponseMs / stats.total : 0;
  }

  function masteryFor(progress) {
    const total = progress.decoding.total + progress.encoding.total;
    const correct = progress.decoding.correct + progress.encoding.correct;
    const combined = total ? correct / total : 0;
    const measured = [averageResponseMs(progress.decoding), averageResponseMs(progress.encoding)].filter(Boolean);
    const meanMs = measured.length ? measured.reduce((sum, value) => sum + value, 0) / measured.length : 0;
    if (combined >= 0.9 && total >= 20 && meanMs > 0 && meanMs <= 4500) return "Automaticity growing";
    if (combined >= 0.85 && total >= 10) return "Ready for challenge";
    if (combined >= 0.7) return "Building consistency";
    return "Accuracy building";
  }

  function updateWord(progress, word, correct, responseMs) {
    if (!word || String(word).includes(" ")) return;
    const id = String(word).toLowerCase();
    const stat = progress.wordStats[id] || { correct: 0, misses: 0, streak: 0, attempts: 0, mastered: false, lastSeenAt: null };
    stat.attempts += 1;
    if (correct) {
      stat.correct += 1;
      stat.streak += 1;
    } else {
      stat.misses += 1;
      stat.streak = 0;
      stat.mastered = false;
    }
    stat.lastResponseMs = Number(responseMs || 0);
    stat.lastSeenAt = nowIso();
    const wordAccuracy = stat.attempts ? stat.correct / stat.attempts : 0;
    if (stat.attempts >= 3 && stat.streak >= 3 && wordAccuracy >= 0.9) stat.mastered = true;
    progress.wordStats[id] = stat;
  }

  function recordAttempt(state, details) {
    const progress = getSubstep(state, details.substepId);
    const bucket = details.mode === "encoding" ? progress.encoding : progress.decoding;
    const responseMs = clamp(Number(details.responseMs || 0), 0, 120000);
    bucket.total += 1;
    bucket.correct += details.correct ? 1 : 0;
    bucket.totalResponseMs += responseMs;
    if (details.correct && responseMs > 0) bucket.bestResponseMs = bucket.bestResponseMs == null ? responseMs : Math.min(bucket.bestResponseMs, responseMs);
    updateWord(progress, details.word, Boolean(details.correct), responseMs);
    progress.masteryStatus = masteryFor(progress);
    progress.updatedAt = nowIso();
    save(state);
    return progress;
  }

  function refreshCompletedSets(progress, config) {
    const newlyCompleted = [];
    (config.heroPath?.lessonSets || []).forEach((set) => {
      const complete = set.activities.every((activity) => progress.completedActivities.includes(activity.id));
      if (complete && !progress.completedSets.includes(set.setId)) {
        progress.completedSets.push(set.setId);
        newlyCompleted.push(set);
      }
    });
    return newlyCompleted;
  }

  function completeActivity(state, config, activity, result = {}) {
    const progress = getSubstep(state, config.substepId);
    const requiredAccuracy = Number(activity.passingAccuracy ?? .7);
    const resultAccuracy = result.total ? Number(result.correct || 0) / Number(result.total) : 1;
    const passed = resultAccuracy >= requiredAccuracy;
    const firstCompletion = passed && !progress.completedActivities.includes(activity.id);
    if (firstCompletion) progress.completedActivities.push(activity.id);
    progress.activityScores[activity.id] = {
      correct: Number(result.correct || 0),
      total: Number(result.total || 0),
      accuracy: round(resultAccuracy, 3),
      requiredAccuracy,
      passed,
      elapsedMs: Number(result.elapsedMs || 0),
      completedAt: nowIso()
    };
    let xpDelta = 0;
    if (passed && !progress.rewardedActivities.includes(activity.id)) {
      progress.rewardedActivities.push(activity.id);
      xpDelta += Number(activity.xpReward || 0);
    }
    const newlyCompletedSets = passed ? refreshCompletedSets(progress, config) : [];
    newlyCompletedSets.forEach((set) => {
      if (!progress.rewardedSets.includes(set.setId)) {
        progress.rewardedSets.push(set.setId);
        xpDelta += Number(set.xpReward || 0);
      }
    });
    progress.xpEarned += xpDelta;
    progress.masteryStatus = masteryFor(progress);
    progress.updatedAt = nowIso();
    const masterySetDone = newlyCompletedSets.some((set) => set.setId === "mastery");
    const reward = masterySetDone ? {
      id: `${config.substepId}-welded-master`,
      icon: "🛡️",
      label: "Welded Sound Hero",
      category: "Mastery",
      isNew: true
    } : null;
    save(state, { xpDelta, reward });
    return { passed, requiredAccuracy, firstCompletion, xpDelta, newlyCompletedSets, reward, progress };
  }

  function completeDrillRound(state, config, result) {
    const progress = getSubstep(state, config.substepId);
    const round = {
      id: `drill-${Date.now()}`,
      mode: result.mode,
      level: result.level,
      correct: result.correct,
      total: result.total,
      accuracy: result.total ? roundNumber(result.correct / result.total, 3) : 0,
      elapsedMs: result.elapsedMs,
      completedAt: nowIso()
    };
    progress.drillRounds.push(round);
    progress.drillRounds = progress.drillRounds.slice(-30);
    progress.lastDrillMode = result.mode;
    const xpDelta = Math.max(5, Number(result.correct || 0) * 2 + (result.correct === result.total ? 5 : 0));
    progress.xpEarned += xpDelta;
    progress.masteryStatus = masteryFor(progress);
    save(state, { xpDelta });
    return { round, xpDelta, progress };
  }

  function roundNumber(value, places) { return round(value, places); }

  function adaptiveRule(progress, config) {
    const total = progress.decoding.total + progress.encoding.total;
    const correct = progress.decoding.correct + progress.encoding.correct;
    const combinedAccuracy = total ? correct / total : 0;
    const rules = config.drillPath?.adaptiveRules || [];
    if (total < 6) return rules[0];
    const candidate = rules.find((rule) => combinedAccuracy <= rule.maxAccuracy) || rules[rules.length - 1];
    if (candidate.level < 4) return candidate;
    const measured = [averageResponseMs(progress.decoding), averageResponseMs(progress.encoding)].filter(Boolean);
    const goodSpeed = measured.length === 2 && measured.every((value) => value <= 4500);
    const enoughBalancedPractice = total >= 20 && progress.decoding.total >= 6 && progress.encoding.total >= 6;
    return goodSpeed && enoughBalancedPractice ? candidate : rules.find((rule) => rule.level === 3) || candidate;
  }

  function shuffle(values) {
    const result = values.slice();
    for (let index = result.length - 1; index > 0; index -= 1) {
      const swap = Math.floor(Math.random() * (index + 1));
      [result[index], result[swap]] = [result[swap], result[index]];
    }
    return result;
  }

  function chooseWords(state, config, options = {}) {
    const progress = getSubstep(state, config.substepId);
    const patterns = options.patterns || [];
    let pool = (config.wordPool || []).filter((item) => !patterns.length || patterns.includes(item.pattern));
    if (!pool.length) pool = config.wordPool || [];
    const weighted = [];
    pool.forEach((item) => {
      const stat = progress.wordStats[item.word];
      const weight = stat?.mastered ? 1 : stat?.misses ? 5 : stat?.attempts ? 2 : 3;
      for (let i = 0; i < weight; i += 1) weighted.push(item);
    });
    const picked = [];
    const candidates = shuffle(weighted);
    const count = Number(options.count || 6);
    for (const item of candidates) {
      if (picked.length >= count) break;
      const occurrences = picked.filter((entry) => entry.word === item.word).length;
      if (occurrences < (item && progress.wordStats[item.word]?.misses ? 2 : 1)) picked.push(item);
    }
    return picked.length >= count ? picked : [...picked, ...shuffle(pool).slice(0, count - picked.length)];
  }

  function summary(state, config) {
    const progress = getSubstep(state, config.substepId);
    const sets = config.heroPath.lessonSets || [];
    const activities = sets.flatMap((set) => set.activities);
    const wordEntries = Object.entries(progress.wordStats);
    const missedWords = wordEntries.filter(([, stat]) => stat.misses > 0 && !stat.mastered).sort((a, b) => b[1].misses - a[1].misses).map(([word]) => word);
    const masteredWords = wordEntries.filter(([, stat]) => stat.mastered).map(([word]) => word);
    return {
      completedActivities: progress.completedActivities.length,
      totalActivities: activities.length,
      completedSets: progress.completedSets.length,
      totalSets: sets.length,
      decodingAccuracy: accuracy(progress.decoding),
      decodingRate: averageResponseMs(progress.decoding) ? round(60000 / averageResponseMs(progress.decoding), 1) : 0,
      encodingAccuracy: accuracy(progress.encoding),
      encodingRate: averageResponseMs(progress.encoding) ? round(60000 / averageResponseMs(progress.encoding), 1) : 0,
      missedWords,
      masteredWords,
      masteryStatus: progress.masteryStatus,
      drillRounds: progress.drillRounds.length,
      xpEarned: progress.xpEarned
    };
  }

  window.TTStudentLessonProgress = {
    load,
    save,
    getSubstep,
    recordAttempt,
    completeActivity,
    completeDrillRound,
    adaptiveRule,
    chooseWords,
    summary,
    masteryFor
  };
})();
