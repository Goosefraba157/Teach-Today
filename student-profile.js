const storageKey = "dyslexiaInstructionEngine.v2";
const profileChannel = "BroadcastChannel" in window ? new BroadcastChannel("teachTodayState.v1") : null;
const params = new URLSearchParams(location.search);
const hiddenDemoGroupIds = new Set(["grp-demo", "grp-sample-blue"]);

let data = readState();
let selectedYearId = params.get("schoolYear") || "";
let selectedGroupId = params.get("group") || "";
let selectedStudentId = params.get("studentId") || "";
let selectedStudentName = params.get("student") || "";
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

function isDemoGroup(group) {
  return !group || hiddenDemoGroupIds.has(group.id) || group.isDemoGroup || group.isDemo;
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
    .filter((group) => !isDemoGroup(group) && group.schoolYearId === yearId)
    .sort((a, b) => String(a.time || "").localeCompare(String(b.time || "")) || String(a.name || "").localeCompare(String(b.name || "")));
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

function chartingRecords() {
  return (data.masterRecords || [])
    .filter((record) => isChartingRecord(record) && matchesStudent(record) && recordYear(record) === selectedYearId)
    .sort((a, b) => recordTime(b) - recordTime(a));
}

function lessonPlans() {
  const student = selectedStudent();
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
  const rows = groupsForYear(selectedYearId).flatMap((group) => {
    const encoding = (group.encodingObservations || []).filter((record) => matchesStudent(record) && recordYear(record, group) === selectedYearId)
      .map((record) => ({ ...record, _group: group, section: record.section || "section8" }));
    const encodingKeys = new Set(encoding.map((record) => `${record.planId || record.lessonId || ""}|${normalizeName(record.item)}|${String(recordDate(record)).slice(0, 10)}`));
    const dictationOnly = (group.dictationMisses || []).filter((record) => matchesStudent(record) && recordYear(record, group) === selectedYearId)
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

function attendanceEntries() {
  const student = selectedStudent();
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

function timelineEntries() {
  const charts = chartingRecords().map((record) => ({
    id: record.id,
    date: recordDate(record),
    kind: "Charting",
    title: `${record.correct ?? "—"}/${record.total || 15} correct · ${record.substep || "Substep unavailable"}`,
    detail: `Reader ${record.reader || "—"}, p. ${record.wordlistPage || "—"}${record.wrongWords?.length ? ` · Missed: ${record.wrongWords.slice(0, 5).join(", ")}` : ""}`
  }));
  const marks = observations().map((record) => ({
    id: record.id,
    date: recordDate(record),
    kind: String(record.section || "").replace("section", "Section "),
    title: `${observationCode(record)}${record.item ? ` · ${record.item}` : ""}`,
    detail: `${record.substep || "Substep unavailable"}${record.category ? ` · ${record.category}` : ""}`
  }));
  const lessons = lessonPlans().filter((plan) => plan.hasStudentData || ["Taught", "Complete"].includes(plan.status)).map((plan) => ({
    id: plan.id,
    date: recordDate(plan),
    kind: "Lesson",
    title: plan.title || `Lesson ${plan.lessonNumber || ""}`,
    detail: `${plan.status || "Saved"} · ${plan.substep || plan.lessons?.[0]?.substep || "Substep unavailable"}`
  }));
  const attendance = attendanceEntries().map((entry) => ({
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
  const chosenStudent = selectedStudent();
  byId("profileRosterPicker").innerHTML = groups.length ? groups.map((group) => {
    const students = studentsForGroup(group);
    const groupSelected = group.id === selectedGroupId;
    return `<section class="profile-group-column${groupSelected ? " selected" : ""}" aria-label="${escapeHtml(group.name || "Unnamed group")}">
      <div class="profile-group-heading">
        <h3>${escapeHtml(group.name || "Unnamed group")}</h3>
        <span>${students.length} student${students.length === 1 ? "" : "s"}</span>
      </div>
      <div class="profile-student-buttons">
        ${students.length ? students.map((student) => {
          const active = groupSelected && student.key === chosenStudent.key;
          return `<button type="button" class="profile-student-button${active ? " active" : ""}" data-profile-student data-group-id="${escapeHtml(group.id)}" data-student-key="${escapeHtml(student.key)}" aria-pressed="${active}">${escapeHtml(student.name)}</button>`;
        }).join("") : '<p class="profile-group-empty">No students in this group.</p>'}
      </div>
    </section>`;
  }).join("") : '<p class="profile-roster-empty">No instructional groups in this school year.</p>';

  const archived = selectedYearId !== currentYearId();
  byId("yearModeBadge").textContent = archived ? "Archived · Read only" : "Current";
  byId("yearModeBadge").classList.toggle("archived", archived);
  byId("archiveNotice").hidden = !archived;
}

function renderHeader() {
  const student = selectedStudent();
  const group = selectedGroup();
  byId("studentName").textContent = student.name || "No student selected";
  byId("profileEyebrow").textContent = selectedYearId === currentYearId() ? "Current school year" : "Archived school year";
  byId("studentMeta").textContent = group ? `${group.name} · ${selectedYearId}` : `${selectedYearId} · No group`;
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
  byId("chartingRows").innerHTML = charts.length ? charts.map((record) => `
    <tr>
      <td>${escapeHtml(formatDate(recordDate(record)))}</td>
      <td><strong>${escapeHtml(record.substep || "—")}</strong></td>
      <td>Reader ${escapeHtml(record.reader || "—")}, p. ${escapeHtml(record.wordlistPage || "—")}</td>
      <td>${escapeHtml(record.chartHalf || record.wordType || "—")}</td>
      <td>${escapeHtml(record.correct ?? "—")}/${escapeHtml(record.total || 15)}</td>
      <td>${escapeHtml(record.seconds ?? "—")}</td>
      <td>${escapeHtml(record.wcpm ?? "—")}</td>
      <td>${escapeHtml((record.wrongWords || []).join(", ") || "None saved")}</td>
    </tr>`).join("") : '<tr><td colspan="8" class="table-empty">No Section 4 charting records in this school year.</td></tr>';
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
  return `<p><strong>${escapeHtml(predominant)}</strong> from ${rows.length} saved mark${rows.length === 1 ? "" : "s"}.</p>
    <p>${items.length ? `Most missed: ${items.map(([item, count]) => `${escapeHtml(item)} (${count})`).join(", ")}` : "No missed items saved."}</p>
    ${tags.length ? `<p>Trouble spots: ${tags.map(escapeHtml).join(", ")}</p>` : ""}`;
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
      <td>${escapeHtml(observationCode(record))}</td>
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
  renderCharting();
  renderEncoding();
  renderTimeline(byId("studentTimeline"), timelineEntries());
  updateUrl();
}

function updateUrl() {
  const url = new URL(location.href);
  if (selectedYearId) url.searchParams.set("schoolYear", selectedYearId);
  if (selectedGroupId) url.searchParams.set("group", selectedGroupId);
  else url.searchParams.delete("group");
  if (selectedStudentId) {
    url.searchParams.set("studentId", selectedStudentId);
    url.searchParams.delete("student");
  } else if (selectedStudentName) {
    url.searchParams.set("student", selectedStudentName);
    url.searchParams.delete("studentId");
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
  renderAll();
});

byId("profileRosterPicker").addEventListener("click", (event) => {
  const button = event.target.closest("[data-profile-student]");
  if (!button) return;
  const group = groupsForYear().find((candidate) => candidate.id === button.dataset.groupId);
  const chosen = studentsForGroup(group).find((student) => student.key === button.dataset.studentKey);
  if (!group || !chosen) return;
  selectedGroupId = group.id;
  selectedStudentId = chosen?.studentId || "";
  selectedStudentName = chosen?.name || "";
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
