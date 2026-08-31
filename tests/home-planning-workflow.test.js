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

test("Home copies the lesson data actions without duplicating their records", () => {
  ["ttHomeSavedToggle", "ttHomeDataToggle", "ttHomeProfile"].forEach((id) => {
    assert.match(html, new RegExp(`id="${id}"`));
  });
  ["ttSavedPanel", "ttDataPanel"].forEach((id) => {
    assert.equal((html.match(new RegExp(`id="${id}"`, "g")) || []).length, 1, `${id} remains a single shared panel`);
  });
  assert.match(html, /id="ttHomeDataPanels" class="shared-data-panels home-data-panels"/);
  assert.match(source, /function ttMountSharedDataPanels\(hostId\)/);
  assert.match(source, /\["ttSavedToggle", "ttHomeSavedToggle"\]/);
  assert.match(source, /\["ttDataToggle", "ttHomeDataToggle"\]/);
  assert.match(source, /\["ttProfile", "ttHomeProfile"\]/);
  assert.match(source, /ttMountSharedDataPanels\("ttHomeDataPanels"\)/);
  assert.match(source, /ttMountSharedDataPanels\("ttLessonDataPanels"\)/);
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
  assert.match(substepButtons, /\["section2", "section2B", "section3"\]\.includes\(sectionKey\)/);
  assert.match(substepButtons, /const endIndex = sectionKey === "section3" && currentIndex > 0 \? currentIndex : currentIndex \+ 1/);
  assert.match(substepButtons, /scopeMap\.slice\(firstIndex, endIndex\)/);
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
  assert.doesNotMatch(filterHandler, /ttPickerSelections|saveState/);

  const applySelections = functionBody("ttApplyPlannerSelectionsToLesson", "ttKnownWeldedValues");
  assert.doesNotMatch(applySelections, /ttReviewWordFilters/);
  ["ang", "ing", "ong", "ung", "ank", "ink", "onk", "unk"].forEach((sound) => {
    assert.match(appSource, new RegExp(`\\[\"2\\.1\", \"${sound}\"\\]`));
  });
});

test("Section 3 planning selects one prior concept and one current concept", () => {
  const defaults = functionBody("ttDefaultSectionReviewSubsteps", "ttRenderPlannerPanel");
  assert.match(defaults, /section3: \[ttRandomSection3ReviewSubstep\(skill, level\)\]/);
  assert.match(defaults, /section3Current: \[skill\.id\]/);

  const planner = functionBody("ttPlannerSectionsHtml", "ttPlannerScheduleBarHtml");
  assert.match(planner, /"section3Review", "Review cards · one concept"/);
  assert.match(planner, /"section3Current", "Current cards · one concept"/);
  assert.match(planner, /autoConcept: true/);
  assert.match(planner, /conceptOnly: true/);
  assert.match(planner, /selectionDriven: true/);

  const applySelections = functionBody("ttApplyPlannerSelectionsToLesson", "ttKnownWeldedValues");
  assert.match(applySelections, /sectionThreeReviewSubstep/);
  assert.match(applySelections, /sectionThreeReviewConcept/);
  assert.match(applySelections, /sectionThreeCurrentSubstep/);
  assert.match(applySelections, /sectionThreeCurrentConcept/);
  assert.match(applySelections, /planningSelections = \{/);
});

test("Fat Stack is derived by group and school year with teacher-selectable miss thresholds", () => {
  assert.match(html, /data-mode="fat"[^>]*>Fat Stack</);
  assert.match(html, /data-fat-threshold="all"/);
  assert.match(html, /data-fat-threshold="1"/);
  assert.match(html, /data-fat-threshold="2"/);
  assert.match(html, /data-fat-threshold="3"/);

  const entries = functionBody("ttFatStackEntries", "ttFatStackForThreshold");
  assert.match(entries, /ttGroupChartRecords\(group\)/);
  assert.match(entries, /ttSchoolYearForChartRecord\(record\) === schoolYearId/);
  assert.match(entries, /ttMissWordsFromChartRecord\(record\)/);
  assert.match(entries, /prior\.count \+= 1/);
  assert.match(entries, /b\.count - a\.count/);

  const thresholds = functionBody("ttFatStackForThreshold", "ttFatStackCard");
  assert.match(thresholds, /entry\.count === 1/);
  assert.match(thresholds, /entry\.count === 2/);
  assert.match(thresholds, /entry\.count >= 3/);
  assert.doesNotMatch(source, /group\.fatStack\s*=/);
  const misses = functionBody("ttMissWordsFromChartRecord", "ttSection2RelevantMisses");
  assert.match(misses, /item\.section === record\.chartHalf/);
});

test("the default Lesson Deck follows the requested teaching order", () => {
  assert.match(html, /class="card-mode active" data-mode="lesson"/);
  const deck = functionBody("ttSection3LessonDeck", "wordPartCardsForMode");
  const ordered = [
    "const fat =",
    "const review =",
    "const current =",
    "const hfw =",
    "const wordParts =",
    "const deck = [...fat, ...review, ...current, ...hfw, ...wordParts]"
  ];
  let cursor = -1;
  ordered.forEach((needle) => {
    const next = deck.indexOf(needle);
    assert.ok(next > cursor, `${needle} appears in order`);
    cursor = next;
  });
  assert.match(deck, /ttWeightedFatStackSample\(ttFatStackEntries\(ttActiveGroup\(\)\), 10/);
  assert.match(deck, /section3ReviewCards\(lesson\)\.slice\(0, 3\)/);
  assert.match(deck, /section3CurrentCards\(lesson\)\.slice\(0, 3\)/);
  ["welded", "latin", "prefixes", "suffixes"].forEach((mode) => {
    assert.match(deck, new RegExp(`ttSection3IntroducedCards\\(lesson\\.substep, "${mode}", 2\\)`));
  });

  const refresh = functionBody("ttRefreshSection", "ttChooseReaderPage");
  assert.match(refresh, /sectionThreeDeckSeed/);
  assert.doesNotMatch(refresh, /delete ttLesson\.sectionThreeReviewWords/);
  assert.doesNotMatch(refresh, /delete ttLesson\.sectionThreeCurrentWords/);
});

test("Section 3 HFW separates current-step and chosen prior-step cards", () => {
  assert.match(html, /id="ttSection3HfwStep"/);
  assert.match(html, /id="ttSection3HfwReviewStep"/);
  const choices = functionBody("ttFillSection3HfwReviewChoices", "ttFatStackEntries");
  assert.match(choices, /scopeMap\.slice\(0, currentIndex\)/);
  assert.match(choices, /priorSubstep\(currentSubstep\)/);
  const deck = functionBody("section3DeckForMode", "ttFillSection3HfwReviewChoices");
  assert.match(deck, /ttSection3HfwStep/);
  assert.match(deck, /ttSection3HfwReviewStep/);
  assert.match(deck, /hfwWordsForSubstep\(currentSubstep, lesson\)/);
  assert.match(deck, /hfwWordsForSubstep\(reviewSubstep, lesson\)/);
});
