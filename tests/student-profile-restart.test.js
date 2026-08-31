const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const html = fs.readFileSync(path.join(root, "StudentProfile.html"), "utf8");
const profile = fs.readFileSync(path.join(root, "student-profile.js"), "utf8");
const app = fs.readFileSync(path.join(root, "app.js"), "utf8");

assert.match(html, /20260831-profile-restart-1/);
assert.match(html, /Only students enrolled in the selected school year appear/);
assert.match(html, /Historical years are read-only/);
assert.match(html, /Download legacy data JSON/);
assert.doesNotMatch(html, /Student Comparison|Student App Progress|Dictation Over Time/);

assert.match(profile, /new BroadcastChannel\("teachTodayState\.v1"\)/);
assert.match(profile, /group\.schoolYearId === yearId/);
assert.match(profile, /TeachTodayLegacyStudentProfileArchive/);
assert.match(profile, /Section 8 duplicates are combined|encodingKeys/);
assert.doesNotMatch(profile, /localStorage\.setItem\(/, "The redesigned profile must remain read-only.");

assert.match(app, /new BroadcastChannel\("teachTodayState\.v1"\)/);
assert.match(app, /type: "state-saved"/);

console.log("Student Profile restart checks passed.");
