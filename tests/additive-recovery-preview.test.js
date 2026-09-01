"use strict";

const assert = require("node:assert/strict");
const { buildPreview } = require("../scripts/build-additive-recovery-preview.js");

function source(filePath, kind, state) {
  const payload = kind === "TeachTodayBackup"
    ? { kind, exportedAt: "2026-09-01T00:00:00.000Z", appState: state }
    : { kind, exportedAt: "2026-08-31T23:00:00.000Z", ...state };
  return { payload, state: payload.appState || payload, filePath };
}

const currentState = {
  rosterStudents: [{ studentId: "current-student", displayName: "Student A" }],
  masterRecords: [{ id: "record-current", studentId: "current-student", correct: 15 }],
  groups: [{
    id: "group-a",
    name: "Group A",
    history: [{ id: "lesson-current", status: "Complete" }],
    chartResults: [],
    encodingObservations: [],
    dictationMisses: [],
    markedReviewWords: [],
    membershipHistory: []
  }],
  attendanceRecords: { "group-a": { "2026-08-31": { "current-student": true } } },
  attendanceSessions: {},
  attendanceActivity: {},
  lessonDrafts: {}
};

const olderState = {
  masterRecords: [
    { id: "record-current", studentId: "current-student", correct: 10 },
    { id: "record-older", studentId: "current-student", correct: 12 }
  ],
  groups: [{
    id: "group-a",
    history: [{ id: "lesson-older", status: "Incomplete" }],
    encodingObservations: [{ id: "observation-older", studentId: "current-student", item: "sound" }]
  }],
  attendanceRecords: { "group-a": { "2026-08-31": { "current-student": false }, "2026-08-30": { "current-student": true } } }
};

const legacyState = {
  rosterStudents: [{ studentId: "legacy-student", name: "Student A" }],
  masterRecords: [{ id: "record-legacy", studentId: "legacy-student", correct: 13 }],
  groups: [
    { id: "group-a", encodingObservations: [{ id: "observation-legacy", studentId: "legacy-student", item: "word" }] },
    { id: "missing-group", name: "Old Group", history: [{ id: "orphan-lesson", studentId: "legacy-student" }] }
  ]
};

const preview = buildPreview(
  source("current.json", "TeachTodayBackup", currentState),
  [
    source("older.json", "TeachTodayBackup", olderState),
    source("legacy.json", "TeachTodayLegacyStudentProfileArchive", legacyState)
  ]
);

assert.deepEqual(preview.additions.topLevel.masterRecords.map((record) => record.id), ["record-older", "record-legacy"]);
assert.equal(preview.additions.topLevel.masterRecords[1].studentId, "current-student");
assert.deepEqual(preview.additions.groups["group-a"].arrays.history.map((lesson) => lesson.id), ["lesson-older"]);
assert.deepEqual(
  preview.additions.groups["group-a"].arrays.encodingObservations.map((record) => record.id),
  ["observation-older", "observation-legacy"]
);
assert.equal(preview.additions.groups["group-a"].arrays.encodingObservations[1].studentId, "current-student");
assert.equal(preview.additions.maps.attendanceRecords["group-a"]["2026-08-30"]["current-student"], true);
assert.ok(preview.sources[0].conflictsPreserved.includes("masterRecords.id:record-current"));
assert.ok(preview.sources[0].conflictsPreserved.includes("attendanceRecords.group-a.2026-08-31.current-student"));
assert.equal(preview.sources[1].studentIdMappings.length, 1);
assert.equal(preview.sources[1].ambiguousStudents.length, 0);
assert.equal(preview.sources[1].unmatchedStudents.length, 0);
assert.equal(preview.additions.unresolvedGroups[0].groupId, "missing-group");
assert.equal(preview.additions.unresolvedGroups[0].arrays.history[0].studentId, "current-student");

console.log("additive recovery preview tests passed");
