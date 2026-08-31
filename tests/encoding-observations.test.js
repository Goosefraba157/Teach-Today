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

test("the restarted Student Profile summarizes and lists Section 6–8 observations", () => {
  assert.match(profileHtml, /data-profile-tab="encoding">Sections 6–8<\/button>/);
  ["section6Summary", "section7Summary", "section8Summary", "observationRows"].forEach((id) => {
    assert.match(profileHtml, new RegExp(`id="${id}"`));
  });
  assert.ok(profileHtml.indexOf("section6Summary") < profileHtml.indexOf("observationRows"));
  ["section6", "section7", "section8"].forEach((marker) => assert.match(profileSource, new RegExp(marker)));
  assert.match(profileSource, /function observations\(\)/);
  assert.match(profileSource, /const encodingKeys = new Set/);
  assert.match(profileSource, /function sectionSummary\(section\)/);
  assert.match(profileSource, /function renderEncoding\(\)/);
  assert.match(profileSource, /section !== "section6" \|\| code !== "HFW"/);
  const renderEncoding = functionBody(profileSource, "renderEncoding", "renderTimeline");
  assert.match(renderEncoding, /sectionSummary\("section6"\)/);
  assert.match(renderEncoding, /sectionSummary\("section7"\)/);
  assert.match(renderEncoding, /sectionSummary\("section8"\)/);
  assert.match(renderEncoding, /record\.lessonTitle/);
});
