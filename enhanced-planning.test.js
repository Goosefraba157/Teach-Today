const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const root = __dirname;

function loadPlanningRuntime() {
  const context = { window: {} };
  context.window.window = context.window;
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(root, "enhanced-planning-index.js"), "utf8"), context);
  vm.runInContext(fs.readFileSync(path.join(root, "enhanced-planning.js"), "utf8"), context);
  return context.window;
}

test("enhanced index covers 1.3 through 7.5 and preserves later fallbacks", () => {
  const window = loadPlanningRuntime();
  const api = window.TeachTodayEnhancedPlanning;
  assert.equal(api.isCovered("1.3"), true);
  assert.equal(api.isCovered("7.5"), true);
  assert.equal(api.isCovered("1.2"), false);
  assert.equal(api.isCovered("8.1"), false);
  assert.equal(window.teachTodayEnhancedPlanningIndex.stats.substeps, 32);
  assert.equal(window.teachTodayEnhancedPlanningIndex.stats.chartingPages, 347);
});

test("exact charting page drives sentence and dictation recommendations", () => {
  const api = loadPlanningRuntime().TeachTodayEnhancedPlanning;
  const page = api.findPage("3.5", "AB", 142);
  assert.equal(page.p, 142);
  assert.equal(page.w.length, 30);
  assert.ok(page.w.includes("landed"));
  assert.equal(api.findSentenceRecommendation("3.5", "AB", 142).p, 151);
  assert.ok(api.findDictationRecommendations("3.5", "AB", 142).length >= 2);
  assert.ok(api.wordMetadataAtOrBefore("3.5", "landed").s.includes("ed"));
});

test("charting concepts preserve page subtitles for review-word filtering", () => {
  const api = loadPlanningRuntime().TeachTodayEnhancedPlanning;
  const groups = api.pageConceptGroups("2.1", "AB");
  assert.deepEqual(
    JSON.parse(JSON.stringify(groups.map((group) => ({ concepts: [...group.concepts], pages: [...group.pages] })))),
    [
      { concepts: ["ng", "nk"], pages: [2, 3, 4] },
      { concepts: ["suffix"], pages: [5, 6] }
    ]
  );
  assert.ok(groups[0].words.includes("bang"));
  assert.ok(groups[1].words.length > 0);
});

test("generated curriculum asset contains no local source path or student schema", () => {
  const source = fs.readFileSync(path.join(root, "enhanced-planning-index.js"), "utf8");
  assert.doesNotMatch(source, /\/Users\//);
  assert.doesNotMatch(source, /studentId|encodingObservations|dictationMisses/);
});

test("planner keeps Section 6 separate and starts from the preview snapshot", () => {
  const source = fs.readFileSync(path.join(root, "teach-today.js"), "utf8");
  const applyStart = source.indexOf("function ttApplyPlannerSelectionsToLesson");
  const applyEnd = source.indexOf("function ttKnownWeldedValues", applyStart);
  const applyBody = source.slice(applyStart, applyEnd);
  const buildStart = source.indexOf("function ttBuildPlannerLesson");
  const buildEnd = source.indexOf("function ttOpenPlannerPreviewSection", buildStart);
  const buildBody = source.slice(buildStart, buildEnd);
  assert.match(applyBody, /section6Vowels/);
  assert.doesNotMatch(applyBody.slice(applyBody.indexOf("const reverseSelections")), /dictationSounds|dictationElements/);
  assert.match(buildBody, /ttPlannerDraftLessonWithSelections/);
  assert.doesNotMatch(buildBody, /ttLesson = createLesson/);
});

test("new lesson metadata remains additive under the existing JSON persistence model", () => {
  const state = {
    groups: [{
      id: "group-1",
      encodingObservations: [{ id: "old-encoding", studentId: "student-1", item: "landed" }],
      dictationMisses: [{ id: "old-dictation", studentId: "student-1", item: "asking" }],
      history: [{ lessons: [{
        id: "lesson-1",
        planningIndexVersion: "teach-today-enhanced-planning-v1",
        planningSelections: { section7: { current: ["landed"] } }
      }] }]
    }]
  };
  const roundTrip = JSON.parse(JSON.stringify(state));
  assert.deepEqual(roundTrip, state);
  assert.equal(roundTrip.groups[0].encodingObservations[0].id, "old-encoding");
  assert.equal(roundTrip.groups[0].dictationMisses[0].id, "old-dictation");
});
