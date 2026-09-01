const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const html = fs.readFileSync(path.join(root, "StudentProfile.html"), "utf8");
const profile = fs.readFileSync(path.join(root, "student-profile.js"), "utf8");
const profileCss = fs.readFileSync(path.join(root, "student-profile.css"), "utf8");
const app = fs.readFileSync(path.join(root, "app.js"), "utf8");

assert.match(html, /20260901-compact-groups-1/);
assert.match(html, /Quick profile menu/);
assert.match(html, /id="profileSchoolYear"/);
assert.match(html, /id="profileRosterPicker"/);
assert.doesNotMatch(html, /id="profileGroup"|id="profileStudent"/);
assert.match(html, /Historical years are read-only/);
assert.match(html, /Download legacy data JSON/);
assert.match(html, /Whole-group view/);
assert.match(html, /id="chartingSheet"/);
assert.doesNotMatch(html, /Student App Progress|Dictation Over Time/);

assert.match(profile, /new BroadcastChannel\("teachTodayState\.v1"\)/);
assert.match(profile, /group\.schoolYearId === yearId/);
assert.match(profile, /data-profile-student/);
assert.match(profile, /data-profile-group/);
assert.match(profile, /function renderGroupOverview/);
assert.match(profile, /function renderChartingSheet/);
assert.match(profile, /profileRosterPicker"\)\.addEventListener\("click"/);
assert.match(profileCss, /\.profile-roster-grid \{[^}]*repeat\(6, minmax\(0, 1fr\)\)/);
assert.match(profileCss, /\.profile-group-button/);
assert.match(profileCss, /\.profile-student-button\.active/);
assert.match(profile, /TeachTodayLegacyStudentProfileArchive/);
assert.match(profile, /Section 8 duplicates are combined|encodingKeys/);
assert.doesNotMatch(profile, /localStorage\.setItem\(/, "The redesigned profile must remain read-only.");

assert.match(app, /new BroadcastChannel\("teachTodayState\.v1"\)/);
assert.match(app, /type: "state-saved"/);

console.log("Student Profile restart checks passed.");
