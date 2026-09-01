const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const appSource = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");
const lessonSource = fs.readFileSync(path.join(__dirname, "..", "teach-today.js"), "utf8");

function functionBody(source, name, nextName) {
  const start = source.indexOf(`function ${name}`);
  const end = source.indexOf(`function ${nextName}`, start + 1);
  assert.ok(start >= 0 && end > start, `could not isolate ${name}`);
  return source.slice(start, end);
}

test("iPad charting cannot wait forever for MediaRecorder.onstop", () => {
  const stop = functionBody(appSource, "stopAudioRecording", "showAudioPlayerInCard");
  assert.match(stop, /fallbackTimer = setTimeout\(finish, 2000\)/);
  assert.match(stop, /if \(settled\) return/);
  assert.match(stop, /recorder\.onstop = finish/);
});

test("Sections 6-8 wrapper actions perform only one immediate state save", () => {
  const exclusive = functionBody(lessonSource, "ttSetExclusiveEncodingObservation", "ttNormalizeEncodingItems");
  const toggle = functionBody(lessonSource, "ttToggleEncodingObservation", "ttSaveEncodingObservation");
  assert.equal((exclusive.match(/saveState\(\)/g) || []).length, 1);
  assert.equal((toggle.match(/saveState\(\)/g) || []).length, 1);
  assert.match(exclusive, /ttSaveEncodingObservation/);
  assert.match(toggle, /ttSaveEncodingObservation/);
});
