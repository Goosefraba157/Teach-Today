const assert = require("node:assert/strict");
const { build } = require("../attendance-export.js");
const skills = [{ id: "2.1", title: "Welded sounds", target: 'ang, ing, "ong"' }, { id: "3.5", title: "Closed plus suffixes", target: "ed and ing" }];
const confirmed = (attendance, planIds = ["plan-a"], extra = {}) => ({ status: "confirmed", attendance, planIds, ...extra });
const state = {
  activeSchoolYearId: "2026-2027",
  rosterStudents: [{ studentId: "private-a", name: "Student A", aliases: ["Former A"] }, { studentId: "private-b", name: "Student B" }],
  groups: [
    { id: "g1", name: "Group 1", schoolYearId: "2026-2027", students: ["Student A", "Student B"], studentIds: { "Student A": "private-a", "Student B": "private-b" }, history: [{ id: "plan-a", lessons: [{ substep: "2.1", scheduledDate: "2026-08-01" }] }, { id: "plan-b", lessons: [{ substep: "3.5" }] }] },
    { id: "g2", name: "Group 2", schoolYearId: "2026-2027", students: ["Student A"], studentIds: { "Student A": "private-a" }, history: [{ id: "combined-link", lessons: [{ substep: "2.1" }] }] },
    { id: "old", schoolYearId: "2025-2026", students: ["Old student"] },
    { id: "demo", name: "Demo", schoolYearId: "2026-2027", students: ["Demo student"] }
  ],
  attendanceSessions: {
    g1: {
      "2026-09-02": confirmed({ "Former A": true, "Student B": false }, ["plan-a"], { attendanceByStudentId: { "private-a": true, "private-b": false } }),
      "2026-09-03": { status: "unconfirmed", attendance: { "Student B": true } },
      "2026-09-04": confirmed({ "Student A": true }, ["missing"]),
      "2026-09-05": { status: "no-session", attendance: { "Student B": true } },
      "2026-09-06": confirmed({ "Student A": true }, ["plan-a", "plan-b"]),
      "2026-09-07": confirmed({ "Historical student": true }),
      "2026-09-08": confirmed({ "Student A": false }),
      "2026-06-30": confirmed({ "Student A": true }),
      "2026-02-31": confirmed({ "Student A": true })
    },
    g2: {
      "2026-09-02": confirmed({ "Student A": true }, ["combined-link"]),
      "2026-09-08": confirmed({ "Student A": true }, ["combined-link"])
    },
    old: { "2026-09-02": confirmed({ "Old student": true }) },
    demo: { "2026-09-02": confirmed({ "Demo student": true }) }
  }
};
const before = JSON.stringify(state);
const report = build(state, skills, { order: ["private-b", "private-a"] });
assert.deepEqual(report.rows[0], ["Date", "Student B", "Student A", "Historical student"]);
assert.equal(report.dates, 5);
assert.equal(report.rows[1][0], "09/02/2026");
assert.equal(report.rows[1][1], "Absent");
assert.equal(report.rows[1][2], '2.1 - Welded sounds: ang, ing, "ong"');
assert.equal(report.rows[2][2], "Present — substep not linked");
assert.match(report.rows[3][2], /2\.1.*; 3\.5/);
assert.match(report.rows[5][2], /^Review attendance:/);
assert.equal(report.missingLinks, 1);
assert.equal(report.unconfirmed, 1);
assert.ok(!report.csv.includes("private-a"));
assert.ok(report.csv.includes('""ong""'));
assert.equal(build(state, skills, { start: "2026-09-04", end: "2026-09-04" }).dates, 1);
assert.equal(build(state, skills, { start: "2026-09-03", end: "2026-09-03" }).dates, 0);
assert.throws(() => build(state, skills, { start: "2026-02-31" }), /valid start/);
assert.throws(() => build(state, skills, { start: "2026-09-10", end: "2026-09-01" }), /valid start/);
assert.equal(JSON.stringify(state), before);
assert.equal(build(state, skills, { order: ["private-b", "private-a"] }).csv, report.csv);
const injection = structuredClone(state);
injection.groups[0].students.push("=HYPERLINK(test)");
assert.ok(build(injection, skills).csv.includes("'=HYPERLINK(test)"));
const unidentified = structuredClone(state);
unidentified.attendanceSessions.g1["2026-09-02"].attendanceByStudentId["unknown-id"] = true;
assert.throws(() => build(unidentified, skills), /no display name/);
console.log("Attendance export reliability checks passed.");
