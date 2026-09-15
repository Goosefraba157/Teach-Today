"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const source = fs.readFileSync(path.join(__dirname, "..", "teach-today.js"), "utf8");
const start = source.indexOf("function ttMissingAttendanceRecoveryPreview");
const end = source.indexOf("async function ttRecoverMissingAttendanceFromFile", start);
assert.ok(start >= 0 && end > start, "attendance-only preview is available");

const context = {
  appState: {
    groups: [{ id: "group-missing", name: "Missing" }, { id: "group-existing", name: "Existing" }],
    attendanceSessions: { "group-existing": { "2026-09-11": { status: "confirmed" } } }
  }
};
vm.createContext(context);
vm.runInContext(source.slice(start, end), context);

const backup = {
  appState: {
    groups: [{ id: "group-missing" }, { id: "group-existing" }],
    attendanceSessions: {
      "group-missing": { "2026-09-11": { status: "confirmed", attendance: { "Student A": true } } },
      "group-existing": { "2026-09-11": { status: "confirmed", attendance: { "Student B": false } } }
    }
  }
};

const preview = context.ttMissingAttendanceRecoveryPreview(backup, "2026-09-11");
assert.equal(preview.length, 1);
assert.equal(preview[0].group.id, "group-missing");
assert.equal(JSON.stringify(preview[0].session.attendance), JSON.stringify({ "Student A": true }));
assert.equal(context.ttMissingAttendanceRecoveryPreview(backup, "not-a-date"), null);

assert.match(source, /await ttBackupCurrentStageState\(\{ force: true, manual: true, nativeOnly: true, requireNative: true \}\)/);
assert.match(source, /It will not replace existing attendance, charting, lessons, dictation, notes, or roster data/);
assert.match(source, /await saveState\(\);/);
assert.match(source, /await window\.TeachTodayStageStorage\?\.flush\?\.\(\);/);

console.log("attendance-only recovery tests passed");
