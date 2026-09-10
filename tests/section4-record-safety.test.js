const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const appSource = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");
const lessonSource = fs.readFileSync(path.join(__dirname, "..", "teach-today.js"), "utf8");
const profileSource = fs.readFileSync(path.join(__dirname, "..", "student-profile.js"), "utf8");

test("Section 4 repeated saves update one active chart record", () => {
  assert.match(appSource, /dataset\.activeChartRecordId/);
  assert.match(appSource, /if \(existingIndex >= 0\) appState\.masterRecords\[existingIndex\] = record/);
  assert.match(appSource, /else appState\.masterRecords\.push\(record\)/);
  assert.match(appSource, /attemptNumber:/);
  assert.match(appSource, /rechartOfRecordId:/);
});

test("Section 4 guards deliberate recharts and incomplete group charting", () => {
  assert.match(lessonSource, /Chart this student again\?/);
  assert.match(lessonSource, /Start another chart/);
  assert.match(lessonSource, /Don’t forget Section 4 charting/);
  assert.match(lessonSource, /ttSection4UnchartedStudents/);
  assert.match(lessonSource, /attendance\[student\] !== false/);
});

test("Section 4 notes are labeled and visible in Student Profile", () => {
  assert.match(profileSource, /record\.notes \|\| "—"/);
  assert.match(lessonSource, /section4-note-status/);
});
