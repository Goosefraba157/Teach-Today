const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

const context = { window: {} };
vm.createContext(context);
for (const file of ["enhanced-planning-index.js", "dictation-word-index.js"]) {
  vm.runInContext(fs.readFileSync(file, "utf8"), context);
}

const enhanced = context.window.teachTodayEnhancedPlanningIndex;
const dictation = context.window.teachTodayDictationWordIndex;
const teachSource = fs.readFileSync("teach-today.js", "utf8");
const appSource = fs.readFileSync("app.js", "utf8");
const htmlSource = fs.readFileSync("TeachToday.html", "utf8");
const workerSource = fs.readFileSync("service-worker.js", "utf8");

assert.equal(dictation.schemaVersion, "teach-today-dictation-words-v1");
assert.equal(dictation.stats.substeps, 34);
assert.ok(dictation.stats.wordPages >= 87);
assert.ok(dictation.stats.realWords >= 4100);
assert.ok(dictation.stats.nonsenseWords >= 400);
assert.ok(dictation.substeps["1.1"].r.length > 0);
assert.ok(dictation.substeps["1.2"].r.length > 0);
assert.equal(fs.readFileSync("dictation-word-index.js", "utf8").includes("/Users/"), false);

const page35 = enhanced.pages["3.5|AB|142"];
const book35 = new Set(dictation.substeps["3.5"].r);
const matched35 = page35.w.filter((word) => book35.has(word));
assert.deepEqual(Array.from(matched35.slice(0, 8)), [
  "landed", "holding", "testing", "shifting", "planting", "spelling", "filling", "thinking"
]);
assert.equal(matched35.length, 28);
assert.equal(book35.has("drafting"), true);
assert.equal(book35.has("acting"), true);
assert.equal(dictation.substeps["3.5"].n.length, 0);
assert.ok(dictation.substeps["3.2"].n.includes("admest"));
assert.ok(dictation.substeps["2.2"].n.includes("blass"));

const zeroMatchPages = Object.entries(enhanced.pages)
  .filter(([, page]) => !page.n)
  .filter(([, page]) => {
    const words = new Set(dictation.substeps[page.s]?.r || []);
    return !(page.w || []).some((word) => words.has(word));
  })
  .map(([key]) => key);
assert.deepEqual(zeroMatchPages, ["2.4|LATIN_BASE|91", "2.5|LATIN_BASE|114"]);

assert.match(htmlSource, /<script src="dictation-word-index\.js"><\/script>/);
assert.match(workerSource, /"\.\/dictation-word-index\.js"/);
assert.match(appSource, /window\.teachTodayDictationWordIndex\?\.substeps\?\.\[substep\]/);
assert.match(teachSource, /function ttDictationBookCurrentWordPool\(lesson, skill\)/);
assert.match(teachSource, /function ttDictationBookReviewWordPool\(substeps, level = "AB"\)/);
assert.match(teachSource, /function ttDictationBookNonsensePool\(substep\)/);
assert.match(teachSource, /const dictationCurrent = ttDictationBookCurrentWordPool\(lesson, skill\)/);
assert.match(teachSource, /sectionKey === "section7"\s*\? ttDictationBookReviewWordPool/);
assert.match(teachSource, /ttLesson\.dictationWordSource = window\.teachTodayDictationWordIndex \? "official-dictation-book-pages"/);

const savedSetFunction = teachSource.slice(
  teachSource.indexOf("function ttSectionSevenSetsForLesson"),
  teachSource.indexOf("function ttSectionSevenWordKeys")
);
assert.match(savedSetFunction, /lesson\.sectionSevenReviewWords \|\| \[\]/);
assert.match(savedSetFunction, /lesson\.sectionSevenNonsenseWords \|\| \[\]/);
assert.match(savedSetFunction, /lesson\.sectionSevenCurrentWords \|\| \[\]/);

console.log("dictation-word-sourcing tests passed");
