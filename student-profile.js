const storageKey = "dyslexiaInstructionEngine.v2";
const profileChannel = "BroadcastChannel" in window ? new BroadcastChannel("teachTodayState.v1") : null;
const params = new URLSearchParams(location.search);

let data = readState();
let selectedYearId = params.get("schoolYear") || "";
let selectedGroupId = params.get("group") || "";
let selectedStudentId = params.get("studentId") || "";
let selectedStudentName = params.get("student") || "";
let selectedView = "group";
let selectedTab = "overview";

function byId(id) {
  return document.getElementById(id);
}

function readState() {
  try {
    const parsed = JSON.parse(localStorage.getItem(storageKey) || "{}");
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch (_) {
    return {};
  }
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function normalizeName(value) {
  return String(value || "").trim().toLocaleLowerCase();
}

function dateValue(value) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function academicYearId(value = new Date()) {
  const date = dateValue(value);
  if (!date) return "";
  const year = date.getFullYear();
  const start = date.getMonth() >= 6 ? year : year - 1;
  return `${start}-${start + 1}`;
}

function currentYearId() {
  return data.activeSchoolYearId || academicYearId();
}

function groupForId(groupId) {
  return (data.groups || []).find((group) => group.id === groupId) || null;
}

function recordDate(record) {
  return record?.sessionDate
    || record?.scheduledDate
    || record?.date
    || record?.displayDate
    || record?.lessonSavedAt
    || record?.savedAt
    || record?.createdAt
    || "";
}

function recordTime(record) {
  return dateValue(recordDate(record))?.getTime() || 0;
}

function recordYear(record, fallbackGroup = null) {
  if (record?.schoolYearId) return record.schoolYearId;
  const explicitSessionYear = academicYearId(record?.sessionDate || record?.scheduledDate);
  if (explicitSessionYear) return explicitSessionYear;
  const linkedGroup = fallbackGroup || groupForId(record?.groupIdAtTime || record?.groupId || record?.homeGroupIdAtTime);
  if (linkedGroup?.schoolYearId) return linkedGroup.schoolYearId;
  return academicYearId(record?.date || record?.displayDate) || currentYearId();
}

function groupDisplayOrder(group) {
  const name = String(group?.name || "").trim();
  const numbered = name.match(/^group\s+(\d+)\b/i);
  if (numbered) return [0, Number(numbered[1]), name];
  if (/^sample(?:\s+group)?$/i.test(name) || group?.id === "grp-sample-blue") return [2, 0, name];
  if (/^demo(?:\s+group)?$/i.test(name) || group?.id === "grp-demo" || group?.isDemoGroup || group?.isDemo) return [1, 0, name];
  return [0, Number.MAX_SAFE_INTEGER, name];
}

function availableYears() {
  const years = new Set((data.schoolYears || []).map((year) => year.id).filter(Boolean));
  (data.groups || []).forEach((group) => group.schoolYearId && years.add(group.schoolYearId));
  (data.masterRecords || []).forEach((record) => {
    const year = recordYear(record);
    if (year) years.add(year);
  });
  years.add(currentYearId());
  return [...years].sort((a, b) => b.localeCompare(a));
}

function groupsForYear(yearId = selectedYearId) {
  return (data.groups || [])
    .filter((group) => group.schoolYearId === yearId)
    .sort((a, b) => {
      const left = groupDisplayOrder(a);
      const right = groupDisplayOrder(b);
      return left[0] - right[0] || left[1] - right[1] || left[2].localeCompare(right[2]);
    });
}

function studentIdFor(group, name) {
  return group?.studentIds?.[name]
    || (data.rosterStudents || []).find((student) => student.studentId && [student.name, student.fullName, student.displayName, ...(student.aliases || [])].some((value) => normalizeName(value) === normalizeName(name)))?.studentId
    || "";
}

function studentsForGroup(group) {
  return [...new Set(group?.students || [])].map((name) => ({
    name,
    studentId: studentIdFor(group, name),
    key: studentIdFor(group, name) || `name:${normalizeName(name)}`
  })).sort((a, b) => a.name.localeCompare(b.name));
}

function selectedGroup() {
  return groupsForYear().find((group) => group.id === selectedGroupId) || groupsForYear()[0] || null;
}

function selectedStudent() {
  const group = selectedGroup();
  const students = studentsForGroup(group);
  return students.find((student) => selectedStudentId && student.studentId === selectedStudentId)
    || students.find((student) => normalizeName(student.name) === normalizeName(selectedStudentName))
    || students[0]
    || { name: "", studentId: "", key: "" };
}

function matchesStudent(record, student = selectedStudent()) {
  if (!record || !student?.name) return false;
  if (student.studentId && record.studentId) return record.studentId === student.studentId;
  return normalizeName(record.student || record.studentName || record.name) === normalizeName(student.name);
}

function ensureSelection() {
  const years = availableYears();
  if (!selectedYearId || !years.includes(selectedYearId)) selectedYearId = years.includes(currentYearId()) ? currentYearId() : years[0] || currentYearId();
  const groups = groupsForYear(selectedYearId);
  if (!groups.some((group) => group.id === selectedGroupId)) {
    const requestedStudentGroup = groups.find((group) => studentsForGroup(group).some((student) => selectedStudentId ? student.studentId === selectedStudentId : normalizeName(student.name) === normalizeName(selectedStudentName)));
    selectedGroupId = requestedStudentGroup?.id || groups[0]?.id || "";
  }
  const students = studentsForGroup(selectedGroup());
  const chosen = students.find((student) => selectedStudentId && student.studentId === selectedStudentId)
    || students.find((student) => normalizeName(student.name) === normalizeName(selectedStudentName))
    || students[0];
  selectedStudentId = chosen?.studentId || "";
  selectedStudentName = chosen?.name || "";
}

function isChartingRecord(record) {
  return record?.type !== "soundsDrill" && (record?.correct !== undefined || record?.wordlistPage || record?.chartHalf);
}

function chartingRecords(student = selectedStudent()) {
  return (data.masterRecords || [])
    .filter((record) => isChartingRecord(record) && matchesStudent(record, student) && recordYear(record) === selectedYearId)
    .sort((a, b) => recordTime(b) - recordTime(a));
}

function lessonPlans(student = selectedStudent()) {
  const seen = new Set();
  return groupsForYear(selectedYearId).flatMap((group) => (group.history || []).flatMap((plan) => {
    const participant = student.studentId && (plan.participantStudentIds || []).includes(student.studentId);
    const groupMembership = studentsForGroup(group).some((member) => student.studentId ? member.studentId === student.studentId : normalizeName(member.name) === normalizeName(student.name));
    if (!participant && !groupMembership) return [];
    const id = plan.hostPlanId || plan.id || `${group.id}:${plan.savedAt || plan.created || ""}`;
    if (seen.has(id)) return [];
    seen.add(id);
    return [{ ...plan, _group: group }];
  })).filter((plan) => recordYear(plan, plan._group) === selectedYearId)
    .sort((a, b) => recordTime(b) - recordTime(a));
}

function observationCode(record) {
  if (record.observationCode) return record.observationCode;
  const note = String(record.note || "").toLowerCase();
  if (note.includes("automatic")) return "Auto";
  if (note.includes("accurate")) return "Acc";
  if (note.includes("struggl")) return "Strug";
  if (note.includes("nonsense")) return "NS";
  if (note.includes("blend")) return "Blends";
  if (note.includes("vowel")) return "Vowel Diff";
  if (note.includes("high-frequency")) return "HFW";
  if (note.includes("suffix")) return "Sfx";
  return record.item ? "Miss" : "Observation";
}

function observations() {
  const student = arguments[0] || selectedStudent();
  const rows = groupsForYear(selectedYearId).flatMap((group) => {
    const encoding = (group.encodingObservations || []).filter((record) => matchesStudent(record, student) && recordYear(record, group) === selectedYearId)
      .map((record) => ({ ...record, _group: group, section: record.section || "section8" }));
    const encodingKeys = new Set(encoding.map((record) => `${record.planId || record.lessonId || ""}|${normalizeName(record.item)}|${String(recordDate(record)).slice(0, 10)}`));
    const dictationOnly = (group.dictationMisses || []).filter((record) => matchesStudent(record, student) && recordYear(record, group) === selectedYearId)
      .filter((record) => !encodingKeys.has(`${record.planId || record.lessonId || ""}|${normalizeName(record.item)}|${String(recordDate(record)).slice(0, 10)}`))
      .map((record) => ({ ...record, _group: group, section: "section8", observationCode: "Miss", observationKind: "missed-item" }));
    return encoding.concat(dictationOnly);
  });
  const seen = new Set();
  return rows.filter((record) => {
    const key = record.id || `${record.section}|${record.planId || record.lessonId || ""}|${record.studentId || normalizeName(record.student)}|${recordTime(record)}|${record.item || record.note || ""}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).sort((a, b) => recordTime(b) - recordTime(a));
}

function attendanceEntries(student = selectedStudent()) {
  return groupsForYear(selectedYearId).flatMap((group) => Object.entries(data.attendanceSessions?.[group.id] || {}).flatMap(([day, session]) => {
    if (academicYearId(day) !== selectedYearId || session?.status === "no-session") return [];
    const byId = student.studentId ? session?.attendanceByStudentId?.[student.studentId] : undefined;
    const byName = session?.attendance?.[student.name];
    const present = byId !== undefined ? byId : byName;
    if (present === undefined) return [];
    return [{ id: `attendance:${group.id}:${day}:${student.key}`, date: day, present, group, session }];
  })).sort((a, b) => recordTime(b) - recordTime(a));
}

function formatDate(value, includeTime = false) {
  const date = dateValue(value);
  if (!date) return "Date unavailable";
  return new Intl.DateTimeFormat(undefined, includeTime
    ? { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }
    : { month: "short", day: "numeric", year: "numeric" }).format(date);
}

function average(records, key) {
  const values = records.map((record) => Number(record[key])).filter(Number.isFinite);
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
}

function countNeeds(charts, marks) {
  const counts = new Map();
  const add = (value) => {
    const clean = String(value || "").trim();
    if (!clean) return;
    counts.set(clean, (counts.get(clean) || 0) + 1);
  };
  charts.forEach((record) => (record.wrongWords || []).forEach(add));
  marks.forEach((record) => {
    if (record.item) add(record.item);
    else if (["NS", "Blends", "Vowel Diff", "HFW", "Sfx", "Strug"].includes(observationCode(record))) add(observationCode(record));
  });
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 10);
}

function timelineEntries(student = selectedStudent()) {
  const charts = chartingRecords(student).map((record) => ({
    id: record.id,
    date: recordDate(record),
    kind: "Charting",
    title: `${record.correct ?? "—"}/${record.total || 15} correct · ${record.substep || "Substep unavailable"}`,
    detail: `Reader ${record.reader || "—"}, p. ${record.wordlistPage || "—"}${record.wrongWords?.length ? ` · Missed: ${record.wrongWords.slice(0, 5).join(", ")}` : ""}`
  }));
  const marks = observations(student).map((record) => ({
    id: record.id,
    date: recordDate(record),
    kind: String(record.section || "").replace("section", "Section "),
    title: `${observationCode(record)}${record.item ? ` · ${record.item}` : ""}`,
    detail: `${record.substep || "Substep unavailable"}${record.category ? ` · ${record.category}` : ""}`
  }));
  const lessons = lessonPlans(student).filter((plan) => plan.hasStudentData || ["Taught", "Complete"].includes(plan.status)).map((plan) => ({
    id: plan.id,
    date: recordDate(plan),
    kind: "Lesson",
    title: plan.title || `Lesson ${plan.lessonNumber || ""}`,
    detail: `${plan.status || "Saved"} · ${plan.substep || plan.lessons?.[0]?.substep || "Substep unavailable"}`
  }));
  const attendance = attendanceEntries(student).map((entry) => ({
    id: entry.id,
    date: entry.date,
    kind: "Attendance",
    title: entry.present ? "Present" : "Absent",
    detail: entry.group.name || "Group unavailable"
  }));
  return charts.concat(marks, lessons, attendance).sort((a, b) => recordTime(b) - recordTime(a));
}

function renderPickers() {
  const years = availableYears();
  const yearLabels = new Map((data.schoolYears || []).map((year) => [year.id, year.label || year.id]));
  byId("profileSchoolYear").innerHTML = years.map((year) => `<option value="${escapeHtml(year)}">${escapeHtml(yearLabels.get(year) || year)}${year === currentYearId() ? " · Current" : " · Archived"}</option>`).join("");
  byId("profileSchoolYear").value = selectedYearId;

  const groups = groupsForYear();
  const activeGroup = selectedGroup();
  const chosenStudent = selectedStudent();
  const students = studentsForGroup(activeGroup);
  byId("profilePickerTitle").textContent = activeGroup?.name || "No group selected";
  byId("profileGroupPosition").textContent = groups.length ? `${groups.findIndex((group) => group.id === activeGroup?.id) + 1} of ${groups.length} · ${students.length} student${students.length === 1 ? "" : "s"}` : "";
  byId("profileRosterPicker").innerHTML = activeGroup ? `<section class="profile-group-column selected" aria-label="${escapeHtml(activeGroup.name || "Unnamed group")}">
      <button type="button" class="profile-group-button${selectedView === "group" ? " active" : ""}" data-profile-group data-group-id="${escapeHtml(activeGroup.id)}" aria-pressed="${selectedView === "group"}">Whole group</button>
      <div class="profile-student-buttons">
        ${students.length ? students.map((student) => {
          const active = selectedView === "student" && student.key === chosenStudent.key;
          return `<button type="button" class="profile-student-button${active ? " active" : ""}" data-profile-student data-group-id="${escapeHtml(activeGroup.id)}" data-student-key="${escapeHtml(student.key)}" aria-pressed="${active}">${escapeHtml(student.name)}</button>`;
        }).join("") : '<p class="profile-group-empty">No students in this group.</p>'}
      </div>
    </section>` : '<p class="profile-roster-empty">No instructional groups in this school year.</p>';
  byId("previousProfileGroup").disabled = groups.length < 2;
  byId("nextProfileGroup").disabled = groups.length < 2;

  const archived = selectedYearId !== currentYearId();
  byId("yearModeBadge").textContent = archived ? "Archived · Read only" : "Current";
  byId("yearModeBadge").classList.toggle("archived", archived);
  byId("archiveNotice").hidden = !archived;
}

function renderHeader() {
  const student = selectedStudent();
  const group = selectedGroup();
  const groupMode = selectedView === "group";
  byId("studentName").textContent = groupMode ? (group?.name || "No group selected") : (student.name || "No student selected");
  byId("profileEyebrow").textContent = groupMode ? "Whole-group summary" : (selectedYearId === currentYearId() ? "Current school year" : "Archived school year");
  byId("studentMeta").textContent = group ? (groupMode ? `${studentsForGroup(group).length} students · ${selectedYearId}` : `${group.name} · ${selectedYearId}`) : `${selectedYearId} · No group`;
  const saved = dateValue(data.lastSavedAt);
  byId("lastSavedAt").textContent = saved ? `Device state saved ${formatDate(saved, true)}` : "No verified save time";
  const strip = document.querySelector(".profile-sync-strip");
  strip.classList.toggle("is-stale", !saved);
  byId("syncTitle").textContent = saved ? "Live device record" : "Save status unavailable";
  byId("syncDetail").textContent = saved ? "This read-only profile is using the same device state as Home and Lesson/Present." : "The legacy dataset did not include a confirmed local save time.";
}

function renderOverview() {
  const charts = chartingRecords();
  const marks = observations();
  const lessons = lessonPlans().filter((plan) => plan.hasStudentData || ["Taught", "Complete"].includes(plan.status));
  const attendance = attendanceEntries();
  byId("lessonCount").textContent = lessons.length;
  byId("chartingCount").textContent = charts.length;
  byId("observationCount").textContent = marks.length;
  byId("attendanceCount").textContent = attendance.length;

  const recentCharts = charts.slice(0, 5);
  const avgCorrect = average(recentCharts, "correct");
  const avgSeconds = average(recentCharts, "seconds");
  const autoRate = recentCharts.length ? Math.round((recentCharts.filter((record) => record.automaticity).length / recentCharts.length) * 100) : null;
  byId("profileSummary").innerHTML = charts.length || marks.length ? `
    <article><b>${avgCorrect === null ? "—" : avgCorrect.toFixed(1)}/15</b><span>Recent charting accuracy</span></article>
    <article><b>${avgSeconds === null ? "—" : `${Math.round(avgSeconds)} sec`}</b><span>Recent decoding time</span></article>
    <article><b>${autoRate === null ? "—" : `${autoRate}%`}</b><span>Recent automaticity</span></article>` : "No saved records for this student in this school year.";

  const needs = countNeeds(charts, marks);
  byId("reviewNeeds").innerHTML = needs.length
    ? needs.map(([need, count]) => `<span class="need-chip">${escapeHtml(need)} · ${count}</span>`).join("")
    : "No repeated misses or difficulty observations yet.";
  renderTimeline(byId("latestActivity"), timelineEntries().slice(0, 5));
}

function chartingMetricClass(kind, value, total = 15) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "metric-empty";
  if (kind === "correct") {
    const ratio = number / (Number(total) || 15);
    return ratio >= .8 ? "metric-good" : ratio >= .67 ? "metric-watch" : "metric-risk";
  }
  if (kind === "seconds") return number <= 30 ? "metric-good" : number <= 45 ? "metric-watch" : "metric-risk";
  if (kind === "wcpm") return number >= 30 ? "metric-good" : number >= 20 ? "metric-watch" : "metric-risk";
  return "metric-empty";
}

function chartingStatus(record) {
  if (!record) return { label: "No data yet", className: "status-empty" };
  const correct = Number(record.correct);
  const seconds = Number(record.seconds);
  const automatic = Boolean(record.automaticity) || (Number.isFinite(seconds) && seconds <= 30);
  if (correct >= 12 && automatic) return { label: "Accurate and automatic", className: "status-good" };
  if (correct >= 12) return { label: "Accurate, building speed", className: "status-watch" };
  return { label: "Support needed", className: "status-risk" };
}

function encodingBucket(record) {
  if (!record?.item) return "";
  const detail = `${record.category || ""} ${record.observationKind || ""} ${record.type || ""}`.toLowerCase();
  if (/high[- ]?frequency|\bhfw\b/.test(detail)) return "hfw";
  if (/nonsense|\bns\b/.test(detail)) return "nonsense";
  if (/word[- ]?element|syllable|element/.test(detail)) return "elements";
  if (/sound|phoneme|letter[- ]?sound/.test(detail)) return "sounds";
  if (record.section === "section6") return "sounds";
  if (record.section === "section7") return "real";
  if (record.section === "section8" && /real|word|review|current/.test(detail)) return "real";
  return "";
}

function itemCounts(records, bucket, limit) {
  const counts = new Map();
  records.filter((record) => encodingBucket(record) === bucket).forEach((record) => {
    const item = String(record.item || "").trim();
    if (item) counts.set(item, (counts.get(item) || 0) + 1);
  });
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, limit);
}

function miniItemBars(items, emptyText = "None saved") {
  if (!items.length) return `<p class="mini-empty">${escapeHtml(emptyText)}</p>`;
  const max = Math.max(...items.map(([, count]) => count), 1);
  return `<div class="mini-item-bars">${items.map(([item, count]) => `<div class="mini-item-row"><span title="${escapeHtml(item)}">${escapeHtml(item)}</span><div><i style="width:${Math.max(10, Math.round((count / max) * 100))}%"></i></div><b>${count}</b></div>`).join("")}</div>`;
}

function comparisonBarRows(rows, valueLabel) {
  if (!rows.length) return '<p class="mini-empty">No students in this group.</p>';
  const max = Math.max(...rows.map((row) => row.value), 1);
  return rows.map((row) => `<div class="comparison-bar-row">
    <button type="button" data-profile-student-jump data-student-key="${escapeHtml(row.student.key)}">${escapeHtml(row.student.name)}</button>
    <div><i style="width:${Math.max(row.value ? 7 : 0, Math.round((row.value / max) * 100))}%"></i></div>
    <strong>${escapeHtml(valueLabel(row.value))}</strong>
  </div>`).join("");
}

function renderGroupVisuals(studentRows) {
  byId("groupChartingTrends").innerHTML = studentRows.map((row) => {
    const recent = row.charts.slice(0, 10).reverse();
    return `<article class="student-trend-card">
      <button type="button" class="trend-student-name" data-profile-student-jump data-student-key="${escapeHtml(row.student.key)}">${escapeHtml(row.student.name)}</button>
      ${recent.length ? `<div class="spark-bars" aria-label="${escapeHtml(row.student.name)} recent charting scores">${recent.map((record) => {
        const correct = Math.max(0, Math.min(Number(record.correct) || 0, Number(record.total) || 15));
        const total = Number(record.total) || 15;
        return `<span title="${escapeHtml(formatDate(recordDate(record)))}: ${correct}/${total}" style="height:${Math.max(5, Math.round((correct / total) * 100))}%"><b>${correct}</b></span>`;
      }).join("")}</div><small>${recent.length} saved session${recent.length === 1 ? "" : "s"}</small>` : '<p class="mini-empty">No charting yet</p>'}
    </article>`;
  }).join("") || '<p class="mini-empty">No students in this group.</p>';

  const speedRows = studentRows.map((row) => {
    const values = row.charts.slice(0, 10).map((record) => Number(record.seconds)).filter(Number.isFinite);
    return { student: row.student, value: values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : 0, hasData: values.length > 0 };
  });
  byId("groupSpeedComparison").innerHTML = comparisonBarRows(speedRows, (value) => value ? `${value}s` : "—");

  byId("groupEncodingPatterns").innerHTML = studentRows.map((row) => `<article class="encoding-pattern-card">
    <button type="button" class="trend-student-name" data-profile-student-jump data-student-key="${escapeHtml(row.student.key)}">${escapeHtml(row.student.name)}</button>
    <section><h4>Sounds</h4>${miniItemBars(itemCounts(row.marks, "sounds", 10))}</section>
    <section><h4>Word elements</h4>${miniItemBars(itemCounts(row.marks, "elements", 5))}</section>
    <section><h4>Real words</h4>${miniItemBars(itemCounts(row.marks, "real", 5))}</section>
  </article>`).join("") || '<p class="mini-empty">No students in this group.</p>';

  const comparisons = [
    ["Real words", "real"],
    ["Nonsense words", "nonsense"],
    ["High-frequency words", "hfw"]
  ];
  byId("groupEncodingComparison").innerHTML = comparisons.map(([label, bucket]) => {
    const rows = studentRows.map((row) => ({ student: row.student, value: row.marks.filter((record) => encodingBucket(record) === bucket).length }));
    return `<section class="encoding-comparison-card"><h4>${label}</h4><div class="comparison-bars">${comparisonBarRows(rows, (value) => String(value))}</div></section>`;
  }).join("");
}

function renderGroupOverview() {
  const group = selectedGroup();
  const students = studentsForGroup(group);
  const studentRows = students.map((student) => {
    const charts = chartingRecords(student);
    const latestChart = charts[0] || null;
    const recentCharts = charts.slice(0, 5);
    const marks = observations(student);
    const missed = marks.filter((record) => record.item);
    const needs = countNeeds([], marks);
    const status = chartingStatus(latestChart);
    const autoRate = recentCharts.length ? Math.round((recentCharts.filter((record) => record.automaticity || Number(record.seconds) <= 30).length / recentCharts.length) * 100) : null;
    return { student, charts, latestChart, marks, missed, needs, status, autoRate };
  });
  const groupLessons = (group?.history || []).filter((plan) => recordYear(plan, group) === selectedYearId && (plan.hasStudentData || ["Taught", "Complete"].includes(plan.status)));
  const allCharts = studentRows.flatMap((row) => row.charts);
  const allMarks = studentRows.flatMap((row) => row.marks);
  byId("groupStudentCount").textContent = students.length;
  byId("groupLessonCount").textContent = groupLessons.length;
  byId("groupChartingCount").textContent = allCharts.length;
  byId("groupObservationCount").textContent = allMarks.length;
  renderGroupVisuals(studentRows);

  const decoding = [...studentRows].sort((a, b) => {
    if (!a.latestChart) return b.latestChart ? 1 : a.student.name.localeCompare(b.student.name);
    if (!b.latestChart) return -1;
    return (Number(b.latestChart.correct) || 0) - (Number(a.latestChart.correct) || 0)
      || (Number(a.latestChart.seconds) || 999) - (Number(b.latestChart.seconds) || 999)
      || a.student.name.localeCompare(b.student.name);
  });
  byId("groupChartingRows").innerHTML = decoding.length ? decoding.map((row) => {
    const record = row.latestChart;
    return `<tr>
      <td><button type="button" class="table-student-link" data-profile-student-jump data-student-key="${escapeHtml(row.student.key)}">${escapeHtml(row.student.name)}</button></td>
      <td class="${chartingMetricClass("correct", record?.correct, record?.total)}">${record ? `${escapeHtml(record.correct ?? "—")}/${escapeHtml(record.total || 15)}` : "—"}</td>
      <td class="${chartingMetricClass("seconds", record?.seconds)}">${escapeHtml(record?.seconds ?? "—")}</td>
      <td class="${chartingMetricClass("wcpm", record?.wcpm)}">${escapeHtml(record?.wcpm ?? "—")}</td>
      <td class="${row.autoRate === null ? "metric-empty" : row.autoRate >= 75 ? "metric-good" : row.autoRate >= 40 ? "metric-watch" : "metric-risk"}">${row.autoRate === null ? "—" : `${row.autoRate}%`}</td>
      <td><span class="comparison-status ${row.status.className}">${escapeHtml(row.status.label)}</span></td>
    </tr>`;
  }).join("") : '<tr><td colspan="6" class="table-empty">No students in this group.</td></tr>';

  const encoding = [...studentRows].sort((a, b) => a.missed.length - b.missed.length || a.student.name.localeCompare(b.student.name));
  byId("groupEncodingRows").innerHTML = encoding.length ? encoding.map((row) => {
    const last = row.marks[0];
    const top = row.needs[0]?.[0] || "—";
    return `<tr>
      <td><button type="button" class="table-student-link" data-profile-student-jump data-student-key="${escapeHtml(row.student.key)}">${escapeHtml(row.student.name)}</button></td>
      <td class="${row.missed.length ? "metric-watch" : "metric-good"}">${row.missed.length}</td>
      <td>${row.marks.length}</td>
      <td>${escapeHtml(top)}</td>
      <td>${escapeHtml(last ? (last.item || observationCode(last)) : "—")}</td>
    </tr>`;
  }).join("") : '<tr><td colspan="5" class="table-empty">No students in this group.</td></tr>';

  const groupNeeds = countNeeds(allCharts, allMarks);
  byId("groupReviewNeeds").innerHTML = groupNeeds.length
    ? groupNeeds.map(([need, count]) => `<span class="need-chip">${escapeHtml(need)} · ${count}</span>`).join("")
    : "No repeated group needs yet.";
}

function updateViewMode() {
  const groupMode = selectedView === "group";
  byId("studentOverviewContent").hidden = groupMode;
  byId("groupOverviewContent").hidden = !groupMode;
  document.querySelectorAll("[data-profile-tab]").forEach((button) => {
    if (button.dataset.profileTab !== "overview") button.hidden = groupMode;
  });
  if (groupMode) showTab("overview");
}

function renderCharting() {
  const charts = chartingRecords();
  const recent = charts.slice(0, 5);
  const avgCorrect = average(recent, "correct");
  const avgWcpm = average(recent, "wcpm");
  const avgSeconds = average(recent, "seconds");
  byId("chartingStats").innerHTML = [
    `Recent correct ${avgCorrect === null ? "—" : avgCorrect.toFixed(1)}`,
    `WCPM ${avgWcpm === null ? "—" : avgWcpm.toFixed(1)}`,
    `Seconds ${avgSeconds === null ? "—" : Math.round(avgSeconds)}`
  ].map((value) => `<span>${escapeHtml(value)}</span>`).join("");
  renderChartingSheet(charts);
  byId("chartingRows").innerHTML = charts.length ? charts.map((record) => `
    <tr>
      <td>${escapeHtml(formatDate(recordDate(record)))}</td>
      <td><strong>${escapeHtml(record.substep || "—")}</strong></td>
      <td>Reader ${escapeHtml(record.reader || "—")}, p. ${escapeHtml(record.wordlistPage || "—")}</td>
      <td>${escapeHtml(record.chartHalf || record.wordType || "—")}</td>
      <td class="${chartingMetricClass("correct", record.correct, record.total)}">${escapeHtml(record.correct ?? "—")}/${escapeHtml(record.total || 15)}</td>
      <td class="${chartingMetricClass("seconds", record.seconds)}">${escapeHtml(record.seconds ?? "—")}</td>
      <td class="${chartingMetricClass("wcpm", record.wcpm)}">${escapeHtml(record.wcpm ?? "—")}</td>
      <td>${escapeHtml((record.wrongWords || []).join(", ") || "None saved")}</td>
    </tr>`).join("") : '<tr><td colspan="8" class="table-empty">No Section 4 charting records in this school year.</td></tr>';
}

function renderChartingSheet(charts) {
  if (!charts.length) {
    byId("chartingSheet").innerHTML = '<p class="table-empty">No Section 4 charting records in this school year.</p>';
    return;
  }
  const columns = charts.slice(0, 12);
  const metadata = [
    ["Date", (record) => formatDate(recordDate(record))],
    ["Substep", (record) => record.substep || "—"],
    ["Concept", (record) => record.concept || record.skill || record.lessonConcept || "—"],
    ["Page", (record) => `Reader ${record.reader || "—"}, p. ${record.wordlistPage || "—"}`],
    ["R or N", (record) => record.chartHalf || record.wordType || "—"]
  ];
  const missedRows = Array.from({ length: 15 }, (_, index) => 15 - index);
  const html = `<table class="charting-sheet-table"><tbody>
    ${metadata.map(([label, getValue]) => `<tr><th>${escapeHtml(label)}</th>${columns.map((record) => `<td>${escapeHtml(getValue(record))}</td>`).join("")}</tr>`).join("")}
    ${missedRows.map((score, index) => `<tr><th>${score}</th>${columns.map((record) => `<td class="charting-word-cell">${escapeHtml(record.wrongWords?.[index] || "")}</td>`).join("")}</tr>`).join("")}
    <tr><th>Status</th>${columns.map((record) => { const status = chartingStatus(record); return `<td><span class="comparison-status ${status.className}">${escapeHtml(status.label)}</span></td>`; }).join("")}</tr>
    <tr><th>Seconds</th>${columns.map((record) => `<td class="${chartingMetricClass("seconds", record.seconds)}">${escapeHtml(record.seconds ?? "—")} sec</td>`).join("")}</tr>
    <tr><th>WCPM</th>${columns.map((record) => `<td class="${chartingMetricClass("wcpm", record.wcpm)}">${escapeHtml(record.wcpm ?? "—")}</td>`).join("")}</tr>
  </tbody></table>`;
  byId("chartingSheet").innerHTML = html;
}

function sectionSummary(section) {
  const rows = observations().filter((record) => record.section === section);
  const statuses = rows.map(observationCode).filter((code) => ["Auto", "Acc", "Strug"].includes(code));
  const counts = statuses.reduce((result, code) => ({ ...result, [code]: (result[code] || 0) + 1 }), {});
  const predominant = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || "No overall status";
  const items = countNeeds([], rows.filter((record) => record.item)).slice(0, 5);
  const tags = [...new Set(rows.map(observationCode).filter((code) =>
    ["NS", "Blends", "Vowel Diff", "HFW", "Sfx"].includes(code)
    && (section !== "section6" || code !== "HFW")
  ))];
  if (!rows.length) return "No observations.";
  const statusClass = predominant === "Auto" ? "status-good" : predominant === "Acc" ? "status-watch" : predominant === "Strug" ? "status-risk" : "status-empty";
  const descriptions = {
    section6: { Auto: "Recognizes dictated sounds and identifies their written forms with ease.", Acc: "Recognizes most dictated sounds accurately and is building automatic recall.", Strug: "Needs direct support recognizing dictated sounds and identifying their written forms." },
    section7: { Auto: "Segments dictated words and selects the correct letter tiles with ease.", Acc: "Segments and builds words accurately but still needs practice for speed and consistency.", Strug: "Needs direct support segmenting dictated words and selecting the correct tiles." },
    section8: { Auto: "Segments dictated words and records them accurately in handwriting with ease.", Acc: "Writes dictated words accurately but still needs practice for speed and consistency.", Strug: "Needs direct support segmenting and writing dictated words." }
  };
  return `<p><span class="comparison-status ${statusClass}">${escapeHtml(predominant)}</span></p>
    <p>${escapeHtml(descriptions[section]?.[predominant] || `${rows.length} saved mark${rows.length === 1 ? "" : "s"}.`)}</p>
    <div class="miss-chip-row">${items.length ? items.map(([item, count]) => `<span class="miss-chip">${escapeHtml(item)} <small>${count} miss${count === 1 ? "" : "es"}</small></span>`).join("") : "No missed items saved."}</div>
    ${tags.length ? `<p><strong>Trouble spots:</strong> ${tags.map(escapeHtml).join(", ")}</p>` : ""}`;
}

function renderEncoding() {
  byId("section6Summary").innerHTML = sectionSummary("section6");
  byId("section7Summary").innerHTML = sectionSummary("section7");
  byId("section8Summary").innerHTML = sectionSummary("section8");
  const rows = observations();
  byId("observationRows").innerHTML = rows.length ? rows.map((record) => `
    <tr>
      <td>${escapeHtml(formatDate(recordDate(record)))}</td>
      <td><strong>${escapeHtml(String(record.section || "").replace("section", "Section "))}</strong></td>
      <td>${escapeHtml(record.substep || "—")}</td>
      <td><span class="observation-status status-${escapeHtml(observationCode(record).toLowerCase().replaceAll(" ", "-"))}">${escapeHtml(observationCode(record))}</span></td>
      <td>${escapeHtml(record.item || record.note || record.category || "—")}</td>
      <td>${escapeHtml(record.lessonTitle || record.planId || "—")}</td>
    </tr>`).join("") : '<tr><td colspan="6" class="table-empty">No Section 6–8 observations in this school year.</td></tr>';
}

function renderTimeline(container, entries) {
  container.classList.toggle("empty-state", !entries.length);
  container.innerHTML = entries.length ? entries.map((entry) => `
    <article class="timeline-item">
      <time>${escapeHtml(formatDate(entry.date))}</time>
      <div><strong>${escapeHtml(entry.title)}</strong><p>${escapeHtml(entry.detail || "")}</p></div>
      <span class="timeline-kind">${escapeHtml(entry.kind)}</span>
    </article>`).join("") : "No activity saved for this school year.";
}

function renderAll() {
  data = readState();
  ensureSelection();
  renderPickers();
  renderHeader();
  renderOverview();
  renderGroupOverview();
  renderCharting();
  renderEncoding();
  renderTimeline(byId("studentTimeline"), timelineEntries());
  updateViewMode();
  updateUrl();
}

function updateUrl() {
  const url = new URL(location.href);
  if (selectedYearId) url.searchParams.set("schoolYear", selectedYearId);
  if (selectedGroupId) url.searchParams.set("group", selectedGroupId);
  else url.searchParams.delete("group");
  if (selectedView === "group") {
    url.searchParams.set("view", "group");
    url.searchParams.delete("studentId");
    url.searchParams.delete("student");
  } else if (selectedStudentId) {
    url.searchParams.delete("view");
    url.searchParams.set("studentId", selectedStudentId);
    url.searchParams.delete("student");
  } else if (selectedStudentName) {
    url.searchParams.delete("view");
    url.searchParams.set("student", selectedStudentName);
    url.searchParams.delete("studentId");
  } else {
    url.searchParams.delete("view");
    url.searchParams.delete("studentId");
    url.searchParams.delete("student");
  }
  history.replaceState(null, "", url);
}

function showTab(tab) {
  selectedTab = tab;
  document.querySelectorAll("[data-profile-tab]").forEach((button) => button.classList.toggle("active", button.dataset.profileTab === tab));
  document.querySelectorAll("[data-profile-panel]").forEach((panel) => { panel.hidden = panel.dataset.profilePanel !== tab; });
}

function legacyArchivePayload() {
  return {
    kind: "TeachTodayLegacyStudentProfileArchive",
    version: 1,
    exportedAt: new Date().toISOString(),
    sourceStorageKey: storageKey,
    activeSchoolYearId: data.activeSchoolYearId || "",
    schoolYears: data.schoolYears || [],
    rosterStudents: data.rosterStudents || [],
    groups: (data.groups || []).map((group) => ({
      ...group,
      history: group.history || [],
      chartResults: group.chartResults || [],
      dictationMisses: group.dictationMisses || [],
      encodingObservations: group.encodingObservations || [],
      attendance: data.attendanceSessions?.[group.id] || {}
    })),
    masterRecords: data.masterRecords || [],
    attendanceRecords: data.attendanceRecords || {},
    attendanceSessions: data.attendanceSessions || {},
    attendanceActivity: data.attendanceActivity || {}
  };
}

function downloadLegacyArchive() {
  const payload = legacyArchivePayload();
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  anchor.href = url;
  anchor.download = `teach-today-legacy-student-profile-${stamp}.json`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  byId("legacyExportStatus").textContent = `Private archive prepared with ${(payload.masterRecords || []).length} master records and ${(payload.groups || []).length} groups. No app data was changed.`;
}

byId("profileSchoolYear").addEventListener("change", (event) => {
  selectedYearId = event.target.value;
  selectedGroupId = "";
  selectedStudentId = "";
  selectedStudentName = "";
  selectedView = "group";
  renderAll();
});

function moveProfileGroup(direction) {
  const groups = groupsForYear();
  if (groups.length < 2) return;
  const currentIndex = Math.max(0, groups.findIndex((group) => group.id === selectedGroupId));
  const nextIndex = (currentIndex + direction + groups.length) % groups.length;
  selectedGroupId = groups[nextIndex].id;
  selectedStudentId = "";
  selectedStudentName = "";
  selectedView = "group";
  selectedTab = "overview";
  renderAll();
}

byId("previousProfileGroup").addEventListener("click", () => moveProfileGroup(-1));
byId("nextProfileGroup").addEventListener("click", () => moveProfileGroup(1));

byId("profileRosterPicker").addEventListener("click", (event) => {
  const groupButton = event.target.closest("[data-profile-group]");
  if (groupButton) {
    const group = groupsForYear().find((candidate) => candidate.id === groupButton.dataset.groupId);
    if (!group) return;
    selectedGroupId = group.id;
    selectedView = "group";
    selectedTab = "overview";
    renderAll();
    return;
  }
  const jumpButton = event.target.closest("[data-profile-student-jump]");
  if (jumpButton) {
    const chosen = studentsForGroup(selectedGroup()).find((student) => student.key === jumpButton.dataset.studentKey);
    if (!chosen) return;
    selectedView = "student";
    selectedStudentId = chosen.studentId || "";
    selectedStudentName = chosen.name || "";
    renderAll();
    return;
  }
  const button = event.target.closest("[data-profile-student]");
  if (!button) return;
  const group = groupsForYear().find((candidate) => candidate.id === button.dataset.groupId);
  const chosen = studentsForGroup(group).find((student) => student.key === button.dataset.studentKey);
  if (!group || !chosen) return;
  selectedGroupId = group.id;
  selectedView = "student";
  selectedStudentId = chosen?.studentId || "";
  selectedStudentName = chosen?.name || "";
  renderAll();
});

byId("groupOverviewContent").addEventListener("click", (event) => {
  const button = event.target.closest("[data-profile-student-jump]");
  if (!button) return;
  const chosen = studentsForGroup(selectedGroup()).find((student) => student.key === button.dataset.studentKey);
  if (!chosen) return;
  selectedView = "student";
  selectedStudentId = chosen.studentId || "";
  selectedStudentName = chosen.name || "";
  renderAll();
});

document.querySelectorAll("[data-profile-tab]").forEach((button) => button.addEventListener("click", () => showTab(button.dataset.profileTab)));
byId("downloadLegacyProfile").addEventListener("click", downloadLegacyArchive);
byId("printProfile").addEventListener("click", () => window.print());

window.addEventListener("storage", (event) => {
  if (event.key === storageKey) renderAll();
});
profileChannel?.addEventListener("message", (event) => {
  if (event.data?.type === "state-saved") renderAll();
});
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) renderAll();
});

showTab(selectedTab);
renderAll();
