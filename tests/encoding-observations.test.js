const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.resolve(__dirname, "..");
const teachHtml = fs.readFileSync(path.join(root, "TeachToday.html"), "utf8");
const teachSource = fs.readFileSync(path.join(root, "teach-today.js"), "utf8");
const profileHtml = fs.readFileSync(path.join(root, "StudentProfile.html"), "utf8");
const profileSource = fs.readFileSync(path.join(root, "student-profile.js"), "utf8");

function functionBody(source, name, nextName) {
  const start = source.indexOf(`function ${name}`);
  const end = nextName ? source.indexOf(`function ${nextName}`, start + 1) : source.length;
  assert.ok(start >= 0, `${name} exists`);
  assert.ok(end > start, `${name} has a bounded body`);
  return source.slice(start, end);
}

test("Sections 6, 7, and 8 use the per-student observation grid", () => {
  assert.match(teachHtml, /id="ttEncodingBar6"/);
  assert.match(teachHtml, /id="ttEncodingBar7"/);
  assert.match(teachSource, /ttFillEncodingStudentGrid\(ttById\("ttEncodingBar6"\), "section6"/);
  assert.match(teachSource, /ttFillEncodingStudentGrid\(ttById\("ttEncodingBar7"\), "section7"/);
  assert.match(teachSource, /ttFillEncodingStudentGrid\(encodingBar, "section8"/);
});

test("Section 6 omits HFW while Sections 7 and 8 retain the shared tag", () => {
  const grid = functionBody(teachSource, "ttFillEncodingStudentGrid", "ttSetExclusiveEncodingObservation");
  assert.match(grid, /\["struggles with high-frequency words", "HFW"\]/);
  assert.match(grid, /if \(section === "section6"\)/);
  assert.match(grid, /shortLabel !== "HFW"/);
});

test("each observation tap is linked and persisted immediately", () => {
  const save = functionBody(teachSource, "ttSaveEncodingObservation", "vowelSoundList");
  const ensureIndex = save.indexOf("ttEnsureCurrentLessonSavedForData()");
  const pushIndex = save.indexOf("group.encodingObservations.push(record)");
  const persistIndex = save.lastIndexOf("saveState()");
  assert.ok(ensureIndex >= 0 && pushIndex > ensureIndex && persistIndex > pushIndex);
  ["studentId", "groupIdAtTime", "homeGroupIdAtTime", "schoolYearId"].forEach((field) => {
    assert.match(save, new RegExp(field));
  });
  assert.match(save, /\.\.\.lessonMeta/);
  const lessonMeta = functionBody(teachSource, "ttCurrentLessonRecordMeta", "ttEnsureCurrentLessonSavedForData");
  assert.match(lessonMeta, /lessonId/);
  assert.match(lessonMeta, /planId/);
  assert.match(save, /savedImmediately: true/);
  assert.match(save, /observationKind/);
  assert.match(save, /observationCode/);
});

test("Student Profile visibly lists Section 6–8 observations", () => {
  assert.match(profileHtml, /<h2>Section 6–8 Instructional Summary<\/h2>/);
  assert.match(profileHtml, /id="encodingObservationSummary"/);
  assert.match(profileHtml, /<h2>Section 6–8 Observations<\/h2>/);
  assert.match(profileHtml, /id="encodingObservationRows"/);
  assert.ok(profileHtml.indexOf("encodingObservationSummary") < profileHtml.indexOf("encodingObservationRows"));
  assert.match(profileSource, /renderEncodingObservationSummary\(encodingObservations, student\)/);
  const renderSummary = functionBody(profileSource, "renderEncodingObservationSummary", "renderEncodingObservationRows");
  ["Mostly", "Auto", "Acc", "Strug", "Trouble spots observed", "most to least frequent"].forEach((marker) => {
    assert.match(renderSummary, new RegExp(marker));
  });
  ["section6", "section7", "section8"].forEach((marker) => assert.match(profileSource, new RegExp(marker)));
  assert.match(profileSource, /right\.count - left\.count/);
  assert.match(renderSummary, /section !== "section6" \|\| code !== "HFW"/);
  assert.match(profileSource, /renderEncodingObservationRows\(encodingObservations\)/);
  const renderRows = functionBody(profileSource, "renderEncodingObservationRows", "metricClass");
  assert.match(renderRows, /\["section6", "section7", "section8"\]/);
  assert.match(renderRows, /record\.lessonTitle/);
});
