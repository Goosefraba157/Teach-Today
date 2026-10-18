const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const source = fs.readFileSync(path.join(__dirname, "..", "student-profile.js"), "utf8");

function profile(charts = []) {
  const elements = new Map();
  const context = vm.createContext({
    byId: (id) => {
      if (!elements.has(id)) elements.set(id, { innerHTML: "" });
      return elements.get(id);
    },
    chartingRecords: () => charts,
    average: () => null,
    formatDate: (date) => date,
    recordDate: (record) => record.date || "",
    chartingLessonNumber: () => "Lesson 1",
    chartingMetricClass: () => "",
    chartingStatus: () => ({ className: "", label: "Saved" })
  });
  vm.runInContext(source.slice(source.indexOf("function escapeHtml("), source.indexOf("function normalizeName(")), context);
  vm.runInContext(source.slice(source.indexOf("function chartingWordDetails("), source.indexOf("function sectionSummary(")), context);
  return { context, elements };
}

test("Charting pairs each miss with its own response from the charted half", () => {
  const record = { chartHalf: "top", wrongWords: ["ship", "ship", "jumped"], wordRecords: [
    { word: "ship", section: "bottom", correct: false, said: "wrong half" },
    { word: "ship", section: "top", correct: true, said: "correct attempt" },
    { word: "ship", section: "top", correct: false, said: "sip" },
    { word: "ship", section: "top", correct: false, said: "sh-ip" },
    { word: "jumped", section: "top", correct: false, said: "jump" }
  ] };
  const before = JSON.stringify(record);
  const { context } = profile();
  assert.deepEqual(JSON.parse(JSON.stringify(context.chartingMissDetails(record))), [
    { word: "ship", said: "sip" }, { word: "ship", said: "sh-ip" }, { word: "jumped", said: "jump" }
  ]);
  assert.equal(JSON.stringify(record), before);
});

test("Legacy misses stay visible without fabricated responses or uncharted misses", () => {
  const { context } = profile();
  const legacy = { wrongWords: ["landed"] };
  assert.match(context.chartingResponseHtml(context.chartingMissDetails(legacy)[0]), /landed.*Response not recorded/);
  const record = { chartHalf: "bottom", wordRecords: [
    { word: "cat", section: "top", correct: false, said: "cut" },
    { word: "lat", section: "bottom", correct: false, said: "lit" },
    { word: "lut", section: "bottom" }
  ] };
  assert.equal(context.chartingMissDetails(record).length, 1);
  assert.equal(context.chartingMissDetails(record)[0].said, "lit");
  record.wrongWords = [];
  assert.equal(context.chartingMissDetails(record).length, 0, "An explicit empty missed list remains authoritative");
});

test("Sheet and complete history show verbatim escaped responses without changing scores or records", () => {
  const charts = Array.from({ length: 13 }, (_, index) => ({
    id: `synthetic-chart-${index}`, date: "2026-10-18", chartHalf: "top", correct: 14, total: 15,
    wrongWords: ["ship"], wordRecords: [
      { word: "ship", section: "top", correct: false, said: `s-ip <${index}> & 'sound'` },
      { word: "cat", section: "top", correct: true, said: "  c-at  " },
      { word: "dog", section: "bottom", correct: false, said: "unscored half" }
    ]
  }));
  const before = JSON.stringify(charts);
  const { context, elements } = profile(charts);
  context.renderCharting();
  const sheet = elements.get("chartingSheet").innerHTML;
  const history = elements.get("chartingRows").innerHTML;
  assert.match(sheet, /Said: s-ip &lt;0&gt; &amp; &#039;sound&#039;/);
  assert.doesNotMatch(sheet, /&lt;12&gt;|unscored half|<0>/);
  assert.match(history, /Said: s-ip &lt;12&gt;/, "History includes attempts beyond the 12-column sheet");
  assert.match(history, /Said:   c-at  /, "Responses on correct items remain available verbatim");
  assert.doesNotMatch(history, /unscored half|<12>/);
  assert.equal((history.match(/14\/15/g) || []).length, 13);
  assert.equal(JSON.stringify(charts), before);
});

test("Empty charting history keeps its full-width empty state", () => {
  const { context, elements } = profile();
  context.renderCharting();
  assert.match(elements.get("chartingRows").innerHTML, /colspan="11"/);
  assert.match(elements.get("chartingSheet").innerHTML, /No Section 4 charting records/);
});
