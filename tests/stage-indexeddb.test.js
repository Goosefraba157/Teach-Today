const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const source = fs.readFileSync(path.join(__dirname, "..", "stage-storage.js"), "utf8");

function makeIndexedDb() {
  const values = new Map();
  const db = {
    objectStoreNames: { contains: () => true },
    createObjectStore() {},
    transaction() {
      const transaction = {
        objectStore() {
          return {
            put(value, key) {
              queueMicrotask(() => {
                values.set(key, structuredClone(value));
                transaction.oncomplete?.();
              });
            },
            get(key) {
              const request = {};
              queueMicrotask(() => {
                request.result = values.has(key) ? structuredClone(values.get(key)) : undefined;
                request.onsuccess?.();
              });
              return request;
            }
          };
        }
      };
      return transaction;
    }
  };
  return {
    values,
    api: {
      open() {
        const request = {};
        queueMicrotask(() => {
          request.result = db;
          request.onsuccess?.();
        });
        return request;
      }
    }
  };
}

function context() {
  const idb = makeIndexedDb();
  const local = new Map();
  const window = { webkit: { messageHandlers: { teachTodayProjectionMode: {} } } };
  const sandbox = vm.createContext({
    window,
    indexedDB: idb.api,
    localStorage: {
      getItem: (key) => local.get(key) ?? null,
      setItem: (key, value) => local.set(key, String(value))
    },
    location: { search: "?native=ipad" },
    navigator: { storage: { estimate: async () => ({ usage: 4_000_000, quota: 1_000_000_000 }) } },
    URLSearchParams,
    JSON,
    Date,
    Map,
    Object,
    Array,
    Number,
    Math,
    Promise,
    structuredClone,
    queueMicrotask
  });
  vm.runInContext(source, sandbox);
  return { api: window.TeachTodayStageStorage, local, values: idb.values };
}

function fixture(marker = "original") {
  return {
    groups: [{ id: "g1", history: [{ id: "p1", lessons: [{ id: "l1", marker, scriptText: "exact script" }] }], encodingObservations: [{ id: "o1" }], chartResults: [], dictationMisses: [] }],
    masterRecords: [{ id: "r1" }],
    attendanceSessions: { g1: { "2026-09-10": { status: "confirmed" } } }
  };
}

test("migration preserves a verified recovery copy before activating IndexedDB", async () => {
  const { api, local, values } = context();
  const state = fixture();
  const original = JSON.stringify(state);
  local.set("dyslexiaInstructionEngine.v2", original);
  const result = await api.migrate(state, original);
  assert.equal(local.get("teachToday.stageIndexedDbActive.v1"), "true");
  assert.equal(values.get("pre-indexeddb-localstorage").stateText, original);
  assert.equal(values.get("main").stateText, original);
  assert.deepEqual(result.summary, api.summary(state));
  const health = await api.health();
  assert.equal(health.verified, true);
  assert.equal(health.summary.lessons, 1);
  assert.equal(health.summary.masterRecords, 1);
  assert.equal(health.summary.attendanceSessions, 1);
});

test("serialized writes cannot let an older snapshot overtake a newer snapshot", async () => {
  const { api, local, values } = context();
  const initial = fixture();
  const original = JSON.stringify(initial);
  local.set("dyslexiaInstructionEngine.v2", original);
  await api.migrate(initial, original);
  const first = fixture("first");
  const latest = fixture("latest");
  const writes = [api.save(first), api.save(latest)];
  await Promise.all(writes);
  await api.flush();
  assert.deepEqual(JSON.parse(values.get("main").stateText), latest);
  assert.equal(values.get("pre-indexeddb-localstorage").stateText, original);
});

test("an activated Stage boots from verified IndexedDB instead of stale localStorage", async () => {
  const { api, local } = context();
  const state = fixture("indexeddb");
  const original = JSON.stringify(fixture("local-storage-recovery"));
  local.set("dyslexiaInstructionEngine.v2", original);
  await api.migrate(state, original);
  await api.prepareBoot();
  assert.deepEqual(JSON.parse(api.bootStateText()), state);
  assert.notEqual(api.bootStateText(), original);
});

test("an activated Stage fails closed instead of loading its stale recovery copy", async () => {
  const { api, local, values } = context();
  const original = JSON.stringify(fixture("local-storage-recovery"));
  local.set("dyslexiaInstructionEngine.v2", original);
  local.set("teachToday.stageIndexedDbActive.v1", "true");
  values.set("main", { schemaVersion: 1, stateText: "{}", fingerprint: "wrong", summary: {} });
  await assert.rejects(api.prepareBoot(), /verification failed/);
  assert.equal(api.bootStateText(), "");
});
