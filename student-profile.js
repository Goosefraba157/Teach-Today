const storageKey = "dyslexiaInstructionEngine.v2";
const audioSyncDbName = "teachTodayCloudSync.v1";
const audioSyncStore = "handles";
const audioSyncHandleKey = "syncDirectory";
const profileFirebaseConfig = {
  apiKey: "AIzaSyAQxODRvRAINGXfSxlqTxiyhkeisIPQLEs",
  authDomain: "teach-today-35149.firebaseapp.com",
  projectId: "teach-today-35149",
  storageBucket: "teach-today-35149.firebasestorage.app",
  messagingSenderId: "506415947825",
  appId: "1:506415947825:web:9415befdc50d928eccb510"
};
const profileFirebaseSdkVersion = "10.12.5";
const profileDriveScope = "https://www.googleapis.com/auth/drive.file";
let profileFirebaseSdkPromise = null;
let profileDriveAccessToken = "";
let comparisonScope = "group";
let profileView = "teacher";
let profileSchoolYearId = "";
let studentAppLoadToken = 0;
let studentAppPortalProfile = null;
let studentAppActivityById = new Map();

function byId(id) {
  return document.getElementById(id);
}

function state() {
  try {
    const data = JSON.parse(localStorage.getItem(storageKey) || "{}");
    return data;
  } catch {
    return {};
  }
}

async function profileFirebaseSdk() {
  if (profileFirebaseSdkPromise) return profileFirebaseSdkPromise;
  profileFirebaseSdkPromise = Promise.all([
    import(`https://www.gstatic.com/firebasejs/${profileFirebaseSdkVersion}/firebase-app.js`),
    import(`https://www.gstatic.com/firebasejs/${profileFirebaseSdkVersion}/firebase-auth.js`),
    import(`https://www.gstatic.com/firebasejs/${profileFirebaseSdkVersion}/firebase-firestore.js`)
  ]).then(([appModule, authModule, firestoreModule]) => {
    const firebaseApp = appModule.getApps().length ? appModule.getApp() : appModule.initializeApp(profileFirebaseConfig);
    const firebaseAuth = authModule.getAuth(firebaseApp);
    const firestoreDb = firestoreModule.getFirestore(firebaseApp);
    return { ...authModule, ...firestoreModule, firebaseAuth, firestoreDb };
  });
  return profileFirebaseSdkPromise;
}

async function ensureProfileDrivePermission() {
  if (profileDriveAccessToken) return true;
  const { firebaseAuth, GoogleAuthProvider, signInWithPopup } = await profileFirebaseSdk();
  const provider = new GoogleAuthProvider();
  provider.addScope(profileDriveScope);
  const result = await signInWithPopup(firebaseAuth, provider);
  const credential = GoogleAuthProvider.credentialFromResult(result);
  profileDriveAccessToken = credential?.accessToken || "";
  return Boolean(profileDriveAccessToken);
}

async function loadDriveAudioFile(fileId) {
  if (!fileId || !(await ensureProfileDrivePermission())) return null;
  const response = await fetch(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?alt=media`, {
    headers: { Authorization: `Bearer ${profileDriveAccessToken}` }
  });
  if (!response.ok) throw new Error(`Google Drive file could not load (${response.status}).`);
  return response.blob();
}

function profileDriveHeaders(contentType = "application/json") {
  const headers = { Authorization: `Bearer ${profileDriveAccessToken}` };
  if (contentType) headers["Content-Type"] = contentType;
  return headers;
}

async function profileDriveRequest(path, options = {}) {
  if (!(await ensureProfileDrivePermission())) throw new Error("Google Drive permission was not granted.");
  const response = await fetch(`https://www.googleapis.com/drive/v3/${path}`, {
    ...options,
    headers: { ...profileDriveHeaders(options.contentType), ...(options.headers || {}) }
  });
  if (!response.ok) throw new Error(`Google Drive request failed (${response.status}): ${await response.text().catch(() => response.statusText)}`);
  return response.json();
}

async function profileDriveFolder() {
  let folderId = localStorage.getItem("teachToday.driveFolderId") || "";
  if (folderId) return folderId;
  const queryText = [
    "mimeType='application/vnd.google-apps.folder'",
    "name='Teach Today Recordings'",
    "trashed=false"
  ].join(" and ");
  const result = await profileDriveRequest(`files?q=${encodeURIComponent(queryText)}&spaces=drive&fields=files(id,name)&pageSize=1`);
  folderId = result.files?.[0]?.id || "";
  if (!folderId) {
    const folder = await profileDriveRequest("files?fields=id,name", {
      method: "POST",
      body: JSON.stringify({ name: "Teach Today Recordings", mimeType: "application/vnd.google-apps.folder" })
    });
    folderId = folder.id || "";
  }
  if (folderId) localStorage.setItem("teachToday.driveFolderId", folderId);
  return folderId;
}

async function profileDriveUpload(blob, fileName) {
  if (!(await ensureProfileDrivePermission())) throw new Error("Google Drive permission was not granted.");
  const folderId = await profileDriveFolder();
  const boundary = `teach_today_${Date.now()}`;
  const metadata = { name: fileName, parents: folderId ? [folderId] : undefined, mimeType: blob.type || "audio/webm" };
  const body = new Blob([
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n`,
    JSON.stringify(metadata),
    `\r\n--${boundary}\r\nContent-Type: ${blob.type || "audio/webm"}\r\n\r\n`,
    blob,
    `\r\n--${boundary}--`
  ], { type: `multipart/related; boundary=${boundary}` });
  const response = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink", {
    method: "POST",
    headers: profileDriveHeaders(body.type),
    body
  });
  if (!response.ok) throw new Error(`Google Drive upload failed (${response.status}): ${await response.text().catch(() => response.statusText)}`);
  return response.json();
}

function normalizeStudentName(value) {
  return String(value || "").trim().toLocaleLowerCase();
}

function portalStudentLinkId(groupId, name) {
  return `${groupId || "group"}__${String(name || "student").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;
}

async function findPortalStudent(group, student) {
  const { firestoreDb, firebaseAuth, doc, getDoc, collection, getDocs, query, where } = await profileFirebaseSdk();
  const teacherUid = firebaseAuth.currentUser?.uid || "";
  if (!teacherUid) return null;
  const linkSnapshot = await getDoc(doc(firestoreDb, "studentLinks", portalStudentLinkId(group.id, student)));
  if (linkSnapshot.exists() && linkSnapshot.data().studentId) {
    const studentSnapshot = await getDoc(doc(firestoreDb, "students", linkSnapshot.data().studentId));
    if (studentSnapshot.exists()) return { id: studentSnapshot.id, ...studentSnapshot.data() };
  }
  const snapshot = await getDocs(query(collection(firestoreDb, "students"), where("teacherUid", "==", teacherUid)));
  const candidates = snapshot.docs
    .map((docSnapshot) => ({ id: docSnapshot.id, ...docSnapshot.data() }))
    .filter((item) => item.groupId === (group.id || ""));
  return candidates.find((item) => normalizeStudentName(item.name) === normalizeStudentName(student)
    || normalizeStudentName(item.fullName) === normalizeStudentName(student)) || null;
}

async function loadPortalActivity(portalProfile) {
  if (!portalProfile?.id) return [];
  const { firestoreDb, collection, getDocs } = await profileFirebaseSdk();
  const snapshot = await getDocs(collection(firestoreDb, "students", portalProfile.id, "activity"));
  return snapshot.docs.map((docSnapshot) => ({ id: docSnapshot.id, ...docSnapshot.data(), portalStudentId: portalProfile.id }));
}

function setProfileView(view) {
  profileView = view === "student-app" ? "student-app" : "teacher";
  byId("teacherDataTab")?.classList.toggle("active", profileView === "teacher");
  byId("studentAppTab")?.classList.toggle("active", profileView === "student-app");
  const main = document.querySelector(".profile-shell");
  [...(main?.children || [])].forEach((section) => {
    if (section.classList.contains("profile-roster-card") || section.classList.contains("profile-view-tabs")) return;
    section.hidden = profileView === "student-app" ? section.id !== "studentAppView" : section.id === "studentAppView";
  });
  if (profileView === "student-app") renderStudentAppView();
}

function localStudentAppActivity(records) {
  return records.filter((record) => record.type === "soundsDrill").map((record) => ({
    ...record,
    title: record.title || "Sounds Quick Drill",
    originalTranscript: record.originalTranscript || record.rawTranscript || "",
    source: "teacher-device"
  }));
}

function mergeStudentActivity(localItems, remoteItems) {
  const merged = new Map();
  localItems.forEach((item) => merged.set(item.id, item));
  remoteItems.forEach((item) => merged.set(item.id, { ...(merged.get(item.id) || {}), ...item, source: "student-cloud" }));
  return [...merged.values()].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
}

function importStudentActivityIntoTeacherRecords(remoteItems, student, group) {
  if (!remoteItems.length) return;
  const data = state();
  data.masterRecords = data.masterRecords || [];
  remoteItems.forEach((activity) => {
    const existing = data.masterRecords.find((record) => record.id === activity.id);
    const record = {
      ...activity,
      type: activity.type || "studentAppActivity",
      student,
      studentId: activity.studentId || activity.portalStudentId || null,
      groupId: group.id || activity.groupId || null,
      group: group.name || activity.groupName || "",
      rawTranscript: activity.originalTranscript || activity.rawTranscript || "",
      source: "student-cloud"
    };
    if (existing) {
      const originalTranscript = existing.originalTranscript || existing.rawTranscript || record.originalTranscript || record.rawTranscript;
      Object.assign(existing, record, {
        originalTranscript,
        rawTranscript: originalTranscript,
        teacherNotes: existing.teacherNotes || record.teacherNotes || "",
        teacherOverrides: { ...(record.teacherOverrides || {}), ...(existing.teacherOverrides || {}) }
      });
    } else {
      data.masterRecords.push(record);
    }
  });
  data.lastSavedAt = new Date().toISOString();
  localStorage.setItem(storageKey, JSON.stringify(data));
}

function studentActivityBadges(activity) {
  const results = activity.confidenceResults || [];
  if (results.length) {
    const exact = results.filter((item) => item.conf === "exact").length;
    const similar = results.filter((item) => item.conf === "similar").length;
    const review = results.filter((item) => item.conf === "review").length;
    return `<span class="drill-confidence exact">⭐ ${exact} exact</span><span class="drill-confidence similar">🙂 ${similar} similar</span><span class="drill-confidence review">❓ ${review} review</span>`;
  }
  return `<span class="drill-confidence exact">⭐ ${escapeHtml(activity.perfect || 0)} of ${escapeHtml(activity.totalCards || 14)} perfect</span>`;
}

async function renderStudentAppView() {
  const token = ++studentAppLoadToken;
  const { group, student, activityRecords } = selectedContext();
  const connection = byId("studentAppConnection");
  const activityContainer = byId("studentAppActivity");
  connection.className = "";
  connection.textContent = "Checking the student's latest synced activity…";
  activityContainer.innerHTML = "<p class=\"recordings-empty\">Loading student activity…</p>";
  let portalProfile = null;
  let remoteActivity = [];
  let connectionError = "";
  try {
    const { firebaseAuth } = await profileFirebaseSdk();
    await firebaseAuth.authStateReady?.();
    if (!firebaseAuth.currentUser) throw new Error("Connect Google Drive at the top of this profile to load protected student data.");
    portalProfile = await findPortalStudent(group, student);
    if (portalProfile) remoteActivity = await loadPortalActivity(portalProfile);
  } catch (error) {
    connectionError = String(error?.message || error);
  }
  if (token !== studentAppLoadToken) return;
  studentAppPortalProfile = portalProfile;
  importStudentActivityIntoTeacherRecords(remoteActivity, student, group);
  const activity = mergeStudentActivity(localStudentAppActivity(activityRecords), remoteActivity);
  studentAppActivityById = new Map(activity.map((item) => [item.id, item]));

  if (portalProfile) {
    connection.textContent = `Connected to ${portalProfile.name || student}'s student home · ${activity.length} saved activit${activity.length === 1 ? "y" : "ies"}`;
    connection.className = "sync-ok";
  } else if (connectionError) {
    connection.textContent = `Cloud activity could not load yet. Local teacher records are still shown. ${connectionError}`;
    connection.className = "sync-warn";
  } else {
    connection.textContent = "This profile is not linked to a student login yet. Once the student signs in with a code for this group, activity will appear here.";
    connection.className = "sync-warn";
  }

  byId("studentAppXp").textContent = portalProfile ? Number(portalProfile.xp || 0).toLocaleString() : "—";
  byId("studentAppStreak").textContent = portalProfile ? Number(portalProfile.streak || 0) : "—";
  byId("studentAppCompleted").textContent = portalProfile ? (portalProfile.completedLessons || []).length : activity.length;
  byId("studentAppLastActive").textContent = portalProfile?.lastActivityAt ? shortDate(portalProfile.lastActivityAt) : activity[0]?.date ? shortDate(activity[0].date) : "—";
  renderStudentAppJourney(portalProfile, activity);
  renderStudentAppActivity(activity);
}

function renderStudentAppJourney(profile, activity) {
  const container = byId("studentAppJourney");
  const tasks = profile?.assignedTasks || [];
  const rewards = profile?.rewards || [];
  const completed = profile?.completedLessons || [];
  container.innerHTML = `
    <div class="journey-block"><strong>Current placement</strong><div class="journey-item"><b>Sub-step</b><span>${escapeHtml(profile?.substep || selectedContext().group.substep || "—")}</span></div></div>
    <div class="journey-block"><strong>Assignments</strong><div class="journey-list">${tasks.slice(0, 8).map((task) => `<div class="journey-item"><b>${escapeHtml(task.title || "Assignment")}</b><span>${task.done ? "Done ✓" : "Ready"}</span></div>`).join("") || `<span class="recordings-empty">No assignments synced yet.</span>`}</div></div>
    <div class="journey-block"><strong>Achievements</strong><div class="journey-item"><b>Completed lessons</b><span>${completed.length}</span></div><div class="journey-item"><b>Saved activities</b><span>${activity.length}</span></div><div class="journey-item"><b>Rewards earned</b><span>${rewards.filter((reward) => !reward.locked).length}</span></div></div>`;
}

function renderStudentAppActivity(activity) {
  const container = byId("studentAppActivity");
  if (!activity.length) {
    container.innerHTML = "<p class=\"recordings-empty\">No student-app completions have synced yet.</p>";
    return;
  }
  container.innerHTML = activity.map((item) => {
    const transcript = item.originalTranscript
      ? `<details class="drill-transcript"><summary>Original recognition transcript</summary><p>${escapeHtml(item.originalTranscript)}</p></details>` : "";
    const hasAudio = Boolean(item.audioUrl || item.audioRecordingId || item.driveFileId);
    const driveAction = item.driveFileId
      ? `<a href="${escapeHtml(item.driveWebViewLink || `https://drive.google.com/open?id=${item.driveFileId}`)}" target="_blank" rel="noopener">Open in Google Drive</a>`
      : hasAudio ? `<button type="button" class="student-drive-upload" data-activity-id="${escapeHtml(item.id)}">Save audio to Google Drive</button>` : "";
    const audio = item.audioUrl ? audioPlayerMarkup(item.audioUrl, item.audioFileName || "student-audio.webm", false) : "";
    return `<article class="student-activity-card">
      <div class="student-activity-head"><div><strong>${escapeHtml(item.title || item.lesson || "Student activity")}</strong><div class="student-activity-meta">${escapeHtml(formatDateTime(item.date))} · Sub-step ${escapeHtml(item.substep || "—")} · +${escapeHtml(item.xp || 0)} XP</div></div><span>${item.source === "student-cloud" ? "Cloud synced" : "Teacher device"}</span></div>
      <div class="student-activity-badges">${studentActivityBadges(item)}</div>
      ${audio}${transcript}
      <div class="student-activity-actions">${driveAction}</div>
    </article>`;
  }).join("");
  wireAudioSpeedControls(container);
  container.querySelectorAll(".student-drive-upload").forEach((button) => {
    button.addEventListener("click", () => uploadStudentActivityToDrive(button));
  });
}

async function uploadStudentActivityToDrive(button) {
  const activity = studentAppActivityById.get(button.dataset.activityId);
  if (!activity) return;
  button.disabled = true;
  button.textContent = "Uploading…";
  try {
    let blob = activity.audioRecordingId ? await loadAudioBlob(activity.audioRecordingId).catch(() => null) : null;
    if (!blob && activity.audioUrl) {
      const response = await fetch(activity.audioUrl);
      if (!response.ok) throw new Error(`Cloud audio could not download (${response.status}).`);
      blob = await response.blob();
    }
    if (!blob) throw new Error("The original recording is not available on this device or in cloud storage.");
    const file = await profileDriveUpload(blob, activity.audioFileName || `${activity.studentName || "student"}-activity.webm`);
    const patch = {
      driveFileId: file.id,
      driveFileName: file.name || activity.audioFileName,
      driveWebViewLink: file.webViewLink || "",
      driveUploadStatus: "cloud-ready",
      driveUploadedAt: new Date().toISOString()
    };
    Object.assign(activity, patch);
    const data = state();
    const localRecord = (data.masterRecords || []).find((record) => record.id === activity.id);
    if (localRecord) Object.assign(localRecord, patch);
    localStorage.setItem(storageKey, JSON.stringify(data));
    if (activity.portalStudentId || studentAppPortalProfile?.id) {
      const { firestoreDb, doc, setDoc } = await profileFirebaseSdk();
      await setDoc(doc(firestoreDb, "students", activity.portalStudentId || studentAppPortalProfile.id, "activity", activity.id), patch, { merge: true });
    }
    button.textContent = "Saved to Google Drive ✓";
    renderStudentAppActivity([...studentAppActivityById.values()]);
  } catch (error) {
    button.disabled = false;
    button.textContent = "Retry Google Drive upload";
    button.title = String(error?.message || error);
  }
}

function params() {
  return new URLSearchParams(location.search);
}

function privateStudentId(data, group, student) {
  return group?.studentIds?.[student]
    || (data.rosterStudents || []).find((item) => [item.name, item.fullName, item.displayName, ...(item.aliases || [])].includes(student))?.studentId
    || "";
}

function studentNameFromPrivateId(data, group, studentId) {
  if (!studentId) return "";
  const roster = (data.rosterStudents || []).find((item) => item.studentId === studentId);
  if (roster?.name) return roster.name;
  return Object.entries(group?.studentIds || {}).find(([, id]) => id === studentId)?.[0] || "";
}

function isChartingRecord(record) {
  return record?.type !== "soundsDrill"
    && (record?.correct !== undefined || record?.wordlistPage || record?.chartHalf);
}

function academicSchoolYearId(value = new Date()) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const startYear = date.getMonth() >= 6 ? year : year - 1;
  return `${startYear}-${startYear + 1}`;
}

function schoolYearForRecord(data, record) {
  const datedYear = academicSchoolYearId(record?.date || record?.displayDate);
  if (datedYear) return datedYear;
  if (record?.schoolYearId) return record.schoolYearId;
  const groupId = record?.groupIdAtTime || record?.groupId || "";
  const linkedGroup = (data.groups || []).find((item) => item.id === groupId);
  if (linkedGroup?.schoolYearId) return linkedGroup.schoolYearId;
  return academicSchoolYearId(record?.date || record?.displayDate) || data.activeSchoolYearId || academicSchoolYearId();
}

function profileSchoolYears(data, records = []) {
  const ids = new Set((data.schoolYears || []).map((year) => year.id).filter(Boolean));
  (data.groups || []).forEach((group) => {
    if (group.schoolYearId) ids.add(group.schoolYearId);
  });
  records.forEach((record) => {
    const id = schoolYearForRecord(data, record);
    if (id) ids.add(id);
  });
  ids.add(data.activeSchoolYearId || academicSchoolYearId());
  return [...ids].sort((a, b) => b.localeCompare(a));
}

function selectedProfileSchoolYear(data, records = []) {
  const available = profileSchoolYears(data, records);
  const preferred = data.activeSchoolYearId || academicSchoolYearId();
  if (!profileSchoolYearId || !available.includes(profileSchoolYearId)) {
    profileSchoolYearId = available.includes(preferred) ? preferred : available[0] || preferred;
  }
  return profileSchoolYearId;
}

function renderProfileSchoolYearSelector(data, records) {
  const select = byId("profileSchoolYear");
  if (!select) return;
  const selected = selectedProfileSchoolYear(data, records);
  const current = data.activeSchoolYearId || academicSchoolYearId();
  const labels = new Map((data.schoolYears || []).map((year) => [year.id, year.label || year.id]));
  select.innerHTML = profileSchoolYears(data, records).map((id) =>
    `<option value="${escapeHtml(id)}">${escapeHtml(labels.get(id) || id)}${id === current ? " (Current)" : ""}</option>`
  ).join("");
  select.value = selected;
  select.onchange = () => {
    profileSchoolYearId = select.value;
    render();
  };
}

function selectedContext() {
  const data = state();
  const query = params();
  const group = (data.groups || []).find((item) => item.id === query.get("group"))
    || (data.groups || []).find((item) => item.id === data.selectedGroupId)
    || (data.groups || [])[0]
    || { name: "No group", students: [] };
  const studentId = query.get("studentId") || "";
  const student = studentNameFromPrivateId(data, group, studentId)
    || query.get("student")
    || group.activeStudent
    || group.students[0]
    || "";
  const profileGroup = student && !(group.students || []).includes(student)
    ? (data.groups || []).find((item) => (item.students || []).includes(student)) || group
    : group;
  const resolvedStudentId = studentId || privateStudentId(data, profileGroup, student);
  const allRecords = (data.masterRecords || []).filter((record) => {
    const identityMatch = resolvedStudentId
      ? record.studentId === resolvedStudentId || (!record.studentId && record.student === student)
      : record.student === student;
    return identityMatch;
  });
  const allChartRecords = allRecords.filter(isChartingRecord);
  const schoolYearId = selectedProfileSchoolYear(data, allChartRecords);
  const activityRecords = allRecords.filter((record) => schoolYearForRecord(data, record) === schoolYearId);
  const records = activityRecords.filter(isChartingRecord);
  const identityMatch = (item) => resolvedStudentId
    ? item.studentId === resolvedStudentId || (!item.studentId && item.student === student)
    : item.student === student;
  const inSelectedYear = (record) => schoolYearForRecord(data, record) === schoolYearId;
  const dictationMisses = (data.groups || []).flatMap((item) => item.dictationMisses || []).filter(identityMatch).filter(inSelectedYear);
  const encodingObservations = (data.groups || []).flatMap((item) => item.encodingObservations || []).filter(identityMatch).filter(inSelectedYear);
  return { data, group: profileGroup, student, studentId: studentId || privateStudentId(data, profileGroup, student), records, allRecords: allChartRecords, activityRecords, schoolYearId, dictationMisses, encodingObservations };
}

function render() {
  const { data, group, student, records, allRecords, activityRecords, schoolYearId, dictationMisses, encodingObservations } = selectedContext();
  renderProfileSchoolYearSelector(data, allRecords);
  const recent = records.slice(-5);
  const status = performanceStatus(records);
  const last = records.at(-1);
  const marked = (group.markedReviewWords || []).filter((item) => !item.student || item.student === student);
  const recentDictation = dictationMisses.slice(-5);
  const topDictationCategory = topCount(dictationMisses.map((miss) => miss.category));
  const lastDictation = dictationMisses.at(-1);
  const studentLessons = lessonsForStudent(data, group, student, records, dictationMisses.concat(encodingObservations));

  byId("studentName").textContent = student || "No student selected";
  byId("studentMeta").textContent = `${group.name || "No group"} - ${schoolYearId} - ${records.length} charting record${records.length === 1 ? "" : "s"} - ${dictationMisses.length} dictation miss${dictationMisses.length === 1 ? "" : "es"}`;
  byId("statusDot").className = `status-dot ${status.color}`;
  byId("statusLabel").textContent = status.label;
  byId("nextRecommendation").textContent = last?.recommendation || "Save charting records to generate next-step recommendations.";
  const sourceRecord = last?.planId ? last : lastDictation?.planId ? lastDictation : null;
  const source = sourceRecord?.lessonTitle || last?.lessonTitle || lastDictation?.lessonTitle || "No linked lesson yet";
  byId("lessonSource").textContent = `Latest source lesson: ${source}`;

  byId("totalLessons").textContent = studentLessons.length;
  byId("avgCorrect").textContent = average(recent, (record) => Number(record.correct || 0)) || "--";
  byId("avgWcpm").textContent = average(recent, wcpmForRecord) || "--";
  byId("avgSeconds").textContent = average(recent, (record) => Number(record.seconds || 0)) || "--";
  byId("automaticityRate").textContent = recent.length ? `${Math.round((recent.filter((record) => record.automaticity).length / recent.length) * 100)}%` : "0%";
  byId("lastSubstep").textContent = last?.substep || "--";
  byId("dictationMissTotal").textContent = dictationMisses.length;
  byId("dictationRecent").textContent = recentDictation.length;
  byId("dictationHotspot").textContent = topDictationCategory || "--";
  byId("dictationLast").textContent = lastDictation?.item || "--";
  shadeMetricCards({
    records,
    recent,
    dictationMisses,
    recentDictation,
    avgCorrect: average(recent, (record) => Number(record.correct || 0)),
    avgWcpm: average(recent, wcpmForRecord),
    avgSeconds: average(recent, (record) => Number(record.seconds || 0)),
    automaticityRate: recent.length ? Math.round((recent.filter((record) => record.automaticity).length / recent.length) * 100) : 0
  });

  renderTrend(records);
  renderDictationTrend(dictationMisses);
  renderProfileStudentButtons(data, group, student);
  renderComparisonTables(data, group);
  renderChips(byId("missedWords"), commonWrongWords(records).slice(0, 20), "No missed words saved yet.");
  renderChips(byId("markedWords"), marked.map((item) => item.word), "No words marked for review yet.");
  renderChips(byId("dictationMisses"), commonDictationMisses(dictationMisses).slice(0, 20), "No dictation misses saved yet.");
  renderPatternInsights(records, marked, dictationMisses.concat(encodingObservations));
  renderDiagnosticBubbles({ records, recent, marked, dictationMisses: dictationMisses.concat(encodingObservations) });
  renderCategoryBars(dictationMisses.concat(encodingObservations));
  renderStudentLessons(studentLessons, group);
  renderAttendanceCalendar(studentLessons, group);
  renderChartingSheet(records);
  renderRows(records);
  renderDictationRows(dictationMisses);
  renderEncodingObservationSummary(encodingObservations, student);
  renderEncodingObservationRows(encodingObservations);
  renderRecordingsSection(records.filter((record) => record.type !== "soundsDrill"));
  renderSoundsDrillSection(activityRecords);
}

function dateKeyLocal(value) {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function lessonDateKey(plan) {
  if (plan?.dailyKey) return plan.dailyKey;
  const lesson = plan?.lessons?.[0] || {};
  if (lesson.lessonDate) return dateKeyLocal(lesson.lessonDate);
  const match = String(plan?.title || "").match(/\b([A-Z][a-z]+ \d{1,2}, \d{4})\b/);
  if (match) return dateKeyLocal(match[1]);
  return dateKeyLocal(plan?.savedAt || plan?.created);
}

function lessonDateLabel(dayKey, plan) {
  const fromPlan = plan?.savedAt || plan?.created || dayKey;
  const date = dayKey ? new Date(`${dayKey}T12:00:00`) : new Date(fromPlan);
  if (Number.isNaN(date.getTime())) return dayKey || "";
  return date.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
}

function latestPlanForDay(plans, dayKey) {
  return plans
    .filter((plan) => lessonDateKey(plan) === dayKey)
    .sort((a, b) => new Date(b.savedAt || b.created || 0) - new Date(a.savedAt || a.created || 0))[0] || null;
}

function planIdsFromRecords(records) {
  return new Set(records.map((record) => record.planId).filter(Boolean));
}

function linkedPlanForDay(plans, dayKey, records) {
  const linkedIds = records
    .filter((record) => dateKeyLocal(record.date || record.displayDate) === dayKey)
    .map((record) => record.planId)
    .filter(Boolean);
  for (const planId of linkedIds) {
    const plan = plans.find((item) => item.id === planId);
    if (plan) return plan;
  }
  return null;
}

function lessonsForStudent(data, group, student, records, encodingRecords) {
  if (!student) return [];
  const plans = (group.history || []).filter((plan) => plan?.lessons?.[0]);
  const attendanceByDay = data.attendanceRecords?.[group.id] || {};
  const sessionsByDay = data.attendanceSessions?.[group.id] || {};
  const studentId = group.studentIds?.[student]
    || (data.rosterStudents || []).find((item) => typeof item !== "string" && (item.name === student || item.displayName === student))?.studentId
    || "";
  const explicitAttendance = (session) => studentId && session?.attendanceByStudentId?.[studentId] !== undefined
    ? session.attendanceByStudentId[studentId]
    : session?.attendance?.[student];
  const evidenceDays = new Set();
  records.forEach((record) => {
    const key = dateKeyLocal(record.date || record.displayDate);
    if (key) evidenceDays.add(key);
  });
  encodingRecords.forEach((record) => {
    const key = dateKeyLocal(record.date || record.displayDate);
    if (key) evidenceDays.add(key);
  });
  Object.keys(attendanceByDay).forEach((dayKey) => {
    if (latestPlanForDay(plans, dayKey)) evidenceDays.add(dayKey);
  });
  Object.values(sessionsByDay).forEach((session) => {
    const status = explicitAttendance(session);
    if (session?.status === "confirmed" && (status === true || status === false)) evidenceDays.add(session.date);
    if (session?.status === "no-session") evidenceDays.delete(session.date);
  });

  const explicitPlanIds = new Set([...planIdsFromRecords(records), ...planIdsFromRecords(encodingRecords)]);
  explicitPlanIds.forEach((planId) => {
    const plan = plans.find((item) => item.id === planId);
    const key = lessonDateKey(plan);
    if (key) evidenceDays.add(key);
  });

  return [...evidenceDays].sort((a, b) => b.localeCompare(a)).map((dayKey) => {
    const dayRecords = records.concat(encodingRecords);
    const session = sessionsByDay[dayKey] || null;
    const sessionPlan = (session?.planIds || []).map((id) => plans.find((item) => item.id === id)).find(Boolean);
    const plan = sessionPlan || linkedPlanForDay(plans, dayKey, dayRecords)
      || latestPlanForDay(plans, dayKey)
      || plans.find((item) => explicitPlanIds.has(item.id))
      || null;
    const attendance = attendanceByDay[dayKey] || {};
    const confirmedStatus = explicitAttendance(session);
    const present = session?.status === "confirmed" ? confirmedStatus === true : attendance[student] !== false;
    const charting = records.filter((record) => dateKeyLocal(record.date || record.displayDate) === dayKey);
    const encoding = encodingRecords.filter((record) => dateKeyLocal(record.date || record.displayDate) === dayKey);
    const lesson = plan?.lessons?.[0] || {};
    return {
      dayKey,
      dateLabel: lessonDateLabel(dayKey, plan),
      planId: plan?.id || "",
      title: plan?.title || lesson.title || "Saved lesson",
      substep: lesson.substep || String(plan?.substep || "").split(" - ")[0] || "--",
      wordlist: lesson.wordlistMeta || (lesson.wordlistPageNumber ? `Reader ${lesson.reader || ""}, p. ${lesson.wordlistPageNumber}` : ""),
      present,
      attendanceSource: session?.status === "confirmed" ? "confirmed" : "legacy",
      lessonParts: session?.lessonParts || [],
      chartingCount: charting.length,
      encodingCount: encoding.length
    };
  }).filter((item) => item.planId && sessionsByDay[item.dayKey]?.status !== "no-session");
}

function renderStudentLessons(lessons, group) {
  const container = byId("studentLessons");
  if (!container) return;
  if (!lessons.length) {
    container.innerHTML = "<p class=\"empty-lessons\">No lessons are linked to this student yet.</p>";
    return;
  }
  container.innerHTML = lessons.map((lesson) => `
    <article class="student-lesson-card">
      <div>
        <strong>${escapeHtml(lesson.dateLabel)}</strong>
        <span class="${lesson.present ? "present" : "absent"}">${escapeHtml(lesson.present ? "Present" : "Absent")}</span>
      </div>
      <div>
        <h3>${escapeHtml(lesson.title)}</h3>
        <p>${escapeHtml([lesson.substep, lesson.wordlist].filter(Boolean).join(" - "))}</p>
        <small>${lesson.chartingCount} charting record${lesson.chartingCount === 1 ? "" : "s"} / ${lesson.encodingCount} spelling mark${lesson.encodingCount === 1 ? "" : "s"}</small>
      </div>
      <a href="TeachToday.html?group=${encodeURIComponent(group.id || "")}&plan=${encodeURIComponent(lesson.planId)}">Open lesson</a>
    </article>
  `).join("");
}

function monthKeyFromDay(dayKey) {
  return String(dayKey || "").slice(0, 7);
}

function monthLabel(monthKey) {
  const date = new Date(`${monthKey}-01T12:00:00`);
  if (Number.isNaN(date.getTime())) return monthKey;
  return date.toLocaleDateString([], { month: "long", year: "numeric" });
}

function renderAttendanceCalendar(lessons, group) {
  const container = byId("attendanceCalendar");
  if (!container) return;
  if (!lessons.length) {
    container.innerHTML = "<p class=\"empty-lessons\">No attendance is linked to lessons yet.</p>";
    return;
  }
  const lessonsByDay = new Map(lessons.map((lesson) => [lesson.dayKey, lesson]));
  const monthKeys = [...new Set(lessons.map((lesson) => monthKeyFromDay(lesson.dayKey)))].sort().reverse();
  container.innerHTML = monthKeys.map((monthKey) => {
    const [year, month] = monthKey.split("-").map(Number);
    const first = new Date(year, month - 1, 1);
    const daysInMonth = new Date(year, month, 0).getDate();
    const blanks = Array.from({ length: first.getDay() }, () => "<span class=\"calendar-blank\"></span>").join("");
    const days = Array.from({ length: daysInMonth }, (_, index) => {
      const day = index + 1;
      const dayKey = `${monthKey}-${String(day).padStart(2, "0")}`;
      const lesson = lessonsByDay.get(dayKey);
      if (!lesson) return `<span class="calendar-day"><b>${day}</b></span>`;
      const className = lesson.present ? "present" : "absent";
      return `<a class="calendar-day ${className}" href="TeachToday.html?group=${encodeURIComponent(group.id || "")}&plan=${encodeURIComponent(lesson.planId)}&editAttendance=${encodeURIComponent(lesson.dayKey)}" title="${escapeHtml(lesson.title)} · Edit attendance"><b>${day}</b><small>${lesson.present ? "P" : "A"}</small></a>`;
    }).join("");
    return `
      <article class="attendance-month">
        <h3>${escapeHtml(monthLabel(monthKey))}</h3>
        <div class="calendar-weekdays"><span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span></div>
        <div class="calendar-grid">${blanks}${days}</div>
      </article>
    `;
  }).join("");
}

function rosterStudents(data, group, scope = comparisonScope) {
  if (scope === "all") {
    return [...new Set((data.groups || []).flatMap((item) => item.students || []))].sort((a, b) => a.localeCompare(b));
  }
  return [...new Set(group.students || [])];
}

function renderProfileStudentButtons(data, group, activeStudent) {
  const container = byId("profileStudentButtons");
  if (!container) return;
  container.innerHTML = "";
  rosterStudents(data, group, comparisonScope).forEach((student) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = student === activeStudent ? "active" : "";
    button.textContent = student;
    button.addEventListener("click", () => {
      const studentGroup = comparisonScope === "all"
        ? (data.groups || []).find((item) => (item.students || []).includes(student)) || group
        : group;
      const studentId = privateStudentId(data, studentGroup, student);
      location.href = `StudentProfile.html?group=${encodeURIComponent(studentGroup.id || "")}&studentId=${encodeURIComponent(studentId)}`;
    });
    container.appendChild(button);
  });
}

function recordsForStudent(data, student, group, scope = comparisonScope) {
  const studentId = privateStudentId(data, group, student);
  return (data.masterRecords || []).filter((record) => {
    const identityMatch = studentId
      ? record.studentId === studentId || (!record.studentId && record.student === student)
      : record.student === student;
    const groupMatch = scope === "all" || record.groupId === group.id || record.group === group.name || record.historicalBaseline;
    return identityMatch && groupMatch && isChartingRecord(record)
      && schoolYearForRecord(data, record) === selectedProfileSchoolYear(data);
  });
}

function encodingForStudent(data, student, group, scope = comparisonScope) {
  const groups = scope === "all" ? (data.groups || []) : [group];
  const studentId = privateStudentId(data, group, student);
  const matches = (item) => studentId
    ? item.studentId === studentId || (!item.studentId && item.student === student)
    : item.student === student;
  return groups.flatMap((item) => [
    ...(item.dictationMisses || []).filter(matches),
    ...(item.encodingObservations || []).filter(matches)
  ]);
}

function comparisonStatusScore(summary) {
  return (summary.avgCorrect * 10) + (summary.autoRate * 0.4) + (summary.avgWcpm || 0) - Math.max(0, (summary.avgSeconds || 0) - 35) - summary.recentMisses * 6;
}

function studentDecodeSummary(data, student, group) {
  const records = recordsForStudent(data, student, group);
  const recent = records.slice(-5);
  const avgCorrect = average(recent, (record) => Number(record.correct || 0));
  const avgSeconds = average(recent, (record) => Number(record.seconds || 0));
  const avgWcpm = average(recent, wcpmForRecord);
  const autoRate = recent.length ? Math.round((recent.filter((record) => record.automaticity).length / recent.length) * 100) : 0;
  const recentMisses = recent.reduce((sum, record) => sum + Number(record.wrongCount || 0), 0);
  return {
    student,
    records,
    recent,
    avgCorrect,
    avgSeconds,
    avgWcpm,
    autoRate,
    recentMisses,
    status: performanceStatus(records)
  };
}

function studentEncodeSummary(data, student, group) {
  const misses = encodingForStudent(data, student, group);
  const recent = misses.slice(-5);
  return {
    student,
    misses,
    recent,
    topArea: topCount(misses.map((miss) => miss.category || miss.note || "Previous / uncategorized")),
    lastItem: misses.at(-1)?.item || misses.at(-1)?.note || "--"
  };
}

function renderComparisonTables(data, group) {
  const students = rosterStudents(data, group, comparisonScope);
  const label = byId("comparisonScopeLabel");
  if (label) label.textContent = comparisonScope === "all" ? "All roster, ranked best to support-needed" : "Current group, ranked best to support-needed";
  document.querySelectorAll(".compare-controls button").forEach((button) => {
    button.classList.toggle("active", (button.id === "compareRoster") === (comparisonScope === "all"));
  });

  const decoding = students
    .map((student) => studentDecodeSummary(data, student, group))
    .sort((a, b) => comparisonStatusScore(b) - comparisonStatusScore(a));
  const decodeBody = byId("decodeCompareRows");
  decodeBody.innerHTML = decoding.map((summary, index) => `
    <tr>
      <td>${index + 1}</td>
      <td><strong>${escapeHtml(summary.student)}</strong></td>
      <td class="${shadeClass(shadeForCorrect(summary.avgCorrect))}">${summary.avgCorrect || "--"}/15</td>
      <td class="${shadeClass(shadeForSeconds(summary.avgSeconds))}">${summary.avgSeconds || "--"}</td>
      <td class="${shadeClass(shadeForWcpm(summary.avgWcpm))}">${summary.avgWcpm || "--"}</td>
      <td class="${shadeClass(shadeForPercent(summary.autoRate))}">${summary.autoRate}%</td>
      <td><span class="compare-status ${summary.status.color}">${escapeHtml(summary.status.label)}</span></td>
    </tr>
  `).join("") || "<tr><td colspan=\"7\">No students to compare yet.</td></tr>";

  const encoding = students
    .map((student) => studentEncodeSummary(data, student, group))
    .sort((a, b) => a.misses.length - b.misses.length || a.student.localeCompare(b.student));
  const encodeBody = byId("encodeCompareRows");
  encodeBody.innerHTML = encoding.map((summary, index) => `
    <tr>
      <td>${index + 1}</td>
      <td><strong>${escapeHtml(summary.student)}</strong></td>
      <td class="${shadeClass(shadeForMissCount(summary.misses.length))}">${summary.misses.length}</td>
      <td class="${shadeClass(shadeForMissCount(summary.recent.length))}">${summary.recent.length}</td>
      <td>${escapeHtml(summary.topArea || "--")}</td>
      <td>${escapeHtml(summary.lastItem || "--")}</td>
    </tr>
  `).join("") || "<tr><td colspan=\"6\">No encoding data yet.</td></tr>";
}

function shadeClass(shade) {
  return `compare-${shade}`;
}

function shadeMetricCards(summary) {
  setCardShade("metricLessonsCard", summary.records.length ? "blue" : "gray");
  setCardShade("metricCorrectCard", shadeForCorrect(summary.avgCorrect));
  setCardShade("metricWcpmCard", shadeForWcpm(summary.avgWcpm));
  setCardShade("metricSecondsCard", shadeForSeconds(summary.avgSeconds));
  setCardShade("metricAutoCard", shadeForPercent(summary.automaticityRate));
  setCardShade("metricSubstepCard", summary.records.length ? "blue" : "gray");
  setCardShade("dictationMissTotalCard", shadeForMissCount(summary.dictationMisses.length));
  setCardShade("dictationRecentCard", shadeForMissCount(summary.recentDictation.length));
  setCardShade("dictationHotspotCard", summary.dictationMisses.length ? "orange" : "gray");
  setCardShade("dictationLastCard", summary.dictationMisses.length ? "orange" : "gray");
}

function setCardShade(id, shade) {
  const card = byId(id);
  if (!card) return;
  card.classList.remove("shade-blue", "shade-green", "shade-yellow", "shade-orange", "shade-red", "shade-gray");
  card.classList.add(`shade-${shade}`);
}

function shadeForCorrect(value) {
  if (!value) return "gray";
  if (value >= 14.5) return "blue";
  if (value >= 12) return "green";
  if (value >= 10) return "orange";
  return "red";
}

function shadeForSeconds(value) {
  if (!value) return "gray";
  if (value <= 35) return "green";
  if (value <= 54) return "yellow";
  return "red";
}

function shadeForWcpm(value) {
  if (!value) return "gray";
  if (value >= 26) return "blue";
  if (value >= 21) return "green";
  if (value >= 17) return "yellow";
  if (value >= 12) return "orange";
  return "red";
}

function shadeForPercent(value) {
  if (!value) return "gray";
  if (value >= 80) return "blue";
  if (value >= 60) return "green";
  if (value >= 40) return "yellow";
  if (value >= 20) return "orange";
  return "red";
}

function shadeForMissCount(value) {
  if (!value) return "green";
  if (value <= 2) return "yellow";
  if (value <= 5) return "orange";
  return "red";
}

function renderDiagnosticBubbles({ records, recent, marked, dictationMisses }) {
  const container = byId("diagnosticBubbles");
  const avgCorrect = average(recent, (record) => Number(record.correct || 0));
  const avgSeconds = average(recent, (record) => Number(record.seconds || 0));
  const avgWcpm = average(recent, wcpmForRecord);
  const autoRate = recent.length ? Math.round((recent.filter((record) => record.automaticity).length / recent.length) * 100) : 0;
  const wrongTotal = recent.reduce((sum, record) => sum + Number(record.wrongCount || 0), 0);
  const patternCount = detectPatterns(insightWords(records, marked, dictationMisses)).length;
  const bubbles = [
    { label: "Accuracy", value: avgCorrect ? `${avgCorrect}/15` : "--", shade: shadeForCorrect(avgCorrect), note: avgCorrect >= 12 ? "meets accuracy" : "reteach page" },
    { label: "Automaticity", value: `${autoRate}%`, shade: shadeForPercent(autoRate), note: avgSeconds && avgSeconds <= 35 ? "fast enough" : "needs speed" },
    { label: "sec/15w", value: avgSeconds || "--", shade: shadeForSeconds(avgSeconds), note: avgSeconds && avgSeconds <= 35 ? "automatic" : "slow read" },
    { label: "WCPM", value: avgWcpm || "--", shade: shadeForWcpm(avgWcpm), note: avgWcpm >= 21 ? "solid fluency" : "build fluency" },
    { label: "Recent errors", value: wrongTotal, shade: shadeForMissCount(wrongTotal), note: "last 5 lessons" },
    { label: "Dictation", value: dictationMisses.length, shade: shadeForMissCount(dictationMisses.length), note: "saved misses" },
    { label: "Patterns", value: patternCount, shade: patternCount >= 5 ? "red" : patternCount >= 3 ? "orange" : patternCount >= 1 ? "yellow" : "green", note: "skill flags" },
    { label: "Data depth", value: records.length, shade: records.length >= 5 ? "green" : records.length >= 2 ? "yellow" : "gray", note: "chart records" }
  ];
  container.innerHTML = "";
  bubbles.forEach((bubble) => {
    const item = document.createElement("article");
    item.className = `diagnostic-bubble shade-${bubble.shade}`;
    item.innerHTML = `<strong>${escapeHtml(bubble.value)}</strong><span>${escapeHtml(bubble.label)}</span><small>${escapeHtml(bubble.note)}</small>`;
    container.appendChild(item);
  });
}

function average(records, valueFor) {
  const values = records.map(valueFor).filter((value) => Number.isFinite(value) && value > 0);
  return values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : 0;
}

function wcpmForRecord(record) {
  const seconds = Number(record.seconds || 0);
  return seconds ? Math.round((Number(record.correct || 0) / seconds) * 60) : 0;
}

function formatWcpm(value) {
  const wcpm = Number(value || 0);
  return wcpm ? `${escapeHtml(wcpm)} wcpm` : "--";
}

function performanceStatus(records) {
  const recent = records.slice(-5);
  if (!recent.length) return { color: "gray", label: "No data yet" };
  const avgCorrect = average(recent, (record) => Number(record.correct || 0));
  const avgSeconds = average(recent, (record) => Number(record.seconds || 0));
  const autoRate = recent.filter((record) => record.automaticity).length / recent.length;
  if (avgCorrect >= 14.5 && avgSeconds && avgSeconds <= 35 && autoRate >= 0.8) return { color: "blue", label: "Strong automaticity" };
  if (avgCorrect >= 12 && avgSeconds && avgSeconds <= 35) return { color: "green", label: "Accurate and automatic" };
  if (avgCorrect >= 12) return { color: "yellow", label: "Accurate, building speed" };
  if (avgCorrect < 10 || avgSeconds > 55) return { color: "red", label: "Needs support now" };
  return { color: "orange", label: "Not accurate yet" };
}

function commonWrongWords(records) {
  const counts = new Map();
  records.forEach((record) => (record.wrongWords || []).forEach((word) => counts.set(word, (counts.get(word) || 0) + 1)));
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([word, count]) => `${word} (${count})`);
}

function commonDictationMisses(misses) {
  const counts = new Map();
  misses.forEach((miss) => counts.set(miss.item, (counts.get(miss.item) || 0) + 1));
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([word, count]) => `${word} (${count})`);
}

function topCount(items) {
  const counts = new Map();
  items.filter(Boolean).forEach((item) => counts.set(item, (counts.get(item) || 0) + 1));
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || "";
}

function renderChips(container, words, emptyText) {
  container.innerHTML = "";
  const source = words.length ? words : [emptyText];
  source.forEach((word) => {
    const item = document.createElement("span");
    item.textContent = word;
    container.appendChild(item);
  });
}

function renderCategoryBars(misses) {
  const container = byId("dictationCategories");
  container.innerHTML = "";
  if (!misses.length) {
    container.innerHTML = "<p>No dictation categories yet.</p>";
    return;
  }
  const counts = new Map();
  misses.forEach((miss) => counts.set(miss.category || "Previous / uncategorized", (counts.get(miss.category || "Previous / uncategorized") || 0) + 1));
  const max = Math.max(...counts.values(), 1);
  [...counts.entries()].sort((a, b) => b[1] - a[1]).forEach(([category, count]) => {
    const row = document.createElement("div");
    row.className = "category-row";
    row.innerHTML = `
      <span>${escapeHtml(category)}</span>
      <div><i style="width:${Math.max(8, (count / max) * 100)}%"></i></div>
      <strong>${count}</strong>
    `;
    container.appendChild(row);
  });
}

function renderPatternInsights(records, marked, dictationMisses) {
  const container = byId("patternInsights");
  const words = insightWords(records, marked, dictationMisses);
  const patterns = detectPatterns(words);
  container.innerHTML = "";
  if (!patterns.length) {
    container.innerHTML = "<p class=\"empty-insight\">Save more misses or marked review words to generate pattern insights.</p>";
    return;
  }
  patterns.slice(0, 8).forEach((pattern) => {
    const card = document.createElement("article");
    card.className = `insight-tile ${pattern.level}`;
    card.innerHTML = `
      <div><strong>${escapeHtml(pattern.title)}</strong><span>${pattern.count} hit${pattern.count === 1 ? "" : "s"}</span></div>
      <p>${escapeHtml(pattern.note)}</p>
      <small>${escapeHtml(pattern.examples.slice(0, 8).join(", "))}</small>
    `;
    container.appendChild(card);
  });
}

function insightWords(records, marked, dictationMisses) {
  const words = [];
  records.forEach((record) => words.push(...(record.wrongWords || [])));
  marked.forEach((item) => words.push(item.word));
  dictationMisses.forEach((miss) => words.push(miss.item));
  return words.map((word) => String(word || "").toLowerCase().replace(/[^a-z-]/g, "")).filter((word) => word.length >= 2);
}

function detectPatterns(words) {
  const definitions = [
    { id: "triple", title: "Triple consonant blends", level: "risk", tests: ["spr", "str", "scr", "spl", "shr", "thr"], note: "Practice slow sound-by-sound blending before full-word reading." },
    { id: "blend", title: "Common blends", level: "watch", tests: ["sp", "st", "sk", "sl", "sm", "sn", "br", "bl", "cr", "cl", "dr", "fl", "fr", "gl", "gr", "pl", "pr", "tr"], note: "Blend work is showing up in misses; add quick drill and sound tapping." },
    { id: "welded-ng", title: "Welded /ng/ family", level: "risk", tests: ["ang", "ing", "ong", "ung"], note: "Check if student is substituting one welded sound for another, especially /ing/ vs /ang/." },
    { id: "welded-nk", title: "Welded /nk/ family", level: "watch", tests: ["ank", "ink", "onk", "unk"], note: "Keep welded sounds boxed and read as one unit." },
    { id: "closed-exception", title: "Closed exceptions", level: "watch", tests: ["ild", "ind", "old", "olt", "ost"], note: "Review exception sound before reading the whole word." },
    { id: "suffix-es", title: "Suffix -es", level: "risk", tests: ["es"], note: "Suffix -es may need base-word plus suffix practice." },
    { id: "suffix-ed-ing", title: "Suffix -ed / -ing", level: "watch", tests: ["ed", "ing"], note: "Have student read the base first, then add the suffix." },
    { id: "ve", title: "Vowel-consonant-e", level: "watch", tests: ["a-e", "e-e", "i-e", "o-e", "u-e"], custom: hasVePattern, note: "Book 4 v-e pattern may need contrast with closed syllables." },
    { id: "fss", title: "Final stable syllables", level: "watch", tests: ["ble", "cle", "dle", "fle", "gle", "kle", "ple", "stle", "tle", "zle"], note: "Mark final stable syllable before reading/spelling." },
    { id: "latin", title: "Latin bases", level: "info", tests: ["dict", "duct", "fect", "flect", "ject", "lect", "press", "rupt", "spect", "struct", "tract", "vict"], note: "Review base meaning/reading and keep base together." }
  ];
  return definitions
    .map((definition) => patternSummary(definition, words))
    .filter((pattern) => pattern.count > 0)
    .sort((a, b) => b.count - a.count || severityRank(a.level) - severityRank(b.level));
}

function patternSummary(definition, words) {
  const examples = [];
  words.forEach((word) => {
    const hit = definition.custom
      ? definition.custom(word)
      : definition.tests.some((test) => word.includes(test));
    if (hit && !examples.includes(word)) examples.push(word);
  });
  const count = words.filter((word) => definition.custom
    ? definition.custom(word)
    : definition.tests.some((test) => word.includes(test))).length;
  return { ...definition, count, examples };
}

function hasVePattern(word) {
  return /[aeiou][bcdfghjklmnpqrstvwxyz]e$/.test(word)
    || /[aeiou][bcdfghjklmnpqrstvwxyz]e(s|d|ing|ful|less|ly)?$/.test(word);
}

function severityRank(level) {
  return { risk: 0, watch: 1, info: 2 }[level] ?? 3;
}

function formatDateShort(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
}

function trendDelta(n, unit = "", lowerIsBetter = false) {
  if (n === 0) return `<span class="growth-flat">±0${unit}</span>`;
  const improving = lowerIsBetter ? n < 0 : n > 0;
  const sign = n > 0 ? "+" : "";
  return `<span class="${improving ? "growth-up" : "growth-down"}">${sign}${n}${unit}</span>`;
}

function renderTrend(records) {
  const chart = byId("trendChart");
  const trendRecords = records.filter((record) => !record.excludeFromTrend && (record.date || record.displayDate));
  if (trendRecords.length < 2) {
    chart.innerHTML = "<p>Save two or more records to show progress over time.</p>";
    return;
  }

  const sorted = trendRecords.slice().sort((a, b) =>
    new Date(a.date || a.displayDate || 0) - new Date(b.date || b.displayDate || 0)
  );
  const first = sorted[0];
  const last = sorted.at(-1);

  // Growth summary
  const firstCorrect = Number(first.correct || 0);
  const lastCorrect = Number(last.correct || 0);
  const firstSec = Number(first.seconds || 0);
  const lastSec = Number(last.seconds || 0);
  const firstWcpm = wcpmForRecord(first);
  const lastWcpm = wcpmForRecord(last);
  const summaryHtml = `
    <div class="growth-summary">
      <div class="growth-range">${escapeHtml(formatDateShort(first.date || first.displayDate))} → ${escapeHtml(formatDateShort(last.date || last.displayDate))}<span class="growth-count">${sorted.length} records</span></div>
      <div class="growth-stats">
        <div class="growth-stat"><span class="gs-label">Correct/15</span><span class="gs-val">${firstCorrect}</span><span class="gs-arrow">→</span><span class="gs-val">${lastCorrect}</span>${trendDelta(lastCorrect - firstCorrect)}</div>
        ${firstSec && lastSec ? `<div class="growth-stat"><span class="gs-label">sec/15w</span><span class="gs-val">${firstSec}</span><span class="gs-arrow">→</span><span class="gs-val">${lastSec}</span>${trendDelta(lastSec - firstSec, " sec", true)}</div>` : ""}
        ${firstWcpm && lastWcpm ? `<div class="growth-stat"><span class="gs-label">WCPM</span><span class="gs-val">${firstWcpm}</span><span class="gs-arrow">→</span><span class="gs-val">${lastWcpm}</span>${trendDelta(lastWcpm - firstWcpm)}</div>` : ""}
      </div>
    </div>
  `;

  // Chart geometry
  const PAD_L = 38, PAD_R = 24, PAD_T = 28, PAD_B = 66;
  const H = 270;
  const MIN_SPACING = 46;
  const baseW = 700 - PAD_L - PAD_R;
  const spacing = sorted.length > 1 ? Math.max(MIN_SPACING, Math.floor(baseW / (sorted.length - 1))) : baseW;
  const W = PAD_L + spacing * Math.max(sorted.length - 1, 1) + PAD_R + 16;
  const plotW = W - PAD_L - PAD_R;
  const plotH = H - PAD_T - PAD_B;

  const maxWcpm = Math.max(30, ...sorted.map(wcpmForRecord));
  const maxSec = Math.max(60, ...sorted.map((r) => Number(r.seconds || 0)));

  const xAt = (i) => PAD_L + (sorted.length > 1 ? (i / (sorted.length - 1)) * plotW : plotW / 2);
  const yAcc = (v) => PAD_T + plotH - (Math.min(Math.max(v, 0), 15) / 15) * plotH;
  const yWcpm = (v) => PAD_T + plotH - (Math.min(Math.max(v, 0), maxWcpm) / maxWcpm) * plotH;
  const ySec = (v) => v > 0 ? PAD_T + (Math.min(v, maxSec) / maxSec) * plotH : null;

  const accPts = sorted.map((r, i) => ({ x: xAt(i), y: yAcc(Number(r.correct || 0)), v: Number(r.correct || 0) }));
  const wcpmPts = sorted.map((r, i) => {
    const v = wcpmForRecord(r);
    return { x: xAt(i), y: v > 0 ? yWcpm(v) : null, v };
  });
  const secPts = sorted.map((r, i) => {
    const v = Number(r.seconds || 0);
    return { x: xAt(i), y: ySec(v), v };
  });

  const polylineStr = (pts) => pts.filter((p) => p.y !== null).map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");

  // Grid lines at meaningful accuracy thresholds
  const gridValues = [0, 5, 10, 12, 15];
  const gridSvg = gridValues.map((v) => {
    const y = yAcc(v).toFixed(1);
    const isThresh = v === 12;
    return `<line x1="${PAD_L}" y1="${y}" x2="${(W - PAD_R).toFixed(1)}" y2="${y}" class="${isThresh ? "threshold-line" : "grid-line"}"></line>
      <text x="${(PAD_L - 5).toFixed(1)}" y="${(yAcc(v) + 4).toFixed(1)}" class="y-label">${v}</text>
      ${isThresh ? `<text x="${(W - PAD_R + 3).toFixed(1)}" y="${(yAcc(v) + 4).toFixed(1)}" class="threshold-tag">goal</text>` : ""}`;
  }).join("");

  // Substep change markers
  const substepSvg = sorted.map((r, i) => {
    if (i === 0 || !r.substep || r.substep === sorted[i - 1].substep) return "";
    const x = xAt(i).toFixed(1);
    return `<line x1="${x}" y1="${PAD_T}" x2="${x}" y2="${(H - PAD_B).toFixed(1)}" class="substep-marker"></line>
      <text x="${x}" y="${(PAD_T - 6).toFixed(1)}" class="substep-label">${escapeHtml(r.substep || "")}</text>`;
  }).join("");

  // Date labels rotated at bottom
  const dateSvg = sorted.map((r, i) => {
    const d = new Date(r.date || r.displayDate || "");
    if (Number.isNaN(d.getTime())) return "";
    const label = d.toLocaleDateString([], { month: "short", day: "numeric" });
    const cx = xAt(i).toFixed(1);
    const cy = (H - PAD_B + 14).toFixed(1);
    return `<text x="${cx}" y="${cy}" class="date-label" transform="rotate(-40 ${cx} ${cy})">${escapeHtml(label)}</text>`;
  }).join("");

  // Dots with tooltips
  const dotsSvg = (pts, cls, tipFn) => pts.map((p, i) => {
    if (p.y === null) return "";
    return `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="4" class="trend-dot ${cls}"><title>${escapeHtml(tipFn(sorted[i]))}</title></circle>`;
  }).join("");

  const svgHtml = `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Student progress over time" style="display:block">
    ${gridSvg}
    <line x1="${PAD_L}" y1="${PAD_T}" x2="${PAD_L}" y2="${(H - PAD_B).toFixed(1)}" class="axis"></line>
    <line x1="${PAD_L}" y1="${(H - PAD_B).toFixed(1)}" x2="${(W - PAD_R).toFixed(1)}" y2="${(H - PAD_B).toFixed(1)}" class="axis"></line>
    ${substepSvg}
    ${secPts.filter((p) => p.y !== null).length >= 2 ? `<polyline points="${polylineStr(secPts)}" class="trend-line seconds-line"></polyline>` : ""}
    ${wcpmPts.filter((p) => p.y !== null).length >= 2 ? `<polyline points="${polylineStr(wcpmPts)}" class="trend-line wcpm-line"></polyline>` : ""}
    <polyline points="${polylineStr(accPts)}" class="trend-line accuracy-line"></polyline>
    ${dotsSvg(secPts, "seconds-dot", (r) => `${shortDate(r.date || r.displayDate)}: ${r.seconds || "--"} sec/15w`)}
    ${dotsSvg(wcpmPts, "wcpm-dot", (r) => `${shortDate(r.date || r.displayDate)}: ${wcpmForRecord(r)} WCPM`)}
    ${dotsSvg(accPts, "accuracy-dot", (r) => `${shortDate(r.date || r.displayDate)}: ${r.correct || 0}/15 correct`)}
    ${dateSvg}
  </svg>`;

  chart.innerHTML = `
    ${summaryHtml}
    <div class="trend-scroll">${svgHtml}</div>
    <div class="legend">
      <span><i style="background:#0f766e"></i>Correct/15</span>
      <span><i style="background:#2563eb"></i>WCPM</span>
      <span><i style="background:#f59e0b"></i>sec/15w (lower = faster)</span>
      <span><span class="legend-threshold-line"></span>12/15 goal</span>
    </div>
  `;
}

function renderDictationTrend(misses) {
  const container = byId("dictationTrendChart");
  if (!container) return;
  if (!misses.length) {
    container.innerHTML = "<p>No dictation records saved for this student yet.</p>";
    return;
  }

  // Group by session date
  const byDate = new Map();
  misses.forEach((miss) => {
    const key = dateKeyLocal(miss.date);
    if (!key) return;
    if (!byDate.has(key)) byDate.set(key, { key, count: 0 });
    byDate.get(key).count++;
  });

  const dates = [...byDate.values()].sort((a, b) => a.key.localeCompare(b.key));
  if (dates.length < 2) {
    container.innerHTML = "<p>Need misses on two or more dates to show trends.</p>";
    return;
  }

  const first = dates[0];
  const last = dates.at(-1);
  const countDelta = last.count - first.count;
  const summaryHtml = `
    <div class="growth-summary">
      <div class="growth-range">${escapeHtml(formatDateShort(first.key + "T12:00:00"))} → ${escapeHtml(formatDateShort(last.key + "T12:00:00"))}<span class="growth-count">${dates.length} sessions</span></div>
      <div class="growth-stats">
        <div class="growth-stat"><span class="gs-label">Misses/session</span><span class="gs-val">${first.count}</span><span class="gs-arrow">→</span><span class="gs-val">${last.count}</span>${trendDelta(countDelta, "", true)}</div>
      </div>
    </div>
  `;

  // Bar chart geometry
  const PAD_L = 38, PAD_R = 20, PAD_T = 20, PAD_B = 64;
  const H = 180;
  const MIN_BAR_W = 38;
  const barW = Math.max(MIN_BAR_W, Math.floor((660 - PAD_L - PAD_R) / dates.length));
  const W = Math.max(660, PAD_L + dates.length * barW + PAD_R + 16);
  const plotH = H - PAD_T - PAD_B;
  const maxCount = Math.max(...dates.map((d) => d.count), 1);

  // Y-axis grid
  const gridStep = maxCount <= 4 ? 1 : maxCount <= 10 ? 2 : 5;
  const gridSvg = Array.from({ length: Math.floor(maxCount / gridStep) + 1 }, (_, k) => k * gridStep).map((v) => {
    const y = (PAD_T + plotH - (v / maxCount) * plotH).toFixed(1);
    return `<line x1="${PAD_L}" y1="${y}" x2="${(W - PAD_R).toFixed(1)}" y2="${y}" class="grid-line"></line>
      <text x="${(PAD_L - 5).toFixed(1)}" y="${(Number(y) + 4).toFixed(1)}" class="y-label">${v}</text>`;
  }).join("");

  const barsSvg = dates.map((d, i) => {
    const barH = Math.max(2, (d.count / maxCount) * plotH);
    const bx = (PAD_L + i * barW + 3).toFixed(1);
    const by = (PAD_T + plotH - barH).toFixed(1);
    const bw = (barW - 6).toFixed(1);
    const cx = (PAD_L + i * barW + barW / 2).toFixed(1);
    const labelDate = shortDate(d.key + "T12:00:00");
    const cy = (H - PAD_B + 14).toFixed(1);
    return `<rect x="${bx}" y="${by}" width="${bw}" height="${barH.toFixed(1)}" class="dictation-bar" rx="3">
        <title>${escapeHtml(labelDate)}: ${d.count} miss${d.count === 1 ? "" : "es"}</title>
      </rect>
      <text x="${cx}" y="${(Number(by) - 4).toFixed(1)}" class="bar-count">${d.count}</text>
      <text x="${cx}" y="${cy}" class="date-label" transform="rotate(-40 ${cx} ${cy})">${escapeHtml(labelDate)}</text>`;
  }).join("");

  const svgHtml = `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Dictation misses over time" style="display:block">
    ${gridSvg}
    <line x1="${PAD_L}" y1="${PAD_T}" x2="${PAD_L}" y2="${(H - PAD_B).toFixed(1)}" class="axis"></line>
    <line x1="${PAD_L}" y1="${(H - PAD_B).toFixed(1)}" x2="${(W - PAD_R).toFixed(1)}" y2="${(H - PAD_B).toFixed(1)}" class="axis"></line>
    ${barsSvg}
  </svg>`;

  container.innerHTML = `
    ${summaryHtml}
    <div class="trend-scroll">${svgHtml}</div>
  `;
}

function renderChartingSheet(records) {
  const table = byId("chartingSheet");
  if (!table) return;
  const chartRecords = records;
  if (!chartRecords.length) {
    table.innerHTML = "<tbody><tr><td class=\"sheet-empty\">No Section 4 charting records saved yet.</td></tr></tbody>";
    return;
  }

  const headerRows = [
    { label: "Date", value: (record) => shortDate(record.date || record.displayDate) },
    { label: "Substep", value: (record) => record.substep || "" },
    { label: "Concept", value: (record) => record.concept || record.title || record.focus || "" },
    { label: "Page #", value: (record) => record.wordlistPage || "" },
    { label: "R or N", value: (record) => chartingWordTypeSelect(record), html: true }
  ];
  const scoreRows = Array.from({ length: 16 }, (_, index) => 15 - index);

  const rows = headerRows.map((row) => `
    <tr class="sheet-head-row">
      <th>${escapeHtml(row.label)}:</th>
      ${chartRecords.map((record) => `<td>${row.html ? row.value(record) : escapeHtml(row.value(record) || "--")}</td>`).join("")}
    </tr>
  `).join("");

  const scoreMarkup = scoreRows.map((score) => `
    <tr class="score-row">
      <th>${score}</th>
      ${chartRecords.map((record) => chartingScoreCell(record, score)).join("")}
    </tr>
  `).join("");

  const statusRow = `
    <tr class="sheet-status-row">
      <th>Status</th>
      ${chartRecords.map((record) => {
        const status = chartingStatus(record);
        return `<td class="status-${status.toLowerCase()}">${status}</td>`;
      }).join("")}
    </tr>
  `;
  const secondsRow = `
    <tr class="sheet-data-row">
      <th>Seconds</th>
      ${chartRecords.map((record) => `<td>${record.seconds ? `${escapeHtml(record.seconds)} sec` : "--"}</td>`).join("")}
    </tr>
  `;
  const wcpmRow = `
    <tr class="sheet-data-row">
      <th>WCPM</th>
      ${chartRecords.map((record) => {
        const wcpm = record.wcpm || wcpmForRecord(record);
        return `<td>${formatWcpm(wcpm)}</td>`;
      }).join("")}
    </tr>
  `;

  table.innerHTML = `<tbody>${rows}${scoreMarkup}${statusRow}${secondsRow}${wcpmRow}</tbody>`;
}

function chartingScoreCell(record, score) {
  const correct = Number(record.correct || 0);
  const misses = chartingMissNotes(record);
  const missIndex = 15 - score;
  const note = score > correct ? misses[missIndex] || "" : "";
  const classes = ["chart-score-cell"];
  if (score <= correct) classes.push("filled");
  if (note) classes.push("has-miss");
  return `<td class="${classes.join(" ")}">${escapeHtml(note)}</td>`;
}

function chartingMissNotes(record) {
  const half = record.chartHalf || "";
  const wordRecords = (record.wordRecords || []).filter((item) => !half || item.section === half);
  const missed = wordRecords.filter((item) => item && item.correct === false);
  if (missed.length) {
    return missed.map((item) => {
      const word = item.word || "";
      const said = item.said || "";
      return said ? `${word} -> ${said}` : word;
    }).filter(Boolean);
  }
  return (record.wrongWords || []).map((word) => String(word || "")).filter(Boolean);
}

function chartingStatus(record) {
  const correct = Number(record.correct || 0);
  const seconds = Number(record.seconds || 0);
  if (correct >= 12 && seconds > 0 && seconds <= 35) return "Auto";
  if (correct >= 12) return "Acc";
  return "Strug";
}

function chartingWordType(record) {
  const half = String(record.chartHalf || "").toLowerCase();
  if (half === "top") return "Real";
  if (half === "bottom") return "Nonsense";
  return titleCase(record.chartHalf || "");
}

function chartingWordTypeSelect(record) {
  const selected = chartingWordType(record);
  return `<select class="charting-type-select" aria-label="Real or nonsense charting type">
    <option ${selected === "Real" ? "selected" : ""}>Real</option>
    <option ${selected === "Nonsense" ? "selected" : ""}>Nonsense</option>
  </select>`;
}

function audioCloudLabel(record, fromCloud = false) {
  if (fromCloud || record.audioUrl) return "Cloud ready";
  const status = record.audioUploadStatus || "local-only";
  if (status === "queued") return "Waiting to upload";
  if (status === "uploading") return "Uploading";
  if (status === "failed") return "Upload failed";
  if (status === "missing-local-file") return "Local file missing";
  return "Local only";
}

function audioPlayerMarkup(url, fileName = "recording.webm", allowDownload = false) {
  return `
    <div class="audio-player-wrap">
      <audio controls src="${url}"></audio>
      <label class="audio-speed-control">
        <span>Speed</span>
        <select>
          <option value="1">1x</option>
          <option value="1.25">1.25x</option>
          <option value="1.5">1.5x</option>
          <option value="2">2x</option>
        </select>
      </label>
      ${allowDownload ? `<a href="${url}" download="${escapeHtml(fileName)}">Download</a>` : ""}
    </div>`;
}

function wireAudioSpeedControls(root = document) {
  root.querySelectorAll(".audio-speed-control select").forEach((select) => {
    if (select.dataset.bound === "true") return;
    select.dataset.bound = "true";
    select.addEventListener("change", () => {
      const audio = select.closest(".audio-player-wrap")?.querySelector("audio");
      if (audio) audio.playbackRate = Number(select.value) || 1;
    });
  });
}

async function loadRecordAudio(record) {
  if (record.audioUrl) return { url: record.audioUrl, source: "firebase", downloadable: false };
  const blob = record.audioRecordingId ? await loadAudioBlob(record.audioRecordingId).catch(() => null) : null;
  if (blob) return { url: URL.createObjectURL(blob), source: "local", downloadable: true };
  const syncedFile = await loadAudioSyncFile(record.audioSyncFile || record.audioFileName).catch(() => null);
  if (syncedFile) return { url: URL.createObjectURL(syncedFile), source: "sync-folder", downloadable: true };
  const driveBlob = record.driveFileId ? await loadDriveAudioFile(record.driveFileId).catch(() => null) : null;
  if (driveBlob) return { url: URL.createObjectURL(driveBlob), source: "drive", downloadable: false };
  return null;
}

function openAudioDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open("teachToday_audio", 1);
    req.onupgradeneeded = (e) => e.target.result.createObjectStore("recordings");
    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror = () => reject(req.error);
  });
}
async function loadAudioBlob(id) {
  const db = await openAudioDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("recordings", "readonly");
    const req = tx.objectStore("recordings").get(id);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

function openAudioSyncDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(audioSyncDbName, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(audioSyncStore);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function getAudioSyncFolderHandle() {
  if (!window.showDirectoryPicker) return null;
  const db = await openAudioSyncDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(audioSyncStore, "readonly");
    const req = tx.objectStore(audioSyncStore).get(audioSyncHandleKey);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

async function loadAudioSyncFile(fileName) {
  if (!fileName) return null;
  const handle = await getAudioSyncFolderHandle().catch(() => null);
  if (!handle) return null;
  const permission = await handle.queryPermission?.({ mode: "read" });
  if (permission !== "granted") return null;
  const fileHandle = await handle.getFileHandle(fileName).catch(() => null);
  if (!fileHandle) return null;
  return fileHandle.getFile();
}

function renderRows(records) {
  const body = byId("recordRows");
  body.innerHTML = "";
  records.slice().reverse().forEach((record) => {
    const row = document.createElement("tr");
    const hasRecording = record.audioRecordingId || record.driveFileId;
    const audioCell = hasRecording
      ? `<button class="play-audio-btn" data-recording-id="${escapeHtml(record.audioRecordingId)}" data-audio-url="${escapeHtml(record.audioUrl || "")}" data-file-name="${escapeHtml(record.audioFileName || "recording.webm")}" title="Play session recording" style="background:none;border:1px solid #888;border-radius:4px;padding:2px 7px;cursor:pointer;font-size:13px;">▶ Play</button>`
      : `<span style="color:#bbb;font-size:12px;">—</span>`;
    row.innerHTML = `
      <td>${escapeHtml(record.displayDate || record.date || "")}</td>
      <td>${escapeHtml(record.substep || "")}</td>
      <td>Reader ${escapeHtml(record.reader || "")}, p. ${escapeHtml(record.wordlistPage || "")}</td>
      <td>${escapeHtml(titleCase(record.chartHalf || ""))}</td>
      <td class="${metricClass(record, "correct")}">${escapeHtml(record.correct ?? "")}/${escapeHtml(record.total || 15)}</td>
      <td class="${metricClass(record, "wrong")}">${escapeHtml(record.wrongCount ?? Math.max((record.total || 15) - (record.correct || 0), 0))}</td>
      <td class="${metricClass(record, "seconds")}">${escapeHtml(record.seconds || "--")}</td>
      <td class="${metricClass(record, "wcpm")}">${formatWcpm(record.wcpm || wcpmForRecord(record))}</td>
      <td>${record.accuracy ? "accuracy " : ""}${record.fluency ? "fluency " : ""}${record.automaticity ? "automaticity" : ""}</td>
      <td>${escapeHtml((record.wrongWords || []).join(", ") || "none")}</td>
      <td>${escapeHtml(record.notes || "")}</td>
      <td>${audioCell}</td>
    `;
    body.appendChild(row);
    row.querySelector(".play-audio-btn")?.addEventListener("click", async (event) => {
      const btn = event.currentTarget;
      const fileName = record.audioFileName || "recording.webm";
      const existingPlayer = btn.closest("tr").querySelector(".audio-inline-player");
      if (existingPlayer) { existingPlayer.remove(); return; }
      btn.textContent = "Loading...";
      try {
        const loaded = await loadRecordAudio(record);
        if (!loaded) { btn.textContent = "Not found"; return; }
        const container = document.createElement("div");
        container.className = "audio-inline-player";
        container.innerHTML = audioPlayerMarkup(loaded.url, fileName, loaded.downloadable);
        btn.closest("td").appendChild(container);
        wireAudioSpeedControls(container);
        btn.textContent = "Play";
      } catch (err) {
        btn.textContent = "Error";
        console.error("Audio load failed:", err);
      }
    });
  });
  if (!records.length) {
    body.innerHTML = "<tr><td colspan=\"12\">No records saved for this student yet.</td></tr>";
  }
}

async function renderRecordingsSection(records) {
  const container = byId("recordingsList");
  if (!container) return;
  const withAudio = records.slice().reverse().filter((r) => r.audioRecordingId);
  if (!withAudio.length) {
    container.innerHTML = "<p class=\"recordings-empty\">No recordings saved for this student yet.</p>";
    return;
  }
  container.innerHTML = "<p class=\"recordings-empty\" style=\"font-size:13px;color:#888;\">Loading recordings…</p>";

  const cards = await Promise.all(withAudio.map(async (record) => {
    // Use Firebase Storage URL if available, otherwise load from IndexedDB
    if (record.audioUrl) return { record, url: record.audioUrl, fromCloud: true };
    const blob = await loadAudioBlob(record.audioRecordingId).catch(() => null);
    if (blob) return { record, url: URL.createObjectURL(blob), fromCloud: false };
    const syncedFile = await loadAudioSyncFile(record.audioSyncFile || record.audioFileName).catch(() => null);
    const url = syncedFile ? URL.createObjectURL(syncedFile) : null;
    return { record, url, fromCloud: false, fromSyncFolder: Boolean(syncedFile) };
  }));

  container.innerHTML = "";
  cards.forEach(({ record, url, fromCloud, fromSyncFolder }) => {
    const card = document.createElement("div");
    card.className = "recording-card";
    const fileName = record.audioFileName || "recording.webm";
    const dateLabel = record.displayDate || record.date?.slice(0, 10) || "Unknown date";
    const substep = record.substep || "";
    const half = record.chartHalf ? ` · ${titleCase(record.chartHalf)} half` : "";
    const metaText = `${dateLabel} · Substep ${substep}${half}`;

    if (!url) {
      const driveAction = record.driveFileId
        ? `<button type="button" class="drive-audio-btn" data-drive-file-id="${escapeHtml(record.driveFileId)}">Play from Google Drive</button>`
        : "";
      card.innerHTML = `
        <div class="recording-card-meta">
          <strong>${escapeHtml(fileName)}</strong>
          <span>${escapeHtml(metaText)} · ${escapeHtml(audioCloudLabel(record))}</span>
          ${record.audioUploadMessage ? `<span>${escapeHtml(record.audioUploadMessage)}</span>` : ""}
          ${record.driveUploadMessage ? `<span>${escapeHtml(record.driveUploadMessage)}</span>` : ""}
          ${driveAction}
        </div>`;
      container.appendChild(card);
      return;
    }

    const badgeText = fromSyncFolder ? "Synced folder" : audioCloudLabel(record, fromCloud);
    const cloudBadge = `<span style="font-size:11px;color:${fromCloud || fromSyncFolder ? "#4a90e2" : "#777"};">${escapeHtml(badgeText)}</span>`;
    card.innerHTML = `
      <div class="recording-card-meta recording-card-full">
        <strong>${escapeHtml(fileName)}</strong>
        <span>${escapeHtml(metaText)} ${cloudBadge}</span>
        ${audioPlayerMarkup(url, fileName, !fromCloud)}
      </div>
      <div class="recording-card-actions"></div>`;
    container.appendChild(card);
  });
  wireAudioSpeedControls(container);

  container.querySelectorAll(".drive-audio-btn").forEach((button) => {
    button.addEventListener("click", async () => {
      button.textContent = "Loading...";
      try {
        const blob = await loadDriveAudioFile(button.dataset.driveFileId);
        if (!blob) {
          button.textContent = "Drive not connected";
          return;
        }
        const url = URL.createObjectURL(blob);
        const player = document.createElement("div");
        player.innerHTML = audioPlayerMarkup(url, "recording.webm", false);
        button.replaceWith(player.firstElementChild);
        wireAudioSpeedControls(container);
      } catch (err) {
        button.textContent = "Drive file not found";
        console.warn("Google Drive audio load failed:", err);
      }
    });
  });
}

async function renderSoundsDrillSection(records) {
  const container = byId("soundsDrillList");
  if (!container) return;
  const sessions = records
    .filter((record) => record.type === "soundsDrill")
    .slice()
    .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

  if (!sessions.length) {
    container.innerHTML = "<p class=\"recordings-empty\">No sounds drill sessions saved for this student yet.</p>";
    return;
  }

  const cards = await Promise.all(sessions.map(async (record) => {
    let audioUrl = record.audioUrl || "";
    if (!audioUrl && record.audioRecordingId) {
      const blob = await loadAudioBlob(record.audioRecordingId).catch(() => null);
      if (blob) audioUrl = URL.createObjectURL(blob);
    }
    return { record, audioUrl };
  }));

  container.innerHTML = "";
  cards.forEach(({ record, audioUrl }) => {
    const card = document.createElement("article");
    card.className = "sounds-drill-card";
    const confidence = record.confidenceResults || [];
    const exact = confidence.filter((item) => item.conf === "exact").length;
    const similar = confidence.filter((item) => item.conf === "similar").length;
    const review = confidence.filter((item) => item.conf === "review").length;
    const total = Number(record.totalCards || record.cards?.length || 14);
    const mode = record.drillMode === "whole-drill" ? "Full drill recording" : "Per-card practice";
    const summary = confidence.length
      ? `<span class="drill-confidence exact">⭐ ${exact} exact</span><span class="drill-confidence similar">🙂 ${similar} similar</span><span class="drill-confidence review">❓ ${review} review</span>`
      : `<span class="drill-confidence exact">⭐ ${Number(record.perfect || 0)} of ${total} perfect</span>`;
    const transcript = record.rawTranscript
      ? `<details class="drill-transcript"><summary>What recognition heard</summary><p>${escapeHtml(record.rawTranscript)}</p></details>`
      : "";
    const audio = audioUrl
      ? audioPlayerMarkup(audioUrl, record.audioFileName || "sounds-drill.webm", !record.audioUrl)
      : record.audioRecordingId
        ? `<p class="drill-audio-missing">Recording is saved on the device where this drill was completed.</p>`
        : "";
    card.innerHTML = `
      <div class="sounds-drill-head">
        <div><strong>${escapeHtml(mode)}</strong><span>${escapeHtml(formatDateTime(record.date))} · ${escapeHtml(record.elapsed || 0)} sec · +${escapeHtml(record.xp || 0)} XP</span></div>
        <span class="drill-substep">2.1</span>
      </div>
      <div class="drill-confidence-row">${summary}</div>
      ${audio}
      ${transcript}`;
    container.appendChild(card);
  });
  wireAudioSpeedControls(container);
}

function renderDictationRows(misses) {
  const body = byId("dictationRows");
  body.innerHTML = "";
  misses.slice().reverse().forEach((miss) => {
    const row = document.createElement("tr");
    row.className = "dictation-row";
    row.innerHTML = `
      <td>${escapeHtml(formatDateTime(miss.date))}</td>
      <td>${escapeHtml(miss.substep || "")}</td>
      <td><span class="type-pill">${escapeHtml(miss.category || "Previous / uncategorized")}</span></td>
      <td><strong>${escapeHtml(miss.item || "")}</strong></td>
    `;
    body.appendChild(row);
  });
  if (!misses.length) {
    body.innerHTML = "<tr><td colspan=\"4\">No dictation misses saved for this student yet.</td></tr>";
  }
}

function encodingObservationLabel(record) {
  if (record.observationCode) return record.observationCode;
  const codes = {
    "automatic encoding; no struggle": "Auto",
    "accurate encoding; minor struggle": "Acc",
    "struggling to identify and segment sounds properly": "Strug",
    "struggles mainly with nonsense words": "NS",
    "struggles with consonant blends": "Blends",
    "struggles differentiating vowel sounds": "Vowel Diff",
    "struggles with high-frequency words": "HFW",
    "struggles with words that have suffixes": "Sfx",
    "encoding miss": "Miss"
  };
  return codes[record.note] || "Observation";
}

const ENCODING_SUMMARY_SECTIONS = {
  section6: {
    number: "6",
    title: "Sounds in Reverse",
    missedLabel: "Missed sounds",
    interpretations: {
      Auto: (student) => `${student} is mostly automatic at recognizing dictated sounds and identifying their written forms with ease.`,
      Acc: (student) => `${student} is mostly accurate, but not yet automatic, at recognizing dictated sounds and identifying their written forms. More practice with the missed sounds should build automaticity.`,
      Strug: (student) => `${student} is currently struggling to recognize dictated sounds and identify their written forms.`
    }
  },
  section7: {
    number: "7",
    title: "Word Building",
    missedLabel: "Missed words",
    interpretations: {
      Auto: (student) => `${student} is mostly automatic at segmenting sounds in dictated words and selecting the correct magnetic letters to build and spell them.`,
      Acc: (student) => `${student} is mostly accurate at segmenting dictated words and building them with magnetic letters, but still makes some errors or needs more time and practice.`,
      Strug: (student) => `${student} is currently struggling to segment sounds in dictated words, which is leading to errors when building and spelling them with magnetic letters.`
    }
  },
  section8: {
    number: "8",
    title: "Written Dictation",
    missedLabel: "Missed words",
    interpretations: {
      Auto: (student) => `${student} is mostly automatic at segmenting dictated words and spelling them correctly in handwriting.`,
      Acc: (student) => `${student} is mostly accurate at segmenting and handwriting dictated words, but still makes some errors or needs more time and practice.`,
      Strug: (student) => `${student} is currently struggling to segment dictated words, which is leading to errors when writing and spelling them.`
    }
  }
};

const ENCODING_TROUBLE_LABELS = {
  NS: "nonsense words",
  Blends: "blends",
  "Vowel Diff": "vowel differentiation",
  HFW: "high-frequency words",
  Sfx: "suffixes"
};

function rankedEncodingObservations(records, allowedCodes, itemValue) {
  const grouped = new Map();
  records.forEach((record) => {
    const code = encodingObservationLabel(record);
    if (!allowedCodes.includes(code)) return;
    const rawValue = itemValue ? itemValue(record) : code;
    const value = String(rawValue || "").trim();
    if (!value) return;
    const key = value.toLocaleLowerCase();
    const time = new Date(record.date || 0).getTime() || 0;
    const entry = grouped.get(key) || { value, count: 0, latest: 0 };
    entry.count += 1;
    if (time >= entry.latest) {
      entry.value = value;
      entry.latest = time;
    }
    grouped.set(key, entry);
  });
  return Array.from(grouped.values()).sort((left, right) => right.count - left.count || right.latest - left.latest || left.value.localeCompare(right.value));
}

function predominantEncodingStatus(records) {
  const ranked = rankedEncodingObservations(records, ["Auto", "Acc", "Strug"]);
  return ranked[0]?.value || "";
}

function renderEncodingObservationSummary(observations, studentName) {
  const container = byId("encodingObservationSummary");
  if (!container) return;
  const student = String(studentName || "This student").trim() || "This student";
  const records = (observations || []).filter((record) => ENCODING_SUMMARY_SECTIONS[record.section]);
  container.innerHTML = Object.entries(ENCODING_SUMMARY_SECTIONS).map(([section, details]) => {
    const sectionRecords = records.filter((record) => record.section === section);
    const statuses = rankedEncodingObservations(sectionRecords, ["Auto", "Acc", "Strug"]);
    const status = predominantEncodingStatus(sectionRecords);
    const statusCounts = Object.fromEntries(["Auto", "Acc", "Strug"].map((code) => [code, statuses.find((item) => item.value === code)?.count || 0]));
    const statusTotal = statusCounts.Auto + statusCounts.Acc + statusCounts.Strug;
    const misses = rankedEncodingObservations(sectionRecords, ["Miss"], (record) => record.item || record.category);
    const troubleCodes = Object.keys(ENCODING_TROUBLE_LABELS).filter((code) => section !== "section6" || code !== "HFW");
    const trouble = rankedEncodingObservations(sectionRecords, troubleCodes);
    const interpretation = status
      ? details.interpretations[status](student)
      : `No Auto, Acc, or Strug observation has been saved for ${student} in Section ${details.number} yet.`;
    const counts = statusTotal
      ? `Based on ${statusTotal} status observation${statusTotal === 1 ? "" : "s"}: Auto ${statusCounts.Auto} · Acc ${statusCounts.Acc} · Strug ${statusCounts.Strug}`
      : "Add a one-tap status during a lesson to begin this summary.";
    const missMarkup = misses.length
      ? `<div class="encoding-summary-misses">${misses.map((item) => `<span class="encoding-summary-miss"><strong>${escapeHtml(item.value)}</strong><small>${item.count} ${item.count === 1 ? "miss" : "misses"}</small></span>`).join("")}</div>`
      : `<p class="encoding-summary-empty">No missed ${details.number === "6" ? "sounds" : "words"} saved yet.</p>`;
    const troubleMarkup = trouble.length
      ? `<p class="encoding-summary-trouble"><strong>Trouble spots observed:</strong> ${trouble.map((item) => `${escapeHtml(ENCODING_TROUBLE_LABELS[item.value] || item.value)} (${item.count})`).join(", ")}.</p>`
      : `<p class="encoding-summary-empty">No category trouble spots saved yet.</p>`;
    return `<article class="encoding-summary-section">
      <div class="encoding-summary-head">
        <div><span class="encoding-summary-number">${details.number}</span><h3>${escapeHtml(details.title)}</h3></div>
        <span class="encoding-summary-status status-${status ? status.toLowerCase() : "empty"}">${escapeHtml(status ? `Mostly ${status}` : "Not enough data")}</span>
      </div>
      <p class="encoding-summary-interpretation">${escapeHtml(interpretation)}</p>
      <p class="encoding-summary-counts">${escapeHtml(counts)}</p>
      <p class="encoding-summary-label">${escapeHtml(details.missedLabel)} · most to least frequent</p>
      ${missMarkup}
      ${troubleMarkup}
    </article>`;
  }).join("");
}

function renderEncodingObservationRows(observations) {
  const body = byId("encodingObservationRows");
  if (!body) return;
  const records = (observations || [])
    .filter((record) => ["section6", "section7", "section8"].includes(record.section))
    .slice()
    .sort((left, right) => new Date(right.date || 0) - new Date(left.date || 0));
  body.innerHTML = records.map((record) => {
    const section = String(record.section || "").replace("section", "Section ");
    const observation = encodingObservationLabel(record);
    const detail = record.item || (observation === "Miss" ? record.category : record.note) || "";
    return `<tr class="encoding-observation-row">
      <td>${escapeHtml(formatDateTime(record.date))}</td>
      <td><span class="type-pill">${escapeHtml(section || "Section")}</span></td>
      <td>${escapeHtml(record.substep || "")}</td>
      <td><strong>${escapeHtml(observation)}</strong></td>
      <td>${escapeHtml(detail)}</td>
      <td>${escapeHtml(record.lessonTitle || "Saved lesson")}</td>
    </tr>`;
  }).join("");
  if (!records.length) {
    body.innerHTML = "<tr><td colspan=\"6\">No Section 6–8 observations saved for this student yet.</td></tr>";
  }
}

function metricClass(record, type) {
  const correct = Number(record.correct || 0);
  const wrong = record.wrongCount ?? Math.max((record.total || 15) - correct, 0);
  const seconds = Number(record.seconds || 0);
  const wcpm = record.wcpm || wcpmForRecord(record);
  if (type === "correct") return correct >= 14 ? "metric-good" : correct >= 12 ? "metric-watch" : "metric-risk";
  if (type === "wrong") return wrong <= 1 ? "metric-good" : wrong <= 3 ? "metric-watch" : "metric-risk";
  if (type === "seconds") return seconds && seconds <= 35 ? "metric-good" : seconds && seconds <= 54 ? "metric-watch" : "metric-risk";
  if (type === "wcpm") return wcpm >= 26 ? "metric-good" : wcpm >= 17 ? "metric-watch" : "metric-risk";
  return "";
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#039;"
  })[char]);
}

function titleCase(text) {
  return String(text || "").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDateTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;
}

function shortDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString([], { month: "numeric", day: "numeric" });
}

byId("printProfile").addEventListener("click", () => {
  const { group, studentId } = selectedContext();
  const url = `StudentReport.html?group=${encodeURIComponent(group.id || "")}&studentId=${encodeURIComponent(studentId || "")}`;
  location.href = url;
});
byId("backTeach").addEventListener("click", () => {
  const { group } = selectedContext();
  location.href = `TeachToday.html?group=${encodeURIComponent(group.id || "")}`;
});
function studentHomeUrl() {
  const { group, studentId } = selectedContext();
  const url = new URL("student.html", location.href);
  url.searchParams.set("preview", "1");
  url.searchParams.set("studentId", studentId || "");
  url.searchParams.set("group", group.id || "");
  url.searchParams.set("substep", group.substep || "2.1");
  return url.href;
}
byId("openStudentHome")?.addEventListener("click", () => {
  location.href = studentHomeUrl();
});
byId("launchSoundsDrill")?.addEventListener("click", () => {
  const { group, student, studentId } = selectedContext();
  const url = new URL("lesson-21-s1.html", location.href);
  url.searchParams.set("studentId", studentId || "");
  url.searchParams.set("group", group.id || "");
  url.searchParams.set("source", "teacher-profile");
  url.searchParams.set("return", `StudentProfile.html?group=${encodeURIComponent(group.id || "")}&studentId=${encodeURIComponent(studentId || "")}`);
  location.href = url.href;
});
byId("connectDriveAudio")?.addEventListener("click", async () => {
  const button = byId("connectDriveAudio");
  button.textContent = "Connecting...";
  try {
    const connected = await ensureProfileDrivePermission();
    button.textContent = connected ? "Drive connected" : "Google Drive";
    render();
    if (connected && profileView === "student-app") {
      await renderStudentAppView();
      const pendingUploads = [...byId("studentAppActivity").querySelectorAll(".student-drive-upload")];
      for (const uploadButton of pendingUploads) await uploadStudentActivityToDrive(uploadButton);
    }
  } catch (err) {
    button.textContent = "Drive failed";
    console.warn("Google Drive permission failed:", err);
  }
});
byId("teacherDataTab")?.addEventListener("click", () => setProfileView("teacher"));
byId("studentAppTab")?.addEventListener("click", () => setProfileView("student-app"));
byId("refreshStudentApp")?.addEventListener("click", () => renderStudentAppView());
byId("compareGroup").addEventListener("click", () => {
  comparisonScope = "group";
  render();
});
byId("compareRoster").addEventListener("click", () => {
  comparisonScope = "all";
  render();
});

render();
