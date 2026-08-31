const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.resolve(__dirname, "..");
const html = fs.readFileSync(path.join(root, "TeachToday.html"), "utf8");
const source = fs.readFileSync(path.join(root, "teach-today.js"), "utf8");
const appSource = fs.readFileSync(path.join(root, "app.js"), "utf8");

function functionBody(name, nextName) {
  const start = source.indexOf(`function ${name}`);
  const end = nextName ? source.indexOf(`function ${nextName}`, start + 1) : source.length;
  assert.ok(start >= 0, `${name} exists`);
  assert.ok(end > start, `${name} has a bounded body`);
  return source.slice(start, end);
}

test("Home exposes one primary planning surface", () => {
  assert.match(html, /id="ttPlannerCustomizePanel" class="planner-customize-panel">/);
  assert.doesNotMatch(html, /id="ttPlannerCustomizeToggle"/);
  assert.doesNotMatch(html, /id="ttHomeOpenCurrent"/);
  assert.doesNotMatch(html, /id="ttStartLesson"/);
  assert.match(source, /id="ttPlannerOpen" class="preview-open-btn"[^>]*>Start Planned Lesson</);
  assert.doesNotMatch(source, /Continue where I left off/);
});

test("an unfinished lesson hides and blocks the new-lesson planner", () => {
  const renderPlanner = functionBody("ttRenderPlannerPanel", "ttRenderPlannerCustomizeState");
  assert.match(renderPlanner, /const openPlan = group \? ttActiveOpenPlan\(group\) : null/);
  assert.match(renderPlanner, /panel\.hidden = !group \|\| Boolean\(openPlan\)/);
  assert.match(renderPlanner, /if \(!group \|\| openPlan\) return/);

  const buildLesson = functionBody("ttBuildPlannerLesson", "ttOpenPlannerPreviewSection");
  const guard = buildLesson.indexOf("const openPlan = ttActiveOpenPlan(group)");
  const groupMutation = buildLesson.indexOf("appState.selectedGroupId = group.id");
  assert.ok(guard >= 0 && groupMutation > guard, "the open-lesson guard runs before group or lesson mutation");
  assert.match(buildLesson.slice(guard, groupMutation), /return;/);
});

test("the one preview action starts the exact planned snapshot", () => {
  const bindPreview = functionBody("ttBindPlannerPreviewActions", "ttPlannerPreviewBlock");
  assert.match(bindPreview, /ttBuildPlannerLesson\(\{ startTeaching: true \}\)/);

  const plannedSnapshot = functionBody("ttPlannerDraftLessonWithSelections", "ttRefreshPreview");
  assert.match(plannedSnapshot, /const lesson = ttPlannerPreviewLesson\(group\)/);
  assert.match(plannedSnapshot, /ttApplyPlannerSelectionsToLesson\(group, skill\)/);
  assert.match(plannedSnapshot, /const planned = ttClone\(ttLesson\)/);
});

test("new lessons never overwrite a completed or incomplete same-day plan", () => {
  const saveGenerated = functionBody("ttSaveGeneratedLesson", "ttSaveCurrentLesson");
  assert.match(saveGenerated, /!\["Complete", "Incomplete", "Test"\]\.includes\(dailyPlan\.status\)/);
  assert.match(source, /openPlan\.closedReason = "Teacher chose End & Plan New"/);
  assert.match(source, /ttSyncCombinedLessonLinks\(openPlan, group\)/);
});

test("Section 2 review filters are additive, independent, and view-only", () => {
  assert.match(source, /section2B: \"section2ReviewB2\"/);
  assert.match(source, /"section2B", skill/);
  const substepButtons = functionBody("ttSubstepBubblesHtml", "ttReviewConceptLabel");
  assert.match(substepButtons, /\["section2", "section2B"\]\.includes\(sectionKey\) \? 0/);
  assert.match(substepButtons, /scopeMap\.slice\(firstIndex, currentIndex \+ 1\)/);
  assert.match(source, /pageConceptGroups\?\.\(substep, level\)/);
  assert.match(source, /nonsensePageGroup\?\.\(substep\)/);
  assert.match(source, /label: "N words"/);
  assert.match(source, /label: "N \/all\/ words"/);
  assert.match(source, /"Bonus Letter 1\.4"/);
  assert.match(source, /"V E Syllable - V-r-e"/);
  assert.match(source, /"Closed Syllable - Final E Marker - Final se ve"/);
  assert.match(source, /planner-concept-pages/);

  const filterHandler = functionBody("ttSetReviewWordFilter", "ttTogglePlannerChip");
  assert.match(filterHandler, /ttReviewWordFilters\[pickerId\]/);
  assert.doesNotMatch(filterHandler, /ttPickerSelections|saveState|ttRefreshPreview/);

  const applySelections = functionBody("ttApplyPlannerSelectionsToLesson", "ttKnownWeldedValues");
  assert.doesNotMatch(applySelections, /ttReviewWordFilters/);
  ["ang", "ing", "ong", "ung", "ank", "ink", "onk", "unk"].forEach((sound) => {
    assert.match(appSource, new RegExp(`\\[\"2\\.1\", \"${sound}\"\\]`));
  });
});
