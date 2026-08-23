const assert = require("node:assert/strict");
const sync = require("../sync-safety.js");

function payload(appState, overrides = {}) {
  return { appState, section2CardOverrides: overrides };
}

const baseState = {
  selectedGroupId: "group-a",
  activeSchoolYearId: "year-a",
  openLessonTabs: { "group-a": "plan-a" },
  lessonScrollPositions: { "group-a": 125 },
  groups: [{
    id: "group-a",
    name: "Practice Group",
    activeStudent: "student-a",
    students: ["student-a", "student-b"],
    history: [{ id: "plan-a", lessonNumber: 1, day1Date: "2026-08-24" }]
  }],
  schoolYears: [{ id: "year-a", status: "active" }],
  rosterStudents: [
    { studentId: "student-a", displayName: "Student A" },
    { studentId: "student-b", displayName: "Student B" }
  ],
  masterRecords: [],
  lastSavedAt: "2026-08-23T12:00:00.000Z"
};

const sharedBase = sync.sharedState(baseState);
const navigationOnly = structuredClone(baseState);
navigationOnly.lessonScrollPositions["group-a"] = 900;
navigationOnly.groups[0].activeStudent = "student-b";
navigationOnly.lastSavedAt = "2026-08-23T12:05:00.000Z";
assert.equal(sync.signature(sharedBase), sync.signature(sync.sharedState(navigationOnly)));

const instructionalChange = structuredClone(baseState);
instructionalChange.groups[0].history[0].day1Date = "2026-08-25";
assert.notEqual(sync.signature(sharedBase), sync.signature(sync.sharedState(instructionalChange)));

const local = structuredClone(sharedBase);
local.masterRecords.push({ id: "record-local", studentId: "student-a", correct: 14 });
local.groups[0].history[0].completedSections = [1, 2];
const remote = structuredClone(sharedBase);
remote.masterRecords.push({ id: "record-remote", studentId: "student-b", correct: 13 });
remote.groups[0].history[0].day2Date = "2026-08-25";
const merged = sync.mergePayloads(payload(sharedBase), payload(local), payload(remote));
assert.deepEqual(merged.appState.masterRecords.map((record) => record.id).sort(), ["record-local", "record-remote"]);
assert.deepEqual(merged.appState.groups[0].history[0].completedSections, [1, 2]);
assert.equal(merged.appState.groups[0].history[0].day2Date, "2026-08-25");
assert.deepEqual(merged.conflicts, []);

const localConflict = structuredClone(sharedBase);
const remoteConflict = structuredClone(sharedBase);
localConflict.groups[0].name = "Local name";
remoteConflict.groups[0].name = "Cloud name";
const conflict = sync.mergePayloads(payload(sharedBase), payload(localConflict), payload(remoteConflict));
assert.equal(conflict.appState.groups[0].name, "Cloud name");
assert.ok(conflict.conflicts.some((path) => path.endsWith(".name")));

const installed = sync.applySharedState(navigationOnly, remote);
assert.equal(installed.selectedGroupId, "group-a");
assert.equal(installed.lessonScrollPositions["group-a"], 900);
assert.equal(installed.groups[0].activeStudent, "student-b");
assert.equal(installed.groups[0].history[0].day2Date, "2026-08-25");

console.log("sync-safety tests passed");
