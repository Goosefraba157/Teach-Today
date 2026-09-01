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
  attendanceRecords: {},
  attendanceSessions: {},
  attendanceActivity: {},
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

const attendanceBase = structuredClone(sharedBase);
attendanceBase.attendanceSessions = { "group-a": { "2026-08-26": { date: "2026-08-26", status: "unconfirmed", attendance: {} } } };
const attendanceLocal = structuredClone(attendanceBase);
attendanceLocal.attendanceSessions["group-a"]["2026-08-26"].attendance["student-a"] = true;
const attendanceRemote = structuredClone(attendanceBase);
attendanceRemote.attendanceSessions["group-a"]["2026-08-26"].attendance["student-b"] = false;
const attendanceMerged = sync.mergePayloads(payload(attendanceBase), payload(attendanceLocal), payload(attendanceRemote));
assert.deepEqual(attendanceMerged.appState.attendanceSessions["group-a"]["2026-08-26"].attendance, {
  "student-a": true,
  "student-b": false
});
assert.deepEqual(attendanceMerged.conflicts, []);

const activityBase = structuredClone(sharedBase);
activityBase.attendanceActivity = { "group-a": { "2026-08-26": { date: "2026-08-26", sections: {} } } };
const activityLocal = structuredClone(activityBase);
activityLocal.attendanceActivity["group-a"]["2026-08-26"].sections.section1 = { lessonPart: "1", sources: ["click"] };
const activityRemote = structuredClone(activityBase);
activityRemote.attendanceActivity["group-a"]["2026-08-26"].sections.section6 = { lessonPart: "2", sources: ["change"] };
const activityMerged = sync.mergePayloads(payload(activityBase), payload(activityLocal), payload(activityRemote));
assert.deepEqual(Object.keys(activityMerged.appState.attendanceActivity["group-a"]["2026-08-26"].sections).sort(), ["section1", "section6"]);
assert.deepEqual(activityMerged.conflicts, []);

const membershipBase = structuredClone(sharedBase);
membershipBase.groups[0].membershipHistory = [{ id: "membership-a", studentId: "student-a", startedOn: "2026-07-01" }];
const membershipLocal = structuredClone(membershipBase);
membershipLocal.groups[0].membershipHistory[0].endedOn = "2026-08-28";
membershipLocal.groups[0].membershipHistory.push({ id: "membership-b", studentId: "student-b", startedOn: "2026-08-28" });
const membershipRemote = structuredClone(membershipBase);
membershipRemote.groups[0].note = "Cloud note";
const membershipMerged = sync.mergePayloads(payload(membershipBase), payload(membershipLocal), payload(membershipRemote));
assert.equal(membershipMerged.appState.groups[0].membershipHistory.length, 2);
assert.equal(membershipMerged.appState.groups[0].membershipHistory.find((entry) => entry.id === "membership-a").endedOn, "2026-08-28");
assert.equal(membershipMerged.appState.groups[0].note, "Cloud note");
assert.deepEqual(membershipMerged.conflicts, []);

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

const continuityBase = structuredClone(sharedBase);
continuityBase.groups[0].activeLessonPlanId = "plan-a";
continuityBase.groups[0].history[0].status = "In progress";
continuityBase.groups[0].history[0].sessions = { "1": { status: "In progress", date: "2026-08-24" } };
const stageLocal = structuredClone(continuityBase);
stageLocal.groups[0].encodingObservations = [{ id: "stage-observation", section: "7", item: "practice" }];
const browserRemote = structuredClone(continuityBase);
browserRemote.groups[0].activeLessonPlanId = "";
browserRemote.groups[0].history[0].status = "Incomplete";
browserRemote.groups[0].history[0].sessions["1"].status = "Incomplete";
const continuityMerged = sync.mergePayloads(payload(continuityBase), payload(stageLocal), payload(browserRemote));
assert.equal(continuityMerged.appState.groups[0].activeLessonPlanId, "");
assert.equal(continuityMerged.appState.groups[0].history[0].status, "Incomplete");
assert.equal(continuityMerged.appState.groups[0].history[0].sessions["1"].status, "Incomplete");
assert.equal(continuityMerged.appState.groups[0].encodingObservations[0].id, "stage-observation");
assert.deepEqual(continuityMerged.conflicts, []);

console.log("sync-safety tests passed");
