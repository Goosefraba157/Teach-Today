const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const source = fs.readFileSync(path.join(__dirname, "..", "teach-today.js"), "utf8");

test("Attendance Central never displays a linked chart from a different saved date", () => {
  const start = source.indexOf("function ttAttendanceCentralEvidence");
  const end = source.indexOf("function ttAttendanceCentralStatus", start);
  assert.ok(start >= 0 && end > start);
  const body = source.slice(start, end);

  assert.match(body, /const belongs = \(record\) => onDay\(record\) && \(exactLesson\(record\) \|\| compatibleDayFallback\(record\)\)/);
});
