let ttLesson = null;
let ttChartCard = null;
let ttCardDeck = [];
let ttCardIndex = 0;
let ttCardMode = "words";
let ttSection2Word = "";
let ttLaserEnabled = false;
let ttLaserDrawing = false;
let ttLaserLastPoint = null;
let ttLaserFadeId = null;
let ttNotesEnabled = false;
let ttNotesDrawing = false;
let ttNotesLastPoint = null;
let ttWhiteboardMode = "move";
let ttWhiteboardDrawing = false;
let ttWhiteboardLastPoint = null;
let ttWhiteboardDrag = null;
let ttWhiteboardTileId = 0;
let ttRestoringScroll = false;
let ttSection1View = "photo";
let ttSection1PhotoMode = "full";
let ttSection1LastTap = { time: 0, x: 0, y: 0 };
let ttSection1Pan = null;

function ttById(id) {
  return document.getElementById(id);
}

function ttActiveGroup() {
  return activeGroup();
}

function ttBuildLesson() {
  const group = ttActiveGroup();
  const skill = activeStep(group);
  ttLesson = createLesson(group, skill, 0, 1);
  return ttLesson;
}

function ttClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function ttDraftKey(group = ttActiveGroup()) {
  return group?.id || "default";
}

function ttLoadDraftLesson() {
  ttNormalizeTeachTodayState();
  const draft = appState.lessonDrafts?.[ttDraftKey()];
  if (!draft) return null;
  ttLesson = ttClone(draft);
  delete ttLesson.savedPlanId;
  return ttLesson;
}

function ttSaveDraftLesson(options = {}) {
  if (!ttLesson) return null;
  ttNormalizeTeachTodayState();
  const group = ttActiveGroup();
  if (ttLesson.savedPlanId) ttForkSavedLessonDraft();
  ttLesson.draftId ||= `teach-draft-${Date.now()}`;
  ttLesson.draftSavedAt = new Date().toISOString();
  appState.lessonDrafts[ttDraftKey(group)] = ttClone(ttLesson);
  saveState();
  if (options.status !== false) ttSetDraftSaveStatus(group, ttLesson);
  return ttLesson;
}

function ttForkSavedLessonDraft() {
  if (!ttLesson?.savedPlanId) return ttLesson;
  const sourcePlan = ttCurrentPlan();
  ttLesson = ttClone(ttLesson);
  ttLesson.forkedFromPlanId = ttLesson.savedPlanId;
  ttLesson.forkedFromLessonTitle = sourcePlan?.title || "";
  ttLesson.id = `teach-draft-lesson-${Date.now()}`;
  ttLesson.draftId = `teach-draft-${Date.now()}`;
  ttLesson.draftCreatedAt = new Date().toISOString();
  delete ttLesson.savedPlanId;
  delete ttLesson.lessonSequence;
  return ttLesson;
}

function ttRender() {
  ttNormalizeTeachTodayState();
  const group = ttActiveGroup();
  const lesson = ttLesson || ttBuildLesson();
  const skill = scopeMap.find((item) => item.id === lesson.substep) || activeStep(group);
  ttEnsureSection4PageIntegrity(lesson, skill);
  const plan = ttCurrentPlan();

  ttById("ttTitle").textContent = `${group.name} - ${lesson.substep}`;
  ttById("ttLessonFile").textContent = plan?.title || ttLessonFileName(group, lesson);
  if (!plan) ttSetDraftSaveStatus(group, lesson);
  ttById("ttSkill").textContent = `${skill.id} - ${skill.title}`;
  ttFillGroups(group.id);
  ttFillLessonControls(group);
  if (ttById("ttSubstep")) ttById("ttSubstep").value = lesson.substep;
  if (ttById("ttReaderLevel")) ttById("ttReaderLevel").value = lesson.readerLevel || group.readerLevel || "AB";
  ttFillStudents(group);
  ttFillFrontStudents(group);
  ttRenderGroupSnapshot(group);
  ttRenderLessonTabs();
  ttRenderAttendancePanel(group);
  ttRenderSavedLessons(group);
  ttRenderDataCenter();
  ttFillOverview(group, skill);
  ttFillSectionRefs(lesson);
  ttFillSounds(skill, lesson);
  ttFillWordRow(ttById("ttReviewWords"), lesson.sectionTwoReviewWords || [], {
    onSelect: (word) => ttShowSection2Word(word, skill.id),
    onReplace: (word) => ttReplaceSection2Word("review", word)
  });
  ttFillWordRow(ttById("ttCurrentWords"), lesson.sectionTwoCurrentWords || [], {
    onSelect: (word) => ttShowSection2Word(word, skill.id),
    onReplace: (word) => ttReplaceSection2Word("current", word)
  });
  ttFillSection2ReplacementTools(lesson, skill);
  ttShowSection2Word(ttSection2Word || (lesson.sectionTwoCurrentWords || [])[0] || (lesson.sectionTwoReviewWords || [])[0] || "", skill.id);
  ttFillSection3Cards(lesson);
  ttFillWordRow(ttById("ttHfw"), lesson.highFrequencyWords || []);
  ttFillSentences(lesson.readerSentences || []);
  ttFillPart7(lesson, skill);
  ttFillReverse(skill, lesson);
  ttFillDictation(ttActiveDictationPlan(lesson, skill));
  ttById("ttPassage").textContent = lesson.passage || `Use Reader ${lesson.reader}, p. ${lesson.passagePageNumber || "--"} for Section #9.`;
  ttById("ttWrap").textContent = "Ask one comprehension question, note the hardest word, and decide whether the next lesson should repeat, warm up, or advance.";
  ttSetupChart(lesson);
}

function ttFillSectionRefs(lesson) {
  const wordlist = `Reader ${lesson.reader}, p. ${lesson.wordlistPageNumber || "--"} - ${lesson.readerLevel || "AB"}`;
  const sentence = lesson.sentenceMeta
    ? lesson.sentenceMeta.replace("Reader ", "Reader ")
    : `Reader ${lesson.reader}, p. -- - ${lesson.readerLevel || "AB"}`;
  const passage = `Reader ${lesson.reader}, p. ${lesson.passagePageNumber || "--"} - ${lesson.passageLevel || lesson.readerLevel || "AB"}`;
  const refs = {
    ttSection1Ref: lesson.substep,
    ttSection2Ref: wordlist,
    ttSection3Ref: `${lesson.substep} cards`,
    ttSection4Ref: wordlist,
    ttSection5Ref: sentence,
    ttSection6Ref: `${lesson.substep} reverse drill`,
    ttSection7Ref: `${lesson.substep} spelling`,
    ttSection8Ref: `Dictation Book ${lesson.substep}`,
    ttSection9Ref: passage
  };
  Object.entries(refs).forEach(([id, text]) => {
    const node = ttById(id);
    if (node) node.textContent = text;
  });
}

function ttRenderDataCenter() {
  const lastSave = appState.lastSavedAt ? new Date(appState.lastSavedAt) : null;
  const lastBackup = localStorage.getItem("teachToday.lastBackupAt");
  const lastCloudSync = localStorage.getItem("teachToday.lastCloudSyncAt");
  const cloudStatus = localStorage.getItem("teachToday.cloudSyncStatus") || "Choose a local backup folder to save a file on this Mac.";
  const cloudFolder = localStorage.getItem("teachToday.cloudSyncFolderName");
  const lastFirebaseSync = localStorage.getItem("teachToday.lastFirebaseSyncAt");
  const firebaseStatus = localStorage.getItem("teachToday.firebaseSyncStatus") || "Firebase internet sync is ready.";
  const records = appState.masterRecords?.length || 0;
  const lessons = (appState.groups || []).reduce((sum, group) => sum + (group.history?.length || 0), 0);
  const dictation = (appState.groups || []).reduce((sum, group) => sum + (group.dictationMisses?.length || 0), 0);
  const encoding = (appState.groups || []).reduce((sum, group) => sum + (group.encodingObservations?.length || 0), 0);
  const lastSaveEl = ttById("ttLastInternalSave");
  const lastBackupEl = ttById("ttLastBackup");
  const lastCloudSyncEl = ttById("ttLastCloudSync");
  const lastFirebaseSyncEl = ttById("ttLastFirebaseSync");
  const countsEl = ttById("ttDataCounts");
  const cloudStatusEl = ttById("ttCloudSyncStatus");
  const firebaseStatusEl = ttById("ttFirebaseSyncStatus");
  if (lastSaveEl) lastSaveEl.textContent = lastSave ? formatDateTime(lastSave) : "Not saved yet";
  if (lastBackupEl) lastBackupEl.textContent = lastBackup ? formatDateTime(new Date(lastBackup)) : "No backup yet";
  if (lastCloudSyncEl) lastCloudSyncEl.textContent = lastCloudSync ? formatDateTime(new Date(lastCloudSync)) : "Not connected";
  if (lastFirebaseSyncEl) lastFirebaseSyncEl.textContent = lastFirebaseSync ? formatDateTime(new Date(lastFirebaseSync)) : "Not synced";
  if (countsEl) countsEl.textContent = `${records} / ${lessons}${dictation || encoding ? ` / ${dictation + encoding}` : ""}`;
  if (cloudStatusEl) cloudStatusEl.textContent = `${cloudFolder ? `${cloudFolder}: ` : ""}${cloudStatus} Local browser storage is still saved first.`;
  if (firebaseStatusEl) firebaseStatusEl.textContent = `${firebaseStatus} Local browser storage is still saved first.`;
}

function formatDateTime(date) {
  return `${date.toLocaleDateString(undefined, { month: "short", day: "numeric" })} ${date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}`;
}

function ttNormalizeTeachTodayState() {
  appState.openLessonTabs ||= [];
  appState.lessonScrollPositions ||= {};
  appState.lessonDrafts ||= {};
  appState.attendanceRecords ||= {};
  appState.rosterStudents ||= [];
  const existingRosterNames = new Set(appState.rosterStudents.map((student) => String(student.name || student).toLowerCase()));
  appState.groups?.forEach((group) => {
    (group.students || []).forEach((name) => {
      if (!existingRosterNames.has(String(name).toLowerCase())) {
        appState.rosterStudents.push({ name, school: group.school || group.name || "" });
        existingRosterNames.add(String(name).toLowerCase());
      }
    });
  });
  appState.groups?.forEach((group) => {
    group.lessonSerial ||= 0;
    group.history ||= [];
  });
  ttBackfillLessonLinks();
}

function ttRecordTime(record) {
  return new Date(record?.date || record?.displayDate || 0).getTime() || 0;
}

function ttPlanTime(plan) {
  return new Date(plan?.savedAt || plan?.created || 0).getTime() || 0;
}

function ttFindBestPlanForRecord(group, record) {
  const plans = (group.history || []).filter((plan) => plan.source === "TeachToday" && plan.lessons?.[0]);
  if (!plans.length) return null;
  const recordDay = dateKey(record.date || record.displayDate);
  const recordTime = ttRecordTime(record);
  const scored = plans.map((plan) => {
    const lesson = plan.lessons[0];
    let score = 0;
    if (record.lessonId && lesson.id === record.lessonId) score += 1000;
    if (record.planId && plan.id === record.planId) score += 1000;
    if (recordDay && (plan.dailyKey === recordDay || dateKey(plan.savedAt || plan.created) === recordDay)) score += 120;
    if (record.substep && lesson.substep === record.substep) score += 80;
    if (record.wordlistPage && String(lesson.wordlistPageNumber || "") === String(record.wordlistPage)) score += 60;
    if (record.reader && String(lesson.reader || "") === String(record.reader)) score += 25;
    const distance = Math.abs(ttPlanTime(plan) - recordTime);
    score -= Math.min(distance / 60000, 240);
    return { plan, score, distance };
  }).sort((a, b) => b.score - a.score || a.distance - b.distance);
  return scored[0]?.score > 0 ? scored[0].plan : null;
}

function ttApplyPlanLinkToRecord(record, plan) {
  if (!record || !plan?.lessons?.[0]) return false;
  const lesson = plan.lessons[0];
  let changed = false;
  const values = {
    lessonId: lesson.id || "",
    planId: plan.id || "",
    lessonTitle: plan.title || "",
    lessonSavedAt: plan.savedAt || ""
  };
  Object.entries(values).forEach(([key, value]) => {
    if (value && record[key] !== value) {
      record[key] = value;
      changed = true;
    }
  });
  if (!plan.hasStudentData || plan.status !== "Taught") {
    plan.hasStudentData = true;
    plan.status = "Taught";
    plan.lastStudentDataAt ||= record.date || new Date().toISOString();
    changed = true;
  }
  return changed;
}

function ttBackfillLessonLinks() {
  if (appState.lessonLinkBackfillVersion >= 1) return;
  let changed = false;
  (appState.masterRecords || []).forEach((record) => {
    if (record.planId && record.lessonTitle) return;
    const group = (appState.groups || []).find((item) => item.id === record.groupId || item.name === record.group);
    const plan = group ? ttFindBestPlanForRecord(group, record) : null;
    if (plan) changed = ttApplyPlanLinkToRecord(record, plan) || changed;
  });
  (appState.groups || []).forEach((group) => {
    ["dictationMisses", "encodingObservations"].forEach((key) => {
      (group[key] || []).forEach((record) => {
        if (record.planId && record.lessonTitle) return;
        const plan = ttFindBestPlanForRecord(group, record);
        if (plan) changed = ttApplyPlanLinkToRecord(record, plan) || changed;
      });
    });
  });
  appState.lessonLinkBackfillVersion = 1;
  if (changed) {
    appState.lastSavedAt = new Date().toISOString();
    localStorage.setItem("dyslexiaInstructionEngine.v2", JSON.stringify(appState));
    if (typeof window.teachTodayQueueCloudSync === "function") window.teachTodayQueueCloudSync();
  }
}

function ttActivePlanId() {
  return ttLesson?.savedPlanId || "";
}

function ttRememberScroll(planId = ttActivePlanId()) {
  if (!planId || ttRestoringScroll) return;
  ttNormalizeTeachTodayState();
  appState.lessonScrollPositions[planId] = Math.max(0, Math.round(window.scrollY || document.documentElement.scrollTop || 0));
  saveState();
}

function ttRestoreScroll(planId = ttActivePlanId()) {
  if (!planId) return;
  const top = appState.lessonScrollPositions?.[planId];
  if (typeof top !== "number") return;
  ttRestoringScroll = true;
  requestAnimationFrame(() => {
    window.scrollTo({ top, behavior: "auto" });
    setTimeout(() => {
      ttRestoringScroll = false;
    }, 60);
  });
}

function ttLessonDate(date = new Date()) {
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function ttLessonTime(date = new Date()) {
  return date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

function ttCompactDate(date = new Date()) {
  return `${date.getMonth() + 1}-${date.getDate()}`;
}

function ttWordlistShortLabel(lesson) {
  const meta = lesson?.wordlistMeta || "";
  const page = lesson?.wordlistPageNumber || "--";
  const match = meta.match(/Page\s+(\d+)\s+of\s+(\d+)\s+([A-Z]+)\s+wordlist/i);
  return match ? `p. ${page} (${match[1]} of ${match[2]} ${match[3]})` : `p. ${page}`;
}

function ttLessonFileName(group, lesson, date = new Date()) {
  return `${lesson.substep} - charting page ${ttWordlistShortLabel(lesson)} - ${ttLessonDate(date)} ${ttLessonTime(date)} - ${group.name}`;
}

function ttLessonTabLabel(plan, group = ttActiveGroup()) {
  const lesson = plan?.lessons?.[0] || ttLesson;
  const date = plan?.savedAt ? new Date(plan.savedAt) : new Date();
  const shortGroup = (group.name || "Group").replace(/\s+Group$/i, "");
  return `${shortGroup} ${lesson?.substep || group.substep} ${ttCompactDate(date)}`;
}

function ttCurrentPlan() {
  const group = ttActiveGroup();
  return (group.history || []).find((plan) => plan.id === ttLesson?.savedPlanId);
}

function ttPlanDayKey(date = new Date()) {
  return dateKey(date);
}

function ttDailyPlanFor(group, date = new Date()) {
  const key = ttPlanDayKey(date);
  return (group.history || []).slice().reverse().find((plan) =>
    plan.source === "TeachToday"
    && (plan.dailyKey === key || dateKey(plan.savedAt || plan.created) === key)
  );
}

function ttAddLessonTab(planId) {
  if (!planId) return;
  ttNormalizeTeachTodayState();
  appState.openLessonTabs = appState.openLessonTabs.filter((id) => id !== planId);
  appState.openLessonTabs.unshift(planId);
  appState.openLessonTabs = appState.openLessonTabs.slice(0, 8);
}

function ttRenderLessonTabs() {
  const container = ttById("ttLessonTabs");
  if (!container) return;
  ttNormalizeTeachTodayState();
  const allPlans = [];
  appState.groups.forEach((group) => {
    (group.history || []).forEach((plan) => allPlans.push({ group, plan }));
  });
  const tabPlans = appState.openLessonTabs
    .map((id) => allPlans.find((item) => item.plan.id === id))
    .filter(Boolean);
  if (!tabPlans.length && ttLesson?.savedPlanId) {
    const plan = ttCurrentPlan();
    if (plan) tabPlans.push({ group: ttActiveGroup(), plan });
  }
  container.innerHTML = "";
  tabPlans.forEach(({ group, plan }) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `lesson-tab${plan.id === ttLesson?.savedPlanId ? " active" : ""}`;
    button.innerHTML = `<span>${escapeHtml(plan.tabLabel || ttLessonTabLabel(plan, group))}</span><span class="lesson-tab-close" aria-hidden="true">×</span>`;
    button.title = plan.title || button.textContent;
    button.addEventListener("click", (event) => {
      if (event.target.closest(".lesson-tab-close")) {
        event.stopPropagation();
        appState.openLessonTabs = (appState.openLessonTabs || []).filter((id) => id !== plan.id);
        saveState();
        ttRenderLessonTabs();
        return;
      }
      ttOpenPlanInApp(plan.id);
    });
    container.appendChild(button);
  });
}

function ttFillGroups(activeId) {
  const select = ttById("ttGroup");
  select.innerHTML = "";
  appGroups().forEach((group) => {
    const option = document.createElement("option");
    option.value = group.id;
    option.textContent = group.name;
    option.selected = group.id === activeId;
    select.appendChild(option);
  });
}

function appGroups() {
  const group = activeGroup();
  const stored = JSON.parse(localStorage.getItem("dyslexiaInstructionEngine.v2") || "{}");
  return stored.groups?.length ? stored.groups : [group];
}

function ttFillLessonControls(group) {
  const substep = ttById("ttSubstep");
  if (substep && !substep.options.length) {
    scopeMap.forEach((skill) => {
      const option = document.createElement("option");
      option.value = skill.id;
      option.textContent = `${skill.id} - ${skill.title}`;
      substep.appendChild(option);
    });
  }
  if (substep) substep.value = group.substep;
  const level = ttById("ttReaderLevel");
  if (level) level.value = group.readerLevel || "AB";
}

function ttFillStudents(group) {
  const select = ttById("ttStudent");
  select.innerHTML = "";
  group.students.forEach((student) => {
    const option = document.createElement("option");
    option.value = student;
    option.textContent = student;
    option.selected = student === group.activeStudent;
    select.appendChild(option);
  });
}

function ttFillFrontStudents(group) {
  const container = ttById("ttFrontStudents");
  container.innerHTML = "";
  group.students.forEach((student) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `front-student${student === group.activeStudent ? " active" : ""}`;
    const status = performanceStatus(recordsForStudent(student));
    button.innerHTML = `<span class="status-dot ${status.color}"></span>${escapeHtml(student)}`;
    button.addEventListener("click", () => ttSelectStudent(student));
    container.appendChild(button);
  });
}

function ttAttendanceKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function ttTodaysAttendance(group = ttActiveGroup()) {
  ttNormalizeTeachTodayState();
  const key = ttAttendanceKey();
  appState.attendanceRecords[group.id] ||= {};
  appState.attendanceRecords[group.id][key] ||= {};
  return appState.attendanceRecords[group.id][key];
}

function ttRenderAttendancePanel(group) {
  const panel = ttById("ttAttendancePanel");
  if (!panel) return;
  const attendance = ttTodaysAttendance(group);
  panel.innerHTML = group.students.map((student) => {
    const present = attendance[student] !== false;
    return `<button type="button" class="attendance-chip ${present ? "present" : ""}" data-student="${escapeHtml(student)}">${present ? "Present" : "Absent"} - ${escapeHtml(student)}</button>`;
  }).join("");
  panel.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () => {
      const student = button.dataset.student;
      attendance[student] = attendance[student] === false;
      saveState();
      ttRenderAttendancePanel(group);
    });
  });
}

function ttAddStudentFromRoster() {
  ttToggleRosterPicker(true);
}

function ttRosterStudents() {
  ttNormalizeTeachTodayState();
  return (appState.rosterStudents || [])
    .map((student) => typeof student === "string" ? { name: student } : student)
    .filter((student) => student.name)
    .sort((a, b) => (a.school || "").localeCompare(b.school || "") || a.name.localeCompare(b.name));
}

function ttToggleRosterPicker(force = null) {
  const panel = ttById("ttRosterPicker");
  if (!panel) return;
  panel.hidden = force === null ? !panel.hidden : !force;
  if (!panel.hidden) ttRenderRosterPicker();
}

function ttRenderRosterPicker() {
  const group = ttActiveGroup();
  const select = ttById("ttRosterSelect");
  if (!select) return;
  const roster = ttRosterStudents().filter((student) => !group.students.includes(student.name));
  select.innerHTML = roster.map((student) => {
    const details = [student.gradeLevel ? `Gr ${student.gradeLevel}` : "", student.school ? shortSchoolName(student.school) : ""].filter(Boolean).join(" - ");
    const label = details ? `${student.name} (${details})` : student.name;
    return `<option value="${escapeHtml(student.name)}">${escapeHtml(label)}</option>`;
  }).join("");
  select.disabled = !roster.length;
  ttById("ttRosterAddSelected").disabled = !roster.length;
}

function ttAddSelectedRosterStudent() {
  const name = ttById("ttRosterSelect")?.value || "";
  ttAddStudentToActiveGroup(name);
}

function ttAddNewRosterStudent() {
  const nameInput = ttById("ttNewRosterStudent");
  const gradeInput = ttById("ttNewRosterGrade");
  const name = nameInput?.value.trim() || "";
  if (!name) return;
  const group = ttActiveGroup();
  appState.rosterStudents ||= [];
  if (!appState.rosterStudents.some((student) => String(student.name || student).toLowerCase() === name.toLowerCase())) {
    appState.rosterStudents.push({
      name,
      fullName: name,
      gradeLevel: gradeInput?.value.trim() || "",
      school: group.school || ""
    });
  }
  if (nameInput) nameInput.value = "";
  if (gradeInput) gradeInput.value = "";
  ttAddStudentToActiveGroup(name);
}

function ttAddStudentToActiveGroup(name) {
  const group = ttActiveGroup();
  const cleanName = String(name || "").trim();
  if (!cleanName) return;
  if (!group.students.includes(cleanName)) group.students.push(cleanName);
  group.activeStudent = cleanName;
  ttTodaysAttendance(group)[cleanName] = true;
  saveState();
  ttToggleRosterPicker(false);
  ttRender();
}

function shortSchoolName(school) {
  if (/cochran/i.test(school)) return "Cochran";
  if (/allen/i.test(school)) return "Allen";
  return school;
}

function ttRenderGroupSnapshot(group) {
  const panel = ttById("ttGroupSnapshot");
  if (!panel) return;
  const chartRecords = (appState.masterRecords || [])
    .filter((record) => record.groupId === group.id || record.group === group.name)
    .sort((a, b) => new Date(b.date || b.displayDate || 0) - new Date(a.date || a.displayDate || 0));
  const dictationRecords = (group.dictationMisses || [])
    .concat((group.encodingObservations || []).filter((record) => record.section === "section8"))
    .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
  const latestTime = Math.max(
    ...chartRecords.map((record) => new Date(record.date || record.displayDate || 0).getTime()).filter(Number.isFinite),
    ...dictationRecords.map((record) => new Date(record.date || 0).getTime()).filter(Number.isFinite),
    0
  );

  if (!latestTime) {
    panel.innerHTML = `
      <div class="snapshot-head">
        <div><strong>Last Class Snapshot</strong><span>No saved Section 4 or Section 8 data yet.</span></div>
      </div>
      <p class="snapshot-empty">After you save charting or dictation data, this panel will show what to watch before today's lesson.</p>
    `;
    return;
  }

  const latestKey = dateKey(new Date(latestTime));
  const lastChart = chartRecords.filter((record) => dateKey(record.date || record.displayDate) === latestKey);
  const lastDictation = dictationRecords.filter((record) => dateKey(record.date) === latestKey);
  const byStudent = new Map();
  group.students.forEach((student) => byStudent.set(student, { student, chart: [], dictation: [] }));
  lastChart.forEach((record) => {
    const bucket = byStudent.get(record.student) || { student: record.student, chart: [], dictation: [] };
    bucket.chart.push(record);
    byStudent.set(record.student, bucket);
  });
  lastDictation.forEach((record) => {
    const bucket = byStudent.get(record.student) || { student: record.student, chart: [], dictation: [] };
    bucket.dictation.push(record);
    byStudent.set(record.student, bucket);
  });

  const cards = [...byStudent.values()]
    .filter((item) => item.chart.length || item.dictation.length)
    .map((item) => ttSnapshotStudentCard(item))
    .join("");
  panel.innerHTML = `
    <div class="snapshot-head">
      <div><strong>Last Class Snapshot</strong><span>${formatSnapshotDate(latestTime)} - Section 4 charting and Section 8 dictation</span></div>
      <small>${lastChart.length} charting record${lastChart.length === 1 ? "" : "s"} / ${lastDictation.length} dictation mark${lastDictation.length === 1 ? "" : "s"}</small>
    </div>
    <div class="snapshot-grid">${cards || "<p class=\"snapshot-empty\">No student details saved for the last class date.</p>"}</div>
  `;
}

function ttSnapshotStudentCard(summary) {
  const chart = summary.chart.slice(-2).map((record) => {
    const status = record.automaticity ? "Auto" : record.accuracy ? "Acc" : "Strug";
    const misses = ttChartMissSummary(record);
    return `<p><strong>${escapeHtml(record.correct ?? "--")}/${escapeHtml(record.total || 15)} ${status}</strong> <span>${escapeHtml(record.seconds || "--")} sec, ${escapeHtml(record.wcpm || wcpmForRecord(record) || "--")} wcpm, p.${escapeHtml(record.wordlistPage || "--")}</span>${misses}</p>`;
  }).join("");
  const dictation = ttDictationSummary(summary.dictation);
  return `<article class="snapshot-student">
    <h3>${escapeHtml(summary.student)}</h3>
    ${chart || "<p><span>No charting saved.</span></p>"}
    ${dictation ? `<div class="snapshot-dictation"><b>Dictation:</b> ${dictation}</div>` : "<div class=\"snapshot-dictation muted\"><b>Dictation:</b> no Section 8 marks.</div>"}
  </article>`;
}

function ttChartMissSummary(record) {
  const half = record.chartHalf || "";
  const misses = (record.wordRecords || [])
    .filter((item) => item.section === half && item.correct === false)
    .map((item) => item.said ? `${item.word} -> ${item.said}` : item.word)
    .filter(Boolean);
  const fallback = (record.wrongWords || []).filter(Boolean);
  const items = misses.length ? misses : fallback;
  return items.length ? `<em>Missed: ${escapeHtml(items.slice(0, 4).join(", "))}${items.length > 4 ? "..." : ""}</em>` : "";
}

function ttDictationSummary(records) {
  const seen = new Set();
  const items = [];
  records.forEach((record) => {
    const label = [record.category, record.item || record.note].filter(Boolean).join(": ");
    if (!label || seen.has(label)) return;
    seen.add(label);
    items.push(label);
  });
  return items.slice(0, 5).map(escapeHtml).join(", ");
}

function dateKey(value) {
  const date = value instanceof Date ? value : new Date(value || 0);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function formatSnapshotDate(value) {
  const date = new Date(value);
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function ttFillOverview(group, skill) {
  const level = group.readerLevel || "AB";
  const wordlist = pageAssignment(group, skill, "wordlist", 0, level);
  const sentence = pageAssignment(group, skill, "sentences", 0, level);
  const passage = pageAssignment(group, skill, "passage", 0, level);
  ttById("ttWordlistPage").textContent = `${formatPage(wordlist)} - ${pagePositionLabel(wordlist, "wordlist")}`;
  ttById("ttSentencePage").textContent = sentence.page ? `${formatPage(sentence)} - ${pagePositionLabel(sentence, "sentence")}` : "No sentence page listed";
  ttById("ttPassagePage").textContent = passage.page ? `${formatPage(passage)} - ${pagePositionLabel(passage, "passage")}` : "No passage page listed";
}

function ttFillSounds(skill, lesson) {
  const photo = ttSection1PhotoForSubstep(skill.id);
  const smallCardHtml = ttSection1SmallCardView(skill, lesson);
  ttById("ttSounds").innerHTML = `
    <div class="section1-view-actions" role="toolbar" aria-label="Section 1 view controls">
      <button type="button" class="${ttSection1View === "photo" ? "active" : ""}" data-section1-view="photo">Photo View</button>
      <button type="button" class="${ttSection1View === "cards" ? "active" : ""}" data-section1-view="cards">Small Card View</button>
      <span></span>
      <button type="button" class="${ttSection1PhotoMode === "full" ? "active" : ""}" data-section1-photo-mode="full">Full View</button>
      <button type="button" class="${ttSection1PhotoMode === "zoom" ? "active" : ""}" data-section1-photo-mode="zoom">Zoom View</button>
    </div>
    <section class="section1-photo-view ${ttSection1View === "photo" ? "active" : ""}" aria-label="Section 1 sound poster">
      <header class="section1-photo-head">
        <strong>${escapeHtml(photo.label)}</strong>
        <span>${ttSection1PhotoMode === "full" ? "Whole poster shown" : "Fit height; drag or swipe sideways"}</span>
      </header>
      <div class="section1-photo-viewport" data-mode="${ttSection1PhotoMode}">
        <img src="${escapeHtml(photo.src)}" alt="Section 1 sound drill poster for ${escapeHtml(photo.label)}" draggable="false">
      </div>
    </section>
    <section class="section1-card-view ${ttSection1View === "cards" ? "active" : ""}" aria-label="Section 1 small card view">
      ${smallCardHtml}
    </section>
  `;
  ttBindSection1Controls();
}

function ttSection1SmallCardView(skill, lesson) {
  const poster = ttSection1PosterForSubstep(skill.id);
  const vowelCards = ttSection1VowelCards(skill.id);
  const consonantCards = ttSection1ConsonantCards(skill.id);
  const gluedCards = ttSection1GluedCards(skill.id);
  const elementCards = ttSection1ElementCards(skill.id);
  const targets = targetSoundItemsForLesson(lesson, skill);
  const targetGroups = {
    vowels: vowelCards.slice(0, 5).map((item) => item.label),
    consonants: targets.filter((item) => /consonants|digraphs/i.test(item.group || "")).map((item) => item.value),
    glued: targets.filter((item) => /welded|glued/i.test(item.group || "")).map((item) => item.value),
    elements: targets.filter((item) => /pfx|sfx|element/i.test(item.group || "")).map((item) => item.value)
  };
  return `
    <section class="section1-board" aria-label="Section 1 sound drill board">
      <header class="section1-board-head">
        <div>
          <span>PowerPoint slide ${poster.slide}</span>
          <h3>${escapeHtml(poster.title)}</h3>
        </div>
        <strong>${escapeHtml(poster.range)}</strong>
      </header>
      <div class="section1-poster-grid">
        <article class="section1-poster-panel section1-vowels">
          <strong>Vowels first</strong>
          <div class="section1-sound-cards">${ttSoundCardHtml(vowelCards, "vowel")}</div>
        </article>
        <article class="section1-poster-panel section1-consonants">
          <strong>Consonants / digraphs</strong>
          <div class="section1-sound-cards">${ttSoundCardHtml(consonantCards, "consonant")}</div>
        </article>
        <article class="section1-poster-panel section1-glued">
          <strong>Glued / welded sounds</strong>
          <div class="section1-sound-cards">${ttSoundCardHtml(gluedCards, "glued")}</div>
        </article>
        <article class="section1-poster-panel section1-elements">
          <strong>Word elements</strong>
          <div class="section1-sound-cards">${ttSoundCardHtml(elementCards, "element")}</div>
        </article>
      </div>
      <div class="section1-quick-picks">
        <strong>Today's quick picks</strong>
        <div><span>Vowels</span>${ttChipList(targetGroups.vowels)}</div>
        <div><span>Consonants</span>${ttChipList(targetGroups.consonants)}</div>
        <div><span>Glued</span>${ttChipList(targetGroups.glued)}</div>
        <div><span>Elements</span>${ttChipList(targetGroups.elements)}</div>
      </div>
    </section>
  `;
}

function ttBindSection1Controls() {
  ttById("ttSounds")?.querySelectorAll("[data-section1-view]").forEach((button) => {
    button.addEventListener("click", () => {
      ttSection1View = button.dataset.section1View;
      ttRender();
    });
  });
  ttById("ttSounds")?.querySelectorAll("[data-section1-photo-mode]").forEach((button) => {
    button.addEventListener("click", () => {
      ttSetSection1PhotoMode(button.dataset.section1PhotoMode);
    });
  });
  const viewport = ttById("ttSounds")?.querySelector(".section1-photo-viewport");
  if (!viewport) return;
  viewport.addEventListener("pointerdown", (event) => {
    if (event.button !== undefined && event.button !== 0) return;
    ttSection1Pan = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      left: viewport.scrollLeft,
      top: viewport.scrollTop,
      moved: false
    };
    viewport.classList.add("is-panning");
    viewport.setPointerCapture?.(event.pointerId);
  });
  viewport.addEventListener("pointermove", (event) => {
    if (!ttSection1Pan || ttSection1Pan.id !== event.pointerId) return;
    const dx = event.clientX - ttSection1Pan.x;
    const dy = event.clientY - ttSection1Pan.y;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) ttSection1Pan.moved = true;
    viewport.scrollLeft = ttSection1Pan.left - dx;
    viewport.scrollTop = ttSection1Pan.top - dy;
  });
  ["pointerup", "pointercancel", "lostpointercapture"].forEach((type) => {
    viewport.addEventListener(type, (event) => {
      if (ttSection1Pan?.id === event.pointerId || type === "lostpointercapture") {
        viewport.classList.remove("is-panning");
        if (type !== "pointerup") ttSection1Pan = null;
      }
    });
  });
  viewport.addEventListener("dblclick", (event) => {
    event.preventDefault();
    ttToggleSection1PhotoModeAt(event.clientX);
  });
  viewport.addEventListener("pointerup", (event) => {
    const didPan = ttSection1Pan?.moved;
    ttSection1Pan = null;
    if (didPan) return;
    const now = Date.now();
    const distance = Math.hypot(event.clientX - ttSection1LastTap.x, event.clientY - ttSection1LastTap.y);
    if (now - ttSection1LastTap.time < 320 && distance < 28) {
      event.preventDefault();
      ttToggleSection1PhotoModeAt(event.clientX);
      ttSection1LastTap = { time: 0, x: 0, y: 0 };
      return;
    }
    ttSection1LastTap = { time: now, x: event.clientX, y: event.clientY };
  });
}

function ttSetSection1PhotoMode(mode, focusRatio = 0) {
  ttSection1PhotoMode = mode === "zoom" ? "zoom" : "full";
  const root = ttById("ttSounds");
  const viewport = root?.querySelector(".section1-photo-viewport");
  if (!viewport) return;
  viewport.dataset.mode = ttSection1PhotoMode;
  root.querySelectorAll("[data-section1-photo-mode]").forEach((button) => {
    button.classList.toggle("active", button.dataset.section1PhotoMode === ttSection1PhotoMode);
  });
  const help = root.querySelector(".section1-photo-head span");
  if (help) help.textContent = ttSection1PhotoMode === "full" ? "Whole poster shown" : "Fit height; drag or swipe sideways";
  requestAnimationFrame(() => {
    const max = Math.max(0, viewport.scrollWidth - viewport.clientWidth);
    viewport.scrollLeft = ttSection1PhotoMode === "zoom" ? max * Math.max(0, Math.min(1, focusRatio)) : 0;
  });
}

function ttToggleSection1PhotoModeAt(clientX) {
  const viewport = ttById("ttSounds")?.querySelector(".section1-photo-viewport");
  if (!viewport) return;
  const rect = viewport.getBoundingClientRect();
  const ratio = Math.max(0, Math.min(1, (clientX - rect.left + viewport.scrollLeft) / Math.max(1, viewport.scrollWidth)));
  ttSetSection1PhotoMode(ttSection1PhotoMode === "full" ? "zoom" : "full", ratio);
}

function ttSection1PhotoForSubstep(substep) {
  const photos = [
    { from: "1.1", to: "1.1", file: "1.1.png", label: "1.1" },
    { from: "1.2", to: "1.3", file: "1.2 - 1.3.png", label: "1.2-1.3" },
    { from: "1.4", to: "1.4", file: "1.4.png", label: "1.4" },
    { from: "1.5", to: "1.6", file: "1.5 - 1.6.png", label: "1.5-1.6" },
    { from: "2.1", to: "2.2", file: "2.1 - 2.2.png", label: "2.1-2.2" },
    { from: "2.3", to: "3.5", file: "2.3 - 3.5.png", label: "2.3-3.5" },
    { from: "4.1", to: "4.4", file: "4.1 - 4.4.png", label: "4.1-4.4" },
    { from: "5.1", to: "5.2", file: "5.1 - 5.2.png", label: "5.1-5.2" },
    { from: "5.3", to: "5.4", file: "5.3 - 5.4.png", label: "5.3-5.4" },
    { from: "5.5", to: "6.3", file: "5.5 - 6.3.png", label: "5.5-6.3" },
    { from: "6.4", to: "6.4", file: "6.4.png", label: "6.4" },
    { from: "7.1", to: "7.1", file: "7.1.png", label: "7.1" },
    { from: "7.2", to: "7.2", file: "7.2.png", label: "7.2" },
    { from: "7.3", to: "7.3", file: "7.3.png", label: "7.3" },
    { from: "7.4", to: "7.5", file: "7.4 - 7.5.png", label: "7.4-7.5" },
    { from: "8.1", to: "8.1", file: "8.1.png", label: "8.1" },
    { from: "8.2", to: "8.4", file: "8.1 - 8.4.png", label: "8.2-8.4" },
    { from: "8.5", to: "8.5", file: "8.5.png", label: "8.5" },
    { from: "9.1", to: "12.6", file: "9.1 and on.png", label: "9.1 and on" }
  ];
  const match = photos.find((photo) => ttSubstepInRange(substep, photo.from, photo.to)) || photos[0];
  return {
    ...match,
    src: `Sounds%20for%20Section%201/${encodeURIComponent(match.file)}`
  };
}

function ttSection1PosterForSubstep(substep) {
  const posters = [
    { from: "1.1", to: "1.1", slide: 1, range: "1.1", title: "Vowels + consonants" },
    { from: "1.2", to: "1.3", slide: 2, range: "1.2-1.3", title: "Vowels, consonants, digraphs" },
    { from: "1.4", to: "1.4", slide: 3, range: "1.4", title: "First glued sound: all" },
    { from: "1.5", to: "1.6", slide: 4, range: "1.5-1.6", title: "Glued sounds: all, am, an" },
    { from: "2.1", to: "2.2", slide: 5, range: "2.1-2.2", title: "Closed syllable glued sounds" },
    { from: "2.3", to: "3.5", slide: 6, range: "2.3-3.5", title: "Cumulative closed syllable sounds" },
    { from: "4.1", to: "4.4", slide: 7, range: "4.1-4.4", title: "V-e long vowel sounds" },
    { from: "5.1", to: "5.2", slide: 8, range: "5.1-5.2", title: "Open syllable long sounds" },
    { from: "5.3", to: "5.4", slide: 9, range: "5.3-5.4", title: "Open syllable + final y" },
    { from: "5.5", to: "6.3", slide: 10, range: "5.5-6.3", title: "Cumulative long vowel review" },
    { from: "6.4", to: "6.4", slide: 11, range: "6.4", title: "Final stable syllable review" },
    { from: "7.1", to: "7.1", slide: 12, range: "7.1", title: "Soft c and soft g" },
    { from: "7.2", to: "7.2", slide: 13, range: "7.2", title: "ce, ge, and dge" },
    { from: "7.3", to: "7.3", slide: 14, range: "7.3", title: "ph and tch" },
    { from: "7.4", to: "7.4", slide: 15, range: "7.4", title: "tion and sion" },
    { from: "7.5", to: "7.5", slide: 16, range: "7.5", title: "Contractions and possessives" },
    { from: "8.1", to: "8.5", slide: 17, range: "8.1-8.5", title: "R-controlled vowels" },
    { from: "9.1", to: "12.6", slide: 18, range: "9.1-12.6", title: "Advanced vowel teams and exceptions" }
  ];
  return posters.find((poster) => ttSubstepInRange(substep, poster.from, poster.to)) || posters[0];
}

function ttSubstepInRange(substep, from, to) {
  return isAtLeastSubstep(substep, from) && isAtLeastSubstep(to, substep);
}

function ttSection1VowelCards(substep) {
  const cards = [
    { label: "a", cue: "apple", sound: "/ă/" },
    { label: "e", cue: "Ed", sound: "/ĕ/" },
    { label: "i", cue: "itch", sound: "/ĭ/" },
    { label: "o", cue: "octopus", sound: "/ŏ/" },
    { label: "u", cue: "up", sound: "/ŭ/" }
  ];
  if (isAtLeastSubstep(substep, "4.1")) {
    cards.push(
      { label: "a-e", cue: "safe", sound: "/ā/" },
      { label: "e-e", cue: "Pete", sound: "/ē/" },
      { label: "i-e", cue: "pine", sound: "/ī/" },
      { label: "o-e", cue: "home", sound: "/ō/" },
      { label: "u-e", cue: "rule / mule", sound: "/ū/ /ü/" }
    );
  }
  if (isAtLeastSubstep(substep, "5.1")) {
    cards.push(
      { label: "a", cue: "acorn", sound: "/ā/" },
      { label: "e", cue: "me", sound: "/ē/" },
      { label: "i", cue: "hi", sound: "/ī/" },
      { label: "o", cue: "no", sound: "/ō/" },
      { label: "u", cue: "flu", sound: "/ū/ /ü/" },
      { label: "y", cue: "baby / cry", sound: "/ē/ /ī/" }
    );
  }
  if (isAtLeastSubstep(substep, "8.1")) {
    cards.push(
      { label: "ar", cue: "car", sound: "/ar/" },
      { label: "er", cue: "her", sound: "/er/" },
      { label: "ir", cue: "bird", sound: "/er/" },
      { label: "or", cue: "fork", sound: "/or/" },
      { label: "ur", cue: "burn", sound: "/er/" }
    );
  }
  if (isAtLeastSubstep(substep, "9.1")) {
    cards.push(
      { label: "ai/ay", cue: "rain / play", sound: "/ā/" },
      { label: "ee/ea/ey", cue: "see / eat / key", sound: "/ē/" },
      { label: "oi/oy", cue: "coin / boy", sound: "/oi/" },
      { label: "oa/oe/ow", cue: "boat / toe / snow", sound: "/ō/" },
      { label: "ou/ow", cue: "out / cow", sound: "/ou/" },
      { label: "oo", cue: "moon / book", sound: "/ū/ /oo/" }
    );
  }
  return cards;
}

function ttSection1ConsonantCards(substep) {
  const base = isAtLeastSubstep(substep, "1.2")
    ? ["b", "c", "d", "f", "g", "h", "j", "k", "l", "m", "n", "p", "qu", "r", "s", "t", "v", "w", "x", "y", "z", "ch", "ck", "sh", "th", "wh"]
    : ["f", "l", "m", "n", "r", "s", "d", "g", "p", "t"];
  if (isAtLeastSubstep(substep, "7.1")) base.push("c=/s/", "g=/j/");
  if (isAtLeastSubstep(substep, "7.2")) base.push("ce", "ge", "dge");
  if (isAtLeastSubstep(substep, "7.3")) base.push("ph", "tch");
  return [...new Set(base)].map((label) => ({ label }));
}

function ttSection1GluedCards(substep) {
  return knownWeldedAndExceptions
    .filter(([introduced]) => isAtLeastSubstep(substep, introduced))
    .map(([, label]) => ({ label }));
}

function ttSection1ElementCards(substep) {
  return wordElementList(substep)
    .slice(0, 24)
    .map((label) => ({ label }));
}

function ttSoundCardHtml(cards, type) {
  if (!cards.length) return `<span class="section1-empty">Not introduced yet</span>`;
  return cards.map((card) => `
    <span class="section1-sound-card ${type}">
      <b>${escapeHtml(card.label)}</b>
      ${card.cue ? `<small>${escapeHtml(card.cue)}</small>` : ""}
      ${card.sound ? `<em>${escapeHtml(card.sound)}</em>` : ""}
    </span>
  `).join("");
}

function ttChipList(items) {
  const unique = [...new Set(items)].filter(Boolean);
  if (!unique.length) return `<em>as needed</em>`;
  return unique.slice(0, 8).map((item) => `<b>${escapeHtml(item)}</b>`).join("");
}

function ttFillReverse(skill, lesson) {
  const targetItems = targetSoundItemsForLesson(lesson, skill);
  const targets = targetItems.map((item) => item.value);
  const targetSet = new Set(targets);
  const groups = [
    { title: "Vowels", items: vowelSoundList(skill.id) },
    { title: "Consonants", items: consonantSoundList(skill.id) },
    { title: "Welded / glued", items: knownWeldedAndExceptions.filter(([step]) => isAtLeastSubstep(skill.id, step)).map(([, value]) => value) },
    { title: "Word elements", items: wordElementList(skill.id) }
  ];
  const html = groups.map((group) => `
    <article class="reverse-group">
      <strong>${escapeHtml(group.title)}</strong>
      <div class="reverse-chip-row">
        ${group.items.map((item) => {
          const key = item.replace(/^-|-$/g, "");
          const marked = isMarkedReviewWord(item) || isMarkedReviewWord(key);
          const today = targetSet.has(item) || targetSet.has(key);
          return `<button type="button" class="${today ? "today-target" : ""} ${marked ? "marked-word" : ""}" data-sound="${escapeHtml(item)}">${escapeHtml(item)}</button>`;
        }).join("")}
      </div>
    </article>
  `).join("");
  ttById("ttReverse").innerHTML = html;
  ttById("ttReverse").querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () => {
      ttToggleEncodingForActiveStudent(button, "section6", "Reverse drill", button.dataset.sound);
    });
  });
  ttFillEncodingStudentGrid(ttById("ttEncodingBar6"), "section6", "Reverse drill", targetItems);
}

function ttFillEncodingStudentGrid(container, section, label, items = []) {
  if (!container) return;
  const group = ttActiveGroup();
  container.dataset.section = section;
  const observationGroups = [
    [
      ["automatic encoding; no struggle", "Auto"],
      ["accurate encoding; minor struggle", "Acc"],
      ["struggling to identify and segment sounds properly", "Strug"]
    ],
    [
      ["struggles mainly with nonsense words", "NS"],
      ["struggles with consonant blends", "Blends"],
      ["struggles differentiating vowel sounds", "Vowel Diff"],
      ["struggles with high-frequency words", "HFW"],
      ["struggles with words that have suffixes", "Sfx"]
    ]
  ];
  const visibleItems = ttNormalizeEncodingItems(items).slice(0, 32);
  container.innerHTML = `
    <div class="encoding-row">
      <strong>${escapeHtml(label)} data</strong>
      <span class="encoding-selected">Tap under each student to save for this lesson</span>
    </div>
    <div class="encoding-student-grid"></div>
  `;
  const grid = container.querySelector(".encoding-student-grid");
  group.students.forEach((student) => {
    const column = document.createElement("article");
    column.className = "encoding-student-column";
    column.innerHTML = `
      <strong>${escapeHtml(student)}</strong>
      <div class="encoding-code-row encoding-code-row-main"></div>
      <div class="encoding-code-row encoding-code-row-skill"></div>
      <div class="encoding-item-row"></div>
    `;
    const codeRows = column.querySelectorAll(".encoding-code-row");
    observationGroups.forEach((groupItems, groupIndex) => {
      groupItems.forEach(([note, shortLabel]) => {
        const quickButton = document.createElement("button");
        quickButton.type = "button";
        quickButton.textContent = shortLabel;
        quickButton.dataset.note = note;
        quickButton.dataset.quickGroup = groupIndex === 0 ? "status" : "skill";
        quickButton.addEventListener("click", () => {
          if (groupIndex === 0) {
            ttSetExclusiveEncodingObservation(quickButton, student, section, label, note);
          } else {
            ttToggleEncodingObservation(quickButton, student, section, label, note, "");
          }
          container.querySelector(".encoding-selected").textContent = `Saved: ${student} - ${shortLabel}`;
        });
        codeRows[groupIndex].appendChild(quickButton);
      });
    });
    const itemRow = column.querySelector(".encoding-item-row");
    ttGroupEncodingItems(visibleItems).forEach((itemGroup) => {
      const groupBlock = document.createElement("div");
      groupBlock.className = "encoding-item-group";
      groupBlock.innerHTML = `<span>${escapeHtml(itemGroup.group)}</span><div></div>`;
      const buttonRow = groupBlock.querySelector("div");
      itemGroup.items.forEach((item) => {
        const itemButton = document.createElement("button");
        itemButton.type = "button";
        itemButton.textContent = item.value;
        itemButton.addEventListener("click", () => {
          ttToggleEncodingObservation(itemButton, student, section, item.category || label, "encoding miss", item.value);
          container.querySelector(".encoding-selected").textContent = `${student}: ${item.value}`;
        });
        buttonRow.appendChild(itemButton);
      });
      itemRow.appendChild(groupBlock);
    });
    grid.appendChild(column);
  });
}

function ttSetExclusiveEncodingObservation(button, student, section, category, note) {
  const group = ttActiveGroup();
  group.encodingObservations ||= [];
  const lessonId = ttLesson?.id || "";
  const exclusiveNotes = new Set([
    "automatic encoding; no struggle",
    "accurate encoding; minor struggle",
    "struggling to identify and segment sounds properly"
  ]);
  const wasSaved = group.encodingObservations.some((record) =>
    record.lessonId === lessonId
    && record.student === student
    && record.section === section
    && record.category === category
    && record.note === note
    && !(record.item || "")
  );
  group.encodingObservations = group.encodingObservations.filter((record) =>
    !(record.lessonId === lessonId
      && record.student === student
      && record.section === section
      && record.category === category
      && exclusiveNotes.has(record.note)
      && !(record.item || ""))
  );
  button.closest(".encoding-code-row")?.querySelectorAll("button").forEach((item) => item.classList.remove("saved", "encoding-selected-item"));
  if (!wasSaved) {
    ttSaveEncodingObservation(student, section, category, note, "");
    button.classList.add("saved", "encoding-selected-item");
  }
  saveState();
}

function ttNormalizeEncodingItems(items = []) {
  const seen = new Set();
  const normalized = [];
  items.filter(Boolean).forEach((item) => {
    const value = typeof item === "object" ? item.value : item;
    const category = typeof item === "object" ? item.category : "";
    const group = typeof item === "object" ? item.group : "";
    const cleanValue = String(value || "").trim();
    if (!cleanValue) return;
    const key = `${category || ""}|${cleanValue.toLowerCase()}`;
    if (seen.has(key)) return;
    seen.add(key);
    normalized.push({ value: cleanValue, category, group: group || category || "Items" });
  });
  return normalized;
}

function ttGroupEncodingItems(items = []) {
  const groups = [];
  items.forEach((item, blockIndex) => {
    const groupName = item.group || item.category || "Items";
    let target = groups.find((group) => group.group === groupName);
    if (!target) {
      target = { group: groupName, items: [] };
      groups.push(target);
    }
    target.items.push(item);
  });
  return groups;
}

function ttSelectEncodingItem(button, section, category, value) {
  if (button.classList.contains("encoding-selected-item")) {
    button.classList.remove("encoding-selected-item");
    ttClearEncodingSelection(section);
    return;
  }
  document.querySelectorAll(`[data-encoding-section="${section}"], .encoding-selected-item`).forEach((item) => {
    if (item.dataset.encodingSection === section || item.closest(`#section${section.replace("section", "")}`)) {
      item.classList.remove("encoding-selected-item");
    }
  });
  button.classList.add("encoding-selected-item");
  button.dataset.encodingSection = section;
  const bar = ttEncodingBarForSection(section);
  if (!bar) return;
  bar.dataset.selectedValue = value;
  bar.dataset.selectedCategory = category;
  bar.querySelector(".encoding-selected").textContent = `Selected: ${value}`;
}

function ttToggleEncodingForActiveStudent(button, section, category, value) {
  const group = ttActiveGroup();
  const student = group.activeStudent || group.students[0];
  ttToggleEncodingObservation(button, student, section, category, "encoding miss", value);
}

function ttToggleEncodingObservation(button, student, section, category, note, item = "") {
  const group = ttActiveGroup();
  group.encodingObservations ||= [];
  const lessonId = ttLesson?.id || "";
  const existingIndex = group.encodingObservations.findIndex((record) =>
    record.lessonId === lessonId
    && record.student === student
    && record.section === section
    && record.category === category
    && record.note === note
    && (record.item || "") === (item || "")
  );
  if (existingIndex >= 0) {
    group.encodingObservations.splice(existingIndex, 1);
    button.classList.remove("saved", "encoding-selected-item");
  } else {
    ttSaveEncodingObservation(student, section, category, note, item);
    button.classList.add("saved", "encoding-selected-item");
  }
  saveState();
}

function ttClearEncodingSelection(section) {
  const bar = ttEncodingBarForSection(section);
  if (!bar) return;
  bar.dataset.selectedValue = "";
  bar.dataset.selectedCategory = "";
  bar.querySelector(".encoding-selected").textContent = "Tap item, then student";
}

function ttSelectEncodingValue(section, category, value) {
  const bar = ttEncodingBarForSection(section);
  if (!bar) return;
  if (bar.dataset.selectedValue === value && bar.dataset.selectedCategory === category) {
    ttClearEncodingSelection(section);
    return;
  }
  bar.dataset.selectedValue = value;
  bar.dataset.selectedCategory = category;
  bar.querySelector(".encoding-selected").textContent = `Selected: ${value}`;
  document.querySelectorAll(".encoding-selected-item").forEach((item) => item.classList.remove("encoding-selected-item"));
}

function ttEncodingBarForSection(section) {
  return {
    section6: ttById("ttEncodingBar6"),
    section7: ttById("ttEncodingBar7"),
    section8: ttById("ttDictation")?.querySelector(".encoding-bar")
  }[section] || null;
}

function ttSaveEncodingSelected(container, student) {
  const value = container.dataset.selectedValue || "";
  const category = container.dataset.selectedCategory || "";
  const section = container.dataset.section || "";
  if (!value) {
    container.querySelector(".encoding-selected").textContent = "Tap an item first";
    return;
  }
  ttSaveEncodingObservation(student, section, category, "encoding miss", value);
  container.querySelector(".encoding-selected").textContent = `Saved: ${student} - ${value}`;
  container.dataset.selectedValue = "";
  container.dataset.selectedCategory = "";
  document.querySelectorAll(".encoding-selected-item").forEach((item) => item.classList.remove("encoding-selected-item"));
}

function ttSaveEncodingObservation(student, section, category, note, item = "") {
  if (!student) return;
  ttEnsureCurrentLessonSavedForData();
  const group = ttActiveGroup();
  const lessonMeta = ttCurrentLessonRecordMeta(ttLesson);
  group.encodingObservations ||= [];
  group.encodingObservations.push({
    id: `encoding-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    date: new Date().toISOString(),
    student,
    section,
    substep: ttLesson?.substep || group.substep,
    category,
    item,
    note,
    ...lessonMeta
  });
  if (item || note.includes("difficult") || note.includes("strategies")) {
    group.markedReviewWords ||= [];
    group.markedReviewWords.push({
      word: item || note,
      source: section,
      student,
      substep: ttLesson?.substep || group.substep,
      date: new Date().toISOString()
    });
  }
  saveState();
  ttRenderMarkedWords();
}

function vowelSoundList(substep) {
  const items = ["ă", "ĕ", "ĭ", "ŏ", "ŭ"];
  if (isAtLeastSubstep(substep, "4.1")) items.push("ā-e", "ē-e", "ī-e", "ō-e", "ū-e");
  if (isAtLeastSubstep(substep, "5.1")) items.push("ā", "ē", "ī", "ō", "ū");
  if (isAtLeastSubstep(substep, "5.3")) items.push("y=ē", "y=ī");
  if (isAtLeastSubstep(substep, "8.1")) items.push("ar", "er", "ir", "or", "ur");
  if (isAtLeastSubstep(substep, "9.1")) items.push("ai", "ay");
  if (isAtLeastSubstep(substep, "9.2")) items.push("ee", "ey");
  if (isAtLeastSubstep(substep, "9.3")) items.push("ea", "oa", "oe");
  return items;
}

function consonantSoundList(substep) {
  const base = ["b", "c", "d", "f", "g", "h", "j", "k", "l", "m", "n", "p", "qu", "r", "s", "t"];
  if (isAtLeastSubstep(substep, "1.2")) base.push("v", "w", "x", "y", "z", "ch", "ck", "sh", "th", "wh");
  if (isAtLeastSubstep(substep, "7.2")) base.push("dge", "ce", "ge");
  if (isAtLeastSubstep(substep, "7.3")) base.push("ph", "tch");
  return [...new Set(base)];
}

function wordElementList(substep) {
  return knownPrefixes.filter(([step]) => isAtLeastSubstep(substep, step)).map(([, value]) => value)
    .concat(knownSuffixes.filter(([step]) => isAtLeastSubstep(substep, step)).map(([, value]) => value))
    .concat(knownLatinBases.filter(([step]) => isAtLeastSubstep(substep, step)).map(([, value]) => value));
}

function targetSoundsForLesson(lesson, skill) {
  return targetSoundItemsForLesson(lesson, skill).map((item) => item.value);
}

function targetSoundItemsForLesson(lesson, skill) {
  if (lesson.reverseDrillOverride?.length) return lesson.reverseDrillOverride;
  const words = []
    .concat(lesson.sectionTwoCurrentWords || [])
    .concat(lesson.realWords || [])
    .concat(dictationCurrentWords(skill.id, lesson.readerLevel || "AB", lesson.realWords || []));
  const text = words.join(" ").toLowerCase();
  const consonants = [];
  const welded = [];
  const elements = [];
  consonantSoundList(skill.id).forEach((sound) => {
    const key = sound.replace(/^-|-$/g, "").toLowerCase();
    if (key.length && text.includes(key)) consonants.push(sound);
  });
  knownWeldedAndExceptions.map(([, value]) => value).forEach((sound) => {
    const key = sound.replace(/^-|-$/g, "").toLowerCase();
    if (key.length && text.includes(key)) welded.push(sound);
  });
  wordElementList(skill.id).forEach((part) => {
    const key = part.replace(/^-|-$/g, "").toLowerCase();
    if (key && text.includes(key)) elements.push(part);
  });
  const vowels = vowelSoundList(skill.id);
  const pageOffset = Number(lesson.wordlistPageNumber || lesson.pageNumber || 0) + Number(lesson.reverseDrillSeed || 0);
  return []
    .concat(vowels.slice(pageOffset % Math.max(vowels.length, 1)).concat(vowels).slice(0, 5).map((value) => ({ value, category: "Reverse drill", group: "Sounds" })))
    .concat(pickConsonantTargets(consonants, skill.id, pageOffset).map((value) => ({ value, category: "Reverse drill", group: "Consonants / digraphs" })))
    .concat([...new Set(welded)].slice(0, 3).map((value) => ({ value, category: "Reverse drill", group: "Welded / glued" })))
    .concat([...new Set(elements)].slice(0, 2).map((value) => ({ value, category: "Reverse drill", group: "Pfx / Sfx" })));
}

function pickConsonantTargets(candidates, substep, offset = 0) {
  const unique = [...new Set(candidates)].filter(Boolean);
  const digraphs = ["ch", "ck", "sh", "th", "wh", "dge", "ph", "tch"];
  const picked = [];
  const candidateDigraph = unique.find((sound) => digraphs.includes(sound));
  const knownDigraphs = consonantSoundList(substep).filter((sound) => digraphs.includes(sound));
  if (candidateDigraph) {
    picked.push(candidateDigraph);
  } else if (knownDigraphs.length) {
    picked.push(knownDigraphs[offset % knownDigraphs.length]);
  }
  const remaining = unique.filter((sound) => !picked.includes(sound));
  const start = remaining.length ? offset % remaining.length : 0;
  const rotated = remaining.slice(start).concat(remaining.slice(0, start));
  rotated.forEach((sound) => {
    if (picked.length < 5) picked.push(sound);
  });
  consonantSoundList(substep).forEach((sound) => {
    if (picked.length < 5 && !picked.includes(sound)) picked.push(sound);
  });
  return picked.slice(0, 5);
}

function ttFillWordRow(container, words, options = {}) {
  container.innerHTML = "";
  if (!words.length) {
    const empty = document.createElement("span");
    empty.textContent = "No words listed";
    container.appendChild(empty);
    return;
  }
  words.forEach((word) => {
    const item = document.createElement(options.markable || options.onSelect ? "button" : "span");
    item.textContent = word;
    if (options.markable || options.onSelect) {
      item.type = "button";
      item.className = [
        options.markable && isMarkedReviewWord(word) ? "marked-word" : "",
        word === ttSection2Word ? "selected-display-word" : ""
      ].filter(Boolean).join(" ");
    }
    const singleAction = () => {
      if (options.markable) toggleReviewWord(word, options.source || "lesson");
      if (options.onSelect) options.onSelect(word);
    };
    if (options.onReplace) {
      ttBindSingleOrTriple(item, singleAction, () => options.onReplace(word));
    } else if (options.markable || options.onSelect) {
      item.addEventListener("click", singleAction);
    }
    container.appendChild(item);
  });
}

function ttBindSingleOrTriple(element, singleAction, tripleAction) {
  if (!element) return;
  let taps = 0;
  let tapTimer = null;
  element.classList.add("triple-switchable");
  element.title = element.title ? `${element.title} | Triple-tap to switch` : "Triple-tap to switch";
  element.addEventListener("click", (event) => {
    taps += 1;
    clearTimeout(tapTimer);
    if (taps >= 3) {
      event.preventDefault();
      event.stopPropagation();
      taps = 0;
      tripleAction?.();
      ttFlashSwitchFeedback(element);
      return;
    }
    tapTimer = setTimeout(() => {
      if (taps === 1) singleAction?.(event);
      taps = 0;
    }, 300);
  });
}

function ttFlashSwitchFeedback(element) {
  if (!element) return;
  element.classList.remove("switch-flash");
  void element.offsetWidth;
  element.classList.add("switch-flash");
  setTimeout(() => element.classList.remove("switch-flash"), 800);
}

function ttFillSection3Cards(lesson) {
  document.querySelectorAll(".card-mode").forEach((button) => {
    button.classList.toggle("active", button.dataset.mode === ttCardMode);
  });
  ttFillHfwStepChoicesForSelect(ttById("ttSection3HfwStep"), lesson.substep);
  ttById("ttSection3HfwStep")?.classList.toggle("active", ttCardMode === "hfw");
  const deckData = section3DeckForMode(lesson, ttCardMode);
  ttCardDeck = deckData.deck;
  ttById("ttReviewCardsTitle").textContent = deckData.reviewTitle;
  ttById("ttCurrentCardsTitle").textContent = deckData.currentTitle;
  ttFillWordRow(ttById("ttReviewCards"), deckData.review, {
    markable: ttCardMode === "words",
    source: `section3-${ttCardMode}-review`,
    onSelect: (word) => ttShowCardByWord(word),
    onReplace: ttCardMode === "words" ? (word) => ttReplaceSection3Word("review", word) : null
  });
  ttFillWordRow(ttById("ttCurrentCards"), deckData.current, {
    markable: ttCardMode === "words",
    source: `section3-${ttCardMode}-current`,
    onSelect: (word) => ttShowCardByWord(word),
    onReplace: ttCardMode === "words" ? (word) => ttReplaceSection3Word("current", word) : null
  });
  ttCardIndex = 0;
  ttShowCard(0);
}

function ttReplaceSection3Word(kind, oldWord) {
  if (!ttLesson || ttCardMode !== "words") return;
  ttForkSavedLessonDraft();
  const skill = scopeMap.find((item) => item.id === ttLesson.substep) || activeStep(ttActiveGroup());
  const key = kind === "review" ? "sectionThreeReviewWords" : "sectionThreeCurrentWords";
  const current = ttLesson[key] || (kind === "review" ? section3ReviewCards(ttLesson) : section3CurrentCards(ttLesson));
  const pool = kind === "review"
    ? readerWordsFromSubstep(priorSubstep(skill.id), ttLesson.readerLevel || "AB")
    : (ttLesson.realWords || []).concat(ttLesson.nonsenseWords || []);
  ttLesson[key] = current.map((word) => word === oldWord ? ttPickReplacement(pool, current, oldWord) : word);
  ttSaveDraftLesson();
  ttFillSection3Cards(ttLesson);
}

function section3DeckForMode(lesson, mode) {
  if (mode === "hfw") {
    const hfwSubstep = ttById("ttSection3HfwStep")?.value || lesson.substep;
    const current = hfwWordsForSubstep(hfwSubstep, lesson);
    const review = hfwReviewWordsForSubstep(hfwSubstep);
    return {
      reviewTitle: "Review HFW",
      currentTitle: `${hfwSubstep} HFW`,
      review,
      current,
      deck: review.map((word) => ({ word, type: "Review HFW", label: "HFW review" }))
        .concat(current.map((word) => ({ word, type: "Current HFW", label: `${hfwSubstep} HFW` })))
    };
  }
  if (mode === "words") {
    const review = section3ReviewCards(lesson);
    const current = section3CurrentCards(lesson);
    return {
      reviewTitle: "Review cards",
      currentTitle: "Current cards",
      review,
      current,
      deck: review.map((word) => ({ word, type: "Review", label: `${lesson.substep} review` }))
        .concat(current.map((word) => ({ word, type: "Current", label: `${lesson.substep}${lesson.readerLevel || "AB"}` })))
    };
  }

  const group = ttActiveGroup();
  const cards = wordPartCardsForMode(group.substep, mode);
  const title = modeTitle(mode);
  return {
    reviewTitle: `${title} known up to ${group.substep}`,
    currentTitle: "Tap a card to flash it",
    review: [],
    current: cards.map((card) => card.word),
    deck: cards
  };
}

function wordPartCardsForMode(substep, mode) {
  const sources = {
    welded: knownWeldedAndExceptions,
    latin: knownLatinBases,
    prefixes: knownPrefixes,
    suffixes: knownSuffixes
  };
  const typeLabels = {
    welded: "Welded/Glued",
    latin: "Latin Base",
    prefixes: "Prefix",
    suffixes: "Suffix"
  };
  const entries = sources[mode] || [];
  return entries
    .filter(([introduced]) => isAtLeastSubstep(substep, introduced))
    .map(([introduced, word]) => ({
      word: displayWordPart(word, mode),
      type: mode,
      label: introduced,
      typeLabel: typeLabels[mode] || mode
    }));
}

function displayWordPart(word, mode) {
  if (mode === "prefixes") return word.replace(/-$/, "");
  if (mode === "suffixes") return word.replace(/^-/, "");
  return word;
}

function modeTitle(mode) {
  return {
    hfw: "High-frequency words",
    welded: "Welded/Glued sounds",
    latin: "Latin bases",
    prefixes: "Prefixes",
    suffixes: "Suffixes"
  }[mode] || "Word cards";
}

function section3ReviewCards(lesson) {
  if (lesson.sectionThreeReviewWords?.length) return lesson.sectionThreeReviewWords;
  const skill = scopeMap.find((item) => item.id === lesson.substep);
  if (!skill) return [];
  return chooseWords(readerWordsFromSubstep(priorSubstep(skill.id), lesson.readerLevel || "AB"), 8, true);
}

function section3CurrentCards(lesson) {
  if (lesson.sectionThreeCurrentWords?.length) return lesson.sectionThreeCurrentWords;
  const section2 = new Set(lesson.sectionTwoCurrentWords || []);
  const chartingPageWords = (lesson.realWords || []).concat(lesson.nonsenseWords || []);
  const source = chartingPageWords.filter((word) => !section2.has(word));
  return chooseWords(source.length ? source : chartingPageWords, 8, true);
}

function ttFillSection2ReplacementTools(lesson, skill) {
  const currentSelect = ttById("ttCurrentWordSelect");
  if (currentSelect) {
    const words = [...new Set([].concat(lesson.realWords || [], lesson.nonsenseWords || []).filter(isUsableReaderWord))];
    currentSelect.innerHTML = `<option value="">Pick from charting page...</option>${words.map((word) => `<option value="${escapeHtml(word)}">${escapeHtml(word)}</option>`).join("")}`;
  }
  const categorySelect = ttById("ttReviewCategory");
  if (categorySelect) {
    const categories = section2ReviewCategories();
    categorySelect.innerHTML = categories.map((category) => `<option value="${escapeHtml(category.id)}">${escapeHtml(category.label)}</option>`).join("");
    ttFillSection2ReviewCategoryWords(categorySelect.value || categories[0]?.id || "", skill.id);
  }
}

function section2ReviewCategories() {
  return [
    { id: "blends", label: "Blends" },
    { id: "shortLong", label: "Short vs long" },
    { id: "ve", label: "V-e" },
    { id: "open", label: "Open" },
    { id: "fss", label: "FSS" },
    { id: "sfx", label: "Sfx" },
    { id: "multiSfx", label: "Multi Sfx" },
    { id: "ct", label: "-ct" },
    { id: "ruleBreaker", label: "Rule Breaker" },
    { id: "glued", label: "Glued" }
  ];
}

function ttFillSection2ReviewCategoryWords(categoryId, currentSubstep) {
  const container = ttById("ttReviewReplacementWords");
  if (!container) return;
  const words = section2ReviewWordsForCategory(categoryId, currentSubstep).slice(0, 18);
  container.innerHTML = "";
  words.forEach((word) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = word;
    button.addEventListener("click", () => ttShowSection2Word(word, currentSubstep));
    container.appendChild(button);
  });
}

function section2ReviewWordsForCategory(categoryId, currentSubstep) {
  const level = ttLesson?.readerLevel || ttActiveGroup().readerLevel || "AB";
  const fromSteps = (steps) => steps
    .filter((step) => isAtLeastSubstep(currentSubstep, step))
    .flatMap((step) => dictationWordsFor(step, level).concat(readerWordsFromSubstep(step, level)));
  const noSuffix = (word) => !hasVisibleSuffix(word);
  const hasSuffix = (word) => hasVisibleSuffix(word);
  const hasGlued = (word) => [...gluedSoundSet()].some((sound) => word.includes(sound));
  const hasBlend = (word) => /(bl|br|cl|cr|dr|fl|fr|gl|gr|pl|pr|sc|sk|sl|sm|sn|sp|st|sw|tr|tw|scr|shr|spl|spr|squ|str|thr)/.test(word);
  const hasVe = (word) => /[aeiou][bcdfghjklmnpqrstvwxyz]e$/.test(word);
  const hasOpen = (word) => /[aeiou]$/.test(word) || /(ba|be|bi|bo|bu|me|mi|no|pa|pi|pro|re|ro|ta|ti|tri)$/.test(word);
  const source = {
    blends: fromSteps(["2.2", "2.4", "2.5"]).filter((word) => noSuffix(word) && hasBlend(word)),
    shortLong: fromSteps(["2.2", "4.1", "5.1"]).filter(noSuffix),
    ve: fromSteps(["4.1", "4.2", "4.3", "4.4"]).filter((word) => noSuffix(word) && hasVe(word)),
    open: fromSteps(["5.1", "5.2"]).filter((word) => noSuffix(word) && hasOpen(word)),
    fss: fromSteps(["6.4"]).filter(noSuffix),
    sfx: fromSteps(["2.2", "2.3", "2.4", "2.5"]).filter(hasSuffix),
    multiSfx: scopeMap.filter((skill) => isAtLeastSubstep(skill.id, "3.1") && isAtLeastSubstep(currentSubstep, skill.id)).flatMap((skill) => fromSteps([skill.id])).filter(hasSuffix),
    ct: fromSteps(["3.3"]).filter((word) => noSuffix(word) && /ct/.test(word)),
    ruleBreaker: fromSteps(["2.3"]),
    glued: priorDictationWords(currentSubstep, level).concat(fromSteps(["1.4", "1.5", "2.1", "2.3"])).filter(hasGlued)
  }[categoryId] || [];
  return chooseWords([...new Set(source.filter(isValidDictationWord))], 18, true);
}

function ttArrayWithout(values = [], remove = "") {
  return values.filter((item) => item !== remove);
}

function ttPickReplacement(pool = [], current = [], oldWord = "") {
  const used = new Set(current.filter((word) => word !== oldWord));
  return chooseWords(pool.filter((word) => isUsableReaderWord(word) && !used.has(word) && word !== oldWord), 1, true)[0] || oldWord;
}

function ttReplaceSection2Word(kind, oldWord) {
  if (!ttLesson) return;
  ttForkSavedLessonDraft();
  const skill = scopeMap.find((item) => item.id === ttLesson.substep) || activeStep(ttActiveGroup());
  if (kind === "current") {
    const pool = (ttLesson.realWords || []).concat(ttLesson.nonsenseWords || []);
    ttLesson.sectionTwoCurrentWords = (ttLesson.sectionTwoCurrentWords || []).map((word) =>
      word === oldWord ? ttPickReplacement(pool, ttLesson.sectionTwoCurrentWords || [], oldWord) : word
    );
  } else {
    const pool = section2ReviewWordsForCategory(ttById("ttReviewCategory")?.value || "blends", skill.id)
      .concat(dictationReviewWords(skill.id, ttLesson.readerLevel || "AB"), priorDictationWords(skill.id, ttLesson.readerLevel || "AB"));
    ttLesson.sectionTwoReviewWords = (ttLesson.sectionTwoReviewWords || []).map((word) =>
      word === oldWord ? ttPickReplacement(pool, ttLesson.sectionTwoReviewWords || [], oldWord) : word
    );
  }
  ttSaveDraftLesson();
  ttRender();
}

function ttReplaceSimpleListWord(key, oldWord, pool = []) {
  if (!ttLesson || !Array.isArray(ttLesson[key])) return;
  ttForkSavedLessonDraft();
  ttLesson[key] = ttLesson[key].map((word) => word === oldWord ? ttPickReplacement(pool, ttLesson[key], oldWord) : word);
  ttSaveDraftLesson();
  ttRender();
}

function ttSentenceHfwPool() {
  const data = window.readerSentenceIndex?.[ttLesson?.substep]?.[ttLesson?.readerLevel || "AB"]
    || window.readerSentenceIndex?.[ttLesson?.substep]?.AB
    || {};
  return [...new Set(Object.values(data).flatMap((page) => page.h || page.highFrequency || page.highFrequencyWords || []))];
}

function ttRefreshSection(sectionNumber) {
  if (!ttLesson) return;
  ttForkSavedLessonDraft();
  const group = ttActiveGroup();
  const skill = scopeMap.find((item) => item.id === ttLesson.substep) || activeStep(group);
  const level = ttLesson.readerLevel || group.readerLevel || "AB";
  const seedIndex = Math.floor(Math.random() * 1000);
  if (sectionNumber === "2") {
    ttLesson.sectionTwoReviewWords = sectionTwoReviewWords(skill, level, true);
    ttLesson.sectionTwoCurrentWords = sectionTwoCurrentWords((ttLesson.realWords || []).concat(ttLesson.nonsenseWords || []), true);
    ttSection2Word = "";
  }
  if (sectionNumber === "3") {
    delete ttLesson.sectionThreeReviewWords;
    delete ttLesson.sectionThreeCurrentWords;
    ttCardIndex = 0;
  }
  if (sectionNumber === "4") {
    const assignment = ttChooseReaderPage(skill, "wordlist", ttLesson.wordlistPageNumber);
    if (!assignment) return;
    ttLesson.wordlistPageNumber = assignment.page;
    ttLesson.readerLevel = assignment.level;
    ttLesson.wordlistMeta = `Reader ${skill.reader}, p. ${assignment.page} - ${pagePositionLabel(assignment, "wordlist")}`;
    ttEnsureSection4PageIntegrity(ttLesson, skill, true);
  }
  if (sectionNumber === "5") {
    const assignment = ttChooseReaderPage(skill, "sentences", ttLesson.sentencePageNumber);
    if (!assignment) return;
    const sentencePageData = sentenceDataForPage(skill, assignment);
    ttLesson.sentencePageNumber = assignment.page;
    ttLesson.sentenceLevel = assignment.level;
    ttLesson.sentenceMeta = `Reader ${skill.reader}, p. ${assignment.page || "--"} - ${pagePositionLabel(assignment, "sentence")}`;
    ttLesson.highFrequencyWords = sentencePageData.highFrequency;
    ttLesson.readerSentences = sentencePageData.sentences;
  }
  if (sectionNumber === "6") {
    ttLesson.reverseDrillSeed = seedIndex;
    ttLesson.reverseDrillOverride = ttBuildReverseDrillOverride(skill, ttLesson);
  }
  if (sectionNumber === "7") {
    ttLesson.sectionSevenReviewWords = dictationReviewWords(skill.id, level);
    ttLesson.sectionSevenNonsenseWords = chooseWords(readerNonsenseWordsForReview(priorSubstep(skill.id), skill.id).concat(ttLesson.nonsenseWords || []), 2, true);
    ttLesson.sectionSevenCurrentWords = dictationCurrentWords(skill.id, level, ttLesson.realWords || []);
  }
  if (sectionNumber === "8") {
    ttLesson.dictationPlanOverride = ttRerollDictationPlan(ttLesson, skill);
  }
  if (sectionNumber === "9") {
    const fresh = createLesson(group, skill, seedIndex, 1000);
    ttLesson.passagePageNumber = fresh.passagePageNumber;
    ttLesson.passageLevel = fresh.passageLevel;
    ttLesson.passage = fresh.passage;
  }
  ttSaveDraftLesson();
  ttRender();
  ttById(`section${sectionNumber}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function ttChooseReaderPage(skill, type, currentPage) {
  const level = ttLesson?.readerLevel || ttActiveGroup().readerLevel || "AB";
  const pages = pageList(skill, type, level);
  const resolved = resolvedLevel(skill, type, level);
  if (!pages.length) {
    alert("No Reader pages are listed for this section.");
    return null;
  }
  const label = type === "wordlist" ? "wordlist charting" : "sentence";
  const currentIndex = Math.max(0, pages.indexOf(currentPage));
  const pageLabels = type === "wordlist"
    ? pages.map((page) => `${page} (${chartingPageEntry(skill.id, resolved, page).count}/30)`).join(", ")
    : pages.join(", ");
  const promptText = `Choose ${label} page for Substep ${skill.id}\n\nType page number or page position 1-${pages.length}.\nPages: ${pageLabels}`;
  const response = prompt(promptText, String(currentPage || pages[currentIndex] || pages[0]));
  if (response === null) return null;
  const requested = Number(String(response).trim());
  if (!Number.isFinite(requested)) return null;
  let pageIndex = pages.indexOf(requested);
  if (pageIndex < 0 && requested >= 1 && requested <= pages.length) pageIndex = requested - 1;
  if (pageIndex < 0) {
    alert("That page is not listed for this substep/level.");
    return null;
  }
  return {
    reader: skill.reader,
    page: pages[pageIndex],
    level: resolved,
    index: pageIndex + 1,
    total: pages.length,
    position: `${pageIndex + 1} of ${pages.length}`
  };
}

function ttBuildReverseDrillOverride(skill, lesson) {
  const seed = Number(lesson.reverseDrillSeed || Date.now());
  const rotate = (items, count) => {
    const unique = [...new Set(items.filter(Boolean))];
    if (!unique.length) return [];
    const start = seed % unique.length;
    return unique.slice(start).concat(unique.slice(0, start)).slice(0, count);
  };
  const words = []
    .concat(lesson.sectionTwoCurrentWords || [])
    .concat(lesson.realWords || [])
    .concat(dictationCurrentWords(skill.id, lesson.readerLevel || "AB", lesson.realWords || []));
  const text = words.join(" ").toLowerCase();
  const consonants = consonantSoundList(skill.id).filter((sound) => text.includes(sound.replace(/^-|-$/g, "").toLowerCase()));
  const welded = knownWeldedAndExceptions
    .filter(([step]) => isAtLeastSubstep(skill.id, step))
    .map(([, value]) => value)
    .filter((sound) => text.includes(sound.replace(/^-|-$/g, "").toLowerCase()));
  const elements = wordElementList(skill.id).filter((part) => text.includes(part.replace(/^-|-$/g, "").toLowerCase()));
  return []
    .concat(rotate(vowelSoundList(skill.id), 5).map((value) => ({ value, category: "Reverse drill", group: "Sounds" })))
    .concat(rotate(consonants.length ? consonants : consonantSoundList(skill.id), 5).map((value) => ({ value, category: "Reverse drill", group: "Consonants / digraphs" })))
    .concat(rotate(welded.length ? welded : knownWeldedAndExceptions.filter(([step]) => isAtLeastSubstep(skill.id, step)).map(([, value]) => value), 3).map((value) => ({ value, category: "Reverse drill", group: "Welded / glued" })))
    .concat(rotate(elements.length ? elements : wordElementList(skill.id), 2).map((value) => ({ value, category: "Reverse drill", group: "Pfx / Sfx" })));
}

function ttRerollDictationPlan(lesson, skill) {
  return ttDictationPlan(lesson, skill).map((block) => {
    const pool = ttDictationReplacementPool(block.label, lesson, skill);
    const source = pool.length ? pool : block.values || [];
    return {
      ...block,
      values: fillToCount(chooseWords(source, source.length, true), block.values || [], (block.values || []).length)
    };
  });
}

function ttShowCardByWord(word) {
  const index = ttCardDeck.findIndex((card) => card.word === word);
  ttShowCard(index >= 0 ? index : 0);
}

function ttShowCard(index) {
  if (!ttCardDeck.length) {
    ttById("ttCardDisplay").querySelector("strong").textContent = "No cards";
    ttById("ttCardLabel").textContent = "";
    ttById("ttCardDisplay").dataset.type = "";
    ttById("ttCardCount").textContent = "0 of 0";
    return;
  }
  ttCardIndex = (index + ttCardDeck.length) % ttCardDeck.length;
  const card = ttCardDeck[ttCardIndex];
  ttById("ttCardDisplay").querySelector("strong").textContent = card.word;
  ttById("ttCardLabel").textContent = card.label;
  ttById("ttCardDisplay").dataset.type = /hfw/i.test(card.type) ? "hfw" : card.type.toLowerCase();
  ttById("ttCardCount").textContent = `${ttCardIndex + 1} of ${ttCardDeck.length}`;
}

function toggleReviewWord(word, source) {
  const group = ttActiveGroup();
  group.markedReviewWords ||= [];
  const existing = group.markedReviewWords.find((item) => item.word === word);
  if (existing) {
    group.markedReviewWords = group.markedReviewWords.filter((item) => item.word !== word);
  } else {
    group.markedReviewWords.push({
      word,
      source,
      substep: group.substep,
      date: new Date().toISOString()
    });
  }
  saveState();
  ttRenderMarkedWords();
}

function isMarkedReviewWord(word) {
  const group = ttActiveGroup();
  return (group.markedReviewWords || []).some((item) => item.word === word);
}

function ttShowSection2Word(word, substep) {
  const display = ttById("ttSection2Display");
  const hint = ttById("ttSection2Hint");
  const editor = ttById("ttSection2Editor");
  if (!display || !hint) return;
  ttSection2Word = word;
  display.innerHTML = "";
  if (editor) editor.hidden = true;
  if (!word) {
    display.innerHTML = "<span>Tap a word</span>";
    hint.textContent = "One-syllable words show sound cards. Multisyllabic words show syllable cards.";
    return;
  }
  const cards = section2CardsForWord(word, substep);
  display.dataset.mode = cards.mode;
  display.dataset.count = String(cards.items.length);
  display.style.setProperty("--tile-count", String(Math.max(cards.items.length, 1)));
  display.classList.toggle("many-cards", cards.items.length >= 7);
  display.classList.toggle("crowded-cards", cards.items.length >= 9);
  display.classList.toggle("multi-syllable-cards", cards.mode === "syllables" && cards.items.length >= 4);
  display.classList.toggle("long-syllable-cards", cards.mode === "syllables" && cards.items.length >= 5);
  cards.items.forEach((item) => {
    const card = document.createElement("span");
    card.className = `build-card ${item.type}`;
    card.textContent = section2DisplayCardText(item);
    display.appendChild(card);
  });
  hint.textContent = cards.mode === "sounds"
    ? "Sound cards: yellow consonants, pink vowels, green glued/welded sounds."
    : "Syllable / word-part cards: yellow affixes and white syllable or Latin-base cards.";
  ttRenderMarkedWords();
}

function ttUseCustomSection2Word() {
  const input = ttById("ttSection2CustomWord");
  if (!input) return;
  const value = input.value.trim();
  if (!value) return;
  const substep = ttLesson?.substep || ttActiveGroup().substep;
  const clean = cleanCardWord(value);
  if (!clean) return;
  if (/\s/.test(value.trim())) {
    const items = parseSection2CardInput(value, substep);
    if (items.length) {
      const overrides = section2CardOverrides();
      overrides[clean] = {
        mode: "syllables",
        items,
        updatedAt: new Date().toISOString()
      };
      localStorage.setItem("teachToday.section2CardOverrides.v1", JSON.stringify(overrides));
    }
  }
  input.value = "";
  ttShowSection2Word(clean, substep);
}

function ttCurrentSection2Cards() {
  if (!ttSection2Word) return null;
  const substep = ttLesson?.substep || ttActiveGroup().substep;
  return section2CardsForWord(ttSection2Word, substep);
}

function ttEditSection2Cards() {
  const editor = ttById("ttSection2Editor");
  const input = ttById("ttSection2EditInput");
  if (!editor || !input || !ttSection2Word) return;
  const cards = ttCurrentSection2Cards();
  input.value = cards?.items?.length ? cards.items.map(section2EditInputText).join(" ") : "";
  editor.hidden = false;
  input.focus();
  input.select();
}

function ttCancelSection2Edit() {
  const editor = ttById("ttSection2Editor");
  if (editor) editor.hidden = true;
}

function ttSaveSection2Cards() {
  const input = ttById("ttSection2EditInput");
  const editor = ttById("ttSection2Editor");
  if (!input || !ttSection2Word) return;
  const items = parseSection2CardInput(input.value, ttLesson?.substep || ttActiveGroup().substep);
  if (!items.length) return;
  const clean = cleanCardWord(ttSection2Word);
  const overrides = section2CardOverrides();
  overrides[clean] = {
    mode: section2ModeForItems(items),
    items,
    updatedAt: new Date().toISOString()
  };
  localStorage.setItem("teachToday.section2CardOverrides.v1", JSON.stringify(overrides));
  input.value = "";
  if (editor) editor.hidden = true;
  ttShowSection2Word(ttSection2Word, ttLesson?.substep || ttActiveGroup().substep);
}

function section2CardOverrides() {
  try {
    return JSON.parse(localStorage.getItem("teachToday.section2CardOverrides.v1") || "{}");
  } catch {
    return {};
  }
}

function parseSection2CardInput(value, substep) {
  const matches = [...value.matchAll(/\[([^\]]+)\]/g)].map((match) => match[1].trim()).filter(Boolean);
  const rawParts = matches.length ? matches : value.split(/[\s|,]+/).map((part) => part.trim()).filter(Boolean);
  return rawParts.map((part) => {
    const type = section2TypeForPart(part, substep);
    return { text: section2StoredCardText(part, type), type };
  });
}

function section2EditInputText(item) {
  const text = String(item?.text || "").trim();
  if (!text) return "";
  if (item.type === "prefix") return `${text.replace(/-+$/g, "")}-`;
  if (item.type === "suffix") return `-${text.replace(/^-+/g, "")}`;
  if (item.type === "latin") {
    const clean = text.replace(/^-+|-+$/g, "");
    return clean ? `-${clean}-` : text;
  }
  return text;
}

function section2DisplayCardText(item) {
  if (item.type === "prefix") return String(item.text || "").replace(/-+$/g, "");
  if (item.type === "suffix") return String(item.text || "").replace(/^-+/g, "");
  return item.text;
}

function section2StoredCardText(part, type) {
  const text = String(part || "").trim();
  if (type === "prefix") return text.replace(/-+$/g, "").toLowerCase();
  if (type === "suffix") return text.replace(/^-+/g, "").toLowerCase();
  return text.toLowerCase();
}

function section2TypeForPart(part, substep) {
  const clean = part.replace(/^-|-$/g, "").toLowerCase();
  if (part.endsWith("-") && knownPrefixValues(substep).includes(clean)) return "prefix";
  if (part.startsWith("-") && knownSuffixValues(substep).includes(clean)) return "suffix";
  if (part.startsWith("-") && part.endsWith("-")) return "latin";
  if (gluedSoundSet().has(clean)) return "glued";
  if (clean.length === 1) return "aeiou".includes(clean) ? "vowel" : "consonant";
  if (["ch", "ck", "sh", "th", "wh", "qu", "tch", "dge"].includes(clean)) return "consonant";
  return "syllable";
}

function section2ModeForItems(items) {
  return items.some((item) => ["syllable", "prefix", "latin"].includes(item.type)) ? "syllables" : "sounds";
}

function cleanCardWord(word) {
  return String(word || "").toLowerCase().replace(/[^a-z-]/g, "");
}

function ttSaveGeneratedLesson(lesson, group, skill, options = {}) {
  if (!lesson) return null;
  const now = new Date();
  const createdDate = now.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  const createdTime = now.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  const dailyKey = ttPlanDayKey(now);
  const existing = options.upsertDaily === false ? null : ttDailyPlanFor(group, now);
  if (existing) {
    lesson.lessonSequence = existing.lessons?.[0]?.lessonSequence || lesson.lessonSequence || group.lessonSerial || 1;
    lesson.savedPlanId = existing.id;
    existing.lessons = [lesson];
    existing.savedAt = now.toISOString();
    existing.dailyKey = dailyKey;
    existing.title = ttLessonFileName(group, lesson, now);
    existing.tabLabel = ttLessonTabLabel(existing, group);
    existing.status = existing.hasStudentData ? "Taught" : "Saved";
    ttAddLessonTab(existing.id);
    delete appState.lessonDrafts[ttDraftKey(group)];
    saveState();
    ttUpdateSaveStatus(existing);
    return existing;
  }
  group.lessonSerial = (group.lessonSerial || 0) + 1;
  lesson.lessonSequence = group.lessonSerial;
  const plan = {
    id: `teach-plan-${Date.now()}`,
    title: ttLessonFileName(group, lesson, now),
    tabLabel: ttLessonTabLabel({ lessons: [lesson], savedAt: now.toISOString() }, group),
    created: `${createdDate} at ${createdTime}`,
    savedAt: now.toISOString(),
    dailyKey,
    status: "Saved",
    substep: `${skill.id} - ${skill.title}`,
    source: "TeachToday",
    lessons: [lesson]
  };
  lesson.savedPlanId = plan.id;
  group.history ||= [];
  group.history.push(plan);
  group.history = group.history.slice(-50);
  ttAddLessonTab(plan.id);
  delete appState.lessonDrafts[ttDraftKey(group)];
  saveState();
  ttUpdateSaveStatus(plan);
  return plan;
}

function ttSaveCurrentLesson(options = {}) {
  const group = ttActiveGroup();
  const skill = scopeMap.find((item) => item.id === ttLesson?.substep) || activeStep(group);
  if (!ttLesson) ttLesson = createLesson(group, skill, 0, 1);
  delete ttLesson.draftId;
  delete ttLesson.draftSavedAt;
  if (!ttLesson.savedPlanId) {
    ttSaveGeneratedLesson(ttLesson, group, skill, { upsertDaily: !ttLesson.forkedFromPlanId });
    if (options.render !== false) ttRender();
    return;
  }
  const plan = ttCurrentPlan();
  if (!plan) {
    ttLesson.savedPlanId = "";
    ttSaveGeneratedLesson(ttLesson, group, skill);
    if (options.render !== false) ttRender();
    return;
  }
  const now = new Date();
  plan.lessons = [ttLesson];
  plan.savedAt = now.toISOString();
  plan.dailyKey ||= ttPlanDayKey(now);
  plan.title = ttLessonFileName(group, ttLesson, now);
  plan.tabLabel = ttLessonTabLabel(plan, group);
  plan.status = plan.hasStudentData ? "Taught" : "Saved";
  ttAddLessonTab(plan.id);
  delete appState.lessonDrafts[ttDraftKey(group)];
  saveState();
  ttUpdateSaveStatus(plan);
  ttRenderLessonTabs();
  ttRenderSavedLessons(group);
}

function ttNewLesson() {
  ttSection2Word = "";
  ttLesson = ttBuildLesson();
  ttSaveDraftLesson({ status: false });
  history.replaceState(null, "", location.pathname);
  ttRender();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function ttPlanUrl(planId) {
  return `${location.pathname}?group=${encodeURIComponent(ttActiveGroup().id)}&plan=${encodeURIComponent(planId)}`;
}

function ttUpdateSaveStatus(plan) {
  const status = ttById("ttSaveStatus");
  if (!status || !plan) return;
  const lesson = plan.lessons?.[0];
  const page = lesson?.wordlistMeta || "";
  const savedDate = plan.savedAt ? new Date(plan.savedAt) : new Date();
  const date = savedDate.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  const time = savedDate.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  status.textContent = `Saved: ${date} at ${time}${page ? ` - ${page}` : ""}`;
  const group = ttActiveGroup();
  const file = ttById("ttLessonFile");
  if (file && plan.lessons?.[0]) file.textContent = plan.title || ttLessonFileName(group, plan.lessons[0], savedDate);
}

function ttSetDraftSaveStatus(group = ttActiveGroup(), lesson = ttLesson) {
  const status = ttById("ttSaveStatus");
  if (status) {
    status.textContent = lesson?.forkedFromLessonTitle
      ? "Draft copy - original saved lesson is protected"
      : "Draft - click Save when this is the lesson you will use today";
  }
  const file = ttById("ttLessonFile");
  if (file && lesson) file.textContent = `Draft: ${ttLessonFileName(group, lesson)}`;
}

function ttMarkCurrentPlanHasData(lesson = ttLesson) {
  if (!lesson?.savedPlanId) return null;
  const group = ttActiveGroup();
  const plan = (group.history || []).find((item) => item.id === lesson.savedPlanId);
  if (!plan) return null;
  plan.hasStudentData = true;
  plan.status = "Taught";
  plan.lastStudentDataAt = new Date().toISOString();
  return plan;
}

function ttCurrentLessonRecordMeta(lesson = ttLesson) {
  const group = ttActiveGroup();
  const plan = (group.history || []).find((item) => item.id === lesson?.savedPlanId);
  return {
    lessonId: lesson?.id || "",
    planId: plan?.id || lesson?.savedPlanId || "",
    lessonTitle: plan?.title || (lesson ? ttLessonFileName(group, lesson, plan?.savedAt ? new Date(plan.savedAt) : new Date()) : ""),
    lessonSavedAt: plan?.savedAt || ""
  };
}

function ttEnsureCurrentLessonSavedForData() {
  ttSaveCurrentLesson({ render: false });
  return ttMarkCurrentPlanHasData(ttLesson);
}

function ttOpenPdfLessonPlan() {
  ttSaveCurrentLesson();
  const group = ttActiveGroup();
  const skill = scopeMap.find((item) => item.id === ttLesson?.substep) || activeStep(group);
  const plan = ttCurrentPlan();
  const savedDate = plan?.savedAt ? new Date(plan.savedAt) : new Date();
  const html = ttLessonPlanDocumentHtml(group, skill, ttLesson, plan, savedDate);
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("The browser blocked the lesson PDF window. Please allow pop-ups for Teach Today, then try again.");
    return;
  }
  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
}

async function ttOpenWilsonLessonPlan() {
  const outputWindow = window.open("", "_blank");
  try {
    ttSaveCurrentLesson();
    const group = ttActiveGroup();
    const skill = scopeMap.find((item) => item.id === ttLesson?.substep) || activeStep(group);
    const plan = ttCurrentPlan();
    const savedDate = plan?.savedAt ? new Date(plan.savedAt) : new Date();
    const pdfBytes = await ttBuildWilsonLessonPlanPdf(group, skill, ttLesson, plan, savedDate);
    const blob = new Blob([pdfBytes], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const filename = `${ttLessonExportBaseName(group, ttLesson, plan, savedDate)} - WRS.pdf`;
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    if (outputWindow) {
      outputWindow.location.href = url;
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } else {
      setTimeout(() => URL.revokeObjectURL(url), 20000);
      alert("Wilson LP was created. If it did not open, check your downloads.");
    }
  } catch (error) {
    if (outputWindow) outputWindow.close();
    console.error(error);
    alert(`I could not create the Wilson LP yet: ${error.message || error}`);
  }
}

async function ttBuildWilsonLessonPlanPdf(group, skill, lesson, plan, savedDate) {
  if (!window.PDFLib?.PDFDocument) throw new Error("PDF helper did not load. Refresh Teach Today and try again.");
  if (!window.wilsonLessonPlanTemplateBase64) throw new Error("Wilson lesson plan template did not load.");
  const { PDFDocument, StandardFonts } = window.PDFLib;
  const templateBytes = ttBase64ToUint8Array(window.wilsonLessonPlanTemplateBase64);
  const pdfDoc = await PDFDocument.load(templateBytes);
  const form = pdfDoc.getForm();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const data = ttWilsonLessonPlanData(group, skill, lesson, plan, savedDate);

  Object.entries(data.text).forEach(([name, value]) => ttSetPdfTextField(form, name, value));
  data.checks.forEach((name) => ttCheckPdfField(form, name));
  form.updateFieldAppearances(font);
  form.flatten();
  return pdfDoc.save();
}

function ttWilsonLessonPlanData(group, skill, lesson, plan, savedDate) {
  const date = savedDate.toLocaleDateString(undefined, { month: "numeric", day: "numeric", year: "2-digit" });
  const sounds = soundsForSubstep(skill.id);
  const dictationPlan = ttActiveDictationPlan(lesson, skill);
  const dictationBlock = (label) => dictationPlan.find((item) => item.label.toLowerCase().includes(label))?.values || [];
  const section6Targets = targetSoundItemsForLesson(lesson, skill);
  const section6ByGroup = (pattern) => section6Targets.filter((item) => pattern.test(item.group || "")).map((item) => item.value);
  const part7Review = lesson.sectionSevenReviewWords || dictationReviewWords(skill.id, lesson.readerLevel || "AB");
  const part7Current = lesson.sectionSevenCurrentWords || dictationCurrentWords(skill.id, lesson.readerLevel || "AB", lesson.realWords || []);
  const part7Hfw = lesson.sectionSevenHfwWords || hfwWordsForSubstep(skill.id, lesson);
  const section3Review = lesson.sectionThreeReviewWords || section3ReviewCards(lesson);
  const section3Current = lesson.sectionThreeCurrentWords || section3CurrentCards(lesson);
  const wordElements = dictationBlock("word elements");
  const phrases = dictationBlock("phrases");
  const sentences = dictationBlock("sentences");
  const concept = `${skill.title}: ${skill.target}`;
  const lessonNumber = lesson.lessonSequence || group.lessonSerial || "";
  const level = lesson.readerLevel || "AB";
  const notebookItems = ttNewNotebookItemsForSubstep(skill.id);
  const section3VocabularyWord = (section3Current || section3Review || []).find(Boolean) || "";
  const text = {
    "DATE": date,
    "Lesson Number": lessonNumber ? String(lessonNumber) : "",
    "Student Name/Group": (group.students || []).join(", "),
    "Substep": skill.id,
    "CONCEPTS TO WEAVE": concept,
    "TROUBLE SPOTS": ttWilsonTroubleSpots(group, lesson),
    "1 SQD Vowels": sounds.vowels,
    "1 SQD CONSONANTS": sounds.consonants,
    "1 SQD WELDED": sounds.welded,
    "1 SQD ADD TO NOTEBOOK": ttJoinLines(notebookItems),
    "1 SQD DRILL LEADER IF GROUP": (group.students || []).join(", "),
    "2 REVIEW CONCEPTS": `Review ${priorSubstep(skill.id)} and trouble patterns.`,
    "2 REVIEW WORDS": ttJoinLines(lesson.sectionTwoReviewWords),
    "2 CURRENT CONCEPTS": concept,
    "CURRENT WORDS 1": ttJoinLines(lesson.sectionTwoCurrentWords || lesson.realWords),
    "2 ADD TO NOTEBOOK": ttJoinLines(notebookItems),
    "3 SUBSTEPS": skill.id,
    "3 WC ACTIVITY": `Review: ${ttJoinWords(section3Review)}\nCurrent: ${ttJoinWords(section3Current)}`,
    "WC 3 ADD NEW TO NOTEBOOK": section3VocabularyWord,
    "3 WC HIGH FREQUENCY WORDS": ttJoinWords(lesson.highFrequencyWords),
    "4 WR Practice Page": lesson.wordlistPageNumber || "",
    "4 WR Charting Page": lesson.wordlistPageNumber || "",
    "4 WR Errors": ttWilsonChartingMisses(group, lesson),
    "4 WR Activity": `Chart ${level} ${lesson.chartHalf || "bottom"} half. Goal: 12/15 accurate; 14/15 fluency; 12/15 in 35 sec for automaticity.`,
    "5 SR Student Reader Page": lesson.sentencePageNumber || "",
    "5 SR Errors": "Mark missed words and notes during sentence reading.",
    "5 SR Notes": `HFW: ${ttJoinWords(lesson.highFrequencyWords)}\n${ttJoinLines((lesson.readerSentences || []).slice(0, 3))}`,
    "6 QD VOWELS": ttJoinWords(section6ByGroup(/sounds/i).slice(0, 5)),
    "6 QD CONSONANTS": ttJoinWords(section6ByGroup(/consonants|digraphs/i)),
    "6 QD WELDED": ttJoinWords(section6ByGroup(/welded|glued/i)),
    "6 QD WORD ELEMENTS": ttJoinWords(section6ByGroup(/pfx|sfx|element/i)),
    "7 TR REVIEW CONCEPTS": `Review spelling patterns from ${priorSubstep(skill.id)}.`,
    "7 TR Review Words": ttJoinLines(part7Review),
    "7 TR CURRENT CONCEPTS": concept,
    "7 TR CURRENT WORDS": ttJoinLines(part7Current),
    "7 TR HIGH FREQUENCY WORDS": ttJoinWords(part7Hfw),
    "7 TR ADD TO NOTEBOOK": ttJoinLines(notebookItems),
    "8 WWD Sounds": ttJoinLines(dictationBlock("sounds")),
    "8 WWD Word Elements": ttJoinLines(wordElements),
    "8 WWD Real Words": ttJoinLines(dictationBlock("real words")),
    "8 WWD Nonsense Words": ttJoinLines(dictationBlock("nonsense")),
    "8 WWD HIGH FREQUENCY WORD PHRASES 1": phrases[0] || "",
    "8 WWD HIGH FREQUENCY WORD PHRASES 2": phrases[1] || "",
    "8 WWD HIGH FREQUENCY WORD PHRASES 3": phrases[2] || "",
    "8 WWD SENTENCES": ttJoinLines(sentences),
    "9 CTP DEVELOP ORAL EXPRESSIVE LANGUAGE SKILLS WITH RETELL": "",
    "9 CTP Source Student Reader Text": "",
    "9 CTP Vocabulary": "",
    "9 CTP Follow Up ?": "",
    "10 LRF Sources": "",
    "10 LRF Title": "",
    "10 LRF Pages": "",
    "10 LRF Notes": ""
  };
  const checks = [
    "Introduction Check",
    "Word Type Real",
    level === "A" ? "4 WR Student Reader A Check" : level === "B" ? "4 WR Student Reader B Check" : "4 WR Student Reader AB Check",
    "4 WR Student Reader Real",
    lesson.chartHalf === "top" ? "4 WR Charting Page Top Check" : "4 WR Charting Page Bottom Check",
    level === "B" ? "5 SR Student Reader B" : "5 SR Student Reader AB"
  ];
  return { text, checks };
}

function ttSetPdfTextField(form, name, value) {
  try {
    const field = form.getTextField(name);
    field.setText(ttPdfFieldText(value));
    if (String(value || "").length > 120 || String(value || "").includes("\n")) field.setFontSize(7.5);
    else field.setFontSize(9);
  } catch {
    /* Template field may not exist in older copies. */
  }
}

function ttCheckPdfField(form, name) {
  try {
    form.getCheckBox(name).check();
  } catch {
    /* Some button fields are radio-style in older template copies. */
  }
}

function ttPdfFieldText(value) {
  return ttPdfSafeText(String(value || "").replace(/\s+\n/g, "\n").replace(/\n\s+/g, "\n").trim());
}

function ttPdfSafeText(value) {
  const replacements = {
    "ă": "a",
    "ĕ": "e",
    "ĭ": "i",
    "ŏ": "o",
    "ŭ": "u",
    "ā": "a",
    "ē": "e",
    "ī": "i",
    "ō": "o",
    "ū": "u",
    "ü": "u",
    "ô": "aw",
    "’": "'",
    "“": "\"",
    "”": "\"",
    "–": "-",
    "—": "-",
    "•": "-"
  };
  return String(value || "").replace(/[^\x00-\x7F]/g, (char) => replacements[char] || "");
}

function ttJoinWords(values = []) {
  return (values || []).filter(Boolean).join(", ");
}

function ttJoinLines(values = []) {
  return (values || []).filter(Boolean).join("\n");
}

function ttNotebookNote(substep) {
  const elements = wordElementList(substep).slice(0, 6);
  return elements.length ? `Add/review: ${ttJoinWords(elements)}` : "Review current sound cards.";
}

function ttNewNotebookItemsForSubstep(substep) {
  const exact = ([introduced]) => introduced === substep;
  const items = []
    .concat(knownWeldedAndExceptions.filter(exact).map(([, value]) => value))
    .concat(knownPrefixes.filter(exact).map(([, value]) => value))
    .concat(knownLatinBases.filter(exact).map(([, value]) => value))
    .concat(knownSuffixes.filter(exact).map(([, value]) => value));
  const consonantAdditions = {
    "7.1": ["c=/s/", "g=/j/"],
    "7.2": ["ce", "ge", "dge"],
    "7.3": ["ph", "tch"]
  };
  return [...new Set(items.concat(consonantAdditions[substep] || []))];
}

function ttWilsonTroubleSpots(group, lesson) {
  const recentMisses = (group.chartResults || [])
    .slice(-5)
    .flatMap((record) => record.wrongWords || [])
    .slice(-8);
  const trouble = (group.trouble || []).concat(recentMisses);
  return [...new Set(trouble)].filter(Boolean).join(", ") || lesson.teacherMove || "";
}

function ttWilsonChartingMisses(group, lesson) {
  const today = new Date().toISOString().slice(0, 10);
  const records = (appState.masterRecords || [])
    .filter((record) => record.groupId === group.id)
    .filter((record) => record.substep === lesson.substep)
    .filter((record) => String(record.wordlistPage) === String(lesson.wordlistPageNumber || ""))
    .filter((record) => String(record.date || "").slice(0, 10) === today)
    .slice(-4);
  return records.flatMap((record) => {
    const misses = (record.wordRecords || [])
      .filter((item) => item.section === record.chartHalf && !item.correct)
      .map((item) => item.said ? `${item.word} -> ${item.said}` : item.word);
    return misses.length ? [`${record.student}: ${misses.join(", ")}`] : [];
  }).join("\n");
}

function ttBase64ToUint8Array(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

function ttSafeFileName(value) {
  return String(value || "Teach Today Lesson").replace(/[\\/:*?"<>|]+/g, "-").replace(/\s+/g, " ").trim();
}

function ttLessonExportBaseName(group, lesson, plan, savedDate) {
  return ttSafeFileName(plan?.title || ttLessonFileName(group, lesson, savedDate));
}

function ttLessonPlanDocumentHtml(group, skill, lesson, plan, savedDate) {
  const title = `${ttLessonExportBaseName(group, lesson, plan, savedDate)} - TT`;
  const date = savedDate.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  const time = savedDate.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  const sounds = soundsForSubstep(skill.id);
  const section3Review = lesson.sectionThreeReviewWords || section3ReviewCards(lesson);
  const section3Current = lesson.sectionThreeCurrentWords || section3CurrentCards(lesson);
  const part7Review = lesson.sectionSevenReviewWords || dictationReviewWords(skill.id, lesson.readerLevel || "AB");
  const part7Nonsense = lesson.sectionSevenNonsenseWords || readerNonsenseWordsForReview(priorSubstep(skill.id), skill.id).slice(0, 2);
  const part7Current = lesson.sectionSevenCurrentWords || dictationCurrentWords(skill.id, lesson.readerLevel || "AB", lesson.realWords || []);
  const dictationPlan = ttActiveDictationPlan(lesson, skill);
  const section6Targets = targetSoundItemsForLesson(lesson, skill).map((item) => item.value);
  const students = (group.students || []).map((student) => `<span>${escapeHtml(student)}</span>`).join("");
  const teacherNotes = [
    "Charting goal: 12+/15 accurate. Automaticity: 12+/15 under 35 sec. Fluency: 14+/15.",
    "Use AB by default for elementary. Drop to A for support or move to B for challenge.",
    lesson.teacherMove || ""
  ].filter(Boolean);

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      background: #e8f1f5;
      color: #142033;
      font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif;
      line-height: 1.25;
    }
    .print-actions {
      position: sticky;
      top: 0;
      z-index: 5;
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      padding: 10px;
      background: #ffffff;
      border-bottom: 1px solid #cbd5e1;
    }
    .print-actions button {
      border: 1px solid #0f766e;
      border-radius: 999px;
      padding: 8px 14px;
      background: #0f766e;
      color: #fff;
      font-weight: 900;
      cursor: pointer;
    }
    .page {
      width: 8.5in;
      min-height: 11in;
      margin: 14px auto;
      padding: 0.34in;
      background: #fff;
      border: 1px solid #d1d5db;
      box-shadow: 0 8px 30px rgba(15, 23, 42, 0.12);
    }
    .cover {
      border: 2px solid #0f766e;
      border-radius: 6px;
      padding: 7px 10px;
      background: #dff7ec;
      text-align: center;
      font-size: 13px;
      font-weight: 950;
      letter-spacing: 0.03em;
      text-transform: uppercase;
    }
    .hero {
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 12px;
      margin: 10px 0 8px;
      border-left: 5px solid #0f766e;
      border-radius: 4px;
      padding: 9px 10px;
      background: #f8fafc;
    }
    .eyebrow {
      margin: 0 0 2px;
      color: #64748b;
      font-size: 9px;
      font-weight: 950;
      letter-spacing: 0.1em;
      text-transform: uppercase;
    }
    h1, h2, h3, p { margin: 0; }
    h1 { font-size: 24px; line-height: 1; }
    .subtitle { color: #334155; font-size: 12px; }
    .meta { text-align: right; color: #334155; font-size: 11px; font-weight: 800; }
    .skill-strip {
      margin-top: 7px;
      border-radius: 4px;
      padding: 7px 9px;
      background: #eaf5ef;
      color: #14532d;
      font-size: 11px;
      font-weight: 850;
    }
    .section {
      margin-top: 8px;
      border: 1px solid #cbd5e1;
      border-left: 5px solid var(--accent, #0f766e);
      border-radius: 5px;
      padding: 8px 10px;
      break-inside: avoid;
    }
    .section-title {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      margin-bottom: 6px;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 5px;
    }
    .section-title h2 {
      display: flex;
      align-items: center;
      gap: 7px;
      font-size: 15px;
    }
    .tag {
      display: inline-flex;
      align-items: center;
      border-radius: 4px;
      padding: 2px 7px;
      background: var(--accent, #0f766e);
      color: #fff;
      font-size: 9px;
      font-weight: 950;
      letter-spacing: 0.05em;
      text-transform: uppercase;
    }
    .ref {
      color: #64748b;
      font-size: 10px;
      font-weight: 850;
      text-align: right;
    }
    .note {
      margin-bottom: 6px;
      border: 1px solid #bfdbfe;
      border-radius: 4px;
      padding: 6px 8px;
      background: #eff6ff;
      color: #1e3a8a;
      font-size: 10.5px;
    }
    .grid2 { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
    .grid3 { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
    .label {
      margin-bottom: 3px;
      color: #475569;
      font-size: 9px;
      font-weight: 950;
      letter-spacing: 0.06em;
      text-transform: uppercase;
    }
    .small { color: #475569; font-size: 10px; }
    .chips { display: flex; flex-wrap: wrap; gap: 4px; }
    .chip {
      border: 1px solid #cbd5e1;
      border-radius: 999px;
      padding: 3px 7px;
      background: #f8fafc;
      font-size: 11px;
      font-weight: 850;
    }
    .chip.green { border-color: #86efac; background: #f0fdf4; color: #14532d; }
    .chip.purple { border-color: #d8b4fe; background: #faf5ff; color: #6b21a8; }
    .word-grid {
      display: grid;
      grid-template-columns: repeat(5, minmax(0, 1fr));
      gap: 4px;
      list-style: none;
      margin: 0;
      padding: 0;
    }
    .word-grid li {
      min-height: 22px;
      border: 1px solid #dbe3ed;
      border-radius: 4px;
      padding: 3px 5px;
      background: #fbfdff;
      font-family: "Courier New", monospace;
      font-size: 11px;
      font-weight: 700;
    }
    .word-grid.chart { grid-template-columns: repeat(3, minmax(0, 1fr)); }
    .word-grid.chart li {
      display: grid;
      grid-template-columns: 23px 1fr;
      border-width: 0 0 1px;
      border-radius: 0;
      background: transparent;
      font-size: 12px;
    }
    .sentence-list {
      margin: 0;
      padding-left: 19px;
      font-size: 11px;
    }
    .sentence-list li {
      padding: 3px 0;
      border-bottom: 1px solid #eef2f7;
    }
    .dictation-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 11px;
    }
    .dictation-table th {
      width: 130px;
      color: #0f766e;
      text-align: left;
      vertical-align: top;
      font-size: 10px;
      text-transform: uppercase;
    }
    .dictation-table th, .dictation-table td {
      border: 1px solid #dbe3ed;
      padding: 5px 6px;
    }
    .write-lines {
      display: grid;
      gap: 5px;
      margin-top: 5px;
    }
    .write-lines span {
      display: block;
      min-height: 19px;
      border-bottom: 1px solid #cbd5e1;
    }
    .page-two { break-before: page; }
    @page { size: Letter; margin: 0.25in; }
    @media print {
      body { background: #fff; }
      .print-actions { display: none; }
      .page {
        width: auto;
        min-height: auto;
        margin: 0;
        border: 0;
        box-shadow: none;
        page-break-after: always;
      }
      .page:last-child { page-break-after: auto; }
    }
  </style>
</head>
<body>
  <div class="print-actions">
    <button type="button" onclick="window.print()">Print / Save PDF</button>
  </div>
  <main>
    <section class="page">
      <div class="cover">TT Lesson Plan | ${escapeHtml(skill.id)} | ${escapeHtml(group.name)} | ${escapeHtml(lesson.readerLevel || "AB")} | ${escapeHtml(date)}</div>
      <header class="hero">
        <div>
          <p class="eyebrow">Wilson Reading System Inspired Lesson</p>
          <h1>Substep ${escapeHtml(skill.id)} <span class="small">${escapeHtml(skill.title)}</span></h1>
          <p class="subtitle">${escapeHtml(skill.pattern)} | ${escapeHtml(lesson.day || "Lesson")}</p>
          <div class="skill-strip">Skill focus: ${escapeHtml(skill.teacherCue || lesson.focus || "Use controlled reading and spelling from today's substep.")}</div>
        </div>
        <div class="meta">
          <p>${escapeHtml(date)}</p>
          <p>${escapeHtml(time)}</p>
          <p>${escapeHtml(lesson.wordlistMeta || "")}</p>
          <p>${escapeHtml(group.name)}</p>
        </div>
      </header>

      ${ttPlanSection("1", "Sounds Quick Drill", lesson.substep, `
        <div class="grid2">
          ${ttPlanFact("Vowels", sounds.vowels)}
          ${ttPlanFact("Consonants", sounds.consonants)}
          ${ttPlanFact("Glued / Exceptions", sounds.welded)}
          ${ttPlanFact("Elements", `Prefixes: ${sounds.prefixes}; Suffixes: ${sounds.suffixes}; Latin bases: ${sounds.latinBases}`)}
        </div>
      `, "#2563eb")}

      ${ttPlanSection("2", "Teach & Review Concepts", lesson.wordlistMeta, `
        <div class="note"><strong>Teacher move:</strong> Build one current word. Ask students to identify the vowel/syllable type, mark word parts, then blend or read the full word.</div>
        <div class="grid2">
          <div>${ttPlanLabel("Review - prior concepts")}${ttPlanChips(lesson.sectionTwoReviewWords || [], "purple")}</div>
          <div>${ttPlanLabel("Current - from today's page")}${ttPlanChips(lesson.sectionTwoCurrentWords || [], "green")}</div>
        </div>
      `, "#7c3aed")}

      ${ttPlanSection("3", "Word Cards Activity", `${lesson.substep} cards`, `
        <div class="grid2">
          <div>${ttPlanLabel("Review cards")}${ttPlanChips(section3Review, "purple")}</div>
          <div>${ttPlanLabel("Current cards")}${ttPlanChips(section3Current, "green")}</div>
        </div>
        <p class="small">Flash cards quickly. Ask: prefix? suffix? glued sound? Latin base? Circle or box the part with a finger.</p>
      `, "#f97316")}

      ${ttPlanSection("4", "Wordlist Charting", lesson.wordlistMeta, `
        <div class="grid2">
          <div>${ttPlanLabel("Top 15")}${ttPlanNumberedWords(lesson.realWords || [], "chart")}</div>
          <div>${ttPlanLabel("Bottom 15")}${ttPlanNumberedWords(lesson.nonsenseWords || [], "chart")}</div>
        </div>
        <div class="grid2 small" style="margin-top:6px;">
          <p><strong>Students:</strong> ${students || "__________"}</p>
          <p><strong>Score:</strong> ___/15 correct | ___ sec/15w | repeat / advance</p>
        </div>
      `, "#15803d")}

      ${ttPlanSection("5", "Sentence Reading", lesson.sentenceMeta, `
        ${ttPlanLabel("High-frequency words")}${ttPlanChips(lesson.highFrequencyWords || [], "green")}
        <ol class="sentence-list">${(lesson.readerSentences || []).slice(0, 10).map((sentence) => `<li>${escapeHtml(sentence)}</li>`).join("") || "<li>Use assigned Reader sentence page.</li>"}</ol>
      `, "#365314")}
    </section>

    <section class="page page-two">
      ${ttPlanSection("6", "Quick Drill in Reverse", `${lesson.substep} reverse drill`, `
        <div class="note">Dictate sounds and elements. Students repeat the sound/element and write it. Prioritize today’s target words and known trouble spots.</div>
        ${ttPlanLabel("Today's quick targets")}${ttPlanChips(section6Targets, "green")}
        <div class="write-lines"><span></span><span></span></div>
      `, "#2563eb")}

      ${ttPlanSection("7", "Teach & Review Concepts for Spelling", `${lesson.substep} spelling`, `
        <div class="grid3">
          <div>${ttPlanLabel("Review")}${ttPlanChips(part7Review, "purple")}</div>
          <div>${ttPlanLabel("Nonsense")}${ttPlanChips(part7Nonsense, "purple")}</div>
          <div>${ttPlanLabel("Current")}${ttPlanChips(part7Current, "green")}</div>
        </div>
        ${ttPlanLabel("High-frequency words")}${ttPlanChips(hfwWordsForSubstep(skill.id, lesson), "green")}
        <p class="small">Dictate one word at a time. Students segment syllables, tap sounds in each syllable, then spell with tiles or syllable cards.</p>
      `, "#ea580c")}

      ${ttPlanSection("8", "Dictation", `Dictation Book ${lesson.substep}`, `
        <table class="dictation-table">
          <tbody>
            ${dictationPlan.map((item) => `<tr><th>${escapeHtml(item.label)}</th><td>${ttPlanChips(item.values || [], "")}</td></tr>`).join("")}
          </tbody>
        </table>
        <div class="write-lines"><span></span><span></span><span></span><span></span></div>
      `, "#b45309")}

      ${ttPlanSection("9", "Controlled Passage", `Reader ${lesson.reader}, p. ${lesson.passagePageNumber || "--"} (${lesson.passageLevel || lesson.readerLevel})`, `
        <p class="small">${escapeHtml(lesson.passage || "Use the assigned Reader passage page. Preview three target words before reading.")}</p>
        <div class="write-lines"><span></span><span></span></div>
      `, "#0369a1")}

      ${ttPlanSection("10", "Comprehension / Wrap-Up", "notes", `
        <div class="grid2">
          <div>
            ${ttPlanLabel("Teacher reminders")}
            <ul class="sentence-list">${teacherNotes.map((note) => `<li>${escapeHtml(note)}</li>`).join("")}</ul>
          </div>
          <div>
            ${ttPlanLabel("Notes / next lesson")}
            <div class="write-lines"><span></span><span></span><span></span><span></span><span></span></div>
          </div>
        </div>
      `, "#0f766e")}
    </section>
  </main>
  <script>
    window.addEventListener("load", () => setTimeout(() => window.print(), 350));
  </script>
</body>
</html>`;
}

function ttPlanSection(number, title, ref, body, accent) {
  return `<section class="section" style="--accent:${accent};">
    <div class="section-title">
      <h2><span class="tag">Section ${number}</span>${escapeHtml(title)}</h2>
      <p class="ref">${escapeHtml(ref || "")}</p>
    </div>
    ${body}
  </section>`;
}

function ttPlanFact(label, value) {
  return `<div><p class="label">${escapeHtml(label)}</p><p class="small">${escapeHtml(value || "n/a")}</p></div>`;
}

function ttPlanLabel(label) {
  return `<p class="label">${escapeHtml(label)}</p>`;
}

function ttPlanChips(values = [], color = "") {
  const items = (values || []).filter(Boolean);
  if (!items.length) return `<div class="chips"><span class="chip">n/a</span></div>`;
  return `<div class="chips">${items.map((value) => `<span class="chip ${color}">${escapeHtml(value)}</span>`).join("")}</div>`;
}

function ttPlanNumberedWords(words = [], mode = "") {
  const items = (words || []).slice(0, 15);
  return `<ol class="word-grid ${mode}">${items.map((word, index) => `<li><span>${index + 1}.</span><strong>${escapeHtml(word)}</strong></li>`).join("")}</ol>`;
}

const ttCloudSyncFileName = "teach-today-cloud-sync.json";
const ttCloudSyncDbName = "teachTodayCloudSync.v1";
const ttCloudSyncStore = "handles";
const ttCloudSyncHandleKey = "syncDirectory";
let ttCloudSyncTimer = null;
let ttCloudSyncBusy = false;
let ttCloudSyncPending = false;

const ttFirebaseConfig = {
  apiKey: "AIzaSyAQxODRvRAINGXfSxlqTxiyhkeisIPQLEs",
  authDomain: "teach-today-35149.firebaseapp.com",
  projectId: "teach-today-35149",
  storageBucket: "teach-today-35149.firebasestorage.app",
  messagingSenderId: "506415947825",
  appId: "1:506415947825:web:9415befdc50d928eccb510"
};
const ttFirebaseDocPath = ["teachTodaySync", "main"];
const ttFirebaseSdkVersion = "10.12.5";
const ttFirebaseChunkSize = 350000;
let ttFirebaseSdkPromise = null;
let ttFirebaseTimer = null;
let ttFirebaseBusy = false;
let ttFirebasePending = false;

function ttBackupPayload(now = new Date()) {
  return {
    kind: "TeachTodayBackup",
    version: 1,
    exportedAt: now.toISOString(),
    appState,
    section2CardOverrides: section2CardOverrides()
  };
}

function ttBackupFileStamp(date = new Date()) {
  const year = date.getFullYear();
  const monthNumber = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const monthName = date.toLocaleString("en-US", { month: "short" });
  const hour12 = date.getHours() % 12 || 12;
  const hour = String(hour12).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");
  const meridiem = date.getHours() >= 12 ? "pm" : "am";
  return `${year}-${monthNumber}-${day}-${monthName}-${hour}-${minute}-${meridiem}`;
}

async function ttFirebaseSdk() {
  if (ttFirebaseSdkPromise) return ttFirebaseSdkPromise;
  ttFirebaseSdkPromise = Promise.all([
    import(`https://www.gstatic.com/firebasejs/${ttFirebaseSdkVersion}/firebase-app.js`),
    import(`https://www.gstatic.com/firebasejs/${ttFirebaseSdkVersion}/firebase-firestore.js`)
  ]).then(([appModule, firestoreModule]) => {
    const firebaseApp = appModule.initializeApp(ttFirebaseConfig);
    const firestoreDb = firestoreModule.getFirestore(firebaseApp);
    return { ...firestoreModule, firestoreDb };
  });
  return ttFirebaseSdkPromise;
}

async function ttFirebaseReadPayload() {
  const { firestoreDb, doc, getDoc } = await ttFirebaseSdk();
  const snapshot = await getDoc(doc(firestoreDb, ...ttFirebaseDocPath));
  if (!snapshot.exists()) return null;
  const data = snapshot.data();
  if (data?.payload) return data.payload;
  if (!data?.chunkCount) return null;
  const chunks = [];
  for (let index = 0; index < data.chunkCount; index += 1) {
    const id = String(index).padStart(4, "0");
    const chunkSnapshot = await getDoc(doc(firestoreDb, ...ttFirebaseDocPath, "chunks", id));
    if (!chunkSnapshot.exists()) return null;
    chunks.push(chunkSnapshot.data()?.text || "");
  }
  return JSON.parse(chunks.join(""));
}

async function ttFirebaseRestoreIfNewer() {
  const payload = await ttFirebaseReadPayload();
  const restoredState = payload?.appState || payload;
  if (!restoredState?.groups || !Array.isArray(restoredState.groups)) return false;
  if (!ttShouldRestorePayload(payload)) return false;
  localStorage.setItem("dyslexiaInstructionEngine.v2", JSON.stringify(restoredState));
  if (payload.section2CardOverrides) {
    localStorage.setItem("teachToday.section2CardOverrides.v1", JSON.stringify(payload.section2CardOverrides));
  }
  localStorage.setItem("teachToday.lastFirebaseSyncAt", payload.exportedAt || new Date().toISOString());
  localStorage.setItem("teachToday.firebaseSyncStatus", "Loaded newer Firebase data.");
  location.reload();
  return true;
}

async function ttFirebaseSyncWrite(reason = "Saved to Firebase.") {
  if (ttFirebaseBusy) {
    ttFirebasePending = true;
    return;
  }
  ttFirebaseBusy = true;
  try {
    const remotePayload = await ttFirebaseReadPayload();
    if (ttShouldRestorePayload(remotePayload)) {
      await ttFirebaseRestoreIfNewer();
      return;
    }
    const { firestoreDb, doc, setDoc, serverTimestamp } = await ttFirebaseSdk();
    const now = new Date();
    const payload = ttBackupPayload(now);
    const serialized = JSON.stringify(payload);
    const chunkCount = Math.ceil(serialized.length / ttFirebaseChunkSize);
    for (let index = 0; index < chunkCount; index += 1) {
      const id = String(index).padStart(4, "0");
      await setDoc(doc(firestoreDb, ...ttFirebaseDocPath, "chunks", id), {
        index,
        text: serialized.slice(index * ttFirebaseChunkSize, (index + 1) * ttFirebaseChunkSize)
      });
    }
    await setDoc(doc(firestoreDb, ...ttFirebaseDocPath), {
      kind: "TeachTodayFirebaseSync",
      version: 2,
      updatedAt: serverTimestamp(),
      exportedAt: payload.exportedAt,
      chunkCount,
      chunkSize: ttFirebaseChunkSize,
      byteLength: new Blob([serialized]).size
    });
    localStorage.setItem("teachToday.lastFirebaseSyncAt", now.toISOString());
    localStorage.setItem("teachToday.firebaseSyncStatus", reason);
  } catch (error) {
    const detail = error?.code || error?.message || "unknown error";
    console.warn("Teach Today Firebase sync failed:", error);
    localStorage.setItem("teachToday.firebaseSyncStatus", `Firebase could not save (${detail}).`);
  } finally {
    ttFirebaseBusy = false;
    ttRenderDataCenter();
    if (ttFirebasePending) {
      ttFirebasePending = false;
      ttQueueFirebaseSync();
    }
  }
}

function ttQueueFirebaseSync() {
  clearTimeout(ttFirebaseTimer);
  ttFirebaseTimer = setTimeout(() => ttFirebaseSyncWrite(), 1200);
}

async function ttSyncFirebaseAndLocalNow() {
  await Promise.all([
    ttFirebaseSyncWrite("Saved to Firebase now."),
    ttCloudSyncWrite("Saved local backup file now.")
  ]);
}

async function ttInitFirebaseSync() {
  try {
    await ttFirebaseRestoreIfNewer();
    ttQueueFirebaseSync();
    localStorage.setItem("teachToday.firebaseSyncStatus", "Firebase internet sync is on.");
  } catch (error) {
    const detail = error?.code || error?.message || "unknown error";
    console.warn("Teach Today Firebase startup failed:", error);
    localStorage.setItem("teachToday.firebaseSyncStatus", `Firebase is not reachable yet (${detail}).`);
  } finally {
    ttRenderDataCenter();
  }
}

function ttBackupData() {
  const now = new Date();
  const payload = ttBackupPayload(now);
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  const stamp = now.toISOString().slice(0, 16).replace("T", "-").replace(":", "");
  link.download = `teach-today-backup-${stamp}.json`;
  link.click();
  URL.revokeObjectURL(url);
  localStorage.setItem("teachToday.lastBackupAt", now.toISOString());
  ttRenderDataCenter();
}

function ttCloudSyncSupported() {
  return Boolean(window.showDirectoryPicker && window.indexedDB);
}

function ttOpenCloudSyncDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(ttCloudSyncDbName, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(ttCloudSyncStore);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function ttCloudSyncStoreValue(key, value) {
  const db = await ttOpenCloudSyncDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(ttCloudSyncStore, "readwrite");
    transaction.objectStore(ttCloudSyncStore).put(value, key);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

async function ttCloudSyncGetValue(key) {
  const db = await ttOpenCloudSyncDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(ttCloudSyncStore, "readonly");
    const request = transaction.objectStore(ttCloudSyncStore).get(key);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

async function ttCloudSyncPermission(handle, write = false, request = false) {
  if (!handle) return false;
  const options = { mode: write ? "readwrite" : "read" };
  if ((await handle.queryPermission(options)) === "granted") return true;
  if (!request) return false;
  return (await handle.requestPermission(options)) === "granted";
}

async function ttCloudSyncReadPayload(handle) {
  try {
    const fileHandle = await handle.getFileHandle(ttCloudSyncFileName);
    const file = await fileHandle.getFile();
    return JSON.parse(await file.text());
  } catch {
    return null;
  }
}

function ttPayloadTime(payload) {
  const state = payload?.appState || payload;
  return new Date(state?.lastSavedAt || payload?.exportedAt || 0).getTime() || 0;
}

function ttLocalSaveTime() {
  return new Date(appState?.lastSavedAt || 0).getTime() || 0;
}

function ttStateDataScore(state = appState) {
  const groups = state?.groups || [];
  return (state?.masterRecords || []).length
    + groups.reduce((sum, group) =>
      sum
      + (group.history || []).length
      + (group.dictationMisses || []).length
      + (group.encodingObservations || []).length,
    0);
}

function ttShouldRestorePayload(payload) {
  const restoredState = payload?.appState || payload;
  if (!restoredState?.groups || !Array.isArray(restoredState.groups)) return false;
  const remoteScore = ttStateDataScore(restoredState);
  const localScore = ttStateDataScore(appState);
  return remoteScore > localScore || ttPayloadTime(payload) > ttLocalSaveTime() + 1000;
}

async function ttCloudSyncRestoreIfNewer(handle) {
  const payload = await ttCloudSyncReadPayload(handle);
  const restoredState = payload?.appState || payload;
  if (!restoredState?.groups || !Array.isArray(restoredState.groups)) return false;
  if (!ttShouldRestorePayload(payload)) return false;
  localStorage.setItem("dyslexiaInstructionEngine.v2", JSON.stringify(restoredState));
  if (payload.section2CardOverrides) {
    localStorage.setItem("teachToday.section2CardOverrides.v1", JSON.stringify(payload.section2CardOverrides));
  }
  localStorage.setItem("teachToday.lastCloudSyncAt", payload.exportedAt || new Date().toISOString());
  localStorage.setItem("teachToday.cloudSyncStatus", "Loaded newer cloud data.");
  location.reload();
  return true;
}

async function ttCloudSyncWrite(reason = "Saved local backup file.") {
  if (!ttCloudSyncSupported()) {
    localStorage.setItem("teachToday.cloudSyncStatus", "Local folder backup is not supported in this browser.");
    ttRenderDataCenter();
    return;
  }
  if (ttCloudSyncBusy) {
    ttCloudSyncPending = true;
    return;
  }
  ttCloudSyncBusy = true;
  try {
    const handle = await ttCloudSyncGetValue(ttCloudSyncHandleKey);
    if (!handle) {
      localStorage.setItem("teachToday.cloudSyncStatus", "Choose a local backup folder to save a file on this Mac.");
      return;
    }
    if (!(await ttCloudSyncPermission(handle, true, false))) {
      localStorage.setItem("teachToday.cloudSyncStatus", "Open Data Center and choose the local folder again to reconnect.");
      return;
    }
    if (await ttCloudSyncRestoreIfNewer(handle)) return;
    const now = new Date();
    const payload = ttBackupPayload(now);
    const backupText = JSON.stringify(payload, null, 2);
    const datedFileName = `teach-today-backup-${ttBackupFileStamp(now)}.json`;
    const datedFileHandle = await handle.getFileHandle(datedFileName, { create: true });
    const datedWritable = await datedFileHandle.createWritable();
    await datedWritable.write(backupText);
    await datedWritable.close();
    const latestFileHandle = await handle.getFileHandle(ttCloudSyncFileName, { create: true });
    const latestWritable = await latestFileHandle.createWritable();
    await latestWritable.write(backupText);
    await latestWritable.close();
    localStorage.setItem("teachToday.lastCloudSyncAt", now.toISOString());
    localStorage.setItem("teachToday.cloudSyncStatus", `${reason} File: ${datedFileName}.`);
  } catch {
    localStorage.setItem("teachToday.cloudSyncStatus", "Local backup file could not save. Browser storage is still saved.");
  } finally {
    ttCloudSyncBusy = false;
    ttRenderDataCenter();
    if (ttCloudSyncPending) {
      ttCloudSyncPending = false;
      ttQueueCloudSync();
    }
  }
}

function ttQueueCloudSync() {
  clearTimeout(ttCloudSyncTimer);
  ttCloudSyncTimer = setTimeout(() => ttCloudSyncWrite(), 900);
  ttQueueFirebaseSync();
}

async function ttConnectCloudSync() {
  if (!ttCloudSyncSupported()) {
    alert("This browser cannot write to a local folder automatically. Use Chrome or Edge on your Mac, or keep using backup files.");
    return;
  }
  try {
    const handle = await window.showDirectoryPicker({ mode: "readwrite" });
    if (!(await ttCloudSyncPermission(handle, true, true))) {
      alert("Teach Today needs permission to write the sync file in that folder.");
      return;
    }
    await ttCloudSyncStoreValue(ttCloudSyncHandleKey, handle);
    localStorage.setItem("teachToday.cloudSyncFolderName", handle.name || "Local backup folder");
    const restored = await ttCloudSyncRestoreIfNewer(handle);
    if (!restored) await ttCloudSyncWrite("Connected and saved local backup file.");
  } catch {
    localStorage.setItem("teachToday.cloudSyncStatus", "Local backup folder was not connected.");
    ttRenderDataCenter();
  }
}

async function ttInitCloudSync() {
  if (!ttCloudSyncSupported()) {
    localStorage.setItem("teachToday.cloudSyncStatus", "Local folder backup is not supported in this browser.");
    ttRenderDataCenter();
    return;
  }
  try {
    const handle = await ttCloudSyncGetValue(ttCloudSyncHandleKey);
    if (!handle) {
      localStorage.setItem("teachToday.cloudSyncStatus", "Choose a local backup folder to save a file on this Mac.");
      ttRenderDataCenter();
      return;
    }
    if (!(await ttCloudSyncPermission(handle, false, false))) {
      localStorage.setItem("teachToday.cloudSyncStatus", "Open Data Center and choose the local folder again to reconnect.");
      ttRenderDataCenter();
      return;
    }
    await ttCloudSyncRestoreIfNewer(handle);
    ttQueueCloudSync();
  } catch {
    localStorage.setItem("teachToday.cloudSyncStatus", "Local file backup is paused. Browser storage is still saved.");
    ttRenderDataCenter();
  }
}

window.teachTodayQueueCloudSync = ttQueueCloudSync;

function ttRestoreDataFromFile(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const payload = JSON.parse(String(reader.result || "{}"));
      const restoredState = payload.appState || payload;
      if (!restoredState.groups || !Array.isArray(restoredState.groups)) {
        alert("That backup file does not look like Teach Today data.");
        return;
      }
      localStorage.setItem("dyslexiaInstructionEngine.v2", JSON.stringify(restoredState));
      if (payload.section2CardOverrides) {
        localStorage.setItem("teachToday.section2CardOverrides.v1", JSON.stringify(payload.section2CardOverrides));
      }
      localStorage.setItem("teachToday.lastBackupAt", new Date().toISOString());
      alert("Backup restored. The page will reload now.");
      location.reload();
    } catch {
      alert("I could not read that backup file.");
    }
  };
  reader.readAsText(file);
}

function ttRenderSavedLessons(group) {
  const list = ttById("ttSavedLessons");
  if (!list) return;
  const seenDays = new Set();
  const plans = (group.history || []).slice().reverse().filter((plan) => {
    const key = plan.dailyKey || dateKey(plan.savedAt || plan.created);
    if (!key) return true;
    if (seenDays.has(key)) return false;
    seenDays.add(key);
    return true;
  });
  if (!plans.length) {
    list.innerHTML = "<p>No saved lessons for this group yet.</p>";
    return;
  }
  list.innerHTML = `<p class="saved-lesson-note">Showing the latest official saved lesson for each day.</p>`;
  plans.forEach((plan) => {
    const lesson = plan.lessons?.[0];
    const saved = plan.savedAt ? new Date(plan.savedAt) : null;
    const when = saved
      ? `${saved.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })} at ${saved.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}`
      : plan.created;
    const badge = plan.hasStudentData ? "Taught" : (plan.status || "Saved");
    const item = document.createElement("article");
    item.className = "saved-lesson-item";
    item.innerHTML = `
      <div>
        <strong>${escapeHtml(plan.title || "Saved lesson")} <span class="lesson-status-badge">${escapeHtml(badge)}</span></strong>
        <p>${escapeHtml(when)} - ${escapeHtml(plan.substep || "")}</p>
        <p>${escapeHtml(lesson?.wordlistMeta || "")}</p>
      </div>
      <button type="button">Open in app</button>
    `;
    item.querySelector("button").addEventListener("click", () => {
      if (!lesson) return;
      ttAddLessonTab(plan.id);
      saveState();
      ttOpenPlanInApp(plan.id);
    });
    list.appendChild(item);
  });
}

function ttOpenPlanInApp(planId) {
  ttRememberScroll();
  let found = null;
  appState.groups.forEach((group) => {
    const plan = (group.history || []).find((item) => item.id === planId);
    if (plan) found = { group, plan };
  });
  if (!found?.plan?.lessons?.[0]) return;
  appState.selectedGroupId = found.group.id;
  ttLesson = ttClone(found.plan.lessons[0]);
  ttLesson.savedPlanId = found.plan.id;
  ttAddLessonTab(found.plan.id);
  saveState();
  ttUpdateSaveStatus(found.plan);
  history.replaceState(null, "", ttPlanUrl(found.plan.id));
  ttRender();
  ttRestoreScroll(found.plan.id);
}

function section2CardsForWord(word, substep) {
  const clean = cleanCardWord(word);
  if (!clean) return { mode: "sounds", items: [] };
  const override = section2CardOverrides()[clean];
  if (override?.items?.length) return { mode: override.mode || section2ModeForItems(override.items), items: override.items };
  const suffix = knownSuffixValues(substep).find((value) => clean.endsWith(value) && clean.length > value.length + 2 && hasPlausibleSuffixBase(clean, value));
  const base = suffix ? clean.slice(0, -suffix.length) : clean;
  const shouldUseSyllables = isAtLeastSubstep(substep, "3.1") && (clean.includes("-") || hasKnownPrefixOrBase(base, substep) || estimatedSyllables(base) > 1);
  return shouldUseSyllables
    ? { mode: "syllables", items: syllableCardsForWord(clean, substep) }
    : { mode: "sounds", items: soundCardsForWord(clean, substep) };
}

function hasKnownPrefixOrBase(word, substep) {
  return knownPrefixValues(substep).some((prefix) => word.startsWith(prefix) && word.length > prefix.length + 2)
    || knownLatinBaseValues(substep).some((base) => word === base || word.endsWith(base));
}

function knownPrefixValues(substep) {
  return knownPrefixes
    .filter(([introduced]) => isAtLeastSubstep(substep, introduced))
    .map(([, value]) => value.replace(/-$/, ""))
    .sort((a, b) => b.length - a.length);
}

function knownSuffixValues(substep) {
  return knownSuffixes
    .filter(([introduced]) => isAtLeastSubstep(substep, introduced))
    .map(([, value]) => value.replace(/^-/, ""))
    .sort((a, b) => b.length - a.length);
}

function knownLatinBaseValues(substep) {
  return knownLatinBases
    .filter(([introduced]) => isAtLeastSubstep(substep, introduced))
    .map(([, value]) => value.replace(/^-|-$/g, ""))
    .sort((a, b) => b.length - a.length);
}

function soundCardsForWord(word, substep = "1.1") {
  const chunks = [];
  const suffix = knownSuffixValues(substep).find((value) => word.endsWith(value) && word.length > value.length + 2 && hasPlausibleSuffixBase(word, value));
  const base = suffix ? word.slice(0, -suffix.length) : word;
  const sounds = ["tch", "dge", "ang", "ing", "ong", "ung", "ank", "ink", "onk", "unk", "ild", "ind", "old", "olt", "ost", "all", "am", "an", "ch", "ck", "sh", "th", "wh", "qu"];
  let index = 0;
  while (index < base.length) {
    const chunk = sounds.find((sound) => base.slice(index).startsWith(sound));
    if (chunk) {
      chunks.push({ text: chunk, type: gluedSoundSet().has(chunk) ? "glued" : "consonant" });
      index += chunk.length;
    } else {
      const letter = base[index];
      chunks.push({ text: letter, type: "aeiou".includes(letter) ? "vowel" : "consonant" });
      index += 1;
    }
  }
  if (suffix) chunks.push({ text: suffix, type: "suffix" });
  return chunks;
}

function gluedSoundSet() {
  return new Set(["ang", "ing", "ong", "ung", "ank", "ink", "onk", "unk", "ild", "ind", "old", "olt", "ost", "all", "am", "an"]);
}

function syllableCardsForWord(word, substep) {
  const items = [];
  let remaining = word;
  const verified = verifiedSyllableParts(remaining);
  if (verified) {
    verified.forEach((part) => items.push({ text: part, type: cardTypeForVerifiedPart(part, substep) }));
    return items;
  }
  if (remaining.includes("-")) {
    remaining.split("-").filter(Boolean).forEach((part, index, parts) => {
      items.push({ text: part, type: index < parts.length - 1 ? "syllable" : "syllable" });
    });
    return items;
  }
  const suffix = knownSuffixValues(substep).find((value) => remaining.endsWith(value) && remaining.length > value.length + 2 && hasPlausibleSuffixBase(remaining, value));
  let base = suffix ? remaining.slice(0, -suffix.length) : remaining;
  if (compoundPartsForWord(base)) {
    compoundPartsForWord(base).forEach((part) => items.push({ text: part, type: "syllable" }));
    if (suffix) items.push({ text: suffix, type: "suffix" });
    return items;
  }
  const prefix = prefixForWord(base, substep);
  if (prefix) {
    items.push({ text: prefix, type: "prefix" });
    base = base.slice(prefix.length);
  }
  const latinBase = knownLatinBaseValues(substep).find((value) => base === value || base.endsWith(value));
  if (latinBase && base === latinBase) {
    items.push({ text: `-${latinBase}-`, type: "latin" });
  } else if (latinBase && base.endsWith(latinBase)) {
    const front = base.slice(0, -latinBase.length);
    if (front) {
      const frontType = knownPrefixValues(substep).includes(front) ? "prefix" : "syllable";
      splitClosedSyllables(front).forEach((part) => items.push({ text: part, type: frontType }));
    }
    items.push({ text: `-${latinBase}-`, type: "latin" });
  } else if (compoundPartsForWord(base)) {
    compoundPartsForWord(base).forEach((part) => items.push({ text: part, type: "syllable" }));
  } else {
    splitClosedSyllables(base).forEach((part) => items.push({ text: part, type: "syllable" }));
  }
  if (suffix) items.push({ text: suffix, type: "suffix" });
  return items.length ? items : [{ text: word, type: "syllable" }];
}

function verifiedSyllableParts(word) {
  const verified = {
    congressmen: ["con-", "gress", "men"],
    sublimit: ["sub-", "lim", "it"]
  };
  return verified[word] || null;
}

function cardTypeForVerifiedPart(part, substep) {
  const clean = part.replace(/^-|-$/g, "");
  if (part.endsWith("-") && knownPrefixValues(substep).includes(clean)) return "prefix";
  if (part.startsWith("-") && knownSuffixValues(substep).includes(clean)) return "suffix";
  if (part.startsWith("-") && part.endsWith("-") && knownLatinBaseValues(substep).includes(clean)) return "latin";
  return "syllable";
}

function prefixForWord(word, substep) {
  const nonPrefixWords = new Set(["index", "insect", "inside", "until", "uncle", "under", "unit", "union"]);
  if (nonPrefixWords.has(word)) return "";
  return knownPrefixValues(substep).find((value) => word.startsWith(value) && word.length > value.length + 2) || "";
}

function hasPlausibleSuffixBase(word, suffix) {
  const nonSuffixWords = new Set(["radish", "finish", "polish", "punish", "publish", "relish", "banish", "vanish", "famish", "lavish"]);
  if (nonSuffixWords.has(word)) return false;
  const base = word.slice(0, -suffix.length);
  if (suffix === "s") return !/[aeious]$/.test(base);
  if (suffix === "es") return /(s|x|z|ch|sh)$/.test(base);
  return base.length >= 2;
}

function estimatedSyllables(word) {
  const groups = word.replace(/e$/i, "").match(/[aeiouy]+/g);
  return Math.max(1, groups ? groups.length : 1);
}

function compoundPartsForWord(word) {
  const knownCompounds = {
    hilltop: ["hill", "top"],
    sunset: ["sun", "set"],
    sunlit: ["sun", "lit"],
    backpack: ["back", "pack"],
    bathtub: ["bath", "tub"],
    bedbug: ["bed", "bug"],
    bedpost: ["bed", "post"],
    bobsled: ["bob", "sled"],
    catfish: ["cat", "fish"],
    catnip: ["cat", "nip"],
    catnap: ["cat", "nap"],
    checklist: ["check", "list"],
    checkup: ["check", "up"],
    chestnut: ["chest", "nut"],
    chitchat: ["chit", "chat"],
    clamshell: ["clam", "shell"],
    codfish: ["cod", "fish"],
    cobweb: ["cob", "web"],
    desktop: ["desk", "top"],
    dishcloth: ["dish", "cloth"],
    dishpan: ["dish", "pan"],
    drumstick: ["drum", "stick"],
    dustpan: ["dust", "pan"],
    duckbill: ["duck", "bill"],
    fishnet: ["fish", "net"],
    fishpond: ["fish", "pond"],
    grandchild: ["grand", "child"],
    gumdrop: ["gum", "drop"],
    gumball: ["gum", "ball"],
    handbag: ["hand", "bag"],
    handpick: ["hand", "pick"],
    handstand: ["hand", "stand"],
    hatbox: ["hat", "box"],
    hotshot: ["hot", "shot"],
    hotdog: ["hot", "dog"],
    kickball: ["kick", "ball"],
    kickoff: ["kick", "off"],
    kickstand: ["kick", "stand"],
    kingfish: ["king", "fish"],
    lapdog: ["lap", "dog"],
    laptop: ["lap", "top"],
    lipstick: ["lip", "stick"],
    mankind: ["man", "kind"],
    nutshell: ["nut", "shell"],
    pickup: ["pick", "up"],
    pigpen: ["pig", "pen"],
    sandbox: ["sand", "box"],
    shellfish: ["shell", "fish"],
    snapshot: ["snap", "shot"],
    softball: ["soft", "ball"],
    sunbath: ["sun", "bath"],
    sunblock: ["sun", "block"],
    sundress: ["sun", "dress"],
    sunfish: ["sun", "fish"],
    suntan: ["sun", "tan"],
    sunup: ["sun", "up"],
    tiptop: ["tip", "top"],
    tomcat: ["tom", "cat"],
    topmost: ["top", "most"],
    uphill: ["up", "hill"],
    upwell: ["up", "well"],
    wildcat: ["wild", "cat"],
    windmill: ["wind", "mill"],
    zigzag: ["zig", "zag"]
  };
  return knownCompounds[word] || null;
}

function splitClosedSyllables(word) {
  if (word.length <= 4) return [word];
  if (estimatedSyllables(word) <= 1) return [word];
  const vowels = "aeiouy";
  const parts = [];
  let start = 0;
  for (let index = 1; index < word.length - 1; index += 1) {
    if (!vowels.includes(word[index]) && vowels.includes(word[index - 1]) && /[aeiouy]/.test(word.slice(index + 1))) {
      let cut = index + 1;
      if (isDigraphAt(word, index)) cut = index + 2;
      if (cut - start >= 2 && word.length - cut >= 2) {
        parts.push(word.slice(start, cut));
        start = cut;
        index = cut;
      }
    }
  }
  parts.push(word.slice(start));
  return parts.length > 1 ? parts : splitNearMiddle(word);
}

function isDigraphAt(word, index) {
  return ["ch", "ck", "sh", "th", "wh"].includes(word.slice(index, index + 2));
}

function splitNearMiddle(word) {
  const middle = Math.floor(word.length / 2);
  for (let offset = 0; offset < 3; offset += 1) {
    for (const cut of [middle + offset, middle - offset]) {
      if (cut > 1 && cut < word.length - 1) return [word.slice(0, cut), word.slice(cut)];
    }
  }
  return [word];
}

function ttRenderMarkedWords() {
  document.querySelectorAll(".word-row button").forEach((button) => {
    if (button.closest("#ttReviewWords, #ttCurrentWords")) {
      button.classList.remove("marked-word");
      button.classList.toggle("selected-display-word", button.textContent === ttSection2Word);
      return;
    }
    button.classList.toggle("marked-word", isMarkedReviewWord(button.textContent));
    button.classList.toggle("selected-display-word", button.textContent === ttSection2Word);
  });
  document.querySelectorAll(".section7-word-card > button").forEach((button) => {
    button.classList.toggle("marked-word", isMarkedReviewWord(button.textContent));
  });
}

function ttFillPart7(lesson, skill) {
  const review = lesson.sectionSevenReviewWords || dictationReviewWords(skill.id, lesson.readerLevel || "AB");
  const nonsense = lesson.sectionSevenNonsenseWords || readerNonsenseWordsForReview(priorSubstep(skill.id), skill.id).slice(0, 2);
  const current = lesson.sectionSevenCurrentWords || dictationCurrentWords(skill.id, lesson.readerLevel || "AB", lesson.realWords || []);
  ttById("ttSpellingConcept").textContent = "Review first, then dictate current substep words. For multisyllabic words, segment syllables, tap sounds in each syllable, then spell.";
  ttFillPart7WordCards([
    { title: "Review", category: "Review dictation word", source: "section7-review-dictation", words: review },
    { title: "Nonsense", category: "Prior nonsense review", source: "section7-nonsense-dictation", words: nonsense },
    { title: "Current", category: "Current substep word", source: "section7-current-dictation", words: current }
  ], skill.id);
  ttFillHfwStepChoices(skill.id);
  if (ttById("ttHfwStep")) ttById("ttHfwStep").value = skill.id;
  ttFillHfwDisplayWords(hfwWordsForSubstep(ttById("ttHfwStep")?.value || skill.id, lesson), ttById("ttHfwStep")?.value || skill.id);
  ttFillEncodingStudentGrid(ttById("ttEncodingBar7"), "section7", "Spelling concepts", []
    .concat(review.map((value) => ({ value, category: "Review dictation word", group: "Review" })))
    .concat(nonsense.map((value) => ({ value, category: "Prior nonsense review", group: "Nonsense" })))
    .concat(current.map((value) => ({ value, category: "Current substep word", group: "Current" }))));
}

function ttFillPart7WordCards(groups, substep) {
  const container = ttById("ttPart7WordCards");
  if (!container) return;
  container.innerHTML = "";
  groups.forEach((group) => {
    const section = document.createElement("section");
    section.className = "section7-card-group";
    section.innerHTML = `<h3>${escapeHtml(group.title)}</h3><div></div>`;
    const rows = section.querySelector("div");
    group.words.forEach((word, wordIndex) => {
      const row = document.createElement("article");
      row.className = "section7-word-card";
      row.dataset.word = word;
      const wordButton = document.createElement("button");
      wordButton.type = "button";
      wordButton.className = isMarkedReviewWord(word) ? "marked-word" : "";
      wordButton.textContent = word;
      ttBindSingleOrTriple(
        wordButton,
        () => {
          toggleReviewWord(word, group.source);
          ttSelectPart7Word(word, group.category);
        },
        () => ttReplaceSection7Word(group.title, wordIndex)
      );
      const mini = document.createElement("div");
      mini.className = "section7-mini-display";
      ttRenderBuildCards(mini, word, substep);
      const fixButton = document.createElement("button");
      fixButton.type = "button";
      fixButton.className = "section7-fix-button";
      fixButton.textContent = "Fix";
      fixButton.title = `Fix card split for ${word}`;
      fixButton.addEventListener("click", () => ttOpenSection7Fix(row, word, substep));
      const fixPanel = document.createElement("div");
      fixPanel.className = "section7-fix-panel";
      fixPanel.hidden = true;
      fixPanel.innerHTML = `
        <input type="text" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" placeholder="con- gress men">
        <button type="button" class="section7-save-fix">Save</button>
        <button type="button" class="section7-cancel-fix">Cancel</button>
      `;
      fixPanel.querySelector(".section7-save-fix").addEventListener("click", () => ttSaveSection7Fix(row, word, substep));
      fixPanel.querySelector(".section7-cancel-fix").addEventListener("click", () => {
        fixPanel.hidden = true;
      });
      fixPanel.querySelector("input").addEventListener("keydown", (event) => {
        if (event.key === "Enter") ttSaveSection7Fix(row, word, substep);
        if (event.key === "Escape") fixPanel.hidden = true;
      });
      row.append(wordButton, mini, fixButton, fixPanel);
      rows.appendChild(row);
    });
    container.appendChild(section);
  });
}

function ttReplaceSection7Word(groupTitle, wordIndex) {
  if (!ttLesson) return;
  ttForkSavedLessonDraft();
  const skill = scopeMap.find((item) => item.id === ttLesson.substep) || activeStep(ttActiveGroup());
  const level = ttLesson.readerLevel || "AB";
  const key = groupTitle === "Current" ? "sectionSevenCurrentWords" : groupTitle === "Nonsense" ? "sectionSevenNonsenseWords" : "sectionSevenReviewWords";
  const current = ttLesson[key] || (groupTitle === "Current"
    ? dictationCurrentWords(skill.id, level, ttLesson.realWords || [])
    : groupTitle === "Nonsense"
      ? readerNonsenseWordsForReview(priorSubstep(skill.id), skill.id).slice(0, 2)
      : dictationReviewWords(skill.id, level));
  const pool = groupTitle === "Current"
    ? (ttLesson.realWords || []).concat(dictationWordsFor(skill.id, level))
    : groupTitle === "Nonsense"
      ? readerNonsenseWordsForReview(priorSubstep(skill.id), skill.id).concat(ttLesson.nonsenseWords || [])
      : priorDictationWords(skill.id, level).concat(readerWordsFromSubstep(priorSubstep(skill.id), level));
  ttLesson[key] = current.map((word, index) => index === wordIndex ? ttPickReplacement(pool, current, word) : word);
  ttSaveDraftLesson();
  ttFillPart7(ttLesson, skill);
}

function ttOpenSection7Fix(row, word, substep) {
  const panel = row.querySelector(".section7-fix-panel");
  const input = panel?.querySelector("input");
  const cards = section2CardsForWord(word, substep);
  if (!panel || !input) return;
  input.value = cards?.items?.length ? cards.items.map(section2EditInputText).join(" ") : "";
  panel.hidden = false;
  input.focus();
  input.select();
}

function ttSaveSection7Fix(row, word, substep) {
  const panel = row.querySelector(".section7-fix-panel");
  const input = panel?.querySelector("input");
  const mini = row.querySelector(".section7-mini-display");
  if (!input || !mini) return;
  const items = parseSection2CardInput(input.value, substep);
  if (!items.length) return;
  const overrides = section2CardOverrides();
  overrides[cleanCardWord(word)] = {
    mode: section2ModeForItems(items),
    items,
    updatedAt: new Date().toISOString()
  };
  localStorage.setItem("teachToday.section2CardOverrides.v1", JSON.stringify(overrides));
  input.value = "";
  if (panel) panel.hidden = true;
  ttRenderBuildCards(mini, word, substep);
}

function ttSelectPart7Word(word, category) {
  ttSelectEncodingValue("section7", category, word);
  document.querySelectorAll(".section7-word-card").forEach((row) => {
    row.classList.toggle("selected-display-word", row.dataset.word === word);
  });
}

function ttRenderBuildCards(container, word, substep) {
  if (!container) return;
  container.innerHTML = "";
  if (!word) {
    container.innerHTML = "<span>Tap a word</span>";
    return;
  }
  const cards = section2CardsForWord(word, substep);
  container.dataset.mode = cards.mode;
  container.style.setProperty("--tile-count", String(Math.max(cards.items.length, 1)));
  container.classList.toggle("many-cards", cards.items.length >= 7);
  cards.items.forEach((item) => {
    const card = document.createElement("span");
    card.className = `build-card ${item.type}`;
    card.textContent = section2DisplayCardText(item);
    container.appendChild(card);
  });
}

function ttFillHfwStepChoices(currentSubstep) {
  ttFillHfwStepChoicesForSelect(ttById("ttHfwStep"), currentSubstep);
}

function ttFillHfwStepChoicesForSelect(select, currentSubstep) {
  if (!select) return;
  const firstFill = !select.options.length;
  if (!select.options.length) {
    scopeMap.forEach((skill) => {
      const option = document.createElement("option");
      option.value = skill.id;
      option.textContent = skill.id;
      select.appendChild(option);
    });
  }
  [...select.options].forEach((option) => {
    option.hidden = !isAtLeastSubstep(currentSubstep, option.value);
  });
  if (firstFill || !select.value || !isAtLeastSubstep(currentSubstep, select.value)) select.value = currentSubstep;
}

function isUsableHfwWord(word) {
  const text = String(word || "").trim();
  return /^[A-Za-z](?:[A-Za-z'.-]*[A-Za-z.])?$/.test(text);
}

function hfwWordsForSubstep(substep, lesson) {
  const hfw = window.wilsonHighFrequencyWords?.[substep] || [];
  return [...new Set(hfw)].filter(isUsableHfwWord);
}

function hfwReviewWordsForSubstep(substep) {
  const currentIndex = scopeMap.findIndex((item) => item.id === substep);
  const review = [];
  for (let index = currentIndex - 1; index >= 0 && review.length < 12; index -= 1) {
    review.push(...hfwWordsForSubstep(scopeMap[index].id, ttLesson));
  }
  return [...new Set(review)].slice(0, 12);
}

function dictationReviewWords(substep, level = "AB") {
  const currentIndex = scopeMap.findIndex((item) => item.id === substep);
  const candidates = [];
  for (let index = currentIndex - 1; index >= 0 && candidates.length < 30; index -= 1) {
    const prior = scopeMap[index];
    const bank = dictationValues("words", prior.id, level);
    candidates.push(...bank.filter(isUsableReaderWord));
    if (candidates.length < 5) {
      candidates.push(...readerWordsFromSubstep(prior.id, level));
    }
  }
  return chooseWords(candidates, 5, true);
}

function dictationCurrentWords(substep, level = "AB", pageWords = []) {
  const bank = dictationValues("words", substep, level);
  const compatible = pageWords.filter((word) => bank.includes(word));
  const source = compatible.length >= 5 ? compatible : pageWords.concat(bank);
  return chooseWords(source.filter(isUsableReaderWord), 5, true);
}

function ttFillHfwDisplayWords(words, substep) {
  const container = ttById("ttPart7Hfw");
  const hfwWords = words.filter(isUsableHfwWord);
  container.innerHTML = "";
  if (!hfwWords.length) {
    const item = document.createElement("span");
    item.textContent = "No HFW listed for this page";
    container.appendChild(item);
    ttShowHfw("Tap HFW", substep);
    return;
  }
  hfwWords.forEach((word) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = word;
    button.addEventListener("click", () => ttShowHfw(word, substep));
    container.appendChild(button);
  });
  ttShowHfw(hfwWords[0], substep);
}

function ttShowHfw(word, substep) {
  ttById("ttHfwDisplay").querySelector("strong").textContent = word;
  ttById("ttHfwSubstep").textContent = substep;
}

function ttFillSentences(sentences) {
  const list = ttById("ttSentences");
  list.innerHTML = "";
  const source = sentences.length ? sentences.slice(0, 10) : ["Use the assigned Reader sentence page."];
  source.forEach((sentence, index) => {
    const item = document.createElement("li");
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = sentence;
    button.addEventListener("click", () => ttShowSentence(sentence));
    item.appendChild(button);
    list.appendChild(item);
    if (index === 0) ttShowSentence(sentence, true);
  });
}

function ttShowSentence(sentence, quiet = false) {
  const display = ttById("ttSentenceDisplay");
  if (!display) return;
  display.hidden = false;
  display.querySelector("p").textContent = sentence;
  display.classList.toggle("long-sentence", sentence.length > 78);
  if (!quiet) display.scrollIntoView({ behavior: "smooth", block: "center" });
  document.querySelectorAll("#ttSentences button").forEach((button) => {
    button.classList.toggle("active", button.textContent === sentence);
  });
}

function ttCloseSentenceDisplay() {
  const display = ttById("ttSentenceDisplay");
  if (display) display.hidden = true;
  document.querySelectorAll("#ttSentences button.active").forEach((button) => button.classList.remove("active"));
}

function ttFillDictation(items) {
  const container = ttById("ttDictation");
  container.innerHTML = "";
  const encodingBar = document.createElement("div");
  encodingBar.className = "encoding-bar";
  container.appendChild(encodingBar);
  const hfwItems = ttHighFrequencyItemsFromPhrases(items);
  const dictationItems = items.flatMap((item) => (item.values || []).map((value) => ({
    value,
    category: item.label,
    group: item.label.replace(/^\d+\s*/, "")
  })));
  ttFillEncodingStudentGrid(encodingBar, "section8", "Dictation", hfwItems.concat(dictationItems));

  const sheet = document.createElement("div");
  sheet.className = "dictation-sheet";
  items.forEach((item, blockIndex) => {
    const block = document.createElement("section");
    block.className = "dictation-block";
    block.innerHTML = `<strong>${escapeHtml(item.label)}</strong><div class="dictation-checks"></div>`;
    const checks = block.querySelector(".dictation-checks");
    item.values.forEach((value, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.innerHTML = `<span>${index + 1}</span>${escapeHtml(value)}`;
      button.dataset.value = value;
      button.dataset.category = item.label;
      button.dataset.blockIndex = String(blockIndex);
      button.dataset.itemIndex = String(index);
      ttBindSingleOrTriple(
        button,
        () => ttToggleEncodingForActiveStudent(button, "section8", item.label, value),
        () => ttReplaceDictationItem(blockIndex, index)
      );
      checks.appendChild(button);
    });
    sheet.appendChild(block);
  });
  container.appendChild(sheet);
}

function ttActiveDictationPlan(lesson, skill) {
  return lesson.dictationPlanOverride || ttDictationPlan(lesson, skill);
}

function ttReplaceDictationItem(blockIndex, itemIndex) {
  if (!ttLesson) return;
  ttForkSavedLessonDraft();
  const skill = scopeMap.find((item) => item.id === ttLesson.substep) || activeStep(ttActiveGroup());
  const plan = ttActiveDictationPlan(ttLesson, skill).map((item) => ({ ...item, values: (item.values || []).slice() }));
  const block = plan[blockIndex];
  if (!block) return;
  const oldValue = block.values[itemIndex];
  const pool = ttDictationReplacementPool(block.label, ttLesson, skill);
  block.values[itemIndex] = ttPickReplacement(pool, block.values, oldValue);
  ttLesson.dictationPlanOverride = plan;
  ttSaveDraftLesson();
  ttFillDictation(plan);
}

function ttDictationReplacementPool(label, lesson, skill) {
  const level = lesson.readerLevel || "AB";
  if (/sounds/i.test(label)) return soundsFromWords((lesson.realWords || []).concat(lesson.nonsenseWords || []), skill.id).concat(fiveDictationSounds(skill.id));
  if (/word elements/i.test(label)) return elementsFromWords((lesson.realWords || []).concat(lesson.readerSentences || []), skill.id).concat(fiveWordElements(skill.id, lesson.realWords || []));
  if (/real words/i.test(label)) return (lesson.realWords || []).concat(dictationWordsFor(skill.id, level), priorDictationWords(skill.id, level)).filter(isValidDictationWord);
  if (/nonsense/i.test(label)) return readerNonsenseWordsForReview(priorSubstep(skill.id), skill.id).concat(lesson.nonsenseWords || []);
  if (/phrases/i.test(label)) return dictationItems("phrases", skill.id, level, 80).concat(dictationItems("phrases", priorSubstep(skill.id), level, 12));
  if (/sentences/i.test(label)) return dictationItems("sentences", skill.id, level, 80).concat(dictationItems("sentences", priorSubstep(skill.id), level, 12));
  return [];
}

function ttHighFrequencyItemsFromPhrases(items = []) {
  const hfwBank = new Set();
  (ttLesson?.highFrequencyWords || []).forEach((word) => hfwBank.add(String(word).toLowerCase()));
  dictationValues("highFrequency", ttLesson?.substep, ttLesson?.readerLevel || "AB").forEach((word) => hfwBank.add(String(word).toLowerCase()));
  const sentenceData = window.readerSentenceIndex?.[ttLesson?.substep]?.[ttLesson?.readerLevel || "AB"]
    || window.readerSentenceIndex?.[ttLesson?.substep]?.AB
    || window.readerSentences?.[ttLesson?.substep]?.[ttLesson?.readerLevel || "AB"]
    || {};
  Object.values(sentenceData || {}).forEach((page) => {
    (page.h || page.highFrequencyWords || page.highFrequency || []).forEach((word) => hfwBank.add(String(word).toLowerCase()));
  });
  [
    "a", "the", "to", "of", "is", "was", "were", "you", "your", "our", "through",
    "throughout", "called", "another", "would", "could", "should", "their", "there"
  ].forEach((word) => hfwBank.add(word));
  const phrases = items
    .filter((item) => /phrases/i.test(item.label || ""))
    .flatMap((item) => item.values || []);
  const seen = new Set();
  const found = [];
  phrases.forEach((phrase) => {
    String(phrase || "").toLowerCase().match(/[a-z]+(?:-[a-z]+)?/g)?.forEach((token) => {
      if (!hfwBank.has(token) || seen.has(token)) return;
      seen.add(token);
      found.push({ value: token, category: "HFW from phrase", group: "HFW from phrases" });
    });
  });
  return found;
}

function ttSelectDictationItem(button, value, category) {
  if (button.classList.contains("selected")) {
    button.classList.remove("selected");
    const container = ttById("ttDictation");
    container.dataset.selectedValue = "";
    container.dataset.selectedCategory = "";
    container.querySelector(".dictation-selected").textContent = "Tap item, then student";
    ttClearEncodingSelection("section8");
    return;
  }
  document.querySelectorAll(".dictation-checks button").forEach((item) => item.classList.remove("selected"));
  button.classList.add("selected");
  const container = ttById("ttDictation");
  container.dataset.selectedValue = value;
  container.dataset.selectedCategory = category;
  container.querySelector(".dictation-selected").textContent = `Selected: ${value}`;
  const bar = ttEncodingBarForSection("section8");
  if (bar) {
    bar.dataset.selectedValue = value;
    bar.dataset.selectedCategory = category;
    bar.querySelector(".encoding-selected").textContent = `Selected: ${value}`;
  }
}

function ttSaveDictationMissForStudent(student) {
  const container = ttById("ttDictation");
  const value = container.dataset.selectedValue || "";
  const category = container.dataset.selectedCategory || "";
  if (!value) {
    container.querySelector(".dictation-selected").textContent = "Tap an item first";
    return;
  }
  ttEnsureCurrentLessonSavedForData();
  const group = ttActiveGroup();
  const lessonMeta = ttCurrentLessonRecordMeta(ttLesson);
  group.dictationMisses ||= [];
  group.dictationMisses.push({
    id: `dictation-miss-${Date.now()}`,
    date: new Date().toISOString(),
    student,
    substep: ttLesson?.substep || group.substep,
    category,
    item: value,
    ...lessonMeta
  });
  ttSaveEncodingObservation(student, "section8", category, "encoding miss", value);
  group.markedReviewWords ||= [];
  group.markedReviewWords.push({
    word: value,
    source: `section8-${category}`,
    student,
    substep: ttLesson?.substep || group.substep,
    date: new Date().toISOString()
  });
  saveState();
  document.querySelectorAll(".dictation-checks button.selected").forEach((button) => {
    button.classList.add("missed");
    button.classList.remove("selected");
  });
  container.dataset.selectedValue = "";
  container.dataset.selectedCategory = "";
  ttClearEncodingSelection("section8");
  container.querySelector(".dictation-selected").textContent = `Saved: ${student} missed ${value}`;
}

function ttDictationPlan(lesson, skill) {
  const level = lesson.readerLevel || "AB";
  const phraseBank = dictationItems("phrases", skill.id, level, 80);
  const sentenceBank = dictationItems("sentences", skill.id, level, 40);
  const sentences = fillToCount(rankedDictationSentences(sentenceBank, phraseBank), sentenceBank.concat(dictationItems("sentences", priorSubstep(skill.id), level, 6)), 2);
  const sentenceTokens = tokenSet(sentences.join(" "));
  const sentenceHfw = highFrequencyWordsFromTexts(sentences, lesson);
  const currentWords = validDictationWords(dictationCurrentWords(skill.id, level, lesson.realWords || []), lesson.realWords || []).slice(0, 2);
  const reviewNoSuffix = []
    .concat(dictationWordsFor("2.2", level), dictationWordsFor("2.4", level), dictationWordsFor("2.5", level))
    .find((word) => isValidDictationWord(word) && !hasVisibleSuffix(word)) || "";
  const veReview = dictationWordsFor("4.1", level).find((word) => isValidDictationWord(word) && !hasVisibleSuffix(word)) || "";
  const suffixReview = priorDictationWords(skill.id, level).find((word) => isValidDictationWord(word) && hasVisibleSuffix(word) && estimatedSyllables(word.replace(/s$|es$|ed$|ing$/, "")) <= 2) || "";
  const fallbackWords = validDictationWords([].concat(lesson.realWords || [], dictationWordsFor(skill.id, level), priorDictationWords(skill.id, level)));
  const sentenceRelatedWords = validDictationWords(dictationWordsFor(skill.id, level).filter((word) => sentenceTokens.has(word.toLowerCase())), lesson.realWords || []);
  const words = fillToCount(sentenceRelatedWords.concat([reviewNoSuffix, veReview, suffixReview].filter(Boolean), currentWords), fallbackWords, 5);
  const phraseMatches = rankedDictationPhrases(phraseBank, sentenceTokens, sentenceHfw);
  const phrases = fillToCount(phraseMatches, phraseBank.concat(dictationItems("phrases", priorSubstep(skill.id), level, 6)), 3);
  const soundTargets = soundsFromWords(words.concat(threeNonsenseWords(skill.id, level)), skill.id);
  const elementTargets = elementsFromWords(words.concat(lesson.realWords || [], sentences), skill.id);
  return [
    { label: "5 sounds", values: fillToCount(soundTargets, fiveDictationSounds(skill.id).concat(["ă", "ĕ", "ĭ", "ŏ", "ŭ"]), 5) },
    { label: "5 word elements", values: fillToCount(elementTargets, fiveWordElements(skill.id, lesson.realWords || []), 5) },
    { label: "5 real words", values: words },
    { label: "3 nonsense words", values: fillToCount(threeNonsenseWords(skill.id, level), readerNonsenseWordsForReview(priorSubstep(skill.id), skill.id), 3) },
    { label: "3 phrases", values: phrases },
    { label: "2 sentences", values: sentences }
  ];
}

function tokenSet(text) {
  return new Set(String(text || "").toLowerCase().match(/[a-z]+(?:-[a-z]+)?/g) || []);
}

function highFrequencyWordsFromTexts(texts, lesson) {
  const known = new Set((lesson.highFrequencyWords || []).map((word) => String(word).toLowerCase()));
  const sentenceData = window.readerSentenceIndex?.[lesson.substep]?.[lesson.readerLevel || "AB"]
    || window.readerSentenceIndex?.[lesson.substep]?.AB
    || window.readerSentences?.[lesson.substep]?.[lesson.readerLevel || "AB"]
    || {};
  Object.values(sentenceData || {}).forEach((page) => {
    (page.h || page.highFrequency || page.highFrequencyWords || []).forEach((word) => known.add(String(word).toLowerCase()));
  });
  return [...tokenSet(texts.join(" "))].filter((word) => known.has(word));
}

function rankedDictationSentences(sentences, phrases) {
  const common = new Set(["a", "an", "the", "in", "into", "on", "at", "to", "of", "and", "is", "was", "were", "did", "do"]);
  const phraseTokenSets = phrases.map((phrase) => tokenSet(phrase));
  return sentences
    .map((sentence, index) => {
      const tokens = tokenSet(sentence);
      let score = 0;
      phraseTokenSets.forEach((phraseTokens) => {
        tokens.forEach((token) => {
          if (!common.has(token) && phraseTokens.has(token)) score += 2;
        });
      });
      return { sentence, score, index };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map((item) => item.sentence);
}

function rankedDictationPhrases(phrases, sentenceTokens, sentenceHfw) {
  const common = new Set(["a", "an", "the", "in", "into", "on", "at", "to", "of", "and", "is", "was", "were"]);
  const hfwSet = new Set(sentenceHfw.filter((word) => !common.has(word)));
  const contentTokens = [...sentenceTokens].filter((word) => word.length > 3 && !common.has(word));
  return phrases
    .map((phrase, index) => {
      const tokens = tokenSet(phrase);
      let score = 0;
      hfwSet.forEach((word) => {
        if (tokens.has(word)) score += 6;
      });
      contentTokens.forEach((word) => {
        if (tokens.has(word)) score += 3;
      });
      return { phrase, score, index };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map((item) => item.phrase);
}

function soundsFromWords(words, substep) {
  const text = words.join(" ").toLowerCase();
  const vowelMap = { a: "ă", e: "ĕ", i: "ĭ", o: "ŏ", u: "ŭ" };
  const vowelHits = Object.entries(vowelMap)
    .map(([letter, sound]) => ({ sound, count: (text.match(new RegExp(letter, "g")) || []).length }))
    .filter((item) => item.count > 0)
    .sort((a, b) => b.count - a.count)
    .map((item) => item.sound);
  const distinctive = ["x", "qu", "j", "z", "v", "y"].filter((sound) => text.includes(sound));
  const digraphs = ["sh", "ch", "th", "wh", "ck", "ph", "tch", "dge"].filter((sound) => text.includes(sound));
  const welded = knownWeldedAndExceptions
    .filter(([step]) => isAtLeastSubstep(substep, step))
    .map(([, value]) => value)
    .filter((sound) => text.includes(sound))
    .sort((a, b) => Number(a === "ing") - Number(b === "ing") || b.length - a.length);
  const consonants = consonantSoundList(substep)
    .filter((sound) => sound.length === 1 && !distinctive.includes(sound) && text.includes(sound));
  return [...new Set([
    vowelHits[0],
    ...distinctive,
    ...digraphs.slice(0, 2),
    ...welded,
    ...digraphs.slice(2),
    ...vowelHits.slice(1),
    ...consonants
  ].filter(Boolean))];
}

function elementsFromWords(words, substep) {
  const text = words.join(" ").toLowerCase();
  const wordList = String(text).match(/[a-z]+(?:-[a-z]+)?/g) || [];
  const suffixes = knownSuffixValues(substep)
    .filter((suffix) => wordList.some((word) => word.endsWith(suffix)))
    .map((suffix) => `-${suffix}`);
  const prefixes = knownPrefixValues(substep)
    .filter((prefix) => wordList.some((word) => word.startsWith(prefix)))
    .map((prefix) => `${prefix}-`);
  const latinBases = knownLatinBaseValues(substep)
    .filter((base) => text.includes(base))
    .map((base) => `-${base}-`);
  return [...new Set(suffixes.concat(prefixes, latinBases))];
}

function fillToCount(primary, fallback, count) {
  const values = [];
  primary.concat(fallback).forEach((item) => {
    if (item && !values.includes(item) && values.length < count) values.push(item);
  });
  return values;
}

function validDictationWords(words, preferred = []) {
  const preferredSet = new Set(preferred);
  return words
    .filter(isValidDictationWord)
    .sort((a, b) => Number(preferredSet.has(b)) - Number(preferredSet.has(a)));
}

function isValidDictationWord(word) {
  const banned = new Set(["ing", "ang", "ong", "ung", "ank", "ink", "onk", "unk", "all", "am", "an", "ild", "ind", "old", "olt", "ost", "suffix", "prefix", "base"]);
  return isUsableReaderWord(word) && word.length >= 3 && !banned.has(word.toLowerCase());
}

function dictationWordsFor(substep, level) {
  return dictationValues("words", substep, level);
}

function priorDictationWords(substep, level) {
  const currentIndex = scopeMap.findIndex((item) => item.id === substep);
  const words = [];
  for (let index = currentIndex - 1; index >= 0 && words.length < 80; index -= 1) {
    words.push(...dictationWordsFor(scopeMap[index].id, level));
  }
  return words;
}

function hasVisibleSuffix(word) {
  return /(s|es|ed|ing|ful|less|ly|ness|ment|able|ive)$/i.test(word);
}

function fiveDictationSounds(substep) {
  const sounds = soundsForSubstep(substep);
  return `${sounds.vowels}, ${sounds.consonants}, ${sounds.welded}`
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 5);
}

function fiveWordElements(substep, pageWords) {
  const suffixes = knownSuffixValues(substep).filter((suffix) => pageWords.some((word) => word.endsWith(suffix))).slice(0, 2).map((suffix) => `-${suffix}`);
  const prefixes = knownPrefixValues(substep).filter((prefix) => pageWords.some((word) => word.startsWith(prefix))).slice(0, 2).map((prefix) => `${prefix}-`);
  const base = knownLatinBaseValues(substep)[0] ? [`-${knownLatinBaseValues(substep)[0]}-`] : [];
  return prefixes.concat(suffixes, base, knownPrefixValues(substep).slice(0, 4).map((prefix) => `${prefix}-`), knownSuffixValues(substep).slice(0, 4).map((suffix) => `-${suffix}`)).slice(0, 5);
}

function threeNonsenseWords(substep, level) {
  const candidates = ["2.2", "2.4", "2.5", "3.1", "3.2", "4.1", "4.2", substep]
    .flatMap((step) => readerNonsenseWordsForReview(step, substep));
  return [...new Set(candidates)].filter(isUsableReaderWord).slice(0, 3);
}

function ttSetupChart(lesson) {
  const group = ttActiveGroup();
  const skill = scopeMap.find((item) => item.id === lesson.substep) || activeStep(group);
  ttEnsureSection4PageIntegrity(lesson, skill);
  const card = ttById("section4");
  ttChartCard = card;
  card.dataset.lessonId = lesson.id;
  card.dataset.elapsed = "0";
  card.dataset.startedAt = "";
  card.dataset.startElapsed = "0";
  card.dataset.chartHalf = "bottom";
  card._lesson = lesson;
  fillChartBoard(card.querySelector(".chart-top"), lesson.realWords || [], "top");
  fillChartBoard(card.querySelector(".chart-bottom"), lesson.nonsenseWords || [], "bottom");
  ttRenderChartIntegrity(lesson);
  ttFillStudentPills(group);
  syncChartHalfUi(card);
  updateLiveScore(card);
}

function ttExactChartingWords(skill, lesson) {
  const level = lesson.readerLevel || ttActiveGroup().readerLevel || "AB";
  return chartingWordsForReaderPage(skill.id, level, lesson.wordlistPageNumber);
}

function ttEnsureSection4PageIntegrity(lesson, skill, forceSource = false) {
  let sourceWords = ttExactChartingWords(skill, lesson);
  const savedWords = [].concat(lesson.realWords || [], lesson.nonsenseWords || []).filter(isUsableReaderWord);
  let sourceHasFullPage = sourceWords.length >= 30;
  const savedHasFullPage = savedWords.length >= 30;

  if (sourceWords.length < 15 && !savedHasFullPage) {
    const level = lesson.readerLevel || ttActiveGroup().readerLevel || "AB";
    const validPages = pageList(skill, "wordlist", level);
    const replacementPage = validPages.find((page) => page !== lesson.wordlistPageNumber) || validPages[0];
    if (replacementPage) {
      lesson.wordlistPageNumber = replacementPage;
      lesson.readerLevel = resolvedLevel(skill, "wordlist", level);
      const assignment = {
        reader: skill.reader,
        page: replacementPage,
        level: lesson.readerLevel,
        index: Math.max(0, validPages.indexOf(replacementPage)) + 1,
        total: validPages.length
      };
      lesson.wordlistMeta = `Reader ${skill.reader}, p. ${replacementPage} - ${pagePositionLabel(assignment, "wordlist")}`;
      sourceWords = ttExactChartingWords(skill, lesson);
      sourceHasFullPage = sourceWords.length >= 30;
    }
  }

  if (sourceHasFullPage) {
    const expected = sourceWords.slice(0, 30).join("|");
    const current = savedWords.slice(0, 30).join("|");
    if (expected !== current || (lesson.realWords || []).length !== 15 || (lesson.nonsenseWords || []).length !== 15) {
      lesson.realWords = sourceWords.slice(0, 15);
      lesson.nonsenseWords = sourceWords.slice(15, 30);
    }
    lesson.section4Integrity = {
      status: "ok",
      message: `Section 4 checked: 30 words loaded from Reader ${skill.reader}, p. ${lesson.wordlistPageNumber}.`
    };
    return true;
  }

  if (!sourceHasFullPage && !forceSource && savedHasFullPage) {
    lesson.realWords = savedWords.slice(0, 15);
    lesson.nonsenseWords = savedWords.slice(15, 30);
    lesson.section4Integrity = {
      status: "warning",
      message: `Saved lesson has 30 charting words, but the Reader page source currently shows ${sourceWords.length}/30. Use Recheck only after confirming the page data.`
    };
    return false;
  }

  lesson.realWords = sourceWords.slice(0, 15);
  lesson.nonsenseWords = sourceWords.slice(15, 30);
  const level = lesson.readerLevel || ttActiveGroup().readerLevel || "AB";
  const pageCounts = ttChartingPageCounts(skill, level);
  const fullCount = pageCounts.filter((item) => item.count >= 30).length;
  const fullSummary = fullCount ? "" : ` No complete ${level} charting page is indexed for this substep.`;
  const countSummary = pageCounts.length
    ? ` Indexed ${level} pages: ${pageCounts.map((item) => `p.${item.page} ${item.count}/30`).join(", ")}.`
    : "";
  lesson.section4Integrity = {
    status: sourceWords.length >= 15 ? "warning" : "error",
    message: sourceWords.length >= 15
      ? `Reader page source has ${sourceWords.length}/30 words for Reader ${skill.reader}, p. ${lesson.wordlistPageNumber}. Top is usable, but Bottom is incomplete in the source.${fullSummary}${countSummary}`
      : `Reader page source is incomplete: ${sourceWords.length}/30 words found for Reader ${skill.reader}, p. ${lesson.wordlistPageNumber}. Do not chart this page until corrected.${fullSummary}${countSummary}`
  };
  return false;
}

function ttChartingPageCounts(skill, level) {
  const pages = skill.pages?.wordlist || {};
  const resolved = pages[level]?.length ? level : pages.AB?.length ? "AB" : pages.A?.length ? "A" : pages.B?.length ? "B" : level;
  const listed = pages[resolved] || [];
  return listed.map((page) => ({
    page,
    count: chartingPageEntry(skill.id, resolved, page).count
  }));
}

function ttRenderChartIntegrity(lesson) {
  const status = ttById("ttChartIntegrity");
  if (!status) return;
  const info = lesson.section4Integrity || {};
  status.textContent = info.message || "Section 4 checked.";
  status.classList.toggle("warning", info.status === "warning");
  status.classList.toggle("error", info.status === "error");
}

function ttRecheckSection4Words() {
  if (!ttLesson) return;
  ttForkSavedLessonDraft();
  const group = ttActiveGroup();
  const skill = scopeMap.find((item) => item.id === ttLesson.substep) || activeStep(group);
  ttEnsureSection4PageIntegrity(ttLesson, skill, true);
  ttSaveDraftLesson();
  ttRender();
  ttById("section4")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function ttFillStudentPills(group) {
  const container = ttById("ttStudentPills");
  container.innerHTML = "";
  group.students.forEach((student) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `student-pill${student === group.activeStudent ? " active" : ""}`;
    button.dataset.student = student;
    const status = performanceStatus(recordsForStudent(student));
    button.innerHTML = `<span class="status-dot ${status.color}"></span>${escapeHtml(student)}`;
    button.addEventListener("click", () => ttSelectStudent(student));
    container.appendChild(button);
  });
}

function ttSelectStudent(student) {
  selectActiveStudent(student, { sourceCard: ttChartCard, resetSource: true });
  ttById("ttStudent").value = student;
  ttById("ttTitle").textContent = `${ttActiveGroup().name} - ${ttLesson?.substep || ttActiveGroup().substep}`;
  ttFillFrontStudents(ttActiveGroup());
}

async function ttTogglePresentation(force = null) {
  const shouldPresent = force ?? !document.body.classList.contains("presentation-mode");
  document.body.classList.toggle("presentation-mode", shouldPresent);
  const button = ttById("ttPresent");
  if (button) button.textContent = shouldPresent ? "Exit" : "Present";
  try {
    if (shouldPresent && document.documentElement.requestFullscreen && !document.fullscreenElement) {
      await document.documentElement.requestFullscreen();
    } else if (!shouldPresent && document.exitFullscreen && document.fullscreenElement) {
      await document.exitFullscreen();
    }
  } catch {
    /* iPad Safari may not allow fullscreen unless launched as a web app. */
  }
}

function ttDockClick(targetId) {
  const target = ttById(targetId);
  if (target) target.click();
}

function ttToggleLaser(force = null) {
  ttLaserEnabled = force ?? !ttLaserEnabled;
  if (ttLaserEnabled && ttNotesEnabled) ttToggleNotes(false, false);
  document.body.classList.toggle("laser-mode", ttLaserEnabled);
  ttById("ttLaserToggle")?.classList.toggle("active", ttLaserEnabled);
  if (ttLaserEnabled) {
    ttResizeLaserCanvas();
    ttStartLaserFade();
  } else {
    ttLaserDrawing = false;
    ttLaserLastPoint = null;
    ttClearLaserCanvas();
  }
}

function ttToggleNotes(force = null, clearWhenOff = true) {
  ttNotesEnabled = force ?? !ttNotesEnabled;
  if (ttNotesEnabled && ttLaserEnabled) ttToggleLaser(false);
  document.body.classList.toggle("notes-mode", ttNotesEnabled);
  ttById("ttNotesToggle")?.classList.toggle("active", ttNotesEnabled);
  if (ttNotesEnabled) {
    ttResizeCanvas("ttNotesCanvas");
  } else {
    ttNotesDrawing = false;
    ttNotesLastPoint = null;
    if (clearWhenOff) ttClearCanvas("ttNotesCanvas");
    ttToggleLaser(true);
  }
}

function ttResizeLaserCanvas() {
  ttResizeCanvas("ttLaserCanvas");
}

function ttResizeCanvas(canvasId) {
  const canvas = ttById(canvasId);
  if (!canvas) return;
  const ratio = window.devicePixelRatio || 1;
  const width = Math.floor(window.innerWidth * ratio);
  const height = Math.floor(window.innerHeight * ratio);
  if (canvas.width === width && canvas.height === height) return;
  canvas.width = width;
  canvas.height = height;
  canvas.style.width = `${window.innerWidth}px`;
  canvas.style.height = `${window.innerHeight}px`;
  const ctx = canvas.getContext("2d");
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
}

function ttLaserPoint(event) {
  const touch = event.touches?.[0] || event.changedTouches?.[0] || event;
  return { x: touch.clientX, y: touch.clientY };
}

function ttLaserStart(event) {
  if (!ttLaserEnabled) return;
  if (event.touches?.length > 1) {
    ttLaserLastPoint = null;
    return;
  }
  if (ttIsInteractiveTarget(event.target)) return;
  ttResizeLaserCanvas();
  ttLaserDrawing = true;
  ttLaserLastPoint = ttLaserPoint(event);
  ttDrawLaserDot(ttLaserLastPoint);
}

function ttLaserMove(event) {
  if (!ttLaserEnabled) return;
  if (event.touches?.length > 1) {
    ttLaserLastPoint = null;
    return;
  }
  if (ttIsInteractiveTarget(event.target)) {
    ttLaserLastPoint = null;
    return;
  }
  if (event.pointerType === "touch" || event.type.startsWith("touch")) event.preventDefault();
  const point = ttLaserPoint(event);
  if (ttLaserLastPoint) ttDrawLaserLine(ttLaserLastPoint, point);
  else ttDrawLaserDot(point);
  ttLaserLastPoint = point;
}

function ttLaserEnd(event) {
  if (!ttLaserEnabled) return;
  if (!ttLaserDrawing && ttIsInteractiveTarget(event.target)) return;
  ttLaserDrawing = false;
  ttLaserLastPoint = null;
}

function ttIsInteractiveTarget(target) {
  return Boolean(target?.closest?.("button, a, input, select, textarea, label, summary, details, .presentation-dock, .quick-jump"));
}

function ttDrawLaserLine(from, to) {
  ttDrawLine("ttLaserCanvas", from, to, {
    stroke: "rgba(220, 38, 38, 0.86)",
    shadow: "rgba(220, 38, 38, 0.55)",
    width: 10
  });
}

function ttDrawLaserDot(point) {
  ttDrawDot("ttLaserCanvas", point, {
    fill: "rgba(220, 38, 38, 0.9)",
    shadow: "rgba(220, 38, 38, 0.55)",
    radius: 5
  });
}

function ttDrawLine(canvasId, from, to, options) {
  if (!from || !to) return;
  const canvas = ttById(canvasId);
  const ctx = canvas?.getContext("2d");
  if (!ctx) return;
  ctx.save();
  ctx.globalCompositeOperation = "source-over";
  ctx.strokeStyle = options.stroke;
  ctx.shadowColor = options.shadow;
  ctx.shadowBlur = options.blur ?? 10;
  ctx.lineWidth = options.width;
  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  ctx.lineTo(to.x, to.y);
  ctx.stroke();
  ctx.restore();
}

function ttDrawDot(canvasId, point, options) {
  const canvas = ttById(canvasId);
  const ctx = canvas?.getContext("2d");
  if (!ctx || !point) return;
  ctx.save();
  ctx.fillStyle = options.fill;
  ctx.shadowColor = options.shadow;
  ctx.shadowBlur = options.blur ?? 10;
  ctx.beginPath();
  ctx.arc(point.x, point.y, options.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function ttStartLaserFade() {
  if (ttLaserFadeId) return;
  const fade = () => {
    const canvas = ttById("ttLaserCanvas");
    const ctx = canvas?.getContext("2d");
    if (ctx && ttLaserEnabled) {
      ctx.save();
      ctx.globalCompositeOperation = "destination-out";
      ctx.fillStyle = "rgba(0, 0, 0, 0.045)";
      ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
      ctx.restore();
    }
    ttLaserFadeId = requestAnimationFrame(fade);
  };
  ttLaserFadeId = requestAnimationFrame(fade);
}

function ttClearLaserCanvas() {
  ttClearCanvas("ttLaserCanvas");
}

function ttClearCanvas(canvasId) {
  const canvas = ttById(canvasId);
  const ctx = canvas?.getContext("2d");
  if (ctx) ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
}

function ttNotesStart(event) {
  if (!ttNotesEnabled) return;
  event.preventDefault();
  ttResizeCanvas("ttNotesCanvas");
  ttNotesDrawing = true;
  ttNotesLastPoint = ttLaserPoint(event);
  ttDrawDot("ttNotesCanvas", ttNotesLastPoint, {
    fill: "rgba(220, 38, 38, 0.9)",
    shadow: "rgba(220, 38, 38, 0.45)",
    radius: 5
  });
}

function ttNotesMove(event) {
  if (!ttNotesEnabled || !ttNotesDrawing) return;
  event.preventDefault();
  const point = ttLaserPoint(event);
  ttDrawLine("ttNotesCanvas", ttNotesLastPoint, point, {
    stroke: "rgba(220, 38, 38, 0.82)",
    shadow: "rgba(220, 38, 38, 0.45)",
    width: 8
  });
  ttNotesLastPoint = point;
}

function ttNotesEnd(event) {
  if (!ttNotesEnabled) return;
  event.preventDefault();
  ttNotesDrawing = false;
  ttNotesLastPoint = null;
}

function ttOpenWhiteboard() {
  const board = ttById("ttWhiteboard");
  if (!board) return;
  if (ttLaserEnabled) ttToggleLaser(false);
  if (ttNotesEnabled) ttToggleNotes(false, false);
  board.hidden = false;
  document.body.classList.add("whiteboard-mode");
  ttById("ttWhiteboardTitle").textContent = ttSection2Word ? `Whiteboard - ${ttSection2Word}` : "Section 2 Whiteboard";
  ttSetWhiteboardMode("move");
  requestAnimationFrame(() => {
    ttResizeWhiteboardCanvases();
    ttRenderWhiteboardPalette();
    if (!ttById("ttWhiteboardTiles").querySelector(".wb-built-tile")) ttBuildCurrentWordOnWhiteboard();
  });
}

function ttCloseWhiteboard() {
  ttById("ttWhiteboard").hidden = true;
  document.body.classList.remove("whiteboard-mode");
  ttWhiteboardDrawing = false;
  ttWhiteboardDrag = null;
  window.removeEventListener("pointermove", ttMoveWhiteboardTile);
  window.removeEventListener("pointerup", ttEndWhiteboardTileDrag);
  window.removeEventListener("pointercancel", ttEndWhiteboardTileDrag);
}

function ttSetWhiteboardMode(mode) {
  ttWhiteboardMode = mode;
  document.querySelectorAll(".wb-mode").forEach((button) => {
    button.classList.toggle("active", button.dataset.mode === mode);
  });
}

function ttRenderWhiteboardPalette() {
  const currentSubstep = ttLesson?.substep || ttActiveGroup().substep;
  const showAll = ttById("ttWhiteboardScope")?.value === "all";
  const substep = showAll ? "12.9" : currentSubstep;
  const bank = ttById("ttWhiteboardBank");
  if (bank) bank.innerHTML = "";
  const sounds = [
    ..."aeiou".split("").map((text) => ({ text, type: "vowel" })),
    ...consonantSoundList(substep).map((text) => ({ text, type: "consonant" }))
  ];
  const glued = knownWeldedAndExceptions
    .filter(([step]) => isAtLeastSubstep(substep, step))
    .map(([, text]) => ({ text, type: "glued" }));
  const prefixes = knownPrefixValues(substep).map((prefix) => ({ text: `${prefix}-`, type: "prefix" }));
  const suffixes = knownSuffixValues(substep).map((suffix) => ({ text: `-${suffix}`, type: "suffix" }));
  const latin = knownLatinBaseValues(substep).map((base) => ({ text: `-${base}-`, type: "latin" }));
  ttFillWhiteboardTray("ttWbSounds", sounds);
  ttFillWhiteboardTray("ttWbGlued", glued);
  ttFillWhiteboardTray("ttWbPrefixes", prefixes);
  ttFillWhiteboardTray("ttWbSuffixes", suffixes);
  ttFillWhiteboardTray("ttWbLatin", latin);
  ttLayoutWhiteboardBank(substep, showAll);
}

function ttFillWhiteboardTray(id, cards) {
  const tray = ttById(id);
  if (!tray) return;
  tray.innerHTML = "";
  cards.forEach((card) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = card.type;
    button.textContent = card.text;
    button.addEventListener("click", () => ttAutoPlaceWhiteboardCard(card));
    tray.appendChild(button);
  });
}

function ttLayoutWhiteboardBank() {
  const bank = ttById("ttWhiteboardBank");
  const stage = ttById("ttWhiteboardStage");
  if (!bank || !stage) return;
  const showAll = ttById("ttWhiteboardScope")?.value === "all";
  const currentSubstep = showAll ? "12.9" : (ttLesson?.substep || ttActiveGroup().substep);
  const leftRows = [
    ["a", "b", "c", "d", "e", "f"],
    ["g", "h", "i", "j", "k", "l"],
    ["m", "n", "o", "p", "qu", "r", "s"],
    ["t", "u", "v", "w", "x", "y", "z"],
    ["f", "l", "s"],
    ["wh", "ch", "sh", "th", "ck", "ph", "dge", "tch"],
    ["all", "am", "an", "tion", "sion", "y", "ə"],
    ["ild", "ind", "old", "olt", "ost", "ive", "stle"],
    ["ar", "er", "ir", "or", "ur"],
    ["ai", "ay", "ee", "ea", "ey", "oi", "oy"],
    ["oa", "oe", "ow", "ou"],
    ["oo", "ue", "ew", "au", "aw", "eu", "ui"],
    ["", "", ""]
  ];
  const vowelCards = new Set("a e i o u y ə ar er ir or ur ai ay ee ea ey oi oy oa oe ow ou oo ue ew au aw eu ui".split(" "));
  const gluedCards = new Set([...gluedSoundSet(), "tion", "sion", "ive", "stle"]);
  const currentValues = new Set([
    ..."aeiou".split(""),
    ...consonantSoundList(currentSubstep),
    ...knownWeldedAndExceptions.filter(([step]) => isAtLeastSubstep(currentSubstep, step)).map(([, value]) => {
      if (value.includes("ive")) return "ive";
      if (value.includes("stle")) return "stle";
      return value.replace(/\s+exception|\s+syllable/g, "");
    })
  ]);
  if (isAtLeastSubstep(currentSubstep, "5.3")) currentValues.add("y");
  if (isAtLeastSubstep(currentSubstep, "3.1")) currentValues.add("ə");
  if (isAtLeastSubstep(currentSubstep, "8.1")) "ar er ir or ur".split(" ").forEach((card) => currentValues.add(card));
  if (isAtLeastSubstep(currentSubstep, "9.1")) "ai ay".split(" ").forEach((card) => currentValues.add(card));
  if (isAtLeastSubstep(currentSubstep, "9.2")) "ee ey".split(" ").forEach((card) => currentValues.add(card));
  if (isAtLeastSubstep(currentSubstep, "9.3")) "ea oa oe".split(" ").forEach((card) => currentValues.add(card));
  if (isAtLeastSubstep(currentSubstep, "9.4")) "oi oy".split(" ").forEach((card) => currentValues.add(card));
  if (isAtLeastSubstep(currentSubstep, "9.5")) "ow ou".split(" ").forEach((card) => currentValues.add(card));
  if (isAtLeastSubstep(currentSubstep, "9.6")) "oo ue ew au aw eu ui".split(" ").forEach((card) => currentValues.add(card));
  const rightRows = [["ang", "ank"], ["ing", "ink"], ["ong", "onk"], ["ung", "unk"]];
  bank.innerHTML = "";
  const add = (text, x, y) => {
    if (text && !showAll && !currentValues.has(text)) return;
    const type = !text ? "blank" : gluedCards.has(text) ? "glued" : vowelCards.has(text) ? "vowel" : "consonant";
    bank.appendChild(ttCreateWhiteboardTile({ text, type }, x, y, "wb-bank-tile"));
  };
  const step = showAll ? 50 : 54;
  const bankTop = Math.max(96, (stage.clientHeight || 620) * 0.25);
  const leftWouldOverflow = showAll || (stage.clientHeight || 620) < bankTop + leftRows.length * step + 24;
  const leftRowsToPlace = leftWouldOverflow ? leftRows.slice(0, 8) : leftRows;
  leftRowsToPlace.forEach((row, rowIndex) => row.forEach((text, colIndex) => add(text, 22 + colIndex * step, bankTop + rowIndex * step)));
  const rightX = Math.max(490, Math.min((stage.clientWidth || 900) - 250, 560));
  rightRows.forEach((row, rowIndex) => row.forEach((text, colIndex) => add(text, rightX + colIndex * step, bankTop + rowIndex * step)));
  if (leftWouldOverflow) {
    const extraRows = leftRows.slice(8);
    extraRows.forEach((row, rowIndex) => {
      row.forEach((text, colIndex) => add(text, rightX + (colIndex % 4) * step, bankTop + (rightRows.length + 1 + rowIndex + Math.floor(colIndex / 4)) * step));
    });
  }
}

function ttBuildCurrentWordOnWhiteboard() {
  const substep = ttLesson?.substep || ttActiveGroup().substep;
  const word = ttSection2Word || (ttLesson?.sectionTwoCurrentWords || [])[0] || "";
  if (!word) return;
  ttClearBuiltWhiteboardTiles();
  const cards = section2CardsForWord(word, substep).items;
  const stage = ttById("ttWhiteboardStage");
  const width = stage.clientWidth || 900;
  const tileWidth = cards.some((card) => ["syllable", "prefix", "suffix", "latin"].includes(card.type)) ? 104 : 64;
  const gap = 10;
  const total = cards.length * tileWidth + Math.max(cards.length - 1, 0) * gap;
  let x = Math.max(24, (width - total) / 2);
  const y = Math.max(20, (stage.clientHeight || 520) * 0.12);
  cards.forEach((card) => {
    ttAddWhiteboardTile({ text: section2DisplayCardText(card), type: card.type }, x, y);
    x += tileWidth + gap;
  });
  ttById("ttWhiteboardTitle").textContent = `Whiteboard - ${word}`;
}

function ttAddWhiteboardTile(card, x = null, y = null) {
  const stage = ttById("ttWhiteboardStage");
  const layer = ttById("ttWhiteboardTiles");
  if (!stage || !layer) return;
  const count = layer.querySelectorAll(".wb-built-tile").length;
  const left = x ?? (24 + (count % 10) * 62);
  const top = y ?? Math.max(20, (stage.clientHeight || 520) * 0.12 + Math.floor(count / 10) * 54);
  const tile = ttCreateWhiteboardTile(card, left, top, "wb-built-tile");
  layer.appendChild(tile);
  return tile;
}

function ttCreateWhiteboardTile(card, x, y, extraClass = "") {
  const tile = document.createElement("button");
  tile.type = "button";
  tile.className = `wb-tile ${card.type || "consonant"} ${extraClass} ${card.big ? "wb-big-syllable" : ""}`.trim();
  tile.textContent = card.text || "";
  if (card.editable) {
    tile.contentEditable = "true";
    tile.autocorrect = "off";
    tile.spellcheck = false;
    tile.inputMode = "text";
    tile.setAttribute("aria-label", "Editable syllable card");
  }
  tile.dataset.tileId = String(++ttWhiteboardTileId);
  tile.dataset.cardText = card.text || "";
  tile.dataset.cardType = card.type || "consonant";
  tile.style.left = `${Math.max(8, x)}px`;
  tile.style.top = `${Math.max(8, y)}px`;
  tile.addEventListener("pointerdown", ttStartWhiteboardTileDrag);
  tile.addEventListener("click", () => {
    if (tile.dataset.autoPlaced === "true") {
      tile.dataset.autoPlaced = "false";
      return;
    }
    if (tile.dataset.dragged === "true" || !tile.classList.contains("wb-bank-tile")) return;
    ttAutoPlaceWhiteboardCard({ text: tile.dataset.cardText, type: tile.dataset.cardType });
  });
  return tile;
}

function ttAutoPlaceWhiteboardCard(card) {
  ttAddWhiteboardTile(card);
}

function ttAddBlankSyllableCard() {
  const layer = ttById("ttWhiteboardTiles");
  const stage = ttById("ttWhiteboardStage");
  if (!layer || !stage) return;
  const count = layer.querySelectorAll(".wb-edit-syllable").length;
  const usableWidth = Math.max(720, stage.clientWidth || window.innerWidth || 900) - 120;
  const cardWidth = Math.min(310, Math.max(210, usableWidth / 4 - 12));
  const col = count % 4;
  const row = Math.floor(count / 4);
  const x = 46 + col * (cardWidth + 14);
  const y = Math.max(92, (stage.clientHeight || 700) * 0.34) + row * 172;
  const tile = ttAddWhiteboardTile({ text: "", type: "syllable", big: true, editable: true }, x, y);
  if (tile) {
    tile.classList.add("wb-edit-syllable");
    tile.style.width = `${cardWidth}px`;
    tile.focus();
  }
}

function ttRemoveBlankSyllableCard() {
  const cards = [...ttById("ttWhiteboardTiles").querySelectorAll(".wb-edit-syllable")];
  cards.at(-1)?.remove();
}

function ttStartWhiteboardTileDrag(event) {
  if (event.currentTarget?.isContentEditable && ttWhiteboardMode !== "move") return;
  event.preventDefault();
  const tile = event.currentTarget;
  const stageRect = ttById("ttWhiteboardStage").getBoundingClientRect();
  const tileRect = tile.getBoundingClientRect();
  tile.dataset.dragged = "false";
  ttWhiteboardDrag = {
    tile,
    offsetX: event.clientX - tileRect.left,
    offsetY: event.clientY - tileRect.top,
    startX: event.clientX,
    startY: event.clientY,
    stageRect
  };
  tile.setPointerCapture?.(event.pointerId);
  window.addEventListener("pointermove", ttMoveWhiteboardTile, { passive: false });
  window.addEventListener("pointerup", ttEndWhiteboardTileDrag, { passive: false });
  window.addEventListener("pointercancel", ttEndWhiteboardTileDrag, { passive: false });
}

function ttMoveWhiteboardTile(event) {
  if (!ttWhiteboardDrag) return;
  event.preventDefault();
  const touch = event.touches?.[0] || event.changedTouches?.[0] || event;
  const { tile, offsetX, offsetY, startX, startY, stageRect } = ttWhiteboardDrag;
  if (Math.abs(touch.clientX - startX) + Math.abs(touch.clientY - startY) > 5) tile.dataset.dragged = "true";
  const maxX = stageRect.width - tile.offsetWidth - 6;
  const maxY = stageRect.height - tile.offsetHeight - 6;
  const x = Math.min(Math.max(touch.clientX - stageRect.left - offsetX, 6), maxX);
  const y = Math.min(Math.max(touch.clientY - stageRect.top - offsetY, 6), maxY);
  tile.style.left = `${x}px`;
  tile.style.top = `${y}px`;
}

function ttEndWhiteboardTileDrag() {
  if (ttWhiteboardDrag?.tile?.classList.contains("wb-bank-tile") && ttWhiteboardDrag.tile.dataset.dragged !== "true") {
    const tile = ttWhiteboardDrag.tile;
    ttAutoPlaceWhiteboardCard({ text: tile.dataset.cardText, type: tile.dataset.cardType });
    tile.dataset.autoPlaced = "true";
    window.setTimeout(() => {
      tile.dataset.autoPlaced = "false";
    }, 250);
  }
  ttWhiteboardDrag = null;
  window.removeEventListener("pointermove", ttMoveWhiteboardTile);
  window.removeEventListener("pointerup", ttEndWhiteboardTileDrag);
  window.removeEventListener("pointercancel", ttEndWhiteboardTileDrag);
}

function ttResizeWhiteboardCanvases() {
  ["ttWhiteboardInk", "ttWhiteboardLaserInk"].forEach((id) => {
    const canvas = ttById(id);
    const stage = ttById("ttWhiteboardStage");
    if (!canvas || !stage) return;
    const ratio = window.devicePixelRatio || 1;
    const width = Math.floor(stage.clientWidth * ratio);
    const height = Math.floor(stage.clientHeight * ratio);
    if (canvas.width === width && canvas.height === height) return;
    canvas.width = width;
    canvas.height = height;
    canvas.style.width = `${stage.clientWidth}px`;
    canvas.style.height = `${stage.clientHeight}px`;
    const ctx = canvas.getContext("2d");
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  });
}

function ttWhiteboardPoint(event) {
  const touch = event.touches?.[0] || event.changedTouches?.[0] || event;
  const rect = ttById("ttWhiteboardStage").getBoundingClientRect();
  return { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
}

function ttWhiteboardPointerStart(event) {
  if (ttById("ttWhiteboard").hidden || ttWhiteboardMode === "move") return;
  if (!event.target.closest?.("#ttWhiteboardStage")) return;
  if (event.target.closest?.(".wb-tile")) return;
  event.preventDefault();
  ttResizeWhiteboardCanvases();
  ttWhiteboardDrawing = true;
  ttWhiteboardLastPoint = ttWhiteboardPoint(event);
  ttDrawWhiteboardPoint(ttWhiteboardLastPoint);
}

function ttWhiteboardPointerMove(event) {
  ttMoveWhiteboardTile(event);
  if (!ttWhiteboardDrawing || ttWhiteboardMode === "move") return;
  event.preventDefault();
  const point = ttWhiteboardPoint(event);
  ttDrawWhiteboardLine(ttWhiteboardLastPoint, point);
  ttWhiteboardLastPoint = point;
}

function ttWhiteboardPointerEnd(event) {
  ttEndWhiteboardTileDrag();
  if (!ttWhiteboardDrawing) return;
  event.preventDefault();
  ttWhiteboardDrawing = false;
  ttWhiteboardLastPoint = null;
  if (ttWhiteboardMode === "laser") {
    setTimeout(() => ttClearWhiteboardCanvas("ttWhiteboardLaserInk"), 450);
  }
}

function ttDrawWhiteboardPoint(point) {
  const canvasId = ttWhiteboardMode === "laser" ? "ttWhiteboardLaserInk" : "ttWhiteboardInk";
  const canvas = ttById(canvasId);
  const ctx = canvas?.getContext("2d");
  if (!ctx) return;
  ctx.save();
  if (ttWhiteboardMode === "eraser") {
    ctx.globalCompositeOperation = "destination-out";
    ctx.fillStyle = "rgba(0,0,0,1)";
    ctx.beginPath();
    ctx.arc(point.x, point.y, 18, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.fillStyle = ttWhiteboardMode === "laser" ? "rgba(220,38,38,0.85)" : "rgba(220,38,38,0.92)";
    ctx.beginPath();
    ctx.arc(point.x, point.y, 4, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function ttDrawWhiteboardLine(from, to) {
  if (!from || !to) return;
  const canvasId = ttWhiteboardMode === "laser" ? "ttWhiteboardLaserInk" : "ttWhiteboardInk";
  const canvas = ttById(canvasId);
  const ctx = canvas?.getContext("2d");
  if (!ctx) return;
  ctx.save();
  if (ttWhiteboardMode === "eraser") {
    ctx.globalCompositeOperation = "destination-out";
    ctx.strokeStyle = "rgba(0,0,0,1)";
    ctx.lineWidth = 32;
  } else {
    ctx.strokeStyle = ttWhiteboardMode === "laser" ? "rgba(220,38,38,0.82)" : "rgba(220,38,38,0.9)";
    ctx.shadowColor = "rgba(220,38,38,0.35)";
    ctx.shadowBlur = 8;
    ctx.lineWidth = ttWhiteboardMode === "laser" ? 9 : 6;
  }
  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  ctx.lineTo(to.x, to.y);
  ctx.stroke();
  ctx.restore();
}

function ttClearWhiteboardCanvas(id = "ttWhiteboardInk") {
  const canvas = ttById(id);
  const stage = ttById("ttWhiteboardStage");
  const ctx = canvas?.getContext("2d");
  if (ctx && stage) ctx.clearRect(0, 0, stage.clientWidth, stage.clientHeight);
}

function ttClearWhiteboardTiles() {
  const layer = ttById("ttWhiteboardTiles");
  if (layer) layer.innerHTML = "";
}

function ttClearBuiltWhiteboardTiles() {
  ttById("ttWhiteboardTiles")?.querySelectorAll(".wb-built-tile").forEach((tile) => tile.remove());
}

function ttResetWhiteboardWordAndCards() {
  ttClearBuiltWhiteboardTiles();
  ttRenderWhiteboardPalette();
}

function ttBind() {
  let scrollSaveTimer = null;
  ttById("ttGroup").addEventListener("change", (event) => {
    ttRememberScroll();
    if (appStateSwitchGroup(event.target.value)) return;
  });

  ttById("ttStudent").addEventListener("change", (event) => ttSelectStudent(event.target.value));
  ttById("ttSubstep").addEventListener("change", (event) => {
    const group = ttActiveGroup();
    group.substep = event.target.value;
    group.pageProgress = { wordlist: 0, sentences: 0, passage: 0 };
    saveState();
    ttLesson = ttBuildLesson();
    ttSaveDraftLesson({ status: false });
    history.replaceState(null, "", location.pathname);
    ttSection2Word = "";
    ttRender();
  });
  ttById("ttReaderLevel").addEventListener("change", (event) => {
    const group = ttActiveGroup();
    group.readerLevel = event.target.value;
    group.pageProgress = { wordlist: 0, sentences: 0, passage: 0 };
    saveState();
    ttLesson = ttBuildLesson();
    ttSaveDraftLesson({ status: false });
    history.replaceState(null, "", location.pathname);
    ttSection2Word = "";
    ttRender();
  });
  ttById("ttSaveLesson").addEventListener("click", () => ttSaveCurrentLesson());
  ttById("ttPdfPlan").addEventListener("click", () => ttOpenPdfLessonPlan());
  ttById("ttWilsonPlan").addEventListener("click", () => ttOpenWilsonLessonPlan());
  ttById("ttRefresh").addEventListener("click", () => ttNewLesson());
  ttById("ttAddRosterStudent").addEventListener("click", () => ttAddStudentFromRoster());
  ttById("ttRosterAddSelected").addEventListener("click", () => ttAddSelectedRosterStudent());
  ttById("ttRosterAddNew").addEventListener("click", () => ttAddNewRosterStudent());
  ttById("ttRosterClose").addEventListener("click", () => ttToggleRosterPicker(false));
  ttById("ttNewRosterStudent").addEventListener("keydown", (event) => {
    if (event.key === "Enter") ttAddNewRosterStudent();
  });
  ttById("ttAttendance").addEventListener("click", () => {
    const panel = ttById("ttAttendancePanel");
    panel.hidden = !panel.hidden;
    if (!panel.hidden) ttRenderAttendancePanel(ttActiveGroup());
  });
  ttById("ttPresent").addEventListener("click", () => ttTogglePresentation());
  ttById("ttExitPresent").addEventListener("click", () => ttTogglePresentation(false));
  ttById("ttDockNew").addEventListener("click", () => ttDockClick("ttRefresh"));
  ttById("ttDockSaved").addEventListener("click", () => ttDockClick("ttSavedToggle"));
  ttById("ttDockData").addEventListener("click", () => ttDockClick("ttDataToggle"));
  ttById("ttDockProfile").addEventListener("click", () => ttDockClick("ttProfile"));
  ttById("ttLaserToggle").addEventListener("click", () => ttToggleLaser());
  ttById("ttNotesToggle").addEventListener("click", () => ttToggleNotes());
  ttById("ttDockTop").addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
  document.addEventListener("pointerdown", ttLaserStart);
  document.addEventListener("pointermove", ttLaserMove);
  document.addEventListener("pointerup", ttLaserEnd);
  document.addEventListener("pointercancel", ttLaserEnd);
  document.addEventListener("touchstart", ttLaserStart, { passive: false });
  document.addEventListener("touchmove", ttLaserMove, { passive: false });
  document.addEventListener("touchend", ttLaserEnd, { passive: false });
  const notesCanvas = ttById("ttNotesCanvas");
  notesCanvas.addEventListener("pointerdown", ttNotesStart);
  notesCanvas.addEventListener("pointermove", ttNotesMove);
  notesCanvas.addEventListener("pointerup", ttNotesEnd);
  notesCanvas.addEventListener("pointercancel", ttNotesEnd);
  notesCanvas.addEventListener("touchstart", ttNotesStart, { passive: false });
  notesCanvas.addEventListener("touchmove", ttNotesMove, { passive: false });
  notesCanvas.addEventListener("touchend", ttNotesEnd, { passive: false });
  window.addEventListener("resize", () => {
    if (ttLaserEnabled) {
      ttResizeLaserCanvas();
      ttClearLaserCanvas();
    }
    if (ttNotesEnabled) {
      ttResizeCanvas("ttNotesCanvas");
      ttClearCanvas("ttNotesCanvas");
    }
    if (!ttById("ttWhiteboard")?.hidden) {
      ttResizeWhiteboardCanvases();
    }
  });
  window.addEventListener("scroll", () => {
    clearTimeout(scrollSaveTimer);
    scrollSaveTimer = setTimeout(() => ttRememberScroll(), 120);
  }, { passive: true });
  ttById("ttSavedToggle").addEventListener("click", () => {
    const panel = ttById("ttSavedPanel");
    panel.hidden = !panel.hidden;
    if (!panel.hidden) {
      ttRenderSavedLessons(ttActiveGroup());
      panel.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });
  ttById("ttDataToggle").addEventListener("click", () => {
    const panel = ttById("ttDataPanel");
    panel.hidden = !panel.hidden;
    if (!panel.hidden) {
      ttRenderDataCenter();
      panel.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });
  ttById("ttProfile").addEventListener("click", () => ttOpenStudentProfile());
  ttById("ttBackupData").addEventListener("click", () => ttBackupData());
  ttById("ttConnectCloudSync").addEventListener("click", () => ttConnectCloudSync());
  ttById("ttSyncCloudNow").addEventListener("click", () => ttCloudSyncWrite("Saved local backup file now."));
  ttById("ttFirebaseSyncNow").addEventListener("click", () => ttSyncFirebaseAndLocalNow());
  ttById("ttRestoreData").addEventListener("click", () => ttById("ttRestoreFile").click());
  ttById("ttRestoreFile").addEventListener("change", (event) => ttRestoreDataFromFile(event.target.files?.[0]));
  ttById("ttExportCsv").addEventListener("click", () => exportMasterRecords());
  ttById("ttCloseSentenceDisplay").addEventListener("click", () => ttCloseSentenceDisplay());
  ttById("ttEditSection2Cards").addEventListener("click", () => ttEditSection2Cards());
  ttById("ttSaveSection2Cards").addEventListener("click", () => ttSaveSection2Cards());
  ttById("ttCancelSection2Edit").addEventListener("click", () => ttCancelSection2Edit());
  ttById("ttSection2EditInput").addEventListener("keydown", (event) => {
    if (event.key === "Enter") ttSaveSection2Cards();
    if (event.key === "Escape") ttCancelSection2Edit();
  });
  ttById("ttCurrentWordSelect").addEventListener("change", (event) => {
    if (event.target.value) ttShowSection2Word(event.target.value, ttLesson?.substep || ttActiveGroup().substep);
  });
  ttById("ttReviewCategory").addEventListener("change", (event) => {
    ttFillSection2ReviewCategoryWords(event.target.value, ttLesson?.substep || ttActiveGroup().substep);
  });
  ttById("ttUseCustomWord").addEventListener("click", () => ttUseCustomSection2Word());
  ttById("ttSection2CustomWord").addEventListener("keydown", (event) => {
    if (event.key === "Enter") ttUseCustomSection2Word();
  });
  ttById("ttOpenWhiteboard").addEventListener("click", () => ttOpenWhiteboard());
  ttById("ttCloseWhiteboard").addEventListener("click", () => ttCloseWhiteboard());
  ttById("ttWhiteboardBuildWord").addEventListener("click", () => ttBuildCurrentWordOnWhiteboard());
  ttById("ttWhiteboardAddBlank").addEventListener("click", () => ttAddBlankSyllableCard());
  ttById("ttWhiteboardRemoveBlank").addEventListener("click", () => ttRemoveBlankSyllableCard());
  ttById("ttWhiteboardClearInk").addEventListener("click", () => {
    ttClearWhiteboardCanvas("ttWhiteboardInk");
    ttClearWhiteboardCanvas("ttWhiteboardLaserInk");
  });
  ttById("ttWhiteboardClearTiles").addEventListener("click", () => ttResetWhiteboardWordAndCards());
  ttById("ttWhiteboardScope").addEventListener("change", () => ttRenderWhiteboardPalette());
  document.querySelectorAll(".wb-mode").forEach((button) => {
    button.addEventListener("click", () => ttSetWhiteboardMode(button.dataset.mode));
  });
  const whiteboardStage = ttById("ttWhiteboardStage");
  whiteboardStage.addEventListener("pointerdown", ttWhiteboardPointerStart, true);
  whiteboardStage.addEventListener("pointermove", ttWhiteboardPointerMove, true);
  whiteboardStage.addEventListener("pointerup", ttWhiteboardPointerEnd, true);
  whiteboardStage.addEventListener("pointercancel", ttWhiteboardPointerEnd, true);
  whiteboardStage.addEventListener("touchstart", ttWhiteboardPointerStart, { passive: false, capture: true });
  whiteboardStage.addEventListener("touchmove", ttWhiteboardPointerMove, { passive: false, capture: true });
  whiteboardStage.addEventListener("touchend", ttWhiteboardPointerEnd, { passive: false, capture: true });
  ttById("ttHfwStep").addEventListener("change", (event) => {
    if (!ttLesson) return;
    ttFillHfwDisplayWords(hfwWordsForSubstep(event.target.value, ttLesson), event.target.value);
  });
  ttById("ttSection3HfwStep")?.addEventListener("change", () => {
    ttCardMode = "hfw";
    ttFillSection3Cards(ttLesson);
  });
  ttById("ttBackTop").addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
  document.querySelectorAll(".card-mode").forEach((button) => {
    button.addEventListener("click", () => {
      ttCardMode = button.dataset.mode;
      document.querySelectorAll(".card-mode").forEach((item) => item.classList.toggle("active", item === button));
      ttFillSection3Cards(ttLesson);
    });
  });
  document.querySelectorAll(".section-refresh[data-refresh-section]").forEach((button) => {
    button.addEventListener("click", () => ttRefreshSection(button.dataset.refreshSection));
  });
  ttById("ttRecheckCharting")?.addEventListener("click", () => ttRecheckSection4Words());
  ttById("ttCardPrev").addEventListener("click", () => ttShowCard(ttCardIndex - 1));
  ttById("ttCardNext").addEventListener("click", () => ttShowCard(ttCardIndex + 1));

  ttById("section4").querySelectorAll(".half-toggle").forEach((button) => {
    button.addEventListener("click", () => {
      ttChartCard.dataset.chartHalf = button.dataset.half;
      syncChartHalfUi(ttChartCard);
      updateLiveScore(ttChartCard);
    });
  });
  ttById("section4").querySelector(".start-timer").addEventListener("click", () => startLiveTimer(ttChartCard, false));
  ttById("section4").querySelector(".pause-timer").addEventListener("click", () => pauseLiveTimer(ttChartCard));
  ttById("section4").querySelector(".stop-timer").addEventListener("click", () => {
    stopLiveTimer(ttChartCard);
    saveLiveRecordIfNeeded(ttChartCard);
  });
  ttById("section4").querySelector(".mic-toggle").addEventListener("click", () => startLiveTimer(ttChartCard, true));
  ttById("section4").querySelector(".save-live-record").addEventListener("click", () => saveLiveRecord(ttChartCard));
}

function appStateSwitchGroup(groupId) {
  const stored = JSON.parse(localStorage.getItem("dyslexiaInstructionEngine.v2") || "{}");
  if (!stored.groups?.some((group) => group.id === groupId)) return false;
  stored.selectedGroupId = groupId;
  localStorage.setItem("dyslexiaInstructionEngine.v2", JSON.stringify(stored));
  const url = new URL(location.href);
  url.searchParams.set("group", groupId);
  url.searchParams.delete("plan");
  location.href = url.href;
  return true;
}

function ttLoadPlanFromUrl() {
  const params = new URLSearchParams(location.search);
  const groupId = params.get("group");
  const planId = params.get("plan");
  if (groupId && groupId !== ttActiveGroup().id) {
    const stored = JSON.parse(localStorage.getItem("dyslexiaInstructionEngine.v2") || "{}");
    if (stored.groups?.some((group) => group.id === groupId)) {
      stored.selectedGroupId = groupId;
      localStorage.setItem("dyslexiaInstructionEngine.v2", JSON.stringify(stored));
      location.href = `${location.pathname}?group=${encodeURIComponent(groupId)}&plan=${encodeURIComponent(planId || "")}`;
    }
    return null;
  }
  if (!planId) return null;
  const group = ttActiveGroup();
  const plan = (group.history || []).find((item) => item.id === planId);
  if (!plan?.lessons?.[0]) return null;
  ttLesson = ttClone(plan.lessons[0]);
  ttLesson.savedPlanId = plan.id;
  ttUpdateSaveStatus(plan);
  return plan;
}

function ttOpenStudentProfile() {
  if (ttChartCard) saveLiveRecordIfNeeded(ttChartCard);
  const group = ttActiveGroup();
  const student = group.activeStudent || group.students[0] || "";
  if (!student) return;
  const url = `StudentProfile.html?group=${encodeURIComponent(group.id)}&student=${encodeURIComponent(student)}`;
  window.open(url, "_blank");
}

ttLoadPlanFromUrl() || ttLoadDraftLesson() || ttBuildLesson();
ttInitCloudSync();
ttInitFirebaseSync();
ttBind();
ttRender();
ttToggleLaser(true);
