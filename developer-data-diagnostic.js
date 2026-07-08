(function () {
  "use strict";

  const access = window.TTDeveloperAccess;
  const KEYS = {
    teacher: "dyslexiaInstructionEngine.v2",
    session: "tt_student_v1",
    hub: "teachTodayGameHub.v1",
    progressPrefix: "teachToday.studentLessonProgress.v1.",
    outbox: "teachToday.studentActivityOutbox.v1",
    drillStudents: "teachToday_students",
    drillSessions: "teachToday_sessions",
    cursive: "wilsonCursiveStrokeLab.v1",
    syllableSlice: "wilsonSyllableSlice.v1",
    wordBuilder: "wilsonWordBuilder.v1",
    section2Overrides: "teachToday.section2CardOverrides.v1",
    workOffline: "teachToday.workOffline",
    firebaseStatus: "teachToday.firebaseSyncStatus",
    firebaseLastSync: "teachToday.lastFirebaseSyncAt",
    cloudStatus: "teachToday.cloudSyncStatus",
    cloudLastSync: "teachToday.lastCloudSyncAt",
    driveStatus: "teachToday.driveStatus",
    driveFolderId: "teachToday.driveFolderId"
  };

  const TEST = {
    id: "dev-sync-student",
    name: "Dev Sync Student",
    groupId: "dev-sync-lab",
    groupName: "Dev Sync Lab",
    substep: "2.1"
  };

  const dom = {
    gate: document.getElementById("diagAccessGate"),
    app: document.getElementById("diagApp"),
    accessLabel: document.getElementById("diagAccessLabel"),
    lock: document.getElementById("lockDevMode"),
    select: document.getElementById("studentSelect"),
    search: document.getElementById("studentSearch"),
    createTest: document.getElementById("createTestStudent"),
    runLesson: document.getElementById("runLessonSave"),
    runGame: document.getElementById("runGameSave"),
    compare: document.getElementById("compareViews"),
    reload: document.getElementById("reloadData"),
    clearTest: document.getElementById("clearTestData"),
    status: document.getElementById("statusStrip"),
    profileName: document.getElementById("profileName"),
    profileMeta: document.getElementById("profileMeta"),
    lessonNow: document.getElementById("lessonNow"),
    lessonMeta: document.getElementById("lessonMeta"),
    teacherRecordsCount: document.getElementById("teacherRecordsCount"),
    teacherRecordsMeta: document.getElementById("teacherRecordsMeta"),
    gamePoints: document.getElementById("gamePoints"),
    gameMeta: document.getElementById("gameMeta"),
    accuracySummary: document.getElementById("accuracySummary"),
    speedSummary: document.getElementById("speedSummary"),
    lastUpdated: document.getElementById("lastUpdated"),
    sourceSummary: document.getElementById("sourceSummary"),
    warningCount: document.getElementById("warningCount"),
    warningList: document.getElementById("warningList"),
    storeCount: document.getElementById("storeCount"),
    storeList: document.getElementById("storeList"),
    lessonAttempts: document.getElementById("lessonAttempts"),
    gameAttempts: document.getElementById("gameAttempts"),
    skillBreakdown: document.getElementById("skillBreakdown"),
    comparisonBadge: document.getElementById("comparisonBadge"),
    viewComparison: document.getElementById("viewComparison"),
    profileLink: document.getElementById("profileLink"),
    gameHubLink: document.getElementById("gameHubLink"),
    reportLink: document.getElementById("reportLink"),
    toggleRaw: document.getElementById("toggleRaw"),
    rawJson: document.getElementById("rawJson")
  };

  let snapshot = null;
  let currentKey = localStorage.getItem("teachToday.devDiagnostic.selectedStudent") || "";
  let searchTerm = "";
  let rawVisible = false;
  let comparedAt = "";

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    })[char]);
  }

  function safeRead(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      const parsed = JSON.parse(raw);
      return parsed == null ? fallback : parsed;
    } catch (_) {
      return fallback;
    }
  }

  function safeWrite(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function normalizeName(value) {
    return String(value || "").trim().toLowerCase();
  }

  function slugify(value) {
    return normalizeName(value).replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "student";
  }

  function nowIso() {
    return new Date().toISOString();
  }

  function shortDate(value) {
    if (!value) return "--";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "--";
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  }

  function formatDateTime(value) {
    if (!value) return "--";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "--";
    return `${date.toLocaleDateString([], { month: "short", day: "numeric" })} ${date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;
  }

  function latestDate(values) {
    const times = values
      .map((value) => new Date(value || 0).getTime())
      .filter((value) => Number.isFinite(value) && value > 0);
    return times.length ? new Date(Math.max(...times)).toISOString() : "";
  }

  function percent(correct, total) {
    return total ? `${Math.round((Number(correct || 0) / Number(total || 1)) * 100)}%` : "--";
  }

  function readProgressEntries() {
    const entries = [];
    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index) || "";
      if (!key.startsWith(KEYS.progressPrefix)) continue;
      const value = safeRead(key, null);
      if (value) entries.push({ key, id: key.slice(KEYS.progressPrefix.length), value });
    }
    return entries;
  }

  function loadSnapshot() {
    const teacher = safeRead(KEYS.teacher, {});
    const session = safeRead(KEYS.session, {});
    const hub = safeRead(KEYS.hub, { version: 1, activeStudentId: "", students: {}, games: {}, events: [] });
    const progressEntries = readProgressEntries();
    const outbox = safeRead(KEYS.outbox, []);
    const drillStudents = safeRead(KEYS.drillStudents, []);
    const drillSessions = safeRead(KEYS.drillSessions, []);
    const cursive = safeRead(KEYS.cursive, {});
    const syllableSlice = safeRead(KEYS.syllableSlice, {});
    const wordBuilder = safeRead(KEYS.wordBuilder, {});

    return {
      teacher: normalizeTeacherState(teacher),
      session,
      hub: normalizeHub(hub),
      progressEntries,
      outbox: Array.isArray(outbox) ? outbox : [],
      drillStudents: Array.isArray(drillStudents) ? drillStudents : [],
      drillSessions: Array.isArray(drillSessions) ? drillSessions : [],
      cursive,
      syllableSlice,
      wordBuilder,
      stores: buildStoreSummary({ teacher, session, hub, progressEntries, outbox, drillStudents, drillSessions, cursive, syllableSlice, wordBuilder })
    };
  }

  function normalizeTeacherState(data) {
    return {
      ...data,
      groups: Array.isArray(data.groups) ? data.groups : [],
      rosterStudents: Array.isArray(data.rosterStudents) ? data.rosterStudents : [],
      masterRecords: Array.isArray(data.masterRecords) ? data.masterRecords : []
    };
  }

  function normalizeHub(hub) {
    return {
      version: 1,
      activeStudentId: "",
      students: {},
      games: {},
      events: [],
      ...hub,
      students: hub && typeof hub.students === "object" ? hub.students : {},
      games: hub && typeof hub.games === "object" ? hub.games : {},
      events: Array.isArray(hub?.events) ? hub.events : []
    };
  }

  function buildStoreSummary(parts) {
    const firebaseStatus = localStorage.getItem(KEYS.firebaseStatus) || "";
    const cloudStatus = localStorage.getItem(KEYS.cloudStatus) || "";
    const driveStatus = localStorage.getItem(KEYS.driveStatus) || "";
    return [
      {
        id: "teacher",
        label: "Teacher master state",
        key: KEYS.teacher,
        readBy: "Teacher Dashboard, Lesson Flow, records, exports, StudentProfile, StudentReport, roster-aware games",
        writes: "Teacher Dashboard, lesson wrap-up, charting, dictation, standalone 2.1 drill, diagnostic test buttons",
        count: `${parts.teacher?.groups?.length || 0} groups, ${parts.teacher?.masterRecords?.length || 0} records`,
        status: parts.teacher && Object.keys(parts.teacher).length ? "present" : "missing"
      },
      {
        id: "studentSession",
        label: "Student home session",
        key: KEYS.session,
        readBy: "Student Homepage, Student Lesson Lab, standalone 2.1 drill",
        writes: "Student login, lesson progress saver, standalone 2.1 drill, diagnostic test buttons",
        count: parts.session?.profile ? parts.session.profile.name || parts.session.profile.id || "1 profile" : "no active profile",
        status: parts.session?.profile ? "present" : "missing"
      },
      {
        id: "lessonProgress",
        label: "Student lesson progress",
        key: `${KEYS.progressPrefix}<studentId>`,
        readBy: "Student Homepage tasks/pathway, Student Lesson Lab, diagnostic",
        writes: "Student Lesson Lab",
        count: `${parts.progressEntries.length} student progress record${parts.progressEntries.length === 1 ? "" : "s"}`,
        status: parts.progressEntries.length ? "present" : "missing"
      },
      {
        id: "gameHub",
        label: "Game Hub ledger",
        key: KEYS.hub,
        readBy: "Game Hub and all hub-aware mini-games",
        writes: "Game Hub, Decode Dash, Word Builder, Syllable Slice, Letter Hunt, Letter Soccer, Cursive Stroke Lab",
        count: `${Object.keys(parts.hub?.students || {}).length} players, ${(parts.hub?.events || []).length} events`,
        status: parts.hub && Object.keys(parts.hub.students || {}).length ? "present" : "missing"
      },
      {
        id: "studentCloudOutbox",
        label: "Student cloud activity outbox",
        key: KEYS.outbox,
        readBy: "Student activity sync and StudentProfile after cloud import",
        writes: "Student activity sync, standalone 2.1 drill, diagnostic test buttons",
        count: `${Array.isArray(parts.outbox) ? parts.outbox.length : 0} pending item${Array.isArray(parts.outbox) && parts.outbox.length === 1 ? "" : "s"}`,
        status: Array.isArray(parts.outbox) && parts.outbox.length ? "warn" : "present"
      },
      {
        id: "standaloneDrill",
        label: "Standalone 2.1 drill stores",
        key: `${KEYS.drillStudents}, ${KEYS.drillSessions}`,
        readBy: "Lesson 2.1 Student Drill and StudentProfile via cross-write",
        writes: "Lesson 2.1 Student Drill",
        count: `${Array.isArray(parts.drillSessions) ? parts.drillSessions.length : 0} sessions`,
        status: Array.isArray(parts.drillSessions) && parts.drillSessions.length ? "present" : "missing"
      },
      {
        id: "gameSpecific",
        label: "Game-specific local stores",
        key: `${KEYS.cursive}, ${KEYS.wordBuilder}, ${KEYS.syllableSlice}`,
        readBy: "Individual mini-games, with hub rollup where implemented",
        writes: "Individual mini-games",
        count: [
          parts.cursive?.players ? `${Object.keys(parts.cursive.players).length} cursive players` : "",
          parts.wordBuilder?.players ? `${Object.keys(parts.wordBuilder.players).length} word builder players` : "",
          parts.syllableSlice?.playerName ? "1 syllable slice player" : ""
        ].filter(Boolean).join(", ") || "no game-specific state",
        status: parts.cursive?.players || parts.wordBuilder?.players || parts.syllableSlice?.playerName ? "present" : "missing"
      },
      {
        id: "offlineSync",
        label: "Offline and backup flags",
        key: "Firebase, Drive, local backup status keys",
        readBy: "Teacher Records / Data Center and diagnostic",
        writes: "Teacher Firebase sync, local backup folder, Google Drive audio upload",
        count: [firebaseStatus, cloudStatus, driveStatus].filter(Boolean).length ? "status keys found" : "no sync status saved",
        status: /failed|could not|offline|denied/i.test(`${firebaseStatus} ${cloudStatus} ${driveStatus}`) ? "warn" : "present"
      }
    ];
  }

  function candidateKey(id, name) {
    return id ? `id:${id}` : `name:${slugify(name)}`;
  }

  function addCandidate(map, info) {
    const name = String(info.name || info.fullName || info.student || info.studentName || info.id || "").trim();
    const id = String(info.id || info.studentId || "").trim();
    if (!name && !id) return;
    const key = candidateKey(id, name);
    if (!map.has(key)) {
      map.set(key, {
        key,
        id,
        name: name || id,
        groupId: info.groupId || "",
        groupName: info.groupName || info.group || "",
        substep: info.substep || "",
        sources: new Set()
      });
    }
    const item = map.get(key);
    if (!item.name && name) item.name = name;
    if (!item.id && id) item.id = id;
    if (!item.groupId && info.groupId) item.groupId = info.groupId;
    if (!item.groupName && (info.groupName || info.group)) item.groupName = info.groupName || info.group;
    if (!item.substep && info.substep) item.substep = info.substep;
    item.sources.add(info.source || "unknown");
  }

  function buildCandidates(data) {
    const map = new Map();
    data.teacher.rosterStudents.forEach((student) => addCandidate(map, {
      ...(typeof student === "string" ? { name: student } : student),
      source: "teacher roster"
    }));
    data.teacher.groups.forEach((group) => {
      (group.students || []).forEach((name) => addCandidate(map, {
        name,
        groupId: group.id,
        groupName: group.name,
        substep: group.substep,
        source: "teacher group"
      }));
    });
    data.teacher.masterRecords.forEach((record) => addCandidate(map, {
      id: record.studentId || "",
      name: record.student,
      groupId: record.groupId,
      groupName: record.group,
      substep: record.substep,
      source: "teacher record"
    }));
    Object.values(data.hub.students).forEach((student) => addCandidate(map, { ...student, source: "game hub" }));
    data.progressEntries.forEach((entry) => addCandidate(map, {
      id: entry.value.studentId || entry.id,
      name: entry.value.studentName || entry.value.name || "",
      source: "student lesson progress"
    }));
    if (data.session?.profile) addCandidate(map, { ...data.session.profile, source: "student session" });
    data.drillStudents.forEach((student) => addCandidate(map, { ...student, source: "standalone drill" }));
    data.drillSessions.forEach((session) => addCandidate(map, {
      id: session.studentId,
      name: session.studentName,
      groupId: session.groupId,
      groupName: session.groupName,
      source: "standalone drill session"
    }));
    data.outbox.forEach((item) => addCandidate(map, { ...(item.event || {}), source: "student activity outbox" }));

    return [...map.values()]
      .map((item) => ({ ...item, sources: [...item.sources].sort() }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  function idMatches(value, student) {
    if (!value) return false;
    const ids = new Set([student.id, slugify(student.name), String(student.key || "").replace(/^id:/, ""), TEST.id].filter(Boolean).map(String));
    return ids.has(String(value));
  }

  function nameMatches(value, student) {
    if (!value) return false;
    return normalizeName(value) === normalizeName(student.name);
  }

  function recordMatchesStudent(record, student) {
    return idMatches(record.studentId, student) || nameMatches(record.student || record.studentName, student);
  }

  function groupForStudent(data, student) {
    return data.teacher.groups.find((group) => (group.students || []).some((name) => nameMatches(name, student)))
      || data.teacher.groups.find((group) => group.id === student.groupId)
      || null;
  }

  function progressForStudent(data, student) {
    return data.progressEntries.find((entry) => idMatches(entry.id, student) || idMatches(entry.value.studentId, student))
      || data.progressEntries.find((entry) => nameMatches(entry.value.studentName || entry.value.name, student))
      || null;
  }

  function hubStudentFor(data, student) {
    return Object.values(data.hub.students).find((item) => idMatches(item.id, student) || nameMatches(item.name, student)) || null;
  }

  function profileForStudent(data, student) {
    const profile = data.session?.profile;
    if (!profile) return null;
    return idMatches(profile.id, student) || nameMatches(profile.name || profile.fullName, student) ? profile : null;
  }

  function wordBuilderFor(data, student) {
    const players = data.wordBuilder?.players || {};
    return players[slugify(student.name)] || Object.values(players).find((player) => nameMatches(player.name || player.playerName, student)) || null;
  }

  function cursiveFor(data, student) {
    const players = data.cursive?.players || {};
    return Object.values(players).find((player) => nameMatches(player.name, student)) || null;
  }

  function selectedStudent() {
    const candidates = buildCandidates(snapshot);
    if (!candidates.length) return null;
    if (currentKey && candidates.some((item) => item.key === currentKey)) return candidates.find((item) => item.key === currentKey);
    const sessionProfile = snapshot.session?.profile;
    if (sessionProfile) {
      const match = candidates.find((item) => idMatches(sessionProfile.id, item) || nameMatches(sessionProfile.name, item));
      if (match) return match;
    }
    const activeGroup = snapshot.teacher.groups.find((group) => group.id === snapshot.teacher.selectedGroupId) || snapshot.teacher.groups[0];
    if (activeGroup?.activeStudent) {
      const match = candidates.find((item) => nameMatches(activeGroup.activeStudent, item));
      if (match) return match;
    }
    return candidates[0];
  }

  function buildStudentReport(data, student) {
    const group = groupForStudent(data, student);
    const profile = profileForStudent(data, student);
    const progressEntry = progressForStudent(data, student);
    const progress = progressEntry?.value || null;
    const hubStudent = hubStudentFor(data, student);
    const hubGames = hubStudent ? data.hub.games[hubStudent.id] || {} : {};
    const hubEvents = hubStudent
      ? data.hub.events.filter((event) => event.studentId === hubStudent.id || nameMatches(event.studentName, student))
      : data.hub.events.filter((event) => nameMatches(event.studentName, student));
    const teacherRecords = data.teacher.masterRecords.filter((record) => recordMatchesStudent(record, student));
    const dictationMisses = (group?.dictationMisses || []).filter((record) => nameMatches(record.student, student));
    const encodingObservations = (group?.encodingObservations || []).filter((record) => nameMatches(record.student, student));
    const outboxEvents = data.outbox.map((item) => item.event || {}).filter((event) => recordMatchesStudent(event, student));
    const drillSessions = data.drillSessions.filter((session) => recordMatchesStudent(session, student));
    const wordBuilder = wordBuilderFor(data, student);
    const cursive = cursiveFor(data, student);
    const syllableSlice = nameMatches(data.syllableSlice?.playerName, student) ? data.syllableSlice : null;
    const lessonAttempts = buildLessonAttempts({ teacherRecords, progress, drillSessions, outboxEvents });
    const gameAttempts = buildGameAttempts({ hubEvents, hubGames, wordBuilder, cursive, syllableSlice });
    const latest = latestDate([
      profile?.updatedAt,
      profile?.lastActivityAt,
      progress?.updatedAt,
      ...teacherRecords.map((record) => record.date || record.displayDate),
      ...dictationMisses.map((record) => record.date),
      ...encodingObservations.map((record) => record.date),
      ...hubEvents.map((event) => event.createdAt),
      ...Object.values(hubGames).map((game) => game.lastPlayedAt),
      data.teacher.lastSavedAt,
      data.hub.updatedAt
    ]);
    const warnings = buildWarnings({ data, student, group, profile, progress, progressEntry, hubStudent, hubEvents, teacherRecords, outboxEvents, gameAttempts });
    const comparison = buildViewComparison({ data, student, group, profile, progress, hubStudent, hubEvents, hubGames, teacherRecords, lessonAttempts, gameAttempts });

    return {
      student,
      group,
      profile,
      progressEntry,
      progress,
      hubStudent,
      hubGames,
      hubEvents,
      teacherRecords,
      dictationMisses,
      encodingObservations,
      outboxEvents,
      drillSessions,
      wordBuilder,
      cursive,
      syllableSlice,
      lessonAttempts,
      gameAttempts,
      latest,
      warnings,
      comparison
    };
  }

  function buildLessonAttempts(parts) {
    const rows = [];
    parts.teacherRecords.forEach((record) => rows.push({
      date: record.date || record.displayDate || "",
      source: record.type === "gameAttempt" ? "Teacher record: game bridge" : "Teacher master record",
      title: record.lessonTitle || record.lesson || record.title || record.type || "Saved record",
      substep: record.substep || "",
      accuracy: record.total ? percent(record.correct, record.total) : record.correct ? `${record.correct}` : "--",
      detail: [record.correct && record.total ? `${record.correct}/${record.total}` : "", record.seconds ? `${record.seconds}s` : "", record.wcpm ? `${record.wcpm} wcpm` : ""].filter(Boolean).join(", ")
    }));
    Object.entries(parts.progress?.substeps || {}).forEach(([substepId, substep]) => {
      Object.entries(substep.activityScores || {}).forEach(([activityId, score]) => rows.push({
        date: score.completedAt || substep.updatedAt || parts.progress.updatedAt || "",
        source: "Student lesson progress",
        title: activityId,
        substep: substepId,
        accuracy: score.total ? percent(score.correct, score.total) : "--",
        detail: [score.correct != null && score.total != null ? `${score.correct}/${score.total}` : "", score.passed ? "passed" : "practice"].filter(Boolean).join(", ")
      }));
      (substep.drillRounds || []).forEach((round) => rows.push({
        date: round.completedAt || substep.updatedAt || "",
        source: "Student drill round",
        title: `${round.mode || "drill"} level ${round.level || ""}`.trim(),
        substep: substepId,
        accuracy: round.total ? percent(round.correct, round.total) : "--",
        detail: [round.correct != null && round.total != null ? `${round.correct}/${round.total}` : "", round.elapsedMs ? `${Math.round(round.elapsedMs / 1000)}s` : ""].filter(Boolean).join(", ")
      }));
    });
    parts.drillSessions.forEach((session) => rows.push({
      date: session.date || "",
      source: "Standalone 2.1 drill",
      title: session.lesson || "Sounds Quick Drill",
      substep: "2.1",
      accuracy: session.totalCards ? percent(session.perfect, session.totalCards) : "--",
      detail: `${session.perfect || 0}/${session.totalCards || 14} perfect`
    }));
    parts.outboxEvents.forEach((event) => rows.push({
      date: event.date || event.queuedAt || "",
      source: "Student activity outbox",
      title: event.title || event.lesson || event.type || "Queued activity",
      substep: event.substep || "",
      accuracy: event.totalCards ? percent(event.perfect, event.totalCards) : "--",
      detail: event.lastSyncError ? `sync error: ${event.lastSyncError}` : "pending cloud flush"
    }));
    return rows.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0)).slice(0, 12);
  }

  function buildGameAttempts(parts) {
    const rows = [];
    Object.entries(parts.hubGames || {}).forEach(([gameId, record]) => rows.push({
      date: record.lastPlayedAt || "",
      source: "Game Hub total",
      gameId,
      points: record.points || 0,
      sessions: record.sessions || 0,
      detail: `${record.sessions || 0} session${record.sessions === 1 ? "" : "s"}`
    }));
    (parts.hubEvents || []).forEach((event) => rows.push({
      date: event.createdAt || "",
      source: "Game Hub event",
      gameId: event.gameId || "game",
      points: event.points || 0,
      sessions: 1,
      detail: event.detail ? JSON.stringify(event.detail).slice(0, 90) : "saved event"
    }));
    if (parts.wordBuilder) rows.push({
      date: parts.wordBuilder.updatedAt || "",
      source: "Word Builder local",
      gameId: "wordBuilder",
      points: parts.wordBuilder.totalPoints || 0,
      sessions: "",
      detail: `${(parts.wordBuilder.recentWords || []).length} recent words`
    });
    if (parts.cursive) rows.push({
      date: parts.cursive.updatedAt || "",
      source: "Cursive local",
      gameId: "cursive",
      points: parts.cursive.totalPoints || 0,
      sessions: "",
      detail: `${Object.keys(parts.cursive.letters || {}).length} letters`
    });
    if (parts.syllableSlice) rows.push({
      date: parts.syllableSlice.updatedAt || "",
      source: "Syllable Slice local",
      gameId: "syllableSlice",
      points: parts.syllableSlice.totalPoints || 0,
      sessions: "",
      detail: `${(parts.syllableSlice.recentWords || []).length} recent words`
    });
    return rows.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0)).slice(0, 12);
  }

  function buildWarnings(parts) {
    const warnings = [];
    if (!parts.group) warnings.push({ level: "bad", title: "Missing teacher group link", text: "This student is not found in a teacher group, so Teacher Dashboard, records, and reports may not line up with the student app." });
    if (!parts.profile) warnings.push({ level: "warn", title: "No matching student session", text: "The Student Homepage session is empty or belongs to a different student in this browser." });
    if (!parts.progress) warnings.push({ level: "warn", title: "No student lesson progress record", text: "Student Lesson Lab progress has not been saved under this student's ID yet." });
    if (!parts.teacherRecords.length) warnings.push({ level: "warn", title: "No teacher master records", text: "StudentProfile, StudentReport, records, exports, and wrap-up will have little or no evidence for this student." });
    if (parts.hubEvents.length && !parts.teacherRecords.some((record) => record.type === "gameAttempt")) {
      warnings.push({ level: "warn", title: "Game progress is hub-only", text: "Mini-games update the Game Hub ledger. They do not automatically become teacher charting records unless a bridge/import writes a teacher record." });
    }
    if (parts.progress && parts.teacherRecords.length) {
      const progressTime = new Date(parts.progress.updatedAt || 0).getTime();
      const teacherTime = Math.max(...parts.teacherRecords.map((record) => new Date(record.date || record.displayDate || 0).getTime()).filter(Number.isFinite), 0);
      if (progressTime && teacherTime && progressTime - teacherTime > 60000) {
        warnings.push({ level: "warn", title: "Student lesson progress is newer than teacher records", text: "A recent student lesson save may not be reflected in teacher records yet." });
      }
    }
    if (parts.outboxEvents.length) warnings.push({ level: "warn", title: "Student cloud outbox has pending data", text: `${parts.outboxEvents.length} item${parts.outboxEvents.length === 1 ? "" : "s"} for this student are waiting for Firebase sync or retry.` });
    if (localStorage.getItem(KEYS.workOffline) === "true") warnings.push({ level: "warn", title: "Teacher app is marked offline", text: "Local browser storage is still saving, but Firebase and Drive sync can lag until reconnect." });
    const syncText = [localStorage.getItem(KEYS.firebaseStatus), localStorage.getItem(KEYS.cloudStatus), localStorage.getItem(KEYS.driveStatus)].filter(Boolean).join(" ");
    if (/failed|could not|denied|offline/i.test(syncText)) warnings.push({ level: "warn", title: "Backup or cloud status needs attention", text: syncText.slice(0, 220) });
    if (parts.data.teacher.groups.some((group) => /sample|blue group/i.test(group.name || group.id || ""))) {
      warnings.push({ level: "warn", title: "Sample data is present", text: "Sample Blue Group data is merged into the teacher store for demo/regression coverage. Avoid treating it as a live roster." });
    }
    if (!warnings.length) warnings.push({ level: "good", title: "No local sync warnings for this student", text: "The local stores that exist for this student agree enough for a smoke test. Cloud state still depends on sign-in and network availability." });
    return warnings;
  }

  function buildViewComparison(parts) {
    const teacherLatest = latestDate(parts.teacherRecords.map((record) => record.date || record.displayDate));
    const gameLatest = latestDate(parts.hubEvents.map((event) => event.createdAt));
    const progressLatest = parts.progress?.updatedAt || "";
    const reportReady = Boolean(parts.group && parts.teacherRecords.length);
    return [
      {
        label: "Student Homepage",
        ok: Boolean(parts.profile || parts.progress),
        detail: parts.profile
          ? `${parts.profile.name || parts.student.name}, sub-step ${parts.profile.substep || parts.student.substep || "--"}, ${Number(parts.profile.xp || 0).toLocaleString()} XP`
          : parts.progress ? `Progress key ${parts.progress.studentId || parts.progressEntry?.id} exists` : "No matching profile/session"
      },
      {
        label: "Student Lesson Lab",
        ok: Boolean(parts.progress),
        detail: parts.progress ? `Updated ${formatDateTime(progressLatest)} with ${Object.keys(parts.progress.substeps || {}).length} substep record(s)` : "No saved lesson progress"
      },
      {
        label: "Game Hub",
        ok: Boolean(parts.hubStudent),
        detail: parts.hubStudent ? `${gamePointTotal(parts.hubGames).toLocaleString()} points, ${parts.hubEvents.length} event(s), latest ${formatDateTime(gameLatest)}` : "No hub player"
      },
      {
        label: "Teacher Dashboard",
        ok: Boolean(parts.group),
        detail: parts.group ? `${parts.group.name || parts.group.id}, active student ${parts.group.activeStudent || "--"}` : "Student not in a teacher group"
      },
      {
        label: "Records and Exports",
        ok: reportReady,
        detail: reportReady ? `${parts.teacherRecords.length} teacher record(s), latest ${formatDateTime(teacherLatest)}` : "Reports need teacher master records"
      },
      {
        label: "Developer Diagnostic",
        ok: true,
        detail: comparedAt ? `Compared ${formatDateTime(comparedAt)}` : "Live local snapshot"
      }
    ];
  }

  function gamePointTotal(games) {
    return Object.values(games || {}).reduce((sum, record) => sum + Number(record.points || 0), 0);
  }

  function renderStudentSelect() {
    const candidates = buildCandidates(snapshot);
    const filtered = candidates.filter((student) => {
      if (!searchTerm) return true;
      const text = [student.name, student.id, student.groupName, student.substep, student.sources.join(" ")].join(" ").toLowerCase();
      return text.includes(searchTerm);
    });
    if (!currentKey || !candidates.some((student) => student.key === currentKey)) {
      currentKey = selectedStudent()?.key || filtered[0]?.key || "";
    }
    dom.select.innerHTML = filtered.map((student) => {
      const label = `${student.name}${student.id ? ` (${student.id})` : ""} - ${student.sources.join(", ")}`;
      return `<option value="${escapeHtml(student.key)}"${student.key === currentKey ? " selected" : ""}>${escapeHtml(label)}</option>`;
    }).join("") || `<option value="">No students found</option>`;
  }

  function renderStatus(report) {
    const sourceCount = report.student.sources?.length || 0;
    const chips = [
      { text: `${sourceCount} source${sourceCount === 1 ? "" : "s"}`, level: sourceCount >= 3 ? "" : "warn" },
      { text: `${report.teacherRecords.length} teacher record${report.teacherRecords.length === 1 ? "" : "s"}`, level: report.teacherRecords.length ? "" : "warn" },
      { text: `${report.gameAttempts.length} game row${report.gameAttempts.length === 1 ? "" : "s"}`, level: report.gameAttempts.length ? "" : "warn" },
      { text: `${report.outboxEvents.length} pending outbox`, level: report.outboxEvents.length ? "warn" : "" },
      { text: localStorage.getItem(KEYS.workOffline) === "true" ? "offline flag on" : "local storage active", level: localStorage.getItem(KEYS.workOffline) === "true" ? "warn" : "" }
    ];
    dom.status.innerHTML = chips.map((chip) => `<span class="status-chip ${chip.level || ""}">${escapeHtml(chip.text)}</span>`).join("");
  }

  function renderSummary(report) {
    const lessonStats = aggregateProgress(report.progress);
    const teacherAccuracy = aggregateTeacherAccuracy(report.teacherRecords);
    const gameTotal = gamePointTotal(report.hubGames);
    const currentSubstep = report.profile?.substep || report.group?.substep || report.progress?.substeps && Object.keys(report.progress.substeps).sort().pop() || report.student.substep || "--";

    dom.profileName.textContent = report.profile?.name || report.student.name || "--";
    dom.profileMeta.textContent = [report.student.id || report.profile?.id || "", report.group?.name || report.student.groupName || "", report.profile ? "session linked" : "no session"].filter(Boolean).join(" - ") || "--";
    dom.lessonNow.textContent = `Sub-step ${currentSubstep}`;
    dom.lessonMeta.textContent = lessonStats.total ? `${lessonStats.correct}/${lessonStats.total} lesson responses - ${lessonStats.mastery || "No mastery label"}` : "No student lesson attempts";
    dom.teacherRecordsCount.textContent = String(report.teacherRecords.length);
    dom.teacherRecordsMeta.textContent = report.teacherRecords[0] ? `Latest ${formatDateTime(report.teacherRecords[0].date || report.teacherRecords[0].displayDate)}` : "No teacher records";
    dom.gamePoints.textContent = `${gameTotal.toLocaleString()} pts`;
    dom.gameMeta.textContent = report.gameAttempts[0] ? `${report.gameAttempts.length} recent game rows` : "No hub game attempts";
    dom.accuracySummary.textContent = teacherAccuracy.total ? percent(teacherAccuracy.correct, teacherAccuracy.total) : lessonStats.total ? percent(lessonStats.correct, lessonStats.total) : "--";
    dom.speedSummary.textContent = teacherAccuracy.seconds ? `${teacherAccuracy.seconds}s avg, ${teacherAccuracy.wcpm || "--"} wcpm` : "Student lesson speed only when captured";
    dom.lastUpdated.textContent = formatDateTime(report.latest);
    dom.sourceSummary.textContent = report.student.sources.join(", ") || "--";
  }

  function aggregateProgress(progress) {
    let correct = 0;
    let total = 0;
    let mastery = "";
    Object.values(progress?.substeps || {}).forEach((substep) => {
      correct += Number(substep.decoding?.correct || 0) + Number(substep.encoding?.correct || 0);
      total += Number(substep.decoding?.total || 0) + Number(substep.encoding?.total || 0);
      if (substep.masteryStatus) mastery = substep.masteryStatus;
    });
    return { correct, total, mastery };
  }

  function aggregateTeacherAccuracy(records) {
    const recent = records.filter((record) => record.total || record.correct).slice(0, 5);
    const correct = recent.reduce((sum, record) => sum + Number(record.correct || 0), 0);
    const total = recent.reduce((sum, record) => sum + Number(record.total || 15), 0);
    const secondsValues = recent.map((record) => Number(record.seconds || 0)).filter(Boolean);
    const wcpmValues = recent.map((record) => Number(record.wcpm || 0)).filter(Boolean);
    return {
      correct,
      total,
      seconds: secondsValues.length ? Math.round(secondsValues.reduce((sum, value) => sum + value, 0) / secondsValues.length) : 0,
      wcpm: wcpmValues.length ? Math.round(wcpmValues.reduce((sum, value) => sum + value, 0) / wcpmValues.length) : 0
    };
  }

  function renderWarnings(report) {
    dom.warningCount.textContent = String(report.warnings.filter((item) => item.level !== "good").length);
    dom.warningList.innerHTML = report.warnings.map((warning) => `
      <article class="notice ${escapeHtml(warning.level)}">
        <strong>${escapeHtml(warning.title)}</strong>
        <span>${escapeHtml(warning.text)}</span>
      </article>
    `).join("");
  }

  function renderStores() {
    dom.storeCount.textContent = String(snapshot.stores.length);
    dom.storeList.innerHTML = snapshot.stores.map((store) => `
      <article class="store-row">
        <div>
          <strong>${escapeHtml(store.label)}</strong>
          <span>${escapeHtml(store.key)}</span>
        </div>
        <div>
          <span><b>Reads:</b> ${escapeHtml(store.readBy)}</span><br>
          <span><b>Writes:</b> ${escapeHtml(store.writes)}</span>
        </div>
        <span class="store-badge ${store.status === "missing" ? "missing" : store.status === "warn" ? "warn" : ""}">${escapeHtml(store.count)}</span>
      </article>
    `).join("");
  }

  function renderTable(container, headers, rows) {
    if (!rows.length) {
      container.innerHTML = `<p class="notice">No rows for this student yet.</p>`;
      return;
    }
    container.innerHTML = `
      <table class="diag-table">
        <thead><tr>${headers.map((header) => `<th>${escapeHtml(header.label)}</th>`).join("")}</tr></thead>
        <tbody>
          ${rows.map((row) => `<tr>${headers.map((header) => `<td>${escapeHtml(header.value(row))}</td>`).join("")}</tr>`).join("")}
        </tbody>
      </table>
    `;
  }

  function renderDetails(report) {
    renderTable(dom.lessonAttempts, [
      { label: "Date", value: (row) => formatDateTime(row.date) },
      { label: "Source", value: (row) => row.source },
      { label: "Title", value: (row) => row.title },
      { label: "Step", value: (row) => row.substep || "--" },
      { label: "Accuracy", value: (row) => row.accuracy },
      { label: "Detail", value: (row) => row.detail || "--" }
    ], report.lessonAttempts);
    renderTable(dom.gameAttempts, [
      { label: "Date", value: (row) => formatDateTime(row.date) },
      { label: "Source", value: (row) => row.source },
      { label: "Game", value: (row) => row.gameId },
      { label: "Points", value: (row) => row.points },
      { label: "Sessions", value: (row) => row.sessions || "--" },
      { label: "Detail", value: (row) => row.detail || "--" }
    ], report.gameAttempts);
  }

  function renderSkills(report) {
    const progress = report.progress || {};
    const skillRows = [];
    Object.entries(progress.substeps || {}).forEach(([substepId, substep]) => {
      skillRows.push({
        title: `Sub-step ${substepId}`,
        text: `Decoding ${substep.decoding?.correct || 0}/${substep.decoding?.total || 0}, encoding ${substep.encoding?.correct || 0}/${substep.encoding?.total || 0}, mastery ${substep.masteryStatus || "--"}`
      });
      const missedWords = Object.entries(substep.wordStats || {})
        .filter(([, stat]) => Number(stat.misses || 0) > 0)
        .sort((a, b) => Number(b[1].misses || 0) - Number(a[1].misses || 0))
        .slice(0, 8)
        .map(([word, stat]) => `${word} (${stat.misses})`);
      if (missedWords.length) skillRows.push({ title: "Review words", text: missedWords.join(", ") });
    });
    if (report.dictationMisses.length || report.encodingObservations.length) {
      const latest = report.dictationMisses.concat(report.encodingObservations).slice(-8).map((item) => item.item || item.note || item.category).filter(Boolean);
      skillRows.push({ title: "Teacher encoding marks", text: latest.join(", ") || "No named items" });
    }
    dom.skillBreakdown.innerHTML = skillRows.length
      ? skillRows.map((row) => `<article class="skill-row"><strong>${escapeHtml(row.title)}</strong><span>${escapeHtml(row.text)}</span></article>`).join("")
      : `<p class="notice">No decoding or encoding detail has been saved for this student yet.</p>`;
  }

  function renderComparison(report) {
    dom.comparisonBadge.textContent = comparedAt ? "Compared" : "Ready";
    dom.viewComparison.innerHTML = report.comparison.map((row) => `
      <article class="comparison-row">
        <strong>${row.ok ? "OK" : "Check"} - ${escapeHtml(row.label)}</strong>
        <span>${escapeHtml(row.detail)}</span>
      </article>
    `).join("");
  }

  function renderLinks(report) {
    const groupId = report.group?.id || report.student.groupId || "";
    const studentName = report.student.name || "";
    const query = `group=${encodeURIComponent(groupId)}&student=${encodeURIComponent(studentName)}&developer=1`;
    dom.profileLink.href = `StudentProfile.html?${query}`;
    dom.reportLink.href = `StudentReport.html?${query}`;
    dom.gameHubLink.href = `Games/index.html?student=${encodeURIComponent(studentName)}&developer=1`;
  }

  function renderRaw(report) {
    dom.rawJson.hidden = !rawVisible;
    dom.toggleRaw.textContent = rawVisible ? "Hide raw JSON" : "Show raw JSON";
    if (!rawVisible) return;
    dom.rawJson.textContent = JSON.stringify({
      selectedStudent: report.student,
      teacherGroup: report.group,
      teacherRecords: report.teacherRecords,
      studentSessionProfile: report.profile,
      studentLessonProgressKey: report.progressEntry?.key || "",
      studentLessonProgress: report.progress,
      gameHubStudent: report.hubStudent,
      gameHubGames: report.hubGames,
      gameHubEvents: report.hubEvents,
      dictationMisses: report.dictationMisses,
      encodingObservations: report.encodingObservations,
      outboxEvents: report.outboxEvents,
      gameSpecific: {
        wordBuilder: report.wordBuilder,
        cursive: report.cursive,
        syllableSlice: report.syllableSlice
      },
      storageSources: snapshot.stores,
      warnings: report.warnings,
      comparison: report.comparison
    }, null, 2);
  }

  function render() {
    if (!access?.isEnabled?.()) {
      dom.gate.hidden = false;
      dom.app.hidden = true;
      return;
    }
    dom.gate.hidden = true;
    dom.app.hidden = false;
    dom.accessLabel.textContent = `Creator mode: ${access.stateLabel()}`;
    snapshot = loadSnapshot();
    renderStudentSelect();
    const student = selectedStudent();
    if (!student) return;
    currentKey = student.key;
    localStorage.setItem("teachToday.devDiagnostic.selectedStudent", currentKey);
    const report = buildStudentReport(snapshot, student);
    renderStatus(report);
    renderSummary(report);
    renderWarnings(report);
    renderStores();
    renderDetails(report);
    renderSkills(report);
    renderComparison(report);
    renderLinks(report);
    renderRaw(report);
  }

  function ensureTeacherTestState() {
    const data = normalizeTeacherState(safeRead(KEYS.teacher, {}));
    data.rosterStudents ||= [];
    if (!data.rosterStudents.some((student) => normalizeName(student.name || student) === normalizeName(TEST.name))) {
      data.rosterStudents.push({ name: TEST.name, fullName: TEST.name, gradeLevel: "Dev", school: "Developer" });
    }
    data.groups ||= [];
    let group = data.groups.find((item) => item.id === TEST.groupId);
    if (!group) {
      group = {
        id: TEST.groupId,
        school: "Developer",
        time: "Testing",
        name: TEST.groupName,
        substep: TEST.substep,
        meetingDays: 5,
        readerLevel: "AB",
        pageProgress: { wordlist: 0, sentences: 0, passage: 0 },
        activeStudent: TEST.name,
        students: [],
        trouble: [],
        note: "",
        chartResults: [],
        history: [],
        dictationMisses: [],
        encodingObservations: [],
        markedReviewWords: [],
        section9Story: {
          passageId: "reader2-2.1-ab-p14-moth-pink-wings",
          approach: "comprehension-sos",
          updatedAt: nowIso()
        }
      };
      data.groups.push(group);
    }
    group.students ||= [];
    if (!group.students.some((name) => normalizeName(name) === normalizeName(TEST.name))) group.students.push(TEST.name);
    group.activeStudent = TEST.name;
    group.substep = TEST.substep;
    group.history ||= [];
    group.dictationMisses ||= [];
    group.encodingObservations ||= [];
    group.markedReviewWords ||= [];
    group.section9Story ||= {
      passageId: "reader2-2.1-ab-p14-moth-pink-wings",
      approach: "comprehension-sos",
      updatedAt: nowIso()
    };
    const planId = "dev-sync-plan";
    let plan = group.history.find((item) => item.id === planId);
    if (!plan) {
      plan = {
        id: planId,
        source: "DeveloperDiagnostic",
        title: "Dev Sync Test Lesson",
        status: "Draft",
        savedAt: nowIso(),
        dailyKey: nowIso().slice(0, 10),
        substep: TEST.substep,
        hasStudentData: false,
        lessons: [{
          id: "dev-sync-lesson",
          substep: TEST.substep,
          title: "Dev Sync Test Lesson",
          reader: 2,
          readerLevel: "AB",
          wordlistPageNumber: 2
        }],
        section9Story: group.section9Story
      };
      group.history.push(plan);
    }
    data.selectedGroupId = TEST.groupId;
    data.lastSavedAt = nowIso();
    safeWrite(KEYS.teacher, data);
    return { data, group, plan };
  }

  function ensureSessionTestProfile(extra = {}) {
    const stored = safeRead(KEYS.session, {});
    const profile = {
      id: TEST.id,
      name: TEST.name,
      fullName: TEST.name,
      groupId: TEST.groupId,
      groupName: TEST.groupName,
      substep: TEST.substep,
      xp: 0,
      streak: 1,
      avatarId: 0,
      completedLessons: [],
      assignedTasks: [],
      rewards: [],
      ...((stored.profile && stored.profile.id === TEST.id) ? stored.profile : {}),
      ...extra,
      updatedAt: nowIso()
    };
    safeWrite(KEYS.session, { ...stored, profile });
    return profile;
  }

  function ensureHubTestStudent() {
    const hub = normalizeHub(safeRead(KEYS.hub, {}));
    hub.students[TEST.id] ||= { id: TEST.id, name: TEST.name, createdAt: nowIso(), lastPlayedAt: "" };
    hub.activeStudentId = TEST.id;
    hub.updatedAt = nowIso();
    safeWrite(KEYS.hub, hub);
    return hub;
  }

  function createTestStudent() {
    ensureTeacherTestState();
    ensureSessionTestProfile();
    ensureHubTestStudent();
    const progressKey = `${KEYS.progressPrefix}${TEST.id}`;
    if (!safeRead(progressKey, null)) {
      safeWrite(progressKey, { version: 1, studentId: TEST.id, substeps: {}, updatedAt: nowIso() });
    }
    const students = safeRead(KEYS.drillStudents, []);
    if (!students.some((student) => student.id === TEST.id || nameMatches(student.name, TEST))) {
      students.push({ id: TEST.id, name: TEST.name, groupId: TEST.groupId, groupName: TEST.groupName });
      safeWrite(KEYS.drillStudents, students);
    }
    currentKey = candidateKey(TEST.id, TEST.name);
    comparedAt = nowIso();
    render();
  }

  function runTestLessonSave() {
    const { data, group, plan } = ensureTeacherTestState();
    const time = nowIso();
    const recordId = `dev-sync-record-${Date.now()}`;
    const record = {
      id: recordId,
      type: "developerDiagnosticLesson",
      source: "DeveloperDiagnostic",
      date: time,
      displayDate: new Date(time).toLocaleDateString(),
      student: TEST.name,
      studentId: TEST.id,
      groupId: TEST.groupId,
      group: TEST.groupName,
      lessonId: plan.lessons[0].id,
      planId: plan.id,
      lessonTitle: plan.title,
      substep: TEST.substep,
      reader: 2,
      wordlistPage: 2,
      correct: 14,
      total: 15,
      seconds: 32,
      wcpm: 26,
      automaticity: true,
      wrongCount: 1,
      wrongWords: ["fang"],
      wordRecords: [
        { word: "ring", correct: true },
        { word: "pink", correct: true },
        { word: "fang", correct: false }
      ],
      recommendation: "Diagnostic save reached teacher records."
    };
    data.masterRecords ||= [];
    data.masterRecords.push(record);
    group.dictationMisses ||= [];
    group.encodingObservations ||= [];
    group.markedReviewWords ||= [];
    const dictation = {
      id: `dev-sync-dictation-${Date.now()}`,
      source: "DeveloperDiagnostic",
      date: time,
      student: TEST.name,
      substep: TEST.substep,
      category: "welded sound",
      item: "fang",
      planId: plan.id,
      lessonId: plan.lessons[0].id,
      lessonTitle: plan.title
    };
    group.dictationMisses.push(dictation);
    group.encodingObservations.push({
      ...dictation,
      id: `dev-sync-encoding-${Date.now()}`,
      section: "section8",
      note: "encoding miss"
    });
    group.markedReviewWords.push({
      word: "fang",
      source: "developer-diagnostic",
      student: TEST.name,
      substep: TEST.substep,
      date: time
    });
    plan.status = "Complete";
    plan.hasStudentData = true;
    plan.lastStudentDataAt = time;
    plan.wrapUp = {
      completedAt: time,
      note: "Developer diagnostic wrap-up.",
      attendance: { [TEST.name]: true },
      chartRecordCount: 1,
      dictationMissCount: 1,
      encodingMarkCount: 1,
      recommendation: "Diagnostic save reached wrap-up records."
    };
    data.lastSavedAt = time;
    safeWrite(KEYS.teacher, data);

    const progressKey = `${KEYS.progressPrefix}${TEST.id}`;
    const progress = safeRead(progressKey, { version: 1, studentId: TEST.id, substeps: {}, updatedAt: time });
    progress.studentId = TEST.id;
    progress.substeps ||= {};
    const sub = progress.substeps[TEST.substep] ||= {
      substepId: TEST.substep,
      completedActivities: [],
      completedSets: [],
      rewardedActivities: [],
      rewardedSets: [],
      activityScores: {},
      decoding: { correct: 0, total: 0, totalResponseMs: 0, bestResponseMs: null },
      encoding: { correct: 0, total: 0, totalResponseMs: 0, bestResponseMs: null },
      wordStats: {},
      drillRounds: [],
      lastDrillMode: "encoding",
      xpEarned: 0,
      masteryStatus: "Accuracy building",
      updatedAt: time
    };
    sub.completedActivities = [...new Set([...(sub.completedActivities || []), "dev-sync-activity"])];
    sub.completedSets = [...new Set([...(sub.completedSets || []), "dev-sync-set"])];
    sub.activityScores[`dev-sync-activity-${Date.now()}`] = {
      correct: 14,
      total: 15,
      accuracy: 0.933,
      requiredAccuracy: 0.7,
      passed: true,
      elapsedMs: 32000,
      completedAt: time
    };
    sub.decoding = {
      correct: Number(sub.decoding?.correct || 0) + 9,
      total: Number(sub.decoding?.total || 0) + 10,
      totalResponseMs: Number(sub.decoding?.totalResponseMs || 0) + 36000,
      bestResponseMs: Math.min(Number(sub.decoding?.bestResponseMs || 3600), 3600)
    };
    sub.encoding = {
      correct: Number(sub.encoding?.correct || 0) + 5,
      total: Number(sub.encoding?.total || 0) + 5,
      totalResponseMs: Number(sub.encoding?.totalResponseMs || 0) + 21000,
      bestResponseMs: Math.min(Number(sub.encoding?.bestResponseMs || 4200), 4200)
    };
    sub.wordStats ||= {};
    sub.wordStats.fang = { correct: 1, misses: 1, streak: 0, attempts: 2, mastered: false, lastSeenAt: time, lastResponseMs: 4200 };
    sub.drillRounds = [...(sub.drillRounds || []), {
      id: `dev-sync-drill-${Date.now()}`,
      mode: "encoding",
      level: 2,
      correct: 5,
      total: 5,
      accuracy: 1,
      elapsedMs: 21000,
      completedAt: time
    }].slice(-30);
    sub.xpEarned = Number(sub.xpEarned || 0) + 35;
    sub.masteryStatus = "Ready for challenge";
    sub.updatedAt = time;
    progress.updatedAt = time;
    safeWrite(progressKey, progress);

    const profile = ensureSessionTestProfile({
      xp: Number(safeRead(KEYS.session, {})?.profile?.xp || 0) + 35,
      completedLessons: ["dev-sync-lesson", "2.1-sounds-1"],
      lastActivityAt: time,
      lessonProgress: { version: progress.version, substeps: progress.substeps, updatedAt: time }
    });
    const outbox = safeRead(KEYS.outbox, []);
    outbox.push({
      event: {
        id: `dev-sync-activity-${Date.now()}`,
        source: "DeveloperDiagnostic",
        type: "developerDiagnosticLesson",
        title: "Dev Sync Test Lesson",
        studentId: TEST.id,
        studentName: TEST.name,
        groupId: TEST.groupId,
        groupName: TEST.groupName,
        substep: TEST.substep,
        date: time,
        xp: 35,
        completed: true,
        queuedAt: time
      }
    });
    safeWrite(KEYS.outbox, outbox.slice(-100));
    const sessions = safeRead(KEYS.drillSessions, []);
    sessions.push({
      id: `dev-sync-session-${Date.now()}`,
      source: "DeveloperDiagnostic",
      lesson: "Dev Sync Standalone Drill",
      date: time,
      elapsed: 32,
      xp: 35,
      perfect: 13,
      totalCards: 14,
      studentId: profile.id,
      studentName: profile.name,
      groupId: TEST.groupId,
      groupName: TEST.groupName,
      cards: []
    });
    safeWrite(KEYS.drillSessions, sessions.slice(-100));
    comparedAt = time;
    currentKey = candidateKey(TEST.id, TEST.name);
    render();
  }

  function runTestGameSave() {
    ensureTeacherTestState();
    const time = nowIso();
    const points = 120;
    const hub = ensureHubTestStudent();
    hub.games[TEST.id] ||= {};
    hub.games[TEST.id].wordBuilder ||= { points: 0, sessions: 0, lastPlayedAt: "" };
    hub.games[TEST.id].wordBuilder.points = Number(hub.games[TEST.id].wordBuilder.points || 0) + points;
    hub.games[TEST.id].wordBuilder.sessions = Number(hub.games[TEST.id].wordBuilder.sessions || 0) + 1;
    hub.games[TEST.id].wordBuilder.lastPlayedAt = time;
    hub.students[TEST.id].lastPlayedAt = time;
    hub.events.push({
      id: `dev-sync-game-${Date.now()}`,
      source: "DeveloperDiagnostic",
      studentId: TEST.id,
      studentName: TEST.name,
      gameId: "wordBuilder",
      points,
      detail: { word: "ring", build: true, diagnostic: true },
      createdAt: time
    });
    hub.events = hub.events.slice(-3000);
    hub.updatedAt = time;
    safeWrite(KEYS.hub, hub);

    const wb = safeRead(KEYS.wordBuilder, { playerName: "Player", activePlayerId: "", players: {} });
    wb.players ||= {};
    wb.activePlayerId = TEST.id;
    wb.playerName = TEST.name;
    wb.players[TEST.id] ||= { totalPoints: 0, streak: 0, bestStreak: 0, lastPoints: 0, recentWords: [] };
    wb.players[TEST.id].name = TEST.name;
    wb.players[TEST.id].totalPoints = Number(wb.players[TEST.id].totalPoints || 0) + points;
    wb.players[TEST.id].lastPoints = points;
    wb.players[TEST.id].streak = Number(wb.players[TEST.id].streak || 0) + 1;
    wb.players[TEST.id].bestStreak = Math.max(Number(wb.players[TEST.id].bestStreak || 0), wb.players[TEST.id].streak);
    wb.players[TEST.id].recentWords = [{ word: "ring", points, date: time }, ...(wb.players[TEST.id].recentWords || [])].slice(0, 12);
    wb.updatedAt = time;
    safeWrite(KEYS.wordBuilder, wb);

    const teacher = normalizeTeacherState(safeRead(KEYS.teacher, {}));
    const group = teacher.groups.find((item) => item.id === TEST.groupId);
    const plan = group?.history?.find((item) => item.id === "dev-sync-plan");
    teacher.masterRecords ||= [];
    teacher.masterRecords.push({
      id: `dev-sync-game-record-${Date.now()}`,
      type: "gameAttempt",
      source: "DeveloperDiagnostic",
      date: time,
      displayDate: new Date(time).toLocaleDateString(),
      student: TEST.name,
      studentId: TEST.id,
      groupId: TEST.groupId,
      group: TEST.groupName,
      lessonId: plan?.lessons?.[0]?.id || "dev-sync-lesson",
      planId: plan?.id || "dev-sync-plan",
      lessonTitle: "Dev Sync Game Attempt",
      substep: TEST.substep,
      gameId: "wordBuilder",
      gamePoints: points,
      correct: 15,
      total: 15,
      seconds: 30,
      wcpm: 30,
      automaticity: true,
      wrongCount: 0,
      wrongWords: [],
      recommendation: "Diagnostic game save reached hub and teacher records."
    });
    teacher.lastSavedAt = time;
    safeWrite(KEYS.teacher, teacher);

    const stored = safeRead(KEYS.session, {});
    const currentProfile = stored.profile?.id === TEST.id ? stored.profile : {};
    ensureSessionTestProfile({
      xp: Number(currentProfile.xp || 0) + points,
      gamePoints: Number(currentProfile.gamePoints || 0) + points,
      lastGameAt: time,
      lastActivityAt: time
    });
    comparedAt = time;
    currentKey = candidateKey(TEST.id, TEST.name);
    render();
  }

  function clearTestData() {
    const teacher = normalizeTeacherState(safeRead(KEYS.teacher, {}));
    teacher.rosterStudents = teacher.rosterStudents.filter((student) => normalizeName(student.name || student) !== normalizeName(TEST.name));
    teacher.masterRecords = teacher.masterRecords.filter((record) => !(record.source === "DeveloperDiagnostic" || record.id?.startsWith("dev-sync-") || recordMatchesStudent(record, TEST)));
    teacher.groups = teacher.groups.filter((group) => group.id !== TEST.groupId);
    if (teacher.selectedGroupId === TEST.groupId) teacher.selectedGroupId = teacher.groups[0]?.id || "";
    teacher.lastSavedAt = nowIso();
    safeWrite(KEYS.teacher, teacher);

    const stored = safeRead(KEYS.session, {});
    if (stored.profile?.id === TEST.id || nameMatches(stored.profile?.name, TEST)) localStorage.removeItem(KEYS.session);
    localStorage.removeItem(`${KEYS.progressPrefix}${TEST.id}`);

    const hub = normalizeHub(safeRead(KEYS.hub, {}));
    delete hub.students[TEST.id];
    delete hub.games[TEST.id];
    hub.events = hub.events.filter((event) => !(event.source === "DeveloperDiagnostic" || event.studentId === TEST.id || nameMatches(event.studentName, TEST)));
    if (hub.activeStudentId === TEST.id) hub.activeStudentId = "";
    hub.updatedAt = nowIso();
    safeWrite(KEYS.hub, hub);

    const students = safeRead(KEYS.drillStudents, []).filter((student) => !(student.id === TEST.id || nameMatches(student.name, TEST)));
    safeWrite(KEYS.drillStudents, students);
    const sessions = safeRead(KEYS.drillSessions, []).filter((session) => !(session.source === "DeveloperDiagnostic" || session.studentId === TEST.id || nameMatches(session.studentName, TEST)));
    safeWrite(KEYS.drillSessions, sessions);
    const outbox = safeRead(KEYS.outbox, []).filter((item) => {
      const event = item.event || {};
      return !(event.source === "DeveloperDiagnostic" || event.studentId === TEST.id || nameMatches(event.studentName, TEST));
    });
    safeWrite(KEYS.outbox, outbox);

    const wb = safeRead(KEYS.wordBuilder, null);
    if (wb?.players) {
      delete wb.players[TEST.id];
      delete wb.players[slugify(TEST.name)];
      if (wb.activePlayerId === TEST.id || wb.activePlayerId === slugify(TEST.name)) wb.activePlayerId = "";
      if (nameMatches(wb.playerName, TEST)) wb.playerName = "Player";
      wb.updatedAt = nowIso();
      safeWrite(KEYS.wordBuilder, wb);
    }
    const cursive = safeRead(KEYS.cursive, null);
    if (cursive?.players) {
      Object.keys(cursive.players).forEach((id) => {
        if (nameMatches(cursive.players[id]?.name, TEST)) delete cursive.players[id];
      });
      if (!cursive.players[cursive.activePlayerId]) cursive.activePlayerId = Object.keys(cursive.players)[0] || "";
      cursive.updatedAt = nowIso();
      safeWrite(KEYS.cursive, cursive);
    }
    const ss = safeRead(KEYS.syllableSlice, null);
    if (ss && nameMatches(ss.playerName, TEST)) localStorage.removeItem(KEYS.syllableSlice);
    localStorage.removeItem("teachToday.devDiagnostic.selectedStudent");
    currentKey = "";
    comparedAt = nowIso();
    render();
  }

  function compareViews() {
    comparedAt = nowIso();
    render();
  }

  function bindEvents() {
    dom.lock.addEventListener("click", () => {
      access?.lock?.();
      render();
    });
    dom.select.addEventListener("change", () => {
      currentKey = dom.select.value || "";
      comparedAt = "";
      render();
    });
    dom.search.addEventListener("input", () => {
      searchTerm = dom.search.value.trim().toLowerCase();
      render();
    });
    dom.createTest.addEventListener("click", createTestStudent);
    dom.runLesson.addEventListener("click", runTestLessonSave);
    dom.runGame.addEventListener("click", runTestGameSave);
    dom.compare.addEventListener("click", compareViews);
    dom.reload.addEventListener("click", render);
    dom.clearTest.addEventListener("click", clearTestData);
    dom.toggleRaw.addEventListener("click", () => {
      rawVisible = !rawVisible;
      render();
    });
  }

  bindEvents();
  render();
})();
