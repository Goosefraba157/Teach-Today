(function (root) {
  "use strict";

  const DB_NAME = "teach-today-stage-state-v1";
  const DB_VERSION = 1;
  const STORE = "state";
  const MAIN_KEY = "main";
  const RECOVERY_KEY = "pre-indexeddb-localstorage";
  const ACTIVE_KEY = "teachToday.stageIndexedDbActive.v1";
  const LAST_OK_KEY = "teachToday.stageIndexedDbLastVerifiedAt.v1";
  let dbPromise = null;
  let bootRecord = null;
  let writeQueue = Promise.resolve();
  let lastError = null;
  let lastEstimateAt = 0;

  function isStage() {
    return new URLSearchParams(location.search).get("native") === "ipad"
      && Boolean(root.webkit?.messageHandlers?.teachTodayProjectionMode);
  }

  function fingerprint(text) {
    let hash = 2166136261;
    for (let index = 0; index < text.length; index += 1) {
      hash ^= text.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return `fnv1a-${(hash >>> 0).toString(16).padStart(8, "0")}-${text.length}`;
  }

  function summary(state) {
    const groups = Array.isArray(state?.groups) ? state.groups : [];
    return {
      groups: groups.length,
      lessons: groups.reduce((count, group) => count + (group.history || []).reduce((sum, plan) => sum + (plan.lessons || []).length, 0), 0),
      masterRecords: (state?.masterRecords || []).length,
      attendanceSessions: Object.values(state?.attendanceSessions || {}).reduce((count, sessions) => count + Object.keys(sessions || {}).length, 0),
      encodingObservations: groups.reduce((count, group) => count + (group.encodingObservations || []).length, 0),
      chartResults: groups.reduce((count, group) => count + (group.chartResults || []).length, 0),
      dictationMisses: groups.reduce((count, group) => count + (group.dictationMisses || []).length, 0)
    };
  }

  function openDb() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        if (!request.result.objectStoreNames.contains(STORE)) request.result.createObjectStore(STORE);
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error("IndexedDB could not open"));
      request.onblocked = () => reject(new Error("IndexedDB upgrade was blocked"));
    });
    return dbPromise;
  }

  async function get(key) {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE, "readonly");
      const request = transaction.objectStore(STORE).get(key);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error || transaction.error);
      transaction.onabort = () => reject(transaction.error || new Error("IndexedDB read aborted"));
    });
  }

  async function put(key, value) {
    const db = await openDb();
    await new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE, "readwrite");
      transaction.objectStore(STORE).put(value, key);
      transaction.oncomplete = resolve;
      transaction.onerror = () => reject(transaction.error || new Error("IndexedDB write failed"));
      transaction.onabort = () => reject(transaction.error || new Error("IndexedDB write aborted"));
    });
  }

  function recordFor(state, reason) {
    const stateText = JSON.stringify(state);
    return {
      schemaVersion: 1,
      savedAt: new Date().toISOString(),
      reason: reason || "Application save",
      fingerprint: fingerprint(stateText),
      summary: summary(state),
      stateText
    };
  }

  function validateRecord(record) {
    if (!record || record.schemaVersion !== 1 || typeof record.stateText !== "string") throw new Error("Stage database record is invalid");
    if (fingerprint(record.stateText) !== record.fingerprint) throw new Error("Stage database verification failed");
    const state = JSON.parse(record.stateText);
    if (JSON.stringify(summary(state)) !== JSON.stringify(record.summary)) throw new Error("Stage database counts do not match");
    return state;
  }

  async function verifiedPut(key, record) {
    await put(key, record);
    const readback = await get(key);
    validateRecord(readback);
    if (readback.stateText !== record.stateText) throw new Error("Stage database readback differs from the saved state");
    return readback;
  }

  async function prepareBoot() {
    if (!isStage() || localStorage.getItem(ACTIVE_KEY) !== "true") return;
    try {
      bootRecord = await get(MAIN_KEY);
      validateRecord(bootRecord);
      localStorage.setItem(LAST_OK_KEY, new Date().toISOString());
    } catch (error) {
      lastError = error;
      bootRecord = null;
      // Once IndexedDB is authoritative, never continue from the retained,
      // deliberately stale localStorage recovery copy.
      throw error;
    }
  }

  function bootStateText() {
    return bootRecord?.stateText || "";
  }

  function save(state, reason) {
    if (!isStage() || localStorage.getItem(ACTIVE_KEY) !== "true") return Promise.resolve(null);
    const record = recordFor(state, reason);
    writeQueue = writeQueue.catch(() => {}).then(async () => {
      const saved = await verifiedPut(MAIN_KEY, record);
      bootRecord = saved;
      lastError = null;
      localStorage.setItem(LAST_OK_KEY, saved.savedAt);
      const now = Date.now();
      if (navigator.storage?.estimate && now - lastEstimateAt > 60000) {
        lastEstimateAt = now;
        const estimate = await navigator.storage.estimate().catch(() => null);
        if (estimate?.quota && Number.isFinite(estimate.usage)) {
          const percent = Math.round((estimate.usage / estimate.quota) * 100);
          localStorage.setItem("teachToday.stageStoragePercent.v1", String(percent));
          if (typeof root.dispatchEvent === "function") {
            root.dispatchEvent(new CustomEvent("teachTodayStageStorageHealth", { detail: { percent, usage: estimate.usage, quota: estimate.quota } }));
          }
        }
      }
      return saved;
    }).catch((error) => {
      lastError = error;
      throw error;
    });
    writeQueue.catch(() => {});
    return writeQueue;
  }

  async function migrate(state, localStorageText) {
    if (!isStage()) throw new Error("Stage storage upgrade is available only in the installed iPad app");
    const existingText = localStorageText || localStorage.getItem("dyslexiaInstructionEngine.v2") || "";
    if (!existingText) throw new Error("The existing Stage database could not be found");
    const recovery = {
      schemaVersion: 1,
      savedAt: new Date().toISOString(),
      reason: "Protected localStorage copy before IndexedDB activation",
      fingerprint: fingerprint(existingText),
      summary: summary(JSON.parse(existingText)),
      stateText: existingText
    };
    await verifiedPut(RECOVERY_KEY, recovery);
    const main = recordFor(state, "Verified IndexedDB migration");
    await verifiedPut(MAIN_KEY, main);
    const verifiedState = validateRecord(await get(MAIN_KEY));
    if (JSON.stringify(summary(verifiedState)) !== JSON.stringify(summary(state))) throw new Error("Migration record counts changed");
    localStorage.setItem(ACTIVE_KEY, "true");
    localStorage.setItem(LAST_OK_KEY, main.savedAt);
    bootRecord = main;
    lastError = null;
    return { savedAt: main.savedAt, summary: main.summary, fingerprint: main.fingerprint };
  }

  async function health() {
    const active = isStage() && localStorage.getItem(ACTIVE_KEY) === "true";
    let record = null;
    try {
      record = active ? await get(MAIN_KEY) : null;
      if (record) validateRecord(record);
      if (record) lastError = null;
    } catch (error) { lastError = error; }
    const estimate = navigator.storage?.estimate ? await navigator.storage.estimate().catch(() => null) : null;
    return {
      stage: isStage(), active, verified: Boolean(record) && !lastError,
      savedAt: record?.savedAt || "", summary: record?.summary || null,
      usage: estimate?.usage ?? null, quota: estimate?.quota ?? null,
      error: lastError?.message || ""
    };
  }

  async function flush() { return writeQueue; }

  root.TeachTodayStageStorage = { prepareBoot, bootStateText, save, migrate, health, flush, isStage, summary, fingerprint };
})(window);
