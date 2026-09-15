const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const source = fs.readFileSync(path.join(__dirname, "..", "teach-today.js"), "utf8");

test("Attendance Central displays all evidence saved on the selected calendar day", () => {
  const start = source.indexOf("function ttAttendanceCentralEvidence");
  const end = source.indexOf("function ttAttendanceCentralStatus", start);
  assert.ok(start >= 0 && end > start);
  const body = source.slice(start, end);

  assert.match(body, /masterRecords \|\| \[\]\)\.filter\(\(record\) => \(record\.groupId === group\.id \|\| record\.group === group\.name\) && onDay\(record\)\)/);
  assert.match(body, /dictationMisses \|\| \[\]\)\.filter\(onDay\)/);
  assert.doesNotMatch(body, /exactLesson|compatibleDayFallback/);
});

test("calendar held remains the explicit attendance-confirmation count", () => {
  const start = source.indexOf("function ttAttendanceCentralDayButton");
  const end = source.indexOf("function ttAttendanceCentralMonthHtml", start);
  assert.ok(start >= 0 && end > start);
  const body = source.slice(start, end);

  assert.match(body, /statuses\.filter\(\(status\) => status === "confirmed"\)\.length/);
  assert.match(body, /\$\{held\} held/);
  assert.doesNotMatch(body, /attendance confirmed/);
});
