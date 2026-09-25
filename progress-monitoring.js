const pmStorageKey = "dyslexiaInstructionEngine.v2";
const pmOrderKey = "teachToday.progressMonitoringOrder.v1";
const pmParams = new URLSearchParams(location.search);
let pmData = pmReadState();
let pmYear = pmParams.get("schoolYear") || pmData.activeSchoolYearId || pmAcademicYear();
let pmPeriodIndex = 0;

const pmPeriods = [
  { label: "1st 9 weeks", start: "2026-08-11", end: "2026-10-09" },
  { label: "2nd 9 weeks", start: "2026-10-12", end: "2026-12-18" },
  { label: "3rd 9 weeks", start: "2027-01-06", end: "2027-03-05" },
  { label: "4th 9 weeks", start: "2027-03-08", end: "2027-05-26" }
];

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
function pmPeriod() { return pmPeriods[pmPeriodIndex]; }
function pmDay(record) { const value = pmRecordDate(record); if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 10); const date = pmDate(value); return date ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}` : ""; }
function pmInPeriod(record) { const day = pmDay(record); return day >= pmPeriod().start && day <= pmPeriod().end; }
function pmWeeks() {
  const start = pmDate(`${pmPeriod().start}T12:00:00`), end = pmDate(`${pmPeriod().end}T12:00:00`), rows = [];
  for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 7)) { const last = new Date(Math.min(end.getTime(), date.getTime() + 6 * 86400000)); rows.push({ start: new Date(date), end: last }); }
  return rows;
}
function pmWeekIndex(record) { const date = pmDate(pmRecordDate(record)); if (!date) return -1; return Math.floor((new Date(date.getFullYear(), date.getMonth(), date.getDate()) - pmDate(`${pmPeriod().start}T12:00:00`)) / 604800000); }
function pmLesson(record, group) { const plan = (group?.history || []).find((item) => item.id === record.planId); const lesson = plan?.lessons?.find((item) => item.id === record.lessonId); return Number(record.lessonNumber || plan?.lessonNumber || lesson?.lessonSequence) || 0; }
function pmChartRecords(student) { return (pmData.masterRecords || []).filter((record) => record?.type !== "soundsDrill" && (record?.correct !== undefined || record?.wordlistPage || record?.chartHalf) && pmMatches(record, student) && pmRecordYear(record) === pmYear && pmInPeriod(record)).sort((a, b) => pmTime(a) - pmTime(b)); }
function pmRealRecords(student) { const results = []; pmGroups().forEach((group) => (group.dictationAssessments || []).forEach((record) => {
  if (!pmMatches(record, student) || pmRecordYear(record, group) !== pmYear || !pmInPeriod(record)) return;
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
function pmChip(record, type) { const total = Number(record.total || 15), correct = Number(record.correct), percent = Math.round((correct / total) * 100); const group = record._group || pmGroups().find((item) => item.id === record.groupId || item.id === record.groupIdAtTime); const detail = `${pmDateText(pmRecordDate(record))} · Lesson ${pmLesson(record, group) || "—"} · ${record.substep || "substep —"}`; return `<span class="pm-chip ${pmScoreClass(correct, total, type)}" title="${pmEscape(detail)}"><span>${correct}/${total} · ${percent}%</span><button type="button" data-copy-percent="${percent}" aria-label="Copy ${percent} percent">Copy ${percent}</button></span>`; }
function pmHead() { const weeks = pmWeeks(); return `<tr><th>Student</th>${weeks.map((week, i) => `<th>Week ${i + 1}<br><small>${pmDateText(week.start)}–${pmDateText(week.end)}</small></th>`).join("")}</tr>`; }
function pmRows(type) { return pmOrderedStudents().map((student, index) => { const buckets = Array.from({ length: pmWeeks().length }, () => []); const records = type === "chart" ? pmChartRecords(student) : pmRealRecords(student); records.forEach((record) => { const week = pmWeekIndex(record); if (buckets[week]) buckets[week].push(pmChip(record, type === "chart" ? "chart" : "real")); }); return `<tr class="${index % 2 ? "band-b" : "band-a"}"><td>${pmEscape(student.name)}</td>${buckets.map((bucket) => `<td>${bucket.join("") || '<span class="pm-empty">—</span>'}</td>`).join("")}</tr>`; }).join("") || `<tr><td class="pm-empty">No current-year students are available.</td></tr>`; }
function pmRender() { pmData = pmReadState(); const active = pmData.activeSchoolYearId || pmAcademicYear(); if (pmYear !== active) pmYear = active; const years = [active]; pmById("pmYear").innerHTML = years.map((year) => `<option value="${pmEscape(year)}">${pmEscape(year)} · Current</option>`).join(""); pmById("pmYear").value = pmYear; pmById("pmPeriods").innerHTML = pmPeriods.map((period, i) => `<button type="button" class="${i === pmPeriodIndex ? "active" : ""}" data-period="${i}">${period.label}<br><small>${pmDateText(period.start)} – ${pmDateText(period.end)}</small></button>`).join(""); pmById("pmPeriodLabel").textContent = `${pmPeriod().label} · ${pmDateText(pmPeriod().start)}–${pmDateText(pmPeriod().end)}`; const chartCount = pmOrderedStudents().reduce((sum, student) => sum + pmChartRecords(student).length, 0), realCount = pmOrderedStudents().reduce((sum, student) => sum + pmRealRecords(student).length, 0); pmById("pmCounts").textContent = realCount ? `${chartCount} charting · ${realCount} Real Words` : `${chartCount} charting · no completed Real Words snapshots`; pmById("pmChartHead").innerHTML = pmHead(); pmById("pmRealHead").innerHTML = pmHead(); pmById("pmChartRows").innerHTML = pmRows("chart"); pmById("pmRealRows").innerHTML = pmRows("real"); const notice = pmById("pmOrderNotice"); const saved = pmOrder(); notice.hidden = Boolean(saved.length); notice.textContent = "EdPlan order has not been set on this device. The temporary list is alphabetical until you paste and verify your tracker order."; pmById("pmMeta").textContent = `${pmYear} · read-only device evidence`; }
function pmReviewOrder() { const lines = pmById("pmOrderInput").value.split(/\r?\n/).map((line) => line.replace(/[|*_]/g, "").trim()).filter(Boolean); const students = pmStudents(), matches = [], preview = []; lines.forEach((line) => { const exact = students.filter((student) => pmNormalize(student.name) === pmNormalize(line)); const first = students.filter((student) => pmFirst(student.name) === pmFirst(line)); const found = exact.length === 1 ? exact : first.length === 1 ? first : []; if (found.length === 1) { matches.push(found[0]); preview.push(`<div class="ok">✓ ${pmEscape(line)} → ${pmEscape(found[0].name)}</div>`); } else preview.push(`<div class="bad">! ${pmEscape(line)} → ${exact.length || first.length ? "ambiguous" : "not found"}</div>`); }); const unique = new Set(matches.map((student) => student.key)); const ok = lines.length > 0 && matches.length === lines.length && unique.size === matches.length; pmById("pmOrderPreview").innerHTML = `${preview.join("")}<p>${ok ? "All names have one safe match." : "Resolve every warning before saving."}</p>`; pmById("pmSaveOrder").disabled = !ok; pmById("pmSaveOrder").dataset.order = ok ? JSON.stringify(matches.map((student) => student.key)) : ""; }
pmById("pmPeriods").addEventListener("click", (event) => { const button = event.target.closest("[data-period]"); if (!button) return; pmPeriodIndex = Number(button.dataset.period); pmRender(); });
document.addEventListener("click", async (event) => { const copy = event.target.closest("[data-copy-percent]"); if (!copy) return; const value = copy.dataset.copyPercent; try { await navigator.clipboard.writeText(value); copy.textContent = "Copied"; setTimeout(() => { copy.textContent = `Copy ${value}`; }, 900); } catch (_) { window.prompt("Copy this percentage", value); } });
pmById("pmYear").addEventListener("change", (event) => { pmYear = event.target.value; pmPeriodIndex = 0; pmRender(); });
pmById("pmSetOrder").addEventListener("click", () => pmById("pmOrderDialog").showModal());
pmById("pmReviewOrder").addEventListener("click", pmReviewOrder);
pmById("pmSaveOrder").addEventListener("click", () => { localStorage.setItem(pmOrderKey, pmById("pmSaveOrder").dataset.order); pmRender(); });
window.addEventListener("pageshow", pmRender); pmRender();
