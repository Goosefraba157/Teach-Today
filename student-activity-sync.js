(function () {
  "use strict";

  const OUTBOX_KEY = "teachToday.studentActivityOutbox.v1";
  const AUDIO_DB = "teachToday_audio";
  const AUDIO_STORE = "recordings";
  const SDK = "10.12.5";
  const CONFIG = {
    apiKey: "AIzaSyAQxODRvRAINGXfSxlqTxiyhkeisIPQLEs",
    authDomain: "teach-today-35149.firebaseapp.com",
    projectId: "teach-today-35149",
    storageBucket: "teach-today-35149.firebasestorage.app",
    messagingSenderId: "506415947825",
    appId: "1:506415947825:web:9415befdc50d928eccb510"
  };
  let firebasePromise = null;
  let flushing = null;

  function readOutbox() {
    try { return JSON.parse(localStorage.getItem(OUTBOX_KEY) || "[]"); }
    catch { return []; }
  }
  function writeOutbox(items) { localStorage.setItem(OUTBOX_KEY, JSON.stringify(items.slice(-100))); }

  function openAudioDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(AUDIO_DB, 1);
      request.onupgradeneeded = () => {
        if (!request.result.objectStoreNames.contains(AUDIO_STORE)) request.result.createObjectStore(AUDIO_STORE);
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
  async function saveAudio(id, blob) {
    if (!id || !blob) return;
    const db = await openAudioDB();
    await new Promise((resolve, reject) => {
      const transaction = db.transaction(AUDIO_STORE, "readwrite");
      transaction.objectStore(AUDIO_STORE).put(blob, id);
      transaction.oncomplete = resolve;
      transaction.onerror = () => reject(transaction.error);
    });
  }
  async function loadAudio(id) {
    if (!id) return null;
    const db = await openAudioDB();
    return new Promise((resolve, reject) => {
      const request = db.transaction(AUDIO_STORE, "readonly").objectStore(AUDIO_STORE).get(id);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async function firebase() {
    if (firebasePromise) return firebasePromise;
    firebasePromise = Promise.all([
      import(`https://www.gstatic.com/firebasejs/${SDK}/firebase-app.js`),
      import(`https://www.gstatic.com/firebasejs/${SDK}/firebase-firestore.js`),
      import(`https://www.gstatic.com/firebasejs/${SDK}/firebase-storage.js`),
      import(`https://www.gstatic.com/firebasejs/${SDK}/firebase-auth.js`)
    ]).then(async ([appModule, firestoreModule, storageModule, authModule]) => {
      const app = appModule.getApps().length ? appModule.getApp() : appModule.initializeApp(CONFIG);
      const auth = authModule.getAuth(app);
      if (!auth.currentUser) await authModule.signInAnonymously(auth);
      return { ...firestoreModule, ...storageModule, ...authModule, auth, firestoreDb: firestoreModule.getFirestore(app), firebaseStorage: storageModule.getStorage(app) };
    });
    return firebasePromise;
  }

  function safeFileName(value) { return String(value || "student-audio.webm").replace(/[^a-zA-Z0-9._-]/g, "_"); }

  async function queue(event, blob) {
    if (!event?.id || !event?.studentId || String(event.studentId).startsWith("local:")) return false;
    if (blob && event.audioRecordingId) await saveAudio(event.audioRecordingId, blob);
    const items = readOutbox();
    const index = items.findIndex((item) => item.event?.id === event.id && item.event?.studentId === event.studentId);
    if (index >= 0) {
      const previous = items[index].event || {};
      items[index] = { event: { ...previous, ...event, originalTranscript: previous.originalTranscript || event.originalTranscript || "" } };
    } else {
      items.push({ event: { ...event, queuedAt: new Date().toISOString() } });
    }
    writeOutbox(items);
    return true;
  }

  async function uploadAudio(event, api) {
    if (event.audioUrl || !event.audioRecordingId) return event;
    const blob = await loadAudio(event.audioRecordingId);
    if (!blob) return { ...event, audioUploadStatus: "missing-local-file" };
    const fileName = safeFileName(event.audioFileName);
    const path = `student-activity/${event.studentId}/${event.id}/${fileName}`;
    const storageRef = api.ref(api.firebaseStorage, path);
    await api.uploadBytes(storageRef, blob, {
      contentType: blob.type || "audio/webm",
      customMetadata: { studentId: String(event.studentId), activityId: String(event.id) }
    });
    return {
      ...event,
      audioUrl: await api.getDownloadURL(storageRef),
      audioStoragePath: path,
      audioUploadStatus: "cloud-ready",
      audioUploadedAt: new Date().toISOString()
    };
  }

  async function flush(options = {}) {
    if (flushing) return flushing;
    flushing = (async () => {
      const profile = options.profile || (() => {
        try { return JSON.parse(localStorage.getItem("tt_student_v1") || "{}").profile || null; }
        catch { return null; }
      })();
      if (!profile?.id || profile.id === "demo" || String(profile.id).startsWith("local:")) return { synced: 0, pending: readOutbox().length };
      const api = await firebase();
      const items = readOutbox();
      const remaining = [];
      let synced = 0;
      for (const item of items) {
        const event = item.event || {};
        if (event.studentId !== profile.id) { remaining.push(item); continue; }
        try {
          const activityRef = api.doc(api.firestoreDb, "students", profile.id, "activity", event.id);
          const existing = await api.getDoc(activityRef);
          const originalTranscript = existing.exists()
            ? (existing.data().originalTranscript || event.originalTranscript || "")
            : (event.originalTranscript || "");
          const uploaded = await uploadAudio({ ...event, originalTranscript }, api);
          await api.setDoc(activityRef, { ...uploaded, originalTranscript, syncedAt: api.serverTimestamp() }, { merge: true });
          await api.setDoc(api.doc(api.firestoreDb, "students", profile.id), {
            name: profile.name || event.studentName || "Student",
            groupId: profile.groupId || event.groupId || "",
            groupName: profile.groupName || event.groupName || "",
            xp: Number(profile.xp || 0),
            streak: Number(profile.streak || 0),
            completedLessons: profile.completedLessons || [],
            assignedTasks: profile.assignedTasks || [],
            lastActivityAt: event.date || new Date().toISOString(),
            lastSoundDrill: profile.lastSoundDrill || null
          }, { merge: true });
          synced += 1;
        } catch (error) {
          remaining.push({ event: { ...event, lastSyncError: String(error?.code || error?.message || error), lastTriedAt: new Date().toISOString() } });
        }
      }
      writeOutbox(remaining);
      return { synced, pending: remaining.length };
    })().finally(() => { flushing = null; });
    return flushing;
  }

  async function queueAndFlush(event, blob, options = {}) {
    await queue(event, blob);
    try { return await flush(options); }
    catch { return { synced: 0, pending: readOutbox().length }; }
  }

  window.TTStudentActivity = { queue, flush, queueAndFlush, pendingCount: () => readOutbox().length };
})();
