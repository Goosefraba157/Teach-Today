const pmStorageKey = "dyslexiaInstructionEngine.v2";
const pmOrderKey = "teachToday.progressMonitoringOrder.v1";
const pmParams = new URLSearchParams(location.search);
let pmData = pmReadState();
let pmYear = pmParams.get("schoolYear") || pmData.activeSchoolYearId || pmAcademicYear();

function pmById(id) { return document.getElementById(id); }
function pmEscape(value) { return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;"); }
function pmNormalize(value) { return String(value || "").trim().toLocaleLowerCase().replace(/[^a-z]/g, ""); }
function pmFirst(value) { return pmNormalize(String(value || "").trim().split(/\s+/)[0]); }
function pmReadState() { try { return JSON.parse(window.TeachTodayStageStorage?.bootStateText?.() || localStorage.getItem(pmStorageKey) || "{}"); } catch (_) { return {}; } }
function pmDate(value) { if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) value = `${value}T12:00:00`; const date = value ? new Date(value) : null; return date && !Number.isNaN(date.getTime()) ? date : null; }
function pmDateText(value) { const date = pmDate(value); return date ? new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(date) : "Date missing"; }
function pmTime(record) { return pmDate(pmRecordDate(record))?.getTime() || 0; }
function pmRecordDate(record) { return record?.sessionDate || record?.scheduledDate || record?.date || record?.displayDate || record?.lessonSavedAt || record?.savedAt || record?.createdAt || ""; }
function pmAcademicYear(value = new Date()) { const date = pmDate(value); if (!date) return ""; const y = date.getFullYear(); return `${date.getMonth() >= 6 ? y : y - 1}-${date.getMonth() >= 6 ? y + 1 : y}`; }
function pmRecordYear(record, group) { return record?.schoolYearId || pmAcademicYear(record?.sessionDate || record?.scheduledDate) || group?.schoolYearId || pmAcademicYear(record?.date || record?.displayDate) || pmYear; }
function pmMatches(record, student) { return Boolean(student?.id && record?.studentId) ? record.studentId === student.id : pmNormalize(record?.student || record?.studentName || record?.name) === pmNormalize(student?.name); }
function pmGroups() { return (pmData.groups || []).filter((group) => group.schoolYearId === pmYear && !group?.isDemo && !group?.isDemoGroup && !/^demo|^sample/i.test(group?.name || "")); }
function pmStudents() {
  const seen = new Set(), students = [];
  pmGroups().forEach((group) => (group.students || []).forEach((name) => {
    const id = group.studentIds?.[name] || (pmData.rosterStudents || []).find((row) => pmNormalize(row.name || row.fullName || row.displayName) === pmNormalize(name))?.studentId || "";
    const key = id || `name:${pmNormalize(name)}`;
    if (!seen.has(key)) { seen.add(key); students.push({ id, name, key }); }
  }));
  return students;
}
function pmOrder() { try { const saved = JSON.parse(localStorage.getItem(pmOrderKey) || "[]"); return Array.isArray(saved) ? saved : []; } catch (_) { return []; } }
function pmOrderedStudents() {
  const students = pmStudents(), byKey = new Map(students.map((student) => [student.key, student]));
  const saved = pmOrder().map((key) => byKey.get(key)).filter(Boolean);
  const seen = new Set(saved.map((student) => student.key));
  return saved.concat(students.filter((student) => !seen.has(student.key)).sort((a, b) => a.name.localeCompare(b.name)));
}
function pmLesson(record, group) { const plan = (group?.history || []).find((item) => item.id === record.planId); const lesson = plan?.lessons?.find((item) => item.id === record.lessonId); return Number(record.lessonNumber || plan?.lessonNumber || lesson?.lessonSequence) || 0; }
function pmChartRecords(student) { return (pmData.masterRecords || []).filter((record) => record?.type !== "soundsDrill" && (record?.correct !== undefined || record?.wordlistPage || record?.chartHalf) && pmMatches(record, student) && pmRecordYear(record) === pmYear).sort((a, b) => pmLesson(a, pmGroups().find((group) => group.id === a.groupId || group.id === a.groupIdAtTime)) - pmLesson(b, pmGroups().find((group) => group.id === b.groupId || group.id === b.groupIdAtTime)) || pmTime(a) - pmTime(b)); }
function pmRealRecords(student) { const results = []; pmGroups().forEach((group) => (group.dictationAssessments || []).forEach((record) => {
  if (!pmMatches(record, student) || pmRecordYear(record, group) !== pmYear) return;
  const category = Object.keys(record.categories || {}).find((name) => pmNormalize(name) === "5realwords") || "5 real words";
  const words = record.categories?.[category] || [];
  if (!words.length) return;
  const allowed = new Set(words.map(pmNormalize));
  const direct = record.missesByCategory?.[category];
  const source = Array.isArray(direct) ? direct : (group.encodingObservations || []).filter((mark) => mark.section === "section8" && (mark.planId === record.planId || mark.lessonId === record.lessonId) && pmNormalize(mark.category) === pmNormalize(category) && allowed.has(pmNormalize(mark.item))).map((mark) => mark.item);
  const misses = [...new Set(source.map(pmNormalize))].filter((item) => allowed.has(item));
  results.push({ ...record, _group: group, correct: Math.max(0, words.length - misses.length), total: words.length });
})); return results.sort((a, b) => pmTime(a) - pmTime(b)); }
function pmScoreClass(correct, total, type) { const ratio = total ? correct / total : 0; if (type === "real") return correct === total ? "good" : ratio >= .6 ? "watch" : "risk"; return correct >= 14 ? "good" : correct >= 12 ? "watch" : "risk"; }
function pmChip(record, type) { const total = Number(record.total || 15), correct = Number(record.correct), percent = Math.round((correct / total) * 100); const group = record._group || pmGroups().find((item) => item.id === record.groupId || item.id === record.groupIdAtTime); const detail = `Lesson ${pmLesson(record, group) || "—"} · ${record.substep || "substep —"}`; return `<span class="pm-chip ${pmScoreClass(correct, total, type)}" title="${pmEscape(detail)}"><span>${correct}/${total} · ${percent}%</span><button type="button" data-copy-percent="${percent}" aria-label="Copy ${percent} percent">Copy ${percent}</button></span>`; }
function pmColumns(type) { const counts = new Map(); pmOrderedStudents().forEach((student) => { const byLesson = new Map(); (type === "chart" ? pmChartRecords(student) : pmRealRecords(student)).forEach((record) => { const group = record._group || pmGroups().find((item) => item.id === record.groupId || item.id === record.groupIdAtTime); const lesson = pmLesson(record, group) || "—"; byLesson.set(lesson, (byLesson.get(lesson) || 0) + 1); }); byLesson.forEach((count, lesson) => counts.set(lesson, Math.max(counts.get(lesson) || 0, count))); }); return [...counts.entries()].sort((a, b) => (Number(a[0]) || Number.MAX_SAFE_INTEGER) - (Number(b[0]) || Number.MAX_SAFE_INTEGER)).flatMap(([lesson, count]) => Array.from({ length: count }, (_, i) => ({ lesson, attempt: i + 1 }))); }
function pmHead(type) { const columns = pmColumns(type); return `<tr><th>Student</th>${columns.map((column) => `<th>Lesson ${column.lesson}${column.attempt > 1 ? `<br><small>entry ${column.attempt}</small>` : ""}</th>`).join("")}</tr>`; }
function pmRows(type) { const columns = pmColumns(type); return pmOrderedStudents().map((student, index) => { const byLesson = new Map(); (type === "chart" ? pmChartRecords(student) : pmRealRecords(student)).forEach((record) => { const group = record._group || pmGroups().find((item) => item.id === record.groupId || item.id === record.groupIdAtTime); const lesson = pmLesson(record, group) || "—"; const list = byLesson.get(lesson) || []; list.push(record); byLesson.set(lesson, list); }); return `<tr class="${index % 2 ? "band-b" : "band-a"}"><td>${pmEscape(student.name)}</td>${columns.map((column) => `<td>${byLesson.get(column.lesson)?.[column.attempt - 1] ? pmChip(byLesson.get(column.lesson)[column.attempt - 1], type) : '<span class="pm-empty">—</span>'}</td>`).join("")}</tr>`; }).join("") || `<tr><td class="pm-empty">No current-year students are available.</td></tr>`; }
function pmRender() { pmData = pmReadState(); const active = pmData.activeSchoolYearId || pmAcademicYear(); if (pmYear !== active) pmYear = active; pmById("pmYear").innerHTML = `<option value="${pmEscape(active)}">${pmEscape(active)} · Current</option>`; pmById("pmYear").value = pmYear; pmById("pmPeriodLabel").textContent = "All saved current-school-year lessons"; const chartCount = pmOrderedStudents().reduce((sum, student) => sum + pmChartRecords(student).length, 0), realCount = pmOrderedStudents().reduce((sum, student) => sum + pmRealRecords(student).length, 0); pmById("pmCounts").textContent = realCount ? `${chartCount} charting · ${realCount} Real Words` : `${chartCount} charting · no completed Real Words snapshots`; pmById("pmChartHead").innerHTML = pmHead("chart"); pmById("pmRealHead").innerHTML = pmHead("real"); pmById("pmChartRows").innerHTML = pmRows("chart"); pmById("pmRealRows").innerHTML = pmRows("real"); const notice = pmById("pmOrderNotice"); const saved = pmOrder(); notice.hidden = Boolean(saved.length); notice.textContent = "EdPlan order has not been set on this device. The temporary list is alphabetical until you paste and verify your tracker order."; pmById("pmMeta").textContent = `${pmYear} · read-only device evidence`; }
function pmReviewOrder() { const lines = pmById("pmOrderInput").value.split(/\r?\n/).map((line) => line.replace(/[|*_]/g, "").trim()).filter(Boolean); const students = pmStudents(), matches = [], preview = []; lines.forEach((line) => { const exact = students.filter((student) => pmNormalize(student.name) === pmNormalize(line)); const first = students.filter((student) => pmFirst(student.name) === pmFirst(line)); const found = exact.length === 1 ? exact : first.length === 1 ? first : []; if (found.length === 1) { matches.push(found[0]); preview.push(`<div class="ok">✓ ${pmEscape(line)} → ${pmEscape(found[0].name)}</div>`); } else preview.push(`<div class="bad">! ${pmEscape(line)} → ${exact.length || first.length ? "ambiguous" : "not found"}</div>`); }); const unique = new Set(matches.map((student) => student.key)); const ok = lines.length > 0 && matches.length === lines.length && unique.size === matches.length; pmById("pmOrderPreview").innerHTML = `${preview.join("")}<p>${ok ? "All names have one safe match." : "Resolve every warning before saving."}</p>`; pmById("pmSaveOrder").disabled = !ok; pmById("pmSaveOrder").dataset.order = ok ? JSON.stringify(matches.map((student) => student.key)) : ""; }
document.addEventListener("click", async (event) => { const copy = event.target.closest("[data-copy-percent]"); if (!copy) return; const value = copy.dataset.copyPercent; try { await navigator.clipboard.writeText(value); copy.textContent = "Copied"; setTimeout(() => { copy.textContent = `Copy ${value}`; }, 900); } catch (_) { window.prompt("Copy this percentage", value); } });
pmById("pmYear").addEventListener("change", (event) => { pmYear = event.target.value; pmRender(); });
pmById("pmSetOrder").addEventListener("click", () => pmById("pmOrderDialog").showModal());
pmById("pmReviewOrder").addEventListener("click", pmReviewOrder);
pmById("pmSaveOrder").addEventListener("click", () => { localStorage.setItem(pmOrderKey, pmById("pmSaveOrder").dataset.order); pmRender(); });
window.addEventListener("pageshow", pmRender); pmRender();
